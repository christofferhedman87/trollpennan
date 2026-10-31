# Status: Nya Skapa (spec: SPEC-skapa.md)

> **Aktuellt 2026-10-31:** alla T-01–T-35 följer [gemensam plan](../codex/plan.md). E1/E2 (#286), E3/G4 (#287), A1 (#288) och B0:s första sex uppdrag (#290, main fbfe48f) är publicerade med gröna main-Cloudflare-checkar och SHA-256-bevis. A0/A2/F4 i #289 slutverifieras. En befintlig överskrivning av hologrammets shader rättas separat i #293. Tolkens beteendebevarande uppdelning finns i #291. B1–B8 och oberoende Codex-granskare är godkända. T-03/T-05/T-07/T-08/T-18 är fortsatt partiella eller öppna; inga granskad-flaggor ändras utan Christoffers faktiska textläsning.

Uppdateras efter varje fas. Den som tar upp arbetet läser den här filen först.

| Fas | Status | PR | Anteckning |
|---|---|---|---|
| A Skapa-arket och skriv först | Klar | #261 | `src/spel/ui/skapa/` (SkapaArk, Trollremsa, Pennan, Hjalprad, Tangenter, Svarsrad) och `src/spel/skapa/` (lexikon, mening, meningsbrickor, ordKoll). Mellanslag kollar ordet med tolken. Böjningshjälp. Pennan sover tills meningen har ett Vad |
| B Ordhjälpen | Klar | #261 | Ordhjalp, Ordkort, hjalpord.ts, insattning.ts (7.1), bojning.ts (7.2), prefixhjälp, Skriv fler!, guldchansen med spökbokstäver, håll inne för att lyssna |
| C Trollringen, hologrammet och kameran | Klar | #262 | `src/spel/ang/Trollring.tsx` och `holoMaterial.ts`, samt `skapa/forhand.ts` och `forhandTolk.ts`. Kameran använder setViewOffset. Gnistor och stjärnregn vid Trolla. Kvittot ersätter bannrarna Klart, stjärnor och guldord |
| D Lappen, idétärningen och uppdragen | Klar | #263 | Lapp för önskan, gåva, uppdrag, tomt, bildgåta och gåta. UppdragArk med Svara med pennan. UppdragVy är borttagen. En tomt öppnar Pennans bok |
| E HUD och Min bok | Klar | se git-logg | HudBotten (Uppdrag, Skriv, Min bok) och toppens ikonknappar (lås, stjärnor, Se hela dalen, Karta). MinBok har sex rutor. Föräldrasidan har startläget och bokstavsljudet. MenyPanel och hamburgern är borttagna. BokSkarm är bara Byggboken (Mark) |


## C1b pågår: relation och egen formel, T-07/T-08

På `codex/t07-t08-egen-formel`, ovanpå C1a #291: tolkens semantiska led behåller nu de sex relationerna med/på/under/i/vid/bredvid, tillbehörets skrivna artikel och ordform. Formeln kan säga ”en katt under ett bord”, ”med strumpor” och ”med vingar”. Valfritt validerat `TillbehorSpec.relation` bevaras i v2; äldre skapelser utan fältet godtas med befintlig placering. Riktiga export/import-prov täcker ängen, utflykten, sovande och sparad formel samt avvisad ogiltig relation utan mutation.

Tre riktade språkprov var röda före och gröna efter; typecheck och full produktregression körs. Ingen fysisk placering har ännu ändrats: T-07 och T-08 är fortfarande öppna. Nästa: rätta eventuella regressioner, slutgrindar och faktisk UI/formel/omladdning, oberoende granskning; därefter C1c:s synliga relationer och C2:s oregelbundna böjningar. Inga nya fasta barnrepliker, testid eller sparversion. Tre svagaste punkter: inga förändrade världspositioner ännu; kopplingen mellan flera tillbehör och mål behöver fortsatt prov; böjningar/artiklar utanför dessa kända former återstår.


## C1a slutverifiering efter A2 och hologramrättningen

#291 är samordnad med A2:s `9d247ba` och den publicerade grafikfixen, utan språkändringar. Kod `0e656bf`: alla sju slutgrindar gröna, 565/565 produkttester. Samma 1 726 fraser ger fortfarande byteidentiska fulla utfall för båda tolkarna, SHA-256 `aff5d76ab8befa378f0f8433c87c578d6901d9e0bd1d6a714c56514340c738f3`. Oberoende granskare har kontrollerat att de sex modulerna är identiska med godkända `d2a5d29`; C1b ingår inte. Riktigt UI-prov körs mot ett fryst separat bygge i stående, liggande och datorvy. T-07/T-08 är fortfarande öppna; funktionsändringen finns separat i utkast #294. Före leverans: invänta A2, samordna dokumentationen mot main, slutgranska och kontrollera publiceringen. Tre svagaste punkter: detta förarbete rättar inga språkfel, UI är ännu inte färdigkontrollerat, fysisk svensk hårdvara/Safari är inte provad.


## Steg 0: hologrammets shader bevaras, 2026-10-31

Slutprovet för A2 hittade ett befintligt grafikfel: Grottans sten visas först som hologram men tappar sin shader när scenens globala materialpass körs var 40:e bildruta. Samma fel reproducerat på publicerade B0/main och på A2; A2 skapade det inte. `forbattraModellMaterial` lämnar nu hologrammets klonade material i fred, medan vanliga modeller fortsatt får sagoyta. Inga sparfält, texter eller testid ändras.

Kod `9a1b211`: faktisk shader-regression röd före och grön efter; alla sju grindar gröna, 561/561. Provet täcker delat original, materialarray, 200 materialpass och samma solid-uniform vid Trolla. `prov-platsforhand.mjs` är rött mot baslinjen (90 nollvärden) och grönt i hela Grottan-flödet i 375×812 och 812×375: stenens egna WebGL-anrop är 1–1 i var och en av 90 bildrutor, och även rotation, sparinvarians, skapande samt platsbyte är gröna. Interna bilder granskade, blå och linjerad sten. Inga mätgränser lättade. Oberoende slutgodkännande och main-Cloudflare/SHA-kontroll återstår före publicering. Tre svagaste punkter: molnets mjukvarurendering säger inget om fysisk mobilprestanda; Safari/GPU-variationer är inte provade; nya shader-varianter behöver fortsatt samma mätning.


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

## A0/A2 + tidigarelagt F4 (PR #289, pågår)

Samma framräknade mål för lapp/tips/hjälp/Idé. Härledda föremål/plagg får hjälpkort i rätt roll; fulla förslag kräver ett uttryckligt byte när egna ord finns, med Ångra. Separat Gåta och minskat panoreringstips. Fyra Node-prov och samtliga sju slutgrindar gröna på87d21fc,557/557. De första klickproven var gröna men bilderna visade klippning; därför flyttas T-27 fram. Fast remsa, kompakt lapp med full läsvy och separata arbetsytor införs. Bokmål/modalflöde grönt375×812/812×375, verklig geometri inklusive hel läsvy och stavningssvar grönt375×812/812×375/667×375. Befintliga kontext-/guld-/platsregressioner och slutgranskning körs före merge. T-03 stängs inte: betydelse och minst två fungerande vägar för alla157mål verifieras i B. Tre svagaste punkter: semantiken i äldre förslag, vissa bildfallbackar samt låg568×320/nya godkända inspelningar som inte verifierats här.

## Aktiva PR:er 2026-10-31

A2/F4 [#289](https://github.com/christofferhedman87/trollpennan/pull/289), senaste9617f47: gemensamt mål, skyddade nya målkort, Idé/Gåta, fri-världstips och liggande bok. Röd verklig klippning/rotation/markerad X har lett till rättningar; nya slutgrindar och geometriprov inklusive borttagning körs. T-03 är partiell (157 mål och äldre gåvohylla kvar). Inget sparformat eller testid-baslinje ändrat.

B0 [#290](https://github.com/christofferhedman87/trollpennan/pull/290), senastefe06419: sex betydelsekontrollerade uppdrag,85 kvar. Tolkade egenskaper, antal/skilda individer, temperatur-/storleksöverstyrning och faktiska uppdragsförsök i kvittot. Alla sju grindar gröna,560/560; fyra UI-fall är gröna. Publicerad via#290 somfbfe48f, main-Cloudflare124411312834 och6/6SHA-256 gröna. T-05/T-18 är fortsatt öppna. Före utflyktsmålen måste ändrade djur i platsSkapelser också få kvitto.

C1a [#291](https://github.com/christofferhedman87/trollpennan/pull/291): oförändrad tolk delas till107–310rader per modul;1726 kompletta före/efter-utfall byteidentiska och sju grindar gröna. T-07/T-08 är ännu öppna. Nästa agent samordnar mot origin/main efter A2/B0, granskar och provar innan fortsatt relation/formel/placering och återstående uppdragsdata. Ingen force-push.

## B0 slutverifiering, kod fe06419

Alla sju grindar gröna,560/560; fyra UI-fall gröna: flyg- och tvåfärgsuppdrag i375×812/812×375, med bevarad nära-miss-skapelse, synlig läsbar ledtråd, riktigt rätt svar, rätt antal och belöning. Bilder endast internt. Temperatur-/storleksmotexempel och faktisk försökslivscykel rättade efter kritisk granskning. Nästan-ledtråden står i befintligt kvitto för det verkliga försöket; önsketack prioriteras. Publicerad via #290 som fbfe48f4bbc742169d79d993511949c1364db788. Cloudflare-check124411312834 grön på main och6/6serverade start-/spel-filer byteidentiska med det lokala fe06419-bygget(SHA-256). Oberoende Codex-granskare slutgodkände exaktfe064194455583c28aef668e2a60a4dc7123c934 före merge. Tre svagaste punkter:85uppdrag/önskeregioner kvar, T-17 och kvitto för ändrade platsSkapelser kvar, fysisk/human språk- och röstgranskning kvar. Nästa: samordna A2/C1a mot publicerade main och fortsätt språk-/betydelseplanen.
