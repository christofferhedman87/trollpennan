# Runda V2 — Samlade menyer med bildikoner, konsekventa namn (`✍️ Skriv` & `📋 Uppdrag`), aktivt uppdrag i Uppdragsboken & trygg barnmeny

**Bas:** `608b700` (`main`, efter V1 #204)  
**Gren:** `runda-v2-kod`  
**Datum:** 2026-10-25  

## Genomförda ändringar
1. **`data/forsta-stunden.json`, `src/spel/forstaStunden.ts` & `src/spel/ui/Coach.tsx`:**
   - Lade till `visa_text` på `"forsta-ordet"` (`"Tryck på Skriv och skriv ett djur!"`) och `"uppdraget"` (`"Tryck på Skriv och skriv det Bengtsson ber om!"`) utan att röra `.text` (bevarar TTS-röststrängarna i `rost2.test.ts`).
   - `Coach.tsx` visar `s.steg.visa_text ?? s.steg.text` i bubblan men skickar `s.steg.text` till `rostKo.anmal`.
2. **`data/meny.json`, `src/spel/ui/Hud.tsx`, `src/spel/ui/Stall.tsx`, `src/spel/ui/NpcFigur.tsx` & `src/spel/ui/hud-p2.css`:**
   - Alla menyval i `MenyPanel` har bildikoner (`data-v2="meny-ikon"`, 11 st i DOM, knappar `≥ 48 px` höga).
   - Direkt ljudknapp `🔊 Ljud: På` / `🔇 Ljud: Av` (`data-v2="meny-ljud"`, `343×48 px`) i menyn.
   - `"Börja om"` (`data-testid="meny-borja"`) dold i barnmenyn (`hidden`) och flyttad bakom vuxenlåset i För vuxna (`meny-foralder`).
   - Nedre knappraden (`HudBot`) visar `✍️ Skriv` (`data-v2="skriv-knapp"`) och `📋 Uppdrag`.
3. **`src/spel/ui/BokSkarm.tsx` & `src/spel/ui/SpelVy.tsx`:**
   - Bengtssons aktiva skrivuppdrag visas överst i Uppdragsboken som ett guldkort (`data-v2="aktivt-uppdrag-kort"`) med `🔊 Lyssna` (`data-v2="lyssna-aktivt-uppdrag"`, `112×48 px`) och `✍️ Skriv lösningen`.
   - Varje rad i Uppdragsboken har även en egen `🔊`-knapp (`≥ 44×44 px`).
4. **`src/spel/ui/ForalderDialog.tsx`:**
   - Rubriken rensad till `"För vuxna"` (utan `(P1–P3)`), matematiklås (`3 + 4 = ?`) när dialogen öppnas från menyn, och `data-v2="foralder-borja-om"`, `data-v2="foralder-borja-ja"`, `data-v2="foralder-borja-nej"` på Börja om-flödet.
5. **`src/spel/v2.test.ts` & `package.json`:**
   - Ny enhetstestfil `src/spel/v2.test.ts` tillagd i `test:product` (0 befintliga testfiler ändrade).

## Verifiering
- `prov-v1-v3.mjs --snabb --del 2` & `--del 1`: `ok: true`, `antalFel: 0`
- `prov-v1-v3.mjs --del 2` & `--del 1` (`375×812`): `ok: true`, `antalFel: 0`, `sidfel: 0`
- `prov-p4.mjs --del alla` (`375×812`): `ok: true`, `antalFel: 0`, `sidfel: 0`
- `npm run check:struktur`: `Spel.tsx` 49 rader, `174` unika / `179` förekomster av JSX-`data-testid`
- `npm run test:product`: `422/422` gröna
- `npm run typecheck`, `npm run typecheck:pages`, `npx eslint .`: `0` fel
