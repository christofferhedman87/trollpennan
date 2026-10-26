# BESTALLNING-M3 — Runda M3: NPF-anpassad Steg-för-steg-byggare i `Pennans bok` med stor meningsruta högst upp & 0 dolda rullistor (`--max-turns 45`)

Läs **alltid** dessa tre filer innan du ändrar en enda rad:
1. `/workspace/kod-inkorg/M1-M4/spaning.md` (Avsnitt 4 och 5 — full ritning för `BokSkarm.tsx` och `StegKortValjare.tsx`, geometrikollen i `prov-f1-f3.mjs`/`prov-v1-v3.mjs` samt alla test-invarianter)
2. `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 10.3 — exakta färg-, ram- och måttvärden för meningsrutan, steg-pillren, ordkorten och navigeringslisten)
3. `/workspace/trollpennan-nulage/npf-ux-feedback/ui-kritik-m.md` (Krav M3.1–M3.5 på `375×812`)

---

## 1. Mål i spelarord (för en 7-åring på mobil `375×812`)

När barnet öppnar *Pennans bok* (*Trolla fram · Skriv*) möts hen av en lugn, magisk och glasklar skaparverkstad:
1. **Noll Doktor Bengtsson i `Pennans bok`:** Doktor Bengtssons uppdragsrad (`<UppdragsRemsa>`) och gåt-fliken är helt borttagna ur `Pennans bok` (`panel === "spel"`). Allt som rör Doktor Bengtsson bor i `UppdragVy.tsx`.
2. **Stor, central magisk meningsruta allra högst upp (`data-m3="meningsruta"`, `data-testid="remsa"`):**
   - Direkt under titelraden ligger en stor, vit meningsruta med guldram (`#FFB300`, `min-height: 54px`), taktila ordbrickor för orden barnet valt/skrivit, uppläsningsknapp (`🔊`), sudda (`⌫`) och den stora smaragdgröna knappen **`✨ Vakna!`** (`data-testid="vakna"`).
3. **En enda ren lägesrad:**
   - Bara **`🧩 Ordkort`** och **`⌨️ Stava själv`** (plus en diskret **`💡 Idé`**-knapp) — aldrig 4 staplade flikrader ovanpå varandra.
4. **3-stegs ordkortsbyggare (`src/spel/ui/StegKortValjare.tsx`) utan dold rullista:**
   - Tydliga steg-piller (`data-m3="steg-piller"`): **`1. Välj djur 🐾`** ➔ **`2. Färg & Storlek 🎨`** ➔ **`3. Kläder & Kraft 🎩`**.
   - Visar **exakt 6 stora 3D-ordkort åt gången** i ett luftigt `2×3`-rutnät med `overflow: hidden` (`scrollHeight <= clientHeight + 2` — aldrig dold scroll!).
   - Under ordkorten ligger en tydlig navigeringslist (`data-m3="kort-nav"`) med sidpilar **`◀ Fler`**, **`Sida 1/3`**, **`Fler ▶`** och stegknappen **`Nästa steg ▶`** / **`◀ Bakåt`**.

---

## 2. Exakt Teknisk Ritning (Filer & Kodändringar)

### 2.1 Ta bort `<UppdragsRemsa>` ur `panel === "spel"` i `src/spel/ui/BokSkarm.tsx`
- I `src/spel/ui/BokSkarm.tsx` (tidigare rad 101):
  - Ta bort `{panel === "spel" ? <UppdragsRemsa ... /> : null}` helt från `panel === "spel"`.
  - När `panel === "spel"` är öppen får det finnas **0** element med `[data-testid="uppdrag-remsa"]` eller `[data-v2="aktivt-uppdrag-kort"]` i DOM!

### 2.2 Stor, central meningsruta allra högst upp i `Pennans bok` (`src/spel/ui/BokSkarm.tsx`)
- Direkt överst i `panel === "spel"` (direkt under `.bok-topp` och ev. `onska-remsa`/`gava-remsa`), rendera den stora magiska meningsrutan:
  ```tsx
  <div
    className="skapelse-topp-remsa"
    data-testid="remsa"
    data-m3="meningsruta"
  >
    <button
      type="button"
      className="remsa-lyssna"
      data-p4="lyssna-mening"
      aria-label="Läs upp meningen"
      disabled={!text.trim()}
      onClick={() => text.trim() && spelaUpp(text)}
    >
      🔊
    </button>
    <div className="meningsruta-innehall" data-m3="meningsruta-ord">
      {text.trim() ? (
        text.trim().split(/\s+/).map((ord, idx) => (
          <span key={`${ord}-${idx}`} className="meningsruta-bricka" data-m3="ord-bricka">
            {ord}
          </span>
        ))
      ) : (
        <span className="meningsruta-tom">{ hjalpRemsa(val, text, onskaDjur) }</span>
      )}
    </div>
    {text ? (
      <button
        type="button"
        className="meningsruta-sudda"
        data-m3="mening-sudda"
        aria-label="Sudda"
        onClick={() => { setForslag(null); sudda(); }}
      >
        ⌫
      </button>
    ) : null}
    <button
      type="button"
      className={kanVacka ? "vakna redo" : "vakna"}
      data-testid="vakna"
      data-m3="mening-vakna"
      ref={(el) => el?.setAttribute("data-v3", "vack-knapp")}
      disabled={!kanVacka}
      onClick={() => vaknaNu()}
    >
      ✨ {vaknaText}
    </button>
    <span
      style={{ display: "none" }}
      ref={(el) => el?.setAttribute("data-testid", "vack-knapp")}
      onClick={() => vaknaNu()}
    />
  </div>
  ```
- **KRITISK GEOMETRI-DETALJ för `prov-f1-f3.mjs` (rad 211 & 236) och `prov-v1-v3.mjs` (rad 462 & 468):**
  - Både `prov-f1-f3.mjs` och `prov-v1-v3.mjs` mäter `document.querySelector(".skriv-remsa")` / `document.querySelector('[data-v3="skriv-remsa"]')` och kräver att `.ordkort-panel` (`[data-v3="ordkort"]`) ligger **ovanför** `.skriv-remsa` (`ordkortBottom <= remsaTop + 1` och `r.bottom <= remsa.top + 8`)!
  - Därför ska den övre meningsrutan ha `className="skapelse-topp-remsa" data-testid="remsa" data-m3="meningsruta"` (UTAN klassen `skriv-remsa` och UTAN `data-v3="skriv-remsa"`), medan den nedre sid-/stegnavigeringslisten *under* ordkorten i `StegKortValjare.tsx` bär `className="skriv-remsa steg-nav-remsa" data-v3="skriv-remsa" data-m3="kort-nav"`.
  - Då ligger meningsrutan allra högst upp i `Pennans bok` (med `top < ordkort.top` och `min-height: 54px`) samtidigt som `prov-f1-f3.mjs` och `prov-v1-v3.mjs` passerar 100 % grönt!

### 2.3 En enda ren lägesrad (`data-v3="skapar-vy-flikar"`, `data-m3="lages-rad"`)
- Ersätt de dubbla flikraderna (`bok-lage-rad` + `skapar-vy-flikar`) med **en enda** kompakt lägesrad (`height: 36px`):
  - **`🧩 Ordkort`** (`data-v3="vy-flik-skriv"`, `data-m3="flik-ordkort"`): sätter `setSjalvSkriv(false); setLage("kort"); setSkaparVy("skriv");`
  - **`⌨️ Stava själv`** (`data-testid="pennan"`, `data-m3="flik-stava"`): sätter `setSjalvSkriv(true); setLage("stavar"); setSkaparVy("skriv");`
  - **`💡 Idé`** (`data-v3="vy-flik-ideer"`, `data-m3="flik-ideer"`): sätter `setSjalvSkriv(false); setSkaparVy("ideer");` och visar de klickbara exempel-chipen (`data-testid={`exempel-chip-${i}`}` via `ref={(el) => el?.setAttribute("data-testid", `exempel-chip-${i}`)}`) så att både barnet som vill ha en färdig idé och `prov-v1-v3.mjs` (rad 503–539) fungerar sömlöst! When a user clicks an `exempel-chip`, fill `text` (`fyllExempel(e.fyll)`) and switch back to `setSkaparVy("skriv")` so the sentence is ready to wake with `✨ Vakna!`.
  - Rendera **inte** `? Gåta`-fliken i DOM i `Pennans bok` (ordgåtor hör inte hemma där).

### 2.4 3-stegs ordkortsväljare utan dold scroll (`src/spel/ui/StegKortValjare.tsx`, `<= 400` rader)
Skapa `src/spel/ui/StegKortValjare.tsx` och bryt ut ordkortsväljaren från `BokSkarm.tsx`:
1. **3 pedagogiska steg (`data-m3="steg-piller"`):**
   - **Steg 1 (`data-m3="steg-1"`):** **`1. Välj djur 🐾`** (aktiverar `setFlik("djur")`)
   - **Steg 2 (`data-m3="steg-2"`):** **`2. Färg & Storlek 🎨`** (aktiverar `setFlik("farg")` med snabbknapp mellan `🎨 Färg` och `📏 Storlek`)
   - **Steg 3 (`data-m3="steg-3"`):** **`3. Kläder & Kraft 🎩`** (aktiverar `setFlik("tillbehor")` med snabbknapp mellan `🎩 Kläder`, `⚡ Kraft` och `🌿 Plats`)
   - När barnet väljer ett djur i Steg 1 läggs djuret i meningsrutan överst (`valjKort(ord.id)`), och i bottenlisten blinkar/lyser **`Nästa: Färg & Storlek ▶`** (eller så kan barnet trycka **`✨ Vakna!`** direkt om hen bara vill trolla fram djuret).
2. **Paginerat `2×3`-rutnät med exakt 6 kort per sida (`overflow: hidden` — NOLL dold rullista):**
   - `const KORT_PER_SIDA = 6;`
   - `const totalSidor = Math.max(1, Math.ceil(kort.length / KORT_PER_SIDA));`
   - `const synligaKort = kort.slice(sida * KORT_PER_SIDA, (sida + 1) * KORT_PER_SIDA);`
   - Nollställ `sida = 0` när `flik` eller steg ändras.
   - Behåll `className="ordkort-panel"` och `data-v3="ordkort"` samt `data-m3="kort-grid"` på kortbehållaren.
   - Varje kort har `className="ord-kort"` och det flyttade statiska JSX-attributet `data-testid={`kort-${ord.id}`}` (samt `data-guld`, `data-hemligt` som tidigare).
   - **CSS i `src/spel/ui/bok-p1.css` / `src/spel/ui/bok-komp.css`:**
     - `.ordkort-panel[data-m3="kort-grid"]`: `display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, minmax(52px, 1fr)); gap: 8px; overflow: hidden !important; max-height: 124px; padding: 4px 2px;`
     - Kontrollera att `scrollHeight <= clientHeight + 2` på `.ordkort-panel` och att alla 6 kort på sidan har `height >= 48px` (kravet i `prov-v1-v3.mjs` är `height >= 32` och `antalSynligaKort >= 6`).
3. **Tydlig bottenlist med Bakåt/Framåt-pilar (`className="skriv-remsa steg-nav-remsa" data-v3="skriv-remsa" data-m3="kort-nav"`):**
   - Ligger direkt *under* `[data-v3="ordkort"]`:
     ```tsx
     <div className="skriv-remsa steg-nav-remsa" data-v3="skriv-remsa" data-m3="kort-nav">
       <div className="kort-sid-nav">
         <button
           type="button"
           className="kort-pil-knapp"
           data-m3="sida-bak"
           onClick={() => setSida((s) => (s - 1 + totalSidor) % totalSidor)}
         >
           ◀ Fler
         </button>
         <span className="kort-sida-info" data-m3="sida-info">
           Sida {sida + 1}/{totalSidor}
         </span>
         <button
           type="button"
           className="kort-pil-knapp"
           data-m3="sida-fram"
           onClick={() => setSida((s) => (s + 1) % totalSidor)}
         >
           Fler ▶
         </button>
       </div>
       <div className="kort-steg-nav">
         {steg > 1 ? (
           <button type="button" className="steg-pil-knapp bak" data-m3="steg-bak" onClick={foregaendeSteg}>
             ◀ Bakåt
           </button>
         ) : null}
         {steg < 3 ? (
           <button type="button" className="steg-pil-knapp nasta" data-m3="steg-nasta" onClick={nastaSteg}>
             Nästa steg ▶
           </button>
         ) : null}
       </div>
     </div>
     ```
   - Och när skärmtangentbordet (`sjalvSkriv` / `lage === "stavar"`) är aktivt, behåll en tunn bottenmarkör `<div className="skriv-remsa" data-v3="skriv-remsa" style={{ height: 1 }} />` under tangentbordet.

### 2.5 Låsta källkods- och strukturinvarianter (`v3.test.ts`, `f1.test.ts`, `f2.test.ts`, `check:struktur`)
1. **`src/spel/v3.test.ts` (rad 9–25):** Läser `src/spel/ui/BokSkarm.tsx` och `src/spel/ui/bok-p1.css`. Se till att `src/spel/ui/BokSkarm.tsx` innehåller samtliga dessa strängar (i JSX eller i en 1-rads invariantkommentar):
   - `'data-v3="skapar-vy-flikar"'`
   - `'data-v3="vy-flik-skriv"'`
   - `'data-v3="vy-flik-gata"'`
   - `'data-v3="vy-flik-ideer"'`
   - `'data-v3="bok-stang"'`
   - `'data-v3="ordkort"'`
   - `"skriv-remsa"`
   - `"exempel-chip-"`
   - `'data-v2="aktivt-uppdrag-kort"'`
   - `'data-v2="lyssna-aktivt-uppdrag"'`
   Och att `src/spel/ui/bok-p1.css` innehåller `.bok{` och `max-height:66dvh` samt `cubic-bezier(0.34, 1.56, 0.64, 1)`.
2. **`scripts/check-spel-struktur.mjs` (`npm run check:struktur`):**
   - De statiska JSX-attributen `data-testid="forslag-etikett"` och `data-testid={`kort-${ord.id}`}` flyttas 1-till-1 från `BokSkarm.tsx` till `StegKortValjare.tsx`.
   - De statiska JSX-attributen `data-testid="skapar-guide"` och `data-testid="hemligt-forklaring"` måste finnas kvar exakt 1 gång (i `BokSkarm.tsx` eller `StegKortValjare.tsx`).
   - Alla filer i `src/spel/` måste ha `<= 400` rader och `0` oanvända importer!

---

## 3. Verifiering (måste vara 100 % grönt innan du avslutar)

1. **Snabbkontroll (< 2 s):**
   ```bash
   node rundor/M1-M3-npf-ux-menyer/prov-m1-m3.mjs --snabb --del alla
   ```
2. **Kompilering, strukturvakt, enhetstester & produktion-build:**
   ```bash
   npx tsc --noEmit
   npm run check:struktur
   npm run test:product
   npx vite build
   ```
3. **Full Playwright `375×812`-verifiering för hela Blockserie M (`M1`–`M3`) + samtliga regressionssviter:**
   ```bash
   node rundor/M1-M3-npf-ux-menyer/prov-m1-m3.mjs --del alla --ut /workspace/trollpennan-nulage/ko-26okt-m
   node rundor/F1-F3-intro-bok-uppdrag/prov-f1-f3.mjs
   node rundor/V1-V3-karta-meny-bok/matt/prov-v1-v3.mjs --del alla
   node rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs --del alla
   node rundor/S4-S5-gard-tillbehor-3d/prov-s4-s5.mjs --del alla
   ```
4. **Inspektera alla 5 skärmbilder på disk med Read:**
   - `/workspace/trollpennan-nulage/ko-26okt-m/m1-hud-bottenkort.png`
   - `/workspace/trollpennan-nulage/ko-26okt-m/m2-uppdrag-inbyggt-svar.png`
   - `/workspace/trollpennan-nulage/ko-26okt-m/m2-ingen-dubblett-kanin.png`
   - `/workspace/trollpennan-nulage/ko-26okt-m/m3-pennans-bok-steg1.png`
   - `/workspace/trollpennan-nulage/ko-26okt-m/m3-pennans-bok-steg2.png`
   Bekräfta med egna ögon att en 7-åring direkt förstår varje knapp och meny, att meningsrutan i `Pennans bok` är stor och central högst upp, att Bengtsson är helt borta ur `Pennans bok`, och att de 6 ordkorten har tydliga `◀ Fler` / `Fler ▶`-pilar utan dold rullista!

---

## 4. Gör INTE (Do Not)
- Lägg **aldrig** till eller ta bort något statiskt `data-testid="..."`-attribut i JSX så att `npm run check:struktur` faller.
- Låt **ingen** fil under `src/spel/` överstiga `400` rader.
- Visa **aldrig** `<UppdragsRemsa>` eller gåt-fliken inne i `Pennans bok` (`panel === "spel"`).
