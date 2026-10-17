# AKTUELL STATUS: endast B003
Datum: 2026-10-14

## Uppdragets enda mål
Kontrollera, korrigera och slutverifiera alla återstående fel i B003. Påbörja inte B004. När B003 är stängt ska arbetet avslutas med en komplett överlämning till en separat nästa chatt som får uppdraget att påbörja och slutföra B004.

## Auktoritativ utgångspunkt
- `RESTORE_POINTS/Trollpennan-B03-CP01-teknisk-baslinje-godkand-2026-10-14.zip` är senast godkända kompletta återställningspunkt.
- `PROJECT_CURRENT/` är aktuell arbetskopia efter CP01. Ingen produktkod har ändrats efter CP01.
- `PROJECT_CURRENT/verification/current/CP02-dialog-matrix.mjs` är det nya kompletterande testet.
- `PROJECT_CURRENT/verification/current/CP02-dialog-matrix-first.log` och `CP02-dialog-matrix.json` visar den aktuella blockeraren.

## Godkänt i CP01
- `npm ci --ignore-scripts --no-audit --no-fund`: exit 0.
- `npm run test:product`: 70/70, fail 0.
- `npm run typecheck:pages`: exit 0.
- `npm run build:pages`: exit 0.
- `npm run check:pages-output`: 504 filer, 14 936 744 byte.

## Ytterligare godkända befintliga regressioner efter CP01
- `browser-B02R.mjs`: 11/11.
- `browser-B03-2-touch.mjs`: 8/8.
- `browser-B03-2-B02R-2-touch.mjs`: 9/9.
- Alla tre avslutades med exit 0 och JSON-resultaten kontrollerades separat.

## Aktuell blockerare i CP02
Det kompletterande testet reproducerar följande i 320×640, 375×812 och 812×375:
- underliggande lager blir inte `inert` för återställning, import och köp;
- återställningsknapparna bedöms inte fullt nåbara i den aktuella matrisen;
- matrisen avslutas med exit 1.

Fokus, Tab, Shift+Tab och Escape fungerar i huvudsak, men CP02 får inte godkännas förrän alla assertions passerar.

## Avsedd korrigering
Arbeta primärt i `src/spel/dialogFokus.ts`:
1. Isolera syskongrenar kring översta synliga dialogen med `inert`.
2. Bevara varje elements tidigare `inert`-status och återställ endast sådant hooken själv ändrat.
3. Ändra aldrig element som redan är `inert` av en annan funktion, exempelvis introflödet.
4. När fokus flyttas till dialogens första kontroll, säkerställ att kontrollen blir synlig på små skärmar, exempelvis genom villkorad `scrollIntoView`.
5. Bevara lagerkorrekt Escape och fokusåtergång.

Ändra inte spelregler, parser, texter, data, sparformat eller andra funktioner utan ett nytt reproducerat fel som kräver det.

## Krav för CP02
- CP01-baslinjen ska fortsatt passera.
- Befintliga regressioner 11/11, 8/8 och 9/9 ska passera.
- Hela `CP02-dialog-matrix.mjs` ska passera i alla tre skärmstorlekar.
- JSON ska ha minst ett resultat, noll falska resultat och noll okontrollerade sidfel.
- Skärmbilder ska sparas.
- Först därefter skapas en komplett CP02-ZIP.

## Återstående efter CP02
- CP03: scenuthållighet, lagring, omladdning, modellfallback och resursobservationer.
- CP04: samlad slutregression, B003-status och komplett överlämning till B004-chatten.
- Fysisk iOS/Android ska redovisas ärligt som utfört eller ej utfört. Emulering får inte märkas som fysisk test.
