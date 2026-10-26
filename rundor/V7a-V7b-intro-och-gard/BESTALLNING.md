# Runda V7a–V7b — Översikt: Kort intro & ljudupplåsning (`V7a`) + Gårdens byggsystem med CC0-husmodeller (`V7b`)

För att hålla turbudgeten låg, säker och verifierbar efter O1a- och V1/V2-lärdomen är runda V7 uppdelad i **två separata en-målsrundor** med egna prompts och delmätningar i `matt/prov-v7.mjs`:

1. **`BESTALLNING-V7a.md` (Runda V7a — Kort, interaktivt intro, `Hoppa över ⏭` & ljudupplåsning):**
   - Kort 3-stegs intro (`7,5 s`, max `8 s`) i `data/intro.json` (`v7a`) och `src/spel/intro.tsx` utan det 15 sekunder långa påtvingade stavningssteget.
   - Tydlig `Hoppa över ⏭`-knapp (`[data-testid="intro-hoppa"][data-v7a="hoppa-over"]`, `≥ 44×44 px`) synlig från sekund 1.
   - `e.stopPropagation()` + `ljud.lasOpp()` i helskärmsöverläggen (`.titel` i `Titel.tsx` och `.intro` i `intro.tsx`) så att tryck aldrig läcker ner till 3D-scenen bakom och ljudet låses upp vid första trycket.
   - 0 gratis startdjur (`stallKanin()` bortkopplad från `<Intro` i `SpelVy.tsx`) och öppnar `✍️ Skriv` direkt efter introt.
   - **Verifiering V7a:** `node rundor/V7a-V7b-intro-och-gard/matt/prov-v7.mjs --snabb --del 1`

2. **`BESTALLNING-V7b.md` (Runda V7b — Gårdens byggsystem: skrivbyggande, CC0-husmodeller med 3 fönster & `Walls`/`Roof`-material samt Byggbok utan överlapp):**
   - Använder Modellspanarens 6 CC0 1.0 `.glb`-modeller i `public/models/gard/` (`v7-hus-tre-fonster-kenney-suburban.glb`, `v7-hus-modular-tre-fonster-kenney.glb`, `v7-hus-tvavaning-kenney-modular.glb`, `v7-hus-fantasy-quaternius-fix.glb`, `v7-lada-hus-quaternius-tre-fonster.glb`, `v7-fonster-modul-kenney.glb`). **Totalförbud mot box-primitiver i spelkod.**
   - Färgar `Walls`-materialet rent (`material.color.set(fargHex)` utan lerbrun nedmörkning, enligt `stilguide.md`), färgar `Roof`-materialet med `takFargHex`, och styr synligheten på de inbäddade 3D-fönsternoderna `Window_1`, `Window_2`, `Window_3` (`fonsterAntal: 3` visar 3 fönster på `+z`, `fonsterAntal: 0` döljer dem).
   - Skrivbyggande på gården (`tolkaByggMening()` / `appliceraByggMening()` i `src/spel/gard/byggTolk.ts`, `src/tolk/byggtolk.ts` och `src/spel/styr/useSkapa.ts`).
   - Bekräftelsebubbla med stor bokstav efter `!` och utan dubbel-`"med"`: `"Klart! Ett stort rött hus med blått tak och tre fönster står på gården."` (`src/spel/fyll.ts` + `src/spel/rostManifest.ts`).
   - Byggbok (`BokSkarm.tsx` + `bok-p1.css`) med `top ≥ 58 px` (0 px överlapp med topp-HUD), fast `×`-stängkryss (`≥ 44×44 px`, `data-v7b="stang-byggbok"`), `✍️ Skriv & bygg`-knapp (`data-v7b="bygg-skriv-knapp"`) och 0 px överlapp mellan byggkort och låsta sidor.
   - **Verifiering V7b:** `node rundor/V7a-V7b-intro-och-gard/matt/prov-v7.mjs --snabb --del alla`

Se även `GRIND.md` för kontroll av alla 13 punkter i `build-round-gate` och de 4 fysiska specialistfilerna på disk.
