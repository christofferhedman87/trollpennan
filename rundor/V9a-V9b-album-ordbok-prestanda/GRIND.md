# Grindchecklista V9a–V9b — `build-round-gate` (13 punkter)

Grindkontroll utförd mot `origin/main` (`d9068f2`, PR #206 mergad, 425/425 prov gröna) innan rundorna V9a och V9b i Blockserie V får startas.

## Specialistkällor på disk (verifierade)
1. **Kodspaning (Tracey):** `/workspace/kod-inkorg/V4-V9/spaning.md`
   - **Särskilt punkt 4 (`56` synkrona `useGLTF.preload`-anrop vid start):**
     - `src/spel/gard/ByggModell.tsx` (rad 28): `for (const fil of FILER) useGLTF.preload(fil)` — **29 st** byggnads- och dekor-GLB vid modulimport.
     - `src/spel/kenneyNatur.tsx` (rad 261): `for (const u of Object.values(URL)) useGLTF.preload(u)` — **19 st** natur-GLB vid modulimport.
     - `src/spel/gltfDjur.tsx` (rad 416): `for (const url of forladdaUrls()) useGLTF.preload(url)` — **8 st** djur-GLB vid modulimport.
     - Totalt **56 st** `.glb`-förfrågningar som tävlar om bandbredd och huvudtråd vid kallstart på mobil!
   - **Redan installerade paket i `package.json`:**
     - `@react-three/drei@10.7.9` (innehåller `PerformanceMonitor`, `AdaptiveDpr` och `Bvh`) samt `three-mesh-bvh@0.8.3` är **redan installerade** i repot men ännu inte inkopplade i `src/spel/angen3d.tsx` (`Canvas`).
2. **Stilguide (Arty):** `/workspace/trollpennan-nulage/stilguide.md`
   - Varm skandinavisk sagobokspalett (`#FFFDF7` pergamentkort, `#5D4037` konturer, `#FFD54F` stjärnguld) och den gyllene 3D-stjärnpuffen (`StjarnPuffReserv`) som mjuk reserv vid saknad/offline `.glb`.
3. **3D-manifest & V-serie (Fable):** `/workspace/modell-inkorg/_blockserie-v/manifest-utkast.tsv` + `/workspace/modell-inkorg/_blockserie-v/BLOCKSERIE-V.md`
4. **Speltest & skärmkrav 375×812 (Critiquito):** `/workspace/granskning/2026-10-25/rapport.md` + Critiquitos 5 konkreta krav på `375×812`:
   1. Alla stängkryss (`×`), lyssnaknappar (`🔊 Lyssna`), ordbrickor och kort i Album, Ordbok och Stjärnruta ska ha klickyta `≥ 44×44 px` på `375×812`.
   2. Ordboken får **aldrig** visa en vägg av `389` låsta `"?"`/`"???"`-brickor; den ska ha **"Mina hittade ord"** överst med kategori-framsteg (*"Du har hittat X av Y ord!"*) och klickbara olåsta ord (`≥ 44×44 px`).
   3. Albumet ska visa en 2D-bild / färgbricka + djurets namn och platstagg på varje kort, fast `×`-stängkryss (`≥ 44×44 px`, `data-v9a="album-stang"`), samt vid tomt fotoalbum knappen `"📸 Ta bild på din skapelse"` (`data-v9a="album-ta-bild"`, `≥ 44×44 px`) som fotograferar barnets skapelse direkt.
   4. Stjärnrutan (`⭐ X` i HUD) ska öppna en barnvänlig ruta (`data-v9a="stjarn-ruta"`) med stor stjärnikon, enkel svensk förklaring, `🔊 Lyssna`-knapp (`≥ 44×44 px`, befintlig `.mp3`-röstfil — `0` nya röstfiler!) och fast `×`-stängkryss (`≥ 44×44 px`).
   5. Vid kallstart på `375×812` (`DOMContentLoaded` + `1500 ms`) får högst `≤ 12` `.glb`-förfrågningar skjutas iväg samtidigt (i stället för `56`), `<AdaptiveDpr pixelated />`, `<PerformanceMonitor>` och `<Bvh firstHitOnly>` ska vara aktiva i 3D-scenen med `dpr={[1, 1.5]}`, och `0` okontrollerade `pageerror` eller engelska `"ERROR"`-texter får förekomma vid saknad/offline `.glb` eller `.mp3`.

---

## De 13 grindpunkterna i `build-round-gate`

### 1. Enkelmål och tidsbudget (Grindpunkt 1 & Punkt 10)
- **Uppdelning i två separata en-målsrundor:**
  - **`BESTALLNING-V9a.md` (`--del 1`):** Visuellt Album med miniatyrer/färgbrickor, platstaggar och direktknapp `"📸 Ta bild på din skapelse"`, upptäckar-Ordbok med **"Mina hittade ord"** överst utan `???`/`?`-vägg, samt barnvänlig Stjärnruta med `🔊 Lyssna` (befintlig `.mp3`) och `×` `≥ 44×44 px`.
  - **`BESTALLNING-V9b.md` (`--del 2`):** Mobilprestanda, stegvis GLB-förladdning via `forladdaNarLedig(urlLista)` med `requestIdleCallback` (max 2 GLB åt gången efter första bildrutan, `≤ 12` `.glb` vid kallstart), `<AdaptiveDpr pixelated />` + `<PerformanceMonitor>` + `<Bvh firstHitOnly>` i 3D-scenen, samt mjuk offline-/laddningsreserv (`StjarnPuffReserv` och tyst ljudreserv med `0` `pageerror`).

### 2. Exakta filer och funktioner namngivna (Grindpunkt 2)
- **V9a (`BESTALLNING-V9a.md`):**
  - `src/spel/samling.tsx` (`AlbumVy` med 2D-bild/färgbricka `data-v9a="album-bild"`, djurnamn och platstagg `data-v9a="album-plats"`, fast `×`-stängkryss `data-v9a="album-stang"` `≥ 44×44 px`, samt `"📸 Ta bild på din skapelse"` `data-v9a="album-ta-bild"` `≥ 44×44 px` när `foton.length === 0`)
  - `src/spel/ui/AlbumVy.tsx` (ny re-export av `AlbumVy` från `../samling.tsx` så både `src/spel/samling.tsx` och `src/spel/ui/AlbumVy.tsx` finns)
  - `src/spel/ui/OrdbokDialog.tsx` (`OrdbokDialog` med sektionen **"Mina hittade ord"** `data-v9a="mina-hittade-ord"` överst, kategorikort `data-v9a="ordbok-kategori"` med *"Du har hittat X av Y ord!"*, klickbara olåsta ord `data-v9a="ordbok-ord"` `≥ 44×44 px` som fyller skrivrutan eller spelar ljud, `0` låsta `.hemlig`-brickor med `"?"`/`"???"`, samt fast `×`-stängkryss `data-v9a="ordbok-stang"` `≥ 44×44 px`)
  - `src/spel/ui/OrdbokFlik.tsx` (ny hjälpare/re-export för **"Mina hittade ord"**-sektionen och kategorisammanfattningen som används av `OrdbokDialog.tsx` / `BokSkarm.tsx`)
  - `src/spel/ui/Dialoger.tsx` (`StjarnDialog` med `data-v9a="stjarn-ruta"`, stor stjärnikon `⭐`, barnvänlig svensk text, `🔊 Lyssna`-knapp `data-v9a="stjarn-lyssna"` `≥ 44×44 px` kopplad till befintlig `.mp3`-röst i `rostKo.lasUpp(...)`, och fast `×`-stängkryss `data-v9a="stjarn-stang"` `≥ 44×44 px`)
  - `src/spel/ui/StjarnPop.tsx` (ny re-export av `StjarnDialog` från `./Dialoger.tsx`)
  - `src/spel/ui/Hud.tsx` (`[data-testid="stjarnor"]` visar `"⭐ {stjarnor}"` / `"★ {stjarnor}"` med `≥ 44×44 px` klickyta som öppnar `StjarnDialog`)
  - `src/styles.css` (stilar för `.album-kort-bild`, `.album-plats-tagg`, `.album-tom-foto`, `.ordbok-hittade-topp`, `.ordbok-kategorier`, `.stjarn-ruta-huvud`, `.stang-x` `≥ 44×44 px`)
- **V9b (`BESTALLNING-V9b.md`):**
  - `src/spel/modeller/forladda.ts` (ny modul med `forladdaNarLedig(urlLista)`, `startaBakgrundsForladdning()`, `forladdningsStatus()` som köar GLB-URL:er och laddar högst 2 åt gången via `requestIdleCallback` med `setTimeout(..., 120)`-fallback först efter att startscenen renderat sin första bildruta)
  - `src/spel/gard/ByggModell.tsx` (ersätt `for (const fil of FILER) useGLTF.preload(fil)` med `forladdaNarLedig(FILER)` och använd `StjarnPuffReserv` vid laddningsfel)
  - `src/spel/kenneyNatur.tsx` + re-export `src/spel/modeller/kenneyNatur.tsx` (ersätt `for (const u of Object.values(URL)) useGLTF.preload(u)` med `forladdaNarLedig(Object.values(URL))`)
  - `src/spel/gltfDjur.tsx` + re-export `src/spel/modeller/gltfDjur.tsx` (ersätt `for (const url of forladdaUrls()) useGLTF.preload(url)` med `forladdaNarLedig(forladdaUrls())` och fånga saknad `.glb` med `StjarnPuffReserv`)
  - `src/spel/modeller/StjarnPuffReserv.tsx` (den gyllene 3D-stjärnpuffen `StjarnPuffReserv` ur `/workspace/trollpennan-nulage/stilguide.md`)
  - `src/spel/angen3d.tsx` + re-export `src/spel/Scen3D.tsx` (koppla in `<AdaptiveDpr pixelated />`, `<PerformanceMonitor>` med `dpr` `[1, 1.5]` och `<Bvh firstHitOnly>` runt `<Scen />`, samt anropa `startaBakgrundsForladdning()` i `onCreated` efter första bildrutan)
  - `src/spel/rost.ts` (säkerställ mjuk tyst reserv vid saknad/offline `.mp3` utan okontrollerade `pageerror`)

### 3. Namngivna builder-skills (Grindpunkt 3)
- `3d-web-game-check`, `child-literacy-design`, `stylized-3d-art-direction`, `typescript-best-practices`, `principle-prove-it-works`.

### 4. Körbart provskript med `--snabb` och `--del` (Grindpunkt 4)
- `rundor/V9a-V9b-album-ordbok-prestanda/matt/prov-v9.mjs` stödjer `--snabb` och `--del 1|2|alla` samt full Playwright-körning på `375×812`.

### 5. Föremätning körd mot `main` (`d9068f2`) med `ok: false` (Grindpunkt 5)
- `node rundor/V9a-V9b-album-ordbok-prestanda/matt/prov-v9.mjs --snabb --del alla` är körd mot `d9068f2` och rapporterar `ok: false` utan krasch före rundan.

### 6. Kalibrering / nätverks- och skärmmätning före rundan (Grindpunkt 6)
- Kodspanarens mätning i `/workspace/kod-inkorg/V4-V9/spaning.md` (Punkt 4) och föremätningen i `prov-v9.mjs` verifierar att `d9068f2` skjuter iväg `29 + 19 + 8 = 56` synkrona `useGLTF.preload`-anrop vid modulimport, saknar `AdaptiveDpr`/`PerformanceMonitor`/`Bvh` i `angen3d.tsx`, och renderar `389` låsta `.hemlig`-brickor (`"?"`) i `OrdbokDialog.tsx`.

### 7. Inga kända testfällor i befintliga enhetsprov (Grindpunkt 7)
- **`src/spel/rost2.test.ts`:** Kräver att alla texter som listas i `data/rost.json` har förgenererade `.mp3`-filer i `data/rost-manifest.json` och att `ANTAL_RADER` stämmer. Därför får **0 nya röstfiler** läggas till i `data/rost.json` eller `data/rost-manifest.json`! Knappen `🔊 Lyssna` i `StjarnDialog` återanvänder befintlig förgenererad röst i `rostKo.lasUpp(...)` (t.ex. `"Nu tänds stjärnorna i boken."` eller `fyll(FIR.stjarnor.for_fa, { n: ... })`).
- **`src/spel/r9.test.ts`:** Kräver att `data/stjarnor.json` behåller platshållarna `{guld}`, `{hemligt}`, `{onskan}`, `{sida}`, `{uppdrag}` i `stj.ger` och ordet `"Ordboken"` i `stj.gor`. `data/stjarnor.json` får därför inte tappa dessa nycklar.
- **`src/spel/p4c.test.ts`:** Kräver att `[data-testid="album-knapp"]` och `[data-testid="ordbok"]` finns kvar i menyn.
- **Filstorleksgräns (`≤ 400` rader):** Ingen fil i `src/` får överstiga `400` rader (`Spel.tsx`, `samling.tsx`, `OrdbokDialog.tsx`, `Dialoger.tsx`, `angen3d.tsx`, `gltfDjur.tsx` m.fl. hålls under 400 rader).

### 8. Skärmtrohet på `375×812` (Critiquitos 5 krav) (Grindpunkt 8)
- Alla interaktiva ytor (`album-stang`, `album-ta-bild`, `ordbok-ord`, `ordbok-stang`, `stjarn-lyssna`, `stjarn-stang`) verifieras på `375×812` med `width >= 44` och `height >= 44`.

### 9. Barnupplevelse och läsglädje 7–12 år (Grindpunkt 9)
- Barnet möts av sina egna hittade ord och tydliga kategoriframsteg i Ordboken i stället för en vägg av `389` frågetecken, kan ta en bild av sin skapelse direkt från ett tomt album, och kan lyssna på stjärnförklaringen med ett tryck.

### 10. Uppdelning i en-målsrundor (Grindpunkt 10)
- Uppfyllt genom separata `BESTALLNING-V9a.md` (`--del 1`) och `BESTALLNING-V9b.md` (`--del 2`).

### 11. Inga externa nätverksberoenden i provet (Grindpunkt 11)
- `prov-v9.mjs` kör 100 % lokalt mot repots källkod och lokala dev-server utan externa API-anrop.

### 12. Bakåtkompatibilitet med V1–V3 (`d9068f2`) (Grindpunkt 12)
- Utgår direkt från `origin/main` (`d9068f2`) och bevarar alla test-ID:n från V1–V3 (`data-v1`, `data-v2`, `data-v3`).

### 13. Tydligt acceptansbevis (Grindpunkt 13)
- Både `node rundor/V9a-V9b-album-ordbok-prestanda/matt/prov-v9.mjs --snabb --del alla` (`ok: true`), full Playwright-körning `node rundor/V9a-V9b-album-ordbok-prestanda/matt/prov-v9.mjs --del alla` (`ok: true`), `npm test` och `npm run build` krävs för godkännande.
