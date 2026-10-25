Use these skills: typescript-best-practices, 3d-web-game-check. Install them first if missing.

# Runda G1a — Gårdens 1,0-rutnät, kantstaket, BFS-hage och gårdsdata (`data/gard-3d.json`)

## Mål i spelarord
När barnet bygger hus, stall och staket på Gården ska varje byggnad snäppa mot en ruta i ett `6×10`-rutnät (cellstorlek `1,0`) och varje staket ska snäppa mot en cellkant (`N` eller `W`). När staket bildar en sluten ring runt en eller flera rutor ska spelet känna igen det inhägnade området som en **sluten hage** (via BFS-fyllning utifrån kartans kant), och varje byggord i spelet ska ha sin 3D-modell och reservform beskriven som data i `data/gard-3d.json`.

Det här är runda **G1a av 3** (ren datatabell + rutnäts-/kantgeometri + BFS-hagelösare + enhetstester). Ingen R3F-komponent ritas i G1a — 3D-vyn byggs i G1b och djurvandringen i G1c.

---

## Skriv-först-regel och plan (`PLAN-G1a.md`)
- Läs bara `rundor/G1-garden/facit-g1.json` och `src/spel/bygge.ts` först — ingen bred utforskning.
- Skriv `PLAN-G1a.md` (max 25 rader) och gör din **första filändring** (`data/gard-3d.json`) inom **de första 6 turerna** (högst 10 verktygsanrop).
- Committa efter varje grönt steg (`git add ... && git commit -m "G1a: ..."`).
- Skriv `RUNDA-G1a.md` **före tur 45** (om turerna närmar sig 42, prioritera `RUNDA-G1a.md` direkt).

---

## Ritning och dataväg (i prioriteringsordning)

### Steg 1 — Skapa `data/gard-3d.json`
Alla 12 nya CC0-modeller för Gården ligger redan i `public/models/gard/*.glb` och är registrerade i `data/tillgangar.json` och `LICENSES.md`. Befintliga staket och naturmodeller ligger i `public/models/natur/*.glb` och `public/models/bulk/*.glb`.

Skapa `data/gard-3d.json` med exakt denna struktur (alla filvägar och `tillgangId` nedan är verifierade mot `public/` och `data/tillgangar.json`):
```json
{
  "rutnat": {
    "bredd": 6,
    "djup": 10,
    "cellStorlek": 1.0,
    "xMin": 0.10,
    "xSpan": 0.80,
    "yMin": 0.32,
    "ySpan": 0.60
  },
  "kamera": {
    "position": [10, 12, 10],
    "zoom": 48,
    "near": -40,
    "far": 80,
    "margin": 1.1
  },
  "staket": {
    "enkelFil": "/models/natur/fence_simple.glb",
    "grindFil": "/models/natur/fence_gate.glb",
    "kantOrd": ["staket", "mur", "port"]
  },
  "byggnader": {
    "stall": { "fil": "/models/gard/stall-fantasy-quaternius.glb", "tillgangId": "gard-stall-fantasy", "malhojd": 1.45, "reserv": "hus", "farg": "#B71C1C" },
    "hus": { "fil": "/models/gard/hus-fantasy-quaternius.glb", "tillgangId": "gard-hus-fantasy", "malhojd": 1.55, "reserv": "hus", "farg": "#E57373" },
    "stuga": { "fil": "/models/gard/gard-liten-quaternius.glb", "tillgangId": "gard-liten", "malhojd": 1.15, "reserv": "hus", "farg": "#C62828" },
    "koja": { "fil": "/models/gard/koja-quaternius.glb", "tillgangId": "gard-koja", "malhojd": 0.95, "reserv": "hus", "farg": "#A1887F" },
    "hundkoja": { "fil": "/models/bulk/koja.glb", "tillgangId": "koja", "malhojd": 0.85, "reserv": "hus", "farg": "#8D6E63" },
    "fågelholk": { "fil": "/models/gard/honshus-quaternius.glb", "tillgangId": "gard-honshus", "malhojd": 1.05, "reserv": "hus", "farg": "#A1887F" },
    "pepparkakshus": { "fil": "/models/gard/bod-quaternius.glb", "tillgangId": "gard-bod", "malhojd": 1.15, "reserv": "hus", "farg": "#8D6E63" },
    "trädhus": { "fil": "/models/gard/lada-liten-quaternius.glb", "tillgangId": "gard-lada-liten", "malhojd": 1.45, "reserv": "hus", "farg": "#6D4C41" },
    "slott": { "fil": "/models/bulk/slott.glb", "tillgangId": "slott", "malhojd": 1.75, "reserv": "torn", "farg": "#B0BEC5" },
    "torn": { "fil": "/models/bulk/torn.glb", "tillgangId": "torn", "malhojd": 1.65, "reserv": "torn", "farg": "#B0BEC5" },
    "fyr": { "fil": "/models/bulk/slottstorn.glb", "tillgangId": "slottstorn", "malhojd": 1.7, "reserv": "torn", "farg": "#EF5350" },
    "tält": { "fil": "/models/bulk/talt.glb", "tillgangId": "talt", "malhojd": 1.0, "reserv": "hus", "farg": "#FFA726" },
    "träd": { "fil": "/models/natur/tree_oak.glb", "tillgangId": null, "malhojd": 1.4, "reserv": "trad", "farg": "#43A047" },
    "äppelträd": { "fil": "/models/natur/tree_fat.glb", "tillgangId": null, "malhojd": 1.45, "reserv": "trad", "farg": "#43A047" },
    "gran": { "fil": "/models/bulk/gran.glb", "tillgangId": "gran", "malhojd": 1.5, "reserv": "trad", "farg": "#2E7D32" },
    "palm": { "fil": "/models/bulk/palm.glb", "tillgangId": "palm", "malhojd": 1.45, "reserv": "trad", "farg": "#66BB6A" },
    "blomma": { "fil": "/models/natur/flower_redA.glb", "tillgangId": null, "malhojd": 0.45, "reserv": "trad", "farg": "#F06292" },
    "buske": { "fil": "/models/natur/plant_bushLarge.glb", "tillgangId": null, "malhojd": 0.55, "reserv": "trad", "farg": "#66BB6A" },
    "svamp": { "fil": "/models/bulk/svamp.glb", "tillgangId": "svamp", "malhojd": 0.45, "reserv": "trad", "farg": "#EF5350" },
    "bänk": { "fil": "/models/bulk/bank.glb", "tillgangId": "bank", "malhojd": 0.65, "reserv": "lek", "farg": "#8D6E63" },
    "brunn": { "fil": "/models/bulk/brunn.glb", "tillgangId": "brunn", "malhojd": 0.9, "reserv": "torn", "farg": "#90A4AE" },
    "fontän": { "fil": "/models/bulk/fontan.glb", "tillgangId": "fontan", "malhojd": 1.0, "reserv": "damm", "farg": "#4FC3F7" },
    "gunga": { "fil": "/models/bulk/gungbrada.glb", "tillgangId": "gungbrada", "malhojd": 0.85, "reserv": "lek", "farg": "#FF7043" },
    "rutschkana": { "fil": null, "tillgangId": null, "malhojd": 1.0, "reserv": "lek", "farg": "#AB47BC" },
    "studsmatta": { "fil": null, "tillgangId": null, "malhojd": 0.65, "reserv": "lek", "farg": "#42A5F5" },
    "sandlåda": { "fil": null, "tillgangId": null, "malhojd": 0.45, "reserv": "lek", "farg": "#FFCA28" },
    "karusell": { "fil": null, "tillgangId": null, "malhojd": 0.95, "reserv": "lek", "farg": "#EC407A" },
    "klätterställning": { "fil": null, "tillgangId": null, "malhojd": 1.1, "reserv": "lek", "farg": "#26A69A" },
    "bro": { "fil": "/models/bulk/bro.glb", "tillgangId": "bro", "malhojd": 0.65, "reserv": "bro", "farg": "#8D6E63" },
    "regnbågsbro": { "fil": "/models/bulk/bro.glb", "tillgangId": "bro", "malhojd": 0.75, "reserv": "bro", "farg": "#FF7043" },
    "damm": { "fil": null, "tillgangId": null, "malhojd": 0.2, "reserv": "damm", "farg": "#4FC3F7" },
    "vallgrav": { "fil": null, "tillgangId": null, "malhojd": 0.2, "reserv": "damm", "farg": "#4FC3F7" },
    "lykta": { "fil": "/models/bulk/lykta.glb", "tillgangId": "lykta", "malhojd": 1.1, "reserv": "torn", "farg": "#37474F" },
    "staket": { "fil": null, "tillgangId": null, "malhojd": 0.7, "reserv": "hus", "farg": "#FFFFFF" },
    "mur": { "fil": null, "tillgangId": null, "malhojd": 0.85, "reserv": "torn", "farg": "#9E9E9E" },
    "port": { "fil": null, "tillgangId": null, "malhojd": 1.1, "reserv": "torn", "farg": "#795548" }
  },
  "dekor": [
    { "fil": "/models/gard/hobal-kenney-hay-bale-bundled.glb", "tillgangId": "gard-hobal-bunt", "wx": -3.1, "wz": -4.6, "rotY": 0.3, "malhojd": 0.55 },
    { "fil": "/models/gard/hobal-kenney-hay-bale.glb", "tillgangId": "gard-hobal", "wx": 3.1, "wz": -4.5, "rotY": -0.4, "malhojd": 0.4 },
    { "fil": "/models/gard/hobal-kenney-hay-bale.glb", "tillgangId": "gard-hobal", "wx": -3.1, "wz": 4.4, "rotY": 0.8, "malhojd": 0.4 }
  ]
}
```

---

### Steg 2 — Skapa `src/spel/gard/rutnat.ts` (ren logik utan Three/DOM, ≤ 250 rader)
Bygg en ren TypeScript-modul som kan importeras direkt i Node (`node --experimental-strip-types`):

1. **Typer och konstanter ur `data/gard-3d.json`:**
   - Exportera `GARD_BREDD = 6`, `GARD_DJUP = 10`, `CELL_STORLEK = 1.0`, `X_MIN = 0.10`, `X_SPAN = 0.80`, `Y_MIN = 0.32`, `Y_SPAN = 0.60`.
   - `export interface CellPlats { gx: number; gz: number }` (`0 <= gx < 6`, `0 <= gz < 10`).
   - `export type KantRiktning = "N" | "W"`.
   - `export interface KantPlats { gx: number; gz: number; kant: KantRiktning }`:
     - `"N"` = horisontell kant på norra sidan av cell `(gx, gz)`, tillåtet `0 <= gx < GARD_BREDD` och `0 <= gz <= GARD_DJUP` (`gz = GARD_DJUP` är sydkanten på nedersta raden `gz = 9`).
     - `"W"` = vertikal kant på västra sidan av cell `(gx, gz)`, tillåtet `0 <= gx <= GARD_BREDD` och `0 <= gz < GARD_DJUP` (`gx = GARD_BREDD` är östkanten på högra kolumnen `gx = 5`).
   - `export interface SlutenHage { id: string; celler: CellPlats[]; kanter: string[] }`.

2. **Koordinatfunktioner (bijektiva och säkra mot `minne.ts`-klampning `[0.06..0.94] × [0.30..0.94]`):**
   - `arKantBygge(bygg: string): boolean` — sant om `bygg` finns i `gard3d.staket.kantOrd` (`"staket"`, `"mur"`, `"port"`).
   - `cellNyckel(gx: number, gz: number): string` → `"${gx},${gz}"`.
   - `kantNyckel(k: KantPlats): string` → `"${k.gx},${k.gz},${k.kant}"`.
   - `cellTillXy(gx: number, gz: number): { x: number; y: number }`:
     - `x = X_MIN + ((gx + 0.5) / GARD_BREDD) * X_SPAN`
     - `y = Y_MIN + ((gz + 0.5) / GARD_DJUP) * Y_SPAN`
   - `xyTillCell(x: number, y: number): CellPlats`:
     - `fx = ((x - X_MIN) / X_SPAN) * GARD_BREDD`
     - `fz = ((y - Y_MIN) / Y_SPAN) * GARD_DJUP`
     - `gx = Math.max(0, Math.min(GARD_BREDD - 1, Math.round(fx - 0.5)))`
     - `gz = Math.max(0, Math.min(GARD_DJUP - 1, Math.round(fz - 0.5)))`
   - `kantTillXy(k: KantPlats): { x: number; y: number }`:
     - Om `k.kant === "N"`: `fx = k.gx + 0.5`, `fz = k.gz`.
     - Om `k.kant === "W"`: `fx = k.gx`, `fz = k.gz + 0.5`.
     - `x = X_MIN + (fx / GARD_BREDD) * X_SPAN`, `y = Y_MIN + (fz / GARD_DJUP) * Y_SPAN`.
     *(Alla giltiga kanter hamnar inom `[0.10, 0.90] × [0.32, 0.92]`, strikt innanför `flyttaBygge`-klampningen `[0.06, 0.94] × [0.30, 0.94]` i `src/spel/minne.ts`!)*
   - `xyTillKant(x: number, y: number): KantPlats`:
     - `fx = ((x - X_MIN) / X_SPAN) * GARD_BREDD`
     - `fz = ((y - Y_MIN) / Y_SPAN) * GARD_DJUP`
     - Närmaste `"N"`-kant: `ngx = clamp(Math.round(fx - 0.5), 0, GARD_BREDD - 1)`, `ngz = clamp(Math.round(fz), 0, GARD_DJUP)`, avstånd `Math.hypot(fx - (ngx + 0.5), fz - ngz)`.
     - Närmaste `"W"`-kant: `wgx = clamp(Math.round(fx), 0, GARD_BREDD)`, `wgz = clamp(Math.round(fz - 0.5), 0, GARD_DJUP - 1)`, avstånd `Math.hypot(fx - wgx, fz - (wgz + 0.5))`.
     - Returnera den av `"N"` och `"W"` som har kortast avstånd (`<=` ger `"N"`).
   - `cellTillVarld(gx: number, gz: number): { wx: number; wz: number }`:
     - `wx = (gx - GARD_BREDD / 2 + 0.5) * CELL_STORLEK` (`-2.5 .. +2.5`)
     - `wz = (gz - GARD_DJUP / 2 + 0.5) * CELL_STORLEK` (`-4.5 .. +4.5`)
   - `varldTillCell(wx: number, wz: number): CellPlats`:
     - `gx = clamp(Math.floor(wx / CELL_STORLEK + GARD_BREDD / 2), 0, GARD_BREDD - 1)`
     - `gz = clamp(Math.floor(wz / CELL_STORLEK + GARD_DJUP / 2), 0, GARD_DJUP - 1)`
   - `varldTillKant(wx: number, wz: number): KantPlats`:
     - `fx = wx / CELL_STORLEK + GARD_BREDD / 2`, `fz = wz / CELL_STORLEK + GARD_DJUP / 2`.
     - Samma närmaste-kant-avstånd som i `xyTillKant`.
   - `kantTillVarld(k: KantPlats): { wx: number; wz: number; rotY: number }`:
     - Eftersom `fence_simple.glb` och `fence_gate.glb` har lokal bbox `x: -0.5..+0.5, z: -0.5..-0.43` (norra `-z`-kanten på en `1.0`-cell när `rotY = 0`):
     - `wx = (k.gx - GARD_BREDD / 2 + 0.5) * CELL_STORLEK`
     - `wz = (k.gz - GARD_DJUP / 2 + 0.5) * CELL_STORLEK`
     - `rotY = k.kant === "N" ? 0 : Math.PI / 2` (vid `Math.PI / 2` roteras norra kanten `z = -0.5` till västra kanten `x = -0.5`!).

3. **Sluten hage med BFS-fyllning (`kanterForByggen` och `hittaSlutnaHagar`):**
   - `kanterForByggen(garden: Pick<SparatBygge, "uid" | "bygg" | "ord" | "x" | "y" | "antal">[]): KantPlats[]`:
     - Håll en `Set<string>` av redan utlagda kantnycklar.
     - För varje bygge där `arKantBygge(b.bygg)`:
       - Startkant `k0 = xyTillKant(b.x, b.y)`. Lägg till `k0` om dess nyckel inte redan finns.
       - Om `(b.antal ?? 1) > 1`: välj cellen `(cx, cz) = (Math.min(k0.gx, GARD_BREDD - 1), Math.min(k0.gz, GARD_DJUP - 1))` och prova kanterna medurs runt `(cx, cz)`: `[{ gx: cx, gz: cz, kant: "N" }, { gx: cx + 1, gz: cz, kant: "W" }, { gx: cx, gz: cz + 1, kant: "N" }, { gx: cx, gz: cz, kant: "W" }]` tills upp till `b.antal` kanter har lagts till för detta bygge.
   - `arKantBlockerad(blockerade: ReadonlySet<string>, gx: number, gz: number, riktning: "N" | "S" | "W" | "E"): boolean`:
     - `"N"` → `blockerade.has(kantNyckel({ gx, gz, kant: "N" }))`
     - `"S"` → `blockerade.has(kantNyckel({ gx, gz: gz + 1, kant: "N" }))`
     - `"W"` → `blockerade.has(kantNyckel({ gx, gz, kant: "W" }))`
     - `"E"` → `blockerade.has(kantNyckel({ gx: gx + 1, gz, kant: "W" }))`
   - `hittaSlutnaHagar(kanter: KantPlats[]): SlutenHage[]`:
     - Bygg `blockerade = new Set(kanter.map(kantNyckel))`.
     - **BFS utifrån kartans utsida:**
       - En cell `(gx, gz)` är öppen utifrån vid start om:
         - `gz === 0` och `!arKantBlockerad(blockerade, gx, gz, "N")`, eller
         - `gz === GARD_DJUP - 1` och `!arKantBlockerad(blockerade, gx, gz, "S")`, eller
         - `gx === 0` och `!arKantBlockerad(blockerade, gx, gz, "W")`, eller
         - `gx === GARD_BREDD - 1` och `!arKantBlockerad(blockerade, gx, gz, "E")`.
       - Lägg alla sådana startceller i `oppenUtifran` (`Set<string>`) och i BFS-kön.
       - BFS-traversera till grannceller `(nx, nz)` inom `0..GARD_BREDD-1 × 0..GARD_DJUP-1` där kanten i riktningen (`"N"`, `"S"`, `"W"`, `"E"`) **inte** är blockerad.
     - **Inhägnade komponenter:**
       - Alla celler `(gx, gz)` som **inte** finns i `oppenUtifran` är inhägnade!
       - Gruppera sammanhängande inhägnade celler (där två inhägnade grannceller utan blockerad kant emellan hör till samma hage) med BFS i sorterad cellordning (`gz` `0..9`, sedan `gx` `0..5`).
       - För varje komponent: samla `celler` och de omslutande blockerade kantnycklarna `kanter: string[]` runt komponentens celler, och returnera `{ id: "hage-" + (index + 1), celler, kanter }`.

4. **Snäppande ledig plats för nybygge (`ledigCellPlats` och `ledigKantPlats`):**
   - `ledigCellPlats(finns: { x: number; y: number; bygg?: string }[]): { x: number; y: number }`:
     - Upptagna celler = alla `xyTillCell(b.x, b.y)` där `!b.bygg || !arKantBygge(b.bygg)`.
     - Välj en ledig cell `(gx, gz)` (prioritera mittenraderna `gz = 3..7, gx = 1..4` och maximera minsta avstånd till upptagna celler) och returnera `cellTillXy(gx, gz)`.
   - `ledigKantPlats(finns: { x: number; y: number; bygg?: string; antal?: number }[]): { x: number; y: number }`:
     - Upptagna kanter = `new Set(kanterForByggen(finns som staket).map(kantNyckel))`.
     - Ha en prioriterad lista med kanter som först sluter en 1×1-ruta kring `(2, 4)` (`(2,4,"N")`, `(3,4,"W")`, `(2,5,"N")`, `(2,4,"W")`), därefter utökar till 2×2-hagen `gx ∈ 2..3, gz ∈ 4..5`, och därefter övriga kanter på rutnätet. Returnera `kantTillXy(k)` för första lediga kanten.

---

### Steg 3 — Enhetstester i `src/spel/gard/gard3d.test.ts` och `package.json`
Skapa `src/spel/gard/gard3d.test.ts` och lägg till `src/spel/gard/gard3d.test.ts` sist i `test:product` i `package.json` (ändra **inga** befintliga testfiler!).
Testfilen ska pröva:
1. **Tillgångs- och datakontroll (`data/gard-3d.json`):**
   - Varje `bygg_ord.id` i `data/bygg.json` (alla 36) finns i `gard3d.byggnader`.
   - Varje icke-null `fil` i `gard3d.byggnader`, `gard3d.staket` och `gard3d.dekor` finns på disk under `public/`.
   - Varje icke-null `tillgangId` i `gard3d.byggnader` och `gard3d.dekor` finns i `data/tillgangar.json` med `licens === "CC0-1.0"`.
2. **Koordinatbijektion och `minne.ts`-klampning:**
   - Alla `6 × 10 = 60` celler klarar `cellTillXy(gx, gz)` → klampning `x ∈ [0.06, 0.94], y ∈ [0.30, 0.94]` → `xyTillCell(x, y)` tillbaka till exakt `(gx, gz)`.
   - Alla `6 × 11 = 66` `"N"`-kanter och alla `7 × 10 = 70` `"W"`-kanter (`136` kanter totalt) klarar `kantTillXy(k)` → klampning `x ∈ [0.06, 0.94], y ∈ [0.30, 0.94]` → `xyTillKant(x, y)` tillbaka till exakt `{ gx, gz, kant }`.
   - `kantTillVarld` ger `rotY === 0` för `"N"` och `rotY === Math.PI / 2` för `"W"`.
3. **BFS-hage (`hittaSlutnaHagar`):**
   - 0 staket → `0` hagar.
   - 3 staket runt `(2, 4)` (en kant öppen) → `0` hagar.
   - 4 staket runt `(2, 4)` (`(2,4,"N")`, `(2,5,"N")`, `(2,4,"W")`, `(3,4,"W")`) → `1` sluten hage med exakt 1 cell `[{ gx: 2, gz: 4 }]`.
   - 8 ytterkanter runt `2×2`-området `gx ∈ 2..3, gz ∈ 4..5` → `1` sluten hage med exakt 4 celler.
   - Två separata 1×1-hagar på `(1, 2)` och `(4, 7)` → `2` slutna hagar.
   - 4 efterföljande anrop till `ledigKantPlats` sluter en 1×1-hage (`hittaSlutnaHagar` ger `1` hage).

**Snabbprov efter varje steg:**
```bash
node rundor/G1-garden/matt/prov-g1.mjs --fas g1a && node --experimental-strip-types --test src/spel/gard/gard3d.test.ts && npm run typecheck && npm run check:struktur
```

---

### Steg 4 — Slutkontroll och `RUNDA-G1a.md` (före tur 45)
Kör:
```bash
node rundor/G1-garden/matt/prov-g1.mjs --fas g1a
npm run typecheck
npm run typecheck:pages
npx eslint .
npm run check:struktur
npm run test:product
```
Skriv `RUNDA-G1a.md` med:
- vilka filer som skapades/ändrades och radantal,
- utskrift från `prov-g1.mjs --fas g1a` och `gard3d.test.ts`,
- de 3 svagaste punkterna och vad G1b härnäst kan anta.
Committa allt så att `git status` är helt ren.

---

## Tekniska skyddsräcken (får inte brytas)
- **Ändra inget annat; lägg inte till extra funktioner.**
- **Alla nya källfiler ≤ 400 rader**, `src/spel/Spel.tsx` får inte röras (`≤ 400` rader).
- **Inga nya `data-testid` i `.tsx`-filer** och **inga ändringar i befintliga testfiler**.
- **Inga nya npm-beroenden** och **inga TTS-/ElevenLabs-anrop**.
