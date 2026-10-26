# BESTALLNING-V8b — Dedikerad placerings- och siktlösare på 375×812 (med kalibrering på disk)

## 1. Mål (Dedikerad en-målsrunda enligt `build-round-gate` Punkt 6 & Punkt 10)
Denna runda innehåller **endast** placerings- och synlighetslösarna på stående mobilskärm `375×812` (`P3a` krav 2–4 + `P3b-2` `troja`). **Inga andra spelfunktioner får ändras i V8b!**

Fyra mätbara krav på `375×812` (med `KAMERA_ANG = [0, 4.15, 9.8]` mot `[0, 1.05, -0.15]`, `fov = 58°`):
1. **Småsaker (`boll`, `apple`, `svamp`, `stjarna`, `nyckel`) i fri siktlinje:**
   - Alla 5 räknas som `smasak` (`arSmasak(id) === true`), placeras på främre markraden i fri siktlinje med `≥ 40 px` skärmstorlek (`max(w, h) >= 40`), `≥ 40 px` skärmavstånd mellan sina centra och **`0 %` överlapp** (`skymd.tackt === 0` och `tacker(a, b) === 0`) på `375×812`.
2. **Nyaste byggnad (`slott`, `hus`, `torn`, `koja`) på främre raden:**
   - När byggnader skapas i följd (t.ex. `slott -> hus -> torn -> koja`) placeras den **nyaste byggnaden alltid på främre byggnadsraden** (närmare kameran än alla äldre byggnader: `nyast.z >= aldreByggnad.z`, eller strikt `nyast.z > aldreByggnad.z` när äldre flyttas bakåt) med fri siktlinje (`skymd.tackt <= 0.10`).
3. **Sjukhuset i bakgrunden (`sjukhus`) `≤ 10 %` skymt:**
   - `sjukhus` får aldrig täckas till mer än `≤ 10 %` (`skymd.tackt <= 0.10`, dvs. synlig andel `≥ 90 %`) av sitt skärmutsnitt på `375×812` (inklusive i 10-ordssekvensen `["ko", "katt", "hund", "kanin", "sjukhus", "stjarna", "kaffekopp", "gris", "slott", "puck"]`).
4. **Röd tröja (`troja`) `≥ 25 %` skärmsynlighet (pixeldiff) på `375×812`:**
   - `troja`-fästet i `data/plagg.json` och `src/spel/tillbehor/faest.ts` får en tydlig fram-/upp-förskjutning och djupskala så att `≥ 25 %` av djurets skärmpixlar i `375×812` träffar tröjan framför djurets kropp på samtliga fyrbenta referensdjur (`kanin`, `katt`, `hund`, `rav`), samtidigt som `src/spel/p3b2.test.ts` förblir 100 % grön.

## 2. Förkalibrering på disk (Grindpunkt 6)
Kalibreringsskriptet är redan kört mot `main` (`d9068f2`) och rapporten ligger på disk:
- **Skript:** `rundor/V8a-V8b-skapelser-och-placering/matt/kalibrera-v8b.mjs`
- **Rapport:** `rundor/V8a-V8b-skapelser-och-placering/matt/kalibrering-v8b.json`

Ur `kalibrering-v8b.json`:
- `svamp` har idag `arSmasakNu: false` (`malhojd: 1.2`) och placeras vid `z = -1.95`.
- I 5-småsakssekvensen överlappar `boll` (`skymdTackt: 0.355`) och `apple` (`skymdTackt: 0.335`).
- I 4-byggnadssekvensen (`slott -> hus -> torn -> koja`) hamnar `koja` på `z = -1.8` bakom `slott` (`z = -1.5`, `nyastFramstNu: false`).
- `sjukhus` i 10-ordssekvensen på ängen har `skymdTacktNu: 0.139` (`13.9 % > 10 %`).
- `troja` har idag `nuvarandePixelDiffAndel: 0` (`0 %`) på `kanin`, `katt`, `hund`, `rav`. Med de kalibrerade parametrarna (`skala: 1.48`, `djupSkala: 3.4`, `upp: -0.06`, `fram: 0.78`) blir synligheten:
  - `kanin`: **34.4 %**
  - `katt`: **25.4 %**
  - `hund`: **28.0 %**
  - `rav`: **38.5 %**

## 3. Builder-skills att ladda före kodning
- `3d-web-game-check`
- `stylized-3d-art-direction`
- `typescript-best-practices`
- `principle-prove-it-works`

## 4. Exakt ritning (Filer och funktioner)

### A. Småsaker (`boll`, `apple`, `svamp`, `stjarna`, `nyckel`) `≥ 40 px` & `0 %` överlapp
1. **`data/storlek.json` & `src/spel/entiteter.ts`:**
   - Lägg till `"ids": ["boll", "apple", "svamp", "stjarna", "nyckel", "kaffekopp", "puck"]` under `"smasak"` i `data/storlek.json`.
   - Uppdatera `arSmasak(kropp: string)` i `src/spel/entiteter.ts` så att den returnerar `true` om `(S.smasak as { ids?: string[] }).ids?.includes(kropp)` ELLER om `typ === "sak"` och `malhojd` ligger i `[minH, maxH]`.
2. **`data/placering.json`:**
   - Lägg in kalibrerade `siluett_andel`-värden för `"boll": [0.85, 0.85]`, `"apple": [0.85, 0.85]`, `"svamp": [0.85, 0.85]`, `"stjarna": [0.85, 0.85]`, `"nyckel": [0.85, 0.85]`, `"kaffekopp": [0.85, 0.85]`, `"puck": [0.85, 0.85]`.
3. **`src/spel/placering.ts`:**
   - Sätt `const SMASAK_PX = PLACERING.smasak_px ?? 40;` (ta bort avdraget `- (PLACERING.matfel_px ?? 0)` så att gränsen är minst `40 px`).
   - Låt `smaKrav` gälla **alla småsaker** (`sma`), inte bara `nr === 0`, och låt även äldre småsaker (`nr > 0`) pröva `PLACERING.smasak_vaxa ?? [1]` när deras `max(w, h) < SMASAK_PX`.
   - För småsaker (`sma === true`): kräv `0 %` skärmöverlapp (`varst === 0` i `sok()`, dvs. `grans = sma ? 0 : ...`) och minst `40 px` skärmavstånd mellan småsakernas skärmcentra (`Math.hypot(cx1 - cx2, cy1 - cy2) >= 40`), samt sök rader framifrån (`ri2 = ri` när `sma === true`) så att småsaker alltid står på främre raden i fri siktlinje.

### B. Nyaste byggnad längst fram + Sjukhuset `≤ 10 %` skymt
1. **`data/placering.json` & `src/spel/placering.ts`:**
   - När `roll === "bak"` (byggnader: `slott`, `hus`, `torn`, `koja`, `sjukhus`, `vaxthus`):
     - Sortera och placera byggnader i `placeraNiva` så att den **nyaste byggnaden** (`skapad` högst bland `roll === "bak"`) söker rader **framifrån** (`ri2 = ri`, närmast kameran i `bak`-bandet, t.ex. `z = -1.2`), medan äldre byggnader placeras på rader med `z <= nyasteByggnad.z` (och helst `z < nyasteByggnad.z` om ledig rad finns) så att en nyare byggnad **aldrig** hamnar bakom en äldre byggnad!
     - Kontrollera även i `placera()` (rad 294–305) att nedskalnings-/bakåtflyttningsloopen för `roll === "bak"` inte flyttar den nyaste byggnaden bakom en äldre byggnad när alla får plats.
   - För `sjukhus` (och byggnader med hög prioritet i bakgrunden):
     - Sätt max tillåten skymning för `sjukhus` till `0.10` (`10 %`, t.ex. via `byggnad_max_skymd: 0.10` i `data/placering.json` och i `sok()` i `src/spel/placering.ts`: när en ny eller äldre sak placeras framför `sjukhus`, får `sjukhus` aldrig få `tackt > 0.10`).

### C. `troja`-fäste med `≥ 25 %` skärmsynlighet i `375×812`
1. **`data/plagg.json` & `src/spel/tillbehor/faest.ts`:**
   - I `data/plagg.json`: uppdatera `"kropp"` (eller lägg till specifik nyckel/fält för `"troja"` som `plaggKonfig("troja")` läser) med de kalibrerade värdena:
     - `"skala": 1.48`
     - `"djupSkala": 3.4` (eller motsvarande Z-skalfaktor i `faestPlaggKlon`)
     - `"upp": -0.06`
     - `"fram": 0.78`
   - I `src/spel/tillbehor/faest.ts` (`faestPlaggKlon`):
     - För `plaggId === "troja"` (eller när `cfg.par === "kropp"`): använd `malMatt = Math.min(a.hojd * 0.85, Math.max(0.24, a.bredd * cfg.skala))` och sätt `klon.scale.set(s, s, s * (cfg.djupSkala ?? 3.4))` (med motsvarande Z-centrering `-((box0.min.z + box0.max.z) / 2) * sZ`) så att tröjan omsluter djurets främre bröstkorg och syns tydligt framifrån i kameravyn `375×812`.
   - **VIKTIG TESTFÄLLA (`src/spel/p3b2.test.ts`):**
     - Verifiera att `src/spel/p3b2.test.ts` passerar utan ändringar (`box.max.y >= 0.35 * hojd`, `box.min.y >= 0.15 * hojd`, `|c.x| < 0.25 * bredd` på `kanin`, `katt`, `hund`, `rav`).

## 5. Verifiering och bevis före leverans av V8b
```bash
/home/box/.local/node22/bin/node --experimental-strip-types rundor/V8a-V8b-skapelser-och-placering/matt/prov-v8.mjs --snabb --del 2
/home/box/.local/node22/bin/node --experimental-strip-types rundor/V8a-V8b-skapelser-och-placering/matt/prov-v8.mjs --snabb --del alla
npm test
npm run build
```
Alla delprov i `--del 2` och `--del alla` ska visa `ok: true` och samtliga enhetstester i `npm test` ska vara gröna.
