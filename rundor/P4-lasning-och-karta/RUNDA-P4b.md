# RUNDA P4b — Läsnivåer, ledtrådstrappa och stavningsåterkoppling

Gren: `runda-p4b-kod`.

Gåtorna följer tre läsnivåer. **Auto** börjar på nivå 1 och öppnar nivå 2 vid 3 funna djur och nivå 3 vid 8. En vuxen kan låsa Auto, Nivå 1, Nivå 2 eller Nivå 3 under För vuxna. Ledtråd i gåtboken visar fler bokstäver i två tryck, en enklare ledtråd och ljudstöd för början. Hela ordet avslöjas aldrig: minst ett `_` finns kvar. När barnet skriver nästan rätt, till exempel `kat` för `katt`, markeras det rätta prefixet i grönt och tipset säger om det är dubbelteckning, en saknad bokstav eller omkastade bokstäver.

Inga nya `.mp3`. Inga anrop till ElevenLabs eller `scripts/rost-generera.mjs`. `src/spel/gata.ts` är orörd. Inga befintliga `*.test.ts` är ändrade. Inga nya eller borttagna JSX-`data-testid` (ankarna `bok-flik-skriv`, `ord-input` och `vack-knapp` sätts med `ref`). `src/spel/Spel.tsx` är orörd på 49 rader.

## Filer (`wc -l`)

Alla nya och ändrade kodfiler är ≤ 400 rader. `src/spel/lasniva.ts` är 149 rader.

| Fil | Rader | Roll |
|---|---:|---|
| `data/lasning.json` | 61 | `lasniva`, `ledtrad`, `stavning`; P4a-fälten kvar |
| `src/spel/lasniva.ts` | 149 | ny: nivå, urval, stavelser, ledtrådssteg, stavning |
| `src/spel/minne.ts` | 383 | `lasnivaVal`, `sattLasniva` |
| `src/spel/minneSparning.ts` | 289 | standard `"auto"`, läser 1–3, sparar inte metoden |
| `src/spel/ui/Ledtradsyta.tsx` | 117 | nivåurval, trappa, `data-p4` för ledtråd |
| `src/spel/ui/BokSvar.tsx` | 80 | grönt prefix och förklaring under Menade du |
| `src/spel/ui/BokSkarm.tsx` | 385 | skrivankare via `ref` |
| `src/spel/ui/ForalderDialog.tsx` | 182 | Auto och nivå 1–3 |
| `src/spel/ui/bok-p1.css` | 42 | stavning, ledtråd, dolt skrivankare |
| `src/spel/p4b.test.ts` | 141 | ny |
| `package.json` | — | `p4b.test.ts` i `test:product` |
| `src/spel/Spel.tsx` | 49 | orörd |

## Prov

| Kontroll | Resultat |
|---|---|
| `prov-p4.mjs --snabb --del 2` | exit 0, `ok: true`, 0 fel |
| `prov-p4.mjs --snabb --del 1` | exit 0, `ok: true`, 0 fel |
| `prov-p4.mjs --del 2` (375×812) | exit 0, `stavningTipsSynlig: true`, 0 sidfel |
| `prov-p4.mjs --del 1` (375×812) | exit 0, Lyssna-knappen 112×44 px, 0 sidfel |
| `npm run test:product` | exit 0, 414 prov, 0 fel |
| `npm run typecheck` | exit 0 |
| `npm run typecheck:pages` | exit 0 |
| `npx eslint .` | exit 0, 0 fel (6 befintliga hook-varningar) |
| `npm run check:struktur` | GRÖN: `Spel.tsx` 49 rader, 174 unika `data-testid`, 179 förekomster |
| `npm run build:pages` | exit 0 |

`src/spel/p4b.test.ts` täcker alla 35 ord i `facit-p4.json`, auto-trappan för 0, 2, 3, 7 och 8 funna djur, manuellt val, både lista och objekt till `aktuellLasniva`, `lasnivaUrval` på ängen, skogen, sjön och grottan, `ledtradsSteg` för `kattunge`, `räv` och `ko` (alltid minst ett `_`), `delaStavelser` (`kapybara`, `kattunge`) och `stavningsFeedback` för `kat`/`katt`, `pada`/`padda`, `kani`/`kanin` och `kanni`/`kanin`, samt `sattLasniva` och `franSparning`.

Skärmprovet på valp (nivå 1): steg 1 visar `V A _ _` och den lätta ledtråden, steg 2 visar `Lyssna på början: V – A.` och döljer Ledtråd-knappen. `kat` ger `Menade du katt?` med `kat` i grönt och texten `Nästan! I katt hörs två T.`

0 ändrade befintliga `*.test.ts`. 0 ändrade `.mp3`.
