# RUNDA-G1a

Gårdens 1,0-rutnät, kantstaket och BFS-hage. Ingen R3F-vy (den hör till G1b).

## Filer

| Fil | Rader | Ändring |
| --- | ---: | --- |
| `data/gard-3d.json` | 66 | ny |
| `src/spel/gard/rutnat.ts` | 250 | ny |
| `src/spel/gard/gard3d.test.ts` | 156 | ny |
| `PLAN-G1a.md` | 20 | ny |
| `package.json` | 114 | `test:product` fick `src/spel/gard/gard3d.test.ts` sist |
| `.grok/skills/typescript-best-practices/` | — | installerad |
| `.grok/skills/3d-web-game-check/` | — | installerad |

`src/spel/Spel.tsx` är orörd (49 rader). Inga nya `data-testid`, inga nya beroenden.

## `prov-g1.mjs --fas g1a`

```json
{
  "ok": true,
  "fel": [],
  "detaljer": {
    "fas": "g1a",
    "cc0Modeller": 12,
    "antalByggOrd": 36,
    "cellBijektion": "60/60",
    "kantBijektion": "136/136"
  }
}
```

## `gard3d.test.ts`

3 tester, 3 gröna: tillgångar och CC0, 60 celler och 136 kanter genom minne-klampningen, BFS-hagar plus fyra anrop till `ledigKantPlats`.

`npm run test:product`: 387 tester, 0 fel. `npm run typecheck`, `npm run typecheck:pages` och `npm run check:struktur` gröna. `npx eslint .` gav 0 fel (6 befintliga varningar i `src/spel/styr/`).

## Tre svaga punkter

1. Ingen skärmkontroll. G1a bevisar tal, filer och mängder. Staketets silhuett mot kanten, kamerans inramning av 6×10 och reservformerna syns först när G1b ritar dem.
2. `kantTillVarld` ställer modellen i cellens mitt med `rotY` 0 eller `π/2`, eftersom `fence_*.glb` redan ligger på lokal z ≈ -0.5. Sydkanten `gz = 10` och östkanten `gx = 6` är tänkta celler utanför 6×10. Världskoordinaternas rundtur (`varldTillCell` / `varldTillKant`) saknar eget test.
3. `ledigKantPlats` sluter först rutan `(2, 4)`. Kanterna som sedan växer mot 2×2 (`gx` 2..3, `gz` 4..5) läggs utanpå, så de delade kanterna `(3,4,W)` och `(2,5,N)` står kvar inne i den större ringen.

## Vad G1b kan anta

Alla 36 byggord finns i `data/gard-3d.json` med `fil`, `tillgangId`, `malhojd`, `reserv` och `farg`. Kameran ligger under `kamera`. Alla 60 celler och 136 kanter är bijektiva genom klampningen `[0.06, 0.94] × [0.30, 0.94]`. Nya hus snäpps med `ledigCellPlats` / `xyTillCell`, nya staket med `ledigKantPlats` / `xyTillKant` och `kantTillVarld`. Hagar läses med `hittaSlutnaHagar(kanterForByggen(garden))`: tom gård ger 0, fyra kanter runt en ruta ger 1 hage med den rutan. Byggord med `fil: null` ritas från `reserv`.
