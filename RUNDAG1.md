# RUNDA G1

Gårdens skapelser (`"ett tält"`, `"ett rött hus"`) visas som meshopt-dekodade GLB-modeller på varm 3D-sockel, med projicerad skärmyta minst 52×48 px, utan skymmande pratbubbla eller 2D-lykta, och med en enda knapp till Ängen.

## Show that

Skapade byggnader (`"ett tält"`, `"ett rött hus"`) laddas med `MeshoptDecoder` (fabriken avpackas i `kopplaMeshopt`, `useMeshopt = true`) och synkron `useMemo` på varm 3D-sockel. På 375×812 är tältets projicerade ruta 120×64 px och det röda husets 107×69 px (båda ≥ 52×48 px). Synliga `.bubbla`: 0. Synliga `.lykta`: 0. `"Till Ängen"`-knappar: 1. Bevisbild: `trollpennan-nulage/ko-28okt-g/g1-garden-talt-375x812.png`.

`Enter` i `[data-testid="ord-input"]` anropar `vaknaNu()`.

## Prov

`npx tsx rundor/G1-G2-garden-fix/prov-g1-g2.mjs --steg=g1 --ut /workspace/trollpennan-nulage/ko-28okt-g`: `"ok": true`.

`npm run check:struktur`: GRÖN (174 unika `data-testid`, 179 förekomster). `npx tsc --noEmit`: grön.

`ByggModell.tsx`: 319 rader.
