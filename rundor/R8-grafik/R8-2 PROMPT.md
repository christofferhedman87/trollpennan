<!-- Doodle: R8-2a körs EFTER att R9H är mergad (main innehåller src/spel/pekare.ts). Gren runda-r8-2a. Build, inte skript – se GATE-R8-2.md.
export PATH=$PATH:~/.grok/bin; cd /workspace/trollpennan-repo && git checkout main && git pull && test -f src/spel/pekare.ts && git switch -c runda-r8-2a
timeout 50m grok --prompt-file "rundor/R8-grafik/R8-2 PROMPT.md" --cwd /workspace/trollpennan-repo --trust --output-format json \
  --max-turns 40 -m grok-4.7-build-fast --reasoning-effort medium --always-approve > /workspace/runda-r8-2a.json 2> /workspace/runda-r8-2a.err
Kontroll efter 8 min: ändrad källfil i git status, annars titta i loggen. Granska mot bilderna, inte mot Builds rapport. -->
# R8-2a – Skogen, Sjön och Grottan ska kännas fyllda (dekor i rätt skala, som data)

**Avsikt:** när barnet reser till Skogen står det höga granar och träd runt en glänta, buskar, svampar och blommor vid kanterna; vid Sjön en strand med vass, stenar och näckrosor och en skog på andra sidan; i Grottan klippor, kristaller och droppstenar runt en mörk sal. Mitten är fri för barnets djur. Ängen ser ut som förut.

**Skills:** threejs, building-games (design-ui bara om du rör HUD – det ska du inte). Installera dem först om de saknas.

**Läget (mätt av Arkitekten, du behöver inte mäta):**
- `PlatsDekor` (`src/spel/ang/PlatsDekor.tsx`) ritar `platser.json` `start` med en `GltfSak` per sak i en grupp med `scale={1.45}`. Höjden kommer ur `malhojd()` (nästan allt 1,2) × `skala` → träd blir ~1,6 m bredvid en kanin på 1 m, svampar 0,5 m.
- Telefonen (375×812, `PlatsKamera` (0, 3.05, 6.8), fov 58) ser bara en smal kil: plats-x **0,30–0,70** vid plats-y 0,3 och **0,36–0,64** vid y 0,62; marken syns bakåt till plats-y ≈ −0,4 (bakom ytan). Därför ligger det mesta av `start` (x 0,06–0,22 och 0,78–0,94) utanför bilden. Kameran kan vridas ±60° (OrbitControls), så kanterna syns när barnet drar.
- Barnets djur står i plats-x 0,30–0,70, plats-y 0,56–0,86 (`djurPlats`/`LAND_SLOT` i `ang/delat.ts`), simmare vid (0,57; 0,69), flygare på höjd 1,55.
- Återanvänd: `Stall({ url, platser })` i `src/spel/kenneyNatur.tsx` ritar en GLB som **instansierade** nät (ett draw call per material oavsett antal), platser `[x, z, höjd, rotY, sänkning]` i världsenheter (ängens ekar har höjd 2,4–3,0; kanin = 1). `Horisont()` i `src/spel/ang/dekor.tsx` (tre halvcirklar + trädkoner) är ängens horisont. Modeller med dokumenterad licens: `data/tillgangar.json` (genererar `LICENSES.md`), bl.a. raden `natur` = mappen `/models/natur/` (Kenney Nature Kit, CC0, 22 filer: `tree_pineRoundA tree_default tree_oak tree_fat plant_bush plant_bushLarge plant_bushDetailed rock_largeA rock_smallA stone_smallA mushroom_redGroup mushroom_tanGroup flower_redA flower_yellowA flower_purpleA grass_large lily_large lily_small stump_round path_stone fence_simple fence_gate`) och entiteterna `klippa klippblock kristall droppsten klippvagg berg vass ormbunke sten` (bulk, CC0).

**Ritning, i prioritetsordning:**
0. `rundor/BLOCK-platser/verktyg/lagg-data.mjs` (rad ~57): när en platsrad ersätts ur `data-utkast/platser.json`, **behåll** `start`, `zoner` och `dekor` från den befintliga raden i `data/platser.json` om de finns (`{ ...rad, start: gammal.start ?? rad.start, zoner: gammal.zoner ?? rad.zoner, dekor: gammal.dekor ?? rad.dekor }`). Annars skriver B2–B4 över R9G:s och den här rundans scendata.
1. `src/spel/kenneyNatur.tsx`: exportera `Stall` som `InstansModell` (behåll ängens användning oförändrad).
2. `src/spel/platser.ts`: `export type DekorRad = { modell: string; antal: number; hojd: [number, number]; zon: string; fro?: number; vatten?: boolean }` och `dekor?: DekorRad[]` på `Plats`. `zon` är id i platsens `zoner`. Ny zontyp `"dekor"` och `"fri"` (rektanglar `rekt` i 0–1, y får vara negativt = bakom ytan).
3. `src/spel/platsDekor.ts`: `export function spridDekor(p: Plats | undefined): { url: string; platser: [number, number, number, number, number][]; saknas?: string }[]` – ren funktion utan three. Deterministisk slump (mulberry32 med `fro ?? radindex`), punkter i zonens `rekt` via `tillVarld`, **inte** i någon zon av typ `"fri"`, minst 0,5 världsenheter mellan saker i samma rad, höjd slumpad i `hojd`, rotY 0–2π. Allt i **gruppens lokala enheter** (dela världsmått med 1,45, gruppens skala). `modell`: `"natur/<fil>"` → `/models/natur/<fil>.glb`; annars entitetens `modellUrl()`. Okänd modell → `saknas` (loggas en gång som i dag).
4. `src/spel/ang/PlatsDekor.tsx`: rita `spridDekor(p)` med `<InstansModell>` i samma grupp som `start` (Suspense + `SakGren` per rad). `vatten: true` → y 0,03 (näckrosor). Lägg en instansierad blobbskugga (en `instancedMesh`, `circleGeometry`, svart, opacity 0,16, `depthWrite={false}`) under varje dekorsak med radie ≈ 0,35 × höjd.
5. `src/spel/ang/dekor.tsx`: `Horisont({ farger }: { farger?: [string, string, string] })` – standard = dagens färger; `PlatsScen` ritar `<Horisont farger={miljo.horisont} />` om platsens `miljo.horisont` finns. Ängen anropar som förut.
6. `data/platser.json` – lägg till zoner och `dekor` för skogen, sjon, grottan. **Startvärden** (justera bara siffror i datan efter bilderna, inte koden). Kanin = 1:
   - Alla tre: zon `fri` `[0.30, 0.52, 0.70, 0.90]`; `bakkant` `[0.08, -0.45, 0.92, 0.22]`; `vanster` `[0.10, 0.22, 0.32, 0.92]`; `hoger` `[0.68, 0.22, 0.90, 0.92]`.
   - **skogen** (`miljo.horisont` `["#7FA7B5", "#5E8A6A", "#2F5A30"]`): `natur/tree_pineRoundA` 8 st höjd [2.6, 3.8] bakkant · `natur/tree_default` 4 [2.2, 3.0] bakkant · `natur/tree_oak` 2 [2.4, 3.0] vanster · `natur/tree_fat` 2 [2.2, 2.8] hoger · `natur/plant_bushLarge` 4 [0.7, 1.0] vanster+hoger (två rader) · `natur/mushroom_redGroup` 4 [0.25, 0.35] · `natur/flower_yellowA` 4 och `natur/flower_purpleA` 4 [0.25, 0.35] · `natur/rock_smallA` 3 [0.3, 0.5] · `natur/stump_round` 2 [0.3, 0.4] · `natur/grass_large` 10 [0.25, 0.4].
   - **sjon** (`miljo.horisont` `["#9CC3D6", "#6F9C8A", "#3C6B44"]`): bakkant = andra stranden: `natur/tree_pineRoundA` 8 [2.4, 3.4] · `natur/tree_default` 4 [2.0, 2.8]; zon `vattenyta` (finns redan): `natur/lily_large` 5 och `natur/lily_small` 5 [0.25, 0.35] `vatten: true`; `vanster` (stranden): `vass` 6 [0.6, 0.9] · `natur/rock_largeA` 3 [0.6, 0.9] · `natur/rock_smallA` 4 [0.25, 0.4] · `natur/plant_bush` 4 [0.5, 0.8] · `natur/grass_large` 8 [0.25, 0.4].
   - **grottan** (`miljo.horisont` `["#4A4458", "#3A3546", "#2A2633"]`): `klippvagg` 3 [2.6, 3.6] bakkant · `klippa` 4 [1.6, 2.4] vanster+hoger · `klippblock` 4 [0.6, 1.0] · `kristall` 5 [0.4, 0.7] · `natur/mushroom_tanGroup` 4 [0.25, 0.35] · `sten` 6 [0.25, 0.45] · `droppsten` 4 [0.6, 1.0] vanster+hoger (står på marken som droppstenar).
   - Lämna `start` orörd utom: flytta saker som hamnat mitt i `fri` ut till kanten. Rör inte `uppdrag`, `hemliga`, `intro`, `upplasning` (Copilot-data).
7. Test `src/spel/r8-2.test.ts` (lägg i `test:product`): varje `dekor.modell` finns som fil under `public/models/` och har en licensrad i `tillgangar.json` (eller är `natur/…`); varje `zon` finns; `spridDekor` ger samma punkter två gånger; ingen punkt ligger i `fri`; summa `antal` per plats ≤ 70 och antal olika modeller per plats ≤ 14.
8. Prov `rundor/R8-grafik/r8-2-prov.mjs` (Playwright 375×812 mot `dist-pages`, mall: `rundor/R9H-fix/r9h-prov.mjs` + draw calls/trianglar som i `fore-efter.mjs`): för varje plats `ang`, `skogen`, `sjon`, `grottan` en bild rakt fram och en vriden ±50° (drag), med och utan 3 djur (`window.__troll.vakna`). Skriv mått till `docs/skarmbilder/r8-2/matt.json`.
Ändra inget annat; lägg inte till funktioner. Phaser, spellogik, HUD och texter orörda.

**Skrivregel:** första ändringen inom 10 verktygsanrop, inga mätskript eller bred utforskning (måtten ovan gäller), commit efter varje steg 0–8, skriv `RUNDA-R8-2a.md` innan turerna tar slut.

**Reservplan:** räcker inte tiden: gör 0–4, 6 (bara skogen) och 7; hoppa över horisonten (5) och provet för sjön/grottan, och skriv vad som saknas.

**Skyddsräcken:** ingen setState i useFrame, inga nya objekt per bildruta (allt i useMemo/useLayoutEffect); instansiering i stället för en `GltfSak` per dekorsak; **≤ 180 draw calls och ≤ 60 000 trianglar per plats** (mät, sänk `antal` i datan om det går över); `kvalitet.lag` ska inte bli långsammare; 375×812 först; inga nya modellfiler och inga modeller utan licensrad; ingen kod per plats eller per modell – allt ur `dekor`.

**Visa att:**
1. `r8-2-skogen.png`, `r8-2-sjon.png`, `r8-2-grottan.png` (rakt fram, 3 djur): bilden är fylld ända ut till kanterna och upp till horisonten, djuren syns fritt i mitten och inget djur skyms av dekor.
2. `r8-2-*-vriden.png`: kanterna har dekor även när barnet drar.
3. Skala: en gran är minst 2,5× kaninen, en svamp/blomma högst 0,4× (syns i bilderna med djur).
4. `r8-2-ang.png` är oförändrad mot main (samma draw calls ± 2).
5. `matt.json`: draw calls och trianglar per plats under taken; `r8-2.test.ts`, `test:product`, `typecheck`, `typecheck:pages`, `eslint` (0 fel), `check:struktur`, `build:pages` gröna; `r9h-prov.mjs` fortfarande exit 0.

**Slutbedömning:** `RUNDA-R8-2a.md`: vad som inte är klart, de 3 svagaste ställena i bilderna (stilbrott mellan paket, skala, tomrum), mått före/efter, risker för R8-2b.

---
**R8-2b (ritas efter granskning av R8-2a, körs inte nu):** kantlinje (inverterat skal) på GLB-djur med `kontur.tjocklek` i `miljo.json`, vatten med enkel vågrörelse i shadern, vind i träden (vertex-svaj i InstansModell), automatisk FPS-vakt `hog`→`lag` om p95 > 40 ms i 3 s.
