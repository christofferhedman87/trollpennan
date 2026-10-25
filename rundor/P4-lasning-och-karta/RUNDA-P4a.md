# RUNDA P4a — Uppläsning på tryck och separata ljudreglage

Bas: `e49f5e7`. Gren: `runda-p4a-kod`. Planen ligger i `3fa21a9`.

Barnet kan trycka **Lyssna** på gåtan, uppdraget, önskan och förslagen. Rösten och ljudeffekterna har egna reglage under det befintliga ljudreglaget. `lasUpp` spelar direkt som klass `svar`, även när röstkön är stängd, och samma text kan läsas igen. Inga nya `.mp3`. Inga anrop till ElevenLabs eller `scripts/rost-generera.mjs`. Inga befintliga `*.test.ts` är ändrade. Inga nya eller borttagna JSX-`data-testid`. `src/spel/Spel.tsx` är orörd på 49 rader.

## Filer (`wc -l`)

Alla nya och ändrade kodfiler är ≤ 400 rader.

| Fil | Rader | Roll |
|---|---:|---|
| `data/lasning.json` | 40 | ny: knapptexter, aria, menade-du, bok, karta |
| `data/rost-takt.json` | 23 | `kallor.las_upp = "svar"` |
| `package.json` | 113 | `src/spel/p4a.test.ts` i `test:product` |
| `src/spel/lagring.ts` | 71 | `lasLokalt` läser även `trollpennan-spel` |
| `src/spel/ljud.ts` | 118 | `effektPa()` speglar effektreglaget |
| `src/spel/minne.ts` | 379 | `rostPa`, `effektPa`, `sattRost`, `sattEffekt` |
| `src/spel/minneSparning.ts` | 286 | ny: `tom`, `franSparning`, `arData`, `lasIn`, `spara` |
| `src/spel/rost.ts` | 389 | rösten följer `rostPa && ljudPa` |
| `src/spel/rostKo.ts` | 400 | `lasUpp` |
| `src/spel/rostKoRegler.ts` | 159 | ny: takt, klasser, `tillatenUnderStangd` inkl. `las_upp` |
| `src/spel/styr/useGard.ts` | 119 | effekter följer `effektPa && ljudPa` |
| `src/spel/styr/useHandelser.ts` | 144 | samma effektvillkor |
| `src/spel/ui/Ledtradsyta.tsx` | 88 | `data-p4="lyssna-gata"`; `bok-flik-gator` via ref |
| `src/spel/ui/UppdragsRemsa.tsx` | 53 | `data-p4="lyssna-uppdrag"` |
| `src/spel/ui/BokSvar.tsx` | 67 | `lyssna-forslag` och `lyssna-onska` |
| `src/spel/ui/BokSkarm.tsx` | 372 | `lyssna-onska`; `bok-stang` via ref |
| `src/spel/ui/ForalderDialog.tsx` | 173 | `rost-knapp` och `effekt-knapp`; `ljud-knapp` kvar |
| `src/spel/ui/bok-p1.css` | 34 | `.lyssna-knapp` minst 44×44 px |
| `src/spel/p4a.test.ts` | 154 | ny |
| `src/spel/Spel.tsx` | 49 | orörd |

## Prov

| Kontroll | Resultat |
|---|---|
| `node --experimental-strip-types rundor/P4-lasning-och-karta/matt/prov-p4.mjs --snabb --del 1` | exit 0, `ok: true`, 0 fel |
| `npm run test:product` | exit 0, 407 prov, 0 fel |
| `npm run typecheck` | exit 0 |
| `npm run typecheck:pages` | exit 0 |
| `npx eslint .` | exit 0, 0 fel (6 befintliga hook-varningar, oförändrade) |
| `npm run check:struktur` | GRÖN: `Spel.tsx` 49 rader, 174 unika `data-testid`, 179 förekomster |

`src/spel/p4a.test.ts` täcker `lasning.json`, `kallor.las_upp === "svar"`, att `lasUpp` avbryter lägre prioritet och kan spelas igen, att `sattRost(false)` tystar rösten utan att stänga av effekter, att `sattEffekt(false)` tystar effekter utan att stänga av rösten, att `franSparning({ version: 2, ljudPa: false })` ger `ljudPa`, `rostPa` och `effektPa` som `false`, samt att Lyssna- och reglageknapparna finns som `data-p4`.

0 ändrade befintliga `*.test.ts`. 0 ändrade `.mp3`.
