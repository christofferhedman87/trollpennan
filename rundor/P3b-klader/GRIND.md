# Grindutlåtande P3b — Kläder på kroppen samt sak-ord och spärr (Arkitekten 2026-10-24)

Mot skillen `build-round-gate`, punkt 1–13, för de två beställningarna `BESTALLNING-P3b1.md` och `BESTALLNING-P3b2.md` (sammanfattade i `BESTALLNING.md`). Bas: `origin/main` = `8eaec12` (#190, efter #188 städ-PR och #189 P3a-fix-2b). Körs efter att `G2` (`arkitekt/g2-phaser-bort`) är mergad.

**Totalt: JA för P3b-1 och JA för P3b-2.** P3b är **delad i två rundor** enligt grindpunkt 10 (en mekanism per runda). `P3b-2` startar först när `P3b-1` är mergad. Villkor som Doodle kontrollerar före start: ren klon med `--single-branch` och 0 patchar (punkt 13). Efter varje delrunda: diff mot kända patchar (punkt 13).

| # | Grindpunkt | Ja/nej | Motivering |
|---|---|---|---|
| 1 | Projektkartan är aktuell | JA | `PROJECT.md` på `arkitekt/projekt-lage` är uppdaterad 2026-10-24 med hela kedjan (`#188`, `#189`, `#190`, `O1b`, `R1`, `S1a/S1b`, `G1a/G1b/G1c`, `G2` och `P3b-1/P3b-2`). Beställningarna är självständiga med exakta filvägar och funktionsnamn. |
| 2 | Återanvändning inuti och utanför | JA | **Utanför:** Ingen ny extern kod eller modell behövs — alla 38 klädesmodeller (`public/modeller/kenney/` och `public/modeller/kaykit/`) och alla 295 djurankare i `data/fastpunkter.json` finns redan i repot under CC0. **Inuti:** Återanvänder `ankareFor`, `platsFor` och `fastVarld` i `src/spel/tillbehor/{ankare,faest}.ts`, `useGLTF` + `fargaKlon` i `src/spel/gltfDjur.tsx`, `ledSak`-mönstret i `src/tolk/tolka.ts` (rad 387–395) och den neutrala röstpekaren `/ljud/rost/db967993a3539e8c.mp3` från O1a-3 (`8eaec12`). **Knep:** *gör det till data* (`data/plagg.json` styr alla 38 GLB-plagg via 7 ankargrupper i stället för specialkod per plagg), *förenkla till det barnet märker* (centrerad Box3 + botten-/mittpivot på djurets befintliga ankarpunkter). |
| 3 | Arkitekturregeln | JA | Allt styrs av data (`data/plagg.json`, `data/tillbehor.json`, `data/fastpunkter.json`) och generell fästlogik i `src/spel/tillbehor/`. Noll specialkod per djur/plagg och noll hårdkodade ord i `src/tolk/`. `Spel.tsx` rörs inte. |
| 4 | Ritning i ordern | JA | Exakta filer, funktioner och radnummer på `8eaec12`: `src/tolk/sparr.ts` (`normSparr`, `renSparr`, `STAMMAR`, `arOrdform` r. 13–36), `src/tolk/tolka.ts` (`semantisera`, `dubbelSak` r. 446–455, `boost` r. 464), `data/rost-manifest.json` + `data/rost-klient.json` (`7ee8f593`, `930d7c7f`), `data/plagg.json`, `src/spel/entiteter.ts` (`arPlagg` r. 155), `src/spel/ang/djur.tsx` (`medSaker` r. 246), `src/spel/tillbehor/ankare.ts` (`ankareFor`), `src/spel/tillbehor/faest.ts` (`faestTillbehor`, `faestPlaggKlon`), `src/spel/gltfDjur.tsx` (`GltfPlagg`). |
| 5 | Datavägen spårad | JA | Spårad och körd med Node 22 mot `8eaec12` över samtliga 1 158 entiteter i `data/entiteter.json`: (1) `"porr"` i `data/blocklist.json` krymper via `normSparr` till `"por"` (3 tecken) och `arOrdform("en")` är `false`, så `"en sportbil"`, `"en port"` och `"en grottport"` ger `sparr` (vilket i genomspelningen efter `"en biff"` lämnade biffen kvar på skärmen). (2) `dubbelSak` i `tolka.ts` r. 450 tillåter bara `artikel`/`antal` före `"eld"`/`"regnbåge"`, så `"en gul eld"` och `"en stor regnbåge"` ger `behover_djur` (vilket efter `"en ubåt"` lämnade ubåten kvar). (3) `rost2.test.ts` r. 71 kräver `rostFor` för varje `en ${v.ord[0]}` som blir `skapad`, varför `7ee8f593` (`"en sportbil"`) och `930d7c7f` (`"en grottport"`) måste peka på `/ljud/rost/db967993a3539e8c.mp3`. (4) `arSak(id)` i `entiteter.ts` r. 155 är sann för alla 38 `typ: "tillbehor"`-modeller, så `djur.tsx` r. 246 lägger mössor/tröjor/stövlar i `medSaker` på marken vid `y = 0`. |
| 6 | Provet mäter som skärmen | JA | `prov-p3b.mjs` och `p3b2.test.ts` laddar de riktiga GLB-modellerna (djur + plagg) med `GLTFLoader` + `MeshoptDecoder`, applicerar `skalaFor`, `framVinkel` och fästlogik, mäter 3D-världsboxar och projicerar genom 375×812-kameran, samt verifierar i headless Chromium (`375×812`) att `medSaker` på marken är 0 för kläder och att plagget sitter på kroppen på skärmen. |
| 7 | Snabbprov finns | JA | `/home/box/.local/node22/bin/node --experimental-strip-types rundor/P3b-klader/matt/prov-p3b.mjs --snabb --del 1` och `--del 2` kör på under 2 sekunder utan webbläsare och fångar alla P3b-1- och P3b-2-fel direkt på `8eaec12`. |
| 8 | Bevis definierat | JA | Namngivna kontrollpunkter och skärmbilder i `375×812` (`rundor/P3b-klader/matt/bilder/`): `p3b1-sportbil.png` (efter biff), `p3b1-gul-eld.png` (efter ubåt), `p3b1-jatte.png`, `p3b2-kanin-mossa.png`, `p3b2-katt-troja.png`, `p3b2-hund-glasogon-stovlar.png`, `p3b2-rav-krona.png`, plus `RUNDA-P3b1.md` och `RUNDA-P3b2.md`. |
| 9 | Inställningar valda | JA | `grok-4.7` high. `P3b-1`: 55 turer (tak 70), `RUNDA-P3b1.md` senast tur 42. `P3b-2`: 65 turer (tak 80), `RUNDA-P3b2.md` senast tur 50. |
| 10 | Ett logiskt mål | JA, efter delning | Två skilda mekanismer delade i två rundor: `P3b-1` (ordtolk/spärr i `src/tolk/`, ~5 steg × 8 + 10 ≈ 50 anrop) och `P3b-2` (3D-klädmontering på ankare i `src/spel/tillbehor/` + R3F, ~6 steg × 8 + 12 ≈ 60 anrop). |
| 11 | Build skriver koden | JA | Arkitekten har enbart skrivit `BESTALLNING.md`, `BESTALLNING-P3b1.md`, `BESTALLNING-P3b2.md`, `GRIND.md` och mätskriptet `matt/prov-p3b.mjs`. Ingen spelkod och inga patchar. |
| 12 | Ingen merge över eget fynd | JA (gäller efter) | Om något klädesplagg hamnar på marken i `medSaker`, om sportbil/eld misslyckas eller om `rost2.test.ts` är röd mergas inte rundan. |
| 13 | Ingen färdig patch nåbar | JA, med villkor | Det finns ingen patch för P3b någonstans och `main` (`8eaec12`) har 0 `*.patch`-filer. Doodle kör varje runda i en ren `--single-branch`-klon och kontrollerar efter rundan att diffen mot äldre arkiverade patchar är under 20 %. |

## Kontrollkommando för punkt 13 före och efter rundan

```bash
# Före start i ren klon:
git branch -a
git ls-files '*.patch' | wc -l   # ska vara 0

# Efter rundan:
BAS=$(git merge-base HEAD origin/main)
git diff $BAS..HEAD -- src data scripts | grep '^+[^+]' | sed 's/^+//;s/^[[:space:]]*//' | grep -v '^$' | sort -u > /tmp/p3b-tillagt.txt
wc -l /tmp/p3b-tillagt.txt
```
