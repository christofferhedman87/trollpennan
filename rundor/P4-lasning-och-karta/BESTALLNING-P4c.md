# Runda P4c: Olåst karta och meny – alla platser och verktyg öppna direkt

Use these skills: typescript-best-practices, principle-prove-it-works, principle-test-behavior-not-implementation, principle-minimal-diffs, child-literacy-design, 3d-web-game-check

---

## 1. Målet i spelarord

Barnet och Christoffer kan utforska hela spelet fritt direkt från start utan låsta dörrar eller `"Kommer senare"`-meddelanden:

1. **Olåst karta (`KartaLager.tsx`, `usePlats.ts`, `platser.ts`, `minne.ts`, `data/platser.json`):**
   - Alla platser på kartan (**Gården**, **Skogen**, **Sjön**, **Grottan** samt återresa till **Ängen**) är öppna direkt från start (`"olast_karta": true` i `data/platser.json`).
   - Ingen platsknapp på kartan har klassen `.last` eller `aria-disabled="true"`. Trycker barnet på **Skogen**, **Sjön**, **Grottan** eller **Gården** reser spelet direkt dit, även med 0 skapade djur på Ängen.
   - Trycker barnet på **grinden** på Ängen (`tryckGrind`) reser spelet direkt till **Skogen** i stället för att säga `"Inte riktigt än"`.
   - Skriver barnet ett platsnamn i boken (`"skogen"`, `"till sjön"`, `"gå till grottan"`, `"ängen"`, `"gården"` eller `"till gården"`) reser spelet direkt till den platsen.
2. **Olåst meny (`MenyPanel` i `src/spel/ui/Hud.tsx` + `data/meny.json`):**
   - I hamburgermenyn är **Ängen** (`flik-ang`), **Gården** (`flik-gard`), **Byggboken** (`flik-byggbok`), **Djuralbum** (`album-knapp`), **Ut på äventyr** (`ut-pa-aventyr`), **Uppdrag** (`uppdrag-knapp`) och **Bok / Ordbok** (`ordbok`) alla upplåsta via `data/meny.json` (ingen `data-last="ja"`, inget hänglås) och öppnar sina respektive vyer direkt.

---

## 2. Körinställning och arbetsordning

- **Modell och budget:** `grok-4.7` (`--reasoning-effort high`), **60 turer** (tak **75**).
- **Planera kort först (högst 6 modellanrop):** Läs `src/spel/platser.ts`, `src/spel/resa.ts`, `src/spel/minne.ts`, `src/spel/ui/usePlats.ts`, `src/spel/ui/KartaLager.tsx`, `src/spel/ui/Hud.tsx` samt `src/spel/platser.test.ts`, `src/spel/resa.test.ts` och `src/spel/b6-2.test.ts`. Skriv `PLAN-P4c.md` (max 25 rader) och gör första kodändringen inom **10 modellanrop**. Ta bort `PLAN-P4c.md` före sista commiten.
- **Skriv `RUNDA-P4c.md` före tur 48.**

---

## 3. Prov- och strukturfällor som du MÅSTE undvika

1. **Rör ALDRIG `upplast()`, `forstaUpplasta()`, `nyPlatsVantar()`, `tom()` eller `bytPlats()` på ett sätt som ändrar deras returvärden på en tom sparning!**
   - `src/spel/platser.test.ts` (rad 25, 80), `src/spel/resa.test.ts` (rad 19, 31) och `src/spel/b6-2.test.ts` (rad 72) anropar:
     - `upplast("skogen", m(2), LISTA)` → måste ge `false`!
     - `forstaUpplasta(mattUr(useMinne.getState()))` efter `aterstall()` → måste ge `null`!
     - `useMinne.getState().bytPlats("skogen")` direkt efter `aterstall()` → måste ge `false`!
   - **Lösning i ritningen:**
     - Behåll `upplast(id, m, platser)` och `bytPlats(id)` exakt som de är!
     - Lägg till `"olast_karta": true` i `data/platser.json` och exportera `OLAST_KARTA: boolean` samt `kanResaTill(id: string, m: Matt, platser: Plats[] = PLATSER): boolean` i `src/spel/platser.ts`.
     - Lägg till `oppnaPlats: (id: string) => boolean` på `useMinne` i `src/spel/minne.ts`. Den kontrollerar att `platsMed(id)` finns, lägger till `id` i `oppnadePlatser` (om `id !== START_PLATS`) och sätter `plats: id` (returnerar `true`). Eftersom `upplast()` redan har regeln `if (m.oppnade?.includes(id)) return true;` (rad 67 i `platser.ts`), blir platsen då även formellt upplåst i `upplast()` och `bytPlats()`!
2. **Behåll ALLA `data-testid` i `src/spel/ui/Hud.tsx` och `src/spel/ui/KartaLager.tsx` exakt enligt `rundor/R1-dela-spel/testid-baslinje.json`!**
   - I `src/spel/ui/Hud.tsx` MÅSTE `{senare ? <p className="meny-fraga" data-testid="demo-senare">{TEXTER.demo.senare}</p> : null}` ligga kvar i JSX:en så att `scripts/check-spel-struktur.mjs` hittar `"\"demo-senare\"": 1`!
   - I `src/spel/ui/Hud.tsx` MÅSTE knapparna `data-testid="flik-ang"`, `data-testid="flik-gard"`, `data-testid="flik-byggbok"`, `data-testid="album-knapp"`, `data-testid="ut-pa-aventyr"`, `data-testid="uppdrag-knapp"`, `data-testid="ordbok"`, `data-testid="intro-meny"`, `data-testid="meny-borja"` behålla exakt sina `data-testid`!
   - I `src/spel/ui/KartaLager.tsx` MÅSTE `data-testid="karta"`, `data-testid="karta-stang"`, `data-testid="plats-garden"`, `data-testid={`plats-${o.id}`}` och `data-testid="plats-kvar"` behållas exakt!
3. **Noll ElevenLabs-anrop.**

---

## 4. Ritning: filer, data och funktioner

### Steg 1: `"olast_karta": true` i `data/platser.json`, `kanResaTill` i `src/spel/platser.ts` och `oppnaPlats` i `src/spel/minne.ts`

1. **`data/platser.json`:**
   - Lägg till `"olast_karta": true` överst i JSON-objektet (efter `"version": 2`).
   - Rör **inte** `upplasning` eller `milstolpe` på platserna i `data/platser.json`!
2. **`src/spel/platser.ts`:**
   - Utöka `PlatsData` med `olast_karta?: boolean`.
   - Exportera:
     ```ts
     export const OLAST_KARTA = PLATSDATA.olast_karta === true;

     /** P4c: är platsen öppen att resa till på kartan och i spelet? */
     export function kanResaTill(id: string, m: Matt, platser: Plats[] = PLATSER): boolean {
       if (id === START_PLATS) return true;
       const p = platsMed(id, platser);
       if (!p) return false;
       if (OLAST_KARTA) return true;
       return upplast(id, m, platser);
     }
     ```
3. **`src/spel/minne.ts`:**
   - Utöka `Minne` med `oppnaPlats: (id: string) => boolean;`.
   - Implementera `oppnaPlats`:
     ```ts
     oppnaPlats: (id) => {
       const d = get();
       if (!platsMed(id)) return false;
       const oppnadePlatser =
         id === START_PLATS || d.oppnadePlatser.includes(id)
           ? d.oppnadePlatser
           : [...d.oppnadePlatser, id];
       set(spara({ ...d, oppnadePlatser, plats: id }));
       return true;
     },
     ```
   - Behåll `bytPlats` exakt som förut!

### Steg 2: Koppla fri resa i `src/spel/ui/usePlats.ts`, `src/spel/ui/KartaLager.tsx` och `trollApi.ts`

1. **`src/spel/ui/KartaLager.tsx`:**
   - Importera `kanResaTill` från `../platser.ts`.
   - Byt `const oppen = upplast(o.id, m);` mot `const oppen = kanResaTill(o.id, m);`.
   - När `oppen` är `true` har ingen platsknapp klassen `.last` eller `aria-disabled`, och klick på knappen anropar `tryckPlats(o.id)`!
   - Behåll `<span className="plats-kvar" data-testid="plats-kvar">` i JSX-trädet för eventuell låst plats (när `oppen` är `true` för alla platser renderas `plats-kvar` bara om en plats är låst; `check-spel-struktur.mjs` läser AST i `.tsx`-filen, så låt `? ... : <span className="plats-kvar" data-testid="plats-kvar">...</span>` stå kvar i ternären!).
2. **`src/spel/ui/usePlats.ts`:**
   - Importera `kanResaTill` och `OLAST_KARTA` från `../platser.ts`.
   - I `upplasta`: byt `upplast(p.id, matt())` mot `kanResaTill(p.id, matt())`.
   - I `resTill(id)`:
     - Byt `if (!upplast(id, matt()))` mot `if (!kanResaTill(id, matt()))`.
     - Inuti `setTimeout` vid platsbyte: anropa `useMinne.getState().oppnaPlats(id)` (så att platsen både läggs i `oppnadePlatser` och blir aktiv `plats`).
   - I `tryckGrind()`:
     - `const nasta = forstaUpplasta(matt()) ?? (OLAST_KARTA ? "skogen" : null);`
     - Om `nasta` finns, anropa `resTill(nasta)`.
   - I `forsokSkriv(raw)`:
     - Om barnet skriver `"gården"`, `"till gården"` eller `"gå till gården"` (normaliserat): anropa `tillGard()` och returnera `true`!
     - För platser ur `platsFranText(raw)`: byt `if (!upplast(id, matt()))` mot `if (!kanResaTill(id, matt()))` så att `"skogen"`, `"till sjön"`, `"gå till grottan"` och `"ängen"` reser direkt dit!
3. **`src/spel/styr/trollApi.ts` (eller `window.__troll.plats` i `Spel.tsx` om S1 inte ligger före i testklonen):**
   - I `plats: (id: string)`: om `platsMed(id)` finns, anropa `useMinne.getState().oppnaPlats(id)` så att `window.__troll.plats("skogen" | "sjon" | "grottan" | "ang")` alltid kan byta plats direkt även på en helt ny sparning!

### Steg 3: Lås upp menyns knappar via `data/meny.json` och `src/spel/ui/Hud.tsx` (`MenyPanel`)

1. Skapa `data/meny.json`:
   ```json
   {
     "version": 1,
     "oppen": {
       "gard": true,
       "byggbok": true,
       "album": true,
       "ordbok": true
     }
   }
   ```
2. I `src/spel/ui/Hud.tsx` (`MenyPanel`):
   - Importera `menyJson` från `"../../../data/meny.json" with { type: "json" }`.
   - Ta emot valfria callbacks `oppnaAlbum?: () => void` och `oppnaOrdbok?: () => void` i `MenyPanelProps` (och skicka in dem från `SpelVy.tsx` / `Spel.tsx`, eller läs `setAlbumOpp` och `setOrdbok` via `useSpel()` om props inte skickats):
     - När `menyJson.oppen.gard` är `true`:
       - Knappen `data-testid="flik-gard"` har `className={panel === "spel" && varld === "gard" ? "pa" : ""}`, **ingen** `data-last="ja"` och `onClick={() => valjVarld("gard")}`.
     - När `menyJson.oppen.byggbok` är `true`:
       - Knappen `data-testid="flik-byggbok"` har `className={panel === "byggbok" ? "pa" : ""}`, **ingen** `data-last="ja"` och `onClick={() => valjVarld("byggbok")}`.
     - När `menyJson.oppen.album` är `true`:
       - Knappen `data-testid="album-knapp"` har `className=""`, **ingen** `data-last="ja"` och öppnar Djuralbum (`setMenyOpp(false); setMenySaker(false); setSenare(false); setBokOpp(false); oppnaAlbum();`).
     - När `menyJson.oppen.ordbok` är `true`:
       - Knappen `data-testid="ordbok"` har `className=""`, **ingen** `data-last="ja"` och öppnar Ordboken (`setMenyOpp(false); setMenySaker(false); setSenare(false); setBokOpp(false); oppnaOrdbok();`).
   - **Viktigt:** Behåll `{senare ? <p className="meny-fraga" data-testid="demo-senare">{TEXTER.demo.senare}</p> : null}` och alla `data-testid` i `Hud.tsx` så att `npm run check:struktur` är 100 % grön!

---

## 5. Prov och verifiering (Steg 4)

1. Skapa `src/spel/p4c.test.ts` och lägg till den i `test:product` i `package.json`:
   - Testa att `OLAST_KARTA === true` och att `kanResaTill(id, tomMatt)` är `true` för `"ang"`, `"skogen"`, `"sjon"` och `"grottan"`.
   - Testa att `upplast("skogen", tomMatt)` och `useMinne.getState().bytPlats("skogen")` på tom sparning fortfarande ger `false` (bakåtkompatibilitet med `platser.test.ts` och `resa.test.ts`), medan `useMinne.getState().oppnaPlats("skogen")` öppnar och byter till `"skogen"`, och likadant för `"sjon"` och `"grottan"`.
   - Testa att `data/meny.json` har `oppen.{gard, byggbok, album, ordbok} === true`.
2. Kör alla kontroller:
   ```bash
   PATH="/home/box/.local/node22/bin:$PATH" node --experimental-strip-types rundor/P4-lasning-och-karta/matt/prov-p4.mjs --snabb --del 3
   PATH="/home/box/.local/node22/bin:$PATH" node --experimental-strip-types rundor/P4-lasning-och-karta/matt/prov-p4.mjs --snabb --del alla
   PATH="/home/box/.local/node22/bin:$PATH" npm run test:product
   PATH="/home/box/.local/node22/bin:$PATH" npm run check:struktur
   PATH="/home/box/.local/node22/bin:$PATH" npm run typecheck:pages
   PATH="/home/box/.local/node22/bin:$PATH" npm run lint
   ```
3. Bygg och kör skärmprovet på `375×812` för del 3 och hela P4:
   ```bash
   PATH="/home/box/.local/node22/bin:$PATH" npm run build:pages
   PATH="/home/box/.local/node22/bin:$PATH" npm run preview:pages -- --port 4173 &
   PATH="/home/box/.local/node22/bin:$PATH" node --experimental-strip-types rundor/P4-lasning-och-karta/matt/prov-p4.mjs --del 3
   PATH="/home/box/.local/node22/bin:$PATH" node --experimental-strip-types rundor/P4-lasning-och-karta/matt/prov-p4.mjs --del alla
   ```
4. Skriv `RUNDA-P4c.md` före **tur 48**.
