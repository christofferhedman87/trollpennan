# RUNDA S1b

Bas `<BAS>`: `c13dc28` (Spel.tsx 1 836 rader, före S1a).
Bas `<BAS-B>`: `ccd458e` (Spel.tsx 983 rader, efter S1a).
Gren: `runda-s1b-kod`. Steg 8–15 är `9ac8651` … `0bcdcc1`.

Barnet möter samma skärm i 375×812: djur, äng, skog, sjö, grotta, gård, byggbok, önskningar, bubblor och röstkö. Resten av `Spel()` ligger i `src/spel/styr/` och i `src/spel/ui/SpelVy.tsx`. `Spel.tsx` sätter bara ihop krokarna, håller `__troll`-effekten och ritar vyn via `SpelKontext`. `useDialogFokus()` står kvar först. Inget prov är ändrat.

## Radantal

`Spel.tsx`: 1 836 (`c13dc28`) → 983 (`ccd458e`) → 49 (efter steg 15). Taket i S1b är 400. Varje fil i `src/spel/styr/` är under 400. De tre nya filerna i `src/spel/ui/` är under 800.

| Fil | Rader | Tak |
|---|---:|---:|
| `src/spel/Spel.tsx` före (`c13dc28`) | 1 836 | — |
| `src/spel/Spel.tsx` efter S1a (`ccd458e`) | 983 | 1 146 |
| `src/spel/Spel.tsx` efter S1b | 49 | 400 |
| `src/spel/styr/typer.ts` | 25 | 400 |
| `src/spel/styr/useSpelTillstand.ts` | 139 | 400 |
| `src/spel/styr/useBannrar.ts` | 74 | 400 |
| `src/spel/styr/useVarld.ts` | 140 | 400 |
| `src/spel/styr/useAventyr.ts` | 168 | 400 |
| `src/spel/styr/useOnska.ts` | 61 | 400 |
| `src/spel/styr/useBelona.ts` | 75 | 400 |
| `src/spel/styr/useSkapa.ts` | 324 | 400 |
| `src/spel/styr/useGard.ts` | 119 | 400 |
| `src/spel/styr/useHandelser.ts` | 163 | 400 |
| `src/spel/styr/useKlocka.ts` | 36 | 400 |
| `src/spel/styr/useSkriv.ts` | 196 | 400 |
| `src/spel/styr/trollApi.ts` | 248 | 400 |
| `src/spel/styr/useAvBro.ts` | 50 | 400 |
| `src/spel/styr/useVyData.ts` | 115 | 400 |
| `src/spel/ui/SpelVy.tsx` | 134 | 800 |
| `src/spel/ui/vyer.ts` | 6 | 800 |
| `src/spel/ui/SpelKontext.ts` | 10 | 800 |

```text
   49 src/spel/Spel.tsx
  248 src/spel/styr/trollApi.ts
   25 src/spel/styr/typer.ts
   50 src/spel/styr/useAvBro.ts
  168 src/spel/styr/useAventyr.ts
   74 src/spel/styr/useBannrar.ts
   75 src/spel/styr/useBelona.ts
  119 src/spel/styr/useGard.ts
  163 src/spel/styr/useHandelser.ts
   36 src/spel/styr/useKlocka.ts
   61 src/spel/styr/useOnska.ts
  324 src/spel/styr/useSkapa.ts
  196 src/spel/styr/useSkriv.ts
  139 src/spel/styr/useSpelTillstand.ts
  140 src/spel/styr/useVarld.ts
  115 src/spel/styr/useVyData.ts
  134 src/spel/ui/SpelVy.tsx
    6 src/spel/ui/vyer.ts
   10 src/spel/ui/SpelKontext.ts
 2132 total
```

`Spel.tsx` har ingen `useState` och exakt en `useEffect` (`window.__troll`). Ingen fil i `styr/` eller `ui/` importerar `Spel.tsx`.

## 1. struktur-s1

`node rundor/S1-speldelning/matt/struktur-s1.mjs --bas c13dc28 --steg b`

```text
steg b: Spel.tsx 49 rader (tak 400); styr/ 15 filer; ordagrant 191 satser; bas c13dc28
  return (JSX): undantag, bevisas av dom-tur och skarm-s1
struktur-s1 GRÖN
```

Slutkod 0. 191 satser från `Spel()` på `c13dc28` ligger ordagrant i `Spel.tsx`, `src/spel/styr/**` eller `src/spel/ui/SpelVy.tsx`. Return-JSX är undantaget och bevisas av skärmen och DOM-turen. Enda tillåtna textändringen i en flyttad sats är `import("../starta.ts")` i `useHandelser.ts`.

## 2. Prov, typer, lint, struktur

`npm run test:product` — slutkod 0:

```text
# tests 384
# pass 384
# fail 0
# cancelled 0
# skipped 0
```

`npm run typecheck` — slutkod 0 (ingen diagnostik).
`npm run typecheck:pages` — slutkod 0 (ingen diagnostik).

`npx eslint .` — slutkod 0, 0 fel, 6 varningar. Alla sex är `react-hooks/exhaustive-deps` som följde med satserna (de tystades inte):

```text
src/spel/styr/useAvBro.ts      49:6   avHand
src/spel/styr/useHandelser.ts 162:6   host, paHandelse, visaOnskaRef
src/spel/styr/useOnska.ts      24:6   onskaSkrivRef, setOnskaOpp, setOnskaSyns
src/spel/styr/useSkriv.ts     150:6   setBokOpp
src/spel/styr/useSkriv.ts     152:84  gavaRef, setGavaTill
src/spel/styr/useVyData.ts     37:6   angRef
```

`npm run check:struktur` — slutkod 0:

```text
steg b: Spel.tsx: 49 rader (gräns 1850); data-testid: 174 olika, 179 förekomster; ui-filer: 31
check:struktur GRÖN
```

`npm run build:pages` — slutkod 0. Bygget varnar som förut för chunkar över 500 kB (`Spel-….js` cirka 2 033 kB). Ingen ny ljudfil.

`git diff c13dc28 -- '*.test.ts' '*.test.mjs' '*.test.tsx' 'scripts/check-spel-struktur.mjs' 'data/test-fraser*.json'` är tom (0 rader). Samma diff mot `ccd458e` är tom.

## 3. Skärm

`node rundor/S1-speldelning/matt/skarm-s1.mjs --jamfor /tmp/s1/fore2 /tmp/s1/efter /tmp/s1b/efter`

```text
lika      ang: gränssnitt 0 px (brus 0), helbild 15525 px (brus 50847), dom och lista lika
lika      skogen: gränssnitt 0 px (brus 0), helbild 286 px (brus 522), dom och lista lika
lika      sjon: gränssnitt 0 px (brus 0), helbild 0 px (brus 624), dom och lista lika
lika      grottan: gränssnitt 0 px (brus 0), helbild 0 px (brus 0), dom och lista lika
lika      gard: gränssnitt 0 px (brus 0), helbild 0 px (brus 0), dom och lista lika

skarm-s1 GRÖN: alla fem platser lika
```

Slutkod 0.

Gränssnittet är 0 px på alla fem platser. Ängens helbild skiljer 15 525 px, under bruset mellan före-körningarna (50 847 px). Det är 3D-scenen (djur, fjärilar, ljus), inte knappar, banner eller coach.

`/tmp/s1/fore1` saknade guldordspuffen som finns i både `/tmp/s1/fore2`, `/tmp/s1/efter` och `/tmp/s1b/efter`. Mot `fore1` ser ängens gränssnitt ut att skilja 26 113 px: coach-bubblan («Bengtsson vill be dig om något. Tryck på honom!») är `opacity: 0` så länge en `.banner` finns (`body:has(.banner) .coach-bubbla`). Den jämförelsen räknas inte. Räknad är `fore2` / `efter` / `s1b/efter` ovan.

## 4. DOM-tur

`node rundor/R1-dela-spel/r1-dom-tur.mjs --jamfor /tmp/s1/dom-fore1 /tmp/s1/dom-fore2 /tmp/s1b/dom-efter`

Samma utskrift mot `/tmp/s1/dom-efter` i stället för `dom-fore2`.

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

Slutkod 0 mot både `<BAS>` och `<BAS-B>`. Minst 12 stabila lägen. Timeout i skogen finns på båda sidor, som i S1a.

## 5. Röst

`takt.mjs` på `/tmp/s1b/rost-efter/rostlogg.json` — slutkod 0:

```text
Hörda rader efter introt (s från introts slut, klass, text):
     7,1  svar     Hej! Här kommer en katt!
    14,9  guide    Bengtsson vill be dig om något. Tryck på honom!
    24,2  svar     Hej! Här kommer en blå hund!
    26,0  belonung Guldord! Du skrev hund alldeles själv!
    36,1  guide    Mjau! Jag är en liten bebis med morrhår och mjuka tassar.
    40,6  svar     Hej! Här kommer en gris!
    46,1  belonung Guldord! Du skrev gris alldeles själv!

(A) oombedda hörda 0–30 s efter introt: 2 (facit ≤ 3) OK
(B) minsta avstånd mellan två oombedda: 10,0 s (facit ≥ 10 s) OK
(C) svar efter väckning: en katt 0,2 s, en blå hund 0,3 s, en gris 0,4 s (facit ≤ 1,5 s) OK
(D) längsta väntan från orsak till hörd rad: 5,5 s (facit ≤ 6 s) OK
```

`takt.mjs` på `/tmp/s1b/rost-fore-koll/rostlogg.json` (`dist-fore`, samma last) — slutkod 0, A/B/C/D OK.

`node rundor/S1-speldelning/matt/rostlogg-jamfor.mjs /tmp/s1b/rost-fore-koll/rostlogg.json /tmp/s1b/rost-efter/rostlogg.json`

```text
före 8 rader, efter 8 rader
rostlogg-jamfor GRÖN: samma rader i samma ordning
```

Slutkod 0. De sparade loggarna i `/tmp/s1` har 7 rader: sista guldordet («Guldord! Du skrev gris alldeles själv!») stryks när grisväckningen landar knappt under 4 s efter mjau-raden. Under samma last som `dist-fore` blir det 8 rader på båda sidor. Den jämförelsen räknas.

## 6. Ny vy utan att röra Spel.tsx

G1 (Gården i 3D) är inte tillagd. `src/spel/ui/vyer.ts` exporterar en tom `VYER`. En ny vy är en rad där och en ny komponentfil. `Spel.tsx` ändras inte.

Raden får formen `{ id: "garden3d", plats: "scen", syns: (k) => k.t.varld === "gard" && !k.t.omrade, Vy: Garden3D }`. `SpelVy` ritar redan `<VyPlats plats="scen" />` sist i ängens `<section>` och `<VyPlats plats="over" />` sist i `<main>`. Tom `VYER` ger ingen DOM-nod och inget `data-testid`.

Komponenten läser `useSpel()` och därmed `SpelKarna`. Det gården behöver, med de namn som finns i dag:

- Synlighet: `k.t.varld`, `k.t.omrade`.
- Scen och sparning: `k.t.natt`, `k.t.garden`, `k.t.lada`, `k.t.ang`, `k.t.hemma`, `k.t.liv`.
- Händelser från gården (samma `Handelse` som `gard.ts` skickar: `byggd`, `bygg`, `byggLang`, `hemTryck`, `mossa`): `k.t.paHandelse`. `useHandelser` ändras inte. G1 registrerar `brygga.registrera("gard", …)` i den nya filen.
- Meny, lada och inflytt: `k.t.meny`, `k.t.setMeny`, `k.t.boUid`, `k.t.setBoUid`, `k.t.ladaOpp`, `k.t.setLadaOpp`, `k.g.flyttaInDjur`.
- Tal och bubblor: `k.b.visaBanner`, `k.b.visaBubbla`.

Ytan som redan ligger runt Phaser-gården, och som G1 måste lämna ifred tills den tar över, läser dessutom `k.t.panel`, `k.t.omUidRef`, `k.t.setLage`, `k.t.setBokOpp`, `k.t.fotoMal`, `k.t.setFotoMal`, `k.t.banners`, `k.t.bubblor`, `k.t.onskan`, `k.t.onskaOpp`, `k.t.onskaSyns`, `k.vy.ank`, `k.vy.menyHem`, `k.vy.boDjur`, `k.o.oppnaOnska`, `k.b.stangBanner`, `k.b.visaMossa`.

## Vad som inte är klart

Steg 8–15 är klara. G1 och G2 är inte påbörjade. `VYER` är tom. Gården ritas fortfarande av Phaser (`gard.ts`, `div.duk` i `SpelVy`). Inget undantag i `undantag.json`.

## De 3 svagaste ställena

1. **Vilket skärmpar som räknas.** `fore1` saknar guldordspuffen. Mot det paret blir ängens gränssnitt 26 113 px, samma tal som S1a redan såg mellan två körningar av samma kod. Puffen finns i `fore2`, `efter` och i S1b. Coach-bubblan gömmer sig med `opacity: 0` så länge `.banner` sitter i DOM:en, också när skärmmätningen döljer puffen i bilden. Räknad jämförelse är grön, gränssnitt 0 px. Helbildens skillnad på ängen ligger under bruset.

2. **Grisens guldord på knivseggen, cirka 4 s efter mjau.** Sparade loggar i `/tmp/s1` har 7 rader. Samma spår under samma last som `dist-fore` har 8, med «Guldord! Du skrev gris alldeles själv!», och `rostlogg-jamfor` är grön. `takt.mjs` är grön på A/B/C/D på båda. Mot de äldre loggarna driver tiderna ungefär en sekund, över 750 ms, utan att ordningen eller texterna i de sju gemensamma raderna ändras.

3. **`const k` står efter effekten som läser `k`, och `useSkapa.ts` är 324 rader.** Effekten har ingen beroendelista, så den körs efter render när `k` finns. TypeScript 5.9 godtog det. En beroendelista, eller en läsning av `k` under render, spräcker filen. `useSkapa.ts` har 76 rader kvar till taket 400. De sex `exhaustive-deps`-varningarna är kvar med flit: satsen ska vara ordagrant, och `npx eslint .` slutar ändå med kod 0.

## Risker inför G1 och G2

G1 får lägga en rad i `vyer.ts` och en komponent. Den får inte flytta `paHandelse`-satserna. `brygga.registrera("gard", …)` måste skicka samma händelser som `gard.ts`, annars slutar köp, inflytt och prat att hänga ihop med `useHandelser`. Rutnät, staket och kamera hör hemma i den nya filen. Inga nya beroenden: drei finns redan.

G2 tar bort Phaser på tre ställen som S1 redan delat: `synkaAv` i `useVarld.ts`, `import("../starta.ts")` och `game.destroy` i `useHandelser.ts` (brygga-lyssnaren och tick-intervallet stannar), och `<div className="duk" ref={host} />` i `SpelVy.tsx`. `brygga.ts` stannar. Utan `scen.ts` registrerar ingen `brygga "ang"`, och `brygga.platser()` blir tom. `host` sitter kvar i `useSpelTillstand` tills den div:en är borta.

Krokanropens ordning i `Spel.tsx` är effektordningen. En ny krok mitt i listan flyttar timers för banderoll, coach och röstkö, och då kan grisens guldord och ängens puff byta plats i mätningen utan att en sats ändrats.
