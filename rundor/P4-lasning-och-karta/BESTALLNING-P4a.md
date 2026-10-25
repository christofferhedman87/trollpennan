# Runda P4a: Uppläsning på tryck och separata ljudreglage (utan ny TTS)

Use these skills: typescript-best-practices, principle-prove-it-works, principle-test-behavior-not-implementation, principle-minimal-diffs, child-literacy-design, 3d-web-game-check

---

## 1. Målet i spelarord

Ett barn (7–10 år) som håller på att lära sig läsa ska alltid kunna få texten i boken och uppdraget uppläst **när barnet självt vill**, även om den första automatiska uppläsningen tystades av en banner eller om barnet vill höra meningen en gång till:

1. **Tryck-för-uppläsning (`🔊 Lyssna`):**
   - I **Gåtboken** (`Ledtradsyta.tsx`) finns en tydlig knapp `🔊 Lyssna` (`data-p4="lyssna-gata"`, minst 44×44 px) som direkt läser upp den aktuella gåtan via `lasUpp(rad.gata)` i `src/spel/rostKo.ts`.
   - I **Uppdragsremsan** (`UppdragsRemsa.tsx`) finns en knapp `🔊` (`data-p4="lyssna-uppdrag"`, minst 44×44 px) som läser upp det aktiva uppdragets text (`aktiv.text`) på nytt.
   - I **Skrivhjälpen** (`BokSvar.tsx`) finns en knapp `🔊` på önskans hjälpruta (`data-p4="lyssna-onska"`) och på `"Menade du …?"`-förslagen (`data-p4="lyssna-forslag"`) som läser upp önskan respektive förslagsordet (`lasUpp(f.visa)`).
   - Alla dessa använder spelets **redan förgenererade röstfiler** i `public/ljud/rost/` via `rostKo.ts` (och webbläsarens svenska röst som reserv om ett dynamiskt ord saknar ljudfil). **Noll ElevenLabs-anrop görs.**
2. **Separata ljudreglage för Röst och Ljudeffekter i För vuxna (`ForalderDialog.tsx`):**
   - Vuxna kan slå på/av **Röst (uppläsning)** (`rostPa`) och **Ljudeffekter** (`effektPa`) var för sig i För vuxna (`data-p4="rost-knapp"` och `data-p4="effekt-knapp"`), samtidigt som huvudknappen `data-testid="ljud-knapp"` finns kvar och slår på/av allt ljud tillsammans.

---

## 2. Körinställning och arbetsordning

- **Modell och budget:** `grok-4.7` (`--reasoning-effort high`), **60 turer** (tak **75**).
- **Planera kort först (högst 6 modellanrop):** Läs `src/spel/minne.ts`, `src/spel/ljud.ts`, `src/spel/rost.ts`, `src/spel/rostKo.ts`, `data/rost-takt.json`, `src/spel/ui/Ledtradsyta.tsx`, `src/spel/ui/UppdragsRemsa.tsx`, `src/spel/ui/BokSvar.tsx` och `src/spel/ui/ForalderDialog.tsx`. Skriv en kort `PLAN-P4a.md` (max 25 rader) och gör första kodändringen inom **10 modellanrop**. Ta bort `PLAN-P4a.md` före sista commiten.
- **Skriv `RUNDA-P4a.md` före tur 48.**

---

## 3. Prov- och TTS-fällor som du MÅSTE undvika

1. **Ändra ALDRIG befintliga provfiler** (`*.test.ts`, `*.test.mjs`, `scripts/check-spel-struktur.mjs`, `rundor/R1-dela-spel/testid-baslinje.json`).
2. **Lägg ALDRIG till eller ta bort `data-testid="..."` i JSX i `.tsx`-filer under `src/spel/`!**
   - `scripts/check-spel-struktur.mjs` kräver att varje `data-testid` i `src/spel/**/*.tsx` matchar `rundor/R1-dela-spel/testid-baslinje.json` exakt.
   - Använd **alltid** `data-p4="..."` (t.ex. `data-p4="lyssna-gata"`, `data-p4="lyssna-uppdrag"`, `data-p4="lyssna-onska"`, `data-p4="lyssna-forslag"`, `data-p4="rost-knapp"`, `data-p4="effekt-knapp"`) på nya knappar!
   - Behåll `data-testid="ljud-knapp"` i `src/spel/ui/ForalderDialog.tsx` orörd!
3. **Noll ElevenLabs-anrop och ingen ändring i `data/rost.json` → `kallor.lista`:**
   - Lägg alla nya UI-etiketter i den nya filen `data/lasning.json`. Lägg **inte** till `data/lasning.json` i `data/rost.json` under `kallor.lista` (eftersom `src/spel/rost2.test.ts` kräver förgenererade `.mp3`-filer för alla fält som matchas av `kallor.lista`).
   - Importera aldrig `data/rost.json` eller `data/rost-manifest.json` i `src/spel/rost.ts` eller `src/spel/rostManifest.ts` (`rost2.test.ts` rad 120 kontrollerar detta).
   - Om någon ny post i `data/rost-manifest.json` någonsin skulle behövas ska den peka på `/ljud/rost/db967993a3539e8c.mp3`.

---

## 4. Ritning: filer, data och funktioner

### Steg 1: Skapa `data/lasning.json` och uppdatera `data/rost-takt.json`

1. I `data/rost-takt.json` (skapad i R1), lägg till `"las_upp": "svar"` under `"kallor"`:
   ```json
   "las_upp": "svar"
   ```
2. Skapa `data/lasning.json` (denna fil används av både `P4a` och `P4b`):
   ```json
   {
     "version": 1,
     "lyssna": {
       "knapp": "Lyssna",
       "gata": "Lyssna på gåtan",
       "uppdrag": "Lyssna på uppdraget",
       "onska": "Lyssna på önskan",
       "forslag": "Lyssna på ordet"
     },
     "ljud": {
       "rost_pa": "Röst (uppläsning): på",
       "rost_av": "Röst (uppläsning): av",
       "effekt_pa": "Ljudeffekter: på",
       "effekt_av": "Ljudeffekter: av"
     },
     "lasniva": {
       "rubrik": "Läsnivå för gåtor",
       "val": {
         "auto": "Automatisk (följer barnet)",
         "1": "Nivå 1 – Korta ljudenliga ord",
         "2": "Nivå 2 – Vanliga djurord",
         "3": "Nivå 3 – Längre ord"
       },
       "auto_trappsteg": {
         "niva2_min_funna": 3,
         "niva3_min_funna": 8
       },
       "niva1_max_langd": 4,
       "niva3_min_langd": 7,
       "svara_ljud": ["sj", "skj", "stj", "tj", "kj", "ng", "ck", "hj", "lj", "dj", "sch", "ch", "ph", "th", "x", "z"],
       "undantag": {
         "älg": 1,
         "hare": 1,
         "koi": 1,
         "karp": 1,
         "svan": 1,
         "yeti": 1,
         "kapybara": 3
       }
     },
     "ledtrad": {
       "knapp_1": "Ledtråd 1 av 2",
       "knapp_2": "Ledtråd 2 av 2",
       "klar": "Alla ledtrådar visas",
       "stavelser_mall": "Ordet har {antal} delar: {delar}.",
       "ljud_mall": "Lyssna på början: {ljud}."
     },
     "stavning": {
       "dubbel_mall": "Rätt ljud! Ordet stavas med två {bokstav}: {mal}.",
       "saknas_mall": "Nästan! Det fattas en bokstav i {mal}.",
       "omkastad_mall": "Nästan rätt! Två bokstäver har bytt plats i {mal}.",
       "allman_mall": "Du är nära {mal}! Kika på bokstäverna."
     }
   }
   ```

### Steg 2: Separata ljudreglage (`rostPa`, `effektPa`) i `src/spel/minne.ts`, `src/spel/ljud.ts`, `src/spel/rost.ts` och `src/spel/rostKo.ts`

1. **`src/spel/minne.ts`:**
   - Utöka `Data` med:
     ```ts
     rostPa: boolean;
     effektPa: boolean;
     ```
   - I `tom()`: sätt `rostPa: true, effektPa: true`.
   - I `franSparning(raw)`:
     - Om `raw` är ett objekt:
       ```ts
       const ljudPa = typeof o.ljudPa === "boolean" ? o.ljudPa : true;
       const rostPa = typeof o.rostPa === "boolean" ? o.rostPa : ljudPa;
       const effektPa = typeof o.effektPa === "boolean" ? o.effektPa : ljudPa;
       ```
   - Utöka `Minne` med:
     ```ts
     sattRost: (pa: boolean) => void;
     sattEffekt: (pa: boolean) => void;
     ```
   - Behåll `sattLjud: (pa) => set(spara({ ...get(), ljudPa: pa, rostPa: pa, effektPa: pa }))` så att befintliga prov för `ljudPa` / `sattLjud` fungerar exakt som förut!
   - Implementera:
     - `sattRost: (pa) => set(spara({ ...get(), rostPa: pa, ljudPa: pa || get().effektPa }))`
     - `sattEffekt: (pa) => set(spara({ ...get(), effektPa: pa, ljudPa: pa || get().rostPa }))`
2. **`src/spel/ljud.ts`:**
   - I prenumerationen på `useMinne`: uppdatera `pa = s.ljudPa && s.effektPa !== false;` (och initiera `let pa = useMinne.getState().ljudPa && useMinne.getState().effektPa !== false;`).
3. **`src/spel/rost.ts` och `src/spel/rostKo.ts`:**
   - Röstuppspelning är på när `s.ljudPa && s.rostPa !== false`. Om `rostPa === false` eller `ljudPa === false` ska `stoppaRost()` anropas och ingen röst spelas upp.
   - I `src/spel/rostKo.ts`: lägg till och exportera hjälpfunktionen:
     ```ts
     export function lasUpp(text: string): void {
       const ren = text.trim();
       if (!ren) return;
       handling();
       anmal({ text: ren, kalla: "las_upp" });
     }
     ```
   - Se till att `anmal` i `src/spel/rostKo.ts` vid `kalla === "las_upp"` **inte** blockeras av `dubblett_ms` när barnet trycker på `🔊 Lyssna` för att höra samma gåta eller uppdrag en gång till (dvs. dubblettfiltret ignoreras för `kalla === "las_upp"` så länge inte exakt samma ljud redan spelas just nu).

### Steg 3: Knappar för `🔊 Lyssna` och separata ljudreglage i UI (`Ledtradsyta.tsx`, `UppdragsRemsa.tsx`, `BokSvar.tsx`, `ForalderDialog.tsx`, `bok-p1.css`)

1. **`src/spel/ui/Ledtradsyta.tsx`:**
   - Importera `lasUpp` från `../rostKo.ts` och `lasningJson` från `"../../../data/lasning.json" with { type: "json" }`.
   - Lägg till en knapp `🔊 Lyssna` i `.gatsida-kort` (utan `data-testid`, med `data-p4="lyssna-gata"`):
     ```tsx
     <button
       type="button"
       className="lyssna-knapp"
       data-p4="lyssna-gata"
       aria-label={lasningJson.lyssna.gata}
       onClick={() => lasUpp(rad.gata)}
     >
       🔊 {lasningJson.lyssna.knapp}
     </button>
     ```
2. **`src/spel/ui/UppdragsRemsa.tsx`:**
   - Importera `lasUpp` från `../rostKo.ts` och `lasningJson` från `"../../../data/lasning.json" with { type: "json" }`.
   - Lägg i `.uppdrag-remsa-knappar` till en knapp `🔊` före `"Ge uppdraget en gåva"` (utan `data-testid`, med `data-p4="lyssna-uppdrag"`):
     ```tsx
     <button
       type="button"
       className="uppdrag-remsa-lyssna"
       data-p4="lyssna-uppdrag"
       aria-label={lasningJson.lyssna.uppdrag}
       onClick={() => lasUpp(aktiv.text)}
     >
       🔊
     </button>
     ```
3. **`src/spel/ui/BokSvar.tsx`:**
   - Importera `lasUpp` från `../rostKo.ts` och `lasningJson` från `"../../../data/lasning.json" with { type: "json" }`.
   - I `visaOnskaHjalp`-rutan (`[data-testid="onska-hjalp"]`): lägg till en knapp `data-p4="lyssna-onska"` (`🔊 {lasningJson.lyssna.knapp}`) som anropar `lasUpp(onska.text)`!
   - I `forslag`-rutan (`[data-testid="menade-du"]`): lägg vid varje förslagsrad (eller bredvid förslagsknappen) till en knapp `data-p4="lyssna-forslag"` (`🔊`, `aria-label={lasningJson.lyssna.forslag}`) som anropar `lasUpp(f.visa)` så att barnet kan höra hur det föreslagna ordet låter innan det väljer!
4. **`src/spel/ui/ForalderDialog.tsx`:**
   - Läs `rostPa`, `effektPa`, `sattRost` och `sattEffekt` från `useMinne` (eller via props med fallback till `useMinne`).
   - Behåll knappen `data-testid="ljud-knapp"` exakt som den är!
   - Lägg direkt under `data-testid="ljud-knapp"` till två knappar (utan `data-testid`!):
     - `data-p4="rost-knapp"` som växlar `sattRost(!rostPa)` och visar `lasningJson.ljud.rost_pa` / `lasningJson.ljud.rost_av`.
     - `data-p4="effekt-knapp"` som växlar `sattEffekt(!effektPa)` och visar `lasningJson.ljud.effekt_pa` / `lasningJson.ljud.effekt_av`.
5. **`src/spel/ui/bok-p1.css`:**
   - Styla `.lyssna-knapp` och `.uppdrag-remsa-lyssna` så att tryckytan är minst `44px` hög (`min-height: 44px; min-width: 44px;`) enligt `3d-web-game-check`.

---

## 5. Prov och verifiering (Steg 4)

1. Skapa `src/spel/p4a.test.ts` och lägg till den i `test:product` i `package.json`:
   - Testa att `rostPa` och `effektPa` i `useMinne` kan styras oberoende av varandra via `sattRost` och `sattEffekt`, att `sattLjud(false)` stänger av båda och `sattLjud(true)` slår på båda, samt att `franSparning` är bakåtkompatibel med äldre sparningar som bara har `ljudPa`.
   - Testa att `lasUpp` i `src/spel/rostKo.ts` kan anropas två gånger i rad med samma gåttext utan att tystas av `dubblett_ms` eller `engang`, och att `data/rost-takt.json` har `kallor.las_upp === "svar"`.
   - Testa att `Ledtradsyta.tsx`, `UppdragsRemsa.tsx`, `BokSvar.tsx` och `ForalderDialog.tsx` innehåller `data-p4="lyssna-gata"`, `data-p4="lyssna-uppdrag"`, `data-p4="lyssna-onska"`, `data-p4="lyssna-forslag"`, `data-p4="rost-knapp"` och `data-p4="effekt-knapp"`.
2. Kör alla kontroller:
   ```bash
   PATH="/home/box/.local/node22/bin:$PATH" node --experimental-strip-types rundor/P4-lasning-och-karta/matt/prov-p4.mjs --snabb --del 1
   PATH="/home/box/.local/node22/bin:$PATH" npm run test:product
   PATH="/home/box/.local/node22/bin:$PATH" npm run check:struktur
   PATH="/home/box/.local/node22/bin:$PATH" npm run typecheck:pages
   PATH="/home/box/.local/node22/bin:$PATH" npm run lint
   ```
3. Bygg och kör skärmprovet på `375×812`:
   ```bash
   PATH="/home/box/.local/node22/bin:$PATH" npm run build:pages
   PATH="/home/box/.local/node22/bin:$PATH" npm run preview:pages -- --port 4173 &
   PATH="/home/box/.local/node22/bin:$PATH" node --experimental-strip-types rundor/P4-lasning-och-karta/matt/prov-p4.mjs --del 1
   ```
4. Skriv `RUNDA-P4a.md` före **tur 48** med resultat per krav och bekräfta att 0 befintliga provfiler har ändrats och 0 ElevenLabs-anrop har gjorts.
