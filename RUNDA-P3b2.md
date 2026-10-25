# Runda P3b-2 — Kläder på kroppen i R3F (`data/plagg.json`, `arPlagg`, `faestPlaggKlon`, `GltfPlagg`)

## Sammanfattning
- **`data/plagg.json`**: Skapade fästtabellen med 7 grupper (`huvud`, `huvudBred`, `hals`, `kropp`, `underkropp`, `fot`, `hand`) och mappning för alla 38 3D-modellerade klädesplagg (`alvmossa`, `troja`, `stovlar`, `keps`, `klanning` m.fl.).
- **`src/spel/entiteter.ts` & `src/spel/ang/djur.tsx`**: Exporterade `arPlagg(id)` (`e?.typ === "tillbehor" && !!modellUrl(id)`) och filtrerade bort `arPlagg(id)` från `medSaker` i `src/spel/ang/djur.tsx` så att kläder som önskas tillsammans med ett djur inte läggs som små saker på marken bredvid djuret, medan ensamma klädesplagg fortfarande ritas som saker (`arSak(id) === true`).
- **`src/spel/tillbehor/ankare.ts` & `src/spel/tillbehor/faest.ts`**:
  - Mäter djurets `Box3` i `ankareFor` med ytterrotation tillfälligt nollställd och redan monterade `tillbehor-*`-noder tillfälligt urkopplade, samt korrigerar tvärbredd och ankarrotation för `framAxel` (`krokodil` med `framAxel: "+x"`).
  - Monterar GLB-plagg med `faestPlaggKlon` via `SkeletonUtils.clone(plaggScen)` så att skinnade plagg (`alvmossa`, `troja`) får egna skelett och följer med djuret ute på ängen, samt beräknar fot-/hand-bas relativt `rot`s världsposition.
- **`src/spel/gltfDjur.tsx`**: Lade till `GltfPlagg` som laddar plaggets GLB med Meshopt-stöd och monterar det i `GltfInnehall`.
- **`src/spel/tillbehor/p3b2.test.ts`**: Enhetstester för alla 38 GLB-plagg, `arPlagg`, 3D-montering på 7 djur (`kanin`, `katt`, `hund`, `rav`, `häst`, `krokodil`, `kapybara`) och färgläggning av klonens material.

## Verifiering
- `node --experimental-strip-types rundor/P3b-klader/matt/prov-p3b.mjs --snabb`: GRÖN (`del=alla, snabb=true`)
- `node --experimental-strip-types rundor/P3b-klader/matt/prov-p3b.mjs`: GRÖN (`del=alla, snabb=false`, 7 skärmbilder 375×812 granskade)
- `npm run test:product`: 398/398 tester gröna
- `npm run typecheck` & `npm run typecheck:pages`: 0 fel
- `npx eslint .`: 0 errors
- `npm run check:struktur`: GRÖN (`Spel.tsx`: 49 rader)
