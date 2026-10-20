# Dubblingen av modellerna (Christoffers önskan: dubbelt så många) – Arkitektens plan, 2026-10-20

## Nuläge (räknat i `data/tillgangar.json` på main b679a3d)
- **577 tillgångar** (576 GLB-filer: 567 i `public/models/bulk` + 9 första modeller; 1 rad utan fil). Per runda: R3D 234, R3C 43, M1 39, M2 34, M3 40, M4 39, M5 34, M6 28, M7 26, M8 34, M9 16, de första 10.
- Entiteter med modell: föremål 316, djur 152, natur 53, byggnad 40, tillbehör 15.
- Efter **M10 (B5a, 9)** och **M11 (37)**: 623. **Mål ≈ 1 150** → ca **530 till**, alltså **M12–M25, 14 paket à 35–40**.
- Storlek: bulk 21,4 MB. `budget.total_cc0_kb_mobil` (25 000 KB) kontrolleras inte av något skript och modellerna hämtas först när ordet används (förladdat 0 KB, ingen precache av GLB). Dubblingen ger ca 43 MB. **Förslag:** höj siffran till 50 000 i M12 (en rad i `data/inlagg.json`) och håll snittet ≤ 45 KB per modell (texturer 512 → 256 där det går).

## Räkning mot målet (uppdaterad 2026-10-20, efter M14-underlaget)
Målet är dubbelt så många som vid starten i kväll: 2 × 577 = **1 154 tillgångar**.

| Läge | Tillgångar | Kvar till 1 154 |
|---|---|---|
| Start i kväll (main b679a3d) | 577 | 577 |
| På main nu (M10 och M11 körda av Doodle, d0ab870) | 623 | 531 |
| När Doodle har kört M12 (19), M13 (21) och M14 (18) | **681** | **473** |

Underlag klara: M10–M14 = 104 modeller (18 % av vägen). Snittet har sjunkit från 37 till ca 20 per paket, eftersom inkorgen och Poly Pizzas sökning är tomma på många barnord. Resten kräver egna modeller (som boll, trumma och ballong i M14) eller nya CC0-källor.

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
| M15 | byggnader | skola, sjukhus, slott, borg, butik, cirkus, fabrik, garage, hotell, museum, bibliotek, biograf, ladugård, fyr | Kenney City/Fantasy Town, Quaternius Medieval Village (36 oanvända byggnader i inkorgen) |
| M16 | natur, väder, växter | sol, måne, regn, snö, blixt, vulkan, ö, is, ros, tulpan, solros, maskros, lönn, löv, bär | Kenney Nature, Quaternius Stylized Nature (119 oanvända växter), egna |
| M17 | fordon och båtar | brandbil, polisbil, ambulans, sopbil, grävmaskin, traktor-varianter, segelbåt, kanot, ubåt, helikopter | Kenney Car/Watercraft/Train (43 oanvända fordon i inkorgen) |
| M18 | djur 3: däggdjur och fåglar | B5b-bytena (gris, kulting, ekorre, bäver, haj, dinosaurie: kodritade idag) + lodjur, järv, mink, hermelin, trana, stork, kråka, skata, nyckelpiga (egen modell, Poly Pizzas har 8 662 trianglar) | Gobkit, Quaternius, egna |
| M19 | sagoväsen | enhörning-varianter, troll, tomte, älva, sjöjungfru, vampyr, häxa (72 oanvända i inkorgen) | Quaternius Monsters, KayKit |
| M20 | hem och kök | (variantord: säng, lampa, kastrull, tallrik, kopp, matta … de som saknas) | Kenney Furniture (27 oanvända) |
| M21 | högtider | julgran, adventskrans, krans, snögubbe-varianter, pumpa, påskägg | Kenney/KayKit Holiday (23 oanvända), Halloween |
| M22 | rymd och teknik | raket-varianter, astronaut, satellit, ufo, robot-varianter, teve | Kenney Space (12 oanvända) |
| M23 | lek och sport | gunga, rutschkana, sandlåda, fotboll, mål, studsmatta, drake (leksak) | Kenney Playground/Minigolf |
| M24–M25 | varianter av de 50 vanligaste orden (hund, katt, häst, bil, hus, träd …) | andra modellen per ord ger "en till" som ser annorlunda ut | alla |

Varje paket körs som M10 och M11: `bash rundor/R3F-modellserie/kor.sh M<n>` → push, PR, merge. Paketet består av `urval.txt`, rader i `manifest-serie.tsv`, `tillval-serie.tsv` och `forvantat.tsv`, samt valfritt `gator.json`, `inlagg-tillagg.json` och `test.patch`.

## Regler som M10/M11 lärde oss
- Ord som blir sammansättningar av befintliga ord (silver+fisk) hoppas över. Kör `node scripts/modell-inlagg.mjs kontrollera … --urval M<n>/urval.txt` före `forvantat`.
- Taket är 6 000 trianglar per djur (Poly Pizzas nyckelpiga har 8 662). `gltf-transform simplify` räcker inte på den.
- Låga eller platta modeller behöver `malhojd_ord` (annars blir de 1,0 höga). Flygande småkryp behöver `undertyp_rorelse`.
- Ett paket som gör ett ord känt kan bryta ett test som använde ordet som "okänt" (M10: vägskylt). Lös det med `M<n>/test.patch`.
- Riggade Quaternius-figurer över taket: `M12/forenkla.mjs` (weld + meshopt simplify) klarar vissa (pappa, pojke, pirat), andra inte (sömmar i UV och normaler).
- Orienteringsgissningen tar fel på stående figurer med ryggsäck/mantel (pappa gissades -z): sätt `fram` = `+z` i tillval-serie.tsv och titta på kontaktarket. Quaternius King var mörk av sig själv; M12 bygger kungen av Kenney character-a + Quaternius Crown (`M12/kung-krona.mjs`).
- Id-krockar: `lök` gav id `lok`, som redan är ånglok (R3F-M4). Ge id manuellt i tillval-serie.tsv (`lokmat`).
- Föremål har taket **1 500 trianglar** (djur och människor 6 000). `M12/forenkla.mjs <in> <ut> 1400` klarar många (gitarr 2 325 → 1 393).
- Liggande modeller ställs upp med `M14/upprest.mjs` (rotation runt x). Kenney-GLB ur fullständiga nedladdningar har texturen i en separat fil; bädda in med `M14/kenney-inbadda.mjs`.
- Poly Pizza söks med `M14/pp-sok.py` (bara CC0-träffar). Licensen läses på varje modellsida innan filen tas in.
- Kenney Blocky Characters använder `KHR_materials_unlit`; spelets material ger då sidfel (`reading 'value'`) i spelprovet. M12 tar härledda `character-*-belyst.glb` utan tillägget. Rättas i koden i en egen kodrunda.
- CC-BY (Poly by Google m.fl.) först efter R3E (kreditvisning för alla CC-BY i föräldradialogen).
