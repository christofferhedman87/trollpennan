# PLAN-G1b — Gården i 3D, fast kamera, snäppta byggen

Runda G1b: en R3F-vy ersätter Phaser-scenen i vyn. `gard.ts` och paketet `phaser` lämnas till G2. Djur i scenen väntar till G1c.

## Steg

1. `Garden3D.tsx` plus hjälpare (`modellPrep.ts`, `ByggModell.tsx`, `ReservForm.tsx`, `MarkPlan.tsx`). Varje fil under 380 rader.
2. Koppla in vyn i `VYER`, snäpp nya byggen i `hanteraBygg`, koppla ur `GardScen` i `starta.ts`, CSS för `.garden-3d`.
3. Kör `prov-g1.mjs --fas g1b`, typecheck, typecheck:pages, eslint, test:product och check:struktur. Skriv `RUNDA-G1b.md`.

## Kontrakt

- Fast vinkel: `OrthographicCamera` på `[10,12,10]`, `zoom={48}`, `near={-40}`, `far={80}`, `lookAt(0,0,0)`. `Bounds fit clip observe margin={1.1} maxDuration={0}` runt en osynlig ram `6×10`. Ordet för fri kamerastyrning står inte i `Garden3D.tsx`.
- Inga `data-testid`. Roten har `className="angen-3d garden-3d"` och `data-vy="garden-3d"`.
- Gräsmark `#7dce6a`, gårdsplatta `6.4×10.4`, rutnät, tre höbalar, slutna hagar `#aed581` på `y=0.015`.
- Flyttläge snäpper med `varldTillCell` eller `varldTillKant` och skickar `byggd`.
- Staket behåller lokal `z=-0.5` (`fence_simple.glb`, grind vid port eller del `dörr`). Byggnad skalas till `malhojd` och max `0.92`, annars reservform.
- Långtryck minst 400 ms, eller kort tryck utan boende: `byggLang`. Kort tryck med boende: `hemTryck`. Skärmpunkt kläms till `[0.08,0.92]`.
- `brygga.registrera("gard")` vid mount, `redo`, avregistrering vid unmount. `window.__gard3d` med celler, byggen, kanter, hagar och `djur: []`.
- Ingen `setState` i `useFrame`, inga nya vektorer per bildruta, en skuggkastare, `dpr` högst 2.

## Färdigheter

- typescript-best-practices: inga `as`-kast, uttömmande reservslag, data läses vid gränsen.
- 3d-web-game-check: fast kamera, tryckyta i cellstorlek, läge i zustand, rendering i R3F.
