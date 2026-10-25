# PLAN-G1a — Gårdens 1,0-rutnät, kantstaket och BFS-hage

Runda G1a av 3: datatabell, rutnäts-/kantgeometri och BFS-hagelösare. Ingen R3F-vy (G1b) och ingen djurvandring (G1c).

## Steg
1. `data/gard-3d.json` — rutnät 6×10 (`cellStorlek` 1,0), kamera, staketfiler, 36 byggord, tre dekor. Exakt enligt spec.
2. `src/spel/gard/rutnat.ts` (≤ 250 rader, ingen Three/DOM) — konstanter, cell/kant ↔ xy/värld, `kanterForByggen`, BFS `hittaSlutnaHagar`, `ledigCellPlats`, `ledigKantPlats`.
3. `src/spel/gard/gard3d.test.ts` och sista posten i `package.json` `test:product`. Befintliga testfiler rörs inte.
4. Slutkontroll och `RUNDA-G1a.md`. Commit efter varje grönt steg.

## Kontrakt
- Cell `0..5 × 0..9`. N-kant `gz` 0..10, W-kant `gx` 0..6.
- `cellTillXy` / `kantTillXy` hamnar i minne-klamp `[0.06, 0.94] × [0.30, 0.94]` och är bijektiva tillbaka.
- BFS från kartans utsida; cell som inte nås är inhägnad. Id `hage-1`, `hage-2`, …
- `ledigKantPlats` sluter först 1×1 kring `(2, 4)`, sedan 2×2.
- Inga nya beroenden, inga `data-testid`, `Spel.tsx` orörd.

## Färdigheter
- typescript-best-practices: inga `as`-kast, JSON okänd tills den lästs vid gränsen, tester kör riktig logik.
- 3d-web-game-check: spellogik skild från rendering; fast kamera ligger i data; skärmtest väntar till G1b.
