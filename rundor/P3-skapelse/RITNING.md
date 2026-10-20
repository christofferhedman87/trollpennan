# P3 – Skapelsen syns rätt (ritning, Arkitekten 2026-10-20)

Källa: `rundor/PREMIUM/BLOCKSERIE.md` (P3) och `GRANSKNING.md`, Doodles sjöfynd, Doodles placeringsfynd 15:35
(`/workspace/trollpennan-nulage/ko-20okt/b66/`) och 16:20 (`/workspace/trollpennan-nulage/ko-20okt/r83a/`).

**Kvalitet går före kvot.**
- **Väg:** patch + kor.sh (Arkitektens patch), inte Build-prompt. Placeringen är nu EN regel med data per plats, och
  varje del kan mätas i ett prov i 375×812. En Build-prompt skulle få bygga om samma regel utan proven.
- **Kvotåtgång:** **medel** (röststeget **liten**: 2 filer, 23 tecken).
- **Delning (styrning 16:46):** P3a (placeringsregeln) och P3b (kläder, tolkning, ordmatchning) ligger i **samma patch**.
  De rör samma filer (`djur.tsx`, `delat.ts`, `minne.ts`, `entiteter.ts`, `storlek.json`). En delning skulle ge två
  patchar som måste köras i ordning och en mellanversion som ingen provat. P3a är **byggd först** och ersätter de gamla
  fixarna. Den gamla placeringskoden är borttagen, inte överbyggd.

## Ordning
Main 16b6125 har B6.3, B6.5, B6.6, R8-3a, P1, P2-1 och P2-2 (#177). **TTS-2 måste in före P3** (kor.sh stoppar med exit 2
annars). Patchen är gjord ovanpå main 16b6125 + TTS-2 och går rent på den.
Röst: `kor.sh` gör två röstfiler ('en sportbil', 'en grottport', 23 tecken) med `scripts/rost-generera.mjs` och
`ELEVENLABS_API_KEY` ur miljön (nyckeln skrivs aldrig ut). De orden spärrades förut och hade därför ingen fil.
`P3_TORR_ROST=1` räknar bara.

    git checkout main && git pull && git checkout -b runda-p3-kod && bash rundor/P3-skapelse/kor.sh

## 0. P3a – EN placeringsregel för alla platser (styrning 16:46)
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
- **Kapacitet** (smakval, se nedan): med regeln och 20 % ryms ungefär 3–6 djur av normal storlek på ängen. Ängen är grund
  (husen bakom), dammen ska synas och Bengtsson står nere till vänster. Vid sjön, i skogen och i grottan ryms 5–8.
  De största (elefant, giraff, slott) tar en stor del av bilden. Provet skriver ut kapaciteten per plats och lag
  (`p3-kapacitet.json`).

## 1. Kläderna sitter på djuret (alla 38)
- **`data/plagg.json` (ny)**: `delar` (huvud, hals, kropp, höft, fötter, hand: höjdband som andel av kroppen, fyllnad,
  största höjd) och en rad per kläd-entitet (`del`, ev. `fyll`, `par`). Nya plagg = en rad data.
  - Avvikelse från ritningens "rader i tillbehor.json": den filen är formatet för procedurdelar med egen validering.
    Plaggen är GLB-modeller och behöver något annat (kroppsdel och passform), därför en egen fil. `kontrolleraPlagg`
    kräver en rad för varje entitet med typ `tillbehor`.
- **`src/spel/plagg/data.ts`** (ren): `kroppsdelar` härleder ankaret ur modellens **mätta form** (punkter i höjdband:
  median och 10–90 % bredd, topp, framkant, hand = yttersta x). Saknas data (`modeller`) gäller bboxen. `plaggLage` ger
  skala och läge per del.
- **`src/spel/plagg/Plagg.tsx`**: `PlaggPaKropp` mäter kroppen (även skinnade meshar), sätter plaggen och låter
  huvudplagg följa huvudbenet. `djur.tsx` ritar inte längre kläder som sak bredvid djuret (`arPlagg`), och de andra
  sakerna står på torr mark (`sakLage` + `torrKropp`). **Mössan i Bengtssons första uppdrag hamnar på huvudet, aldrig i
  dammen.**

## 2. Den nya skapelsen landar framme och kameran visar den
- Var den nya står avgör placeringsregeln (§ 0: den främsta lediga rutan). `landning.ts` har bara `nyast` och `sakLage`
  kvar (saken bredvid ett djur står på torr mark).
- `src/spel/ang/fokus.tsx`: kameran glider närmare (30 %), stannar 0,9 s och går tillbaka. Den är av vid
  prefers-reduced-motion och i sagan. Den är monterad i `angen3d.tsx`, inte i Spel.tsx. Värdena står i `miljo.json landning.fokus`.

## 3. Tolkningen ändrar aldrig barnets ord i tysthet
- Felet: `delaOrd` delade ett okänt förled plus ett känt djur i tysthet ("storm" → orm, "prinsessdrake" → ess,
  "skrattkatt" → katt). "en dansande banan" → "ande" var redan rättat av B6.5 (particip) och provas här.
- Rättning (`tolka.ts`, `reserv.ts`, `typer.ts`): har ordet okända delar blir svaret ett **förslag** ("Menade du katt?").
  Barnet trycker och ser vad som händer. `efterled: true` gör att reserven inte byter förslaget.
- **Låsta tolktest ändrade** (`tolk.test.ts`): "blixtkatt sparar förleden" och "monsterkanin" blir att de frågar
  "Menade du katt?" respektive "Menade du kanin?". Skälet är att det gamla beteendet just är felet P3 rättar. En genomgång
  av 445 datafraser visar att bara "blixtkatt" ändras (test-fraser-reserv.json, märkt "oforandrat"), och den går fortfarande igenom.
- **'sportbil' blev biff, 'eld' ubåt** (Doodle r83a). Två allmänna fel:
  - *Delordsmatchning mot korta stammar* (`sparr.ts`): spärrlistans stammar normaliseras med ihopslagna dubbelbokstäver,
    så en stam på fyra bokstäver kunde bli tre ("…rr" → "…r") och hittas inne i vanliga ord ("en sportbil", "port",
    "grottport" spärrades; barnet fick spärrbanderollen). Nu jämförs en stam som krymper under fyra bokstäver med
    dubbelbokstaven kvar. Inget ord som har en modell spärras längre (test över alla entitetsord); spärrorden spärras som förut.
  - *Fristående dubbelord* (`tolka.ts`, B6.2): "eld" och "regnbåge" blir saken bara när de står fristående. Med ett
    beskrivande ord före ("en gul eld", "en stor eld") räknades de som förmåga/mönster och svaret blev "Pennan behöver ett
    djur" med kort att välja. Nu får färg-, storleks- och egenskapsord stå före.
- `data/test-fraser.json` `p3_tolkning`: 22 fraser (nytt: sportbil, port, grottport, eld, gul/stor eld, gul regnbåge,
  drake med eld, och ett spärrord som ska spärras). Provet skriver "en röd sportbil", "en gul eld" och "en stor eld" i spelet.

## 4. Storlekar och sjön
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
| A | Alla 38 plagg × kanin, häst, giraff och krokodil (152 fall). Plaggets världsruta (`__tredPlagg`) sitter på kroppen på rätt höjd för sin del. |
| B | "en kanin med mössa" skrivet i spelet: mössan sitter på huvudet och inte i dammen. |
| C | Katten efter fem djur, elefanten efter fyra och "en gul fisk" efter tre: syns minst 80 %, ingen står framför den, och kameran går in och tillbaka. |
| D | "en dansande banan" blir aldrig "ande". "en blixtkatt" frågar "Menade du katt?". "en röd sportbil" blir en sportbil, "en gul eld" och "en stor eld" en eld. |
| P | **P3a:** ängen, sjön, skogen och grottan × tre fasta frön (11, 2026, 4242) och två värsta fall (de största; åtta katter), plus Doodles byggnadsäng och hans kö vid sjön. Sju sparade och den åttonde skriven i spelet. Varje vaken skapelse och platsens fasta saker syns minst 1 − (max_skymd + 0,1) av sin **ritade** ruta. Med räknas de framför, Bengtsson-figuren mätt i DOM:en och de reserverade rutorna (union, inte summa). Dessutom: den nya står kvar, allt ryms i bild, simmare är på vattnet och flygare i luften. Kapaciteten skrivs ut. |
| T | Titelbilden ("Fortsätt") med sex djur: utsnittet rymmer det senaste djuret (≥ 95 %), är högst 1,6 × kroppen, och andra djur täcker högst 25 % av det. |
| F | Slottet är minst 1,2 × sjukhusets höjd (på samma avstånd). Pucken är mindre än kaffekoppen, och alla småsaker är minst 24 px. |

Enhetstest: `p3a.test.ts` (ny) täcker 8 per plats × tre frön och två värsta fall: max_skymd med reserverade rutor och
fasta saker, underlag per roll, i bild, den nya får alltid en ruta och lika lag ger lika lägen. Dessutom: den främsta
lediga rutan, roll ur data, stallet via minne.ts (aldrig den nya, ingen står kvar utan ruta) och slottet mot sjukhuset.
`p3.test.ts` har kläder, tolkning, minsta storlek och småsaker.

Regression i kor.sh: b63, b65, b66, p1, p2, p2-2, r9k, b64, b61 och r8-2.

## Ändrade mergade test och prov (gamla placeringsfixar som P3a ersätter)
- `b6-3.test.ts`: "(J) stora saker sprids …" (bakPlatser) och "(D) siktzonen" (siktFri) är borttagna. Dammen är en fast
  sak i regeln och provas i p3a. Testerna om att ingen står i dammen är kvar.
- `b6-5.test.ts`: "simmare sprids" använder `djurPlats` i stället för `simPlatser`, och samma krav gäller.
- `b6-6.test.ts`: "|x| ≤ 1,6", "storlek per byggnadstyp", "byggnader längst bak …" och "tio stora djur inom synlig
  bredd" är borttagna. De ersätts av p3a (i bild, ingen skyms, slottet större än sjukhuset). Storlekstesterna är kvar.
- `r8-2b.test.ts`: placeraPaPlats-testet och en rad i ängen-testet är borttagna (funktionen finns inte längre). Land-
  och vattenkraven provas i p3a.
- `tolk.test.ts` (från förut): "blixtkatt" och "monsterkanin" frågar nu, se § 3.
- `rundor/B6.6-fix/b66-prov.mjs` (från förut): två rader, grindens ritade bredd.

## Följande rörs inte
Spel.tsx (växer inte), styles.css, sparnyckeln och granskad-data. bengtsson.json är orörd. entiteter.json har inget
granskad-fält, och där läggs bara `vattenfagel` till på anka och gås. Rösterna: bara två nya filer (se Ordning).

## Smakval för Christoffer
1. **Kapacitet mot 20 %:** på ängen ryms 3–6 vanliga djur på en gång, resten somnar (kan väckas). Vill han ha fler kan
   han välja ett av två: `max_skymd` 0,3, eller `platser.ang.skala` < 1 (mindre djur på ängen).
2. **Den äldsta somnar** när zonen är full, i stället för att krympa alla (den gamla trängselskalan är borttagen).
3. **Ankan simmar** vid sjön men flyger på ängen (dammen är för liten för den).
4. **Minsta storlek** 44 px.
5. **Titelbilden** visar bara djurets kropp med smal kant (ingen omgivning).

## Inte gjort här
"Ordet flyger ur boken" (CSS-animation i ritningen) skjuts till P8 (ceremonin).
