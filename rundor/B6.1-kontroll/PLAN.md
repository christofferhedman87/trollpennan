# B6.1 – kontroll och buggfix (Arkitekten, 2026-10-20)

Patch + kor.sh, ingen Build. Rör inte data/modeller, manifest eller LICENSES.md (modellpaketen körs samtidigt).
Doodle: `git checkout main && git pull && git checkout -b runda-b61-kod && bash rundor/B6.1-kontroll/kor.sh`

## Vad som gjordes och varför

| # | Fynd | Åtgärd | Bevis |
|---|------|--------|-------|
| 1 | GLB med `KHR_materials_unlit` (Kenney Blocky Characters original) → GLTFLoader ger `MeshBasicMaterial`. När barnet skriver ett guldord sätter spelet glans (`emissive`) på modellen och three.js kraschar i `refreshUniformsCommon` ("reading 'value'"). | `src/spel/belys.ts`: obelysta material byts vid inläsning mot `MeshStandardMaterial` (samma textur/färg/alfa, metalness 0, roughness 1) – samma utseende som M12:s `-belyst.glb`. Anropas i `GltfDjur`, `GltfSak` och `kenneyNatur`. Glansen sätts bara på material som har `emissive`. | b61-prov U (obelyst pappa.glb + Guldord, 0 sidfel; mot gamla main: sidfel), b6-1.test.ts |
| 2 | DOM-tur 10–11 inaktuella (skogen låst tills 3 djur, `valj-djur` borta); 02–06, 15–17, 28 ostabila av humörikonen i 3D (R9K) och drei Html-omslagens `translate3d`. | 10 = låst skog → "Inte riktigt än", 11 = tre djur → resan till skogen. Normalisering av `.humor-ikon-3d`, alla `div[style*=translate3d]` och `data-klar`. | 28/28 stabila, 0 fel (två körningar jämförda) |
| 3/D | eslint: 3 fel (modell-inlagg.mjs 1, syntax-check.cjs 2), varningar i src och skript; `eslint .` läste dist-pages. | `dist-pages/**` ignoreras; `.cjs` får `require`; modell-inlagg: bara oanvända namn bort och en kommaoperator till if-sats (logiken orörd). Kompakta grenen i Ledtradsyta bort (ingen anropare skickade `kompakt`, R9I visar ingen gåta under uppdrag). `harModell` flyttad till entiteter.ts (react-refresh), oanvända `skriverAv`, `tillSign`, `tolkaBygg`, exporter bort. Tre effekter (tangentlyssnaren, dygnsklockan, önskeansiktet) har en motiverad eslint-disable-rad i stället för att byta beteende. | `eslint .` 0 fel; src/scripts/verification 0 varningar |
| 4 | Tackbubblan låg över banderollen och över byggets bubbla på gården (lekfullt djur + gunga). Önskan + Guldord krockade inte i 375x812, men inget hindrade det. | `undvikKrock` (ui/bubbla.ts) skjuter varje pratbubbla nedåt förbi banderollerna och äldre bubblor, varje bildruta som bubblor syns (200 ms). | b61-prov K (båda fallen, bilder); mot gamla main: krock på gården |
| 5 | `djur:true` (alla 48 platsuppdrag) och `final:true` (en per plats) används: uppdragsmotorn (`paPlats`, `nastaSkrivUppdrag` med finalOk från milstolpen), `klaraPerPlats` (finalen räknas inte) och `useBengtsson.prova` (`kravUppfylltTolkat` med blevDjur). | **Behålls.** Att ta bort dem skulle låta ett föremål klara ett djuruppdrag och låta finalen komma först. Låses i b6-1.test.ts (alla förslag skapar djur och klarar sitt uppdrag; finalen väntar på milstolpen). | b6-1.test.ts |
| 6/A | "Till stallet" ritades vid djuret (över humörikonen); ett nytt tryck kunde träffa knappen. | Knappen ligger i nedersta UI-raden bredvid Pennans bok (58/42), aldrig över 3D-scenen. | b61-prov S (ängen + sjön) |
| 6 | Djur som hämtats ut ur stallet på en plats gick inte att trycka på: skinnade modeller räknar sin träffsfär en gång, vid första träffprovet – under inpoppningen (skala 0) blev radien 0. | `ingenKulling` räknar om sfären vid varje träffprov. | b61-prov P (alla fyra platser) |
| B | Bokens gåta tog alla 181 hemliga djur i ordning; på sjön kom ett sjödjur först efter 181 "Ny gåta". | `gatUrval`: platsens `hemliga` (data/platser.json) först, andra först när platsens är funna. | b61-prov G, b6-1.test.ts |
| C | Sju färguppdrag (granskad:false) sa "lånar färg från en tomat/himlen/solen/gräset". | Nya Bengtsson-texter, t.ex. "Jag vill se två vänner: en i tomatens färg och en i himlens färg!" Färgordet självt får inte stå i repliken (R6A-regeln "ledtråden läcker inte svaret", alla böjningar). | b61-data.mjs, b6-1.test.ts |

## Spelkontroll 375x812 (alla fyra platser)
Res ängen → skogen → sjön → grottan på kartan, ett uppdrag per plats (kanin-fryser, skog-rod-van, sjo-bla-van, grotta-forsta-skenet),
stall + hämta ut + gåva på varje plats: allt fungerar efter fixarna ovan.

## Lista bara (hör inte hit)
- Färger: "en röd kanin" ser orange ut, "en blå anka" gulgrön (färgfrågan).
- Modeller: räven är en orange blockfigur; räven på sjön står i strandkanten/vattenbrynet.
- Skärmbild av kartan mot grottan med många djur tog > 8 s i swiftshader (bara långsamt i provmiljön).
- Gamla prov som redan faller på main: `R9B-layout/r9b-prov` (väntar sig den kompakta gåtan under uppdrag, borttagen i R9I) och `R9-tydlighet/r9-prov` (väntar på `bengtsson-ikon`).
- `rundor/R3F-modellserie/MFIX/mfix-bygg.mjs` har 2 eslint-varningar (oanvända `vand`, `LJBLA`) – modellpaketets fil, lämnad orörd.
- data/platser.json `milstolpe.final`, `las_upp` och `final_fore` läses inte av koden (finalen kommer ur bengtsson.json `final:true`).
