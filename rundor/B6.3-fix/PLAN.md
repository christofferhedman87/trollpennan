# B6.3 – fixrunda från Doodles spel (Arkitekten, 2026-10-20)

Patch + kor.sh, ingen Build. Kräver B6.2. Data via `b63-data.mjs`: idempotent per nyckel, bara om det gamla värdet står kvar. Rör inte modeller, manifest eller LICENSES.md. Färg på djur rörs inte (pausad av Christoffer).
Doodle: `git checkout main && git pull && git checkout -b runda-b63-kod && bash rundor/B6.3-fix/kor.sh`

| # | Fynd | Rotorsak | Åtgärd | Bevis |
|---|------|----------|--------|-------|
| G | Dammens vatten försvinner när sju saker står på ängen. | **Djuptest mot marken**, inte renderOrder, depthWrite, transparent sortering eller ljuspoolen (ängen har ingen ljuspool). Marken svajar i vertexshadern (`himmel.tsx`, upp till ±0,06), men vattnet låg bara 0,02 över marken (kanten 0,03). När vågen gick förbi stack marken upp genom vattnet. Uppmätt före rättelsen (5 punkter på vattnet, 24 bilder under ~9 s): utan saker saknades vattnet helt i 4 bilder, och med 7 saker i 5 bilder (resten högst 2 av 5 punkter). Med fler saker står de stora sakerna närmare dammen, och kameran ramar in alla, så att marken skymmer en större del av ytan. Därför märktes det först då. Ubåten ensam ändrar inte bilden tillräckligt. | `src/spel/ang/damm.ts`: dammen definieras på ett enda ställe (mitt, radie, höjd) och vattnet ligger på `SVAJ_AMP + 0,035`. Shadern läser samma `SVAJ_AMP`. Kanten, ringarna och näckrosorna följer med. `__tred.damm` ger skärmpunkter på vattnet till provet. | b6-3.test.ts G; b63-prov D (robust, omgjort): 24 bilder under ~9 s, tom äng och 8 stora saker. Ett djupfel syns som en punkt som blinkar (blå i vissa bilder, inte i andra). En sak som står still framför dammen skymmer en punkt i alla bilder, och det räknas inte som fel. Krav: ingen punkt blinkar, tom äng ≥ 4/5, 8 saker ≥ 2/5. Negativ kontroll med vattnet på 0,02: alla tre stegen faller (bilder med 0 av 5). |
| H | Uppmaningen "Det där kan jag inte rita ensamt än …" försvann för fort. | Alla banderoller hade samma tid (2,4 s, mindre om kön är full eller barnet läser långsamt). | En banderoll kan ha egen tid och kan tryckas bort. Uppmaningen står i `kan_inte_rita_ms` (aterkoppling.json, 6000, aldrig under 5000) eller tills barnet trycker (knapp, `.banner.tryck`). Därefter visas nästa i kön. | b6-3.test.ts H; b63-prov H: står 5,9 s, ett tryck stänger |
| I | Bebisen hamnade i dammen. | Ängen hade inga zoner (`zoner: []`). Platslogiken (R8-2b) gällde bara de andra platserna, och landplats 3 ([1,4; 0,25]) låg i dammen. | **Samma regel som på platserna:** ängen har nu zonerna `land` och `damm` (vattenyta) i platser.json och `kant_marginal: 0.28` (liten damm och nära kamera; på platserna gäller 1,0). `angen3d` skickar ängens plats till `DjurIScen`, så alla djur, figurer och saker går via `placeraPaPlats`/`torrKropp`. Simmare hålls i dammen. Flygare påverkas inte. Stora saker håller sin halva bredd (`kant` per klass i storlek.json) från vattnet. | b6-3.test.ts I (1–12 djur + stora saker: alla ≥ r + 0,2 från dammens mitt, fisken i dammen, bebisen flyttas); b63-prov I: 10 skapelser (ängen rymmer 10) (med kaffekanna och väggklocka, Doodle 06:14), världslägena (`__tredPos`, vickningen inräknad) mot dammen i 12 mätningar, alla land ≥ 0,1 utanför kanten, fisken i |
| J | Fordonen bildar en vägg framför staketet. | Bakre platserna var en fast lista med sju punkter, nästan på samma djup, som fylldes i ordning. | storlek.json `bak`: `zon` (x −2,7…2,7, z −1,9…−1,15), `min_avstand` 0,95 och `fri_x` [[−1,4; 0]] (ingen stor sak har sin mitt framför grinden eller staketets mitt). `bakPlatser()`: läget slumpas men är fast per uid (hash). Djupet sprids med gyllene snittet plus jitter, så att två saker i följd aldrig hamnar på samma djup. Fortfarande bakom alla djur. | b6-3.test.ts J (spridning i x ≥ 3 och z ≥ 0,3, högst 2 per 0,1 i djup, de fyra första ≥ 0,95 isär, ingen framför grinden); b63-prov D-bild |

B6.1-provets stora-saker-steg och B6.2-provet körs som regression i kor.sh.

## Rättning efter Doodles körning på eaa80b3 (07:33): placering efter modellens bbox

Kon stod 0,08 utanför dammkanten (kravet 0,1). Orsaken: ängens marginal var 0,28 från mitten, vickningen ±0,22, och kroppens bredd räknades inte alls.
Kravet sänks inte; placeringen ändras:

- **`data/fotavtryck.json`** (ny, genereras av `fotavtryck.mjs` i kor.sh på main, så att alla modellpaket kommer med): halva bredden på marken per entitet, ur modellens GLB-bbox (nodernas transformer inräknade) gånger spelets skala (`skalaFor`). 1005 entiteter på a96d864.
- **`fotKant(kropp, skala)`** (entiteter.ts): halva bredden (barnets storleksord inräknat, under taket; saknas raden 0,5 × målhöjden) eller klassens kant om den är större, plus vickningen 0,27 för djur (x ±0,22, z ±0,16) och **0,15**. `djurPlats` skickar den som kant till `placeraPaPlats`.
- **`torrKropp`** provar 16 riktningar på avståndet m och en ring på m/2 (med 8 kom vattnet närmare än m mellan riktningarna; bussen hamnade 0,06 från vattnet i enhetstestet).
- Prov I mäter **kroppen**: avståndet till kanten minus halva bredden ≥ 0,1 i alla 12 mätningar. Kör två fasta varv (I1 = Doodles fall, I2 = mikroskop, trumset, jordglob, ägg, väggklocka, ko, hund, buss, kaffekanna, fisk) och slumpade varv ur en pool med 23 saker och djur (`--varv n`, `--fro tal`; fröet står i prov.json).
- Prov H mäter trycket i stället för tiden sedan boken öppnades (vid load 26 tog skärmbilden över 3 s).
- package.json läggs inte längre i patchen (den krockade med B6.4:s tillägg). `b63-data.mjs` lägger in `b6-3.test.ts` textuellt.

Påskägg och armband finns inte som entiteter; ägget (`agg`) är med i stället. Prov D täcker att dammvattnet syns med många saker: 8 stora saker, alltså fler än de 5 i M21.

## Tillägg (Doodle 08:26, main f078460, 1 154 tillgångar): ALLA skapelser, inte bara djur

- Regeln gäller allt på marken (djur och saker): `djurPlats` skickar `fotKant` för varje icke-flygare. Saker har ingen vickning, men har halva bredden + 0,15.
- **Enhetstest över alla entiteter**: varje modell på marken (1 100+ på f078460, Doodles fall först: bowlingklot, akvarium, spjälsäng, påskägg, vattenpistol, filt, fiol, mikroskop, trumset, ko) placeras i lag om 10 via `djurPlats`; kroppens kant ska vara ≥ 0,1 från vattnet med vickningen inräknad.
- Testet hittade 5 modeller utan torr plats (apatosaurus 7,2 breda, golem 5,1, velociraptor, trollslända, triceratops). **`MAX_HALVBREDD = 1,2`** i `skalaFor`: ingen skapelse ritas bredare än slottet (2,4). Det gör 30 modeller mindre i bredd, t.ex. dinosaurierna, golem, neontetra (2,9 bred!), fenix, bro, brygga, hangar, snöfort. Det är ett smakbeslut, så konstanten kan justeras; storlek per typ hör till B6.6.
- Prov D2: dammvattnet med Doodles 10 saker (spjälsäng m.fl.) blinkar inte bort, minst 3 av 5 punkter syns. Prov I3: samma 10 saker, kroppen utanför dammen. Prov I4 (Doodle 08:59): lakrits, frimärke och 8 småsaker. Poolen för slumpvarven har 30 ord (med sjukhus, apatosaurus, triceratops och cirkus).

## Rättning 2 (Doodle 09:17, main b1d2e79, exit 4): siktzonen mellan kameran och dammen

Inget stod i dammen, men i D2 stod kon mellan kameran och dammen och skymde vattnet (1 av 5 punkter i 5 av 24 bilder). Kravet behålls; placeringen ändras:

- **`siktFri(x, z, radie, höjd)`** (damm.ts): ren geometri. Kroppen är en lodrät cylinder. Radien är halva bredden ur bbox, plus vickningen för djur, plus 0,1. Höjden är målhöjden under taket; för djur läggs 0,6 till för studs och pratbubbla, för saker 0,05. Kroppen får inte skära någon siktlinje från kameran (stående och liggande standardläge) till någon av vattnets 33 punkter (mitten, halva radien, kanten, 16 riktningar).
- **`placeraPaPlats`** tar ett extra villkor per skapelse. På ängen skickar `djurPlats` siktFri för allt på marken utom simmare. Saker hamnar bredvid eller bakom dammen.
- **Enhetstest** (b6-3.test.ts): geometrin (kon framför skymmer, till vänster och bakom gör den inte). Ingen placering hamnar i siktzonen för Doodles D2-sats, för de 10 största/högsta skapelserna på marken (tre frön vardera) och för alla 1 100+ entiteter på marken i lag om 10.
- **Prov D2/D3 är deterministiska**: skapelserna läggs in med fasta uid (tre frön), inte via slumpade uid. D2 = Doodles 10 (spjälsäng, kon …), D3 = de 10 största/högsta på marken (räknas ur data: cyklop, golem, dinosaurierna). Kravet är detsamma (ingen punkt blinkar, minst 3 av 5). Utfall på 3e8237b: 4 av 5 i alla bilder i alla sex scenerna. Den femte punkten, mitten, ligger under en näckros, precis som på tom äng.
- Kvar: om barnet själv vrider eller zoomar kameran (OrbitControls) kan en skapelse förstås skymma. Siktzonen gäller standardlägena.
