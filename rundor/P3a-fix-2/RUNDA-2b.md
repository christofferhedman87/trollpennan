# P3a-fix-2b: läge efter rundan

Doodle skrev den här filen vid granskningen. Build hann inte, eftersom turerna tog slut (30 + 5 + 5 = 40, taket). Mätningen före koden står i `PLAN-2b.md` (Build).

Gren `runda-p3a-fix-2b-kod`, bas `5ed1933`. Commits från Build:
- `6a0f37b`: mätningen (`PLAN-2b.md`)
- `b2d1b70`: `satMinne` per plats och `dekorSkymd` i ett svep
- `869e149`: `underMinne` och `torrMinne` med talnycklar. Alla placeringsminnen töms när `placera` får en ny plats, inte längre vid en räknare mitt i ett anrop.

Bara `src/spel/placering.ts` är ändrad. Prov, `data`, `Spel.tsx`, `src/tolk` och `minne.ts` är orörda.

## Prestandaprovet, hela `src/spel/p3a.test.ts` (Node 22, CPU-ms, median)

| | äng | sjö | skog | grotta | resultat |
|---|---|---|---|---|---|
| före (5ed1933), 2 körningar | 29,8 / 21,9 | 25,7 / 27,0 | **53,0 / 55,6** | (hanns inte) | 8/9 |
| efter (869e149), 3 körningar | 18,5 / 31,4 / 18,7 | 22,5 / 32,7 / 22,1 | **27,4 / 36,8 / 27,4** | 27,6 / 39,0 / 27,6 | 9/9 |

Beslut B, sjöns häst inräknad, är grönt.

## Samma läge som förut

`jamfor-lage.mjs` (Doodle) körde 112 fall: 4 platser × 1–14 skapelser × 2 varv, med platsbyten emellan. `placera` ger byte för byte samma `Lage` på 5ed1933 och 869e149.

## Ett nytt ord på en full plats (`placera`, 5 nya, median CPU-ms, före → efter)

| skapelser | äng | sjö | skog | grotta |
|---|---|---|---|---|
| 10 | 23,9 → 16,0 | 49,9 → 41,2 | 35,7 → 25,6 | 24,3 → 16,2 |
| 12 | 30,0 → 46,0 | 112 → 102 | 80,6 → 74,1 | 19,8 → 18,1 |

Med `TAK_PER_PLATS` 10 räknar spelet `placera` med högst cirka 11. Ord 11–12 tar 0,1 ms (Builds mätning).

## Inte klart, de 3 svagaste ställena

1. Sökningen mot noll stall (4 tak × 5 storlekar) är orörd. Vid 12 skapelser tar sjön fortfarande cirka 100 ms. Spelet når inte dit i dag, men ett höjt tak gör det.
2. Prestandaprovet brusar fortfarande (enstaka prover 55–64 ms). Medianen har god marginal, men GC räknas in i CPU-tiden.
3. Nycklarna bygger på att `underlag` bara anropas via `placera`, som tömmer minnena vid platsbyte, och på att x och z ligger inom ±64 på tusendelar. En ny anropare utanför `placera` måste få plats-id i nyckeln.
