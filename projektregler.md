# Aktuellt mandat 2026-10-17

Cloudflare Pages är inte ett krav. Publicering sker som statiskt bygge (`npm run build:pages`) på valfri plattform. React/R3F och Phaser bevaras tills ett byte har motiverats och verifierats.

Bevis per runda är högst 8 numrerade skärmbilder. Inga nya checkpoint- eller överlämningsdokument. Rör inte `recovery/`.

Historiska regler finns i `recovery/pre-cloudflare/projektregler.md` och gäller inte före detta mandat.

# Trollpennan – projektregler (gäller varje runda)

## Vem och vad
- Spelaren är Dagny, 7 år. Hon läser böcker flytande, kan skriva på en telefon och älskar Minecraft och Slime Rancher. Barn 2026 är vana spelare och kräsna.
- Telefon i första hand: **375×812 stående**. Spelet ska också fungera liggande och på dator.
- Kärnan: det man skriver blir levande. Skrivandet är spelets verb och ett försprång, aldrig ett prov.

## Arbetssätt
- Varje runda gör det prompten ber om, och inget annat. Lägg inte till system som inte efterfrågas.
- `attachments/karna.md` och `data/*.json` beskriver produktkontrakten. Nya ord, böjningar och texter får införas enligt beställningen, med regressionstester och korrekt svenska.
- Svenska texter som barnet ser kommer från datafilerna (`ord.json`, `onskningar.json`, `sidor.json`, `ledtradar.json`, `firande.json`). Skriv inte egna i koden; behövs en ny text, lägg den i rätt fil och lista den.
- Att testerna går igenom är inget bevis. Visa skärmen.

## Inga övningar, ingen skam
- Inga uppgifter av typen "tryck på rätt svar". Inga röda kryss, inga liv, inga "fel"-ljud och inga poängavdrag.
- Ett ord som inte fungerar ger en vänlig puff och sparas. En felstavning ger "Menade du …?". Rätta aldrig tyst.
- Skrivandet belönas alltid: hemliga ord, fler förmågor, guldord. Det krävs aldrig, och ordkort räcker för att spela.
- Barnet ska aldrig vänta mer än 5 sekunder utan att något händer eller går att göra.

## Spelloopen (från runda 3)
- Djur önskar sig saker, barnet uppfyller önskan genom att skriva, får stjärnor och köper sidor i boken som ger nya ord att jaga.
- Ingen tidspress: önskningar går aldrig ut, djur blir aldrig ledsna, stjärnor försvinner aldrig.
- Inga butiker med riktiga pengar, inga erbjudanden, inga nedräkningar, inga "kom tillbaka i morgon"-lås.
- Djurord fungerar alltid, oavsett vilka sidor som är köpta. Bokens sidor ger mål och ledtrådar, inte behörighet.
- Undantag från runda 4: byggord utanför Startbygget kräver att sidan i Byggboken är köpt. Ett låst byggord får alltid ett vänligt svar som säger var ordet finns och vad sidan kostar. Aldrig fel-ljud.

## Språk
- Korrekt svensk stavning och böjning. Böjningar ur SALDO (Språkbanken, CC BY 4.0), angivet i `ord.json`.
- Texterna ska vara på Dagnys nivå: hela meningar, dialog, gärna humor. Inget bebisspråk och ingen jargong utan förklaring.
- Formelkort och repliker visar alltid rätt form ("en stor kanin", inte "stort kanin").
- Spelet heter **Trollpennan**.

## Säkerhet
- Bara ord i `ord.json` skapar något. Spärrade ord (`blocklist.json`) visas, upprepas och sparas aldrig.
- Resurser får laddas från appens egen origin. Ingen extern spårning, chatt, konton eller överföring av barnets text. Spara lokalt.
- Föräldrasidan öppnas genom att hålla inne i 3 sekunder.

## Ljud
- Befintliga användbara ljudfiler, intro och WebAudio-effekter bevaras. Nya ljud ska vara licensierade och kunna stängas av. Inga obehagliga felljud.
- Aldrig ett "fel"-ljud. Föräldrasidan har "Ljud: på / av", och valet sparas.
- Befintlig introberättelse bevaras. Ny uppläsning kräver kontroll av svenskt uttal.

## Bild och layout
- All konst läses via `kit.json`, enligt kontraktet i `karna.md`. Platshållare följer samma kontrakt.
- Text minst 18 px (ordkort minst 22 px), tryckytor minst 44 px, inget viktigt under kanten och ingen sidrullning i spelet.
- Använd telefonens skärm fullt ut. Inga stora tomma ytor.
- Djuren ska vara stora nog att se ansiktet (se `data/beteenden.json`, storlek) och röra sig som sin sort: flygare i luften, simmare i dammen.
- Ängen syns direkt vid start. Ladda bara de kroppar som behövs.

## Bevis i varje runda
- Högst 8 numrerade skärmbilder i 375×812 för det rundan ber om.
- Inga nya checkpoint- eller överlämningsdokument. Rör inte `recovery/`.
- En lista över det som inte är gjort, och dina tre svagaste punkter, ärligt.
- Parsertesterna i `src/tolk` och fraserna i `data/test-fraser.json` ska gå igenom. Rör du `ord.json`, kör testerna igen.

## Gården (från runda 4)
- Byggen ritas med kitets bilder när de finns (`kit_nyckel`), annars procedurellt enligt `ritning` i `data/bygg.json`. Spelet ska fungera fullt ut utan ny konst.
- Inget barnet byggt förstörs: "Lägg i lådan" i stället för att ta bort. Allt sparas lokalt.
- Föräldrasidan har "Spara en kopia" (nedladdad fil) och "Läs in en kopia". Inga servrar.

## Varje runda börjar med Steg 0
- Kontrollera förra rundornas acceptanskrav på skärmen i 375×812. Laga det som är trasigt eller ofärdigt FÖRST och visa bevis, innan nya faser påbörjas.
- Avsluta med en kall självgranskning: tre svagaste punkter, och svaret på "Skulle en kräsen, spelvan sjuåring som älskar Slime Rancher och Minecraft vilja fortsätta spela? Vad skulle hon göra härnäst?"

## Äventyret (från runda 5)
- Nya platser öppnas av djurens förmågor (flyga, simma, lysa, vara jättestor). En öppnad plats förblir öppen.
- Vilda djur blir vänner genom gåvor som barnet skriver. Ett vilt djur flyr aldrig för gott och kan alltid försökas igen.
- Skyltar och lappar är läsning på Dagnys nivå. Texterna finns i `data/skyltar.json`; ingen uppläsning.
- Uppdrag har inga tidsgränser och kan göras i valfri ordning.

## Liv och samlande (från runda 6)
- Spelets dag och kväll går bara när spelet är öppet. Inget stängs och inget missas.
- Djurens humör är alltid snälla. Inga behov som blir sämre om man inte spelar, inga ledsna djur, inga hjärtan som minskar.
- Mossas uppdrag går inte ut och kräver aldrig att man kommer tillbaka en viss dag.
- Albumet och föräldrasidans räknare sparas bara lokalt. Ingen spårning.
