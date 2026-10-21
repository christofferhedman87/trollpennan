# P3a-fix – ritning (teknikern, 21 okt)

Underlag: Doodles körning av P3a (kor.sh EXIT=0, runda-p3a-kod 7f89b63, inte mergad) och fynden 1–7, Arkitektens
beslut A–E. Patchen byggs från main f8cc372 och innehåller hela P3a + lagningen: Doodle kör EN kor.sh
(`rundor/P3a-fix/kor.sh`), inte P3-skapelse/kor.sh.

## Beviset först (beslut A)
`skarm-prov.mjs` kördes på 7f89b63 + bara mätkroken (id-passet). Utdata: `bevis/skarm-prov-7f89b63.txt` (36 FEL), bland annat:
- grottan ord 8 "en säl": den nya syns bara 15 % (huvudet 32 %): sälen stod på stallplatsen bakom kon.
- ängen ord 9 "en giraff": 5 somnade på ett ord och fick 0 banners; giraffen 58 %, kon 42 %.
- ängen 10 ord: 3 synliga av 4 vakna (kravet är minst 6). Grinden 28–84 % synlig.

## Orsaker och lagning
- **Regeln såg inte dekorn.** Katten bakom busken och kaninen bakom trädstammen var 32–75 % synliga fast rutorna sa 100 %.
  Platsernas dekor mäts nu i renderingen (`dekor-karta.mjs` → `data/dekor-karta.json`: världens z för den främsta
  dekorytan per 6 × 6 px-cell, mark och vattenyta borträknade). Regeln räknar dekorn som skymmande mot kroppens mitt i
  värsta läget kroppen kan vandra till (`dekorSkymd`).
- **Alla som inte fick plats somnade på en gång** (`iStallet` i minne.ts). Nu `somnaEn`: högst en per ord, den äldsta
  utan ruta, bara ur den nyas budget (rollen bak = byggnader, resten = djur/saker). De andra utan ruta står kvar på den
  minst dåliga rutan, och där räknas de som skymmande för de äldre. Spel.tsx: `for (const s of somnade) visaBanner(…)`
  i stället för bara `somnade[0]` (samma radantal). Banners går i TTS-3-kön; repliker med röstfil får ljud, andra är tysta.
  Ingen röst genererad. `bliVan` (avflode.ts) lägger också sovrepliken i sina banners.
- **Sälen fick stallplatsen**: grottans vattenyta rymmer ingen säl, så den fick reservläget (x 0, z −6,5). Den nya provar
  nu marken om vatten/luft saknar ruta, och djur.tsx simmar/flyger efter rollen regeln gav.
- **Den nya hamnade bak** (slottet i skogen): den nya får nu alltid den främsta rutan, också om en mindre storlek
  (ned till krymp_min) står längre fram.
- **Småsaker**: står främst (rader framifrån). Den nya småsaken når `smasak_px` 40 (minus mätfelet) på den kortaste
  ledden. Den får växa (`smasak_vaxa`, högst 2,5). En platt småsak (höjden under halva bredden: pucken) mäts på den
  längsta ledden. Pucken och koppen behåller modellmåttens förhållande (0,375 mot 0,425 i bredd, verkliga 7,6 mot
  cirka 8 cm). **Tolkning som Arkitekten bör bekräfta:** att också pucken skulle nå 40 px på höjden kräver × 1,7, och då
  blir den bredare än koppen. djur.tsx ritar nu också krymp > 1.
- **Grinden** är en fast sak med `max_skymd` 0,1 (mått ur id-passet). Bengtssons utrop (30 × 30 px) är en reserverad
  ruta. Provet mäter Bengtsson som han syns (bildens ogenomskinliga pixlar), inte knappens hela ruta.
- **Fasta saker i provet** mäts mot den tomma platsen. Spökhuset är redan 58–63 % skymt av bildkanten och träden utan djur.

- **Budgetarna i själva placeringen.** Den nya placeras först, sedan byggnaderna (efter ålder) och sist de andra. Så kan
  bara egna tränga undan en byggnad, och slottet blev inte längre kvar utan ruta när ett djur kom. Bak-luckan (djur
  framför byggnader) gäller bara i samma bredd, så en ny byggnad främst i skogen tränger inte undan alla djur bakom sig.
- **Trängsel efter en somnad.** Står någon äldre ändå utan ruta, prövas den nya mindre (0,9–0,6, främst i varje
  storlek) och den storlek som ger flest vakna vinner. Sedan får de äldre bli mindre (`reserv_krymp` 0,35–0,25, golvet
  gäller). Bara med högst 12 skapelser, alltså spelets tak, så prestandaprovet med 30 ligger kvar under 50 ms.
- **Samma rad** (±0,05 i z) räknas som skymning åt båda hållen (kaninen bredvid hästen i skogen). Dekor strax bakom
  kroppens mitt (−0,15) räknas också. Allt står 8 px från bildkanten (torr1 varv 1: hästen nådde kanten).

## Torrkörningar
- **Avvikelse från beslut B (bekräftad av Arkitekten 08:26):** en väljs att somna per ord (taket eller `somnaEn`). Står
  någon ändå kvar utan synlig ruta efter allt regeln provat, somnar den också (med egen banner) i stället för att stå
  osynlig. Det gäller också de som redan stod utan ruta före ordet (sparade lägen och prov som lägger in 8 på en gång).
  I Doodles ordlistor händer det aldrig: skärmprovet kräver högst en per ord och går igenom. P3-skapelses p3-prov (sjön
  fro11 och värsta-stora) lägger in sju direkt och lämnade annars valfisken helt skymd.
- Regeln räknar med en säkerhetsmarginal (`sakerhet` 0,04) mot skärmprovet. Gränserna är oförändrade.
- torr1 (gren 0f8220e, main f8cc372): exit 0. I skärmprovets varv 1 föll ett steg (ängen ord 5: hästen nådde bildkanten);
  varv 2 och allt annat var grönt. Rättat i cd4b152 (8 px).
- torr2 (cd4b152): skärmprovets varv 1 föll på två huvuden, 87 och 90 % (gränsen är 90). Rättat med säkerhetsmarginalen
  (ea3d935). Avbruten av mig.
- torr3 (ea3d935): p3-provets varv 1 föll i sjön (valfisken var osynlig när en ny kom till sju inlagda). Rättat i 370760f.
  Avbruten av mig.

## Grottans fps (beslut E)
`fps.mjs` (swiftshader, 8 djur, 375 × 812):

| | allt på | utan skuggor | utan punktljus | utan båda |
|---|---|---|---|---|
| skogen | 23,3 | 25,4 | 22,5 | 24,3 |
| grottan | 21,5 | 21,6 | 24,7 | 26,9 |

Grottan har 5 punktljus: ljuspoolens 4 (`MAX_LJUS`, alltid monterade för att slippa omkompilering) och sagans 1.
Skogen har 1. Punktljusen kostar per pixel i varje MeshStandard-material, och utan dem går grottan 15 % fortare.
Skuggorna kostar lite, polygonerna är färre än i skogen (16 000 mot 19 000 trianglar). Doodles 15–17 fps var troligen
punktljusen plus en belastad maskin. Ingen ändring här: `MAX_LJUS` och poolen är en tidigare rundas beslut och låsta
av prov. Förslag till Arkitekten: `MAX_LJUS` 2, eller poolen bara på kvalitet hög.

## Prov
- `skarm-prov.mjs` (nytt, i kor.sh): Doodles ordlistor på ängen, sjön, skogen och grottan, plus småsakerna. Efter varje
  ord mäts synligheten med id-passet. Kraven: den nya och alla vakna syns (30 % skymt för de 3 nyaste, 45 % för äldre,
  huvudet högst 10 %, helt i bild, golv), högst en somnar, varje somnad har en egen banner, grinden ≥ 90 % och
  spökhuset ≥ 70 % av sig själva, och 10 ord på ängen ger minst 6 vakna och synliga.
- p3a.test.ts: test 7 är omskrivet till beslut B (högst en per ord, budgetarna, den nya har ruta).

## Efter torr4 (Arkitekten 09:16): regeln mäter som skärmen

**Torr4 (370760f) föll, exit 4.** Varv 1 av p3-prov: titelbildens utsnitt 114 × 150 mot kaninens 70 × 129 (> 1,6 × kroppen).
Orsak: två mätningar 300 ms isär kan ligga symmetriskt kring toppen av kaninens hopp (0,55 s) och se lika ut – utsnittet
klipptes mitt i luften. Rättat: tre lika mätningar i rad (600 ms, längre än ett hopp). Skärmprovet varv 1: hästens huvud 82 %
på ängen ord 10; varv 2: alla block kraschade med waitForFunction-timeout (60 s) – samma webbläsare för alla block.

**Skärmprovet:** varje block får nu en egen webbläsare och sida; kraschar ett block körs resten. Timeouten loggar orsaken
(sidans readyState, vilka krokar som finns, konsolfel, misslyckade hämtningar, renderer-krasch). Nya flaggor: `--fron 0,11,2026`
(0 = Doodles ordning, andra frön blandar orden), `--varv N`, `--kalib FIL.jsonl` (läget och id-passet för varje ord).

**Kalibrering (kalibrera.ts):** regeln räknas om på exakt det läge skärmen mätte, skapelse för skapelse. Kalib1 (3 frön × 5
block, 279+ mätningar): kroppen – regeln räknar nästan alltid mer skymt än skärmen (rutan är större än siluetten); huvudet –
skärmen upp till 14 % mer skymt än regeln. Orsaken: skärmprovet räknar huvudet som pixlarna i siluettens övre halva, regeln
som andel av rutans övre halva. Siluetten fyller bara en del av rutan (katten 0,53, bläckfisken 0,31), och skymningen kan
falla just där pixlarna är.

**Rättat vid orsaken, inte med fler marginaler:** regeln delar den skymda ytan i huvudrutan med siluettens fyllnad
(`huvud_fyllnad` i data/placering.json, minsta mätta per modell i id-passet; ej mätta modeller 0,5). Det är skärmens mått,
uppåt begränsat: i värsta fall är all skymd yta siluett. Säkerhetsmarginalen 0,04 är oförändrad.

**Fler orsaker kalibreringen visade:**
- `redanUtan` sövde tre på ett ord (ängen frö 11, kon): regeln är inte monoton – med sjukhuset sist fick kaninen, hästen och
  elefanten stallrutor, med kon fick alla en ruta. Nu somnar bara den som står utan ruta både före och med det nya ordet.
- Dekorcellerna (6 px) räknas golv/tak i stället för närmaste – en liten kropp tappade en kantcell.
- Ett djur som hoppar (kaninen, 0,45 m) räknas med hoppet i rutan det rör sig inom (Doodle 7: grinden 86 % mitt i ett hopp).

**Kal2 (5178110, 3 frön × 5 block, 10:05–10:30):** Doodles ordning grön utom ängen ord 4 (det nya slottet fick ingen ruta
med huvudfyllnaden → rättat a289169: fyllnaden gäller inte byggnader). Kvar i frön: ängen frö 11 (kaninen 15–16 × 23 px,
"för liten" med 1 px; kattens huvud 90 %), och fallen nedan.

### Beslut som behövs (stannat här, Arkitekten 09:16)
Ett **byggnadsord** som tränger undan djur: byggnaden ställs främst i sin zon (beslut C), och byggnadens budget kan inte söva
ett djur (beslut B). Djuren står då vakna utan ruta, ritade på den minst dåliga platsen. Ängen frö 11 ord 9 (sjukhuset):
kaninen, hästen och elefanten. Skogen frö 2026 ord 7 (slottet): ankan. Det händer inte i Doodles ordlistor.
Simulerat på samma lägen: om den nya byggnaden inte behöver stå främst blir det 3 → 1 utan ruta på ängen och 1 → 0 i skogen.
Det minsta beslutet: *Får en ny byggnad stå längre bak i sin zon, men så långt fram det går, när den främsta platsen lämnar
djur utan ruta?* Och för det som ändå blir kvar (ängen: kaninen): *Får byggnadsordet då söva det äldsta djuret utan ruta,
med egen banner?* (Annars står det vaket men skymt.)

### Arkitektens beslut 10:31 (inbyggt i 929b7dd)
- **(a)** En ny byggnad ställs så långt fram i sin zon det går utan att något djur blir utan ruta; längst fram bara om ingen
  annan försvinner. Den själv måste ha en ledig ruta (synas inom gränserna). `placera`: prövar byggnadens rader bakåt.
- **(b) Undantag från beslut B:** blir ett djur ändå kvar utan ruta får byggnadsordet söva det äldsta djuret utan ruta – högst
  ett per ord, med egen banner (`somnaEn`; minne.ts sövar inga fler efter ett byggnadsord). Samma anda som avvikelsen
  08:26: ingen står osynlig och vaken.
- **Huvudet:** precis 90 % är godkänt (≥ 90 i hela procent) – i skarm-prov.mjs och i regeln (huvudgränsen + 0,005, samma
  säkerhetsmarginal 0,04).
- **Minsta storleken** mäts som skärmen: regeln räknar storleken på den ritade siluettens ruta (`siluett_andel` × lådan).
  kalibrera.ts mäter andelen där spelet faktiskt ritade (window.__tredPos). Minimigränserna är oförändrade.

**Kal3 (929b7dd, 3 frön × 5 block, 10:32–11:14): 459 ok, 1 fel.** Ängen frö 11 ord 9: kattens huvud 89 %. Orsaken var dekorkartan:
den sparar z × 4 avrundat till närmaste heltal, och regeln jämförde som om det var avrundat uppåt. Busken på z 0–0,12 framför
katten på z 0 räknades därför inte. Nu räknas cellen om den kan stå framför (v > 4·(z + marginal) − 0,5).
Storleken: `siluett_andel` sattes ur kal3 (kalib3-storlek.txt: minsta andel per modell, 4–79 mätningar var). Ej mätta modeller
får 0,6 × 0,6 och mätfelet 3 px som förut. Minimigränserna är oförändrade.
