# R1A

Flytten är gjord. Spelets kod är delad, inte omskriven. Gren `runda-r1a`, inte pushad.

## Vad som inte blev gjort

Inget av stegen hoppades över. `CHROMIUM_PATH` (`chromium-1208`) fanns inte. DOM-turen kördes med Playwrights egen Chromium (`chromium-1248` i `~/.cache/ms-playwright`). Ingen webbläsare installerades.

## Acceptans

`node -v` i miljön: **v20.19.2**. `test:product` kördes med **v22.23.3** (`npm i node@22` under `/tmp/n22`): **75/75**, 0 fail.

`npm run typecheck:pages`: grön (0 fel).

`npx eslint src/spel/Spel.tsx src/spel/ui`: 0 fel, 4 varningar. Tre ligger i `Spel()`-kroppen som inte rördes (`skriverAv`, två `useEffect`-deps). En följde med `OnskaAnsikte` (deps-listan `[djur.uid, djur.formel]`).

`rg -o "kropp ===" src/spel | wc -l` = **141**. `git diff origin/main --stat -- data src/tolk` är tom.

`git diff --name-only origin/main...HEAD` innehåller bara tillåtna filer (`Spel.tsx`, `src/spel/ui/*`, strukturvakt, DOM-tur, `package.json`, `dom-fore/**`, `docs/skarmbilder/r1/fore-*.png`, denna fil efter sista commit).

Bilder: `fore-ang-djur.png`, `fore-bok-kort.png`, `fore-meny.png`, `fore-ordbok.png`, alla 375×812.

Turer: 17 verktygsrundor i en körning.

### check:struktur:a före (röd, steg 2)

```
steg a: Spel.tsx: 3133 rader (gräns 2800); data-testid: 124 olika, 126 förekomster; ui-filer: 0

check:struktur RÖD:
- Spel.tsx har 3133 rader, gränsen är 2800. Flytta ut mer enligt rundor/R1-dela-spel/RITNING.md.
- src/spel/ui/typer.ts saknas.
- src/spel/ui/spelData.ts saknas.
- src/spel/ui/hjalp.ts saknas.
- src/spel/ui/OnskaAnsikte.tsx saknas.
- src/spel/ui/HoldOppnare.tsx saknas.
```

### check:struktur:a efter (grön)

```
steg a: Spel.tsx: 2740 rader (gräns 2800); data-testid: 124 olika, 126 förekomster; ui-filer: 5
check:struktur GRÖN
```

### --jamfor (exit 0)

```
lika      18-gard
lika      19-gard-bygger
lika      20-gard-bok

20 stabila lägen av 20, 0 skiljer sig före/efter.
```

DOM-turen kunde köras. `/tmp/r1/` ligger kvar (`fore1`, `fore2`, `efterA`).

## Tre svagaste ställen

1. `hjalp.ts` läser `window.__tredMal` och DOM (`.ang`). `declare global` för `window.__troll` ligger kvar i `Spel.tsx`. Det är avsiktligt, och lätt att råka flytta i R1B.
2. Importlistan i `Spel.tsx` är handplockad. `normFras` exporteras från `hjalp.ts` men anropas bara inifrån den filen. Nästa flytt som anropar en hjälpfunktion från ett nytt ställe måste få en import, utan att raden i JSX skrivs om.
3. `OnskaAnsikte` har en eslint-varning om hook-deps som fanns i originalet. Den ska inte "lagas" i en flyttrunda.

## Risker för R1B

Kvar i `Spel.tsx` är själva `Spel()` (2740 rader). JSX-blocken där stänger över state, setters och hooks. De kan inte lyftas med samma `sed` som modulnivå-funktionerna utan att antingen bli nya komponenter med props eller ta med krok-anrop. Nya komponenter får inte lägga till DOM-noder, `className`, `data-testid` eller `aria-*`, och inte ändra hook-ordning. `data-testid` är 124 unika / 126 förekomster; strukturvakten räknar dem. JSON-sökvägarna i `spelData.ts` har ett extra `../` jämfört med `Spel.tsx`. `React.memo`, formatering och ändringar i `data/**` eller `src/tolk/**` är fortfarande förbjudna.
