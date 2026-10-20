# B6.2 – liten fixrunda (Arkitekten, 2026-10-20)

Patch + kor.sh, ingen Build, ingen dataändring. Kräver B6.1. Färg på djur rörs inte (pausad av Christoffer).
Doodle: `git checkout main && git pull && git checkout -b runda-b62-kod && bash rundor/B6.2-fix/kor.sh`

| # | Fynd | Åtgärd | Bevis |
|---|------|--------|-------|
| 1 | `r9b-prov` väntade sig den kompakta gåtan under uppdrag; `r9-prov` väntade sig att idéknappen fyller i hela svaret och att gåtan syns under uppdrag. Båda föll redan på main. | r9b: kontrollerar nu att **ingen** gåta syns under uppdrag (R9I). r9: gåtan/förklaringen/ordkorten kontrolleras i boken utan uppdrag; barnet skriver klart uppdraget självt (R9K); boken öppnar med korten, pennan växlar till tangentbordet. Allt annat (takt, ikon, paus, stjärnor) som förut. | båda exit 0 |
| 2 | "ljus" är ett förled ("ljusblå", "en ljus katt") och reserverades, så saken ljus (stearinljus, M8) gick aldrig att skriva. | `lexikon.ledSak` + `tolka.ts`: ett förled som också är en sak blir saken när inget ord följer, eller bara med/och/som/artikel följer: "ljus", "ett ljus", "ljuset", "två ljus", "en kanin med (ett) ljus". "en ljus katt" och "ljusblå" är som förut. Generellt (ingen kod per ord); i dag gäller det bara "ljus". | b6-2.test.ts, b62-prov L |
| 3 | Räven på sjön stod med tassarna i vattenbrynet: marginalen till vattnet var 0,6 (kropp + vickning), så kameran såg vattnet direkt bakom djuret. | `KANT_MARGINAL` 0,6 → 1,0 (en synlig bit strand). Gäller alla landdjur och saker på alla platser med vatten. | b6-2.test.ts (8 djur på sjön ≥ 0,95 från närmaste vattenpunkt), b62-prov R, r8-2-prov |
| 4 | `milstolpe.final`, `las_upp` och `final_fore` i platser.json lästes inte. | **Inkopplade, inte borttagna.** Platsverktygen (`rundor/BLOCK-platser/verktyg/konvertera.py`) och Copilots utkast (`data-utkast/platser.json`) skriver fälten, så borttagning skulle komma tillbaka, och fälten säger något datan behöver: `milstolpe.final` = vilket uppdrag som är platsens final (`arFinal`: `final:true` **eller** milstolpe.final, test att de stämmer överens); `las_upp` = milstolpen öppnar nästa plats (`upplast`), utöver platsens egna upplåsningsvillkor (i dag samma villkor, så inget beteende ändras); `final_fore.text` = Bengtssons replik när finalen öppnas (banderoll när barnet trycker på honom). `final_fore.min` ("automat") är en mine som inte finns i npc.json – används inte än. | b6-2.test.ts, b62-prov F |

Kvar till senare: färg på djur (pausad), `final_fore.min`.
