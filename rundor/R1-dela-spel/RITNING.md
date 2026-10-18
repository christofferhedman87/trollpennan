# R1 – Ritning: dela `Spel.tsx` (ren flytt, noll beteendeändring)

Skriven av Arkitekten 2026-10-18. Bas: `origin/main` = `37913b3` (PR #12). Allt här är **läst och mätt** i den koden; mätskript finns i `rundor/R1-dela-spel/mat/`. Gissningar är märkta **(gissning)**. Prompten till Build: `PROMPT.md` (körning R1A). Körning R1B skrivs färdig efter granskning av R1A (build-prompt-skillen: "send run 1 only").

## 0. Grindutlåtande (skillen `build-round-gate`, 7 punkter)

**Utlåtande: JA för R1A (prompten är färdig och dess blueprint är provkörd i en skräpkopia: 0 typfel). JA för R1B när R1A är mergad och grön.** Rundan är uppdelad i två körningar, se avsnitt 2.

| # | Punkt | Status | Belägg |
|---|---|---|---|
| 1 | Projektkarta aktuell | **Ja** | `PROJECT.md` mergad i PR #12 (`37913b3`); den här PR:n rättar R1-blocket (radnummer, mål) efter mätning |
| 2 | Återanvändning kontrollerad | **Ja** | Inget i repot gör detta redan: ingen av de 13 grenarna (lokala och `origin/*`) har någon fil under `src/spel/ui/` (`git ls-tree -r --name-only <gren>`, mätt), och `rg '/ui/' src/spel` ger 0 träffar. Återanvänds: befintliga filer `samling.tsx` (`AlbumVy`, `ForalderLiv`), `intro.tsx`, `formel.tsx` stannar där de är |
| 3 | Arkitekturregeln hålls | **Ja** | Rundan lägger inget innehåll; den flyttar ordagrant kod. Ingen ny per-sak-kod (`rg -o "kropp ===" src/spel \| wc -l` ska vara **141 före och 141 efter**) |
| 4 | Ritning i prompten | **Ja** | Exakta rader, filer, signaturer och typer i avsnitt 4–5; `PROMPT.md` pekar på dem |
| 5 | Bevis definierat | **Ja** | `check:struktur` röd→grön, testid-baslinje, `typecheck:pages`, `test:product` (Node ≥ 22.6), DOM-tur före/efter, bilder 375×812 (avsnitt 7) |
| 6 | Inställningar valda | **Ja** | `grok-4.7-build-fast`, `--reasoning-effort low`, `--max-turns 35` (R1A), `--prompt-file`, gren, loggfil (avsnitt 9) |
| 7 | Ett logiskt mål | **Ja** | "Flytta ut data, hjälpfunktioner och JSX-block ur `Spel.tsx` utan att något ändras." Delningen i A och B följer skillens ordning: data/format först, sedan inkoppling |

**Avvikelser från `PROJECT.md` (mätta, rättas i den här PR:n):**
1. Målet "≤ 1 900 rader" var en gissning på felaktiga radnummer (JSX-blocken sitter på r.2091–3087, inte r.2248–3091 som angavs). Rätt mätt uppskattning efter R1: **ca 1 960 rader (gissning ± 60)**, eftersom 170 props måste skickas vidare (avsnitt 3). Gränsen sätts till **≤ 2 050**. Under 1 900 kommer `Spel.tsx` först när händelsefunktionerna delas i hooks (R1B-hook, första steget i R4; ingår inte här).
2. "25–30 turer, 2–3 USD" gällde en körning. Mätt omfattning (15 nya filer, 170 props) överstiger skillens gräns (2–3 × antal ändringar + 10 > 40) → två körningar.
3. `kropp ===` är **141 förekomster på 85 rader i 9 filer** (`rg -o "kropp ===" src/spel | wc -l`), inte 116. Siffran kunde inte återskapas; `PROJECT.md` rättas.
4. "Pixlarna ska vara lika" är **inte mätbart**: ängen är en animerad 3D-scen (SwiftShader), två skärmbilder av samma kod skiljer sig. Bevisningen blir i stället jämförelse av den normaliserade DOM-strukturen (avsnitt 7), plus bilder för mänsklig granskning.

## 1. Mål

- **Spelaren märker ingenting.** Samma skärmar, samma knappar, samma texter, samma ljud.
- **Utvecklaren:** `Spel.tsx` (3 133 rader, 49 `useState`, 1 593 rader logik före `return` och 1 030 rader JSX) blir läsbar och delbar så att R2, R3 (entiteter, reservform, bulk) och R4 (hooks, kamera) inte krockar i samma fil och Build slipper läsa 3 000 rader per runda.
- **Mått mot grundtanken** (avsnitt 11 i `PROJECT.md`): *täckning oförändrad* = `git diff origin/main -- data src/tolk` är tomt och `node` kör `test:product` 75/75; talen i avsnitt 11 ändras inte. Värdet för grundtanken är indirekt: R3 ("allt barnet skriver blir synligt") kan göras utan att varje ändring rör en 3 000-radersfil.

## 2. Varför två körningar

Skillen: räkna ändringarna, `--max-turns` ≈ 2–3 × ändringar + 10, över 40 → dela, i ordningen "data och format först, sedan inkoppling". Tidigare runda 5B (40 turer, "beställning för stor, Build mätte i stället för att skriva", `rounds.tsv`) är varningen.

| Körning | Innehåll | Nya filer | Ändringar (ungefär) | `--max-turns` | `Spel.tsx` efter (rader) |
|---|---|---|---|---|---|
| **R1A** (prompt klar) | skydd + typer + data + hjälpfunktioner + två små komponenter | 5 i `src/spel/ui/` + 2 skript + baslinje | 10 | 35 | **2 740 (mätt i provkörning, avsnitt 4.6)**, gräns 2 800 |
| **R1B** (skrivs efter granskning av R1A) | 9 JSX-block till 7 filer | 7 i `src/spel/ui/` | 11 | 40 (delas i B1/B2 om R1A tog > 28 turer) | ca 1 960 (gissning), gräns 2 050 |

R1A är nyttig och säker för sig själv (flyttar bara data och rena funktioner, inget JSX). R1B kan inte skrivas med säkra radnummer förrän R1A är mergad, eftersom R1A tar bort ca 400 rader överst i filen.

## 3. Läget idag (mätt på `37913b3`)

`wc -l src/spel/Spel.tsx` = **3 133**. Ingen källfil i `src/` har ändrats sedan `697be95` (`git diff 697be95 origin/main --stat -- src` är tomt), så alla radnummer nedan gäller.

| Del | Rader | Innehåll |
|---|---|---|
| Importer | 1–81 | 34 importsatser; `./liv.ts` r.31–62 och `./avflode.ts` r.65–81 är flerradiga |
| Typer | 83–102 | `Slot`, `Val`, `Banner`, `Bubbla`, `Forslag`, `VisKort`, `Varld`, `KopFraga`, `SidaDjur`, `SidaBygg`, `Led` |
| Data | 104–166 | `SIDOR`, `BYGGSIDOR`, `TEXTER`, `FIR`, `LED`, `LJUD_KNAPP/LJUD_PA/LJUD_AV_ORD/LJUD_AV`, `FLIKAR`, `RADER` |
| Hjälp (rent) | 168–204, 228–464 | `dukStil`, `malTillDuk`, `nyId` (+ modulräknare `idNr`), `bestamdAv`, `kanEtikett`, `KORT_IKON`, `kortIkon`, `meningAv`, `normFras`, `exempelFor`, `kortForExempel`, `bastaFlik`, `onskaAnkare`, `bokstav`, `bytOrd`, `taBortOrd`, `utanSparratSuffix`, `djurPris`, `ordVis`, `streck`, `lastBygge`, `frasForByggOrd`, `arKopia`, `exportera` |
| Komponent | 206–226 | `OnskaAnsikte` |
| `export function Spel()` | 466–3090 | 49 `useState` (r.468–516), 21 `useRef`, 20 `useMinne`-selektorer, 48 funktioner (händelsehanterare), 9 effekter (8 `useEffect` + 1 `useLayoutEffect`), härledda värden r.2006–2047, `return` r.2059–3089 |
| `HoldOppnare` | 3092–3101 | liten hook-komponent (renderar `null`) |
| `declare global` (`window.__troll`, 25 funktioner) | 3103–3133 | stannar |

JSX-blocken i `return` (r.2060–3088) och vad de använder ur `Spel()`-scopet (mätt med TypeScript-kompilatorn, `rundor/R1-dela-spel/mat/props.mjs`):

| Block | Rader (inre JSX) | Props som krävs |
|---|---|---|
| `AngLager` (`div.ang-lager`) | 2091–2247 | 31 |
| `KartaLager` | 2249–2275 | 4 |
| `OmradeHud` | 2278–2285 | 2 |
| `Hud` | 2287–2327 | 10 |
| `MenyPanel` | 2328–2405 | 15 |
| `HudBot` | 2406–2429 | 6 |
| `BokSkarm` | 2433–2733 | 49 |
| `SkyltDialog` | 2737–2751 | 2 |
| `ValjDjurDialog` | 2755–2768 | 3 |
| `VisKortDjur` | 2772–2797 | 4 |
| `VisKortBygg` | 2801–2810 | 2 |
| `OrdbokDialog` | 2814–2930 | 21 |
| `KopDialog` | 2934–2946 | 3 |
| `ForalderDialog` | 2950–3064 | 15 |
| `MossaPanel` | 3067–3085 | 4 |
| **Summa** | | **171** (139 unika namn) |

Vad som **inte** flyttas i R1 (stannar i `Spel()`): alla 49 `useState`, 21 `useRef`, 20 `useMinne`-selektorer, 48 funktioner, 9 effekter (inklusive `window.__troll`-effekten r.1744–1975 som saknar beroendelista och körs varje rendering), härledda värden. Hook-delning är R1B-hook/R4.

**Konsekvens för storlek:** att flytta ut 997 JSX-rader men skicka tillbaka 171 props (en per rad) + ca 30 rader anropsram ger `Spel.tsx` ≈ 60 importrader + 1 661 kvarvarande rader + 204 anropsrader + 38 nya importrader ≈ **1 963** (gissning, ± 60).

## 4. Körning R1A – exakt blueprint

Branch: `runda-r1a` från `origin/main`. Alla radnummer gäller `src/spel/Spel.tsx` på `37913b3`. **Första steget är att spara en orörd kopia** (`cp src/spel/Spel.tsx /tmp/Spel.orig.tsx`); alla `sed -n 'a,bp'` nedan läser ur kopian så att radnumren inte skiftar när `Spel.tsx` ändras.

### 4.1 Filer som skapas i R1A

| Fil | Innehåll (ordagrant flyttat) | Källrader i orig | Exporter |
|---|---|---|---|
| `src/spel/ui/typer.ts` | de 11 typerna | 83–102 | alla 11 `export type` |
| `src/spel/ui/spelData.ts` | 6 JSON-importer (r.6–11) + konstanterna | 104–166 | `SIDOR, BYGGSIDOR, TEXTER, FIR, LED, LJUD_KNAPP, LJUD_PA, LJUD_AV_ORD, LJUD_AV, FLIKAR, RADER` (`export const`) |
| `src/spel/ui/hjalp.ts` | rena funktioner | 168–204 och 228–464 | `dukStil, malTillDuk, nyId, bestamdAv, kanEtikett, kortIkon, meningAv, normFras, exempelFor, kortForExempel, bastaFlik, onskaAnkare, bokstav, bytOrd, taBortOrd, utanSparratSuffix, djurPris, ordVis, streck, lastBygge, frasForByggOrd, arKopia, exportera` (`export function`). `KORT_IKON` och `let idNr` förblir privata i filen |
| `src/spel/ui/OnskaAnsikte.tsx` | komponenten | 206–226 | `export function OnskaAnsikte` |
| `src/spel/ui/HoldOppnare.tsx` | komponenten | 3092–3101 | `export function HoldOppnare` |
| `scripts/check-spel-struktur.mjs` | kopia **oförändrad** av `rundor/R1-dela-spel/check-spel-struktur.mjs` | – | – |
| `verification/r1-dom-tur.mjs` | kopia **oförändrad** av `rundor/R1-dela-spel/r1-dom-tur.mjs` | – | – |
| `RUNDAR1A.md` | ärlig slutrapport (avsnitt 4.5) | – | – |

Ändras: `src/spel/Spel.tsx` (se 4.3) och `package.json` (exakt två nya rader i `scripts`):
```json
"check:struktur": "node scripts/check-spel-struktur.mjs",
"check:struktur:a": "node scripts/check-spel-struktur.mjs --steg a",
```

### 4.2 Hur filerna byggs (ordagrant, ingen omskrivning)

Rubrikerna (importer) nedan är mätta ur koden: det är exakt de importerade namn som respektive radintervall använder. Allt annat är `sed`-utdrag ur `/tmp/Spel.orig.tsx` med ett enda tillägg: `export ` framför deklarationer på kolumn 0 (se kolumnen "Exporter"). Ändra ingen logik, inget namn, ingen formatering.

```bash
ORIG=/tmp/Spel.orig.tsx; mkdir -p src/spel/ui

# typer.ts
{ cat <<'EOF'
import type { ForslagKort, Ord } from "@/tolk/typer.ts";
import type { Sparad } from "../brygga.ts";

EOF
sed -n '83,102p' $ORIG | sed -E 's/^type /export type /'; } > src/spel/ui/typer.ts

# spelData.ts   (JSON-sökvägarna får ett extra ../ eftersom filen ligger i ui/)
{ cat <<'EOF'
import byggSidorJson from "../../../data/byggsidor.json" with { type: "json" };
import firandeJson from "../../../data/firande.json" with { type: "json" };
import ledJson from "../../../data/ledtradar.json" with { type: "json" };
import ljudJson from "../../../data/ljud.json" with { type: "json" };
import sidorJson from "../../../data/sidor.json" with { type: "json" };
import texterJson from "../../../data/texter-gard.json" with { type: "json" };
import type { Led, SidaBygg, SidaDjur, Slot } from "./typer.ts";

EOF
sed -n '104,166p' $ORIG | sed -E 's/^const /export const /'; } > src/spel/ui/spelData.ts

# hjalp.ts
{ cat <<'EOF'
import { arSparrat } from "@/tolk/sparr.ts";
import { BYGG, materialMed, type ByggeTolk } from "@/tolk/byggtolk.ts";
import { ordLista } from "@/tolk/tolka.ts";
import type { Ord } from "@/tolk/typer.ts";
import { useMinne, type OnskaSpar } from "../minne.ts";
import { ONSK, ONSK_BYGG } from "../onska.ts";
import { BYGGSIDOR, FLIKAR, LED, SIDOR } from "./spelData.ts";
import type { Slot, Val } from "./typer.ts";

EOF
sed -n '168,204p' $ORIG; echo; sed -n '228,464p' $ORIG; } | sed -E 's/^function /export function /' > src/spel/ui/hjalp.ts

# OnskaAnsikte.tsx
{ cat <<'EOF'
import { useEffect, useRef } from "react";
import { ritaDjur } from "../billboard.ts";
import type { Sparad } from "../brygga.ts";

EOF
sed -n '206,226p' $ORIG | sed -E 's/^function /export function /'; } > src/spel/ui/OnskaAnsikte.tsx

# HoldOppnare.tsx
{ cat <<'EOF'
import { useEffect, useRef } from "react";

EOF
sed -n '3092,3101p' $ORIG | sed -E 's/^function /export function /'; } > src/spel/ui/HoldOppnare.tsx
```

Kontrollera att radintervallen stämmer innan du kör (en rad per intervall, annars STOPP, avsnitt 10):

| Rad | Ska börja med |
|---|---|
| 83 | `type Slot = "djur"` |
| 102 | `type Led = {` |
| 104 / 166 | `const SIDOR = sidorJson as {` / `];` |
| 168 / 204 | `function dukStil(` / `}` |
| 206 / 226 | `function OnskaAnsikte(` / `}` |
| 228 / 464 | `function kanEtikett(` / `}` |
| 466 | `export function Spel() {` |
| 3092 / 3101 | `function HoldOppnare(` / `}` |

### 4.3 Ändringar i `src/spel/Spel.tsx` (R1A)

1. **Ta bort** rad 83–465 (typer, data, hjälpfunktioner, `OnskaAnsikte`; lämna rad 466 `export function Spel() {` orörd) **och** rad 3092–3102 (`HoldOppnare` + tom rad). Lämna `declare global` (r.3103–3133) orörd.
2. **Ta bort** importerna: rad 6–11 (sex JSON-importer; **behåll** rad 12 `introJson`), importen av `arSparrat` från `@/tolk/sparr.ts`, importen av `ritaDjur` från `./billboard.ts`, och `materialMed` samt `type ByggeTolk` ur importen från `@/tolk/byggtolk.ts` (övriga namn där, `BYGG, byggMedId, formelBygg, tolkaBygg`, behålls).
3. **Lägg till** (efter övriga importer):
```ts
import type { Banner, Bubbla, Forslag, KopFraga, Slot, Val, Varld, VisKort } from "./ui/typer.ts";
import { BYGGSIDOR, FIR, FLIKAR, LJUD_AV, LJUD_PA, RADER, SIDOR, TEXTER } from "./ui/spelData.ts";
import {
  arKopia, bastaFlik, bestamdAv, bokstav, bytOrd, djurPris, dukStil, exempelFor, exportera,
  frasForByggOrd, kanEtikett, kortForExempel, kortIkon, lastBygge, malTillDuk, meningAv, nyId,
  onskaAnkare, ordVis, streck, taBortOrd, utanSparratSuffix,
} from "./ui/hjalp.ts";
import { HoldOppnare } from "./ui/HoldOppnare.tsx";
import { OnskaAnsikte } from "./ui/OnskaAnsikte.tsx";
```
   Ta bort de namn `npm run check:struktur:a` anger som oanvända och lägg till de `typecheck:pages` saknar; inget annat i filen ändras.
4. **Ingenting annat i `Spel.tsx`** (inga hooks, ingen JSX, inga handlers).

Radantal efter: **2 740 (mätt i provkörning, 4.6)**; gränsen i skriptet är 2 800.

### 4.4 Ordning (commit efter varje steg, första ändringen inom 10 verktygsanrop)

1. **Förflyg:** `git fetch origin`, `git switch -c runda-r1a origin/main`, kontrollera `git diff 37913b3 -- src` är tomt (annars STOPP), `cp src/spel/Spel.tsx /tmp/Spel.orig.tsx`, `node -v` (skriv i `RUNDAR1A.md`), `npm ls typescript playwright` (finns de? annars `npm ci`).
2. **Skydd:** kopiera de två skripten, lägg de två `package.json`-raderna, `git add`, commit "R1A steg 1: strukturvakt och DOM-tur". Kör `npm run check:struktur:a` och **bekräfta att den är RÖD** (`Spel.tsx har 3133 rader`, 5 filer saknas) – det är "röd före".
3. **Före-bevis (innan någon källfil ändras):** `npm run build:pages` (inte `npm run build`, den kör databasmigrering), sedan DOM-turen två gånger: `node verification/r1-dom-tur.mjs --dist dist-pages --ut /tmp/r1/fore1` och `.../fore2` (varje körning tar ca 2–4 minuter). Webbläsare: se avsnitt 7.5. Kopiera `tur.json` och `*.dom.html` från båda till `rundor/R1-dela-spel/dom-fore/fore1/` respektive `fore2/`, och fyra bilder till `docs/skarmbilder/r1/fore-<läge>.png` (`02-ang-djur`, `03-bok-kort`, `07-meny`, `12-ordbok`). Commit "R1A steg 2: före-bevis".
4. **Flytta:** skapa de fem filerna enligt 4.2, gör ändringarna i 4.3. `npm run typecheck:pages` (grön förväntas, baslinje: 0 fel, ca 6 s) och `npm run check:struktur:a` (grön). Commit "R1A steg 3: typer, data, hjälpfunktioner och två komponenter ur Spel.tsx".
5. **Efter-bevis:** `npm run build:pages`, `node verification/r1-dom-tur.mjs --dist dist-pages --ut /tmp/r1/efterA`, sedan `node verification/r1-dom-tur.mjs --jamfor /tmp/r1/fore1 /tmp/r1/fore2 /tmp/r1/efterA` (**exit 0** krävs), `test:product` med Node ≥ 22.6 (avsnitt 8), `npx eslint src/spel/Spel.tsx src/spel/ui` (0 fel; 4 varningar totalt, varav en flyttar med `OnskaAnsikte`; baslinje i `Spel.tsx`: 0 fel, 4 varningar). `rg -o "kropp ===" src/spel | wc -l` = 141. `git diff origin/main --stat -- data src/tolk` tomt.
6. **Slutrapport:** `RUNDAR1A.md` (4.5), commit, **pusha inte** (Arkitekten granskar först).

### 4.5 Definition of done för R1A (alla mätbara)

1. `npm run check:struktur:a` **grön** (var röd före: steg 2).
2. `npm run typecheck:pages` grön.
3. `test:product` 75/75 med Node ≥ 22.6.
4. DOM-turen: `--jamfor fore1 fore2 efterA` slutar med exit 0 (minst 12 stabila lägen och inga skillnader).
5. `git diff --name-only origin/main...HEAD` innehåller **bara**: `src/spel/Spel.tsx`, `src/spel/ui/*`, `scripts/check-spel-struktur.mjs`, `verification/r1-dom-tur.mjs`, `package.json`, `rundor/R1-dela-spel/dom-fore/**`, `docs/skarmbilder/r1/*.png`, `RUNDAR1A.md`.
6. `RUNDAR1A.md` finns och säger: vad som inte blev gjort, tre svagaste ställen, risker för R1B, `node -v`, antal turer, och om turen kunde köras (webbläsare).

### 4.6 Provkörning av blueprinten (Arkitekten, skräpkopia utanför repot)

För att inte skicka en ritning som inte håller kördes exakt `sed`-blocket i 4.2 och ändringarna i 4.3 i en **skräpkopia** av `37913b3` i `/workspace/arkitekt-r1/scratch` (ingenting av detta finns i repot eller är committat; ingen `vite build`, inget spel startat):
| Kontroll | Resultat |
|---|---|
| `tsc --noEmit -p tsconfig.pages.json` | **0 fel** (rubrikernas importer räcker; inga extra namn behövs) |
| `Spel.tsx` | **2 740 rader** (var 3 133) |
| `check-spel-struktur.mjs --steg a` | **GRÖN** (inga oanvända importer; testid 124/126 oförändrade; 5 ui-filer) |
| `eslint src/spel/Spel.tsx src/spel/ui` | 0 fel, 4 varningar (de tre kvarvarande i `Spel.tsx` + en som flyttade med `OnskaAnsikte`) |
| `rg -o "kropp ===" src/spel \| wc -l` | 141 |
| Filstorlekar | `typer.ts` 23, `spelData.ts` 71, `hjalp.ts` 284, `OnskaAnsikte.tsx` 25, `HoldOppnare.tsx` 12 rader |
Inte provat: `npm run build:pages`, DOM-turen mot den nya koden, `test:product` mot den nya koden (de rör inte `Spel.tsx` och är orörda av flytten men har inte körts efter den).

## 5. Körning R1B – blueprint (utkast; radnummer räknas om efter R1A)

R1B flyttar de nio JSX-blocken till sju filer i `src/spel/ui/`. **Utkastet gäller `37913b3`.** När R1A är mergad kör Arkitekten om `mat/props.mjs` på den nya `Spel.tsx` och skriver `PROMPT-R1B.md` med färska radnummer (R1A tar bort ca 400 rader överst). Typerna och propnamnen nedan ändras inte av R1A.

### 5.1 Regler (gäller alla komponentfiler)

1. **Kroppen är det inre JSX:et ordagrant** (raderna i tabellerna), placerat i `return ( … );`. Ingen omskrivning, ingen omformatering, ingen `prettier`.
2. **Props = exakt namnen i tabellerna** (samma namn som variabeln i `Spel()`). Signatur: `export function X({ a, b, c }: XProps)` med `type XProps = { … }` direkt ovanför. Kroppen får inte byta variabelnamn.
3. **Villkoret stannar i `Spel.tsx`.** Exempel: `{kartaOpp ? ( … ) : null}` (rad `kartaOpp`-villkoret till `) : null}`) ersätts med `{kartaOpp ? <KartaLager forstaRad={forstaRad} kartaText={kartaText} tryckPlats={tryckPlats} oppna={oppna} /> : null}`. TypeScript smalnar av (`skylt`, `valj`, `kop`, `visKort` är icke-null inne i villkoret), så propparna typas **utan `null`**.
4. **Utan villkor** (anropas alltid, på samma plats i samma ordning): `AngLager`, `Hud`, `HudBot`. `MenyPanel` tar `menyOpp` och innehåller de två `{menyOpp ? … : null}`-uttrycken ordagrant (r.2328–2405) i ett fragment.
5. **Samma DOM:** komponenten returnerar exakt de element som stod på platsen. Ingen extra `div`, ingen ändrad ordning, ingen ändrad `key`.
6. **Inga nya hooks, ingen `React.memo`, ingen `useCallback`.** Spel-beteendet (omritning vid varje tillståndsändring) är samma som idag.
7. **Ref-props** heter som i `Spel()` (`valjKor`, `filRef`, `textRef`, `omUidRef`), aldrig `ref`.
8. **Importer** i nya filer: det `typecheck:pages` kräver, namnen i 5.2. När ikoner/hjälpare blir oanvända i `Spel.tsx` tar du bort dem (skriptet säger vilka).
9. **Typer** från tabellerna (utskrivna av `tsc`); specialfall: `Dispatch<unknown>` är `Dispatch<SetStateAction<unknown>>`; `RefObject<T>` som utskrivet (React 19; om `tsc` klagar på tilldelningen från `useRef`, använd `MutableRefObject<T>`); `liv: Data["liv"]` (från `../minne.ts`), `lada: SparatBygge[]` (från `../bygge.ts`), `hemma: Hemdjur[]` (`../minne.ts`), `VisKortDjur.visKort: Extract<NonNullable<VisKort>, { slag: "djur" }>` och `VisKortBygg.visKort: Extract<NonNullable<VisKort>, { slag: "bygg" }>`, `Sparad` från `../brygga.ts`, `Ord`/`ForslagKort` från `@/tolk/typer.ts`, `Lage`/`OnskaSpar` från `../minne.ts`, `Banner`/`Bubbla`/`Forslag`/`KopFraga`/`Slot`/`Val`/`Varld`/`VisKort`/`SidaBygg` från `./typer.ts`.

### 5.2 Filer och vad var och en använder (mätt)

| Fil | Exporterar | Importerar (utöver typer) |
|---|---|---|
| `AngLager.tsx` | `AngLager` | `brygga` (`../brygga.ts`); `HUMOR_IKON, sovText, sparaFoto, ALBUM, poangAv` (`../liv.ts`); `useMinne` (`../minne.ts`); `Heart` (`lucide-react`); `dukStil` (`./hjalp.ts`); `FIR, TEXTER` (`./spelData.ts`) |
| `KartaLager.tsx` | `KartaLager`, `OmradeHud` | `OMR, TEXTER_AV` (`../aventyr.ts`); `TEXTER` (`./spelData.ts`) |
| `Hud.tsx` | `Hud`, `MenyPanel`, `HudBot` | `fyll` (`../fyll.ts`); `Lock, Pencil` (`lucide-react`); `ALBUM` (`../liv.ts`); `OMR, UPP` (`../aventyr.ts`); `introJson` (`../../../data/intro.json`, med `with { type: "json" }`); `HoldOppnare` (`./HoldOppnare.tsx`); `FIR, TEXTER` (`./spelData.ts`) |
| `BokSkarm.tsx` | `BokSkarm` | `Pencil, Lock` (`lucide-react`); `fyll`; `VILDA, TEXTER_AV, UPP` (`../aventyr.ts`); `upplevelse` (`../../../data/upplevelse.json`); `OnskaAnsikte` (`./OnskaAnsikte.tsx`); `FIR, FLIKAR, RADER, TEXTER` (`./spelData.ts`); `bestamdAv, kortIkon, kanEtikett, frasForByggOrd` (`./hjalp.ts`) |
| `Dialoger.tsx` | `SkyltDialog`, `ValjDjurDialog`, `VisKortDjur`, `VisKortBygg`, `KopDialog`, `MossaPanel` | `FormelBild` (`../formel.tsx`); `sparaFoto, ALBUM, poangAv, MOSSA` (`../liv.ts`); `fyll`; `FIR` (`./spelData.ts`) |
| `OrdbokDialog.tsx` | `OrdbokDialog` | `fyll`; `useMinne`; `replik` (`../replik.ts`); `FIR, SIDOR` (`./spelData.ts`); `djurPris, streck` (`./hjalp.ts`) |
| `ForalderDialog.tsx` | `ForalderDialog` | `ForalderLiv` (`../samling.tsx`); `useMinne`; `ljud` (`../ljud.ts`); `LJUD_PA, LJUD_AV, TEXTER` (`./spelData.ts`) |

### 5.3 Komponenter, anrop och props

Villkorsrader (orig): `kartaOpp` r.2248 (inre 2249–2275, slut `) : null}` r.2276) · `omrade && !kartaOpp` r.2277 (2278–2285, slut 2286) · `bokOpp` r.2432 (2433–2733, slut 2734) · `skylt` r.2736 (2737–2751, 2752) · `valj` r.2754 (2755–2768, 2769) · `visKort?.slag === "djur"` r.2771 (2772–2797, 2798) · `visKort?.slag === "bygg"` r.2800 (2801–2810, 2811) · `ordbok` r.2813 (2814–2930, 2931) · `kop` r.2933 (2934–2946, 2947) · `foralder` r.2949 (2950–3064, 3065) · `mossaOpp` r.3066 (3067–3085, 3086). `{albumOpp ? <AlbumVy … /> : null}` (r.3087) stannar som den är.

#### `AngLager` (utan villkor)
Fil `src/spel/ui/AngLager.tsx` · inre JSX r.2091–2247 (hela `div.ang-lager`) (orig `37913b3`) · anrop i `Spel.tsx`: `<AngLager … />` i stället för r.2091–2247

| prop | typ (från `tsc`, deklarationen i `Spel()`) |
|---|---|
| `natt` | `number` |
| `varld` | `Varld` |
| `omrade` | `string \| null` |
| `panel` | `"spel" \| "byggbok" \| "uppdrag"` |
| `ang` | `Sparad[]` |
| `hemma` | `Hemdjur[]` |
| `liv` | `Record<string, { humor: string; humorMs: number; humorLangd: number; favorit: string; favoritHittad: boolean; hjartan: number; }>` |
| `fotoMal` | `{ uid: string; x: number; y: number; } \| null` |
| `visaBanner` | `(texten: string, slag: Banner["slag"]) => void` |
| `visaMossa` | `(h: Parameters<typeof mossaHand>[0]) => void` |
| `setFotoMal` | `Dispatch<SetStateAction<{ uid: string; x: number; y: number; } \| null>>` |
| `banners` | `Banner[]` |
| `bubblor` | `Bubbla[]` |
| `onskan` | `OnskaSpar \| null` |
| `onskaOpp` | `boolean` |
| `onskaSyns` | `boolean` |
| `ank` | `{ x: number; y: number; vanster: boolean; }` |
| `oppnaOnska` | `() => void` |
| `meny` | `{ uid: string; x: number; y: number; } \| null` |
| `setMeny` | `Dispatch<SetStateAction<{ uid: string; x: number; y: number; } \| null>>` |
| `omUidRef` | `RefObject<string \| null>` |
| `setLage` | `Dispatch<SetStateAction<Lage>>` |
| `setBokOpp` | `Dispatch<SetStateAction<boolean>>` |
| `setLadaOpp` | `Dispatch<SetStateAction<boolean>>` |
| `menyHem` | `{ kroppar: string[]; platser: number; } \| null \| undefined` |
| `setBoUid` | `Dispatch<SetStateAction<string \| null>>` |
| `lada` | `SparatBygge[]` |
| `ladaOpp` | `boolean` |
| `boUid` | `string \| null` |
| `boDjur` | `Sparad[]` |
| `flyttaInDjur` | `(djurUid: string) => void` |

#### `KartaLager`
Fil `src/spel/ui/KartaLager.tsx` · inre JSX r.2249–2275 (orig `37913b3`) · anrop i `Spel.tsx`: `{kartaOpp ? <KartaLager … /> : null}`

| prop | typ (från `tsc`, deklarationen i `Spel()`) |
|---|---|
| `forstaRad` | `string[] \| null` |
| `kartaText` | `string \| null` |
| `tryckPlats` | `(id: string) => void` |
| `oppna` | `string[]` |

#### `OmradeHud`
Fil `src/spel/ui/KartaLager.tsx` · inre JSX r.2278–2285 (orig `37913b3`) · anrop i `Spel.tsx`: `{omrade && !kartaOpp ? <OmradeHud … /> : null}`

| prop | typ (från `tsc`, deklarationen i `Spel()`) |
|---|---|
| `tryckPlats` | `(id: string) => void` |
| `bytFolje` | `() => void` |

#### `Hud` (utan villkor; innehåller `<HoldOppnare … />`)
Fil `src/spel/ui/Hud.tsx` · inre JSX r.2287–2327 (orig `37913b3`) · anrop i `Spel.tsx`: `<Hud … />`

| prop | typ (från `tsc`, deklarationen i `Spel()`) |
|---|---|
| `haller` | `boolean` |
| `setHaller` | `Dispatch<SetStateAction<boolean>>` |
| `setForalder` | `Dispatch<SetStateAction<boolean>>` |
| `stjarnor` | `number` |
| `hittatAntal` | `number` |
| `totalOrd` | `number` |
| `menyOpp` | `boolean` |
| `setMenyOpp` | `Dispatch<SetStateAction<boolean>>` |
| `setMenySaker` | `Dispatch<SetStateAction<boolean>>` |
| `setSenare` | `Dispatch<SetStateAction<boolean>>` |

#### `MenyPanel` (får `menyOpp`, innehåller båda villkorsuttrycken)
Fil `src/spel/ui/Hud.tsx` · inre JSX r.2328–2405 (båda `{menyOpp ? … : null}`) (orig `37913b3`) · anrop i `Spel.tsx`: `<MenyPanel … />`

| prop | typ (från `tsc`, deklarationen i `Spel()`) |
|---|---|
| `setMenyOpp` | `Dispatch<SetStateAction<boolean>>` |
| `setMenySaker` | `Dispatch<SetStateAction<boolean>>` |
| `setSenare` | `Dispatch<SetStateAction<boolean>>` |
| `senare` | `boolean` |
| `panel` | `"spel" \| "byggbok" \| "uppdrag"` |
| `varld` | `Varld` |
| `valjVarld` | `(id: "ang" \| "gard" \| "byggbok") => void` |
| `lasMeny` | `() => void` |
| `setBokOpp` | `Dispatch<SetStateAction<boolean>>` |
| `oppnaKarta` | `() => void` |
| `setIntroNy` | `Dispatch<SetStateAction<number>>` |
| `setIntro` | `Dispatch<SetStateAction<boolean>>` |
| `menySaker` | `boolean` |
| `borjaOm` | `() => void` |
| `menyOpp` | `boolean` |

#### `HudBot` (utan villkor)
Fil `src/spel/ui/Hud.tsx` · inre JSX r.2406–2429 (orig `37913b3`) · anrop i `Spel.tsx`: `<HudBot … />`

| prop | typ (från `tsc`, deklarationen i `Spel()`) |
|---|---|
| `varld` | `Varld` |
| `omrade` | `string \| null` |
| `kartaOpp` | `boolean` |
| `oppnaBygglage` | `() => void` |
| `setPanel` | `Dispatch<SetStateAction<"spel" \| "byggbok" \| "uppdrag">>` |
| `setBokOpp` | `Dispatch<SetStateAction<boolean>>` |

#### `BokSkarm`
Fil `src/spel/ui/BokSkarm.tsx` · inre JSX r.2433–2733 (`div.bok-skarm` med rubrik, kortläge, uppdragsflik och byggbok) (orig `37913b3`) · anrop i `Spel.tsx`: `{bokOpp ? <BokSkarm … /> : null}`
Obs: `stangBok`, `andrar`, `fyllExempel`, `valjForslag` m.fl. är funktioner/värden som fortsatt **bor i `Spel()`**.
| prop | typ (från `tsc`, deklarationen i `Spel()`) |
|---|---|
| `stangBok` | `() => void` |
| `andrar` | `boolean` |
| `panel` | `"uppdrag" \| "spel" \| "byggbok"` |
| `lage` | `Lage` |
| `setLage` | `Dispatch<SetStateAction<Lage>>` |
| `setForslag` | `Dispatch<SetStateAction<Forslag \| null>>` |
| `byggPuff` | `string \| null` |
| `onskaOpp` | `boolean` |
| `onskan` | `OnskaSpar \| null` |
| `onskaSyns` | `boolean` |
| `onskaDjur` | `Sparad \| undefined` |
| `onskaEx` | `string[]` |
| `fyllExempel` | `(ex: string) => void` |
| `gavaTill` | `string \| null` |
| `ang` | `Sparad[]` |
| `hemma` | `Hemdjur[]` |
| `varld` | `Varld` |
| `forslag` | `Forslag \| null` |
| `valjForslag` | `(kortet: ForslagKort) => void` |
| `nejForslag` | `() => void` |
| `behover` | `{ text: string; djur: { id: string; visa: string; }[]; } \| null` |
| `utfor` | `(raw: string, opt: { hand: boolean; inteGuld?: string[]; }) => void` |
| `flik` | `Slot` |
| `onskaKort` | `Ord[]` |
| `setFlik` | `Dispatch<SetStateAction<Slot>>` |
| `kort` | `Ord[]` |
| `val` | `Partial<Record<Slot, Ord>>` |
| `onskaIds` | `Set<string>` |
| `kortGang` | `Record<string, number>` |
| `valjKort` | `(ord: Ord) => void` |
| `oppnaSkrivMig` | `(ord: Ord) => void` |
| `text` | `string` |
| `omrade` | `string \| null` |
| `visaOnskaHjalp` | `boolean` |
| `vaknaNu` | `() => void` |
| `vaknaText` | `string` |
| `skrivTecken` | `(bit: string) => void` |
| `sudda` | `() => void` |
| `uppFlik` | `"pagar" \| "klar"` |
| `setUppFlik` | `Dispatch<SetStateAction<"pagar" \| "klar">>` |
| `uppdragSpar` | `Record<string, "pagar" \| "klar">` |
| `byggSida` | `SidaBygg` |
| `agdaSidor` | `SidaBygg[]` |
| `setByggSidaId` | `Dispatch<SetStateAction<string>>` |
| `setByggPuff` | `Dispatch<SetStateAction<string \| null>>` |
| `byggFras` | `(fras: string) => void` |
| `kopRad` | `string \| null` |
| `lastaSidor` | `SidaBygg[]` |
| `forsokKop` | `(slag: "djur" \| "bygg", id: string, titel: string, pris: number) => void` |

#### `SkyltDialog`
Fil `src/spel/ui/Dialoger.tsx` · inre JSX r.2737–2751 (orig `37913b3`) · anrop i `Spel.tsx`: `{skylt ? <SkyltDialog skylt={skylt} setSkylt={setSkylt} /> : null}`

| prop | typ (från `tsc`, deklarationen i `Spel()`) |
|---|---|
| `skylt` | `{ text: string; nytt: string \| null; }` |
| `setSkylt` | `Dispatch<SetStateAction<{ text: string; nytt: string \| null; } \| null>>` |

#### `ValjDjurDialog`
Fil `src/spel/ui/Dialoger.tsx` · inre JSX r.2755–2768 (orig `37913b3`) · anrop i `Spel.tsx`: `{valj ? <ValjDjurDialog … /> : null}`

| prop | typ (från `tsc`, deklarationen i `Spel()`) |
|---|---|
| `valj` | `{ rubrik: string; eller?: string; djur: Sparad[]; nyckel: string; }` |
| `valjKor` | `RefObject<(d: Sparad) => void>` |
| `setValj` | `Dispatch<SetStateAction<{ rubrik: string; eller?: string; djur: Sparad[]; nyckel: string; } \| null>>` |

#### `VisKortDjur`
Fil `src/spel/ui/Dialoger.tsx` · inre JSX r.2772–2797 (orig `37913b3`) · anrop i `Spel.tsx`: `{visKort?.slag === "djur" ? <VisKortDjur … /> : null}`

| prop | typ (från `tsc`, deklarationen i `Spel()`) |
|---|---|
| `visKort` | `VisKort` |
| `visaBanner` | `(texten: string, slag: Banner["slag"]) => void` |
| `visaMossa` | `(h: Parameters<typeof mossaHand>[0]) => void` |
| `setVisKort` | `Dispatch<SetStateAction<VisKort>>` |

#### `VisKortBygg`
Fil `src/spel/ui/Dialoger.tsx` · inre JSX r.2801–2810 (orig `37913b3`) · anrop i `Spel.tsx`: `{visKort?.slag === "bygg" ? <VisKortBygg … /> : null}`

| prop | typ (från `tsc`, deklarationen i `Spel()`) |
|---|---|
| `visKort` | `VisKort` |
| `setVisKort` | `Dispatch<SetStateAction<VisKort>>` |

#### `OrdbokDialog`
Fil `src/spel/ui/OrdbokDialog.tsx` · inre JSX r.2814–2930 (orig `37913b3`) · anrop i `Spel.tsx`: `{ordbok ? <OrdbokDialog … /> : null}`

| prop | typ (från `tsc`, deklarationen i `Spel()`) |
|---|---|
| `hittatAntal` | `number` |
| `totalOrd` | `number` |
| `stjarnor` | `number` |
| `kopRad` | `string \| null` |
| `koptaSidor` | `string[]` |
| `funna` | `Record<string, { guld: boolean; }>` |
| `sidOpp` | `string \| null` |
| `forsokKop` | `(slag: "djur" \| "bygg", id: string, titel: string, pris: number) => void` |
| `setSidOpp` | `Dispatch<SetStateAction<string \| null>>` |
| `textRef` | `RefObject<string>` |
| `setText` | `Dispatch<SetStateAction<string>>` |
| `setHand` | `Dispatch<SetStateAction<boolean>>` |
| `setLage` | `Dispatch<SetStateAction<Lage>>` |
| `setOrdbok` | `Dispatch<SetStateAction<boolean>>` |
| `kvar` | `number` |
| `hittade` | `Ord[]` |
| `hemliga` | `Ord[]` |
| `formler` | `{ text: string; spec: Sparad; }[]` |
| `setVisKort` | `Dispatch<SetStateAction<VisKort>>` |
| `sovande` | `Sparad[]` |
| `visaBanner` | `(texten: string, slag: Banner["slag"]) => void` |

#### `KopDialog`
Fil `src/spel/ui/Dialoger.tsx` · inre JSX r.2934–2946 (orig `37913b3`) · anrop i `Spel.tsx`: `{kop ? <KopDialog … /> : null}`

| prop | typ (från `tsc`, deklarationen i `Spel()`) |
|---|---|
| `kop` | `KopFraga` |
| `bekraftaKop` | `() => void` |
| `setKop` | `Dispatch<SetStateAction<KopFraga \| null>>` |

#### `ForalderDialog`
Fil `src/spel/ui/ForalderDialog.tsx` · inre JSX r.2950–3064 (orig `37913b3`) · anrop i `Spel.tsx`: `{foralder ? <ForalderDialog … /> : null}`

| prop | typ (från `tsc`, deklarationen i `Spel()`) |
|---|---|
| `startLage` | `Lage` |
| `setLage` | `Dispatch<SetStateAction<Lage>>` |
| `ljudPa` | `boolean` |
| `sparaKopia` | `() => void` |
| `filRef` | `RefObject<HTMLInputElement \| null>` |
| `lasFil` | `(fil: File) => Promise<void>` |
| `foralderRad` | `string \| null` |
| `kopia` | `unknown` |
| `lasInKopia` | `() => void` |
| `setKopia` | `Dispatch<unknown>` |
| `onskelista` | `string[]` |
| `setSaker` | `Dispatch<SetStateAction<boolean>>` |
| `saker` | `boolean` |
| `borjaOm` | `() => void` |
| `setForalder` | `Dispatch<SetStateAction<boolean>>` |

#### `MossaPanel`
Fil `src/spel/ui/Dialoger.tsx` · inre JSX r.3067–3085 (orig `37913b3`) · anrop i `Spel.tsx`: `{mossaOpp ? <MossaPanel … /> : null}`

| prop | typ (från `tsc`, deklarationen i `Spel()`) |
|---|---|
| `halsning` | `string` |
| `mossaLista` | `{ id: string; klar: boolean; }[]` |
| `mossaExtra` | `boolean` |
| `setMossaOpp` | `Dispatch<SetStateAction<boolean>>` |


### 5.4 Vilka `useState` som används av vilka komponenter (värde eller setter)

`useState` (49 st) stannar alla i `Spel()`. Varje komponent får bara det den använder:

| useState | används av |
|---|---|
| `text` | BokSkarm, OrdbokDialog |
| `lage` | AngLager, BokSkarm, ForalderDialog, OrdbokDialog |
| `flik`, `val`, `forslag`, `behover`, `gavaTill`, `uppFlik`, `byggSidaId`, `byggPuff` | BokSkarm |
| `hand` | OrdbokDialog |
| `bubblor`, `banners`, `natt`, `fotoMal`, `meny`, `boUid`, `ladaOpp` | AngLager |
| `visKort` | OrdbokDialog, VisKortBygg, VisKortDjur |
| `ordbok`, `sidOpp` | OrdbokDialog |
| `foralder` | ForalderDialog, Hud |
| `foralderRad`, `kopia`, `saker` | ForalderDialog |
| `mossaOpp`, `halsning` | MossaPanel |
| `haller` | Hud |
| `bokOpp` | AngLager, HudBot, MenyPanel |
| `menyOpp` | Hud, MenyPanel |
| `intro`, `introNy` | MenyPanel |
| `menySaker`, `senare` | Hud, MenyPanel |
| `varld`, `panel` | AngLager, BokSkarm, HudBot, MenyPanel |
| `omrade` | AngLager, BokSkarm, HudBot |
| `kartaOpp` | HudBot |
| `forstaRad`, `kartaText` | KartaLager |
| `skylt` | SkyltDialog |
| `valj` | ValjDjurDialog |
| `kop` | KopDialog |
| `kopRad` | BokSkarm, OrdbokDialog |
| `onskaOpp`, `onskaSyns` | AngLager, BokSkarm |
| `albumOpp`, `onskaPos`, `skriverAv` | bara `Spel()` (handlers) |

### 5.5 Ordning, DoD och inställningar för R1B (utkast)

Steg i tur och ordning, commit efter varje: (1) `AngLager`, (2) `KartaLager.tsx` + `Hud.tsx`, (3) `BokSkarm`, (4) `Dialoger.tsx`, (5) `OrdbokDialog` + `ForalderDialog`, (6) efter-bevis, (7) `RUNDAR1B.md`. Efter varje steg `typecheck:pages` grön.
- **DoD:** `npm run check:struktur` (steg b) grön; `typecheck:pages` grön; `test:product` 75/75 (Node ≥ 22.6); `--jamfor fore1 fore2 efterB` exit 0 mot de i R1A incheckade `dom-fore`; fyra bilder `docs/skarmbilder/r1/efter-<läge>.png` mot `fore-<läge>.png` (granskas av Arkitekten, ej pixelkrav); `rg -o "kropp ===" src/spel | wc -l` = 141; `git diff origin/main --stat -- data src/tolk` tomt; `RUNDAR1B.md` skriven.
- **Inställningar:** `--max-turns 40`, `grok-4.7-build-fast`, `--reasoning-effort low`. Om R1A tog över 28 turer: dela i **B1** (steg 1–2) och **B2** (steg 3–6).
- **Förväntat resultat:** `Spel.tsx` ca 1 960 rader (gissning ± 60), gräns 2 050.

## 6. Vad som INTE får ändras (båda körningarna)

1. **Beteende:** inget `onClick`/`onPointerDown`/`useEffect`-innehåll, inga villkor, inga ordningsföljder, inga texter, inga `className`, `aria-*`, `role`, `data-*`, `key`, `style`-uttryck. Kod flyttas **ordagrant**.
2. **Tillstånd:** alla 49 `useState`, 21 `useRef`, 20 `useMinne`-selektorer, 48 funktioner och 9 effekter stannar i `Spel()` med oförändrad ordning. Inga nya tillstånd, inga hooks i nya filer (utom de som redan fanns i `OnskaAnsikte` och `HoldOppnare`).
3. **Testkrokar:** `window.__troll` (25 funktioner, r.1744–1975) och `declare global` (r.3103–3133) rörs inte. `window.__tred`/`__tredMal` i `angen3d.tsx` rörs inte.
4. **Data och tolkning:** `data/**`, `src/tolk/**` – `git diff origin/main --stat -- data src/tolk` ska vara **tomt**.
5. **Andra spelfiler:** `angen3d.tsx`, `scen.ts`, `gard.ts`, `avscen.ts`, `ritaBygg.ts`, `minne.ts`, `lagring.ts`, `liv.ts`, `aventyr.ts` m.fl. rörs inte. Endast `Spel.tsx`, `src/spel/ui/**`, de två skripten, `package.json` (två rader) och dokument/bilder får ändras (DoD punkt 5).
6. **Namn:** `export function Spel()` och exporten `Spel` (importeras av `src/routes/index.tsx` och `src/pages-main.tsx`) oförändrade.
7. **Ingen** `npm run build` (kör `db:migrate`), ingen push, ingen PR, ingen ändring av `main`, ingen ny beroende (`package.json` `dependencies` orörda).
8. **Ingen mätning/utforskning i Build**: radnummer, namn och typer står här. Hittar du en avvikelse: STOPP (avsnitt 10), gissa inte.

## 7. Bevisning

### 7.1 Strukturvakt `npm run check:struktur` (röd före, grön efter)
`scripts/check-spel-struktur.mjs` (skriven och provkörd av Arkitekten, `rundor/R1-dela-spel/check-spel-struktur.mjs`) kontrollerar fem saker: (1) radantal i `Spel.tsx` (steg a ≤ 2 800, steg b ≤ 2 050), (2) mängden `data-testid` i `src/spel/**/*.tsx` är identisk med `rundor/R1-dela-spel/testid-baslinje.json`, (3) inga oanvända importer i `Spel.tsx` och `ui/**`, (4) ingen fil i `ui/` importerar `Spel.tsx`, (5) alla krävda `ui/`-filer finns.
**Provkörning på `37913b3` (före):** `steg a: Spel.tsx: 3133 rader (gräns 2800); data-testid: 124 olika, 126 förekomster; ui-filer: 0` → **RÖD** (radantal + 5 filer saknas); steg b likaså (12 filer). Baslinjen är mätt: **124 olika `data-testid` i 126 JSX-förekomster** (102 i `Spel.tsx`, 13 `samling.tsx`, 7 `intro.tsx`, 4 `angen3d.tsx`). Dynamiska testid (`plats-${o.id}` m.fl.) räknas som uttryck.

### 7.2 Typkontroll, lint
`npm run typecheck:pages` = `tsc --noEmit -p tsconfig.pages.json`; **baslinje 0 fel (6 s)** på `37913b3`; täcker `src/spel/**` inklusive `ui/`. `npx eslint src/spel/Spel.tsx src/spel/ui`: baslinje i `Spel.tsx` 0 fel, 4 varningar; efter: 0 fel, inga nya varningstyper (varningarna om `react-hooks/exhaustive-deps` finns redan).

### 7.3 Enhetstester
`npm run test:product` med **Node ≥ 22.6** (avsnitt 8): baslinje **75/75 gröna, 0,27 s** (Node 22.23.3, `37913b3`). Obs: testerna täcker `tolk`, `onska`, `lagring`, `ideer`, `texturKo`, `dialogIsolering` – **inte `Spel.tsx`**. De bevisar därför bara att tolkning och lagring är orörda, inte att flytten är ren. Flyttens renhet bevisas av 7.1, 7.2 och 7.4.

### 7.4 DOM-tur före/efter (`verification/r1-dom-tur.mjs`)
Spelar 20 lägen i en riktig webbläsare (375×812, touch) via `window.__troll` och `data-testid`: `start, ang-djur, bok-kort, bok-skriv, bok-forslag, bok-behover, meny, meny-last, karta, skogen-valj, skogen, ordbok, foralder, album, formel, onska, onska-bok, gard, gard-bygger, gard-bok`. Varje läge startar från tömd lagring + ny sidladdning. Skriptet sparar den **normaliserade DOM:en** (3D-canvas, dygnstid, slumpade humör-ikoner, uid, stjärnantal och tidsstyrda banderoller/bubblor är bortnormaliserade) och en skärmbild per läge.
- **Före:** två körningar av *oförändrad* kod (`fore1`, `fore2`). Lägen där de två skiljer sig är *ostabila* (slump i spelet) och räknas inte.
- **Efter:** en körning (`efterA`/`efterB`). `--jamfor fore1 fore2 efter` ger exit 0 bara om **minst 12 lägen är stabila och alla stabila är identiska** med efter.
- **Vad den inte täcker (ärligt):** uppdragsvyn (`panel === "uppdrag"` har ingen ingång i UI:t), `SkyltDialog`, `MossaPanel`, `KopDialog`, byggmenyn, lådan, bo-panelen, `valj-djur` med flera djur, och tidsstyrda banderoller/bubblor. De täcks av typkontroll (rätt props och typer) och av att koden flyttas ordagrant; se osäkerheter (avsnitt 11).
- **Provkörd av Arkitekten** mot den publicerade (äldre) versionen, tre körningar i rad: **20 av 20 lägen identiska i alla tre, 0 sidfel**. Två lägen (`skogen-valj`, `skogen`) misslyckas på den äldre versionen (äventyrsknappen är låst där) och är identiska även som fel. Två tidigare skriptversioner var inte stabila (stjärnantal, plattformens `data-grok-*`-attribut, en slumpad "ge en gåva"-ruta som smittade senare lägen); därför normaliseras det första två och varje läge startar nu från rent spel. **Den är inte körd mot `main`:s byggda version** (jag får inte bygga); se osäkerheter.

### 7.5 Webbläsare
Skriptet läser `CHROMIUM_PATH` om satt, annars Playwrights egen Chromium. `verification/browser-B02R-3.mjs` (från Copilots import) pekar på `/opt/pw-browsers/chromium-1208/chrome-linux64/chrome`; om den finns i Builds miljö är det rätt värde. Sätt `CHROMIUM_PATH` om den filen finns. Saknas webbläsare: kör **inte** installation; hoppa över tur-stegen, skriv "DOM-tur ej körd: ingen webbläsare" i `RUNDAR1A.md` och fortsätt med resten (Arkitekten kör touren själv).

### 7.6 Bilder (granskas av Arkitekten, mänskligt öga)
Fyra lägen, före och efter, 375×812: `02-ang-djur`, `03-bok-kort`, `07-meny`, `12-ordbok` → `docs/skarmbilder/r1/fore-*.png` (R1A) och `efter-*.png` (R1B). Pixellikhet krävs inte (ängen är animerad); layout, texter och knappar ska vara desamma. Bilder ensamma är inte bevis; DOM-turen är det.

### 7.7 Grundtanke-mått
Före/efter: `git diff origin/main --stat -- data src/tolk` = tomt; täckningstalen i `PROJECT.md` avsnitt 11 oförändrade (parser orörd). Strukturtal: `Spel.tsx` 3 133 → 2 740 (R1A, mätt i provkörning) → ca 1 960 (R1B, gissning); `useState` i `Spel.tsx` 49 → 49; `kropp ===` 141 → 141.

## 8. Node-krav (≥ 22.6) för `test:product`

`test:product` kör `node --experimental-strip-types`. **Node 20.19.2 (Builds miljö i 4D) ger `node: bad option: --experimental-strip-types`** (mätt). Gör så här:
```bash
node -v    # skriv in RUNDAR1A.md
# om < 22.6:
mkdir -p /tmp/n22 && (cd /tmp/n22 && npm init -y >/dev/null && npm i node@22)
PATH=/tmp/n22/node_modules/.bin:$PATH npm run test:product
```
Provat av Arkitekten: `npm i node@22` ger Node 22.23.3 på ca 4 s utan att röra repot; `test:product` → 75/75. Strukturvakten och DOM-turen kräver inte Node 22 (de kör på Node 18+). Ändra inte `package.json` (ingen `engines`-rad i R1; Cloudflare-bygget påverkas inte).

## 9. Storlek, kostnad, inställningar

| | R1A | R1B |
|---|---|---|
| Ändringar i ritningen | 10 | 11 |
| `--max-turns` | **35** (2–3 × 10 + 10 = 30–40) | **40** (2–3 × 11 + 10 = 32–43) |
| Modell / ansträngning | `grok-4.7-build-fast`, `--reasoning-effort low` (skillen: smala körningar; alla radnummer och typer ges, inget att resonera om) | samma |
| Förväntade turer **(gissning)** | 25–32 | 30–38 |
| Kostnad **(gissning)** | 1–2 USD | 1,5–3 USD |
| Kontext | `Spel.tsx` läses en gång (≈ 113 kB) | läses en gång; komponentfiler är små |

Kostnaderna är min gissning utifrån `rounds.tsv` (5A: 30 turer medium 2,92 USD; 4E: 11 turer low 0,52 USD; 5B: 40 turer ≈ 1 USD som misslyckades av för stor beställning). Kvoten är okänd: kontrollera `/usage` före (skillen `grok-build-cli`). Summa R1: **ca 2,5–5 USD (gissning)**, högre än `PROJECT.md`:s 2–3 USD, eftersom rundan nu är mätt och delad.

Kör (efter att Arkitekten/Christoffer sagt ja till körning; denna ritning kör inget):
```bash
export PATH=$PATH:~/.grok/bin; cd /workspace/trollpennan-repo
git fetch origin && git switch -c runda-r1a origin/main
grok --prompt-file rundor/R1-dela-spel/PROMPT.md --cwd /workspace/trollpennan-repo --trust \
  --output-format json --max-turns 35 -m grok-4.7-build-fast --reasoning-effort low --always-approve \
  > /workspace/runda-r1a.json 2> /workspace/runda-r1a.err
```
(Flaggorna kontrollerade mot `grok --help` v1.0.62: `--prompt-file`, `--max-turns`, `--output-format`, `-m`, `--reasoning-effort`, `--always-approve`, `--cwd`. Skillens exempel skriver `grok -p --prompt-file …`, men enligt `--help` tar `-p` själv en prompttext, så `-p` utelämnas här. `--trust` finns i skillen men syns inte i `--help`-utskriften: bekräfta före körning, annars laddas inte `AGENTS.md`.) Timeout 40 min. Efter körning: granska mot DOM-jämförelse och bilder, inte mot Builds egen rapport; skriv `rounds.tsv`.

## 10. Stoppvillkor och fallback

**Stoppa direkt, skriv `RUNDAR1A.md` med orsaken och lämna grenen opushad, om:**
1. `git diff 37913b3 -- src` är inte tomt vid start (radnumren stämmer inte).
2. Något ankare i 4.2-tabellen (rad 83, 102, 104, 166, 168, 204, 206, 226, 228, 464, 466, 3092, 3101) inte börjar med angiven text.
3. Efter 8 turer har ingen källfil ändrats (`git status`).
4. `typecheck:pages` har fel efter tre rättningsförsök i samma steg → `git restore` det steget, behåll tidigare gröna commits.
5. Något bevis kan bara bli grönt genom att ändra beteende, text, `className` eller `data-testid` → stopp; ändra inte koden för att få grönt.
6. Transport-/API-fel upprepas: vänta inte själv; avsluta (Arkitekten väntar 5 min och kör om en gång, skillen).
**Fallback (viktigast först):** steg 4 (flytten) är det som räknas. Är turerna nästan slut: skriv `RUNDAR1A.md` först, sedan klart delmål. Kan DOM-turen inte köras (ingen webbläsare, tidsbrist) är R1A ändå mergbar om steg 1, 2, 4 och punkt 1–3 i DoD är gröna; Arkitekten kör då turen själv.

## 11. Osäkerheter (ärligt)

1. **Skripten är inte körda mot `main`:s bygge** (jag får inte bygga). `check-spel-struktur.mjs` är provkörd på `37913b3` (röd som väntat). `r1-dom-tur.mjs` är provkörd mot den publicerade, äldre versionen (där `ut-pa-aventyr` och några lägen skiljer sig), inte mot `main`. Förväntat: alla 20 lägen nås på `main` (kodläst: `ut-pa-aventyr` är olåst, r.2381–2385; `browser-B02R-3.mjs` använder samma väg), men det är inte bevisat.
2. **Slumpen i spelet** (vilda djur, humör, dygn) kan göra fler lägen ostabila än de få jag såg; kravet "minst 12 stabila av 20" är mitt val.
3. **Storlek efter R1B** (ca 1 960 ± 60) är en uppskattning; om `Spel.tsx` hamnar över 2 050 efter att alla block flyttats betyder det att propparna kräver fler rader än jag räknat: då höjs gränsen med skäl i `RUNDAR1B.md`, inte genom att trixa med radbrytningar.
4. **Typutskrifterna** kommer från `tsc` med `tsconfig.pages.json`; små skillnader (t.ex. `RefObject` mot `MutableRefObject`, `Dispatch<unknown>`) är noterade i 5.1.
5. **Kostnad/turer** är gissningar; `rounds.tsv` saknar kostnad för den här sortens ren flytt.
6. **Okontrollerat:** att Build-miljön har en Playwright-webbläsare, och att `--trust` är en giltig flagga i CLI 1.0.62 (syns inte i `--help`).
7. **Mätskripten** (`mat/*.mjs`) använder TypeScript-kompilatorn i repots `node_modules` och är endast till för att kunna återskapa siffrorna; de ändrar inget.

## 12. Bilaga: återskapa siffrorna (alla skript läser bara)

```bash
cd /workspace/trollpennan-repo
node rundor/R1-dela-spel/mat/props.mjs '[{"namn":"KartaLager","cond":2248}]'   # props + typer per JSX-block
node rundor/R1-dela-spel/mat/helpmap.mjs                                         # vilka hjälpfunktioner används var
node rundor/R1-dela-spel/check-spel-struktur.mjs --steg a                        # röd före
rg -o "kropp ===" src/spel | wc -l                                               # 141
npx tsc --noEmit -p tsconfig.pages.json                                          # 0 fel
```
