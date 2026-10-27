# BESTALLNING-W2 — Rik Horisontvärld runt Ängen med 4 Riktade Biomer & Lågpoly-kullar (`r >= 5.2` till `r = 42`, `375×812`)

## 1. Mål i spelarord
Ängen ska inte längre kännas som en ensam ö i en tom värld, utan ska vara inbäddad i en rik, sammanhängande nordisk sagodal där barnet ser **Glittrande skogen** i nordväst, **Kristallgrottan** i nordost, **Dimsjön** med träbro och kanot i öster och **Solgården** med lada, staket och väderkvarn i väster — omslutet av ett sammanhängande horisontmarkplan och mjuka lågpoly-kullar och berg (`r >= 5.2` till `r = 42`) inom mobilbudgeten (`calls <= 95`, `tris <= 120000`).

## 2. Underlag på disk (läs endast vid behov — blåkopian nedan är komplett)
- `/workspace/kod-inkorg/w1-w4/spaning.md` (Avsnitt 2: `HorisontVarld.tsx`, `kenneyNatur.tsx`, `angen3d.tsx`)
- `/workspace/modell-inkorg/w1-w4/RAPPORT.md` (Avsnitt 0 & 1: `Float32Array`-konvertering i `geoGrupp`, verifierade horisontmodeller `w-*.glb`)
- `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 12.2: Horisontvärld & 4 riktade biomer)
- `rundor/W1-W4-levande-varld/GRIND.md`

**Färdigbyggarkompetens:** Följ `3d-web-game-check`, `stylized-3d-art-direction` och `typescript-best-practices`. Gör första kodändringen inom 10 verktygsanrop.

---

## 3. Blåkopia i prioritetsordning

### Steg 1 — Säkerställ `Float32Array` i `geoGrupp()` i `src/spel/kenneyNatur.tsx` (`<= 315` rader)
I `src/spel/kenneyNatur.tsx` (`geoGrupp()`):
- **VIKTIGT (`v9b.test.ts` rad 52):** Importera eller nämn **ALDRIG** `useFrame` i `src/spel/kenneyNatur.tsx` (inte ens i en kommentar!).
- Precis efter `let pos = g0.getAttribute("position").clone();` i `geoGrupp()`, lägg till:
  ```ts
  if (!(pos.array instanceof Float32Array)) {
    const f32 = new Float32Array(pos.count * pos.itemSize);
    for (let i = 0; i < pos.count; i++) {
      f32[i * 3] = pos.getX(i);
      f32[i * 3 + 1] = pos.getY(i);
      f32[i * 3 + 2] = pos.getZ(i);
    }
    pos = new THREE.BufferAttribute(f32, 3);
  }
  ```
  Detta garanterar att `geo.scale(1 / maxD, 1 / maxD, 1 / maxD)` aldrig avrundar kvantiserade `Int16Array`-positioner till `0`.

### Steg 2 — Skapa `src/spel/ang/HorisontVarld.tsx` (`<= 220` rader)
Skapa `src/spel/ang/HorisontVarld.tsx` med följande exporter och regler:
1. **Exporter:**
   - `export const MIN_HORISONT_RADIE = 5.2;`
   - `export type HorisontZon = "skogen" | "sjon" | "grottan" | "garden";`
   - `export function horisontPositioner(): { zon: HorisontZon; x: number; z: number }[]`
   - `export function HorisontVarld(): JSX.Element`
2. **Förladdning utan `useGLTF.preload` (`v9b.test.ts`):**
   - Använd **aldrig** `useGLTF.preload(`! Anropa `forladdaNarLedig(HORISONT_URLS)` från `../modelCache` inuti en `useEffect(() => { forladdaNarLedig(HORISONT_URLS); }, [])`.
3. **4 Riktade Biomer (`Math.hypot(x, z) >= 5.2` för varje punkt i `horisontPositioner()`, `AC-W07`):**
   Använd `InstansModell` ur `../kenneyNatur` grupperad i `<group key={rad.zon} userData={{ "data-w2-zon": rad.zon }}>`:
   - **`"skogen"` (Nordväst, Tät sagoskog):**
     - `/models/natur/tree_oak.glb`: `[[-7.2, 0, -6.5, 3.2, 0.2], [-9.4, 0, -8.1, 3.8, 1.1], [-11.8, 0, -6.2, 3.5, 2.0], [-6.4, 0, -9.8, 3.1, 0.7], [-13.2, 0, -10.5, 4.1, 1.6], [-8.8, 0, -12.4, 3.9, 2.5]]` (`farger={{ leaves: "#357a38" }}`)
     - `/models/natur/tree_pineRoundA.glb`: `[[-6.0, 0, -7.8, 3.4, 0.4], [-8.1, 0, -6.0, 3.0, 1.4], [-10.5, 0, -9.6, 4.0, 2.2], [-12.6, 0, -8.0, 3.7, 0.9], [-7.5, 0, -11.2, 3.6, 1.8], [-14.2, 0, -12.0, 4.3, 2.8], [-5.6, 0, -10.4, 3.3, 0.5]]` (`farger={{ leaves: "#2b6832" }}`)
     - `/models/bulk/w-gran-1-cc0.glb`: `[[-6.8, 0, -8.6, 3.1, 0.3], [-9.9, 0, -7.2, 3.5, 1.7], [-11.2, 0, -11.4, 3.9, 2.4]]` (`farger={{ leaves: "#2e6f36" }}`)
     - `/models/natur/mushroom_redGroup.glb`: `[[-5.6, 0, -5.8, 0.85, 0.3], [-6.9, 0, -5.4, 0.75, 1.5], [-8.2, 0, -7.1, 0.9, 2.1]]`
   - **`"sjon"` (Öster, Dimsjöns glittrande vik med träbro & kanot):**
     - `/models/natur/lily_large.glb`: `[[6.5, -0.06, -3.5, 1.2, 0.3], [7.8, -0.06, -4.8, 1.4, 1.2], [8.9, -0.06, -2.6, 1.1, 2.4], [10.2, -0.06, -3.9, 1.3, 0.8]]`
     - `/models/natur/rock_smallA.glb`: `[[5.8, 0, -4.6, 1.1, 0.5], [7.2, 0, -5.9, 1.5, 1.8], [9.4, 0, -1.8, 1.3, 2.6], [11.0, 0, -4.4, 1.7, 0.9]]`
     - `/models/bulk/w-trabro-cc0.glb`: `[[8.6, -0.04, -3.2, 2.8, 0.35]]`
     - `/models/bulk/w-kanot-cc0.glb`: `[[7.4, -0.05, -2.2, 1.9, 1.15]]`
   - **`"grottan"` (Nordost, Kristallgrottans klippformationer & grottport):**
     - `/models/natur/rock_largeA.glb`: `[[5.6, 0, -6.8, 2.4, 0.4], [7.4, 0, -8.2, 3.2, 1.3], [9.6, 0, -9.8, 4.1, 2.1], [6.2, 0, -10.5, 3.6, 0.8], [11.5, 0, -7.6, 3.8, 1.9], [8.8, 0, -12.2, 4.6, 2.7]]` (`farger={{ rock: "#6e7385", stone: "#6e7385" }}`)
     - `/models/bulk/w-grottport-cc0.glb`: `[[9.2, -0.1, -10.4, 3.8, -0.65]]`
     - `/models/bulk/w-kristall-kluster-cc0.glb`: `[[5.4, 0, -6.1, 1.2, 0.2], [6.8, 0, -7.5, 1.45, 1.4], [8.1, 0, -9.0, 1.6, 2.3], [4.9, 0, -7.4, 1.15, 0.9]]` (`farger={{ crystal: "#b88cff", stone: "#9d72f2" }}`)
   - **`"garden"` (Väster, Solgårdens hage med staket, lada & väderkvarn):**
     - `/models/natur/fence_simple.glb`: `[[-6.2, 0, -2.4, 1.4, 0.35], [-7.4, 0, -3.1, 1.4, 0.35], [-8.6, 0, -3.8, 1.4, 0.35], [-6.8, 0, -1.2, 1.4, -1.2], [-7.5, 0, -0.1, 1.4, -1.2]]` (`farger={{ wood: "#c89658" }}`)
     - `/models/natur/fence_gate.glb`: `[[-5.6, 0, -1.8, 1.45, 0.35]]`
     - `/models/bulk/w-lada-liten-cc0.glb`: `[[-11.8, -0.08, -3.2, 3.8, 0.45]]`
     - `/models/bulk/w-vaderkvarn-cc0.glb`: `[[-14.5, -0.1, -6.4, 5.4, 0.55]]`
4. **Sammanhängande horisontmarkplan & lågpoly-kullar (`HorisontKullar`, `userData={{ "data-w2-zon": "kullar" }}`) — NOLL `<sphereGeometry>`:**
   - Renderera ett sammanhängande yttre markplan runt Ängen (`<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow><ringGeometry args={[4.8, 46, 64]} /><meshStandardMaterial color="#68b04c" roughness={0.95} metalness={0} /></mesh>`) samt en varm strand-/sjöflik i öster (`position={[8.2, -0.14, -3.4]`, `<circleGeometry args={[3.8, 32]} />`, `#5aa9e6`).
   - Använd `InstansModell` med `/models/bulk/w-kulle-cc0.glb` och `/models/bulk/w-berg-cc0.glb` runt horisonten (`r = 18..34`):
     - `/models/bulk/w-kulle-cc0.glb`: `[[-18, -0.25, -18, 14, 0.4], [0, -0.3, -23, 18, 1.2], [18, -0.25, -17, 15, 2.1], [-22, -0.25, -5, 13, 0.8], [22, -0.25, -5, 12, 1.7], [-11, -0.25, -21, 16, 2.6], [11, -0.25, -20, 16, 0.2]]` (`farger={{ grass: "#6d9256", default: "#6d9256" }}`)
     - `/models/bulk/w-berg-cc0.glb`: `[[14, -0.3, -24, 18, 0.5], [-15, -0.3, -25, 17, 1.9], [2, -0.35, -28, 20, 1.1]]`
5. **Exponera `window.__tredHorisont` (`AC-W06`):**
   - I en `useEffect` i `HorisontVarld`, sätt:
     `(window as unknown as { __tredHorisont?: Record<string, boolean> }).__tredHorisont = { skogen: true, sjon: true, grottan: true, garden: true, kullar: true };`
     och rensa vid unmount.

### Steg 3 — Montera `<HorisontVarld />` i `src/spel/angen3d.tsx` (`<= 380` rader)
- Importera `{ HorisontVarld }` ur `./ang/HorisontVarld` i `src/spel/angen3d.tsx`.
- Montera `<HorisontVarld />` inuti `{angDekor && (...)}` i `Scen` (precis efter `<Naturskogen />`).

---

## 4. Verifiering & Commit
1. Kör det snabba provet:
   - `node --experimental-strip-types rundor/W1-W4-levande-varld/prov-w1-w4.mjs --snabb --steg=w2`
2. Kör enhets- och strukturtester:
   - `npm run check:struktur`
   - `npx tsc --noEmit`
   - `node --experimental-strip-types --test src/spel/v9b.test.ts`
3. Kör Playwright-verifieringen för W2:
   - `node --experimental-strip-types rundor/W1-W4-levande-varld/prov-w1-w4.mjs --steg=w2`
4. Skriv `RUNDAW2.md` med:
   - `Show that:` `HorisontVarld` renderar alla 4 riktade biomer (`skogen`, `sjon`, `grottan`, `garden`) + `kullar` med `Math.hypot(x, z) >= 5.2` och `window.__tred.calls <= 95`, `tris <= 120000` på `375×812`.
5. Committa alla ändringar på grenen.
