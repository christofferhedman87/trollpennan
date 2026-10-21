# P3a-fix – plan (högst sex steg)

Synlighet i regeln ska vara samma storhet som `window.__idPass`: siluettpixlar i samma kamera och storlek, i stabilt läge (kroppen i vila, inte rutan den vandrar i). Huvud = siluettens övre halva. Kant-träff och HUD-rutor skymmer. `sakRuta`s rutlåda byts mot siluettandel × lådan (`siluett_andel`, `huvud_fyllnad` i `data/placering.json`). Säkerhetsmarginal ≤ 0,04. Dekor från `data/dekor-karta.json` (främsta z per 6 px-cell, z × 4, −128 = ingen) skymmer som i passet. Inget extra pass i spelloopen; kroken räknar bara när provet anropar den. Grind: `import.meta.env.DEV || navigator.webdriver === true`.

## Steg

0. **Mätkrok.** Ny `src/spel/ang/idpass.tsx`: `__idPass(hud)` och `__dekorKarta`. En rad i `src/spel/angen3d.tsx`. Kroppen märks `trollUid` och pålägget `trollDel` i `djur.tsx` så passet kan namnge varje uid (annars finns ingen siluett att mäta). Fasta saker via namn `spokhus`/`grind`. Bygg `dist-pages`, snabbprov frö 0 ska vara rött ungefär som `bevis/skarm-prov-7f89b63.txt`. Commit.

1. **Dekor som data.** `node rundor/P3a-fix/dekor-karta.mjs --dist dist-pages` → `data/dekor-karta.json`. Regeln läser den. Commit.

2. **somnaEn.** `minne.ts`: högst en somnar per nytt ord, den äldsta utan synlig ruta, ur den nyas budget (bak = byggnader, resten = djur). Ingen vaken står utan ruta efter att regeln prövat klart (fortfarande högst en). `avflode.ts` `bliVan` samma regel och sovreplik i sina banners. `Spel.tsx` rad 810: en `visaBanner` per somnad, samma radantal, TTS-3-kö, tyst utan röstfil. Commit. Snabbprov.

3. **Samma mått.** `skymning.ts` räknar siluettnära täckning och dekor (`dekorSkymd`), inte rutlåda. `skarm.ts` om kameran behöver dela projektionen med passet. `placering.ts` + alla siffror i `data/placering.json`: 30 % / 45 %, huvud ≥ 90 %, `sakerhet` ≤ 0,04, vandring `[1, 0.5, 0.15, 0]`, småsak 40 px (platt = längsta ledden), grinden max 10 % skymd, 8 px från kanten. Den nya främst inom zonen; byggnad så långt fram det går utan att ett djur blir utan ruta; vatten/luft utan ruta provar marken. Commit. Snabbprov.

4. **Ritning.** `djur.tsx` simmar/flyger efter rollen och ritar `krymp` > 1. `delat.ts` läser `placeraMedMinne`. `byggnader.tsx` bara om zonen kräver det. `p3a.test.ts`, `p3.test.ts`, `p3a-matt.test.ts` uppdateras, inga fall tas bort. Commit. Snabbprov grönt.

5. **Slut.** `npm run test:product`, `typecheck`, `typecheck:pages`, `eslint`, `check:struktur` en gång. `RUNDA.md` skrivs innan turerna tar slut: det som inte är klart, de tre svagaste ställena, risker.

## Fallback

Hinner inte steg 3–4: leverera grönt snabbprov för grottan och ängen plus somnaEn, budgetar och en banner per somnad. Punkt 4–6 (främst, småsaker, förbjudna zoner) antecknas i `RUNDA.md`.
