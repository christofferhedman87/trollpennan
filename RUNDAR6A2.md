# Runda R6A-2 – Klicka på Doktor Bengtsson

Körning av färdig patch `rundor/R6A-2-klicka-bengtsson/ref/r6a-2.patch` på `runda-r6a-2`. Ingen kod, data, bild under `public/npc/` eller text i `data/` är ändrad för hand.

Node i skalet var v20.19.2. Alla `npm`- och `node`-kommandon kördes med `PATH=/home/box/.local/node22/bin:$PATH` (`node -v` → v22.23.3). Playwright-chromium fanns (`chromium-1248`).

## Steg 2 (före patch)

`npm run test:product 2>&1 | grep -E "^# (tests|pass|fail)"`:

```
# tests 97
# pass 97
# fail 0
```

`npx eslint src 2>&1 | tail -3`:

```
✖ 17 problems (4 errors, 13 warnings)
  3 errors and 0 warnings potentially fixable with the `--fix` option.
```

## Steg 4

`npm run test:product 2>&1 | grep -E "^# (tests|pass|fail)"`:

```
# tests 103
# pass 103
# fail 0
```

`npm run typecheck:pages` (exit 0):

```
> typecheck:pages
> tsc --noEmit -p tsconfig.pages.json
```

`npx eslint src 2>&1 | tail -3`:

```
✖ 17 problems (4 errors, 13 warnings)
  3 errors and 0 warnings potentially fixable with the `--fix` option.
```

`npm run check:struktur` (exit 0):

```
> check:struktur
> node scripts/check-spel-struktur.mjs

steg b: Spel.tsx: 1809 rader (gräns 1850); data-testid: 126 olika, 128 förekomster; ui-filer: 16
check:struktur GRÖN
```

`git diff origin/main --stat -- data public`: tomt (0 byte).

## Steg 5

`npm run build:pages` byggde klart (`✓ built in 1.57s`). Vite skrev en varning om chunkar över 500 kB. Sedan:

`node rundor/R6A-2-klicka-bengtsson/klicka-prov.mjs --ut docs/skarmbilder/r6a2/efter/klicka-bengtsson-build.png` → `exit=0`.

```json
{
 "mine_start": "framsida",
 "utrop_start": 1,
 "figur_ruta": {
  "x": 4,
  "y": 562,
  "w": 118,
  "h": 176
 },
 "malstorlek_ok": true,
 "remsa": "Doktor Bengtsson: Det verkar som att din kanin fryser. Se om du kan skriva fram något som värmer.",
 "skriver": true,
 "mine_fel": "automat",
 "status_efter_fel": "pagar",
 "klar_replik_syns": true,
 "mine_klar": "glad",
 "stjarnor_plus": 2,
 "status_efter_klar": "klar",
 "bok_klara": [
  "Doktor Bengtsson: Det verkar som att din kanin fryser. Se om du kan skriva fram något som värmer."
 ],
 "sidfel": [],
 "bildfel": [],
 "ok": true
}
```

Kontaktark `docs/skarmbilder/r6a2/efter/klicka-bengtsson-build.png`, läst och jämfört med Arkitektens `docs/skarmbilder/r6a2/efter/klicka-bengtsson.png` (finns på `origin/main`). Fyra rutor, samma scener:

1. Äng, ★ 0. Bengtsson nere till vänster, framsida, rött "!". Knappen "Pennans bok" längst ned.
2. Pennans bok. Remsan "Doktor Bengtsson: Det verkar som att din kanin fryser. Se om du kan skriva fram något som värmer." Tangentbord och "Vakna!".
3. Efter fel svar. ★ 1. Skämtruta: "Hmm, det där ser fint ut, men jag tror inte att det hjälper. Försök med något annat!" Bengtsson kliar sig vid en röd biljettautomat (automat-minen). Blått ägg "bl" och en grå katt. Pratbubbla "Hej! Här kommer en katt!".
4. Efter rätt svar. ★ 3. Bengtsson vinkar (glad mine). Ruta: "Ahh, så skönt! Nu är kaninen varm igen. Tack för hjälpen!" Stort ägg "filt" och lila ägg "varm".

Ingen ruta avvek. Inget ändrades efter bilden.

## Avslut

1. Steg 4: tester 103/103 (fail 0); typecheck exit 0 utan felrader; eslint 17 problems (4 errors, 13 warnings); struktur GRÖN, Spel.tsx 1809 rader (gräns 1850), 126 olika testid, 128 förekomster; `git diff origin/main --stat -- data public` tomt.
2. Provet exit 0, `"ok": true`, övriga fält som i JSON ovan (`sidfel` och `bildfel` tomma). Ruta 1 framsida med "!", ruta 2 remsa och tangentbord, ruta 3 automat och skämtrad, ruta 4 glad mine och ägg. ★ går 0 → 1 → 3 i bilden; JSON säger `stjarnor_plus` 2.
3. Patchen är enda kodändringen. Data, `public/npc/` och texter är orörda för hand. Ett kontaktark, inga andra bilder.
4. Inte kört: riktig mobil, Phaser-prov, finjustering av läge eller storlek. Provet är headless mot den byggda sidan.
5. Turer: 11, räknat till och med leverans-commiten.
6. Texterna är utkast (`granskad: false` i ritningen). Figurens läge, felminen (automaten) och texterna väntar på Christoffers smak-ja (RITNING avsnitt 5).
