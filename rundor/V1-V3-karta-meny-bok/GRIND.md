# Grindutlåtande V1–V3 (`build-round-gate` punkt 1–13)

**Datum:** 2026-10-25  
**Bas på `main`:** `83bf89a` (#203)  
**Rundor som granskas:**
- **V1:** Visuell & pedagogisk Världskarta som väcker upptäckarlust (`BESTALLNING-V1.md`)
- **V2:** Samlade menyer med bildikoner, konsekventa namn, aktivt uppdrag i Uppdragsboken & trygg barnmeny (`BESTALLNING-V2.md`)
- **V3:** Luftigt skrivfönster i halvhöjd med 3 flikar, synliga ordkort direkt på `375×812` & tömd skrivruta (`BESTALLNING-V3.md`)

**Samlat utlåtande:** **JA** för samtliga tre rundor (`V1`, `V2`, `V3`).

---

## Kontroll av de 13 grindpunkterna

| # | Grindpunkt | Kontroll | Utfall |
|---|---|---|---|
| **1** | **`PROJECT.md` läst och uppdaterad** | `PROJECT.md` och `docs/blockserie-v-2026-10-25.md` är uppdaterade 2026-10-25 på `arkitekt/projekt-lage` (`a0c0dc6`) mot `origin/main` = `83bf89a` (#203). | **GRÖN** |
| **2** | **Kodspaning / designspec** | Samtliga berörda källfiler (`KartaLager.tsx`, `Hud.tsx`, `BokSkarm.tsx`, `Ledtradsyta.tsx`, `Coach.tsx`, `ForalderDialog.tsx`, `SpelVy.tsx`, `useVarld.ts`, `useSkriv.ts`, `hud-p2.css`, `bok-p1.css`, `styles.css`, `platser.json`, `omraden.json`, `meny.json`, `forsta-stunden.json`) är genomlästa och radbudgeterade. | **GRÖN** |
| **3** | **Ett mål per runda** | **V1** gör en sak: visuell och pedagogisk Världskarta. **V2** gör en sak: bildikoner, konsekventa namn, aktivt uppdrag i Uppdragsboken och trygg barnmeny. **V3** gör en sak: luftigt skrivfönster i halvhöjd med 3 flikar och synliga ordkort direkt på `375×812`. | **GRÖN** |
| **4** | **Data + tillgång = ingen per-sak-kod** | V1 läser alla 5 platsers kort, ordbrickor och rösttexter ur `data/platser.json` (`varldskarta`) och `data/omraden.json`. V2 läser menyns texter/ikoner ur `data/meny.json` och `visa_text` ur `data/forsta-stunden.json`. | **GRÖN** |
| **5** | **Ingen kollision med låsta prov eller baslinjer** | Kontroll mot samtliga 417 prov genomförd:<br>• `scripts/check-spel-struktur.mjs` (174/179 `data-testid` i JSX): alla befintliga `data-testid` behålls i JSX; nya ankare använder `data-v1`, `data-v2`, `data-v3`.<br>• `src/spel/rost2.test.ts` & `p2.test.ts`: `.steg[].text` i `forsta-stunden.json`, `.forsta_gangen[]` i `texter-aventyr.json` och `.karta.(valj_djur\|inget_djur)` i `omraden.json` rörs inte; nya skärmtexter i `Coach.tsx` ligger i `.steg[].visa_text` och `KartaLager` använder befintliga röststrängar ur `rost-manifest.json`.<br>• `src/spel/p4c.test.ts`: alla `data-testid` och `menyJson.oppen.*`-referenser i `Hud.tsx` bevaras.<br>• `src/spel/bokSkrollning.test.mjs`: `.bok .bok-mitt .kort-yta`, `.bok-mitt` och `.bok .bok-mitt .flikar` i `src/styles.css` lämnas orörda.<br>• `rundor/P4-lasning-och-karta/matt/prov-p4.mjs`: `Ledtradsyta` renderas i kompakt läge i standardvyn `✍️ Skriv & ordkort` så att `[data-p4="lyssna-gata"]` och `[data-p4="ledtrad-knapp"]` alltid är direkt klickbara. | **GRÖN** |
| **6** | **Före-mätning med mätskriptet** | `node rundor/V1-V3-karta-meny-bok/matt/prov-v1-v3.mjs --snabb --del alla` körd mot `83bf89a`: visar som förväntat `ok: false` på exakt de punkter V1, V2 och V3 ska lösa. | **GRÖN** |
| **7** | **Licens och attribution** | Inga externa tredjepartsmodeller eller ljudfiler tillkommer i V1–V3 (alla illustrationer på kartan är egna inline-SVG:er och alla röstfiler finns redan i `public/ljud/rost/`). | **GRÖN** |
| **8** | **Ingen TTS-generering (0 nya `.mp3`)** | Samtliga 5 `rost_text` i `platser.json` (`varldskarta`) är verifierade mot `data/rost-manifest.json` (`4d827725`, `d33c5b60`, `90d6ed33`, `829c3dc9`, `ea5c8bb1`) och har befintliga `.mp3`-filer i `public/ljud/rost/`. | **GRÖN** |
| **9** | **Skärmbevis i mobilvy (`375×812`)** | `prov-v1-v3.mjs` tar skärmbilder i `375×812` för V1 (`v1-varldskarta-topp.png`, `v1-varldskarta-botten.png`, `v1-resa-skogen.png`), V2 (`v2-coach-och-skriv.png`, `v2-meny-ikoner.png`, `v2-uppdragsbok-aktivt.png`, `v2-foralder-borja-om.png`) och V3 (`v3-skriv-halvhojd-ordkort.png`, `v3-gata-flik.png`, `v3-ideer-flik-hela.png`) och mäter verkliga `getBoundingClientRect()`-värden. | **GRÖN** |
| **10** | **Turbudget och storlek (O1a-lärdomen)** | • **V1:** 6 ändrade filer + 1 test → `6 × 6 + 10 ≈ 46–48` turer (tak **65**).<br>• **V2:** 8 små ändringar + 1 test → `~52` turer (tak **65**).<br>• **V3:** 4 ändrade filer + 1 test → `~48` turer (tak **65**).<br>Alla nya/ändrade kodfiler hålls `≤ 400` rader (`Spel.tsx` orörd på 49 rader). | **GRÖN** |
| **11** | **0 ändrade befintliga testfiler** | Kraven i `BESTALLNING-V1.md`..`V3.md` och kontrollen i `prov-v1-v3.mjs` kräver 0 ändrade befintliga testfiler. | **GRÖN** |
| **12** | **Körinställningar och övervakning** | Modell: `grok-4.7`, reasoning `high`, max turns `65` per runda. Körs i ren klon i `/tmp` ovanpå `origin/main`. | **GRÖN** |
| **13** | **Inga `.patch`-filer i repot eller byggkatalogen** | Verifierat med `find . -name "*.patch"`: **0 filer**. Diffkontroll mot historiska patchar ska ligga `< 20 %`. | **GRÖN** |
