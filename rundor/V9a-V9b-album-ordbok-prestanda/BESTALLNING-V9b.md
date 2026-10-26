# Beställning V9b (`--del 2`) — Mobilprestanda, stegvis GLB-förladdning via `requestIdleCallback` och mjuk offline-reserv

## Ett enda mål (One Goal)
Eliminera kallstartsflaskhalsen med `56` synkrona `.glb`-förladdningar vid modulimport, aktivera adaptiv R3F-rendering på mobil (`375×812`) och lägg in en mjuk offline-/laddningsreserv:
1. **Stegvis GLB-förladdning (`src/spel/modeller/forladda.ts`):** Ersätt de synkrona toppnivå-looparna med `useGLTF.preload` vid modulimport i `src/spel/gard/ByggModell.tsx` (`29 st`), `src/spel/kenneyNatur.tsx` (`19 st`) och `src/spel/gltfDjur.tsx` (`8 st`) med `forladdaNarLedig(urlLista)` som förladdar högst `2` GLB åt gången via `requestIdleCallback` (med `setTimeout(..., 120)`-fallback) först efter att startscenen har renderat sin första bildruta. Vid kallstart (`DOMContentLoaded` + `1500 ms`) får högst `≤ 12` `.glb`-förfrågningar skjutas iväg samtidigt i stället för `56`.
2. **Adaptiv R3F-rendering på mobil (`src/spel/angen3d.tsx` / `src/spel/Scen3D.tsx`):** Koppla in `<AdaptiveDpr pixelated />`, `<PerformanceMonitor>` och `<Bvh firstHitOnly>` från `@react-three/drei` med `dpr={[1, 1.5]}` som sänker DPR vid låg bilduppdatering utan att tappa pekinteraktion.
3. **Mjuk offline-/laddningsreserv (`src/spel/modeller/StjarnPuffReserv.tsx`):** Om en `.glb` eller `.mp3` saknas eller är offline fångas felet tyst (`0` okontrollerade `pageerror`, ingen engelsk `"ERROR"`-text) och den gyllene 3D-stjärnpuffen (`StjarnPuffReserv` ur `stilguide.md`) visas.

## Builder-skills att ladda och följa
- `3d-web-game-check`
- `stylized-3d-art-direction`
- `typescript-best-practices`
- `principle-prove-it-works`

## Specialistkällor att läsa före ändring
- `/workspace/kod-inkorg/V4-V9/spaning.md` (särskilt punkt 4 om de `56` synkrona `useGLTF.preload`-anropen och installerade `@react-three/drei@10.7.9` + `three-mesh-bvh@0.8.3`)
- `/workspace/trollpennan-nulage/stilguide.md` (`StjarnPuffReserv`)
- `/workspace/modell-inkorg/_blockserie-v/manifest-utkast.tsv` + `/workspace/modell-inkorg/_blockserie-v/BLOCKSERIE-V.md`
- `/workspace/granskning/2026-10-25/rapport.md`

## Exakta filer att ändra / skapa (Blueprint)
1. **`src/spel/modeller/forladda.ts`** (ny modul):
   - Exportera `forladdaNarLedig(urlLista: Iterable<string>): void`, `startaBakgrundsForladdning(): void` och `forladdningsStatus(): { koade: number; startade: number; forstaBildrutaKlar: boolean }`:
     - `forladdaNarLedig(urlLista)` lägger bara till unika `.glb`-URL:er i en intern kö (`ko`) utan att anropa `useGLTF.preload` synkront vid modulimport.
     - Först när `startaBakgrundsForladdning()` anropas (efter att `Canvas` `onCreated` har renderat sina två första `requestAnimationFrame`-bildrutor i `src/spel/angen3d.tsx` + en extra fördröjning på `1600 ms` efter första bildrutan så att kallstartsfönstret `DOMContentLoaded + 1500 ms` enbart laddar de modeller som faktiskt står i startscenen, `≤ 12` `.glb`!) börjar kön beta av högst **2 GLB åt gången** (`MAX_SAMTIDIGA = 2`) via `window.requestIdleCallback` (med `setTimeout(..., 120)` som fallback i Safari/WebKit/Node).
     - Varje `useGLTF.preload(url)` lindas i `try { useGLTF.preload(url); } catch { /* tyst reserv */ }`.

2. **Ersätt synkrona `useGLTF.preload`-loopar i de 3 modellfilerna:**
   - **`src/spel/gard/ByggModell.tsx`** (rad 28):
     - Ersätt `for (const fil of FILER) useGLTF.preload(fil);` med `forladdaNarLedig(FILER);`.
   - **`src/spel/kenneyNatur.tsx`** (rad 261) + skapa re-export **`src/spel/modeller/kenneyNatur.tsx`**:
     - Ersätt `for (const u of Object.values(URL)) useGLTF.preload(u);` med `forladdaNarLedig(Object.values(URL));`.
     - Viktigt för kallstart (`≤ 12` `.glb` vid `DOMContentLoaded + 1500 ms`): I `KenneyNatur` (`src/spel/kenneyNatur.tsx`), rendera basuppsättningen (de 7 kärnmodellerna för ängen: `ek`, `van`, `gran`, `rod`, `gul`, `sten`, `lilja`) direkt vid första bildrutan och montera de sekundära detaljmodellerna (`tjock`, `lila`, `svampr`, `svampt`, `stenl`, `gras`, `liljas`, `stig`, `staket`, `grind`, `stubbe`, `orm`) stegvis efter att `forstaBildrutaKlar` / `requestIdleCallback` triggat, så att startscenen vid `DOMContentLoaded + 1500 ms` begär högst `≤ 12` `.glb`-filer samtidigt (7 natur + 2 startdjur = 9 `.glb`!).
   - **`src/spel/gltfDjur.tsx`** (rad 416) + skapa re-export **`src/spel/modeller/gltfDjur.tsx`**:
     - Ersätt `for (const url of forladdaUrls()) useGLTF.preload(url);` med `forladdaNarLedig(forladdaUrls());`.

3. **Adaptiv R3F-rendering på mobil i `src/spel/angen3d.tsx` (och re-export `src/spel/Scen3D.tsx`):**
   - Importera `AdaptiveDpr`, `Bvh`, `OrbitControls`, `PerformanceMonitor` från `@react-three/drei`.
   - Håll en state `const [dpr, setDpr] = useState<[number, number] | number>([1, KV.dpr_max]);` (där `KV.dpr_max` är `1.5`) i `Angen3D`.
   - Sätt `data-v9b-r3f="adaptive-bvh"` och `data-v9b-dpr={Array.isArray(dpr) ? dpr.join("-") : String(dpr)}` på `.angen-3d`.
   - Inuti `<Canvas dpr={dpr} ... onCreated={...}>`:
     - Anropa `startaBakgrundsForladdning()` inne i den inre `requestAnimationFrame` i `onCreated` (efter att `[data-testid="ladd-3d"]` fått `data-klar="ja"`).
     - Omslut `<Scen ... />` med `<PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr([1, KV.dpr_max])}>` och `<Bvh firstHitOnly>`, samt lägg till `<AdaptiveDpr pixelated />` inne i `Canvas`.
   - Skapa `src/spel/Scen3D.tsx` som re-exporterar `{ Angen3D, Angen3D as Scen3D } from "./angen3d.tsx"`.

4. **Mjuk offline-/laddningsreserv i `src/spel/modeller/StjarnPuffReserv.tsx`, `src/spel/gard/ByggModell.tsx`, `src/spel/gltfDjur.tsx` och `src/spel/rost.ts`:**
   - Skapa `src/spel/modeller/StjarnPuffReserv.tsx` som exporterar `StjarnPuffReserv({ skala = 1, y = 0.45 }: { skala?: number; y?: number })`:
     - En varm gyllene 3D-stjärnpuff (`#FFD54F` kärna med emissive `#FFA000` + små glittrande `#FFF8E1`-sfärer runt om, `name="stjarn-puff-reserv"`) enligt `/workspace/trollpennan-nulage/stilguide.md`.
   - I `src/spel/gard/ByggModell.tsx` (`ModellGren`) och i `src/spel/gltfDjur.tsx` (lägg till en `DjurModellGren` runt `GltfDjur`-innehållet och `GltfPlagg`): Om en `.glb` saknas eller kastar laddningsfel fångas felet av `getDerivedStateFromError` + `componentDidCatch` (tyst, `0` okontrollerade `pageerror`, ingen engelsk `"ERROR"`-text) och `<StjarnPuffReserv />` visas i stället.
   - I `src/spel/rost.ts`: Säkerställ att `new Audio(...)` och `a.play()` alltid fångar eventuella nätverks-/laddningsfel tyst utan ohanterade promise-rejections eller `pageerror`.

## Verifiering och bevis (Proof Test)
```bash
node rundor/V9a-V9b-album-ordbok-prestanda/matt/prov-v9.mjs --snabb --del 2
node rundor/V9a-V9b-album-ordbok-prestanda/matt/prov-v9.mjs --del 2
npm test
npm run build
```
