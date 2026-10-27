# BESTALLNING-W4 — Introflygning över Hela Sagodalen (`0..2.4 s`), 5 Platsetiketter & `🦅 Se hela dalen`-knapp (`375×812` & `320×568`)

## 1. Mål i spelarord
När spelets intro startar — och när barnet när som helst trycker på knappen `🦅 Se hela dalen` — sveper kameran först högt över hela Sagodalen (`[0, 14.5, 22.0]`, `y >= 11, z >= 15`) med vackra svävande platsetiketter för alla fem platserna (`🌲 Glittrande skogen`, `💎 Kristallgrottan`, `🌊 Dimsjön`, `🏡 Solgården`, `🌸 Ängen`) innan den mjukt zoomar in och landar på start-Ängen (`y <= 4.5, z <= 10.2`), med strikt ett kameraägarskap åt gången och alla intro- och strukturtester 100 % gröna.

## 2. Underlag på disk (läs endast vid behov — blåkopian nedan är komplett)
- `/workspace/kod-inkorg/w1-w4/spaning.md` (Avsnitt 4: `saga.tsx`, `introFlygFas.ts`, `IntroFlygning.tsx`, `IntroKameraV09.tsx`, `FlygKameraV09.tsx`, `VarldsIntegrationV09.tsx`, `v7a-intro.test.ts`)
- `/workspace/trollpennan-nulage/kritik-w1-w4.md` (Avsnitt 3: `🦅 Se hela dalen` på `top: 64px; right: 12px;` med `0 px` överlapp mot `☰`-menyn, 5 kollisionsfria platsetiketter)
- `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 12.4: Introflygning & `🦅 Se hela dalen`)

**Färdigbyggarkompetens:** Följ `3d-web-game-check`, `stylized-3d-art-direction` och `typescript-best-practices`. Gör första kodändringen inom 10 verktygsanrop.

---

## 3. Blåkopia i prioritetsordning

### Steg 1 — Skapa `introFlygFas.ts`, `IntroKameraV09.tsx`, `IntroFlygning.tsx`, `FlygKameraV09.tsx` & `VarldsIntegrationV09.tsx`
1. **`src/spel/ang/introFlygFas.ts` (`<= 45` rader):**
   - `export const INTRO_FLYG_SLUT_SEK = 2.4;`
   - `export function arIntroFlygAktiv(introAktiv: boolean, tidSek: number): boolean` (`introAktiv && tidSek >= 0 && tidSek < INTRO_FLYG_SLUT_SEK`).
2. **`src/spel/ang/IntroKameraV09.tsx` (`<= 65` rader):**
   - Exporterar `INTRO_DAL_START = { pos: [0, 14.5, 22] as const, mal: [0, 0.5, -6] as const }`, `INTRO_ANG_LANDNING = { pos: [0, 3.05, 5.75] as const, mal: [0, 0.85, -0.5] as const }`, `INTRO_FLYG_TID = 2.4`, `beraknaIntroKamera(tidSek: number)` (Hermite-utjämnad `u = s * s * (3 - 2 * s)`) samt komponenten `IntroKameraV09`.
3. **`src/spel/ang/IntroFlygning.tsx` (`<= 90` rader):**
   - Exporterar `DAL_ETIKETTER` med kollisionsfria skärmpositioner enligt `/workspace/trollpennan-nulage/kritik-w1-w4.md`:
     - `grottan`: `namn: "💎 Kristallgrottan"`, `xProcent: 66`, `yProcent: 24`
     - `skogen`: `namn: "🌲 Glittrande skogen"`, `xProcent: 27`, `yProcent: 31`
     - `sjon`: `namn: "🌊 Dimsjön"`, `xProcent: 74`, `yProcent: 42`
     - `garden`: `namn: "🏡 Solgården"`, `xProcent: 24`, `yProcent: 54`
     - `ang`: `namn: "🌸 Ängen"`, `xProcent: 52`, `yProcent: 64`
   - Exporterar `useVyFlygning(langdMs = 3000)`: när `startaVyFlygning()` anropas, spela upp `hor("Se hela dalen")` ur `../rost` och håll `aktiv = true` i `langdMs` ms (`450 ms` om `prefers-reduced-motion: reduce`).
   - Exporterar `VyFlygKnapp({ aktiv, onStarta, dold })` som renderar `<div className="tp-flyg-hud"><button type="button" data-w4="vy-flyg-knapp" onClick={onStarta} aria-pressed={aktiv}>🦅 Se hela dalen</button></div>`.
   - Exporterar `DalFlygEtiketter({ synlig })` som renderar de 5 `<span key={e.id} data-w4="flyg-etikett" data-plats={e.id} style={{ left: `${e.xProcent}%`, top: `${e.yProcent}%` }}>{e.namn}</span>`.
4. **`src/spel/ang/FlygKameraV09.tsx` (`<= 100` rader):**
   - Styr `state.camera` **endast** när `!introAktiv && (vyFlygAktiv || resaMal !== null)`:
     - När `vyFlygAktiv === true`: svep upp till `[0, 14.5, 22]` (och titta mot `[0, 0.5, -6]`) under första `78%` av `3.0 s` och glid sedan mjukt tillbaka till `KAMERA_ANG = [0, 4.15, 9.8]` (och `lookAt(0, 1.05, -0.15)`). När `vyFlygAktiv` övergår från `true` till `false`, återställ alltid kameran exakt till `KAMERA_ANG = [0, 4.15, 9.8]` med `lookAt(0, 1.05, -0.15)`.
     - När `resaMal !== null`: glid kameran mjukt (`0.38 s`) mot destinationens riktning (`skogen: [-1.2, 3.2, 6.2]`, `grottan: [1.2, 3.3, 6.0]`, `sjon: [1.6, 3.1, 6.4]`, `garden: [-1.6, 3.1, 6.4]`, `ang: [0, 3.2, 6.6]`) och återställ till `KAMERA_ANG` när `resaMal` blir `null`.
     - Uppdatera `(window as unknown as { __tredKamera?: { x: number; y: number; z: number; t: number } }).__tredKamera` varje aktiv frame.
5. **`src/spel/ang/VarldsIntegrationV09.tsx` (`<= 65` rader):**
   - Sammanhållen wrapper som monterar `<HorisontVarld />`, `<Vagvisare3D />`, `<VagvisareProjektor />` och `<FlygKameraV09 />`.

### Steg 2 — Uppdatera `KAM` i `src/spel/ang/saga.tsx` (`<= 170` rader) för introts dalflygning (`0..2.4 s`)
I `src/spel/ang/saga.tsx`:
- **RÖR INTE** `V7A_LANGD = 7.5`, `src/spel/intro.tsx` eller `data/intro.json` (så att `src/spel/v7a-intro.test.ts` förblir 100 % grön!).
- Uppdatera nyckelbilderna `KAM` i `src/spel/ang/saga.tsx` så att introt startar i dalöversikten (`y >= 11, z >= 15`), landar på Ängen vid `t = 2.4 s` (`y <= 4.5, z <= 10.2`) och slutar exakt i `KAMERA_ANG` vid `t = 7.5 s`:
  ```ts
  const KAM: [number, V3, V3][] = [
    [0.0, [0, 14.5, 22.0], [0, 0.5, -6.0]],
    [2.4, [0, 3.05, 5.75], [0, 0.85, -0.5]],
    [4.4, [0.45, 2.55, 6.2], PENNA_SLUT],
    [6.1, [0.15, 2.25, 4.9], STJARNA_SLUT],
    [7.5, KAMERA_ANG, [0, 1.05, -0.15]],
  ];
  ```
- I `Kamera` i `src/spel/ang/saga.tsx` (inuti `useFrame`), exponera kamerapositionen för diagnostik och Playwright:
  ```ts
  (window as unknown as { __tredKamera?: { x: number; y: number; z: number; t: number } }).__tredKamera = {
    x: Number(camera.position.x.toFixed(2)),
    y: Number(camera.position.y.toFixed(2)),
    z: Number(camera.position.z.toFixed(2)),
    t: Number(t.toFixed(2)),
  };
  ```
  Och i `useEffect`-cleanup när introt avslutas (så att `window.__tredKamera` speglar landningen/slutpositionen `KAMERA_ANG`): sätt `__tredKamera = { x: KAMERA_ANG[0], y: KAMERA_ANG[1], z: KAMERA_ANG[2], t: V7A_LANGD }`.

### Steg 3 — Koppla in `FlygKameraV09`, `VyFlygKnapp` & `DalFlygEtiketter` i `angen3d.tsx`, `SpelVy.tsx` & `plats-resa-v09.css`
1. I `src/spel/ui/plats-resa-v09.css` (`<= 120` rader):
   - Placera `.tp-flyg-hud` på **`top: 64px; right: 12px; z-index: 26;`** (under `.meny-knapp` `☰` som slutar vid `y = 54 px`, och ovanför högra övre vägvisarknappen `grottan` vars `box.top >= 112 px`!).
   - `.tp-flyg-hud button`: `min-width: 44px; min-height: 44px; padding: 6px 12px; border-radius: 999px; border: 2px solid #8d6c40; background: rgba(255, 248, 228, 0.94); color: #3b2614; font-weight: 800; font-size: 12px; cursor: pointer; box-shadow: 0 3px 0 #b89862;`
2. I `src/spel/angen3d.tsx` (`<= 380` rader):
   - Lägg till props `vyFlygAktiv?: boolean; resaMal?: VagvisarePlatsId | null;` på `Angen3D` och `Scen`, och montera `<FlygKameraV09 introAktiv={Boolean(intro)} vyFlygAktiv={Boolean(vyFlygAktiv)} resaMal={resaMal ?? null} />` i `Scen`.
   - Sätt initial `window.__tredKamera = { x: KAMERA_ANG[0], y: KAMERA_ANG[1], z: KAMERA_ANG[2], t: 0 }` vid mount av `Scen` när `!intro`.
3. I `src/spel/ui/SpelVy.tsx` (`<= 380` rader):
   - Anropa `const vyFlyg = useVyFlygning(3000)` och spara `introStartRef` så att `introFlygAktiv` är `true` under de första `2.4 s` när `intro || saga` är aktivt.
   - När barnet klickar på `🦅 Se hela dalen`, stäng ev. öppen `Pennans bok` (`setBokOpp(false)`) och starta flygningen (`vyFlyg.startaVyFlygning()`).
   - Rendera `<VyFlygKnapp aktiv={vyFlyg.aktiv} onStarta={() => { setBokOpp(false); vyFlyg.startaVyFlygning(); }} dold={titel || intro || saga || menyOpp || foralder || albumOpp || kartaOpp || panel !== "spel" || Boolean(platsUi.intro) || resa.mal !== null} />` och `<DalFlygEtiketter synlig={vyFlyg.aktiv || introFlygAktiv} />`.

---

## 4. Slutverifiering av Hela Blockserie W (`W1`–`W4`) & 5 Bevisbilder
1. Kör det snabba provet för hela serien:
   - `node --experimental-strip-types rundor/W1-W4-levande-varld/prov-w1-w4.mjs --snabb --steg=all`
2. Kör struktur-, typ-, produkt- och rösttester:
   - `npm run check:struktur` (`0` filer `> 400` rader, exakt `174` unika / `179` förekomster av `data-testid`)
   - `npx tsc --noEmit`
   - `npm run test:product`
   - `node --experimental-strip-types rundor/R1-R2-kompletta-roster/prov-r1-r2.mjs --snabb --steg=alla`
   - `npx vite build`
3. Kör den fulla Playwright-verifieringen för `W1`–`W4` med skärmbildsexport till `/workspace/trollpennan-nulage/ko-27okt-w`:
   - `node --experimental-strip-types rundor/W1-W4-levande-varld/prov-w1-w4.mjs --steg=all --ut /workspace/trollpennan-nulage/ko-27okt-w`
   - Kontrollera att alla 5 bevisbilderna på `375×812` finns i `/workspace/trollpennan-nulage/ko-27okt-w/`:
     1. `w1-sagoljus-pmrem-375x812.png`
     2. `w2-horisont-biomer-375x812.png`
     3. `w3-vagvisare-och-resa-375x812.png`
     4. `w4-intro-dalflygning-375x812.png`
     5. `w4-se-hela-dalen-375x812.png`
4. Skriv `RUNDAW4.md` med `Show that:` och resultat från alla `AC-W01`..`AC-W12`.
5. Committa alla ändringar på grenen.
