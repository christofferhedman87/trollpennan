# RUNDA-G1b

Gården ritas i 3D (R3F) när barnet är på gården. Phaser-scenen `GardScen` startas inte längre. `src/spel/gard.ts` och paketet `phaser` lämnas till G2. Djur i scenen väntar till G1c (`djur: []`).

## Steg

| Steg | Status |
| --- | --- |
| 1. `Garden3D` plus hjälpare, fast kamera, rutnät, modeller, staket, hagar, tryck och `brygga` | klart |
| 2. Inkoppling i `VYER`, snäpp i `hanteraBygg`, `GardScen` ur `starta.ts`, CSS för `.garden-3d` | klart |
| 3. Prov och den här anteckningen | klart |

## Filer

| Fil | Rader | Ändring |
| --- | ---: | --- |
| `src/spel/gard/Garden3D.tsx` | 218 | ny |
| `src/spel/gard/ByggModell.tsx` | 229 | ny |
| `src/spel/gard/MarkPlan.tsx` | 215 | ny |
| `src/spel/gard/ReservForm.tsx` | 146 | ny |
| `src/spel/gard/modellPrep.ts` | 147 | ny |
| `src/spel/ui/vyer.ts` | — | `garden3d` i `VYER` |
| `src/spel/styr/useSkapa.ts` | — | `ledigCellPlats` / `ledigKantPlats` |
| `src/spel/starta.ts` | — | `GardScen` startas inte |
| `src/styles.css` | — | fyra regler för `.garden-3d` |
| `PLAN-G1b.md` | 25 | ny |

`src/spel/Spel.tsx` är orörd. Inga nya `data-testid`. Inget `OrbitControls` i `Garden3D.tsx`. `OrthographicCamera` och `Bounds` finns där.

## Prov

`node rundor/G1-garden/matt/prov-g1.mjs --fas g1b`:

```json
{"ok":true,"fel":[],"detaljer":{"fas":"g1b","cc0Modeller":12,"antalByggOrd":36,"cellBijektion":"60/60","kantBijektion":"136/136"}}
```

`npm run typecheck` och `npm run typecheck:pages` gröna. `npx eslint .` gav 0 fel och 6 befintliga varningar i `src/spel/styr/` (inga i gårdsfilerna). `npm run test:product`: 387 tester, 0 fel. `npm run check:struktur` GRÖN. `npm run test:bok`: 2 tester, 0 fel.

## Vad skärmen visar (375×812)

Rutnätet 6×10 ryms i stående vy med samma isometriska vinkel. Ett rött hus står i sin cell (CC0-modell, botten på y=0, bredd högst 0.92). Staket från `fence_simple.glb` ligger längs kanterna med lokal z=−0.5. En blå damm ritas som reservform. Tre höbalar står runt plattan. Fyra kanter runt cellen (2, 4) ger hage-1 och en ljusgrön platta `#aed581`. Kort tryck på huset utan boende öppnar menyn (Flytta, Bygg om, Lägg i lådan, Vem ska bo här). Flytta och tryck på en ruta snäpper huset dit, här till cell (5, 9).

## Tre svaga punkter

1. `Bounds` med `fit` behåller siktlinjen från `[10, 12, 10]` men flyttar kameran utåt och sätter zoomen så att ramen ryms (uppmätt zoom omkring 30). `clip` skriver om near/far. Rutnätet klipps inte.
2. Kenney-staketet saknar `metallicFactor` och blir metall 1 i three.js, så bitarna ser ljusa ut utan miljöspegling. De ligger ändå på kanten.
3. Tolkens antal tak är 3, så frasen «fyra staket» ger tre kanter. Den fjärde kanten, och den slutna hagen, kommer med nästa staket. `hemTryck` (kort tryck när bygget har boende) är inte kört i vyn, eftersom de nya byggena saknade boende.
