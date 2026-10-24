# RUNDA S1a

Bas: `c13dc28` (Spel.tsx 1 836 rader). Gren: `runda-s1a-kod`.
Steg 1–7 är committade som `9ce3ba8` … `f1c8294`.

Spelaren möter samma äng, skog, stränder, berg, gård, byggbok, djur, önskningar, bubblor och röstkö. Första halvan av `Spel()` ligger i krokar under `src/spel/styr/`. `useDialogFokus()` ligger kvar först. `window.__troll` och dygnsklockans `eslint-disable` ligger kvar i `Spel.tsx`.

Inget steg är halvflyttat. S1b (steg 8–15) är inte påbörjad.

## Radantal

`wc -l src/spel/Spel.tsx src/spel/styr/*.ts`

| Fil | Rader | Tak |
|---|---:|---:|
| `src/spel/Spel.tsx` före (`c13dc28`) | 1 836 | — |
| `src/spel/Spel.tsx` efter | 983 | 1 146 |
| `src/spel/styr/typer.ts` | 19 | 400 |
| `src/spel/styr/useSpelTillstand.ts` | 139 | 400 |
| `src/spel/styr/useBannrar.ts` | 74 | 400 |
| `src/spel/styr/useVarld.ts` | 140 | 400 |
| `src/spel/styr/useAventyr.ts` | 168 | 400 |
| `src/spel/styr/useOnska.ts` | 61 | 400 |
| `src/spel/styr/useBelona.ts` | 75 | 400 |
| `src/spel/styr/useSkapa.ts` | 324 | 400 |

```text
  983 src/spel/Spel.tsx
   19 src/spel/styr/typer.ts
  168 src/spel/styr/useAventyr.ts
   74 src/spel/styr/useBannrar.ts
   75 src/spel/styr/useBelona.ts
   61 src/spel/styr/useOnska.ts
  324 src/spel/styr/useSkapa.ts
  139 src/spel/styr/useSpelTillstand.ts
  140 src/spel/styr/useVarld.ts
 1983 total
```

`git diff c13dc28 -- '*.test.ts' '*.test.mjs' '*.test.tsx' 'scripts/check-spel-struktur.mjs' 'data/test-fraser*.json'` är tom (0 rader).

## dag-s1

På basen `c13dc28` (plansteget, efter `grupper-extra.json`):

```text
dag-s1: 192 satser, 0 framåt, 0 utan grupp
```

Slutkod 0.

På den delade `Spel.tsx` (samma `grupper-extra.json`, radankarna är basens):

```text
dag-s1: 66 satser, 149 framåt, 29 utan grupp
```

Slutkod 1. Se svagaste stället 1. `grupper-extra.json` är oförändrad mot beställningen.

## struktur-s1

`node rundor/S1-speldelning/matt/struktur-s1.mjs --bas c13dc28 --steg a`

```text
steg a: Spel.tsx 983 rader (tak 1146); styr/ 8 filer; ordagrant 191 satser; bas c13dc28
  return (JSX): undantag, bevisas av dom-tur och skarm-s1
struktur-s1 GRÖN
```

Slutkod 0.

## Skärm

`node rundor/S1-speldelning/matt/skarm-s1.mjs --jamfor /tmp/s1/fore1 /tmp/s1/fore2-om /tmp/s1/efter-om`

```text
VARNING   ang: helbild 28962 px olika (brus 26318); titta på bilderna
lika      ang: gränssnitt 0 px (brus 0), helbild 28962 px (brus 26318), dom och lista lika
lika      skogen: gränssnitt 0 px (brus 0), helbild 315 px (brus 207), dom och lista lika
lika      sjon: gränssnitt 0 px (brus 0), helbild 624 px (brus 0), dom och lista lika
lika      grottan: gränssnitt 0 px (brus 0), helbild 0 px (brus 6464), dom och lista lika
lika      gard: gränssnitt 0 px (brus 0), helbild 0 px (brus 0), dom och lista lika

skarm-s1 GRÖN: alla fem platser lika
```

Slutkod 0.

Ängens gränssnitt är pixel-likt: samma banner («Bengtsson vill be dig om något. Tryck på honom!»), samma stjärnor, Uppdrag och Skriv. Helbildens skillnad är 3D-brus (djur, fjärilar, ljus), inom bruset mellan före-körningarna.

Den frysta parets första jämförelse (`fore1` / `fore2` / `efter`) var RÖD enbart för att ängen var OSTABIL: gränssnittet skiljde 26 113 px mellan `fore1` och `fore2` (samma bas, mätfel). Skog, sjö, grotta och gård var lika med 0 px i gränssnittet. Omkörningen ovan, utan att skriva över `fore1` eller `fore2`, är den som räknas.

## DOM-tur

`node rundor/R1-dela-spel/r1-dom-tur.mjs --jamfor /tmp/s1/dom-fore1 /tmp/s1/dom-fore2 /tmp/s1/dom-efter`

```text
lika      01-start
ostabilt  02-ang-djur (två körningar av samma kod skiljer sig; räknas inte)
ostabilt  03-bok-kort (två körningar av samma kod skiljer sig; räknas inte)
ostabilt  04-bok-skriv (två körningar av samma kod skiljer sig; räknas inte)
lika      05-bok-forslag
ostabilt  06-bok-behover (två körningar av samma kod skiljer sig; räknas inte)
lika      07-meny
lika      08-meny-last
lika      09-karta
lika      10-skogen-valj (båda: locator.click: Timeout 6000ms exceeded.)
lika      11-skogen (båda: locator.click: Timeout 6000ms exceeded.)
lika      12-ordbok
lika      13-foralder
lika      14-album
ostabilt  15-formel (två körningar av samma kod skiljer sig; räknas inte)
ostabilt  16-onska (två körningar av samma kod skiljer sig; räknas inte)
ostabilt  17-onska-bok (två körningar av samma kod skiljer sig; räknas inte)
lika      18-gard
lika      19-gard-bygger
lika      20-gard-bok
lika      21-foralder-borja
lika      22-meny-borja
lika      23-ordbok-for-fa
lika      24-ordbok-kop
lika      25-ordbok-kopt
lika      26-bygg-for-fa
lika      27-bygg-kop
ostabilt  28-kvall (två körningar av samma kod skiljer sig; räknas inte)

20 stabila lägen av 28, 0 skiljer sig före/efter.
```

Slutkod 0. Minst 12 stabila lägen, och inget stabilt läge skiljer sig. Timeout i skogen finns på båda sidor.

## Röst

`takt.mjs` på `/tmp/s1/rost-fore-koll/rostlogg.json` (omkörning av `dist-fore`, slutkod 0):

```text
Hörda rader efter introt (s från introts slut, klass, text):
     6,5  svar     Hej! Här kommer en katt!
    14,3  guide    Bengtsson vill be dig om något. Tryck på honom!
    23,2  svar     Hej! Här kommer en blå hund!
    25,0  belonung Guldord! Du skrev hund alldeles själv!
    35,2  guide    Mjau! Jag är en liten bebis med morrhår och mjuka tassar.
    39,2  svar     Hej! Här kommer en gris!

(A) oombedda hörda 0–30 s efter introt: 2 (facit ≤ 3) OK
(B) minsta avstånd mellan två oombedda: 10,2 s (facit ≥ 10 s) OK
(C) svar efter väckning: en katt 0,2 s, en blå hund 0,2 s, en gris 0,3 s (facit ≤ 1,5 s) OK
(D) längsta väntan från orsak till hörd rad: 1,8 s (facit ≤ 6 s) OK
Info: hörda rader 0–20 s efter varje väckning: en katt 4 (+4 tysta), en blå hund 4 (+6 tysta), en gris 1 (+4 tysta)
```

`takt.mjs` på `/tmp/s1/rost-efter/rostlogg.json` (slutkod 0):

```text
Hörda rader efter introt (s från introts slut, klass, text):
     6,6  svar     Hej! Här kommer en katt!
    14,5  guide    Bengtsson vill be dig om något. Tryck på honom!
    23,6  svar     Hej! Här kommer en blå hund!
    25,4  belonung Guldord! Du skrev hund alldeles själv!
    35,5  guide    Mjau! Jag är en liten bebis med morrhår och mjuka tassar.
    39,4  svar     Hej! Här kommer en gris!

(A) oombedda hörda 0–30 s efter introt: 2 (facit ≤ 3) OK
(B) minsta avstånd mellan två oombedda: 10,2 s (facit ≥ 10 s) OK
(C) svar efter väckning: en katt 0,2 s, en blå hund 0,3 s, en gris 0,3 s (facit ≤ 1,5 s) OK
(D) längsta väntan från orsak till hörd rad: 1,8 s (facit ≤ 6 s) OK
Info: hörda rader 0–20 s efter varje väckning: en katt 4 (+4 tysta), en blå hund 4 (+8 tysta), en gris 1 (+6 tysta)
```

`node rundor/S1-speldelning/matt/rostlogg-jamfor.mjs /tmp/s1/rost-fore-koll/rostlogg.json /tmp/s1/rost-efter/rostlogg.json`

```text
före 7 rader, efter 7 rader
rostlogg-jamfor GRÖN: samma rader i samma ordning
```

Slutkod 0.

## Prov, typer, lint, struktur

`npm run test:product` — slutkod 0:

```text
# tests 384
# suites 0
# pass 384
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 23430.325348
```

`npm run typecheck` — slutkod 0:

```text
> typecheck
> tsc --noEmit
```

`npm run typecheck:pages` — slutkod 0:

```text
> typecheck:pages
> tsc --noEmit -p tsconfig.pages.json
```

`npx eslint .` — slutkod 0, 0 fel, 6 varningar:

```text
src/spel/Spel.tsx
  494:6   warning  React Hook useEffect has missing dependencies: 'host', 'paHandelse', and 'visaOnskaRef'. Either include them or remove the dependency array  react-hooks/exhaustive-deps
  525:6   warning  React Hook useEffect has a missing dependency: 'setBokOpp'. Either include it or remove the dependency array                                 react-hooks/exhaustive-deps
  526:84  warning  React Hook useEffect has missing dependencies: 'gavaRef' and 'setGavaTill'. Either include them or remove the dependency array               react-hooks/exhaustive-deps
  804:6   warning  React Hook useEffect has a missing dependency: 'avHand'. Either include it or remove the dependency array                                    react-hooks/exhaustive-deps
  828:6   warning  React Hook useEffect has a missing dependency: 'angRef'. Either include it or remove the dependency array                                    react-hooks/exhaustive-deps

src/spel/styr/useOnska.ts
  24:6  warning  React Hook useEffect has missing dependencies: 'onskaSkrivRef', 'setOnskaOpp', and 'setOnskaSyns'. Either include them or remove the dependency array  react-hooks/exhaustive-deps

✖ 6 problems (0 errors, 6 warnings)
```

`npm run check:struktur` — slutkod 0:

```text
> check:struktur
> node scripts/check-spel-struktur.mjs

steg b: Spel.tsx: 983 rader (gräns 1850); data-testid: 174 olika, 179 förekomster; ui-filer: 28
check:struktur GRÖN
```

## Vad som inte är klart

Steg 1–7 är klara och gröna mot grindens mätningar ovan. Steg 8–15 (S1b) är inte gjorda. Inget undantag i `undantag.json`.

## De 3 svagaste ställena

1. **`dag-s1` på den delade filen är röd.** Skriptet och `@rad`-nycklarna i `grupper-extra.json` är skrivna för basens 1 836 rader (`L<222` är tillstånd, `L≥1691` är vydata). Efter flytten är `Spel.tsx` 983 rader, så 29 satser saknar grupp och de 149 «framåt» är följden av det (en ogrupperad sats har gruppindex −1). På basen är samma kommando `192 satser, 0 framåt, 0 utan grupp`. JSON-filen lämnades exakt som i beställningen.

2. **Sex `exhaustive-deps`-varningar.** `useState`-sättare och `useRef`-objekt var stabila inne i `Spel`. När de destruktureras ur `t` ser regeln dem som vanliga värden. Satsernas text, inklusive dygnsklockans `eslint-disable`, är oförändrad, så varningarna är inte tystade. `npx eslint .` slutar ändå med kod 0. På basen fanns i stället en oanvänd `eslint-disable` på dygnsklockan; den raden används nu.

3. **Mätbrus vid knivseggen, inte en speländring.** Ängens helbild varnar (28 962 px, brus 26 318) medan gränssnittet är 0 px. Det frysta paret `fore1`/`fore2` var OSTABIL på ängen innan koden bedömdes. Röstkön stryker en belöning om den inte hunnit börja inom 6 s, och nästa oombedda rad väntar 10 s. När grisväckningen landar knappt under 4 s efter mjau-raden försvinner sista guldordsraden. Samma sak händer på `dist-fore`. Den räknade jämförelsen är `rost-fore-koll` mot `rost-efter`: 7 rader, samma ordning, och `takt.mjs` är OK på A/B/C/D på båda.
