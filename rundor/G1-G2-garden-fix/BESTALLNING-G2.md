# BESTALLNING-G2 — Solgårdens Mysiga 3D-Startinramning (`SolgardInramning.tsx` & `MarkPlan.tsx` på `375×812`)

## 1. Mål i spelarord
Redan första gången barnet kliver in på Gården (`0` byggda objekt) ska Solgården se ut som en varm, levande och inbjudande svensk sagogård — inramad av en faluröd lada med vita knutar, en snurrande väderkvarn, höbalar, en trätunna, en välkomstgrind i söder med trästaket och stenstig, varma gårdslyktor, vägvisarskylt, blommande rabatter, lövträd och mjuka sagokullar runt horisonten — samtidigt som alla 60 byggrutor (`0..5 × 0..9`) och 136 hagekanter är 100 % fria och kamerazoomen på byggtomten inte krymps.

## 2. Underlag på disk (läs endast vid behov — blåkopian nedan är komplett)
- `/workspace/kod-inkorg/g1-g2/spaning.md` (Sektion 3: geometri- och koordinatritning för `SolgardInramning.tsx` & `MarkPlan.tsx`)
- `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 13.3: Solgårdens 3D-startinramning, material och färgpalett)
- `/workspace/trollpennan-nulage/kritik-g1-g2.md` (Del 2 & 3: acceptansmått `AC-G03` för startinramningen)
- `rundor/G1-G2-garden-fix/GRIND.md`

**Färdigbyggarkompetens:** Följ `3d-web-game-check`, `stylized-3d-art-direction` och `typescript-best-practices`. Gör första kodändringen inom 10 verktygsanrop. Budget: `--max-turns 40`.

---

## 3. Blåkopia i prioritetsordning

### Steg 1 — Utöka `src/spel/gard/MarkPlan.tsx` (`<= 240` rader) med ängsskiva (`r = 28`), gårdsrundel (`r = 8.8`) och trä-/sandstensram
1. I `src/spel/gard/MarkPlan.tsx`:
   - Byt den ensamma cirkeln `<circleGeometry args={[16, 40]} />` på rad 183–186 mot **två varma ängsskivor** så att inga tomma blå himmelshörn syns runt tomten på `375×812`:
     ```tsx
     <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow raycast={ingenTraff}>
       <circleGeometry args={[28, 48]} />
       <meshStandardMaterial color="#69b84f" roughness={0.96} />
     </mesh>
     <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow raycast={ingenTraff}>
       <circleGeometry args={[8.8, 48]} />
       <meshStandardMaterial color="#76c45a" roughness={0.92} />
     </mesh>
     ```
   - Gör tomtens sandstens-/träram vid `y = 0.006` varmt inramande (`args={[bredd + 0.52, djup + 0.52]}`, `color="#d9a760"`, `roughness={0.88}`).
   - Behåll alla 60 `ALLA_CELLER`, 136 `ALLA_KANTER`, `Plattor`, `KantGlod` och pekarplanet `onPointerDown={onValj}` exakt som idag.

### Steg 2 — Skapa `src/spel/gard/SolgardInramning.tsx` (`<= 220` rader)
Skapa `src/spel/gard/SolgardInramning.tsx`:
1. **Alla objekt placeras strikt utanför `6×10`-byggrutnätet (`|wx| >= 3.25` eller `|wz| >= 5.25`)** och ges `skuggaUtanTraff(k, false)` så att de aldrig fångar klick eller blockerar någon av de 60 byggrutorna (`gx: 0..5, gz: 0..9`) eller 136 hagekanterna.
2. **Förladdning och `MeshoptDecoder`:**
   - Importera `useGLTF` från `"@react-three/drei"`, `forladdaNarLedig` och `kopplaMeshopt` från `../modeller/forladda.ts`, `belysScen` från `../belys.ts` samt `egnaMaterial`, `passaByggnad`, `skuggaUtanTraff`, `slappMaterial` från `./modellPrep.ts`.
   - Köa alla unika GLB-filer i `INRAMNING_OBJEKT` med `forladdaNarLedig(INRAMNING_FILER)` vid modulstart.
   - Varje objekt (eller grupp) omsluts av en tyst `<Suspense fallback={null}>` och felgräns så att laddning aldrig blockerar Gården.
3. **Inramningsobjekt i `SolgardInramning.tsx` (samtliga CC0-filer finns redan i `public/models/`):**
   - **Norra gårdsfonden (`z <= -5.45`):**
     - **Faluröd lada:** `/models/gard/lada-liten-quaternius.glb` vid `[-2.35, 0, -5.85]`, `rotY = 0.32`, `malhojd = 2.35`, `maxBredd = 2.4`
     - **Väderkvarn:** `/models/bulk/w-vaderkvarn-cc0.glb` vid `[2.45, 0, -5.85]`, `rotY = -0.38`, `malhojd = 2.55`, `maxBredd = 2.2`
     - **Höbalar & trätunna vid ladan:**
       - `/models/gard/hobal-kenney-hay-bale-bundled.glb` vid `[-0.65, 0, -5.55]`, `rotY = 0.25`, `malhojd = 0.72`
       - `/models/gard/hobal-kenney-hay-bale.glb` vid `[0.25, 0, -5.48]`, `rotY = 0.95`, `malhojd = 0.55`
       - `/models/bulk/tunna.glb` vid `[-3.65, 0, -4.65]`, `rotY = 0.15`, `malhojd = 0.65`
   - **Sydlig välkomstgrind, trästaket, stenstig, gårdslyktor & vägvisarskylt (`z >= 5.35`):**
     - **Välkomstgrind:** `/models/natur/fence_gate.glb` vid `[0, 0, 5.45]`, `rotY = 0`, `malhojd = 0.82`, `maxBredd = 1.35`
     - **Trästaket runt syd- och nordhörnen (`fence_simple.glb`):**
       - `[-1.25, 0, 5.45]`, `[1.25, 0, 5.45]`, `[-2.35, 0, 5.45]`, `[2.35, 0, 5.45]` (`rotY = 0`, `malhojd = 0.68`, `maxBredd = 1.15`)
     - **Stenstig vid grinden (`path_stone.glb`):**
       - `[0, 0.01, 5.85]`, `[0.08, 0.01, 6.45]`, `[0.18, 0.01, 7.05]` (`rotY = 0.1`, `malhojd = 0.14`, `maxBredd = 0.95`)
     - **Gårdslyktor (`lykta.glb`):**
       - `[-0.82, 0, 5.52]` och `[0.82, 0, 5.52]` (`malhojd = 0.95`)
     - **Vägvisarskylt vid grinden (`w-vagvisare-cc0.glb`):**
       - `[1.75, 0, 5.58]`, `rotY = -0.35`, `malhojd = 1.15`
   - **Lövträd, buskar & blommande hörnstenar längs sidorna (`|x| >= 3.35`):**
     - **Träd (`tree_oak.glb`, `tree_fat.glb`):**
       - `/models/natur/tree_oak.glb` vid `[-4.15, 0, -2.4]` (`malhojd = 2.05`, `maxBredd = 1.8`) och `[4.15, 0, -1.9]` (`malhojd = 1.95`, `maxBredd = 1.8`)
       - `/models/natur/tree_fat.glb` vid `[-4.05, 0, 2.2]` (`malhojd = 1.85`, `maxBredd = 1.7`) och `[4.05, 0, 2.5]` (`malhojd = 1.90`, `maxBredd = 1.7`)
     - **Buskar (`plant_bushLarge.glb`):**
       - `[-3.50, 0, -0.4]`, `[3.50, 0, 0.4]`, `[-3.45, 0, 3.7]`, `[3.45, 0, -3.7]` (`malhojd = 0.62`)
     - **Blomrabatter & hörnstenar (`rock_smallA.glb`, `flower_redA.glb`, `flower_yellowA.glb`):**
       - `[-3.35, 0, -5.28]` (`rock_smallA.glb`, `malhojd = 0.38`), `[-3.15, 0, -5.35]` (`flower_redA.glb`, `malhojd = 0.42`), `[3.25, 0, -5.35]` (`flower_yellowA.glb`, `malhojd = 0.42`), `[-3.30, 0, 5.32]` (`flower_yellowA.glb`, `malhojd = 0.42`), `[3.30, 0, 5.32]` (`flower_redA.glb`, `malhojd = 0.42`)
   - **6 sagokullar längs horisonten (`w-kulle-cc0.glb`):**
     - 6 st `/models/bulk/w-kulle-cc0.glb` i bakkant (`[-9.5, -0.18, -8.5]`, `[-4.2, -0.18, -11.0]`, `[1.8, -0.18, -11.5]`, `[7.5, -0.18, -8.8]`, `[-10.5, -0.18, -2.0]`, `[-7.8, -0.18, 4.5]`, med skala/bredd så att horisonten blir mjukt kuperad utan att skymma tomten).
4. **Exponera `window.__tredGardInramning` och `window.__gard3d.inramningAntal`:**
   - Sätt i `useEffect` i `SolgardInramning`:
     ```ts
     window.__tredGardInramning = {
       lada: true,
       vaderkvarn: true,
       staket: true,
       trad: true,
       kullar: true,
       antal: INRAMNING_OBJEKT.length,
     };
     if (window.__gard3d) {
       window.__gard3d.inramningAntal = INRAMNING_OBJEKT.length;
     }
     ```
     (Deklarera `__tredGardInramning?: { lada: boolean; vaderkvarn: boolean; staket: boolean; trad: boolean; kullar: boolean; antal?: number }` på `Window` och `inramningAntal?: number` på `Gard3dDiag` i `Garden3D.tsx`).

### Steg 3 — Montera `<SolgardInramning />` i `src/spel/gard/Garden3D.tsx` utanför `<Bounds>`
1. I `src/spel/gard/Garden3D.tsx` (`<= 340` rader):
   - Importera `SolgardInramning` från `./SolgardInramning.tsx`.
   - Montera `<SolgardInramning />` i `<Scen>` **utanför** `<Bounds>` (så att `<Bounds>` endast passar in `6×10`-gårdsplanen och kamerazoomen aldrig krymper barnets byggnader!).
   - Behåll eller ersätt `<DekorHobalar />` så att inga dekorobjekt ligger inne i `<Bounds>`, och kontrollera att `window.__gard3d.inramningAntal` sätts till `>= 18`.
   - Kontrollera att draw calls på Gården är `<= 95` och trianglar `<= 120000`.

---

## 4. Verifiering & Commit
1. Kör snabbprovet för G1 & G2:
   - `npx tsx rundor/G1-G2-garden-fix/prov-g1-g2.mjs --snabb --steg=alla`
2. Kör enhets-, struktur- och produkttester:
   - `npm run check:struktur` (`0` fel, exakt `174` unika / `179` förekomster av `data-testid`)
   - `npx tsc --noEmit`
   - `npm run test:product`
3. Kör full Playwright-verifiering för G1 & G2 (som tar alla 3 bevisbilder i `/workspace/trollpennan-nulage/ko-28okt-g/`):
   - `npx tsx rundor/G1-G2-garden-fix/prov-g1-g2.mjs --steg=alla --ut /workspace/trollpennan-nulage/ko-28okt-g`
4. Skriv `RUNDAG2.md` med:
   - `Show that:` Solgården har `SolgardInramning` (`window.__tredGardInramning = { lada: true, vaderkvarn: true, staket: true, trad: true, kullar: true }`, `inramningAntal >= 18`) utanför alla 60 byggrutor med `calls <= 95` och `tris <= 120000`, och att både `"ett tält"` och `"ett rött hus"` syns skarpt (`>= 52×48 px`) på `375×812` och `375×640`, med bevisbilderna `g2-garden-start-inramning-375x812.png`, `g1-garden-talt-375x812.png` och `g1-g2-garden-talt-och-hus-375x812.png`.
5. Committa alla ändringar på grenen.
