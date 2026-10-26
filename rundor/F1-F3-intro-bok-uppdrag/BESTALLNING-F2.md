# BESTÄLLNING F2 — `Pennans bok` utan överlapp, Slime Rancher Juicy UI, Smal 1-radig uppdragsremsa & Ordkorts-byggare för `"en kanin med …"` (`375×812`)

## 1. Ett sammanhållet mål
Eliminera alla layoutkrockar i `Pennans bok` (och `Byggboken` på Gården) på `375×812` och ge hela bok-UI:t en mjuk, fjädrande **Slime Rancher Juicy UI**-känsla genom att:
1. Ersätta den oetiketterade `38×38 px` penn-cirkeln med en tydlig segmenterad lägesväxlare **`🃏 Ordkort`** / **`⌨️ Stava själv`** (`height ≥ 44 px`, `width ≥ 140 px`) där `.ord-kort` och `.tangenter` **aldrig** är synliga samtidigt (`0 px` överlapp med `.remsa.skriv-remsa`).
2. Ersätta den `149 px` höga uppdragsrutan inuti boken med en kompakt **1-radig uppdragsremsa (`≤ 40 px` hög)** med `🔊`-knapp och `flex-wrap: wrap` på idé-chips (`chip.right <= 363 px`), samt ta bort den duplicerade kompakta gåtraden ur skrivfliken.
3. Ge alla kuddknappar, kort och flikar Slime Rancher Juicy UI (`border-radius: 18–24 px` på kort/paneler, `999px` på pillerknappar, `0 4px 0` 3D-läpp, `@keyframes bok-pop-in` och `cubic-bezier(0.34, 1.56, 0.64, 1)`-fjädring) och höja alla bokflikar, kategoriflikar och `mellanslag`-tangenten till `height ≥ 44 px`.
4. Fixa `fyllExempel` och `valjKort` i `src/spel/useSkriv.ts` med en `valUrText(fras)`-hjälpare så att klick på idé-chipet `"en kanin med …"` följt av ordkortet `"halsduk"` bygger meningen **`"en kanin med halsduk"`** i stället för att radera `"en kanin"`.

---

## 2. Färdigheter & Underlag att läsa före start
- **Obligatoriska skills:** `child-literacy-design`, `3d-web-game-check`, `stylized-3d-art-direction`, `typescript-best-practices`
- **Underlag på disk:**
  - `rundor/F1-F3-intro-bok-uppdrag/GRIND.md`
  - `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 8.2 & 8.4 punkt 2: Juicy UI)
  - `/workspace/kod-inkorg/F1-F6/spaning.md` (Avsnitt 1 Fynd 1, Fynd 4B, Fynd 9C–9D samt Avsnitt 4 & 6)
  - Slime Rancher-förstudien (framtidssäkring mot Blockserie S): `/workspace/slime-rancher-studie/art-och-story.md`, `/workspace/slime-rancher-studie/teknik-och-loop.md`, `/workspace/slime-rancher-studie/modeller-och-uttryck.md`

---

## 3. Blueprint: Exakta filer att ändra (max 6 filer)

### Fil 1: `src/spel/BokSkarm.tsx`
- **Behåll alla test-attribut för `src/spel/v2.test.ts` och `src/spel/v3.test.ts`:**
  - Behåll `data-v2="aktivt-uppdrag-kort"`, `data-v2="lyssna-aktivt-uppdrag"`, `data-v3="skapar-vy-flikar"`, `data-v3="vy-flik-skriv"`, `data-v3="vy-flik-gata"`, `data-v3="vy-flik-ideer"`, `data-v3="bok-stang"`, `data-v3="ordkort"`, `data-v3="skriv-remsa"`, `data-v3="exempel-chip-"`.
- **Exklusiv segmenterad lägesväxlare (`🃏 Ordkort` vs `⌨️ Stava själv`):**
  - Ersätt den oetiketterade `38×38 px` penn-knappen (`aria-label="Tangentbord"`) med en tydlig segmenterad lägesväxlare (`data-testid="lages-vaxlare"`, `min-height: 44px`, `min-width: 140px`):
    - **`🃏 Ordkort`** (`!visaTangenter`, förvalt när boken öppnas): renderar kategoriflikarna (`Djur`/`Färg`/`Storlek`/`Gör`/`Har`) + `.ord-kort` (och på Gården `Byggkort`) ovanför `.remsa.skriv-remsa`. `.tangenter` är **inte** synligt.
    - **`⌨️ Stava själv`** (`visaTangenter`): döljer `.ord-kort` och kategoriflikar så att `.remsa.skriv-remsa` ligger direkt ovanför `.tangenter` med `0 px` överlapp.
- **Smal 1-radig uppdragsremsa högst upp i boken (`≤ 40 px`):**
  - När `aktivtUppdrag` finns i skrivfliken visas en 1-radig uppdragsremsa (`data-v2="aktivt-uppdrag-kort"`, `max-height: 42px`, `background: #FFF6E5`, `border: 2px solid #F2B632`, `border-radius: 14px`, `padding: 4px 10px`) med uppdragets korta kärnfras + `🔊`-knapp (`data-v2="lyssna-aktivt-uppdrag"`, `min-width: 44px; min-height: 44px` träffyta).
  - Om barnet expanderar/ser idé-chips (`exempel-chip-`) renderas de med `display: flex; flex-wrap: wrap; gap: 6px; max-width: 100%` så att alla chips hålls inom `x <= 363 px` (`0` horisontellt utspill).
- **Ta bort dubblett-gåtan ur skrivfliken:**
  - Ta bort `<Ledtradsyta ... kompakt />` och knappen `🧩 Visa gåtan` ur `vyFlik === "skriv"` (gåtan hör hemma i fliken `❓ Gåta`).

### Fil 2: `src/spel/ui/Ledtradsyta.tsx`
- **Behåll `kompakt`-propen i `Props`-typen och `data-p4="lyssna-gata"`** så att `src/spel/v3.test.ts` (rad 27–30) och `src/spel/p4a.test.ts` (rad 147) förblir 100 % gröna!
- Ta bort knappen `"Dölj gåtan"` inuti `❓ Gåta`-fliken (man byter flik med `✍️ Skriv` / `❓ Gåta` högst upp) och håll gåtkortets höjd kompakt (`≤ 165 px`) så att gåttext, bokstavsluckor och `💡 Ledtråd` syns i sin helhet ovanför skrivremsan.

### Fil 3: `src/spel/ui/bok-p1.css`, `src/spel/ui/bok-bas.css` & `src/spel/ui/bok-komp.css`
- **Behåll `.bok{max-height:66dvh;height:66dvh}` i `src/spel/ui/bok-p1.css`** för `src/spel/v3.test.ts` rad 31–35, och styr 55 dvh-läget via `.bok.forsta-skapelse{max-height:var(--bok-max-h, 55dvh);height:auto}` så att både `F2` och `S4`/`S5` (Väktardjur-matning med synlig 3D-scen i övre halvan `y = 0..366 px`) använder exakt samma öppna halvyta!
- **Strikt flex-kolumn utan överlapp:**
  - `.bok` har `display: flex; flex-direction: column; overflow: hidden;` där kort-/innehållsytan har `flex: 1 1 auto; min-height: 0; overflow-y: auto; margin-bottom: 8px;` och `.remsa.skriv-remsa` har `flex-shrink: 0; position: relative; z-index: 2;` (`ordkort.bottom <= skrivRemsa.top - 8 px` i `🃏 Ordkort`-läge och `skrivRemsa.bottom <= tangenter.top - 4 px` i `⌨️ Stava själv`-läge).
- **Alla tryckytor `≥ 44 px`:**
  - `.vy-flik` (`✍️ Skriv`, `❓ Gåta`, `💡 Idéer`): `min-height: 44px; padding: 8px 14px;`
  - `.ord-flik` (`Djur`, `Färg`, `Storlek`, `Gör`, `Har`): `min-height: 44px; padding: 6px 12px;`
  - `.tangent.mellanslag`: `min-height: 44px;`
- **Slime Rancher Juicy UI-stilar:**
  - Kort och knappar (`.kort`, `.ord-kort button`, `.vakna`, `.bok-knapp`): `border-radius: 18px` (eller `20px–24px` på paneler, `999px` på pillerknappar), `box-shadow: 0 4px 0 #E4CFA4, inset 0 2px 0 rgba(255, 255, 255, 0.65)` (`0 4px 0 #9B233F` på `.vakna`).
  - Fjädrande övergångar: `transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 180ms ease;`
  - Vid `:active`: `transform: translateY(3px) scale(0.96, 0.94); box-shadow: 0 1px 0 #E4CFA4;`
  - Lägg till `@keyframes bok-pop-in` (`0% { transform: scale(0.85); } 60% { transform: scale(1.06); } 100% { transform: scale(1.0); }`) på valda ordbrickor/chips.

### Fil 4: `src/spel/useSkriv.ts`
- **Ordkorts-byggare som bevarar djurordet vid `"en kanin med …"` (Fynd 4B):**
  - Idag sätter `fyllExempel(t)` (rad 188–194) bara råtexten `setText(fras)` utan att uppdatera `val: SkaparVal`, så när barnet sedan klickar på ordkortet `"halsduk"` anropas `byggFras({ ...TOM_VAL, tillbehor: "halsduk" })` som raderar `"en kanin"` och ger `"med halsduk"`.
  - Lägg till en ren hjälpfunktion `export function valUrText(fras: string): SkaparVal` i `src/spel/useSkriv.ts`:
    - Dela upp `fras.toLowerCase().replace(/[.…!?]+/g, "").trim()` i ord.
    - Matcha ord mot `ALLA_DJUR` (`djur`), `FARGER` (`farg`), `STORLEKAR` (`storlek`), `GOR` (`gor`) och `TILLBEHOR` (`tillbehor`, efter `"med"` eller direkt i `TILLBEHOR`).
  - I `fyllExempel(t)`:
    - Om `t` slutar på `"..."` eller `"…"` (t.ex. `"en kanin med …"` eller `"en katt med …"`):
      - Rensa bort `"..."` / `"…"` i visad text eller parsa med `valUrText(t)`: sätt `setVal(valUrText(t))` (`{ ...TOM_VAL, djur: "kanin" }`).
      - Om `t` innehåller `"med"` (t.ex. `"en kanin med …"`), byt automatiskt aktiv ordkortsflik till `"tillbehor"` (`setOrdkortFlik("tillbehor")`) och öppna `🃏 Ordkort`-läget (`setVisaTangenter(false)`) så att barnet direkt ser `"halsduk"`, `"mössa"`, `"krona"` m.fl.!
  - I `valjKort(ord)`:
    - Om `val` saknar `djur` men `text` redan har ett djurord (t.ex. barnet skrev eller fyllde i `"en kanin med"`), utgå från `const bas = val.djur ? val : valUrText(text)` innan det nya kortet läggs till: `const nasta = { ...bas, [ordkortFlik]: bas[ordkortFlik] === ord ? undefined : ord }`.
    - Då ger `"en kanin med …"` + klick på `"halsduk"` exakt **`"en kanin med halsduk"`**!

---

## 4. Bevistabell (Grindkriterier som verifieras av `prov-f1-f3.mjs` och enhetstester)

| Krav | Mätmetod på `375×812` | Godkänt gränsvärde |
|---|---|---|
| Exklusiv lägesväxlare | `[data-testid="lages-vaxlare"]` storlek + `!(ordkortSynliga && tangenterSynliga)` | `height >= 44 px`, `width >= 140 px`, aldrig båda synliga samtidigt |
| `0 px` överlapp i `🃏 Ordkort`-läge | `ordkort.bottom` vs `skrivRemsa.top` | `ordkort.bottom <= skrivRemsa.top - 8` (`0 px` överlapp), `>= 6` kort synliga |
| `0 px` överlapp i `⌨️ Stava själv`-läge | `skrivRemsa.bottom` vs `tangenter.top` | `skrivRemsa.bottom <= tangenter.top - 4` (`0 px` överlapp) |
| Smal 1-radig uppdragsremsa & chips | `[data-v2="aktivt-uppdrag-kort"]` höjd & `[data-v3^="exempel-chip-"]` `right` | `height <= 42 px` (ihopfälld rad), alla chips `right <= 363 px` |
| Tryckytor `≥ 44 px` & Juicy UI | `.vy-flik`, `.ord-flik`, `.tangent.mellanslag` höjd + `.kort` `borderRadius` & `transition` | Alla `height >= 44 px`, `borderRadius >= 18 px`, `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| Ordkorts-byggare (`valUrText`) | `fyllExempel("en kanin med …")` + `valjKort("halsduk")` | Skrivremsan innehåller `"en kanin med halsduk"` |
| Befintliga enhetstester | `npm test` (inkl. `v2.test.ts`, `v3.test.ts`, `p4a.test.ts`) | `100 %` gröna |
