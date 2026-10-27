# Runda W1: Mobiloptimerad sagografik

## Show that
Procedur-PMREM (`useSagomiljo`), `forbattraModellMaterial`, `skapaKontaktSkugga` och Half-Lambert/Fresnel i `belys.ts` är aktiva på Ängen och Gården.

På `375×812` mätte Playwright `window.__tred` till **73 draw calls** (`<= 95`) och **21740 trianglar** (`<= 120000`).

## Vad som sitter i scenen
- `src/spel/grafikKvalitet.ts` bakar en varm daghimmel (`#e8bb81` / `#ffdfa8` / `#63965a`) och en natt-himmel (`#263858` / `#52729a` / `#234b45`) med `PMREMGenerator`, en gång per renderer och läge. `useSagomiljo(natt > 0.55)` sätter `scene.environment` på Ängen, utflyktsplatserna och Gården (`useSagomiljo(false)`).
- `forbattraModellMaterial` klämmer `roughness` till `0.45–0.95`, `metalness` till `0–0.28`, sätter `envMapIntensity = 0.65` och lägger på samma Slime-glöd som övriga modeller.
- `belys.ts` behåller `trollpennan-slime-rim-v1` och `belystFran: "KHR_materials_unlit"`. Shaderkoden kör Half-Lambert (`dotNL * 0.52 + 0.48`), varma skuggtoner `vec3(0.145, 0.427, 0.231)` och `vec3(0.306, 0.212, 0.161)`, samt gyllene Fresnel `smoothstep(0.52, 0.94, …)` med rim `vec3(1.0, 0.92, 0.72)`. Ingen `EffectComposer`.
- Djurens hårda markcirkel är bytt mot den delade gaussiska kontaktskuggan `#463323` (`skapaKontaktSkugga`), med `depthWrite: false`.

## Prov
- `prov-w1-w4.mjs --snabb --steg=w1`: grön (`w1StatiskOk`, 174 unika / 179 `data-testid`).
- `npm run check:struktur`: grön.
- `npx tsc --noEmit`: grön.
- `b6-1.test.ts`, `miljo.test.ts`, `v9b.test.ts`: 12 gröna.
- `prov-w1-w4.mjs --steg=w1`: grön, `calls` 73, `tris` 21740.
