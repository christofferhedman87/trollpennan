# R9D – ett uppdrag i taget, förslag som fungerar (ingen Build)

**Kör:** `bash rundor/R9D-uppdragsfix/kor.sh` på ren main. Exit 0 → committa `src/ data/ package.json` på `runda-r9d`, PR, merge.

## Orsaker (Christoffers mobil, 19 okt)
1. **Flera uppdrag i början.** Bubblan "★ Doktor Bengtsson: Ett djur säger …" är en *djurönskan* (data/onskningar.json), inte ett Bengtsson-uppdrag. Önskningarna hade egen hårdkodad takt (30 s efter första djuret, 20 s mellan) och brydde sig inte om `takt` i bengtsson.json. Därför kom de före Bengtssons regel, parallellt med hans uppdrag, och den vanliga pratbubblan ("Hej! Här kommer en kanin med mössa.") låg under önskebubblan.
2. **Skymningsönskan gick inte att klara.** Tolken klarar "lila"/"mörkblå" (bevisat). Men när Bengtssons uppdrag (kanin-fryser) pågick visade boken *båda*: uppdragets stora Idéer (mössa, tröja, luva) överst och önskans exempel (lila, mörkblå) utanför skärmen. Ett tryck på "mössa" lades på önskedjuret (fel för önskan) och Bengtssons kontroll kördes aldrig i önskeläget (fel för uppdraget) → inget godkändes.
3. **Förslag med i/vid/under/på** ("en kanin i ett tält") klarade kravet men gav ett ägg "i" och rutan "Det här ordet har jag aldrig sett!" – prepositionerna fanns inte i tolken. 10 av 14 förslag i main.

## Rättning
- `data/bengtsson.json` `takt.onskan` (ny, data): önskan aldrig medan ett uppdrag pågår, aldrig före `forsta`, först efter 1 klart Bengtsson-uppdrag, ≥110 s efter klart uppdrag, ≥75 s efter förra önskan.
- `uppdragsmotor.ts` `onskaFarKomma()` (ren funktion); `Spel.tsx` använder den i stället för 30/20 s, och tar bort en djurönskan när Bengtssons uppdrag startar. `AngLager.tsx`: önskebubblan väntar medan en annan bubbla syns. `useBengtsson.ts`: `matt()`.
- `data/ord.json` `funktionsord.med`: i, vid, under, på, bredvid, bakom, framför, över, ovanpå, intill, hos, nära → saken står bredvid djuret (som "med").
- `src/spel/r9d.test.ts` i test:product: takten, *varje* förslagsfras mot sitt uppdrag i riktiga tolken (krav + djur, inget ägg för prepositioner), *varje* önskeexempel mot sin önskan.

## Bevis (lokalt, 375x812)
test:product 121/121, typecheck:pages grönt, `uppdrag-prov.mjs`: A ny spelare 0 önskebubblor efter 1 och 3 djur, max 1, 0 överlapp, önskan bort när uppdraget startar; B 14/14 förslag klarar uppdraget i spelet utan ägg; C lila + mörkblå uppfyller skymningsönskan. Se `prov-resultat.json`, `prov-375x812.png`.

## Kvar (inte i R9D)
- B0:s 40 uppdrag (ej i main): 37 förslag ger ägg för okända adjektiv (mjuk, fluffig, varm, kall, högt, låg, långsam, sjungande …) och "till en vän". Kraven klaras. Lägg till adjektiven i ord-data eller skriv om fraserna före B0.
- Snabba uppdrag i följd i samma session: Bengtsson-figuren försvann en gång i provet efter två uppdrag (inget synligt överlägg). Ej återskapat efter omladdning; bevaka.
