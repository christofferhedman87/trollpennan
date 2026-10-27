# BESTALLNING-C4 — Runda C4: Nordiskt Sagotema (`bok-v08.css` med `--tp-*` tokens), Bottom-Sheet-geometri (`375×812` & `320×568`), `.bok-grab`, Fokusring (`3px solid #174EA6`), `prefers-reduced-motion`, `Escape`-stängning & Full Verifiering (`AC01–AC12`, `G0–G8`) (`--max-turns 42`)

Läs dessa specialistunderlag innan du gör din första ändring:
1. `/workspace/kod-inkorg/c1-c4/spaning.md` (Avsnitt 1.2, 1.4 och Avsnitt 2 — `bok-v08.css`, Bottom-Sheet-geometri och källkodsinvarianter i `bok-p1.css` / `hud-p2.css`)
2. `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 11.1–11.6 — samtliga `--tp-*` CSS-tokens, typografi, fokusring `3px solid #174EA6` och `@media (prefers-reduced-motion: reduce)`)
3. `/workspace/trollpennan-nulage/kritik-c1-c4.md` (Sammanfattande kontrolltabell på `375×812` och `320×568` — `AC01–AC12`, `G0–G8`)

---

## 1. Intent (Spelarmål i spelarord)
När barnet spelar på mobil (`375×812` eller `320×568`) vilar *Pennans bok*, *Gåvopanelen*, *UppdragVy* och *Byggboken* i Copilots varma nordiska sagotema (`--tp-cream: #FFF6E7`, `--tp-paper: #FFFCF5`, `--tp-ink: #292333`, `--tp-plum: #653B73`, `--tp-forest: #286548`, `--tp-gold: #F3C969`, `--tp-lavender: #D9C8F0`, `--tp-blue: #174EA6`) som en inbjudande bottom-sheet med ett diskret grab-handtag (`.bok-grab`, `data-c4="sheet-grab"`) överst. Minst **`220–242 px` av den levande 3D-världen syns fritt ovanför panelen på `375×812`** (`sheet.top >= 220 px`, och `sheet.top >= 136 px` på `320×568`) med exakt 1 WebGL-Canvas och noll mörk scrim över ängen (`AC01`, `AC09`). Alla interaktiva element har tydlig fokusring (`3px solid #174EA6`), respekterar `@media (prefers-reduced-motion: reduce)`, stänger boken tryggt med `Escape` utan att radera barnets mening, och klarar både `375×812` och `320×568` utan horisontell overflow (`scrollWidth <= innerWidth`, `AC12`, `G4`).

---

## 2. Skills line
Use these skills: building-games, design-ui, controls. Install them first if missing.

---

## 3. Blueprint (i strikt prioritetsordning)

1. **NY FIL `src/spel/ui/bok-v08.css` (~185 rader — håll `<= 400` rader):**
   - Definiera samtliga `--tp-*` designtokens på `:root` enligt `/workspace/trollpennan-nulage/stilguide.md` Avsnitt 11.1:
     - `--tp-ink: #292333`, `--tp-plum: #653B73`, `--tp-forest: #286548`, `--tp-cream: #FFF6E7`, `--tp-paper: #FFFCF5`, `--tp-gold: #F3C969`, `--tp-lavender: #D9C8F0`, `--tp-blue: #174EA6`, `--tp-danger: #9C303D`, `--tp-muted: #574B50`
     - `--tp-space-1: 4px` .. `--tp-space-6: 32px`, `--tp-radius-card: 16px`, `--tp-radius-panel: 24px`, `--tp-radius-button: 16px`, `--tp-touch-min: 48px`.
   - **Bottom-Sheet-geometri & Fri 3D-sikt (`AC01`, `AC09`):**
     - `.bok-skarm`: `background: transparent; backdrop-filter: none;` så att 3D-ängen ovanför `.bok` har 0 % mörk scrim.
     - `.bok`: `background: var(--tp-cream); color: var(--tp-ink); border-radius: var(--tp-radius-panel) var(--tp-radius-panel) 0 0; border-top: 3px solid var(--tp-ink);`
     - På `375×812` (normalläge): säkerställ att `.bok` har `max-height: 64dvh` (`sheet.top >= 260 px`, alltid `>= 220 px`, och i `.forsta-skapelse` `max-height: 55dvh` så `sheet.top >= 360 px`).
     - På `320×568` (`@media (max-height: 600px)` / `@media (max-width: 340px)`): säkerställ att `.bok` har `max-height: calc(100dvh - 138px)` (`sheet.top >= 136 px`), dölj `.mini-preview-rad`, komprimera vertikala marginaler och håll alla knappar/kort och primär CTA (`[data-testid="vakna"]`) helt inom viewport (`bottom <= 568 px`) med `0 px` horisontell spill (`max-width: 100vw; overflow-x: hidden;`).
   - **Grab-handtag (`.bok-grab`):**
     - `width: 42px; height: 5px; border-radius: 999px; background: rgba(41, 35, 51, 0.28); margin: 4px auto 0; flex-shrink: 0;`
   - **Tillgänglighet (`:focus-visible` & `prefers-reduced-motion`, Avsnitt 11.6):**
     - `.bok button:focus-visible, .hud-bot button:focus-visible { outline: 3px solid var(--tp-blue, #174EA6); outline-offset: 2px; }`
     - `@media (prefers-reduced-motion: reduce) { .bok *, .bok *::before, .bok *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 120ms !important; transform: none !important; } }`

2. **`src/spel/ui/BokSkarm.tsx` (~305 rader — håll `<= 400` rader):**
   - Importera `./bok-v08.css` längst ner bland CSS-importerna i `BokSkarm.tsx`.
   - Rendera `<div className="bok-grab" data-c4="sheet-grab" aria-hidden="true" />` högst upp inuti `<section className={...} role="dialog" aria-label="Pennans bok">`.
   - Lägg till/verifiera `Escape`-stängning när `BokSkarm` är öppen: ett tryck på `Escape` anropar `stangBok()` utan att tömma `text` (så att barnets pågående mening finns kvar om boken öppnas igen).

3. **`src/spel/styr/useSkriv.ts` (~255 rader — håll `<= 400` rader):**
   - I `keydown`-lyssnaren i `useSkriv.ts`: om `e.key === "Escape"` och `!overlayRef.current` men `bokOpp` är sant (eller via window-lyssnare i `BokSkarm.tsx`), stäng boken (`setBokOpp(false)`) utan att radera `textRef.current`.

4. **Bevara samtliga CSS-invarianter i `src/spel/ui/bok-p1.css` och `src/spel/ui/hud-p2.css`:**
   - Rör **inte** de rader i `bok-p1.css` som kollas av `v3.test.ts`, `prov-v4-v6.mjs` och `prov-d1-d3.mjs` (`white-space:normal`, `.bok{`, `max-height:66dvh`, `min-width: 33px`, `pointer-events:none`, `cubic-bezier(0.34, 1.56, 0.64, 1)`). Lägg v0.8-stilarna i `src/spel/ui/bok-v08.css`!

Change nothing else; do not add features outside Runda C4.

---

## 4. Write-first rule
Make the first change within your first 10 tool calls; no broad exploration; commit after each step; write the assessment file (`RUNDAC4.md`) before anything else if turns run low.

---

## 5. Fast probe first
Kör den fullständiga C1–C4-verifieringen (inklusive de 5 bevisbilderna i `/workspace/trollpennan-nulage/ko-27okt-c/`):
```bash
node rundor/C1-C4-levande-ord/prov-c1-c4.mjs --steg=c4
```
Run the fast probe after each step; run the full regression suite (`npx tsc --noEmit && npm run check:struktur && npm run test:product && node rundor/M1-M3-npf-ux-menyer/prov-m1-m3.mjs --del alla && node rundor/F1-F3-intro-bok-uppdrag/prov-f1-f3.mjs --runda alla && node rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs --snabb --del alla`) at the end when the probe is green.

---

## 6. Fallback plan
Om någon av de äldre Playwright-proven (`prov-f1-f3.mjs` eller `prov-m1-m3.mjs`) påverkas av höjden på `.bok-grab`, sätt `height: 4px; margin: 2px auto 0;` på `.bok-grab` så att `.bok-huvud` och `[data-m3="meningsruta"]` behåller sina exakta Y-koordinater.

---

## 7. Technical guard rails
- **Exakt `data-testid`-baslinje (`npm run check:struktur`):** `174` unika nycklar och `179` förekomster.
- **Exakt 1 WebGL-Canvas (`AC09`):** `document.querySelectorAll("canvas").length === 1` i alla lägen.
- **Skärmgeometri på `375×812` och `320×568`:**
  - På `375×812`: `sheet.top >= 220 px` (`>= 260 px` i normalläge, `>= 360 px` i `forstaSkapelse`), `cta.bottom <= 812 px`.
  - På `320×568`: `sheet.top >= 136 px`, `cta.bottom <= 568 px`, `scrollWidth <= 320 px`.
- **Filstorlek:** Alla filer i `src/spel/` ska vara `<= 400` rader.

---

## 8. Acceptance ('Show that...')
1. **Show that** `src/spel/ui/bok-v08.css` definierar alla `--tp-*` tokens, `:focus-visible` (`3px solid #174EA6`) och `@media (prefers-reduced-motion: reduce)`.
2. **Show that** på `375×812` har `.bok` `sheet.top >= 220 px` (`>= 220 px` synlig 3D-värld ovanför panelen), exakt 1 `<canvas>`, `.bok-grab` (`[data-c4="sheet-grab"]`) synligt och primär CTA inom viewport (`bottom <= 812 px`, `AC01`, `AC09`).
3. **Show that** på `320×568` har `.bok` `sheet.top >= 136 px`, primär CTA `bottom <= 568 px` och `document.documentElement.scrollWidth <= 320` (`AC12`, `G4`).
4. **Show that** `Escape`-tangenten stänger `Pennans bok` utan att radera barnets inskrivna mening.
5. **Show that** `node rundor/C1-C4-levande-ord/prov-c1-c4.mjs --steg=c4` passerar med `ok: true` och sparar alla 5 bevisbilder i `/workspace/trollpennan-nulage/ko-27okt-c/`:
   - `c1-meningsbyggare-375x812.png`
   - `c2-ordkort-2x2-375x812.png`
   - `c3-gavopanel-skuttis-375x812.png`
   - `c4-lang-mening-375x812.png`
   - `c4-kompakt-320x568.png`
   Granska alla 5 skärmbilder med `Read` innan du avslutar!

---

## 9. Honest final assessment (`RUNDAC4.md`)
Skriv en kort `RUNDAC4.md` i repots rot innan du avslutar med: (1) sammanfattning av hela Blockserie C (`C1`–`C4`), (2) de 3 svagaste punkterna, och (3) rekommendationer för nästa speltest.
