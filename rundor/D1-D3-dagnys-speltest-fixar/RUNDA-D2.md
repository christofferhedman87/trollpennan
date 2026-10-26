# Runda D2 — Bisatser, bindeord (`som`/`har`/`med`/`och`/`är`/`kan`), påklädning & rumsscener

## Förändringar
1. **Funktionsord och adjektiv (`data/ord.json`, `data/kategori-ord.json`, `src/tolk/lexikon.ts`):**
   - Utökat `funktionsord.med` med `"har"`, `"bär"`, `"iförd"` samt rums-/riktningsprepositioner (`"bland"`, `"kring"`, `"runt"`, `"ur"`, `"från"`, `"mot"`, `"genom"`, `"mellan"`).
   - Utökat `funktionsord.som` med `"men"`, `"att"`, `"när"`, `"där"`, `"dit"`, `"så"`, `"än"`, `"fast"`, `"medan"`, `"eftersom"`, `"om"`, `"är"`, `"var"`, `"blir"`.
   - Lagt till adjektivet `"glad"` (`id: "glad"`, `klass: "egenskap"`, `former: ["glad", "glatt", "glada"]`, `motsats: "ledsen"`) i `data/ord.json` och tagit bort `"glad"` ur `data/kategori-ord.json`.
   - Prioriterat `funkOch` före `funkSom` i `src/tolk/lexikon.ts` så att `"och"` alltid ger `{ t: "funk", v: "och" }`.

2. **Bisats- och bindeordstolkning (`src/tolk/ochMening.ts`, `src/tolk/tolka.ts`):**
   - Skärpt `delaOchMening` och `"och"`-delningen i `tolka.ts` så att `"och"` aldrig delar meningen vid bisats-/hjälpverbs-/prepositionsinledning (`/^(?:som|kan|vill|ska|är|var|blir|har|bär|iförd|med|utan|på|i|vid|bredvid|under|bakom|framför)\b/i`) eller när högerledet saknar eget självständigt djur.
   - Lagt till `POSITIONS_VERB` (`sitter`, `står`, `ligger`, `vilar`, `bor`, `hänger`, `klättrar`, `rider` m.fl.) och `KROPPS_LAGEN` (`huvudet`, `ryggen`, `magen`, `nosen`, `svansen`, `marken`, `gräset` m.fl.) i `src/tolk/tolka.ts` så att de aldrig hamnar i `okanda` (0 reserv-ägg), och återställt `mode = "fore"` efter `POSITIONS_VERB` så att `"på en sten sitter en stor hund"` ger `kropp: "hund"`, `skala > 1`, `tillbehor: ["sten"]`, `okanda: []`.

3. **Fristående påklädning på plats (`src/spel/styr/useSkapa.ts`):**
   - Vid `utfall.typ === "behover_djur"` körs `laggPa(malDjur, text)` före `kanInteRita` så att fristående påklädningsfraser (`"har krona"`, `"med solglasögon"`, `"en hatt"`) klär på befintligt djur på ängen utan dubblettdjur eller reserv-ägg.

4. **Plattformsplacering och dubbel-offset-fix i 3D (`src/spel/ang/delat.ts`, `src/spel/ang/djur.tsx`, `src/spel/gard/GardDjur.tsx`):**
   - Exporterat `PLATTFORM_SAKER = new Set(["sten", "stubbe", "kudde", "matta", "bank", "bro"])` i `src/spel/ang/delat.ts`.
   - Plattformssak (`i === 0`) placeras vid `[0, 0, 0]` under djuret med `plattY = 0.14` och dämpad vandring (`vand * 0.08`), och övriga `medSaker` korrigeras med `[wx - x, 0, wz - z]` så att dubbel-offseten försvinner.
