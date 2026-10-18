# R2.1 – bok-skrollning

Patchen `ref/r2-1-bok.patch` (3 CSS-rader, textvakt `bokSkrollning.test.mjs`, `test:bok` i package.json) applicerades av Build; trädet är identiskt med patchen (`git apply --check -R` ok). Build nådde max 15 turer innan rapport; granskning, rapport och leverans gjordes av Doodle. Ingen kod eller CSS ändrad utöver patchen.

Node v22.23.3. `test:bok` 2/2. `test:product` 83/83. `typecheck:pages` 0 fel. `build:pages` grönt. `git diff origin/main --stat`: package.json, src/styles.css, src/spel/bokSkrollning.test.mjs.

Fingerdrag (CDP Input.dispatchTouchEvent, mobilemulering) `bok-touch.mjs`, 412x780, 360x640, 375x667 (båda flikar): alla `drag.*.mitt` = 135 (≥100), `botten.sistaSyns` = true. Även 375x812: mitt 135 i båda flikarna, sistaKortBottom 682 < vaknaTop 744, sistaSyns true. Före patchen var alla mitt 0 (Arkitektens mätning).
DOM-tur `--jamfor`: 28 av 28 lika, exit 0, 0 sidfel.
Ej gjort: riktig Android-enhet.
