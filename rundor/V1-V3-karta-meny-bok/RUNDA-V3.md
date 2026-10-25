# Rapport Runda V3 — Luftigt skrivfönster i halvhöjd med 3 flikar, synliga ordkort direkt och tömd skrivruta

## Sammanfattning
- **Skrivfönster i halvhöjd (`src/spel/ui/bok-p1.css`):** `.bok` har `max-height: 66dvh; height: 66dvh;` så att `.bok` på `375×812` börjar vid `top: 276 px` (`height: 536 px`) och lämnar övre tredjedelen av 3D-ängen synlig ovanför kortet.
- **Tre vyflikar överst (`src/spel/ui/BokSkarm.tsx`):** Infört `[data-v3="skapar-vy-flikar"]` med `[data-v3="vy-flik-skriv"]` (`✍️ Skriv`), `[data-v3="vy-flik-gata"]` (`❓ Gåta`) och `[data-v3="vy-flik-ideer"]` (`💡 Idéer`), samt fast `×`-stängkryss `[data-v3="bok-stang"]` (`44×44 px`).
- **Synliga ordkort direkt utan rullning (`src/spel/ui/BokSkarm.tsx`, `src/spel/ui/Ledtradsyta.tsx`, `src/spel/ui/bok-p1.css`):** Under `✍️ Skriv` visas `Ledtradsyta` i kompakt 1-radsläge (`kompakt`), kategoriflikarna på en rad och 8 klickbara `.ord-kort` (`[data-v3="ordkort"]`) synliga direkt ovanför `.remsa.skriv-remsa` (`remsaTop: 760 px`) och `Vakna!`.
- **Hela idéknappar och tömd skrivruta:** Under `💡 Idéer` visas alla 6 exempelchips (`[data-testid^="exempel-chip-"]`) med `white-space: normal` (`0` avklippta med ellipsis), och skrivrutan töms (`""`) vid `Vakna!`.

## Ändrade och nya filer (radantal ≤ 400)
- `src/spel/Spel.tsx`: 49 rader (orörd)
- `src/spel/ui/BokSkarm.tsx`: 364 rader
- `src/spel/ui/Ledtradsyta.tsx`: 86 rader
- `src/spel/ui/bok-p1.css`: 76 rader
- `src/spel/v3.test.ts`: 35 rader
- `package.json`: 82 rader

## Verifiering
- `prov-v1-v3.mjs --snabb --del alla`: `ok: true`, `antalFel: 0`
- `prov-v1-v3.mjs --del alla` (`375×812`): `ok: true`, `sidfel: 0`, `antalFel: 0`, `bokTop: 276`, `bokHeight: 536`, `remsaTop: 760`, `antalSynligaKort: 8`, `antalChips: 6`, `antalAvklippta: 0`, `v3KvarTextEfterVack: ""`
- `prov-p4.mjs --del alla`: `ok: true`, `sidfel: 0`, `antalFel: 0`
- `npm run check:struktur`: `GRÖN` (174 unika, 179 förekomster)
- `npm run test:product`: 425/425 tester gröna
- `npm run typecheck && npm run typecheck:pages && npx eslint .`: 0 fel
