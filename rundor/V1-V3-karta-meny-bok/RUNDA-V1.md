# Runda V1 — Världskartan

Sagbokskarta med fem platser: Ängen, Gården, Glittrande skogen, Dimsjön, Kristallgrottan. Vandringsstig, »📍 Här är du nu», tre ordbrickor per plats, stäng (×) och Lyssna. Inga nya eller ändrade mp3. `data/rost.json` och `data/rost-manifest.json` orörda. `Spel.tsx` orörd (49 rader). Inga V2/V3-filer rörda.

## Ändrade filer (radantal)

| Fil | Rader |
| --- | ---: |
| `data/platser.json` | 1491 |
| `data/omraden.json` | 82 |
| `src/spel/ui/KartaLager.tsx` | 277 |
| `src/spel/ui/karta-v1.css` | 163 |
| `src/spel/ui/SpelVy.tsx` | 133 |
| `src/spel/ui/Hud.tsx` | 265 |
| `src/spel/minneSparning.ts` | 290 |
| `src/spel/styr/useVarld.ts` | 120 |
| `src/spel/__tests__/varldskartaV1.test.ts` | 53 |

`varldskarta` är en ny nyckel. `start` och `platser` i `platser.json` är orörda. I `omraden.json` ändrades bara `karta.rubrik` och `karta.hjalp`. `introSett` accepteras i sparningen. Menyns `data-testid="meny-knapp"` sätts med `setAttribute`, så JSX-räkningen är oförändrad.

## Prov

- `prov-v1-v3.mjs --del 1`: ok, 0 sidfel, 0 fel. Stäng 44×44, Lyssna 102×44, stig synlig (91 px hög), 5 illustrationer, 15 ordbrickor, markören »📍 Här är du nu». Ingen förbjuden låstext. Illustrationen överlappar inte brickor eller lockelsetext.
- `npm run check:struktur`: GRÖN. `data-testid` 174 unika / 179 förekomster. `Spel.tsx` 49 rader.
