# Build-beställning — G2: Phaser bort (en renderväg)

**Förutsättning:** Körs direkt ovanpå mergad `G1c` (efter `S1a`, `S1b`, `G1a`, `G1b`, `G1c`).
**Modell och budget:** `grok-4.7` (eller `build-fast`) på `high` effort, **65 turer** (tak **75**). Skriv en kort plan i `PLAN-G2.md` före första kodändringen (ta bort `PLAN-G2.md` före sista commit) och skriv `RUNDA-G2.md` senast vid **tur 50**.

---

## 1. Mål i spelarord

När barnet öppnar Trollpennan och spelar på **Ängen**, **Skogen**, **Sjön**, **Grottan** och **Gården** ritas hela spelet med en enda 3D- och DOM-renderväg (React Three Fiber + HTML/CSS):

1. Det startas ingen osynlig 2D-spelmotor i bakgrunden: ingen `<div class="duk">`, inget extra Phaser-`<canvas>` och inget `window.__spel`.
2. Alla fem platser (**Ängen**, **Skogen**, **Sjön**, **Grottan** och **Gården**) visar sina djur, saker, pratbubblor, önskebubblor, humörikoner och byggmenyer på exakt samma ställe på mobilskärmen (`375×812`) som före rundan, med 0 konsol- eller sidfel.
3. `phaser` är helt borta ur `package.json`, `package-lock.json`, `src/` och den byggda produkten (`dist-pages/`), vilket sparar ~1,2 MB i bunten och över 3 100 rader död 2D-kod.

---

## 2. Arkitekturregel

1. **En enda renderväg i spelet:** Spelet ritas enbart med React Three Fiber (`Angen3D` i `src/spel/angen3d.tsx` och `Garden3D` i `src/spel/gard/Garden3D.tsx`) och React/DOM-lager (`src/spel/ui/`). Ingen 2D-canvas eller Phaser-instans får skapas eller importeras någonstans i `src/`.
2. **Sju rena Phaser-filer tas bort helt:**
   - `src/spel/starta.ts` (48 rader — skapade `new Phaser.Game` och `window.__spel`)
   - `src/spel/gard.ts` (632 rader — gammal `GardScen extends Phaser.Scene`, ersatt av `src/spel/gard/Garden3D.tsx` i G1)
   - `src/spel/scen.ts` (1 101 rader — gammal `AngScen extends Phaser.Scene`, ersatt av `src/spel/angen3d.tsx`)
   - `src/spel/avscen.ts` (514 rader — gammal `AvScen extends Phaser.Scene`, ersatt av `PlatsScen` i `src/spel/ang/PlatsDekor.tsx`)
   - `src/spel/ritaBygg.ts` (812 rader — 2D `Phaser.GameObjects.Graphics`-ritare för gammal gård, importerades enbart av `src/spel/gard.ts`)
   - `src/spel/deladeBilder.ts` (18 rader — Phaser-texturladdare, importerades enbart av `scen.ts`, `gard.ts`, `avscen.ts`)
   - `src/spel/natthimmel.ts` (53 rader — Phaser-natthimmel, importerades enbart av `scen.ts`, `gard.ts`, `avscen.ts`)
3. **Beroendet `phaser` avinstalleras:** `phaser` tas bort ur `package.json` och `package-lock.json` (`npm uninstall phaser`).
4. **Bryggans `ang`-mottagare flyttar till `Angen3D`:** Tidigare registrerade `AngScen` (`src/spel/scen.ts`) `brygga.registrera("ang", ...)` så att `brygga.platser()` (och `window.__troll.platser()`) gav skärmkoordinater `{ uid, x, y, topp }` för djuren på Ängen/Skogen/Sjön/Grottan. När `scen.ts` tas bort registrerar `Angen3D` (`src/spel/angen3d.tsx`) själv `"ang"` i `brygga` och läser positionerna via `malTillDuk(a.uid)` ur `window.__tredMal` (på samma sätt som `Garden3D` registrerar `"gard"` i G1b).
5. **Dukens virtuella 750×900-ram (`--duk-x`, `--duk-y`, `--duk-w`, `--duk-h`) beräknas utan `.duk canvas`:** Pratbubblor (`bubblaStil`), önskebubblan (`dukStil(0.7, 0.3)`), humörikoner och byggmenyn (`Math.min(meny.y, 0.62)`) är kalibrerade mot den centrerade 750×900-ramen (`--duk-h ≈ 0.554` på `375×812`). När `.duk` tas bort får `synka` i `src/spel/styr/useHandelser.ts` inte läsa `rot.querySelector("canvas")` (som annars träffar helskärms-3D-duken `375×812` och sätter `--duk-h = 1`), utan räknar ut 750×900-ramen direkt ur `rot.getBoundingClientRect()`.

---

## 3. Ritning — dataväg med filer och funktioner

### A. Ta bort 7 rena Phaser-filer och avinstallera `phaser`
1. Kör `git rm src/spel/starta.ts src/spel/gard.ts src/spel/scen.ts src/spel/avscen.ts src/spel/ritaBygg.ts src/spel/deladeBilder.ts src/spel/natthimmel.ts`.
2. Kör `npm uninstall phaser` så att `"phaser"` försvinner ur både `package.json` och `package-lock.json`.

### B. `src/spel/angen3d.tsx` — registrera `"ang"` i `brygga`
1. Importera `brygga` från `./brygga.ts`, `START_PLATS` från `./platser.ts` och `malTillDuk` från `./ui/hjalp.ts` (om de inte redan är importerade).
2. I komponenten `Angen3D`, lägg till en `useEffect` vid mount som registrerar `"ang"` på `brygga`:
   - `skapa`, `taBort`, `andra`, `glad`, `glitter`, `puff`, `tom` är tomma funktioner (`() => {}`), eftersom R3F redan läser `useMinne` reaktivt.
   - `platser()` läser `const s = useMinne.getState()` och tar skapelselistan på aktuell plats (`s.plats === START_PLATS ? s.ang : (s.platsSkapelser[s.plats] ?? [])`). För varje skapelse `a` hämtas `const m = malTillDuk(a.uid)`:
     - Om `m` finns returneras `{ uid: a.uid, x: m.x, y: m.y, topp: Math.max(0.08, m.y - 0.04) }`.
     - Om `m` saknas returneras `{ uid: a.uid, x: 0.5, y: 0.5, topp: 0.45 }`.
   - Vid unmount avregistreras mottagaren med `brygga.registrera("ang", null)`.

### C. `src/spel/styr/useHandelser.ts` — ta bort `starta.ts`-laddningen och behåll 750×900-ramen
1. I mount-`useEffect` som startar ljud, brygglyssnare och önsketick:
   - Ta bort kontrollen `const el = host.current; if (!el) return;`, `let dead = false;`, `let game: { destroy: (b: boolean) => void } | null = null;`, hela `void import("../starta.ts").then(...)` och `game?.destroy(true)`.
   - **Behåll** `ljud.satt(useMinne.getState().ljudPa)`, `const stopp = brygga.lyssna((h) => paHandelse.current(h))` och `const tick = window.setInterval(() => visaOnskaRef.current(), 1000)` samt cleanup `stopp(); window.clearInterval(tick);`.
2. I `useEffect` för `--duk-x` / `--duk-y` / `--duk-w` / `--duk-h` på `angRef`:
   - Ersätt läsningen av `rot.querySelector("canvas")` med direkt beräkning av 750×900-ramen (5:6 FIT centrerad horisontellt) ur `const a = rot.getBoundingClientRect()`:
     - `const w = Math.min(a.width, a.height * (750 / 900))`
     - `const h = Math.min(a.height, a.width * (900 / 750))`
     - `--duk-x`: `String((a.width - w) / (2 * a.width))`
     - `--duk-y`: `"0"`
     - `--duk-w`: `String(w / a.width)`
     - `--duk-h`: `String(h / a.height)`
   - Behåll `ResizeObserver` på `rot` (och ta bort `MutationObserver`, som bara väntade på att Phaser skulle lägga in `<canvas>`).

### D. `src/spel/styr/useVarld.ts` — ta bort `window.__spel` ur `synkaAv`
1. I `synkaAv(plats: string | null)`:
   - Behåll `avBro.satt({ plats, folje, van: s.van, uppdrag: s.uppdrag, fyr: s.fyr, on: plats === "on" })`.
   - Ta bort hela `window.__spel`-blocket som anropade `game.scene.sleep` / `game.scene.wake` / `game.scene.start`.

### E. `src/spel/styr/useSpelTillstand.ts`, `src/spel/ui/SpelVy.tsx` och `src/styles.css` — ta bort `host` och `.duk`
1. I `src/spel/styr/useSpelTillstand.ts`: ta bort `const host = useRef<HTMLDivElement | null>(null)` och `host` ur returobjektet.
2. I `src/spel/ui/SpelVy.tsx`: ta bort `<div className="duk" ref={t.host} />`.
3. I `src/styles.css`: ta bort `.duk{...}`, `.duk canvas{...}` och alla `.ang.tred .duk` / `.ang.gard-3d .duk`-regler.

---

## 4. Byggarfärdigheter att läsa före kod

1. `/home/box/.cursor/skills/3d-web-game-check/SKILL.md` — mobilskärm (`375×812`), en enda renderväg, inga konsol- eller sidfel.
2. `/home/box/.cursor/skills/typescript-best-practices/SKILL.md` — rena typer utan oanvända referenser eller döda fält.

### 4b. Referenskod att återanvända i repot
- `src/spel/gard/Garden3D.tsx` (från G1b) — mönstret för `brygga.registrera("gard", { ... platser() })` återanvänds rakt av för `"ang"` i `src/spel/angen3d.tsx`.
- `src/spel/ui/hjalp.ts` (`malTillDuk`, `dukStil`, `bubblaStil`) — befintlig koordinatkonvertering mellan `window.__tredMal` och `--duk-*`.

---

## 5. Utanför scopet (rör EJ)

- **Rör EJ dessa hjälparfiler i `src/spel/` (de importerar INTE Phaser och testas av befintliga prov i `test:product`):**
  - `src/spel/texturKo.ts` (testas av `src/spel/texturKo.test.ts`)
  - `src/spel/pekare.ts` (används av `src/spel/ang/djur.tsx` och testas av `src/spel/r9h.test.ts`)
  - `src/spel/kit.ts` (används av `src/spel/billboard.ts`, `src/spel/formel.tsx` och `src/spel/ang/byggnader.tsx`)
  - `src/spel/beteende.ts` (testas av `src/tolk/tolk.test.ts`)
  - `src/spel/avbro.ts` (används av `useVarld.ts` och `useHandelser.ts`)
- **Rör EJ befintliga testfiler** (`src/**/*.test.ts`, `src/**/*.test.mjs`) eller `scripts/check-spel-struktur.mjs`. Inget befintligt test importerar `phaser` eller någon av de 7 borttagna filerna.
- **Ingen TTS-generering** och inga ändringar i `data/rost-manifest.json` eller `public/ljud/`.
- Rör inte 3D-utseende, kameror eller placeringslogik på Ängen, Skogen, Sjön, Grottan eller Gården.

---

## 6. Färdigt när (acceptanstester)

Alla nedanstående kontroller ska vara gröna:

1. **Snabb statisk kontroll (< 2 s):**
   ```bash
   node rundor/G2-phaser-bort/matt/prov-g2.mjs --snabb
   ```
   Kontrollerar att:
   - de 7 Phaser-filerna (`starta.ts`, `gard.ts`, `scen.ts`, `avscen.ts`, `ritaBygg.ts`, `deladeBilder.ts`, `natthimmel.ts`) inte finns kvar,
   - `"phaser"` inte finns i `package.json` eller `package-lock.json`,
   - inga förekomster av `phaser`, `starta.ts`, `__spel` eller `className="duk"` finns i `src/`.
2. **Typkontroll, lint, strukturvakt och alla enhetstester:**
   ```bash
   npm run typecheck && npm run lint && npm run check:struktur && npm run test:product
   ```
3. **Bygg och skärmprov på mobil (`375×812`) över alla 5 platser:**
   ```bash
   npm run build:pages && node rundor/G2-phaser-bort/matt/prov-g2.mjs
   ```
   Kontrollerar i headless Chromium (`375×812`) att:
   - `dist-pages/` inte innehåller någon `phaser`-chunk,
   - `.duk` inte finns i DOM (`count === 0`) och `window.__spel === undefined`,
   - `--duk-h` på `.ang` ligger runt `0.554` (`0.50 <= dukH <= 0.60`) så att pratbubblor, önskebubbla och byggmeny behåller sin höjd,
   - **Ängen**, **Skogen**, **Sjön** och **Grottan** renderas i `angen-3d` med `window.__troll.platser().length >= 1` när ett djur finns på platsen,
   - **Gården** renderas i `garden-3d` med `window.__troll.platser().length >= 1` när ett djur flyttats dit,
   - 0 `pageerror` och 0 `console.error` uppstår under hela turen, och skärmbilder sparas i `rundor/G2-phaser-bort/matt/bilder/`.

---

## 7. Slutrapport: `RUNDA-G2.md`

Skriv `RUNDA-G2.md` i repots rot **senast vid tur 50** (uppdatera med slutsiffror före sista commit):
- Vilka 7 filer som togs bort och vilka 6 filer (+ `package.json`/`package-lock.json`) som ändrades.
- Buntstorlek före och efter (`dist-pages/assets/`), samt utdata från `prov-g2.mjs --snabb`, `npm run test:product` och `prov-g2.mjs`.
- Bekräftelse att inga befintliga testfiler ändrades och att inga konsol- eller sidfel uppstod på de 5 platserna.
