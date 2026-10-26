# Runda V8b — Placerings- och siktlösare på 375×812

## Sammanfattning

Småsaker (`boll`, `apple`, `svamp`, `stjarna`, `nyckel`) står i fri siktlinje: minst 40 px på längsta sidan, minst 40 px mellan centra och 0 % överlapp. Den nyaste byggnaden i följden `slott → hus → torn → koja` står lika långt fram som eller framför de äldre, och skyms högst 10 %. Sjukhuset i 10-ordssekvensen skyms 5,8 %. Den röda tröjan täcker 34,4 % av kaninen, 25,4 % av katten, 28,0 % av hunden och 38,5 % av räven.

Inga röstfiler. `Spel.tsx` är orörd (49 rader).

## Ändringar

- `data/storlek.json`: `smasak.ids` är boll, apple, svamp, stjärna och nyckel. Målhöjdsintervallet är `[0.25, 0.5]`. `skalaFor` läser bara intervallet, så svamp (målhöjd 1,2) behåller sin 3D-skala.
- `src/spel/entiteter.ts`: `arSmasak` är sann för listade id eller för en sak vars målhöjd ligger i intervallet.
- `data/placering.json`: `smasak_min_px` 40, `smasak_center_px` 40, `byggnad_max_skymd` 0,1.
- `src/spel/placering.ts`: en grupp som bara är småsaker får skymningsgräns 0, står aldrig bakom HUD eller dekor, och ratas om centra är närmare än 40 px eller rutorna överlappar. Storlekskravet är längsta sidan av kärnan, minst 40 px. Nyaste byggnaden och sjukhuset får gräns `byggnad_max_skymd − sakerhet` (0,06), så mätt skymning stannar på högst 10 %. En äldre byggnad får inte hamna närmare kameran än den nyaste.
- `data/plagg.json`: gruppen `troja` har skala 1,48, djupskala 3,4, upp −0,06 och fram 0,78. `plagg.troja` pekar på gruppen, så värdena förblir strängar och `p3b2.test.ts` typkontrollerar utan ändring.
- `src/spel/tillbehor/faest.ts`: när `djupSkala` finns får plagget vara upp till 0,85 av höjden och djupare i z. Övriga plagg behåller det gamla måttet, så klänning och jacka sitter kvar inom P3b-2.

## Prov

- `node --experimental-strip-types rundor/V8a-V8b-skapelser-och-placering/matt/prov-v8.mjs --snabb --del alla`: `del1.ok` och `del2.ok` är sanna.
- `node --experimental-strip-types --test src/spel/v8b.test.ts src/spel/p3a.test.ts src/spel/p3.test.ts src/spel/p3a-matt.test.ts src/spel/tillbehor/p3b2.test.ts`: 23/23 gröna.
- `npm run test:product`: 447/447 gröna.
- `npm run typecheck`, `npm run typecheck:pages`, `npx eslint .` (0 fel, 6 befintliga hook-varningar) och `npm run check:struktur` gröna.
