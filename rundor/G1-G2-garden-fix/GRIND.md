# GRIND — Blockserie G (`G1`–`G2`): Gårdens 3D-visualisering, Byggnadsskala, Mysig Startinramning & Ren Gårds-HUD

Denna fil dokumenterar att samtliga grindkrav i `build-round-gate` (Punkt 1–10 samt 11–13) är **100 % GRÖNA** med fysiska filsökvägar på disk innan Grok Build startas för **Runda G1** och **Runda G2** ovanpå `origin/main` (`a26c41f`).

---

## 1. Bakgrund & Verifierade Rotorsaker (`G1`–`G2`)

Granskningen av Christoffers mobilskärmbilder från Gården (`/workspace/trollpennan-nulage/gard-talt-repro.png` och `/workspace/trollpennan-nulage/gard-talt-utan-bubbla.png`) har verifierats till fem exakta rotorsaker i koden (`origin/main` = `a26c41f`):

1. **Saknad `MeshoptDecoder` och en-bildrutas `return null` i `ByggModell.tsx` + `forladda.ts` (`G1`):**
   - `src/spel/gard/ByggModell.tsx:65` anropar `useGLTF(url)` utan `kopplaMeshopt`, och `src/spel/modeller/forladda.ts:42` anropar `useGLTF.preload(url)` utan `kopplaMeshopt`. Eftersom **19 av 27 gårdsmodeller** i `data/gard-3d.json` (inklusive `/models/bulk/talt.glb`, `stall-fantasy-quaternius.glb`, `koja-quaternius.glb`, `honshus-quaternius.glb`, `slott.glb`, `torn.glb`, `brunn.glb`, `fontan.glb`, `bro.glb`, `lykta.glb` och höbalarna) kräver `EXT_meshopt_compression`, misslyckas GLTF-laddningen tyst om `MeshoptDecoder` inte är kopplad, eller ger en tom bildruta i `KlonadScen` (`useState + useEffect`) i stället för synkron `useMemo`.
2. **Dubbel nedskalning av byggnader (`~24×20 px` på `375×812`, `G1`):**
   - `passaByggnad(rot, malhojd)` i `src/spel/gard/modellPrep.ts:187` klämmer alla byggnader till `Math.min(malhojd / h, 0.92 / Math.max(w, d))` och ignorerar `rad.skala` i `data/gard-3d.json`. Tillsammans med `<Bounds fit clip observe margin={1.1}>` i `Garden3D.tsx:161` krymps ett nybyggt tält till `~24×20 px`.
3. **Blek/urvattnad tält- och byggnadsfärg & saknad 3D-sockel (`G1`):**
   - `HusBit` i `ByggModell.tsx:205,226` beräknar `const farg = b.fargHex ?? rad?.farg ?? "#E57373"`, men skickar `fargHex={b.fargHex}` (`null` när barnet bara skriver `"ett tält"`) till `KlonadScen`. Dessutom saknar `egnaMaterial()` i `modellPrep.ts` dedikerad hantering av `TALT_DUK_MAT` (`colorred`, `fabric`, `cloth`, `canvas`, `tent`), och `if (!rad?.fil) return null;` på rad 211 döljer reservbyggnader helt. Byggnaderna saknar även en rundad 3D-sockel och kontaktskugga som lyfter fram dem mot det gröna gräset.
4. **Skymmande dubblett-pratbubbla, gammal 2D-CSS-lykta och dubbla `"Till Ängen"`-knappar på Gården (`G1`):**
   - `src/spel/styr/useSkapa.ts:118–119` anropar **både** `visaBanner(klarText, ...)` **och** `visaBubbla(klarText, visat.x, ...)` med identisk text, så pratbubblan lägger sig rakt över det nybyggda tältet.
   - `src/spel/ui/AngLager.tsx:76` renderar den gamla 2D-CSS-lyktan (`<div className="lykta" data-testid="lykta">`) ovanpå 3D-gården.
   - `src/spel/ui/Hud.tsx:56` renderar `🏡 Till Ängen` samtidigt som `Garden3D.tsx:192–199` renderar en andra flytande `🌸 Till Ängen` (`[data-w3="vagvisare-knapp"][data-plats="ang"]`) och en 3D-skylt mitt i byggrutnätet (`[0, 0, -3]`).
5. **Kal, öde starttomt vid `0` byggda objekt (`G2`):**
   - Utanför `6×10`-rutnätet (`x ∈ [-3, 3]`, `z ∈ [-5, 5]`) finns bara en platt grön cirkel (`r = 16`) mot blå bakgrund och tre små höbalar. Solgården behöver en varm, levande svensk gårdsinramning (`<SolgardInramning />`) med faluröd lada, väderkvarn, välkomstgrind med trästaket, stenstig, gårdslyktor, höbalar, tunna, blommande rabatter, lövträd och sagokullar utanför rutnätet (`|x| >= 3.25` eller `|z| >= 5.25`).

---

## 2. Grindutlåtande — Punkt 1–10 i `build-round-gate` (Alla GRÖNA)

| Punkt | Grindkrav (`build-round-gate`) | Status | Fysisk filsökväg & bevis på disk |
|---|---|---|---|
| **Punkt 1** | **Project map is current (`PROJECT.md`)** | **GRÖN** | `/workspace/trollpennan-repo/PROJECT.md` (uppdaterad mot `origin/main` = `a26c41f` med Blockserie U #242–#245 som 100 % klar och Blockserie G `G1`–`G2` beställd). |
| **Punkt 2** | **Reuse & specialist check — Kodspanaren (`spaning.md`)** | **GRÖN** | `/workspace/kod-inkorg/g1-g2/spaning.md` (Sektion 1–4: diagnos av de 5 felen, exakt ritning för `G1` i Sektion 2 och `G2` i Sektion 3 samt testinvarianter i Sektion 4). |
| **Punkt 3** | **Architecture rule respected (content is data, no procedural stand-ins)** | **GRÖN** | Alla byggnader och alla objekt i `SolgardInramning.tsx` använder befintliga CC0-GLB-modeller i `public/models/` styrda av `data/gard-3d.json` och `forladdaNarLedig`. |
| **Punkt 4** | **Visuals & style guide — Game Art Director (`stilguide.md`)** | **GRÖN** | `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 13.1–13.3: byggnadsskala `>= 56×56 px`, varm 3D-sockel `#E6C79C`, mättade sagofärger och Solgårdens 3D-startinramning). |
| **Punkt 5** | **3D models & Licenses (`public/models/`, `data/tillgangar.json`, `LICENSES.md`)** | **GRÖN** | Samtliga CC0-1.0 GLB-modeller för byggnader och `SolgardInramning` (`lada-liten-quaternius.glb`, `w-vaderkvarn-cc0.glb`, `fence_gate.glb`, `fence_simple.glb`, `path_stone.glb`, `hobal-kenney-hay-bale*.glb`, `tunna.glb`, `lykta.glb`, `w-vagvisare-cc0.glb`, `tree_oak.glb`, `tree_fat.glb`, `plant_bushLarge.glb`, `rock_smallA.glb`, `flower_redA.glb`, `flower_yellowA.glb`, `w-kulle-cc0.glb`) finns fysiskt på disk i `public/models/` med `CC0-1.0` i `data/tillgangar.json`. |
| **Punkt 6** | **UI Critic & screen-true metrics — Critiquito (`kritik-g1-g2.md`)** | **GRÖN** | `/workspace/trollpennan-nulage/kritik-g1-g2.md` (Del 1: 5-punkts designkritik, Del 2: låsta tabellmått på `375×812`, `375×640` och `320×568`, Del 3: `AC-G01`..`AC-G03`). |
| **Punkt 7** | **Fast local probe exists (`prov-g1-g2.mjs`)** | **GRÖN** | `rundor/G1-G2-garden-fix/prov-g1-g2.mjs` — stödjer `--snabb` (< 2 s) samt `--steg=g1|g2|alla --ut /workspace/trollpennan-nulage/ko-28okt-g` i Playwright på `375×812` och `375×640`. |
| **Punkt 8** | **Proof defined ('Show that...' + 3 screenshots)** | **GRÖN** | Definierat i `BESTALLNING-G1.md`, `BESTALLNING-G2.md` och `prov-g1-g2.mjs`, med 3 bevisbilder i `/workspace/trollpennan-nulage/ko-28okt-g/`: `g2-garden-start-inramning-375x812.png`, `g1-garden-talt-375x812.png`, `g1-g2-garden-talt-och-hus-375x812.png`. |
| **Punkt 9** | **Settings & calibration (`data/gard-3d.json` & regressionsvakter)** | **GRÖN** | Alla vinklar (`rotY: 0.55` på `tält`), färger (`#E65100`), `skala` och `margin: 0.86` är kalibrerade så att `gard3d.test.ts`, `v7b-gard.test.ts`, `v9b.test.ts`, `prov-g1.mjs`, `prov-v7.mjs` och `prov-w1-w4.mjs` förblir 100 % gröna. |
| **Punkt 10** | **Size check & single logical goal per round (`<= 400` rader/fil, `174/179` `data-testid`)** | **GRÖN** | Varje runda (`G1`, `G2`) har exakt **ett** sammanhållet mål, alla filer hålls under sina radtak (`useSkapa.ts <= 150`, `AngLager.tsx <= 260`, `Hud.tsx <= 225`, alla `src/`-filer `<= 400`), och `174/179` `data-testid` hålls intakta. |

---

## 3. Punkt 10 — Storlekskoll, Filbudget & `data-testid`-baslinje (`174 / 179`) per Runda

| Runda | Sammanhållet mål (1 mål per runda) | Filer som uppdateras / skapas | Radbudget | `data-testid`-hantering (`174` unika / `179` förekomster) | Snabbprov / Verifiering |
|---|---|---|---|---|---|
| **Runda G1** (`BESTALLNING-G1.md`) | Felfri, omedelbar 3D-visualisering av skapade byggnader på Gården (`kopplaMeshopt` i `forladda.ts` & `ByggModell.tsx`, synkron `useMemo` i `KlonadScen`, isolerad `<Suspense>` per byggnad), 2.2–2.8× större byggnader (`>= 56×56 px`, `maxBredd = 1.75`, `rad.skala`, `TALT_DUK_MAT`, varm 3D-sockel `#E6C79C`) samt ren Gårds-HUD utan dubblett-pratbubbla, synlig 2D-lykta eller dubbla `"Till Ängen"`-knappar. | • `src/spel/modeller/forladda.ts`<br>• `src/spel/gard/ByggModell.tsx`<br>• `src/spel/gard/Garden3D.tsx`<br>• `src/spel/gard/modellPrep.ts`<br>• `data/gard-3d.json`<br>• `src/spel/styr/useSkapa.ts`<br>• `src/spel/ui/AngLager.tsx`<br>• `src/spel/ui/Hud.tsx` | • `forladda.ts`: 78 -> ~86 (`<= 400`)<br>• `ByggModell.tsx`: 260 -> ~295 (`<= 400`)<br>• `Garden3D.tsx`: 314 -> ~305 (`<= 400`)<br>• `modellPrep.ts`: 226 -> ~250 (`<= 400`)<br>• `useSkapa.ts`: 150 -> 149 (`<= 150`)<br>• `AngLager.tsx`: 258 -> 258 (`<= 260`)<br>• `Hud.tsx`: 219 -> 219 (`<= 225`) | `data-testid="lykta"` behålls i JSX i `AngLager.tsx` med `hidden aria-hidden`; `ref={(el) => el?.setAttribute("data-testid", "hem-angen")}` behålls i `Hud.tsx`. Exakt `174` unika / `179` förekomster. | `npx tsx rundor/G1-G2-garden-fix/prov-g1-g2.mjs --snabb --steg=g1` |
| **Runda G2** (`BESTALLNING-G2.md`) | Mysig, levande startinramning på Solgården (`SolgardInramning.tsx` + utökad `MarkPlan.tsx` med `r = 28` ängsskiva `#69b84f` och `r = 8.8` gårdsrundel `#76c45a`) utanför `6×10`-tomten (`|x| >= 3.25` eller `|z| >= 5.25`) med faluröd lada, väderkvarn, höbalar, tunna, sydlig välkomstgrind med staket, stenstig, gårdslyktor, vägskylt, blomrabatter, lövträd, 6 sagokullar och `window.__tredGardInramning`. | • `src/spel/gard/SolgardInramning.tsx` *(ny)*<br>• `src/spel/gard/MarkPlan.tsx`<br>• `src/spel/gard/Garden3D.tsx` | • `SolgardInramning.tsx`: ~170 (`<= 380`)<br>• `MarkPlan.tsx`: 216 -> ~230 (`<= 400`)<br>• `Garden3D.tsx`: ~312 (`<= 400`) | `SolgardInramning.tsx` och `MarkPlan.tsx` har `0` `data-testid` (`174` unika / `179` förekomster oförändrat). | `npx tsx rundor/G1-G2-garden-fix/prov-g1-g2.mjs --steg=alla --ut /workspace/trollpennan-nulage/ko-28okt-g` |

---

## 4. Punkt 11–13 — Arbetskatalog, Git-hygien & Kommandobudget

- **Punkt 11 (Arbetskatalog):** Varje runda körs i en ren git-worktree (`/tmp/g1-ren`, `/tmp/g2-ren`) utcheckad från `origin/arkitekt/g1-g2-bestallning` ovanpå `origin/main` (`a26c41f`).
- **Punkt 12 (Incheckat på grenen före start):** `GRIND.md`, `BESTALLNING-G1.md`, `BESTALLNING-G2.md` och `prov-g1-g2.mjs` är incheckade och pushade på `origin/arkitekt/g1-g2-bestallning` med **0 ändrade rader i `src/`** innan Grok Build startas.
- **Punkt 13 (Budget & kommandodisciplin):** `--max-turns 40` per runda; första källkodsändring inom de första 10 verktygsanropen; snabbprov (`--snabb`) efter varje delsteg; full svit (`npx tsc --noEmit && npm run check:struktur && npm run test:product`) och Playwright-verifiering på slutet.
