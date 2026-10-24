# R1 Röstens takt – plan

Bas: `47f8228` på grenen `runda-r1-kod`. Inga befintliga testfiler, `intro.tsx` eller `ljud.ts` rörs. Ingen ny röstfil.

## Steg

1. **Data.** `data/rost-takt.json` med `oombedd_mellan_ms: 10000` och källtabellen. En rad i `CREDITS.md` (inspiration, ingen kod).
2. **Rött prov.** `src/spel/rostKo.test.ts` läser `provfall-r1.json` och `data/rost-takt.json` (inga egna takttal) och kör de 6 fallen med falsk klocka. Läggs i `test:product`. Commit innan `rostKo.ts` finns, så provet är rött.
3. **Kön.** `src/spel/rostKo.ts`: prioritet, bäst-före, dubblett, en belöning per handling, tak, vänta på svar (1,5 s), oombedd takt (10 s, +15 ms i webbläsaren), guide/info (tystnad, första handlingen eller 20 s), avbrott bara nedåt, nyckel bränns vid start. `sag` / `tystna` / `bannerKlocka` stannar i `rost.ts` (tts3fix). `useRostBannrar` och `useRostBubblor` tas bort. Spelaren `spelaUpp` loggar hörda rader; guide/info får `fodd = max(anmälan, redo)` så (D) håller.
4. **Omkoppling.** `Spel.tsx` prenumererar, `bannerKo` försvinner, hej anmäls direkt i `hanteraDjur`, `handling()` på väckning och tryck. `Coach`, `Ledtradsyta`, `UppdragsRemsa` och önskan anmäler till kön och `stryk` i cleanup. Introt lämnas stängt; `oppna()` släpper kön och släpper inte introts belöning efteråt.
5. **Grönt.** Snabbprov, `test:product`, typecheck, eslint, `check:struktur`, `Spel.tsx` ≤ 1 842 rader, diff mot tester = 0. Sedan `build:pages` och `takt.mjs` (A–D, slutkod 0). `RUNDA-R1.md` och `RUNDA.md` med före/efter.

## Val

- `oppna()` tömmer köade svar, belöningar och följdrader från introt och nollställer handlingstiden, så guiden väntar på något barnet gör efter introt (eller 20 s).
- Under introt registreras inte guld/stjärnor (`belona` väntar), så "en katt" efter introt fortfarande får en belöning.
- Hörda guide- och inforader loggar `fodd` vid den tid de blev spelbara, inte vid anmälan.
