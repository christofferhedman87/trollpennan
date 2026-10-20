# R8-3 – färg från färgord + grafiken som blev kvar från R8-2 (Arkitekten, 2026-10-20)

**Christoffers beslut (2026-10-20):** R8-3 är nästa block och körs direkt efter modellpaketen M21–M28 (1 154 modeller).
Innehåll: (a) R9C – djur och saker får färgen barnet skriver, på alla modeller; (b) grafikförbättringarna som planerades men inte kom med i R8-2a/R8-2b.
Ordning: B6.3 → B6.5 (fixar, väntar) och M23–M28 först; sedan R8-3a … R8-3e i tur och ordning, en gren och en PR per delrunda.

## 1. Kvar från R8-2 (med källa)
| # | Punkt | Källa | Läge på main e87b1ba |
|---|---|---|---|
| K1 | Färg från färgord på alla modeller (R9C: röd blev orange, grön gulgrön, vita/grå djur och GLB utan palett tog ingen färg) | PROJECT.md §R9C (r.160), RITNING.md R8-1 punkt 4, B6.4-fix/PLAN.md "Kvar, R9C" | **Görs i R8-3a (klar patch)** |
| K2 | Kantlinje (inverterat skal) på GLB-djur och -saker, `kontur.tjocklek` i miljo.json (+1 draw call per nät: mät) | RITNING.md "R8-2", R8-2 PROMPT.md "R8-2b (körs inte nu)", R8-2b/PLAN.md "Kvar till senare" | Bara procedurdjur, ordägg och tillbehör har kontur (`KONTUR_MAT` djur.tsx r.43). GLB: ingen |
| K3 | Enhetliga material (toon + standard blandat ger olika look mellan paketen) | RITNING.md bedömning punkt 5 | Ej gjort |
| K4 | Vind i träden (vertex-svaj i InstansModell) | RITNING.md "R8-2", R8-2 PROMPT.md R8-2b-raden | Ej gjort |
| K5 | Trädvariation: färgjitter per instans | RITNING.md "R8-2" | Ej gjort (`InstansModell` har bara matris per instans) |
| K6 | Vatten med enkel vågrörelse i shadern | RITNING.md "R8-2", R8-2 PROMPT.md, R8-2b/PLAN.md | Ej gjort; B6.3 rättar bara dammens djup (damm.ts `SVAJ_AMP`, `DAMM`) |
| K7 | Automatisk FPS-vakt `hog`→`lag` om p95 > 40 ms i 3 s | RITNING.md "R8-2", R8-2 PROMPT.md, R8-2b/PLAN.md | Ej gjort (`KV` i miljo.ts är en konstant vid start) |
| K8 | Telefonmätning av bildrutetid (R8-1 mättes bara i mjukvaru-GL) | RITNING.md R8-1 "Resultat", PROMPT.md steg 5 | Ej gjort |
| K9 | Horisont: mjuk silhuett i två lager och lägre dis (ängens hårda band) | RITNING.md "R8-2" | Delvis: R8-2b gav horisont per plats (skog/berg/ingen). Två lager och dis-justering ej gjort |
| K10 | Sjöns sidodekor glesare (vass/sten fick inte stå på vattnet) | R8-2b/PLAN.md "Kvar till senare" | Ej gjort |
| K11 | Blobbskuggor under alla djur och hus | RITNING.md "R8-2" | Klart för dekor (R8-2a) och djur (djur.tsx cirkel). Byggnader: `byggnader.tsx` har cirkel; inget kvar |
| K12 | KTX2-texturer 512 px för mark/träd, filtak höjs | RITNING.md "R8-2" | **Behövs inte**: R8-2 lade inga texturer, marken ritas på canvas. Släpps |
| K13 | Smakval mjuk/pixel mark, mättnad/vinjett | RITNING.md "Kräver Christoffers ja" | Står på `mjuk`; ingen ändring utan hans ord |

## 2. Delrundor
Alla rör bara rendering. Phaser, spellogik, HUD, texter och Copilot-granskad data (`granskad: true`) rörs inte. Inga nya modellfiler, inga pengar. Varje delrunda: egen gren `runda-r83x-kod`, kor.sh med exit 2/3/4 som B6.x, bilder 375x812 i `/workspace/trollpennan-nulage/r83x-bilder/`.

### R8-3a – färg från färgord (K1). **Patch + kor.sh, 0 USD** (klar i scratch, levereras i egen PR)
Se `rundor/R8-3a-farg/PLAN.md`. Filer: `src/spel/fargning.ts` (`fargning`, `kroppsRoller`, `valjKarna`, `KROPP`), `src/spel/gltfDjur.tsx` (`fargaKlon`, `karnfarg`, `ytaPerMaterial`), `src/spel/entiteter.ts` (roll `behall`), test `src/spel/r8-3a.test.ts`. Data: valfri `material: {namn: "farg"|"ljus"|"behall"}` per entitet (finns redan för 76; behövs inte för nya). Bevis: `r83a-prov.mjs` (10 fall), `r83a-alla.mjs` (bredd över alla modeller).

### R8-3b – FPS-vakt (K7, K8). **Patch + kor.sh, 0 USD**
Först, eftersom R8-3c/d lägger på kostnad och telefonen ska skyddas innan.
- `data/miljo.json`: `fpsvakt: { p95_ms: 40, fonster_s: 3, paus_s: 5 }`.
- `src/spel/miljo.ts`: `kvalitetsniva()` läser också `localStorage["trollpennan-kvalitet"]` (efter `?kvalitet=`); ny `sattKvalitet(n)` sparar.
- Ny `src/spel/ang/FpsVakt.tsx` (i `angen3d.tsx` inne i `<Canvas>`): `useFrame` samlar delta i en fast `Float32Array` (ingen allokering, ingen setState), räknar p95 över fönstret efter `paus_s`; över taket → `sattKvalitet("lag")`, `useThree().setDpr(KV_lag.dpr_max)`, `gl.shadowMap` storlek vid nästa start; `window.__fps = { p95, niva }` för prov.
- Test `r8-3b.test.ts` (ren p95-funktion `p95(buf, n)` i `miljo.ts`). Prov `r83b-prov.mjs`: `?fpstest=80` (en fast extra väntan per bildruta, bara i prov) → nivån blir `lag` inom 8 s; utan → `hog` kvar.
- Storlek: 4 filer, ~120 rader. Turer för Doodle: 1 kör.

### R8-3c – kontur och enhetligt material på GLB (K2, K3). **Patch + kor.sh, 0 USD; tjockleken är smak → två värden i bild**
- `data/miljo.json` `kontur: { farg, tjocklek: 0.035, glb: true, max_nat: 6 }`.
- `src/spel/gltfDjur.tsx`: ny `lagKontur(rot, tjocklek)` efter `fargaKlon`: för varje nät (högst `max_nat` största, resten utan) en syskon-mesh med samma geometri och `KONTUR_MAT` (BackSide, delad), skalad i normalens riktning via `onBeforeCompile` (`transformed += normal * tjocklek`) så att skinnade nät följer skelettet (för `SkinnedMesh`: `new THREE.SkinnedMesh(geo, mat)` + `bind(skeleton, bindMatrix)`). Samma i `GltfSak` och `InstansModell` (instansierad kontur, ett draw call per del).
- Material: `metallNoll` sätter redan metalness 0 / roughness ≥ 0,75 – lägg `flatShading` av och `envMapIntensity` 0 så Kenney/Quaternius/Gobkit ser lika ut. Ingen MeshToon-byte (skulle kräva om B4.1:s ljuspool).
- Tak: ≤ 180 draw calls på ängen med 8 djur (`fore-efter.mjs`), annars sänk `max_nat` i data.
- Prov `r83c-prov.mjs`: ängen med 6 djur, `tjocklek` 0,025 och 0,04 (via `trollpennan-miljo`), mörk kantpixel-andel runt figuren, draw calls. **Christoffer väljer tjocklek ur bilderna** (värdet i data, ingen kod).
- Storlek: 4 filer, ~150 rader.

### R8-3d – levande natur: vind, färgjitter, vatten (K4, K5, K6). **Patch + kor.sh, 0 USD**
- `src/spel/platser.ts` `DekorRad`: `vind?: number` (amplitud, 0 = stilla) och `jitter?: number` (0–0,15 ljushet/nyans). `data/platser.json` dekor-rader med träd/buskar/vass får `vind`, `jitter`; ängens `KenneyNatur` läser samma fält ur `data/miljo.json` `natur: { vind, jitter }`.
- `src/spel/kenneyNatur.tsx` `InstansModell({ …, vind, jitter })`: `instanceColor` med deterministiskt jitter (mulberry32 per plats-index); vind via ett delat `onBeforeCompile` (`uTid` uniform, svaj ∝ höjd² i objektets y, fas ur instansens position) – en uniform uppdateras i en `useFrame`, inga nya material per bildruta.
- Vatten: `angen3d.tsx` dammen (r.116) och `PlatsDekor.tsx` `vattenyta` (r.98) får `vattenMaterial()` (ny i `src/spel/ang/damm.ts`): samma MeshStandard med `onBeforeCompile` som rör normalen med två sinusvågor och ljusa krusningar (ingen vertexförflyttning, så B6.3:s djupmarginal håller).
- Prov `r83d-prov.mjs`: två bildrutor 0,5 s isär – trädtoppar och vatten ändras, marken och djuren inte; draw calls oförändrade ± 2; B6.3:s `b63-prov` (dammens vatten) fortsatt grönt.
- Storlek: 5 filer, ~160 rader.

### R8-3e – horisont, dis och sjöns kanter (K9, K10). **Build (smak), ~2–4 USD inom kvoten**
Två lager silhuett (nära kullar + fjärran blåare), lägre/varmare dis på ängen och tätare sjökant är en bildfråga: ändra data → bygg → titta → justera. Det gör Build i en körning (som R8-2a), en patch blir en gissning.
- Prompt skrivs efter R8-3d (build-prompt): `Horisont` (dekor.tsx r.589) får `lager?: 2`, `miljo.json` `dis.nara/fjarran` per plats via `miljo` i platser.json, sjöns `vanster/hoger`-zoner i platser.json. Inget annat.
- `--max-turns 30`, `grok-4.7-build-fast`, `--reasoning-effort medium`, gren `runda-r8-3e`, logg `/workspace/runda-r8-3e.json`.
- Bevis: `r8-2-prov.mjs` (finns) per plats rakt/vriden; ängen ±2 draw calls.

## 3. Grindutlåtande (build-round-gate) per delrunda
| Delrunda | Dom | Varför |
|---|---|---|
| R8-3a | **JA – klar, kör efter M28** | Systemfix (en generell regel, ingen kod per djur). Datavägen spårad: `vakna/tolka` → `Sparad.farg` (hex ur ord.json) → `djur.tsx` → `GltfDjur` → `fargaKlon` → `kroppsRoller` → materialklon. Prov faller före (5 av 8 färgfall FEL på main+B6.3+B6.5) och går efter (10/10). EXIT=0 i ren kopia. |
| R8-3b | **JA (patch)** | Litet, mätbart, skyddar telefonen före R8-3c/d. Datavägen: `miljo.json` → `miljo.ts KV` → `Canvas dpr`/skuggkarta. Inget smakval. |
| R8-3c | **JA (patch), smakval efteråt** | Mönstret finns redan (`KONTUR_MAT`, inverterat skal). Risk: draw calls (+1 per nät) och skinnade nät – taket och `max_nat` i data, prov mäter. Tjockleken väljs av Christoffer ur två bilder; värdet är data. |
| R8-3d | **JA (patch)** | Shaderknep med en uniform; testbart med bildskillnad mellan två bildrutor. Risk: shader-omkompilering (B4.1-hacket) – ett delat material per modell, inga nya material efter start. |
| R8-3e | **JA som Build, men först efter R8-3d och granskning** | Ren smakfråga i bild. Prompt skrivs då (build-prompt), inte nu: grind punkt 1 (PROJECT.md aktuell efter R8-3d) och 5 (dataväg) görs då. |
| K12 KTX2 | **NEJ** | Inget behov: inga nya texturer. |
| K13 mark/mättnad | **Ingen runda** | Christoffers smak; står kvar på `mjuk`. |

## 4. Kostnad
R8-3a–d: 0 USD (skript). R8-3e: Build inom kvoten, gissning 2–4 USD (R8-2a: 3,93 USD).
