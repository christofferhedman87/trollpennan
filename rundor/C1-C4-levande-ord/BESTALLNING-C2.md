# BESTALLNING-C2 — Runda C2: Stort `2×2`-Ordkortsrutnät (`KORT_PER_SIDA = 4`), `BokKort.tsx` (`WordCard`) med `Form + Text`-markering, Separat `🔊`-knapp, Kompletta v0.8-ikoner i `kortIkon` & Ärlig 2D-miniförhandsvisning (`--max-turns 42`)

Läs dessa specialistunderlag innan du gör din första ändring:
1. `/workspace/kod-inkorg/c1-c4/spaning.md` (Avsnitt 1.2, 2.3–2.4 och Avsnitt 3.1–3.4 — exakt mappning för `BokKort.tsx`, `StegKortValjare.tsx` och alla 6 ordkategorier i `kortIkon`)
2. `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 11.3 och 11.4 — `2×2`-ordkort, separata ljudmål, färgbrickor och ärlig 2D-förhandsvisning)
3. `/workspace/trollpennan-nulage/kritik-c1-c4.md` (Krav 3 — `AC06`, `UX-03`, `UX-07`)

---

## 1. Intent (Spelarmål i spelarord)
När barnet väljer ordkort i *Pennans bok* visas ett luftigt **`2×2`-rutnät med 4 stora illustrerade ordkort per sida** (`KORT_PER_SIDA = 4`, noll dold rullista). Varje ordkort i alla 6 kategorier (`djur`, `farg`, `storlek`, `monster`, `tillbehor`, `formaga`) har en tydlig, unik illustration eller glansig färgbricka (`halsduk` visar `/kit/tillbehor/halsduk.png`, `mössa` visar `/ordkort/v08/illustrations/mossa.webp`, och `stor`/`liten` har tydligt skild storleksskala på `/ikoner/v08/size.svg`). Varje kort har en egen **`🔊`-lyssnaknapp** (`data-c2="kort-lyssna"`, `stopPropagation()`) så att barnet kan provlyssna på ordet utan att råka välja kortet. Ett valt kort markeras med både **form och text** (`✓ Vald`, `data-c2="kort-vald-text"`). När ett djur är valt visas dessutom en ärlig 2D-miniförhandsvisning (`data-c2="mini-preview"`) med basdjurets bild och explicita etiketter för *Vald färg*, *Storlek* och *Med*.

---

## 2. Skills line
Use these skills: building-games, design-ui, controls. Install them first if missing.

---

## 3. Blueprint (i strikt prioritetsordning)

1. **`src/spel/ui/hjalp.ts` (idag 294 rader -> ~335 rader — håll `<= 400` rader):**
   - Utöka `kortIkon(id: string, klass?: string): string | null` så att alla 6 ordkategorier samt gåvo-/byggord får rätt bild:
     - **`djur`:** Behåll `KORT_IKON[id]` -> `/kit/kroppar/${mapp}/bas.png`.
     - **`farg`:**
       - `blå` -> `/ordkort/v08/bla.svg`
       - `grön` -> `/ordkort/v08/gron.svg`
       - `gul` -> `/ordkort/v08/gul.svg`
       - `röd` -> `/ordkort/v08/rod.svg`
       - För övriga färger i `data/ord.json` (`orange`, `lila`, `rosa`, `svart`, `vit`, `grå`, `brun`, `turkos`, `guld`, `silver`): exportera även en hjälpare `kortFargHex(id: string): string | null` som returnerar hex-färgkoden så att `BokKort.tsx` kan rendera en glansig SVG-cirkel (`.kort-farg-swatch`) med samma utseende som `bla.svg`.
     - **`storlek`:**
       - `stor`, `liten`, `jättestor`, `pytteliten`, `enorm`, `minimal` -> `/ikoner/v08/size.svg`. Exportera eller returnera även en CSS-klass/skalningsfaktor (`stor` / `jättestor` -> `kort-ikon-stor` med `scale(1.22)`, `liten` / `pytteliten` -> `kort-ikon-liten` med `scale(0.76)`) så att `stor` och `liten` ser tydligt olika ut (`UX-03`).
     - **`monster`:**
       - `prickig` -> `/kit/kroppar/kanin/prickar.png`
       - `randig` -> `/kit/kroppar/kanin/rander.png`
       - `glittrig` -> `/kit/kroppar/kanin/glitter.png`
       - `regnbågsfärgad` -> `/kit/kroppar/kanin/regnbage.png`
       - Fallback för övriga mönster -> `/ikoner/v08/paint.svg`.
     - **`tillbehor`:**
       - `hatt` -> `/kit/tillbehor/hatt.png`
       - `krona` -> `/kit/tillbehor/krona.png`
       - `glasögon` -> `/kit/tillbehor/glasogon.png`
       - `halsduk` -> `/kit/tillbehor/halsduk.png` (VIKTIGT: aldrig `mossa.webp`!)
       - `rosett` -> `/kit/tillbehor/rosett.png`
       - `horn` -> `/kit/tillbehor/horn.png`
       - `ryggsäck` -> `/kit/tillbehor/ryggsack.png`
       - `mantel` -> `/kit/tillbehor/mantel.png`
       - `mössa` -> `/ordkort/v08/illustrations/mossa.webp`
       - Fallback för övriga tillbehör -> `/ikoner/v08/add.svg`.
     - **`formaga`:**
       - `flyger` -> `/kit/formagor/vingar.png`
       - `simmar` -> `/kit/formagor/fenor.png`
       - `lyser` -> `/kit/formagor/aura.png`
       - `sprutar eld` -> `/kit/formagor/flammor.png`
       - `springer snabbt` -> `/kit/formagor/fartlinjer.png`
       - `hoppar` -> `/kit/formagor/studs.png`
       - Fallback för övriga förmågor -> `/ikoner/v08/magic.svg`.
     - **Gåvo- & byggord (för C2/C3):** `morot` -> `/ordkort/v08/illustrations/morot.webp`, `äpple` -> `/ordkort/v08/illustrations/apple.webp`, `hus` -> `/ordkort/v08/illustrations/hus.webp`.

2. **NY FIL `src/spel/ui/BokKort.tsx` (~85 rader — håll `<= 400` rader):**
   - Implementera `BokKort` (`WordCard`) som renderas för varje ord i `StegKortValjare.tsx`.
   - **KRITISKT för `data-testid`-baslinjen (`174` unika / `179` förekomster):**
     - Flytta `data-testid={`kort-${ord.id}`}` **1-till-1** från `StegKortValjare.tsx` till `BokKort.tsx` (ta bort det ur `StegKortValjare.tsx` så att det bara finns på exakt ett ställe!).
   - **Struktur och `Form + Text`-markering (`AC06`) samt separat `🔊`-lyssnaknapp (`UX-03`):**
     ```tsx
     <div className="kort-cell" data-c2="kort-cell">
       <button
         type="button"
         aria-pressed={vald}
         className={`${vald ? "kort vald" : markerad ? "kort markerad" : "kort"} ord-kort`}
         data-testid={`kort-${ord.id}`}
         data-c2="ord-kort"
         data-ord-id={ord.id}
         data-ord-klass={ord.klass}
         onClick={() => valjKort(ord)}
       >
         {ikonSrc ? (
           <img className={`kort-ikon ${storlekKlass}`} alt="" src={ikonSrc} />
         ) : fargHex ? (
           <span className="kort-farg-swatch" style={{ backgroundColor: fargHex }} aria-hidden="true" />
         ) : null}
         <span className="kort-etikett">{etikett}</span>
         {vald ? (
           <span className="kort-vald-badge" data-c2="kort-vald-text">✓ Vald</span>
         ) : null}
       </button>
       <button
         type="button"
         className="kort-lyssna-knapp"
         data-c2="kort-lyssna"
         aria-label={`Lyssna på ${etikett}`}
         onClick={(e) => {
           e.stopPropagation();
           rostKo.lasUpp(etikett);
         }}
       >
         🔊
       </button>
       {gang >= 3 ? (
         <button type="button" className="skriv-mig" onClick={() => oppnaSkrivMig(ord)}>
           Skriv mig! {ord.visa.slice(0, 2)}…
         </button>
       ) : null}
     </div>
     ```
   - Observera: `.kort-lyssna-knapp` ligger som ett syskon inuti `.kort-cell` (positionerat uppe i högra hörnet av `.kort-cell`) med `e.stopPropagation()` så att det är giltig HTML (ingen `<button>` inuti `<button>`) och klick på `🔊` **aldrig** väljer eller avmarkerar kortet!

3. **`src/spel/ui/StegKortValjare.tsx` (idag 96 rader -> ~135 rader — håll `<= 400` rader):**
   - Ändra `const KORT_PER_SIDA = 4;` så att ordkortsrutnätet visar exakt **4 stora kort åt gången (`2×2`)**.
   - Rendera `<BokKort ... />` inuti `<div className="kort-yta ordkort-panel" data-v3="ordkort" data-m3="kort-grid">`.
   - **v0.7 Ärlig 2D-miniförhandsvisning (`data-c2="mini-preview"`):**
     - När `val.djur` finns, rendera en kompakt, semantiskt ärlig förhandsrad (`<div className="mini-preview-rad" data-c2="mini-preview">`) med:
       - Basdjurets 2D-bild (`kortIkon(val.djur.id, "djur")`) + `val.djur.visa`
       - Explicita textetiketter för valda attribut:
         - Om `val.farg`: `<span className="mini-preview-chip" data-c2="preview-farg">Vald färg: {val.farg.visa}</span>`
         - Om `val.storlek`: `<span className="mini-preview-chip" data-c2="preview-storlek">Storlek: {val.storlek.visa}</span>`
         - Om `val.tillbehor` eller `val.monster` eller `val.formaga`: `<span className="mini-preview-chip" data-c2="preview-extra">Med: {[val.monster?.visa, val.tillbehor?.visa, val.formaga?.visa].filter(Boolean).join(", ")}</span>`
   - Behåll alla obligatoriska `data-m3`-attribut i `StegKortValjare.tsx` (`data-m3="steg-piller"`, `data-m3="kort-grid"`, `data-m3="kort-nav"`, `data-m3="sida-bak"`, `data-m3="sida-fram"`, `data-m3="steg-nasta"`) och `<p className="forslag-etikett" data-testid="forslag-etikett">{forslagEtikett}</p>`.

4. **`src/spel/ui/bok-komp.css` (håll `<= 400` rader):**
   - Uppdatera `.bok .bok-mitt .ordkort-panel[data-m3="kort-grid"]` till ett `2×2`-rutnät:
     - `grid-template-columns: repeat(2, minmax(0, 1fr)) !important;`
     - `grid-template-rows: repeat(2, 64px) !important;`
     - `gap: 8px; padding: 4px 10px !important; height: 144px !important; max-height: 144px !important; min-height: 144px !important; flex: 0 0 144px !important; overflow: hidden !important;`
   - Stilsätt `.kort-cell` (`position: relative; height: 64px; max-height: 64px;`) och `.ord-kort` (`height: 64px !important; min-height: 58px !important; max-height: 64px !important; justify-content: flex-start; padding: 6px 40px 6px 10px; gap: 8px;`).
   - Stilsätt `.kort-ikon` (`width: 36px; height: 36px;`), `.kort-ikon-stor` (`transform: scale(1.22);`), `.kort-ikon-liten` (`transform: scale(0.76);`), `.kort-farg-swatch` (`width: 32px; height: 32px; border-radius: 50%; border: 2px solid #292333; flex-shrink: 0;`), `.kort-vald-badge` (`font-size: 0.72rem; font-weight: 900; color: #1B5E20; background: #E8F5E9; border: 1.5px solid #2E7D32; border-radius: 999px; padding: 1px 6px;`) och `.kort-lyssna-knapp` (`position: absolute; top: 4px; right: 4px; min-width: 36px; min-height: 36px; border-radius: 10px;`).
   - Dölj `.mini-preview-rad` automatiskt på låga skärmar (`@media (max-height: 700px) { .mini-preview-rad { display: none !important; } }`) och i `.forsta-skapelse` om det behövs för att garantera `bokTop >= 360 px` i F1 och `ordkort.bottom <= skrivRemsa.top + 1` i M3/F2.

Change nothing else; do not add features outside Runda C2.

---

## 4. Write-first rule
Make the first change within your first 10 tool calls; no broad exploration; commit after each step; write the assessment file (`RUNDAC2.md`) before anything else if turns run low.

---

## 5. Fast probe first
Kör snabbprovet för Runda C2 efter varje delsteg:
```bash
node rundor/C1-C4-levande-ord/prov-c1-c4.mjs --steg=c2
```
Run the fast probe after each step; run the full suite (`npx tsc --noEmit && npm run check:struktur && npm run test:product && node rundor/M1-M3-npf-ux-menyer/prov-m1-m3.mjs --del m3`) only once, at the end, if the probe is green.

---

## 6. Fallback plan
Om `height: 144px` på `.ordkort-panel` i kombination med `.mini-preview-rad` gör att `forstaSkapelse`-läget (`max-height: 55dvh`) får `ordkort.bottom > skrivRemsa.top + 1`, gör `.mini-preview-rad` kompakt (`height: 26px; padding: 2px 8px;`) och dölj `.mini-preview-rad` inuti `.bok.forsta-skapelse`.

---

## 7. Technical guard rails
- **Exakt `data-testid`-baslinje (`npm run check:struktur`):** `174` unika nycklar och `179` förekomster. `data-testid={`kort-${ord.id}`}` flyttas 1-till-1 från `StegKortValjare.tsx` till `BokKort.tsx`.
- **Geometri-invarianter i `prov-f1-f3.mjs` och `prov-m1-m3.mjs`:**
  - `ordkort.bottom <= skrivRemsa.top + 1`
  - `ordkortPanel.scrollHeight - ordkortPanel.clientHeight <= 2` (`overflow: hidden`)
  - I `forstaSkapelse`: `bokTop >= 360 px` på `375×812`.
- **Filstorlek:** Alla filer i `src/spel/` ska vara `<= 400` rader.

---

## 8. Acceptance ('Show that...')
1. **Show that** `StegKortValjare.tsx` visar högst **4** `.ord-kort` per sida i ett `2×2`-rutnät med `0 px` dold scroll (`scrollHeight - clientHeight <= 2`) och kortbredd `>= 140 px`, korthöjd `>= 58 px` på `375×812`.
2. **Show that** alla 6 ordkategorier (`djur`, `farg`, `storlek`, `monster`, `tillbehor`, `formaga`) visar visuella ikoner/färgswatches, att `halsduk` visar `/kit/tillbehor/halsduk.png` (aldrig `mossa.webp`) och att `stor` och `liten` har skild visuell skala (`UX-03`).
3. **Show that** ett valt ordkort har både `.vald`-klass/ram och den synliga textindikatorn `"✓ Vald"` (`[data-c2="kort-vald-text"]`, `AC06`).
4. **Show that** klick på kortets separata `🔊`-knapp (`[data-c2="kort-lyssna"]`) läser upp ordet utan att välja kortet i meningen.
5. **Show that** den ärliga 2D-miniförhandsvisningen (`[data-c2="mini-preview"]`) visas när ett djur är valt på `375×812`.
6. **Show that** `node rundor/C1-C4-levande-ord/prov-c1-c4.mjs --steg=c2` passerar med `ok: true`.

---

## 9. Honest final assessment (`RUNDAC2.md`)
Skriv en kort `RUNDAC2.md` i repots rot innan du avslutar med: (1) vad som levererats och verifierats, (2) de 3 svagaste punkterna i lösningen, och (3) eventuella risker inför Runda C3.
