# Grindutlåtande — G2: Phaser bort (en renderväg)

**Datum:** 2026-10-24
**Runda:** `G2` (körs direkt efter att `G1c` är mergad)
**Beslut:** **JA (GRÖN GRIND)** — beställningen är klar att köras i en runda (`G2`, 65 turer, tak 75) så snart `G1c` är mergad.

---

## Kontroll mot samtliga 13 grindpunkter (`build-round-gate`)

### 1. En runda = ett spelarläge / en välavgränsad uppgift
- **Utfall:** Godkänd.
- Rundan gör exakt en sak: tar bort den döda 2D-Phaser-motorn (7 rena Phaser-filer + paketet `phaser` + DOM-elementet `.duk` + `window.__spel`) och kopplar `brygga.registrera("ang", ...)` till `Angen3D`, så att alla 5 platser (**Ängen**, **Skogen**, **Sjön**, **Grottan**, **Gården**) körs med en enda renderväg (R3F + DOM).
- **Dimensionering enligt O1a-lärdomen:**
  - `git rm` av 7 filer + `npm uninstall phaser`: ~4 anrop
  - 6 kirurgiska filändringar (`src/spel/angen3d.tsx`, `src/spel/styr/useHandelser.ts`, `src/spel/styr/useVarld.ts`, `src/spel/styr/useSpelTillstand.ts`, `src/spel/ui/SpelVy.tsx`, `src/styles.css`) × ~8 anrop = ~48 anrop
  - Prov (`prov-g2.mjs --snabb`, `test:product`, `build:pages`, `prov-g2.mjs`) + `RUNDA-G2.md` = ~10 anrop
  - **Summa:** ~62 anrop → ryms väl i **en runda `G2` med 65 turer (tak 75)** på `grok-4.7` high effort. Ingen uppdelning i G2a/G2b behövs.

### 2. Återanvändning inuti och utanför repot (tänka utanför boxen)
- **Utfall:** Godkänd.
- **Låna inuti repot:** Mönstret för `brygga.registrera("gard", { ... platser() })` från `src/spel/gard/Garden3D.tsx` (G1b) och `malTillDuk(uid)` i `src/spel/ui/hjalp.ts` återanvänds rakt av i `src/spel/angen3d.tsx` för `"ang"`.
- **Förenkla bort beroende:** Istället för att ersätta Phaser med något nytt bibliotek tas `phaser` (~1,2 MB minifierad) och 3 178 rader död 2D-kod bort helt. Den virtuella 750×900-ramen (`--duk-x`, `--duk-y`, `--duk-w`, `--duk-h`) ersätts med 4 rader ren matematik i `useHandelser.ts`.
- **Licens:** Inga nya tredjepartsberoenden eller modeller läggs till (endast `npm uninstall phaser`).

### 3. Mät före rundan och frys baslinjen
- **Utfall:** Godkänd.
- Baslinje före G2 (på `8eaec12` / före G2):
  - 7 rena Phaser-filer i `src/spel/` = **3 178 rader** (`starta.ts` 48, `gard.ts` 632, `scen.ts` 1 101, `avscen.ts` 514, `ritaBygg.ts` 812, `deladeBilder.ts` 18, `natthimmel.ts` 53).
  - `"phaser": "^3.90.0"` i `package.json` genererar en egen `phaser-*.js`-chunk (~1,2 MB) i `dist-pages/assets/`.
  - `node rundor/G2-phaser-bort/matt/prov-g2.mjs --snabb` ger **FAIL** före G2 (hittar alla 7 filer, `"phaser"` i `package.json`, `starta.ts` i `src/` och `.duk` i `src/`).

### 4. Snabbt deterministiskt prov (utan webbläsare, < 2 s)
- **Utfall:** Godkänd.
- `node rundor/G2-phaser-bort/matt/prov-g2.mjs --snabb` körs på < 0,2 s och verifierar att:
  1. Inga av de 7 Phaser-filerna finns kvar på disk.
  2. `"phaser"` är borta ur `package.json` och `package-lock.json`.
  3. Inga referenser till `phaser`, `starta.ts`, `__spel` eller `className="duk"` finns i `src/`.
  4. Inga hjälparfiler som testas av `test:product` (`texturKo.ts`, `pekare.ts`, `kit.ts`, `beteende.ts`, `avbro.ts`) har tagits bort av misstag.

### 5. Sanningskällan utpekad och provkonflikter kontrollerade
- **Utfall:** Godkänd — **0 provkonflikter** med befintliga testfiler när gränsdragningen i beställningen följs:
  - Samtliga 35 testfiler (`src/**/*.test.ts`, `src/**/*.test.mjs`) och `scripts/check-spel-struktur.mjs` har kontrollerats:
    - **0 tester** importerar `phaser`, `starta.ts`, `gard.ts`, `scen.ts`, `avscen.ts`, `ritaBygg.ts`, `deladeBilder.ts` eller `natthimmel.ts`.
    - `src/spel/texturKo.test.ts` importerar `./texturKo.ts` (har ingen Phaser-koppling) → `texturKo.ts` behålls.
    - `src/spel/r9h.test.ts` importerar `./pekare.ts` (har ingen Phaser-koppling, används även av `src/spel/ang/djur.tsx`) → `pekare.ts` behålls.
    - `src/tolk/tolk.test.ts` importerar `@/spel/beteende.ts` (har ingen Phaser-koppling) → `beteende.ts` behålls.
    - `src/spel/tts3.test.ts` läser efter S1b `src/spel/styr/useSpelApi.ts` → påverkas inte av G2.
    - `scripts/check-spel-struktur.mjs` kräver `Spel.tsx <= 80` rader och moduler i `styr/` och `ui/` under sina tak → i G2 minskar bara `useHandelser.ts`, `useVarld.ts`, `useSpelTillstand.ts` och `SpelVy.tsx` med några rader.

### 6. Visuellt bevis på mobilskärm (`375×812`) före merge
- **Utfall:** Godkänd.
- `node rundor/G2-phaser-bort/matt/prov-g2.mjs` bygger/startar spelet på `375×812`, besöker alla 5 platser (**Ängen**, **Skogen**, **Sjön**, **Grottan**, **Gården**), kontrollerar att `.duk` saknas, att `window.__spel === undefined`, att `--duk-h` ligger i `[0.50, 0.60]`, att `window.__troll.platser()` returnerar skapelsernas koordinater på både `ang` och `gard`, att 0 konsol-/sidfel uppstår och sparar skärmbilder i `rundor/G2-phaser-bort/matt/bilder/`.

### 7. Ingen skenframgång
- **Utfall:** Godkänd.
- Provet tillåter inte att Phaser bara döljs med CSS (`visibility: hidden`); både källkoden, `package.json`, DOM (`.duk`) och den byggda bunten (`dist-pages/assets/`) kontrolleras maskinellt.

### 8. Rätt verktyg och modell
- **Utfall:** Godkänd.
- Grok Build CLI med `grok-4.7` (eller `build-fast`) på `high` effort.

### 9. Inga externa beroenden eller betal-API:er
- **Utfall:** Godkänd.
- **0 TTS-anrop**, 0 nätverksanrop och 0 nya paket.

### 10. Tydlig stoppgräns (turtak)
- **Utfall:** Godkänd.
- 65 turer (tak 75), `RUNDA-G2.md` senast vid tur 50.

### 11. Ren arbetsträdshantering
- **Utfall:** Godkänd.
- Körs i ren klon/worktree ovanpå mergad `G1c`.

### 12. Spårbar slutrapport (`RUNDA-G2.md`)
- **Utfall:** Godkänd.
- Krävs i beställningen med filtabell, buntmått och provutdata.

### 13. Inga färdiga patchar som Build kan nå
- **Utfall:** Godkänd.
- Beställningen innehåller endast arkitekturregler, fil- och funktionsritning samt acceptanstester — inga koddiffar eller `.patch`-filer.
