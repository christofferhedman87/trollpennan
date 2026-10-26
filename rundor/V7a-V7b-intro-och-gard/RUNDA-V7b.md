# Runda V7b — Gårdens byggsystem (skrivbyggande, CC0 3D-hus med fönster/tak/väggar & Byggbok utan överlapp)

## Sammanfattning
Runda V7b kopplar ihop gårdens skrivbyggande med Modellspanarens 6 CC0 1.0 `.glb`-husmodeller i `public/models/gard/`, separerar vägg- och takfärg (`Walls` utan `lerp(0.42)`, separat `Roof`), styr 3D-fönsternoder (`Window_1..3`, `Window_Side`) utifrån meningen (inklusive `"utan fönster"` / `"inga fönster"` / `"noll fönster"` → `0`), rättar bekräftelsetexten (`"Klart! Ett stort rött hus med blått tak och tre fönster står på gården."` utan dubbel-`"med"`), samt fixar Byggbokens layout på `375×812` med 0 px överlapp och tydlig `"✍️ Skriv & bygg"`-knapp (`data-v7b="bygg-skriv-knapp"`) och stängknapp (`data-v7b="stang-byggbok"`).

## Ändrade och nya filer
- `data/gard-3d.json` (67 rader): `hus`, `stuga`, `trädhus`, `pepparkakshus` och `lada` pekar på `v7-*.glb` i `/models/gard/`.
- `src/tolk/byggtolk.ts` (399 rader): Hanterar `"utan fönster"` / `"inga fönster"` / `"noll fönster"` (`antal: 0`) och bygger `formelBygg` utan dubbel-`"med"`.
- `src/spel/bygge.ts` (95 rader): Utökar `Bygge` med `storlekId?: "liten" | "stor"` samt hjälparna `takFargForBygge` och `fonsterAntalForBygge`.
- `src/spel/gard/byggTolk.ts` (56 rader, ny): Exporterar `tolkaByggMening` och `appliceraByggMening`.
- `src/spel/gard/modellPrep.ts` (225 rader): Ren väggfärg på `Walls` (utan `lerp(0.42)`), egen takfärg på `Roof`, synlighetsstyrning av `Window_1..3` & `Window_Side`, samt `inspekteraHus3D` (0 box-primitiver).
- `src/spel/gard/ByggModell.tsx` (254 rader): Skickar `takFargHex` och `fonsterAntal` till `egnaMaterial`, skalar efter `storlekId` och uppdaterar `window.__gard3d.byggen` med `inspekteraHus3D` (0 box-primitiver).
- `src/spel/gard/Garden3D.tsx` (263 rader): Exponerar full V7b-diagnostik i `window.__gard3d.byggen` (`wallsColorHex`, `roofColorHex`, `fonsterAntal`, `synligaFonsterNoder`, `storlekId`, `modellFil`, `formel`).
- `src/spel/styr/useSkapa.ts` (352 rader): Uppdaterar befintligt bygge på gården vid attribut-mening (`appliceraByggMening` + `ersattBygge`) och visar bekräftelse med stor bokstav efter `Klart!`.
- `src/spel/minneSparning.ts` (297 rader): Stödjer V7b-testsparning med `introSett: true` utan versionsfält.
- `src/spel/ui/Hud.tsx` (306 rader): Exponerar `topp-hud`, `hus-knapp` och `pennans-bok` på gården utan att ändra JSX-räkningen av `data-testid`.
- `src/spel/ui/BokSkarm.tsx` (376 rader) & `src/spel/ui/bok-p1.css` (123 rader): Byggboken har `top: 320 px` (`>= 58 px`, 0 px överlapp med topp-HUD), `data-v7b="stang-byggbok"` (`44×44 px`), `data-v7b="bygg-skriv-knapp"` (`139×44 px`), och 0 px överlapp mellan `.kort.bygg` (`bottom: 688`) och `[data-testid="bygg-last"]` (`top: 688`).
- `src/spel/gard/v7b-gard.test.ts` (95 rader, ny) & `package.json` (113 rader): Enhetstester för V7b byggtolkning, 3D-material/fönsternoder och Byggboksankare.

## Verifiering
- `prov-v7.mjs --snabb --del alla`: `ok: true, antalFel: 0`
- `prov-v7.mjs --del alla` (`375×812`): `ok: true, sidfel: 0, antalFel: 0`
- `prov-v4-v6.mjs --del alla` (`375×812`): `ok: true, sidfel: 0, antalFel: 0`
- `prov-v1-v3.mjs --del alla` (`375×812`): `ok: true, sidfel: 0, antalFel: 0`
- `npm run test:product`: 447 pass, 0 fail
- `npm run typecheck` & `npm run typecheck:pages`: 0 fel
- `npx eslint .`: 0 errors
- `npm run check:struktur`: GRÖN (`Spel.tsx: 49 rader; data-testid: 174 olika, 179 förekomster; ui-filer: 31`)
