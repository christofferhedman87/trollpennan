# Beställning V3: Luftigt skrivfönster i halvhöjd med 3 flikar, synliga ordkort direkt på `375×812` & tömd skrivruta

**Bas:** `main` efter att V2 är mergad  
**Löser:**
- **Fynd 1** i `/workspace/granskning/2026-10-25/rapport.md`: *"Skrivfönstret ('Pennans bok') är en textvägg som täcker 3D-världen och trycker bort alla ordkort utanför skärmen (y = 665 px)"*.
- **Fynd 6 (del 1)** i `/workspace/granskning/2026-10-25/rapport.md`: *"Avklippta idéknappar ('...') och gammal text ligger kvar i skrivrutan efter att man har skapat något"*.

**Turbudget:** ~48 turer (tak **65 turer**, modell `grok-4.7` high).  
**Hårda ramar:**
- **0 nya `.mp3`-filer / 0 TTS-anrop (ElevenLabs).**
- **0 ändrade befintliga testfiler** (`src/spel/bokSkrollning.test.mjs`, `src/spel/p1.test.ts`, `src/spel/p4a.test.ts`, `src/spel/p4b.test.ts`, `rundor/P4-lasning-och-karta/matt/prov-p4.mjs` m.fl. ska passera oförändrade).
- **`src/spel/Spel.tsx` (49 rader) får inte röras**, och varje ny/ändrad kodfil ska vara **≤ 400 rader**.
- **`scripts/check-spel-struktur.mjs` (174/179 `data-testid` i JSX):** Behåll exakt alla befintliga `data-testid`-attribut i JSX i `BokSkarm.tsx` och `Ledtradsyta.tsx`. Sätt alla nya V3-ankare med `data-v3="..."`.

---

## 1. Mål (ett sammanhållet mål)

Gör skrivfönstret (`BokSkarm.tsx`) på mobil (`375×812`) till ett luftigt halvhöjdsverktyg där barnet både ser sin 3D-värld och når ordkorten direkt utan att skrolla:
1. **Halvhöjds-sheet på mobil (`375×812`) så att 3D-världen syns ovanför (`top ≥ 260 px`):**
   - När `BokSkarm` är i skaparläge (`lage === "skapar"`) på mobil (`375×812`) visas `.bok` som ett botten-sheet i nedre delen av skärmen (`top ≥ 260 px`, `height ≤ 552 px`) med en lätt genomskinlig överdel i `.bok-bak` så att 3D-ängen och djuren syns ovanför boken!
2. **Tre tydliga lägesflikar i skaparvyn (`data-v3="skapar-vy-flikar"`):**
   - **`✍️ Skriv & ordkort`** (`data-v3="vy-flik-skriv"`, **förvald standardvy** när man öppnar Skriv):
     - Visar överst en kompakt 1-rads gåt-/hjälprad (`Ledtradsyta` i kompakt läge så att `[data-p4="lyssna-gata"]`, `[data-p4="lasniva-badge"]` och `[data-p4="ledtrad-knapp"]` är direkt synliga men bara tar ~44–52 px höjd!), direkt följt av kategoriflikarna (`.flikar`: `Djur`, `Färg`, `Storlek`, `Rörelse`, `Saker`) och `.kort-yta` med ordkorten (`.ord-kort`)!
     - **Hårt mätkrav på `375×812`:** Direkt när man öppnar `Skriv` (utan att skrolla) ska **minst 4 ordkort (`.ord-kort`) vara synliga ovanför skrivrutan/tangentbordet** (`kortRect.top >= bokTop` och `kortRect.bottom <= skrivRemsaTop + 4`).
   - **`🧩 Gåta`** (`data-v3="vy-flik-gata"`):
     - Visar `Ledtradsyta` i fullt expanderat läge med hela gåttexten, nivå-badge, `🔊 Lyssna` och `💡 Ledtråd`-trappan i 3 steg.
   - **`💡 Idéer`** (`data-v3="vy-flik-ideer"`):
     - Visar recepten (*"Så skriver du"*) och de klickbara exempelidéerna (`[data-testid^="exempel-chip-"]`) som fullbreddsknappar med radbrytning (`white-space: normal`, aldrig avklippta med `...` / `text-overflow: ellipsis`). När barnet trycker på ett exempelchip fylls frasen i och vyn växlar direkt till `✍️ Skriv & ordkort`!
3. **Skrivrutan töms rent efter `Väck!` och vid val av exempelchip (`useSkriv.ts`):**
   - När barnet trycker `Väck!` (`utfor`) eller stänger/öppnar boken efter skapande rensas skrivrutan (`setText("")`) så att gammal text aldrig ligger kvar i vägen för nästa ord.

---

## 2. Ritning och filbudget (4 befintliga filer + 1 ny testfil)

| Fil | Nuvarande rader | Max rader | Vad som ändras |
|---|---|---|---|
| `src/spel/ui/Ledtradsyta.tsx` | 117 | 145 | Ta emot prop `kompakt?: boolean` och `onExpander?: () => void`. I både kompakt och fullt läge renderas `[data-p4="lasniva-badge"]`, `[data-p4="lyssna-gata"]` (`≥ 44×44 px`), `[data-p4="ledtrad-knapp"]` (`≥ 44×44 px`) och `[data-testid="hemligt-ledtrad"]` (samt `ref`-satta `data-testid="bok-flik-gator"`), men i kompakt läge visas de på en tät 1–2-raders remsa utan extra rubriker/marginaler så att ordkorten direkt under får plats ovanför tangentbordet! |
| `src/spel/ui/BokSkarm.tsx` | ≤ 398 | 400 | Lägg till lokalt state `const [skaparVy, setSkaparVy] = useState<"skriv" \| "gata" \| "ideer">("skriv")` i skaparläge, rendera flikraden `data-v3="skapar-vy-flikar"` (`vy-flik-skriv`, `vy-flik-gata`, `vy-flik-ideer`), visa `<Ledtradsyta funna={funna} kompakt={skaparVy === "skriv"} />`, och sätt `hidden={skaparVy !== "ideer"}` på `hemligt-forklaring`, `recept-detalj` och `exempel-detalj` (med `open` på `<details>` när `skaparVy === "ideer"` så att idéchipsen syns direkt när man väljer `💡 Idéer`!). **VIKTIGT:** Alla befintliga `data-testid` i `BokSkarm.tsx` MÅSTE ligga kvar i JSX! För att hålla `BokSkarm.tsx` ≤ 400 rader kan stilar eller små hjälpfunktioner ligga i `bok-p1.css` / `Ledtradsyta.tsx`. |
| `src/spel/styr/useSkriv.ts` | 196 | 210 | Säkerställ i `fyllExempel` och vid öppning av boken (`oppnaSkrivMig` / efter väckning) att gammal text aldrig hänger kvar ofrivilligt, och att `fyllExempel(s)` ersätter texten rent med `s`. |
| `src/spel/ui/bok-p1.css` | 42 | 175 | Styla `.bok` i skaparläge som ett halvhöjds botten-sheet på `375×812` (`top >= 260 px`, `max-height: 540px`), kompakt `.bok-topp` och `.skapar-guide`, tydliga flikar för `[data-v3="skapar-vy-flikar"]`, kompakt 2-raders ordkortsrutnät ovanför `.skriv-remsa`, och fullbredds idéknappar utan `ellipsis` (`white-space: normal; overflow: visible; text-overflow: clip; height: auto; min-height: 44px`). **VIKTIGT:** Rör INTE `.bok .bok-mitt .kort-yta`, `.bok-mitt` eller `.bok .bok-mitt .flikar` i `src/styles.css` (de testas av `src/spel/bokSkrollning.test.mjs`!). |
| `src/spel/v3.test.ts` | ny | 120 | Enhetsprov för V3 (verifierar `data-v3="skapar-vy-flikar"`, `vy-flik-skriv`, `vy-flik-gata`, `vy-flik-ideer`, kompakt `Ledtradsyta`, att `bok-p1.css` har halvhöjds-sheet och `white-space: normal` på exempelchips, och att `bokSkrollning.test.mjs`-reglerna är intakta). |

---

## 3. Detaljerade mått- och kompatibilitetskrav på `375×812`

1. **Halvhöjds-sheet och synlig 3D-värld:**
   - På viewport `375×812` när `BokSkarm` är öppen i skaparläge (`lage === "skapar"`):
     - `.bok`: `getBoundingClientRect().top >= 250` (minst ~30 % av skärmens övre del visar 3D-världen!).
2. **Synliga ordkort direkt vid öppning (utan skrollning):**
   - Direkt efter klick på `[data-testid="pennans-bok"]` (utan att skrolla `.bok-mitt` och utan att byta flik):
     - Minst **4 stycken `.ord-kort`** har `rect.height >= 36`, `rect.top >= bokRect.top` och `rect.bottom <= skrivRemsaRect.top + 8`!
     - För att uppnå detta på `375×812` (där `.bok` har ~540 px höjd och `.skriv-remsa` med tangentbord tar ~210 px i botten, vilket ger ~330 px för `.bok-topp` + `.bok-mitt`):
       - Gör `.bok-topp` kompakt (~42 px höjd).
       - Gör `skapar-vy-flikar` kompakt (~38 px höjd).
       - Gör `Ledtradsyta` i `kompakt`-läge till en tät 1-radsremsa (~44 px höjd).
       - Gör `.flikar` (kategoriflikarna) till en kompakt horisontell rad (~38 px höjd).
       - Då börjar `.kort-yta` redan ~162 px ner i `.bok` och har ~165 px synlig höjd ovanför `.skriv-remsa` — mer än tillräckligt för **minst 4–6 ordkort** direkt i bild utan en enda pixels skrollning!
3. **Inga avklippta idéknappar i `💡 Idéer`:**
   - När man klickar på `[data-v3="vy-flik-ideer"]` visas `[data-testid^="exempel-chip-"]` med `getComputedStyle(el).textOverflow !== "ellipsis"` och `el.scrollWidth <= el.clientWidth + 2`.
4. **Full bakåtkompatibilitet med `prov-p4.mjs`:**
   - Eftersom `[data-p4="lyssna-gata"]`, `[data-p4="lasniva-badge"]`, `[data-p4="ledtrad-knapp"]` och `[data-testid="bok-flik-skriv"]` är synliga direkt i standardvyn `✍️ Skriv & ordkort`, kommer både `prov-p4.mjs --del 1`, `prov-p4.mjs --del 2` och `prov-p4.mjs --del alla` att passera grönt utan ändringar!

---

## 4. Verifiering och grindkommandon (körs innan du avslutar)

1. **Snabb- och skärmprov för hela V1–V3 samt P4 (`375×812`):**
   ```bash
   node rundor/V1-V3-karta-meny-bok/matt/prov-v1-v3.mjs --snabb --del alla
   node rundor/V1-V3-karta-meny-bok/matt/prov-v1-v3.mjs --del alla --ut /tmp/v3-bilder
   node rundor/P4-lasning-och-karta/matt/prov-p4.mjs --snabb --del alla
   node rundor/P4-lasning-och-karta/matt/prov-p4.mjs --del alla --ut /tmp/p4-kontroll
   ```
   Granska de genererade skärmbilderna (`v3-skriv-halvhojd-ordkort.png`, `v3-gata-flik.png`, `v3-ideer-flik-hela.png`) visuellt med `Read`!
2. **Produktprov, struktur- och typkontroll:**
   ```bash
   npm run test:product
   npm run typecheck
   npm run typecheck:pages
   npm run eslint
   npm run check:struktur
   npm run build:pages
   ```
3. **Skriv `RUNDA-V3.md`** i repots rot med resultat, radantal per ändrad fil och bevis från `prov-v1-v3.mjs --del alla`.
