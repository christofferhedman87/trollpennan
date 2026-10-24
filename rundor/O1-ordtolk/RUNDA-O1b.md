# RUNDA O1b

## Slut
- `o1b.test.ts` 10/10.
- `o1a.test.ts` 89/89.
- `test:product` 377/377, 0 röda.
- `kannetecken-fyll --check` ok. 345 djur, 53 kurerade ifyllda.
- `matt.ts`: `{ kelly: 7942, kellyTraff: 0, djur: 94, djurTraff: 0 }`.
- `fel_djur` { kelly: 0, djur: 0 }.
- `ratt_behallna` 22 av 22.

## Gjort
- `data/kannetecken.json` har en rad för varje djur. De 53 (vanligaste 50 plus enhörning, zebra och noshörning) har beskrivning och minst ett kännetecken. Mullvad och övriga har tom rad, så reservvägen via `entiteter.json` finns kvar.
- "X blandat med Y", "en blandning av X och Y" och "hälften X hälften Y" ger A:s kropp med B:s kännetecken. Repliken blir till exempel "En noshörning med enhörningens horn och vita färg!". Blandorden blir aldrig ägg. Ett okänt B blir ett enda ägg.
- `enhörningsnoshörning` läser samma tabell. Formeln stannar "en enhörningsnoshörning". Fågel, fisk och drake lånar bara vingar eller fenor, så gamla sammansättningar ser ut som förut.
- Två kända djur anropar `noteraSaknade` och lämnar `varelse.reserv` tom.

## Prov
`o1b`, `o1a`, `test:product`, `typecheck`, `typecheck:pages`, `eslint`, `check:struktur` och `build:pages` är gröna. Ny testfil är `src/tolk/o1b.test.ts`. Inga befintliga testfiler eller `data/test-fraser*.json` är ändrade mot `8eaec12`.
