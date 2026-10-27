# BESTALLNING-W1 — Mobiloptimerad Sagografik: Procedur-PMREM, Half-Lambert/Fresnel & Delade Kontaktskuggor (`375×812`)

## 1. Mål i spelarord
Alla 3D-modeller på Ängen, utflyktsplatserna (Skogen, Sjön, Grottan) och Gården ska få ett varmt, levande nordiskt sagoljus med dag-/natt-anpassade himmelsreflektioner (procedur-PMREM), sammetslena Half-Lambert-skuggor, gyllene Fresnel-kantglöd och mjuka varma kontaktskuggor mot marken — helt utan dyra post-processing-pass (`EffectComposer`) och med strikt mobilbudget (`window.__tred.calls <= 95`, `tris <= 120000` på `375×812`).

## 2. Underlag på disk (läs endast vid behov — blåkopian nedan är komplett)
- `/workspace/kod-inkorg/w1-w4/spaning.md` (Avsnitt 1: `belys.ts`, `grafikKvalitet.ts`, `angen3d.tsx`, `Garden3D.tsx`)
- `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 12.1: Procedur-PMREM, Half-Lambert, Fresnel & kontaktskuggor)
- `/workspace/copilot-v09-leverans/Trollpennan_World_And_Graphics_v0.9/03_DROP_IN_KALLKOD/src/spel/grafikKvalitet.ts`
- `rundor/W1-W4-levande-varld/GRIND.md`

**Färdigbyggarkompetens:** Följ `3d-web-game-check`, `stylized-3d-art-direction` och `typescript-best-practices`. Gör första kodändringen inom 10 verktygsanrop.

---

## 3. Blåkopia i prioritetsordning

### Steg 1 — Skapa `src/spel/grafikKvalitet.ts` (`<= 140` rader)
Skapa `src/spel/grafikKvalitet.ts` med följande exporterade funktioner:
1. **`skapaSagomiljoTextur(gl: THREE.WebGLRenderer, natt = false): THREE.Texture`**:
   - Använd en `WeakMap<THREE.WebGLRenderer, { dag?: THREE.WebGLRenderTarget; natt?: THREE.WebGLRenderTarget }>()` så att PMREM-texturen bara bakas en gång per renderer och läge (`dag` / `natt`).
   - Skapa en temporär `THREE.Scene` med `PMREMGenerator(gl)` (`pmrem.compileEquirectangularShader()`):
     - **Dag (`natt === false`):** `envScen.background = new THREE.Color("#e8bb81")`, himmelskupol (`SphereGeometry(18, 16, 12)`, `BackSide`, `#ffdfa8`), markhalva (`SphereGeometry(17.5, 16, 8, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5)`, `BackSide`, `#63965a`) och solpunkt (`SphereGeometry(2.8, 12, 12)` vid `[-3, 6, -5]`, `#fff0b5`).
     - **Natt (`natt === true`):** `envScen.background = new THREE.Color("#263858")`, himmelskupol `#52729a`, markhalva `#234b45` och månpunkt `#a8c6f2`.
   - Kör `pmrem.fromScene(envScen, 0.04)` i `try { ... } finally { pmrem.dispose(); kupolGeo.dispose(); markGeo.dispose(); solGeo.dispose(); kupolMat.dispose(); markMat.dispose(); solMat.dispose(); }` så att inget GPU-minne läcker.
2. **`frigoraSagomiljo(gl: THREE.WebGLRenderer): void`**:
   - Frigör ev. cachade `dag`/`natt`-renderTargets i `WeakMap` för `gl`.
3. **`useSagomiljo(natt = false): void`**:
   - R3F-hook (`useThree` + `useEffect`) som sätter `scene.environment = skapaSagomiljoTextur(gl, natt)` och återställer `scene.environment = tidigare` i cleanup.
4. **`forbattraModellMaterial(rot: THREE.Object3D): void`**:
   - Traverserar alla `THREE.Mesh` under `rot`, klämmer `MeshStandardMaterial` / `MeshPhysicalMaterial` till `roughness = Math.min(0.95, Math.max(0.45, m.roughness ?? 0.72))`, `metalness = Math.min(0.28, Math.max(0, m.metalness ?? 0.04))`, sätter `m.envMapIntensity = 0.65`, säkerställer `m.map.colorSpace = THREE.SRGBColorSpace` (om `m.map` finns) och anropar `appliceraSlimeGlod(m)`.
5. **`skapaKontaktSkugga(radie = 0.65): THREE.Mesh` & `frigoraKontaktSkugga(skugga: THREE.Mesh): void`**:
   - Cachad **delad** `64×64` gaussisk varm `THREE.DataTexture` (`RGBAFormat`, `RGB(70, 51, 35)`, alfa `Math.round(Math.exp(-r2 * 2.8) * 115)` för `r2 <= 1`) och **delad** `THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, toneMapped: false })`.
   - `skapaKontaktSkugga(radie)` skapar en `Mesh(new THREE.PlaneGeometry(radie * 2, radie * 2), deladMat)` med `rotation.x = -Math.PI / 2`, `position.y = 0.012`, `renderOrder = -1` och `userData.kontaktSkugga = true`.
   - `frigoraKontaktSkugga(skugga)` frigör bara `skugga.geometry` (aldrig den delade texturen/materialet).

### Steg 2 — Uppgradera `src/spel/belys.ts` (`<= 140` rader) med Half-Lambert & Fresnel
Uppdatera `src/spel/belys.ts`:
- **Behåll alla befintliga kontraktsinvarianter** från `src/spel/b6-1.test.ts`:
  - `SLIME_KEY = "trollpennan-slime-rim-v1"` som `customProgramCacheKey`.
  - `userData.belystFran = "KHR_materials_unlit"` när `MeshBasicMaterial` konverteras till `MeshStandardMaterial`.
  - `belysScen<T extends THREE.Object3D>(rot: T): T` returnerar `rot` och är idempotent vid upprepade anrop.
- I `belysMaterial` och `appliceraSlimeGlod`:
  - Kläm `std.roughness = Math.min(0.95, Math.max(0.45, std.roughness ?? 0.72))`, `std.metalness = Math.min(0.28, Math.max(0, std.metalness ?? 0.04))` och sätt `std.envMapIntensity = 0.65`.
  - Säkerställ i `onBeforeCompile` att shaderkoden innehåller både **Half-Lambert-omkartering** (`dotNL * 0.52 + 0.48` i kommentar/uttryck + varma skuggtoner `vec3(0.145, 0.427, 0.231)` / `vec3(0.306, 0.212, 0.161)`) och **gyllene Fresnel-kantljus** (`smoothstep(0.52, 0.94, 1.0 - max(dot(normalize(vNormal), normalize(vViewPosition)), 0.0))` med varm rim `vec3(1.0, 0.92, 0.72)`).

### Steg 3 — Koppla in `useSagomiljo` och varma kontaktskuggor i `angen3d.tsx`, `Garden3D.tsx` & `djur.tsx`
1. I `src/spel/angen3d.tsx` (`<= 380` rader):
   - Importera `useSagomiljo` och `forbattraModellMaterial` ur `./grafikKvalitet`.
   - Anropa `useSagomiljo(natt > 0.55)` i `Scen` (precis efter `const natt = nattStyrka(...)`).
2. I `src/spel/gard/Garden3D.tsx` (`<= 380` rader):
   - Importera `useSagomiljo` ur `../grafikKvalitet` och anropa `useSagomiljo(false)` i `Scen`.
3. I `src/spel/ang/djur.tsx` (`<= 260` rader):
   - Använd den varma gaussiska skuggtexturen eller `skapaKontaktSkugga`-stilen (`#463323` med mjuk kant, `depthWrite: false`) på djurens markskugga så att hårda mörka cirklar ersätts med mjuka varma kontaktskuggor.
4. **Rör inte** `data/miljo.json`-nycklarna (`#718957`, `#DCCB9B`, `#8A8595`, `0 < nara < fjarran <= 90`).

---

## 4. Verifiering & Commit
1. Kör det snabba provet:
   - `node --experimental-strip-types rundor/W1-W4-levande-varld/prov-w1-w4.mjs --snabb --steg=w1`
2. Kör enhets- och strukturtester:
   - `npm run check:struktur` (`0` filer `> 400` rader, exakt `174` unika / `179` totala `data-testid`)
   - `npx tsc --noEmit`
   - `node --experimental-strip-types --test src/spel/b6-1.test.ts src/spel/miljo.test.ts src/spel/v9b.test.ts`
3. Kör Playwright-verifieringen för W1:
   - `node --experimental-strip-types rundor/W1-W4-levande-varld/prov-w1-w4.mjs --steg=w1`
4. Skriv `RUNDAW1.md` med:
   - `Show that:` procedur-PMREM (`useSagomiljo`), `forbattraModellMaterial`, `skapaKontaktSkugga` och Half-Lambert/Fresnel i `belys.ts` är aktiva på Ängen och Gården med `calls <= 95` och `tris <= 120000` på `375×812`.
5. Committa alla ändringar på grenen.
