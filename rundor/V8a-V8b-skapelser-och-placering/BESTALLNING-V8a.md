# BESTALLNING-V8a — Rika skapelser utan tyst radering (Ängstak 16, antal 1–10, `"och"`-mening, mössa på frysande kanin)

## 1. Mål (Ett sammanhållet mål för runda V8a)
När barnet trollar fram skapelser på ängen ska:
1. **Ängstaket vara `16` synliga djur (`MAX_SYNLIGA_DJUR = 16`)** i stället för 8/10, och när ett djur flyttar till stallet för att ge plats ska barnet få en vänlig påminnelse (*"Ängen är full! Den äldsta flyttade in i stallet så du kan hälsa på den där."*) i stället för tyst radering.
2. **Antalsord och siffror `1`–`10`** fungera fullt ut (`"en"`–`"tio"` samt `"1"`–`"10"`), så att `"tio katter"` eller `"fem grodor"` skapar exakt det antalet utan att taket klipper vid 4 eller 8.
3. **Två djur i samma mening med `"och"`** (t.ex. `"en röd katt och en blå hund"` eller `"en liten gris och en stor björn"`) delas upp med `delaOchMening(text)` och skapa båda djuren med rätt färg och storlek.
4. **Mössa på befintlig frysande kanin:** när det finns en frysande kanin på ängen (`humör === "fryser"` eller aktivt uppdrag `"kanin-fryser"`) och barnet skriver `"en kanin med mössa"` eller `"en röd mössa"`, uppdateras den befintliga kaninen med mössan och blir `"glad"` i stället för att skapa en ny dubblettkanin bredvid den frysande.

## 2. Builder-skills att ladda före kodning
- `child-literacy-design`
- `3d-web-game-check`
- `typescript-best-practices`
- `principle-prove-it-works`

## 3. Exakt ritning (Filer och funktioner)

### A. Ängstak `MAX_SYNLIGA_DJUR = 16` + vänlig påminnelse
1. **`src/spel/platser.ts`:**
   - Exportera `export const MAX_SYNLIGA_DJUR = 16;`.
   - **VIKTIG TESTFÄLLA (`src/spel/platser.test.ts` rad 75 & `src/spel/r9g.test.ts`):** Behåll `export const TAK_PER_PLATS = 10;` för övriga platser (`skogen`, `sjon`, `grottan`), eftersom `platser.test.ts` sätter `plats: "skogen"`, lägger till 14 djur och testar `assert.ok(skogen.length <= 10 && skogen.length >= 5, "samma tak på 10")`.
   - Lägg gärna till en hjälpfunktion `export const takForPlats = (platsId: string) => platsId === START_PLATS ? MAX_SYNLIGA_DJUR : TAK_PER_PLATS;`.
2. **`src/spel/minneSparning.ts`, `src/spel/minne.ts` och `src/spel/stall.ts`:**
   - Re-exportera `MAX_SYNLIGA_DJUR` från `src/spel/minne.ts`.
   - I `src/spel/minneSparning.ts` (`laggPaAngSpar` rad 242 och `kallaHitSpar` rad 273): använd `MAX_SYNLIGA_DJUR` (16) när `plats === START_PLATS` (`"ang"`), och `TAK_PER_PLATS` (10) för andra platser.
   - I `src/spel/minne.ts` (`tillLada` rad 238): använd `.slice(-MAX_SYNLIGA_DJUR)`.
   - I `src/spel/stall.ts` (`hamtaFranStall` rad 39): använd `d.plats === START_PLATS ? MAX_SYNLIGA_DJUR : TAK_PER_PLATS` som tak.
3. **`src/spel/placering.ts` — VIKTIG TESTFÄLLA (`src/spel/p3a.test.ts` rad 154):**
   - Höj `const RESERV_MAX = 16;` (rad 54) så att upp till 16 djur kan placeras.
   - **Se upp för `p3a.test.ts` rad 144–154:** Provet lägger in 12 stora djur (`["elefant", "kanin", "häst", "katt", "katt", "jultomte", "katt", "hund", "gris", "ko", "elefant", "kanin"]`) på `ang` och kräver både `iStallet(lista, plats).length === 0`, `r.somnade.length <= 1` och `somnat > 0` (`"ang: ingen somnade av 12"`).
   - Varför somnade djur på `ang` tidigare? Bara för att `TAK_PER_PLATS = 10` klippte vid 10! Om taket på `ang` är 16 och `placera()` på rad 309 kör `reserv_krymp = 0.25` direkt när `n === 1`, får alla 12 stora djur plats med `krymp = 0.25` och `somnat` blir `0`!
   - **Lösning i `src/spel/placering.ts` (rad 308–322) / `somnaEn`:** Låt `placera()` bara ta till `reserv_krymp` (`< krymp_aldre_min`) när `n > 1` (så att `somnaEn` först får söva **den enda** äldsta som spräckte normala `krymp_aldre_min = 0.4`, och `reserv_krymp` räddar resten så att högst 1 somnar per ord), ELLER låt `somnaEn` i `src/spel/minneSparning.ts` söva 1 äldsta djur när `lista.length > TAK_PER_PLATS` och `placera` tvingats krympa äldre djur under `PLACERING.krymp_aldre_min ?? 0.4`. Då klarar 16 normalstora djur (t.ex. 16 katter/kaniner/grodor) att stå vakna på ängen samtidigt (`lista.length === 16`), samtidigt som 12 tunga djur i `p3a.test.ts` söver minst 1 (`somnat > 0`) och lämnar `iStallet === []`!
4. **Vänlig påminnelse när ett djur flyttar till stallet (`data/ord.json` & `src/spel/styr/useSkapa.ts`):**
   - Uppdatera `repliker.sover` i `data/ord.json` till:
     `"Ängen är full! Den äldsta ({namn}) flyttade in i stallet så du kan hälsa på den där."`
   - Kontrollera att `useSkapa.ts` (rad 185) sätter `sattHjalp` med detta meddelande när `somnade.length > 0`.

### B. Antalsord och siffror `1`–`10` (`data/ord.json`, `data/test-fraser.json`, `src/tolk/lexikon.ts`)
1. **`data/ord.json`:**
   - Ändra `"antal_tak": 10` (från `8`). Alla antalsord `"två"` (2) till `"tio"` (10) finns redan i `data/ord.json`.
2. **`data/test-fraser.json`:**
   - På rad 165 (`"fras": "tio katter"`): uppdatera `"antal_pa_angen": 10` (från `8`) så att `src/tolk/tolk.test.ts` är 100 % grön.
3. **`src/tolk/lexikon.ts` (`lasToken`):**
   - Lägg till stöd för siffersträngar `"1"`–`"10"` i `lasToken(ord: string)`:
     - Om `t === "1"`: returnera `{ typ: "artikel", varde: "en", rå: t }` (så att `"1 katt"` ger `antal = 1` utan att sätta `antalSatt = true`, exakt som `"en katt"`).
     - Om `/^(?:[2-9]|10)$/.test(t)`: returnera `{ typ: "antal", varde: Math.min(Number(t), ORD.antal_tak), rå: t }`.

### C. Två djur i samma mening med `"och"` (`src/tolk/tolka.ts`, `src/spel/styr/useSkapa.ts`)
1. **`src/tolk/tolka.ts`:**
   - Exportera `export function delaOchMening(raw: string): string[]`:
   - Dela meningen vid `" och "` **endast** när båda sidor om `" och "` innehåller minst ett eget djur-/sak-substantiv (`typ === "djur"` i `lasToken`) så att:
     - `"en röd katt och en blå hund"` -> `["en röd katt", "en blå hund"]`
     - `"en liten gris och en stor björn"` -> `["en liten gris", "en stor björn"]`
     - `"en katt med hatt och glasögon"` -> `["en katt med hatt och glasögon"]` (delas INTE, eftersom `"glasögon"` är `tillbehor`, inte `djur`!).
     - `"en stor och snäll katt"` -> `["en stor och snäll katt"]` (delas INTE, eftersom `"en stor"` saknar djur!).
2. **`src/spel/styr/useSkapa.ts` (`hanteraDjur`):**
   - När barnet skickar in en text som inte bara är en enkel fråga/uppdrag, eller inuti `hanteraDjur`: om `delaOchMening(text)` ger `> 1` delmeningar, tolka varje delmening med `tolka(del)` och skapa varje resulterande `Varelse` (med dess egen färg, storlek, antal och tillbehör) på ängen!
   - Exportera även en ren hjälpfunktion (t.ex. `tolkaMening(raw: string): TolkResultat[]` i `src/tolk/tolka.ts`) så att både `useSkapa.ts` och Node-prov kan verifiera att `"en röd katt och en blå hund"` ger två `Varelse`-resultat med rätt `kropp`, `farg` och `skala`.

### D. Mössa på befintlig frysande kanin (`src/spel/styr/useSkapa.ts`)
1. Exportera en ren hjälpfunktion (t.ex. ` APPLICERA_MOSSA_PA_KANIN` eller `kluraUtMossaPaKanin` i `src/spel/styr/useSkapa.ts` eller en delad modul som `useSkapa.ts` anropar) och koppla in den i `useSkapa.ts`:
   - När barnet skriver `"en kanin med mössa"`, `"en kanin med en röd mössa"`, `"en röd mössa"` eller `"en mössa"`:
   - Kontrollera om det redan finns en `kanin` på nuvarande plats (`ang`) som antingen:
     - har `liv[k.uid]?.humor === "fryser"`, ELLER
     - uppdraget `"kanin-fryser"` är `"pagar"` / kaninen saknar mössa (`!k.tillbehor.some(t => t.id === "mossa" || t.id === "alvmossa")`).
   - Om en sådan befintlig kanin finns:
     - Uppdatera den befintliga kaninen på plats via `uppdateraDjur(kanin.uid, ...)` (lägg till mössan i `tillbehor`, behåll kaninens `uid`) och sätt kaninens humör till `"glad"` (`liv[kanin.uid].humor = "glad"`).
     - Skapa **inte** en ny dubblettkanin!

## 4. Verifiering och bevis före leverans av V8a
```bash
/home/box/.local/node22/bin/node --experimental-strip-types rundor/V8a-V8b-skapelser-och-placering/matt/prov-v8.mjs --snabb --del 1
npm test
npm run build
```
Alla delprov i `--del 1` ska visa `ok: true` och samtliga enhetstester i `npm test` ska vara gröna.
