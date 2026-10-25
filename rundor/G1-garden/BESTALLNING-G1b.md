Use these skills: typescript-best-practices, 3d-web-game-check, stylized-3d-art-direction

# Runda G1b — Gården i 3D (`Garden3D.tsx`), fast kamera och snäppande byggen/staket i vyn

## Mål i spelarord
När barnet går till Gården (via kartans **Gården**, när barnet bygger något i byggboken, eller via `__troll.plats("gard")`) ser barnet Gården i **3D** på mobilskärmen (`375×812`) med en **fast isometrisk kameravinkel** där hela det `6×10`-stora rutnätet ryms. Hus, stall och andra byggnader står snäppta mot rutorna med sina CC0-modeller ur `data/gard-3d.json`, staket (`fence_simple.glb`) står snäppta längs cellernas kanter, slutna hagar får en varm grön markering på gräset, och barnet kan trycka på ett bygge (för byggmeny/flytt) och trycka på en ruta eller kant för att flytta det dit.

Den gamla Phaser-scenen (`GardScen`) kopplas ur i `src/spel/starta.ts` så att Gården bara har **en** renderväg (R3F). Själva borttagningen av `src/spel/gard.ts` och `phaser`-paketet görs i rundan **G2** efteråt.

---

## Börja med en kort plan (`PLAN-G1b.md`)
Inom de **första 6 turerna** ska du läsa filerna nedan och skriva `PLAN-G1b.md` (max 25 rader). Din **första kodändring** ska göras inom **10 modellanrop**.

Läs bara dessa filer först:
1. `src/spel/gard/rutnat.ts` och `data/gard-3d.json` (från G1a).
2. `src/spel/ui/vyer.ts` och `src/spel/styr/useGard.ts` (från S1).
3. `src/spel/brygga.ts` (hur `"gard"` registreras i `brygga.registrera("gard", ...)`).
4. `src/spel/starta.ts` och `src/styles.css` rad 70–115.

---

## Viktigt skyddsräcke för `npm run check:struktur`
`scripts/check-spel-struktur.mjs` skannar alla `.tsx`-filer under `src/spel/` efter JSX-attributet `data-testid` och jämför mot `rundor/R1-dela-spel/testid-baslinje.json`.
- **Lägg ALDRIG till `data-testid="..."` i JSX i `Garden3D.tsx` eller någon annan `.tsx`-fil!**
- Använd i stället `className="angen-3d garden-3d"` och `data-vy="garden-3d"` på rot-elementet i `Garden3D.tsx`.

---

## Ritning och dataväg (steg för steg)

### Steg 1 — Skapa `src/spel/gard/Garden3D.tsx`
Bygg R3F-vyn för Gården med utgångspunkt i Kodspanarens rekommendation (`/workspace/kod-inkorg/G1-garden/spaning.md`):

1. **Fast kamera med `@react-three/drei`:**
   - Använd `<OrthographicCamera makeDefault position={[10, 12, 10]} zoom={48} near={-40} far={80} />` och `<Bounds fit clip observe margin={1.1} maxDuration={0}>` runt en osynlig ram-mesh (`6 × 10` enheter på marken `y = 0`) så att hela `6×10`-rutnätet alltid ramar in den stående mobilskärmen (`375×812`) med fast kameravinkel (`camera.lookAt(0, 0, 0)`).
   - **Ingen `OrbitControls`!** Kameran är helt fast så att tryck på skärmen alltid träffar byggnader, djur eller rutor utan att snurra kameran.

2. **Ljus, mark, rutnät och slutna hagar:**
   - Använd samma varma ljus och dimma som i `angen3d.tsx` (`MILJO` ur `src/spel/miljo.ts`, `belysScen` ur `src/spel/belys.ts`, nattfaktor `useMinne` / `natt`).
   - Rita gräsmarken (`#7dce6a` med mjuk kant) och diskreta rutnätslinjer/plattor för de `6 × 10` cellerna (`cellTillVarld(gx, gz)`).
   - Beräkna `kanter = kanterForByggen(garden)` och `hagar = hittaSlutnaHagar(kanter)` i `useMemo`.
   - För varje cell `(gx, gz)` som ingår i en `SlutenHage`: rita en varmt ljusgrön/gulgrön markplatta (`#9ccc65` / `#aed581`, `y = 0.015`) så att barnet direkt ser att hagen är sluten!
   - Om ett bygge är i flyttläge (`flyttarUid !== null`), markera lediga celler (för byggnad) eller kanter (för staket) tydligt och snäpp vid klick/tryck på markplanet (`onPointerDown` på mark-meshen → `varldTillCell(e.point.x, e.point.z)` eller `varldTillKant(e.point.x, e.point.z)` → `cellTillXy` / `kantTillXy` → `brygga.skicka({ typ: "byggd", uid: flyttarUid, x, y })`).

3. **Generell byggnads- och staketrendering ur `data/gard-3d.json` (ingen kod per byggnad!):**
   - **Staket (`arKantBygge(b.bygg)`):**
     - Ritas vid varje `KantPlats` som tillhör bygget via `kantTillVarld(k)` (`position={[wx, 0, wz]}`, `rotation={[0, rotY, 0]}`).
     - Använder `/models/natur/fence_simple.glb` (eller `/models/natur/fence_gate.glb` om `b.bygg === "port"` eller om bygget har del `"dörr"`). Om `b.fargHex` finns, tona trämaterialet mjukt.
   - **Byggnader (`!arKantBygge(b.bygg)`):**
     - Placeras i sin cell `cell = xyTillCell(b.x, b.y)` → ` { wx, wz } = cellTillVarld(cell.gx, cell.gz)`.
     - Slå upp `rad = gardData.byggnader[b.bygg]`.
     - Om `rad?.fil` finns: ladda med `useGLTF(rad.fil)`, klona scenen i `useMemo`, kör `belysScen`, beräkna `Box3` och skala modellen så att höjden blir `rad.malhojd` och botten står på `y = 0`. Om `b.fargHex` finns, tona huvudmaterialet.
     - Om `rad?.fil` är `null`: rita en enkel, charmig 3D-reservform utifrån `rad.reserv` (`"hus"`, `"torn"`, `"damm"`, `"trad"`, `"lek"`, `"bro"`) med `b.fargHex ?? rad.farg`.
   - **Tryck på byggnad eller staket (`onPointerDown` / `onPointerUp`):**
     - Räkna ut skärmkoordinat `(nx, ny)` i `[0..1]` genom att projicera byggnadens 3D-position med `camera` (`v.project(camera)` → `nx = (v.x + 1) * 0.5`, `ny = (1 - v.y) * 0.5`).
     - Vid långtryck (≥ 400 ms) **eller** kort tryck när bygget saknar boende (`(b.boende?.length ?? 0) === 0`): skicka `brygga.skicka({ typ: "byggLang", uid: b.uid, x: nx, y: ny })` så att `bygg-meny` (`Flytta`, `Bygg om`, `Lägg i lådan`, `Flytta in djur`) öppnas direkt!
     - Vid kort tryck när bygget har boende (`(b.boende?.length ?? 0) > 0`): skicka `brygga.skicka({ typ: "hemTryck", uid: b.uid, text: b.formel, x: nx, y: ny })`.

4. **Registrering i `brygga` och diagnostik (`window.__gard3d`):**
   - Registrera `"gard"` i `brygga.registrera("gard", { ... })` vid mount och skicka `brygga.skicka({ typ: "redo" })`.
   - Implementera `flyttaBygg(uid)` så att `flyttarUid` sätts till `uid` (och ett klick på marken eller på en ruta/kant flyttar bygget dit).
   - Uppdatera `window.__gard3d = { aktiv: true, celler: { bredd: 6, djup: 10 }, byggen: ..., kanter: ..., hagar: ..., djur: ... }` så att mätskriptet i Playwright kan inspektera rutnät, kanter, slutna hagar och djurpositioner utan att gissa.

---

### Steg 2 — Koppla in `Garden3D` i `src/spel/ui/vyer.ts`, `src/spel/styr/useGard.ts`, `src/spel/starta.ts` och `src/styles.css`
1. **`src/spel/ui/vyer.ts`:**
   - Lägg till posten i `VYER`:
     ```ts
     import { Garden3D } from "../gard/Garden3D.tsx";
     import type { VyDef } from "./typer.ts";

     export const VYER: VyDef[] = [
       {
         id: "garden3d",
         plats: "scen",
         syns: (k) => k.t.varld === "gard" && !k.t.omrade && !k.t.kartaOpp,
         Vy: () => <Garden3D />,
       },
     ];
     ```
   - **Rör inte `src/spel/Spel.tsx`!** `SpelVy.tsx` renderar redan `<VyPlats plats="scen" />`.
2. **`src/spel/styr/useGard.ts`:**
   - I `hanteraBygg`: använd `arKantBygge(b.bygg) ? ledigKantPlats(redan) : ledigCellPlats(redan)` ur `../gard/rutnat.ts` när nya byggen skapas, så att både nya byggnader och nya staket hamnar direkt på rutnätets celler respektive cellkanter!
3. **`src/spel/starta.ts`:**
   - Ta bort `GardScen` ur `scene: [AngScen, GardScen, AvScen]` (så `scene: [AngScen, AvScen]`) och ta bort `game.scene.start("gard")`. Lämna `src/spel/gard.ts` orörd på disk (den städas bort i G2).
4. **`src/styles.css`:**
   - Uppdatera reglerna kring `.ang.tred` så att `.ang:has(.garden-3d)` får samma 3D-bakgrund, döljer Phaser-duken `.duk` och sätter `--duk-x: 0 !important; --duk-y: 0 !important; --duk-w: 1 !important; --duk-h: 1 !important;` så att `dukStil(x, y)` i `AngLager.tsx` stämmer över hela `375×812`-skärmen.

---

### Steg 3 — Kör enhets- och strukturprov + skriv `RUNDA-G1b.md`
Kör:
```bash
node rundor/G1-garden/matt/prov-g1.mjs --fas g1b
npm run typecheck
npm run lint
npm run test:product
npm run check:struktur
```
Skriv `RUNDA-G1b.md` **före tur 50** med status per steg och provresultat.

---

## Tekniska skyddsräcken (får inte brytas)
- **Inga `data-testid`-attribut i JSX** i nya eller ändrade `.tsx`-filer (`npm run check:struktur` måste vara grön).
- **Rör inte `src/spel/Spel.tsx`** och **ändra inga befintliga testfiler**.
- **Ingen `setState` inuti `useFrame`** och inga nya `new THREE.Vector3()` per bildruta.
- **Inga TTS-/ElevenLabs-anrop**.
- **Committa efter varje grönt steg**.

## Reservplan om turerna tar slut
Om du når tur 48: se till att `Garden3D.tsx` renderar rutnät, byggnader, staket och hagar samt är inkopplad i `vyer.ts` och att `check:struktur` och `test:product` är gröna. Skriv `RUNDA-G1b.md`.

## Visa att det fungerar innan du avslutar
1. `node rundor/G1-garden/matt/prov-g1.mjs --fas g1b` ger `"ok": true`.
2. `npm run typecheck && npm run lint && npm run test:product && npm run check:struktur` är gröna.
3. `git status` är ren och `RUNDA-G1b.md` är committad.
