# BESTALLNING-C1 — Runda C1: Klickbar Meningsbyggare (`SkapelseBar.tsx` / `SentenceBar`), Ångra-historik, v0.7 Långmenings-växlare (`>= 7` ord) & v0.6 Magisk statusrad med `casting`-spärr (`--max-turns 42`)

Läs dessa specialistunderlag innan du gör din första ändring:
1. `/workspace/kod-inkorg/c1-c4/spaning.md` (Avsnitt 1.1–1.4 & Avsnitt 2 — exakt adapter-mappning för `SentenceBar` -> `src/spel/ui/SkapelseBar.tsx`, källkodsinvarianter och `data-testid`-regler)
2. `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 11.1, 11.2 och 11.5 — ordbrickor `>= 48 px`, långa meningar `< 7` vs `>= 7` ord och fokusring `3px solid #174EA6`)
3. `/workspace/trollpennan-nulage/kritik-c1-c4.md` (Krav 2 och 4 — `AC02`–`AC05`, `UX-02`, `UX-05`, `UX-06`)

---

## 1. Intent (Spelarmål i spelarord)
När barnet bygger en mening i *Pennans bok* är varje ord i meningsraden överst en stor, taktil, klickbar ordbricka (`<button>`, `min-height: 48px`, `aria-label="Ändra <ord>"`). Om barnet har byggt `"en blå kanin"` och trycker på `"blå"` hoppar boken direkt till färgvalet så att barnet med ett enda tryck på `"röd"` byter meningen till `"en röd kanin"` utan att börja om (`AC03`). En ångra-knapp (`↶`, `data-c1="mening-angra"`) låter barnet backa sitt senaste ordval före `Vakna!`. När meningen blir lång (`>= 7` ord, t.ex. `"en stor blå kanin med röd mössa"`) visas en kompakt 2-radig sammanfattning + knappen **`✏️ Ändra orden` / `🃏 Visa kort`** (`data-c1="mening-expander"`, `>= 48 px`) så att ordkorten och `✨ Vakna!` aldrig trycks ut ur bild (`UX-06`). När barnet trycker på `✨ Vakna!` visas en magisk statusrad (`data-c1="magisk-status"`) och knappen låses (`casting`-spärr) tills 3D-skapelsen är klar så att dubbelklick aldrig skapar dubbla djur (`UX-05`).

---

## 2. Skills line
Use these skills: building-games, design-ui, controls. Install them first if missing.

---

## 3. Blueprint (i strikt prioritetsordning)

1. **`src/spel/styr/useSkriv.ts` (idag 212 rader — håll `<= 400` rader):**
   - Lägg till en lättviktig ångra-historik (`angraStackRef = useRef<string[]>([])`, max 24 steg) som sparar föregående `textRef.current` (om den skiljer sig från ny text) innan `valjKort`, `skrivTecken`, `sudda`, `fyllExempel`, `valjForslag` eller `nejForslag` ändrar `text`, och som töms när `vaknaNu()` / `utfor()` körs.
   - Exportera funktionen `angraMening()` och `kanAngra: boolean` (eller hantera ångra-stacken i `useSkriv.ts` + `SkapelseBar.tsx` via `fyllExempel(foregaendeText)`): vid anrop poppas senaste strängen ur stacken, sätter `textRef.current = foregaende`, `setText(foregaende)`, `setVal(valUrText(foregaende))`.
   - **Grammatik- och slot-bevarande vid klick på ordkort (`valjKort`):**
     - Säkerställ att byte av t.ex. `farg` (`blå` -> `röd`) i `valjKort(ord)` uppdaterar slotet `val[slot] = ord` och behåller övriga slots (`djur`, `storlek`, `monster`, `tillbehor`, `formaga`) samt eventuell inledande artikel (`en` / `ett`).
     - Om `textRef.current` innehåller en fritext-/flerordsmening med sekundärt attribut (t.ex. `"en stor blå kanin med röd mössa"`) och användaren byter ett ord via aktivt slot eller ordbricka, använd `bytOrd` / `meningAv` så att `djur` aldrig nollställs (`AC03`).
   - Behåll `import { valUrText } from "../useSkriv.ts";` i `src/spel/styr/useSkriv.ts` och rör inte `src/spel/useSkriv.ts` (`prov-f1-f3.mjs`-invariant).

2. **NY FIL `src/spel/ui/SkapelseBar.tsx` (~135 rader — håll `<= 400` rader):**
   - Bryt ut `.skapelse-topp-remsa` ur `src/spel/ui/BokSkarm.tsx` till `src/spel/ui/SkapelseBar.tsx`.
   - **KRITISKT för `data-testid`-baslinjen (`174` unika / `179` förekomster):**
     - Flytta `data-testid="remsa"` och `data-testid="vakna"` **1-till-1** från `BokSkarm.tsx` till `SkapelseBar.tsx` (och ta bort de två JSX-attributen ur `BokSkarm.tsx` så att totalantalet i `src/spel/**/*.tsx` förblir exakt 174 unika / 179 förekomster!).
     - Behåll `id="troll-ord"`, `data-m3="meningsruta"`, `role="textbox"`, `aria-label="Skrivrutan"` på ytter-diven `.skapelse-topp-remsa`, samt `ref={(el) => el?.setAttribute("data-v3", "vack-knapp")}` på `Vakna!`-knappen och `<span ref={(el) => el?.setAttribute("data-testid", "vack-knapp")}>✨ {vaknaText}</span>` inuti den.
   - **Klickbara `<button>`-ordbrickor (`data-c1="ord-bricka" data-m3="ord-bricka"`):**
     - Dela upp `text.trim().split(/\s+/)` i ord. För varje ord i meningen:
     - Slå upp om ordet matchar ett `Ord` i `ordLista()` (jämför `id`, `visa` och `former` i gemener). Härled ordets `slot: Slot | "artikel" | "bindeord"` (`en`/`ett` -> `"djur"`, `med` -> `"tillbehor"`, `som` -> `"formaga"`, annars `ord.klass as Slot`).
     - Rendera varje ord som:
       ```tsx
       <button
         key={`${ord}-${idx}`}
         type="button"
         className={aktivtOrdIdx === idx ? "meningsruta-bricka aktiv" : "meningsruta-bricka"}
         data-m3="ord-bricka"
         data-c1="ord-bricka"
         data-slot={slot}
         aria-label={`Ändra ${ord}`}
         onClick={(e) => {
           e.stopPropagation();
           onOrdKlick(ord, slot, idx);
         }}
       >
         {ord}
       </button>
       ```
     - När barnet klickar på en ordbricka (`onOrdKlick`): växla till ordkortsläge (`setSkaparVy("skriv"); setSjalvSkriv(false); setLage("kort");`) och sätt `setFlik(slot)` så att rätt ordkortskategori (`djur`, `farg`, `storlek`, `monster`, `tillbehor`, `formaga`) öppnas direkt!
   - **Ångra-knapp (`data-c1="mening-angra"`):**
     - Visa en tydlig knapp `<button type="button" className="meningsruta-angra" data-c1="mening-angra" aria-label="Ångra senaste ordval" disabled={!kanAngra} onClick={(e) => { e.stopPropagation(); onAngra(); }}>↶</button>` (med `/ikoner/v08/undo.svg` eller `↶`, `min-width: 44px; min-height: 44px`) bredvid `🔊` (`.remsa-lyssna`) och `⌫` (`.meningsruta-sudda`, `data-m3="mening-sudda"`).
   - **v0.7 Långmenings-växlare (`>= 7` ord, `data-c1="mening-expander"`):**
     - Räkna `antalOrd = text.trim() ? text.trim().split(/\s+/).length : 0`.
     - När `antalOrd >= 7` och `!expanderadMening`: visa en tydlig 2-radig sammanfattning (`<span className="meningsruta-kortfattad" data-c1="mening-sammanfattning">{text.trim()}</span>`) + knappen `<button type="button" className="meningsruta-expander" data-c1="mening-expander" onClick={(e) => { e.stopPropagation(); setExpanderadMening(true); }}>✏️ Ändra orden</button>`.
     - När `antalOrd >= 7` och `expanderadMening === true`: visa alla klickbara `<button data-c1="ord-bricka">`-ordbrickor i flex-wrap + knappen `<button type="button" className="meningsruta-expander" data-c1="mening-expander" onClick={(e) => { e.stopPropagation(); setExpanderadMening(false); }}>🃏 Visa kort</button>`. (Återställ `expanderadMening` till `false` när `antalOrd < 7`).
   - **v0.6 Magisk statusrad (`data-c1="magisk-status"`) & `casting`-spärr mot dubbelklick (`UX-05`):**
     - Ha ett lokalt state `casting` (`useState(false)`) och `magiskFas`: `"idle"` (när `!text.trim()`), `"word-selected"` (250 ms efter att `text` ändrats), `"ready"` (när `text.trim()` finns), `"casting"` (när barnet klickat på `Vakna!`).
     - Vid klick på `Vakna!` (`[data-testid="vakna"]`): om `casting` är `true` eller `!text.trim()` returnera direkt! Sätt annars `setCasting(true)`, anropa `vaknaNu()`, och släpp `setCasting(false)` i en `setTimeout(..., 450)` eller när `text` töms efter skapelsen. Sätt `disabled={casting}` och `aria-busy={casting}` på `Vakna!`-knappen.
     - Rendera `<div className="magisk-status-rad" role="status" aria-live="polite" data-c1="magisk-status" data-fas={casting ? "casting" : text.trim() ? "ready" : "idle"}>...</div>` med lugn, kort svensk återkoppling (t.ex. `"✨ Redo att väcka liv!"` / `"🪄 Trollpennan skapar…"`).

3. **`src/spel/ui/BokSkarm.tsx` (idag 350 rader -> ~315 rader — håll `<= 400` rader):**
   - Importera och rendera `<SkapelseBar ... />` på exakt samma plats där `.skapelse-topp-remsa` låg (ovanför `.bok-mitt`).
   - **VIKTIGT för `prov-m1-m3.mjs` (rad 243):** `prov-m1-m3.mjs` läser `src/spel/ui/BokSkarm.tsx` med `fs.readFileSync` och kollar `bokSkarm.includes('data-m3="meningsruta"')`. Behåll därför strängen `data-m3="meningsruta"` i invariants-kommentaren på rad 46 i `src/spel/ui/BokSkarm.tsx`!
   - Behåll alla övriga invarianter i `BokSkarm.tsx` (rad 46).

4. **`src/spel/ui/bok-komp.css` (idag 248 rader -> ~310 rader — håll `<= 400` rader):**
   - Stilsätt `.meningsruta-bricka` som en taktil `<button>` (`min-height: 44px` på `320×568`, `min-height: 48px` när meningsraden expanderas, `padding: 4px 10px`, `border-radius: 12px`, `border: 2px solid #F2B632`, `background: #FFF6E7`, `color: #292333`, `font-weight: 800`, `cursor: pointer`), `.meningsruta-bricka:focus-visible { outline: 3px solid #174EA6; outline-offset: 2px; }`, `.meningsruta-angra`, `.meningsruta-expander` (`min-height: 44px`) och `.magisk-status-rad`.
   - Säkerställ att `[data-m3="meningsruta"]` behåller `min-height: 50px` och ligger ovanför `[data-v3="ordkort"]` utan att spräcka höjden i `StegKortValjare`.

Change nothing else; do not add features outside Runda C1.

---

## 4. Write-first rule
Make the first change within your first 10 tool calls; no broad exploration; commit after each step; write the assessment file (`RUNDAC1.md`) before anything else if turns run low.

---

## 5. Fast probe first
Kör snabbprovet för Runda C1 efter varje delsteg:
```bash
node rundor/C1-C4-levande-ord/prov-c1-c4.mjs --steg=c1
```
Run the fast probe after each step; run the full suite (`npx tsc --noEmit && npm run check:struktur && npm run test:product && node rundor/M1-M3-npf-ux-menyer/prov-m1-m3.mjs --snabb --del alla`) only once, at the end, if the probe is green.

---

## 6. Fallback plan
Om separata ångra-props genom `SpelKarna` tar för många redigeringar, håll ångra-historiken (`useRef<string[]>([])`) direkt i `SkapelseBar.tsx` genom att övervaka `text`-propens förändringar i en `useEffect` och återställa föregående fras via `fyllExempel(foregaendeText)`. Då behövs noll ändringar i `SpelKarna`-typerna.

---

## 7. Technical guard rails
- **Exakt `data-testid`-baslinje (`npm run check:struktur`):** `174` unika nycklar och `179` förekomster i `src/spel/**/*.tsx`. Flytta `data-testid="remsa"` och `data-testid="vakna"` 1-till-1 till `SkapelseBar.tsx` — lägg aldrig till nya `data-testid`-attribut (använd `data-c1="..."`).
- **0 oanvända importer:** `npm run check:struktur` kontrollerar alla filer i `src/spel/ui/`. Lämna inga oanvända importer i `BokSkarm.tsx` eller `SkapelseBar.tsx`.
- **Alla källkodsinvarianter i Tabell 2.2 (`/workspace/kod-inkorg/c1-c4/spaning.md`):** Behåll kommentaren på rad 46 i `BokSkarm.tsx` och lägg till `data-m3="meningsruta"` i den kommentaren så att `prov-m1-m3.mjs --snabb` förblir 100 % grön.
- **Filstorlek:** Alla filer under `src/spel/` ska vara `<= 400` rader.

---

## 8. Acceptance ('Show that...')
1. **Show that** `npm run check:struktur`, `npx tsc --noEmit` och `npm run test:product` passerar med 0 fel (exakt 174 unika `data-testid` / 179 förekomster).
2. **Show that** varje ord i meningsraden (`[data-c1="ord-bricka"]`) renderas som en klickbar `<button>` och att klick på `"blå"` i `"blå kanin"` / `"en blå kanin"` aktiverar färg-steget och låter spelaren byta till `"röd"` på 1 tryck utan att `"kanin"` försvinner (`AC03`).
3. **Show that** Ångra-knappen (`[data-c1="mening-angra"]`) återställer föregående mening före `Vakna!`.
4. **Show that** en lång mening (`>= 7` ord, t.ex. `"en stor blå kanin med röd mössa"`) visar knappen `[data-c1="mening-expander"]` (*Ändra orden* / *Visa kort*) och växlar mellan kompakt 2-radig vy och expanderade ordbrickor utan horisontell scroll (`UX-06`).
5. **Show that** `[data-c1="magisk-status"]` visas och att dubbelklick på `Vakna!` (`[data-testid="vakna"]`) under `casting` skapar exakt **1** djur på ängen (`UX-05`).
6. **Show that** `node rundor/C1-C4-levande-ord/prov-c1-c4.mjs --steg=c1` och `node rundor/M1-M3-npf-ux-menyer/prov-m1-m3.mjs --snabb --del alla` passerar med `ok: true`.

---

## 9. Honest final assessment (`RUNDAC1.md`)
Skriv en kort `RUNDAC1.md` i repots rot innan du avslutar med: (1) vad som levererats och verifierats, (2) de 3 svagaste punkterna i lösningen, och (3) eventuella risker inför Runda C2.
