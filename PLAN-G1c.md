# PLAN-G1c — Djur som vandrar i hage och stall

När ett djur bor i en sluten hage, eller i ett stall eller hus intill den, vandrar det mellan hagens rutor. Utan hage stannar det på byggnadens ruta. Kort tryck ger glädjeskutt och pratbubbla.

## Steg

1. `vandra.ts`: tillåtna celler, deterministisk vandrare, boende ur `garden`/`hemma`/`ang`, och `synkaTestSparning` för `trollpennan:v1`.
2. `GardDjur.tsx` ritar och stegar i `useFrame` (refs, ingen `setState`) och fyller `window.__gard3d.djur`. `Garden3D` visar listan och låter `platser()` följa djuren.
3. `egnaMaterial` klampas till `metalness <= 0.15` och `roughness >= 0.65`, även utan `fargHex`, så `fence_simple.glb` blir matt trä.
4. Enhetstester i `gard3d.test.ts` (2×2, L-hage, staket och stall). Sedan `prov-g1.mjs --fas g1c`, typecheck, eslint, `check:struktur`, `build:pages` och `skarm-g1.mjs` vid 375×812.

## Kontrakt

- Ortogonala grannar i `tillatnaCeller`. En L-hage skär aldrig hörnet `(3,4)`. 1×1 byter kvadrant så djuret rör sig inne i rutan.
- `Spel.tsx` orörd. Inga nya `data-testid`. Ordet för fri kamerastyrning står inte i `Garden3D.tsx`.
- Filer under 400 rader. Inga röst-anrop. Bara `gard3d.test.ts` bland testerna.

## Färdigheter

- typescript-best-practices: yttre JSON tolkas med typskydd, inga `as`.
- 3d-web-game-check: fast kamera, `useFrame` muterar refs, blob-skugga, tryckyta.
- stylized-3d-art-direction: matt material, varm träton, mjuk markskugga, glädjeskutt.
