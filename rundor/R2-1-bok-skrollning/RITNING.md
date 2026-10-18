# R2.1 – Bok-skrollning (mikro-runda, ritning)

Skriven av Arkitekten 2026-10-18. Bas: `origin/main` = `a183ea9` (src oförändrad sedan R2, `3a5e1b4`). **Mätt** = körda Playwright-skript (mobilemulering, äkta touch via CDP) mot byggd `main` (`build:pages`) i skräpkopia utanför repot.

## 1. Felet (reproducerat)
Christoffer (Android-Chrome): ordlistan i Pennans bok går inte att skrolla och de nedersta valen syns inte ovanför Vakna!.

**Orsak (mätt):** `.bok-mitt` (`src/styles.css` r.353, `overflow:auto`) är bokens skrollyta och innehåller `.flikar` + `.kort-yta`. `.kort-yta` är *också* `overflow:auto` (r.338) och `public/mobile-b03.css` r.17 ger den `overscroll-behavior: contain`. Eftersom `.bok-mitt` inte är en flex-behållare får `.kort-yta` ingen begränsad höjd: den är exakt lika hög som sitt innehåll (412×780: 364 px, medan `.bok-mitt` bara är 325 px hög) och kan alltså aldrig skrolla själv. Men ett finger som tar i listan hittar `.kort-yta` som närmaste skrollyta, och `contain` stoppar kedjan upp till `.bok-mitt`. Resultat: **inget händer när man drar i listan**; bara om fingret börjar på flikarna eller ovanför listan skrollar boken. Därför ser det ut som att Vakna! ligger över de nedersta orden: de ligger under `.bok-mitt`:s nederkant och går inte att nå.

Äkta fingerdrag (12 steg, 150 px uppåt) före: `bok-mitt.scrollTop` = 0 och `kort-yta.scrollTop` = 0 på alla tre x-lägen (kortknapp, glipan mellan kolumnerna, kanten) i **alla** sex fall (412×780, 360×640, 375×667 × Färg/Djur). Skrollning med mushjul fungerade, så felet syns inte på dator. Kontroll: en vanlig `overflow:auto`-div får scrollTop 134 med samma fingerdrag i samma webbläsare, så testmetoden fungerar.

## 2. Rättningen (tre CSS-rader i `src/styles.css`, direkt efter `.bok-mitt`)
```css
.bok .bok-mitt .kort-yta{overflow:visible;overscroll-behavior:auto;flex:none}
.bok .bok-mitt .flikar{position:sticky;top:0;z-index:1;background:var(--color-paper)}
```
`.bok-mitt` blir den enda skrollytan; `.kort-yta` inuti den är ingen skrollyta längre (specificiteten `.bok .bok-mitt .kort-yta` slår både `.kort-yta` och b03:s `.bok .kort-yta`, oberoende av stilarkens ordning). Flikarna får `position:sticky` så att man kan byta flik utan att skrolla upp. Gäller bara `.bok-mitt`; `byggbok` och `uppdrag` (`.kort-yta` som direkt flex-barn) rörs inte. `public/mobile-b03.css` rörs inte.

Patch: `ref/r2-1-bok.patch` (tre filer): `src/styles.css`, nytt `src/spel/bokSkrollning.test.mjs` (2 textkontroller av CSS-regeln), `package.json` (ny rad `test:bok` sist i `scripts`; rör **inte** `test:product`, så patchen kan läggas före eller efter R3A-patchen, båda sätten kontrollerade med `git apply --check`).

## 3. Bevis (mätt, före/efter)
`node rundor/R2-1-bok-skrollning/bok-touch.mjs --dist dist-pages --ut /tmp/bok`: fingerdrag 150 px, tre x-lägen, sedan 6 drag till botten.

| Läge | Före (main) | Efter (patch) |
|---|---|---|
| fingerdrag på kortknapp / glipa / kant, alla 6 fall | `bok-mitt` 0 px, `kort-yta` 0 px (ingen skrollning) | `bok-mitt` 135 px på alla (skrollar) |
| sista kortet synligt ovanför Vakna! efter drag till botten (`sistaSyns`) | **nej** i alla 6 (sista kortets underkant 864/829, 732/697, 738/703 px mot synligt till 658, 518, 545) | **ja** i alla 6 (650, 510, 537 ≤ 658, 518, 545) |
Bilder: `docs/skarmbilder/r2-1/fore-efter.png` (360×640 Djur och 412×780 Färg, efter fingerdrag till botten; vänster före, höger efter).

## 4. Provkörning (skräpkopia)
`git apply --check` på `main`: rent. `typecheck:pages` 0 fel. `test:product` 83 → 83 (oförändrat), `test:bok` 2/2. `build:pages` grönt. Touchskriptet före/efter enligt avsnitt 3 (kört på byggd sida utan injicerad CSS). `git apply --check` av både R3A-patchen efter R2.1 och R2.1 efter R3A: rent.

## 5. Grind-utlåtande, kostnad, risker
- **Grind: JA.** Tre CSS-rader plus en textvakt, färdig patch, Build ska bara applicera och köra `test:bok` och `test:product`.
- **Storlek: mycket liten, 6–9 turer, 0,2–0,4 USD (gissning).**
- **Risker/osäkerheter:** (1) Jag har emulerat Android-Chrome i Chromium med touch; samma motor, men inte en riktig telefon: Christoffer bör bekräfta på sin. (2) Andra lägen i boken har egna layouter och är **inte** provade: skriv-läget med tangentbord (`.bok:has(.tangenter)`, `height:auto`), önskeremsan och förslag/behöver-vyerna (inom `.bok-mitt`, påverkas inte av regeln, men fingerskrollning där är inte mätt). (3) När flikarna är sticky tar de ca 98 px av den synliga ytan (två rader flikar) även vid skrollning; på 360×640 blir listan ca 2 kortrader hög. Det är samma yta som förut, men nu skrollbar. En enradig flikrad vore en designfråga (inte en del av detta). (4) `mobile-b03.css` har kvar `overscroll-behavior: contain` på `.bok .kort-yta`; den är nu verkningslös i huvudboken och behålls.
