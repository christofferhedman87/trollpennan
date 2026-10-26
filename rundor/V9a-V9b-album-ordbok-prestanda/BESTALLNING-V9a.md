# Beställning V9a (`--del 1`) — Visuellt Album med miniatyrer, upptäckar-Ordbok utan `???`-vägg och barnvänlig Stjärnruta med `🔊 Lyssna`

## Ett enda mål (One Goal)
Gör Albumet, Ordboken och Stjärnrutan visuella, begripliga och inbjudande för ett barn (7–12 år) på stående mobil (`375×812`):
1. **Album (`AlbumVy`):** Varje kort visar en 2D-bild / färgbricka (`data-v9a="album-bild"`), djurets/sakens namn och en platstagg (`data-v9a="album-plats"`), ett fast `×`-stängkryss (`≥ 44×44 px`, `data-v9a="album-stang"`), samt vid tomt fotoalbum en direktknapp `"📸 Ta bild på din skapelse"` (`≥ 44×44 px`, `data-v9a="album-ta-bild"`) som tar en bild av barnets skapelse direkt.
2. **Ordbok (`OrdbokDialog` / `OrdbokFlik`):** Visa sektionen **"Mina hittade ord"** (`data-v9a="mina-hittade-ord"`) överst med bild/ikon och antal hittade ord per kategori (*"Du har hittat X av Y ord!"*, `data-v9a="ordbok-kategori"`) i stället för en vägg av `389` låsta `"?"`/`"???"`-brickor (`0` `.hemlig`-brickor). Olåsta ord är klickbara (`≥ 44×44 px`, `data-v9a="ordbok-ord"`) och lägger in ordet i skrivrutan eller spelar upp befintligt ljud.
3. **Stjärnruta (`StjarnDialog` / `Hud`):** Tryck på `"⭐ X"` i topp-HUD öppnar en barnvänlig ruta (`data-v9a="stjarn-ruta"`) med stor stjärnikon (`⭐`), enkel svensk text om hur man får stjärnor, `🔊 Lyssna`-knapp (`≥ 44×44 px`, `data-v9a="stjarn-lyssna"`, med befintlig `.mp3`-röstfil — **0 nya röstfiler!**) och fast `×`-stängkryss (`≥ 44×44 px`, `data-v9a="stjarn-stang"`).

## Builder-skills att ladda och följa
- `child-literacy-design`
- `stylized-3d-art-direction`
- `3d-web-game-check`
- `typescript-best-practices`
- `principle-prove-it-works`

## Specialistkällor att läsa före ändring
- `/workspace/kod-inkorg/V4-V9/spaning.md`
- `/workspace/trollpennan-nulage/stilguide.md`
- `/workspace/modell-inkorg/_blockserie-v/manifest-utkast.tsv` + `/workspace/modell-inkorg/_blockserie-v/BLOCKSERIE-V.md`
- `/workspace/granskning/2026-10-25/rapport.md`

## Exakta filer att ändra / skapa (Blueprint)
1. **`src/spel/samling.tsx`** (och ny re-export **`src/spel/ui/AlbumVy.tsx`**):
   - Lägg till ett fast `×`-stängkryss i toppen av `.ark.sida` i `AlbumVy`:
     ```tsx
     <button
       type="button"
       className="stang-x stang"
       data-testid="album-stang"
       data-v9a="album-stang"
       aria-label="Stäng"
       onClick={stang}
     >
       ×
     </button>
     ```
     (Behåll även eller stila så att knappen alltid är minst `44×44 px`).
   - På varje kort i `AlbumVy` (`kroppar`, `vilda`, `skatter`, `byggen`, `foton`):
     - Visa en 2D-bild / färgbricka (`<span className="album-kort-bild" data-v9a="album-bild" aria-hidden>...</span>`) och en platstagg (`<span className="album-plats-tagg" data-v9a="album-plats">...</span>`, t.ex. `"🌿 Ängen"` för ängsdjur/foton, `omrNamn(v.omrade)` med ikon för vilda djur, `"🏡 Gården"` för byggen).
   - Om `foton.length === 0` (visas när fliken `"foton"` är vald, samt som en direktknapp under albumflikarna när `foton.length === 0`):
     - Rendera en tydlig knapp `"📸 Ta bild på din skapelse"` (`data-testid="album-ta-bild"`, `data-v9a="album-ta-bild"`, minst `44×44 px`):
       - När barnet trycker på `"📸 Ta bild på din skapelse"` hämtas barnets senaste skapelse från `useMinne.getState().ang` (eller `platsSkapelser` / `hemma`, och om ängen råkar vara tom används en standard-kanin ur `tolkaMedReserv("en kanin")`), `sparaFoto(djur)` anropas och fliken växlar till `"foton"` så att den nytagna bilden direkt syns med 2D-bricka, namn och platstagg!
   - Skapa `src/spel/ui/AlbumVy.tsx` som re-exporterar `{ AlbumVy, ForalderLiv } from "../samling.tsx"`.

2. **`src/spel/ui/OrdbokFlik.tsx`** och **`src/spel/ui/OrdbokDialog.tsx`** (samt koppling mot `src/spel/ui/BokSkarm.tsx`):
   - Skapa `src/spel/ui/OrdbokFlik.tsx` som exporterar komponenten `MinaHittadeOrdSektion`:
     - Visas **överst** i `OrdbokDialog` (`data-testid="mina-hittade-ord"`, `data-v9a="mina-hittade-ord"`).
     - Rubrik: `<h3>🌟 Mina hittade ord</h3>` och sammanfattningsrad: `Du har hittat {hittatAntal} av {totalOrd} ord!`.
     - Kategorikort (`data-v9a="ordbok-kategori"`) per ordkategori (t.ex. Djur 🐾, Färger & storlek 🎨, Saker & gåvor 🎁, Hemliga ord ✨) som visar kategori-ikon och *"Du har hittat X av Y ord!"*.
     - Lista med barnets olåsta/hittade ord där varje ord är en klickbar knapp (`className="ordbok-ord-knapp"`, `data-v9a="ordbok-ord"`, `min-height: 44px`, `min-width: 44px`). När barnet klickar på ett olåst ord läggs ordet in i skrivrutan (`textRef.current = o.visa; setText(o.visa); setHand(false); setLage("skriv"); setOrdbok(false);`) och befintligt ljud spelas upp (`rostKo.lasUpp(o.visa)`).
   - **Ta bort `???`/`?`-väggen i `src/spel/ui/OrdbokDialog.tsx`:**
     - Rendera **0** `<li className="hemlig">?</li>`-element! I stället för `389` låsta `"?"`-rutor visas de olåsta orden som klickbara knappar (`data-v9a="ordbok-ord"`) och en vänlig rad som berättar hur många hemliga ord som finns kvar att upptäcka via gåtorna på sidorna nedanför.
     - Lägg till ett fast `×`-stängkryss (`data-testid="ordbok-stang"`, `data-v9a="ordbok-stang"`, `≥ 44×44 px`) i toppen av `OrdbokDialog`.

3. **`src/spel/ui/Dialoger.tsx`**, **`src/spel/ui/StjarnPop.tsx`** och **`src/spel/ui/Hud.tsx`**:
   - I `src/spel/ui/Hud.tsx`: Säkerställ att `[data-testid="stjarnor"]` har `data-v9a="hud-stjarnor"`, visar `"⭐ {stjarnor}"` (och `aria-label` med stjärnor) och har minst `44×44 px` klickyta.
   - I `src/spel/ui/Dialoger.tsx` (`StjarnDialog`):
     - Sätt `data-v9a="stjarn-ruta"` på dialogen `[data-testid="stjarn-info"]`.
     - Lägg till en stor stjärnikon (`⭐`), tydlig rubrik och barnvänlig svensk text (behåll `STJ.ger` med platshållarna `{guld}`, `{hemligt}`, `{onskan}`, `{sida}`, `{uppdrag}` och `STJ.gor` med `"Ordboken"` så att `src/spel/r9.test.ts` förblir 100 % grön!).
     - Lägg till en `🔊 Lyssna`-knapp (`data-testid="stjarn-lyssna"`, `data-v9a="stjarn-lyssna"`, `≥ 44×44 px`) som anropar `rostKo.lasUpp(stjarnor < pris ? fyll(FIR.stjarnor.for_fa, { n: Math.max(1, Math.min(30, pris - stjarnor)) }) : "Nu tänds stjärnorna i boken.")` — detta använder 100 % befintliga `.mp3`-filer i `data/rost-manifest.json` (**0 nya röstfiler!**).
     - Lägg till ett fast `×`-stängkryss (`data-testid="stjarn-stang"`, `data-v9a="stjarn-stang"`, `≥ 44×44 px`, `aria-label="Stäng"`) i toppen av rutan.
   - Skapa `src/spel/ui/StjarnPop.tsx` som re-exporterar `{ StjarnDialog } from "./Dialoger.tsx"`.

## Kända testfällor att undvika (Grindpunkt 7)
- **Rör inte `data/rost.json` eller `data/rost-manifest.json`:** `src/spel/rost2.test.ts` verifierar att varje rad i `data/rost.json` har en `.mp3`-fil på disk. Använd befintlig röststräng i `rostKo.lasUpp(...)`.
- **Bevara `data/stjarnor.json`-platshållare:** `src/spel/r9.test.ts` (rad 46–51) kräver att `stj.ger` innehåller `{guld}`, `{hemligt}`, `{onskan}`, `{sida}`, `{uppdrag}` och att `stj.gor` innehåller `"Ordboken"`.
- **Alla filer `≤ 400` rader:** Håll `samling.tsx`, `OrdbokDialog.tsx`, `Dialoger.tsx` och `Hud.tsx` under 400 rader.

## Verifiering och bevis (Proof Test)
```bash
node rundor/V9a-V9b-album-ordbok-prestanda/matt/prov-v9.mjs --snabb --del 1
node rundor/V9a-V9b-album-ordbok-prestanda/matt/prov-v9.mjs --del 1
npm test
```
