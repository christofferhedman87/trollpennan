# B6.6 – skapad men osynlig, byggnader längst bak, storlek per typ

Körs efter B6.3 (bbox-marginal, siktzon) och B6.5. `kor.sh` kräver båda. Doodle:

    git checkout main && git pull && git checkout -b runda-b66-kod && bash rundor/B6.6-fix/kor.sh

## A. Alla modeller syns (b66-prov över alla tillgångar med modell, tio åt gången)

Provet lägger in tio skapelser i taget med fasta uid och mäter kroppens skärmruta (`window.__tredSyn`, ny i djur.tsx).
Krav per modell:
- största måttet minst 24 px, minsta minst 4 px, ytan minst 200 px²;
- mitten inom scenen (x 0–375, y 150–740);
- för stora saker bak: minst en fjärdedel av rutan i bild.

Felsökningen visade att provet bara mätte första gruppen: uid-nyckeln använde fel index. Det är rättat, och provet väntar nu på nätet.

Allmänna rättningar, inte per modell:
- **Tio platser i bild.** LAND_SLOT har två nya platser. Plats 9 och 10 låg förut på x ±2,2, utanför bilden i stående läge; där låg ~86 modeller, bland annat den "osynliga kvasten". Fler än tio sprids med gyllene snittet inom bilden.
- **Synlig bredd.** `narmast` (platsYta) letar först inom |x| ≤ 1,6, sedan utan gräns.
- **Flygare i rader.** Tre i bredd (|x| ≤ 1,2), sedan nästa rad högre och förskjuten. Förut gällde x = −1,4 + 1,5·i, och den fjärde flög ut ur bild (pelikan, ängel).
- **Modellen centreras på sin plats** (gltfDjur). Förut flyttades bara botten till marken. En GLB med origo vid sidan av kroppen ritades därför långt från platsen, och provet visade den utanför bilden fast `__tredPos` låg mitt i. Det gällde krater, raket, rymdskepp, racerfarkost, parabol, generator, månbil, häckgrind och giraff. Nu centreras x/z som i GltfSak. Ankarna (tillbehör) räknas efter centreringen och följer med.
- **Minsta storlek för saker** (storlek.json `minsta`): största måttet minst 0,45 och ytan framifrån minst 0,06, med högst ×2,5 förstoring och aldrig över klassens tak. Gäller tunna och små saker: klubba, fiskespö, isglass, bäck, stig, selleri, kniv, golfklubba m.fl.

## B. Byggnader (Doodle 08:26)

- **Storlek per typ** (storlek.json `ids`):
  - `jatte` (tak 1,9, högst 1,3 i halv bredd): slott, borg, kyrka, skyskrapa, pyramid, fabrik, hangar, slottstorn, torn, vattentorn, vindkraftverk, hotell.
  - `stor` (tak 1,5): övriga hus, t.ex. sjukhuset 1,4.
  - `liten_byggnad` (tak 1,0): kiosk, bajamaja, koja, skjul, hönshus, marknadsstånd, brunn, gatlykta, flagga, garage, segelskjul, skorsten.
  - Resultat: slottet 1,9, sjukhuset 1,4.
- **`bakLagen`** (delat.ts) ersätter uid-slumpen för stora saker:
  - Byggnaderna (klass med `rad: "bortom"`) står bakom staketet, z −3,3 … −2,35. Fordon och möbler står framför staketet; får de inte plats där går de bakom.
  - De högsta väljer först och står längst bak. Varje sak tar en ledig sträcka i x, slumpad men fast per uid, så de sprids. Kroppen ryms i bilden (`synlig_x` 2,9).
  - Finns ingen ledig sträcka ställs den lägre framför den högre. Vid samma höjd står den smalare framför: växthuset framför cirkustältet.
  - Inget står framför grinden. Framför staketet gäller `fri_x` med halva bredden; bakom staketet hålls själva grinden fri (`bortom.fri_x`).
  - Dammen hålls fri (fotKant) och syns (B6.3 `siktFri`).
- `djurPlats` flyttar inte stora saker igen på ängen; bakLagen har redan räknat in dammen, grinden och bilden.
- Enhetstest (b6-6.test.ts):
  - Alla byggnader i lag om 6 med två djur, Doodles uppsättning, fordon och möbler.
  - Kraven: grinden fri, dammen och siktzonen fria, bakom djuren, byggnader bakom staketet, den lägre framför och växthuset framför cirkustältet.
- Prov BYGG1–2 (två ordningar) i webbläsaren: bakom staketet, grinden fri, slottet minst 15 % högre än sjukhuset på skärmen, cirkustältet täcker högst 30 % av växthuset och spännvidden är minst 2,5.

## C. Små data
- `"nyckelring"` som ord för nyckelknippa, på samma sätt som teve = tv. Förut blev det "behöver ett djur", och reserven blev ägg.
- Pucken har målhöjd 0,4 → 0,3 (entiteter.json och inlagg.json).
- `MAX_HALVBREDD` (B6.3) kan per klass höjas med `max_halv`.

## D. Attribut på GLB-modeller (kontrollerat, inte ändrat här)
- **ränder/prickar** (`monster`) ritas bara på procedurkroppen (`DjurForm` → djurmesh `monster`). gltfDjur har inget mönster, så på alla GLB-modeller syns mönstret inte.
- **vingar** ger bara flygning (`flyger`), **fenor** bara simning (`simmar`). Ingen vinge eller fena ritas på GLB.
- **fartlinjer** och **studs** finns bara i gamla Phaser-scenen (beteende.ts, scen.ts), inte i 3D.
- Förslag (egen runda), tabelldrivet som B6.5:s effekter i data/attribut.json:
  - `monster:randig` och `monster:prickig` blir ett överdrag: en tunn genomskinlig kopia av modellens meshar med rand- eller prickmönster i barnets mönsterfärg, skalad efter bbox.
  - `formaga:vingar` blir ett vingpar och `formaga:fenor` en ryggfena, fäst vid bboxens överkant och baksida.
  - `fartlinjer` och `studs` blir 3D-effekter i effekter.tsx.
