# Runda R1A – flytta ut typer, data, hjälpfunktioner och två små komponenter ur `Spel.tsx`

**Mål (i spelarens ord):** inget. Spelet ska se ut och bete sig exakt som idag. Skillnaden är bara att en del av de 3 133 raderna i `src/spel/Spel.tsx` flyttas ordagrant till små filer i `src/spel/ui/`, så att nästa runder inte krockar i samma fil.

**Skills:** inga för den här rundan (ren TypeScript-flytt, ingen grafik, ingen design). Läs inga skills och generera inga bilder. Beställningen här går före skill-rutinen i `AGENTS.md`.

**Detta är en flytt, inte en mätning.** Radnummer, namn, importer och typer är redan uppmätta av Arkitekten och står nedan och i `rundor/R1-dela-spel/RITNING.md` (avsnitt 4 är din beställning, resten är bakgrund). **Mät inte, utforska inte, bygg inga egna analysskript.** Första ändringen inom dina första 10 verktygsanrop. Commit efter varje steg. Om du har färre än 8 turer kvar: skriv `RUNDAR1A.md` först.

## Steg (i prioritetsordning; steg 4 är det som räknas)

**1. Förflyg.** `git fetch origin`; `git switch -c runda-r1a origin/main`. Kontrollera att `git diff 37913b3 -- src` är **tom** (annars STOPP, skriv `RUNDAR1A.md`). `cp src/spel/Spel.tsx /tmp/Spel.orig.tsx` (alla radnummer nedan gäller kopian). `node -v` (skriv resultatet i `RUNDAR1A.md`). Finns inte `node_modules`: `npm ci`.

**2. Skydd (röd före).** Kopiera **oförändrade**: `rundor/R1-dela-spel/check-spel-struktur.mjs` → `scripts/check-spel-struktur.mjs` och `rundor/R1-dela-spel/r1-dom-tur.mjs` → `verification/r1-dom-tur.mjs`. Lägg exakt två rader i `package.json` under `scripts`:
```json
"check:struktur": "node scripts/check-spel-struktur.mjs",
"check:struktur:a": "node scripts/check-spel-struktur.mjs --steg a",
```
Kör `npm run check:struktur:a` och bekräfta att den är **röd** (`Spel.tsx har 3133 rader`, fem `ui/`-filer saknas). Commit "R1A steg 1: strukturvakt och DOM-tur".

**3. Före-bevis (innan någon källfil ändras).** `npm run build:pages` (**inte** `npm run build`, den kör databasmigrering). Sätt `export CHROMIUM_PATH=/opt/pw-browsers/chromium-1208/chrome-linux64/chrome` om filen finns (annars Playwrights egen webbläsare; finns ingen: kör **inte** installation, hoppa över steg 3 och 5-turen och skriv "DOM-tur ej körd" i `RUNDAR1A.md`). Kör två gånger (varje tar 2–4 min): `node verification/r1-dom-tur.mjs --dist dist-pages --ut /tmp/r1/fore1` och `... --ut /tmp/r1/fore2`. Kopiera `tur.json` och alla `*.dom.html` från vardera till `rundor/R1-dela-spel/dom-fore/fore1/` och `fore2/`, och fyra bilder till `docs/skarmbilder/r1/`: `/tmp/r1/fore1/02-ang-djur.png`, `03-bok-kort.png`, `07-meny.png`, `12-ordbok.png` som `fore-ang-djur.png`, `fore-bok-kort.png`, `fore-meny.png`, `fore-ordbok.png`. Commit "R1A steg 2: före-bevis".

**4. Flytta (kärnan).** Kontrollera först ankarraderna i `/tmp/Spel.orig.tsx` (`sed -n 'Np'`); avviker en rad: STOPP.

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

Skapa sedan de fem filerna med exakt detta (ordagrant, ingen omskrivning, ingen omformatering):

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

Ändra sedan `src/spel/Spel.tsx` så här och **inget annat**:
1. Ta bort rad 83–465 och rad 3092–3102 (lämna rad 466 `export function Spel() {` och `declare global` r.3103–3133 orörda).
2. Ta bort importerna: rad 6–11 (sex JSON-importer; behåll rad 12 `introJson`), importen av `arSparrat` (`@/tolk/sparr.ts`), importen av `ritaDjur` (`./billboard.ts`), samt `materialMed` och `type ByggeTolk` ur importen från `@/tolk/byggtolk.ts` (behåll `BYGG, byggMedId, formelBygg, tolkaBygg`).
3. Lägg till dessa importer efter de övriga:

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

`npm run typecheck:pages` ska vara grön (baslinje: 0 fel) och `npm run check:struktur:a` grön. (Arkitektens provkörning av exakt dessa steg i en skräpkopia: 0 typfel, `Spel.tsx` 2 740 rader, `check:struktur:a` grön.) Lägg till det typkontrollen saknar och ta bort det skriptet anger som oanvänt, ingenting annat. Commit "R1A steg 3: typer, data, hjälpfunktioner och två komponenter ur Spel.tsx".

**5. Efter-bevis.** `npm run build:pages`; `node verification/r1-dom-tur.mjs --dist dist-pages --ut /tmp/r1/efterA`; `node verification/r1-dom-tur.mjs --jamfor rundor/R1-dela-spel/dom-fore/fore1 rundor/R1-dela-spel/dom-fore/fore2 /tmp/r1/efterA` (ska ge **exit 0**). `test:product` med Node ≥ 22.6: är `node -v` lägre, kör `mkdir -p /tmp/n22 && (cd /tmp/n22 && npm init -y >/dev/null && npm i node@22)` och sedan `PATH=/tmp/n22/node_modules/.bin:$PATH npm run test:product` (förväntat 75/75). `npx eslint src/spel/Spel.tsx src/spel/ui` (0 fel). `rg -o "kropp ===" src/spel | wc -l` ska vara **141**. `git diff origin/main --stat -- data src/tolk` ska vara **tomt**. Lämna `/tmp/r1/` kvar.

**6. Slutrapport.** Skriv `RUNDAR1A.md` i repots rot (kort): vad som inte blev gjort, de tre svagaste ställena, risker för R1B (nästa körning flyttar JSX-blocken), `node -v`, antal turer du använde, och om DOM-turen kunde köras. Commit. **Pusha inte, öppna ingen PR, rör inte `main`.**

## Får INTE ändras
Inget beteende, ingen text, inget `className`/`data-testid`/`aria-*`, ingen JSX, inga hooks, inga handlers, inga villkor. Inga nya tillstånd. Inte `window.__troll` eller `declare global`. Inte `data/**`, `src/tolk/**`, `angen3d.tsx` eller någon annan spelfil än `Spel.tsx`. Ingen ny beroende. Ingen formatering av flyttad kod. Ingen `React.memo`. Ändrade filer får bara vara: `src/spel/Spel.tsx`, `src/spel/ui/*`, `scripts/check-spel-struktur.mjs`, `verification/r1-dom-tur.mjs`, `package.json` (två rader), `rundor/R1-dela-spel/dom-fore/**`, `docs/skarmbilder/r1/*.png`, `RUNDAR1A.md`.

## Reservplan
Är turerna nästan slut: skriv `RUNDAR1A.md` först, sedan klart delmål. R1A går att merga om steg 1, 2 och 4 samt punkt 1–3 nedan är gröna, även om DOM-turen inte hann köras.

## Stopp
Stoppa och skriv `RUNDAR1A.md` med orsaken (lämna grenen opushad) om: `git diff 37913b3 -- src` inte är tom; ett ankare inte stämmer; ingen källfil ändrats efter 8 turer; typkontrollen har fel efter tre rättningsförsök i samma steg (`git restore` steget); eller ett bevis bara kan bli grönt genom att ändra beteende. Ändra aldrig koden för att få grönt.

## Visa att … (acceptans)
1. `npm run check:struktur:a` var **röd** i steg 2 och är **grön** nu (klistra in båda utskrifterna i `RUNDAR1A.md`).
2. `npm run typecheck:pages` är grön.
3. `test:product` ger 75/75 med Node ≥ 22.6 (skriv vilken Node).
4. `--jamfor` fore1/fore2/efterA slutar med exit 0 (minst 12 stabila lägen, inga skillnader): klistra in sista raderna av utskriften.
5. `git diff --name-only origin/main...HEAD` listar bara de tillåtna filerna ovan.
6. `rg -o "kropp ===" src/spel | wc -l` = 141 och `git diff origin/main --stat -- data src/tolk` är tom.
7. Fyra bilder `docs/skarmbilder/r1/fore-*.png` finns (375×812).
Tester som går igenom är inget bevis ensamma; DOM-jämförelsen och bilderna är beviset att ingenting ändrats.
