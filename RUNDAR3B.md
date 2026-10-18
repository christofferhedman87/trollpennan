# Runda R3B – okänt ord blir ett ord-ägg

Bas: `origin/main` = `35c80de` (senare än `c46dfbc`, som är förfader). Gren: `runda-r3b`. Patch: `rundor/R3B-reservform/ref/r3b-reservform.patch` (`git apply --check` rent, sedan `git apply`). WIP-commit `10b00ca` squashas till en leveranscommit.

Node i körningarna: v22.23.3 (`/home/box/.local/node22/bin`). Systemets `node` var v20.19.2.

## Steg 2 (kvitto före ändring)

`npx eslint src 2>&1 | tail -3`:

```
✖ 17 problems (4 errors, 13 warnings)
  3 errors and 0 warnings potentially fixable with the `--fix` option.
```

`npm run test:product` (grep):

```
# tests 91
# pass 91
# fail 0
```

## Steg 4 (bevis)

`npm run typecheck:pages` — exit 0, `tsc` skrev inga fel.

`npx eslint src 2>&1 | tail -3` — samma som steg 2:

```
✖ 17 problems (4 errors, 13 warnings)
  3 errors and 0 warnings potentially fixable with the `--fix` option.
```

`npm run test:reserv` — exit 0:

```
# tests 20
# pass 20
# fail 0
```

`node --test scripts/saknade-ord.test.mjs` — exit 0:

```
# tests 4
# pass 4
# fail 0
```

`npm run test:product` — samma antal som steg 2, alla gröna:

```
# tests 91
# pass 91
# fail 0
```

`npm run check:struktur` — exit 0:

```
steg b: Spel.tsx: 1788 rader (gräns 1850); data-testid: 124 olika, 126 förekomster; ui-filer: 13
check:struktur GRÖN
```

`git diff origin/main --stat -- data src/tolk/tolka.ts src/tolk/avstand.ts src/tolk/lexikon.ts public` — tomt.

`git diff origin/main --stat` efter WIP-commit, 12 filer:

```
 package.json                   |   1 +
 src/spel/Spel.tsx              |   8 +-
 src/spel/angen3d.tsx           |   4 +
 src/spel/liv.ts                |   1 +
 src/spel/ordagg.tsx            | 299 +++++++++++++++++++++++++++++++++++++++++
 src/spel/ui/ForalderDialog.tsx |   2 +
 src/spel/ui/SaknadeOrd.tsx     |  66 +++++++++
 src/tolk/reserv.test.ts        | 173 ++++++++++++++++++++++++
 src/tolk/reserv.ts             | 218 ++++++++++++++++++++++++++++++
 src/tolk/saknade.test.ts       |  76 +++++++++++
 src/tolk/saknade.ts            | 127 +++++++++++++++++
 src/tolk/typer.ts              |  13 ++
 12 files changed, 987 insertions(+), 1 deletion(-)
```

## Steg 5 (ett kontaktark)

`npm run build:pages` — byggd (`dist-pages/`, gitignorerad). `ord-agg.mjs` exit 0, utskrift `sidfel []`, bild `docs/skarmbilder/r3b/efter/r3b-ark.png`. Jämförd med `docs/skarmbilder/r3b/provkorning-ark.png` (bildläsning).

- elefant: ett turkost ägg med prickar och spricka, etikett "elefant", bubbla "Hej! Här kommer ett elefant-ägg!".
- en pizza: ett laxrosa ägg med prickar och spricka, etikett "pizza", bubbla "Hej! Här kommer ett pizza-ägg!".
- en kanin med paraply: brun kanin, ett litet gult ägg med etikett "paraply", bubbla "Hej! Här kommer en kanin!".
- en glad kanin som dansar: brun kanin, två små ägg med etiketterna "glad" och "dansar", bubbla "Hej! Här kommer en kanin!". Ingen "Menade du".
- hmmmx: ett rosa ägg med prickar och spricka, etikett "hmmmx", bubbla "Hej! Här kommer ett hmmmx-ägg!".
- en katt som sjunger: grå katt, ett litet grått ägg med etikett "sjunger", bubbla "Hej! Här kommer en katt!".

De tre hela äggen har olika färg. Prickmönstret liknar Arkitektens ark (elefant och hmmmx samma okända form, pizza i matens färg).

`agg-tur.mjs --ut /tmp/r3b-tur` — exit 0. Utskrift:

```
{
 "steg": ["01-elefant", "02-glad-kanin-dansar", "03-garden", "04-ang-igen", "05-album"],
 "kroppar": ["agg", "kanin"],
 "album": ["kanin"],
 "onskelista": ["elefant", "glad", "dansar"],
 "saknade_lista": ["elefant × 1", "glad × 1", "dansar × 1"],
 "export_ord": ["dansar/dansa/handling/1", "elefant/null/okant/1", "glad/glad/egenskap/1"],
 "lagrat": ["trollpennan-saknade-ord"],
 "efterRensa": null,
 "utgaende_utanfor_servern": [],
 "sidfel": []
}
```

## Avslut

1. Steg 4: typecheck exit 0; eslint 17 problem (4 fel, 13 varningar) före och efter; reserv 20/20; saknade-ord 4/4; product 91/91; struktur GRÖN; vakt-diff mot data, `tolka.ts`, `avstand.ts`, `lexikon.ts` och `public` tom.
2. Arket visar ägg för elefant, pizza och hmmmx (etikett med ordet) och vanligt djur med små ägg för paraply, glad+dansar och sjunger. `agg-tur`: `"sidfel": []`, `"utgaende_utanfor_servern": []`, `"efterRensa": null`, exit 0.
3. Ingen data ändrad och ingen kod skriven för hand. Patchen applicerades. `src/tolk/tolka.ts` är orörd.
4. Inte kört: `r3b-matt.mjs` (listan ligger utanför repot; resultat finns i `matt-resultat.json`), DOM-tur (redan körd av Arkitekten), push och PR. `npm ci` behövdes inte. Chromium fanns, installerades inte. `git switch -c` hoppades över för att grenen `runda-r3b` redan pekade på `origin/main`.
5. Turer använda: 15.
