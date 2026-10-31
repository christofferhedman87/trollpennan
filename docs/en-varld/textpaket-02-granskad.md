# Textpaket 02 – granskning av 85 uppdrag i Trollpennan

## Sammanfattning: de tio viktigaste problemen

1. **Två olika godkända ord är inte samma sak som två efterfrågade egenskaper.** Exempel: `sol-och-gras` kan godkänna ”en gul kyckling” eftersom både *gul* och *kyckling* räknas, trots att ingen grön vän finns. Motsvarande problem finns i `hogt-och-lagt`, `snabb-och-langsam`, `ovantat-kompismote`, `omvanda-storlekar` och `atbar-regnbage`.
2. **Obligatoriska småord går att hoppa över.** `ordet-med`, `ordet-i`, `ordet-under` och `ordet-pa` kan godkänna två substantiv utan det lilla ord som ska tränas. Ordet måste kontrolleras separat av spelet.
3. **Antal varelser kontrolleras inte.** Regeln ”måste vara en varelse” säkerställer inte två olika vänner i uppgifter med två vänner. Inte heller säkras vem som har vilken färg eller storlek. Detta behöver särskild logik utöver ordlistorna.
4. **Färg kan felaktigt antas utifrån djurart.** I `vit-som-sno`, `rod-kompis` och `gron-kompis` godkänns bland annat *hund*, *fågel*, *räv* och *katt* utan att barnet beskrivit rätt färg. Kräv i första hand själva färgordet.
5. **Vissa uppdrag accepterar svar som inte löser uppgiften.** `randig-kompis` godkänner *polkagris*, `musik-pa-angen` enbart *fågel* och `ljus-i-kvallen` *måne*; ingen av dessa garanterar den avsedda lösningen.
6. **Några tacksvar lovar mer än spelet kontrollerar.** `regn-skydd` säger att *ingen* blir blöt, `vit-som-sno` beskriver vinterfärg även vid exempelvis en katt, och `sjo-tva-farger` påstår att både strand och vatten fått färg utan att platserna kontrolleras.
7. **`atbar-regnbage` begär tre färger men kräver bara två godkända livsmedelsord.** Detta är ett allvarligt rättviseproblem. Separat kontroll av tre olika färger behövs om uppgiften ska behållas.
8. **`ovantat-kompismote` blandar livsmiljöer.** Förslagen ”delfin och kanin” och ”bläckfisk och häst” löser inte uppdraget om is och djungel. Byt till tydliga artpar och kontrollera en art ur vardera gruppen.
9. **Utomhusmiljöerna tappas ibland bort.** Golvlampor i skogen och på stranden samt `grotta-ben-som-vilar`, som är nästan ordagrant samma gåta som på ängen, gör platserna mindre egna. Byt åtminstone ut de tydligaste upprepningarna.
10. **Idéförslag och platsrelationer kräver försiktig kontroll.** Exempelvis `sjo-tva-satt-att-resa` kan passera med en båt och en bro utan två olika resenärer. `grotta-glitter-i-kistan` kan passera med en kristall bredvid kistan, eftersom orden inte kontrollerar att den ligger *i*.

**Dubbletter/närliggande uppdrag:** `regn-skydd` ↔ `regn-pa-nosen` (ändra det senare), `sol-skugga` ↔ `skugga-at-djuret` (ändra det senare), `ben-utan-promenad` ↔ `grotta-ben-som-vilar` (ändra det senare). Uppdrag om mat, värme, sittplatser, regnskydd och belysning återkommer också i flera områden. Någon upprepning kan fungera som repetition för 7–10-åringar, men nya miljöer bör tillföra något eget. `kanin-fryser` överlappar redan godkända `kalla-tassar`; det bör få en tydligare egen inriktning.

**Genomförande:** Förslagen nedan behåller samtliga id. Fälten för godkända ord anger förändringar i *befintliga* listor; inga andra ord tas bort. `oförändrad` avser exakt originaltext. När en uppgift kräver en separat kontroll av till exempel två olika varelser, en viss ordrelation eller tre färger anges det under **Varför** – det kan inte lösas säkert med endast listan ”minst N olika ord”. Alla Hjälp-fraser är avsedda att klara den angivna ordkontrollen; att spelets skapelsemotor faktiskt känner igen varje fras måste fortfarande testas av utvecklaren.

## Ängen (37 uppdrag)

### kanin-fryser
Bedömning: ÄNDRA
Uppdrag: Brr! Din kanin fryser om öronen. Kan du skriva fram något varmt att ha på sig?
Tack: Så skönt! Nu kan öronen sluta huttra.
Nästan: Din skapelse får stanna! Jag letar efter något varmt att ha på sig, som mössa eller halsduk.
Hjälp: en kanin med mössa; en hund med halsduk; en katt med tröja
Godkända ord, lägg till: sockor
Godkända ord, ta bort: eld, brasa, kamin, lägereld, ljus, kakao, soppa, te, stuga, sol, solen, solsken, värme, varm, päls
Idéförslag att ändra: en kanin vid en lägereld → en hund med halsduk; en kanin i en stuga → en katt med jacka
Varför: Gör uppdraget tydligt skilt från `kalla-tassar` genom fokus på kläder, och låt godkännandet följa uppdragstexten. Etiketten ”Något varmt” kan gärna bli ”Fler varma kläder”.

### regn-skydd
Bedömning: ÄNDRA
Uppdrag: Oj, det regnar! Kan du skriva fram något som skyddar ditt djur mot regnet?
Tack: Bra! Nu har ditt djur skydd mot regnet.
Nästan: Din skapelse får stanna! Jag letar efter ett regnskydd, som ett paraply eller en regnjacka.
Hjälp: en kanin med paraply; en hund i regnjacka; en katt i ett tält
Godkända ord, lägg till: regnhatt, regnponcho
Godkända ord, ta bort: träd, skärm, stövlar, stövel, gummistövlar
Idéförslag att ändra: en kanin under ett träd → en kanin med paraply
Varför: Ett träd skyddar inte säkert mot regn och stövlar håller inte hela djuret torrt. Tacket lovar nu bara det som svaret faktiskt kan ge.

### sol-skugga
Bedömning: ÄNDRA
Uppdrag: Solen skiner starkt! Kan du ge ditt djur en plats i skuggan?
Tack: Vilken skön skuggplats du ordnade!
Nästan: Din skapelse får stanna! Jag letar efter skugga, till exempel under ett träd eller parasoll.
Hjälp: en kanin under ett träd; en katt under ett parasoll; en hund i ett tält
Godkända ord, lägg till: skugga, solskydd, palm
Godkända ord, ta bort: solhatt, hatt, keps, moln, skärm
Idéförslag att ändra: en kanin under ett moln → en kanin under ett parasoll; en kanin med keps → en kanin under en palm
Varför: En keps skuggar ansiktet, inte en viloplats. Uppdraget fokuserar på en faktisk plats; ändra etiketten ”På huvudet” till ”Skugga ovanför”.

### pytteliten-kompis
Bedömning: ÄNDRA
Uppdrag: Jag vill träffa en riktigt liten vän. Kan du skapa en?
Tack: Där är du ju, lilla kompis!
Nästan: Din skapelse får stanna! Jag letar efter en liten vän, som en myra eller en pytteliten mus.
Hjälp: en liten mus; en pytteliten larv; en liten myra
Godkända ord, lägg till: små
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: ”Minst i hela världen” är omöjligt att uppfylla och inte begripligt bokstavligt. Kontroll av varelse saknas för Ängen; annars kan ”en liten sten” bli godkänd.

### jattestor-van
Bedömning: ÄNDRA
Uppdrag: Jag vill träffa en riktigt stor vän. Kan du skapa en?
Tack: Oj, nu behöver jag en större kamera!
Nästan: Din skapelse får stanna! Jag letar efter en stor vän, som en elefant eller jättestor drake.
Hjälp: en stor elefant; en jättestor drake; en stor giraff
Godkända ord, lägg till: enorm, jättelik
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Enkelt uppdrag utan metaforen ”knappt får plats på mitt foto”. Även här behöver godkännandet säkra att svaret är en varelse.

### randig-kompis
Bedömning: ÄNDRA
Uppdrag: Jag söker en vän med ränder på kroppen! Kan du skapa en?
Tack: Vilka fina ränder!
Nästan: Din skapelse får stanna! Jag letar efter en randig vän, som en zebra eller tiger.
Hjälp: en randig katt; en zebra; en tiger
Godkända ord, lägg till: ränder, rand
Godkända ord, ta bort: katt, polkagris
Idéförslag att ändra: inga
Varför: En vanlig katt behöver inte vara randig och en polkagris är inte en varelse. Kontroll av att svaret är en varelse behövs om barnet skriver enbart ”en randig tröja”.

### vit-som-sno
Bedömning: ÄNDRA
Uppdrag: Jag vill träffa en vit vän, lika vit som snö. Kan du skapa en?
Tack: Vilken fin, vit vän!
Nästan: Din skapelse får stanna! Jag letar efter en vit vän, som en vit kanin.
Hjälp: en vit kanin; ett vitt lamm; en vit gås
Godkända ord, lägg till: inga
Godkända ord, ta bort: lamm, gås, kanin, katt, hund, svan, fjällräv, snö
Idéförslag att ändra: inga
Varför: Ett djurs art eller ordet ”snö” garanterar inte vit färg. `isbjörn` kan stå kvar som tydligt, normalt vitt djur, men separat varelsekontroll behövs.

### lang-hals
Bedömning: ÄNDRA
Uppdrag: Jag söker en vän med lång hals som kan se över buskarna!
Tack: Där uppe måste utsikten vara fin!
Nästan: Din skapelse får stanna! Jag letar efter en lång hals, som hos en giraff.
Hjälp: en giraff; en långhalsad svan; en lång giraff
Godkända ord, lägg till: långhalsad, långhals
Godkända ord, ta bort: alpacka, lama, gås
Idéförslag att ändra: en lama → en långhalsad svan; en alpacka → en lång giraff
Varför: Lama, alpacka och gås har inte lika självklart lång hals i jämförelse med en giraff. Frasen ”lång hals” bör kunna godkännas även utan att barnet valt en viss art.

### rod-kompis
Bedömning: ÄNDRA
Uppdrag: Jag vill träffa en röd vän, lika röd som en tomat!
Tack: Vilken härlig röd färgklick!
Nästan: Din skapelse får stanna! Jag letar efter en röd vän, till exempel en röd drake.
Hjälp: en röd drake; en röd fisk; en röd fågel
Godkända ord, lägg till: inga
Godkända ord, ta bort: ara, papegoja, fågel, drake, fisk, krabba, nyckelpiga, räv, kardinal
Idéförslag att ändra: inga
Varför: En papegoja, fisk eller räv är inte automatiskt tomatröd. Endast färgordet ger ett rättvist färguppdrag; separat kontroll av varelse behövs.

### gron-kompis
Bedömning: ÄNDRA
Uppdrag: Jag vill träffa en grön vän, lika grön som gräset!
Tack: Vilken härligt grön kompis!
Nästan: Din skapelse får stanna! Jag letar efter en grön vän, som en grön groda.
Hjälp: en grön groda; en grön drake; en grön larv
Godkända ord, lägg till: inga
Godkända ord, ta bort: groda, larv, papegoja, drake, ödla, gräshoppa, krokodil, kameleont, orm
Idéförslag att ändra: inga
Varför: Arterna kan ha andra färger än grönt. Bevara fantasifriheten och kräv att barnet faktiskt väljer den gröna färgen; separat varelsekontroll behövs.

### mjuk-kompis
Bedömning: ÄNDRA
Uppdrag: Jag söker en mjuk och gosig vän. Kan du skapa en?
Tack: Så fluffigt att min mustasch blir avundsjuk!
Nästan: Din skapelse får stanna! Jag letar efter en mjuk vän, som en fluffig kanin.
Hjälp: en mjuk kanin; en fluffig katt; ett mjukt lamm
Godkända ord, lägg till: gosig, ullig
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Originalets ”skön att krama, som ett moln” är lite abstrakt; det nya är direkt. Kontrollera varelse separat så ”en mjuk kudde” inte ensamt räcker.

### magen-kurrar
Bedömning: OK
Uppdrag: oförändrad
Tack: oförändrad
Nästan: Din skapelse får stanna! Jag letar efter mat till det hungriga djuret, som en morot eller ett äpple.
Hjälp: en kanin med en morot; en häst med ett äpple; en apa med en banan
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Kort, tydligt och öppet. Matvalen fungerar med ett brett spektrum av fantasidjur.

### regn-pa-nosen
Bedömning: ÄNDRA
Uppdrag: Regnet plaskar ner! Kan du ordna ett eget litet krypin åt ditt djur?
Tack: Där inne kan ditt djur vänta tills regnet slutar!
Nästan: Din skapelse får stanna! Jag letar efter ett krypin, som en koja eller en stuga.
Hjälp: en hund i en koja; en katt i en stuga; en kanin i ett hus
Godkända ord, lägg till: krypin
Godkända ord, ta bort: paraply, regnrock, regnskydd, tak
Idéförslag att ändra: en hund i ett tält → en hund i en liten koja; en get i ett skjul → en get i en stuga
Varför: Renodla ett eget litet hem så uppdraget inte bara upprepar `regn-skydd`. Tält och skjul kan fortfarande godkännas som krypin.

### trakig-eftermiddag
Bedömning: ÄNDRA
Uppdrag: Ditt djur har tråkigt! Vad kan det leka med eller göra?
Tack: Hurra, nu finns det något roligt att göra!
Nästan: Din skapelse får stanna! Jag letar efter något roligt, som en boll, bok eller gunga.
Hjälp: en hund med en boll; en kanin med en bok; en apa på en gunga
Godkända ord, lägg till: cykel, såpbubblor
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: ”Räknat samma grässtrå sju gånger” är skojigt men svårare uppläst. En direkt fråga hjälper de yngre barnen.

### ljus-i-kvallen
Bedömning: ÄNDRA
Uppdrag: Ditt djur vill se bättre i kvällsmörkret! Kan du ge det en lampa?
Tack: Nu ser vi ju våra egna näsor!
Nästan: Din skapelse får stanna! Jag letar efter något som lyser, som en lykta eller ficklampa.
Hjälp: en hund med en lykta; en kanin med en ficklampa; en katt vid en lampa
Godkända ord, lägg till: pannlampa
Godkända ord, ta bort: sol, måne, stjärna
Idéförslag att ändra: en apa under en golvlampa → en apa vid en golvlampa
Varför: Måne och stjärnor ger inte säkert användbart ljus; sol stämmer illa med kvällsmörker. Håll fokus på belysning.

### redo-for-fest
Bedömning: ÄNDRA
Uppdrag: Ditt djur är bjudet på kalas! Kan du ge det något festfint att ha på sig?
Tack: Så stiligt att jag nästan tappar glasögonen!
Nästan: Din skapelse får stanna! Jag letar efter festkläder, som en fluga eller festhatt.
Hjälp: en hund med fluga; en katt med festhatt; en kanin med en rosett
Godkända ord, lägg till: slips, festkläder
Godkända ord, ta bort: keps, tröja
Idéförslag att ändra: en apa med en fin tröja → en apa med en fluga
Varför: En vanlig tröja eller keps är inte självklart festfin. Behåll lekfulla tillbehör utan könsstereotyper.

### leriga-tassar
Bedömning: ÄNDRA
Uppdrag: Hoppsan, ditt djur är lerigt! Vad kan du tvätta det med?
Tack: Nu är leran på väg bort!
Nästan: Din skapelse får stanna! Jag letar efter något att tvätta med, som tvål eller vatten.
Hjälp: en hund med tvål; en apa med en svamp; en kanin i en dusch
Godkända ord, lägg till: vattenkanna
Godkända ord, ta bort: handduk
Idéförslag att ändra: inga
Varför: En handduk torkar snarare än tvättar; nytt tack fungerar också när barnet bara har skapat redskapet.

### plats-for-en-van
Bedömning: ÄNDRA
Uppdrag: På ängen finns plats för två vänner! Kan du skapa två djur som leker?
Tack: Nu blir det dubbelt så mycket fniss!
Nästan: Din skapelse får stanna! Jag letar efter två djur, till exempel en hund och en katt.
Hjälp: en hund och en katt; en kanin och ett lamm; en häst och en ko
Godkända ord, lägg till: igelkott, mus, räv
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Nu framgår att det är två djur, inte bara ”vilka två”. **Teknisk ändring krävs:** nuvarande gräns på ett godkänt ord kan godkänna ett enda djur.

### musik-pa-angen
Bedömning: ÄNDRA
Uppdrag: Ditt djur vill dansa! Kan du skapa något som spelar eller sjunger musik?
Tack: Nu dansar till och med mina strumpor!
Nästan: Din skapelse får stanna! Jag letar efter musik, som en trumma, radio eller sjungande fågel.
Hjälp: en kanin med en trumma; en katt vid en radio; en hund med en gitarr
Godkända ord, lägg till: dragspel, munspel
Godkända ord, ta bort: fågel, papegoja, ara, tv
Idéförslag att ändra: en katt med en sjungande fågel → en katt med en trumma; en hund med en sjungande papegoja → en hund med en gitarr
Varför: En fågel eller tv behöver inte ge musik. Att bara lägga till ordet ”sjungande” skulle inte hjälpa utan särskild kontroll av samspelet.

### dags-att-vila
Bedömning: OK
Uppdrag: oförändrad
Tack: oförändrad
Nästan: Din skapelse får stanna! Jag letar efter en viloplats, som en säng eller soffa.
Hjälp: en hund i en säng; en katt på en soffa; en kanin i en fåtölj
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Tydligt behov, passande lösningar och ett tack som fungerar även vid andra viloplatser.

### badlangtan
Bedömning: ÄNDRA
Uppdrag: Ditt djur vill bada! Kan du ordna en plats där det kan plaska?
Tack: Plask, så trevligt det blev!
Nästan: Din skapelse får stanna! Jag letar efter en badplats, som en sjö eller ett badkar.
Hjälp: en anka i ett badkar; en hund vid en sjö; en flodhäst i en pool
Godkända ord, lägg till: badbalja
Godkända ord, ta bort: vatten
Idéförslag att ändra: en säl vid en strand → en säl i havet
Varför: ”Vatten” ensamt säkerställer inte en plats att bada på. En säl i havet ger en tydligare badkoppling än en säl på stranden.

### over-backen
Bedömning: ÄNDRA
Uppdrag: Ditt djur vill över bäcken utan att bli blött. Kan du ordna en väg över?
Tack: Framme, och inte en blöt tå!
Nästan: Din skapelse får stanna! Jag letar efter något att ta sig över med, som en bro eller båt.
Hjälp: en hund på en bro; en katt i en båt; en kanin på en träbro
Godkända ord, lägg till: spång, trampstenar
Godkända ord, ta bort: luftballong, flygplan
Idéförslag att ändra: inga
Varför: Flygplan och luftballong är oproportionerliga lösningar för en liten bäck. En spång är en naturlig idé.

### skugga-at-djuret
Bedömning: ÄNDRA
Uppdrag: Ditt djur vill ha en egen skuggig viloplats. Kan du ordna ett litet krypin?
Tack: Vilken skön liten plats att vila på!
Nästan: Din skapelse får stanna! Jag letar efter ett krypin, som en koja eller ett tält.
Hjälp: en hund i en koja; en katt i ett skjul; en kanin i en koja
Godkända ord, lägg till: inga
Godkända ord, ta bort: träd, palm, parasoll, tak, solskydd, skugga
Idéförslag att ändra: en hund under ett träd → en hund i en koja; en apa under en palm → en apa i ett skjul; en katt i ett tält → en katt i en koja
Varför: Egen byggd viloplats skiljer uppdraget från `sol-skugga`. Etiketten ”Under grenar” behöver bytas till ”Bygg en viloplats”.

### present-till-en-van
Bedömning: OK
Uppdrag: oförändrad
Tack: oförändrad
Nästan: Din skapelse får stanna! Jag letar efter en present, som en blomma, bok eller leksak.
Hjälp: en kanin med en blomma; en katt med en bok; en hund med en nallebjörn
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Öppen kreativ uppgift där alla exempel är rimliga gåvor.

### hitta-till-picknicken
Bedömning: ÄNDRA
Uppdrag: Ditt djur har glömt vägen till picknicken! Vad kan hjälpa det att hitta rätt?
Tack: Rätt väg, nu väntar picknicken!
Nästan: Din skapelse får stanna! Jag letar efter vägvisning, som en karta eller skylt.
Hjälp: en hund med en karta; en kanin vid en vägskylt; en katt med en kompass
Godkända ord, lägg till: vägpil
Godkända ord, ta bort: stig, spår, ledtråd
Idéförslag att ändra: inga
Varför: En vanlig stig eller ett spår visar inte nödvändigtvis vägen till just picknicken.

### sol-och-gras
Bedömning: ÄNDRA
Uppdrag: Skapa två vänner: en gul som solen och en grön som gräset!
Tack: Nu ser hela ängen extra glad ut!
Nästan: Din skapelse får stanna! Jag letar efter två vänner: en gul och en grön.
Hjälp: en gul kyckling och en grön groda; en gul anka och en grön larv; en gul katt och en grön hund
Godkända ord, lägg till: inga
Godkända ord, ta bort: kyckling, groda, anka, larv, papegoja, drake, katt, hund
Idéförslag att ändra: inga
Varför: Begränsa färgorden till *gul* och *grön*. **Teknisk ändring krävs:** kontrollera båda färgerna och två varelser, inte bara två godkända ord.

### hogt-och-lagt
Bedömning: ÄNDRA
Uppdrag: Skapa två saker åt ditt djur: en hög och en låg!
Tack: Nu kan vi mäta med blicken!
Nästan: Din skapelse får stanna! Jag letar efter en hög och en låg sak, som torn och stubbe.
Hjälp: en hund vid ett högt torn och en låg stubbe; en katt vid ett högt träd och en låg sten; en kanin vid en hög bokhylla och ett lågt bord
Godkända ord, lägg till: lågt, högt
Godkända ord, ta bort: torn, stubbe, träd, sten, bokhylla, bord, hus, buske
Idéförslag att ändra: inga
Varför: Två saker som *torn* och *stubbe* kan annars räcka utan att höjdskillnaden uttrycks. Separat kontroll av en hög och en låg sak behövs; böjningar bör kännas igen automatiskt.

### ordet-med
Bedömning: ÄNDRA
Uppdrag: Skriv om ett djur som har något med sig. Använd ordet ”med”!
Tack: Nu hör de ihop som jag och min doktorsväska!
Nästan: Din skapelse får stanna! Jag saknar ordet ”med” och en sak, som en bok eller morot.
Hjälp: en katt med en bok; en hund med en karta; en kanin med en morot
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: **Teknisk ändring krävs:** ordet *med* måste vara obligatoriskt, plus ett föremål. ”En bok och en karta” får annars felaktigt godkänt.

### ordet-i
Bedömning: ÄNDRA
Uppdrag: Skriv om ett djur som sitter inne i något. Använd ordet ”i”!
Tack: Där inne blev det riktigt trivsamt!
Nästan: Din skapelse får stanna! Jag saknar ordet ”i” och en plats, som ett tält eller hus.
Hjälp: en hund i ett tält; en katt i en koja; en kanin i en båt
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: **Teknisk ändring krävs:** ordet *i* måste förekomma som eget ord tillsammans med en plats, inte bara två ord ur listan.

### ordet-under
Bedömning: ÄNDRA
Uppdrag: Skriv om ett djur som står under något. Använd ordet ”under”!
Tack: Där hittade vi en fin plats!
Nästan: Din skapelse får stanna! Jag saknar ordet ”under” och något ovanför, som ett bord eller träd.
Hjälp: en katt under ett bord; en mus under en stol; en hund under ett träd
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: **Teknisk ändring krävs:** *under* måste vara obligatoriskt. Två föremålsord utan preposition får annars godkänt.

### ordet-pa
Bedömning: ÄNDRA
Uppdrag: Skriv om ett djur som sitter på något. Använd ordet ”på”!
Tack: Vilken fin sittplats du ordnade!
Nästan: Din skapelse får stanna! Jag saknar ordet ”på” och en sittplats, som en stol eller stubbe.
Hjälp: en katt på en stol; en hund på en soffa; en kanin på en stubbe
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: **Teknisk ändring krävs:** *på* måste vara obligatoriskt och kopplat till sittplatsen. Småord bör matchas som hela ord.

### snabb-och-langsam
Bedömning: ÄNDRA
Uppdrag: Skapa två vänner: en snabb och en långsam!
Tack: Båda hinner fram till fikat!
Nästan: Din skapelse får stanna! Jag letar efter två vänner: en snabb och en långsam.
Hjälp: en snabb hare och en långsam larv; en snabb häst och en långsam mus; en snabb hund och en långsam katt
Godkända ord, lägg till: inga
Godkända ord, ta bort: hare, larv, häst, mus, hund, katt, groda, elefant
Idéförslag att ändra: inga
Varför: En hare och en häst ger annars två poäng utan att något långsamt skapats. **Teknisk ändring krävs:** två olika varelser ska ha varsin fart.

### ovantat-kompismote
Bedömning: ÄNDRA
Uppdrag: Skapa två djur: ett från isen och ett från djungeln!
Tack: Vilket ovanligt och härligt möte!
Nästan: Din skapelse får stanna! Jag söker en isvän och en djungelvän, som isbjörn och apa.
Hjälp: en isbjörn och en apa; en pingvin och en papegoja; en säl och en tiger
Godkända ord, lägg till: papegoja, tiger
Godkända ord, ta bort: giraff, delfin, kanin, bläckfisk, häst, lama, kamel, koala
Idéförslag att ändra: en isbjörn och en giraff → en isbjörn och en apa; en delfin och en kanin → en pingvin och en papegoja; en bläckfisk och en häst → en säl och en tiger
Varför: Giraff hör snarare till savann och de andra paren speglar inte is–djungel. **Teknisk ändring krävs:** godkänn en art från var och en av de två grupperna, inte vilka två ord som helst.

### ben-utan-promenad
Bedömning: ÄNDRA
Uppdrag: Min gåta har ben men kan inte gå! Vilken möbel står ditt djur bredvid?
Tack: Du löste gåtan utan ett enda steg!
Nästan: Din skapelse får stanna! Jag letar efter en möbel med ben, som ett bord eller en stol.
Hjälp: en hund bredvid ett bord; en katt bredvid en stol; en kanin bredvid en säng
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Ordet *möbel* gör gåtan begripligare utan att förstöra den lekfulla poängen.

### resa-fran-soffan
Bedömning: OK
Uppdrag: oförändrad
Tack: oförändrad
Nästan: Din skapelse får stanna! Jag letar efter något att upptäcka världen med, som en bok eller karta.
Hjälp: en katt med en bok på en soffa; en hund med en karta på en soffa; en apa på en soffa vid en tv
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Tydlig fantasiram där en bok, karta eller film är rimliga lösningar.

### omvanda-storlekar
Bedömning: ÄNDRA
Uppdrag: Min maskin byter storlek! Gör ett stort djur pyttelitet och ett smådjur jättestort!
Tack: Nu får vi leta efter den pyttelilla jätten!
Nästan: Din skapelse får stanna! Gör till exempel en pytteliten elefant och en jättestor mus.
Hjälp: en pytteliten elefant och en jättestor mus; en pytteliten giraff och ett jättestort bi; en pytteliten flodhäst och en jättestor larv
Godkända ord, lägg till: jätteliten, enorm
Godkända ord, ta bort: elefant, mus, giraff, bi, flodhäst, larv, noshörning, spindel
Idéförslag att ändra: inga
Varför: Enbart djurnamn får inte ersätta storleksbytet. **Teknisk ändring krävs:** minst två varelser och motsatta storlekar kopplade till normalt stor respektive liten art; en ordlista med två storleksord räcker inte.

### atbar-regnbage
Bedömning: ÄNDRA
Uppdrag: Ditt djur vill bjuda på fika med tre olika färger! Vad lägger du på fatet?
Tack: Vilken färgfest för både ögon och mage!
Nästan: Din skapelse får stanna! Jag letar efter tre olika färger på maten, som rött, gult och grönt.
Hjälp: en apa med ett rött äpple, en gul banan och grön broccoli; en kanin med en röd tomat, en gul citron och grön broccoli; en hund med en orange morot, lila druvor och ett grönt äpple
Godkända ord, lägg till: röd, gul, grön, orange, lila, blå, rött, grönt
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: **Teknisk ändring krävs:** tre olika *matfärger* och ätbara saker måste räknas, inte minst två slumpmässiga matord. Kontrollera gärna färg–mat-kopplingarna, annars kan exempelvis en röd katt och en banan ge fel godkänt.

## Skogen (16 uppdrag)

### skog-rod-van
Bedömning: OK
Uppdrag: oförändrad
Tack: oförändrad
Nästan: Din skapelse får stanna! Jag letar efter en röd vän, som en röd kanin.
Hjälp: en röd kanin; en röd räv; en röd uggla
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Här krävs redan färgordet och en varelse, till skillnad från det första röda uppdraget på ängen.

### skog-liten-van
Bedömning: ÄNDRA
Uppdrag: Kan du skapa en liten vän som får plats bredvid min minsta kaffekopp?
Tack: Så liten vän, så stor glädje!
Nästan: Din skapelse får stanna! Jag letar efter en liten vän, som en pytteliten igelkott.
Hjälp: en liten kanin; en pytteliten igelkott; en liten uggla
Godkända ord, lägg till: små
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: En enkel direkt uppmaning är tydligare än frågan ”Vem kan få plats?”. Varelsekontrollen finns redan.

### skog-magen-kurrar
Bedömning: OK
Uppdrag: oförändrad
Tack: oförändrad
Nästan: Din skapelse får stanna! Jag letar efter mat till en skogsgäst, som en morot eller ett äpple.
Hjälp: en kanin med en morot; en get med ett äpple; en apa med en banan
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Förståeligt och rättvist inom den öppna fantasiramen. Samma moment som på ängen är en begriplig repetition.

### skog-vila-benen
Bedömning: ÄNDRA
Uppdrag: En vän är trött i benen. Kan du ordna något att sitta på i skogen?
Tack: Här sitter vi som två nöjda potatisar!
Nästan: Din skapelse får stanna! Jag letar efter en sittplats, som en stubbe eller stock.
Hjälp: en kanin på en stubbe; en räv på en stock; en katt på en sten
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: en hund på en soffa → en hund på en stock; en katt i en fåtölj → en katt på en sten
Varför: Det nya uppdraget pekar ut en sittplats och gör skogsmiljön viktig. Etiketten ”Mjukt och bekvämt” bör bli ”Sittplatser i skogen”.

### skog-regnpaus
Bedömning: ÄNDRA
Uppdrag: Det regnar i skogen! Kan du skydda en vän mot regnet?
Tack: Nu kan regnet spela trumma utanför!
Nästan: Din skapelse får stanna! Jag letar efter skydd, som ett tält, en koja eller ett paraply.
Hjälp: en räv i en koja; en kanin i ett tält; en katt i ett hus
Godkända ord, lägg till: stuga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Tacket säger inte längre att regnet nödvändigtvis faller på ett tak; en grotta eller paraply kan också användas.

### skog-varm-van
Bedömning: OK
Uppdrag: oförändrad
Tack: oförändrad
Nästan: Din skapelse får stanna! Jag letar efter något varmt, som en tröja, mössa eller filt.
Hjälp: en kanin med en tröja; en katt med en mössa; en räv med en halsduk
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Text, kriterier och idéer passar ihop. Upprepningen fungerar som ett välbekant behov i en ny miljö.

### skog-kvallsljus
Bedömning: ÄNDRA
Uppdrag: Det blir mörkt mellan träden! Kan du ge en vän något som lyser?
Tack: Där är ju näsan, precis där vi lämnade den!
Nästan: Din skapelse får stanna! Jag letar efter ljus, som en lykta eller ficklampa.
Hjälp: en räv med en lykta; en kanin med en ficklampa; en hund med en lampa
Godkända ord, lägg till: pannlampa
Godkända ord, ta bort: sol
Idéförslag att ändra: en katt vid en golvlampa → en katt med en ficklampa; en hund vid en golvlampa → en hund med en lykta
Varför: Skogen får mer egen karaktär med bärbara lampor. Ta bort sol eftersom problemet är att det blir mörkt; etiketten ”Ljust vid läsplatsen” bör bli ”Ljus att bära”.

### skog-over-backen
Bedömning: ÄNDRA
Uppdrag: En bäck rinner genom skogen. Kan du hjälpa en vän över utan blöta tassar?
Tack: Framme, och inte en blöt tå!
Nästan: Din skapelse får stanna! Jag letar efter en torr väg över, som en bro eller en båt.
Hjälp: en kanin på en träbro; en räv på en bro; en katt i en roddbåt
Godkända ord, lägg till: spång
Godkända ord, ta bort: luftballong, flygplan
Idéförslag att ändra: inga
Varför: Anpassa till den mindre skogsbäcken och undvik osannolikt stora luftfarkoster. Närliggande Ängen-uppdrag kan fungera som repetition.

### skog-spara-matsacken
Bedömning: ÄNDRA
Uppdrag: En vän vill spara sin matsäck till senare. Kan du ge den en låda eller väska?
Tack: Där får fikat vänta på nästa fikapaus!
Nästan: Din skapelse får stanna! Jag letar efter något att lägga maten i, som en matlåda eller ryggsäck.
Hjälp: en kanin med en matlåda; en räv med en ryggsäck; en hund med en burk
Godkända ord, lägg till: lunchlåda, matburk
Godkända ord, ta bort: förvaring, kylskåp, skåp
Idéförslag att ändra: en kanin vid en skattkista → en kanin med en matlåda; en räv vid en skattkista → en räv med en ryggsäck; en katt vid ett kylskåp → en katt med en burk; en hund vid ett kylskåp → en hund med en väska
Varför: ”Förvaring” är för ospecifikt och ett kylskåp eller en skattkista i skogen är onödigt märkligt. Byt etiketterna till ”Små lådor” och ”Väskor”.

### skog-under-tradet
Bedömning: OK
Uppdrag: oförändrad
Tack: oförändrad
Nästan: Din skapelse får stanna! Jag letar efter en vän under ett träd. Skriv ”under ett träd”.
Hjälp: en kanin under ett träd; en igelkott under ett träd; en räv under ett träd
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Både *under* och *träd* krävs med nuvarande listan på två ord. Relationens faktiska betydelse kan dock inte valideras helt genom ordträffar.

### skog-stor-och-liten
Bedömning: ÄNDRA
Uppdrag: Skapa två skogsvänner: en stor och en liten!
Tack: Olika storlek, lika välkomna på fikat!
Nästan: Din skapelse får stanna! Jag letar efter två vänner: en stor och en liten.
Hjälp: en stor räv och en liten kanin; en stor varg och en liten igelkott; en stor uggla och en liten hund
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: ”En är pytte” är mindre naturlig svenska än ”en liten”. **Teknisk ändring krävs:** stor och liten måste beskriva varsin varelse.

### skog-hitta-riktningen
Bedömning: OK
Uppdrag: oförändrad
Tack: oförändrad
Nästan: Din skapelse får stanna! Jag letar efter två saker för att hitta rätt: en karta och en kompass.
Hjälp: en räv med en karta och en kompass; en hund med en karta och en kompass; en uggla med en karta och en kompass
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Bra exempel där två nödvändiga föremål är exakt de två godkända orden. Behåll enkelheten även om en karta normalt kan räcka på egen hand.

### skog-tva-spanare
Bedömning: ÄNDRA
Uppdrag: Kan du skapa två skogsvänner: en uggla och en igelkott?
Tack: Nu har vi spanare både högt och lågt!
Nästan: Din skapelse får stanna! Jag letar efter både en uggla och en igelkott.
Hjälp: en uggla och en igelkott; en uggla i ett träd och en igelkott på marken; en igelkott bredvid en uggla
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Den ursprungliga gåtan är fin men ”prasslar med taggig rygg” är en indirekt ledtråd. **Teknisk kontroll:** båda djuren ska faktiskt skapas, inte bara finnas som ord i sammansättningar.

### skog-mysig-lasplats
Bedömning: ÄNDRA
Uppdrag: En vän vill läsa i mörkret. Kan du ge den en bok och en lykta?
Tack: Nu lyser det om både orden och min mustasch!
Nästan: Din skapelse får stanna! Jag letar efter både en bok och en lykta.
Hjälp: en kanin med en bok och en lykta; en räv med en bok och en lykta; en katt med en bok och en lykta
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Texten kräver nu tydligt båda föremålen, vilket stämmer med ordlistan. Liknande läsuppdrag återkommer på flera platser.

### skog-ljus-vid-krypin
Bedömning: ÄNDRA
Uppdrag: En vän sover i ett tält. Kan du sätta en lykta utanför?
Tack: Vilket mysigt krypin med välkomstsken!
Nästan: Din skapelse får stanna! Jag letar efter både ett tält och en lykta.
Hjälp: en kanin i ett tält med en lykta utanför; en igelkott i ett tält med en lykta utanför; en räv i ett tält med en lykta utanför
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: en kanin i ett tält med en lykta → en kanin i ett tält med en lykta utanför; en igelkott i ett tält med en lykta → en igelkott i ett tält med en lykta utanför; en räv i ett tält med en lykta → en räv i ett tält med en lykta utanför; en hund i ett tält med en lykta → en hund i ett tält med en lykta utanför
Varför: ”Vad kan lysa?” får det att låta som ett ord räcker, men två krävs. Ordmatchningen säkrar inte att lyktan står utanför – kontrollera relationen eller acceptera även en lykta i tältet.

### skog-final-minnesljus
Bedömning: OK
Uppdrag: oförändrad
Tack: oförändrad
Nästan: Din skapelse får stanna! Min minnesmaskin behöver två saker: en lykta och en blomma.
Hjälp: en kanin med en lykta och en blomma; en igelkott med en lykta och en blomma; en räv med en lykta och en blomma
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Passande avslut som samlar två konkreta föremål och återkopplar till ängen.

## Sjön (16 uppdrag)

### sjo-bla-van
Bedömning: OK
Uppdrag: oförändrad
Tack: oförändrad
Nästan: Din skapelse får stanna! Jag letar efter en blå vän, som en blå fisk.
Hjälp: en blå fisk; en blå anka; en blå groda
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Färgen behöver anges och en varelse krävs redan. Idéförslagen passar den fantasifulla sjön.

### sjo-stor-simmare
Bedömning: ÄNDRA
Uppdrag: Jag vill träffa en riktigt stor vän vid sjön. Kan du skapa en?
Tack: Oj, vilken stor vän som kom till sjön!
Nästan: Din skapelse får stanna! Jag letar efter en stor vän, som en jättestor fisk.
Hjälp: en stor fisk; en jättestor anka; en stor gås
Godkända ord, lägg till: enorm
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Nuvarande ordkontroll godkänner även exempelvis ”en stor katt”, trots att en *simmare* efterfrågas. Den nya texten kräver bara storleken som spelet faktiskt kontrollerar.

### sjo-sitt-vid-vattnet
Bedömning: ÄNDRA
Uppdrag: En vän vill sitta vid sjön och titta på vågorna. Vad kan den sitta på?
Tack: Här sitter vi och låter vågorna göra jobbet!
Nästan: Din skapelse får stanna! Jag letar efter en sittplats, som en stock eller sten.
Hjälp: en hund på en stock vid sjön; en groda på en sten vid sjön; en katt på en stol vid sjön
Godkända ord, lägg till: strandstol
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Originalet saknar en tydlig fråga eller uppmaning. Det nya säger exakt vad barnet ska lösa.

### sjo-fruktpaus
Bedömning: OK
Uppdrag: oförändrad
Tack: oförändrad
Nästan: Din skapelse får stanna! Jag letar efter frukt, som ett äpple, en banan eller en melon.
Hjälp: en kanin med ett äpple; en apa med en banan; en groda med en apelsin
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Enkelt, vänligt och tydligt avgränsat till frukt; samtliga exempel är rimliga.

### sjo-skugga-pa-stranden
Bedömning: ÄNDRA
Uppdrag: Det är varmt på stranden! Kan du ordna skugga åt en vän?
Tack: Här får både nosen och öronen solpaus!
Nästan: Din skapelse får stanna! Jag letar efter skugga, som under ett träd eller parasoll.
Hjälp: en hund under ett träd på stranden; en kanin under ett parasoll; en katt i ett tält på stranden
Godkända ord, lägg till: skugga
Godkända ord, ta bort: palm
Idéförslag att ändra: en kanin under en palm på stranden → en kanin under ett parasoll på stranden
Varför: Ett parasoll passar bättre än en palm vid en vanlig sjöstrand. Skuggan behöver inte finnas ”på näsan” för att ge en viloplats.

### sjo-torr-overfart
Bedömning: OK
Uppdrag: oförändrad
Tack: oförändrad
Nästan: Din skapelse får stanna! Jag letar efter något att åka över vattnet i, som en båt eller kanot.
Hjälp: en hund i en roddbåt; en katt i en båt; en groda i en kanot
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Åka över utan att simma passar uppdraget och listan med farkoster. Ett lättanvänt uppdrag med sjöanknytning.

### sjo-regn-vid-stranden
Bedömning: ÄNDRA
Uppdrag: Det börjar regna på stranden! Kan du ge en vän ett torrt skydd?
Tack: Nu får dropparna bada utan oss!
Nästan: Din skapelse får stanna! Jag letar efter skydd mot regnet, som ett tält eller paraply.
Hjälp: en kanin i ett tält på stranden; en anka i en koja på stranden; en katt med ett paraply
Godkända ord, lägg till: regnponcho
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: ”Torrt krypin” utesluter egentligen paraply, som ändå är godkänt. ”Torrt skydd” rymmer både byggnader och bärbart skydd.

### sjo-lys-vid-vattnet
Bedömning: ÄNDRA
Uppdrag: Det börjar bli mörkt vid sjön! Vad kan hjälpa en vän att se sin matsäck?
Tack: Nu syns matsäcken i ljuset!
Nästan: Din skapelse får stanna! Jag letar efter en lampa eller lykta som lyser vid sjön.
Hjälp: en kanin med en lykta vid sjön; en anka med en ficklampa; en hund med en lampa på bryggan
Godkända ord, lägg till: pannlampa
Godkända ord, ta bort: inga
Idéförslag att ändra: en katt vid en golvlampa på stranden → en katt med en ficklampa på stranden; en hund vid en golvlampa på bryggan → en hund med en lykta på bryggan
Varför: En golvlampa ute på bryggan känns osannolik; bärbara lampor är enklare. Byt etiketten ”Ljust vid sittplatsen” till ”Ljus vid vattnet”.

### sjo-i-baten
Bedömning: OK
Uppdrag: oförändrad
Tack: oförändrad
Nästan: Din skapelse får stanna! Jag letar efter en vän ”i en roddbåt”.
Hjälp: en groda i en roddbåt; en kanin i en roddbåt; en hund i en roddbåt
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Orden *i* och *roddbåt* måste båda finnas med, och exemplen visar tydligt vad som ska skrivas.

### sjo-pa-bryggan
Bedömning: ÄNDRA
Uppdrag: En vän vill sitta på en brygga och titta på vattnet. Kan du skriva det?
Tack: Perfekt utsikt över allt det blå!
Nästan: Din skapelse får stanna! Jag letar efter en vän ”på en brygga”.
Hjälp: en anka på en brygga; en katt på en brygga; en hund på en brygga
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: ”Dingla med tassarna” passar inte alla djur, till exempel ankor; det nya fungerar för alla godkända varelser.

### sjo-tva-storlekar
Bedömning: ÄNDRA
Uppdrag: Skapa två vänner vid sjön: en stor och en liten!
Tack: Olika stora vänner vid samma glada sjö!
Nästan: Din skapelse får stanna! Jag letar efter två vänner: en stor och en liten.
Hjälp: en stor fisk och en liten fisk; en stor anka och en liten anka; en stor groda och en liten fisk
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Texten kräver inte längre att båda simmar när spelet inte kontrollerar det. **Teknisk ändring krävs:** *stor* och *liten* ska höra till varsin varelse.

### sjo-tva-farger
Bedömning: ÄNDRA
Uppdrag: Skapa två vänner vid sjön: en röd som tomaten och en blå som himlen!
Tack: Vilket färgglatt kompispar vid sjön!
Nästan: Din skapelse får stanna! Jag letar efter två vänner: en röd och en blå.
Hjälp: en röd fisk och en blå katt; en röd anka och en blå kanin; en röd groda och en blå gås
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Godkännandet kontrollerar inte att den röda finns i vattnet och den blå på stranden. Antingen behöver det särskild kod eller, enklare, den nya öppna formuleringen; två varelser behövs fortfarande.

### sjo-las-och-lys
Bedömning: ÄNDRA
Uppdrag: En vän vill läsa vid sjön. Kan du ge den en bok och en lykta?
Tack: Nu får sagan sällskap av vågornas kluck!
Nästan: Din skapelse får stanna! Jag letar efter två saker: en bok och en lykta.
Hjälp: en kanin på bryggan med en bok och en lykta; en groda med en bok och en lykta; en katt med en bok och en lykta
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Båda nödvändiga föremålen sägs uttryckligen. Nära `skog-mysig-lasplats`, men platsens ljud ger egen karaktär.

### sjo-tva-satt-att-resa
Bedömning: ÄNDRA
Uppdrag: Skapa två vänner: en i en båt och en på en bro!
Tack: Två vägar till samma fikapaus!
Nästan: Din skapelse får stanna! Jag letar efter en båt och en bro med varsin vän.
Hjälp: en katt i en roddbåt och en hund på en träbro; en hund i en roddbåt och en kanin på en träbro; en groda i en roddbåt och en anka på en träbro
Godkända ord, lägg till: båt, bro
Godkända ord, ta bort: roddbåt, träbro
Idéförslag att ändra: inga
Varför: Vanliga *båt* och *bro* ska godkännas, även som del av *roddbåt* respektive *träbro*. Det ger en ordträff från varje grupp, utan dubbla träffar på överlappande ord. **Teknisk ändring krävs** för att säkra två varelser med var sitt färdsätt.

### sjo-ovantad-kapten
Bedömning: ÄNDRA
Uppdrag: En fisk vill åka båt! Kan du skapa en fisk i en båt?
Tack: En simmare på båttur, vilken härlig idé!
Nästan: Din skapelse får stanna! Jag letar efter en fisk i en båt.
Hjälp: en fisk i ett badkar i en båt; en blå fisk i ett badkar i en båt; en gul fisk i ett badkar i en båt
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Uppdraget kräver nu exakt *fisk* och *båt*, som godkännandet redan kontrollerar. Idéförslagens vattenfyllda badkar är en frivillig, omtänksam detalj; om badkaret ska vara ett krav behövs separat kod.

### sjo-final-vattenglitter
Bedömning: OK
Uppdrag: oförändrad
Tack: oförändrad
Nästan: Din skapelse får stanna! Min minnesmaskin behöver två saker: en kristall och en blomma.
Hjälp: en anka med en kristall och en blomma; en groda med en kristall och en blomma; en hund med en kristall och en blomma
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Konkret och lätt att följa, och det förbereder hemresan till ängen.

## Grottan (16 uppdrag)

### grotta-forsta-skenet
Bedömning: ÄNDRA
Uppdrag: Här inne i grottan är det mörkt! Kan du ge en vän något som lyser?
Tack: Nu ser jag både vägen och min mustasch!
Nästan: Din skapelse får stanna! Jag letar efter något som lyser, som en lykta eller lampa.
Hjälp: en kanin med en lykta; en katt vid en lampa; en hund med en ficklampa
Godkända ord, lägg till: pannlampa
Godkända ord, ta bort: inga
Idéförslag att ändra: en hund vid en golvlampa → en hund med en ficklampa; en groda vid en golvlampa → en groda med en lykta
Varför: ”Skymning hela dagen” är lite abstrakt. Ficklampor känns mer naturliga i en grotta än golvlampor; etiketten ”Ljust i hörnet” kan bli ”Ljus att bära”.

### grotta-gul-van
Bedömning: OK
Uppdrag: oförändrad
Tack: oförändrad
Nästan: Din skapelse får stanna! Jag letar efter en gul vän, som en gul mus eller groda.
Hjälp: en gul kanin; en gul mus; en gul groda
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Färgord och varelse krävs redan; idén med en egen solstråle i grottan fungerar.

### grotta-liten-upptackare
Bedömning: ÄNDRA
Uppdrag: Det finns ett pyttelitet hål i grottan! Kan du skapa en vän som får plats?
Tack: Vilken liten upptäckare med stora idéer!
Nästan: Din skapelse får stanna! Jag letar efter en liten vän, som en pytteliten mus.
Hjälp: en pytteliten mus; en liten kanin; en pytteliten groda
Godkända ord, lägg till: små
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Nu behövs litenheten faktiskt för att få plats; att bara ”kika in” i hålet kräver inte en liten varelse.

### grotta-sittpaus
Bedömning: ÄNDRA
Uppdrag: En vän vill sitta och titta på allt som glimmar! Vad kan den sitta på?
Tack: Här kan vi sitta och klura en stund!
Nästan: Din skapelse får stanna! Jag letar efter en sittplats, som en sten eller stol.
Hjälp: en groda på en sten; en katt på en stol; en kanin i en fåtölj
Godkända ord, lägg till: stenblock
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Originalet saknar tydlig instruktion. En enkel fråga gör målet tydligt även när uppdraget läses upp.

### grotta-varma-oron
Bedömning: ÄNDRA
Uppdrag: Brr, grottan är kall! Kan du ge en vän något varmt att ha på sig?
Tack: Nu är det mysigt ända ut i öronen!
Nästan: Din skapelse får stanna! Jag letar efter något varmt att ha på sig, som en tröja eller mössa.
Hjälp: en hund med en tröja; en katt med en mössa; en kanin med en halsduk
Godkända ord, lägg till: strumpor, vantar
Godkända ord, ta bort: filt, täcke, varm
Idéförslag att ändra: inga
Varför: ”Kittlar luften kallt” låter onaturligt. Med fokus på kläder behöver även listan handla om sådant man kan ha på sig; närliggande uppdrag upprepar annars samma lösning.

### grotta-mjuk-vila
Bedömning: OK
Uppdrag: oförändrad
Tack: oförändrad
Nästan: Din skapelse får stanna! Jag letar efter en mjuk sovplats, som en säng eller madrass.
Hjälp: en hund i en säng; en katt på en soffa; en kanin i en fåtölj
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Det hårda berget gör ett välbekant sovuppdrag miljöspecifikt och begripligt.

### grotta-eget-krypin
Bedömning: OK
Uppdrag: oförändrad
Tack: oförändrad
Nästan: Din skapelse får stanna! Jag letar efter ett litet hem, som en koja eller ett tält.
Hjälp: en kanin i ett tält i grottan; en mus i en koja i grottan; en hund i ett hus i grottan
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Ett hem inne i berget är fantasifullt, lätt att förstå och har passande idéförslag.

### grotta-ordna-lasning
Bedömning: ÄNDRA
Uppdrag: En vän vill läsa inne i grottan. Kan du ge den något att läsa?
Tack: Nu får fantasin gå på egen upptäcktsfärd!
Nästan: Din skapelse får stanna! Jag letar efter något att läsa, som en bok eller serietidning.
Hjälp: en kanin med en bok; en katt med en serietidning; en hund med en sagobok
Godkända ord, lägg till: inga
Godkända ord, ta bort: berättelse
Idéförslag att ändra: inga
Varför: En berättelse kan också vara muntlig. En bok eller serietidning är tydligare som föremål att skriva fram.

### grotta-under-bordet
Bedömning: OK
Uppdrag: oförändrad
Tack: oförändrad
Nästan: Din skapelse får stanna! Jag letar efter en vän under ett bord. Skriv ”under ett bord”.
Hjälp: en mus under ett bord; en kanin under ett bord; en katt under ett bord
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: En lekfull enkel gåta med två nödvändiga ord. Barnet kan lösa den genom att använda något av de tydliga exemplen.

### grotta-stor-och-liten
Bedömning: ÄNDRA
Uppdrag: Skapa två vänner i grottan: en stor och en liten!
Tack: Olika stora vänner får plats i samma saga!
Nästan: Din skapelse får stanna! Jag letar efter två vänner: en stor och en liten.
Hjälp: en stor hund och en liten katt; en stor kanin och en liten mus; en stor mus och en liten hund
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Tydligare och kortare än ”en är pytte”. **Teknisk ändring krävs:** varsin storlek måste kopplas till varsin varelse.

### grotta-sken-och-saga
Bedömning: ÄNDRA
Uppdrag: En vän vill läsa i grottan. Kan du ge den en bok och en lykta?
Tack: Nu lyser sagostunden upp hela min dag!
Nästan: Din skapelse får stanna! Jag letar efter både en bok och en lykta.
Hjälp: en kanin med en bok och en lykta; en mus med en bok och en lykta; en hund med en bok och en lykta
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Barnet får nu direkt veta att två saker behövs. Det liknar läsuppdragen i skogen och vid sjön, men den mörka grottan motiverar ljuskällan.

### grotta-tva-farger
Bedömning: ÄNDRA
Uppdrag: Skapa två vänner i grottan: en grön som gräset och en gul som solen!
Tack: Vilken färgglad liten samling!
Nästan: Din skapelse får stanna! Jag letar efter två vänner: en grön och en gul.
Hjälp: en grön groda och en gul mus; en grön kanin och en gul katt; en grön hund och en gul kanin
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Den gamla texten kräver också en särskild placering runt en sten som inte kontrolleras. **Teknisk ändring krävs:** två varelser med varsin färg; nuvarande ordlista säkrar endast båda färgorden.

### grotta-ljus-utanfor
Bedömning: ÄNDRA
Uppdrag: En vän har en koja vid grottan. Kan du ställa en lykta utanför?
Tack: Nu lyser det välkomnande utanför kojan!
Nästan: Din skapelse får stanna! Jag letar efter två saker: en koja och en lykta.
Hjälp: en mus i en koja med en lykta utanför; en kanin i en koja med en lykta utanför; en katt i en koja med en lykta utanför
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: en mus i en koja med en lykta → en mus i en koja med en lykta utanför; en kanin i en koja med en lykta → en kanin i en koja med en lykta utanför; en katt i en koja med en lykta → en katt i en koja med en lykta utanför; en hund i en koja med en lykta → en hund i en koja med en lykta utanför
Varför: Utomhus vid grottan blir en annan scen än det upplysta tältet i skogen. Uppdraget kräver två saker, men ordträffarna kan inte kontrollera att lyktan står just *utanför*.

### grotta-ben-som-vilar
Bedömning: ÄNDRA
Uppdrag: Ett eko är ett ljud som kommer tillbaka. Kan en vän höra ett eko här inne?
Tack: Hallå, hallå! Nu svarar grottan!
Nästan: Din skapelse får stanna! Jag letar efter ett eko, när ett ljud kommer tillbaka.
Hjälp: en mus som ropar och hör ett eko; en katt som hör ett eko i grottan; en kanin som ropar och hör ett eko
Godkända ord, lägg till: eko
Godkända ord, ta bort: bord, stol, soffa, säng, fåtölj, pall, bänk, skrivbord, matbord, soffbord
Idéförslag att ändra: en hund bredvid ett bord → en mus som ropar och hör ett eko; en katt bredvid en stol → en katt som hör ett eko i grottan; en kanin bredvid en säng → en kanin som ropar och hör ett eko; en mus bredvid en soffa → en hund som ropar och hör ett eko
Varför: Originalet är en nästan ordagrann dublett av `ben-utan-promenad`. Ett eko ger grottan ett eget, lekfullt naturfenomen. **Måste testas i skapelsemotorn:** om *eko* inte stöds, behåll inte den nya versionen utan att först lösa igenkänningen. Etiketterna bör bytas till ”Ropa i grottan” och ”Höra ett eko”.

### grotta-glitter-i-kistan
Bedömning: ÄNDRA
Uppdrag: En vän har hittat en kristall och en skattkista! Kan du skapa båda?
Tack: Nu har vi både en fin skatt och en kista!
Nästan: Din skapelse får stanna! Jag letar efter både en kristall och en skattkista.
Hjälp: en mus bredvid en skattkista med en kristall i; en kanin med en kristall och en skattkista; en katt vid en skattkista med en kristall i
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: Ordlistan kontrollerar *skattkista + kristall*, inte att kristallen ligger i kistan. Den nya texten matchar det som faktiskt går att godkänna.

### grotta-final-bergets-berattelse
Bedömning: ÄNDRA
Uppdrag: Min minnesmaskin behöver två saker från grottan: en kristall och en bok!
Tack: Nu kan grottans glans och sagor följa med hem!
Nästan: Din skapelse får stanna! Min minnesmaskin behöver både en kristall och en bok.
Hjälp: en kanin med en kristall och en bok; en mus med en kristall och en bok; en hund med en kristall och en bok
Godkända ord, lägg till: inga
Godkända ord, ta bort: inga
Idéförslag att ändra: inga
Varför: ”Något med sagor i” är en onödigt lång omskrivning när spelet kräver just en bok. Klart slutuppdrag med två tydliga föremål.
