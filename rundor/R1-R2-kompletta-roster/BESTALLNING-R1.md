# BESTALLNING-R1 — Runda R1: Röstmotor & Manifestuppslag — Noll Web Speech TTS, 1-MP3-prioritet, Fria Meningar & Flermeningsstöd i `rostManifest.ts` & `rost.ts` (`--max-turns 40`)

Läs dessa specialistunderlag innan du gör din första ändring:
1. `/workspace/kod-inkorg/r1-r3-roster/spaning.md` (Avsnitt 1 och Avsnitt 4 — rotorsaksanalys för `normalisera`, `ettPlan`, `ordSekvens`, `sammanhallenRostText` och avveckling av `speechSynthesis`)
2. `rundor/R1-R2-kompletta-roster/GRIND.md` (översikt över de 1 401 nya förgenererade ElevenLabs-MP3-filerna i `public/ljud/rost/` och `data/rost-manifest.json` / `data/rost-klient.json`)

---

## 1. Intent (Spelarmål i spelarord)
När barnet lyssnar på uppdrag, förslagsbrickor, ordkort, gåvofraser, smeknamnsfraser eller bygger egna meningar i *Pennans bok* ska **allt** läsas upp med riktiga, varma ElevenLabs-inspelningar (`pennan`, `bengtsson`, `syntaxviruset`) — aldrig med webbläsarens robotaktiga inbyggda TTS (`window.speechSynthesis`). Fasta och återkommande meningar som har en komplett inspelning i `data/rost-klient.json` ska alltid spelas som **1 enda sammanhållen MP3-fil** (även när de triggas via `sammanhallenRostText`), flermeningssträngar ska delas på meningsslut om varje mening har en MP3-plan, och helt fria flerordsmeningar i *Pennans bok* (t.ex. `"två små gröna grodor med hatt"`) ska pusslas ihop sömlöst av förinspelade ElevenLabs-ord via `vardeDelar`.

---

## 2. Skills line
Use these skills: building-games, controls. Install them first if missing.

---

## 3. Blueprint (i strikt prioritetsordning)

1. **`src/spel/rostManifest.ts` (idag 207 rader — håll `<= 400` rader):**
   - **Emoji- & dubbelpunktstädning i `normalisera(t: string)`:**
     - Uppdatera `normalisera(t)` så att ledande dekor-/UI-emojis och listsymboler skalas bort (men behåll `+` så att `"+3 stjärnor!"` och `"+2 stjärnor!"` bevaras!) och dubbelpunkter (`..`, `!.`, `?.`) slås ihop:
       ```ts
       export function normalisera(t: string): string {
         return t
           .normalize("NFC")
           .replace(/^[\s\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D★☆•▸▶]+/gu, "")
           .replace(/\s+/g, " ")
           .replace(/([.!?])\.+(?=\s|$)/g, "$1")
           .trim();
       }
       ```
   - **Punktsuffix-fallback i `rostForNormaliserad(text: string)` och `ettPlan(text: string)`:**
     - Fristående fraser som `"en kanin med mössa."` och `bengtsson.borjan`-fraser som `"en kanin med."` är lagrade med avslutande punkt i `K.rader` så att de inte krockar med mall-uppdelningen i `vardeDelar` (`rost2.test.ts:101`).
     - Uppdatera `rostForNormaliserad(text: string)` så att den (efter `rad(nyckel(n))` och `sankMeningsStart(n)`) även provar:
       ```ts
       if (!/[.!?]$/.test(n)) {
         const medPunkt = rad(nyckel(`${n}.`)) ?? (lag !== n ? rad(nyckel(`${lag}.`)) : null);
         if (medPunkt) return medPunkt;
       }
       ```
     - Uppdatera toppen av `ettPlan(text: string)` så att den använder `const hel = rostForNormaliserad(text); if (hel) return { delar: [hel], ms: hel.ms, dynamisk: false };` **före** `for (const mall of mallar())`. Då spelas alla kompletta meningar i `K.rader` som **1 enda sammanhållen MP3-fil**, medan `vardeDelar` inuti mallar fortfarande använder `rad(nyckel(...))` så att `rost2.test.ts:101` (`"en kanin med mössa följer med dig!"` -> 3 delar) förblir 100 % grön!
   - **Backtracking i `ordSekvens(text: string)`:**
     - Ersätt den giriga enkelriktade loopen i `ordSekvens(text: string)` med en kort rekursiv sökning med backtracking (pröva `j = ord.length` ned till `i + 1` med kravet `!(i === 0 && j === ord.length)`): om ett längre flerordsprefix vid `j` leder till återvändsgränd längre fram i meningen, backa och pröva kortare `j`:
       ```ts
       function ordSekvens(text: string): { f: string; ms: number }[] | null {
         const ord = text.split(" ");
         const sok = (i: number): { f: string; ms: number }[] | null => {
           if (i >= ord.length) return [];
           for (let j = ord.length; j > i; j--) {
             if (i === 0 && j === ord.length) continue;
             const r = rad(nyckel(ord.slice(i, j).join(" ")));
             if (!r) continue;
             const rest = sok(j);
             if (rest) return [r, ...rest];
           }
           return null;
         };
         const ut = sok(0);
         return ut && ut.length > 1 ? ut : null;
       }
       ```
   - **Fria flerordsmeningar på toppnivå i `ettPlan(text: string)` & Flermeningsstöd i `rostPlan(text: string)`:**
     - Längst ner i `ettPlan(text: string)` (precis före `return null;`, efter `for (const mall of mallar())`-loopen), lägg till fallback till `vardeDelar(t)`:
       ```ts
       const fria = vardeDelar(t);
       if (fria && fria.length > 0) {
         return { delar: fria, ms: fria.reduce((s, d) => s + d.ms, 0), dynamisk: false };
       }
       return null;
       ```
     - I `rostPlan(text: string)`: om `plan` är `null`, prova att dela `normalisera(text)` på meningsslut (`const bitar = normalisera(text).split(/(?<=[.!?])\s+/).filter(Boolean);`). Om `bitar.length >= 2`, slå upp `ettPlan(b)` för varje mening; om alla `bitar` ger en giltig plan, slå ihop deras `delar`, summera `ms` och sätt `dynamisk = planer.some((p) => p.dynamisk)`.

2. **`src/spel/rost.ts` (idag 150 rader — håll `<= 400` rader):**
   - **1-MP3-prioritet & utökade ersättningsmeningar i `sammanhallenRostText(text: string)`:**
     - **Allra först** i `sammanhallenRostText(text: string)` (direkt efter `const t = text.trim();`):
       ```ts
       if (rostFor(t) || rostFor(normalisera(t))) return t;
       ```
       (Importera `normalisera` från `./rostManifest.ts`). Detta garanterar att varje mening som redan har en exakt 1-MP3-inspelning i `K.rader` (t.ex. `"Hej! Här kommer en kanin!"`, `"Klart! ett rött hus står på gården."`, `"+2 stjärnor!"`, `"Nu heter djuret Skuttis!"`, `"Här får du en morot!"`) läses upp med sin exakta, sammanhållna MP3-inspelning istället för att bytas ut mot en generisk mening!
     - Behåll de 5 befintliga ersättningsreglerna från D3 och lägg till följande 9 sammanhållna ersättningsregler för öppna `{djur}`/`{ord}`-mallar (när barnet skrivit egna ord/namn som inte har en exakt 1-MP3-rad i `K.rader`, t.ex. `"Nu heter djuret Kurt-Olof!"`):
       - `/^Nu heter (?:djuret|du) .+!$/u` -> `"Vilket fint namn! Det passar helt perfekt!"`
       - `/^Wiii! .+ bar dig över floden!$/u` -> `"Wiii! Du kom säkert hela vägen över floden!"`
       - `/^Här får du .+!$/u` -> `"Varsågod! Hoppas att du tycker om din gåva!"`
       - `/^.+ följer med dig!$/u` -> `"Titta, du har fått en ny följeslagare!"`
       - `/^.+ följer efter dig!$/u` -> `"Nu följer din vän med dig på äventyret!"`
       - `/^.+ blev jätteglad och skuttar runt!$/u` -> `"Titta så glad den blev! Den skuttar runt av lycka!"`
       - `/^.+ spinner och gnider sig mot dig!$/u` -> `"Åh, den spinner och tycker så mycket om dig!"`
       - `/^Nästan! .+ vill ha .+ — du gav .+\.$/u` -> `"Nästan rätt! Titta noga på vad djuret önskar sig."`
       - `/^.+ står på sidan .+\. Köp sidan för .+ ⭐ i boken!$/u` -> `"Det ordet finns på en låst sida i boken. Samla stjärnor för att låsa upp den!"`
   - **Stäng av Web Speech TTS (`window.speechSynthesis` / `telefon`) i `spelaPlan`:**
     - I `spelaPlan`: när `"dynamisk" in d` och `DYNAMISK === "tyst"`, anropa aldrig `telefon(d.dynamisk, ...)` utan gå direkt vidare till `nasta()`.

3. **`data/rost.json`, `data/rost-klient.json` & `src/spel/rost2.test.ts` (136 rader — håll `<= 400` rader):**
   - Ändra `"dynamisk": "webblasare"` till `"dynamisk": "tyst"` i `data/rost.json` (rad 5) och i `data/rost-klient.json` (rad 4).
   - Uppdatera `src/spel/rost2.test.ts` (rad 42–43) från `"webblasare"` till `"tyst"` (`assert.equal(cfg.dynamisk, "tyst")` och `assert.equal(DYNAMISK, "tyst")`).

Change nothing else; do not modify any UI components in Runda R1 (det görs i Runda R2).

---

## 4. Write-first rule
Make the first change within your first 10 tool calls; no broad exploration; commit after each step; write the assessment file (`RUNDAR1.md`) before anything else if turns run low.

---

## 5. Fast probe first
Kör snabbprovet för Runda R1 efter varje delsteg:
```bash
node --experimental-strip-types rundor/R1-R2-kompletta-roster/prov-r1-r2.mjs --snabb --steg=r1
```
Run the fast probe after each step; run the full suite (`npx tsc --noEmit && npm run check:struktur && npm run test:product`) only once, at the end, if the probe is green.

---

## 6. Fallback plan
Om någon enskild testrad i `src/spel/rost2.test.ts` påverkas av `ettPlan`-ordningen, säkerställ att `rostForNormaliserad(text)` körs före `mallar()`, medan `vardeDelar(varde)` inuti `mallar()` använder `rad(nyckel(varde))` direkt utan punktsuffix-fallbacken. Då passerar både `rost2.test.ts` och alla 1-MP3-uppslag i `prov-r1-r2.mjs`.

---

## 7. Technical guard rails
- **Kör ALDRIG `scripts/rost-generera.mjs` mot ElevenLabs API** (alla 4 136 MP3-filer är redan färdiggenererade och normaliserade i `public/ljud/rost/`!). Uppdatera fältet `"dynamisk": "tyst"` direkt i `data/rost.json` och `data/rost-klient.json`.
- **Exakt `data-testid`-baslinje (`npm run check:struktur`):** `174` unika nycklar och `179` förekomster i `src/spel/**/*.tsx`.
- **Filstorlek:** Alla filer under `src/spel/` ska vara `<= 400` rader.

---

## 8. Acceptance ('Show that...')
1. **Show that** `node --experimental-strip-types rundor/R1-R2-kompletta-roster/prov-r1-r2.mjs --snabb --steg=r1` passerar med `ok: true` och `fel: []`.
2. **Show that** `rostPlan` returnerar 1 enda sammanhållen MP3 (`delar.length === 1`, `dynamisk: false`) för alla 101 `uppdragText(u)`, alla 101 `uppdragForslag(u)`, alla 368 `bengtsson.json` `forslag`/`borjan`, alla 8 `kanEtikett`, alla 94 idékort/`prova`/`exempel` och alla C1–C4 gåvo-/dopfraser (`"Nu heter djuret Skuttis!"`, `"Här får du en morot!"`).
3. **Show that** fria meningar som `rostPlan("två små gröna grodor med hatt")`, flermeningssträngar och emoji-/dubbelpunktsträngar som `rostPlan("✨ Vakna!")` och `rostPlan("Hatt eller mössa.. En kanin fryser om öronen!")` returnerar giltig plan med `dynamisk: false`.
4. **Show that** `sammanhallenRostText("Hej! Här kommer en kanin!")` behåller `"Hej! Här kommer en kanin!"` (1-MP3), medan `sammanhallenRostText("Nu heter djuret Kurt-Olof!")` ger `"Vilket fint namn! Det passar helt perfekt!"` (1-MP3).
5. **Show that** `DYNAMISK === "tyst"` och att `npm run check:struktur`, `npx tsc --noEmit` och `npm run test:product` passerar med 0 fel.

---

## 9. Honest final assessment (`RUNDAR1.md`)
Skriv en kort `RUNDAR1.md` i repots rot innan du avslutar med: (1) vad som levererats och verifierats, (2) de 3 svagaste punkterna i lösningen, och (3) eventuella risker inför Runda R2.
