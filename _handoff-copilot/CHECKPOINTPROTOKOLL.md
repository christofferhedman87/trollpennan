# OBLIGATORISKT CHECKPOINTPROTOKOLL

Detta protokoll gäller hela B003-arbetet och får inte hoppas över.

## Grundregel
Ingen godkänd förbättring får endast finnas i en tillfällig arbetsmapp. Efter varje godkänd huvudgrind ska en komplett, verifierad ZIP skapas och levereras i samma svar.

## Före varje ändringsblock
1. Identifiera exakt senaste godkända checkpoint.
2. Kontrollera ZIP CRC och SHA-256.
3. Arbeta i en ny kopia av checkpointen, aldrig direkt i återställningsfilen.
4. Dokumentera vilka produktfiler som får ändras och varför.

## Under blocket
1. Spara första felande test, JSON och logg innan kodändring.
2. Gör minsta möjliga produktändring.
3. Kör om det specifika testet.
4. Kör därefter hela regressionen för blocket och alla tidigare godkända baslinjer.
5. Kontrollera testresultatets assertions separat. Exitkod 0 räcker inte ensam.

## Efter godkänd huvudgrind
Skapa `Trollpennan-B03-CPNN-<kort-status>-YYYY-MM-DD.zip` med:
- all källkod;
- `data/`;
- `public/` och alla modeller/resurser;
- aktuell `dist-pages/`;
- testskript, råa JSON-resultat, loggar och skärmbilder;
- `CHECKPOINT-MANIFEST.json`;
- `RESTORE.md`;
- lista över ändrade produktfiler;
- kända begränsningar och ej testat.

`node_modules` ska normalt uteslutas och återskapas med `npm ci`.

## Obligatorisk verifiering av checkpointfilen
1. ZIP CRC: inga fel.
2. Beräkna SHA-256 och spara i separat `.txt` samt manifestet.
3. Öppna ZIP:en igen och kontrollera att `package.json`, `src/`, `data/`, `public/`, `dist-pages/`, manifest och återställningsinstruktion finns.
4. Kontrollera att filen faktiskt finns i `/mnt/data` innan svaret skickas.
5. Leverera länken omedelbart.

## Vid misslyckad grind
- Skapa inte en checkpoint som ser godkänd ut.
- Behåll senaste godkända checkpoint orörd.
- Spara misslyckade testbevis i arbetskopian.
- Rapportera exakt blockerare och fortsätt korrigera i samma svar så långt verktygen tillåter.

## Kontinuitet mellan chattar
Varje slutlig överlämnings-ZIP ska innehålla:
- senaste godkända checkpoint;
- aktuell arbetskopia om den ligger efter checkpointen;
- denna checkpointmetod;
- aktuell status och blockerare;
- startprompt för nästa chatt;
- SHA-256-manifest för alla överlämningskritiska filer.
