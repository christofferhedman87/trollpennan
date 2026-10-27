# BESTÄLLNING — Runda U3 (`U3`): Färglagda, Högkontrastrika Djur- och Ordkortsikoner i `Pennans bok`

Du är **Doodle** (spelbyggaren för *Trollpennan*).

- **Arbetskatalog:** Du kör redan i den isolerade git-worktreen för `U3`. Kör alla kommandon direkt i `pwd` (rör aldrig `/workspace/trollpennan-repo` eller `/workspace/trollpennan-build`).
- **Budget & kommandodisciplin:** `--max-turns 35`. Gör din **första källkodsändring inom de första 10 verktygsanropen**. Kör inga breda repo-sökningar — alla exakta filer, radnummer och regler finns nedan.

---

## 0. Obligatorisk Förläsning (innan första redigering)

Läs dessa filer i sin helhet (eller angivna rader) som dina första verktygsanrop:

1. `PROJECT.md` (projektkarta och invarianter)
2. `/workspace/kod-inkorg/u1-u2/spaning.md` (**Sektion 3 `U3`**, rad 147–228)
3. `/workspace/trollpennan-nulage/kritik-u1-u2.md` (**Problem 3 (`U3`)**, rad 185–279)
4. `src/spel/ui/hjalp.ts` (rad 66–192) — **OBS:** Filen är 387 rader idag och **MÅSTE** stanna `<= 400` rader (`npm run check:struktur`)!
5. `src/spel/ui/BokKort.tsx` (rad 1–59)
6. `src/spel/ui/StegKortValjare.tsx` (rad 70–85)
7. `src/spel/ui/bok-komp.css` (rad 250–266)

---

## 1. Mål (Exakt ett sammanhållet mål för Runda U3)

Eliminera alla kritvita, kontrastlösa spöksilhuetter på ordkorten i `Pennans bok` genom att:
1. Byta ut råa `/kit/kroppar/${mapp}/bas.png` (`RGB = 255,255,255`) i `kortIkon(id, "djur")` i `src/spel/ui/hjalp.ts` mot målade v0.8-illustrationer (`/ordkort/v08/illustrations/{kanin,katt,hund,drake}.webp` för `kanin`/`katt`/`hund`/`drake`) och `/kit/kroppar/${mapp}/linje.png` kombinerat med exporterad `kortDjurBas(id)` (`DJUR_BAS_FARG[mapp]`) för alla djur — så att `kortIkon` **aldrig** returnerar en rå `/bas.png`-sökväg.
2. Klä in ordkortsikonen i `src/spel/ui/BokKort.tsx` (och `.mini-preview-djur` i `src/spel/ui/StegKortValjare.tsx`) i en kategorimedveten medaljong `.kort-ikon-ram` (`kort-ikon-ram-djur`, `kort-ikon-ram-monster`, `kort-ikon-ram-formaga`) i `src/spel/ui/bok-komp.css`, där:
   - `.kort-ikon-ram-djur` målar djurets varma basfärg (`--djur-farg` via `-webkit-mask` / `mask` med `--djur-mask`) under `linje.png` (medan fullfärgs-`.webp` visas direkt i den varma medaljongen `#F7E8CC`),
   - `.kort-ikon-ram-monster` ger en mörk plommonmedaljong (`radial-gradient(circle at 30% 25%, #6E52AD 0%, #3E286E 100%)`, `border: 2px solid #292333`) så att vita mönstermasker (`prickar.png`, `rander.png`, `glitter.png`) framträder med `>= 4.5:1` kontrast,
   - `.kort-ikon-ram-formaga` ger en skifferblå medaljong (`radial-gradient(circle at 30% 25%, #4A607A 0%, #29384C 100%)`, `border: 2px solid #292333`) så att ljusa effektikoner (`aura.png`, `studs.png`, `fartlinjer.png`) syns direkt, och
   - `.kort-farg-swatch` får `border: 2.5px solid #292333` så att även färgbrickan `vit` (`#FAFAFA`) har `> 10:1` kantkontrast mot kortytan.

---

## 2. Rotorsak (varför djurkorten blev kritvita silhuetter)

- I `public/kit/kroppar/<djur>/` är `bas.png` en **100 % helvit (`RGB = 255,255,255`) alfamask** utan ögon, nos eller konturer (gjord för att multipliceras med färg i WebGL/2D-canvas). Alla mörka konturlinjer, ögon och ansiktsdrag ligger i `linje.png`, och för de 4 vanligaste djuren på Sida 1 (`kanin`, `katt`, `hund`, `drake`) finns dessutom färdigmålade v0.8-illustrationer i `public/ordkort/v08/illustrations/{kanin,katt,hund,drake}.webp`.
- När C2 lade till `filter: none` på `.kort-ikon` i `src/spel/ui/bok-komp.css:255` och `.mini-preview-djur` på rad 264, började `bas.png` ritas ut som en kritvit fläck (`#FFFFFF`) direkt mot det ljuskrämiga ordkortet (`#FFF6E7`, kontrast `1.06:1`).
- På samma sätt är `MONSTER`-ikonerna (`prickig` -> `prickar.png`, `randig` -> `rander.png`, `glittrig` -> `glitter.png`) 100 % helvita alfamasker (`RGB = 255,255,255`).

---

## 3. Exakt Ritning (Blueprint)

### 3.1 `src/spel/ui/hjalp.ts` (Håll filen `<= 400` rader!)

1. **Kompaktera och lägg till djurfärg + v0.8-illustrationer:**
   - **Viktigt:** `src/spel/ui/hjalp.ts` är 387 rader lång idag och strukturkontrollen kräver `<= 400` rader. Håll tabellerna kompakta (t.ex. flera nycklar per rad i `KORT_IKON` / `DJUR_BAS_FARG`).
   - Definiera och exportera `DJUR_BAS_FARG: Record<string, string>` med varma sagofärger för alla 14 djurmappar i `KORT_IKON`:
     - `kanin: "#F3C68F"`, `katt: "#E89A54"`, `hund: "#C8874B"`, `drake: "#5FB878"`, `hast: "#B87A4B"`, `fagel: "#5DA9E9"`, `fisk: "#4FC3F7"`, `groda: "#66BB6A"`, `gris: "#F48FB1"`, `dinosaurie: "#7CB342"`, `uggla: "#A1887F"`, `ekorre: "#D87A3E"`, `baver: "#8D6E63"`, `haj: "#6497B1"`.
   - Definiera en uppslagstabell för de 4 målade v0.8-djuren på Sida 1 (`DJUR_V08_WEBP: Record<string, string>`):
     - `kanin: "/ordkort/v08/illustrations/kanin.webp"`, `katt: "/ordkort/v08/illustrations/katt.webp"`, `hund: "/ordkort/v08/illustrations/hund.webp"`, `drake: "/ordkort/v08/illustrations/drake.webp"`.
2. **Uppdatera `kortIkon(id: string, klass?: string): string | null`:**
   - I grenen `if (!klass || klass === "djur")`:
     - Slå upp `const mapp = KORT_IKON[id];`.
     - Om `mapp` finns: returnera `DJUR_V08_WEBP[mapp] ?? "/kit/kroppar/" + mapp + "/linje.png"` (eller `/kit/kroppar/${mapp}/linje.png` om du föredrar enhetlig `linje.png` + `kortDjurBas` för samtliga 14 djur — huvudsaken är att `kortIkon` **aldrig** returnerar `/bas.png` för något ord!).
3. **Exportera `kortDjurBas(id: string): { mask: string; farg: string } | null`:**
   - Slå upp `const mapp = KORT_IKON[id];`.
   - Om `!mapp`, returnera `null`.
   - Returnera `{ mask: "/kit/kroppar/" + mapp + "/bas.png", farg: DJUR_BAS_FARG[mapp] ?? "#F3C68F" }`.

### 3.2 `src/spel/ui/BokKort.tsx` & `src/spel/ui/StegKortValjare.tsx`

1. **`src/spel/ui/BokKort.tsx`:**
   - Importera `kortDjurBas` från `./hjalp.ts`.
   - För ett kort med `ikonSrc`:
     - Beräkna `const djurBas = ord.klass === "djur" ? kortDjurBas(ord.id) : null;` och huruvida ikonen är en `linje.png`-kontur (`const arLinjeDjur = Boolean(djurBas && ikonSrc.endsWith("/linje.png"));`).
     - Omslut `<img className={"kort-ikon " + storlekKlass} alt="" src={ikonSrc} />` med en `<span className={ramKlass} style={ramStyle} aria-hidden="true">...</span>`:
       - Bas-klass på omslaget: `"kort-ikon-ram"`.
       - Lägg till `"kort-ikon-ram-djur"` när `arLinjeDjur` är sant (och sätt CSS-variablerna `--djur-mask: url("${djurBas.mask}")` samt `--djur-farg: djurBas.farg` på `style`).
       - Lägg till `"kort-ikon-ram-monster"` när `ord.klass === "monster"`.
       - Lägg till `"kort-ikon-ram-formaga"` när `ord.klass === "formaga"`.
   - **Viktigt för bakåtkompatibilitet (`prov-c1-c4.mjs`):** Behåll `<img className={`kort-ikon ${storlekKlass}`} alt="" src={ikonSrc} />` inuti `span.kort-ikon-ram` och behåll `data-testid={`kort-${ord.id}`}`, `data-c2="ord-kort"`, `data-c2="kort-lyssna"` och `data-c2="kort-vald-markering"` exakt som tidigare!
2. **`src/spel/ui/StegKortValjare.tsx`:**
   - På rad 73–75 i `.mini-preview-rad`: `kortIkon(val.djur.id, "djur")` kommer nu automatiskt att returnera `.webp` eller `/linje.png` (aldrig `/bas.png`). Om den returnerar `/linje.png`, ge `img.mini-preview-djur` en varm bakgrund eller tonad bricka så den syns skarpt även i miniförhandsvisningen.

### 3.3 `src/spel/ui/bok-komp.css`

1. **Medaljongram `.kort-ikon-ram` i `.ordkort-panel[data-m3="kort-grid"]`:**
   - Stilsätt `.bok .bok-mitt .ordkort-panel[data-m3="kort-grid"] .kort-ikon-ram` som en fast medaljong: `position: relative; width: 38px; height: 38px; min-width: 38px; min-height: 38px; border-radius: 11px; background: #F7E8CC; border: 1.5px solid #D2BA90; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; box-sizing: border-box;`.
2. **Djurmedaljong `.kort-ikon-ram-djur` (för `linje.png` + tonad `bas.png`-mask):**
   - Stilsätt `.kort-ikon-ram-djur::before` med `content: ""; position: absolute; inset: 2px; background-color: var(--djur-farg, #F3C68F); -webkit-mask: var(--djur-mask) center / contain no-repeat; mask: var(--djur-mask) center / contain no-repeat; transform: scale(1.32); pointer-events: none;`.
   - Stilsätt `.kort-ikon-ram-djur .kort-ikon` med `position: relative; z-index: 1; transform: scale(1.32);`.
3. **Mönstermedaljong `.kort-ikon-ram-monster` (för `prickar.png`, `rander.png`, `glitter.png`, `regnbage.png`):**
   - Stilsätt `.kort-ikon-ram-monster` med mörk plommonbakgrund: `background: radial-gradient(circle at 30% 25%, #6E52AD 0%, #3E286E 100%); border: 2px solid #292333; box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.22);`.
4. **Förmågemedaljong `.kort-ikon-ram-formaga` (för `vingar.png`, `fenor.png`, `aura.png`, `flammor.png`, `fartlinjer.png`, `studs.png`):**
   - Stilsätt `.kort-ikon-ram-formaga` med mörk skifferblå bakgrund: `background: radial-gradient(circle at 30% 25%, #4A607A 0%, #29384C 100%); border: 2px solid #292333;`.
5. **Färgswatch `.kort-farg-swatch`:**
   - Uppdatera `.kort-farg-swatch` till `border: 2.5px solid #292333; box-shadow: inset 0 0 0 1px rgba(41, 35, 51, 0.16), inset 7px 6px 0 rgba(255, 255, 255, 0.45);` så att `vit` (`#FAFAFA`) har tydlig mörk kontur.

---

## 4. Invarianter & Filer du INTE får röra i Runda U3

- **Inget djur eller ord i `kortIkon()` får returnera `/bas.png`.**
- **`data-testid`-baslinje (`174` unika / `179` förekomster):** Lägg inte till eller ta bort några `data-testid`-attribut.
- **Filstorlek (`<= 400` rader):** Kontrollera med `wc -l src/spel/ui/hjalp.ts src/spel/ui/BokKort.tsx src/spel/ui/StegKortValjare.tsx` att alla tre är `<= 400` rader.
- **Rör inte i `U3`:** `src/spel/rost.ts`, `src/styles.css`, `src/spel/ui/hud-p2.css`.

---

## 5. Verifiering & Bevis ("Show that...")

1. **Snabbprov (< 2 s) direkt efter redigering:**
   ```bash
   npx tsx rundor/U1-U2-rost-och-bottenknappar/prov-u1-u2.mjs --snabb --steg=u3
   ```
2. **Struktur- och typkontroll:**
   ```bash
   npx tsc --noEmit && npm run check:struktur
   ```
3. **Fullt Playwright-prov för `U3` samt regressionsprov för `C1–C4`:**
   ```bash
   npx tsx rundor/U1-U2-rost-och-bottenknappar/prov-u1-u2.mjs --steg=u3 --ut /workspace/trollpennan-nulage/ko-27okt-u
   npx tsx rundor/C1-C4-levande-ord/prov-c1-c4.mjs --snabb
   ```
4. **Produktsvit (kör en gång på slutet):**
   ```bash
   npm run test:product
   ```
5. **Commit & push på aktuell gren** när alla kontroller är 100 % gröna.
