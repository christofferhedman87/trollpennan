# Runda S5 — Solstjärnor, gårdsuppgraderingar och Slimepedia

## Vad som byggdes
- Solstjärne-loopen i `src/spel/solstjarna.ts`: favoritmat, `beraknaSolstjarnaBeloning` (`+1 ★` / `+2 ★ Favorit!`), `belonaSolstjarna` och 3D-plopp (`s-solstjarna-plort-cc0.glb`, kristall vid favorit) som står stilla när `window.__PAUSE_ANIM` är sann.
- `albumNiva` 1–3 sparas bakåtkompatibelt från mött djur, ovanlig/favorit och legendarisk, plus maxnivå via `lasAlbumNiva` / `sparaAlbumNiva`.
- Slimepedia-kort i albumet: max två kort per rad, fyra staplade delar (porträtt och namn, stjärnrad, favoritmat, `✍️ Skriv till djuret`).
- Gårdens Soltak till hagen, Musikfontän, Kristall-lykta och Studsbolls-korg sitter i byggboken och i gårdsvyn.
- Gåvor och skapelser uppdaterar Solstjärnor och albumnivå.

## Verifiering
- `node rundor/S4-S5-vaktardjur-solstjarnor-album/prov-s4-s5.mjs --snabb --del alla` — grön (`antalFel: 0`, S4 och S5).
- `npx tsc --noEmit` — grön.
- `npm run check:struktur` — grön (174 unika `data-testid`, 179 förekomster).
- `npm run test:product` — 450 tester, 0 fel.
