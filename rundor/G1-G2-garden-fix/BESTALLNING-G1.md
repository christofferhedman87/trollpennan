# BESTALLNING-G1 — Gårdens 3D-visualisering (`MeshoptDecoder` + isolerad `<Suspense>`), Byggnadsskala (`>= 56×56 px`), Varm 3D-Sockel & Ren Gårds-HUD (`375×812`)

## 1. Mål i spelarord
När barnet bygger en skapelse på Gården (t.ex. `"ett tält"` eller `"ett rött hus"`) ska byggnaden dyka upp omedelbart som en riktig, välbelyst 3D-modell med varm trä-/sandstenssockel, mättad sagofärg och rejäl skärmstorlek (`>= 56×56 px`, minst `>= 52×48 px` i projicerad 2D-skärmruta på `375×812` och `375×640`) — utan att skymmas av en dubblett-pratbubbla, utan en kvarglömd 2D-CSS-lykta och med exakt **en** tydlig `"🏡 Till Ängen"`-knapp i topp-HUD:en.

## 2. Underlag på disk (läs endast vid behov — blåkopian nedan är komplett)
- `/workspace/kod-inkorg/g1-g2/spaning.md` (Sektion 1 & 2: rotorsaksanalys och exakt ritning för `G1`)
- `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 13.1 & 13.2: byggnadsskala, 3D-sockel och mättad sagofärg)
- `/workspace/trollpennan-nulage/kritik-g1-g2.md` (Del 1–3: låsta acceptansmått `AC-G01`..`AC-G03`)
- `rundor/G1-G2-garden-fix/GRIND.md`

**Färdigbyggarkompetens:** Följ `3d-web-game-check`, `stylized-3d-art-direction` och `typescript-best-practices`. Gör första kodändringen inom 10 verktygsanrop. Budget: `--max-turns 40`.

---

## 3. Blåkopia i prioritetsordning

### Steg 1 — `MeshoptDecoder` i `src/spel/modeller/forladda.ts` & `src/spel/gard/ByggModell.tsx` + synkron `useMemo` och varm 3D-sockel
1. **`src/spel/modeller/forladda.ts` (rad 1 & 42):**
   - Importera `MeshoptDecoder` från `"three-stdlib"` och definiera:
     ```ts
     import { MeshoptDecoder } from "three-stdlib";
     export const kopplaMeshopt = (loader: { setMeshoptDecoder?: (d: unknown) => void }) => {
       loader.setMeshoptDecoder?.(MeshoptDecoder);
     };
     ```
   - På rad 42 i `steg()`: ändra `else useGLTF.preload(url);` till `else useGLTF.preload(url, false, false, kopplaMeshopt);`.
   - **VIKTIGT (`src/spel/v9b.test.ts`):** Behåll `export function forladdaNarLedig`, `requestIdleCallback`, `setTimeout(steg, 120)` och `1600` exakt så att `v9b.test.ts` är 100 % grön!

2. **`src/spel/gard/ByggModell.tsx` (`<= 320` rader):**
   - Behåll exakt raden `forladdaNarLedig(FILER);` på rad 31 (krävs av `src/spel/v9b.test.ts:30`).
   - Importera `kopplaMeshopt` från `../modeller/forladda.ts` och `skapaKontaktSkugga` från `../grafikKvalitet.ts` (eller skapa en varm kontaktskugga + sockel).
   - I `KlonadScen`:
     - Byt `const gltf = useGLTF(url);` mot `const gltf = useGLTF(url, false, false, kopplaMeshopt);`.
     - Byt `useState + useEffect` (som ger en tom `return null`-bildruta vid uppsläpp ur `<Suspense>`) mot **synkron `useMemo`** som klonar `gltf.scene`, anropar `belysScen(gltf.scene)`, `if (passa) passaByggnad(k, malhojd, maxBredd, skala);`, `egnaMaterial(k, fargHex, takFargHex, fonsterAntal)` och `skuggaUtanTraff(k, klickbar)`:
       ```tsx
       const scen = useMemo(() => {
         belysScen(gltf.scene);
         const k = gltf.scene.clone(true);
         if (passa) passaByggnad(k, malhojd, maxBredd, skala);
         egnaMaterial(k, fargHex, takFargHex, fonsterAntal);
         skuggaUtanTraff(k, klickbar);
         return k;
       }, [gltf.scene, malhojd, maxBredd, skala, fargHex, passa, takFargHex, fonsterAntal, klickbar]);
       ```
     - Behåll `useEffect` för att uppdatera `window.__gard3d` med `inspekteraHus3D(scen)` (samt `reservAktiv: false`) och returnera `() => slappMaterial(scen)` vid unmount.
   - I `HusBit`:
     - Läs `const farg = b.fargHex ?? rad?.farg ?? "#D84315";`, `const skala = (rad as { skala?: number } | undefined)?.skala ?? 1;` och `const rotY = (rad as { rotY?: number } | undefined)?.rotY ?? 0;`.
     - **Skicka alltid `fargHex={farg}`** till `<KlonadScen>` (inte `b.fargHex` som är `null` när barnet bara skriver `"ett tält"`!).
     - **Ta bort `if (!rad?.fil) return null;`**: om `!rad?.fil` (t.ex. `damm`, `studsmatta`, `sandlåda`, `rutschkana`) ska `HusBit` rendera `reserv` (`<ReservForm slag={slag} farg={farg} hojd={hojd} />`) inuti `<TryckYta>` på sin sockel!
     - Lägg en varm rundad **3D-sockel + kontaktskugga** under varje cell-byggnad i `<group position={[wx, 0, wz]} scale={storlekSkala}>`:
       ```tsx
       <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow raycast={() => undefined}>
         <circleGeometry args={[0.74, 24]} />
         <meshBasicMaterial color="#245832" transparent opacity={0.34} depthWrite={false} />
       </mesh>
       <mesh position={[0, 0.035, 0]} receiveShadow castShadow raycast={() => undefined}>
         <cylinderGeometry args={[0.58, 0.64, 0.07, 24]} />
         <meshStandardMaterial color="#E6C79C" roughness={0.85} metalness={0.02} />
       </mesh>
       ```
     - Omslut varje byggnads `<KlonadScen>` med `<ModellGren reserv={reserv}><Suspense fallback={reserv}>` inuti `<group position={[0, 0.06, 0]} rotation={[0, rotY, 0]}>` så att sockeln och reserven visas i 0 ms medan GLB laddas, och ett fel i en modell aldrig påverkar markplanet eller andra byggnader.

### Steg 2 — `<Bounds fit clip margin={0.86} maxDuration={0}>` runt `<MarkPlan>` i `src/spel/gard/Garden3D.tsx`
1. I `src/spel/gard/Garden3D.tsx` (`<= 340` rader):
   - Låt `<Bounds fit clip margin={0.86} maxDuration={0}>` omsluta `<MarkPlan ... />` (och den osynliga `6×10`-referensplattan om så önskas, **utan** `observe` och **utanför** modell-`<Suspense>`), så att gårdsmarken aldrig blinkar bort och kamerans ortografiska zoom på `375×812` lyfter fram tomten (`zoom ≈ 38–42`).
   - Justera kamerans blickpunkt något uppåt/bakåt (`c.lookAt(0, 0.15, 0.25)`) så att tomten ligger perfekt centrerad i det fria 3D-fönstret mellan topp-bannern (`bottom <= 135 px`) och bottendockan (`top >= viewH - 86 px`).
   - Dämpa överexponering på Gården genom att sänka extraljuset `<hemisphereLight args={["#FFF8E1", "#7CB342", 0.65]} />` till `0.38` så att mättade byggnadsfärger inte bränns ut till pastellrosa.
   - Uppdatera `window.__gard3d.byggen[i]` (via en liten hjälpare i `Scen` eller `KlonadScen`) så att varje bygge även exponerar:
     - `reservAktiv?: boolean` (`false` när `KlonadScen` har monterats för en GLB-byggnad)
     - `skarmBox?: { x: number; y: number; width: number; height: number }` (beräknad från byggnadens 3D-position och höjd/bredd projicerad genom aktiv kamera till canvasens CSS-pixlar).

### Steg 3 — Byggnadsskala (`maxBredd = 1.75` + `rad.skala`) och tältduksmaterial i `src/spel/gard/modellPrep.ts` & `data/gard-3d.json`
1. **`src/spel/gard/modellPrep.ts` (`<= 270` rader):**
   - Lägg till `TALT_DUK_MAT = new Set(["colorred", "fabric", "cloth", "canvas", "tent"])` och låt `arVaggNamn(namn: string)` (eller en hjälpare i `egnaMaterial`) behandla `TALT_DUK_MAT.has(namn.toLowerCase())` som huvudfärgsyta:
     - När `fargHex` är satt och materialet/meshen matchar `arVaggNamn(namn)` eller `TALT_DUK_MAT.has(namn.toLowerCase())`, sätt `k.color.set(fargHex)` direkt!
     - Säkerställ att `"red"`, `"blue"`, `"green"`, `"yellow"` **inte** ligger i `arOrordNamn` / `DETALJ_MAT` så att `colorRed` på `/models/bulk/talt.glb` alltid färgas med `fargHex`.
     - **Enhetstest-garanti (`src/spel/gard/v7b-gard.test.ts`):** `egnaMaterial(tre, "#e53935", "#1e88e5", 3)` på `Walls`, `Roof` och `Window_1..3` ska fortsätta ge exakt `wallsColorHex === "#e53935"`, `roofColorHex === "#1e88e5"` och rätt `synligaFonsterNoder`!
   - Uppdatera `passaByggnad`:
     ```ts
     export function passaByggnad(rot: THREE.Object3D, malhojd: number, maxBredd = 1.75, skala = 1): void {
       rot.scale.setScalar(1);
       rot.position.set(0, 0, 0);
       rot.updateMatrixWorld(true);
       BOX.setFromObject(rot);
       if (BOX.isEmpty()) return;
       BOX.getSize(STORLEK);
       const h = Math.max(STORLEK.y, 1e-4);
       const w = Math.max(STORLEK.x, 1e-4);
       const d = Math.max(STORLEK.z, 1e-4);
       const s = Math.min((malhojd * skala) / h, (maxBredd * Math.max(1, skala * 0.88)) / Math.max(w, d));
       rot.scale.setScalar(s);
       rot.updateMatrixWorld(true);
       BOX.setFromObject(rot);
       const cx = (BOX.min.x + BOX.max.x) / 2;
       const cz = (BOX.min.z + BOX.max.z) / 2;
       rot.position.set(-cx, -BOX.min.y, -cz);
       rot.updateMatrixWorld(true);
     }
     ```
2. **`data/gard-3d.json`:**
   - Uppdatera `"tält"` till:
     ```json
     "tält": { "fil": "/models/bulk/talt.glb", "tillgangId": "talt", "skala": 1.35, "rotY": 0.55, "malhojd": 1.45, "reserv": "hus", "farg": "#E65100" },
     ```
   - Justera även `"hus"` (`"farg": "#D32F2F"`, `"malhojd": 1.65`), `"stuga"` (`"malhojd": 1.45`), `"stall"` (`"skala": 1.35`, `"malhojd": 1.55`), `"koja"` (`"skala": 1.35`, `"malhojd": 1.25`, `"farg": "#8D5524"`), `"hundkoja"` (`"skala": 1.35`, `"malhojd": 1.15`, `"farg": "#8D5524"`) och `"lada"` (`"skala": 1.35`, `"malhojd": 1.55`, `"farg": "#C62828"`) så att alla byggnader blir tydliga (`>= 56×50 px`) och har stark kontrast (`ΔRGB >= 85`) mot gårdsgräset (`#49B652` / `#62B355`).
   - **OBS (`src/spel/gard/gard3d.test.ts`):** Behåll alla 36 nycklar i `gard-3d.json`, alla `fil`-sökvägar och alla `tillgangId` oförändrade!

### Steg 4 — Ren Gårds-HUD i `src/spel/styr/useSkapa.ts`, `src/spel/ui/AngLager.tsx`, `src/spel/ui/Hud.tsx` & `src/spel/gard/Garden3D.tsx`
1. **`src/spel/styr/useSkapa.ts:119` (HÅLL FILEN `<= 150` RADER!):**
   - På rad 118–119 i `hanteraBygg`: ta bort raden `visaBubbla(klarText, visat.x, Math.max(0.18, visat.y - 0.14), false, true, true, "tapp");` och behåll `visaBanner(klarText, "ovr", "tapp");` + `ljud.uppfylld();`.
   - Då visas `"Klart! Ett tält står på gården."` enbart i topp-bannern (`[data-testid="puff"]`) och täcker aldrig det nybyggda tältet. Filen minskar från 150 till 149 rader.
2. **`src/spel/ui/AngLager.tsx:76` (HÅLL FILEN `<= 260` RADER OCH BEHÅLL `data-testid="lykta"`!):**
   - På rad 76: lägg till `hidden style={{ display: "none" }}` på `<div className="lykta" data-testid="lykta" hidden aria-hidden style={{ display: "none" }}>` på exakt samma rad så att `npm run check:struktur` fortfarande räknar `1` förekomst av `data-testid="lykta"` samtidigt som den gamla 2D-lyktan aldrig syns ovanpå 3D-gården.
3. **`src/spel/ui/Hud.tsx:54–63` (HÅLL FILEN `<= 225` RADER!) & `src/spel/gard/Garden3D.tsx`:**
   - I `src/spel/ui/Hud.tsx:57`: lägg till `data-w3="vagvisare-knapp" data-plats="ang"` på samma rad som `data-f5="hem-angen"` på `.hem-angen-knapp` (behåll `ref={(el) => el?.setAttribute("data-testid", "hem-angen")}` så att `testid-baslinje.json` inte ändras!).
   - I `src/spel/gard/Garden3D.tsx`: ta bort `<VagvisareProjektor plats="garden" ... />` och `<Vagvisare3D plats="garden" ... />` (och rensa onödiga `Vagvisare`-importer i `Garden3D.tsx`), så att det på Gården bara finns **en enda** synlig `"🏡 Till Ängen"`-knapp i `.hud` (som samtidigt matchar både `[data-testid="hem-angen"]` och `[data-w3="vagvisare-knapp"][data-plats="ang"]` i `prov-w1-w4.mjs`!).
   - Säkerställ också att `"🦅 Se hela dalen"` (`[data-w4="vy-flyg-knapp"]`, i `FlygKameraV09.tsx` eller `SpelVy.tsx`) inte visas när `varld === "gard"`.

---

## 4. Verifiering & Commit
1. Kör snabbprovet för G1:
   - `npx tsx rundor/G1-G2-garden-fix/prov-g1-g2.mjs --snabb --steg=g1`
2. Kör enhets- och strukturtester:
   - `npm run check:struktur` (`0` fel, exakt `174` unika / `179` förekomster av `data-testid`)
   - `npx tsc --noEmit`
   - `npx tsx --test src/spel/gard/gard3d.test.ts src/spel/gard/v7b-gard.test.ts src/spel/v9b.test.ts`
3. Kör Playwright-verifieringen för G1:
   - `npx tsx rundor/G1-G2-garden-fix/prov-g1-g2.mjs --steg=g1 --ut /workspace/trollpennan-nulage/ko-28okt-g`
4. Skriv `RUNDAG1.md` med:
   - `Show that:` skapade byggnader (`"ett tält"`, `"ett rött hus"`) laddas med `MeshoptDecoder` och synkron `useMemo` på varm 3D-sockel med projicerad skärmyta `>= 52×48 px` på `375×812`, `0` skymmande `.bubbla`, `0` synliga `.lykta` och exakt `1` `"Till Ängen"`-knapp, med bevisbild `g1-garden-talt-375x812.png`.
5. Committa alla ändringar på grenen.
