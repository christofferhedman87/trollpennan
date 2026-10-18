# R3A – Entiteter: djuren som data (ritning)

Skriven av Arkitekten 2026-10-18. Bas: `origin/main` = `3a5e1b4` (R2 mergad). **Läst** = ur filerna, **mätt** = ur körda skript, **provkört** = i en skräpkopia utanför repot (`/workspace/arkitekt-r3a/sB`: `main` + patchen). Prompten till Build: `PROMPT.md`.

## 1. Avgränsning: R3A är medvetet liten

`PROJECT.md` ritade R3A stor (alla entiteter, byggnader, hagar, `LICENSES.md`, `djurPlats` i data). Efter R2 och Builds två körningar som aldrig nådde commit (30 turer, kontaktark i överflöd) görs R3A i stället så liten att kvoten räcker till motorn (R3B och framåt):

| Ingår i R3A | Skjuts upp (varför) |
|---|---|
| `data/entiteter.json`: de 14 djuren (typ, modell, mått, färger, rörelse, vikt, hopp, natt, material, valfri `framAxel`) | **Byggnader och föremål** (36 byggord): ingen kod läser dem förrän R5, så rader nu vore död data; schemat (`typ: byggnad`, `kategori`) finns och kontrolleras |
| `data/tillgangar.json`: manifest för alla 10 modellmappar/filer med licens, upphov, källa | `LICENSES.md` och inkorgsrutinen: R3C |
| `src/spel/entiteter.ts` (ren, ingen three) + `entiteter.test.ts` (8 tester) | Animationsnamn per djur (`Fast_Flying`, `Jump_Start`, grodans andning, drakens rök): R3C (fältet `klipp`) |
| Koden läser data i stället för tabeller: `gltfDjur.tsx`, `angen3d.tsx`, `liv.ts`, `AngLager.tsx`, `Spel.tsx` | Phaser-filerna `scen.ts`, `gard.ts` (8 `kropp ===`): försvinner i R7 |
| Standard "vänd mot kameran" + valfri `framAxel` som verklig kod (`framVinkel`) | Kodritade former i `djurmesh.ts` (7): ersätts av modeller (R3C/R5) |
| `kategori` på varje rad (förberedelse för reservformen) | **Reservformen/ordkristallen: R3B** (avsnitt 9) |

Mått: `rg -o "kropp ===" src/spel | wc -l` **36 → 20** (mätt i skräpkopian). Kvarvarande 20: scen.ts 7, djurmesh 7, gltfDjur 3 (animationer), angen3d 2 (drakens rök), gard.ts 1 (Phaser), liv.ts 1 (uppdraget "gris"). Inga hårdkodade djurlistor (`FIL`, `MAL_HOJD`, `PALETT`, `ART`, `KROPPAR`, `kanHoppa`, `vikt`, `flygare`/`simmare`) finns kvar i koden.

## 2. Mål och form

- Ett nytt djur = **en rad i `data/entiteter.json`** (+ en rad i `data/tillgangar.json` om det har en GLB, + ordrad i `ord.json`). Ingen kod per djur. Bevis: testet "ett nytt djur är en datarad".
- **Standard är "vänd mot kameran" och kräver inget fält.** Alla modeller antas ha framsidan mot +z (R2 mätte det för de nio filerna); kameran står på +z. `framAxel` (`"+z" | "-z" | "+x" | "-x"`) är en **valfri åsidosättning** som vrider modellen runt y så att den valda axeln hamnar mot +z; **inget av de 14 djuren har det** (testat). R3C:s valideringsskript mäter framriktningen för nya modeller och föreslår fältet (avsnitt 13.4 i `PROJECT.md`).
- Saknade fält ger standardvärden (`entitet()` av okänd kropp är `undefined`, funktionerna ger `1`, `#CE93D8`, `land`, `false`, `null`). Det är vad som låter en bulkmodell fungera med bara `typ`, `kategori`, `modell`, `malhojd`, `art`.

## 3. Filer (patchen `ref/r3a-integrera.patch`, 8 filer, 295 rader in / 85 ut)

| Fil | Status | Innehåll |
|---|---|---|
| `data/entiteter.json` | ny (finns redan i PR:en) | 14 rader, se 4.1 |
| `data/tillgangar.json` | ny (finns redan i PR:en) | licenser + 10 tillgångar, se 4.2 |
| `src/spel/entiteter.ts` | ny, 133 rader | typer, `ENTITETER`, `TILLGANGAR`, funktionerna i 3.1, `kontrolleraEntiteter()` |
| `src/spel/entiteter.test.ts` | ny, 126 rader | 8 tester (avsnitt 6) |
| `src/spel/gltfDjur.tsx` | ändras (−69 +…) | `FIL`/`MAL_HOJD`/`PALETT`/`type Palett` (r.12–47) borta; `fargAv`, `fargaKlon` (materialroller), `harModell`, `modellUrl`, preload, `url`, `mal`, `<group rotation={[0, fram, 0]}>` runt `<primitive>` |
| `src/spel/angen3d.tsx` | ändras | `ART` (r.50–64) borta; `djurFarg`, `flygare`, `simmare`, `vikt`, `kanHoppa`/hopphöjd (r.764–766) och drakens rörelsegren (r.786) läser data |
| `src/spel/liv.ts` | ändras | `KROPPAR = djurIds()` (var en hårdkodad tupel, samma ordning) |
| `src/spel/ui/AngLager.tsx`, `src/spel/Spel.tsx` | ändras | `kropp !== "uggla"` → `!nattvaken(kropp)` (3 ställen) |
| `package.json` | ändras | `test:product` får `src/spel/entiteter.test.ts` |
| `rundor/R3A-entiteter/r3a-jamfor.mjs` | ny (finns redan i PR:en) | jämförelse gammal kod / nya data, 322 fall |

### 3.1 Signaturer (`src/spel/entiteter.ts`, ingen three-import)
```ts
export function entitet(kropp: string): Entitet | undefined;
export function djurIds(): string[];                                   // ordning = entiteter.json (albumets)
export function modellUrl(kropp: string): string | null;               // entitet.modell → tillgangar.json → fil
export function malhojd(kropp: string): number;                        // standard 1
export function artFarg(kropp: string): string;                        // standard #CE93D8
export function flyger(kropp: string, formagor: readonly string[]): boolean;  // "vingar" i förmågor || rorelse "flyg"
export function simmar(kropp: string, formagor: readonly string[]): boolean;  // "fenor" i förmågor || rorelse "sim"
export function svavar(kropp: string): boolean;                        // rorelse "svavar" (draken)
export function vikt(kropp: string): number;                           // standard 1 (drake 3, häst 2)
export function hoppHojd(kropp: string): number | null;                // null = hoppar inte
export function nattvaken(kropp: string): boolean;                     // natt "vaken" (ugglan)
export function framVinkel(axel: FramAxel | undefined): number;        // radianer runt y; saknad axel = 0
export function kontrolleraEntiteter(): string[];                      // [] = ok
```
Barnets förmågor vinner över datan, precis som förut (`flyger`/`simmar` tar `formagor`).

## 4. Dataformer

### 4.1 `data/entiteter.json`
```json
"häst": { "typ": "djur", "kategori": "djur", "modell": "hast", "malhojd": 1.5,
          "palett": { "from": 30, "range": 25, "bodyL": 0.4 }, "art": "#8D6E63", "vikt": 2 },
"drake": { "typ": "djur", "kategori": "djur", "modell": "drake", "malhojd": 1.35, "art": "#66BB6A",
           "rorelse": "svavar", "vikt": 3, "standardfarg": "#ff8a3c",
           "material": { "Dragon_Main": "farg", "Dragon_Secondary": "ljus" } },
"fågel": { …, "rorelse": "flyg", "hopp": 0.32 },   "uggla": { …, "rorelse": "flyg", "natt": "vaken" },
"gris": { "typ": "djur", "kategori": "djur", "modell": null, "art": "#F8BBD0" }
```
Fält: `typ` (`djur|tillbehor|byggnad|foremal|natur`), `kategori` (reservformens kategori, R3B), `modell` (nyckel i `tillgangar.json` eller `null` = kodritad form), `malhojd` (krävs när `modell` finns), `palett` (färgbytet i `paletteSwap`), `art` (grundfärg), `rorelse` (`land|flyg|sim|svavar`, standard `land`), `vikt`, `hopp` (hopphöjd; saknas = hoppar inte), `natt: "vaken"`, `standardfarg` (när barnet inte valt färg), `material` (materialnamn i GLB → `farg` tar djurets färg, `ljus` en ljusare nyans; saknas = paletten byter färg), `framAxel`.
Alla värden är kopierade ur de gamla tabellerna (`FIL`, `MAL_HOJD`, `PALETT`, `ART`, `vikt`, `kanHoppa`, `fargAv`, `fargaKlon`) och bevisas lika av `r3a-jamfor.mjs` (avsnitt 6). `haj` hade ingen `ART`-rad och fick gamla standarden `#CE93D8` uttryckligen.

### 4.2 `data/tillgangar.json`
`licenser` (`CC0-1.0`, `CC-BY-3.0` med `namnangivelse`) och `tillgangar.<nyckel>` = `{ fil | mapp, licens, upphov, kalla, anvands? }`: nio filer i `public/models/` (de åtta som används + `animal-parrot` markerad `anvands: false`, den ligger i `public/` men ingen entitet pekar på den) och mappen `natur/`. Källa: `CREDITS.md` (samma upphov och länkar). Testet kräver att **varje** `.glb` direkt under `public/models/` har en rad, så en modell utan licensrad kan inte smyga in.

## 5. Vad som ändras i gammal kod (rad = main `3a5e1b4`)

- `gltfDjur.tsx` r.12–47 (tre tabeller) → borta; r.106–110 `fargAv`: drake-grenen → `entitet().standardfarg`; r.152–186 `fargaKlon`: drake/groda-grenarna blir *materialroller* ur data (`roll`), `glans` gäller roll `farg` eller palettdjur (ordagrant samma villkor för de nio filerna, kontrollerat mot GLB-materialnamnen: drake `Dragon_Main/Secondary/Horn`, groda `4CAF50/1A1A1A/FF9800/F44336`); r.188–196 `harModell/modellUrl/preload`; r.199, r.214.
- **Framriktning (verklig kod, ingen visuell ändring):** `<primitive object={klon}/>` (r.323) får ett omslag `<group rotation={[0, fram, 0]}>` med `fram = framVinkel(entitet(kropp)?.framAxel)`. Tillbehören sitter *i* `klon`, så de följer med. Standard är 0, så scenen ser likadan ut (kontrollerat med bild, avsnitt 7).
- **Behålls medvetet (`gltfDjur.tsx`):** animationsval per djur (`k === "drake"` m.fl.), grodans andning/klapp. De är klippnamn knutna till respektive GLB och blir `klipp` i R3C; att flytta dem nu vore en beteendeändring utan bevis.
- `angen3d.tsx`: se tabellen i 3. `kanHoppa` blir `hoppHojd !== null`; hopphöjden 0,32 (fågel) respektive 0,55 (övriga) står nu som `hopp` i data.

## 6. Bevis (alla utskrifter klistras in av Build i `RUNDAR3A.md`)

| Kommando | Förväntat (provkört) |
|---|---|
| `npm run typecheck:pages` | 0 fel |
| `npx eslint src/spel/entiteter.ts src/spel/entiteter.test.ts src/spel/gltfDjur.tsx src/spel/angen3d.tsx src/spel/Spel.tsx src/spel/liv.ts src/spel/ui/AngLager.tsx` | 0 fel, 9 varningar (alla fanns före: Spel 3, angen3d 4, gltfDjur 2) |
| `node --experimental-strip-types --test src/spel/entiteter.test.ts` | 8/8 |
| `npm run test:product` | 91/91 (83 + 8) |
| `node --experimental-strip-types rundor/R3A-entiteter/r3a-jamfor.mjs --bas origin/main` | `fall 322, avvikelser 0`, exit 0 |
| `npm run check:struktur` | GRÖN (Spel.tsx 1782 rader) |
| `rg -o "kropp ===" src/spel \| wc -l` | 20 |
| `npm run build:pages` | grönt |
| `git diff origin/main --stat -- data/ord.json src/tolk public` | tomt |

`r3a-jamfor.mjs` läser de gamla tabellerna **ordagrant ur git** (`origin/main`: `FIL`, `MAL_HOJD`, `PALETT`, `ART`, `flygare`, `simmare`, `vikt`, `kanHoppa`, hopphöjd, `fargAv`, `KROPPAR`) och jämför 14 kroppar + en okänd × fem förmågauppsättningar, samt materialroller för varje materialnamn i GLB-filerna. Negativt prov: `häst.malhojd` 1,5 → 1,4 ger `AVVIKER häst malhojd` och exit 1 (kört).

## 7. Provkörning (skräpkopia utanför repot, 2026-10-18)

1. `git apply --check` på `main`: rent. `tsc -p tsconfig.pages.json`: 0 fel. eslint: 9 varningar före och efter. `test:product` 91/91. `check:struktur` grön.
2. `r3a-jamfor.mjs`: **322 fall, 0 avvikelser** (och 1 avvikelse när jag ändrade en siffra: provet fungerar).
3. DOM-tur (`verification/r1-dom-tur.mjs`, 28 lägen) på byggd `main` två gånger och på patchad kopia: **28 stabila lägen av 28, 0 skiljer**, 0 sidfel. (Build kör inte turen; den tar ca 6 minuter.)
4. Ett krona-ark (14 djur, 375×812) före/efter i byggd sida: se avsnitt 7.1.
5. `build:pages` grönt (2 s).

### 7.1 Bildjämförelse
Krona-arket (14 djur, 4 kolumner, 375×812 beskuret 300×325 per ruta) togs med `ark-tillbehor.mjs --tillbehor krona` på byggd `main` två gånger (före 1, före 2) och på patchad kopia (efter). Pixelskillnad (andel pixlar med kanalskillnad > 24): **före 1 mot före 2 (samma kod): 5,70 %; före 1 mot efter: 2,12 %; före 2 mot efter: 5,81 %.** Skillnaderna ligger i djurens rörelse (djuren går, flyger och simmar mellan två körningar), och de nya skillnaderna är inte större än mellan två körningar av samma kod. Läst på bild: krona på huvudet på alla 14, kanin/katt/hund tittar mot kameran, som efter R2 (`docs/skarmbilder/r3a/provkorning-01-krona-efter.png`). Det är bevis på "ingen synlig ändring", inte på att varje pixel är lika; det bevisar `r3a-jamfor.mjs` för parametrarna.

## 8. Grind-utlåtande, kostnad, risker

- **Grind: JA.** Villkor: patch och data är färdiga och provkörda (Build skriver ingen kod, ingen siffra och mäter ingenting), beviset är mekaniskt (322 fall, 8 tester, DOM-tur), inget spelbeteende ändras avsiktligt, och prompten har hårda stoppregler. Allt som kunde gå fel i Builds förra körningar (kontaktark, ändra data utan bild, ingen commit) är bortplockat: **ett** ark, **inga** dataändringar tillåtna, commit tidigt.
- **Storlek: liten, 12–18 turer, 0,6–1,2 USD (gissning).** Jämför R2-prompten (14–22 turer; Build nådde 30 utan commit på grund av arken) och 4E (11 turer, 0,52 USD). Den här runda har inget trimsteg och ett ark i stället för åtta.
- **Risker:** (1) *Patchdrift:* om `gltfDjur.tsx`/`angen3d.tsx` ändrats efter `3a5e1b4` kan `git apply --check` falla → prompten stoppar (ingen omskrivning); Arkitekten gör om patchen. (2) *`<group rotation>`-omslaget* ändrar scenträdet (en nod till) men inte bilden (bevisat med krona-ark och pixeljämförelse, 7.1). (3) *`KROPPAR` byter typ* från `readonly` tupel till `string[]`: `tsc` ger 0 fel, men inget kodavsnitt får förlita sig på literaltypen (ingen gör det idag). (4) *Material-roller* bevisas på de nio GLB-filerna; en ny modell med andra materialnamn får egna `material`-rader (R3C-valideringen kan flagga det).
- **Osäkerheter (ärligt):** (a) Phaser-delarna (`scen.ts`, `gard.ts`) läser fortfarande sina egna kropp-villkor och `beteenden.json`; ett nytt djur med `natt: "vaken"` beter sig därför som uggla bara i 3D-ängen och UI:t. Phaser tas bort i R7. (b) `beteenden.json` (2D-stil per kropp) och `entiteter.json` (`rorelse`) överlappar i betydelse men inte i värden (bäver: `ga` i 2D, `sim` i 3D); ihopslagning hör till R7. (c) `framAxel` har ingen rad i datan, så *vridningen* är bara bevisad som ren funktion (testet) och som oförändrad scen, inte sedd på en modell som verkligen står bak och fram; R3C:s första modellsats ger det beviset. (d) Jag har sett ett krona-ark per sida, inte alla tillbehör; R2:s åtta ark gäller oförändrat eftersom `r3a-jamfor.mjs` visar att alla parametrar som styr ritningen är lika.

## 9. Reservformen (ordkristallen): till R3B, med exakt skäl

Den enklaste reservformen ("okänt ord blir en ordkristall") ryms **inte** i R3A utan att göra den stor och riskabel: den ändrar `tolka()` i `src/tolk/tolka.ts` (där `okand`/`behover_djur` skapas) och de två tester i `tolk.test.ts` som idag kräver `behover_djur` för okänt ord, den kräver en ny R3F-komponent och ett utseende som **Christoffer ska godkänna på bild** (`PROJECT.md` 10.2 punkt 2: produktregeln ändras), och den hör ihop med stavningsgissningen (`avstand.ts`). Det som R3A lämnar färdigt för R3B: (1) `kategori` på varje entitet (reservformens kategori), (2) `entitet()`/`djurIds()` som uppslag för "exakt ord"-steget, (3) `tillgangar.json` där en generisk kristallmodell kan få sin rad (`kristall`, CC0 eller procedurell). Den exakta ritningen (filer, signaturer, `reserv.json`, bevis) står i `PROJECT.md` avsnitt 12.4–12.5 och får en egen `rundor/R3B-reservform/RITNING.md` när R3A är mergad (mitt förslag; ingen kodändring behövs i R3A för det).

## 10. Efter rundan (Arkitekten)

Mergar PR:en, kör kommandona i avsnitt 6 på `main`, kontrollerar `git diff` mot patchen (byte för byte), och skriver R3B-ritningen. `PROJECT.md` R3A-blocket uppdateras i samma PR som den här ritningen.
