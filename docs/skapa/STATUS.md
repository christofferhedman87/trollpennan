# Status: Nya Skapa (spec: SPEC-skapa.md)

> **Aktuellt 2026-10-31:** alla T-01–T-35 följer [gemensam plan](../codex/plan.md). E1/E2 (#286), E3/G4 (#287), A1 (#288) och B0:s första sex uppdrag (#290, main fbfe48f) är publicerade med gröna main-Cloudflare-checkar och SHA-256-bevis. A0/A2/F4 (#289, main `eec3b27`) är publicerade och verifierade med Cloudflare/SHA-256. Hologrammets separata shaderfix #293 är också publicerad. Tolkens beteendebevarande uppdelning #291 är publicerad som `f69c3e9`. B1–B8 och oberoende Codex-granskare är godkända. T-03/T-05/T-07/T-08/T-18 är fortsatt partiella eller öppna; inga granskad-flaggor ändras utan Christoffers faktiska textläsning.

Uppdateras efter varje fas. Den som tar upp arbetet läser den här filen först.

| Fas | Status | PR | Anteckning |
|---|---|---|---|
| A Skapa-arket och skriv först | Klar | #261 | `src/spel/ui/skapa/` (SkapaArk, Trollremsa, Pennan, Hjalprad, Tangenter, Svarsrad) och `src/spel/skapa/` (lexikon, mening, meningsbrickor, ordKoll). Mellanslag kollar ordet med tolken. Böjningshjälp. Pennan sover tills meningen har ett Vad |
| B Ordhjälpen | Klar | #261 | Ordhjalp, Ordkort, hjalpord.ts, insattning.ts (7.1), bojning.ts (7.2), prefixhjälp, Skriv fler!, guldchansen med spökbokstäver, håll inne för att lyssna |
| C Trollringen, hologrammet och kameran | Klar | #262 | `src/spel/ang/Trollring.tsx` och `holoMaterial.ts`, samt `skapa/forhand.ts` och `forhandTolk.ts`. Kameran använder setViewOffset. Gnistor och stjärnregn vid Trolla. Kvittot ersätter bannrarna Klart, stjärnor och guldord |
| D Lappen, idétärningen och uppdragen | Klar | #263 | Lapp för önskan, gåva, uppdrag, tomt, bildgåta och gåta. UppdragArk med Svara med pennan. UppdragVy är borttagen. En tomt öppnar Pennans bok |
| E HUD och Min bok | Klar | se git-logg | HudBotten (Uppdrag, Skriv, Min bok) och toppens ikonknappar (lås, stjärnor, Se hela dalen, Karta). MinBok har sex rutor. Föräldrasidan har startläget och bokstavsljudet. MenyPanel och hamburgern är borttagna. BokSkarm är bara Byggboken (Mark) |

## A2: publicerad och verifierad

Den gemensamma målmodulen, målkort med uttryckligt textbyte, separat Gåta, fri-världstips och boklayouten finns i #289. #289 är mergad som `eec3b27` och publicerad: main-Cloudflare `124442039491` grön och alla sex serverade start-/spel-filer byteidentiska med det provade bygget (SHA-256). Oberoende Codex-granskare slutgodkände exakt `60d5c4c`; senare ändringar är enbart dokumentation. T-03 är delresultat: täckningen av alla 157 mål och den äldre gåvohyllan återstår i B/C/D. Barnets text och sparformat v2 ändras inte av layouten.

Kritisk granskning hittade och rättade verklig klippning av remsa/X, rotation, Väktaröverlapp, avsaknad av världsyta i 375×667, CSS-kaskad, för bred hjälphylla, klippt Idé/stavningssvar och dold guldinstruktion. Idé och svar rullas fram, guldskrivandet prioriteras med befintlig instruktion, och nya ord/vald bricka hålls hela i remsan. Senaste guldprovet med föregående Idé är grönt i 375×667: Idé/Gåta ändrar inte ordet, Mellanslag/sudda fungerar, hela frasen blir guld och önskan uppfylls/sparas. Hela layoutprovet är också grönt i 375×667, inklusive hjälp/full lapp/stavning och 44 px-X. Interna bilder granskade.

Hologrammet passar sin faktiska modellruta mellan HUD och bokkontroller. Den separata shaderfixen #293 är publicerad; förhandsvisningen ändrar inga sparpositioner. Skogens hela hologramflöden i 375×667, 667×375 och datorfallback 1280×720 är gröna, liksom Sjön/Grottan i 812×375: fyra modeller, stenens 90 bildrutor med 1–1 egna ritanrop, rotation, skapande och sparinvarians. Standardtelefonens tidigare bok-/guld-/platsprov är gröna. Alla sju slutgrindar på sista appkoden `60d5c4c` är gröna, 565/565 produkttester och 18 befintliga lintvarningar. Slutgranskaren hittade att markering av en äldre bricka höll nya bokstäver utanför raden. Verkligt markera→fortsätt skriva-prov är rött på `ca538799`; fortsatt inmatning lämnar nu markeringen före nästa bildruta. Hela det utökade layoutprovet är grönt i 375×812, 812×375, 667×375 och 375×667. De nya bokstäverna är helt synliga även efter markering; interna bilder granskade. Första skapelsen är grön på `ca538799` i stående, liggande och datorvy: verkliga skärmtryck, sparning och omladdning utan sidrullning, konsolfel eller externa anrop. Enda senare appändringen är markeringsrensningen, som det utökade provet täcker.

Geometriprovet har valfri `QA_TANGENTER=fysiska`: riktiga ASCII-tangenter och faktiska skärmtryck på å/ä/ö, med exakt läsback efter inmatning/radering. Standardläget behåller samtliga skärmtryck. Synlighets- och ritanropsgränser är oförändrade. Tre svagaste punkter: semantik/gåvohjälp för 157 mål återstår; fysisk Safari/hårdvara är inte provad; nya godkända inspelningar återstår. En sjuåring kan skriva, be om en idé och återgå till sin text, men äldre målsvar kan fortfarande frustrera tills B/C är klart.

C1a #291 och C1b #294 samordnas därefter. C1b:s appkod `e61cbd3` har 572/572 och kritisk kodgranskning; sju fraser och omladdning är gröna i vardera huvudvyn. Fysisk placering och C2:s antal/upprepade saker är öppna. Textpaket 01 i #292 väntar fortfarande på Christoffers faktiska läsning; inga `granskad`-flaggor är ändrade.

## C1b: publicerade ord och relationer, fortsatt delresultat

#294 är samordnad med `origin/main f69c3e9` genom vanlig merge. Appändringarna från `e61cbd3` behåller de sex relationerna med/på/under/i/vid/bredvid, tillbehörets artikel, adjektiv och skrivna ordform samt ”med vingar”. Ett valfritt validerat relationsfält följer v2; äldre kopior och ogiltig relation utan mutation är provade genom faktisk export/import, även för utflykter, sovande och sparade formler.

Oberoende Codex-granskare slutgodkände `ad1cc35` efter rättade adjektivläckor och relation vid sammansatt tillbehör. Appkod `e61cbd3` har alla sju grindar gröna, 572/572. Rena slut-UI-prov har sju verkligt skrivna och skapade fraser i vardera 375×812 och 812×375; alla sju i varje vy bevaras efter riktig omladdning. Baslinjen var röd: ”en katt under ett bord” skapades som ”en katt med bord”. Kvittot läses bara när det verkligen är helt synligt och har fri träffyta, med oförändrad normal lästid. Den senare samordningen tar in A2:s granskade UI-rättningar; C1b:s tolk-/lagringsändringar är oförändrade. Alla sju slutgrindar på samordnade `16de11b` är gröna, 572/572. Oberoende Codex-granskare slutgodkände exakt `16de11b3372421a6a3c732d810b53842eb491420`. PR #294 är mergad som `0453079` och publicerad: main-Cloudflare `124444182777` grön och alla sex serverade start-/spel-filer byteidentiska med det provade bygget (SHA-256).

T-07/T-08 är fortfarande delresultat. Fysisk placering hör till C1c; tillbehörsantal, identiska saker och övriga böjningar hör till C2. Inga `granskad`-flaggor eller fasta barnrepliker ändras. Tre svagaste punkter: relationsdata syns ännu inte som rätt fysisk placering; antal och identiska saker återstår; fysisk Safari/svensk hårdvara är inte provad.

## C1a: publicerad beteendebevarande uppdelning

#291 är samordnad med `origin/main eec3b27` genom vanlig merge, utan C1b eller språkändringar. Appkod `eb4b3ad`: alla sju slutgrindar gröna, 565/565 produkttester. Samma 1 726 fraser ger fortfarande byteidentiska fulla utfall för båda tolkarna, SHA-256 `aff5d76ab8befa378f0f8433c87c578d6901d9e0bd1d6a714c56514340c738f3`. De sex tolkmodulerna är fortsatt identiska med godkända `d2a5d29`. Ett mellanprov på `bc97600` föll på känt P3a-tidstest (50,2 ms); gränsen är oförändrad och slutomgången är helt grön.

Riktigt första-skapelsen-prov på det frysta `0e656bf`-bygget är grönt i stående, liggande och datorvy: skapelsen sparas och återkommer efter omladdning, utan sidrullning, konsolfel eller externa anrop. Den senare samordningen tar in A2:s fullständigt provade UI-rättning; tolkmodulerna ändras inte. T-07/T-08 är öppna; funktionsändringen finns separat i #294. Oberoende Codex-granskare slutgodkände `eb4b3ad`. #291 är mergad som `f69c3e9` och publicerad: main-Cloudflare `124443122813` grön och alla sex serverade start-/spel-filer byteidentiska med det provade bygget (SHA-256). Tre svagaste punkter: detta förarbete rättar inga språkfel; fysiska relationer/antal återstår; fysisk svensk hårdvara/Safari är inte provad.


## B2 · T-06: önskans betydelse och synligt svar (pågår)

Branch `codex/t06-onskesvar` började på `origin/main d743ad7` och är samordnad med publicerat A2/C1b (`0453079`). Röda→gröna Node-prov visar regional värme (tassar/öron), glasögon kontra solglasögon och verklig överfart över sjön. En sak räknas inte som djurkompis; roboten fungerar fortfarande. Alla 42 djurönskningar har minst två provade hjälpfraser och en egen ledtråd i data, listad i nya-repliker.md.

Ge-svaret stänger boken även vid nära miss och behåller tillägget/önskan. Den aktuella bedömningen följer med det befintliga kvittot utan ett nytt varaktigt tillstånd. Samma uid hittar/uppdaterar djuret även i hem och platsSkapelser; kvittot omfattar dessa skapelser. En återställd önskan tar inte över ett annat uttryckligen öppnat mål. Sju nya produktprov täcker betydelse, orörd föregående värld, rätt uid och faktisk försökslivscykel. Alla sju grindar på första samordningen `7513e85` är gröna, 579/579. Hela ge-flödet med hatt som nära miss, synlig ledtråd, omladdning, strumpor och tack/sparning är grönt på Ängen och Sjön i båda telefonvyerna. UI-baslinjen var röd eftersom boken låg kvar öppen.

Oberoende granskning hittade därefter fem verkliga luckor: gemensam glasögonmodell blandade betydelser; kalla plagg räknades varma; oöppnad kompisönskan fick negativt svar; äldre kvarstående önskan kunde fastna; interna djur-id:n blandades med svenska ordformer. Rättningarna har röda/gröna logikprov. Varje tillbehör bevarar nu valfria ord/egenskaper i v2, med torr, cachad läsning för äldre kopior. Olika uttryckliga egenskaper för samma sak tappas inte. Riktig export/import för fem placeringar och avvisad felaktig metadata utan mutation är gröna; totalt 93 riktade språk-/spar-/betydelseprov gröna. Nya slutgrindar och UI-prov för dessa kedjor körs före nytt granskningsbeslut. T-06 är inte slutgodkänd eller publicerad.

Tre svagaste punkter: verklig UI-koppling/utflykt måste slutprovas; T-17:s gemensamma kö/avsändare återstår; fysisk Safari och nya godkända inspelningar återstår.

## Steg 0: hologrammets shader bevaras, 2026-10-31

Slutprovet för A2 hittade ett befintligt grafikfel: Grottans sten visas först som hologram men tappar sin shader när scenens globala materialpass körs var 40:e bildruta. Samma fel reproducerat på publicerade B0/main och på A2; A2 skapade det inte. `forbattraModellMaterial` lämnar nu hologrammets klonade material i fred, medan vanliga modeller fortsatt får sagoyta. Inga sparfält, texter eller testid ändras.

Kod `9a1b211`: faktisk shader-regression röd före och grön efter; alla sju grindar gröna, 561/561. Provet täcker delat original, materialarray, 200 materialpass och samma solid-uniform vid Trolla. `prov-platsforhand.mjs` är rött mot baslinjen (90 nollvärden) och grönt i hela Grottan-flödet i 375×812 och 812×375: stenens egna WebGL-anrop är 1–1 i var och en av 90 bildrutor, och även rotation, sparinvarians, skapande samt platsbyte är gröna. Interna bilder granskade, blå och linjerad sten. Inga mätgränser lättade. Oberoende Codex-granskare slutgodkände exakt `6c0cb00`. #293 är mergad som `d743ad7` och publicerad: main-Cloudflare `124422225436` grön, alla sex serverade start-/spel-filer byteidentiska med det lokala bygget (SHA-256). Tre svagaste punkter: molnets mjukvarurendering säger inget om fysisk mobilprestanda; Safari/GPU-variationer är inte provade; nya shader-varianter behöver fortsatt samma mätning.

## Beslut (2026-10-29)
- E: projektregler.md är uppdaterad. Att skriva själv är förstahandsvalet, och hjälporden räcker för att spela.
- F: *sprutar eld* och *springer snabbt* är skrivord (`niva: "fritt"`). Önskningar som behöver dem (modig, kull, blixt) får korten i Ordhjälpen genom `onskeKort`, så regel 7.6 håller.
- G: bokstavsljud. Tills röstfilerna finns läser talsyntesen bokstaven (`skapa/installning.ts`), och då blir det ofta bokstavsnamnet. 29 röstfiler står i `docs/en-varld/nya-repliker.md`.
- H: *Trolla!* ersätter *Vakna!* (intro.json `skriv.vakna`).

## Kvar
1. Röstfiler för bokstavsljuden och de nya texterna i `skapa-ui.json` (nya-repliker.md).
2. 3D-modeller för nya former (äpplehus, pumpahus, tekannehus). De ritas med reservformen tills block 6 är klart.
3. Hologrammet kostar fler än 2 extra ritanrop, eftersom hela modellen ritas. Det kostar bara medan boken är öppen.
4. Platserna (Skogen, Sjön, Grottan) använder arket. Sedan block 4a (#278) visar boken platsens egen inbjudan som lapp när barnet skriver fritt där: `skapa/platsLapp.ts` återanvänder platsens namn och exakta `intro.text` (inspelad), och den kommer sist i prioriteten efter gåva, uttryckligt uppdrag, önskan, tomt, gåta och idé. Ängen har ingen platslapp. Sedan block 4b-1 visar boken ring och hologram även på utflykterna (`skapa/platsForhand.ts`, `forhandTolk.forhandForPlats`, `ang/Trollring.tsx` i `PlatsScen`); ett tomtbygge får där ingen bygghologram, bara en tom ring. Block 4b-2 (#282, ersätter #281) använder efter lyckad kapacitetskontroll den riktiga hemresan när barnet trollar fram ett tomtbygge på en utflykt; kameran hittar huset även när Hemdalen monteras efter skapandet. Slutverifierat i båda orienteringarna; merge/produktion följs i `docs/codex/plan.md`.
5. Testid-baslinjen (`rundor/R1-dela-spel/testid-baslinje.json`) är omskriven medvetet i varje fas enligt specens avsnitt 9.7.

## Guldchans, 2026-10-30 (#274)
- Flerordsfraserna `sprutar eld` och `springer snabbt` går att skriva färdigt, inklusive Mellanslag och sudda över ordgränsen. Först hela färdiga frasen får källan skriv/guld.
- Aktiv spökbricka, hjälptext och stavningssvar är nåbara också i liggande läge och efter rotation. Ångra och borttagning avbryter guldchansen när meningen ändras; inget falskt guld uppstår.
- Browserprov: `scripts/prov-guldchans.mjs` (båda flerordsfall och enord/fel tangent/Nej tack/stäng/Ångra/Ta bort). Röda regressioner före rättningen, gröna efter. Full leveransstatus: `docs/codex/plan.md`.

## Platslapp på utflykterna, 2026-10-30 (#278)
- Fri skrivning på Skogen, Sjön och Grottan visar Pennans bok med platsens egen inbjudan (befintlig text och inspelning, ingen ny röstfil, ingen generisk öppningsröst samtidigt). Gåva, uttryckligt uppdrag, önskan, tomt, gåta och idé går före.
- Browserprov: `scripts/prov-platslapp.mjs` (sju fall i stående och liggande, plus Skogen i 667×375): lappens text, Lyssna, tangenterna, den färdiga meningen och Trolla är synliga och nåbara, utan överlägg från Väktarens remsa eller returskylten. Liggande layouträttning och öppna fynd: `docs/en-varld/STATUS.md` ("Liggande: Väktarens remsa över boken"). Full leveransstatus: `docs/codex/plan.md`.

## Önskebubblans ingång till boken, 2026-10-30 (#283)
- Hela önskan växer nedåt under HUD och remsa, också i liggande vy; samma befintliga text, typstorlek och ljud. Returskylten får då en egen yta bredvid Väktaren.
- Baslinjens beskärning/överlappning är röd, och `scripts/prov-onskebubbla.mjs` är grönt i 20 fall (alla fyra platser, fem format, längsta önsketexten och verkliga klick). Fulla grindar gröna, 542/542. Merge/produktion följs i `docs/codex/plan.md`. Låg bokpanel vid höjder ≤360 px är fortfarande separat öppet fynd.

## Första skrivloopen och Pennans redo, 2026-10-30 (#284)
- Pennan vaknar även för okända ordägg, aktivt Behåll-val och korta önsketillägg till djuret. `skapa/kanTrollas.ts` gör en ren tolkning med befintliga regler; en olöst stavningsfråga fortsätter vänta på svar. Ord, guldets källor och verkligt skapande ändras inte av beräkningen.
- Guiden pausar också vid en synlig önskan, så den inte täcker första raden, och återkommer med samma steg efteråt. Ingen progressionsflagga ändras.
- Syntetiska förstagångsflöden (Hoppa över 375×812, Nästa 812×375) klarar egen skapelse, uppdrag, ordägg, aktivt stavningsval, naturlig önskan, nästa frivilliga val och omladdning. Riktade röda/gröna regressioner täcker redo och guidekrocken; alla sju slutgrindar gröna, 546/546. Versioner, tider, bildgranskning och leverans: `docs/codex/plan.md`. Inga riktiga barntestresultat.

## Fakta för den som fortsätter
- Meningen är text (`textRef`), och varje färdigt ord har en källa (`skriv`/`kort`/`auto`) i `useSkriv.metaRef`. All ändring går genom `satt()`.
- Guld = ett känt ord som barnet skrev med tangenterna. `utfor` får `inteGuld` för övriga ord och `behall` för ord som barnet valt att behålla.
- Prov: `src/spel/skapa/skapa.test.ts`.

## A1 T-01/T-02/T-31 (2026-10-31, PR #288)

Trolla-tangenten, Enter och Pennan använder samma synliga handling/animation. Tom mening ger puff. Hjälpens skrivyta är en riktig knapp (minst44px), har korrekt tomtext och ingen falsk markör; vad-luckan behåller tangenterna och uppmuntrar egen text. Fysisk skrivning får skrivfokus; Enter på ordbrickan lyssnar och skapar inte ett djur. Alla sju grindar gröna,553/553;20kontrollfall gröna i375×812/812×375, interna bilder granskade. Oberoende Codex-granskare godkände484e4a8; efter det endast prov/dokument, lint grönt igen. Publicerad somf425a41, CF124383463197 och6/6SHA-256 gröna. Tre svagaste punkter: fysisk svensk hårdvara/IME, låg liggande lapp (T-27), godkända nya repliker. Nästa är den påbörjade gemensamma målmodulen A0/A2 i#289.

## Historik: A0/A2:s delprov (ersatta av slutresultatet ovan)

Samma framräknade mål för lapp/tips/hjälp/Idé. Härledda föremål/plagg får hjälpkort i rätt roll; fulla förslag kräver ett uttryckligt byte när egna ord finns, med Ångra. Separat Gåta och minskat panoreringstips. Fyra Node-prov och samtliga sju slutgrindar gröna på87d21fc,557/557. De första klickproven var gröna men bilderna visade klippning; därför flyttas T-27 fram. Fast remsa, kompakt lapp med full läsvy och separata arbetsytor införs. Bokmål/modalflöde grönt375×812/812×375, verklig geometri inklusive hel läsvy och stavningssvar grönt375×812/812×375/667×375. Befintliga kontext-/guld-/platsregressioner och slutgranskning körs före merge. T-03 stängs inte: betydelse och minst två fungerande vägar för alla157mål verifieras i B. Tre svagaste punkter: semantiken i äldre förslag, vissa bildfallbackar samt låg568×320/nya godkända inspelningar som inte verifierats här.

## Fortsatt arbete 2026-10-31

#289/#290/#293 är publicerade och görs inte om. C1a #291 är publicerad med gröna main-Cloudflare/SHA-256; samordnade C1b #294 är slutgodkänd med 572/572 och sju fraser plus omladdning i båda vyer. B2 förbereds på `codex/t06-onskesvar`: regional värme, situationsriktiga exempel och synligt önskesvar, även för djur i platsSkapelser. Ingen av dessa PR:er stänger ännu hela T-03/T-05/T-07/T-08/T-18. Följ den gemensamma planen för återstående block.

## B0 slutverifiering, kod fe06419

Alla sju grindar gröna,560/560; fyra UI-fall gröna: flyg- och tvåfärgsuppdrag i375×812/812×375, med bevarad nära-miss-skapelse, synlig läsbar ledtråd, riktigt rätt svar, rätt antal och belöning. Bilder endast internt. Temperatur-/storleksmotexempel och faktisk försökslivscykel rättade efter kritisk granskning. Nästan-ledtråden står i befintligt kvitto för det verkliga försöket; önsketack prioriteras. Publicerad via #290 som fbfe48f4bbc742169d79d993511949c1364db788. Cloudflare-check124411312834 grön på main och6/6serverade start-/spel-filer byteidentiska med det lokala fe06419-bygget(SHA-256). Oberoende Codex-granskare slutgodkände exaktfe064194455583c28aef668e2a60a4dc7123c934 före merge. Tre svagaste punkter:85uppdrag/önskeregioner kvar, T-17 och kvitto för ändrade platsSkapelser kvar, fysisk/human språk- och röstgranskning kvar. Nästa: samordna A2/C1a mot publicerade main och fortsätt språk-/betydelseplanen.
