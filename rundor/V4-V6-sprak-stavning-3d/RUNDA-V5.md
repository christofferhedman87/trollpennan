# Rapport Runda V5 — Bredare mobiltangentbord, fonetisk stavning och maskerad ledtråd

## Sammanfattning
- **Tangentbord:** Bokstavstangenterna på de två första raderna är 33×44 px på 375×812. `ABC`/`abc` (`data-v5="skift-knapp"`) växlar versaler. Tangentbordet är synligt så fort Pennans bok är i skrivläge, också när stavningskortet visas.
- **Fonetisk stavning:** `stavningsFeedback` ger `typ: "ljud"` när `ljudStam` är lika (`tjykling` → `kyckling`, `sjöldpadda` → `sköldpadda`, `järta` → `hjärta`). Dubbelkonsonant vinner före ljud, så `kat` → `katt` är fortfarande `dubbel`. Texten kommer ur `stavning.ljud_mall`.
- **Ord i fras:** `bytOrd` byter bara det matchade ordet, skiftlägesokänsligt (`en röd kat` → `en röd katt`, `Kat` → `katt`).
- **Ledtråd:** När `gata_latt` saknas maskeras sista stavelsen med `_`. Steg 1 och 2 skriver aldrig ut hela målordet.

## Rader
| Fil | Rader |
|---|---|
| `data/lasning.json` | 62 |
| `src/spel/lasniva.ts` | 155 |
| `src/spel/ui/BokSkarm.tsx` | 371 |
| `src/spel/ui/BokSvar.tsx` | 80 |
| `src/spel/ui/bok-p1.css` | 87 |
| `src/spel/ui/hjalp.ts` | 293 |
| `src/spel/v5.test.ts` | 83 |
| `src/spel/Spel.tsx` | 49 (orörd) |

## Prov
- `prov-v4-v6.mjs --snabb --del 5` och `--del 4`: gröna.
- `prov-v1-v3.mjs --snabb --del alla` och `prov-p4.mjs --snabb --del alla`: gröna.
- Skärm 375×812, del 5: 22 bokstavstangenter, min 33×44 px, skiftknapp finns. Efter `en röd kat` + Väck! syns `[data-v5="stavning-kort"]` och `.tangenter` (höjd 176 px, underkant 810). Idéfliken: 0 knappar med högerkant över 375,5.
- Skärm 375×812, del 3: bokens överkant 268 px, 6 ordkort helt ovanför skrivrutan, inga avklippta idéchips.
- `npm run test:product`: 435 prov, 0 fel. `typecheck`, `typecheck:pages`, `eslint` och `check:struktur` (174/179 `data-testid`) gröna.
