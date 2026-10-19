# R9H – fix av fel 1–6 ur Doodles speltest efter R9G (patch + kor.sh, ingen Build)

**Körs av Doodle på main efter att detta underlag är mergat** (bygger på 37f2db9, R9G):
```
git checkout main && git pull && git checkout -b runda-r9h-kod && bash rundor/R9H-fix/kor.sh
```
Exit 0 = commit finns → push, PR, squash-merge. 2 = förutsättning/patch, 3 = test, 4 = Playwright (samma mönster som R9G/B1.4-fix).

## Rotorsaker (hittade med Playwright mot dist-pages, inte gissade)
| # | Fel | Rotorsak | Fix |
|---|-----|----------|-----|
| 1 | "Till stallet" vid ankomst till skogen utan att något djur är tryckt | **Phaser** (2D-scenen ligger kvar under 3D/kartan) lyssnar på hela fönstret (`windowEvents`) och räknar tryck på DOM-knappar som tryck i 2D. Kartknappen träffade ett 2D-djurs träffyta (320×470 px) i `scen.ts` → `brygga "tryck"` med ett riktigt uid → knappen. Återskapat: mus och touch, 5 djur på ängen, karta → Skogen ⇒ knappen syns 100 % av gångerna på main. | Ny `src/spel/pekare.ts` `paDuken(p)`: ett Phaser-tryck räknas bara om det **började på Phaser-duken**. Vakt i `scen.ts` (djur, pointerdown), `gard.ts` (mossa, byggen, hemdjur) och `avscen.ts` (skylt, saker, vilda djur – samma läcka kunde öppna "Vad vill du ge?" av sig själv). Dessutom: knappen nollställs vid platsbyte (`Stall.tsx`). |
| 2 | Bannern "Djuret är i stallet …" ligger kvar efter hämtning | Bannern köas (`bannerKo`) bakom "Nytt ord"/"+1 stjärna" och visas 2,4 s **efter** att barnet redan hämtat ut djuret. | `Spel.tsx` `slackBanner(text)` tar bort texten ur kön och skärmen; `ui/useStallBanner.ts` anropar den när stallet krymper (Hämta ut) eller platsen byts. |
| 3 | Tryck träffar ibland djuret bakom | three.js-strålen träffar även **osynliga** delar (puff-gruppen, plask-ringen); djuret vars osynliga del låg närmast tog trycket och stoppade spridningen. `e.stopPropagation()` fanns redan. | `djur.tsx` `ned`: osynlig träff (`synligKedja`, `pekare.ts`) → släpp trycket vidare till närmaste synliga träff. Phaser-vakten i fel 1 tar bort den andra källan (2D-djur under 3D-duken). |
| 4 | "Vad vill du ge?" blir klistrigt – allt barnet skriver blir gåvor | `gavaTill` nollställdes bara efter en lyckad gåva till eget djur; inte när boken stängdes, inte efter gåva till vilt djur, inte när ett djurord skrevs i gåvorutan. | `Spel.tsx`: gåvoläget slutar **när boken stängs** (effekt på `bokOpp`), efter gåva till vilt djur (utom okänt ord: då får barnet försöka igen) och när ett djur skrivs i gåvorutan (bannern "Djur kan man inte ge bort!" visas, nästa ord blir ett djur). |
| 5 | "en röv" i stall-listan? | **Texten är korrekt "en räv".** `Stall.tsx` visar `d.formel` = tolkens formel (`tolka("en räv").varelse.formel === "en räv"`), ingen obestämd form ur ord.json. "röv" finns bara i `blocklist.json`. Det var typsnittet: ä i 16 px/700 i det rundade typsnittet (Fredoka-familjen) liknar ö på en nedskalad bild. | `.stall-namn` 19 px/800 + test `r9h.test.ts`: formeln för **alla djur i ord.json** innehåller aldrig ett ord ur blocklist.json. Playwright läser `stall-namn-<uid>` = "en räv". |
| 6 | Karttexten syns bara på kartan | **Avsiktligt** (R9G punkt 7: `oppnaKarta` köar inte längre `forsta_gangen` som banner; texten står på kartan; R9G-provet E kontrollerar det). | Ingen ändring. |

## Filer i patchen (`r9h.patch`, 12 filer, +125/−11)
`src/spel/pekare.ts` (ny) · `src/spel/r9h.test.ts` (ny, 4 tester) · `src/spel/ui/useStallBanner.ts` (ny) · `src/spel/Spel.tsx` (+6 rader → 1845, gräns 1850) · `src/spel/ang/djur.tsx` · `src/spel/scen.ts` · `src/spel/gard.ts` · `src/spel/avscen.ts` · `src/spel/ui/Stall.tsx` (`data-uid` på knappen, `stall-namn-<uid>`) · `src/styles.css` · `package.json` (r9h.test i test:product) · `rundor/R1-dela-spel/testid-baslinje.json` (+`stall-namn-…`).
**Inte rört:** data/ (inget Copilot-granskat), Phaser-konfig, spelregler, texter.

## Bevis
- `test:product` 154/154 (150 + 4 r9h), typecheck/typecheck:pages 0, eslint 0 fel, check:struktur GRÖN, build:pages.
- `r9h-prov.mjs` (Playwright 375×812, 34 steg): 1 mus+touch karta→skogen ingen knapp (3 s) och tillbaka; 1b knappen från ängen följer inte med; 2 bannern borta direkt efter Hämta ut och efter platsbyte; 2b köad stall-banner visas aldrig efter Hämta ut; 3 tre fristående djur – varje tryck ger knappen för just det djuret (`data-uid`); 4a sugen kanin → gåvoruta → stäng/öppna → skapa-läget → "en gris" blir ett djur; 4b "en hund" i gåvorutan → läget slutar → nästa ord blir djur; 4c efter "ett äpple" ingen gåvoruta; 5 stall-listan "en räv", inget "röv", ≥18 px.
- **Före/efter:** samma prov mot main 37f2db9 (dist-pages byggt ur main) – se `FORE-EFTER.md`.
- Bilder: `r9h-01-ankomst-{mus,touch}.png`, `r9h-02-hamtad.png`, `r9h-04-gava.png`, `r9h-05-stall-rav.png`.

## Kvar (inte R9H)
Fel 7 platserna tomma → **R8-2a** (`rundor/R8-grafik/R8-2 PROMPT.md`). Fel 8–13 enligt PROJECT.md §19. Observation: ett "sugen" djur öppnar gåvorutan vid varje tryck och täcker då "Till stallet"-knappen; avsiktligt enligt humor.json (`inbjudan: gava`), men värt ett beslut av Christoffer.
