# Runda P4b: Läsnivåer (1–3 + Auto), ledtrådstrappa i 3 steg och specifik stavningsåterkoppling

Use these skills: typescript-best-practices, principle-prove-it-works, principle-test-behavior-not-implementation, principle-minimal-diffs, child-literacy-design, 3d-web-game-check

---

## 1. Målet i spelarord

Spelets läs- och skrivstöd anpassar sig efter barnets utveckling enligt svensk läsinlärning (`child-literacy-design`):

1. **Tre läsnivåer för gåtorna (Automatisk eller valbar i För vuxna):**
   - **Nivå 1 – Korta ljudenliga ord (2–4 bokstäver):** enkla ord utan svåra ljudblock eller dubbelteckning (`ko`, `bi`, `apa`, `räv`, `orm`, `anka`, `gris`, `valp`, `haj`, `hare`, `älg`, `koi`, `svan`, `yeti`).
   - **Nivå 2 – Vanliga djurord (5–6 bokstäver eller kortare ord med dubbelteckning / `sj`/`tj`/`hj`/`ng`/`ck`):** t.ex. `padda`, `uggla`, `bäver`, `lejon`, `zebra`, `panda`, `delfin`, `tiger`, `ekorre`, `lamm`, `hjort`, `tjur`.
   - **Nivå 3 – Längre ord och sammansättningar (7+ bokstäver):** t.ex. `kattunge`, `enhörning`, `elefant`, `pingvin`, `flodhäst`, `dinosaurie`, `papegoja`, `isbjörn`, `clownfisk`.
   - I läget **Automatisk** börjar barnet på **Nivå 1** (`0–2` funna hemliga djur), går upp till **Nivå 2** vid `>= 3` funna djur och öppnar **Nivå 3** vid `>= 8` funna djur. I **För vuxna** (`ForalderDialog.tsx`) kan en vuxen när som helst välja `Automatisk`, `Nivå 1`, `Nivå 2` eller `Nivå 3`.
2. **Ledtrådstrappa i 3 steg i Gåtboken (`Ledtradsyta.tsx`):**
   - **Steg 0 (start):** Visar gåtan och första bokstaven med streck (`K _ _ _ _ _ _ _`, `8 bokstäver`).
   - **Steg 1 (första trycket på `Ledtråd`):** Visar de 2 första bokstäverna (`K A _ _ _ _ _ _`) samt en enklare ledtråd (`gata_latt` ur `data/ledtradar.json` om den finns, annars stavelseuppdelning: `"Ordet har 3 delar: katt – ung – e."`).
   - **Steg 2 (andra trycket på `Ledtråd`):** Visar upp till halva ordet (`K A T T _ _ _ _`) samt ljudstöd för början (`"Lyssna på början: K – A – T – T."`). Hela ordet avslöjas **aldrig** gratis – minst sista bokstaven är alltid `_` så att barnet får avkoda slutet självt.
3. **Specifik stavningsåterkoppling bokstav för bokstav (`BokSvar.tsx`):**
   - När barnet skriver nästan rätt (t.ex. `"kat"` för `"katt"`, `"pada"` för `"padda"`, `"kani"` för `"kanin"` eller `"kanni"` för `"kanin"`), visar `"Menade du …?"`-rutan en vänlig, specifik förklaring (`data-p4="stavning-tips"`) där de bokstäver barnet redan skrivit rätt markeras i grönt (`rattPrefix`) tillsammans med ett konkret tips om dubbelteckning, saknad bokstav eller omkastade bokstäver.

---

## 2. Körinställning och arbetsordning

- **Modell och budget:** `grok-4.7` (`--reasoning-effort high`), **65 turer** (tak **75**).
- **Planera kort först (högst 6 modellanrop):** Läs `data/lasning.json`, `src/spel/gata.ts`, `src/spel/ui/Ledtradsyta.tsx`, `src/spel/ui/BokSvar.tsx`, `src/spel/minne.ts` och `src/spel/ui/ForalderDialog.tsx`. Skriv `PLAN-P4b.md` (max 25 rader) och gör första kodändringen inom **10 modellanrop**. Ta bort `PLAN-P4b.md` före sista commiten.
- **Skriv `RUNDA-P4b.md` före tur 50.**

---

## 3. Prov- och TTS-fällor som du MÅSTE undvika

1. **Rör ALDRIG signatur eller beteende för `aktivGata`, `nastaGata` eller `gatUrval` i `src/spel/gata.ts`!**
   - `src/spel/r9g.test.ts` och `src/spel/b6-1.test.ts` testar dem direkt. Lägg i stället `lasnivaUrval` i `src/spel/lasniva.ts` och anropa den i `src/spel/ui/Ledtradsyta.tsx`.
2. **Rör ALDRIG `data/ledtradar.json`!**
   - `src/spel/r9.test.ts` kontrollerar alla 379 rader i `data/ledtradar.json`. Läs bara det befintliga valfria fältet `gata_latt` ur `data/ledtradar.json`.
3. **Lägg ALDRIG till eller ta bort `data-testid="..."` i `.tsx`-filer under `src/spel/`!**
   - Använd `data-p4="ledtrad-knapp"`, `data-p4="ledtrad-extra"`, `data-p4="ledtrad-ljud"`, `data-p4="lasniva-badge"`, `data-p4="lasniva-knapp"` och `data-p4="stavning-tips"`.
4. **Noll ElevenLabs-anrop:** Alla texter och mallar hämtas ur `data/lasning.json`.

---

## 4. Ritning: filer, data och funktioner

### Steg 1: Skapa den rena modulen `src/spel/lasniva.ts`

Skapa `src/spel/lasniva.ts` (ren TypeScript-logik utan React/DOM/Three, direkt importerbar i Node-tester):

```ts
import lasningJson from "../../data/lasning.json" with { type: "json" };
import ledtradarJson from "../../data/ledtradar.json" with { type: "json" };
import { fyll } from "./fyll.ts";
import { gatUrval } from "./gata.ts";

export type Lasniva = 1 | 2 | 3;
export type LasnivaVal = "auto" | Lasniva;

type LedRad = { gata: string; gata_latt?: string; forsta: string; langd: number };
const LED = (ledtradarJson as { ledtradar: Record<string, LedRad> }).ledtradar;

const SVARA_RE = new RegExp(`(${lasningJson.lasniva.svara_ljud.join("|")})`, "i");
const DUBBEL_RE = /([bcdfghjklmnpqrstvwxz])\1/i;
const VOKAL_RE = /[aeiouyåäö]/i;
```

Exponera exakt dessa funktioner från `src/spel/lasniva.ts`:

1. **`ordLasniva(ord: string): Lasniva`:**
   - Normalisera `const k = ord.trim().toLowerCase();`
   - Om `k` finns i `lasningJson.lasniva.undantag`: returnera det värdet (`1 | 2 | 3`).
   - Om `k.length >= lasningJson.lasniva.niva3_min_langd` (`7`): returnera `3`.
   - Om `k.length <= lasningJson.lasniva.niva1_max_langd` (`4`) och `!SVARA_RE.test(k)` och `!DUBBEL_RE.test(k)`: returnera `1`.
   - Annars: returnera `2`.
2. **`aktuellLasniva(funna: string[], val: LasnivaVal = "auto"): Lasniva`:**
   - Om `val === 1 || val === 2 || val === 3`: returnera `val`.
   - Om `funna.length >= lasningJson.lasniva.auto_trappsteg.niva3_min_funna` (`8`): returnera `3`.
   - Om `funna.length >= lasningJson.lasniva.auto_trappsteg.niva2_min_funna` (`3`): returnera `2`.
   - Annars: returnera `1`.
3. **`lasnivaUrval(kvar: string[], niva: Lasniva, platsHemliga?: string[]): string[]`:**
   - `const bas = gatUrval(kvar, platsHemliga);`
   - `const filtrerad = bas.filter((id) => ordLasniva(id) <= niva);`
   - Returnera `filtrerad.length > 0 ? filtrerad : bas;` (och om man valt en specifik nivå `1 | 2 | 3`, prioritera ord med `ordLasniva(id) === niva` först, sedan `<= niva`, sedan `bas`).
4. **`delaStavelser(ord: string): string[]`:**
   - Dela upp ett svenskt ord i läsbara stavelser kring vokaler (så att varje del har minst en vokal om ordet har vokaler), t.ex. `"kapybara"` → `["ka", "py", "ba", "ra"]`, `"kattunge"` → `["katt", "ung", "e"]` (eller `["kat", "tung", "e"]`).
5. **`ledtradsSteg(ordId: string, steg: 0 | 1 | 2): { streck: string; synliga: number; extraText: string | null; ljudText: string | null } | null`:**
   - Slå upp `const rad = LED[ordId];` (eller skapa fallback från `ordId` om `ordId` inte står i `LED`). Om `!ordId`, returnera `null`.
   - Beräkna antal synliga bokstäver `synliga`:
     - `steg === 0`: `1`
     - `steg === 1`: `Math.min(Math.max(1, ordId.length - 1), 2)`
     - `steg === 2`: `Math.min(Math.max(1, ordId.length - 1), Math.max(2, Math.ceil(ordId.length / 2)))`
     - **Viktigt:** `synliga` får **aldrig** vara `>= ordId.length` (för ord med längd ≥ 2 måste minst ett `_` finnas kvar i `streck`!).
   - Bygg `streck`: de första `synliga` bokstäverna ur `ordId.toUpperCase()` följt av `ordId.length - synliga` stycken `"_"`, separerade med mellanslag (t.ex. `"K A _ _ _ _ _ _"`).
   - `extraText`:
     - `steg === 0`: `null`
     - `steg >= 1`: om `rad?.gata_latt` finns, returnera `rad.gata_latt`; annars `const delar = delaStavelser(ordId);` och returnera `fyll(lasningJson.ledtrad.stavelser_mall, { antal: delar.length, delar: delar.join(" – ") })`.
   - `ljudText`:
     - `steg < 2`: `null`
     - `steg === 2`: `fyll(lasningJson.ledtrad.ljud_mall, { ljud: ordId.slice(0, synliga).toUpperCase().split("").join(" – ") })`.
6. **`stavningsFeedback(skrivet: string, malOrd: string): { nara: boolean; typ: "dubbel" | "saknas" | "omkastad" | "allman"; rattPrefix: string; tips: string } | null`:**
   - Normalisera `const s = skrivet.trim().toLowerCase(); const m = malOrd.trim().toLowerCase();`
   - Om `!s || !m || s === m`: returnera `null`.
   - Beräkna `rattPrefix`: längsta gemensamma prefix mellan `s` och `m`.
   - Fall A (`"dubbel"`): om `m` har en dubbelkonsonant `([bcdfghjklmnpqrstvwxz])\1` och `m.replace(/([bcdfghjklmnpqrstvwxz])\1/g, "$1") === s` (t.ex. `"kat"` mot `"katt"`, `"pada"` mot `"padda"`):
     - Hitta dubbelkonsonanten `b` och returnera `{ nara: true, typ: "dubbel", rattPrefix, tips: fyll(lasningJson.stavning.dubbel_mall, { bokstav: b.toUpperCase(), mal: m }) }`.
   - Fall B (`"saknas"`): om `m.length === s.length + 1` och man kan ta bort exakt 1 tecken ur `m` för att få `s` (t.ex. `"kani"` mot `"kanin"`):
     - Returnera `{ nara: true, typ: "saknas", rattPrefix, tips: fyll(lasningJson.stavning.saknas_mall, { mal: m }) }`.
   - Fall C (`"omkastad"`): om `m.length === s.length` och ett byte av två intilliggande tecken i `s` ger `m` (t.ex. `"kanni"` mot `"kanin"`):
     - Returnera `{ nara: true, typ: "omkastad", rattPrefix, tips: fyll(lasningJson.stavning.omkastad_mall, { mal: m }) }`.
   - Fall D (`"allman"`): om Levenshtein-avståndet mellan `s` och `m` är `<= 2` och `rattPrefix.length >= 1`:
     - Returnera `{ nara: true, typ: "allman", rattPrefix, tips: fyll(lasningJson.stavning.allman_mall, { mal: m }) }`.
   - Annars returnera `null`.

### Steg 2: Spara `lasnivaVal` i `src/spel/minne.ts` och lägg till väljare i `src/spel/ui/ForalderDialog.tsx`

1. **`src/spel/minne.ts`:**
   - Lägg till `lasnivaVal: "auto" | 1 | 2 | 3` i `Data` (default `"auto"` i `tom()` och `franSparning`).
   - Lägg till `sattLasniva: (val: "auto" | 1 | 2 | 3) => void` i `Minne`.
2. **`src/spel/ui/ForalderDialog.tsx`:**
   - Visa aktuell läsnivå och en enkel cyklisk knapp eller 4 små valknappar (`data-p4="lasniva-knapp"`, **utan** `data-testid`) som låter en vuxen växla `lasnivaVal` mellan `"auto"`, `1`, `2` och `3`.

### Steg 3: Koppla läsnivå och ledtrådstrappa i `src/spel/ui/Ledtradsyta.tsx`

1. I `src/spel/ui/Ledtradsyta.tsx`:
   - Läs `lasnivaVal` ur `useMinne((s) => s.lasnivaVal)`.
   - Beräkna `const niva = aktuellLasniva(funna, lasnivaVal);`
   - Byt `gatUrval(allaKvar, platsHemliga)` mot `lasnivaUrval(allaKvar, niva, platsHemliga)`.
   - Lägg till ett lokalt state `const [steg, setSteg] = useState<0 | 1 | 2>(0);` som nollställs (`setSteg(0)`) när den aktiva gåtan `id` byts.
   - Använd `const info = id ? ledtradsSteg(id, steg) : null;`
   - Visa:
     - Nivåmärket (`data-p4="lasniva-badge"`): `"Nivå " + niva`.
     - Streckraden (`data-testid="gatsida-streck"`): `{info ? info.streck : streck(rad.forsta, rad.langd)}`.
     - Om `info?.extraText` finns: visa `<p className="gatsida-extra" data-p4="ledtrad-extra">{info.extraText}</p>`.
     - Om `info?.ljudText` finns: visa `<p className="gatsida-ljud" data-p4="ledtrad-ljud">{info.ljudText}</p>`.
     - En knapp `data-p4="ledtrad-knapp"` (`disabled={steg >= 2}`) som vid klick höjer `steg` (`0 → 1 → 2`) och läser upp den nya ledtråden med `lasUpp(nastaInfo.ljudText ?? nastaInfo.extraText ?? rad.gata)`!

### Steg 4: Koppla specifik stavningsåterkoppling i `src/spel/ui/BokSvar.tsx`

1. I `src/spel/ui/BokSvar.tsx`:
   - När `forslag` visas (`[data-testid="menade-du"]`) och `forslag.forslag.length > 0`:
     - Beräkna `const fb = stavningsFeedback(forslag.token, forslag.forslag[0]!.visa);`
     - Om `fb` finns, visa ovanför förslagsknapparna:
       ```tsx
       <p className="menade-du-stavning" data-p4="stavning-tips">
         {fb.rattPrefix ? (
           <span className="stavning-ratt">{fb.rattPrefix.toUpperCase()}</span>
         ) : null}{" "}
         {fb.tips}
       </p>
       ```
   - Styla `.stavning-ratt` i `src/spel/ui/bok-p1.css` med tydlig grön markering (`color: #15803d; font-weight: 800;`).

---

## 5. Prov och verifiering (Steg 5)

1. Skapa `src/spel/p4b.test.ts` och lägg till den i `test:product` i `package.json`:
   - Testa `ordLasniva` mot alla exempel i `rundor/P4-lasning-och-karta/facit-p4.json`.
   - Testa `aktuellLasniva` för `0, 2, 3, 7, 8` funna djur samt manuellt val `1, 2, 3`.
   - Testa `lasnivaUrval` på alla 4 platser (`ang`, `skogen`, `sjon`, `grottan`).
   - Testa `ledtradsSteg` för `"kattunge"`, `"räv"` och `"ko"` i steg `0, 1, 2` och verifiera att hela ordet **aldrig** avslöjas utan minst ett `"_"`.
   - Testa `stavningsFeedback` för `"kat"` → `"katt"`, `"pada"` → `"padda"`, `"kani"` → `"kanin"` och `"kanni"` → `"kanin"`.
2. Kör alla kontroller:
   ```bash
   PATH="/home/box/.local/node22/bin:$PATH" node --experimental-strip-types rundor/P4-lasning-och-karta/matt/prov-p4.mjs --snabb --del 2
   PATH="/home/box/.local/node22/bin:$PATH" npm run test:product
   PATH="/home/box/.local/node22/bin:$PATH" npm run check:struktur
   PATH="/home/box/.local/node22/bin:$PATH" npm run typecheck:pages
   PATH="/home/box/.local/node22/bin:$PATH" npm run lint
   ```
3. Bygg och kör skärmprovet på `375×812`:
   ```bash
   PATH="/home/box/.local/node22/bin:$PATH" npm run build:pages
   PATH="/home/box/.local/node22/bin:$PATH" npm run preview:pages -- --port 4173 &
   PATH="/home/box/.local/node22/bin:$PATH" node --experimental-strip-types rundor/P4-lasning-och-karta/matt/prov-p4.mjs --del 2
   ```
4. Skriv `RUNDA-P4b.md` före **tur 50**.
