# P3 – Skapelsen syns rätt (ritning, Arkitekten 2026-10-20)

Källa: `rundor/PREMIUM/BLOCKSERIE.md` (P3) och `GRANSKNING.md`, Doodles sjöfynd, Doodles placeringsfynd 15:35
(`/workspace/trollpennan-nulage/ko-20okt/b66/`) och 16:20 (`/workspace/trollpennan-nulage/ko-20okt/r83a/`).

**Kvalitet går före kvot.**
- **Väg:** patch + kor.sh (Arkitektens patch), inte Build-prompt. Allt är data plus några få allmänna regler (kroppsdel per
  plagg, landning, skymning per skärmruta, småsakernas golv), och varje regel kan mätas i ett prov i 375×812.
- **Kvotåtgång:** **medel**.

## Ordning
Main har B6.3, B6.5, B6.6 (#172, #174), R8-3a (#175), P1 och P2-1 (main 27e175d). Kön före P3: **TTS-2 → P2-2 → P3**.
`kor.sh` stoppar (exit 2) om någon saknas. Patchen är gjord ovanpå main 27e175d + TTS-2 + P2-2 och går rent på den.
Röst: `kor.sh` gör två röstfiler ('en sportbil', 'en grottport', 23 tecken, kvot **liten**) med `scripts/rost-generera.mjs`
och `ELEVENLABS_API_KEY` ur miljön (nyckeln skrivs aldrig ut). De orden spärrades förut och hade därför ingen fil.

    git checkout main && git pull && git checkout -b runda-p3-kod && bash rundor/P3-skapelse/kor.sh

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
- `data/miljo.json` `landning` (x −0,6, z 1,25; fri zon; `fokus` in/stanna/ut). Den ligger till vänster om mitten,
  eftersom B6.3:s siktzon mot dammen går genom mitten framtill.
- `src/spel/landning.ts` + `delat.ts`: den nyaste (störst `skapad`) väljer plats först: torr mark, fri sikt och hel i
  bild (`synligHalv`). De andra får inte stå framför den (`skymmerNy`).
- `src/spel/ang/fokus.tsx`: kameran glider närmare (30 %), stannar 0,9 s och går tillbaka. Den är av vid
  prefers-reduced-motion och i sagan. Den är monterad i `angen3d.tsx`, inte i Spel.tsx.

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

## 4. Allt syns: sjön, byggnader, stora saker och småsaker
- **Sjön** (Doodle): `simPlatser` håller varje simmare inom den synliga bredden för sitt djup (B6.6 `synligHalv`). Flygarna
  (ankan) täcker högst 15 % av en simmare (skärmrutor, `skarm.ts`). Bläckfisken hamnar inte längre utanför vänsterkanten.
- **Byggnader och stora saker** (Doodle 15:35: växthuset skymde slottets nederdel, glaslådan slottets högra del, cirkustältet
  sjukhusets nederkant, och slottet såg knappt högre ut än sjukhuset). Detta är **en regel utan specialfall**:
  - `src/spel/skymning.ts` (ny, ren) räknar varje saks skärmruta med den stående kameran. Den synliga andelen är
    1 − summan av vad de framför täcker.
  - `bakLagen` (delat.ts) väljer bara lägen där ingen sak skyms mer än `storlek.json bak.max_skymd` (0,15). Raden framför
    staketet räknar in byggnaderna bakom. Det som inte får plats framför går bakom staketet, högst tre varv.
  - Packningen är bästa passning: den högsta står längst ut, de andra i den lucka där de lämnar minst över.
  - **Radens skala:** ryms raden inte i bild (synlig bredd minus grinden) krymper hela raden med samma faktor, i steg om
    0,05, aldrig under `min_radskala` (0,45). Slottet förblir då lika mycket större än sjukhuset. Skalan ritas
    (`bakSkala` i djur.tsx) och syns i `__tredPos[uid].k`.
  - **Glaslådan är spökhuset** (fast dekor på (2,15, −1,7)). Det ligger nu som data (`storlek.json bak.fasta`, läge och mått)
    och räknas som ett hinder i samma regel. `byggnader.tsx` läser läget därifrån.
  - **Ängen full av stora saker:** ryms de inte så att alla syns (`bakRymms`) somnar den äldsta stora saken, aldrig den nya
    och aldrig ett djur (`minne.ts`, som taket TAK_PER_PLATS).
  - B6.6:s test och prov mäter grinden med den **ritade** bredden. Detta är en ändring i `b6-6.test.ts` och
    `rundor/B6.6-fix/b66-prov.mjs` (två rader).
- **Sjön och platserna** (Doodle r83a):
  - *Ankan svävade vid trädkanten.* `entiteter.json` `vattenfagel` (anka, gås): på en plats med vattenyta (inte ängen)
    simmar den i vattnet, som de andra simmarna. Med barnets vingar flyger den.
  - *Landdjuren trängdes på sanden* (jultomten framför röda katten). Samma regel som för byggnaderna: varje djur syns till
    minst 1 − `max_skymd`. Det räknas med kroppens skärmruta (`kroppRuta`) och med guiden (Bengtsson-figuren,
    `storlek.json syn.skarm_hinder`) som står framför allt. På samma djup räknas det bara om kropparna går in i varandra.
    Räcker inte platsen närmast de önskade platserna packas bilden uppifrån (de största först). Räcker inte det heller
    krymper alla djur på platsen lika mycket i steg om 0,1 ned till `syn.min_trang` (0,5). Ryms de ändå inte somnar den
    äldsta (aldrig den nya), som när ängen är full.
  - *Narvalen var väldigt liten.* `storlek.json syn`: inget djur är mindre än `min_px` (44 px) i sitt minsta mått på
    skärmen. Annars förstoras det, högst `max_forstoring` (1,6) gånger (`synSkala`, ritas i djur.tsx).
  - Ängen behåller sina platser (`LAND_SLOT`). Packningen uppifrån skulle ställa djuren bakom husen där.
- **Småsaker** (pucken 35 px mot kaffekoppen 20 px): `storlek.json` `smasak` (målhöjd 0,2–0,5) mäts med största måttet.
  Golvet `minsta` är mjukt för småsaker (storlek × (1 − lutning) + lutning × eget mått) och ytan räknas som kameran ser
  den. Ordningen följer då målhöjden: pucken (0,3) blir mindre än kaffekoppen (0,4). `fotavtryck.json` räknas om av kor.sh.

## Prov (`p3-prov.mjs`, 375×812, faller på main och är grönt med patchen)
| Block | Vad |
|---|---|
| A | Alla 38 plagg × kanin, häst, giraff och krokodil (fyra former, 152 fall). Plaggets världsruta (`__tredPlagg`) sitter på kroppen på rätt höjd för sin del. |
| B | "en kanin med mössa" skrivet i spelet: mössan sitter på huvudet och inte i dammen. |
| C | Katten efter fem djur, elefanten efter fyra och "en gul fisk" efter tre: syns minst 80 %, ingen står framför den, och kameran går in och tillbaka. |
| D | "en dansande banan" blir aldrig "ande". "en blixtkatt" frågar "Menade du katt?" och skapar inget förrän barnet trycker. "en röd sportbil" blir en sportbil, "en gul eld" och "en stor eld" en eld. |
| E | Sjön: bläckfisk, säl och anka, och sju vid sjön. Bläckfisken ryms i bild och sälen syns minst 80 %. Doodles kö (nio skapelser, r83a) skriven i spelet: ankorna simmar (`__tredPos.sim`, y på vattnet), var och en syns minst 75 % med guiden inräknad, och inget djur är mindre än 0,9 × `min_px` (narvalen). |
| F | Doodles äng (slott, sjukhus, cirkus, växthus) åt båda hållen, och fordon/möbler: varje sak syns minst 75 % (max_skymd + 0,1). Slottet är minst 1,2 × sjukhusets höjd och överkanten minst 15 px högre. Pucken är mindre än kaffekoppen. |

Regression i kor.sh: b63, b65, b66, p1, p2, p2-2, r9k, b64, b61 och r8-2.

## Följande rörs inte
Spel.tsx (växer inte), styles.css, sparnyckeln och granskad-data (bengtsson.json är orörd; entiteter.json har inget
granskad-fält – där läggs bara `vattenfagel` till på anka och gås). Rösterna: bara två nya filer (se Ordning).

## Inte gjort här
"Ordet flyger ur boken" (CSS-animation i ritningen) skjuts till P8 (ceremonin).
