# R8-3a – färgordet färgar hela kroppen på alla modeller (R9C) – patch + kor.sh, ingen Build

**Kör (Doodle), efter M21–M28 och B6.3–B6.5:** `git checkout main && git pull && git checkout -b runda-r83a-kod && bash rundor/R8-3a-farg/kor.sh`
Exit 0 → push, PR, squash-merge. Ingen data, inga modeller, ingen LICENSES.md ändras. 0 USD.

## Rotorsaker (mätta i spelet, main e87b1ba + B6.3 + B6.5)
| Fall | Före | Orsak |
|---|---|---|
| "en röd hund" | orange (nyans 10–20°, 44 % i målnyansen) | Guldordets glans lade ett **gult självlyse** (#FFE082) över kroppen: rött + gult = orange. Samma sak gav R9C:s "röd isbjörn 23°" och "grön gulgrön". Mätt: högre `ljusforstark` gjorde det värre (06 %), alltså inte ljuset. |
| "en blå jultomte" | dräkten blå, **mössan röd/orange** | Bara ett material färgades (texturen). Mössan är ett eget material (`#8E1116`) och räknades som detalj; glansen gjorde det orange. |
| "en grön narval", "en blå bil" | ingen färg alls | Bara entiteter med `palett` eller `material` i datan färgades. Narvalen tappade paletten i MFIX4-filbytet; de flesta av de 1 154 modellerna har ingen. |
| "en röd elefant" | bara öronen röda | Kroppsfärgen i texturen räknades per hörn: tätt modellerade rosa öron vann över den stora grå kroppen. |
| "en lila drake" | magenta (310°) | Gult självlyse över lila. |

## Rättelse (generell, ingen kod eller rad per djur)
- `src/spel/fargning.ts`
  - `kroppsRoller(mats, roller?)`: roll per material, kropp/ljus/detalj. Huvudmaterialet är den största ytan bland de icke-mörka. Kroppen är huvudmaterialet plus varje material i samma färgfamilj, alltså samma nyans ±22°, eller neutral med liknande ljushet. Ögon (mörka), hud, vita kanter, skor och spännen blir detalj. Datans `material`-tabell vinner per namn (`farg`, `ljus` och nya `behall`). Gränserna står på ett ställe, i `KROPP`.
  - `valjKarna(klumpar)`: kroppsfärgen i en textur räknas ytviktat. Färgerna delas in i familjer. Är den största familjen neutral och en kulör familj täcker minst 30 % blir den kulöra familjen kroppen (jultomtens dräkt).
  - `fargning()`: utan färgord blir det ingenting (B6.4, oförändrat). Kropp med textur ger texturbyte, kropp utan textur ger målfärgen, ljus ger en ljusare kropp och detalj ger ingenting.
- `src/spel/gltfDjur.tsx` `fargaKlon`: samlar material med yta (`ytaPerMaterial`) och kärnfärg (`karnfarg`, nu ytviktad och cachad per nät och textur). Därefter väljs roller och kroppen färgas:
  - Textur: kroppens texlar byts (`paletteSwap`). En vit eller grå kropp blir gråskala gånger färgen (`graTextur`/`malAlbedo`).
  - Materialfärg: `byttPixel` ger målets nyans, materialets ljushet relativt kroppens och kompensation för ljuset.
  - Glansen lyser i färgordets egen nyans och bara på kroppen.
  - De 7 första handjusterade djuren (palett, inte `inlagd`) behåller sin palett.
  - Materialklonerna delas inom modellen, så det blir färre material än förut.
- `src/spel/entiteter.ts`: rollen `behall` tillåts.
- `src/spel/b6-4.test.ts`: B6.4-regeln "utan färgord ingen ommålning" står kvar. Testet "med färgord som förut" gällde under R9C-pausen och är ersatt av `r8-3a.test.ts`.

## Bevis
- `r8-3a.test.ts` (10 test): jultomte, kraken, datans roller, mörka ögon, vit kropp med rosa öron, ytviktad kärna, kulör dräkt, fargning, B6.4 för alla roller och giltiga roller i datan.
- `r83a-prov.mjs` (375x812, 11 steg). Per fall mäts andelen nya mättade pixlar i målnyansen och **andelen av figurens alla pixlar** (pixlar som ändrats mot den tomma ängen), så att färgade öron inte räcker.

  | Fall | Före, i målnyansen | Efter, i målnyansen | Efter, täckning |
  |---|---|---|---|
  | blå katt | 0,87 | 0,90 | 0,64 |
  | röd hund | **0,44** | 0,96 | 0,69 |
  | gul kraken | 0,88 | 0,91 | 0,66 |
  | blå jultomte | **0,55** | 0,78 | 0,42 |
  | grön narval | **0,53, 0 material** | 0,99 | 0,53 |
  | röd elefant | 0,64, bara öron | 1,00 | 0,95 |
  | blå bil | **0, 0 material** | 0,94 | 0,83 |
  | lila drake | **0,36** | 0,94 | 0,60 |

  Utan färgord: jultomten är röd och kraken lila, med inget material ändrat och inget självlyse (B6.4).
- `r83a-alla.mjs`: "en blå <ord>" för varje modell. Hela körningen: **941 av 941 färgade och 0 sidfel**. De 9 där ordet gav en annan kropp gäller tolken, inte färgen. kor.sh provar 160 jämnt spridda; `R83_ALLA=1` provar alla (~17 min).
- Regression: b64-, b62- och r9k-prov, plus b63- och b65-prov när de är mergade.
- Bilder i `/workspace/trollpennan-nulage/r83a-bilder/`: `r83a-<fall>.png`, `-nara.png` och `r83a-kontaktark.png`.

## Verifierat (2026-10-20)
- **main d14ebd6 (M28, 1 154 modeller) + B6.3 + B6.5**, ren kopia: kor.sh med `R83_ALLA=1`. r83a-alla gav **1 106 av 1 106 modeller färgade och 0 sidfel**, och r83a-prov 11/11. b64/b62/b65/r9k gick grönt. b63-prov steg I föll en gång (kon 0,08 från dammkanten mot gränsen 0,1). Steget faller också utan R8-3a, 1 av 4 körningar i parallell last, så det är vandring och inte färg. Därför har regressionen nu ett omförsök.
- **main 12284c9 (MFIX6–8) + B6.3 + B6.5**: kor.sh EXIT=0. test:product 214, typecheck 0, eslint 0, struktur grön, build ok, r83a-prov 11/11, r83a-alla 158/158 och regressionen grön.
- **main b1d2e79 (ny B6.3: bbox-placering, fotavtryck) + B6.3 + B6.5**: kor.sh EXIT=0. test:product 216, typecheck 0, eslint 0, struktur grön, build ok, r83a-prov 11/11, r83a-alla 158/158, b64/b62/b63 (I1–I6)/b65/r9k gröna.
- Patchen går att lägga på main både med och utan B6.3/B6.5 (`git apply --check` ok). package.json ändras med node, inte i patchen.

## Svagheter och kvar
1. En vit eller grå kropp med textur blir gråskala gånger färgen **för hela texturen**. Elefantens betar blir därför röda. Det går att förfina genom att bara byta neutrala texlar nära kroppens ljushet, men det gav kantblödning i R9.
2. Vertexfärgade modeller (3 st) färgas via materialet gånger vertexfärgen, alltså mörkare.
3. Saker *bredvid* ett djur ("en kanin med en blå hink") får ingen färg. Färgordet hör till djuret i tolken. Det är en tolkfråga, inte R8-3.
4. Kroppen väljs per material. En modell där kropp och detalj ligger i **samma** material med samma färgfamilj byter båda.
