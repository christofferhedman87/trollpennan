# BESTALLNING-U2 — Runda U2: Kollisionsfria Bottenknappar & Flytande `Till stallet`-pillerknapp på `375×812` & `320×568` (`--max-turns 35`)

Läs dessa specialistunderlag innan du gör din första ändring:
1. `/workspace/trollpennan-nulage/kritik-u1-u2.md` (Critiquitos rotorsaksanalys och låsta bounding-box-/text-containment-mått för `.hud-bot.tva` och `.stall-chip.panel`)
2. `/workspace/kod-inkorg/u1-u2/spaning.md` (Avsnitt 2 — exakt CSS-lösning i `src/styles.css:771–772` och `src/spel/ui/hud-p2.css:2–5, 140–225` samt kompatibilitetskravet i `rundor/B6.1-kontroll/b61-prov.mjs:145`)
3. `/workspace/trollpennan-nulage/stilguide.md` (visuell stil och knapptypografi)

---

## 1. Intent (Spelarmål i spelarord)
När barnet klickar på ett djur på Ängen (så att knappen **Till stallet** dyker upp) får de två stora huvudknapparna längst ner (**Doktor Bengtsson / 📋 Uppdrag** och **🪄 Pennans bok / Trolla fram · Skriv**) aldrig tryckas ihop eller flytta sig, och ingen text i någon av knapparna får någonsin rinna utanför sin knappram eller överlappa en grannknapp — varken på vanlig mobil (`375×812`) eller på den minsta stödda skärmen (`320×568`).

---

## 2. Skills line
Use these skills: building-games, controls. Install them first if missing.

---

## 3. Blueprint (i strikt prioritetsordning)

1. **`src/styles.css` (rad 770–773):**
   - **Ta bort `.ang:has(.stall-chip.panel) .hud-bot { right: 42% }` helt!** Den regeln krympte `.hud-bot.tva` till `58 %` av skärmbredden när ett djur valdes. Utan den behåller `.hud-bot.tva` alltid `100 %` bredd (`|Δwidth| <= 1 px`, `|Δleft| <= 1 px` när `"Till stallet"` visas).
   - **Lyft upp `.stall-chip.panel` (`[data-testid="djur-till-stall"]`, `"Till stallet"`) till en flytande pillerknapp precis ovanför högra bottenkortet:**
     - Ersätt `.stall-chip.panel` i `src/styles.css` (rad 771) med:
       ```css
       .stall-chip.panel {
         left: auto;
         right: 10px;
         bottom: calc(max(10px, env(safe-area-inset-bottom)) + 68px);
         top: auto;
         transform: none;
         width: auto;
         min-width: 136px;
         max-width: calc(100vw - 20px);
         min-height: 40px;
         max-height: 42px;
         padding: 6px 16px;
         border-radius: 999px;
         z-index: 9;
         white-space: nowrap;
         line-height: 1.2;
         display: inline-flex;
         align-items: center;
         justify-content: center;
         box-sizing: border-box;
       }
       ```
     - **Varför exakt `bottom: calc(max(10px, env(safe-area-inset-bottom)) + 68px)` och `min-height: 40px; max-height: 42px`:**
       - På `375×812` ligger `.hud-bot.tva` (`height: 64px`) på `y = 738..802 px` (`bottom: 10px`).
       - Med `bottom: 78px` (`10px + 68px`) och höjd `40..42px` hamnar `.stall-chip.panel` på `y = 692..734 px`:
         - `chip.bottom = 734 <= hudBot.top - 4` (`4 px` fri luft ovanför `.hud-bot.tva`, `0 px` överlapp!).
         - `chip.top >= 692 = 812 - 120` (uppfyller `rundor/B6.1-kontroll/b61-prov.mjs:145`: `chip.y + chip.height <= 812 && chip.y >= 812 - 120`!).

2. **`src/spel/ui/hud-p2.css` (rad 2–5 och rad 140–221):**
   - **Lås `minmax(0, 1fr)`-kolumner på `.hud-bot.tva` (rad 2–5):**
     - Ändra `.hud-bot.tva` (rad 2) till:
       ```css
       .hud-bot.tva {
         display: grid;
         grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
         gap: 8px;
         padding: 0 4px;
         box-sizing: border-box;
       }
       ```
     - Ta bort `.ang:has(.stall-chip.panel) .hud-bot.tva { grid-template-columns: 1fr 1fr }` (rad 5) eller låt den också ha `minmax(0, 1fr) minmax(0, 1fr)`.
   - **Lås inre text-containment och responsiv typografi på bottenkorten (rad 140–221):**
     - På `.hud-bot.tva .npc-ikon[data-m1="hud-uppdrag"]`:
       - Sätt `min-height: 64px; min-width: 0; max-width: 100%; overflow: hidden; box-sizing: border-box; border-radius: 20px; padding: 6px 8px; gap: 6px;` (observera: `min-height: 64px` håller `h >= 60` för `prov-m1-m3.mjs:389` samtidigt som `chip.bottom = 734 <= hudBot.top = 738`!).
     - På `.hud-bot.tva .npc-ikon[data-m1="hud-uppdrag"] img`:
       - Sätt `width: 38px; height: 38px; flex-shrink: 0;` (frigör 6 px horisontellt utrymme för `"Doktor Bengtsson"`).
     - På `.hud-bot.tva .bok-knapp[data-m1="hud-skapa"]`:
       - Sätt `min-height: 64px; min-width: 0; max-width: 100%; overflow: hidden; box-sizing: border-box; border-radius: 20px; padding: 6px 8px; gap: 6px;`.
     - På `.hud-kort-ikon`:
       - Sätt `font-size: 1.3rem; line-height: 1; flex-shrink: 0;`.
     - På `.hud-kort-text`:
       - Sätt `display: flex; flex-direction: column; align-items: flex-start; justify-content: center; line-height: 1.15; text-align: left; min-width: 0; max-width: 100%; flex: 1 1 0%; overflow: hidden;`.
     - På `.hud-kort-over` och `.hud-kort-huvud`:
       ```css
       .hud-kort-over {
         font-size: clamp(0.65rem, 2.7vw, 0.72rem);
         font-weight: 800;
         opacity: 0.92;
         white-space: nowrap;
         max-width: 100%;
         overflow: hidden;
         text-overflow: ellipsis;
       }
       .hud-kort-huvud {
         font-size: clamp(0.76rem, 3.2vw, 0.9rem);
         font-weight: 900;
         white-space: nowrap;
         max-width: 100%;
         overflow: hidden;
         text-overflow: ellipsis;
       }
       .hud-bot.tva .bok-knapp[data-m1="hud-skapa"] .hud-kort-huvud {
         font-size: clamp(0.68rem, 2.8vw, 0.75rem);
         letter-spacing: -0.02em;
       }
       ```
     - Lägg till ett kompakt `@media (max-width: 359px)`-block längst ner i `src/spel/ui/hud-p2.css` för `320×568`:
       ```css
       @media (max-width: 359px) {
         .hud-bot.tva {
           gap: 6px;
           padding: 0 2px;
         }
         .hud-bot.tva .npc-ikon[data-m1="hud-uppdrag"],
         .hud-bot.tva .bok-knapp[data-m1="hud-skapa"] {
           padding: 5px 6px;
           gap: 5px;
         }
         .hud-bot.tva .npc-ikon[data-m1="hud-uppdrag"] img {
           width: 32px;
           height: 32px;
         }
         .hud-kort-ikon {
           font-size: 1.1rem;
         }
         .hud-kort-over {
           font-size: 0.61rem;
         }
         .hud-kort-huvud {
           font-size: 0.72rem;
         }
         .hud-bot.tva .bok-knapp[data-m1="hud-skapa"] .hud-kort-huvud {
           font-size: 0.62rem;
         }
       }
       ```

Change nothing else in Runda U2; behåll alla befintliga `v6.test.ts`-invarianter i `src/spel/ui/hud-p2.css` (`font-size: 1.125rem`, `color: #3B2F2F`, `background: #FFF6E5`, `data-v6="bengtsson-medaljong"`, `width: 64px`, `height: 64px`).

---

## 4. Write-first rule
Make the first change within your first 10 tool calls; no broad exploration; commit after each step; write the assessment file (`RUNDAU2.md`) before anything else if turns run low.

---

## 5. Fast probe first
Kör snabbprovet för Runda U2 efter varje CSS-ändring:
```bash
npx tsx rundor/U1-U2-rost-och-bottenknappar/prov-u1-u2.mjs --snabb --steg=u2
```
När `--snabb` är grön, kör Playwright-verifieringen på `375×812` och `320×568`:
```bash
npx tsx rundor/U1-U2-rost-och-bottenknappar/prov-u1-u2.mjs --steg=alla --ut /workspace/trollpennan-nulage/ko-27okt-u
```
Run the full suite (`npx tsc --noEmit && npm run check:struktur && npm run test:product`) only once, at the end, if the probe is green.

---

## 6. Fallback plan
Om `Range.getBoundingClientRect()` på `.bok-knapp[data-m1="hud-skapa"] .hud-kort-huvud` (`"Trolla fram · Skriv"`) eller `.npc-ikon[data-m1="hud-uppdrag"] .hud-kort-over` (`"Doktor Bengtsson"`) på `320×568` ligger närmare högerkanten än `4 px`, sänk `font-size` i `@media (max-width: 359px)` med `0.02rem` så att texten ryms med god marginal utan att klippas.

---

## 7. Technical guard rails
- **Bevara alla `v6.test.ts`- och `prov-m1-m3.mjs`-invarianter i `src/spel/ui/hud-p2.css`:** Rör inte `.bubbla, .banner`, `.npc-figur[data-v6="bengtsson-medaljong"]` (`width: 64px; height: 64px`) eller `body:has(.banner, .bubbla, .coach, .plats-intro, .onska-bubbla) .tred-hint`.
- **Bevara `b61-prov.mjs:145`-invarianten för `.stall-chip.panel` på `375×812`:** `chip.y >= 692` och `chip.y + chip.height <= 812`, samt `chip.bottom <= hudBot.top - 2`.
- **Exakt `data-testid`-baslinje (`npm run check:struktur`):** `174` unika nycklar och `179` förekomster i `src/spel/**/*.tsx`.

---

## 8. Acceptance ('Show that...')
1. **Show that** `npx tsx rundor/U1-U2-rost-och-bottenknappar/prov-u1-u2.mjs --snabb --steg=alla` passerar med `ok: true` och `antalFel: 0`.
2. **Show that** `npx tsx rundor/U1-U2-rost-och-bottenknappar/prov-u1-u2.mjs --steg=alla --ut /workspace/trollpennan-nulage/ko-27okt-u` passerar med `ok: true`, `antalFel: 0` och sparar de 3 bevisbilderna (`u2-hud-utan-djur-375x812.png`, `u2-hud-djur-valt-375x812.png`, `u2-hud-djur-valt-320x568.png`).
3. **Show that** på både `375×812` och `320×568` (med ett valt djur och synlig `[data-testid="djur-till-stall"]`) är breddförlusten på `[data-testid="bengtsson-ikon"]` och `[data-testid="pennans-bok"]` `0 px` (`|Δwidth| <= 1 px`), överlappet mellan alla bottenknappar och `"Till stallet"` är `0 px`, och varje textnods `Range.getBoundingClientRect()` och `scrollWidth` ryms helt innanför sin egen knappram.
4. **Show that** `npm run check:struktur`, `npx tsc --noEmit`, `npm run test:product` och `npx vite build` passerar med 0 fel.

---

## 9. Honest final assessment (`RUNDAU2.md`)
Skriv en kort `RUNDAU2.md` i repots rot innan du avslutar med: (1) vad som levererats och verifierats på `375×812` och `320×568`, (2) de 3 svagaste punkterna i lösningen, och (3) återstående risker.
