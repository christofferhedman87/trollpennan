# Runda W2 — Horisontvärld & 4 Riktade Biomer runt Ängen

## Levererat
1. **`src/spel/kenneyNatur.tsx` (337 rader `<= 400`):**
   - `geoGrupp()` konverterar icke-`Float32Array` `position`-attribut till `Float32Array(pos.count * pos.itemSize)` innan `geo.scale(...)` så att både Kenneys `Int16Array`-modeller och `Float32Array`-GLB-modeller (`w-*.glb`) skalar till rätt meterhöjd.
   - `slåIhopOfargade()` slår samman otexturerade multimaterial-grupper till ett `BufferGeometry` med `vertexColors: true`, och `InstansModell` stöder `cull?: boolean` (`frustumCulled={cull}`).
   - Inga förekomster av `useFrame`.
2. **`src/spel/ang/HorisontVarld.tsx` (181 rader `<= 220`):**
   - Exporterar `MIN_HORISONT_RADIE = 5.2`, `HorisontZon`, `horisontPositioner()` och `HorisontVarld()`.
   - Renderar de 4 riktade biomerna (`skogen` NV, `sjon` Ö, `grottan` NO, `garden` SV) med samtliga 48 objekt på `Math.hypot(x, z) >= 5.2`, sammanhängande horisontmarkplan (`<ringGeometry args={[4.8, 46, 64]} />` vid `y = -0.18`), sjöflik i öster och lågpoly-kullar/berg (`w-kulle-cc0.glb` & `w-berg-cc0.glb`, 0 `<sphereGeometry>`).
   - Köar GLB-modeller med `forladdaNarLedig(HORISONT_URLS)` i `useEffect` (0 `useGLTF.preload`) och sätter `window.__tredHorisont`.
3. **`src/spel/angen3d.tsx` (316 rader `<= 400`):**
   - Monterar `<HorisontVarld />` inuti `{angDekor && (...)}` i `Scen` och ersätter gamla 2D-`<Horisont />`.

## Verifiering på `375×812`
- `prov-w1-w4.mjs --snabb --steg=w2`: `ok: true, antalFel: 0`
- `prov-w1-w4.mjs --steg=w2`: `ok: true, antalFel: 0, calls: 74 (<= 95), tris: 25262 (<= 120000)`
- `npx tsc --noEmit`: 0 fel
- `npm run check:struktur`: GRÖN (`174` unika / `179` totala `data-testid`)
- `npm run test:product`: `450/450` PASS
- `npx vite build`: GRÖN
