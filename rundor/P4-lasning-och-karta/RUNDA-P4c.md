# RUNDA P4c — Olåst karta och meny

Gren: `runda-p4c-kod`.

Ängen, Skogen, Sjön, Grottan och Gården är öppna direkt från start. Kartan, grinden och ett skrivet platsnamn (även «gården») reser dit med 0 skapade djur. I menyn öppnar Gården, Byggboken, Albumet och Bok sina vyer direkt. Inget hänglås och ingen `data-last="ja"` syns.

`upplast()`, `forstaUpplasta()` och `bytPlats()` är oförändrade. På en tom sparning är skogen fortfarande låst för dem. Resan går via `kanResaTill` och `oppnaPlats`.

Inga nya `.mp3`. Inga anrop till ElevenLabs eller `scripts/rost-generera.mjs`. Inga befintliga testfiler är ändrade. Inga nya eller borttagna JSX-`data-testid`. `src/spel/Spel.tsx` är orörd på 49 rader.

## Filer (`wc -l`)

Alla nya och ändrade kodfiler är ≤ 400 rader. `src/spel/minne.ts` är 392 rader.

| Fil | Rader | Roll |
|---|---:|---|
| `data/platser.json` | — | `olast_karta: true`; upplåsningsregler kvar |
| `data/meny.json` | 13 | ny: gård, byggbok, album, ordbok med flera öppna |
| `src/spel/platser.ts` | 128 | `OLAST_KARTA`, `kanResaTill` |
| `src/spel/minne.ts` | 392 | `oppnaPlats`; `bytPlats` orörd |
| `src/spel/minneSparning.ts` | 290 | `oppnaPlats` sparas inte |
| `src/spel/ui/usePlats.ts` | 100 | resa, grind till skogen, «gården» |
| `src/spel/styr/useAventyr.ts` | 168 | `tillGard` |
| `src/spel/ui/KartaLager.tsx` | 66 | öppna knappar via `kanResaTill` |
| `src/spel/ui/Hud.tsx` | 265 | menyn styrs av `meny.json` |
| `src/spel/ui/SpelVy.tsx` | 133 | album och ordbok |
| `src/spel/styr/trollApi.ts` | 315 | `tillstand().plats` och `plats()` |
| `src/spel/p4c.test.ts` | 51 | ny |
| `package.json` | — | `p4c.test.ts` sist i `test:product` |
| `src/spel/Spel.tsx` | 49 | orörd |

## Prov

| Kontroll | Resultat |
|---|---|
| `prov-p4.mjs --snabb` (alla) | exit 0, `ok: true`, 0 fel |
| `prov-p4.mjs --del 3` (375×812) | exit 0, 0 låsta menyknappar, 0 låsta platser, klick på Grottan ger `plats: grottan`, 0 sidfel |
| `prov-p4.mjs --del alla` (375×812) | exit 0, Lyssna 112×44, stavningstips synligt, karta och meny olåsta, 0 sidfel |
| `npm run test:product` | exit 0, 417 prov, 0 fel |
| `npm run typecheck` | exit 0 |
| `npm run typecheck:pages` | exit 0 |
| `npx eslint .` | exit 0, 0 fel (6 befintliga hook-varningar) |
| `npm run check:struktur` | GRÖN: `Spel.tsx` 49 rader, 174 unika `data-testid`, 179 förekomster |
| `npm run build:pages` | exit 0 |

`src/spel/p4c.test.ts` täcker `OLAST_KARTA`, `kanResaTill` för ängen, skogen, sjön och grottan vid 0 djur, `kanResaTill("finns-ej") === false`, att `upplast("skogen")` fortfarande är false, att `oppnaPlats("grottan")` sätter plats och `oppnadePlatser`, att `bytPlats("skogen")` efter `aterstall()` är false, att `forstaUpplasta` är null, och att `meny.json` öppnar gård, byggbok, album och ordbok utan hårdkodat `data-last="ja"` i `Hud.tsx`.

Första gången kartan öppnas ligger den gamla hjälptexten kvar («Skogen öppnas när du har skapat tre djur»). Knapparna själva är öppna. Texten sitter i röstdata och är inte bytt i den här rundan.

0 ändrade befintliga `*.test.ts`. 0 ändrade `.mp3`.
