# Runda V8a — Rika skapelser utan tyst radering

## Sammanfattning

Ängen rymmer 16 synliga djur (`MAX_SYNLIGA_DJUR`). Skogen, sjön och grottan behåller `TAK_PER_PLATS = 10`. Den 17:e katten flyttar den äldsta till stallet, och barnet hör: «Ängen är full! Den äldsta flyttade in i stallet så du kan hälsa på den där.» Antal 1–10 fungerar både som ord (`tio katter`) och siffror (`10 hundar`, `1 katt`). En mening med två egna djur och `och` skapar båda. Mössa på en frysande kanin uppdaterar den kaninen i stället för att skapa en dubblett.

`src/spel/stall.ts` är oförändrad. Inga nya ljudfiler.

## Ändringar

- `src/spel/platser.ts`: `MAX_SYNLIGA_DJUR = 16`. `TAK_PER_PLATS` är kvar på 10.
- `src/spel/minne.ts` och `src/spel/minneSparning.ts`: ängen använder 16 i `laggPaAngSpar`, `kallaHitSpar` och `tillLada`. Övriga platser går fortfarande via `laggMedTak` med tak 10.
- `src/spel/placering.ts`: `RESERV_MAX = 16`. När fler än 10 djur står på platsen och varje äldre djur i samma budget är nere på sista `reserv_krymp` (0,25) somnar den äldsta, högst en. Sexton vanliga katter (äldre oftast på 0,35) stannar vakna. Tolv tunga djur i p3a somnar ett.
- `data/ord.json`: `antal_tak` är 10. `repliker.sover` är en sträng utan ordet «ängen», så `r9k` och `rost2` slipper en ny mp3. `src/tolk/data.ts` sätter ihop den fulla meningen i `ORD.repliker.sover`.
- `src/tolk/typer.ts` och `src/spel/replik.ts`: `sover` får vara `string | string[]`.
- `src/tolk/lexikon.ts`, `src/tolk/tolka.ts`, `src/tolk/reserv.ts`: siffrorna 1–10 överlever tokeniseringen. `1` är artikel, `2`–`10` är antal. `data/test-fraser.json`: `tio katter` ger 10.
- `src/tolk/ochMening.ts`: `delaOchMening` delar bara när varje del har ett djur. Blandning, tillbehör, färgpar och verb stannar i en mening. Re-export från `tolka.ts`.
- `src/spel/styr/useSkapa.ts` och `src/spel/styr/mossaKanin.ts`: extra `och`-delar skapas efter den första. Mössa på kanin som fryser, eller uppdraget `kanin-fryser`, uppdaterar den befintliga kaninen via `uppdateraDjur`.

## Prov

- `node --experimental-strip-types --test src/spel/p3a.test.ts`: 9/9 gröna, inklusive «ingen somnade av 12» på ängen.
- `node --experimental-strip-types rundor/V8a-V8b-skapelser-och-placering/matt/prov-v8.mjs --snabb --del 1`: `"ok": true` på ängstak 16, antal 1–10, och-mening och mössa.
- Tidigare i rundan, innan den sista `somnaEn`-justeringen: `npm run typecheck`, `npm run typecheck:pages`, `npx eslint .`, `npm run check:struktur` och `npm run build:pages` gröna. `npm run test:product` hade 446/447 gröna. Det enda felet var `p3a.test.ts:154`, som nu är grönt.
