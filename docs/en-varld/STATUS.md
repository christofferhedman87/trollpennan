# Status: En värld (plan: ../plan-en-varld-2026-10-29.md)

Uppdateras efter varje steg. Den som tar upp arbetet läser den här filen först och fortsätter vid **Nästa steg**.

| Block | Status | PR | Anteckning |
|---|---|---|---|
| 0 Grund och verktyg | Klar | #250, #251 | Planen, statusfilen, besluten, baslinjen och skills (Modellspanaren och Trollpennan-runda) är föreslagna |
| 1 En dal | Klar | se git-logg | `src/spel/dal/` (Hemdalen, tomter, DalKamera, byggVal). 16 tomter runt ängen (`data/dalen.json`). Gårdens byggen står på tomterna, och äldre sparfiler får lediga tomter automatiskt. Ett finger panorerar och två zoomar. Kameran glider till nya byggen. Tryck på en ledig tomt så hamnar nästa bygge där. Flytta via byggmenyn genom att trycka på en tomt. Gården som resmål (stig, skylt och flygetikett) är borttagen, och "Gården" i meny och karta leder till tomterna. Djur som flyttat in syns på ängen tills block 4 |
| 2 Byggformeln | Klar | se git-logg | `src/tolk/byggform.ts`, 62 formfraser i `data/test-fraser-bygg-form.json`, 4 nya byggord (lada, hönshus, hage, väderkvarn), 5 nya delar (vingar, hjul, kupol, balkong, trappa) och 9 egenskaper. Kopplad till skapandet. Form och egenskaper sparas på bygget (`SparatBygge.form/egenskaper`) men ritas först i block 3. Ordlåset är borttaget (beslut B) |
| 3 Formsystemet | Klar | se git-logg | `src/spel/dal/` (ritplan, Stomme, Byggdelar, Byggverk). Formen blir stomme: byggord, djur (även riggade Quaternius-djur med SkeletonUtils och alfa-rättning) eller sak. Dörr, fönster och hö sätts på former. Delarna torn, flagga, kupol, skorsten, vingar, hjul, balkong och trappa är moduler. Material (is, glas, godis, moln, kristall, guld …) blir skal. Egenskaperna svävar, dansar, snurrar, upp och ner, gnistor, noter, rök och lyser. Nya byggen får en byggstuds. Byggmenyns släppklick sväljs. Tomterna ritas instansierat. 12 byggen + djur = 136 ritanrop |
| 4 Byggnaderna lever | Ej påbörjad | – | |
| 5 Bygga i världen | Ej påbörjad | – | Kräver block 1 |
| 6 Modellskörd | Ej påbörjad | – | Christoffer skapar Poly Pizza-nyckel (beslut C). Börja med GitHub, Quaternius, OpenGameArt och KayKit |
| 7 Slime Rancher-magi | Ej påbörjad | – | |
| 8 Uppdrag, Byggboken och röster | Ej påbörjad | – | Kreativitet fri, stjärnor köper mark (B). Röster: lista i docs/en-varld/nya-repliker.md (D) |
| 9 Städning | Ej påbörjad | – | |

## Nästa steg
1. Block 5: bygga i världen. Ta fram byggordkort i Pennans bok (byggord, former, material, delar och egenskaper som kort, så att barnet kan bygga utan att stava), öppna boken i byggläge när man trycker på en tomt, och lägg kameran närmare vid fokus på bakre tomter (främre byggen skymmer dem idag).
2. Block 4: djuren går hem till sitt bygge på kvällen (`hemma` ritas idag på ängen).
3. Block 6: modellskörd. Börja med GitHub-källorna (Kenney starter kits) och Quaternius.
4. Kvar: staket, mur och port ritas fortfarande som inhägnad med gamla ByggeModell. Gamla `Garden3D` tas bort i block 9.

## Baslinje (2026-10-29, live `34490f7`, 375×812, tom äng efter introt)
- 109 draw calls och 34 354 trianglar. Det är redan över W1:s riktmärke på ≤95 draw calls (stigar, skyltar och horisontmodeller). Block 1 och 3 behöver instansiering och sammanslagna geometrier för att hålla budgeten. Ny budget för en full dal (15 byggen och 20 djur): ≤140 draw calls och ≤150 000 trianglar. Bildtakten går inte att mäta i molnmiljön (programvarurendering).

## Beslut
- A. Kamera: fast vinkel med panorering (dra) och zoom (nyp) inom dalen (2026-10-29)
- B. Byggboken: kreativiteten låses aldrig. Former, material, färger och delar är fria, och stjärnor köper mark, utbyggnader och specialbyggnader. projektregler.md är uppdaterad (2026-10-29)
- C. Poly Pizza: Christoffer skapar en gratis API-nyckel. Den används bara vid körning (miljövariabel) och läggs aldrig i repot
- D. Röster: nya repliker samlas i `docs/en-varld/nya-repliker.md` för Christoffer eller Grok att generera med ElevenLabs

## Fakta för den som fortsätter
- Live: https://trollpennan.christofferhedman87.workers.dev/ (Cloudflare bygger från `main`; byggen från andra grenar fallerar alltid direkt, och det är inget kodfel).
- Nåbara modellkällor från molnmiljön (2026-10-29): git clone från GitHub, raw.githubusercontent.com, quaternius.com, drive.google.com, opengameart.org och itch.io. Blockerade: poly.pizza (Cloudflare), kenney.nl (403), codeload.github.com och api.github.com för repon utanför sessionen.
