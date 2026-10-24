# RUNDA O1a-3

## Slut
- `test:product` 360/360, 0 röda.
- `fel_djur` { kelly: 0, djur: 0 }.
- `ratt_behallna` 22 av 22.
- `o1a.test.ts` 89/89. Facit ligger kvar på 75 rader (53 fel, 22 rätt).

## Gjort
- `langreBlockerar` låter foget höra till vänsterledet när det är en djurstam eller ett sammansättnings-/attributförled. "en regnbågskatt" blir en regnbågskatt. "inkomstskatt" blir ett ägg.
- Kapybaran har en gåta i `ledtradar.json`. "en kapybara" och gåtan pekar på den befintliga neutrala röstfilen `db967993a3539e8c.mp3`. Ingen ny inspelning.
- `matt.ts` räknar bara fel djur när `tolka` har ett okänt led. `barnbarn`, `sjöhäst` och `måsfågel` är äkta sammansättningar och ligger utanför de 75 facitraderna. `matt.ts` skriver inte `suffixfel.tsv`. Filen är återställd från `913f135`.
- `PLAN-O1a2.md` är borttagen.

## Prov
`o1a`, `b6-2`, `r9`, `rost`, `rost2` och `entiteter` är gröna. `typecheck`, `typecheck:pages`, `eslint` och `check:struktur` är gröna. Inga testfiler är ändrade mot `913f135`.
