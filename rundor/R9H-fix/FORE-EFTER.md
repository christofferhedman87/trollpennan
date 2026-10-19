# R9H – samma Playwright-prov före (main 37f2db9) och efter (patchen)

`node rundor/R9H-fix/r9h-prov.mjs --dist <dist-pages>` – 375×812, 34 steg. Ett block som kraschar blir ett rött steg.

| Steg | main 37f2db9 | R9H |
|---|---|---|
| 1 mus/touch: ingen "Till stallet" vid ankomst till skogen (3 s) och efter "Till ängen" | **FEL** (4/4 röda – knappen syns varje gång) | OK |
| 1b knappen från ängen följer inte med till skogen | FEL¹ | OK |
| 2 bannern borta direkt efter Hämta ut / kommer inte tillbaka / borta efter platsbyte | **FEL** (3/3) | OK |
| 2b köad stall-banner visas inte efter Hämta ut | OK (slump: hann inte visas) | OK |
| 3 varje tryck ger knappen för rätt djur | FEL¹ | OK |
| 4a sugen kanin → gåvoruta → stäng/öppna → skapa-läget → "en gris" blir djur | **FEL** (blocket kraschar: boken öppnas igen i gåvoläget, skapa-guiden kommer aldrig) | OK |
| 4b "en hund" i gåvorutan → läget slutar, nästa ord blir djur | **FEL** | OK |
| 4c efter "ett äpple" till eget djur: ingen gåvoruta | OK (fungerade redan för egna djur) | OK |
| 5 stall-listan "en räv", inget "röv", ≥18 px | FEL¹ (inget "röv" – OK även på main) | OK |
| inga sidfel | OK | OK |

¹ Delvis provartefakt: på main saknar knappen `data-uid`, så provet kan inte se vilket djur knappen hör till. Fel 1, 2 och 4 är äkta fel på main; fel 3 är bevisat i `r9h.test.ts` (osynliga träffar) och genom att Phaser-läckan i fel 1 är stängd.
