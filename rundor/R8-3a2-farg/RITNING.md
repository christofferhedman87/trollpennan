# R8-3a2 – färgen följer kroppen (ritning, Arkitekten 2026-10-20)

Uppföljning av R8-3a (#175). Fyra fel som syns på riktiga modeller, lösta med generella regler. Det finns ingen kod per modell.

**Kvalitet går före kvot.**
- **Väg:** patch + kor.sh, inte Build-prompt.
  - Felen sitter i en regel, alltså i vilka texlar, material och hörn som räknas som kropp.
  - En regel går att enhetstesta deterministiskt (r8-3a2.test.ts) och mäta i pixlar (r83a2-prov.mjs).
  - Build skulle behöva gissa samma regel utan provet och ta flera varv.
- **Kvotåtgång:** **medel**.
  - Analysen av texturatlaser och mätningen av ankans mage tog mest.
  - Doodle-körningen är en kor.sh på cirka 15–25 min på belastad box.

## Grundorsaker
| # | Fel | Orsak i main |
|---|-----|--------------|
| 1 | Ankans mage grön under blå kropp | Ankans kropp ligger i en atlasruta: en gradient från gulgrön rygg (61°) till grön mage (115°). Palettbytet tog bara texlar inom ±22° från kärnan, så magen blev kvar. Dessutom tog `kroppsRoller` bara material nära HUVUDmaterialet. Ett delmaterial som liknar ett annat kroppsmaterial blev "detalj" (samma fel på modeller med mage/bröst som eget material). |
| 2 | "regnbågsfärgad" = grå kropp + båge | Regnbågen fanns bara som effekt (en båge över). Kroppen fick ingen färg, och texturen grånades. Det fanns inga mönster alls ("randig" och "prickig" gav bara färgen). |
| 3 | Elefantens betar röda | Texturer i grått/vitt fick färgen över hela kartan (`graTextur` + materialfärg). Betar, ögon och naglar ligger i samma textur och samma material. |
| 4 | Hörnfärgade modeller mörkare | Materialfärgen multiplicerades med hörnfärgen (färg × hörn). En mellanmörk hörnfärg gav en mörk kropp. |

## Regeln
1. **Kedja av material** (`fargning.ts` → `kroppsRoller`).
   - Ett material vars kärnfärg ligger nära NÅGOT kroppsmaterial blir kropp, transitivt.
   - "Nära" har samma gränser som R8-3a. Kulört är nyans ±22°. Neutralt är ljushet ±0,2. Det måste också ha yta ≥ 3 % och inte vara mörkt.
   - Hud mot röd dräkt (23–33°) stannar alltså, och jultomten är oförändrad.
   - Datans `kropp` sår kedjan. Datans `behall` bryter den.
2. **Kroppsmask i texturen** (`fargning.ts` → `kroppsMask`, används av `kroppsfarg.ts` → `kroppsTextur`).
   - Flödesfyllning från kärnans texlar. Varje steg tillåts ändra färgen med högst 30 (Σ|Δrgb|).
   - Familjen begränsas. Kromatiska färger får ligga inom ±70° och s ≥ 0,15. Neutrala får ha |Δl| ≤ 0,3.
   - En sammanhängande komponent tas med bara om modellen till minst 40 % använder den som kärna.
     - Användningen räknas som areaviktade UV-prov per triangel, över alla meshar som delar materialet.
     - Ankans mage följer med, eftersom den är samma ruta som ryggen.
     - Det stoppar ankans vingar och fötter, vars gradient bara snuddar vid kroppens nyans.
     - Elefantens betar, öron och ögon är egna komponenter, så de behålls.
   - Bara maskens texlar får färgen. Neutrala bakas som `graNiva × malAlbedo`, kromatiska som `byttPixel`. Materialfärgen blir vit.
   - Handjusterade paletter (`pal`) behåller paletteSwap som förut.
3. **Hörnfärger bakas** (`fargning.ts` → `hornKropp`, `kroppsfarg.ts` → `fargaHorn`).
   - Hörnen klassas mot hörnfärgernas egen kärna. Kroppshörn får färgordets färg inbakad (i linjärt ljus), och materialet blir vitt.
   - Ögon och mörka detaljer behåller sin hörnfärg. Helvita hörnfärger räknas som "inga".
4. **Mönster på kroppen ur data.**
   - Mönstren ligger i `attribut.json` → `kroppsmonster`:
     - regnbåge = band, sex färger;
     - ränder = rander;
     - prickar = prickar.
   - De läses av `attribut.ts` → `kroppsMonsterFor`.
   - En gemensam shader-tillsats (`kroppsfarg.ts` → `monsterPa`) använder attributet `aMonster`, som är position i modellrummet plus kroppsvikt.
     - Mönstret följer kroppen och följer med skinning.
     - Masken (punkt 2) och hörnvikten (punkt 3) begränsar det till kroppen.
   - `ersatter: "regnbage"` gör att `effekterBredvid` hoppar över bågen när en GLB-kropp bär mönstret.
   - Procedurella kroppar utan modell behåller bågen.
   - Den andra färgen kommer ur ordet ("röd och blå randig"). Utan andra färg blir det en mörkare ton av kroppen.
5. **Kärnan över två nyansfack** (`fargning.ts` → `valjKarna`).
   - En kulör familj räknas ihop med grannfack vars medelnyans ligger inom ±22°.
   - Torrkörning 1 hittade felet. Bilens röda kaross ligger på 9° och 12°, alltså i två 20°-fack med 20 % och 14 %. Var för sig var de under 30 %, så de grå rutorna (40 %) blev kärna. Masken färgade då bara taket.
   - På main doldes felet av att hela texturen färgades.
6. **B6.4 gäller oförändrat.** Utan färgord och utan mönster rörs inget material.

## Filer
| Fil | Ändring |
|-----|---------|
| `src/spel/fargning.ts` | Kedjan i `kroppsRoller`, `MASK`, `Karna`/`iKarnan`/`iFamiljen`, `kroppsMask` med `Anvandning`, `hornKropp`, `tillLinjar`/`tillSrgb`, och `FargRad.mask/horn/monster` |
| `src/spel/kroppsfarg.ts` (ny) | `kroppsTextur` (cache per textur+kärna+mål), `fargaHorn`, `monsterKoordinater`, `monsterPa`, `monsterFarger` |
| `src/spel/gltfDjur.tsx` | Rättningar i `fargaKlon`: samlar användning (UV-prov), vävar ihop maskens texturer, hörnen och mönstret. `graTextur` är borttagen. Signaturerna för `fargaKlon`/`metallNoll` är orörda (P3 exporterar och anropar dem). |
| `src/spel/attribut.ts` | `KroppsMonster`, `kroppsMonsterFor`, `effekterBredvid` |
| `src/spel/effekter.tsx` | `DjurEffekter` använder `effekterBredvid(v, harModell(v.kropp))` |
| `data/attribut.json` | Nytt avsnitt `kroppsmonster` (3 rader) och `i_kroppen._om`. **Inte granskad** (ingen `granskad:true` rörs). |
| `rundor/R8-3a-farg/r83a-prov.mjs` | Bilen får egen täckningsgräns, 0,25 i stället för 0,35. Rutor, däck och lyktor behålls nu, och glasburen står framför: 0,32. Felet "bara taket blått" (0,13) faller fortfarande. |
| `rundor/B6.5-fix/b65-prov.mjs` | Regnbågskatten: steget "effekten regnbage ritas" godkänns också av kroppsmönstret `band` (`__tredFarg`), eftersom effekten är ersatt med flit. Steget "minst 4 av 6 nyanser syns" är oförändrat. |
| `src/spel/r8-3a2.test.ts` (ny) | 10 tester: ankans atlas, elefanten, en skarp kant, en vinggradient, materialkedjan (+ behall + jultomten), hörn, mönster ur tolken, datanycklar, B6.4, kärnan över två nyansfack |
| `package.json` | Testet läggs i `test:product` av kor.sh (inte i patchen) |

**Spel.tsx rörs inte.** kor.sh stoppar (exit 3) om den ändras.

## Prov (`r83a2-prov.mjs`, 375×812, swiftshader)
Varje fras väcks på en tom äng. Provet tar en bild av ängen före och en efter, och mäter figurens pixlar (det som ändrats). Det läser också `__tredFarg` och `__tredEffekter`.

| Steg | Krav | main (före) | patch (efter) |
|------|------|-------------|---------------|
| en blå anka | gröna pixlar i kroppens nedre halva (nya, inre, nära kroppen) ≤ 3 % av kroppens blå, och ≥ 300 blå | FEL: 176 gröna / 1 197 blå = 0,147 | ok: 0 / 1 628 = 0 |
| en röd elefant | ≥ 25 gräddvita px (betarna), röd ≥ 60 %, kroppens mask < 100 % av texturen | FEL: 28 gräddvita, röd 0,94, ingen mask (hela texturen) | ok: 158 gräddvita, röd 0,95, mask 7 % av texturen |
| en blå vas (hörnfärg) | blå ≥ 60 % och ≥ 150 px, de blås medelljushet ≥ 0,33 (färgordets egen 0,51) | FEL: blå 0,65, ljushet 0,27, inga hörnfärger bakade | ok: blå 0,60, ljushet 0,48, hörn bakade |
| en regnbågsfärgad katt | ≥ 5 av 6 nyanser med ≥ 20 px, grått ≤ 35 %, ingen regnbåge-effekt, mönster "band" | FEL: grått 0,42, effekten regnbage (bågen) | ok: 6/6 nyanser (351–1 009 px), grått 0,004, ingen båge, mönster band |
| en röd och blå randig katt | röd ≥ 25 %, blå ≥ 10 % | FEL: röd 0,77, blå 0,025 | ok: röd 0,51, blå 0,25 |
| en gul och lila prickig hund | gul ≥ 25 %, lila ≥ 3 % | FEL: gul 0,94, lila 0 | ok: gul 0,84, lila 0,048 |
| en anka (B6.4) | inget material ändrat | ok | ok |

Siffrorna kommer ur torrkörning 2 (kor.sh på main a22bfbc): `prov-fore.json` före patchen, `prov.json` efter.
| inga sidfel | – | ok | ok |

kor.sh bygger main till en egen katalog före patchen. Provet **måste falla där** (STOPP 4 annars), och det ger förebilderna. Efter patchen ska provet vara grönt. Därefter körs regressionen: r83a-prov, r83a-alla (160 modeller), b64, b62, b65, b63 och r9k, var och en med ett omförsök.

## Parallella grenar
`git apply --check` är provat mot origin/main a22bfbc (efter TTS-2-fixens rundmaterial #178). Tsc och test är körda på det kombinerade trädet.

| Bas | R8-3a2 |
|-----|--------|
| main | ok |
| main + TTS-2 (tts2-fix 23e0373) | ok |
| main + P3 (p3-skapelse f39341f) | ok |
| main + TTS-2 + P3 | ok. typecheck:pages 0 fel. r8-3a2, r8-3a, p3 och b6-5 test: 34/34 |
| R8-3a2 först, sedan P3 / TTS-2 | båda ok |

P3:s `Plagg.tsx` anropar `fargaKlon(c, {kropp, farg} as Sparad)`. Utan `monster` blir det `null` och bara färg, som förut.

## Grindutlåtande (build-round-gate)
Det här är en patchrunda, inte en Build-runda. Grinden gäller fullt ut för Build, och här läses den för en färdig patch (prejudikat: R8-3a).

| # | Punkt | Utlåtande |
|---|-------|-----------|
| 1 | Projektkartan aktuell | **Anmärkning.** `PROJECT.md` uppdaterades senast i B6.3 (#167, 12:14). R8-3a (#175) och P2-2 (#176/#177) står inte där. Det stoppar inte en patchrunda, men kartan bör uppdateras när R8-3a2 mergas: R8-3a → klar, R8-3a2 → skript. |
| 2 | Återanvändning | **Ja.** Återanvänder R8-3a:s `kroppsRoller`, `karnfarg`/`valjKarna`, `byttPixel`, `malAlbedo`/`LJUSTINT` och `paletteSwap` för handjusterade paletter. Från tolken återanvänds attribut-tolkningen (`monster`/`monsterfarg` fanns redan i `Sparad`). Effektsystemet och `harModell` återanvänds också. Inga nya mönsterbilder, eftersom shadern ritar mönstret. |
| 3 | Arkitekturregeln | **Ja.** Det finns ingen kod per modell. Mönstren är tre datarader (`kroppsmonster`). Undantag per modell går genom befintliga `kropp`/`behall` i datan. |
| 4 | Ritning | **Ja.** Patchen är färdig. kor.sh tillämpar den och stoppar vid fel (2/3/4). |
| 5 | Dataväg | **Spårad.** Fras → `tolka` (monster/färg) → `Sparad` → `kroppsMonsterFor` → `fargaKlon` (gltfDjur.tsx) → `kroppsTextur`/`fargaHorn`/`monsterPa` (kroppsfarg.ts) → shader. Effekten går `effekterBredvid` → `DjurEffekter`. Provet läser `__tredFarg` (mask/horn/monster) och `__tredEffekter` vid varje hopp. |
| 6 | Bevis | **Ja.** `r83a2-prov.mjs` körs i 375×812 och täcker anka, elefant, vas (hörnfärg), regnbågskatt, ränder, prickar och B6.4. Det faller på main (kor.sh kräver det) och är grönt med patchen. Före- och efterbilder + kontaktark. Dessutom finns 10 enhetstester. |
| 7 | Inställningar | **Ej tillämpligt** (ingen Build). kor.sh med `nice -n 19`/nohup, egen gren `runda-r83a2-kod`, logg i fil. |
| 8 | Ett mål | **Ja.** "Färgen följer kroppen", med fyra sammanhörande fel i samma kodväg (`fargaKlon`). |
| 9 | Vem skriver koden | **Arkitekten (patch).** Doodle kör bara kor.sh. Granskande bot skriver ingen spelkod. |

**Utlåtande:** klar att köra som skript. Torrkörning 2 gav EXIT 0, se nedan. Anmärkning 1 åtgärdas i PROJECT.md vid merge.

## Torrkörning
Körd i en ren worktree av origin/main, med `nice -n 19` och nohup. Loggen ligger i `/workspace/r83a2-torr.log` och `.exit`.

- **Torrkörning 1** (main 16b6125, 17:01–17:34): **EXIT 4**. Två regressioner hittades.
  - r83a-prov "en blå bil": bara taket blev blått. Felet satt i `valjKarna`, som delade nyansen över två fack. Det är lagat.
  - b65-prov: "effekten regnbage ritas" föll. Effekten är ersatt med flit, och provet godkänner nu kroppsmönstret.
  - b62, b63, b64, r9k och r83a-alla var gröna redan där.
- **Torrkörning 2** (main a22bfbc, 17:34–18:02): **EXIT 0**. Commit 1871a5a i torrträdet.
  - test:product 257 gröna;
  - typecheck/typecheck:pages 0;
  - eslint . 0 fel och 0 varningar;
  - check:struktur GRÖN;
  - Spel.tsx orörd;
  - build:pages ok;
  - r83a2-prov: före 6 FEL (exit 1), efter 8/8;
  - r83a-prov exit 0;
  - r83a-alla 158/158 färgade (2 med annan kropp: sportbil→stek och eld→ubat, kända datafel som P3 tar);
  - b64, b62, b65, b63 och r9k exit 0.

Bilder: `/workspace/trollpennan-nulage/r83a2-bilder/` (`r83a2-fore-*.png`, `r83a2-efter-*.png`). Kontaktarket (före till vänster, efter till höger) ligger både där och i `rundor/R8-3a2-farg/bilder/r83a2-kontaktark.png`.

Körkommando för Doodle:
`git checkout main && git pull && git checkout -b runda-r83a2-kod && bash rundor/R8-3a2-farg/kor.sh`

## Kvar / svagheter
- **Ankans tofs** på huvudet är grön även efter patchen. Den är en egen detalj (egen färgruta, liten, annan nyans) och räknas med flit inte som kropp. Kärnregeln skulle annars också färga näbbar och fötter.
- **Procedurella kroppar** (utan GLB) får inget mönster. De behåller regnbågsbågen, som är effekten som förut.
- **Kantblödning:** där masken möter en behållen detalj kan en texel i kanten få blandfärg vid filtrering. Det syns inte i 375×812.
- **Mönstren** är normaliserade mot modellens största mått. Mycket avlånga modeller (orm, narval) får färre band längs kroppen.
- `r83a-alla` mäter "färgad" (minst ett material ändrat). Masken gör att färre texlar ändras per modell. Det är avsikten, men hela bredden är bara provad med 160 modeller (`R83A2_ALLA=1` kör alla).
