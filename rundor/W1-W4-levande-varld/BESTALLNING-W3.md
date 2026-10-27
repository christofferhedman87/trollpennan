# BESTALLNING-W3 — Klickbara 3D-Vägvisare i Världen, Koordinatmatchad HUD & Illustrerad Resövergång (`375×812` & `320×568`)

## 1. Mål i spelarord
Från Ängen kan barnet gå direkt till **Skogen**, **Sjön**, **Grottan** eller **Gården** genom att klicka på en riktig 3D-vägvisare (`/models/bulk/w-vagvisare-cc0.glb`, `0` `<boxGeometry>`) eller dess koordinatmatchade skyltknapp (`>= 44×44 px`) i det fria 3D-fönstret ovanför Pennans bok. Vid klick glider kameran mjukt mot vägvisaren medan en varm illustrerad resövergång (`ResOvergangV09`, `"På väg till Glittrande skogen…"` med förinspelad ElevenLabs-röst och `"Hoppa över resan"`) visas medan destinationen laddas, och på alla fyra utflyktsplatserna finns en returskylt (`"🌸 Till Ängen"`) tillbaka hem.

## 2. Underlag på disk (läs endast vid behov — blåkopian nedan är komplett)
- `/workspace/kod-inkorg/w1-w4/spaning.md` (Avsnitt 3: `Vagvisare3D.tsx`, `resAdapterV09.ts`, `ResOvergangV09.tsx`, `useVagvisareResaV09.ts`, `SpelVy.tsx`)
- `/workspace/modell-inkorg/w1-w4/RAPPORT.md` (Avsnitt 2: `/models/bulk/w-vagvisare-cc0.glb`, noll `<boxGeometry>`)
- `/workspace/trollpennan-nulage/kritik-w1-w4.md` (Avsnitt 1 & 2: 2×2-band inom porträttkameran `fov: 58`, `box.bottom <= 268 px < 292 px`, `0 px` överlapp på `375×812` och `320×568`)
- `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 12.3: `.tp-vagvisare-hud` & `ResOvergangV09`)

**Färdigbyggarkompetens:** Följ `3d-web-game-check`, `stylized-3d-art-direction` och `typescript-best-practices`. Gör första kodändringen inom 10 verktygsanrop.

---

## 3. Blåkopia i prioritetsordning

### Steg 1 — Skapa `src/spel/ang/vagvisareProjektion.ts` (`<= 65` rader)
Skapa `src/spel/ang/vagvisareProjektion.ts` med:
- `export type NdcPunkt = { x: number; y: number; z: number };`
- `export type SkarmPunkt = { x: number; y: number };`
- `export function begransaVagvisarePunkt(punkt: SkarmPunkt, width: number, height: number, minTraffyta = 44): SkarmPunkt`:
  - `halv = Math.max(22, minTraffyta / 2)`; `marginalX = halv + 8`; `toppMarginal = Math.max(68, halv + 24)`; `bottenMarginal = Math.max(height * 0.36, halv + 16)`; returnerar klämd `{ x, y }`.
- `export const klammaVagvisarePunkt = begransaVagvisarePunkt;`
- `export function projiceraVagvisare(ndc: NdcPunkt, width: number, height: number): SkarmPunkt | null`:
  - Om `width <= 0 || height <= 0 || ndc.z > 1 || ndc.z < -1 || Math.abs(ndc.x) > 1.02 || Math.abs(ndc.y) > 1.02` returnera `null`.
  - Annars `raX = (ndc.x * 0.5 + 0.5) * width`, `raY = (-ndc.y * 0.5 + 0.5) * height`, returnera `begransaVagvisarePunkt({ x: raX, y: raY }, width, height)`.

### Steg 2 — Skapa `src/spel/ang/Vagvisare3D.tsx` (`<= 185` rader) — NOLL `<boxGeometry>`
Skapa `src/spel/ang/Vagvisare3D.tsx` och rensa samtidigt bort de gamla `<boxGeometry>`-skyltbitarna i `Skogsstig` i `src/spel/ang/byggnader.tsx` (rad 139–146):
1. **Typer & Ankardata inom porträttkamerans (`fov: 58`) synfält:**
   - `export type VagvisarePlatsId = "ang" | "skogen" | "sjon" | "grottan" | "garden";`
   - `export type VagvisareSkarmPunkt = { id: VagvisarePlatsId; namn: string; ikon: string; x: number; y: number };`
   - `VAGVISARE_ANKARE` på Ängen:
     - `skogen`: `namn: "Skogen"`, `ikon: "🌲"`, `pos: [-1.15, 0, -3.5]`, `ry: 2.30`
     - `grottan`: `namn: "Grottan"`, `ikon: "💎"`, `pos: [1.15, 0, -3.8]`, `ry: 0.84`
     - `garden`: `namn: "Gården"`, `ikon: "🏡"`, `pos: [-2.15, 0, -2.5]`, `ry: 3.04`
     - `sjon`: `namn: "Sjön"`, `ikon: "🌊"`, `pos: [2.15, 0, -2.5]`, `ry: -0.15`
   - `RETUR_ANKARE` (när `plats !== "ang"`):
     - `ang`: `namn: "Till Ängen"`, `ikon: "🌸"`, `pos: [0, 0, -3.0]`, `ry: 0`
   - `export function vagvisareAnkareForPlats(plats: VagvisarePlatsId)` returnerar `VAGVISARE_ANKARE` om `plats === "ang"`, annars `[RETUR_ANKARE]`.
2. **Riktig 3D-modell (`/models/bulk/w-vagvisare-cc0.glb`) — NOLL `<boxGeometry>`:**
   - Ladda `/models/bulk/w-vagvisare-cc0.glb` med `useGLTF("/models/bulk/w-vagvisare-cc0.glb", true, true, kopplaMeshopt)` och klona per skylt med `useMemo(() => belysScen(gltf.scene.clone(true)), [gltf.scene])`.
   - Varje skylt i `Vagvisare3D` renderas på `a.pos` med `rotation={[0, a.ry, 0]}`, `scale={[1, 1, 1]}` och `onClick={(e) => { e.stopPropagation(); onValjPlats(a.id); }}`.
3. **Kollisionsfri 2×2-band-klämning i `VagvisareProjektor` (`375×812` & `320×568`):**
   - `VagvisareProjektor` projicerar ankarpunkterna var `0.15 s` (och direkt vid mount/platsbyte) via `projiceraVagvisare(v, size.width, size.height)`.
   - För att garantera att alla 4 knappar på Ängen ligger helt ovanför `Pennans bok` (`box.bottom <= 268 px < 292 px` på `375×812`) och har `0 px` inbördes överlapp eller krock med `🦅 Se hela dalen` (`top: 64px; right: 12px;` på högersidan) även vid extrema aspekter (`320×568`), justera skärmpunkten per `a.id` efter `projiceraVagvisare`:
     - För `skogen` (övre vänster): `x = Math.min(Math.max(p.x, 54), size.width * 0.34)`, `y = Math.min(Math.max(p.y - 88, 126), 144)`
     - För `grottan` (övre höger, under flygknappen): `x = Math.max(Math.min(p.x, size.width - 58), size.width * 0.66)`, `y = Math.min(Math.max(p.y - 80, 134), 152)`
     - För `garden` (undre vänster): `x = Math.min(Math.max(p.x, 54), size.width * 0.34)`, `y = Math.min(Math.max(p.y - 38, 194), 214)`
     - För `sjon` (undre höger): `x = Math.max(Math.min(p.x, size.width - 54), size.width * 0.66)`, `y = Math.min(Math.max(p.y - 38, 198), 218)`
     - För `ang` (returskylt): `x = Math.min(Math.max(p.x, 72), size.width - 72)`, `y = Math.min(Math.max(p.y - 60, 132), 185)`
4. **`VagvisareHud`:**
   - Renderar `<div className="tp-vagvisare-hud" aria-label="Vägvisare i världen">` med `<button key={p.id} type="button" data-w3="vagvisare-knapp" data-plats={p.id} style={{ left: `${p.x}px`, top: `${p.y}px` }} onClick={() => onValjPlats(p.id)}>`.

### Steg 3 — Skapa `resAdapterV09.ts`, `ResOvergangV09.tsx`, `useVagvisareResaV09.ts` & `plats-resa-v09.css` + röstkoppling i `rost.ts`
1. **`src/spel/ui/resAdapterV09.ts` (`<= 60` rader):**
   - `utforPlatsResaV09(mal: VagvisarePlatsId, b: ResBeroenden): void`:
     - Om `mal === "garden"`: `b.valjVarld("gard")`.
     - Om `mal === "ang"`: om `b.varld === "gard"` anropa `b.valjVarld("ang")`, och om `b.nuvarandePlats !== "ang"` anropa `b.hem()`.
     - Annars (`"skogen" | "sjon" | "grottan"`): om `b.varld === "gard"` anropa `b.valjVarld("ang")`, sedan `b.resTill(mal)`.
2. **`src/spel/ui/ResOvergangV09.tsx` (`<= 120` rader):**
   - Exporterar `useResOvergangV09({ paResaKlar, langdMs = 820 })` och `ResOvergangV09({ mal, paHoppaOver })`.
   - Vid `startaResa(nyttMal)`: anropa `hor(restext(nyttMal))` ur `../rost` så att resfrasen läses upp med förinspelad ElevenLabs-röst. Om `window.matchMedia("(prefers-reduced-motion: reduce)").matches`, byt destination direkt utan fördröjning. Annars håll `upptagen.current = true` under `langdMs`, anropa `paResaKlar(nyttMal)` efter `Math.round(langdMs * 0.42)` ms (så att kameran hinner glida mot vägvisaren innan scenen växlar) och dölj övergången vid `langdMs`.
   - `ResOvergangV09` renderar `<div className="tp-resa-anim" data-w3="resa-anim" role="status" aria-live="polite">` med ikon, rubrik (`"På väg till Glittrande skogen…"`, etc.), animerade fotsteg och knappen `<button type="button" onClick={paHoppaOver}>Hoppa över resan</button>`.
3. **`src/spel/rost.ts` (`<= 290` rader):**
   - Lägg till 6 rader i `SAMMAN` så att res- och vyfraser alltid mappas till en 1-MP3 ElevenLabs-inspelning:
     ```ts
     [/^På väg (?:hem )?till Ängen[….!]?$/iu, "Ängen"],
     [/^På väg till (?:Glittrande )?skogen[….!]?$/iu, "Skogen"],
     [/^På väg till (?:Dim)?sjön[….!]?$/iu, "Sjön"],
     [/^På väg till (?:Kristall)?grottan[….!]?$/iu, "Grottan"],
     [/^På väg till (?:Sol)?gården[….!]?$/iu, "Solgården"],
     [/^Se hela dalen[!.]?$/iu, "Världskartan. Välj en plats på stigen! Alla vägar är öppna."],
     ```
4. **`src/spel/ui/useVagvisareResaV09.ts` (`<= 60` rader) & `src/spel/ui/plats-resa-v09.css` (`<= 110` rader):**
   - `useVagvisareResaV09` binder ihop `vagvisarePunkter`, `useResOvergangV09` och `utforPlatsResaV09`.
   - I `src/spel/ui/plats-resa-v09.css`:
     - `.tp-vagvisare-hud button`: `min-width: 44px; min-height: 44px; padding: 6px 11px; border-radius: 999px; border: 2px solid #8d6c40; background: rgba(255, 244, 217, 0.94); color: #3b2614; font-weight: 800; font-size: 13px; box-shadow: 0 4px 0 #b89862, 0 6px 14px rgba(0, 0, 0, 0.22);`
     - `.tp-resa-anim button`: `min-height: 48px; min-width: 160px; padding: 10px 18px; border-radius: 16px; border: 2px solid #8d6c40; background: #fff4d9; color: #3b2f2f; font-weight: 800; font-size: 14px; cursor: pointer;`

### Steg 4 — Koppla in vägvisare & resövergång i `angen3d.tsx`, `Garden3D.tsx` & `SpelVy.tsx`
1. I `src/spel/angen3d.tsx` (`<= 380` rader):
   - Lägg till valfria props på `Angen3D`: `aktivPlats?: VagvisarePlatsId; onValjPlats?: (id: VagvisarePlatsId) => void; onVagvisarePunkter?: (p: VagvisareSkarmPunkt[]) => void;`.
   - Montera `<Vagvisare3D plats={aktivPlats} onValjPlats={onValjPlats} />` och `<VagvisareProjektor plats={aktivPlats} onPunkter={onVagvisarePunkter} />` i `Scen` när `onValjPlats` och `onVagvisarePunkter` finns.
2. I `src/spel/gard/Garden3D.tsx` (`<= 380` rader):
   - Lägg till valfria props `onValjPlats?: (id: VagvisarePlatsId) => void; onVagvisarePunkter?: (p: VagvisareSkarmPunkt[]) => void;` på `Garden3D` och montera `<Vagvisare3D plats="garden" onValjPlats={onValjPlats} />` samt `<VagvisareProjektor plats="garden" onPunkter={onVagvisarePunkter} />` i `Scen` så att returskylten `[data-w3="vagvisare-knapp"][data-plats="ang"]` även finns på Gården!
3. I `src/spel/ui/SpelVy.tsx` (`<= 380` rader):
   - Importera `./plats-resa-v09.css`, `VagvisareHud` och `useVagvisareResaV09`.
   - Anropa `const resa = useVagvisareResaV09({ varld, nuvarandePlats: platsUi.plats, valjVarld, resTill: platsUi.resTill, hem: platsUi.hem });`.
   - Skicka `aktivPlats={varld === "gard" ? "garden" : platsUi.plats}`, `onValjPlats={resa.startaResa}` och `onVagvisarePunkter={resa.setVagvisarePunkter}` till `Angen3D` och `Garden3D`.
   - Rendera `<VagvisareHud punkter={resa.vagvisarePunkter} onValjPlats={resa.startaResa} dold={titel || intro || saga || menyOpp || foralder || albumOpp || kartaOpp || panel !== "spel" || Boolean(platsUi.intro) || resa.mal !== null} />` och `<ResOvergangV09 mal={resa.mal} paHoppaOver={resa.hoppaOver} />`. *(Obs: skicka INTE `bokOpp` till `dold` — vägvisarna ska synas i det fria 3D-fönstret ovanför Pennans bok!)*

---

## 4. Verifiering & Commit
1. Kör det snabba provet:
   - `node --experimental-strip-types rundor/W1-W4-levande-varld/prov-w1-w4.mjs --snabb --steg=w3`
2. Kör enhets- och strukturtester:
   - `npm run check:struktur`
   - `npx tsc --noEmit`
   - `node --experimental-strip-types rundor/R1-R2-kompletta-roster/prov-r1-r2.mjs --snabb --steg=r1`
3. Kör Playwright-verifieringen för W3:
   - `node --experimental-strip-types rundor/W1-W4-levande-varld/prov-w1-w4.mjs --steg=w3`
4. Skriv `RUNDAW3.md` med:
   - `Show that:` alla 4 vägvisare (`skogen`, `sjon`, `grottan`, `garden`) använder `/models/bulk/w-vagvisare-cc0.glb` (`0` `<boxGeometry>`), har synliga knappar `>= 44×44 px` ovanför `Pennans bok` (`bottom <= 292 px`) med `0 px` överlapp på `375×812` och `320×568`, visar `[data-w3="resa-anim"]` och returnerar till Ängen via `[data-w3="vagvisare-knapp"][data-plats="ang"]`.
5. Committa alla ändringar på grenen.
