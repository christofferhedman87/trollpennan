# RUNDA-G1c

Djuren som bor i stall, hus eller hage syns på Gården i 3D och vandrar inne i sitt område. En sluten hage (eller ett stall intill den) ger hagens rutor. Ett fristående hus ger bara hemrutan. Kort tryck ger glädjeskutt och pratbubbla.

## Steg

| Steg | Status |
| --- | --- |
| 1. `vandra.ts`: tillåtna celler, deterministisk vandrare, boende, `trollpennan:v1` | klart |
| 2. `GardDjur` i scenen, `platser()` följer djuren, `__gard3d.djur` | klart |
| 3. Matt material (`metalness` ≤ 0,15, `roughness` ≥ 0,65) även utan färg | klart |
| 4. Tester, `prov-g1 --fas g1c`, skärmprov 375×812 | klart |

## Filer

| Fil | Rader |
| --- | ---: |
| `src/spel/gard/vandra.ts` | 347 |
| `src/spel/gard/GardDjur.tsx` | 209 |
| `src/spel/gard/Garden3D.tsx` | 232 |
| `src/spel/gard/modellPrep.ts` | 157 |
| `src/spel/gard/ByggModell.tsx` | 229 |
| `src/spel/gard/gard3d.test.ts` | 221 |

`src/spel/Spel.tsx` är orörd (49 rader). Inga nya `data-testid`. Inget `OrbitControls` i `Garden3D.tsx`. Inga röst-anrop.

## Prov

`node rundor/G1-garden/matt/prov-g1.mjs --fas g1c`: `"ok": true`. Vandrare i 2×2: `forflyttad` 12,95, 4 celler, 0 steg utanför.

`npm run typecheck` och `npm run typecheck:pages` gröna. `npx eslint .`: 0 fel, 6 befintliga varningar i `src/spel/styr/`. `npm run check:struktur` GRÖN (174 unika `data-testid`, 179 förekomster). `npm run test:product`: 390 tester, 0 fel.

`skarm-g1.mjs` vid 375×812: `"ok": true`. Canvas 375×812, en sluten hage, tre djur (häst och hund i `hage-1`, katt på husets ruta). `forflyttad` cirka 2,1 och `iTillatenCell` sant i alla åtta prover. Inga sid- eller konsolfel.

Bilder: `trollpennan-nulage/ko-24okt/g1c/bilder/gard-3d-start.png` och `gard-3d-vandring.png`.
