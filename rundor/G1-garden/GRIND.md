# Grindutlåtande — G1 Gården i 3D (G1a, G1b, G1c)

Datum: 2026-10-24  
Granskare: Arkitekten  
Körs efter: **S1b** (`arkitekt/s1-delning` mergad till `main`, där `src/spel/ui/vyer.ts` och `src/spel/styr/useGard.ts` är utbrutna ur `Spel.tsx`).

---

## Beslut: GODKÄND — uppdelad i tre korta rundor (G1a → G1b → G1c)

Enligt **grindpunkt 10** (högst en sökregel eller lösare per runda) och **O1a-lärdomen** (~8 modellanrop per kodändring + 10 för prov och `RUNDA.md`, tak 60–70 turer) delas G1 i tre rundor:

| Runda | Fokus (en lösare per runda) | Filer som skapas/ändras | Uppskattade anrop | Turtak |
|---|---|---|---|---|
| **G1a** | Rutnät (`6×10` på `1.0`-celler), kantstaket (`N`/`W`), koordinatbijektion `x,y` ↔ `(gx,gz)`/kant och **BFS-lösare för sluten hage** + `data/gard-3d.json` | `data/gard-3d.json`, `src/spel/gard/rutnat.ts`, `src/spel/gard/gard3d.test.ts`, `package.json`, `RUNDA-G1a.md` | ~42 | 60 (tak 70) |
| **G1b** | **3D-vyn `Garden3D.tsx`** med fast kamera (`OrthographicCamera` + `Bounds fit clip observe`), snäppande byggen/staket, `brygga.registrera("gard")` och vykoppling via `VYER` (ersätter `GardScen` i vyn) | `src/spel/gard/Garden3D.tsx`, `src/spel/ui/vyer.ts`, `src/spel/starta.ts`, `src/spel/styr/useGard.ts`, `src/styles.css`, `RUNDA-G1b.md` | ~50 | 65 (tak 75) |
| **G1c** | **Vandringslösare för djur i hage och stall** (`djurVandring.ts`), 3D-djur på Gården (`hemma`), `platser()`-rapportering och skärmprov i Playwright `375×812` | `src/spel/gard/djurVandring.ts`, `data/bygg.json`, `src/spel/gard/Garden3D.tsx`, `src/spel/gard/gard3d.test.ts`, `RUNDA-G1c.md` | ~44 | 65 (tak 75) |

---

## Alla 13 grindpunkter (`build-round-gate`)

### 1. Ett tydligt mål i spelarord
Barnet kan gå till Gården i 3D med fast kameravinkel på en mobilskärm (`375×812`), bygga hus, stall och staket som snäpper mot rutnätet och bildar en inhägnad hage, och djuren som flyttar in bor i stallet eller hagen och vandrar inom sitt område.

### 2. Återanvändning inuti och utanför + knep utanför boxen
- **Inuti repot:**
  - `public/models/natur/fence_simple.glb` och `fence_gate.glb` (CC0, Kenney Nature Kit) har redan lokal bbox `x: -0.5..+0.5, z: -0.5..-0.43` — exakt `1.0` breda och placerade på cellens norra kant (`-z`). Rotation i steg om `90°` (`0` för `N`, `Math.PI / 2` för `W`) runt cellens mitt täcker alla fyra cellkanter utan hörnbitar och utan autotiling.
  - `@react-three/drei` `<OrthographicCamera>` + `<Bounds fit clip observe>` (MIT, redan installerat i `package.json`) ramar in hela gårdsytan på `375×812`.
  - `GltfDjur` (`src/spel/gltfDjur.tsx`), `DjurMesh` (`src/spel/djurMesh.tsx`), `belysScen` (`src/spel/belys.ts`), `MILJO` (`src/spel/miljo.ts`) och `TredGren` (`src/spel/tredGren.tsx`) återanvänds rakt av.
- **Utanför repot (Kodspanarens spaning `/workspace/kod-inkorg/G1-garden/spaning.md`):**
  - *Idé från Red Blob Games (Grid edges):* Celler har koordinater `(gx, gz)` och staket bor på cellernas kanter (`N` och `W`, plus ytterkanterna `gz = DJUP` och `gx = BREDD`).
  - *Idé från Townscaper / Dorfromantik / Stardew Valley:* Sluten hage avgörs med **BFS-fyllning utifrån kartans kant** (en kant med staket eller grind blockerar steget mellan två grannceller; celler som inte nås utifrån är inhägnade och grupperas i sammanhängande hagar).
  - *Idé från Yuka (`WanderBehavior`) förenklad:* Ingen extern styrbiblioteks-dependency (`yuka` 31 kB / `three-pathfinding` strukna). Djuret slumpar en målcell bland sin hages celler (eller stallets gårdsplan), går dit i jämn fart, väntar 1–3 s och väljer ny cell i hagen. Eftersom målet alltid väljs bland hagens celler går djuret aldrig ut genom staketet.
- **Knep utanför boxen som sparar kvot:**
  1. **Gör det till data:** Alla 12 nya CC0-gårdsmodeller och skalfaktorer samt reservformer ligger i `data/gard-3d.json` och `data/tillgangar.json`.
  2. **Skär bort hörnbitar och navmesh:** Kant-staket (`fence_simple`) + målcell i BFS-hagen ersätter 16-bitars autotiling och navmesh med ~90 rader ren, deterministisk kod.
  3. **Bijektiv koordinatmappning inom `[0.10..0.90] × [0.32..0.92]`:** `minne.ts` (`flyttaBygge`) klampar `x` till `[0.06, 0.94]` och `y` till `[0.30, 0.94]`. Genom att mappa hela rutnätet (`6×10`) och alla dess kanter innanför `[0.10, 0.90] × [0.32, 0.92]` fungerar `SparatBygge`, `useMinne` och `lagring.ts` (`arBygge`) utan en enda ändring i sparningsformatet.

### 3. Innehåll är data — ett generellt system
- `data/gard-3d.json` beskriver rutnätets mått (`6×10`, cellstorlek `1.0`), kamerans position och alla `bygg_ord` (modellnyckel i `data/tillgangar.json`, målhöjd, fotavtryck och reservform `tak`/`cylinder`/`damm`/`bro` när 3D-modell saknas).
- Inga per-byggnad-komponenter får skrivas: en generell `<GardByggnad>` läser tabellen i `data/gard-3d.json`.

### 4. Kontrakt mellan delar
- **Koordinater:**
  - Rutnätscell: `gx ∈ 0..5` (6 kolumner), `gz ∈ 0..9` (10 rader).
  - Världskoordinat (`1.0`-rutnät kring origo): `wx = gx - 3 + 0.5` (`-2.5 .. +2.5`), `wz = gz - 5 + 0.5` (`-4.5 .. +4.5`).
  - Normaliserad sparad koordinat (`SparatBygge.x, y`): `X_MIN = 0.10, X_SPAN = 0.80`, `Y_MIN = 0.32, Y_SPAN = 0.60`.
  - Kant (`KantPlats`): `{ gx: number; gz: number; kant: "N" | "W" }` där `"N"` är horisontell kant (`gx ∈ 0..5, gz ∈ 0..10`) och `"W"` är vertikal kant (`gx ∈ 0..6, gz ∈ 0..9`).
  - Skärmkoordinater till `brygga.platser()` och `byggLang`/`hemTryck`: normaliserade `x, y ∈ [0..1]` över hela `.ang`-ytan (`375×812`). CSS-regeln `.ang:has(.garden-3d)` sätter `--duk-x: 0 !important; --duk-y: 0 !important; --duk-w: 1 !important; --duk-h: 1 !important;` så att `dukStil(x, y)` i `AngLager.tsx` placerar menyer, pratbubblor och humörikoner exakt över 3D-objektet.

### 5. Spårad dataväg med fil- och funktionsnamn (och kontroll mot befintliga tester)
1. **Tillgångar & licenser (förberett på grenen):**
   - 12 CC0-modeller från `/workspace/modell-inkorg/_garden-1/` är optimerade med `gltf-transform` (inbäddade texturer `externa = 0`, `OPAQUE`-material, 448 KB totalt) och inlagda i `public/models/gard/*.glb`.
   - Alla 12 har rader i `data/tillgangar.json` (`licens: "CC0-1.0"`, `inlagd: "G1"`) och är dokumenterade i `LICENSES.md` och `CREDITS.md` via `node scripts/modell-inlagg.mjs licenser`.
   - `src/spel/entiteter.test.ts` och `src/spel/rost.test.ts` är verifierat gröna (20/20).
2. **Kontroll mot `scripts/check-spel-struktur.mjs` (`npm run check:struktur`):**
   - **VIKTIGT:** `scripts/check-spel-struktur.mjs` räknar alla JSX-attribut med namnet `data-testid` i `src/spel/**/*.tsx` och jämför exakt mot `rundor/R1-dela-spel/testid-baslinje.json`.
   - Därför får `Garden3D.tsx` **INTE** innehålla något `data-testid="..."`-attribut i JSX! Använd i stället `className="angen-3d garden-3d"` och `data-vy="garden-3d"` på rot-diven.
3. **Kontroll mot `Spel.tsx` och S1 (`arkitekt/s1-delning`):**
   - `Spel.tsx` rörs **inte**. `Garden3D` kopplas in genom att lägga till en post i `VYER` i `src/spel/ui/vyer.ts`:
     `{ id: "garden3d", plats: "scen", syns: (k) => k.t.varld === "gard" && !k.t.omrade, Vy: Garden3D }`.
   - I `src/spel/starta.ts` tas `GardScen` bort ur Phasers `scene`-lista och `game.scene.start("gard")` tas bort så att Gården bara har **en** renderväg (R3F). Själva filen `src/spel/gard.ts` och `phaser`-beroendet tas bort i rundan **G2** efteråt.

### 6. Bevis som mäter det barnet ser på skärmen
- **Enhetsprov (`src/spel/gard/gard3d.test.ts` + `rundor/G1-garden/matt/prov-g1.mjs`):**
  1. Alla modellreferenser i `data/gard-3d.json` finns i `data/tillgangar.json` med CC0-licens och som fil i `public/`.
  2. Alla celler `(0..5, 0..9)` och kanter `N`/`W` klarar rundresan `tillXy` → `minne.ts`-klampning `[0.06..0.94]×[0.30..0.94]` → `xyTillCell`/`xyTillKant` exakt.
  3. BFS-lösaren `hittaSlutnaHagar`:
     - 4 staket runt `(2, 4)` ger exakt 1 sluten hage med 1 cell `[(2, 4)]`.
     - 8 staket runt `2×2`-rutan `(2..3, 4..5)` ger exakt 1 sluten hage med 4 celler.
     - En öppen lucka (3 av 4 kanter) ger `0` slutna hagar.
     - Två separata inhägnader ger 2 skilda hagar.
  4. Vandringslösaren `nastaVandringSteg`:
     - Över 1 000 simulerade tidssteg (`dt = 0.05` s) för ett djur i en `2×2`-hage hålls positionen `(wx, wz)` i varje steg innanför hagens ytterkanter och djuret besöker minst 2 olika celler i hagen.
- **Skärmprov (`rundor/G1-garden/matt/skarm-g1.mjs` i Playwright `375×812`):**
  1. Öppnar spelet i `375×812`, går till Gården (`__troll.plats("gard")` / kartans `plats-garden`).
  2. Verifierar att `.garden-3d canvas` är synlig (`width >= 375`, `height >= 700`), att Phaser-duken `.duk` är dold (`visibility: hidden`), och att `0` sid- eller konsolfel uppstår.
  3. Bygger ett stall/hus och 4 staket som sluter en hage på rutnätet, flyttar in djur (`flyttaIn`), och verifierar att djuren står på Gården i 3D och under 4 sekunders mätning rör sig men hela tiden håller sig innanför hagens gränser.

### 7. Snabbprov efter varje delmål
- `npm run typecheck && node --experimental-strip-types --test src/spel/gard/gard3d.test.ts && npm run check:struktur` tar < 3 sekunder och körs efter varje steg.

### 8. Lagom stor runda
- Uppdelad i `G1a`, `G1b` och `G1c` med 4–5 filer per runda.

### 9. Tydlig gräns mot grannrundor
- **Före G1:** S1a och S1b (delning av `Spel.tsx`, `src/spel/ui/vyer.ts` och `src/spel/styr/useGard.ts` på plats).
- **I G1 (G1a–G1c):** Gården i 3D ersätter Phaser-scenen i vyn.
- **Efter G1 (i G2):** Ta bort `src/spel/gard.ts`, `src/spel/ang.ts`, `src/spel/av.ts`, `src/spel/ritaBygg.ts`, `src/spel/rita.ts` och avinstallera `phaser`. Rör inte dessa filer i G1.

### 10. Rätt inställning till rundans tyngd
- `grok-4.7` (eller `build-fast`) på `high` effort.
- **G1a:** 60 turer (tak 70), `RUNDA-G1a.md` före tur 45.
- **G1b:** 65 turer (tak 75), `RUNDA-G1b.md` före tur 50.
- **G1c:** 65 turer (tak 75), `RUNDA-G1c.md` före tur 50.

### 11. Planera först, committa efter varje steg, lämna spår
- Varje beställning kräver `PLAN-G1*.md` inom 6 turer, första kod-/dataändring inom 10 modellanrop, `git commit` efter varje grönt steg och `RUNDA-G1*.md` före sista femtedelen av turerna.

### 12. Bygg och verifiera i samma miljö som produktionen
- Efter G1c körs `npm run build:pages` och `node rundor/G1-garden/matt/skarm-g1.mjs` mot den byggda appen i `375×812`.

### 13. Ingen färdig lösning nåbar under rundan
- Ingen `.patch`-fil och ingen färdig spelkod finns i `rundor/G1-garden/` eller i repot.
- Doodle kör varje runda i en färsk klon i `/tmp` med `--single-branch`.
