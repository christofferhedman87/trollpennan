# P3a-fix-2b — mätning före kod

Node 22.23.3. `process.cpuUsage().user + system`, samma mått som `p3a.test.ts`. En ren slinga ligger 1:1 mot väggklockan. GC syns i CPU-tiden.

## Provfilen, en körning

| körning | äng | sjö | skog | grotta |
|---|---|---|---|---|
| hela `p3a.test.ts` | 24,2 (20, 20, 24, 30, 56) | 25,6 (16, 17, 26, 30, 33) | **51,2 (29, 35, 51, 64, 120) röd** | hann inte (assert i skogen) |
| bara `prestanda` | 33,5 (26, 30, 33, 45, 97) | 43,2 (28, 29, 43, 78, 96) | 47,3 (38, 42, 47, 86, 109) | 44,4 (18, 29, 44, 52, 56) |
| `beslut B` sedan `prestanda` | 22,7 | 29,4 | 33,4 | 26,8 |

Beslut B: grönt, 1,8 s. Isolerad prestanda är grön men utan marginal (skog 47, grotta 44). Hela filen är röd på skogen.

## Var tiden går

`--cpu-prof` och precise coverage på en varm `placera` med 30 skapelser i skogen:

- `placeraNiva` anropas **en** gång. `alla.length` är 30 > `RESERV_MAX` (12) och någon står i stallet (skog 20, grotta 17), så `placera` returnerar `tatast` direkt.
- Grenden `for (const v of steg)` körs **inte** i prestandaprovet.
- Coverage, en varm skog-noshörning: `varst` 3832, `underlag` 2485, `kroppMatt` 2452, `dekorSkymd` 1882, `dekorSat` 1882, `sok` några tiotal. Det är ett svep per djur tills första fria ruta, inte 30 × 2000 rutor.

`--trace-gc` under samma fem nya djur: ung-GC (scavenge) var 3–5:e millisekund. Högen växer från ~10 MB till ~70 MB över de fyra platserna och släpps inte. `user` ≈ väggklocka, utom när en stor GC sammanfaller med provet (dinosaurie i skogen 57 ms, prover med 86–120 ms).

Per anrop, mikro (vägg / CPU):

| anrop | skog | grotta |
|---|---|---|
| `torrKropp` | 1,3 / 2,8 µs | 4,5 / 10 µs |
| `dekorSkymd` | 1,2 / 2,5 µs | |
| `sakRuta` | 1,8 / 2,8 µs | |
| `kroppMatt` | 1,7 / 2,9 µs | |

Grottans underlag är dyrast. `dekorSat` nycklas med en ny sträng `` `${id}|${z4}` `` vid varje träff. `underlag` nycklas med en ny sträng per ruta. `satMinne` töms vid 400 nycklar (fyra platser × z-värden når taket) och `underMinne` vid 400. Töms det inne i ett tidtaget anrop räknas hela kartan om, och GC-trådarna följer med i CPU-tiden. Det är skogens 51 ms i hela filen mot ~30 ms när högen ännu är liten.

## Ett ord på en full plats (`laggPaAng`)

Tolv ord som i beslut B, CPU:

| plats | ord 8 | ord 9 | ord 10 | ord 11 | ord 12 |
|---|---|---|---|---|---|
| äng | 36 | 65 | **68** | 0,1 | **0,1** |
| sjö | 32 | 50 | **55** | 0,1 | **0,1** |
| skog | 23 | 23 | **38** | 0,1 | **0,1** |
| grotta | 10 | 14 | **34** | 0,1 | **0,1** |

Ord 11–12: taket (`TAK_PER_PLATS` 10) söver den äldsta och `somnaEn` hoppas över. `placera` anropas inte. Redan 12 vakna och ett nytt ord på ängen: **0,11 ms**.

Ord 10 är sista ordet som går genom `somnaEn` → `placera`. Sjön, coverage: **`placeraNiva` 7 gånger** (listan ≤ 12 och någon saknar ruta i den tätaste, så sökningen mot noll och/eller `vandra.steg` körs). Det är hacket, inte ord 12.

## Åtgärd mätningen pekar på

Billigast, samma `Lage`:

1. Nyckla om `satMinne` och `torrMinne` utan ny sträng per ruta. Rensa `satMinne`, `underMinne` och `torrMinne` när platsen byts, inte mitt i ett anrop när en räknare slår i taket.
2. I `sok`: hoppa över rader som ligger helt utanför bild när de inte kan vinna, räkna krock och bildkant före `underlag` när rutan ändå kastas, och avbryt skymningsloopen när kostnaden inte längre kan slå bästa stallrutan. `dekorSkymd` räknar kropp och huvud i samma svep (en `dekorSat`).
3. Röra inte prov, data, `Spel.tsx` eller `src/tolk`. Inte sätta `stall: false` på en ruta med kostnad över noll.
