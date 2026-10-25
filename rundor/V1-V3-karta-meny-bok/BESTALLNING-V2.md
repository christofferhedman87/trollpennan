# Beställning V2: Samlade menyer med bildikoner, konsekventa namn, aktivt uppdrag i Uppdragsboken & trygg barnmeny

**Bas:** `main` efter att V1 är mergad  
**Löser:**
- **Fynd 2** i `/workspace/granskning/2026-10-25/rapport.md`: *"Fem olika 'böcker', motstridiga namn på knappar ('Pennans bok' vs 'Skriv', 'Uppdrag' vs 'Uppdragsboken') och en meny med 10 textrader utan ikoner"* + *"Inne i Uppdragsboken står 'Inga uppdrag än' trots att Bengtsson har ett aktivt uppdrag på skärmen"*.
- **Fynd 11** i `/workspace/granskning/2026-10-25/rapport.md`: *"'Börja om' ligger helt oskyddat i barnets vanliga meny, ljudknapp saknas i menyn och 'För vuxna' har små skönhetsfläckar ('(P1–P3)')"*.

**Turbudget:** ~52 turer (tak **65 turer**, modell `grok-4.7` high).  
**Hårda ramar:**
- **0 nya `.mp3`-filer / 0 TTS-anrop (ElevenLabs).**
- **0 ändrade befintliga testfiler** (`src/spel/p4c.test.ts`, `src/spel/p2.test.ts`, `src/spel/rost2.test.ts` m.fl. ska passera oförändrade).
- **`src/spel/Spel.tsx` (49 rader) får inte röras**, och varje ny/ändrad kodfil ska vara **≤ 400 rader**.
- **`scripts/check-spel-struktur.mjs` (174/179 `data-testid` i JSX):** Behåll exakt alla befintliga `data-testid`-attribut i JSX i `Hud.tsx`, `BokSkarm.tsx`, `ForalderDialog.tsx` och `Coach.tsx`. Sätt alla nya V2-ankare med `data-v2="..."`.

---

## 1. Mål (ett sammanhållet mål)

Gör spelets menyer och knappar begripliga, visuella och trygga för både 6-åringar och äldre barn:
1. **Konsekventa namn mellan pratbubbla, HUD och meny:**
   - Knappen nere i mitten (`pennans-bok`) visar `✍️ Skriv` (och undertitel `Pennans bok`), och coachbubblan (`Coach.tsx`) visar `visa_text` (*"Tryck på Skriv och skriv ett djur!"* / *"Tryck på Skriv och skriv det Bengtsson ber om!"*) medan röstkön fortsätter spela den befintliga röstfilen `steg.text`.
   - Uppdragsvyn heter konsekvent **Uppdrag** (`📋 Uppdrag`) både i HUD-remsan, menyn och bokens huvud/flik.
2. **Tydliga bildikoner på varje menyrad (`≥ 44 px` höjd) + direkt ljudknapp i menyn + dolda dubbletter:**
   - Varje synlig menyknapp i `MenyPanel` (`Hud.tsx`) får en stor bildikon (`data-v2="meny-ikon"`) och en kort etikett, en direkt ljudknapp (`🔊 Ljud: På` / `🔇 Ljud: Av`, `data-v2="meny-ljud"`, `≥ 44×44 px`) läggs i menyn, och de förvirrande dubblettraderna (`flik-byggbok` när man är på Ängen samt `demo-senare`) döljs med `hidden`.
3. **Bengtssons aktiva uppdrag visas överst inne i Uppdragsboken (`BokSkarm.tsx`):**
   - När barnet öppnar **Uppdrag** (`lage === "uppdrag"`) visas överst ett tydligt kort (`data-v2="aktivt-uppdrag-kort"`) med det aktiva uppdraget (från `aktivtSkrivUppdrag` eller Bengtssons/äventyrets aktuella uppdrag) + en `🔊 Lyssna`-knapp (`data-v2="lyssna-aktivt-uppdrag"`, `≥ 44×44 px`), så att Uppdragsboken aldrig säger *"Inga uppdrag än"* när ett uppdrag visas i HUD-remsan!
4. **"Börja om" flyttat bakom vuxenlåset i För vuxna + ren vuxenrubrik (`ForalderDialog.tsx`):**
   - I barnets vanliga meny (`Hud.tsx`) döljs `meny-borja` och `meny-borja-fraga` med `hidden` (så att `data-testid` ligger kvar i JSX men inget barn kan råka radera sin värld).
   - I `ForalderDialog.tsx` (bakom matematiklåset `3 + 4 = ?`) läggs en tvåstegs **"Börja om spelet"**-funktion (`data-v2="foralder-borja-om"` → `data-v2="foralder-borja-ja"` / `data-v2="foralder-borja-nej"`), och dev-koden `(P1–P3)` tas bort ur rubriken *"För vuxna"*.

---

## 2. Ritning och filbudget (8 befintliga filer + 1 ny testfil)

| Fil | Nuvarande rader | Max rader | Vad som ändras |
|---|---|---|---|
| `data/forsta-stunden.json` | 48 | 56 | Lägg till `"visa_text": "Tryck på Skriv och skriv ett djur!"` på steg `forsta-ordet` och `"visa_text": "Tryck på Skriv och skriv det Bengtsson ber om!"` på steg `uppdraget`. **VIKTIGT:** Lämna `.steg[].text` helt oförändrad (den är låst av `rost2.test.ts` och `p2.test.ts`!). |
| `data/meny.json` | 13 | 35 | Uppdatera öppna etiketter och ikoner för menyn (`oppen.gard = "Gården"`, `oppen.byggbok = "Byggboken"`, `oppen.album = "Album"`, `oppen.ordbok = "Ordbok"`, plus `ikoner`-karta) samtidigt som nycklarna `oppen.gard`, `oppen.byggbok`, `oppen.album`, `oppen.ordbok` behålls för `p4c.test.ts`. |
| `src/spel/ui/Coach.tsx` | 76 | 90 | Rendera `<span>{(steg.steg as { visa_text?: string }).visa_text ?? steg.steg.text}</span>` i pratbubblan medan `rostKo.anmal` fortsätter skicka `steg.steg.text`. |
| `src/spel/ui/Hud.tsx` | 265 | 310 | Lägg till tydliga bildikoner (`data-v2="meny-ikon"`) på alla synliga menyrader, lägg till ljudknappen (`data-v2="meny-ljud"`, `≥ 44×44 px`), sätt `hidden={varld !== "gard"}` på `flik-byggbok`, sätt `hidden` på `demo-senare` och `meny-borja`/`meny-borja-fraga`, och ge `pennans-bok` tydlig `✍️ Skriv`-etikett (`data-v2="skriv-knapp"`). **VIKTIGT:** Alla befintliga `data-testid` och `menyJson.oppen.*`-referenser i `Hud.tsx` MÅSTE ligga kvar i JSX för `check-spel-struktur.mjs` och `p4c.test.ts`! |
| `src/spel/ui/ForalderDialog.tsx` | 182 | 230 | Ta bort `(P1–P3)` ur `<h2>För vuxna</h2>`. Ta emot `borjaOm?: () => void` (eller anropa `useMinne.getState().borjaOm()` + `window.location.reload()` / samma callback som `SpelVy.tsx` skickar) bakom vuxenlåset via `data-v2="foralder-borja-om"` och bekräftelseknapparna `data-v2="foralder-borja-ja"` / `data-v2="foralder-borja-nej"` (`≥ 44×44 px`). |
| `src/spel/ui/BokSkarm.tsx` | 385 | 398 | I `lage === "uppdrag"`: ändra rubriken i `.bok-topp` till `"📋 Uppdrag"` och rendera överst i `.bok-mitt` ett tydligt kort (`data-v2="aktivt-uppdrag-kort"`) med det aktiva uppdraget (från `aktivtSkrivUppdrag(uppdragSpar, platsNu())` eller `useMinne.getState().aktivtUppdrag` / första steget i `FORSTA.steg` om barnet är vid 0 djur) samt en `🔊 Lyssna`-knapp (`data-v2="lyssna-aktivt-uppdrag"`, `≥ 44×44 px`) som anropar `rostKo.lasUpp(...)`. Säkerställ att stängknappen `×` i `.bok-topp` är `≥ 44×44 px`. |
| `src/spel/ui/SpelVy.tsx` | ≤ 145 | 150 | Skicka vid behov `borjaOm={borjaOm}` till `<ForalderDialog>` (via `Dialoger.tsx` eller direkt) så att vuxendialogens "Börja om" kör exakt samma `borjaOm`-logik. |
| `src/spel/ui/hud-p2.css` | ≤ 210 | 260 | Styla menyraderna med tydliga ikoner (`data-v2="meny-ikon"`), `min-height: 44px`, aktivt uppdragskort i Uppdragsboken och vuxendialogens "Börja om"-bekräftelse. |
| `src/spel/v2.test.ts` | ny | 120 | Enhetsprov för V2 (verifierar `forsta-stunden.json` `visa_text`, att `Coach.tsx` visar `visa_text`, att `Hud.tsx` har `data-v2="meny-ikon"` och `data-v2="meny-ljud"` och döljer `meny-borja`, att `ForalderDialog.tsx` saknar `(P1–P3)` och har `data-v2="foralder-borja-om"`, och att `BokSkarm.tsx` har `data-v2="aktivt-uppdrag-kort"`). |

---

## 3. Detaljerade invarianter att kontrollera i V2

1. **`src/spel/p4c.test.ts` (MÅSTE förbli 100 % grön):**
   - `Hud.tsx` får **aldrig** innehålla strängen `'data-last="ja"'`.
   - `Hud.tsx` **måste** innehålla strängarna:
     - `'data-testid="flik-ang"'`
     - `'data-testid="flik-gard"'`
     - `'data-testid="flik-byggbok"'`
     - `'data-testid="album-knapp"'`
     - `'data-testid="ut-pa-aventyr"'`
     - `'data-testid="uppdrag-knapp"'`
     - `'data-testid="ordbok"'`
     - `'data-testid="demo-senare"'`
   - `Hud.tsx` **måste** matcha regexarna `/menyJson\.oppen\.gard/`, `/menyJson\.oppen\.byggbok/`, `/menyJson\.oppen\.album/` och `/menyJson\.oppen\.ordbok/`.
2. **`src/spel/rost2.test.ts` och `src/spel/p2.test.ts` (MÅSTE förbli 100 % gröna):**
   - `.steg[].text` i `data/forsta-stunden.json` får **inte** ändras! Lägg endast till det nya syskonfältet `"visa_text"` på stegen.

---

## 4. Verifiering och grindkommandon (körs innan du avslutar)

1. **Snabb- och skärmprov för V1 + V2 (`375×812`):**
   ```bash
   node rundor/V1-V3-karta-meny-bok/matt/prov-v1-v3.mjs --snabb --del 2
   node rundor/V1-V3-karta-meny-bok/matt/prov-v1-v3.mjs --del 2 --ut /tmp/v2-bilder
   ```
   Granska de genererade skärmbilderna (`v2-coach-och-skriv.png`, `v2-meny-ikoner.png`, `v2-uppdragsbok-aktivt.png`, `v2-foralder-borja-om.png`) visuellt med `Read`!
2. **Produktprov, struktur- och typkontroll:**
   ```bash
   npm run test:product
   npm run typecheck
   npm run typecheck:pages
   npm run eslint
   npm run check:struktur
   npm run build:pages
   ```
3. **Skriv `RUNDA-V2.md`** i repots rot med resultat, radantal per ändrad fil och bevis från `prov-v1-v3.mjs --del 2`.
