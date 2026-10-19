<!-- Doodle: gren runda-r9g EFTER B1 (B1.1–B1.4) mergad, FÖRE R8-2. grok build --prompt-file rundor/R9G-ux-stall/PROMPT.md -m grok-4.7-build-fast --reasoning-effort low --max-turns 22, timeout 25 min, logg /tmp/r9g.log. Varför: Christoffer – uppdrag och gåta samtidigt är opedagogiskt; saknas sätt att dölja djur utan omstart. -->
# R9G – Gåta under uppdrag + stall i menyn

**Avsikt:** Under ett Bengtsson-uppdrag syns bara uppdraget i Pennans bok. Gåtan kommer när uppdraget är klart eller när barnet öppnar ledtråden. Gåtan byts inte av sig själv. Barnet flyttar djur till stallet (meny-lista) och hämtar dem igen – utan synlig stallbyggnad.
**Skills:** building-games, design-ui, controls.
**Se också:** `rundor/R9G-ux-stall/R9G.md`.

**Ritning (gör i ordning, commit efter varje steg):**

1. **Data.** I `data/hemligt.json` lägg `"skriv_hint": "Skriv i Pennans bok"`. I `data/texter-gard.json` lägg:
   ```json
   "stall": {
     "meny": "Stallet",
     "chip": "Till stallet",
     "flytta": "Flytta djuret till stallet. Du kan hämta ut ditt djur igen när du vill.",
     "tom": "Stallet är tomt.",
     "hamta": "Hämta ut"
   }
   ```
   Exportera stall-texterna via `src/spel/ui/spelData.ts` om `TEXTER` byggs där.

2. **Låst gåta + dölj under uppdrag.** `src/spel/ui/Ledtradsyta.tsx`: ta bort `Math.random` vid mount. Ta emot `gataId: string | null` och `setGataId`. Välj djur = `gataId` om det finns bland `kvar`, annars första kvar. Knappen `ledtrad-ny` sätter nästa i `kvar` via `setGataId`. Visa `hemligt.skriv_hint` under `ledtrad-streck`. Strecken förblir `<span>` (aldrig `<button>`). `kompakt`: bara stängd `<details>` med rubrik, ingen gåttext i summary.
   `src/spel/minne.ts`: fält `gataId: string | null` (default null), `sattGataId(id)`, sparas i localStorage (ignorera ogiltigt vid läsning).
   `src/spel/ui/BokSkarm.tsx`: när `aktivtSkrivUppdrag(uppdragSpar)` – rendera **inte** gåtan öppet (ingen `ledtrad-gata` i DOM förrän details öppnas). Skicka `gataId`/`sattGataId`. När uppdrag saknas: full yta som idag + skriv_hint.

3. **Stall i minne.** `minne.ts` / `lagring.ts`: `stall: Sparad[]` (max 40). `tillStall(uid)`: flytta från `ang` (eller `hemma`) till `stall`, anropa `brygga.taBort(uid)`. `franStall(uid)`: tillbaka till `ang` om plats finns (samma tak som `laggPaAng`), annars false. Bakåtkompatibel: saknad nyckel → `[]`. Rör inte `lada`/`sovande`/`hemma` semantik.

4. **Chip efter tryck + meny-lista.** `Spel.tsx` `paHandelse` vid `tryck` på djur: behåll bubbla/klapp; sätt `stallChip: {uid,x,y}` i state (~6 s eller tills tillStall). `AngLager.tsx`: om `stallChip`, visa knapp `data-testid="djur-till-stall"` vid duk-läget med `TEXTER.stall.chip`; onClick → `tillStall` + banner `TEXTER.stall.flytta` + nollställ chip. `Hud.tsx` `MenyPanel`: ny knapp `data-testid="meny-stall"` (`TEXTER.stall.meny`). Öppnar lista `data-testid="stall-lista"`: tom → `TEXTER.stall.tom`; annars en rad per djur (`data-testid="stall-hamta-<uid>"`, etikett formel) med `TEXTER.stall.hamta` → `franStall` + `brygga.skapa`. Ingen 3D-byggnad.

5. **Tester.** `src/spel/r9g.test.ts` i `test:product`: (a) `tillStall`/`franStall` rundresa; (b) `gataId` byts inte utan `sattGataId`; (c) hemligt.skriv_hint finns. Lägg filen i package.json test:product-listan om den är explicit.

**Spel.tsx-tak:** högst +40 rader net (efter B1 ≤1850). Ny UI i `ui/`, inte nya godtyckliga helpers i Spel.

**Skrivregel:** första ändring inom 10 anrop; commit per steg 1–5.

**Visa att (375×812, bilder i `rundor/R9G-ux-stall/`):**
1. `r9g-01-uppdrag.png`: aktivt uppdrag → `ledtrad-gata` saknas (eller bara inne i stängd details); `uppdrag-remsa` syns.
2. `r9g-02-gata.png`: inget uppdrag → gåta + `skriv_hint` + streck; klick på streck gör inget (ingen fokus/fokus).
3. `r9g-03-stall.png`: efter chip→tillStall → djuret borta; meny Stallet visar det; hämta → djuret på ängen igen.
4. `test:product`, `typecheck:pages`, `build:pages`, `check:struktur` gröna.

**Om tiden inte räcker:** steg 1–2 + 5 (gåta-UX) först; stall (3–4) i följd-commit samma gren om turer finns, annars rapportera och lämna stall ogjord.

**Slutbedömning:** skriv `rundor/R9G-ux-stall/RUNDA-R9G.md` + commit + rapport senast tur 16.
