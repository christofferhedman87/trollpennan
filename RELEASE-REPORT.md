# Trollpennan B03: mobilkomposition, delcheckpoint

## Status
B03 är delvis genomfört. Detta är en statisk CSS-testkandidat baserad på B02R-3, inte en ny fullständig Vite-build och inte slutrelease. B04 har inte påbörjats eftersom B03:s återstående kvalitetsgrind inte är godkänd.

## Baslinje och filåtkomst
Använda filer: Trollpennan-checkpoint-B02R-3.zip och Trollpennan-cloudflare-pages-B02R-3-test.zip från användarens korrigerade SharePoint-länkar. Arkiven blev tillgängliga lokalt efter öppning. De tidigare filåtkomstproblemen var inte bevis på att ZIP-filerna var korrupta. Binärdata i textsammanfattningen användes inte som kodunderlag.

## Genomfört
Ny public/mobile-b03.css med motsvarande länk i källprojektets index.html och deploymentens index.html. JavaScript-bundles är oförändrade från B02R-3.
- Stående mobil: skrivbokens höjd 66dvh. På kortare skärmar används 76dvh för att behålla kontrollutrymme.
- Bokhuvud, textrad, Vakna och flikar får flex-shrink:0.
- Kompaktare guide och egen rullning för öppna idéer; 44 px summary och 52 px Vakna i stående mobil.
- Safe-area-anpassning för HUD, nederknapp och dialogark.
- Liggande mobil: kompaktare guide, begränsad idélista, skyddade huvudkontroller.
Färger, typsnitt, renderers, sparnycklar, parser, modeller och texturkö är oförändrade. Inga nya externa resurser eller tjänster.

## Verifierat i denna körning
70/70 enhetstester körda på B02R-3-källprojektet med B03:s CSS/HTML-tillägg passerar.
20/20 kontroller i Chromium/SwiftShader på statisk kandidat via lokal HTTP: 375×812, 320×640, 812×375 och 1280×800. För varje storlek: inget horisontellt dokumentöverflöde, Vakna minst 44 px hög, Vakna inom skärmen, bokhuvud minst 44 px högt, drake kan skapas via idéknapp och Vakna.
Boken öppnades med tangentbordets Enter; detta bevisar inte pekaktivering av öppningsknappen på alla storlekar. Reducerad rörelse var aktiv i den godkända körningen. Första körningen stoppades vid öppningsknappens stabilitetskontroll; den begränsningen är inte bortförklarad som löst produktfel.
Kandidatens bokhöjd vid 375×812 är cirka 536 px och Vakna 52 px. In-page-toggle av stylesheet gav inte en tillförlitlig före-mätning; före-värden har därför tagits bort och ingen numerisk före/efter-vinst hävdas.
Skärmbild: Trollpennan-B03-verifierad-mobil.png.

## Bygg- och releasebegränsningar
Ingen ny Vite-build eller full Pages-typkontroll utfördes i B03. Statiska B02R-3-bundles återanvänds med separat CSS-lager. Källprojektet inkluderar samma CSS i public och index.html för nästa riktiga build. Detta är inte en minifierad bundlepatch.
Historiska B02R-3-resultat är inte nya B03-regressioner. Fullt äventyr, modellfallback, nästlade dialoger, lång cleanup/session, pekflöden, iOS/Android och verklig mobilprestanda har inte kontrollerats på B03.

## Nästa block i ordning
B03-2: fullfölj mobilkomposition och kvalitetsgrind. Testa peköppning med normal rörelse, kortlista/idélista på små skärmar, nästlade dialoger, safe-area/varningsöverlapp och längre scenbyten. Återställ npm-beroenden från låsfil, kör riktig Vite-build, Pages-typkontroll, 70 tester och aktuella browserregressioner. Först när B03 är godkänt: B04 innehållsutökning, därefter tillgänglighet, prestanda och release enligt ursprungsplanen. Ingen mellanbekräftelse behövs.

## Återställning och kontext
Återställning: B02R-3-arkiven. Ta bort public/mobile-b03.css och dess index-länk för att återgå. Projektets auktoritativa plan finns i HANDOFF.md/BLOCK-STATUS.md/verification/STATUS.json, inte i gamla chattsammanfattningar. Ingen säkerställd negativ kontexteffekt har identifierats. Överlämningsprompt medföljer som reserv, inte som krav på chattbyte.


## Aktuell B03-2-körning 2026-10-13
- npm ci: exit 0, 479 paket.
- Typkontroll: exit 0; pages-main.tsx, src/spel, src/tolk och vite.pages.config.ts ingick.
- Produkttester: 70 passerade.
- Pages-build och outputkontroll: passerade; 504 filer, 14 936 433 byte.
- Browserregression: blockerad före assertions av timeout vid menyinteraktion.
- Fysisk enhet: inte testad.

## B03-2 fortsättning 2026-10-13
- Rotorsak för tidigare browserstopp: Playwright locator.click fastnade i actionability/stability. Hit-test visade ingen främmande överlagring. Direkt pekinmatning aktiverade samma produktknapp och menyflöde.
- Ny touchbaserad browserregression: 8/8 passerade i Chromium/SwiftShader med normal rörelse.
- Aktuell tangentbords-, fokus- och lagringsregression: 11/11 passerade.
- Slutlig omkörning: typkontroll, 70/70 produkttester, Pages-build och outputkontroll passerade.
- Ingen produktkod eller paketversion ändrades. Två testskript tillkom för reproducerbar diagnos och touchregression.
- Kvarstår före helt stängd B03-2: komplett överlagrad dialogmatris, alla föreskrivna scenpar och fysisk mobiltest.

## B03-2 ytterligare regression 2026-10-13
- Touchkorrigerad B02R-2-regression: 9/9 passerade. Täcker karta, sjö/gård, skogsguidning, modellfallback, fortsatt skapande och omladdning.
- Äldre extended-B01R: 9/10 assertions sanna men processen gav felaktigt exit 0 trots en falsk assertion för tangentbordsskapande. Resultatet räknas inte som godkänd svit. Den aktuella specifika tangentbordsregressionen 11/11 är fortsatt giltig.
- Backup/import via fil-UI, korrupt import, v1-migrering, 320 px overflow och lagringsfel verifierades i den äldre sviten.
- Full föreskriven kombination av bok med köp-, backup/import- och återställningsdialog ovanpå boken är fortfarande inte bevisad av denna svit.

## Tre automatiska arbetssteg 2026-10-13
1. Strikt verifieringsgrind tillagd: JSON-sviter ger nu exit 1 vid tom eller falsk assertion. Tre aktuella sviter passerade strikt kontroll.
2. Scen-/kartregressioner sammanställda: 8/8 scen/progression samt 9/9 karta/fallback passerade. Full separat äng/grotta-loop återstår.
3. Hela tekniska grinden kördes om efter teständring: typkontroll, 70/70 produkttester, build och outputkontroll passerade.
B03-2 hålls fortsatt öppen eftersom full dialogkombinationsmatris, separat full scenmatris och fysisk enhet inte är verifierade. B04 ej påbörjad.
