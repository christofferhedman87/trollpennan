# Runda V9b — Stegvis GLB-förladdning, adaptiv 3D och stjärnpuff

## Vad som gjordes

Kallstarten ska inte längre hämta gårdens, djurens och ängens alla modeller i samma ögonblick som modulerna importeras. Bakgrundsladdningen väntar tills scenen har ritat sin första bildruta, och en saknad modell visar en gyllene puff i stället för engelsk feltext.

- **Kö** (`src/spel/modeller/forladda.ts`): `forladdaNarLedig` lägger bara unika `.glb`-adresser i en kö. `useGLTF.preload` anropas först efter `startaBakgrundsForladdning()`, med 1600 ms paus, och då högst 2 filer åt gången via `requestIdleCallback` (Safari-reserv: `setTimeout(..., 120)`). `onBakgrundsForladdningKlar` slår på resten av ängen när fönstret är stängt.
- **Ängen** (`src/spel/kenneyNatur.tsx`, omexport `src/spel/modeller/kenneyNatur.tsx`): de 7 kärnmodellerna (`ek`, `van`, `gran`, `rod`, `gul`, `sten`, `lilja`) ritas direkt. De 12 detaljerna (`tjock`, `lila`, `svampr`, `svampt`, `stenl`, `gras`, `liljas`, `stig`, `staket`, `grind`, `stubbe`, `orm`) monteras först när bakgrundsfönstret är öppet.
- **Gården** (`src/spel/gard/ByggModell.tsx`): de 29 byggfilerna köas i stället för att förladdas vid import. `ModellGren` fångar laddfel tyst. Höbalarna faller tillbaka till `StjarnPuffReserv`.
- **Djur** (`src/spel/gltfDjur.tsx`, omexport `src/spel/modeller/gltfDjur.tsx`): de 8 startmodellerna köas. Plagg lindas i `DjurModellGren` så ett trasigt plagg inte blir ett okontrollerat fel.
- **Scen** (`src/spel/angen3d.tsx`, omexport `src/spel/Scen3D.tsx`): `PerformanceMonitor` sänker DPR till 1 vid låg bildtakt och höjer den igen till `[1, KV.dpr_max]`. `Bvh firstHitOnly` och `AdaptiveDpr pixelated` sitter i canvasen. Roten har `data-v9b-r3f="adaptive-bvh"`. Bakgrundskön startar i den inre bildrutan, efter att laddytan fått `data-klar="ja"`.
- **Reserv** (`src/spel/modeller/StjarnPuffReserv.tsx`): varm guldkärna `#FFD54F` med emissive `#FFA000` och fyra små `#FFF8E1`-sfärer, `name="stjarn-puff-reserv"`.
- **Röst** (`src/spel/rost.ts`): `new Audio` och `play()` ligger i `try/catch` så en saknad eller offline-mp3 inte blir ett okontrollerat fel. Inga nya röstfiler.
- **Prov** (`src/spel/v9b.test.ts`): kön tar unika adresser utan att starta före första bildrutan, de tre synkrona preload-looparna är borta, och scenen nämner `AdaptiveDpr`, `PerformanceMonitor` och `Bvh`.

`src/spel/ui/`, `data-testid`, `Bengtsson3D.tsx` och röstfilerna är orörda.

## Före / efter

| Prov | Före | Efter |
| --- | --- | --- |
| `prov-v9.mjs --snabb --del alla` | `ok: false`. Modulen `forladda.ts` saknades. Synkrona `useGLTF.preload`-loopar fanns kvar i `ByggModell.tsx`, `kenneyNatur.tsx` och `gltfDjur.tsx`. `AdaptiveDpr`, `PerformanceMonitor` och `Bvh` saknades. `StjarnPuffReserv` saknades. | `ok: true`. Del 1 (album, ordbok, stjärnruta) oförändrat grön. Del 2 grön. |
| `prov-v9.mjs --del alla` (375×812) | Varm server: `glbVidKallstart1500ms` 53, `data-v9b-r3f` saknades, `pageErrors` 0. Kall Vite hann inte montera ängen inom 1500 ms (0 `.glb`, attribut `null`). | `glbVidKallstart1500ms: 8 <= 12`, `r3f: "adaptive-bvh"`, `pageErrors: 0`. Album, ordbok och stjärnruta fortfarande inom 44 px. |

`check:struktur` grön (Spel.tsx 49 rader, data-testid 174/179, ui-filer 31). `v9b.test.ts`, `v9a.test.ts` och `v6.test.ts` gröna. `typecheck`, `typecheck:pages` och `eslint` (0 fel) gröna. `build:pages` grön.

## Tre svagaste punkter

1. De 12 detaljmodellerna monteras i en klump när flaggan slår om. Då hämtar `useGLTF` dem parallellt. Taket på 2 åt gången gäller kön (gård och djur som inte står i bild), inte de detaljer som just blivit synliga.
2. `Bvh` bygger trädet en gång, vid mount, innan Suspense har hämtat modellerna. Träd, Bengtsson och kaninen som kommer in senare raycastas utan det trädet.
3. `gltfDjur.tsx` är kvar över 400 rader (ändringen är några rader runt plaggen). Själva djurkroppens laddfel fångas fortfarande av den äldre `ModellGren` i `djur.tsx`, eftersom `useGLTF` kastar inuti `GltfDjur` och inte i barnet.

## Risker och rekommendationer

- Första anropet mot en kall Vite hinner ofta inte rita `[data-testid="angen-3d"]` inom `DOMContentLoaded + 1500 ms`. Då blir både GLB-räknaren och `data-v9b-r3f` missvisande. Mät om mot en redan varm server innan en röd körning tolkas som kodfel.
- Sänk inte 1600 ms-pausen. Den är det som håller bakgrundskön utanför provfönstret. På en snabb telefon är taket i fönstret de 7 kärnmodellerna, sagokaninen och `bengtsson.glb`.
- `KV.dpr_max` är 1.5 i låg profil och 2 i hög. Attributet `data-v9b-dpr` följer maskinen (`1-1.5` eller `1-2`) tills `PerformanceMonitor` sänker till `1`.
- Nästa steg, om kön ska märkas i praktiken: låt detaljerna droppa in två och två i stället för alla tolv på samma bildruta, och bygg om BVH när Suspense har löst modellerna.
