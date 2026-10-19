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

## Så blev det (patch `b41.patch` + `b41-data.mjs` + `kor.sh`), version 2: fast ljuspool
- Rena funktioner i `src/spel/ljuskalla.ts` (inte i `miljo.ts`/`platsDekor.ts`, för färre krockar med R9K och M10–M13):
  - `ljuskallaFor(plats)`: radie = andel av ytans bredd, intensitet × 8.
  - `lyserVad(spec)`: kroppen ("en lykta") eller den första saken djuret har med sig ("en kanin med en lykta").
  - `valjLjus(djur)`: högst 4, de senast skapade.
- **Inga shader-ombyggen** (Arkitektens beslut): three.js bygger om shadrarna när antalet ljus ändras, och det hackar på mobil. Därför:
  - `PlatsScen` monterar en **fast pool med 4 punktljus**, `LjusPool` i `ang/ljusken.tsx`, utan skugga och med decay 1.2. Den monteras bara på platser vars `ljuskalla_skapad` har en `entiteter`-lista, och inte på kvalitet låg. Ängen, skogen och sjön får alltså noll extra ljus.
  - Lediga ljus har intensitet 0 och ligger på y = −60.
  - `DjurIScen` ritar bara `Ljusken`: en markör (Object3D) där ljuset ska sitta, vid kroppen eller vid saken, och ljuspölen på marken.
  - Markörerna registreras i en liten modul-Map (uid → Object3D). Poolen läser deras världsläge varje bildruta och sätter färg, styrka och läge enligt `valjLjus`. Antalet ljus i scenen ändras aldrig.
- På kvalitet låg blir det ljuspöl utan punktljus. `emissive` används inte, eftersom GLB-materialen delas mellan kopior.
- Data läggs in per nyckel med `b41-data.mjs`: `grottan.miljo.ljuskalla_skapad.entiteter` = lykta, lampa, golvlampa, bordslampa, ljusslinga, ljus, fackla, lagereld, kristall. Ficklampa, nattlampa och taklampa finns inte som entiteter än. Skogen och sjön slås på med en rad data.
- Provhook `window.__ljus = { ljus, pol, aktiva, scen, program }`: poolens ljus, ljuspölar, tända ljus, punktljus i hela scenen och antal shaderprogram (`renderer.info.programs`).

## Mätt (swiftshader, 375x812, grottan)
- Närområdet blir +15.2 i ljushet (0–255) med lykta, mot +1.0 med bok.
- Punktljus i scenen: 5 hela tiden, alltså poolens 4 plus SagaPennans eget, tom grotta → 5 lyktor. Shaderprogram 13, 13, 13, 13, 13 medan lyktorna 1–5 skapas.
- Längsta bildrutan när ett djur skapas, för skapelse 2–5: median 150 ms för lykta och 175 ms för bok. I version 1, där ljuset satt i DjurIScen, var det 530–780 ms mot 130–400 ms.
- Draw calls med 5 kaniner: 99.6 med lyktor, 95.8 med böcker. Det blir ungefär 1 per ljuspöl, och punktljusen ger inga draw calls.
- fps med 5 kaniner: 11.5 med lyktor, 7.9 med böcker. Swiftshader på CPU brusar mellan körningar, så det är bara en grov jämförelse. Kostnaden för 4 punktljus i shadern finns nu alltid i grottan, även när inget lyser.
