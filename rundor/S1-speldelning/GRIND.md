# Grindutlåtande S1 Spel.tsx delas (Arkitekten 2026-10-24)

Bedömt mot skillen `build-round-gate`, punkt 1–13, för `BESTALLNING-S1a.md` och `BESTALLNING-S1b.md`.
- Bas för analysen: `main` = `507454e` (#189). Där har `Spel.tsx` 1 842 rader.
- S1 körs efter R1. R1 ändrar radnumren och tar bort banner-kön. Ordern låter Build köra `dag-s1.mjs` på sin egen bas och sortera in R1:s nya satser.

**Totalt: JA, med villkor, för både S1a och S1b.**

S1 är **delad i S1a (70 turer, tak 80) och S1b (75 turer, tak 80)**. Delningen beror på storleken, inte på att det finns två regler. Doodle kontrollerar fyra villkor före start:
1. R1 är mergad.
2. Ren klon med `--single-branch` och 0 patchar (punkt 13).
3. fore-bilderna byggs före första ändringen (punkt 6).
4. S1b startar först när S1a är mergad.

| # | Grindpunkt | Ja/nej | Motivering |
|---|---|---|---|
| 1 | Projektkartan är aktuell | JA | `PROJECT.md` på `arkitekt/projekt-lage` är uppdaterad 2026-10-24 med S1a/S1b. Ordern bär själv datavägen, Phaser-kartan för G2 och krokpunkterna för G1. |
| 2 | Återanvändning inuti och utanför | JA | **Utanför:** ts-morph (MIT) som Builds eget flyttskript i `/tmp`, inte som beroende. Det är bulk-knepet: en flytt blir ett anrop och kropparna blir ordagranna av sig själva. Mönstret "custom hook per ansvar" kommer från React-dokumentationen. zustand och reducer är strukna: de kan ändra stale/fresh-beteendet. **Inuti:** `useBengtsson`, `usePlats` och `useStallBanner` som förebild. `r1-dom-tur.mjs` och `check-spel-struktur.mjs` oförändrade. `r1b-flytta.mjs` är ankrat på 2 740 rader och stoppar med slutkod 2; ordern säger att det inte ska köras. **Knep:** *bulk* (codemod), *förenkla* (en krok per ansvar, ordagranna kroppar i stället för omskrivning). Inga nya beroenden, ingen GPL. |
| 3 | Arkitekturregeln | JA | Ingen ny vy i Spel.tsx (regel 3 i PROJECT.md). Nya vyer registreras i `ui/vyer.ts` (`VYER`, tom i S1) och visas genom `VyPlats`, som inte ger någon DOM-nod när listan är tom. Logik ligger i `src/spel/styr/`, högst 400 rader per fil. UI ligger i `src/spel/ui/`, högst 800 rader per fil. Inga körbara importcirklar. |
| 4 | Ritning i ordern | JA | 15 filer med ägande, `Tar`/`Ger`, hookform med kodexempel och typen `SpelKarna`. Ordern anger också `SpelKontext`/`useSpel`, `VyDef`/`VYER`, `skapaTrollApi` och exakt anropsordning. Varje funktion, effekt och ref har sitt radnummer på 507454e. |
| 5 | Datavägen spårad | JA | Statement-inventering och beroendeanalys gjorda med `matt/dag-s1.mjs`: 193 satser, 0 framåtberoenden och 0 utan grupp med den givna gruppordningen. Effekterna har sin ordning (186 → 1667) och krokordningen följer den. Fyra falska larm är kontrollerade för hand: `i3d` (2 ställen), `kvar` och `kort` är lokala namn. Ordern beskriver vad R1 rör. Fällorna är dokumenterade: `tts3.test.ts` läser Spel.tsx, och den dynamiska importen `./starta.ts` måste bli `../starta.ts`. |
| 6 | Provet mäter som skärmen | JA, med villkor | `matt/skarm-s1.mjs` kör spelets egen build i 375×812 med pekskärm. Den ställer upp fem platser (ängen, skogen, sjön, grottan och gården) med samma djur, fryst klocka, fast slump och fejktid i steg om 100 ms. Den sparar helbild, gränssnittsbild (3D-dukarna dolda under bilden) och synliga testid med lådor. `--jamfor` använder fore1/fore2 som brusfilter. **Mätt:** 3D-scenen är inte helt deterministisk i headless WebGL. Helbilden skiljer 0–33 000 px mellan två körningar av samma kod; djurens humör och stjärnorna varierar, men djurens lägen gör det inte. Därför är gränssnittsbilden **strikt (0 px)**, testid-lådorna är strikta (djurens lägen via humörlådorna), listan är strikt, och helbilden och stjärnorna ger **VARNING** som ska förklaras. Provet slår larm på en ändring på 40 px i gränssnittet och på en låda som flyttats 10 px (kontrollerat). Villkor: körningarna görs i följd. DOM-turen (28 lägen) och röstloggen kompletterar. |
| 7 | Snabbprov finns | JA | `tsc` + `tts3`/`tts3fix`/`rost`-proven + `struktur-s1.mjs`, under en minut, efter varje flytt. `struktur-s1.mjs` är rött på main och beskriver vad som saknas. Det slår larm på en ändrad sats; kontrollerat genom att ändra ett tecken i `visaNastaBanner`, vilket gav "inte ordagrant: visaNastaBanner". |
| 8 | Bevis definierat | JA | "Visa att"-listan i båda ordrarna. `struktur-s1` GRÖN innebär: radtak (S1a: bas − 690; S1b: ≤ 400 = `wc -l`), alla satser ordagranna, inget prov ändrat, inga körbara cirklar och krokordningen rätt. Utöver det: `test:product`, `typecheck`, `typecheck:pages`, `eslint`, `check:struktur`, skarm-s1, DOM-turen, och `takt.mjs` med `rostlogg-jamfor.mjs` för röstloggen. |
| 9 | Inställningar valda | JA | `grok-4.7` high. S1a 70 turer (tak 80), S1b 75 turer (tak 80). PLAN inom 6 turer, RUNDA före tur 56 / 60, `--prompt-file`, timeout 60 min, logg till fil. Ren klon från main efter R1 (S1a) och efter S1a (S1b). Skärmjämförelsen tar cirka 3 × 4,5 min, så fore-körningarna startas i bakgrunden i PLAN-steget. |
| 10 | Ett logiskt mål | JA | Inget nytt sökregel- eller lösarsteg; ren omstrukturering. Storleken är räknad enligt O1a-lärdomen (8 anrop per flytt + 10). S1a har 7 flyttar, alltså 66 → 70 turer. S1b har 8 flyttar, alltså 74 → 75 turer. Fallback per del: S1a steg 1–5, S1b steg 8–14 med JSX:en kvar (då blir S1c cirka 30 turer). |
| 11 | Build skriver koden | JA | Arkitekten har bara skrivit beställningar, grind och mätskript: `matt/skarm-s1.mjs`, `matt/struktur-s1.mjs`, `matt/dag-s1.mjs` och `matt/rostlogg-jamfor.mjs`. Ingen spelkod, inget flyttskript och ingen patch. |
| 12 | Ingen merge över eget fynd | JA (gäller efter) | Facit är `struktur-s1` GRÖN, skarm-s1 GRÖN, DOM-turen med 0 skillnader och röstloggen lika. Varje rad i `undantag.json` granskas för hand. Ett ändrat prov betyder ingen merge. |
| 13 | Ingen färdig patch nåbar | JA, med villkor | Det finns ingen patch för S1. `main` har 0 `*.patch`. Det gamla `r1b-flytta.mjs` stoppar på radankaret och är inte tillämpligt. Kvar finns gamla grenar och patchar under `/workspace/` på maskinen. **Villkor:** (a) ren klon med `--single-branch --branch main` till `/tmp/s1-ren`, med en gren och 0 `*.patch`. (b) Efter rundan körs samma diffkommando som i R1-grinden med mönstret `*spel*` / `*dela*`; mer än 20 % lika rader betyder ingen merge. Notera att ordagranna kroppar är **meningen** i S1, så jämför bara mot patchar, inte mot `Spel.tsx`. |

## Kontrollkörningar (Arkitekten, 2026-10-24, svensk tid CEST)
- `struktur-s1.mjs --bas origin/main --steg a` på main 507454e: RÖD som väntat (1 842 > 1 152, 33 funktioner kvar), 192 satser ordagranna. Efter att ett tecken ändrats i en kropp blev den RÖD med "inte ordagrant: visaNastaBanner".
- `dag-s1.mjs` på main 507454e: 193 satser, 0 framåt, 0 utan grupp.
- `r1-dom-tur.mjs` två gånger på main 36fc702: 20 stabila lägen av 28, 0 skillnader. Lägena 10 och 11 (skogen) faller i båda körningarna på ett gammalt testid och räknas som lika.
- `skarm-s1.mjs`, tre körningar av samma kod: se `matt/kontroll-skarm.txt`.

## Risker och öppna frågor
- **R1:s nya satser.** Gruppen bestäms av Build i `grupper-extra.json`. En felplacerad sats ger "framåt" i `dag-s1` eller tsc-fel, inte ett tyst fel.
- **Effektordningen** är den enda platsen där en flytt kan ändra beteende utan att tsc märker det. `struktur-s1` kontrollerar krokordningen, och DOM-turen och röstloggen kontrollerar resultatet.
- **3D-brus.** Helbilden är bara en varning och kan missa en liten ändring i 3D-scenen som inte flyttar något djur. Gränssnittsbilden, DOM-lådorna och DOM-turen är strikta. S1 rör ingen 3D-kod, så risken är liten.
- **Kontextgränsen** (`SpelVy` som barn till `Spel`) lägger till en React-nod men ingen DOM-nod. Barnens effekter körde redan före Spels, så ordningen ändras inte.
- Ingen data med `granskad: true` rörs.
