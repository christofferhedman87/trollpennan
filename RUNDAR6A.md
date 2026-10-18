# Runda R6A-1

Patchen `rundor/R6A-bengtsson/ref/r6a-1.patch` applicerades med `git apply`. Ingen kod, data eller text ändrades för hand.

## Steg 2 (före patch)

`npm run test:product` (urval):

```
# tests 92
# pass 92
# fail 0
```

`npx eslint src` (sista raderna):

```
✖ 17 problems (4 errors, 13 warnings)
  3 errors and 0 warnings potentially fixable with the `--fix` option.
```

## Steg 4

`npm run test:product`:

```
# tests 97
# pass 97
# fail 0
```

`npm run typecheck:pages` (exit 0, ingen felrad):

```
> typecheck:pages
> tsc --noEmit -p tsconfig.pages.json
```

`npx eslint src` (sista raderna, samma som steg 2):

```
✖ 17 problems (4 errors, 13 warnings)
  3 errors and 0 warnings potentially fixable with the `--fix` option.
```

`npm run check:struktur`:

```
steg b: Spel.tsx: 1794 rader (gräns 1850); data-testid: 124 olika, 126 förekomster; ui-filer: 13
check:struktur GRÖN
```

`node --experimental-strip-types rundor/R6A-bengtsson/flode-prov.ts` (exit 0):

```
{
 "lapp": {
  "text": "Jag har tappat min fina silverkotte någonstans bland svamparna. Om du hittar den, lägg den vid stubben. /Ekorren",
  "nytt": "Nytt uppdrag från Doktor Bengtsson: Hoppsan! Ekorren har tappat sin silverkotte och är ledsen. Kan du leta efter den bland svamparna?"
 },
 "klar": {
  "texter": [
   "Uppdrag klart!",
   "Där var den! Nu kan Ekorren sova gott i natt. Tack för hjälpen!",
   "Du fick Silverkotten! Den ligger i Lådan på gården."
  ],
  "stj": 2
 }
}
```

Node skrev dessutom på stderr: `Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.` Exitkoden var 0.

`git diff origin/main --stat -- data`: tomt.

## Steg 5

`npm run build:pages` lyckades (vite, built in 1.33s). Därefter `node rundor/R6A-bengtsson/bok-prov.mjs --ut docs/skarmbilder/r6a/efter/uppdragsboken.png` (exit 0):

```
{
 "menyknapp_last": false,
 "pagar": [
  "Doktor Bengtsson: Mossugglan sover och vill så gärna ha en vän. Väck henne med något blått, så blir ni vänner.",
  "Doktor Bengtsson: Titta, svampar i en ring! Man säger att den som hoppar i ringen får tur. Skicka dit ett djur som kan hoppa.",
  "Doktor Bengtsson: Gamla bävern bygger en ny damm men har slut på material. Kan du ge honom pinnar eller löv?"
 ],
 "klara": [
  "Doktor Bengtsson: Hoppsan! Ekorren har tappat sin silverkotte och är ledsen. Kan du leta efter den bland svamparna?"
 ],
 "sidfel": [],
 "ok": true
}
```

Bilden lästes och jämfördes med `docs/skarmbilder/r6a/uppdragsboken.png`. Båda visar två telefonrutor sida vid sida: Pennans bok, rubriken Uppdragsboken, flikarna Pågår och Klara, tre pågår-rader och en klar-rad. Varje rad börjar med fetstilt «Doktor Bengtsson:». Samma texter i vänster och höger ruta som i Arkitektens ark. Ingen ruta avvek.

## Avslut

1. Steg 4: 97/97, typecheck exit 0, eslint 17 problem (4 errors, 13 warnings), check:struktur GRÖN (Spel.tsx 1794), flode-prov exit 0 med «Nytt uppdrag från Doktor Bengtsson: Hoppsan! Ekorren har tappat …», data-diff tom.
2. Kontaktarket: `"ok": true`, `"menyknapp_last": false`, tre Pågår-rader, en Klar-rad, `"sidfel": []`, exit 0. Bilden matchar Arkitektens ark.
3. Kod, data och texter ändrades inte för hand. Endast `git apply` av `ref/r6a-1.patch`, plus den här filen och skärmbilden från provskriptet.
4. Inte gjort: push, PR, Phaser-genomspel, ändring av Mossa, `liv.ts`, `avscen.ts`, `gard.ts`, `skyltar.json` eller GLB. Standard-`node` var v20.19.2; bevisen kördes med v22.23.3 via `PATH=/home/box/.local/node22/bin`. `dist-pages` från bygget lämnas utanför commiten.
5. Turer: 10 till och med leveranscommiten (förflyg 2, kvitto, patch, WIP-commit, bevis, kontaktark, bildläsning, rapport, commit).
6. Uppdragstexterna är utkast (`granskad: false` i data som redan låg i repot) och väntar på Copilots granskning och Christoffers godkännande av tonen.
