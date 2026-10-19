# R8-2b – gör klart R8-2a + fixar (patch + kor.sh, ingen Build)

**Kör (Doodle):** `git checkout main && git pull && git checkout -b runda-r8-2b-kod && bash rundor/R8-2b/kor.sh`
Kräver R9I på main (1f2560d). Ersätter Builds ofullständiga gren `runda-r8-2a` (9c35a63); den ska **inte** mergas.

## Innehåll i `r8-2b.patch` (mot main 1f2560d)
| Del | Vad | Filer |
|---|---|---|
| R8-2a steg 1–6 (Build, rebasat) | `InstansModell`, `DekorRad`/zoner, `spridDekor`, dekor + blobbskuggor, `Horisont` med färger, dekor för skogen/sjön/grottan | kenneyNatur.tsx, platser.ts, platsDekor.ts, PlatsDekor.tsx, dekor.tsx, data/platser.json |
| R8-2a steg 0 | **släppt**: R9I:s `lagg-data.mjs` behåller redan start/zoner/dekor/miljo (samma sak) | – |
| a) Horisont per plats | `miljo.horisont`: `[3 färger]` = skog (kullar + trädkoner), `{typ:"berg",farger}` = kantiga mörka bergväggar längre bak, utelämnad/`"ingen"` = ingen. Grottan = berg | platsDekor.ts `horisontFor`, dekor.tsx `BergHorisont`, platser.json |
| b) Inget svävar | `ankare` mark/vatten/luft (standard ur zonens typ, annars mark); "tak" finns inte (inget tak ritas). Botten på bounding box mot ankaret. Droppstenar `vand:true` = stalagmit på marken. "Plankan" var grottans `grotta`-modell som stack upp bakom horisontbandet – nu står den synlig på marken framför bergen | platsDekor.ts `ankareFor`, gltfDjur.tsx `GltfSak vand`, kenneyNatur.tsx `InstansModell vand`, platser.json |
| c) Skapelser bara på land | `platsYta.ts`: landdjur/saker flyttas till närmaste punkt i `land`/`fri` utanför varje `vattenyta` (samma skala som vattnet ritas i), minst 0,85 isär; simmare till vattenytan; flygare och ängen orörda. Land-dekor hamnar aldrig på vattnet, vatten-dekor alltid. Sjön: vattenytan slutar vid y 0,66 → strand framtill där djuren står; `strand` täcker hela bredden (kroppen hålls 0,6 från vattenkanten) | platsYta.ts, delat.ts `djurPlats(spec, alla, plats)`, djur.tsx, PlatsDekor.tsx, platser.json |
| d) Tester | `r8-2.test.ts` (Builds stash) + `r8-2b.test.ts` (8 tester: land/vatten per plats, flytt, ängen orörd, horisont, ankare, dekor/vatten) | package.json |

## Underlag direkt på main (inte i patchen)
- `rundor/R8-2b/r8-2-prov.mjs`: 375x812 per plats (ängen, skogen, sjön, grottan) rakt/vriden × utan/med 5 djur; mäter draw calls och trianglar per bildruta och skriver ut dem.
- `rundor/R9G-ux-stall/r9g-prov.mjs` steg A: "hopfälld ledtråd" → "ingen gåtruta under uppdrag" (R9I-beteendet).
- `rundor/R8-grafik/RUNDA-R8-2a.md`.

## kor.sh
Ren tree → R9I finns, R8-2b/R8-2a inte redan inlagd → `git apply --check` → test:product, typecheck ×2, eslint 0 fel, check:struktur, build:pages → r8-2-prov → regression r9g/r9i/r9h-prov → commit. Exit 2/3/4 som tidigare, återställer vid fel.

## Kvar till senare
- Kontur på GLB, riktigt vatten (shader), FPS-vakt: ej i denna runda.
- Sjöns sida-dekor (vass/sten till vänster) blir glesare eftersom den inte längre får stå på vattnet.
- Djur på andra platser än ängen får inget humör (`tickLiv` går bara över ängen + gården) – se rapporten om "sugen".
