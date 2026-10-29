# Plan: En värld, där Ängen och Gården blir en enda Sagodal

**Datum:** 2026-10-29 · **Utgår från:** `main` = `34490f7` (#249, stigar och skyltar) · **Ansvarig:** Claude (Christoffers uppdrag)
**Status för varje block:** [`docs/en-varld/STATUS.md`](en-varld/STATUS.md). Den filen uppdateras efter varje steg, så att arbetet kan tas upp igen efter en paus.

## 1. Målbilden

> Barnet möts av en visuellt slående, magisk och kreativ värld. Där skapar man med ord och hela meningar. Basen är djur med olika attribut, men barnet ska också kunna bygga en hel värld åt sina djur: hus, stall, hagar och lador. Byggnaderna ska gå att forma lika fritt som djuren. Ett stall som ser ut som ett slott ska gå, och andra tokiga saker också. Inspirationen är Slime Rancher. (Christoffer, 2026-10-29)

Slime Rancher fungerar för att **ranchen är ens egen**. Allt man fångar flyttar in i hagar som man själv byggt, i en solvarm, rund och mjuk värld som man kan bygga ut bit för bit. I Trollpennan är **meningen** verktyget. Barnet skriver *"ett rosa stall som ser ut som ett slott med tre torn av godis"*, och just det stallet växer fram på ängen med en studs. Kaninerna hoppar in där på kvällen.

**Tre löften till barnet** (allt mäts mot dem):
1. **Det jag skriver syns.** Varje byggmening ger en byggnad, och varje led i meningen syns på den: form, material, färg, delar och egenskaper.
2. **Allt bor i samma värld.** Djur, hus, hagar och stigar till Skogen, Sjön och Grottan finns i en och samma dal, utan något separat gårdsläge.
3. **Byggnaderna gör något.** Djuren flyttar in, sover där på kvällen, trivs i hagen och ger fler Solstjärnor. Det gör att barnet vill bygga mer.

**Lärandet:** Meningarna växer naturligt från *"ett hus"* till *"ett blått hus med två fönster"*, vidare till *"ett hus av is med ett tak av guld"* och sedan till *"ett stall som ser ut som en ko"*. Barnet tränar alltså substantiv, böjda adjektiv, räkneord, prepositionsfraser och bisatser, utan att det någonsin känns som en övning.

## 2. Utgångsläget (vad som redan finns)

| Del | Läge idag | Betydelse för planen |
|---|---|---|
| Byggtolk (`src/tolk/byggtolk.ts`, `data/bygg.json`) | 36 byggord, 6 delar (fönster, dörr, tak, skorsten, torn, flagga), 9 material (trä, sten, glas, is, godis, choklad, moln, kristall, guld). Grammatik med färg, antal, "av X" och sammansättningar som isslott | Bra grund. Saknar form ("som ser ut som"), egenskaper och fria kombinationer |
| Gården (`src/spel/gard/`, `data/gard-3d.json`) | Egen Canvas, ortografisk kamera, rutnät 6×10, 37 byggnadstyper med en modell var, staket och hagar, `flyttaIn` (djur flyttar in), max 15 byggen | Byggena och hagarna flyttar till Ängen. Den separata scenen tas bort |
| Ängen (`src/spel/angen3d.tsx`, `src/spel/ang/`) | Perspektivkamera i stående läge, placeringslösare (`placering.ts`) och nu stigar och skyltar till platserna | Blir den sammanslagna världen |
| Modeller | 1 249 GLB-filer (49 MB), varav 18 gårdsmodeller och 1 198 i `bulk/` | Djur- och föremålsmodellerna kan återanvändas som **former**, till exempel "ett hus som ser ut som en ko" |
| Modellkedja (`scripts/modell-inlagg.mjs`, `data/inlagg.json`) | Validerar licens, ≤6 000 trianglar, meshopt och webp 512 och skriver datarader, LICENSES och CREDITS | Används som den är för den nya modellskörden |
| Ekonomi | Byggboken: startsidan gratis, övriga sidor kostar stjärnor. Solstjärne-loop och väktardjur | Ska ses över (se beslut B) |
| Röster | 4 166 förgenererade ElevenLabs-MP3:or. `scripts/rost-generera.mjs` kräver `ELEVENLABS_API_KEY` | Nya repliker behöver röstfiler (se beslut D) |

## 3. Blocken

Varje block är en eller flera PR:er som går att slå ihop var för sig. Spelet fungerar efter varje PR. Varje steg avslutas med alla kontroller och med skärmbilder i 375×812 från live-versionen.

### Block 0: Grund och verktyg (nu)
- Planen och statusfilen läggs i repot.
- Två arbetsrutiner sparas som skills: **Modellspanaren** (hitta, licenskontrollera och lägga in CC0-modeller i bulk) och **Trollpennan-runda** (gren, kontroller, telefontest, PR, sammanslagning, Cloudflare, livekontroll och statusfil).
- Mätning av baslinjen för draw calls, trianglar och bildtakt på ängen i dag, så att den sammanslagna världen har en budget att hålla sig under. Riktmärke från W1: ≤95 draw calls och ≤120 000 trianglar.
- **Klart när:** planen, statusfilen och baslinjemätningen finns på `main` och de två skills är föreslagna.

### Block 1: En dal, där Gården flyttar in på Ängen
- Ängen växer till **Hemdalen**: själva ängen i mitten och **byggtomter** runt omkring, ungefär där Gården och stigarnas ytterkanter ligger i dag.
- **Kamera:** dagens vinkel behålls. Man kan dra med fingret för att panorera och nypa för att zooma, inom dalens kanter. Ett tryck på "hem" centrerar på ängen igen.
- Gårdens befintliga byggen ritas i ängsscenen med dagens `ByggModell` på tomterna. En sparfilsmigrering flyttar `garden[]` till världspositioner, och inget barnet byggt får försvinna.
- Skylten "Gården" och kartkortet ersätts av att gården *finns* i dalen. Ladan och väderkvarnen blir riktiga byggen.
- **Klart när:** ett sparat spel med 15 byggen öppnas och alla syns på ängen, djur och byggen krockar inte, och Garden3D används inte längre för att visa dem.

### Block 2: Byggformeln, en mening blir en byggnad
En byggnad beskrivs på samma sätt som ett djur, med en **formel i lager**:

| Lager | Exempel ur barnets mening | Vad det styr |
|---|---|---|
| **Funktion** | stall, hus, hage, lada, hönshus, fågelholk, damm, torn | Vad byggnaden *gör*: vem som bor där, hur många, ingång och storlek på marken |
| **Form** | "som ser ut som ett slott", "slottsstall", "formad som en svamp", "ett hus i ett äpple" | Hur den *ser ut*: vilken modell som är stomme |
| **Material** | av is, godishus, ett tak av guld | Ytans utseende, även på enskilda delar |
| **Färg och mönster** | rosa, randigt, prickigt, regnbågsfärgat | Färg på väggar, tak och delar |
| **Delar** | tre torn, två fönster, en flagga, en skorsten, en rutschkana | Moduler som fästs på stommen |
| **Egenskaper** | flygande, dansande, lysande, jättestort, upp och ner, glittrigt | Rörelse, ljus och storlek |

- Tolken utökas med *"som ser ut som"*, *"formad som"*, sammansättningar (*slottsstall*, *svamphus*, *tårtlada*), *"i/på X"* (*ett hus på en svamp*), egenskapsord och fler delar. Böjningar tas ur SALDO som förut.
- **En inmatning i Pennans bok** för både djur och byggen. Tolken avgör själv om meningen beskriver ett djur eller en byggnad, så barnet behöver inte byta läge.
- Felstavning ger "Menade du …?" och okända ord ger ett vänligt svar. Det blir aldrig fel.
- **Klart när:** minst 60 nya testmeningar i `data/test-fraser-bygg.json` tolkas rätt, till exempel *"ett stall som ser ut som ett slott"*, *"en lada formad som en ko"* och *"ett flygande hus av moln med två torn"*. Alla befintliga parsertester går igenom.

### Block 3: Formsystemet i 3D, vad som helst kan bli ett hus
Det här är kärnan. Den gör att *"ett stall som ser ut som ett slott"* faktiskt syns.
- **Stomme:** formens modell, som kan vara en byggnad, ett djur, ett föremål eller mat ur de 1 200 bulkmodellerna eller ur den nya skörden. Den skalas till funktionens storlek på marken.
- **Funktionen syns alltid:** dörren och ingången sätts på stommens framsida med hjälp av måtten på modellens hölje (samma teknik som fästpunkterna för kläder). Ett stall har stalldörr och hö, och ett hönshus har en liten ramp.
- **Delar som moduler:** torn, flaggor, skorstenar och fönster fästs på stommens tak och sidor via ankarpunkter som räknas ut ur höljet. Antal och färg tas ur meningen.
- **Materialskal** som fungerar på vilken modell som helst: godis (pastellränder), is (genomskinligt och kallt skimmer), guld (metallglans), moln (luddigt vitt), kristall (fasettglöd), choklad och sten. De byggs på den befintliga toon-belysningen i `belys.ts`.
- **Egenskaper:** flygande (svävar med moln under), dansande (studsar i takt), lysande (fönstren glöder på kvällen), jätte eller mini, upp och ner.
- **Byggstudsen:** byggnaden växer fram med squash-and-stretch, gnistor och ett ljud, som när ett djur skapas.
- **Klart när:** 12 referensmeningar ger var sin byggnad som en sjuåring känner igen i 375×812, med skärmbilder. Budgeten från block 0 hålls med 15 byggen och 20 djur.

### Block 4: Byggnaderna lever
- **Djuren flyttar in** (bygger vidare på `flyttaIn`). När kvällen kommer går djuren hem till sitt stall eller hus, sömnbubblor syns och fönstren lyser. På morgonen kommer de ut igen.
- **Hagar:** staket som sluter en yta blir en hage. Djur i hagen blir glada och visar humör-auran oftare.
- **Lada och förråd:** Solstjärnor som djuren ger samlas i ladan, och man trycker på den för att hämta dem (Slime Rancher har plort-silo).
- **Hönshus, fågelholk och damm** lockar till sig sina djur. Byggnader och djur förstärker varandra, som Slime Ranchers corral, coop och pond.
- Inga behov som blir sämre om man inte spelar, och inga ledsna djur (projektreglerna gäller fullt ut).
- **Klart när:** en kvällssekvens visar djur som går in, ljus i fönstren och djur som kommer ut på morgonen, och en hage med glada djur. Det ska finnas skärmbilder och test.

### Block 5: Bygga i världen
- Efter en byggmening visas byggnaden som en **genomskinlig förhandsvisning** på närmaste lediga tomt. Barnet kan dra den, vrida den med ett tryck och sedan trycka "Bygg här!". Tryckytorna är minst 44 px.
- Byggnader kan flyttas senare (håll inne), och "Lägg i lådan" ersätter att ta bort, som förut.
- Placeringslösaren (`placering.ts`) utökas så att byggen, djur, stigar och skyltar respekterar varandra.
- **Klart när:** man kan bygga, flytta och lägga undan med touch i 375×812, utan att något hamnar i dammen, på stigarna eller framför skyltarna.

### Block 6: Modellskörd, former, delar och byggnader i bulk
Samma arbetssätt som Grok använde: skript söker, laddar ner, licenskontrollerar och lägger in.
- **Önskelista (cirka 120 modeller):** byggnader (slott, torn, väderkvarn, silo, växthus, fyr, igloo, pagod, cirkustält, trädkoja, raket), sagoformer (svamphus, pumpahus, tekannehus, stövelhus, tårthus, äpplehus, skal), gårdsdelar (stalldörr, hö, tråg, ramp, staket i flera stilar, grindar), byggdelar (torn, kupoler, flaggor, skorstenar, balkonger, trappor, rutschkanor, segel) och dekor (lyktor, blomlådor, skyltar och brunnar).
- **Källor som går att nå härifrån** (testat i dag): GitHub (git clone av CC0-repon, bland annat Kenneys starter kits), Quaternius (webbsidan och Google Drive), OpenGameArt (CC0-filter) och itch.io (KayKit, CC0). **Poly Pizza och kenney.nl blockerar automatiska anrop härifrån** (Cloudflare och 403). Poly Pizza går att nå via deras API med en gratis nyckel (se beslut C).
- Allt går genom `scripts/modell-inlagg.mjs` med CC0 (CC BY bara med synlig kredit), ≤6 000 trianglar, meshopt och webp 512. LICENSES.md och CREDITS.md uppdateras.
- Ny kategori `byggform` och ankardata för dörr och tak per modell skrivs till data, utan någon kod per modell.
- **Klart när:** minst 100 nya modeller finns inlagda med licensbevis, och varje modell går att använda som form i block 3.

### Block 7: Slime Rancher-magi i hela dalen
- **Utbyggnader:** nya tomter och områden låses upp med Solstjärnor, till exempel en blomsterkulle, en strandremsa vid sjön eller en kristalläng. Det motsvarar Slime Ranchers Lab, Overgrowth och Grotto.
- Rök ur skorstenar, ljus i fönster på kvällen, vimplar som fladdrar, rörelse vid varje plats i fjärran (segel, kristallglitter och kvarnvingar) och mjuka ljud.
- Prestanda: instansiering, modeller som laddas när de behövs och detaljnivå på avstånd. Budgeten hålls på en mellanklasstelefon.
- **Klart när:** en introfilm (GIF) och åtta skärmbilder visar dalen med byggen, djur och kväll, och budgeten är uppfylld.

### Block 8: Uppdrag, Byggboken och röster
- Doktor Bengtssons uppdrag om byggande, till exempel *"Kaninerna fryser, kan du bygga ett varmt hus åt dem?"*, med stigande språknivå.
- Byggboken byggs om enligt beslut B. Varje sida ger nya ord att jaga, inte behörighet till kreativitet.
- Nya repliker får ElevenLabs-röster enligt beslut D.
- **Klart när:** det finns fem nya bygguppdrag med röst, och Byggboken är uppdaterad med test.

### Block 9: Städning och överlämning
- Garden3D, den ortografiska gårdskameran och gamla gårdsvägar tas bort. Sparmigreringen täcks av test.
- PROJECT.md, CREDITS och LICENSES uppdateras, och alla prov och kontroller går igenom.
- **Klart när:** inga döda filer finns kvar och en slutlig skärmbildsserie finns i 375×812.

## 4. Ordning och beroenden

```
Block 0 ──► Block 1 (en dal) ──► Block 5 (bygga i världen) ──► Block 4 (liv) ──► Block 7 (magi) ──► Block 9
        └─► Block 2 (byggformel) ──► Block 3 (formsystem) ──┘                 └─► Block 8 (uppdrag/röster)
        └─► Block 6 (modellskörd) — löper parallellt och matar Block 3
```

Block 1 kommer först eftersom sammanslagningen är det barnet märker direkt. Block 2 är ren logik med test och kan göras samtidigt. Block 6 är mest skript och väntetid och körs i bakgrunden mellan de andra.

**Uppskattning:** cirka 12–16 arbetspass. Varje block delas upp så att varje pass slutar med något sammanslaget och fungerande på `main`. Om dagsgränsen tar slut mitt i ett steg står det i `STATUS.md` exakt var arbetet ska fortsätta.

## 5. Beslut som Christoffer behöver ta

- **A. Kamera:** dagens fasta vinkel med panorering och zoom (rekommenderas för en sjuåring på telefon), eller en mer Slime Rancher-lik kamera som följer en figur?
- **B. Byggboken:** projektreglerna säger att byggord utanför startsidan kräver köpt sida. Rekommendation: **kreativitet låses aldrig**, så alla former, material, färger och delar är fria. Stjärnorna köper i stället **mark och utbyggnader** (som i Slime Rancher) och specialbyggnader. Det kräver en ändring i `projektregler.md`.
- **C. Poly Pizza:** vill du skapa en gratis API-nyckel på poly.pizza? Det ger tillgång till den största CC0-samlingen. Nyckeln läggs bara i skriptkörningen och aldrig i repot. Utan nyckel används övriga källor.
- **D. Röster:** nya repliker kräver ElevenLabs. Antingen ger du en nyckel för skriptkörningen, eller så samlar jag replikerna i en lista som du eller Grok genererar.

## 6. Risker

| Risk | Motåtgärd |
|---|---|
| Prestanda på telefon med många byggen och djur | Budget från block 0, instansiering, gräns för antal byggen per tomt och mätning i varje block |
| "Vad som helst som form" ger fula eller oläsbara byggnader | Funktionsdelar (dörr, hö, skylt) läggs alltid på, formerna kvalitetsgranskas i block 6 och en reservform finns |
| Sparade spel går sönder vid sammanslagningen | Migrering med test på riktiga sparfiler, och "Spara en kopia" finns redan |
| Modellkällor blockerar nedladdning | Flera källor och API-nyckel (beslut C), och Christoffer kan ladda ner ZIP-filer manuellt |
| Arbetet avbryts av dagsgränsen | Små PR:er, `STATUS.md` efter varje steg och skillen Trollpennan-runda |
