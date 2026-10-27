# BESTÄLLNING — Runda U4 (`U4`): Android Chrome-Säker Höjdbudget & `visualViewport` (`--vvh`) för `Pennans bok`

Du är **Doodle** (spelbyggaren för *Trollpennan*).

- **Arbetskatalog:** Du kör redan i den isolerade git-worktreen för `U4`. Kör alla kommandon direkt i `pwd` (rör aldrig `/workspace/trollpennan-repo` eller `/workspace/trollpennan-build`).
- **Budget & kommandodisciplin:** `--max-turns 35`. Gör din **första källkodsändring inom de första 10 verktygsanropen**. Kör inga breda repo-sökningar — alla exakta filer, radnummer och regler finns nedan.

---

## 0. Obligatorisk Förläsning (innan första redigering)

Läs dessa filer i sin helhet (eller angivna rader) som dina första verktygsanrop:

1. `PROJECT.md` (projektkarta och invarianter)
2. `/workspace/kod-inkorg/u1-u2/spaning.md` (**Sektion 4 `U4`**, rad 229–349)
3. `/workspace/trollpennan-nulage/kritik-u1-u2.md` (**Problem 4 (`U4`)**, rad 280–401)
4. `src/spel/ui/BokSkarm.tsx` (rad 45–155) — **OBS:** Håll filen `<= 400` rader!
5. `src/spel/ui/bok-komp.css` (rad 1–55 samt 220–272)
6. `src/spel/ui/bok-v08.css` (rad 33–65 samt 152–218)
7. `src/spel/ui/bok-p1.css` (rad 1–65)

---

## 1. Mål (Exakt ett sammanhållet mål för Runda U4)

Säkerställ att `Pennans bok` (`.bok` och `.bok.forsta-skapelse`) har en **Android Chrome-säker höjdbudget** med `visualViewport`-synkad `--vvh` så att:
1. `[🎉 Väck till liv!]` / `[✨ Vakna!]` (`.vakna`) i `.skapelse-topp-remsa` **aldrig** bryts ner på en egen rad på `360–412 px` breda skärmar (genom att ändra `.bok .meningsruta-innehall` från `flex: 1 1 auto` till `flex: 1 1 88px; min-width: 0;`, vilket sparar `50 px` i höjd!).
2. Både rad 2 av ordkorten (`hund`, `drake`) **OCH** hela sidbläddringsraden `.steg-nav-remsa` (`◀ Fler · Sida 1/4 · Fler ▶ · Nästa steg ▶`) är **100 % synliga och klickbara** (`document.elementFromPoint` träffar knappen) med `>= 8 px` luft ner till skärmens underkant på:
   - **Android Chrome med synligt adressfält + navigationsrad (`360×620` och `375×640`)**,
   - **Standardmobil (`375×812`)** i både Första skapelse-läge (`bokTop >= 360 px`, `bokHeight <= 452 px` för `prov-f1-f3.mjs`) och vanligt läge (`sheetTop >= 260 px` för `prov-v1-v3.mjs` / `prov-c1-c4.mjs`), samt
   - **Kompakt mobil (`320×568`)** (`sheetTop >= 136 px` för `prov-c1-c4.mjs` `AC12`).

---

## 2. Rotorsaker (varför `hund`, `drake` och `◀ Sida 1/X ▶` klipptes på Android Chrome)

1. **`flex: 1 1 auto` på `.meningsruta-innehall` (`src/spel/ui/bok-komp.css:224`):**
   - Eftersom `.skapelse-topp-remsa` har `flex-wrap: wrap` och `.meningsruta-innehall` har `flex-basis: auto`, reserverar meningsrutan hela platshållartextens bredd (`~192 px`) och tvingar ner `.vakna` (`[🎉 Väck till liv!]`, `~136 px`) på rad 2 samt `.magisk-status-rad` på rad 3. Det gör `.skapelse-topp-remsa` `128 px` hög i stället för `66–68 px` (slösar `+60 px` på höjden).
2. **`max-height: 55dvh` på `.bok.forsta-skapelse` (`src/spel/ui/bok-v08.css:58–63`) på Android Chrome (`620–640 px` synlig höjd):**
   - På en Android-telefon där Chromes adressfält (`~56 px`) och Androids 3-knappars navigationsfält (`~48 px`) är synliga krymper `visualViewport.height` till `620–640 px`. `55dvh` av `640 px` är bara **`352 px`**, medan innehållet i `.bok` var `458 px` högt — så `.bok { overflow: hidden }` klippte bort de nedersta **`106 px`** (halva rad 2 `hund`/`drake` och hela `.steg-nav-remsa`).
3. **`padding-bottom: 2px` i `src/spel/ui/bok-p1.css:45–46`:**
   - Överskrev `safe-area-inset-bottom` och lämnade `0–2 px` marginal mot Androids navigationsrad.

---

## 3. Exakt Ritning (Blueprint)

### 3.1 `src/spel/ui/BokSkarm.tsx` — Synka `--vvh` från `window.visualViewport`

1. Lägg till en kompakt `useEffect` i `BokSkarm` (håll `BokSkarm.tsx <= 400` rader!) som sätter CSS-variabeln `--vvh` på `document.documentElement.style` till `${Math.round( h )}px` där `h = window.visualViewport?.height ?? window.innerHeight`:
   - Uppdatera vid mount samt på `window.addEventListener("resize", ...)` och `window.visualViewport?.addEventListener("resize", ...)`.
   - Städa upp lyssnarna vid unmount.

### 3.2 `src/spel/ui/bok-komp.css` — Enradig meningsruta & kompakt 2×2-ordkortsgrid

1. **Tvinga `.remsa-lyssna` + `.meningsruta-innehall` + `.vakna` att rymmas på rad 1 (sparar `50–60 px` i höjd):**
   - Ändra `.bok .meningsruta-innehall` (rad 224) från `flex: 1 1 auto` till `flex: 1 1 88px; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 4px;`.
   - Ge `.bok .meningsruta-tom` `font-size: 0.80rem; line-height: 1.15;` så att platshållartexten bryts mjukt inuti mittkolumnen utan att knuffa ner `.vakna`.
   - Ge `.bok .skapelse-topp-remsa .vakna` (rad 232) `min-height: 44px; height: 44px; padding: 0 9px; font-size: clamp(0.82rem, 2.5vw, 0.92rem); white-space: nowrap; flex-shrink: 0;`.
   - Ge `.bok .skapelse-topp-remsa, .bok [data-m3="meningsruta"]` (rad 221) `padding: 3px 6px; margin: 2px 8px; gap: 4px;`.
2. **Kompaktera kontroller ovanför och under ordkorten:**
   - Ge `.bok [data-m3="lages-rad"]` (rad 242–243) `padding: 1px 8px;` och `.lages-knapp` `min-height: 34px; height: 34px; font-size: 0.84rem;`.
   - Ge `.bok .steg-piller-rad` (rad 245–246) `min-height: 28px; padding: 1px 8px;` och `.steg-piller` `min-height: 28px;`.
   - Ge `.bok .steg-underflikar` (rad 248–249) `padding: 1px 8px;` och `.steg-under` `min-height: 24px;`.
   - Ge `.bok > .bok-mitt` (rad 37–44 & 220) `margin-bottom: 0;`.
   - Ge `.bok .steg-nav-remsa` (rad 267) `min-height: 34px; height: 34px; padding: 2px 8px; margin: 2px 0 0; flex-shrink: 0;`.
3. **Sätt 2×2-ordkortsgriden till `2 × 58 px = 128 px` (behåller `h >= 58 px` för `prov-c1-c4.mjs`, sparar `16 px`):**
   - Uppdatera `.bok .bok-mitt .ordkort-panel[data-m3="kort-grid"]` (rad 251) till:
     - `grid-template-rows: repeat(2, 58px) !important;`
     - `gap: 6px !important;`
     - `padding: 3px 10px !important;`
     - `height: 128px !important; max-height: 128px !important; min-height: 128px !important; flex: 0 0 128px !important;`
   - Uppdatera `.kort-cell`, `.ord-kort` och `.kort-valj` (rad 252–254) till `height: 58px !important; min-height: 58px !important; max-height: 58px !important;` (så att `Math.round(r.height) === 58`, vilket uppfyller `prov-c1-c4.mjs:447` `k.h >= 58`!).
4. **Dölj redundanta hjälprader i `forsta-skapelse` och på `max-height: 740px`:**
   - Lägg till regler som sätter `display: none !important` på `.bok.forsta-skapelse .forsta-val`, `.bok.forsta-skapelse .forslag-etikett` och `.bok.forsta-skapelse .mini-preview-rad`.
   - Ändra `@media (max-height: 700px) { .mini-preview-rad { display: none !important; } }` (rad 266) till `@media (max-height: 740px)` och dölj även `.bok .forsta-val` samt `.bok .forslag-etikett` vid `@media (max-height: 740px)` (på `375×812` är höjden `812 > 740`, så `[data-c2="mini-preview"]` förblir synlig i vanligt läge för `prov-c1-c4.mjs`!).

### 3.3 `src/spel/ui/bok-v08.css` & `src/spel/ui/bok-p1.css` — Viewport-adaptiv Sheet-höjd & Safe-Area

1. **Safe-area i nederkant på `.bok` (`src/spel/ui/bok-p1.css` & `src/spel/ui/bok-v08.css`):**
   - I `src/spel/ui/bok-p1.css` (rad 44–46, där `padding: 2px 10px 2px` sattes): ändra bottenpadding eller överskriv i `bok-v08.css` så att `.bok-skarm .bok` har `padding-bottom: max(10px, calc(env(safe-area-inset-bottom, 0px) + 8px));`.
   - Kompaktera `.bok .bok-huvud.bok-topp` till `min-height: 40px; padding: 2px 10px;` och `.bok .stang-x` till `width: 44px; height: 40px; min-width: 44px; min-height: 40px;`.
2. **Exakta höjdregler i `src/spel/ui/bok-v08.css` för alla 3 viewport-klasser:**
   - **Standardmobil (`@media (max-width: 899px)`, t.ex. `375×812`):**
     - `.bok-skarm .bok, .bok-skarm .bok:has(.tangenter)`: `height: 64dvh; max-height: min(64dvh, calc(var(--vvh, 100dvh) - 220px));` (ger `sheetTop = 292 px >= 260 px` på `375×812` för `prov-v1-v3.mjs` och `>= 220 px` för `prov-c1-c4.mjs`).
     - `.bok-skarm .bok.forsta-skapelse, .bok-skarm.forsta-vy .bok.forsta-skapelse, .bok-skarm .bok.forsta-skapelse:has(.tangenter)`: `height: auto; max-height: min(55dvh, calc(var(--vvh, 100dvh) - 360px));` (ger `bokTop >= 365 px >= 360 px` och `bokHeight <= 447 px <= 452 px` på `375×812` för `prov-f1-f3.mjs`!).
   - **Android Chrome med adressfält + navigationsrad (`@media (max-width: 899px) and (max-height: 740px) and (min-height: 601px)`, t.ex. `360×620` och `375×640`):**
     - `.bok-skarm .bok, .bok-skarm .bok:has(.tangenter), .bok-skarm .bok.forsta-skapelse, .bok-skarm.forsta-vy .bok.forsta-skapelse`: `height: auto; max-height: min(68dvh, calc(var(--vvh, 100dvh) - 180px));`
     - Detta ger `~422–435 px` i tillåten höjd på `620–640 px` skärmhöjd, medan innehållet efter kompakteringen är `~348 px` — d.v.s. **`0 px` klippning** av ordkort eller `.steg-nav-remsa` och samtidigt `> 270 px` fri 3D-äng ovanför boken!
   - **Kompakt mobil (`@media (max-height: 600px), (max-width: 340px)`, t.ex. `320×568`):**
     - Behåll `height: auto; max-height: calc(var(--vvh, 100dvh) - 138px);` (`sheetTop >= 138 px >= 136 px` för `prov-c1-c4.mjs` `AC12`).
     - På `@media (max-height: 600px)`: sätt även `.bok .skapelse-topp-remsa .vakna { padding: 0 7px; font-size: 0.80rem; }` så att alla 4 ordkort och `.steg-nav-remsa` ryms helt ovanför `y = 560 px` på `320×568`.

---

## 4. Invarianter som MÅSTE hållas 100 % gröna

- **`bok-p1.css`-stränginvarianter:** Ta inte bort kommentarerna/tokens för `66dvh`, `white-space` eller `cubic-bezier` som enhetstesterna söker efter i `src/spel/ui/bok-p1.css`.
- **`prov-f1-f3.mjs` (`375×812` Första skapelse):** `bokTop >= 360` och `bokHeight <= 452`.
- **`prov-v1-v3.mjs` & `prov-c1-c4.mjs` (`375×812` vanlig vy):** `sheetTop >= 260`, alla 4 `.ord-kort` har `w >= 135` och `h >= 58`.
- **`prov-c1-c4.mjs` (`320×568`):** `sheetTop >= 136`, `ctaBottom <= 568`, `scrollWidth <= 320`.
- **`data-testid`-baslinje (`174` unika / `179` förekomster) & filstorlek (`<= 400` rader):** `BokSkarm.tsx` måste stanna `<= 400` rader och inga `data-testid` får ändras.

---

## 5. Verifiering & Bevis ("Show that...")

1. **Snabbprov (< 2 s) direkt efter redigering:**
   ```bash
   npx tsx rundor/U1-U2-rost-och-bottenknappar/prov-u1-u2.mjs --snabb --steg=u4
   ```
2. **Struktur- och typkontroll:**
   ```bash
   npx tsc --noEmit && npm run check:struktur
   ```
3. **Fullt Playwright-prov för hela Blockserie U (`U1`–`U4`) + regressionsprov (`F1–F3`, `V1–V3`, `C1–C4`):**
   ```bash
   npx tsx rundor/U1-U2-rost-och-bottenknappar/prov-u1-u2.mjs --steg=alla --ut /workspace/trollpennan-nulage/ko-27okt-u
   npx tsx rundor/F1-F3-intro-bok-uppdrag/prov-f1-f3.mjs
   npx tsx rundor/C1-C4-levande-ord/prov-c1-c4.mjs
   ```
   Kontrollera att alla **5 bevisbilder** har skapats i `/workspace/trollpennan-nulage/ko-27okt-u/`:
   - `u2-hud-utan-djur-375x812.png`
   - `u2-hud-djur-valt-375x812.png`
   - `u2-hud-djur-valt-320x568.png`
   - `u3-u4-bok-djur-375x640-android.png`
   - `u3-u4-bok-monster-375x812.png`
4. **Produktsvit (kör en gång på slutet):**
   ```bash
   npm run test:product
   ```
5. **Commit & push på aktuell gren** när alla kontroller är 100 % gröna.
