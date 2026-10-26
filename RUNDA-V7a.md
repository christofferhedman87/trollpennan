# Runda V7a: Kort intro, Hoppa över och skrivläge direkt

Första mötet är ett intro på 7,5 sekunder i tre steg. Knappen **Hoppa över ⏭** syns från start, tryck på överläggen låser upp ljudet och stannar i överlägget, och efter introt öppnas **✍️ Skriv** utan gratisdjur på ängen.

## Ändrade filer

- `data/intro.json` — `"hoppa"` är `"Hoppa över ⏭"`. Nyckeln `"v7a"` har `"langd": 7.5` och tre scener (0 s, 2,4 s, 4,8 s). `scener` (12 poster) och `skriv` är oförändrade.
- `src/spel/intro.tsx` — visningen läser `v7a` och slutar vid 7,5 s. `rostIntro(12)` laddar fortfarande `/ljud/rost/c435a58d.mp3`. Överlägget och hoppa-knappen anropar `stopPropagation()` och `ljud.lasOpp()`. Befintliga `data-testid` sitter kvar. Nya ankare är `data-v7a`.
- `src/spel/intro.css` — `.intro` tar emot tryck. `.intro-hoppa` är minst 44×44 px.
- `src/styles.css` — `.intro` har `pointer-events: auto`, så tryck inte går igenom till ängen.
- `src/spel/ui/Titel.tsx` — titelskärmen och knapparna Börja / Fortsätt stoppar klick och låser upp ljudet.
- `src/spel/ui/SpelVy.tsx` — `stallKanin()` anropas inte. När introt tar slut: `setPanel("spel")`, `setLage("skriv")`, `setBokOpp(true)`.
- `src/spel/v7a-intro.test.ts` — nytt enhetsprov. Inga befintliga `*.test.ts` är ändrade. Inga nya eller ändrade `.mp3`.

`Spel.tsx` är orörd (49 rader). Alla ändrade kodfiler är under 400 rader.

## Testresultat

1. `node rundor/V7a-V7b-intro-och-gard/matt/prov-v7.mjs --snabb --del 1` → `"ok": true`
2. `npx tsx --test src/spel/v7a-intro.test.ts src/spel/rost.test.ts src/spel/p2.test.ts src/spel/p22.test.ts` → 23 prov, 23 gröna
3. `npm run check:struktur` → GRÖN (174 olika `data-testid`, 179 förekomster, 31 filer i `src/spel/ui/`)
   `npm run typecheck` → grön
   `npx eslint .` → 0 fel (6 befintliga varningar i andra filer)
4. `node rundor/V7a-V7b-intro-och-gard/matt/prov-v7.mjs --del 1` → `"ok": true` i 375×812
   - Hoppa över ⏭: `data-v7a="hoppa-over"`, 140×46 px
   - efter hoppa: skrivrutan öppen, 0 djur på ängen, 0 sidfel
