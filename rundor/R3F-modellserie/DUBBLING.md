# Dubblingen av modellerna (Christoffers önskan: dubbelt så många) – Arkitektens plan, 2026-10-20

## Nuläge (räknat i `data/tillgangar.json` på main b679a3d)
- **577 tillgångar** (576 GLB-filer: 567 i `public/models/bulk` + 9 första modeller; 1 rad utan fil). Per runda: R3D 234, R3C 43, M1 39, M2 34, M3 40, M4 39, M5 34, M6 28, M7 26, M8 34, M9 16, de första 10.
- Entiteter med modell: föremål 316, djur 152, natur 53, byggnad 40, tillbehör 15.
- Efter **M10 (B5a, 9)** och **M11 (37)**: 623. **Mål ≈ 1 150** → ca **530 till**, alltså **M12–M25, 14 paket à 35–40**.
- Storlek: bulk 21,4 MB. `budget.total_cc0_kb_mobil` (25 000 KB) kontrolleras inte av något skript och modellerna hämtas först när ordet används (förladdat 0 KB, ingen precache av GLB). Dubblingen ger ca 43 MB. **Förslag:** höj siffran till 50 000 i M12 (en rad i `data/inlagg.json`) och håll snittet ≤ 45 KB per modell (texturer 512 → 256 där det går).

## Räkning mot målet (uppdaterad 2026-10-20 02:50, efter MFIX och M16-underlaget)
**En baslinje:** antalet rader i `data/tillgangar.json` (det spelet kan visa). Start i kväll 577, mål 2 × 577 = **1 154**.
Doodles räkning (598 → 702) räknar alla `.glb`-filer i repot, även 21 filer som inte är tillgångar (gamla modeller, natur, tillbehör). Ökningen är densamma (+104); från och med nu gäller tillgangar.json.

| Läge | Tillgångar (tillgangar.json) | Kvar till 1 154 |
|---|---|---|
| Start i kväll (main b679a3d) | 577 | 577 |
| På main nu (M10–M14 körda av Doodle, f1f0880) | 681 | 473 |
| När Doodle har kört MFIX (18 rättade + drottning, bebis) | 683 | 471 |
| När Doodle har kört M15 (48) | 731 | 423 |
| När Doodle har kört M16 (39) | **770** | **384** |

Underlag klara: M10–M16 = 191 modeller, plus fixpaketet MFIX. Från M15 hämtas hela Kenney-kit direkt från kenney.nl (arkiv och License.txt ligger i varje inkorgsmapp, `_nedladdning/arkiv/`); det gav större paket (48 och 39).
Quaternius (quaternius.com) laddar sina paket via JavaScript och Google Drive och gick inte att hämta med skript; de Quaternius-paket som redan ligger i inkorgen används.

## Vad inkorgen räcker till
`/workspace/modell-inkorg` har 1 443 manifestrader, varav 899 oanvända (783 CC0). Men bara **164 ger ett nytt ord** (resten är varianter av ord som redan finns). Bland dem finns få barnord: mest katapulter, gravstenar och block. **Dubblingen kräver därför ny spaning** (Modellspanaren, 0 USD) före M12. Bästa källorna: Quaternius Ultimate Animated Character Pack och Ultimate Food Pack, KayKit Adventurers, Kenney Mini Characters, Watercraft och Retro Urban, Gobkit, samt egna lågpolymodeller med skriptet i `M10/bygg-inkorg.mjs` när ingen CC0 finns.

## Ordning (efter vad barn skriver mest: djur, saker, byggnader)
Underlag för ordningen: `data/kategori-ord.json` (barnens grundord) minus ord som redan har modell = **294 ord utan modell**. Det gäller för personer 29, mat 21, föremål 22, byggnader 12, natur 15 och växter 8 (`handling`, `egenskap`, `känsla` och `okänt` blir inte modeller). `data/saknade-ord.json` är tom ännu. När den fylls styr den ordningen.

Orden från M14 och framåt utöver kategori-ord är förslag. Kontrollera dem mot `data/ord.json` när paketet byggs.

| Paket | Innehåll (≈35–40) | Barnord utan modell som paketet täcker | Källa |
|---|---|---|---|
| **M11 ✔** | småkryp + nya djur (37) | fjäril, myra, gräshoppa, skalbagge, fluga, syrsa, loppa, mullvad, mås, skorpion, narval … | Gobkit (andra hämtningen), Quaternius |
| **M12 ✔** | människor och familj (19, CC0) | mamma, pappa, lärare, pojke, kung, cowboy, byggarbetare/arbetare, pirat, polis, farfar/morfar, chef, bror, kille, syster, kompis, sjörövare, scout, farbror, moster. **Kvar till M12b:** flicka, tjej, äventyrare, tjuv, soldat, prins (deras Quaternius-modeller ligger över 6 000 trianglar och går inte att förenkla med `M12/forenkla.mjs`), drottning, prinsessa, bebis, doktor, kock, brandman, clown, älva, mormor, farmor | Quaternius och Polygonal Mind via Poly Pizza (CC0, `polypizza-cc0-3`), Kenney Blocky Characters |
| **M13 ✔** | mat och fika (21, CC0) | pommes, lök, kniv, kaffe, te, ketchup, senap, bacon, salt, peppar, flingor, grillspett, limpa, grädde, milkshake, selleri, jordnötssmör, ris, spatel, nudlar, kött. **Kvar till M13b** (ingen CC0-modell i inkorgen): bulle, kanelbulle, popcorn, glasspinne, saft, juice, korvbröd, pasta, spagetti, sylt, smör, gurka, lakrits | Kenney Food Kit (`kenney-food-kit` + `kenney-food-kit-2`: fullständiga nedladdningen med texturen inbäddad, `M13/food2.mjs`) |
| **M14 ✔** | saker och leksaker (18, CC0) | boll/badboll, ballong, trumma (egna modeller), gitarr, badanka, batteri, brev, kuvert, hörlurar, mikrofon, paket, tvål, telefon/mobil, väckarklocka, väska, vattenkanna, kundvagn, korg. **Kvar till M14b** (ingen CC0-modell hittad eller över taket): cykel, docka, dator, kamera, fiol, piano, sko, strumpa, byxor, kam, ring, filt, flygplan, nalle, pussel, tärning, kortlek, jojo, kritor, ficklampa, pengar, kikare, tandborste, flöjt, skridskor, skidor | Poly Pizza CC0 (`polypizza-cc0-4`, Quaternius, CreativeTrio, Isa Lousberg, MiniPoly, reyshapes, iPoly3D), Kenney Mini Market (`kenney-mini-market-2`, texturen inbäddad), egna (`trollpennan-egna-m14`, `M14/egna-m14.mjs`) |
| **MFIX ✔** | rättelser efter Doodles granskning av M10–M14 (20, CC0) | **former:** 92 felaktiga böjningar rättade (alla bulkord från R3C, R3D och M1–M14, efter SALDO och SAOL-mönster, osäker plural utelämnad); **modeller:** svan (egen, lång hals, simmar), abborre/gädda/narval i profil, narval mindre, mask (egen rosa daggmask), mamma, pappa, lärare, pojke, cowboy, byggarbetare, pirat som Kenney-klossfigurer, ris (egen skål), kött (revben), bacon större, gitarr (egen akustisk), kniv = smörkniv (MilkAndBanana, CC0), nalle (nytt ord på nallebjörnen); **nya:** drottning (klossfigur med krona), bebis | egna (`trollpennan-mfix`, `MFIX/mfix-bygg.mjs`), Kenney Blocky Characters, Poly Pizza |
| **M15 ✔** | stad, båtar, fabrik, arkad, skyltar (48, CC0) | grävmaskin, fiskebåt, motorbåt, racerbåt, bogserbåt, husbåt, lastfartyg, boj, ufo, parabol, krater, skyskrapa, kontor, hotell, affär, fabrik, skorsten, solpanel, kiosk, bajamaja, parasoll, rullstol, krycka, käpp, sparkcykel, ramp, flipperspel, arkadspel, automat, kassaapparat, lyckohjul, airhockey, golfboll, golfklubba, robotarm, spak, lyftkran, magnet, stoppskylt, varningsskylt, elstolpe, trafikkon, byggställning, fana, tjej/flicka, skejtare, soldat, expedit (klossfigurer som alla människor) | Kenney Watercraft, City Commercial/Industrial/Roads, Coaster, Mini Characters/Skate/Arcade/Arena, Minigolf, Factory, Retro Urban, Tower Defense, Car, Space (hela kit, texturen inbäddad) |
| **M16 ✔** | kit + egna natur/rymd/väder (39, CC0) | slott, tivoli, katapult, propellerbåt, gatuskylt, vindkraftverk, cistern, dörr, fönster, halfpipe, dansmaskin, gamer, hangar, generator, suv, gravsten, kors, krypta, fjäder, julgran, pelare, mur, dator, tratt, hjärtstartare; egna: sol, måne, blixt, vulkan, istapp, ö, sandslott, diamant, pyramid, planet, komet, regndroppe, tornado, kub/kloss | Kenney (hela kit) + `trollpennan-egna-m16` (`M16/egna-m16.mjs`) |
| M17 | fordon och båtar | brandbil, polisbil, ambulans, sopbil, grävmaskin, traktor-varianter, segelbåt, kanot, ubåt, helikopter | Kenney Car/Watercraft/Train (43 oanvända fordon i inkorgen) |
| M18 | djur 3: däggdjur och fåglar | B5b-bytena (gris, kulting, ekorre, bäver, haj, dinosaurie: kodritade idag) + lodjur, järv, mink, hermelin, trana, stork, kråka, skata, nyckelpiga (egen modell, Poly Pizzas har 8 662 trianglar) | Gobkit, Quaternius, egna |
| M19 | sagoväsen | enhörning-varianter, troll, tomte, älva, sjöjungfru, vampyr, häxa (72 oanvända i inkorgen) | Quaternius Monsters, KayKit |
| M20 | hem och kök | (variantord: säng, lampa, kastrull, tallrik, kopp, matta … de som saknas) | Kenney Furniture (27 oanvända) |
| M21 | högtider | julgran, adventskrans, krans, snögubbe-varianter, pumpa, påskägg | Kenney/KayKit Holiday (23 oanvända), Halloween |
| M22 | rymd och teknik | raket-varianter, astronaut, satellit, ufo, robot-varianter, teve | Kenney Space (12 oanvända) |
| M23 | lek och sport | gunga, rutschkana, sandlåda, fotboll, mål, studsmatta, drake (leksak) | Kenney Playground/Minigolf |
| M24–M25 | varianter av de 50 vanligaste orden (hund, katt, häst, bil, hus, träd …) | andra modellen per ord ger "en till" som ser annorlunda ut | alla |

Varje paket körs som M10 och M11: `bash rundor/R3F-modellserie/kor.sh M<n>` → push, PR, merge. Paketet består av `urval.txt`, rader i `manifest-serie.tsv`, `tillval-serie.tsv` och `forvantat.tsv`, **`former.tsv` (krävs när paketet har djur- eller människoord)**, samt valfritt `gator.json`, `inlagg-tillagg.json`, `test.patch` och `bort.txt` (fixpaket: entiteter som tas bort och läggs in igen).

## Regler som M10/M11 lärde oss
- Ord som blir sammansättningar av befintliga ord (silver+fisk) hoppas över. Kör `node scripts/modell-inlagg.mjs kontrollera … --urval M<n>/urval.txt` före `forvantat`.
- Taket är 6 000 trianglar per djur (Poly Pizzas nyckelpiga har 8 662). `gltf-transform simplify` räcker inte på den.
- Låga eller platta modeller behöver `malhojd_ord` (annars blir de 1,0 höga). Flygande småkryp behöver `undertyp_rorelse`.
- Ett paket som gör ett ord känt kan bryta ett test som använde ordet som "okänt" (M10: vägskylt). Lös det med `M<n>/test.patch`.
- Riggade Quaternius-figurer över taket: `M12/forenkla.mjs` (weld + meshopt simplify) klarar vissa (pappa, pojke, pirat), andra inte (sömmar i UV och normaler).
- Orienteringsgissningen tar fel på stående figurer med ryggsäck/mantel (pappa gissades -z): sätt `fram` = `+z` i tillval-serie.tsv och titta på kontaktarket. Quaternius King var mörk av sig själv; M12 bygger kungen av Kenney character-a + Quaternius Crown (`M12/kung-krona.mjs`).
- Id-krockar: `lök` gav id `lok`, som redan är ånglok (R3F-M4). Ge id manuellt i tillval-serie.tsv (`lokmat`).
- Taket är **6 000 trianglar per sak i alla kategorier** från MFIX (`kategori_tri` i MFIX/inlagg-tillagg.json). Förenkla inte under det: gitarren fick en taggig klump av förenklingen 2 325 → 1 393.
- Liggande modeller ställs upp med `M14/upprest.mjs` (rotation runt x). Kenney-GLB ur fullständiga nedladdningar har texturen i en separat fil; bädda in med `M14/kenney-inbadda.mjs`.
- Poly Pizza söks med `M14/pp-sok.py` (bara CC0-träffar). Licensen läses på varje modellsida innan filen tas in.
- Filnamn med versaler eller understreck (Kenney Space Kit: `hangar_roundA`) ger FEL i lagg; byt till `hangar-rounda.glb` i inkorgen.
- Kenney Blocky Characters använder `KHR_materials_unlit`; spelets material ger då sidfel (`reading 'value'`) i spelprovet. M12 tar härledda `character-*-belyst.glb` utan tillägget. Rättas i koden i en egen kodrunda.
- CC-BY (Poly by Google m.fl.) först efter R3E (kreditvisning för alla CC-BY i föräldradialogen).
- **Böjningsformer gissas inte längre.** lagg gissar ur ändelsen (vattensalamanderen, myrlejonar, knäppparar). Varje paket med djur- eller människoord har `M<n>/former.tsv` med formerna efter SALDO (`/workspace/ordbyggaren/tools/saldom.xml`) och SAOL-mönster; kor.sh stoppar (exit 3, allt återställt) om ett nytt ord saknar rad. Osäker plural utelämnas.
- **En stil för människor:** Kenney Blocky Characters. Nya personer görs med `MFIX/mfix-bygg.mjs` (omfärgad tröja + klosshatt eller krona). Inga Quaternius- eller Mini-figurer (T-pose, bleka, smala).
- Fiskar och narval visas i profil (`fram` = `+x`), annars ser de ut att stå på stjärten när de vänder sig mot kameran.
- Simmare på ängen hamnar vid dammens kant (koden placerar dem så); stora simmare behöver låg målhöjd (narval 0,5).
