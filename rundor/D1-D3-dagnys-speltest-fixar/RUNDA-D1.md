# Runda D1 — Rena 3D-djuransikten (utan svarta solglasögon), inget systemtangentbord i Pennans bok & Doktor Bengtsson som 2D-porträtt

## Sammanfattning
1. **Fynd D1 (`src/spel/tillbehor/AnsiktsUttryck.tsx`, `src/spel/ang/djur.tsx`, `src/spel/ang/humorIkon.tsx`):**
   - Tog bort de påklistrade svarta 3D-ögongloberna (`OGA` `#231B1B`, `ogaL`, `ogaR`, `glimtL`, `glimtR`, `leende`, `oppen`, `oMun`, `tunga`, `kindL`, `kindR` och `benAnsikte`) som satt framför nosen som "svarta solglasögon" på GLB-djur med egna ögon och munnar.
   - Ersatte med en mjuk svävande humör-aura (`#F48FB1` och `#FFE082`) ovanför `ankare.huvudTopp` samtidigt som alla exporterade funktioner (`beraknaUttryckSkarmPx`, `sattUttryck`, `AnsiktsUttryck`), alla 5 humörsträngarna (`"glad"`, `"fortjust"`, `"hungrig"`, `"somnig"`, `"busig"`) och `userData={{ plaggPar: "uttryck", par: "uttryck" }}` behölls.
   - Skickade med `signal.current.humör` som 4:e argument till `squashSkala(...)` i `src/spel/ang/djur.tsx` och tog bort `jubel ? "hidden" : "visible"` i `src/spel/ang/humorIkon.tsx`.
2. **Fynd D2 (`src/spel/ui/BokSkarm.tsx`, `src/spel/dialogFokus.ts`, `src/spel/ui/bok-p1.css`):**
   - Lade till `inputMode="none"`, `tabIndex={-1}`, `autoComplete="off"`, `autoCorrect="off"`, `autoCapitalize="off"` och `spellCheck={false}` på `<input className="ord-input-ankare">` (utan `readOnly`) samt `pointer-events: none` i `bok-p1.css` och exkluderade `:not(.ord-input-ankare):not([tabindex="-1"])` i `dialogFokus.ts` så att mobilens inbyggda systemtangentbord aldrig dyker upp ovanpå spelets eget bokstavstangentbord.
3. **Fynd D6 (`src/spel/ang/Bengtsson3D.tsx`, `src/spel/ui/SpelVy.tsx`, `data/*`, `src/spel/rostManifest.ts`, `src/spel/v2.test.ts`):**
   - Dolde den lågpoly 3D-figuren av Doktor Bengtsson på ängen (`D1_DOLJ_3D_BENGTSSON = true`) och visade istället det illustrerade 2D-porträttet (`<NpcFigur>`) nere till vänster på alla platser när `bengtsson.synlig` är sant.
   - Bytte konsekvent `"Bengtsson"` till `"Doktor Bengtsson"` i `data/forsta-stunden.json`, `data/npc.json`, `data/bengtsson.json`, `src/spel/v2.test.ts`, `src/spel/rostManifest.ts` samt kopplade de nygenererade röstfilerna (`64897216`, `48e25714`, `02162362`, `d12df487`, `96b385a3`) i `data/rost-manifest.json` och `data/rost-klient.json`.

## Verifiering
- `node rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs --snabb --del d1`: GRÖN
- `npx tsc --noEmit`: GRÖN
- `npm run check:struktur`: GRÖN (`174` unika / `179` förekomster `data-testid`)
- `npm run test:product`: GRÖN (`450/450` tester)
- `npx vite build`: GRÖN
- `node rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs --del d1`: GRÖN
- `node rundor/S4-S5-vaktardjur-solstjarnor-album/prov-s4-s5.mjs --snabb --del alla`: GRÖN
- `node rundor/S1-S3-slime-varld-ansikten-largo/prov-s1-s3.mjs --snabb --del alla`: GRÖN
- `node rundor/F4-F5-3d-plagg-vuxenlas/prov-f4-f5.mjs`: GRÖN (`14/14` godkända)
