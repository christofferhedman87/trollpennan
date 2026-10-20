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

Regression i kor.sh: b63, b65, p1, p2, p2-2, r9k, b64, b61 och r8-2. **b66 körs inte längre**: det lägger tio modeller åt
gången på ängen och kräver att alla står i bild, vilket regeln inte tillåter (3–6 ryms, resten somnar). Filen är orörd.

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
- Inga mergade prov ändras (b66-prov körs inte, se ovan). `tolk.test.ts` och `b66-prov.mjs` rörs inte i P3a.

## Följande rörs inte
Spel.tsx (växer inte), styles.css, sparnyckeln och granskad-data. bengtsson.json är orörd. entiteter.json har inget
granskad-fält, och där läggs bara `vattenfagel` till på anka och gås. Inga röstfiler.

## Smakval för Christoffer
1. **Kapacitet:** på ängen och vid sjön ryms 1–4 åt gången, resten somnar (kan väckas). Ska det bli fler måste markbandet
   eller kameran ändras; att höja max_skymd hjälper knappt där. Alternativt `platser.ang.skala` < 1 (mindre djur).
2. **Den äldsta somnar** när zonen är full, i stället för att krympa alla (den gamla trängselskalan är borttagen).
3. **Ankan simmar** vid sjön men flyger på ängen (dammen är för liten för den).
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

## Arkitektens kapacitetsbeslut 18:41 – STATUS: kravet nås inte (stoppat, se rapporten)

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

