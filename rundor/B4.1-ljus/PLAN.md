# B4.1 – lyktor som barnet skapar lyser i grottan (plan, patch i stället för Build)

Den gamla prompten (`rundor/BLOCK-platser/prompter/B4.1-ljuskallor.md`) skrevs före R8-2b. Så här löses de fem krockarna:

| | Krock | Lösning |
|---|---|---|
| a | `GltfSak` ritar också platsdekoren (`PlatsDekor.tsx:105`) | Ljuset läggs **inte** i `GltfSak`. Det läggs i `DjurIScen` (`ang/djur.tsx`), som bara ritar det barnet skapat. Dekorens lyktor/kristaller lyser inte. |
| b | En ensam "en lykta" ritas av `GltfDjur`, inte `GltfSak` | `DjurIScen` frågar `lyser(spec.kropp)` **och** `spec.tillbehor.some(lyser)`; samma ställe täcker båda vägarna. |
| c | Ingen läser `ljuskalla_skapad`; `radie` krockar med fasta 2.5 | Ny ren `ljuskallaFor(plats)` i `miljo.ts`: `{ farg, intensitet, avstand }` ur `miljo.ljuskalla_skapad`. `radie` är andel av ytans bredd (`platser.json yta.x`, 11): 0.24 × 11 ≈ 2.6, alltså samma storlek som 2.5 men i data. `intensitet × 8` som i prompten. Ingen `ljuskalla_skapad` (ängen) = inget ljus. |
| d | `GltfSak` vet inte sin plats | Behövs inte: `DjurIScen` har redan `plats` (Plats-objektet) från `PlatsScen`. |
| e | Ingen gräns "högst 4, de senast skapade" | Ny ren `valjLjus(djur, max = 4)` i `platsDekor.ts`: uid för de senast skapade (`skapad`) som lyser. `PlatsScen` räknar en gång och skickar `lyser`-bool till `DjurIScen`. |

**Vilka saker lyser:** listan i data, inte i `entiteter.json` (modellpaketen skriver där): `miljo.ljuskalla_skapad.entiteter` i `platser.json` för grottan, t.ex. `["lykta","lampa","ficklampa","golvlampa","nattlampa","ljusslinga","ljus","fackla","lagereld","kristall"]`, filtrerad mot entiteter som finns. `lyser(id, plats)` läser den.
**Kvalitet `lag`:** inget `pointLight`; sakens material får `emissive` = ljusfärgen (inga nya objekt per bildruta).
**Filer:** `miljo.ts`, `platsDekor.ts`, `ang/djur.tsx`, `ang/PlatsDekor.tsx`, `data/platser.json` (via datascript), test `b4-1.test.ts`, prov `b4-1-prov.mjs` (grottan utan/med "en katt med en lykta", ljusare pixlar runt lyktan; ängen på dagen oförändrad; 5 lyktor → 4 ljus).
