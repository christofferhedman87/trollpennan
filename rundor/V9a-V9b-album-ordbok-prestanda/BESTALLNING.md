# Beställning V9a–V9b — Visuellt Album, Upptäckar-Ordbok & Stjärnruta (V9a) samt Mobilprestanda, Stegvis GLB-förladdning & Mjuk Reserv (V9b)

Enligt `build-round-gate` (**Regel 0, Punkt 2, 6, 7 och 10**) och `build-prompt` är den avslutande delen i Blockserie V uppdelad i **två separata en-målsrundor**:

1. **[`BESTALLNING-V9a.md`](./BESTALLNING-V9a.md) — En-målsrunda V9a (`--del 1`):**
   - **Visuellt Album (`src/spel/samling.tsx` / `src/spel/ui/AlbumVy.tsx` / `src/spel/ui/Hud.tsx`):** Visa 2D-bild / färgbricka (`data-v9a="album-bild"`) + djurets namn och platstagg (`data-v9a="album-plats"`) på varje kort i albumet, fast `×`-stängkryss (`≥ 44×44 px`, `data-v9a="album-stang"`), och om fotoalbumet är tomt visas en tydlig knapp `"📸 Ta bild på din skapelse"` (`≥ 44×44 px`, `data-v9a="album-ta-bild"`) som tar en bild av barnets skapelse direkt.
   - **Upptäckar-Ordbok utan `???`-vägg (`src/spel/ui/OrdbokDialog.tsx` / `src/spel/ui/OrdbokFlik.tsx` / `src/spel/ui/BokSkarm.tsx`):** Visa sektionen **"Mina hittade ord"** (`data-v9a="mina-hittade-ord"`) överst med bild/ikon och antal hittade ord per kategori (*"Du har hittat X av Y ord!"*, `data-v9a="ordbok-kategori"`) i stället för en vägg av `389` låsta `"?"`/`"???"`-brickor (`0` `.hemlig`-brickor). Olåsta ord är klickbara (`≥ 44×44 px`, `data-v9a="ordbok-ord"`) och lägger in ordet i skrivrutan eller spelar upp befintligt ljud.
   - **Barnvänlig Stjärnruta (`src/spel/ui/Hud.tsx` / `src/spel/ui/Dialoger.tsx` / `src/spel/ui/StjarnPop.tsx`):** Tryck på `"⭐ X"` i topp-HUD öppnar en barnvänlig ruta (`data-v9a="stjarn-ruta"`) med stor stjärnikon, enkel svensk text om hur man får stjärnor, `🔊 Lyssna`-knapp (`≥ 44×44 px`, `data-v9a="stjarn-lyssna"`, med befintlig `.mp3`-röstfil — `0` nya röstfiler!) och fast `×`-stängkryss (`≥ 44×44 px`, `data-v9a="stjarn-stang"`).

2. **[`BESTALLNING-V9b.md`](./BESTALLNING-V9b.md) — En-målsrunda V9b (`--del 2`):**
   - **Stegvis GLB-förladdning via `requestIdleCallback` (`src/spel/modeller/forladda.ts`):** Ersätt de `56` synkrona toppnivå-looparna med `useGLTF.preload` vid modulimport i `src/spel/gard/ByggModell.tsx` (`29 st`), `src/spel/kenneyNatur.tsx` (`19 st`) och `src/spel/gltfDjur.tsx` (`8 st`) med `forladdaNarLedig(urlLista)` som förladdar högst `2` GLB åt gången via `requestIdleCallback` (med `setTimeout(..., 120)`-fallback) först efter att startscenen har renderat sin första bildruta. Vid kallstart (`DOMContentLoaded` + `1500 ms`) får högst `≤ 12` `.glb`-förfrågningar skjutas iväg samtidigt i stället för `56`.
   - **Adaptiv R3F-rendering på mobil (`src/spel/angen3d.tsx` / `src/spel/Scen3D.tsx`):** Koppla in `<AdaptiveDpr pixelated />`, `<PerformanceMonitor>` och `<Bvh firstHitOnly>` från `@react-three/drei` med `dpr={[1, 1.5]}` som sänker DPR vid låg bilduppdatering utan att tappa pekinteraktion.
   - **Mjuk offline-/laddningsreserv (`src/spel/modeller/StjarnPuffReserv.tsx`):** Om en `.glb` eller `.mp3` saknas eller är offline fångas felet tyst (`0` okontrollerade `pageerror`, ingen engelsk `"ERROR"`-text) och den gyllene 3D-stjärnpuffen (`StjarnPuffReserv` ur `stilguide.md`) visas.

## Gemensamt provskript
```bash
node rundor/V9a-V9b-album-ordbok-prestanda/matt/prov-v9.mjs --snabb --del 1
node rundor/V9a-V9b-album-ordbok-prestanda/matt/prov-v9.mjs --snabb --del 2
node rundor/V9a-V9b-album-ordbok-prestanda/matt/prov-v9.mjs --snabb --del alla
node rundor/V9a-V9b-album-ordbok-prestanda/matt/prov-v9.mjs --del alla
```
