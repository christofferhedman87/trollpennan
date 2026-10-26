# BESTÄLLNING S1 (`--del s1`, `--max-turns 42`) — Solvarm Slime Rancher-värld i 60 fps, `mjukrundaScen`, Mjuka Träd & Dubbelvingade Fjärilar, Instansierat Vindgräs & 5 Biompaletter (`375×812`)

## 1. Avsikt (Vad barnet upplever)
När barnet öppnar Ängen, Gården, Skogen, Sjön eller Grottan på mobilen (`375×812`) lyser hela 3D-världen som ett varmt, mjukrundat **Slime Rancher**-diorama i 60 fps:
- Alla hårda triangelfasetter och 90°-kubhörn på GLB-djur, träd och stenar är mjukrundade (`mjukrundaScen` med `toCreasedNormals` + Spherify-puff).
- Startängens träd, granar, buskar, svampar, blommor, moln och fjärilar i `src/spel/ang/dekor.tsx` har mjuka, detaljrika former (fylliga 3-kroniga lövträd med `20, 16`-segment, granar med dubbla kjol-lager, prickiga flugsvampar med vit fot och fjärilar med rundad kropp + mönstrade dubbelvingar istället för 3-kantiga koner!).
- 180 grästuvor vaggar i vinden tillsammans med 35 svävande solkorn i 1 draw call, varje biom har sin sagopalett + CC0-rekvisita (`s-biom-svampkluster-cc0.glb`, `s-biom-nackros-cc0.glb`, `s-plort-kristall-cc0.glb`), och alla HUD-piller har knivskarp `#FFF6E5`/`#3B2F2F`-kontrast med `0 %` mörk scrim.

## 2. Färdigheter & Underlag
Use these skills: `3d-web-game-check`, `stylized-3d-art-direction`, `typescript-best-practices`, `principle-prove-it-works`. Install them first if missing.
- Läs före start:
  - `rundor/S1-S3-slime-varld-ansikten-largo/GRIND.md`
  - `/workspace/slime-rancher-studie/teknik-och-loop.md` (Avsnitt 2.1, 2.2 & **2.3**)
  - `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 9.1 & 9.2)
  - `/workspace/slime-rancher-studie/ui-kritik-s.md` (Avsnitt 1)

## 3. Ritning (Blueprint i prioritetsordning)
1. **Mjukrundade GLB-modeller (`src/spel/mjukGeometri.ts` ny fil ≤ 140 rader & `src/spel/belys.ts`):**
   - Exportera `mjukrundaScen(rot: THREE.Object3D, arKubDjur = false)` i `src/spel/mjukGeometri.ts` och anropa den 1 gång per cachad GLTF-scen i `belysScen` (`src/spel/belys.ts`) enligt `/workspace/slime-rancher-studie/teknik-och-loop.md` avsnitt 2.3:
     - **Steg A (`toCreasedNormals(geom, Math.PI * 0.42)` ur `three/examples/jsm/utils/BufferGeometryUtils.js`):** Ta bort gammalt `tangent`-attribut och slå ihop de 500–800 delade fasetthörnen på `hast.glb`, `groda.glb`, `drake.glb`, träd, stenar och `bulk/*.glb` så att alla hårda triangelfasetter försvinner direkt.
     - **Steg B (1 nivå Midpoint-subdivision + Taubin/Spherify-puff på kvarvarande kantiga `animal-*.glb`):** Runda av 90°-kubhörn till mjuka kuddformer ovanför fotsulan (`y > minY + 0.08 * h`) följt av `toCreasedNormals(geom, Math.PI * 0.58)` och `geom.userData.mjukrundad = true`.
2. **Delat Slime Rancher Fresnel-kantljus & varm skuggtoning (`src/spel/belys.ts`, `src/spel/gltfDjur.tsx` & `src/spel/ang/djur.tsx`):**
   - Exportera `appliceraSlimeGlod(m: THREE.MeshStandardMaterial)` i `src/spel/belys.ts` med fast `customProgramCacheKey = () => "trollpennan-slime-rim-v1"` och `onBeforeCompile` (varm 2-stegs skuggtoning + Fresnel-kantljus `smoothstep(0.55, 0.95, ndv) * 0.28`, `0` extra draw calls).
   - I `src/spel/ang/djur.tsx`: lyft `TOON_MAP`-golvet till `new Uint8Array([124, 172, 218, 255])` och ge djurens markskugga varm smaragdton (`#256D3B`, `opacity: 0.20`).
3. **Mjukrundade träd, granar, svampar, dubbelvingade fjärilar, instansierat vindgräs & de 5 biompaletterna (`src/spel/ang/dekor.tsx`, `data/platser.json`, `src/spel/ang/PlatsDekor.tsx` & `src/spel/gard/MarkPlan.tsx`):**
   - **Träd, granar, buskar, svampar, blommor & moln i `src/spel/ang/dekor.tsx`:**
     - Öka segmenten på alla `sphereGeometry` och `cylinderGeometry` i `TradOchBlommor`, `Granar`, `Forgrund`, `Moln` och `FagelFlyg` från `5–7` till mjuka rundade former (`sphereGeometry` med `20, 16` segment — ersätt alla `args={[0.85, 7, 6]}`, `args={[0.7, 6, 5]}`, `args={[1, 7, 5]}` osv.; `cylinderGeometry` med `14` segment och `coneGeometry` på granar med `16` segment + 2 överlappande kjol-lager).
     - Lägg till en tredje sidokrona (`sidoKrona`) på lövträden i `TradOchBlommor` så kronan ser ut som ett fylligt Slime Rancher-träd istället för en ensam boll.
     - Ge `Forgrund`-svamparna vit fot + röd rundad hatt + vita prickar, och ta bort `flatShading` på `Stenar` och `FagelFlyg`.
   - **Fjärilar (`Fjarilar` i `src/spel/ang/dekor.tsx`):**
     - Ersätt de två 3-kantiga `<coneGeometry args={[0.08, 0.18, 3]} />` med en mjuk, detaljrik fjäril: en rundad liten kropp (`capsuleGeometry` / `sphereGeometry` i `#3B2F2F`) och på varje sida (`vanster` = `children[0]`, `hoger` = `children[1]`) en mjukt rundad dubbelvinge (större rundad framvinge + mindre rundad bakvinge med `circleGeometry` / `sphereGeometry args={[..., 18, 14]}` tillplattad längs Y och en ljus mönsterprick på framvingen) som flaxar mjukt.
   - **Vindgräs & solkorn (`src/spel/ang/dekor.tsx`, `angen3d.tsx` & `Garden3D.tsx`):** Lägg till `<VindGras antal={180} />` (`THREE.InstancedMesh` i 1 draw call med `uTime`-svaj) och `<Solkorn antal={35} />` (`THREE.Points`) samt `<hemisphereLight args={["#FFF8E1", "#7CB342", 0.65]} />` (nollställ `uTime.value = 0` när `(window as any).__PAUSE_ANIM === true`).
   - **Biompaletter & CC0-rekvisita (`data/platser.json` & `src/spel/ang/PlatsDekor.tsx`):** Behåll `mark.grundfarg` och `ljus.skala <= 1` oförändrade i `data/platser.json` (`platser.test.ts`!), lägg Slime Rancher-färgerna i `slimePalett` per plats och montera `s-biom-svampkluster-cc0.glb`, `s-biom-nackros-cc0.glb` och `s-plort-kristall-cc0.glb` i `PlatsDekor.tsx`.
4. **Ogenomskinliga HUD-piller med `#3B2F2F`-kontur & `0 %` scrim (`src/spel/ui/hud-p2.css`):**
   - Ge topp-HUD-piller ogenomskinlig `#FFF6E5`, `border: 2px solid #3B2F2F`, `min-height: 44px; min-width: 44px` (inga nya `data-testid`!).
   - Ändra inget annat; lägg inte till sidofunktioner.

## 4. Skriv-först-regel & Snabbprov
- Gör första kodändringen inom dina första 10 verktygsanrop; utforska inte brett; committa efter varje delmål; skriv `RUNDAS1.md` först om turerna börjar ta slut.
- Kör snabbprovet efter varje steg:
  `node rundor/S1-S3-slime-varld-ansikten-largo/prov-s1-s3.mjs --snabb --del s1`
- Kör hela sviten (`npm run test:product && npm run check:struktur && node rundor/S1-S3-slime-varld-ansikten-largo/prov-s1-s3.mjs --del s1`) en gång på slutet när snabbprovet är grönt.

## 5. Reservplan & Tekniska skyddsräcken
- **Reservplan:** Om `dekor.tsx` blir lång kan `<VindGras />` och `<Solkorn />` exporteras från en hjälparfil och re-exporteras från `src/spel/ang/dekor.tsx`.
- **Tekniska skyddsräcken:** Ingen `setState` i `useFrame`; inga nya `data-testid` i `.tsx`-filer (`check:struktur`); behåll `mark.grundfarg` i `data/platser.json` för `platser.test.ts`.

## 6. Acceptans ("Visa att...") & Slutbedömning (`RUNDAS1.md`)
1. **Visa att** `mjukrundaScen` (`toCreasedNormals` + Spherify) och `appliceraSlimeGlod` med `customProgramCacheKey` är inkopplade i `src/spel/mjukGeometri.ts` och `src/spel/belys.ts`.
2. **Visa att** `src/spel/ang/dekor.tsx` inte längre har 3-kantiga fjärilskoner (`<coneGeometry args={[0.08, 0.18, 3]} />`) eller kantiga 7-segments trädkronor (`sphereGeometry args={[0.85, 7, 6]}`), utan har 3-kroniga lövträd (`20, 16`), dubbelvingade fjärilar med kropp, `<VindGras />` och `<Solkorn />`.
3. **Visa att** HUD-pillren på `375×812` har `2px solid #3B2F2F`, `≥ 44×44 px` och `0 %` mörk scrim över 3D-vyn (`s1-slime-varld.png`).
4. **Visa att** `prov-s1-s3.mjs --del s1`, `npm run test:product` och `npm run check:struktur` är 100 % gröna, och skriv `RUNDAS1.md`.
