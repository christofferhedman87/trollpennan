# R9F – färgbyte, motsatser, hel tackbubbla, typer och eslint (ingen Build)

**Kör:** `bash rundor/R9F-fargbyte/kor.sh` på ren main. Exit 0 → committa `src/ data/ package.json` på `runda-r9f`, PR, merge.

**Ordning mot B1.1:** går **före eller efter** B1.1. R9F rör inte `angen3d.tsx` eller `src/spel/ang/`. Rekommendation: lägg på **nu**, före B1.1-merge. Om B1.1 hinner ändra `package.json` (test-listan) lägger kor.sh på patchen med 3-way. Konflikt ger exit 2 utan ändring; be då Arkitekten göra om patchen.

## Orsaker och rättning
1. **"en blå katt" + "lila" blev "en blå och lila katt".** `tillaggFras` (onska.ts) lade tillägget sist på djurets formel, och tolken har två färger ("blå och röd"). Önskan kontrollerar nya taggar mot `farg:lila`, men kroppsfärgen var fortfarande blå. **Rättning:** färg- och storleksord i tillägget ersätter djurets gamla, och adjektiven ställs före djuret ("en lila katt med hatt"). "med …" och "som …" läggs fortfarande sist.
2. **"en hög låg hund"** syntes för att alla egenskapsord kom med i formeln. **Rättning:** fältet `motsats` i ord.json (hög↔låg, varm↔kall) gör att det sista ordet gäller. Storleks- och egenskapsord efter med/vid/i/… eller direkt före en sak ("ett högt torn") hör till saken och läggs inte på djuret. De räknas ändå som hittade ord.
3. **Tackbubblan klipptes i vänsterkanten.** Bubblan är centrerad (translate −50 %) och upp till 18rem bred, men mitten tilläts gå ända ut till 18 % av bredden. **Rättning:** `bubblaStil` (ui/bubbla.ts) begränsar `left` med `clamp()` till en halv bubbelbredd från kanterna. Görs i AngLager, inte i angen3d.
4. **Typer och eslint:** `@ts-nocheck` borttaget, JSDoc-typer i dialogIsolering.test.mjs och bokSkrollning.test.mjs (typecheck 0). eslint src: tomt catch-block (client.server.ts) och `var` (ritaBygg.ts) rättade, 4 → 0 fel (13 varningar kvar som före).
5. **"0/181 hittade"** (bara rapport, inget ändrat): ledtrådsytan i Pennans bok (`ui/Ledtradsyta.tsx`, text `hemligt.hittade` i data/hemligt.json) räknar hemliga djur = ord.json `niva: "fritt"` + `klass: "djur"` med gåta i ledtradar.json (`ui/hemliga.ts`). Det är avsiktligt. 181 är rätt antal. Räknaren i Hud/Ordboken är en annan (`hittatAntal/totalOrd`, alla fritt+kort-ord).

## Bevis (lokalt, 375x812)
test:product 125/125 (nytt `src/spel/r9f.test.ts`), typecheck 0, typecheck:pages grönt, eslint src 0 fel, uppdrag-prov 174/174 och 0 ägg. `fargbyte-prov.mjs`: 3/3 rundor där "en blå katt" + "lila" blir "en lila katt" och önskan klaras. Tackbubblan är hel (vänster 62/110/150 px, höger ≤ 300 px). 0 bubblor utanför skärmen. Obs: i provet hamnade katten aldrig vid vänsterkanten. Kantfallet visas av enhetstestet för `clamp()`.

## Inte i R9F
- `npm run test:reserv` har 3 fel redan på main (före R9F). Läggs i B6.1.
- `npx eslint .` söker också igenom `dist-pages/` (byggutdata) och `verification/` och ger tusentals fel. Lägg `dist-pages/**` i eslint-ignore (B6.1).
