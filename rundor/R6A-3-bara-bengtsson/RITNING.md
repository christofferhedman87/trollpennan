# R6A-3 – Bara Bengtsson ger uppdrag, logiska förslag, riktigt tangentbord (R6A-3B)

Status: kod klar och bevisad i scratch (`ref/`), väntar på Doodle. Ordning: `r6a-3-1.patch`, sedan `r6a-3b-2.patch`.

## Mål (Christoffer 2026-10-18)
1. **Bara Doktor Bengtsson ger uppdrag.** Djurens uppdragslappar och djurens önskebubbla pekar på honom, via data.
2. **Logiska förslag.** Under ett uppdrag visar knapprad, "Prova en idé" och skrivhjälpen uppdragets egna förslag (regn: tält, grotta, träd, stuga), inte `rosa drake`/`liten katt`.
3. **Allt som guidas har modell.** Bevisskript kontrollerar det; saknad modell listas till Modellspanaren.
4. **Tangentbordet** blir svensk QWERTY ur data, rader som fyller bredden (R6A-3B).

## Lösning (data först, minimal kod)
| Del | Data | Kod |
|---|---|---|
| Lappar | `data/skyltar.json`: åtta rader med `startar` får `givare: "bengtsson"`, `text_bengtsson` (utkast), `granskad: false`. Originaltexterna orörda (hash-test). | `skyltText()` i `aventyr.ts`, `lasSkylt` i `avflode.ts` väljer texten. **Phaser rörs inte** (skyltarna ritas av Phaser; texten kommer från samma funktion som läser dem). |
| Önskebubbla | `data/firande.json` `onskan`: nya mallar `fran_bengtsson` ("Doktor Bengtsson: Ett djur säger ”{text}” Kan du hjälpa?"), `fran_bengtsson_djur`, `knapp_bengtsson` ("Hjälp till"). De 42 önskningarna i `onskningar.json` är orörda. | `AngLager.tsx` (bubblan) och `BokSkarm.tsx` (3 ställen) använder mallen via `fyll()`. |
| Förslag | `data/bengtsson.json`: `val: { rubrik, grupper: [{ etikett, forslag: [{ ord, fras, agg? }] }] }` per skrivuppdrag. `krav.ord` utökat med `luva`, `stuga`. | `UppdragsRemsa.tsx` ritar en rad knappar (vågrät rullning, 375 px); "Prova en idé" i `BokSkarm.tsx` tar uppdragets fraser när uppdraget har `val`. Fritext kvar. |
| Tangentbord | `data/tangentbord.json`: rader, `{radera}` och `{mellanslag}` | `BokSkarm.tsx` renderar raderna; `styles.css`: `.rad` nowrap, `.tangent` `flex:1 1 0; min-width:0`. |

Orsak till det ojämna tangentbordet: `min-width:44px` + `flex-wrap` gjorde att 11 tangenter inte fick plats (11×44 > 363 px) och bröts på nya rader.

## Förslag (alla med modell, `forslag-prov.ts`: 14 av 14)
- kanin fryser: mössa, tröja, luva / lägereld, stuga
- regn: tält, grotta, träd, stuga
- sol: keps / träd, moln, tält, grotta

**Modellbehov (naturliga förslag utan modell) → `modellbehov.tsv`, till Modellspanaren:** paraply, regnrock, stövlar, tak, hatt/solhatt, parasoll, filt, kappa, halsduk, jacka, kamin. När en modell finns läggs förslaget in som en datarad i `val` (ingen kod).

## Bevis (alla gröna i scratch med båda patcharna)
`forslag-prov.ts` (modell + `kravUppfyllt` + `skapad` per förslag), `val-prov.mjs` (klick på Bengtsson, tryck på "mössa", Vakna, uppdrag klart, fritext på nästa, bara Bengtsson som givare), `tangent-prov.mjs` (375×812: rader `q…å / a…ä / z…m ⌫ / mellanslag`, varje rad fyller 363 px, höjd 48 px, å/ä/ö/mellanslag/backsteg skriver), `typecheck:pages`, `test:product` 107/0, `build:pages`. Bilder: `docs/skarmbilder/r6a3/efter/`. `skriv()` i `klicka-prov.mjs` (R6A-2) använder skärmtangenten för å/ä/ö (alla tre).

## Gränser och risker
- Bokstavstangenter är 29 px breda (11 på en rad i 363 px), 48 px höga. Standard för mobiltangentbord, under 44 px på bredden. Säg till om de ska ha större yta.
- **Önskebubblan är inte bildprovad** (bubbelns bredd är 180 px och texten blir längre): Doodle kör `r1-dom-tur.mjs` lägena `onska` och `onska-bok` och tar nya baslinjebilder.
- De 8 `text_bengtsson` och förslagsfraserna är utkast (`granskad: false`): Copilot granskar genus/ordval.
- Mossas dagliga uppdrag (24 utkast) ligger i R6A-4.

## Stoppregel
Commit + rapport senast tur 12 av 20. Rör inget Copilot-granskat. Går bubblan inte att få läsbar i 375 px: lämna mallarna orörda och rapportera.

## Kostnadsgissning
Doodle: ca 10–14 turer (applicera två patchar, bygga, köra tre bevis, bubbelbild + nya baslinjer). **Grind-dom: GO** (utan Christoffers ja för koden; ja behövs bara för orden i `text_bengtsson`/`val` om han vill granska tonen och för punkten om tangentbredd).
