# Copilot-prompter (Microsoft 365 Copilot, ser inte repot)
Varje prompt är fristående. Klistra in hela blocket i en ny chatt. Svaret är ren JSON, som Christoffer klistrar in hos Arkitekten. Därefter kör Arkitekten `konvertera.py` och provet. Ta dem i ordning: P2 ger mest, sedan P1 och sist P3.

## P2 – Resten av gåtorna till ängens hemliga djur (förra svaret klipptes av efter 49)
````
Fortsättning på Trollpennan (svenskt lässpel, barn 7–12 år, https://trollpennan.grok.me/). Ditt förra svar med gåtor till de hemliga djuren klipptes av efter "rymdvarelse". Skriv gåtor till de 72 djur som står nedan och inga andra. Formen och reglerna är desamma som förra gången.

FORM (en JSON-lista, inget annat i svaret):
[{"ord": "ekorre", "gata": "Jag har en yvig svans och samlar nötter till vintern. Vem är jag?", "gata_latt": "Jag är rödbrun och klättrar i träd.", "bengtsson_fore": "Psst! Jag såg något klättra i granen nyss...", "bengtsson_klart": "Ja! En ekorre! Du är en riktig gåtmästare!", "forsta": "E", "langd": 6}]

REGLER: Ordet får aldrig stå i gata eller gata_latt, inte heller som en del av ett längre ord. gata ska vara 1–2 korta meningar på högst 110 tecken, med ord som en 7-åring förstår. gata_latt är tydligare än gata. Inget får vara läskigt. Variera hur gåtorna börjar. "langd" är antalet bokstäver, och å, ä och ö räknas som en bokstav.

DJUR: utomjording, flundra, koi, karp, piraya, svärdfisk, tonfisk, lama, mops, alpacka, åsna, husky, kronhjort, älg, varg, bläckfisk, cyklop, jätte, golem, trollkarl, marulk, fladdermus, bi, corgi, ankylosaurus, sjöodjur, flygödla, triceratops, rådjur, tjur, highlandsko, lamm, flamingo, blåsfisk, get, gås, hare, igelkott, kolibri, manet, kiwi, ara, murmeldjur, påfågel, pelikan, näbbdjur, noshörning, tupp, säl, tukan, nisse, höna, tvättbjörn, spindel, kalkon, ninja, mus, råtta, tomte, gnom, stegosaurus, kalv, får, sköldpadda, häxa, trollslända, velociraptor, oxe, geting, valfisk, sjöborre, mussla

Om svaret blir långt, skicka högst 36 djur per svar och skriv "Skriv FORTSÄTT". Kontrollera innan du svarar att JSON:en är giltig, att varje djur finns med en gång och att langd stämmer.
````

## P1 – Byt ut uppdrag som upprepas mellan platserna
````
Du skrev Trollpennans uppdrag för Skogen, Sjön och Grottan. Sex av dem finns redan på en annan plats i nästan samma form. Skriv ett NYTT uppdrag i stället för vart och ett av de 8 uppdragen nedan. Behåll id, omrade och antal stjärnor, men byt idén helt. Gör den gärna platstypisk, till exempel att något flyter på sjön, att något gömmer sig bakom en stubbe i skogen, eller ett eko, en kristall eller en skattkarta i grottan. Minst två av dem ska vara språkuppdrag (motsatser, rim, prepositioner eller plural).

FORM (en JSON-lista, inget annat i svaret):
[{"id": "...", "omrade": "skog|sjo|grotta", "stjarnor": 1, "text": "...", "text_bengtsson": "...", "klart_bengtsson": "...", "krav": {"ord": ["..."], "min": 1}, "val": [{"etikett": "...", "forslag": [{"ord": "...", "fras": "en ... "}]}]}]

REGLER
1. Varje "forslag.ord" MÅSTE stå i ORDLISTAN nedan, med exakt den stavningen. Det är de ord som har en 3D-modell.
2. Varje "fras" innehåller ett djur och löser uppdraget. "krav.ord" är de ord som godkänns (8–12 ord när min = 1), och minst ett av dem står i varje fras. Ett kravord får inte stå i text_bengtsson.
3. 2–3 grupper med 2–3 förslag per uppdrag. Repliker på högst 120 tecken. Korrekt en/ett. Skriv aldrig "din kanin", skriv "ditt djur". Inget läskigt, ingen skam.

UPPDRAGEN SOM SKA ERSÄTTAS (för id och nivå):
[
 {
  "id": "sjo-tva-storlekar",
  "omrade": "sjon",
  "stjarnor": 2,
  "text": "Skriv fram ett stort och ett litet vattendjur med orden stor och liten.",
  "text_bengtsson": "Två simmande vänner vill vara olika stora! Kan dina ord visa skillnaden?",
  "klart_bengtsson": "Olika stora plask, samma glada bad!",
  "krav": {
   "ord": [
    "stor",
    "liten"
   ],
   "min": 2,
   "djur": true
  },
  "val": [
   {
    "etikett": "Samma sorts djur",
    "forslag": [
     {
      "ord": "fisk",
      "fras": "en stor fisk och en liten fisk"
     },
     {
      "ord": "anka",
      "fras": "en stor anka och en liten anka"
     }
    ]
   },
   {
    "etikett": "Olika vänner",
    "forslag": [
     {
      "ord": "groda",
      "fras": "en stor groda och en liten fisk"
     },
     {
      "ord": "gås",
      "fras": "en stor gås och en liten anka"
     }
    ]
   }
  ]
 },
 {
  "id": "sjo-las-och-lys",
  "omrade": "sjon",
  "stjarnor": 3,
  "text": "Skriv fram ett djur på bryggan med både en bok och en lykta.",
  "text_bengtsson": "En vän vill läsa vid vattnet när det skymmer! Vad behövs för berättelsen och skenet?",
  "klart_bengtsson": "Nu får sagan sällskap av vågornas kluck!",
  "krav": {
   "ord": [
    "bok",
    "lykta"
   ],
   "min": 2,
   "djur": true
  },
  "val": [
   {
    "etikett": "Små läsare",
    "forslag": [
     {
      "ord": "bok",
      "fras": "en kanin på bryggan med en bok och en lykta"
     },
     {
      "ord": "bok",
      "fras": "en groda på bryggan med en bok och en lykta"
     }
    ]
   },
   {
    "etikett": "Andra sagovänner",
    "forslag": [
     {
      "ord": "lykta",
      "fras": "en katt på bryggan med en bok och en lykta"
     },
     {
      "ord": "lykta",
      "fras": "en hund på bryggan med en bok och en lykta"
     }
    ]
   }
  ]
 },
 {
  "id": "grotta-forsta-skenet",
  "omrade": "grottan",
  "stjarnor": 1,
  "text": "Skriv fram ett djur med något som lyser.",
  "text_bengtsson": "Här inne är det skymning hela dagen! Vad hjälper en vän att se bättre?",
  "klart_bengtsson": "Nu ser jag både vägen och min mustasch!",
  "krav": {
   "ord": [
    "lykta",
    "golvlampa",
    "lampa",
    "ficklampa",
    "nattlampa",
    "ljusslinga",
    "ljus"
   ],
   "min": 1,
   "djur": true
  },
  "val": [
   {
    "etikett": "Ett litet sken",
    "forslag": [
     {
      "ord": "lykta",
      "fras": "en kanin med en lykta"
     },
     {
      "ord": "lykta",
      "fras": "en katt vid en lykta"
     }
    ]
   },
   {
    "etikett": "Ljust i hörnet",
    "forslag": [
     {
      "ord": "golvlampa",
      "fras": "en hund vid en golvlampa"
     },
     {
      "ord": "golvlampa",
      "fras": "en groda vid en golvlampa"
     }
    ]
   }
  ]
 },
 {
  "id": "grotta-liten-upptackare",
  "omrade": "grottan",
  "stjarnor": 1,
  "text": "Skriv fram ett pyttelitet djur.",
  "text_bengtsson": "Vem kan kika in i ett hål som är mindre än min kaffekopp?",
  "klart_bengtsson": "Vilken liten upptäckare med stora idéer!",
  "krav": {
   "ord": [
    "liten",
    "pytteliten",
    "minimal"
   ],
   "min": 1,
   "djur": true
  },
  "val": [
   {
    "etikett": "Små tassar",
    "forslag": [
     {
      "ord": "mus",
      "fras": "en pytteliten mus"
     },
     {
      "ord": "kanin",
      "fras": "en pytteliten kanin"
     }
    ]
   },
   {
    "etikett": "Med fantasi",
    "forslag": [
     {
      "ord": "hund",
      "fras": "en pytteliten hund"
     },
     {
      "ord": "groda",
      "fras": "en pytteliten groda"
     }
    ]
   }
  ]
 },
 {
  "id": "grotta-sittpaus",
  "omrade": "grottan",
  "stjarnor": 1,
  "text": "Skriv fram ett djur med en sittplats.",
  "text_bengtsson": "Puh, benen vill vila medan vi tittar på allt som glimmar!",
  "klart_bengtsson": "Här kan vi sitta och klura en stund!",
  "krav": {
   "ord": [
    "stol",
    "sten",
    "stubbe",
    "stock",
    "soffa",
    "fåtölj",
    "bänk",
    "pall",
    "kudde"
   ],
   "min": 1,
   "djur": true
  },
  "val": [
   {
    "etikett": "Enkel sittplats",
    "forslag": [
     {
      "ord": "sten",
      "fras": "en groda på en sten"
     },
     {
      "ord": "stol",
      "fras": "en katt på en stol"
     }
    ]
   },
   {
    "etikett": "Mjukt och skönt",
    "forslag": [
     {
      "ord": "soffa",
      "fras": "en hund på en soffa"
     },
     {
      "ord": "fåtölj",
      "fras": "en kanin i en fåtölj"
     }
    ]
   }
  ]
 },
 {
  "id": "grotta-varma-oron",
  "omrade": "grottan",
  "stjarnor": 1,
  "text": "Skriv fram ett djur med något som värmer.",
  "text_bengtsson": "Brr, här kittlar luften kallt! Kan en vän slippa huttra?",
  "klart_bengtsson": "Nu är det mysigt ända ut i öronen!",
  "krav": {
   "ord": [
    "tröja",
    "mössa",
    "luva",
    "filt",
    "täcke",
    "halsduk",
    "jacka",
    "vante",
    "socka",
    "varm"
   ],
   "min": 1,
   "djur": true
  },
  "val": [
   {
    "etikett": "Om kroppen",
    "forslag": [
     {
      "ord": "tröja",
      "fras": "en hund med en tröja"
     },
     {
      "ord": "tröja",
      "fras": "en katt med en tröja"
     }
    ]
   },
   {
    "etikett": "Om huvudet",
    "forslag": [
     {
      "ord": "mössa",
      "fras": "en kanin med en mössa"
     },
     {
      "ord": "luva",
      "fras": "en mus med en luva"
     }
    ]
   }
  ]
 },
 {
  "id": "grotta-stor-och-liten",
  "omrade": "grottan",
  "stjarnor": 2,
  "text": "Skriv fram ett stort djur och ett litet djur med orden stor och liten.",
  "text_bengtsson": "Två vänner vill prova helt olika storlekar! Kan dina ord visa skillnaden?",
  "klart_bengtsson": "Olika stora vänner får plats i samma saga!",
  "krav": {
   "ord": [
    "stor",
    "liten"
   ],
   "min": 2,
   "djur": true
  },
  "val": [
   {
    "etikett": "Tassar tillsammans",
    "forslag": [
     {
      "ord": "hund",
      "fras": "en stor hund och en liten katt"
     },
     {
      "ord": "kanin",
      "fras": "en stor kanin och en liten mus"
     }
    ]
   },
   {
    "etikett": "Byt storlek",
    "forslag": [
     {
      "ord": "mus",
      "fras": "en stor mus och en liten hund"
     },
     {
      "ord": "groda",
      "fras": "en stor groda och en liten kanin"
     }
    ]
   }
  ]
 },
 {
  "id": "grotta-sken-och-saga",
  "omrade": "grottan",
  "stjarnor": 2,
  "text": "Skriv fram ett djur med både en bok och en lykta.",
  "text_bengtsson": "En vän vill läsa här inne! Vad behövs för både berättelsen och skenet?",
  "klart_bengtsson": "Nu lyser sagostunden upp hela min dag!",
  "krav": {
   "ord": [
    "bok",
    "lykta"
   ],
   "min": 2,
   "djur": true
  },
  "val": [
   {
    "etikett": "Små läsare",
    "forslag": [
     {
      "ord": "bok",
      "fras": "en kanin med en bok och en lykta"
     },
     {
      "ord": "bok",
      "fras": "en mus med en bok och en lykta"
     }
    ]
   },
   {
    "etikett": "Fler sagovänner",
    "forslag": [
     {
      "ord": "lykta",
      "fras": "en katt med en bok och en lykta"
     },
     {
      "ord": "lykta",
      "fras": "en hund med en bok och en lykta"
     }
    ]
   }
  ]
 }
]

ORDLISTAN (ord med modell):
alpacka, alpackakung, alvmössa, ambulans, ananas, anka, ankylosaurus, anteckningsbok, apa, apatosaurus, apelsin, ara, arbetsbänk, asteroid, astronaut, aubergine, avokado, backe, badkar, baguette, bambu, banan, barstol, basketboll, berg, bi, biff, bil, bild, bjällra, björk, block, blomkruka, blomkål, blomma, blommor, blyertspenna, bläckfisk, bläckfiskmonster, blåsfisk, bok, bokhylla, bokhög, bokstapel, bonde, bord, bordslampa, borr, brandbil, brandpost, brasa, brevlåda, bro, broccoli, brunn, brygga, bräda, brädor, bröd, brödrost, budbil, burk, buske, bägare, bänk, båge, bågskytt, båt, böcker, börs, carnotaurus, champinjon, choklad, chokladkaka, citron, clownfisk, container, corgi, croissant, cupcake, cyklop, cylinderhatt, dagbok, datormus, datorskärm, delfin, demon, designfåtölj, diesellok, diskbänk, diskho, donut, draghund, dragster, drake, drakskepp, droppsten, druvor, dubbelsäng, dusch, dörrmatta, ek, eka, elefant, enkelsäng, fackla, fartyg, fisk, fiskespö, fjärilsfisk, fladdermus, flagga, flakbil, flakvagn, flamingo, flaska, flod, flodhäst, flotte, flugsvamp, flundra, flygödla, fontän, fotboll, framtidsbil, fugu, fyr, färja, fågel, får, fåtölj, födelsedagstårta, förstoringsglas, gaffel, gatlykta, get, geting, giraff, glas, glass, glassbägare, glasstrut, glubb, gnom, godis, godsvagn, gokart, golem, golvlampa, gosedjur, gran, grillstativ, grind, groda, grotta, grottgång, grottport, grottöppning, gryta, gräs, grävtraktor, gubbe, guldhög, guldklimp, guldklump, guldmynt, guldnyckel, guldtacka, gås, hacka, hage, halloweenpumpa, halsband, hamburgare, hammare, handborr, handduk, handfat, handske, hare, helikopter, highlandsko, hind, hink, hjort, hjälte, hjärta, honung, hund, hus, husky, hylla, hyvel, häck, häckgrind, häst, häxa, häxhatt, höghus, högtalare, höna, hönsgård, hönshus, hörnsoffa, höstgran, höstträd, igelkott, isbjörn, isglass, ispinne, jacka, jeep, jordgubbe, julbelysning, julklapp, julkrans, julstrumpa, juvel, järn, järntacka, jätte, jättebi, kaffebryggare, kaj, kaka, kaktus, kalkon, kalv, kamin, kampfisk, kanin, kanon, kanot, karp, karta, kartong, kastrull, katt, kavel, keps, ketchupflaska, kex, kirurgfisk, kista, kittel, kiwi, klippa, klippblock, klippvägg, klocka, kloss, klubba, klumpfisk, klädhängare, klänning, klöver, ko, koala, kofisk, koi, koja, kokosnöt, kolibri, kolvagn, kombi, kompass, kopp, koppar, kopparstång, korv, krabba, kratta, kristall, kronhjort, kruka, krukväxt, kryssningsfartyg, kudde, kugghjul, kulle, kvarn, kvinna, kyckling, kylskåp, kyrka, kyrkogårdsvaktmästare, känga, kärra, kål, kålrot, köksbord, köksskåp, körsbär, lada, lama, lamm, lampa, laptop, larv, lastare, lastbil, lastpall, lejon, leveransbil, livbåt, ljus, ljusslinga, ljusstake, lok, luva, luvtröja, lykta, lyktstolpe, lyxjeep, lägereld, läsk, låda, långhals, lås, macka, magiker, majs, mandarinfisk, manet, marknadsstånd, marulk, matlåda, matta, mejsel, melon, menhir, menorah, meteor, middag, mikrovågsugn, minibuss, minnessten, mistel, mixer, mjölk, mjölkko, moln, monsterduva, monstergroda, monsterhund, monsterkatt, monstertruck, mops, morot, muffin, muffins, mugg, munk, murmeldjur, murslev, mus, mussla, mynt, myntstapel, människa, månbil, mössa, nallebjörn, napoleonfisk, nattduksbord, nemo, neontetra, ninja, nisse, noshörning, nyckel, näbbdjur, näckros, nötknäppare, obelisk, odlingsrad, orch, orm, ormbunke, ost, oviraptor, oxe, pachycephalosaurus, paj, pall, palm, panda, pannkakor, papegoja, papegojfisk, papperskorg, paprika, paraply, parasaurolophus, pelikan, pendeltåg, penna, pepparkaka, pepparkaksgubbe, pepparkaksgumma, pepparkakshus, pergament, persontåg, pilbåge, pingvin, piratskepp, piraya, pizza, pizzakartong, planka, plankor, plankstaket, plankstapel, planteringslåda, plattfisk, plesiosaurie, plåthink, pokal, polisbil, polistraktor, polkagris, port, potatis, present, presentlåda, pterodactylus, pudding, pulka, pumpa, pumpalykta, purjolök, päron, påfågel, påse, racerbil, racerfarkost, radio, raket, rep, replina, repstaket, riddare, robot, roddbåt, rova, rudolf, rymdfarare, rymdfarkost, rymdskepp, rymdvarelse, rädisa, räv, rådjur, råtta, rödbeta, sallad, sandstrand, sax, segelbåt, segelskepp, segelskjul, senapsflaska, sidobord, silo, silohus, silvermynt, silvertacka, sjöborre, sjöodjur, skateboard, skatt, skattkarta, skattkista, sked, skelett, skepp, skeppsvrak, skimmel, skinka, skjul, skriftrulle, skrivbord, skrivbordsstol, skruvmejsel, skruvnyckel, skyffel, skylt, skärbräda, skål, skåp, skåpbil, sköld, sköldpadda, slickepinne, slipsten, slottstorn, släde, småvarelse, smörgås, snabbtåg, snapper, snickarbänk, snurra, snöboll, snödriva, snöflinga, snöfort, snögran, snögrotta, snögubbe, snöhög, snömänniska, snöträd, soffa, soffbord, soffbänk, solfisk, solhatt, sombrero, sopbil, sopcontainer, soppa, soptunna, sovsäck, spade, spannmålssilo, spegel, spetshacka, spik, spindel, spinosaurus, spis, sportbil, spårvagn, spöke, spökskepp, stadsjeep, staket, stalaktit, stall, staty, stearinljus, stege, stegosaurus, stek, stekpanna, sten, stenar, stenbro, stenmur, stentrappa, stenvarelse, stjärna, stock, stol, strand, stubbe, stuga, städ, ståndsten, stövlar, sushi, svamp, svampar, svampmonster, svärd, svärdfisk, säck, säl, säng, säv, såg, sågblad, taco, tall, tallrik, tandhjul, tangentbord, tankvagn, tavla, taxi, tegelsten, tender, tiger, timmerstock, timmervagn, tjur, toa, toalett, tofflor, tomat, tomte, tomteluva, tonfisk, torktumlare, torn, trafikljus, traktor, trappa, triceratops, troll, trollbok, trolldryck, trollkarl, trollkarlsgnom, trollslända, trollstav, trä, träbro, träd, trädmonster, trädstam, trälåda, träspann, trästaket, trätrappa, tröja, tukan, tunna, tunnel, tunnelbana, tupp, tv, tvättbjörn, tvättmaskin, tvättställ, tyg, tygrulle, tyrannosaurus, tält, tåg, tågvagn, tång, tårta, uggla, ugn, utomjording, vagn, valfisk, valv, vampyr, varg, varmkorv, vas, vass, vattenfall, vattenkokare, vattenkvarn, vattenmelon, vattentorn, ved, vedstapel, vedtrave, velociraptor, vete, veteranbil, vikingaskepp, vildsvin, villa, virvelvarelse, visp, vitkål, vrak, väderkvarn, vägglampa, vägvisare, växt, våffla, våningssäng, yeti, yxa, zebra, zombie, ädelsten, ägg, älg, äpple, åker, åkerrad, ånglok, åsna, örn
````

## P3 – Byt startobjekt som saknar modell
````
I Trollpennan har platserna startobjekt som redan står där när barnet kommer. De här 9 saknar 3D-modell: skogen: bäck, stig, vägskylt. sjön: vassrugge, sandbotten, stig. grottan: sandhög, vattenpöl, stig. Föreslå för varje plats 4–6 ord ur ORDLISTAN som ger samma stämning (till exempel sten, svamp, buske, brygga, kristall eller lykta), med en placering. x är 0 till vänster och 1 till höger, och y är 0 längst bak och 1 längst fram. Håll y under 0,6 så att barnets egna skapelser får plats längst fram.
FORM (JSON, inget annat): {"skog": [{"ord": "stubbe", "x": 0.2, "y": 0.4, "skala": 1.0}], "sjo": [], "grotta": []}
ORDLISTAN: alpacka, alpackakung, alvmössa, ambulans, ananas, anka, ankylosaurus, anteckningsbok, apa, apatosaurus, apelsin, ara, arbetsbänk, asteroid, astronaut, aubergine, avokado, backe, badkar, baguette, bambu, banan, barstol, basketboll, berg, bi, biff, bil, bild, bjällra, björk, block, blomkruka, blomkål, blomma, blommor, blyertspenna, bläckfisk, bläckfiskmonster, blåsfisk, bok, bokhylla, bokhög, bokstapel, bonde, bord, bordslampa, borr, brandbil, brandpost, brasa, brevlåda, bro, broccoli, brunn, brygga, bräda, brädor, bröd, brödrost, budbil, burk, buske, bägare, bänk, båge, bågskytt, båt, böcker, börs, carnotaurus, champinjon, choklad, chokladkaka, citron, clownfisk, container, corgi, croissant, cupcake, cyklop, cylinderhatt, dagbok, datormus, datorskärm, delfin, demon, designfåtölj, diesellok, diskbänk, diskho, donut, draghund, dragster, drake, drakskepp, droppsten, druvor, dubbelsäng, dusch, dörrmatta, ek, eka, elefant, enkelsäng, fackla, fartyg, fisk, fiskespö, fjärilsfisk, fladdermus, flagga, flakbil, flakvagn, flamingo, flaska, flod, flodhäst, flotte, flugsvamp, flundra, flygödla, fontän, fotboll, framtidsbil, fugu, fyr, färja, fågel, får, fåtölj, födelsedagstårta, förstoringsglas, gaffel, gatlykta, get, geting, giraff, glas, glass, glassbägare, glasstrut, glubb, gnom, godis, godsvagn, gokart, golem, golvlampa, gosedjur, gran, grillstativ, grind, groda, grotta, grottgång, grottport, grottöppning, gryta, gräs, grävtraktor, gubbe, guldhög, guldklimp, guldklump, guldmynt, guldnyckel, guldtacka, gås, hacka, hage, halloweenpumpa, halsband, hamburgare, hammare, handborr, handduk, handfat, handske, hare, helikopter, highlandsko, hind, hink, hjort, hjälte, hjärta, honung, hund, hus, husky, hylla, hyvel, häck, häckgrind, häst, häxa, häxhatt, höghus, högtalare, höna, hönsgård, hönshus, hörnsoffa, höstgran, höstträd, igelkott, isbjörn, isglass, ispinne, jacka, jeep, jordgubbe, julbelysning, julklapp, julkrans, julstrumpa, juvel, järn, järntacka, jätte, jättebi, kaffebryggare, kaj, kaka, kaktus, kalkon, kalv, kamin, kampfisk, kanin, kanon, kanot, karp, karta, kartong, kastrull, katt, kavel, keps, ketchupflaska, kex, kirurgfisk, kista, kittel, kiwi, klippa, klippblock, klippvägg, klocka, kloss, klubba, klumpfisk, klädhängare, klänning, klöver, ko, koala, kofisk, koi, koja, kokosnöt, kolibri, kolvagn, kombi, kompass, kopp, koppar, kopparstång, korv, krabba, kratta, kristall, kronhjort, kruka, krukväxt, kryssningsfartyg, kudde, kugghjul, kulle, kvarn, kvinna, kyckling, kylskåp, kyrka, kyrkogårdsvaktmästare, känga, kärra, kål, kålrot, köksbord, köksskåp, körsbär, lada, lama, lamm, lampa, laptop, larv, lastare, lastbil, lastpall, lejon, leveransbil, livbåt, ljus, ljusslinga, ljusstake, lok, luva, luvtröja, lykta, lyktstolpe, lyxjeep, lägereld, läsk, låda, långhals, lås, macka, magiker, majs, mandarinfisk, manet, marknadsstånd, marulk, matlåda, matta, mejsel, melon, menhir, menorah, meteor, middag, mikrovågsugn, minibuss, minnessten, mistel, mixer, mjölk, mjölkko, moln, monsterduva, monstergroda, monsterhund, monsterkatt, monstertruck, mops, morot, muffin, muffins, mugg, munk, murmeldjur, murslev, mus, mussla, mynt, myntstapel, människa, månbil, mössa, nallebjörn, napoleonfisk, nattduksbord, nemo, neontetra, ninja, nisse, noshörning, nyckel, näbbdjur, näckros, nötknäppare, obelisk, odlingsrad, orch, orm, ormbunke, ost, oviraptor, oxe, pachycephalosaurus, paj, pall, palm, panda, pannkakor, papegoja, papegojfisk, papperskorg, paprika, paraply, parasaurolophus, pelikan, pendeltåg, penna, pepparkaka, pepparkaksgubbe, pepparkaksgumma, pepparkakshus, pergament, persontåg, pilbåge, pingvin, piratskepp, piraya, pizza, pizzakartong, planka, plankor, plankstaket, plankstapel, planteringslåda, plattfisk, plesiosaurie, plåthink, pokal, polisbil, polistraktor, polkagris, port, potatis, present, presentlåda, pterodactylus, pudding, pulka, pumpa, pumpalykta, purjolök, päron, påfågel, påse, racerbil, racerfarkost, radio, raket, rep, replina, repstaket, riddare, robot, roddbåt, rova, rudolf, rymdfarare, rymdfarkost, rymdskepp, rymdvarelse, rädisa, räv, rådjur, råtta, rödbeta, sallad, sandstrand, sax, segelbåt, segelskepp, segelskjul, senapsflaska, sidobord, silo, silohus, silvermynt, silvertacka, sjöborre, sjöodjur, skateboard, skatt, skattkarta, skattkista, sked, skelett, skepp, skeppsvrak, skimmel, skinka, skjul, skriftrulle, skrivbord, skrivbordsstol, skruvmejsel, skruvnyckel, skyffel, skylt, skärbräda, skål, skåp, skåpbil, sköld, sköldpadda, slickepinne, slipsten, slottstorn, släde, småvarelse, smörgås, snabbtåg, snapper, snickarbänk, snurra, snöboll, snödriva, snöflinga, snöfort, snögran, snögrotta, snögubbe, snöhög, snömänniska, snöträd, soffa, soffbord, soffbänk, solfisk, solhatt, sombrero, sopbil, sopcontainer, soppa, soptunna, sovsäck, spade, spannmålssilo, spegel, spetshacka, spik, spindel, spinosaurus, spis, sportbil, spårvagn, spöke, spökskepp, stadsjeep, staket, stalaktit, stall, staty, stearinljus, stege, stegosaurus, stek, stekpanna, sten, stenar, stenbro, stenmur, stentrappa, stenvarelse, stjärna, stock, stol, strand, stubbe, stuga, städ, ståndsten, stövlar, sushi, svamp, svampar, svampmonster, svärd, svärdfisk, säck, säl, säng, säv, såg, sågblad, taco, tall, tallrik, tandhjul, tangentbord, tankvagn, tavla, taxi, tegelsten, tender, tiger, timmerstock, timmervagn, tjur, toa, toalett, tofflor, tomat, tomte, tomteluva, tonfisk, torktumlare, torn, trafikljus, traktor, trappa, triceratops, troll, trollbok, trolldryck, trollkarl, trollkarlsgnom, trollslända, trollstav, trä, träbro, träd, trädmonster, trädstam, trälåda, träspann, trästaket, trätrappa, tröja, tukan, tunna, tunnel, tunnelbana, tupp, tv, tvättbjörn, tvättmaskin, tvättställ, tyg, tygrulle, tyrannosaurus, tält, tåg, tågvagn, tång, tårta, uggla, ugn, utomjording, vagn, valfisk, valv, vampyr, varg, varmkorv, vas, vass, vattenfall, vattenkokare, vattenkvarn, vattenmelon, vattentorn, ved, vedstapel, vedtrave, velociraptor, vete, veteranbil, vikingaskepp, vildsvin, villa, virvelvarelse, visp, vitkål, vrak, väderkvarn, vägglampa, vägvisare, växt, våffla, våningssäng, yeti, yxa, zebra, zombie, ädelsten, ägg, älg, äpple, åker, åkerrad, ånglok, åsna, örn
````
