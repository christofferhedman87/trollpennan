# Dubblingen av modellerna (Christoffers önskan: dubbelt så många) – Arkitektens plan, 2026-10-20

## Nuläge (räknat i `data/tillgangar.json` på main b679a3d)
- **577 tillgångar** (576 GLB-filer: 567 i `public/models/bulk` + 9 första modeller; 1 rad utan fil). Per runda: R3D 234, R3C 43, M1 39, M2 34, M3 40, M4 39, M5 34, M6 28, M7 26, M8 34, M9 16, de första 10.
- Entiteter med modell: föremål 316, djur 152, natur 53, byggnad 40, tillbehör 15.
- Efter **M10 (B5a, 9)** och **M11 (37)**: 623. **Mål ≈ 1 150** → ca **530 till**, alltså **M12–M25, 14 paket à 35–40**.
- Storlek: bulk 21,4 MB. `budget.total_cc0_kb_mobil` (25 000 KB) kontrolleras inte av något skript och modellerna hämtas först när ordet används (förladdat 0 KB, ingen precache av GLB). Dubblingen ger ca 43 MB. **Förslag:** höj siffran till 50 000 i M12 (en rad i `data/inlagg.json`) och håll snittet ≤ 45 KB per modell (texturer 512 → 256 där det går).

## Vad inkorgen räcker till
`/workspace/modell-inkorg` har 1 443 manifestrader, varav 899 oanvända (783 CC0). Men bara **164 ger ett nytt ord** (resten är varianter av ord som redan finns). Bland dem finns få barnord: mest katapulter, gravstenar och block. **Dubblingen kräver därför ny spaning** (Modellspanaren, 0 USD) före M12. Bästa källorna: Quaternius Ultimate Animated Character Pack och Ultimate Food Pack, KayKit Adventurers, Kenney Mini Characters, Watercraft och Retro Urban, Gobkit, samt egna lågpolymodeller med skriptet i `M10/bygg-inkorg.mjs` när ingen CC0 finns.

## Ordning (efter vad barn skriver mest: djur, saker, byggnader)
Underlag för ordningen: `data/kategori-ord.json` (barnens grundord) minus ord som redan har modell = **294 ord utan modell**. Det gäller för personer 29, mat 21, föremål 22, byggnader 12, natur 15 och växter 8 (`handling`, `egenskap`, `känsla` och `okänt` blir inte modeller). `data/saknade-ord.json` är tom ännu. När den fylls styr den ordningen.

Orden från M14 och framåt utöver kategori-ord är förslag. Kontrollera dem mot `data/ord.json` när paketet byggs.

| Paket | Innehåll (≈35–40) | Barnord utan modell som paketet täcker | Källa |
|---|---|---|---|
| **M11 ✔** | småkryp + nya djur (37) | fjäril, myra, gräshoppa, skalbagge, fluga, syrsa, loppa, mullvad, mås, skorpion, narval … | Gobkit (andra hämtningen), Quaternius |
| M12 | människor och yrken | mamma, pappa, bebis, barn, flicka, pojke, kung, drottning, prins, prinsessa, pirat, polis, brandman, doktor, kock, clown, cowboy, lärare, bagare, älva, mormor/morfar/farmor/farfar, syster, bror, kompis | Quaternius Characters, KayKit Adventurers, Kenney Mini Characters (+ blocky-characters i inkorgen) |
| M13 | mat och fika | bulle, kanelbulle, pannkaka, popcorn, pommes, glasspinne, saft, juice, kaffe, korvbröd, nudlar, pasta, spagetti, ris, sylt, smör, ketchup, gurka, lakrits, lök | Kenney Food Kit (27 oanvända), Quaternius Food |
| M14 | saker och leksaker | ballong, boll, cykel, docka, dator, telefon, kamera, gitarr, fiol, piano, trumma, sko, strumpa, vante, byxor, väska, kam, ring, filt, flygplan | Kenney Toy/Furniture/Car, KayKit, Quaternius |
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
- CC-BY (Poly by Google m.fl.) först efter R3E (kreditvisning för alla CC-BY i föräldradialogen).
