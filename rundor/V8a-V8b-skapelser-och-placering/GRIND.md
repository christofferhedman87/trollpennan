# Grindchecklista V8a–V8b — `build-round-gate` (13 punkter)

Grindkontroll utförd mot `origin/main` (`d9068f2`, PR #206 mergad, 425/425 prov gröna) innan rundorna V8a och V8b får startas.

## Specialistkällor på disk (verifierade)
1. **Kodspaning (Tracey):** `/workspace/kod-inkorg/V4-V9/spaning.md`
2. **Stilguide (Arty):** `/workspace/trollpennan-nulage/stilguide.md`
3. **3D-manifest & V-serie (Fable):** `/workspace/modell-inkorg/_blockserie-v/manifest-utkast.tsv` + `/workspace/modell-inkorg/_blockserie-v/BLOCKSERIE-V.md`
4. **Speltest & skärmkrav 375×812 (Critiquito):** `/workspace/granskning/2026-10-25/rapport.md` (5 konkreta krav på `375×812`)
5. **Fysiskt kalibreringsskript & kalibreringsrapport för V8b (Grindpunkt 6):**
   - Skript: `/workspace/trollpennan-repo/rundor/V8a-V8b-skapelser-och-placering/matt/kalibrera-v8b.mjs`
   - Rapport: `/workspace/trollpennan-repo/rundor/V8a-V8b-skapelser-och-placering/matt/kalibrering-v8b.json`

---

## De 13 grindpunkterna i `build-round-gate`

### 1. Enkelmål och tidsbudget (Grindpunkt 1 & Punkt 10)
- **Uppdelning enligt Punkt 10:** Eftersom V8 omfattar både (a) rika skapelser i tolk/minne (`MAX_SYNLIGA_DJUR = 16`, antalsord 1–10, `"och"`-meningar, mössa på frysande kanin) och (b) en placerings- och synlighetslösare i 3D-skärmrum (`P3a` krav 2–4 + `P3b-2` `troja`), är V8 uppdelad i **två separata en-målsrundor**:
  - **`BESTALLNING-V8a.md` (`--del 1`):** Rika skapelser utan tyst radering (ängstak 16 med vänlig påminnelse, antal 1–10, två djur med `"och"`, mössa på frysande kanin).
  - **`BESTALLNING-V8b.md` (`--del 2`):** Dedikerad placerings- och siktlösare på `375×812` (småsaker `≥ 40 px` och `0 %` överlapp, nyaste byggnad längst fram, sjukhuset `≤ 10 %` skymt, röd tröja `≥ 25 %` pixeldiff). Inga andra spelfunktioner ingår i V8b.

### 2. Exakta filer och funktioner namngivna (Grindpunkt 2)
- **V8a:**
  - `src/spel/platser.ts` (`MAX_SYNLIGA_DJUR = 16`, behåll `TAK_PER_PLATS = 10` för övriga platser)
  - `src/spel/minneSparning.ts` (`laggPaAngSpar`, `kallaHitSpar`, `somnaEn`)
  - `src/spel/minne.ts` (re-export av `MAX_SYNLIGA_DJUR`, `tillLada`)
  - `src/spel/stall.ts` (`hamtaFranStall` på `START_PLATS`)
  - `src/spel/placering.ts` (`RESERV_MAX = 16` samt villkor för `reserv_krymp`)
  - `data/ord.json` (`antal_tak: 10`, `repliker.sover` med vänlig stallpåminnelse)
  - `data/test-fraser.json` (`"tio katter"` -> `antal_pa_angen: 10`)
  - `src/tolk/lexikon.ts` (`lasToken` stöd för sifferord `"1"`–`"10"`)
  - `src/tolk/tolka.ts` (`delaOchMening(raw: string): string[]`)
  - `src/spel/styr/useSkapa.ts` (`hanteraDjur` med `delaOchMening`, mössa på befintlig frysande kanin, samt vänlig påminnelse vid full äng)
- **V8b:**
  - `data/storlek.json` (`smasak.ids`: `["boll", "apple", "svamp", "stjarna", "nyckel", "kaffekopp", "puck"]`)
  - `src/spel/entiteter.ts` (`arSmasak` kollar `S.smasak.ids?.includes(kropp)`)
  - `data/placering.json` (`siluett_andel` för småsaker, `byggnad_max_skymd: 0.10`)
  - `src/spel/placering.ts` (småsaker `≥ 40 px` + `0 %` överlapp på främre rader, nyaste byggnad närmare kameran än äldre byggnader, sjukhus `≤ 10 %` skymt)
  - `data/plagg.json` och `src/spel/tillbehor/faest.ts` (`troja`/`kropp` fram-/upp-förskjutning och djupskala så `≥ 25 %` av djurets skärmpixlar ändrar färg i `375×812`)

### 3. Namngivna builder-skills (Grindpunkt 3)
- `3d-web-game-check`, `child-literacy-design`, `stylized-3d-art-direction`, `typescript-best-practices`, `principle-prove-it-works`.

### 4. Körbart provskript med `--snabb` och `--del` (Grindpunkt 4)
- `rundor/V8a-V8b-skapelser-och-placering/matt/prov-v8.mjs` stödjer `--snabb` och `--del 1|2|alla`.
- Provskriptet kör på ~6 sekunder i Node 22 (`--experimental-strip-types`) utan webbläsarhäng.

### 5. Föremätning körd mot `main` (`d9068f2`) med `ok: false` (Grindpunkt 5)
- `node rundor/V8a-V8b-skapelser-och-placering/matt/prov-v8.mjs --snabb --del alla` är körd före rundan och rapporterar `ok: false` (både `del1.ok: false` och `del2.ok: false`) utan krasch.

### 6. Kalibrering av regel mot skärmmätning på disk före V8b (Grindpunkt 6)
- Kalibreringsskriptet `rundor/V8a-V8b-skapelser-och-placering/matt/kalibrera-v8b.mjs` är skrivet och kört mot `d9068f2`, och utdata ligger sparad i `rundor/V8a-V8b-skapelser-och-placering/matt/kalibrering-v8b.json`:
  - **Småsaker (`del1_smasaker`):** Visar att `svamp` idag har `arSmasakNu: false` (`z = -1.95`), att `boll` (`skymdTackt: 0.355`) och `apple` (`skymdTackt: 0.335`) överlappar på `375×812`, och kalibrerar `siluett_andel` till `[0.85, 0.85]`.
  - **Byggnader & Sjukhus (`del2_byggnader`):** Visar att `koja` i sekvensen `slott -> hus -> torn -> koja` hamnar på `z = -1.8` bakom äldre byggnad (`z = -1.5`, `nyastFramstNu: false`), samt att `sjukhus` i ängens 10-ordssekvens får `skymdTacktNu: 0.139` (`13.9 % > 10 %`).
  - **Tröja (`del3_troja`):** Visar att nuvarande `troja`-fäste ger `nuvarandePixelDiffAndel: 0` (`0 %`) på `kanin`, `katt`, `hund`, `rav`, medan kalibrerade parametrar (`skala: 1.48`, `djupSkala: 3.4`, `upp: -0.06`, `fram: 0.78`) ger `34.4 %` på `kanin`, `25.4 %` på `katt`, `28.0 %` på `hund` och `38.5 %` på `rav` (samtliga `≥ 25 %` och med `p3b2.test.ts` grön).

### 7. Inga kända testfällor i befintliga enhetsprov (Grindpunkt 7)
- `src/spel/platser.test.ts` (rad 75) kräver att `skogen` behåller `TAK_PER_PLATS = 10` (`skogen.length <= 10`). Därför höjs taket till `MAX_SYNLIGA_DJUR = 16` på `ang` (`START_PLATS`) medan `TAK_PER_PLATS = 10` behålls som standard för övriga platser.
- `src/spel/p3a.test.ts` (rad 154) kräver att `somnat > 0` när 12 stora djur släpps på `ang`. I `BESTALLNING-V8a.md` specificeras exakt hur `somnaEn` / `placera` hanterar detta så att 12 stora djur söver minst 1 medan 16 normalstora/små djur ryms vakna på ängen.
- `src/tolk/tolk.test.ts` läser `data/test-fraser.json` där `"tio katter"` har `antal_pa_angen`; `data/test-fraser.json` uppdateras från `8` till `10` samtidigt som `data/ord.json` `antal_tak` ändras till `10`.
- `src/spel/p3b2.test.ts` kräver att `troja` på `kanin`, `katt`, `hund`, `rav` uppfyller `box.max.y >= 0.35 * hojd`, `box.min.y >= 0.15 * hojd` och `|c.x| < 0.25 * bredd`. Kalibreringen är verifierad mot alla tre gränserna.

### 8. Skärmtrohet på `375×812` (Critiquitos 5 krav) (Grindpunkt 8)
- Alla mätningar i V8b och `prov-v8.mjs` sker i fast stående mobilvy `375×812` med `KAMERA_ANG = [0, 4.15, 9.8]` mot `[0, 1.05, -0.15]`, `fov = 58°`.

### 9. Barnupplevelse och läsglädje 7–12 år (Grindpunkt 9)
- Barnet får skapa precis det antal (1–10) det skriver, kombinera två djur med `"och"` i samma mening, ge den frysande kaninen en mössa utan att få en förvirrande dubblettkanin, och får en varm förklaring när ängen är full vid 16 djur.

### 10. Dedikerad runda för placerings-/synlighetslösare (Grindpunkt 10)
- Uppfyllt genom uppdelningen i `BESTALLNING-V8a.md` och `BESTALLNING-V8b.md`.

### 11. Inga externa nätverksberoenden i provet (Grindpunkt 11)
- `prov-v8.mjs` och `kalibrera-v8b.mjs` läser lokala `.glb`-filer från `public/assets/modeller/` och kör helt offline.

### 12. Bakåtkompatibilitet med V1–V3 (`d9068f2`) (Grindpunkt 12)
- Utgår direkt från `origin/main` (`d9068f2`, 425/425 prov gröna) utan att krocka med V4–V7.

### 13. Tydligt acceptansbevis (Grindpunkt 13)
- Både `node rundor/V8a-V8b-skapelser-och-placering/matt/prov-v8.mjs --snabb --del alla` (`ok: true`) och `npm test` (alla prov gröna) samt `npm run build` krävs för godkännande.
