# Röstinventering för Trollpennan – underlag till Grok

Inventerad 2026-10-31 från lokal `d57fe3e` (pausat #301), med senast hämtade publicerade main `b051e6e`. Inventeringen är statisk; inget komplett genomspel, inget API-anrop och ingen ny inspelning har gjorts. Pågående #301 och blockserien är pausade; läs aktuell överlämning innan ett nytt kodarbete startas.

**Viktig gräns:** fri text kan vara godtycklig, så alla framtida meningar kan inte räknas upp. Den breda datagenomgången omfattar 3 019 strängförekomster: 31 gav flerdelad röstplan, 443 saknade plan, 15 omformades och 2 530 gav en hel fil. Dessa är inte antal faktiska spelhändelser. Den breda sökningen innehåller också etiketter, metadata och exempel som kanske aldrig läses upp. Identifiera därför verklig kodväg och faktisk händelse innan varje kandidat beställs som röst. Genomgången täcker inte varje möjlig kodgenererad text eller alla datakällor, och kan inte stödja ett anspråk på att alla faktiska fall hittats.

## Faktisk reserv och webbläsarröst

- `data/rost-klient.json`: `reserv: tyst`, `dynamisk: tyst`. Ett fast uttryck utan plan är tyst; en okänd dynamisk mallkomponent hoppas över. Den generella motorns kod innehåller ett villkorligt webbläsarreservläge, men det är inte valt i den inventerade konfigurationen. Texterna i äldre dokument om att allt skulle läsas med webbläsarröst är därför inte tillförlitlig beskrivning av nuläget.
- `src/spel/skapa/installning.ts` → `sagBokstav`: tangenternas bokstavsljud använder `SpeechSynthesisUtterance` när bokstavsljud och röst är på. Det gäller svenska a–ö och även skrivbara siffror när den vanliga inmatningsvägen anropar funktionen. Svenska röster saknas eller låter olika beroende på enheten; webbläsarens röst kan säga bokstavsnamn i stället för språkljud. Mellanslag är en separat väg.
- Barnets fria ord/meningar kan inte förinläsas uttömmande. Besluta särskilt om de ska vara tysta, få uttrycklig lokal tillgänglighetsreserv eller annan integritetsbevarande lösning. Skicka aldrig barnets text till en extern API-tjänst under spelning; inga konton/spårning.

## Röstflöden som måste provspelas

Pennans boks öppningsreplik; tangentljud; Ordhjälpens flikar och kort (inklusive håll-inne); Skriv fler; Trollremsans ord och högtalare; egen mening vid Trolla; stavningsförslag och böjningshjälp; guldchansens ”Skriv {ord}”; uppdrags- och önskelappar samt deras Lyssna-knappar; gåtor/ledtrådar; kartans plats- och helkarta-knappar; Väktardjursgåtor; uppdrag, tack och nästan-svar; djurens och Bengtssons bubblor; notiser, belöningar, resor, bygg och flytt. Alla fält i nästa tabeller är inte automatiskt upplästa i dessa flöden; kontrollera anroparen.

## Samtliga 37 mallar i röstmanifestet

En mall är inte automatiskt ett aktivt klippfall: `sammanhallenRostText` kan före planeringen ersätta vissa varianter med en hel neutral inspelning, eller en exakt hel fil kan finnas för ett värde. Testa faktiskt format med riktiga värden genom `rostPlan(sammanhallenRostText(text))`; kontrollera även att alla filer existerar och att uppspelningen fungerar. `dynamisk: true` kan innebära att ordet blir tyst.

| Källa | Talare i manifest | Mall |
|---|---|---|
| firande.json:.guldord.text[] | pennan | Guldord! Du skrev {ord} alldeles själv! |
| firande.json:.guldord.text[] | pennan | Guldord! {ord} – och du stavade helt rätt! |
| firande.json:.guldord.text[] | pennan | Wow, {ord}! Ett guldord till boken! |
| firande.json:.hemligt_ord.text[] | pennan | Nytt ord i boken: {ord}! |
| firande.json:.hemligt_ord.text[] | pennan | Du hittade {ord}! |
| firande.json:.stjarnor.fa | pennan | +{n} stjärnor! |
| firande.json:.stjarnor.for_fa | pennan | Du behöver {n} stjärnor till. Uppfyll en önskan! |
| firande.json:.ny_sida.text | pennan | Ny sida i boken: {sida}! |
| firande.json:.sida_klar.text | pennan | Alla ord på {sida} är hittade! Du är en riktig ordmästare. |
| reserv.json:.texter.ny | pennan | Det här ordet har jag aldrig sett! Det blev ett ägg som väntar på att kläckas: {ord}. |
| texter-aventyr.json:.foljeslagare.foljer | pennan | {djur} följer med dig! |
| texter-aventyr.json:.foljeslagare.hem | pennan | {djur} går hem till gården. |
| texter-aventyr.json:.omrade_klart | pennan | Du har gjort allt i {omrade}! Bra jobbat, äventyrare. |
| texter-gard.json:.klapp.en[] | pennan | {Platsen} är finast när du är här. |
| texter-gard.json:.byggt[] | pennan | Tadaa! Här är {formel}! |
| texter-gard.json:.byggt[] | pennan | Klart! {formel} står på gården. |
| texter-gard.json:.byggt[] | pennan | Wow, {formel}! Snyggt bygge! |
| texter-gard.json:.bo.flyttar_in[] | pennan | {djur} flyttar in i {hem}! |
| texter-gard.json:.bo.flyttar_in[] | pennan | {djur} tycker om sitt nya hem! |
| texter-gard.json:.bo.passar_inte | pennan | {djur} vill hellre bo någon annanstans. Prova ett annat hem! |
| skatter.json:.texter.fick | pennan | Du fick {namn}! Den ligger i Lådan på gården. |
| album.json:.sallsynthet.ny_niva_text[] | pennan | Ett {niva} djur! Det får en plats i albumet. |
| album.json:.sallsynthet.ny_niva_text[] | pennan | Wow, ett {niva} djur! Ett sådant har du inte haft förut. |
| omraden.json:.karta.valj_djur | pennan | Vem ska följa med? Välj ett djur som {kan}. |
| omraden.json:.karta.inget_djur | pennan | Inget av dina djur {kan} än. Skriv ett nytt djur som {kan}! |
| omraden.json:.omraden[].hinder.klart | pennan | Wiii! {djur} bar dig över floden! |
| omraden.json:.omraden[].del_omrade.klart | pennan | Plask! {djur} simmade med dig ända ut till ön! |
| omraden.json:.omraden[].hinder.klart | pennan | Dunk! {djur} rullade bort stenen! |
| omraden.json:.omraden[].inne.klart | pennan | {djur} lyser upp hela grottan. Oj, vad det glittrar! |
| vilda-djur.json:.regler.hjarta | pennan | {namn} tycker om dig lite mer! |
| vilda-djur.json:.regler.ny_van | pennan | {namn} är din vän nu! Den följer med dig hem. |
| ord.json:.repliker.hej[] | pennan | Hej! Här kommer {formel}! |
| ord.json:.repliker.fartlinjer[] | pennan | Ingen på hela {platsen} springer fortare än jag! |
| ord.json:.repliker.studs[] | pennan | Jag studsade så högt att jag såg hela {platsen}. |
| mossa.json:.beloning.text | pennan | +{n} stjärnor från Mossa! |
| byggsidor.json:.last_ord.text[] | pennan | Det ordet finns i {sida}. Den kostar {n} stjärnor. |
| byggsidor.json:.last_ord.text[] | pennan | Oj, {ord}! Det står i {sida}. Den kostar {n} stjärnor. |

## 31 identifierade frasförekomster med flera inspelade delar

Provad med det faktiska `sammanhallenRostText` följt av `rostPlan` på exakt strängen. ”Delar” avser planens antal och bevisar inte att texten faktiskt nås eller hörs i en viss spelsituation. Flera likadana texter kan förekomma i olika datafält.

| Datafält | Text | Delar |
|---|---|---|
| bengtsson.json:tva-farger.nastan | Din skapelse får stanna! Jag letar efter två vänner: en röd och en blå. | 4 |
| bengtsson.json:stor-och-liten.nastan | Din skapelse får stanna! Jag letar efter två vänner: en stor och en liten. | 4 |
| skapa-ui.json:.bokmal.fria_ideer[1] | en stor hund | 3 |
| skapa-ui.json:.bokmal.fria_ideer[2] | en blå häst | 3 |
| skapa-ui.json:.bokmal.fria_ideer[3] | en katt med vingar | 2 |
| skapa-ui.json:.bokmal.fria_ideer[5] | en prickig drake | 3 |
| skapa-ui.json:.bokmal.fria_ideer[7] | ett blått stall | 3 |
| skapa-ui.json:.bokmal.fria_ideer[10] | en glad katt | 3 |
| skapa-ui.json:.bokmal.fria_ideer[11] | en kanin med hatt | 2 |
| skapa-ui.json:.bokmal.fria_ideer[12] | en randig zebra | 3 |
| skapa-ui.json:.bokmal.fria_ideer[13] | en lysande uggla | 3 |
| skapa-ui.json:.bokmal.fria_ideer[16] | en liten fisk | 3 |
| skapa-ui.json:.bokmal.fria_ideer[17] | en anka med halsduk | 2 |
| skapa-ui.json:.bokmal.fria_ideer[18] | ett grönt hus | 3 |
| skapa-ui.json:.bokmal.tomt_ideer[1] | ett blått stall | 3 |
| skapa-ui.json:.bokmal.plats_ideer.skogen[1] | en liten uggla | 3 |
| skapa-ui.json:.bokmal.plats_ideer.skogen[2] | en stor björn | 3 |
| skapa-ui.json:.bokmal.plats_ideer.skogen[3] | en grön buske | 3 |
| skapa-ui.json:.bokmal.plats_ideer.sjon[2] | en stor delfin | 3 |
| skapa-ui.json:.bokmal.plats_ideer.sjon[3] | en liten groda | 3 |
| skapa-ui.json:.bokmal.plats_ideer.grottan[0] | en lysande drake | 3 |
| skapa-ui.json:.bokmal.plats_ideer.grottan[1] | en liten fladdermus | 3 |
| onskningar-bygg.json:.onskningar[3].exempel[2] | ett äppelträd | 2 |
| onskningar-bygg.json:.onskningar[19].exempel[0] | ett flygande hus | 3 |
| onskningar-bygg.json:.onskningar[19].exempel[1] | ett hus med vingar | 2 |
| onskningar-bygg.json:.onskningar[22].exempel[0] | ett dansande hus | 3 |
| onskningar-bygg.json:.onskningar[23].exempel[0] | ett lysande hus | 3 |
| dalen.json:.byggbok.ideer[6] | ett slott av is med en flagga | 3 |
| dalen.json:.byggbok.delar[0][1] | två torn | 2 |
| vaktardjur.json:.skogen.hjalp[0] | en röd jordgubbe | 3 |
| vaktardjur.json:.skogen.hjalp[1] | en kaka med honung | 2 |

## 443 dataförekomster utan röstplan – kontrollkandidater

Dessa är **inte 443 bekräftade saknade uppläsningar**. Alla är lästa från valda datafält, vissa är interna sammanfattningar, etiketter eller exempel och kan vara helt avsedda att inte ha ljud. Talares roll är endast beställningskonfiguration eller ”kontrollera”. Matchning gäller exakt text efter spelets befintliga talspråks-/ersättningssteg. Tom plan betyder här tyst under nuvarande konfiguration, inte webbläsar-TTS. Använd listan för att spåra de faktiskt lästa fallen mot komponent och kodflöde.

| Datafält / id | Angiven talare | Text |
|---|---|---|
| onskningar-bygg.json:.onskningar[18].text | pennan | Jag vill bo i ett hus som ser ut som jag! |
| onskningar-bygg.json:.onskningar[18].tack | pennan | Ett hus som ser ut precis som jag! Det är det finaste jag sett. |
| onskningar-bygg.json:.onskningar[19].text | pennan | Tänk om mitt hus kunde flyga! Kan du bygga ett sådant? |
| onskningar-bygg.json:.onskningar[19].tack | pennan | Det flyger! Nu kan jag vinka till fåglarna. |
| onskningar-bygg.json:.onskningar[20].text | pennan | Jag vill ha ett stall som ser ut som ett slott! |
| onskningar-bygg.json:.onskningar[20].tack | pennan | Ett slottsstall! Nu känner jag mig som en kung. |
| onskningar-bygg.json:.onskningar[21].text | pennan | Jag vill bo inne i en frukt. Ett hus som ser ut som ett äpple kanske? |
| onskningar-bygg.json:.onskningar[21].tack | pennan | Mmm, det luktar gott i mitt nya hus! |
| onskningar-bygg.json:.onskningar[22].text | pennan | Kan du bygga ett hus som dansar? Jag älskar att dansa! |
| onskningar-bygg.json:.onskningar[22].tack | pennan | Huset dansar! Kom, vi dansar tillsammans! |
| onskningar-bygg.json:.onskningar[23].text | pennan | Jag är lite mörkrädd. Kan du bygga något som lyser? |
| onskningar-bygg.json:.onskningar[23].tack | pennan | Nu är det ljust och mysigt. Tack! |
| bengtsson.json:kanin-fryser.text | bengtsson | Din kanin fryser. Skriv fram något som värmer. |
| bengtsson.json:kanin-fryser.klart | bengtsson | Åh, vad skönt! |
| bengtsson.json:regn-skydd.text | bengtsson | Det regnar. Skriv fram något som skyddar mot regnet. |
| bengtsson.json:regn-skydd.klart | bengtsson | Nu blir ingen blöt. |
| bengtsson.json:sol-skugga.text | bengtsson | Solen steker. Skriv fram något som ger skugga. |
| bengtsson.json:sol-skugga.klart | bengtsson | Ahh, skugga. |
| bengtsson.json:solgul-van.nastan | bengtsson | Din skapelse får stanna! Jag letar efter en vän som är gul eller kan lysa. |
| bengtsson.json:solgul-van.text | bengtsson | Skriv fram ett gult djur. |
| bengtsson.json:vingar-i-luften.nastan | bengtsson | Din skapelse får stanna! Jag letar efter en vän som kan flyga. Vingar kan hjälpa. |
| bengtsson.json:vingar-i-luften.text | bengtsson | Skriv fram ett djur som kan flyga. |
| bengtsson.json:pytteliten-kompis.text | bengtsson | Skriv fram ett pyttelitet djur. |
| bengtsson.json:jattestor-van.text | bengtsson | Skriv fram ett jättestort djur. |
| bengtsson.json:randig-kompis.text | bengtsson | Skriv fram ett randigt djur. |
| bengtsson.json:vit-som-sno.text | bengtsson | Skriv fram ett vitt djur. |
| bengtsson.json:lang-hals.text | bengtsson | Skriv fram ett djur med lång hals. |
| bengtsson.json:rod-kompis.text | bengtsson | Skriv fram ett rött djur. |
| bengtsson.json:gron-kompis.text | bengtsson | Skriv fram ett grönt djur. |
| bengtsson.json:mjuk-kompis.text | bengtsson | Skriv fram ett djur med mjuk päls. |
| bengtsson.json:magen-kurrar.text | bengtsson | Skriv fram något att äta åt ett hungrigt djur. |
| bengtsson.json:regn-pa-nosen.text | bengtsson | Skriv fram ett regnskydd åt ditt djur. |
| bengtsson.json:kalla-tassar.nastan | bengtsson | Din skapelse får stanna! Jag letar efter något som värmer. Strumpor, en tröja eller en halsduk kan hjälpa. |
| bengtsson.json:kalla-tassar.text | bengtsson | Skriv fram något som värmer ditt djur. |
| bengtsson.json:trakig-eftermiddag.text | bengtsson | Skriv fram något roligt åt ditt uttråkade djur. |
| bengtsson.json:ljus-i-kvallen.text | bengtsson | Skriv fram något som lyser åt ditt djur i mörkret. |
| bengtsson.json:redo-for-fest.text | bengtsson | Skriv fram något festligt som ditt djur kan ha på sig. |
| bengtsson.json:leriga-tassar.text | bengtsson | Skriv fram något som hjälper ditt djur att bli rent. |
| bengtsson.json:plats-for-en-van.text | bengtsson | Skriv fram två djur som kan hålla varandra sällskap. |
| bengtsson.json:musik-pa-angen.text | bengtsson | Skriv fram något som kan ge ditt djur musik. |
| bengtsson.json:dags-att-vila.text | bengtsson | Skriv fram en mjuk sovplats åt ditt djur. |
| bengtsson.json:badlangtan.text | bengtsson | Skriv fram en plats där ditt djur kan bada. |
| bengtsson.json:over-backen.text | bengtsson | Skriv fram något som tar ditt djur över bäcken utan att det blir blött. |
| bengtsson.json:skugga-at-djuret.text | bengtsson | Skriv fram en skuggig plats åt ditt djur. |
| bengtsson.json:present-till-en-van.text | bengtsson | Skriv fram en present som ditt djur kan ge en vän. |
| bengtsson.json:hitta-till-picknicken.text | bengtsson | Skriv fram något som hjälper ditt djur att hitta till picknicken. |
| bengtsson.json:tva-farger.text | bengtsson | Skriv fram ett rött djur och ett blått djur. |
| bengtsson.json:sol-och-gras.text | bengtsson | Skriv fram ett gult djur och ett grönt djur. |
| bengtsson.json:stor-och-liten.text | bengtsson | Skriv fram ett stort djur och ett litet djur. |
| bengtsson.json:hogt-och-lagt.text | bengtsson | Skriv fram ett djur vid ett högt föremål och ett lågt föremål. |
| bengtsson.json:ordet-med.text | bengtsson | Skriv en fras med ordet med där ett djur har ett föremål. |
| bengtsson.json:ordet-i.text | bengtsson | Skriv en fras med ordet i där ett djur är inuti något. |
| bengtsson.json:ordet-under.text | bengtsson | Skriv en fras med ordet under där något finns ovanför ditt djur. |
| bengtsson.json:ordet-pa.text | bengtsson | Skriv en fras med ordet på där ditt djur sitter ovanpå något. |
| bengtsson.json:varmt-och-kallt.nastan | bengtsson | Din skapelse får stanna! Jag letar efter två saker: något som värmer och något som kyler. |
| bengtsson.json:varmt-och-kallt.text | bengtsson | Skriv fram ett djur med något varmt och något kallt. |
| bengtsson.json:snabb-och-langsam.text | bengtsson | Skriv fram ett snabbt djur och ett långsamt djur. |
| bengtsson.json:ovantat-kompismote.text | bengtsson | Skriv fram två djur som brukar leva i helt olika miljöer. |
| bengtsson.json:ben-utan-promenad.text | bengtsson | Skriv fram ett djur bredvid något som har ben men inte kan gå. |
| bengtsson.json:resa-fran-soffan.text | bengtsson | Skriv fram något som låter ditt djur upptäcka världen utan att lämna soffan. |
| bengtsson.json:omvanda-storlekar.text | bengtsson | Skriv fram ett pyttelitet djur som brukar vara stort och ett jättestort djur som brukar vara litet. |
| bengtsson.json:atbar-regnbage.text | bengtsson | Skriv fram ett djur med tre ätbara saker som har olika färger. |
| bengtsson.json:skog-rod-van.text | bengtsson | Skriv fram ett rött djur. |
| bengtsson.json:skog-liten-van.text | bengtsson | Skriv fram ett pyttelitet djur. |
| bengtsson.json:skog-magen-kurrar.text | bengtsson | Skriv fram ett djur med något som det kan äta. |
| bengtsson.json:skog-vila-benen.text | bengtsson | Skriv fram ett djur med en plats att sitta på. |
| bengtsson.json:skog-regnpaus.text | bengtsson | Skriv fram ett djur som har skydd mot regnet. |
| bengtsson.json:skog-varm-van.text | bengtsson | Skriv fram ett djur med något som värmer. |
| bengtsson.json:skog-kvallsljus.text | bengtsson | Skriv fram ett djur med något som lyser. |
| bengtsson.json:skog-over-backen.text | bengtsson | Skriv fram ett djur som kan ta sig över bäcken utan att bli blött. |
| bengtsson.json:skog-spara-matsacken.text | bengtsson | Skriv fram ett djur med en stängd förvaring för matsäcken. |
| bengtsson.json:skog-under-tradet.text | bengtsson | Skriv fram ett djur under ett träd och använd ordet under. |
| bengtsson.json:skog-stor-och-liten.text | bengtsson | Skriv fram ett stort djur och ett litet djur med orden stor och liten. |
| bengtsson.json:skog-hitta-riktningen.text | bengtsson | Skriv fram ett djur med både en karta och en kompass. |
| bengtsson.json:skog-tva-spanare.text | bengtsson | Skriv fram en uggla och en igelkott som kan spana tillsammans. |
| bengtsson.json:skog-mysig-lasplats.text | bengtsson | Skriv fram ett djur med både en bok och en lykta. |
| bengtsson.json:skog-ljus-vid-krypin.text | bengtsson | Skriv fram ett djur i ett tält med en lykta utanför. |
| bengtsson.json:skog-final-minnesljus.text | bengtsson | Skriv fram ett djur med en lykta och en blomma till Doktor Bengtssons minnesplats. |
| bengtsson.json:sjo-bla-van.text | bengtsson | Skriv fram ett blått djur. |
| bengtsson.json:sjo-stor-simmare.text | bengtsson | Skriv fram ett stort djur som kan simma. |
| bengtsson.json:sjo-sitt-vid-vattnet.text | bengtsson | Skriv fram ett djur med en sittplats vid sjön. |
| bengtsson.json:sjo-fruktpaus.text | bengtsson | Skriv fram ett djur med en frukt till strandfikat. |
| bengtsson.json:sjo-skugga-pa-stranden.text | bengtsson | Skriv fram ett djur med en skuggig plats på stranden. |
| bengtsson.json:sjo-torr-overfart.text | bengtsson | Skriv fram ett djur i något som kan flyta över sjön. |
| bengtsson.json:sjo-regn-vid-stranden.text | bengtsson | Skriv fram ett djur med regnskydd vid sjön. |
| bengtsson.json:sjo-lys-vid-vattnet.text | bengtsson | Skriv fram ett djur med något som lyser vid sjön. |
| bengtsson.json:sjo-i-baten.text | bengtsson | Skriv fram ett djur i en roddbåt och använd ordet i. |
| bengtsson.json:sjo-pa-bryggan.text | bengtsson | Skriv fram ett djur på en brygga och använd ordet på. |
| bengtsson.json:sjo-tva-storlekar.text | bengtsson | Skriv fram ett stort och ett litet vattendjur med orden stor och liten. |
| bengtsson.json:sjo-tva-farger.text | bengtsson | Skriv fram ett rött djur i vattnet och ett blått djur på stranden. |
| bengtsson.json:sjo-las-och-lys.text | bengtsson | Skriv fram ett djur på bryggan med både en bok och en lykta. |
| bengtsson.json:sjo-tva-satt-att-resa.text | bengtsson | Skriv fram ett djur i en roddbåt och ett annat på en träbro. |
| bengtsson.json:sjo-ovantad-kapten.text | bengtsson | Skriv fram en fisk i ett badkar med vatten och låt badkaret stå i en båt. |
| bengtsson.json:sjo-final-vattenglitter.text | bengtsson | Skriv fram ett djur med en kristall och en blomma till Doktor Bengtssons minnesplats. |
| bengtsson.json:grotta-forsta-skenet.text | bengtsson | Skriv fram ett djur med något som lyser. |
| bengtsson.json:grotta-gul-van.text | bengtsson | Skriv fram ett gult djur. |
| bengtsson.json:grotta-liten-upptackare.text | bengtsson | Skriv fram ett pyttelitet djur. |
| bengtsson.json:grotta-sittpaus.text | bengtsson | Skriv fram ett djur med en sittplats. |
| bengtsson.json:grotta-varma-oron.text | bengtsson | Skriv fram ett djur med något som värmer. |
| bengtsson.json:grotta-mjuk-vila.text | bengtsson | Skriv fram ett djur med en mjuk sovplats. |
| bengtsson.json:grotta-eget-krypin.text | bengtsson | Skriv fram ett djur i ett eget krypin inne i grottan. |
| bengtsson.json:grotta-ordna-lasning.text | bengtsson | Skriv fram ett djur med något att läsa. |
| bengtsson.json:grotta-under-bordet.text | bengtsson | Skriv fram ett djur under ett bord och använd ordet under. |
| bengtsson.json:grotta-stor-och-liten.text | bengtsson | Skriv fram ett stort djur och ett litet djur med orden stor och liten. |
| bengtsson.json:grotta-sken-och-saga.text | bengtsson | Skriv fram ett djur med både en bok och en lykta. |
| bengtsson.json:grotta-tva-farger.text | bengtsson | Skriv fram ett grönt djur på en sten och ett gult djur bredvid stenen. |
| bengtsson.json:grotta-ljus-utanfor.text | bengtsson | Skriv fram ett djur i en koja med en lykta utanför. |
| bengtsson.json:grotta-ben-som-vilar.text | bengtsson | Skriv fram ett djur bredvid något som har ben men inte kan gå. |
| bengtsson.json:grotta-glitter-i-kistan.text | bengtsson | Skriv fram ett djur bredvid en skattkista med en kristall i. |
| bengtsson.json:grotta-final-bergets-berattelse.text | bengtsson | Skriv fram ett djur med en kristall och en bok till Doktor Bengtssons minnesplats. |
| uppdrag.json:hitta-kotte.text | bengtsson | Hitta Ekorrens silverkotte bland svamparna. |
| uppdrag.json:hitta-kotte.klart | bengtsson | Min kotte! Tack, nu kan jag sova gott i natt. /Ekorren |
| uppdrag.json:mossugglan.text | bengtsson | Väck Mossugglan med något blått och bli hennes vän. |
| uppdrag.json:mossugglan.klart | bengtsson | Hu-hu! Jag har aldrig haft en vän som dig. |
| uppdrag.json:svampring.text | bengtsson | Någon har lagt svampar i en ring. Det sägs att den som hoppar i ringen får tur. Skicka dit ett djur som kan hoppa! |
| uppdrag.json:svampring.klart | bengtsson | Boing, boing! Det känns som tur! |
| uppdrag.json:bavern.text | bengtsson | Ge Gamla bävern pinnar eller löv till hans nya damm. |
| uppdrag.json:bavern.klart | bengtsson | Dammen är klar! Kom och bada när du vill. |
| uppdrag.json:parlhajen.text | bengtsson | Bli vän med Pärlhajen vid bryggan. |
| uppdrag.json:parlhajen.klart | bengtsson | Jag simmar runt och visar alla min nya vän! |
| uppdrag.json:fyren.text | bengtsson | Fyren på ön har slocknat. Ta med ett djur som lyser ut till ön. |
| uppdrag.json:fyren.klart | bengtsson | Fyren lyser igen! Nu hittar båtarna hem. |
| uppdrag.json:vindhasten.text | bengtsson | Någon stor och vit har landat på ön. Vad tycker hästar om att äta? |
| uppdrag.json:vindhasten.klart | bengtsson | Vill du flyga en sväng någon gång? Säg bara till! |
| uppdrag.json:kristallgrodan.text | bengtsson | Få Kristallgrodan att sjunga. |
| uppdrag.json:kristallgrodan.klart | bengtsson | Kvack-la-la-la! Det ekar så fint i grottan. |
| uppdrag.json:nattdraken.text | bengtsson | Bli vän med Nattdraken längst in i grottan. |
| uppdrag.json:nattdraken.klart | bengtsson | Jag har väntat så länge på en vän. Tack för att du kom. |
| uppdrag.json:skatten.text | bengtsson | Hitta skattkistan där kristallerna är lila. |
| uppdrag.json:skatten.klart | bengtsson | Skattkistan är full av guldmynt och en gammal karta! |
| skapa-ui.json:.hud.skriv | kontrollera | Skriv |
| skapa-ui.json:.hud.skriv_aria | kontrollera | Skriv i Pennans bok |
| skapa-ui.json:.hud.uppdrag | kontrollera | Uppdrag |
| skapa-ui.json:.hud.min_bok | kontrollera | Min bok |
| skapa-ui.json:.hud.karta_aria | kontrollera | Karta |
| skapa-ui.json:.hud.vuxna_aria | kontrollera | För vuxna, håll inne |
| skapa-ui.json:.ark.aria | kontrollera | Pennans bok |
| skapa-ui.json:.ark.stang_aria | kontrollera | Stäng |
| skapa-ui.json:.ark.trolla | kontrollera | Trolla! |
| skapa-ui.json:.ark.trolla_aria | kontrollera | Trolla fram det du skrivit |
| skapa-ui.json:.ark.tom | kontrollera | Skriv vad du vill trolla fram! |
| skapa-ui.json:.ark.tom_hjalp | kontrollera | Välj ett kort, eller tryck här och skriv själv! |
| skapa-ui.json:.ark.skriv_aria | kontrollera | Skriv själv |
| skapa-ui.json:.ark.skriv_vad | kontrollera | Skriv vad det är! |
| skapa-ui.json:.ark.lyssna_aria | kontrollera | Läs upp det jag skrivit |
| skapa-ui.json:.ark.angra_aria | kontrollera | Ångra |
| skapa-ui.json:.hjalprad.ide_aria | kontrollera | Ge mig en idé |
| skapa-ui.json:.hjalprad.ordhjalp | kontrollera | Ordhjälp |
| skapa-ui.json:.hjalprad.tips_tom | kontrollera | Skriv ett djur eller ett hus. |
| skapa-ui.json:.hjalprad.tips_skriver | kontrollera | <b>Mellanslag</b> när ordet är klart. |
| skapa-ui.json:.hjalprad.tips_klar | kontrollera | Skriv mer, eller <b>trolla</b>! |
| skapa-ui.json:.hjalprad.tips_fast | kontrollera | Behöver du hjälp? Tryck på <b>Ordhjälp</b>. |
| skapa-ui.json:.tangentbord.mellanslag | kontrollera | mellanslag |
| skapa-ui.json:.tangentbord.klar | kontrollera | Trolla! |
| skapa-ui.json:.tangentbord.skift_aria | kontrollera | Stor bokstav |
| skapa-ui.json:.tangentbord.sudda_aria | kontrollera | Sudda |
| skapa-ui.json:.tangentbord.vokaler | kontrollera | aeiouyåäö |
| skapa-ui.json:.fragor.skriv | kontrollera | Skriv |
| skapa-ui.json:.fragor.hurdan | kontrollera | Hurdan? |
| skapa-ui.json:.sektioner.natur | kontrollera | Natur |
| skapa-ui.json:.sektioner.storlek | kontrollera | Storlek |
| skapa-ui.json:.sektioner.monster | kontrollera | Mönster |
| skapa-ui.json:.sektioner.material | kontrollera | Material |
| skapa-ui.json:.sektioner.form | kontrollera | Ser ut som |
| skapa-ui.json:.sektioner.kansla | kontrollera | Känsla |
| skapa-ui.json:.sektioner.klader | kontrollera | Kläder |
| skapa-ui.json:.sektioner.delar | kontrollera | Delar |
| skapa-ui.json:.hylla.skriv_fler | kontrollera | Skriv fler! |
| skapa-ui.json:.hylla.fler_alla | kontrollera | alla ord |
| skapa-ui.json:.hylla.prefix | kontrollera | Hjälpord som börjar på |
| skapa-ui.json:.hylla.lyssna_hall | kontrollera | Håll inne för att lyssna |
| skapa-ui.json:.svar.behall | kontrollera | Behåll mitt ord |
| skapa-ui.json:.svar.guldchans_ja | kontrollera | Ja, jag skriver! |
| skapa-ui.json:.svar.guldchans_nej | kontrollera | Nej tack |
| skapa-ui.json:.puffar.inga_gator | kontrollera | Du har hittat alla gåtdjur här. Prova en egen idé! |
| skapa-ui.json:.puffar.ide_lapp | kontrollera | Titta på lappen. Vad skulle kunna hjälpa? |
| skapa-ui.json:.puffar.valj_forst | kontrollera | Skriv vad du vill trolla fram först. Ett djur, ett hus eller något helt eget! |
| skapa-ui.json:.puffar.svara_forst | kontrollera | Pennan undrar vilket ord du menade. Tryck på ett av orden. |
| skapa-ui.json:.puffar.full | kontrollera | Din mening är redan full av trolldom! Tryck på pennan. |
| skapa-ui.json:.ide.rubrik | kontrollera | Idé från tärningen |
| skapa-ui.json:.ide.fraga | kontrollera | Kan du skriva det här? |
| skapa-ui.json:.ide.lyssna_aria | kontrollera | Hör idén |
| skapa-ui.json:.lapp.tillbaka | kontrollera | Tillbaka till boken |
| skapa-ui.json:.lapp.uppdrag_fran | kontrollera | Uppdrag från Doktor Bengtsson |
| skapa-ui.json:.lapp.djur_reserv | kontrollera | Ett djur |
| skapa-ui.json:.lapp.tomt_fran | kontrollera | Här ska det byggas |
| skapa-ui.json:.lapp.gata_fran | kontrollera | Hemligt ord |
| skapa-ui.json:.lapp.byt_namn | kontrollera | Byt namn |
| skapa-ui.json:.lapp.lyssna_aria | kontrollera | Lyssna |
| skapa-ui.json:.min_bok.rubrik | kontrollera | Min bok |
| skapa-ui.json:.min_bok.album | kontrollera | Djuralbum |
| skapa-ui.json:.min_bok.ordjakten | kontrollera | Ordjakten |
| skapa-ui.json:.min_bok.guldord | kontrollera | Guldord |
| skapa-ui.json:.min_bok.mark_rakna | kontrollera | Köp tomter |
| skapa-ui.json:.min_bok.ladan | kontrollera | Lådan |
| skapa-ui.json:.min_bok.intro | kontrollera | Se introt |
| skapa-ui.json:.min_bok.ljud_av | kontrollera | Ljud: av |
| skapa-ui.json:.ordbok.rubrik | kontrollera | Ordboken |
| skapa-ui.json:.ordbok.ordjakten_rubrik | kontrollera | Ordjakten |
| skapa-ui.json:.ordbok.ordjakten_tom | kontrollera | Inga skrivord än. Skrivord finns bara för den som skriver dem själv med tangenterna. |
| skapa-ui.json:.ordbok.guldord_rubrik | kontrollera | Mina guldord |
| skapa-ui.json:.ordbok.guldord_tom | kontrollera | Inga guldord än. Skriv ett ord själv med tangenterna, så blir det guld. |
| skapa-ui.json:.uppdrag_ark.rubrik | kontrollera | Uppdrag |
| skapa-ui.json:.uppdrag_ark.svara | kontrollera | Svara med pennan |
| skapa-ui.json:.uppdrag_ark.klart | kontrollera | Klart |
| skapa-ui.json:.foralder.startlage_rubrik | kontrollera | När Pennans bok öppnas |
| skapa-ui.json:.foralder.startlage_skriv | kontrollera | Tangenterna först (rekommenderas) |
| skapa-ui.json:.foralder.startlage_kort | kontrollera | Ordhjälpen först |
| skapa-ui.json:.foralder.ljuda_rubrik | kontrollera | Säg bokstaven vid varje tangent |
| skapa-ui.json:.rost.oppna | kontrollera | Vad vill du trolla fram? |
| skapa-ui.json:.rost.ordhjalp | kontrollera | Ordhjälp |
| skapa-ui.json:.rost.skriv_fler | kontrollera | Skriv själv! Det finns många fler. |
| skapa-ui.json:.hjalpord.material[3] | kontrollera | godis |
| skapa-ui.json:.hjalpord.kansla[0] | kontrollera | magisk |
| skapa-ui.json:.hjalpord.delar[0] | kontrollera | fönster |
| skapa-ui.json:.hjalpord.delar[3] | kontrollera | flagga |
| skapa-ui.json:.hjalpord.gor[1] | kontrollera | snurrande |
| skapa-ui.json:.idetarning.ideer[2][1] | kontrollera | godis |
| skapa-ui.json:.idetarning.ideer[7][2] | kontrollera | magisk |
| skapa-ui.json:.bokmal.byt_rubrik | kontrollera | Prova hela förslaget |
| skapa-ui.json:.bokmal.byt_text | kontrollera | Vill du byta till den här meningen? Du kan ångra efteråt. |
| skapa-ui.json:.bokmal.byt_ja | kontrollera | Byt till förslaget |
| skapa-ui.json:.bokmal.byt_nej | kontrollera | Behåll min mening |
| skapa-ui.json:.bokmal.tips.fri | kontrollera | Skriv ett djur eller ett hus. |
| skapa-ui.json:.bokmal.tips.uppdrag | kontrollera | Skriv något som hjälper Bengtsson. |
| skapa-ui.json:.bokmal.tips.onskan | kontrollera | Skriv något som passar djurets önskan. |
| skapa-ui.json:.bokmal.tips.gava | kontrollera | Skriv en gåva till din vän. |
| skapa-ui.json:.bokmal.tips.tomt | kontrollera | Skriv vad du vill bygga på tomten. |
| skapa-ui.json:.bokmal.tips.plats | kontrollera | Skriv en vän eller något som hör till platsen. |
| skapa-ui.json:.bokmal.tips.vaktare | kontrollera | Skriv något som passar Väktardjurets dröm. |
| skapa-ui.json:.bokmal.rubriker.uppdrag | kontrollera | Till uppdraget |
| skapa-ui.json:.bokmal.rubriker.onskan | kontrollera | Till önskan |
| skapa-ui.json:.bokmal.rubriker.gava | kontrollera | Till gåvan |
| skapa-ui.json:.bokmal.rubriker.tomt | kontrollera | Till tomten |
| skapa-ui.json:.bokmal.rubriker.plats | kontrollera | På den här platsen |
| skapa-ui.json:.bokmal.rubriker.vaktare | kontrollera | Till Väktardjuret |
| skapa-ui.json:.bokmal.rubriker.fri | kontrollera | Idéer |
| skapa-ui.json:.bokmal.tomt_ideer[2] | kontrollera | en stor hage |
| skapa-ui.json:.bokmal.tomt_ideer[3] | kontrollera | ett litet hönshus |
| skapa-ui.json:.bokmal.plats_ideer.grottan[2] | kontrollera | en glittrande kristall |
| skapa-ui.json:.bokmal.plats_ideer.grottan[3] | kontrollera | en stor sten |
| onskningar-bygg.json:.passar | kontrollera | Uppfylld när barnet bygger något som matchar 'krav' efter att önskan visats. bygg = byggordets id (eller efterled för sammansättningar), farg = färgord-id för byggnaden, material = material-id, del_min = minst så många av delen, antal_min = minst så många av byggordet i meningen, typ = byggordets typ, hem_for_djuret = ett hem där just det här djuret kan bo (djuret flyttar in automatiskt), bara_for = visa önskan bara för dessa kroppar, eller_bygg = alternativa byggord. |
| onskningar-bygg.json:.onskningar[0].id | kontrollera | eget-hem |
| onskningar-bygg.json:.onskningar[1].id | kontrollera | fonster-manga |
| onskningar-bygg.json:.onskningar[2].id | kontrollera | rott-hus |
| onskningar-bygg.json:.onskningar[3].id | kontrollera | skugga |
| onskningar-bygg.json:.onskningar[7].id | kontrollera | morkt |
| onskningar-bygg.json:.onskningar[11].id | kontrollera | over-vattnet |
| onskningar-bygg.json:.onskningar[12].id | kontrollera | godis |
| onskningar-bygg.json:.onskningar[12].krav.material[0] | kontrollera | godis |
| onskningar-bygg.json:.onskningar[12].krav.material[1] | kontrollera | choklad |
| onskningar-bygg.json:.onskningar[13].id | kontrollera | kallt |
| onskningar-bygg.json:.onskningar[17].id | kontrollera | hast-stall |
| onskningar-bygg.json:.onskningar[18].id | kontrollera | som-jag |
| onskningar-bygg.json:.onskningar[19].id | kontrollera | flygande-hus |
| onskningar-bygg.json:.onskningar[19].exempel[2] | kontrollera | ett hus av moln |
| onskningar-bygg.json:.onskningar[20].id | kontrollera | slottsstall |
| onskningar-bygg.json:.onskningar[20].exempel[0] | kontrollera | ett stall som ser ut som ett slott |
| onskningar-bygg.json:.onskningar[20].exempel[1] | kontrollera | ett slottsstall |
| onskningar-bygg.json:.onskningar[21].id | kontrollera | frukthus |
| onskningar-bygg.json:.onskningar[21].krav.form[0] | kontrollera | apple |
| onskningar-bygg.json:.onskningar[21].krav.form[2] | kontrollera | paron |
| onskningar-bygg.json:.onskningar[21].krav.form[3] | kontrollera | melon |
| onskningar-bygg.json:.onskningar[21].krav.form[4] | kontrollera | citron |
| onskningar-bygg.json:.onskningar[21].krav.form[5] | kontrollera | apelsin |
| onskningar-bygg.json:.onskningar[21].exempel[0] | kontrollera | ett hus som ser ut som ett äpple |
| onskningar-bygg.json:.onskningar[21].exempel[1] | kontrollera | ett hus som ser ut som en banan |
| onskningar-bygg.json:.onskningar[22].id | kontrollera | dansande-hus |
| onskningar-bygg.json:.onskningar[22].exempel[1] | kontrollera | ett hus som dansar |
| onskningar-bygg.json:.onskningar[23].krav.egenskap[1] | kontrollera | magisk |
| onskningar-bygg.json:.onskningar[23].exempel[1] | kontrollera | ett magiskt slott |
| texter-gard.json:.flikar.byggboken | kontrollera | Byggboken |
| texter-gard.json:.penna_bygg.placeholder | kontrollera | Vad vill du bygga? |
| texter-gard.json:.penna_bygg.knapp | kontrollera | Bygg! |
| texter-gard.json:.bygg_nagot | kontrollera | Bygg något |
| texter-gard.json:.tred_hint | kontrollera | Dra för att titta runt |
| texter-gard.json:.borja_om.knapp | kontrollera | Börja om |
| texter-gard.json:.borja_om.fraga | kontrollera | Din värld sparas i arkivet innan en ny värld börjar. Vill du börja om? |
| texter-gard.json:.borja_om.ja | kontrollera | Ja, börja om |
| texter-gard.json:.meny.flytta | kontrollera | Flytta |
| texter-gard.json:.meny.bygg_om | kontrollera | Bygg om |
| texter-gard.json:.meny.lada | kontrollera | Lägg i lådan |
| texter-gard.json:.meny.bo | kontrollera | Vem ska bo här? |
| texter-gard.json:.flytta_hjalp | kontrollera | Tryck på tomten där du vill ha den. |
| texter-gard.json:.tomt_hjalp | kontrollera | Vad ska stå här? Välj i boken eller skriv själv! |
| texter-gard.json:.bygg_om_hjalp | kontrollera | Skriv hur den ska se ut nu. |
| texter-gard.json:.lada.rubrik | kontrollera | Lådan |
| texter-gard.json:.lada.tom | kontrollera | Lådan är tom. |
| texter-gard.json:.lada.tom_hjalp | kontrollera | Här hamnar byggen som du lägger undan. Håll fingret på ett bygge och välj Lägg i lådan. |
| texter-gard.json:.lada.stang | kontrollera | Stäng |
| texter-gard.json:.lada.ta_fram | kontrollera | Ställ ut |
| texter-gard.json:.bo.valj | kontrollera | Tryck på ett djur som ska bo här. |
| texter-gard.json:.hem_namn_not | kontrollera | Bestämd form för pratbubblor: 'det röda huset', 'den blå hundkojan', 'isslottet'. Använd byggordets bestämda form (former[1]) och adjektivets a-form. |
| texter-gard.json:.backup.rubrik | kontrollera | Spara en kopia |
| texter-gard.json:.backup.spara | kontrollera | Ladda ner en kopia |
| texter-gard.json:.backup.spara_hjalp | kontrollera | Sparar allt (djur, gård, stjärnor, ord) som en fil på den här enheten. |
| texter-gard.json:.backup.las_in | kontrollera | Läs in en kopia |
| texter-gard.json:.backup.las_in_fraga | kontrollera | Vill du byta allt i spelet mot kopian? Det som finns nu försvinner. |
| texter-gard.json:.backup.las_in_ja | kontrollera | Ja, byt |
| texter-gard.json:.backup.las_in_nej | kontrollera | Avbryt |
| texter-gard.json:.backup.arkiv_rubrik | kontrollera | Tidigare världar |
| texter-gard.json:.backup.arkiv_hjalp | kontrollera | Innan du börjar om sparas hela världen här i minst 30 dagar på den här enheten. Spara också en nedladdad kopia. Webbläsaren kan radera lokala data. |
| texter-gard.json:.backup.arkiv_tom | kontrollera | Inga tidigare världar sparade än. |
| texter-gard.json:.backup.arkiv_fraga | kontrollera | Återställa den här världen? Din nuvarande värld sparas också i arkivet först. |
| texter-gard.json:.backup.arkiv_ja | kontrollera | Ja, återställ världen |
| texter-gard.json:.backup.arkiv_nej | kontrollera | Tillbaka |
| texter-gard.json:.backup.arkiv_fel | kontrollera | Det gick inte att spara eller återställa kopian. Din gamla värld har inte tagits bort från arkivet. Frigör utrymme och spara en nedladdad kopia innan du försöker igen. |
| texter-gard.json:.backup.skydd_rubrik | kontrollera | Skydda den sparade världen |
| texter-gard.json:.backup.skydd_hjalp | kontrollera | Världen sparas bara på den här enheten. Webbläsaren kan radera lokala data efter ett uppehåll, även om spelet har bett om beständig lagring. Spara regelbundet en nedladdad kopia. |
| texter-gard.json:.backup.hemskarm | kontrollera | På iPad eller iPhone: öppna spelet i Safari, tryck på Dela och välj Lägg till på hemskärmen. Starta sedan med Trollpennans ikon. Det kan minska risken för rensning men ersätter inte en nedladdad kopia. |
| texter-gard.json:.backup.ingen_kopia | kontrollera | Ingen nedladdad kopia är registrerad på den här enheten. |
| texter-gard.json:.backup.datum_hjalp | kontrollera | Datumet visar när nedladdningen startades. Kontrollera att filen finns i Hämtade filer och spara den på en trygg plats. |
| texter-gard.json:.backup.tack_till | kontrollera | Tack till |
| texter-gard.json:.backup.groda_kredit | kontrollera | Groda: "Frog" av jeremy (CC BY 3.0) |
| texter-gard.json:.stall.forklaring | kontrollera | Flytta ett djur till stallet genom att trycka på det. Du kan hämta ut ditt djur igen när du vill. |
| texter-gard.json:.stall.tom | kontrollera | Stallet är tomt. |
| texter-gard.json:.stall.hamta | kontrollera | Hämta ut |
| dalen.json:.tomt.mark | kontrollera | #E6C79C |
| dalen.json:.tomt.kant | kontrollera | #B98A57 |
| dalen.json:.tomt.ledig_glod | kontrollera | #FFF59D |
| dalen.json:.tomt.flytta_glod | kontrollera | #80DEEA |
| dalen.json:.bygg.farger.torn | kontrollera | #ECEFF1 |
| dalen.json:.bygg.farger.torntak | kontrollera | #E53935 |
| dalen.json:.bygg.farger.flagga | kontrollera | #FF5252 |
| dalen.json:.bygg.farger.stang | kontrollera | #8D6E63 |
| dalen.json:.bygg.farger.kupol | kontrollera | #FFD54F |
| dalen.json:.bygg.farger.skorsten | kontrollera | #A1887F |
| dalen.json:.bygg.farger.rok | kontrollera | #ECEFF1 |
| dalen.json:.bygg.farger.dorr | kontrollera | #6D4C41 |
| dalen.json:.bygg.farger.dorrkarm | kontrollera | #FFF3E0 |
| dalen.json:.bygg.farger.fonster | kontrollera | #FFF59D |
| dalen.json:.bygg.farger.hjul | kontrollera | #5D4037 |
| dalen.json:.bygg.farger.nav | kontrollera | #FFCA28 |
| dalen.json:.bygg.farger.vinge | kontrollera | #FFFFFF |
| dalen.json:.bygg.farger.balkong | kontrollera | #FFF8E1 |
| dalen.json:.bygg.farger.trappa | kontrollera | #BCAAA4 |
| dalen.json:.bygg.farger.hö | kontrollera | #FFE082 |
| dalen.json:.bygg.farger.not | kontrollera | #7E57C2 |
| dalen.json:.bygg.farger.gnista | kontrollera | #FFF59D |
| dalen.json:.bygg.farger.moln | kontrollera | #FFFFFF |
| dalen.json:.bygg.godis[0] | kontrollera | #F48FB1 |
| dalen.json:.bygg.godis[1] | kontrollera | #FFF59D |
| dalen.json:.bygg.godis[2] | kontrollera | #80DEEA |
| dalen.json:.bygg.godis[3] | kontrollera | #CE93D8 |
| dalen.json:.bygg.godis[4] | kontrollera | #A5D6A7 |
| dalen.json:.byggbok.rubrik_ideer | kontrollera | ✨ Byggidéer |
| dalen.json:.byggbok.rubrik_sjalv | kontrollera | 🔨 Bygg själv |
| dalen.json:.byggbok.steg[0] | kontrollera | 1. Vad? |
| dalen.json:.byggbok.steg[1] | kontrollera | 2. Ser ut som … |
| dalen.json:.byggbok.steg[2] | kontrollera | 3. Av … |
| dalen.json:.byggbok.steg[3] | kontrollera | 4. Med … |
| dalen.json:.byggbok.bygg_knapp | kontrollera | Bygg! |
| dalen.json:.byggbok.ideer[0] | kontrollera | ett stall som ser ut som ett slott |
| dalen.json:.byggbok.ideer[1] | kontrollera | ett hus som ser ut som ett äpple |
| dalen.json:.byggbok.ideer[2] | kontrollera | en lada formad som en ko |
| dalen.json:.byggbok.ideer[3] | kontrollera | ett flygande hus av moln |
| dalen.json:.byggbok.ideer[4] | kontrollera | ett rosa hus av godis med tre torn |
| dalen.json:.byggbok.ideer[5] | kontrollera | ett hus som ser ut som en katt |
| dalen.json:.byggbok.ideer[7] | kontrollera | ett hus som är upp och ner |
| dalen.json:.byggbok.material[3][1] | kontrollera | godis |
| dalen.json:.byggbok.material[5][1] | kontrollera | choklad |
| dalen.json:.byggbok.material[6][1] | kontrollera | kristall |
| dalen.json:.byggbok.delar[2][1] | kontrollera | en kupol |
| dalen.json:.byggbok.delar[4][1] | kontrollera | fyra hjul |
| dalen.json:.byggbok.egenskaper[2][1] | kontrollera | snurrande |
| dalen.json:.byggbok.egenskaper[4][1] | kontrollera | magisk |
| dalen.json:.boende.ljus | kontrollera | #FFD180 |
| dalen.json:.boende.zzz | kontrollera | #5C6BC0 |
| dalen.json:.boende.hjarta | kontrollera | #F06292 |
| dalen.json:.utbyggnader.lista[0].id | kontrollera | backen |
| dalen.json:.utbyggnader.lista[0].namn | kontrollera | Kvarnbacken |
| dalen.json:.utbyggnader.lista[1].id | kontrollera | stranden |
| dalen.json:.utbyggnader.lista[1].namn | kontrollera | Sjöstranden |
| dalen.json:.utbyggnader.text_full | kontrollera | Alla dina tomter är fulla. Tryck på en låst tomt för att få mer mark! |
| dalen.json:.utbyggnader.las_farg | kontrollera | #8D6E63 |
| dalen.json:.utbyggnader.pris_farg | kontrollera | #FFB300 |
| forsta-stunden.json:.titel.logga | kontrollera | Trollpennan |
| forsta-stunden.json:.titel.under | kontrollera | Det du skriver vaknar. |
| forsta-stunden.json:.titel.fortsatt | kontrollera | Fortsätt |
| forsta-stunden.json:.titel.borja | kontrollera | Börja |
| forsta-stunden.json:.titel.borja_om | kontrollera | Börja om med en ny värld |
| forsta-stunden.json:.titel.fraga | kontrollera | Din värld med alla djur försvinner. Är du säker? |
| forsta-stunden.json:.titel.nej | kontrollera | Nej, tillbaka |
| forsta-stunden.json:.titel.ja | kontrollera | Ja, börja om |
| forsta-stunden.json:.titel.angra | kontrollera | Ta tillbaka min gamla värld |
| forsta-stunden.json:.titel.uppdrag | kontrollera | Uppdrag |
| forsta-stunden.json:.titel.skriv | kontrollera | Skriv |
| forsta-stunden.json:.senast.tom | kontrollera | Ängen väntar på ditt första ord. |
| forsta-stunden.json:.steg[0].id | kontrollera | forsta-ordet |
| forsta-stunden.json:.steg[0].visa_text | kontrollera | Tryck på Skriv och skriv ett djur! |
| forsta-stunden.json:.steg[0].pekar_pa | kontrollera | testid:pennans-bok |
| forsta-stunden.json:.steg[0].klart_nar.falt | kontrollera | egnaDjur |
| forsta-stunden.json:.steg[1].id | kontrollera | bengtsson |
| forsta-stunden.json:.steg[1].pekar_pa | kontrollera | testid:bengtsson-ikon\|testid:npc-figur |
| forsta-stunden.json:.steg[1].klart_nar.falt | kontrollera | uppdrag |
| forsta-stunden.json:.steg[2].id | kontrollera | uppdraget |
| forsta-stunden.json:.steg[2].visa_text | kontrollera | Tryck på Skriv och skriv det Doktor Bengtsson ber om! |
| forsta-stunden.json:.steg[2].pekar_pa | kontrollera | testid:pennans-bok |
| forsta-stunden.json:.steg[2].klart_nar.falt | kontrollera | uppdrag |
| forsta-stunden.json:.steg[3].id | kontrollera | tre-djur |
| forsta-stunden.json:.steg[3].pekar_pa | kontrollera | testid:pennans-bok |
| forsta-stunden.json:.steg[3].klart_nar.falt | kontrollera | egnaDjur |
| forsta-stunden.json:.steg[4].id | kontrollera | grinden |
| forsta-stunden.json:.steg[4].pekar_pa | kontrollera | 3d:grind |
| forsta-stunden.json:.steg[4].klart_nar.falt | kontrollera | seddaIntro |
| omraden.json:.karta.rubrik | kontrollera | 🗺️ Världskartan |
| omraden.json:.karta.knapp | kontrollera | Ut på äventyr |
| omraden.json:.karta.hjalp | kontrollera | Välj en plats på stigen! Alla vägar är öppna. |
| omraden.json:.karta.hem | kontrollera | Hem till gården |
| omraden.json:.karta.lyssna | kontrollera | Lyssna |
| omraden.json:.karta.stang | kontrollera | Stäng |
| omraden.json:.karta.stang_aria | kontrollera | Stäng kartan |
| omraden.json:.karta.har_ar_du | kontrollera | Här är du |
| omraden.json:.karta.besokt | kontrollera | Du har varit här |
| omraden.json:.karta.ny | kontrollera | Ny plats att upptäcka |
| omraden.json:.omraden[0].nas_fran | kontrollera | garden |
| omraden.json:.omraden[0].beskrivning | kontrollera | Höga granar, mossa, svampar och solstrålar mellan träden. |
| omraden.json:.omraden[0].ritning_reserv | kontrollera | Ängens bakgrund tonad mörkgrön (multiplicera #81C784) + 6-8 procedurgranar från bygg.json i två djupled + några svampar. |
| omraden.json:.omraden[1].nas_fran | kontrollera | garden |
| omraden.json:.omraden[1].beskrivning | kontrollera | En stor blå sjö med vass, en brygga och en ö med fyr långt ut. |
| omraden.json:.omraden[1].ritning_reserv | kontrollera | Övre halvan himmel, nedre halvan blå vattenyta (#4FC3F7 med vita vågstreck) + brygga (bruna rektanglar) + ön som en grön halvcirkel med fyren från bygg.json. |
| omraden.json:.omraden[2].beskrivning | kontrollera | En grotta med glittrande kristaller i väggarna och en underjordisk sjö. |
| omraden.json:.omraden[2].ritning_reserv | kontrollera | Mörk bakgrund (#263238) med lila och turkosa kristaller (trianglar). Utan ljus: allt svart utom en liten cirkel runt pekaren. Med lysande djur: en stor ljuscirkel runt djuret. |
| vaktardjur.json:.skogen.id | kontrollera | bamse-bum |
| vaktardjur.json:.skogen.namn | kontrollera | Bamse-Bum |
| vaktardjur.json:.skogen.gata | kontrollera | Jag drömmer om något rött eller sött med honung! |
| vaktardjur.json:.skogen.beloning.ritning | kontrollera | hage-soltak |
| vaktardjur.json:.sjon.id | kontrollera | kapten-plask |
| vaktardjur.json:.sjon.namn | kontrollera | Kapten Plask |
| vaktardjur.json:.sjon.gata | kontrollera | Jag drömmer om en gul frukt eller en studsboll! |
| vaktardjur.json:.sjon.favoriter[1] | kontrollera | studsboll |
| vaktardjur.json:.sjon.favoriter[5] | kontrollera | melon |
| vaktardjur.json:.sjon.beloning.ritning | kontrollera | musikfontan |
| vaktardjur.json:.grottan.id | kontrollera | glitter-glim |
| vaktardjur.json:.grottan.namn | kontrollera | Glitter-Glim |
| vaktardjur.json:.grottan.gata | kontrollera | Jag drömmer om en glittrig kaka eller en kristall! |
| vaktardjur.json:.grottan.favoriter[1] | kontrollera | kristall |
| vaktardjur.json:.grottan.favoriter[2] | kontrollera | diamant |
| vaktardjur.json:.grottan.favoriter[3] | kontrollera | stjärna |
| vaktardjur.json:.grottan.favoriter[7] | kontrollera | skatt |
| vaktardjur.json:.grottan.favoriter[8] | kontrollera | ädelsten |
| vaktardjur.json:.grottan.beloning.ritning | kontrollera | kristall-lykta |
| vaktardjur.json:.grottan.hjalp[0] | kontrollera | en glittrig kaka |

## Separat känd väntelista

`data/rost.json` har 12 uttryck i `vantar_rost` för sex byggönskningar. De är med bland kandidaterna ovan. De är uttryckligen väntande på röst; med `reserv: tyst` är saknad hel plan tyst, inte telefonuppläst. `docs/en-varld/nya-repliker.md` är en befintlig lista över nya barntexter men är inte ett bevis för att varje rad hörs, saknas eller fortfarande har samma lydelse. Verifiera varje aktuell text mot anropsvägen och manifestet.

## Instruktioner till Grok för inspelning och integration

1. Läs `AGENTS.md`, `projektregler.md`, pausrutan i `docs/codex/plan.md`, båda STATUS-filerna och färsk main. Respektera pågående #301 och den godkända Textpaket 02-granskningen; B1/BC kan ändra uppdragstexter. Planera arbetet så att röster inte genereras för texter som genast ska ändras.
2. Kartlägg varje faktiskt uppläst, ändlig text och dess avsändare. Kör de verkliga kodvägarna med representativa sparlägen. Spara en reproducerbar lista över exakt text, dataväg, UI-händelse, önskad talare, nuvarande `rostPlan` och prioritet. Skilj hel fil, flera filer, ersatt hel replik, tyst okänt värde och webbläsarens teckenröst. Kontrollera att spelad text och skärmtext inte förlorar avgörande betydelse.
3. Generera hela fraser för ändliga och återkommande repliker i stället för återanvända fragment. Barnets fria meningar har oändligt många värden: ge inte ett falskt löfte om full förinläsning och skicka inte barns text till ElevenLabs under spelning. Hantera talarroller och eventuell tillgänglighetsreserv som ett uttryckligt produktbeslut.
4. Använd projektets befintliga `scripts/rost-generera.mjs`, `data/rost.json`, `data/rost-manifest.json`, `data/rost-klient.json` och `public/ljud/rost/`. Läs skriptet och testa först `node --experimental-strip-types scripts/rost-generera.mjs --torr`. Kontrollera kandidater och kostnad innan betalda API-anrop; hemligheter ska inte skrivas ut eller checkas in. Röster, uttalsregler, format och ljudnivå kommer från aktuell konfiguration. Befintlig generator bygger klientmanifest och kan ta bort föräldralösa MP3:er; läs dess konsekvenser och skydda existerande ljud innan körning.
5. För bokstavsljud behövs korta korrekt uttalade svenska språkljud för 29 bokstäver, inklusive å/ä/ö, och beslut om 0–9; testa svensk röst mänskligt. Lägg till en robust filväg/uppslag i `sagBokstav`, bevara ljud-/röstinställningar, tangentrespons, snabb upprepning, stopp och köhantering. Falla inte tyst tillbaka på engelskt uttal.
6. Komplettera generatorns källor med avsiktligt upplästa nya texter och avsändare, generera ljud samt båda manifesten konsekvent. Ta bort `vantar_rost` först när exakt aktuell text har faktisk verifierad fil. Vid dynamiska men vanliga ändliga kombinationer välj hela meningar där det är praktiskt; säkerställ att uppslaget verkligen prioriterar hel inspelning.
7. Verifiera korrekta MP3-filer, matchning mellan text/normalisering/manifest och tillgång, längd/ljudnivå, svensk röst, uttal och att samma text inte får fel avsändare. Kontrollera ljudkö/prioritet, avbrott, täta tangenttryck, avstängt ljud och felande fil. Använd både Node-prov och riktiga UI-/ljudprov på aktuellt bygge; lyssna på riktiga samples. Inga API-hemligheter i repo, inga bilder i PR och inget nytt sparformat utan migrering/test. Kör sju projektgrindar; ändra aldrig P3a:s 50 ms-gräns.
8. Dokumentera vilka faktiska fraser och ljudfiler som fått verifierad sammanhållen inspelning, vilka som fortsatt sammanfogas, vilka som är tysta och vilka som eventuellt använder webbläsarröst. Uppdatera befintlig replikkatalog och aktuell plan/status. Ingen generell fullständighet ska påstås utan dokumenterad täckning av faktiska anrop och dynamiska flöden.

