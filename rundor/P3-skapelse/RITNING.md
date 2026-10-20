# P3a – Placeringsregeln: skapelsen syns (ritning, Arkitekten 2026-10-20)

Källa: `rundor/PREMIUM/BLOCKSERIE.md` (P3) och `GRANSKNING.md`, Doodles sjöfynd, Doodles placeringsfynd 15:35
(`/workspace/trollpennan-nulage/ko-20okt/b66/`) och 16:20 (`/workspace/trollpennan-nulage/ko-20okt/r83a/`).

**Kvalitet går före kvot.**
- **Väg:** patch + kor.sh (Arkitektens patch), inte Build-prompt. Placeringen är nu EN regel med data per plats, och
  varje del kan mätas i ett prov i 375×812. En Build-prompt skulle få bygga om samma regel utan proven.
- **Kvotåtgång:** **medel**. Inga röstfiler i P3a.
- **Delning (styrning 16:46): P3 är delad.** P3a (den här rundan) innehåller placeringsregeln, landningen och kamerafokus,
  titelbilden, minsta synliga storlek, småsakernas storlek och att ankan simmar. **P3b** (kläderna på kroppen, tolkningen
  "Menade du …?", 'sportbil'/'eld', ordspärren, och de två röstfilerna) blir en egen runda efter P3a
  (`rundor/P3b-klader-tolk/PLAN.md`). Skälet är att P3b:s prov inte är grönt: 64 av 152 plagg sitter bredvid kroppen och
  "en stor eld" skapar inget. P3a ska inte vänta på det.

## Ordning
Main a22bfbc har B6.3, B6.5, B6.6, R8-3a, P1, P2-1 och P2-2. **TTS-2 måste in före P3a** (kor.sh stoppar med exit 2
annars). Patchen är gjord ovanpå main a22bfbc + TTS-2 och går rent på den. `P3_TORR=1` gör allt utom commit.

    git checkout main && git pull && git checkout -b runda-p3-kod && bash rundor/P3-skapelse/kor.sh

## 1. P3a – EN placeringsregel för alla platser (styrning 16:46)
Skymning har dykt upp i varje runda (dammen B6.3, simmarna B6.5, synliga bredden B6.6, byggnaderna 15:35, sjön 16:20).
Alla punktfixar är ersatta av en regel:
- **`data/placering.json` (ny):** `max_skymd` 0,2. Rutnätets steg (x 0,125, z 0,15). Vickningen per roll räknas in i
  rutan. `skarm_reserverat` (CSS-px i 375×812) innehåller utgångarna (övre raden), guiden, Bengtsson-figuren och nedre
  raden. Per plats finns **band per roll**: `mark`, `vatten`, `luft` (y- och z-band) och `bak` (stora saker, storlek.json
  zon "bak"). Ängen har dessutom `varld_reserverat` (grinden i staketet) och `fasta` saker: spökhuset, och dammen som
  platt sak. `standard` gäller sjön, skogen, grottan och nya platser.
- **`src/spel/placering.ts` (ny, ren, provas i Node):**
  - **Roll ur data:** simmare (och `vattenfagel` på en plats med vatten) får rollen vatten, flygare/vingar luft, stora
    saker bak, resten mark.
  - **Ordning:** den nyaste placeras först och får **den främsta lediga rutan** (främst i z, sedan närmast mitten).
    Sedan placeras de andra, från nyast till äldst.
  - **En ruta är ledig när** kroppens skärmruta (`skarm.ts`: stående kamera, synlig storlek, vickning) ligger helt i
    bild. Underlaget måste passa rollen: vatten för simmare, torr mark med kroppens kant för de andra. Rutan får inte ligga
    i en reserverad världsruta och inte gå in i en annan kropp.
  - **Skymning:** varken saken själv eller något bakom den, platsens fasta saker inräknade, får skymmas mer än
    `max_skymd` av sin ruta. Det räknas med unionen av det som täcker (`skymning.ts synligAndel`). De reserverade
    skärmrutorna står framför allt. Dammen är platt: simmare och flygare får vara över den.
  - **Full zon:** finns ingen ledig ruta markeras skapelsen `stall`. `minne.ts` låter den somna, **aldrig den nya**, och
    den kan väckas igen som förut (sovande/kallaHit). Ingen ställs någonsin över någon annan.
  - Resultatet cachas per lag (`placeraMedMinne`). `djurPlats` (delat.ts) läser bara därifrån.
- **Borttaget** (gammal kod, inte överbyggd):
  - `delat.ts`: LAND_SLOT, trängsel- och bakskala, bakLagen, radskala, platsRymms, bakRymms och fastaHinder.
  - `platsYta.ts`: placeraPaPlats, simPlatser, synligX och kroppRuta.
  - `landning.ts`: skymmerLandning och skymmerNy.
  - `damm.ts`: siktFri (siktzonen). Dammen är nu en fast sak i regeln.
  - `entiteter.ts`: BAK_ZON, bakPlatser, siktRadie och siktHojd.
  - `storlek.json`: hela `bak`-blocket (zon, fri_x, bortom, synlig_x, max_skymd, radskala, fasta) och
    `syn.min_trang`/`skarm_hinder`.
  - `byggnader.tsx` läser spökhuset ur `placering.json`.
- **Titelbilden** (`ui/Titel.tsx`): utsnittet var en fast ruta på 130 px kring ankaret och fick med grannarna. Nu är det
  det senaste djurets **ritade kropp** (`window.__tredBild`, mätt i djur.tsx) med 6 % marginal, inlagd i bilden utan att
  töjas.
- **Kapacitet** (smakval, se nedan): ängen rymmer 1–3 av 8 blandade, sjön 1–4, skogen 3–7 och grottan 3–6. När den nya är en
  av de största (elefant, slott, valfisk) blir det bara den nya, och åtta katter ger 1 (ängen, sjön) till 5 (skogen). Kameran ser marken flackt, så djur på olika djup
  täcker varandra nästan helt; i praktiken blir det en rad. På ängen och vid sjön är det markytan som tar slut, inte
  20 %-gränsen: med max_skymd 0,35 eller 0,5 blir det bara 0–1 fler där. Fler kräver ett djupare markband i
  `placering.json` (ängen: z −0,9 … 1,9) eller en brantare kamera.

## 2. Den nya skapelsen landar framme och kameran visar den
- Var den nya står avgör placeringsregeln (§ 1: den främsta lediga rutan). `landning.ts` har bara `nyast` och `sakLage`
  kvar (saken bredvid ett djur står på torr mark).
- `src/spel/ang/fokus.tsx`: kameran glider närmare (30 %), stannar 0,9 s och går tillbaka. Den är av vid
  prefers-reduced-motion och i sagan. Den är monterad i `angen3d.tsx`, inte i Spel.tsx. Värdena står i `miljo.json landning.fokus`.

## 3. Storlekar och sjön
- **Ankan svävade vid trädkanten** (Doodle r83a): `entiteter.json` `vattenfagel` (anka, gås). På en plats med vattenyta
  (inte ängen) får den rollen vatten. Med barnets vingar flyger den.
- **Narvalen var väldigt liten:** `storlek.json syn` säger att inget djur är mindre än `min_px` (44 px) i sitt minsta
  mått. Annars förstoras det, högst `max_forstoring` (1,6) gånger (`synSkala`). Placeringen räknar med samma storlek
  (`ritSkala`), och `placering.json platser.<id>.skala` (valfri, 1) är en knapp per plats.
- **Slottet är större än sjukhuset:** klasserna i `storlek.json` är orörda. Regeln krymper ingen rad längre.
- **Småsaker** (pucken 35 px mot kaffekoppen 20 px): `storlek.json` `smasak` (målhöjd 0,2–0,5) mäts med största måttet.
  Golvet `minsta` är mjukt för småsaker, och ordningen följer målhöjden. `fotavtryck.json` räknas om av kor.sh.

## Prov (`p3-prov.mjs`, 375×812, faller på main och är grönt med patchen)
| Block | Vad |
|---|---|
| C | Katten efter fem djur, elefanten efter fyra och "en gul fisk" efter tre: minst 90 % i bild, syns minst 80 %, ingen står framför den, och kameran går in och tillbaka. |
| P | **P3a:** ängen, sjön, skogen och grottan × tre fasta frön (11, 2026, 4242) och två värsta fall (de största; åtta katter), plus Doodles byggnadsäng och hans kö vid sjön. Sju sparade och den åttonde skriven i spelet. Varje vaken skapelse och platsens fasta saker syns minst 1 − (max_skymd + 0,1) av sin **ritade** ruta. Med räknas de framför, Bengtsson-figuren mätt i DOM:en, de reserverade rutorna och det som är utanför bilden (union, inte summa). Dessutom: den nya står kvar, ingen står till största delen utanför bilden, simmare är på vattnet och flygare i luften. Kapaciteten skrivs ut. |
| T | Titelbilden ("Fortsätt") med sex djur: utsnittet rymmer det senaste djuret (≥ 95 %), är högst 1,6 × kroppen, och andra djur täcker högst 25 % av det. |
| F | Slottet är minst 1,2 × sjukhusets höjd (på samma avstånd). Pucken är mindre än kaffekoppen, och alla småsaker är minst 24 px. |

Enhetstest: `p3a.test.ts` (ny) täcker 8 per plats × tre frön och två värsta fall: max_skymd med reserverade rutor och
fasta saker, underlag per roll, i bild, den nya får alltid en ruta och lika lag ger lika lägen. Dessutom: den främsta
lediga rutan, roll ur data, stallet via minne.ts (aldrig den nya, ingen står kvar utan ruta) och slottet mot sjukhuset.
`p3.test.ts` har minsta storlek, saken bredvid djuret och småsaker.

Regression i kor.sh: b63, b65, p1, p2, p2-2, r9k, b64, b61, r8-2 och **b66 (omskrivet, se Arkitektens beslut 18:59)**.

## Ändrade mergade test och prov (gamla placeringsfixar som P3a ersätter)
- `b6-3.test.ts`: "(J) stora saker sprids …" (bakPlatser) och "(D) siktzonen" (siktFri) är borttagna. Dammen är en fast
  sak i regeln och provas i p3a. Testerna om att ingen står i dammen är kvar.
- `b6-5.test.ts`: "simmare sprids" använder `djurPlats` i stället för `simPlatser`, och samma krav gäller.
- `b6-6.test.ts`: "|x| ≤ 1,6", "storlek per byggnadstyp", "byggnader längst bak …" och "tio stora djur inom synlig
  bredd" är borttagna. De ersätts av p3a (i bild, ingen skyms, slottet större än sjukhuset). Storlekstesterna är kvar.
- `r8-2b.test.ts`: placeraPaPlats-testet och en rad i ängen-testet är borttagna (funktionen finns inte längre). Land-
  och vattenkraven provas i p3a.
- `platser.test.ts` (B1.3a): "samma tak på 10" blir "högst 10 och minst 5". Den som inte får en ledig ruta somnar,
  så 14 likadana djur i skogen ger 9 vakna, inte 10.
- `b6-3.test.ts` test 24 (saken på torr mark): fotkanten räknas i den ritade storleken (`djurKrymp`), eftersom äldre
  ritas mindre.
- `b66-prov.mjs` är omskrivet (Arkitekten 18:59), se nedan. `tolk.test.ts` rörs inte i P3a.

## Följande rörs inte
Spel.tsx (växer inte), styles.css, sparnyckeln och granskad-data. bengtsson.json är orörd. entiteter.json har inget
granskad-fält, och där läggs bara `vattenfagel` till på anka och gås. Inga röstfiler.

## Smakval för Christoffer
1. **Kapacitet:** 5–8 av 8 ryms vakna på ängen och vid sjön (tabellen under 18:59), med bara jättar 3–4. Resten somnar
   och kan väckas. Fler jättar kräver att kameran ändras eller `platser.ang.skala` < 1.
2. **Perspektiv:** äldre ritas ned till 50 % i steg innan de somnar, och den äldsta somnar först.
3. **Ankan simmar** vid sjön och i ängens damm (Doodle 18:46). Valfisken får inte plats i dammen.
4. **Minsta storlek** 44 px.
5. **Titelbilden** visar bara djurets kropp med smal kant (ingen omgivning).
6. **En för stor ny skapelse** (elefant, slott, valfisk på en full plats) ritas mindre, högst ned till 60 %
   (`krymp_min`), så att den alltid får en ruta.
7. **Djuren vrider sig när de går** (upp till ~60°). Därför räknas ett djurs ruta 1,35 gånger bredare (`vrid`) och lika
   djup som bred och med hela vandringen (±0,22 i sidled, ±0,16 på djupet) i skärmrutan. Det sänker kapaciteten
   (torrkörning 18:18: korna och elefanten var större ritade än räknade, och pappa hade vandrat in över pepparkakan).
   Kroppen själv (krock) räknas utan vandringen. Står djuren still i stället för att vandra får ängen plats för fler. Alternativet är att låta dem vrida sig mindre i djur.tsx.
8. **Gamla världar:** har barnet fler på ängen än som ryms står de utanför bild tills nästa skapelse, och då somnar de
   (och kan kallas hit). Att låta dem somna redan vid start är ett eget litet steg.

## Inte gjort här
"Ordet flyger ur boken" (CSS-animation i ritningen) skjuts till P8 (ceremonin).

## Ändrat efter torrkörning 18:18 (main 84b0894 + TTS-2 staplad)

- Djurens skärmruta: lika djup som bred och med vandringen (se smakval 7).
- Prov P: golvet "≥ 2 vakna" (som jag satt själv) är nu "≥ 1": när den nya är så stor att den fyller bilden ska den
  stå ensam.
- Titelbilden klipps först när kroppen stått still två mätningar i rad (djuret växer fram och hoppar när ängen startar;
  utsnittet var 52×73 px när kaninen var 83×111).

## Arkitektens kapacitetsbeslut 18:41 (ersatt av 18:59 nedan)

Krav: minst 6 vakna av 8 på ängen och sjön i värsta fall med blandade storlekar, minst 5 med 8 katter. Kameran är fast.
Gjort i data och regel:
1. Djupare markband: ängen z −1,95 … 4,6 (förut −0,9 … 1,9: fram till staketet och grinden och ned till nedre raden), sjön egen
   rad z −5,5 … 4,6 (förut 2,3). Marken (platser.json) tar slut vid z ≈ 3,5–4 på båda platserna.
2. Gränsen per ålder: 20 % för de 3 nyaste och platsens fasta saker, 35 % för äldre. Huvudet (övre halvan av rutan;
   modellens huvud går inte att mäta i regeln) får skymmas 0 %.
3. Äldre ritas ned till 70 % innan de somnar. Den nyaste behåller full storlek (krymp_min finns bara kvar när den nya inte
   ryms i bild ens på en tom plats).
4. Vandringen är 1, 0,5 eller 0,15 av ±0,22/±0,16: fritt bete när alla ryms så, annars mindre. Skärmrutan, vridningen
   och djur.tsx använder den faktiska radien.
Dessutom: äldre tar den bakersta lediga rutan (de äldsta längst bak), och en anka på ängen simmar i dammen (Doodle 18:46,
den svävade vid trädkanten).

Vakna av 8 (räknat i regeln, `/tmp/p3kap.ts`):

| plats | fro11 | fro2026 | fro4242 | blandad | stora | 8 katter |
|---|---|---|---|---|---|---|
| ängen | 5 | 6 | 5 | 5 | 2 | 7 |
| sjön | 2 | 7 | 7 | 5 | 3 | 7 |
| skogen | 8 | 7 | 6 | 8 | 5 | 8 |
| grottan | 8 | 7 | 6 | 7 | 4 | 8 |

(blandad = elefant, hund, katt, häst, kanin, giraff, gris, ko; stora = bara jättar: elefant, giraff, slott, valfisk,
dinosaurie, häst, ko, elefant.)


## Arkitektens beslut 18:59 – genomfört

1. **Perspektiv:** äldre ritas mindre i steg om 0,1 (`krymp_steg`) ned till 50 % (`krymp_aldre_min`), efter ålder och
   trängsel: en äldre ritas aldrig större än en nyare (taket följer åldern). Huvudet skyms 0 %. Den nyaste står främst i
   full storlek. Bengtssons ruta är orörd. Underlaget (torr mark, vatten) räknas i den ritade storleken.
2. **Golv för saker (b66: ingen är osynlig):** en sak står bara där regelns ruta är minst 44 × 8 px och 900 px²
   (`synlig_golv`). Modellen ritas mindre än rutan, så det ger B6.6:s 24 px / 4 px / 200 px² på den ritade modellen. En sak
   som är för liten längst bak får en ruta längre fram, en större storlek eller stallet. En sak skyms mätt på rutans
   **nedre halva**, för en platt sak (hage, bok, sked) ligger där.
3. **Kapacitet**, vakna av 8, räknat i regeln (`/tmp/p3kap.ts`); provet P mäter det ritade:

| plats | fro11 | fro2026 | fro4242 | blandad | bara jättar | 8 katter |
|---|---|---|---|---|---|---|
| ängen | 5 | 8 | 7 | 6 | **3** | 8 |
| sjön | 5 | 8 | 8 | 6 | **4** | 8 |
| skogen | 8 | 7 | 8 | 8 | 6 | 8 |
| grottan | 8 | 7 | 8 | 8 | 4 | 8 |

   Kravet (≥ 6, och ≥ 5 för fro11 och bara jättar, 8/8 katter) nås utom **bara jättar på ängen (3) och sjön (4)**.
   Den nya jättens ruta (ca 220 × 170 px) täcker huvudena bakom. Spökhuset, grinden och dammen tar bakre raden, och
   valfisken får inte plats i ängens damm. En slumpsökning över ordningar och lägen gav som mest 4.
   **Undantag:** bara i jättefallet står en äldre framför den nyaste (ängen: dinosaurien och kon framför elefanten på
   z 1,05; sjön: dinosaurien), för den nya jätten ryms inte längre fram.
4. **Prestanda** (orsak: fyra nivåer × alla storlekar × ~2 000 rutor räknades om från början, torrKropp per ruta,
   skärmrutor som allokerade objekt, minnesnycklar som strängar). Rutorna per rad räknas en gång, underlaget och
   torrkroppen cachas per (plats, kropp, skala, roll, band), och skärmrutan räknas utan allokering (lika med den gamla
   inom 1e−13). Den täta nivån prövas först. En ny skapelse med 30: förut 1 000–1 470 ms, nu median 13–27 ms CPU
   (ängen 18, sjön 13, skogen 27, grottan 17). Det provas i `p3a.test.ts` ("prestanda … under 50 ms"). B6.3 tar
   1,9 s (main 10,8 s, grenen förut 24,5 s).
5. **b66-prov omskrivet:** tio åt gången på ängen. Ingen modell är osynlig: varje modell har en synlig mesh och minst
   24 px / 4 px / 200 px², vaken eller i stallet. De vakna (`window.__tredPos.stall` = false; djur.tsx sätter flaggan,
   Spel.tsx rörs inte) syns till minst 80 % (de tre nyaste) eller 65 % (äldre), med 0,1 mätmarginal som P3: ≥ 70 %
   resp. ≥ 55 % av den ritade rutan. Med räknas de framför, de reserverade rutorna och det som är utanför bilden. Resten
   står i stallet. BYGG: vakna byggnader står i det bakre bandet, ingen står i grindens världsruta (halva bredden ×
   krympningen), och cirkustältet skymmer inte växthuset om båda är vakna. Slottet mot sjukhuset provas i p3-prov F.
6. **Ankfallet (p3-prov K, Doodle 18:46):** ankan, ankan och en fisk, och en fisk på ängen. Simmaren simmar i dammen
   (sim, inte flyg, y ≤ 0,45, inom dammens radie) och svävar aldrig.
7. **Mätt i webbläsaren (p3a-arb, 20:00, före torrkörningen):** b66 69 → 4 fel av 1 115 (golem 63 %, stegosaurus 65 %,
   velociraptor 69 % mot 70 %; planka 16 × 20 px), BYGG grönt. p3-prov: C, K, T grönt, F slottet grönt efter att jämförelsen
   görs i full storlek. P har 13 fel: kapaciteten för bara jättar (ängen 3, sjön 4). Resten gäller regelns ruta mot den
   ritade modellen. Höga eller långa modeller (spinosaurus långt bak 43–44 %, ko, häst) och huvuden 13–23 % mot 10 %
   tillåtet. Rutan räknas ur målhöjd och fotavtryck, inte ur modellens verkliga form.

## Arkitektens uppdrag 20:40 – premissen prövad: regelns ruta mot det som ritas

**Mätt** (p3-matt.mjs, webbläsaren 375 × 812): de 13 fallen ur torrkörning 2 och två till, 6 mätningar per fall, varje
vaken skapelse. Den ritade rutan är window.__tredSyn, alltså modellens Box3 projicerad med den riktiga kameran, plus
världslådan och kameran. Regelns kropp räknades där skapelsen står. Fel = regel − ritad (px). Negativt i topp och
positivt i fot är på säkra sidan.

| | vänster | topp | höger | fot |
|---|---|---|---|---|
| förut, djur fram, sjön/skogen/grottan | −4 (−31…34) | −6 (−32…28) | −3 (−35…18) | **−18 (−59…10)** |
| förut, djur fram, ängen | +2 (−20…17) | −2 (−7…15) | −3 (−14…23) | −8 (−21…−1) |
| förut, saker, ängen | 0 | −21 (−28…−14) | 0 | +7 |
| efter, djur fram, alla platser | −3 (−13…0) | −4 (−12…0)* | +3 (−1…12) | +4 (0…12)* |
| efter, djur bak | −2 (−11…0) | −3 (−8…1) | +2 (0…9) | +3 (0…9) |
| efter, saker | 0 (0…1) | 0 | 0 (−1…1) | 0 (0…2) |

(*) Enstaka +25/+31 px är ett hopp (0,45 upp, en kort stund).

**Orsaker:**
1. **Fel kamera utanför ängen.** På sjön, i skogen och i grottan håller OrbitControls kameran högst 9,5 från målet
   (PlatsDekor maxDistance). Den står alltså i (0, 3,876, 8,92), medan regeln räknade med ängens (0, 4,15, 9,8). Allt
   ritas ca 10 % större än regeln trodde. Projektionsfelet ensamt var upp till 41 px i fot på sjön och 0 på ängen.
2. **Data-mått i stället för modellens.** Höjden var målhöjden, och djupet var 0,6 × halva fotavtrycket. Ritat är
   djupet 167 % av regelns (median, upp till 190 %; spinosaurus är 2,4 lång mot kameran). Därför sträcker sig foten
   närmare kameran och längre ned i bild: −18 px median, −59 px värst. Höjden är 70–118 % av målhöjden (median 91 %).
   Saker som en hage eller kniv är 13–30 % av sin målhöjd.
3. **Vridningen** gissades med en faktor (vrid 1,35) i stället för att räknas på modellens bredd och längd.
   Ankarpunkten stämmer (mitten ±3 cm, botten ±8 cm), och krympningen och skalan är lika i regel och rendering.

**Lagat vid källan:**
- `modellmatt.mjs` mäter alla modeller i bulk: samma GLTFLoader-Box3 och samma `skalaFor` som gltfDjur, med
  framAxel-vridningen. Procedurkropparna (byggPack) mäts också, med botten. Det blir `data/modellmatt.json` (1 158
  entiteter), och kor.sh räknar om den på main.
- `kroppMatt` räknar lådan ur de måtten och den vridning djur.tsx faktiskt ger: 0,35·π·vandring för den som går,
  ±0,14 och rull 0,28 för en flygare, 0,35 för en svävare, och 0 för en sak. Guppet räknas med (±0,04, ±0,08 eller
  ±0,16).
- `skarm.ts` har kameran som parameter. `KAMERA_PLATS` räknas ur `PLATS_MAX_AVSTAND`, som PlatsDekor nu själv
  använder (maxDistance). `kameraFor(plats)` används i hela regeln.
- Punktfixarna från 19:48 är borta: sakens nedre halva och `hojd_marginal`. `synlig_golv` är nu B6.6:s egna 24 px /
  4 px / 200 px², eftersom rutan är modellens.
- Test: `p3a-matt.test.ts`. Projektionen i skarm.ts är lika med three-kamerans (≤ 0,5 px) på ängen och de andra
  platserna. Regelns ruta är lika med den ritade modellens Box3 genom kameran (≤ 3 px per kant) för 12 modeller
  (katt, ko, spinosaurus, människa, fjällräv, monsterkatt, häst, hage, kniv, slott, valfisk, pepparkaka) på fyra
  djup och tre platser.

**Kapacitet med de riktiga rutorna** (vakna av 8, räknat i regeln; gränserna 20/35/0 % i regeln, 30/45/10 % i provet):

| plats | fro11 | fro2026 | fro4242 | blandad | bara jättar | 8 katter |
|---|---|---|---|---|---|---|
| ängen | **4** | 8 | 6 | 6 | **2** | **7** |
| sjön | **4** | 7 | 8 | **4** | **3** | 8 |
| skogen | 8 | 7 | 8 | 8 | 5 | 8 |
| grottan | 8 | 7 | 8 | 7 | 2 | 8 |

De gamla siffrorna (5–8) byggde på rutor som var för små. **Kravet nås inte.** Minsta beslut som når det
(räknat, `/tmp/p3kap.ts`):
- **(a)** Regeln använder provets gränser, 30 % / 45 % / huvud 10 %, i stället för 20 / 35 / 0. Marginalen 0,1 behövdes
  bara för att rutorna var fel; nu är de på säkra sidan med 2–5 px.
- **(b)** Äldre får ritas ned till 40 % (`krymp_aldre_min`).
- **(c)** Sjön, skogen och grottan använder ängens kameraavstånd (PlatsDekor maxDistance 9,5 → 10,5). Platserna ser
  ca 10 % mindre ut.

Med (a)+(b)+(c): ängen 6 8 7 7 5 8 och sjön 5 8 8 7 3 8. Allt nås utom bara jättar vid sjön (3). Med bara (a)+(b):
ängen 6 8 7 7 5 8 och sjön 3 8 8 5 2 7. Med bara (c): sjön 6 8 8 6 3 7, men ängen är oförändrad (4 … 7).

### Torrkörning 3 (main ee801d8, 21:08, exit 4) och vad som lagades efter

- **Synligheten stämmer nu.** 0 av 13 synlighets- och huvudfel från torrkörning 2 är kvar. Kapaciteten i webbläsaren är
  exakt regelns tal (ängen 4 / 2 / 7, sjön 4 / 4 / 3), så förutsägelsen håller.
- **C elefanten:** den nya elefanten fick 80 % på z 1,04, och katten (äldre) stod framför den. Orsaken var att regeln
  tog den största storleken som rymdes någonstans, inte den främsta rutan. Lagat: ryms den nya inte i full storlek väljs
  den storlek (0,9 … krymp_min) som ger **den främsta** rutan. Elefanten står nu på z 3,6 med 60 %, och alla fem är
  vakna (räknat i regeln).
- **P Bengtsson-rutan:** figuren hoppar (.npc-figur.nytt, translateY upp till −8 px). Provet mätte den hoppande
  figuren: underkanten 731,4 mot datans 738, 6,6 px. Lagat i provet: layoutrutan mäts utan transform (det är den datan
  beskriver), och för skymningen räknas hoppet med (8 px uppåt).
- Kvar: kapaciteten (se 20:40, minsta beslut). b66 och den andra regressionen kördes inte, för kor.sh stannar vid
  p3-prov.

Kapacitet efter lagningen av C (räknat i regeln):

| plats | fro11 | fro2026 | fro4242 | blandad | bara jättar | 8 katter |
|---|---|---|---|---|---|---|
| ängen | 4 | 8 | 6 | 6 | 4 | 7 |
| sjön | 4 | 7 | 8 | 4 | 3 | 8 |
| skogen | 8 | 7 | 8 | 8 | 5 | 8 |
| grottan | 8 | 7 | 8 | 7 | 2 | 8 |

### Arkitektens beslut 21:40 – genomfört

- **(a)** Regeln använder provets gränser: de tre nyaste och platsens fasta saker skyms högst 30 %, äldre högst 45 %,
  huvudet (övre halvan) högst 10 % (`placering.json` max_skymd 0,3 / max_skymd_aldre 0,45 / huvud_skymd 0,1). Provet
  (p3-prov P, b66) har gränserna fast (70 % / 55 % / 10 %) och ingen mätmarginal längre – regelns ruta är modellens
  (p3a-matt.test.ts, 3 px).
- **(b)** Äldre ritas ned till 40 % (`krymp_aldre_min` 0,4), i steg efter ålder och trängsel. En äldre ritas aldrig
  större än en nyare.
- **(c)** Alla platser har ängens kameraavstånd via en konstant: `PLATS_MAX_AVSTAND` = 10,5 i skarm.ts. PlatsDekor
  (`maxDistance`) och regelns kamera (`KAMERA_PLATS`, nu = `KAMERA_ANG`) läser samma tal.
- **Kravnivå:** fro11 och bara jättar minst 3 vakna av 8, 8 katter 8 av 8, övriga minst 6 (p3-prov `KRAV`).
- **Följd av (a) – lagat vid orsaken:** med de lösare gränserna fick äldre djur rader bakom en stor sak (flickan på
  z −1,95 bakom slottet på −1,80). Det bröt B6.1 (E), "stora saker står bakom alla djur". Orsaken är att mark- och
  bak-banden överlappar (ängen: mark −1,95…4,6, bak −3,3…−1,15). Regeln håller nu isär dem: en markrad ligger minst
  `bak_lucka` 0,5 framför varje vaken stor sak, och omvänt. Rader som bryter det är aldrig lediga, men stallet får
  leta i dem. B6.1-testet är oförändrat och grönt.

Kapacitet (vakna av 8, räknat i regeln med de sanna rutorna, C-lagningen och bak_lucka; ett * betyder att den nya
ritas mindre):

| plats | fro11 (≥3) | fro2026 (≥6) | fro4242 (≥6) | blandad (≥6) | bara jättar (≥3) | 8 katter (8) |
|---|---|---|---|---|---|---|
| ängen | 6 | 8 | 7 | 7 | 6* | 8 |
| sjön | 5 | 8 | 8 | 7 | 3 | 8 |
| skogen | 8 | 7 | 8 | 8 | 6 | 8 |
| grottan | 8 | 7 | 8 | 8 | 4 | 8 |

Kravet gäller ängen och sjön, och alla fall når det.

**Doodles punkter i proven:**

| punkt | täcks av |
|---|---|
| bläckfisken står i kanten vid sjön | P: varje vaken syns ≥ 70/55 % med det som är utanför bild räknat som skymt, plus "inte mest utanför". Nytt fall sjön/doodle-sal har två bläckfiskar. |
| sälen bakom ankan | Nytt fall sjön/doodle-sal (kanin, bläckfisk, säl, katt, hund, narval, anka, bläckfisk). Varje vaken syns ≥ sin gräns och huvudet är fritt. |
| pucken större än kaffekoppen | F: storleksordningen jämförs i full storlek (puck 19×12 px mot kaffekopp 22×22 px på samma djup). |
| narvalen liten | P: nytt krav att varje vaket djur i full storlek är minst syn.min_px (44) − 4 px i sitt minsta mått. Narvalen i full storlek är 72–112 px. En äldre narval som krympts till 40 % ritas ca 30 px, och det är beslut (b). |
| växthuset och glaslådan skymmer slottet | Nytt fall ängen/doodle-slott: slottet äldre, växthuset och akvariet (antaget vara "glaslådan") nyare. Slottet får inte skymmas mer än 45 %. Ryms det inte, somnar det (i regeln: slottet sover, 7 av 8 vakna). |

Doodle-fallen räknas inte mot kapacitetskravet.

### Torrkörning 4 (main 8f52375, 22:09, STOPP 4 i p3-prov) och vad som lagades efter

13 fel i P och två orsaker. Ingen gräns är ändrad.

1. **Skymningen räknades på fel yta.** Regeln delade den skymda ytan med rutan som kroppen *rör sig inom*: vandring
   ±0,22/±0,16, vridningen och guppet. Provet mäter kroppen själv i ett ögonblick. Rutan är upp till 60 % bredare
   än kroppen (katten: 0,59 mot 0,37 halv bredd vid fritt bete), så andelen blev för liten. Sjön blandad: hunden syns
   44 % (regeln trodde ≥ 55 %). Sjön 8 katter: en katt 47 %, huvudet 28 %. Ängen fro11: monstergrodan 67 %.
   Lagat i `placering.ts`: kroppMatt ger också kroppens egna mått (kärnan: smalaste vridningen, utan vandring och
   gupp). Skymningen räknas på kärnan i **värsta läget** (`varst`), alltså när den och den framför har vandrat så nära
   varandra det går. p3a.test mäter kropparna i vila (`Lage.kropp`).
2. **Minsta synliga storleken räknades på fotavtrycket.** Fotavtrycket är den största halva utbredningen: fjällräven
   0,62 mot sin halva bredd 0,165. Fjällräven blev därför 30–36 px bred och hästen 37 px. Lagat: `synSkala` använder
   modellens egna mått (`modellmatt.json`), samma som regeln. Provet tillåter mindre bara när djuret redan förstorats
   max_forstoring (`__tredPos.syn`). p3.test mäter med samma mått.

Med lagning 1 räckte sjön inte till kravnivån: blandad 5, bara jättar 2, 8 katter 7. Där stod kropparna redan nästan
stilla (vandring 0,15), men vridningen gjorde dem 22 % bredare. **Genomfört, Arkitektens beslut:** en sista nivå 0 i
`vandra.steg` (`[1, 0.5, 0.15, 0]`). När det är som trångast står djuren still och vrider sig inte. Gränserna är
oförändrade. Utan nivån når sjön inte kravet. Ta bort 0 om det inte godtas, och då gäller tabellen ovan.

Kapacitet nu (vakna av 8, regeln med kärnan i värsta läget, C-lagningen, bak_lucka och nivå 0):

| plats | fro11 (≥3) | fro2026 (≥6) | fro4242 (≥6) | blandad (≥6) | bara jättar (≥3) | 8 katter (8) |
|---|---|---|---|---|---|---|
| ängen | 7 | 8 | 7 | 7 | 4 | 8 |
| sjön | 6 | 8 | 8 | 7 | 3 | 8 |
| skogen | 8 | 7 | 8 | 8 | 6 | 8 |
| grottan | 8 | 7 | 8 | 8 | 6 | 8 |
