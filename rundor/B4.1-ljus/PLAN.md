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

## Så blev det (patch `b41.patch` + `b41-data.mjs` + `kor.sh`)
- Avvikelser från planen: de rena funktionerna ligger i en egen fil, `src/spel/ljuskalla.ts`, i stället för i `miljo.ts`/`platsDekor.ts`. Det ger färre krockar med R9K och M10–M13. `lyserVad(spec)` ger vad som lyser: kroppen ("en lykta") eller den första saken djuret har med sig ("en kanin med en lykta").
- Med kvalitet `lag` blir det en ljuspöl utan `emissive`, eftersom GLB-materialen delas mellan alla kopior.
- Skenet = `ang/ljusken.tsx`, som ritas inne i `DjurIScen`, vid kroppen eller vid saken. Det består av ett `pointLight` utan skugga (`intensitet×8`, `distance = radie × ytans bredd`, `decay 1.2`) och en additiv ljuspöl på marken med en delad gradienttextur. På `lag` blir det bara ljuspölen.
- `PlatsScen` räknar `valjLjus` en gång per ändring. Högst 4 ljus, och de senast skapade (`skapad`) behålls.
- Data läggs in per nyckel med `b41-data.mjs`: `grottan.miljo.ljuskalla_skapad.entiteter` = lykta, lampa, golvlampa, bordslampa, ljusslinga, ljus, fackla, lagereld, kristall. Ficklampa, nattlampa och taklampa finns inte som entiteter än. Skogen och sjön har `ljuskalla_skapad` men ingen lista, så där lyser inget. De slås på med en rad data.
- Provhook: `window.__ljus = { ljus, pol }` räknar sken som visas.

## Mätt (swiftshader, 375x812, grottan)
- Närområdet runt kaninen blir +15.8 i ljushet (0–255) med lykta, mot +1.4 med bok.
- Draw calls med 5 kaniner: 102 med lyktor (4 sken), 96 med böcker. Det blir ungefär 1 per ljuspöl, plus lyktmodellen. Punktljuset ger inga draw calls.
- fps (swiftshader, CPU, därför bara relativt): 4.6 med 4 ljus mot 5.6 utan, alltså ungefär −18 % på mjukvaru-GPU. På en riktig GPU väntas betydligt mindre, men det är inte mätt.
- Risk: när antalet ljus ändras byggs shadrarna om. Längsta bildrutan när en lykta skapas är 530–780 ms, mot 130–400 ms när en bok skapas (swiftshader). Om det hackar på iPad kan man i nästa steg byta till 4 fasta punktljus i `PlatsScen` som flyttas och tänds. Då byggs inga shadrar om, men ljuset ligger inte i `DjurIScen`.
