# Runda R3A – djuren som data

Gren `runda-r3a`. Bas vid start: `414f807` (`origin/main`, R2.1 mergad). `git switch -c` behövdes inte: grenen fanns redan och pekade på samma commit. `src/spel/entiteter.ts` saknades. Node i systemet var v20.19.2; körningarna nedan använde `/home/box/.local/node22/bin` (v22.23.3). `node_modules` fanns, så `npm ci` kördes inte.

`414f807` är senare än ritningens `3a5e1b4`. Mellan dem ligger också `package.json`, `src/spel/bokSkrollning.test.mjs`, `src/styles.css`, `PROJECT.md` och `RUNDAR2-1.md`, inte bara `rundor/`, `data/entiteter.json`, `data/tillgangar.json` och `docs/`. `git apply --check` gick ändå igenom och steg 4 träffade det förväntade, så körningen fortsatte.

## Före patchen

`node --experimental-strip-types rundor/R3A-entiteter/r3a-jamfor.mjs --bas origin/main` (exit 1), väntat:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/workspace/trollpennan-build/src/spel/entiteter.ts' imported from /workspace/trollpennan-build/rundor/R3A-entiteter/r3a-jamfor.mjs
```

Patchen applicerades med `git apply` efter `--check`. WIP-commit: `988bc78` `WIP R3A: patch applicerad`. `git status --short` före den committen:

```
 M package.json
 M src/spel/Spel.tsx
 M src/spel/angen3d.tsx
 M src/spel/gltfDjur.tsx
 M src/spel/liv.ts
 M src/spel/ui/AngLager.tsx
?? src/spel/entiteter.test.ts
?? src/spel/entiteter.ts
```

## Steg 4

`npm run typecheck:pages` (exit 0):

```
> typecheck:pages
> tsc --noEmit -p tsconfig.pages.json
```

`npx eslint` på de sju filerna (exit 0). 0 fel, 9 varningar: Spel.tsx 3 (`skriverAv` oanvänd, `visaBanner`, `skrivTecken`), angen3d.tsx 4 (`lerpHex`, `GEO`, `Formdel`, `tillSign`), gltfDjur.tsx 2 (react-refresh only-export-components på rad 152 och 156). Avslut: `✖ 9 problems (0 errors, 9 warnings)`.

`node --experimental-strip-types --test src/spel/entiteter.test.ts` (exit 0): 8 tester, 8 pass, 0 fail. Namn: datan är hel; kontrollen hittar trasig data; djuren är exakt ord.json-kropparna i albumets ordning; varje modellfil finns och varje fil i `public/models` har en rad; saknade fält ger standard; värden som koden hade i tabellerna; framVinkel; ett nytt djur är en datarad.

`npm run test:product` (exit 0):

```
# tests 91
# pass 91
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 268.842988
```

`node --experimental-strip-types rundor/R3A-entiteter/r3a-jamfor.mjs --bas origin/main` (exit 0):

```
fall 322, avvikelser 0
```

`npm run check:struktur` (exit 0):

```
steg b: Spel.tsx: 1782 rader (gräns 1850); data-testid: 124 olika, 126 förekomster; ui-filer: 12
check:struktur GRÖN
```

`rg -o "kropp ===" src/spel | wc -l`: `20`.

`git diff origin/main --stat -- data src/tolk public`: tomt (exit 0).

`npm run build:pages` (exit 0): vite byggde `dist-pages` på 1,29 s. Chunk-varning över 500 kB, samma typ av vite-varning som bygget skriver ut; exit var 0.

## Steg 5 – kronark

Ett ark: `node rundor/R2-tillbehor-som-data/ark-tillbehor.mjs --ut docs/skarmbilder/r3a/efter --tillbehor krona` skrev `docs/skarmbilder/r3a/efter/01-krona.png`. Lästa mot `docs/skarmbilder/r3a/provkorning-01-krona-efter.png`.

- kanin: krona på huvudet, ansiktet mot kameran.
- katt: krona på huvudet, ansiktet mot kameran.
- hund: krona på huvudet, ansiktet mot kameran.
- drake: krona på huvudet, kroppen framåt.
- häst: krona på huvudet, kroppen framåt.
- fågel: krona på huvudet, i luften.
- fisk: krona på huvudet, i dammen.
- groda: krona på huvudet.
- gris: krona på huvudet.
- dinosaurie: krona på huvudet.
- uggla: krona på huvudet, i luften.
- ekorre: krona på huvudet.
- bäver: krona på huvudet, i dammen.
- haj: krona på huvudet, i dammen.

Inget djur såg fel ut jämfört med referensen (krona på alla 14; kanin, katt och hund mot kameran). Inget ändrades efter bilden.

## Avslut

1. Steg 4 gav de utskrifter som står ovan: typecheck exit 0, eslint 0 fel och 9 varningar, entiteter 8/8, product 91/91, jämförskript `fall 322, avvikelser 0` exit 0, struktur GRÖN, `kropp ===` 20, tom diff för `data`, `src/tolk` och `public`.
2. Kronarket visar krona på alla 14 djur, och kanin, katt och hund tittar mot kameran, i samma upplägg som Arkitektens referens.
3. Jag ändrade inte `data/*.json` och skrev ingen kod. Koden kom från `rundor/R3A-entiteter/ref/r3a-integrera.patch`.
4. DOM-turen kördes inte (Arkitekten har kört den). Ingen andra bild, ingen omtagning, ingen push, ingen PR. `npm ci` behövdes inte.
5. Turar använda: 14, inklusive leveranscommitten.
