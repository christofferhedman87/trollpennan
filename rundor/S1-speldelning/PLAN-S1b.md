# PLAN S1b

`<BAS>` = `c13dc28` (main före S1a). Ordagrant-provet och `dag-s1.mjs` läser `Spel.tsx` där.
`<BAS-B>` = `ccd458e` (main efter S1a, HEAD vid start). Skärm, DOM och röst jämförs mot mätningarna från den.

`dag-s1.mjs` på `<BAS>`, efter `grupper-extra.json`:

```text
dag-s1: 192 satser, 0 framåt, 0 utan grupp
```

Flyttordning, en commit per steg på `runda-s1b-kod`. Kropparna kopieras med `s.getText()` (bara första radens indrag återställs). Ingen prettier, ingen omskrivning. Enda tillåtna textändringen i en flyttad sats är `import("./starta.ts")` → `import("../starta.ts")` i steg 9.

| Steg | Fil | Vad som flyttas |
|---|---|---|
| 8 | `src/spel/styr/useGard.ts` | `forsokKop`, `bekraftaKop`, `flyttaInDjur`, `borjaOm`, `sparaKopia`, `lasFil`, `lasInKopia`. `Gard` läggs i `SpelKarna`. |
| 9 | `src/spel/styr/useHandelser.ts` | `paHandelse.current`, `visaOnskaRef.current`, lyssnareffekten. |
| 10 | `src/spel/styr/useKlocka.ts` | Dygnseffekten, inklusive `eslint-disable`-kommentaren om dygnsklockan. |
| 11 | `src/spel/styr/useSkriv.ts` | Skrivfunktionerna och de tre effekterna (bok, gåvoläge, tangentbord) i den ordningen. `Skriv` läggs i `SpelKarna`. |
| 12 | `src/spel/styr/trollApi.ts` | `const api = { … }` och `declare global`. Effekten med `window.__troll = api` stannar i `Spel.tsx`. |
| 13 | `src/spel/styr/useAvBro.ts` | `avHand.current` och `avBro.lyssna`. |
| 14 | `src/spel/styr/useVyData.ts` | `--duk`-effekten, de härledda värdena och `stallKanin`. `VyData` läggs i `SpelKarna`. |
| 15 | `src/spel/ui/SpelKontext.ts`, `vyer.ts`, `SpelVy.tsx` | JSX:en flyttas oförändrad, med `<VyPlats plats="scen" />` efter `HudBot` och `<VyPlats plats="over" />` efter `AlbumVy`. `VYER` är tom. `Spel.tsx` blir bara krokanrop, `__troll`-effekten och providern. |
