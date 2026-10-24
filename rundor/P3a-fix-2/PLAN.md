# P3a-fix-2 plan (8 turer)

Skärmen är facit: id-passet (`window.__idPass`) vid 375×812, vandring nivå 0, efter bannerkön. Regelns tal ska vara samma storhet: siluettpixlar ur `sakRuta` × `siluett_andel`, samma `kameraFor`.

## 0. Prov först (rött), commit
- `p3a.test.ts` beslut B: ta bort `flera`. `r.somnade.length <= 1` på varje ord. `iStallet` tomt kvar.
- `skarm-prov.mjs` `bedom`: varje småsak i bild (inte bara den nya) ≥ `smasak_px` 40. Platt (`modellmatt` höjd < ½ bredd) mäts på längsta ledden.
- Nytt i samma fil, varje byggnadsord: nya byggnadens id-pass-`y1` ≥ `y1` för äldre byggnader. `sakRuta` på `kameraFor`: nederkanten högst ett `steg.z` bakom bandets främsta rad. Annars failtext med djurets namn (markdjur i samma x inom `bak_lucka`).
- Scen ang ord 5–10: de två nyaste byggnaderna (sjukhuset alltid) ≥ 90 % (`syn/sil`).

## 1. Krav 1 – en sover
`laggPaAng` båda grenarna: taket (`laggMedTak` / while `TAK_PER_PLATS`) söver högst en. Har taket sövt, hoppas `redanUtan`, `somnaEn` och iStallet-slingan. Annars bara `somnaEn` (en). Slingan och `redanUtan` som sömnväg tas bort. Den som saknar ruta blir kvar: `placeraNiva` `reserv_krymp` + golvet `synlig_golv` ger `stall: false` när rutan syns. `kallaHit` har redan tak XOR `somnaEn`. `bliVan` bara läser `somnade` från `laggPaAng`.

## 2. Krav 2 – kalibrera, skriv glappet här
`npm run build:pages`, sedan `skarm-prov.mjs --bara smasaker,skogen --kalib k.jsonl`, `kalibrera.ts`. Glapp = regelns px (`kropp`-lådan × `siluett_andel`) minus id-passets `x1-x0` / `y1-y0`. Fylls i nedan innan datan ändras.

| sak | regel ns | id-pass | glapp |
|---|---|---|---|
| kaffekopp | (efter kalib) | | |
| puck | | | |

## 3. Krav 2 – samma px som id-passet
`siluett_andel` för puck och kaffekopp i `placering.json` = mätt siluett/låda, så `placeraNiva` (~397) räknar samma px (glapp ≤ 2). `SMASAK_PX` drar inte av `matfel_px` när andelen är mätt: kravet är 40. `smaKrav` gäller varje småsak, inte bara `nr === 0`. Väx med befintlig `smasak_vaxa` (en skala, proportion ur `modellmatt.json`). `djur.tsx` ritar redan `krymp > 1`.

## 4. Krav 3 – nyaste byggnaden främst
`placeraNiva`: roll `bak` söker `rader()` främst-först (idag `n-1-ri` för äldre, därför sjukhus z −3,3 bakom slott z −2,25). Äldre byggnad får inte rad med större z än den nyaste. Bara `bakFel` (`bak_lucka`, samma x) och `placera` när någon är i stallet får sänka z, ett `steg` i taget tills djuren har ruta. Skogen ord 9 slott: inom en rad från `bak.z` främre kant.

## 5. Krav 4 – två nyaste ≤ 10 % skymda
Nytt fält `byggnad_nyaste: { antal: 2, max_skymd: 0.10 }` i `placering.json`. `placeraNiva` gräns: de två nyaste med roll bak använder den, äldre byggnader `max_skymd_aldre`. De står bredvid i x (`xs`) så `varst` inte lägger dem bakom varandra. Ingen kod för sjukhuset. Skärmen: `syn/sil` ≥ 0,90.

## 6. Snabbprov och commit per krav
`npm run build:pages && node rundor/P3a-fix/skarm-prov.mjs --dist dist-pages --fron 0 --varv 1 --bara ang,skogen,smasaker` och `node --experimental-strip-types --test src/spel/p3a.test.ts`. Gren `runda-p3a-fix-2-kod`. Inte `dist-pages`, `k.jsonl`, `genomspelning/`.

## 7. Slut en gång
`test:product`, `typecheck`, `typecheck:pages`, `eslint`, `check:struktur`, alla fem scener, `genomspelning.mjs`. Uppdatera `RUNDA.md`.
