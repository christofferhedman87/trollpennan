# Runda R2.1 – bok-skrollning (applicera färdig patch, kontrollera, leverera)

**Mål (i spelarens ord):** man kan dra med fingret i ordlistan i Pennans bok, och de nedersta orden syns ovanför Vakna!-knappen.

**Skills:** inga. **Detta är en körning av en färdig patch: du skriver ingen kod, ändrar ingen CSS och mäter ingenting.** Patchen (`rundor/R2-1-bok-skrollning/ref/r2-1-bok.patch`) är tre CSS-rader, en textvakt (`src/spel/bokSkrollning.test.mjs`) och en rad i `package.json`. Läs `rundor/R2-1-bok-skrollning/RITNING.md` avsnitt 2–3 först (en tur).

## Hårda regler
1. Max 15 turer; **allt committat, pushat och rapporterat senast tur 12.** Räkna turer.
2. Ändra ingenting utöver patchen. Inga bilder, inga omtagningar, ingen DOM-tur. Inga andra filer.
3. Faller något: STOPP (nedan). Laga inte, gissa inte.

## Steg
**1. Förflyg (1 tur).** `git fetch origin && git switch -c runda-r2-1 origin/main`; `git log -1 --format=%h` (ska vara `a183ea9` eller senare); `ls rundor/R2-1-bok-skrollning/ref/r2-1-bok.patch`; `node -v` (≥ 22.6; annars `PATH=/home/box/.local/node22/bin:$PATH`); saknas `node_modules`: `npm ci`.

**2. Applicera (1 tur).** `git apply --check rundor/R2-1-bok-skrollning/ref/r2-1-bok.patch && git apply rundor/R2-1-bok-skrollning/ref/r2-1-bok.patch && git status --short`. Förväntat: ` M package.json`, ` M src/styles.css`, `?? src/spel/bokSkrollning.test.mjs`. Gör sedan `git add -A && git commit -q -m "WIP R2.1: patch applicerad"`.

**3. Kontroller (1–2 turer, kör i en rad).** Klistra in utskrifterna i `RUNDAR2-1.md`:

| Kommando | Förväntat |
|---|---|
| `npm run test:bok` | 2/2 |
| `npm run test:product` | allt grönt (83 före, oförändrat antal) |
| `npm run typecheck:pages` | 0 fel |
| `npm run build:pages` | grönt (inte `npm run build`) |
| `git diff origin/main --stat` | `package.json`, `src/styles.css`, `src/spel/bokSkrollning.test.mjs` |

**4. Fingerprov i webbläsare (högst 3 turer; hoppa över om Playwrights Chromium saknas, installera inte, skriv det).**
`node rundor/R2-1-bok-skrollning/bok-touch.mjs --dist dist-pages --ut /tmp/bok-efter > /tmp/bok-efter.json` (ca 2 min; kör i bakgrunden och läs filen). Kräv i JSON: för alla sex fall `drag.knapp/glipa/kant.mitt` ≥ 100 och `botten.sistaSyns` = `true`. (Före patchen var alla `mitt` 0 och alla `sistaSyns` `false`.) Läs inga bilder.

**5. Leverans (2–3 turer).** Skriv `RUNDAR2-1.md` (utskrifterna, JSON-utdraget, ärligt utlåtande: vad som kördes/inte kördes, att du inte ändrat något). `git reset --soft origin/main && git add -A && git commit -q -m "Runda R2.1: bok-skrollning (fingerdrag i ordlistan)"`, `git push -u origin runda-r2-1`, öppna PR mot `main` (titel `Runda R2.1: bok-skrollning`).

## STOPP
Skriv `RUNDAR2-1.md` med vilket steg som stoppade och den avvikande utskriften ordagrant, committa bara den filen, pusha, öppna **ingen** PR med kodändring.
