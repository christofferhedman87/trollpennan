# R1 – Ritning: dela `Spel.tsx` (ren flytt, noll beteendeändring)

Skriven av Arkitekten 2026-10-18. Bas: `origin/main` = `37913b3` (PR #12). Allt här är **läst och mätt** i den koden; mätskript finns i `rundor/R1-dela-spel/mat/`. Gissningar är märkta **(gissning)**. Prompten till Build: `PROMPT.md` (körning R1A, genomförd) och `PROMPT-R1B.md` (körning R1B, skriven 2026-10-18 efter granskning av R1A; bas `89fd859`). Avsnitt 5 och 7–11 är uppdaterade efter R1A; avsnitt 3 och 4 beskriver läget före R1A (`37913b3`) och är historik.

## 0. Grindutlåtande (skillen `build-round-gate`, 7 punkter)

**Utlåtande R1A: genomförd** (PR #14, `89fd859`, granskad i 4.7). **Utlåtande R1B: JA** (alla sju punkter nedan, kolumnen R1B; prompten är `PROMPT-R1B.md`, blueprinten är provkörd i en skräpkopia: 0 typfel, 28 av 28 DOM-lägen identiska). Rundan är uppdelad i två körningar, se avsnitt 2.

| # | Punkt | Status | Belägg |
|---|---|---|---|
| 1 | Projektkarta aktuell | **Ja** | `PROJECT.md` mergad i PR #12 (`37913b3`); den här PR:n rättar R1-blocket (radnummer, mål) efter mätning |
| 2 | Återanvändning kontrollerad | **Ja** | Inget i repot gör detta redan: ingen av de 13 grenarna (lokala och `origin/*`) har någon fil under `src/spel/ui/` (`git ls-tree -r --name-only <gren>`, mätt), och `rg '/ui/' src/spel` ger 0 träffar. Återanvänds: befintliga filer `samling.tsx` (`AlbumVy`, `ForalderLiv`), `intro.tsx`, `formel.tsx` stannar där de är |
| 3 | Arkitekturregeln hålls | **Ja** | Rundan lägger inget innehåll; den flyttar ordagrant kod. Ingen ny per-sak-kod (`rg -o "kropp ===" src/spel \| wc -l` ska vara **141 före och 141 efter**) |
| 4 | Ritning i prompten | **Ja** | Exakta rader, filer, signaturer och typer i avsnitt 4–5; `PROMPT.md` pekar på dem |
| 5 | Bevis definierat | **Ja** | `check:struktur` röd→grön, testid-baslinje, `typecheck:pages`, `test:product` (Node ≥ 22.6), DOM-tur före/efter, bilder 375×812 (avsnitt 7) |
| 6 | Inställningar valda | **Ja** | `grok-4.7-build-fast`, `--reasoning-effort low`, `--max-turns 35` (R1A) och `30` (R1B), `--prompt-file`, gren, loggfil (avsnitt 9) |
| 7 | Ett logiskt mål | **Ja** | "Flytta ut data, hjälpfunktioner och JSX-block ur `Spel.tsx` utan att något ändras." Delningen i A och B följer skillens ordning: data/format först, sedan inkoppling |

**Avvikelser från `PROJECT.md` (mätta, rättas i den här PR:n):**
1. Målet "≤ 1 900 rader" var en gissning på felaktiga radnummer (JSX-blocken sitter på r.2091–3087, inte r.2248–3091 som angavs). Min första uppskattning efter R1 var ca 1 960 rader (gissning), gräns ≤ 2 050 (ersatt, se nedan). **Rättat efter R1A-provkörning: R1B ger 1 781 rader (mätt), gräns nu ≤ 1 850** (anropen blev en rad vardera, inte flera). Under ca 1 780 rader kommer `Spel.tsx` först när händelsefunktionerna delas i hooks (R1B-hook, första steget i R4; ingår inte här).
2. "25–30 turer, 2–3 USD" gällde en körning. Mätt omfattning (15 nya filer, 170 props) överstiger skillens gräns (2–3 × antal ändringar + 10 > 40) → två körningar.
3. `kropp ===` är **141 förekomster på 85 rader i 9 filer** (`rg -o "kropp ===" src/spel | wc -l`), inte 116. Siffran kunde inte återskapas; `PROJECT.md` rättas.
5. (Tillkom vid R1B) Prognosen "ca 1 960 rader" var för hög; skriptad flytt ger 1 781. `PROJECT.md` rättas i samma PR som `PROMPT-R1B.md`.
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
| **R1B** (prompt klar: `PROMPT-R1B.md`) | 9 JSX-block (15 komponenter) till 7 filer, med skript | 7 i `src/spel/ui/` | 1 skriptkörning + bevis (skriptet gör de 11 ändringarna) | **30** (R1A tog 23 av 35) | **1 781 (mätt i provkörning, 5.8)**, gräns 1 850 |

R1A var nyttig och säker för sig själv (flyttade bara data och rena funktioner, inget JSX). R1B kunde inte skrivas med säkra radnummer förrän R1A var mergad, eftersom R1A tog bort 393 rader; det är nu gjort (bas `89fd859`). Eftersom R1A visade att en mekanisk flytt (kommandon med radankare) fungerar och R1B har 15 block, är R1B inte handskriven av Build utan körs som ett skript (5.1) som Build bara kör och bevisar.

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

### 4.7 Granskning av R1A (Arkitekten, 2026-10-18, efter merge av PR #14 → `89fd859`)

Allt kört av mig på `origin/main`, läser bara:
| Kontroll | Resultat |
|---|---|
| `check-spel-struktur.mjs --steg a` | GRÖN: 2 740 rader, testid 124/126, 5 ui-filer |
| `tsc --noEmit -p tsconfig.pages.json` | 0 fel |
| `eslint src/spel/Spel.tsx src/spel/ui` | 0 fel, 4 varningar (3 i `Spel()`, 1 i `OnskaAnsikte`, alla fanns före) |
| `rg -o "kropp ===" src/spel \| wc -l` | 141 |
| `git diff 37913b3 origin/main -- data src/tolk public` | tom |
| De fem `ui/`-filerna och `Spel.tsx` mot min provkörning | **byte-identiska** (`cmp`), alltså exakt ritningen |
| `Spel()`-kroppen (r.466–3091 före) mot efter | **identisk** rad för rad (enda skillnaden i intervallet är att `declare global` nu ligger direkt efter funktionen) |
| Min egen byggda `89fd859` + DOM-turen mot de av Build incheckade före-körningarna `fore1`/`fore2` | **20 av 20 stabila och identiska** (oberoende bekräftelse av Builds "efterA"; hans efter-utdata checkades inte in) |

**Avvikelser (alla små, ingen skadade något):**
1. Build körde `medium` i stället för `low` som ritningen sa: 23 turer, 1,04 USD (`rounds.tsv`). Inom ramen (23 av 35 turer).
2. `RUNDAR1A.md` säger "gren `runda-r1a`, inte pushad"; grenen mergades ändå som PR #14 (squash av fyra commits) av Doodle/Christoffer. Rätt beslut eftersom alla bevis var gröna; men prompten sa "pusha inte", och det efterlevdes av Build.
3. `check:struktur` (steg b) är röd på `main` tills R1B är mergad. Den är inte kopplad till något CI (det finns inget `.github/`), så ingenting går sönder; den som kör `npm run check:struktur` ser röd, som tänkt.
4. `scripts/check-spel-struktur.mjs` och `verification/r1-dom-tur.mjs` är kopior av `rundor/R1-dela-spel/…`; i R1B-PR:n är båda uppdaterade och synkade (gräns steg b 1 850; turen har 28 lägen).
5. `verification/r1-dom-tur.mjs` hade 20 lägen; de åtta nya (21–28) har före-körningar (`fore1`/`fore2`) som jag körde mot `89fd859` och checkade in i R1B-PR:n (de gamla 20 är oförändrade: samma hash).

## 5. Körning R1B – körklar blueprint (bas `89fd859`, `Spel.tsx` 2 740 rader)

R1B flyttar de nio JSX-blocken (15 komponenter) ur `Spel()` till sju filer i `src/spel/ui/`. **Allt nedan är mätt på `89fd859` (R1A mergad) och provkört i en skräpkopia utanför repot** (4.7 och 5.8). Prompten är `PROMPT-R1B.md`.

### 5.1 Hur flytten görs: ett skript, inga handpåläggningar

`node rundor/R1-dela-spel/r1b-flytta.mjs` (skrivet och provkört av Arkitekten; datat i `rundor/R1-dela-spel/r1b-plan.json`, återskapas med `mat/r1b-plan-gen.mjs`) gör **allt** i ett svep, och Build ska inte skriva något av detta för hand:

1. Kräver att `Spel.tsx` har exakt 2 740 rader och att inga av de sju filerna finns. Kontrollerar **alla 15 radankare** (första och sista raden i varje block, plus villkorsraden och `) : null}` för de elva villkorade). Avviker något: skriver `STOPP: …` och slutar med **exit 2 utan att ändra något**.
2. Skriver de sju filerna: importer (exakt de som blocken använder, uppmätta med kompilatorn), `type XProps = { … }`, `export function X({ … }: XProps) { return ( <blockets inre JSX ordagrant, byte för byte> ); }`. `MenyPanel` får ett fragment `<> … </>` runt de två syskonuttrycken.
3. Ersätter blocken i `Spel.tsx` nerifrån och upp med **ett anrop vardera**: `<X a={a} b={b} />`; villkoret stannar i `Spel.tsx`: `{kartaOpp ? <KartaLager … /> : null}`.
4. Tar bort de importer i `Spel.tsx` som därmed blivit oanvända (hela satser eller enskilda namn) och lägger till sju nya `./ui/…`-importer efter den sista importen.
5. Skriver ut `Klart: 7 filer skrivna, 15 block ersatta, Spel.tsx har nu 1781 rader.`

Därefter är det *bara bevis* kvar. Build ändrar ingen kod, så länge `typecheck:pages` är grön direkt efter skriptet (den var det i provkörningen). Är den röd: STOPP (avsnitt 10), gissa inte.

### 5.2 Vad skriptet skapar (provkört; rader mätta)

| Fil | Komponenter | Rader | Importer (utöver `react`-typer och `./typer.ts`) |
|---|---|---|---|
| `AngLager.tsx` | `AngLager` | 208 | `Heart` ← `lucide-react`; `brygga` ← `../brygga.ts`; `ALBUM, HUMOR_IKON, poangAv, sovText, sparaFoto` ← `../liv.ts`; `useMinne` ← `../minne.ts`; `dukStil` ← `./hjalp.ts`; `FIR, TEXTER` ← `./spelData.ts` |
| `KartaLager.tsx` | `KartaLager`, `OmradeHud` | 59 | `OMR, TEXTER_AV` ← `../aventyr.ts`; `TEXTER` ← `./spelData.ts` |
| `Hud.tsx` | `Hud`, `MenyPanel`, `HudBot` | 209 | `Lock, Pencil` ← `lucide-react`; `introJson` ← `../../../data/intro.json`; `OMR, UPP` ← `../aventyr.ts`; `fyll` ← `../fyll.ts`; `ALBUM` ← `../liv.ts`; `HoldOppnare` ← `./HoldOppnare.tsx`; `FIR, TEXTER` ← `./spelData.ts` |
| `BokSkarm.tsx` | `BokSkarm` | 370 | `Lock, Pencil` ← `lucide-react`; `upplevelse` ← `../../../data/upplevelse.json`; `TEXTER_AV, UPP, VILDA` ← `../aventyr.ts`; `fyll` ← `../fyll.ts`; `OnskaAnsikte` ← `./OnskaAnsikte.tsx`; `bestamdAv, frasForByggOrd, kanEtikett, kortIkon` ← `./hjalp.ts`; `FIR, FLIKAR, RADER, TEXTER` ← `./spelData.ts` |
| `Dialoger.tsx` | `SkyltDialog`, `ValjDjurDialog`, `VisKortDjur`, `VisKortBygg`, `KopDialog`, `MossaPanel` | 171 | `FormelBild` ← `../formel.tsx`; `fyll` ← `../fyll.ts`; `ALBUM, MOSSA, poangAv, sparaFoto` ← `../liv.ts`; `FIR` ← `./spelData.ts` |
| `OrdbokDialog.tsx` | `OrdbokDialog` | 156 | `fyll` ← `../fyll.ts`; `useMinne` ← `../minne.ts`; `replik` ← `../replik.ts`; `djurPris, streck` ← `./hjalp.ts`; `FIR, SIDOR` ← `./spelData.ts` |
| `ForalderDialog.tsx` | `ForalderDialog` | 144 | `ljud` ← `../ljud.ts`; `useMinne` ← `../minne.ts`; `ForalderLiv` ← `../samling.tsx`; `LJUD_AV, LJUD_PA, TEXTER` ← `./spelData.ts` |

`Spel.tsx` efter skriptet: **1 781 rader** (var 2 740). De sju filerna blir 1 317 rader tillsammans.

### 5.3 De 15 komponenterna (radnummer gäller `89fd859`)

| Komponent | Fil | Block i `Spel.tsx` (villkorsrad / inre JSX) | Anrop i `Spel.tsx` | Props |
|---|---|---|---|---|
| `AngLager` | `AngLager.tsx` | – / 1709–1865 | alltid | 31 |
| `KartaLager` | `KartaLager.tsx` | 1866 / 1867–1893 | `{kartaOpp ? … : null}` | 4 |
| `OmradeHud` | `KartaLager.tsx` | 1895 / 1896–1903 | `{omrade && !kartaOpp ? … : null}` | 2 |
| `Hud` | `Hud.tsx` | – / 1905–1945 | alltid | 10 |
| `MenyPanel` | `Hud.tsx` | – / 1946–2023 | alltid | 15 |
| `HudBot` | `Hud.tsx` | – / 2024–2047 | alltid | 6 |
| `BokSkarm` | `BokSkarm.tsx` | 2050 / 2051–2351 | `{bokOpp ? … : null}` | 49 |
| `SkyltDialog` | `Dialoger.tsx` | 2354 / 2355–2369 | `{skylt ? … : null}` | 2 |
| `ValjDjurDialog` | `Dialoger.tsx` | 2372 / 2373–2386 | `{valj ? … : null}` | 3 |
| `VisKortDjur` | `Dialoger.tsx` | 2389 / 2390–2415 | `{visKort?.slag === "djur" ? … : null}` | 4 |
| `VisKortBygg` | `Dialoger.tsx` | 2418 / 2419–2428 | `{visKort?.slag === "bygg" ? … : null}` | 2 |
| `OrdbokDialog` | `OrdbokDialog.tsx` | 2431 / 2432–2548 | `{ordbok ? … : null}` | 21 |
| `KopDialog` | `Dialoger.tsx` | 2551 / 2552–2564 | `{kop ? … : null}` | 3 |
| `ForalderDialog` | `ForalderDialog.tsx` | 2567 / 2568–2682 | `{foralder ? … : null}` | 15 |
| `MossaPanel` | `Dialoger.tsx` | 2684 / 2685–2703 | `{mossaOpp ? … : null}` | 4 |

Totalt 171 props, 136 unika namn. Alla props har **samma namn** som variabeln i `Spel()` och skickas som `namn={namn}`. Typerna kommer från kompilatorn (`mat/r1b-plan-gen.mjs`); `skylt`, `valj`, `kop` är utan `| null` eftersom villkoret redan smalnat av dem; `visKort` är `Extract<NonNullable<VisKort>, { slag: "djur" }>` resp. `"bygg"`.

**De 15 anropsraderna** (så ska de se ut i `Spel.tsx`; `r1b-ordagrant.mjs` kontrollerar varje rad):
```tsx
<AngLager natt={natt} varld={varld} omrade={omrade} panel={panel} ang={ang} hemma={hemma} liv={liv} fotoMal={fotoMal} visaBanner={visaBanner} visaMossa={visaMossa} setFotoMal={setFotoMal} banners={banners} bubblor={bubblor} onskan={onskan} onskaOpp={onskaOpp} onskaSyns={onskaSyns} ank={ank} oppnaOnska={oppnaOnska} meny={meny} setMeny={setMeny} omUidRef={omUidRef} setLage={setLage} setBokOpp={setBokOpp} setLadaOpp={setLadaOpp} menyHem={menyHem} setBoUid={setBoUid} lada={lada} ladaOpp={ladaOpp} boUid={boUid} boDjur={boDjur} flyttaInDjur={flyttaInDjur} />
{kartaOpp ? <KartaLager forstaRad={forstaRad} kartaText={kartaText} tryckPlats={tryckPlats} oppna={oppna} /> : null}
{omrade && !kartaOpp ? <OmradeHud tryckPlats={tryckPlats} bytFolje={bytFolje} /> : null}
<Hud haller={haller} setHaller={setHaller} setForalder={setForalder} stjarnor={stjarnor} hittatAntal={hittatAntal} totalOrd={totalOrd} menyOpp={menyOpp} setMenyOpp={setMenyOpp} setMenySaker={setMenySaker} setSenare={setSenare} />
<MenyPanel menyOpp={menyOpp} setMenyOpp={setMenyOpp} setMenySaker={setMenySaker} setSenare={setSenare} senare={senare} panel={panel} varld={varld} valjVarld={valjVarld} lasMeny={lasMeny} setBokOpp={setBokOpp} oppnaKarta={oppnaKarta} setIntroNy={setIntroNy} setIntro={setIntro} menySaker={menySaker} borjaOm={borjaOm} />
<HudBot varld={varld} omrade={omrade} kartaOpp={kartaOpp} oppnaBygglage={oppnaBygglage} setPanel={setPanel} setBokOpp={setBokOpp} />
{bokOpp ? <BokSkarm stangBok={stangBok} andrar={andrar} panel={panel} lage={lage} setLage={setLage} setForslag={setForslag} byggPuff={byggPuff} onskaOpp={onskaOpp} onskan={onskan} onskaSyns={onskaSyns} onskaDjur={onskaDjur} onskaEx={onskaEx} fyllExempel={fyllExempel} gavaTill={gavaTill} ang={ang} hemma={hemma} varld={varld} forslag={forslag} valjForslag={valjForslag} nejForslag={nejForslag} behover={behover} utfor={utfor} flik={flik} onskaKort={onskaKort} setFlik={setFlik} kort={kort} val={val} onskaIds={onskaIds} kortGang={kortGang} valjKort={valjKort} oppnaSkrivMig={oppnaSkrivMig} text={text} omrade={omrade} visaOnskaHjalp={visaOnskaHjalp} vaknaNu={vaknaNu} vaknaText={vaknaText} skrivTecken={skrivTecken} sudda={sudda} uppFlik={uppFlik} setUppFlik={setUppFlik} uppdragSpar={uppdragSpar} byggSida={byggSida} agdaSidor={agdaSidor} setByggSidaId={setByggSidaId} setByggPuff={setByggPuff} byggFras={byggFras} kopRad={kopRad} lastaSidor={lastaSidor} forsokKop={forsokKop} /> : null}
{skylt ? <SkyltDialog skylt={skylt} setSkylt={setSkylt} /> : null}
{valj ? <ValjDjurDialog valj={valj} valjKor={valjKor} setValj={setValj} /> : null}
{visKort?.slag === "djur" ? <VisKortDjur visKort={visKort} visaBanner={visaBanner} visaMossa={visaMossa} setVisKort={setVisKort} /> : null}
{visKort?.slag === "bygg" ? <VisKortBygg visKort={visKort} setVisKort={setVisKort} /> : null}
{ordbok ? <OrdbokDialog hittatAntal={hittatAntal} totalOrd={totalOrd} stjarnor={stjarnor} kopRad={kopRad} koptaSidor={koptaSidor} funna={funna} sidOpp={sidOpp} forsokKop={forsokKop} setSidOpp={setSidOpp} textRef={textRef} setText={setText} setHand={setHand} setLage={setLage} setOrdbok={setOrdbok} kvar={kvar} hittade={hittade} hemliga={hemliga} formler={formler} setVisKort={setVisKort} sovande={sovande} visaBanner={visaBanner} /> : null}
{kop ? <KopDialog kop={kop} bekraftaKop={bekraftaKop} setKop={setKop} /> : null}
{foralder ? <ForalderDialog startLage={startLage} setLage={setLage} ljudPa={ljudPa} sparaKopia={sparaKopia} filRef={filRef} lasFil={lasFil} foralderRad={foralderRad} kopia={kopia} lasInKopia={lasInKopia} setKopia={setKopia} onskelista={onskelista} setSaker={setSaker} saker={saker} borjaOm={borjaOm} setForalder={setForalder} /> : null}
{mossaOpp ? <MossaPanel halsning={halsning} mossaLista={mossaLista} mossaExtra={mossaExtra} setMossaOpp={setMossaOpp} /> : null}
```

### 5.4 Props och typer per komponent (signaturerna)

#### `AngLager` – `export function AngLager({ … }: AngLagerProps)` i `ui/AngLager.tsx`
| prop | typ | var den bor i `Spel()` |
|---|---|---|
| `natt` | `number` | `useState` (värde) |
| `varld` | `Varld` | `useState` (värde) |
| `omrade` | `string \| null` | `useState` (värde) |
| `panel` | `"spel" \| "byggbok" \| "uppdrag"` | `useState` (värde) |
| `ang` | `Sparad[]` | `useMinne`-selektor |
| `hemma` | `Hemdjur[]` | `useMinne`-selektor |
| `liv` | `Record<string, { humor: string; humorMs: number; humorLangd: number; favorit: string; favoritHittad: boolean; hjartan: number; }>` | `useMinne`-selektor |
| `fotoMal` | `{ uid: string; x: number; y: number; } \| null` | `useState` (värde) |
| `visaBanner` | `(texten: string, slag: Banner["slag"]) => void` | funktion/handler |
| `visaMossa` | `(h: Parameters<typeof mossaHand>[0]) => void` | funktion/handler |
| `setFotoMal` | `Dispatch<SetStateAction<{ uid: string; x: number; y: number; } \| null>>` | setter för `fotoMal` |
| `banners` | `Banner[]` | `useState` (värde) |
| `bubblor` | `Bubbla[]` | `useState` (värde) |
| `onskan` | `OnskaSpar \| null` | `useMinne`-selektor |
| `onskaOpp` | `boolean` | `useState` (värde) |
| `onskaSyns` | `boolean` | `useState` (värde) |
| `ank` | `{ x: number; y: number; vanster: boolean; }` | härlett värde |
| `oppnaOnska` | `() => void` | funktion/handler |
| `meny` | `{ uid: string; x: number; y: number; } \| null` | `useState` (värde) |
| `setMeny` | `Dispatch<SetStateAction<{ uid: string; x: number; y: number; } \| null>>` | setter för `meny` |
| `omUidRef` | `RefObject<string \| null>` | `useRef` |
| `setLage` | `Dispatch<SetStateAction<Lage>>` | setter för `lage` |
| `setBokOpp` | `Dispatch<SetStateAction<boolean>>` | setter för `bokOpp` |
| `setLadaOpp` | `Dispatch<SetStateAction<boolean>>` | setter för `ladaOpp` |
| `menyHem` | `{ kroppar: string[]; platser: number; } \| null \| undefined` | härlett värde |
| `setBoUid` | `Dispatch<SetStateAction<string \| null>>` | setter för `boUid` |
| `lada` | `SparatBygge[]` | `useMinne`-selektor |
| `ladaOpp` | `boolean` | `useState` (värde) |
| `boUid` | `string \| null` | `useState` (värde) |
| `boDjur` | `Sparad[]` | härlett värde |
| `flyttaInDjur` | `(djurUid: string) => void` | funktion/handler |

#### `KartaLager` – `export function KartaLager({ … }: KartaLagerProps)` i `ui/KartaLager.tsx`
| prop | typ | var den bor i `Spel()` |
|---|---|---|
| `forstaRad` | `string[] \| null` | `useState` (värde) |
| `kartaText` | `string \| null` | `useState` (värde) |
| `tryckPlats` | `(id: string) => void` | funktion/handler |
| `oppna` | `string[]` | `useMinne`-selektor |

#### `OmradeHud` – `export function OmradeHud({ … }: OmradeHudProps)` i `ui/KartaLager.tsx`
| prop | typ | var den bor i `Spel()` |
|---|---|---|
| `tryckPlats` | `(id: string) => void` | funktion/handler |
| `bytFolje` | `() => void` | funktion/handler |

#### `Hud` – `export function Hud({ … }: HudProps)` i `ui/Hud.tsx`
| prop | typ | var den bor i `Spel()` |
|---|---|---|
| `haller` | `boolean` | `useState` (värde) |
| `setHaller` | `Dispatch<SetStateAction<boolean>>` | setter för `haller` |
| `setForalder` | `Dispatch<SetStateAction<boolean>>` | setter för `foralder` |
| `stjarnor` | `number` | `useMinne`-selektor |
| `hittatAntal` | `number` | härlett värde |
| `totalOrd` | `number` | härlett värde |
| `menyOpp` | `boolean` | `useState` (värde) |
| `setMenyOpp` | `Dispatch<SetStateAction<boolean>>` | setter för `menyOpp` |
| `setMenySaker` | `Dispatch<SetStateAction<boolean>>` | setter för `menySaker` |
| `setSenare` | `Dispatch<SetStateAction<boolean>>` | setter för `senare` |

#### `MenyPanel` – `export function MenyPanel({ … }: MenyPanelProps)` i `ui/Hud.tsx`
| prop | typ | var den bor i `Spel()` |
|---|---|---|
| `menyOpp` | `boolean` | `useState` (värde) |
| `setMenyOpp` | `Dispatch<SetStateAction<boolean>>` | setter för `menyOpp` |
| `setMenySaker` | `Dispatch<SetStateAction<boolean>>` | setter för `menySaker` |
| `setSenare` | `Dispatch<SetStateAction<boolean>>` | setter för `senare` |
| `senare` | `boolean` | `useState` (värde) |
| `panel` | `"spel" \| "byggbok" \| "uppdrag"` | `useState` (värde) |
| `varld` | `Varld` | `useState` (värde) |
| `valjVarld` | `(id: "ang" \| "gard" \| "byggbok") => void` | funktion/handler |
| `lasMeny` | `() => void` | funktion/handler |
| `setBokOpp` | `Dispatch<SetStateAction<boolean>>` | setter för `bokOpp` |
| `oppnaKarta` | `() => void` | funktion/handler |
| `setIntroNy` | `Dispatch<SetStateAction<number>>` | setter för `introNy` |
| `setIntro` | `Dispatch<SetStateAction<boolean>>` | setter för `intro` |
| `menySaker` | `boolean` | `useState` (värde) |
| `borjaOm` | `() => void` | funktion/handler |

#### `HudBot` – `export function HudBot({ … }: HudBotProps)` i `ui/Hud.tsx`
| prop | typ | var den bor i `Spel()` |
|---|---|---|
| `varld` | `Varld` | `useState` (värde) |
| `omrade` | `string \| null` | `useState` (värde) |
| `kartaOpp` | `boolean` | `useState` (värde) |
| `oppnaBygglage` | `() => void` | funktion/handler |
| `setPanel` | `Dispatch<SetStateAction<"spel" \| "byggbok" \| "uppdrag">>` | setter för `panel` |
| `setBokOpp` | `Dispatch<SetStateAction<boolean>>` | setter för `bokOpp` |

#### `BokSkarm` – `export function BokSkarm({ … }: BokSkarmProps)` i `ui/BokSkarm.tsx`
| prop | typ | var den bor i `Spel()` |
|---|---|---|
| `stangBok` | `() => void` | funktion/handler |
| `andrar` | `boolean` | härlett värde |
| `panel` | `"spel" \| "byggbok" \| "uppdrag"` | `useState` (värde) |
| `lage` | `Lage` | `useState` (värde) |
| `setLage` | `Dispatch<SetStateAction<Lage>>` | setter för `lage` |
| `setForslag` | `Dispatch<SetStateAction<Forslag \| null>>` | setter för `forslag` |
| `byggPuff` | `string \| null` | `useState` (värde) |
| `onskaOpp` | `boolean` | `useState` (värde) |
| `onskan` | `OnskaSpar \| null` | `useMinne`-selektor |
| `onskaSyns` | `boolean` | `useState` (värde) |
| `onskaDjur` | `Sparad \| undefined` | härlett värde |
| `onskaEx` | `string[]` | härlett värde |
| `fyllExempel` | `(ex: string) => void` | funktion/handler |
| `gavaTill` | `string \| null` | `useState` (värde) |
| `ang` | `Sparad[]` | `useMinne`-selektor |
| `hemma` | `Hemdjur[]` | `useMinne`-selektor |
| `varld` | `Varld` | `useState` (värde) |
| `forslag` | `Forslag \| null` | `useState` (värde) |
| `valjForslag` | `(kortet: ForslagKort) => void` | funktion/handler |
| `nejForslag` | `() => void` | funktion/handler |
| `behover` | `{ text: string; djur: { id: string; visa: string; }[]; } \| null` | `useState` (värde) |
| `utfor` | `(raw: string, opt: { hand: boolean; inteGuld?: string[]; }) => void` | funktion/handler |
| `flik` | `Slot` | `useState` (värde) |
| `onskaKort` | `Ord[]` | härlett värde |
| `setFlik` | `Dispatch<SetStateAction<Slot>>` | setter för `flik` |
| `kort` | `Ord[]` | härlett värde |
| `val` | `Partial<Record<Slot, Ord>>` | `useState` (värde) |
| `onskaIds` | `Set<string>` | härlett värde |
| `kortGang` | `Record<string, number>` | `useMinne`-selektor |
| `valjKort` | `(ord: Ord) => void` | funktion/handler |
| `oppnaSkrivMig` | `(ord: Ord) => void` | funktion/handler |
| `text` | `string` | `useState` (värde) |
| `omrade` | `string \| null` | `useState` (värde) |
| `visaOnskaHjalp` | `boolean` | härlett värde |
| `vaknaNu` | `() => void` | funktion/handler |
| `vaknaText` | `string` | härlett värde |
| `skrivTecken` | `(bit: string) => void` | funktion/handler |
| `sudda` | `() => void` | funktion/handler |
| `uppFlik` | `"pagar" \| "klar"` | `useState` (värde) |
| `setUppFlik` | `Dispatch<SetStateAction<"pagar" \| "klar">>` | setter för `uppFlik` |
| `uppdragSpar` | `Record<string, "pagar" \| "klar">` | `useMinne`-selektor |
| `byggSida` | `SidaBygg` | härlett värde |
| `agdaSidor` | `SidaBygg[]` | härlett värde |
| `setByggSidaId` | `Dispatch<SetStateAction<string>>` | setter för `byggSidaId` |
| `setByggPuff` | `Dispatch<SetStateAction<string \| null>>` | setter för `byggPuff` |
| `byggFras` | `(fras: string) => void` | funktion/handler |
| `kopRad` | `string \| null` | `useState` (värde) |
| `lastaSidor` | `SidaBygg[]` | härlett värde |
| `forsokKop` | `(slag: "djur" \| "bygg", id: string, titel: string, pris: number) => void` | funktion/handler |

#### `SkyltDialog` – `export function SkyltDialog({ … }: SkyltDialogProps)` i `ui/Dialoger.tsx`
| prop | typ | var den bor i `Spel()` |
|---|---|---|
| `skylt` | `{ text: string; nytt: string \| null; }` | `useState` (värde) |
| `setSkylt` | `Dispatch<SetStateAction<{ text: string; nytt: string \| null; } \| null>>` | setter för `skylt` |

#### `ValjDjurDialog` – `export function ValjDjurDialog({ … }: ValjDjurDialogProps)` i `ui/Dialoger.tsx`
| prop | typ | var den bor i `Spel()` |
|---|---|---|
| `valj` | `{ rubrik: string; eller?: string; djur: Sparad[]; nyckel: string; }` | `useState` (värde) |
| `valjKor` | `RefObject<(d: Sparad) => void>` | `useRef` |
| `setValj` | `Dispatch<SetStateAction<{ rubrik: string; eller?: string; djur: Sparad[]; nyckel: string; } \| null>>` | setter för `valj` |

#### `VisKortDjur` – `export function VisKortDjur({ … }: VisKortDjurProps)` i `ui/Dialoger.tsx`
| prop | typ | var den bor i `Spel()` |
|---|---|---|
| `visKort` | `Extract<NonNullable<VisKort>, { slag: "djur" }>` | `useState` (värde) |
| `visaBanner` | `(texten: string, slag: Banner["slag"]) => void` | funktion/handler |
| `visaMossa` | `(h: Parameters<typeof mossaHand>[0]) => void` | funktion/handler |
| `setVisKort` | `Dispatch<SetStateAction<VisKort>>` | setter för `visKort` |

#### `VisKortBygg` – `export function VisKortBygg({ … }: VisKortByggProps)` i `ui/Dialoger.tsx`
| prop | typ | var den bor i `Spel()` |
|---|---|---|
| `visKort` | `Extract<NonNullable<VisKort>, { slag: "bygg" }>` | `useState` (värde) |
| `setVisKort` | `Dispatch<SetStateAction<VisKort>>` | setter för `visKort` |

#### `OrdbokDialog` – `export function OrdbokDialog({ … }: OrdbokDialogProps)` i `ui/OrdbokDialog.tsx`
| prop | typ | var den bor i `Spel()` |
|---|---|---|
| `hittatAntal` | `number` | härlett värde |
| `totalOrd` | `number` | härlett värde |
| `stjarnor` | `number` | `useMinne`-selektor |
| `kopRad` | `string \| null` | `useState` (värde) |
| `koptaSidor` | `string[]` | `useMinne`-selektor |
| `funna` | `Record<string, { guld: boolean; }>` | `useMinne`-selektor |
| `sidOpp` | `string \| null` | `useState` (värde) |
| `forsokKop` | `(slag: "djur" \| "bygg", id: string, titel: string, pris: number) => void` | funktion/handler |
| `setSidOpp` | `Dispatch<SetStateAction<string \| null>>` | setter för `sidOpp` |
| `textRef` | `RefObject<string>` | `useRef` |
| `setText` | `Dispatch<SetStateAction<string>>` | setter för `text` |
| `setHand` | `Dispatch<SetStateAction<boolean>>` | setter för `hand` |
| `setLage` | `Dispatch<SetStateAction<Lage>>` | setter för `lage` |
| `setOrdbok` | `Dispatch<SetStateAction<boolean>>` | setter för `ordbok` |
| `kvar` | `number` | härlett värde |
| `hittade` | `Ord[]` | härlett värde |
| `hemliga` | `Ord[]` | härlett värde |
| `formler` | `{ text: string; spec: Sparad; }[]` | `useMinne`-selektor |
| `setVisKort` | `Dispatch<SetStateAction<VisKort>>` | setter för `visKort` |
| `sovande` | `Sparad[]` | `useMinne`-selektor |
| `visaBanner` | `(texten: string, slag: Banner["slag"]) => void` | funktion/handler |

#### `KopDialog` – `export function KopDialog({ … }: KopDialogProps)` i `ui/Dialoger.tsx`
| prop | typ | var den bor i `Spel()` |
|---|---|---|
| `kop` | `KopFraga` | `useState` (värde) |
| `bekraftaKop` | `() => void` | funktion/handler |
| `setKop` | `Dispatch<SetStateAction<KopFraga \| null>>` | setter för `kop` |

#### `ForalderDialog` – `export function ForalderDialog({ … }: ForalderDialogProps)` i `ui/ForalderDialog.tsx`
| prop | typ | var den bor i `Spel()` |
|---|---|---|
| `startLage` | `Lage` | `useMinne`-selektor |
| `setLage` | `Dispatch<SetStateAction<Lage>>` | setter för `lage` |
| `ljudPa` | `boolean` | `useMinne`-selektor |
| `sparaKopia` | `() => void` | funktion/handler |
| `filRef` | `RefObject<HTMLInputElement \| null>` | `useRef` |
| `lasFil` | `(fil: File) => Promise<void>` | funktion/handler |
| `foralderRad` | `string \| null` | `useState` (värde) |
| `kopia` | `unknown` | `useState` (värde) |
| `lasInKopia` | `() => void` | funktion/handler |
| `setKopia` | `Dispatch<unknown>` | setter för `kopia` |
| `onskelista` | `string[]` | `useMinne`-selektor |
| `setSaker` | `Dispatch<SetStateAction<boolean>>` | setter för `saker` |
| `saker` | `boolean` | `useState` (värde) |
| `borjaOm` | `() => void` | funktion/handler |
| `setForalder` | `Dispatch<SetStateAction<boolean>>` | setter för `foralder` |

#### `MossaPanel` – `export function MossaPanel({ … }: MossaPanelProps)` i `ui/Dialoger.tsx`
| prop | typ | var den bor i `Spel()` |
|---|---|---|
| `halsning` | `string` | `useState` (värde) |
| `mossaLista` | `{ id: string; klar: boolean; }[]` | `useMinne`-selektor |
| `mossaExtra` | `boolean` | `useMinne`-selektor |
| `setMossaOpp` | `Dispatch<SetStateAction<boolean>>` | setter för `mossaOpp` |

### 5.5 Vilka `useState` som används av vilka komponenter

Alla 49 `useState`, 21 `useRef`, 20 `useMinne`-selektorer, 48 funktioner och 9 effekter **stannar i `Spel()` på samma plats i samma ordning**; komponenterna får bara värdet eller settern som props. 38 `useState`-värden och 30 settrar skickas vidare; resten (sista raden) används bara i `Spel()`.

| `useState` | värdet används av | settern används av |
|---|---|---|
| `text` | BokSkarm | OrdbokDialog |
| `lage` | BokSkarm | AngLager, BokSkarm, OrdbokDialog, ForalderDialog |
| `flik` | BokSkarm | BokSkarm |
| `val` | BokSkarm | – |
| `hand` | – | OrdbokDialog |
| `forslag` | BokSkarm | BokSkarm |
| `behover` | BokSkarm | – |
| `bubblor` | AngLager | – |
| `banners` | AngLager | – |
| `visKort` | VisKortDjur, VisKortBygg | VisKortDjur, VisKortBygg, OrdbokDialog |
| `ordbok` | – | OrdbokDialog |
| `foralder` | – | Hud, ForalderDialog |
| `natt` | AngLager | – |
| `mossaOpp` | – | MossaPanel |
| `halsning` | MossaPanel | – |
| `fotoMal` | AngLager | AngLager |
| `haller` | Hud | Hud |
| `bokOpp` | – | AngLager, MenyPanel, HudBot |
| `menyOpp` | Hud, MenyPanel | Hud, MenyPanel |
| `intro` | – | MenyPanel |
| `introNy` | – | MenyPanel |
| `saker` | ForalderDialog | ForalderDialog |
| `menySaker` | MenyPanel | Hud, MenyPanel |
| `senare` | MenyPanel | Hud, MenyPanel |
| `varld` | AngLager, MenyPanel, HudBot, BokSkarm | – |
| `panel` | AngLager, MenyPanel, BokSkarm | HudBot |
| `meny` | AngLager | AngLager |
| `boUid` | AngLager | AngLager |
| `ladaOpp` | AngLager | AngLager |
| `byggSidaId` | – | BokSkarm |
| `byggPuff` | BokSkarm | BokSkarm |
| `sidOpp` | OrdbokDialog | OrdbokDialog |
| `kop` | KopDialog | KopDialog |
| `kopRad` | BokSkarm, OrdbokDialog | – |
| `onskaOpp` | AngLager, BokSkarm | – |
| `onskaSyns` | AngLager, BokSkarm | – |
| `foralderRad` | ForalderDialog | – |
| `kopia` | ForalderDialog | ForalderDialog |
| `kartaOpp` | HudBot | – |
| `forstaRad` | KartaLager | – |
| `kartaText` | KartaLager | – |
| `omrade` | AngLager, HudBot, BokSkarm | – |
| `gavaTill` | BokSkarm | – |
| `skylt` | SkyltDialog | SkyltDialog |
| `valj` | ValjDjurDialog | ValjDjurDialog |
| `uppFlik` | BokSkarm | BokSkarm |
| *bara i `Spel()` (3 st)* | `albumOpp`, `onskaPos`, `skriverAv` | |

**Handlers och funktioner** (27 av de 48 funktionerna skickas som props; de **bor kvar** i `Spel()` och flyttas inte): se kolumnen "funktion/handler" i 5.4. Inga `useEffect` flyttas.

### 5.6 Ordning, definition of done, inställningar

Steg (prompten har dem i ordning): 1 förflyg → 2 skydd röd → 3 skriptet + `typecheck:pages` → 4 bevis utan webbläsare → 5 DOM-tur efter + bilder → 6 `RUNDAR1B.md`.
- **DoD:** `npm run check:struktur` (steg b, gräns **1 850** rader) grön, var röd före; `node rundor/R1-dela-spel/r1b-ordagrant.mjs` grön; `typecheck:pages` grön; `eslint src/spel/Spel.tsx src/spel/ui`: 0 fel, 4 varningar (samma som före); `test:product` 75/75 på Node ≥ 22.6; `--jamfor fore1 fore2 efterB` exit 0 med **28 stabila lägen**; `kropp ===` = 141; `git diff origin/main --stat -- data src/tolk` tomt; sex `efter-*.png`; `RUNDAR1B.md`.
- **Inställningar:** `--max-turns 30`, `grok-4.7-build-fast`, `--reasoning-effort low`. Förväntat 15–22 turer (R1A tog 23 av 40 med mer handarbete; här är handarbetet ett skript).
- **Förväntat resultat:** `Spel.tsx` **1 781 rader** (mätt i provkörning; gränsen 1 850 ger 69 rader marginal).

### 5.7 Kompletterande bevis för det DOM-turen inte når

DOM-turen fick åtta nya lägen (21–28): `foralder-borja` (bekräftelse i `ForalderDialog`), `meny-borja` (`MenyPanel`), `ordbok-for-fa`, `ordbok-kop`, `ordbok-kopt` (`OrdbokDialog` + `KopDialog` + köp genomfört), `bygg-for-fa`, `bygg-kop` (`BokSkarm` byggbok + `KopDialog`), `kvall` (`AngLager` på kvällen). `formel` täcker `VisKortDjur`, `ordbok`, `foralder`, `skogen-valj` (`ValjDjurDialog`), `karta`, `meny`, `bok-*` täcker resten.

**Ingen spelväg från UI:t når** `SkyltDialog` (skylt tänds av ett tryck på en skylt i 2D-äventyret), `MossaPanel` (tryck på mossan på gården), uppdragsvyn (`panel === "uppdrag"`), byggmenyn (`bygg-meny`), lådan och bo-panelen i `AngLager`, samt `backup-*`. För dem är beviset i stället **textlikhet**: `node rundor/R1-dela-spel/r1b-ordagrant.mjs` jämför varje komponents kropp **byte för byte** mot `git show 89fd859:src/spel/Spel.tsx` (de ursprungliga raderna), bekräftar att resten av `Spel()` är **ändrad i ingen rad** utom de 15 anropen, och kontrollerar att varje anrop skickar varje prop som `namn={namn}`; `tsc` bevisar att varje namn och typ stämmer. Provkörning: 15/15 byte-lika, 1 671 rader i `Spel()` jämförda, GRÖN. Negativa tester: en ändrad `className` i en flyttad kropp ger RÖD ("SkyltDialog: kroppen … skiljer sig"), en ändrad rad i `Spel()` ger RÖD. Bevisets gräns: det bevisar att koden är densamma, inte att dialogen ser rätt ut; men koden *är* densamma, och därmed även beteendet så länge propparna är desamma (bevisat av `tsc`).

### 5.8 Provkörning av R1B (Arkitekten, skräpkopia av `89fd859` utanför repot)

Exakt `r1b-flytta.mjs` kördes på en kopia av `origin/main` (`89fd859`), därefter byggdes kopian (`vite build --config vite.pages.config.ts`, 2 s) och DOM-turen kördes mot bygget. Ingenting av detta finns i repot.
| Kontroll | Resultat |
|---|---|
| Skriptet | `Klart: 7 filer skrivna, 15 block ersatta, Spel.tsx har nu 1781 rader.` (exit 0) |
| `tsc --noEmit -p tsconfig.pages.json` | **0 fel** direkt efter skriptet, utan någon handrättning |
| `check-spel-struktur.mjs` (steg b) | **GRÖN**: 1 781 rader (gräns 1 850), testid 124/126 oförändrade, 12 `ui/`-filer, inga oanvända importer |
| `r1b-ordagrant.mjs` | **GRÖN**: 15/15 kroppar byte-lika, 1 671 rader i `Spel()` jämförda |
| `eslint src/spel/Spel.tsx src/spel/ui` | 0 fel, 4 varningar (samma fyra som före) |
| `test:product` (Node 22.23.3) | 75/75 |
| `kropp ===` | 141 |
| DOM-tur: 28 lägen före ×2 (R1A-bygget) mot efter (R1B-bygget) | **28 av 28 stabila och identiska, 0 sidfel** |
| Negativt test av turen | en ändrad `className` i `HudBot` (ett tecken) gav ett annat DOM-hash i läge `01-start` (1 568 mot 1 569 byte): turen ser små ändringar |
| Negativt test av `r1b-ordagrant.mjs` | ändrad `className` i en flyttad kropp → RÖD; ändrad rad i `Spel()` → RÖD |
Inte provat: att `grok` kör skriptet (det är en vanlig `node`-körning), och bilderna `efter-*.png` (Build tar dem; jag har granskat `fore-ordbok-kop.png` och `fore-foralder-borja.png` mot motsvarande från provbygget och de är lika).

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
`scripts/check-spel-struktur.mjs` (skriven och provkörd av Arkitekten, `rundor/R1-dela-spel/check-spel-struktur.mjs`) kontrollerar fem saker: (1) radantal i `Spel.tsx` (steg a ≤ 2 800, steg b ≤ 1 850), (2) mängden `data-testid` i `src/spel/**/*.tsx` är identisk med `rundor/R1-dela-spel/testid-baslinje.json`, (3) inga oanvända importer i `Spel.tsx` och `ui/**`, (4) ingen fil i `ui/` importerar `Spel.tsx`, (5) alla krävda `ui/`-filer finns.
**Provkörning på `37913b3` (före):** `steg a: Spel.tsx: 3133 rader (gräns 2800); data-testid: 124 olika, 126 förekomster; ui-filer: 0` → **RÖD** (radantal + 5 filer saknas); steg b likaså (12 filer). Baslinjen är mätt: **124 olika `data-testid` i 126 JSX-förekomster** (102 i `Spel.tsx`, 13 `samling.tsx`, 7 `intro.tsx`, 4 `angen3d.tsx`). Dynamiska testid (`plats-${o.id}` m.fl.) räknas som uttryck.

### 7.2 Typkontroll, lint
`npm run typecheck:pages` = `tsc --noEmit -p tsconfig.pages.json`; **baslinje 0 fel (6 s)** på `37913b3`; täcker `src/spel/**` inklusive `ui/`. `npx eslint src/spel/Spel.tsx src/spel/ui`: baslinje i `Spel.tsx` 0 fel, 4 varningar; efter: 0 fel, inga nya varningstyper (varningarna om `react-hooks/exhaustive-deps` finns redan).

### 7.3 Enhetstester
`npm run test:product` med **Node ≥ 22.6** (avsnitt 8): baslinje **75/75 gröna, 0,27 s** (Node 22.23.3, `37913b3`). Obs: testerna täcker `tolk`, `onska`, `lagring`, `ideer`, `texturKo`, `dialogIsolering` – **inte `Spel.tsx`**. De bevisar därför bara att tolkning och lagring är orörda, inte att flytten är ren. Flyttens renhet bevisas av 7.1, 7.2 och 7.4.

### 7.4 DOM-tur före/efter (`verification/r1-dom-tur.mjs`)
Spelar 28 lägen (20 från R1A + 8 från R1B, 5.7) i en riktig webbläsare (375×812, touch) via `window.__troll` och `data-testid`: `start, ang-djur, bok-kort, bok-skriv, bok-forslag, bok-behover, meny, meny-last, karta, skogen-valj, skogen, ordbok, foralder, album, formel, onska, onska-bok, gard, gard-bygger, gard-bok`. Varje läge startar från tömd lagring + ny sidladdning. Skriptet sparar den **normaliserade DOM:en** (3D-canvas, dygnstid, slumpade humör-ikoner, uid, stjärnantal och tidsstyrda banderoller/bubblor är bortnormaliserade) och en skärmbild per läge.
- **Före:** två körningar av *oförändrad* kod (`fore1`, `fore2`). Lägen där de två skiljer sig är *ostabila* (slump i spelet) och räknas inte.
- **Efter:** en körning (`efterA`/`efterB`). `--jamfor fore1 fore2 efter` ger exit 0 bara om **minst 12 lägen är stabila och alla stabila är identiska** med efter.
- **Vad den inte täcker (ärligt):** uppdragsvyn (`panel === "uppdrag"` har ingen ingång i UI:t), `SkyltDialog`, `MossaPanel`, `KopDialog`, byggmenyn, lådan, bo-panelen, `valj-djur` med flera djur, och tidsstyrda banderoller/bubblor. De täcks av typkontroll (rätt props och typer) och av att koden flyttas ordagrant; se osäkerheter (avsnitt 11).
- **Provkörd av Arkitekten** mot den publicerade (äldre) versionen, tre körningar i rad: **20 av 20 lägen identiska i alla tre, 0 sidfel**. Två lägen (`skogen-valj`, `skogen`) misslyckas på den äldre versionen (äventyrsknappen är låst där) och är identiska även som fel. Två tidigare skriptversioner var inte stabila (stjärnantal, plattformens `data-grok-*`-attribut, en slumpad "ge en gåva"-ruta som smittade senare lägen); därför normaliseras det första två och varje läge startar nu från rent spel. **Den är inte körd mot `main`:s byggda version** (jag får inte bygga); se osäkerheter.

### 7.5 Webbläsare
Skriptet läser `CHROMIUM_PATH` om satt, annars Playwrights egen Chromium. `verification/browser-B02R-3.mjs` (från Copilots import) pekar på `/opt/pw-browsers/chromium-1208/chrome-linux64/chrome`; om den finns i Builds miljö är det rätt värde. Sätt `CHROMIUM_PATH` om den filen finns. Saknas webbläsare: kör **inte** installation; hoppa över tur-stegen, skriv "DOM-tur ej körd: ingen webbläsare" i `RUNDAR1A.md` och fortsätt med resten (Arkitekten kör touren själv).

### 7.6 Bilder (granskas av Arkitekten, mänskligt öga)
Fyra lägen, före och efter, 375×812: `02-ang-djur`, `03-bok-kort`, `07-meny`, `12-ordbok` → `docs/skarmbilder/r1/fore-*.png` (R1A) och `efter-*.png` (R1B). Pixellikhet krävs inte (ängen är animerad); layout, texter och knappar ska vara desamma. Bilder ensamma är inte bevis; DOM-turen är det.

### 7.7 Grundtanke-mått
Före/efter: `git diff origin/main --stat -- data src/tolk` = tomt; täckningstalen i `PROJECT.md` avsnitt 11 oförändrade (parser orörd). Strukturtal: `Spel.tsx` 3 133 → 2 740 (R1A, mätt i provkörning) → 1 781 (R1B, mätt i provkörning 5.8); `useState` i `Spel.tsx` 49 → 49; `kropp ===` 141 → 141.

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

| | R1A (utfall mätt) | R1B |
|---|---|---|
| Ändringar i ritningen | 10 | 1 skriptkörning (skriptet gör 15 block, 7 filer) + bevis |
| `--max-turns` | **35** (2–3 × 10 + 10 = 30–40) | **30** (1 ändring + bevissteg; skillens formel ger 12–16, men beviskedjan (build, två kommandon, bilder, rapport) kräver ≈ 15–20) |
| Modell / ansträngning | `grok-4.7-build-fast`, `--reasoning-effort low` (skillen: smala körningar; alla radnummer och typer ges, inget att resonera om) | samma |
| Turer | **23** (utfall; gissning var 25–32) | 15–22 **(gissning)** |
| Kostnad | **1,04 USD** (utfall, `medium`; gissning var 1–2) | 0,5–1,2 USD **(gissning; R1A kostade 1,04 med `medium` och mer handarbete)** |
| Kontext | `Spel.tsx` läses en gång (≈ 113 kB) | läses en gång; komponentfiler är små |

Kostnaderna är min gissning utifrån `rounds.tsv` (5A: 30 turer medium 2,92 USD; 4E: 11 turer low 0,52 USD; 5B: 40 turer ≈ 1 USD som misslyckades av för stor beställning). Kvoten är okänd: kontrollera `/usage` före (skillen `grok-build-cli`). Summa R1: R1A 1,04 USD (utfall) + R1B ca 0,5–1,2 USD (gissning) = **ca 1,5–2,3 USD**, i nivå med `PROJECT.md`:s 2–3 USD.

Kör (efter att Arkitekten/Christoffer sagt ja till körning; denna ritning kör inget):
```bash
export PATH=$PATH:~/.grok/bin; cd /workspace/trollpennan-repo
git fetch origin && git switch -c runda-r1a origin/main
grok --prompt-file rundor/R1-dela-spel/PROMPT.md --cwd /workspace/trollpennan-repo --trust \
  --output-format json --max-turns 35 -m grok-4.7-build-fast --reasoning-effort low --always-approve \
  > /workspace/runda-r1a.json 2> /workspace/runda-r1a.err
```
R1B (efter att Arkitekten/Christoffer sagt ja till körning):
```bash
export PATH=$PATH:~/.grok/bin; cd /workspace/trollpennan-repo
git fetch origin && git switch -c runda-r1b origin/main
grok --prompt-file rundor/R1-dela-spel/PROMPT-R1B.md --cwd /workspace/trollpennan-repo --trust \
  --output-format json --max-turns 30 -m grok-4.7-build-fast --reasoning-effort low --always-approve \
  > /workspace/runda-r1b.json 2> /workspace/runda-r1b.err
```
(Flaggorna kontrollerade mot `grok --help` v1.0.62: `--prompt-file`, `--max-turns`, `--output-format`, `-m`, `--reasoning-effort`, `--always-approve`, `--cwd`. Skillens exempel skriver `grok -p --prompt-file …`, men enligt `--help` tar `-p` själv en prompttext, så `-p` utelämnas här. `--trust` finns i skillen men syns inte i `--help`-utskriften: bekräfta före körning, annars laddas inte `AGENTS.md`.) Timeout 40 min. Efter körning: granska mot DOM-jämförelse och bilder, inte mot Builds egen rapport; skriv `rounds.tsv`.

## 10. Stoppvillkor och fallback

### R1B
**Stoppa direkt, skriv `RUNDAR1B.md` med orsaken och lämna grenen opushad, om:**
1. `git diff 89fd859 -- src` är inte tomt, eller `Spel.tsx` inte har 2 740 rader, vid start.
2. `r1b-flytta.mjs` slutar med exit 2 (`STOPP: …`): skriptet har då inte ändrat något; kör det **inte** om med ändrade ankare och skriv inga komponenter för hand.
3. `npm run typecheck:pages` är röd efter skriptet: `git restore src && git clean -fd src/spel/ui` (bara de sju nya filerna) och stopp. Rätta inte för hand.
4. `check:struktur`, `r1b-ordagrant.mjs` eller eslint (fler än 0 fel) är röda efter skriptet: stopp.
5. `--jamfor` visar SKILLNAD: kör hela turen en gång till (`/tmp/r1/efterB2`); är det kvar: stopp och rapportera läget och `diff`-raderna. Ändra inte koden för att få grönt.
6. Ingen källfil ändrad efter 8 verktygsanrop (skriptet har inte körts).
7. Transport-/API-fel upprepas: avsluta (Arkitekten väntar 5 min och kör om en gång).
**Fallback:** steg 3 (skriptet) och 4 (bevis utan webbläsare) är det som räknas. Är turerna nästan slut: skriv `RUNDAR1B.md` först. R1B går att merga om steg 1–4 är gröna även om DOM-turen inte hann köras (ingen webbläsare); Arkitekten kör då turen själv.

### R1A (historik)

**Stoppa direkt, skriv `RUNDAR1A.md` med orsaken och lämna grenen opushad, om:**
1. `git diff 37913b3 -- src` är inte tomt vid start (radnumren stämmer inte).
2. Något ankare i 4.2-tabellen (rad 83, 102, 104, 166, 168, 204, 206, 226, 228, 464, 466, 3092, 3101) inte börjar med angiven text.
3. Efter 8 turer har ingen källfil ändrats (`git status`).
4. `typecheck:pages` har fel efter tre rättningsförsök i samma steg → `git restore` det steget, behåll tidigare gröna commits.
5. Något bevis kan bara bli grönt genom att ändra beteende, text, `className` eller `data-testid` → stopp; ändra inte koden för att få grönt.
6. Transport-/API-fel upprepas: vänta inte själv; avsluta (Arkitekten väntar 5 min och kör om en gång, skillen).
**Fallback (viktigast först):** steg 4 (flytten) är det som räknas. Är turerna nästan slut: skriv `RUNDAR1A.md` först, sedan klart delmål. Kan DOM-turen inte köras (ingen webbläsare, tidsbrist) är R1A ändå mergbar om steg 1, 2, 4 och punkt 1–3 i DoD är gröna; Arkitekten kör då turen själv.

## 11. Osäkerheter (ärligt)

1. **(Uppdaterat efter R1A)** Skripten är nu körda mot byggen av `89fd859` (Builds före-körningar och mina egna) och mot ett provbygge av R1B. Äldre text: skripten är inte körda mot `main`:s bygge (jag fick inte bygga). `check-spel-struktur.mjs` är provkörd på `37913b3` (röd som väntat). `r1-dom-tur.mjs` är provkörd mot den publicerade, äldre versionen (där `ut-pa-aventyr` och några lägen skiljer sig), inte mot `main`. Förväntat: alla 20 lägen nås på `main` (kodläst: `ut-pa-aventyr` är olåst, r.2381–2385; `browser-B02R-3.mjs` använder samma väg), men det är inte bevisat.
2. **Slumpen i spelet** (vilda djur, humör, dygn) kan göra fler lägen ostabila än de få jag såg; kravet "minst 12 stabila av 20" är mitt val.
3. ~~Storlek efter R1B~~ **mätt**: 1 781 rader med skriptet (gräns 1 850). Skriver Build ändå komponenter för hand (vilket prompten förbjuder) kan resultatet bli större.
4. **Typutskrifterna** kommer från `tsc` med `tsconfig.pages.json`; små skillnader (t.ex. `RefObject` mot `MutableRefObject`, `Dispatch<unknown>`) är noterade i 5.1.
5. **Kostnad/turer** är gissningar; `rounds.tsv` saknar kostnad för den här sortens ren flytt.
6. **Delvis avklarat:** Build hade en Playwright-webbläsare i R1A (`chromium-1248` i `~/.cache/ms-playwright`, samma maskin som mina körningar). `--trust` (syns inte i `--help`) och exakt vilka flaggor Doodle använde i R1A har jag inte sett; körkommandot ovan är oprovat.
8. **R1B-specifikt:** (a) Skriptet använder bara `node:fs`/`node:path` och `typescript` från repots `node_modules`; provkört på Node 20.19.2 (inte på 22). (b) De sex dialogerna/panelerna som UI:t inte når (5.7) bevisas bara med textlikhet och `tsc`, inte med en skärm. (c) Läge `28-kvall` och övriga nya lägen är stabila i två körningar på min maskin; en tredje maskin kan visa en ostabil. (d) Flytten gör att varje tillståndsändring fortfarande ritar om hela `Spel()` (ingen `memo`): ingen prestandaförändring väntas men ingen är mätt.
7. **Mätskripten** (`mat/*.mjs`) använder TypeScript-kompilatorn i repots `node_modules` och är endast till för att kunna återskapa siffrorna; de ändrar inget.

## 12. Bilaga: återskapa siffrorna (alla skript läser bara)

```bash
cd /workspace/trollpennan-repo
node rundor/R1-dela-spel/mat/props.mjs '[{"namn":"KartaLager","cond":2248}]'   # props + typer per JSX-block
node rundor/R1-dela-spel/mat/helpmap.mjs                                         # vilka hjälpfunktioner används var
node rundor/R1-dela-spel/check-spel-struktur.mjs --steg a                        # röd före
rg -o "kropp ===" src/spel | wc -l                                               # 141
npx tsc --noEmit -p tsconfig.pages.json                                          # 0 fel
# R1B (på 89fd859, före skriptet):
node rundor/R1-dela-spel/mat/r1b-plan-gen.mjs rundor/R1-dela-spel/mat/r1b-spec.json  # props, typer och importer per block (rådata till r1b-plan.json)
node rundor/R1-dela-spel/check-spel-struktur.mjs                                  # steg b, röd före / grön efter
node rundor/R1-dela-spel/r1b-ordagrant.mjs                                        # röd före (filer saknas) / grön efter
```
