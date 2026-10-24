# RUNDA O1a-2

## Gjort
- Kapybaran via bulk R3F-M29 (`6f6c112`): `malhojd` 0,7, CC0 Gamideo, 512²-textur, NST kvar efter `<!-- R3C:end -->`.
- Former (`133e8b5`): kanariefågel, morbror/storebror/lillebror, storasyster/lillasyster.
- Regeln (`332e9fb`): suffix ≥ `min_suffix`, känt förled, inte längre efterled. Riktiga ord blir ägg, inte stavningsdjur (`storm` är inte stork).
- Repliken (`5624c02`): känd förledsbit som inte är hela ordet tystas. `en` och `mål` ger ingen banner.
- Måttet skriver `fel_djur` och `ratt_behallna`.

## Inte klart
- `fel_djur` är inte 0. Kvar: Kelly `barnbarn` → barn, djurlistan `sjöhäst` → häst och `måsfågel` → fågel. Alla tre är känt förled plus efterled och står inte som `ratt` i facit. `sjöhäst` måste förbli en häst (gammalt prov).
- Slutgrindarna är inte körda här: `test:product`, `typecheck`, `typecheck:pages`, `eslint`, `check:struktur`, `build:pages`, genomspelning.
- `suffixfel.tsv` följde med i `5624c02` och har bara rubrikraden (traff är 0). De gamla raderna finns i föräldern.

## Måttet
Före `913f135`: `kellyTraff` 69, `djurTraff` 6, `fel_djur` Kelly 50, djurlistan 3.
Efter: `kellyTraff` 0, `djurTraff` 0, `fel_djur` Kelly 1, djurlistan 2, `ratt_behallna` 22 av 22.

## Prov
Snabbprov: 137 gröna, 0 röda (`o1a`, `tolk`, `bygg`, `gavo`, `entiteter`).
`o1a.test.ts` är oförändrad. `entiteter.test.ts`, `test-fraser*.json` och `Spel.tsx` är orörda.

## Tre svagaste ställen
1. Repliken är inte ”bara hela ordet”. `blixt` (natur) och `monster` (person) säger fortfarande ”Ordet …”, för de gamla proven kräver det.
2. `fel_djur` räknar äkta sammansättningar utanför de 22 rätt-raderna. Noll där krockar med `sjöhäst`.
3. `fågelskatt` släpps förbi `langre` ”skatt” bara när vänsterledet är en djurstam. `fotografisk` stoppas av ett teckens överlapp.

## Risker för O1b
- Rör inte `byggFran`. O1b ändrar blandningen, inte den här spärren.
- B6.5 (particip) måste vara kvar, annars blir ”ande” en and.
- `reserv.test.ts` har redan tre röda på main och ingår inte i `test:product`. Laga dem inte i förbifarten.
- `forledKant` i `semantisera` hindrar förslag på NST-ord. Ett riktigt felstavat känt ord blir ägg.
- Ett nytt djurförled kan antingen släppa in ett skatt-ord eller blockera en äkta sammansättning.
