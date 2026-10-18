# R1B – slutrapport

Allt i steg 1–6 blev gjort. Ingen kod skrevs för hand. Ingen push, ingen PR, `main` orörd. DOM-turen kördes **en** gång (28 lägen); ingen omkörning behövde göras. Gren: `runda-r1b` (`9436b2c`, `a6e733c`, plus denna rapport).

`node -v` i skalet: **v20.19.2**. `test:product` kördes med **v22.23.3** (`node@22` i `/tmp/n22`, `PATH` före systemets node): **75/75**, 0 fail. Chromium-sökvägen i ordern fanns inte; turen använde Playwrights egen chromium (1248).

## Steg 2 (rött, före)

`npm run check:struktur` (exit 1):

```
steg b: Spel.tsx: 2740 rader (gräns 1850); data-testid: 124 olika, 126 förekomster; ui-filer: 5
check:struktur RÖD:
- Spel.tsx har 2740 rader, gränsen är 1850.
- src/spel/ui/{AngLager,KartaLager,Hud,BokSkarm,Dialoger,OrdbokDialog,ForalderDialog}.tsx saknas.
```

`node rundor/R1-dela-spel/r1b-ordagrant.mjs` (exit 1): `0/15 kroppar byte-lika`; alla sju filer saknas; 15 anrop hittades 0 gånger; `Spel() utanför blocken har 2658 rader nu men 1671 vid 89fd859`.

## Steg 3

`r1b-flytta.mjs` exit 0: `Klart: 7 filer skrivna, 15 block ersatta, Spel.tsx har nu 1781 rader.`
`npm run typecheck:pages`: 0 fel, utan handrättning.

## Steg 4 (grönt, efter)

`check:struktur` (exit 0): `steg b: Spel.tsx: 1781 rader (gräns 1850); data-testid: 124 olika, 126 förekomster; ui-filer: 12` och `check:struktur GRÖN`.

`r1b-ordagrant.mjs` (exit 0): `15/15 kroppar byte-lika; Spel() utanför blocken: 1671 rader jämförda` och `GRÖN`.

`npx eslint src/spel/Spel.tsx src/spel/ui`: **0 fel, 4 varningar** — `skriverAv` oanvänd (Spel.tsx:147), `useEffect`-deps `visaBanner` (1330) och `skrivTecken` (1373), `djur` i `ui/OnskaAnsikte.tsx:23`.

`rg -o "kropp ===" src/spel | wc -l` = **141**. `git diff origin/main --stat -- data src/tolk public package.json` är **tom**.

## Steg 5

`--jamfor` fore1/fore2/efterB, exit 0. Alla 28 rader `lika`. Sista raden: `28 stabila lägen av 28, 0 skiljer sig före/efter.` Sex bilder `docs/skarmbilder/r1/efter-*.png` är 375×812.

`git diff --name-only origin/main...HEAD` före denna fil: bara `Spel.tsx`, de sju nya `ui/`-filerna och de sex `efter-*.png`.

## Tre svagaste ställen

1. Sex ytor nås av inget läge: skylt, mossa, uppdragsvyn, byggmeny, låda, bo-panel. Där är beviset bara byte-lik JSX-kropp plus att typerna gick igenom, inte körd DOM.
2. DOM-hashen normaliserar bort canvas, tid, stjärnor, bubblor, humor och vissa styles. 3D-scenen och de borttagna bitarna är inte jämförda. Skärmbilderna är sparade, inte pixeljämförda mot `fore-*.png`.
3. `test:product` rör inte de flyttade komponenterna. Grönt där bevisar inte flytten. Beviset är textlikheten (15/15) och DOM-jämförelsen (28/28).
