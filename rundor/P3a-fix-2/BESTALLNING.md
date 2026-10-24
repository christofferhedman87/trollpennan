# P3a-fix-2 – Build-beställning (Arkitekten 2026-10-24)

**Bas:** `runda-p3a-fix-build` = `ac6273e` + `bf28af9` (bara borttagna `*.patch`, ingen kodändring). **Ny gren för Build:** `runda-p3a-fix-2` från `bf28af9`.
**Doodle** skriver prompten ur den här filen (build-prompt-skillen) och kör. Grindutlåtande: `rundor/P3a-fix-2/GRIND.md`.

## Mål i spelarord
Barnet skriver ord efter ord. Varje gång går **högst ett** djur och vilar, och det får sin egen banner. Det barnet nyss skapade står **längst fram** och syns, också ett nytt slott eller sjukhus. Pucken och kaffekoppen är lika lätta att se som en katt: minst en fingertopp stora (40 px) på telefonen. Ett nytt hus gömmer sig inte bakom ett gammalt.

## Inställning
- Modell `grok-4.7` (eller `grok-4.7-build-fast`), `--reasoning-effort high`, `--max-turns 70` (tak 80), `--prompt-file`, timeout 50 min, logg till fil.
- **Planeringssteg:** skriv `rundor/P3a-fix-2/PLAN.md` på högst 8 turer, implementera sedan. Första kodändringen inom 10 verktygsanrop efter PLAN.md. Committa efter varje krav.
- **`rundor/P3a-fix-2/RUNDA.md` skrivs före tur 60** (vad som inte är klart, 3 svagaste ställena, risker), oavsett läge.
- Use these skills: building-games, threejs, design-ui. Install them first if missing.
- **Ren klon:** `git clone --single-branch --branch runda-p3a-fix-build <repo> /tmp/p3a-fix-2-ren` (inga arkitektgrenar, inte `/workspace/p3fix-dev` eller andra arbetskopior). Kopiera in `rundor/P3a-fix-2/` från grenen `arkitekt/p3a-fix-2` före start. `rundor/P3a-fix/lokal-skarm.sh` pekar på `/workspace/p3fix-dev` – kör den bara med `ARBETE=$PWD`, eller anropa provet direkt.
- Ingen röstgenerering, inget ElevenLabs-anrop, kör inte `scripts/rost-generera.mjs`.

## Fyra krav med mätbara acceptansprov
Alla skärmmått tas med id-passet (`src/spel/ang/idpass.tsx`, `window.__idPass`) vid 375×812 i stabilt läge (efter bannerkön, vandring nivå 0). **Skärmen är facit.** Ändra aldrig ett prov så att det blir mildare; laga spelet.

### Krav 1 – högst en sover per ord
- **Fel idag:** provet i `src/spel/p3a.test.ts` (testet "P3a-fix (beslut B) …") tillåter `flera <= 2` ord som söver fler än ett. I `src/spel/minne.ts` `laggPaAng` kan tre vägar söva på samma ord: `laggMedTak`/`TAK_PER_PLATS`, `redanUtan(...)` och slingan efter `somnaEn` som söver allt `iStallet` returnerar (r. ~347–366 för platser, ~370–405 för ängen).
- **Regel:** exakt en väg får söva per ord, högst en skapelse. Har taket redan sövt en, sover ingen mer. Den som ändå saknar ruta ritas mindre (`reserv_krymp`, golvet `synlig_golv`) och stannar vaken och synlig. Samma regel i `kallaHit` (r. ~407–434) och i `src/spel/avflode.ts` `bliVan` (r. ~218–231). Banner per somnad finns redan (`Spel.tsx` r. 808–810); rör den inte.
- **Prov:** i `p3a.test.ts` ska `assert.ok(r.somnade.length <= 1, …)` gälla för **varje** ord. Ta bort räknaren `flera`, så att gränsen är tillbaka till högst 1 (`max == 1`). Skärmprovets `högst en somnar` (`skarm-prov.mjs` r. ~196–202) gäller redan; det ska vara grönt i alla fem scener.

### Krav 2 – småsaksprovet mäter som skärmen, pucken och koppen minst 40 px
- **Fel idag (grindpunkt 6):** regeln tror att koppen är 53×66 och pucken 46×42 px (`data/placering.json` `_om_smasak_px`), men id-passet visar **kopp 32×29, puck 27×12** (`efter-prov.txt`, scen smasaker). Regeln räknar med lådan × `siluett_andel`, och `SMASAK_PX` drar dessutom av `matfel_px` (`placering.ts` r. 56). Skärmprovet kontrollerar bara den *nya* och med 37 px (`skarm-prov.mjs` r. 134).
- **Steg 1, kalibrering först:** kör `skarm-prov.mjs --bara smasaker,skogen --kalib k.jsonl` och `npx tsx rundor/P3a-fix/kalibrera.ts k.jsonl`. Skriv glappet per sak (regelns px mot id-passets px) i PLAN.md. Rätta sedan *definitionen* (`siluett_andel` för puck/kaffekopp som data, eller låt regeln använda samma siluettmått), inte en extra marginal.
- **Regel:** varje småsak (`storlek.json` smasak) på skärmen når minst `smasak_px` = 40 px i id-passet: kortaste ledden, platt sak (pucken) längsta ledden. Proportion puck/kopp ur `data/modellmatt.json`. Lookups: `placering.ts` `placeraNiva` r. ~326–335 (`sma`, `platt`, `smaKrav`) och r. ~491–505 (`smasak_vaxa`), `ritSkala` r. 124, `src/spel/ang/djur.tsx` (krymp > 1 för småsaker).
- **Prov:** `skarm-prov.mjs` r. 134: 40 px (inte 37), för **alla** småsaker i bild efter varje ord, inte bara den nya. Rött före, grönt efter. Kalibreringen visar glapp ≤ 2 px för puck och kopp.

### Krav 3 – nya byggnader står så långt fram som zonen tillåter
- **Fel idag:** i skogen hamnar det nya slottet på z −5,2, längst bak i `bak`-bandet (`data/placering.json` skogen `bak.z [-5.5, -1.5]`). På ängen står det nyare sjukhuset (z −3,3) bakom slottet (z −2,25).
- **Regel:** den nyaste byggnaden får den främsta lediga raden i `bak`-bandet. Bara `bak_lucka` (avstånd till djur på marken) och "inget djur blir utan ruta" får hålla den bakåt. Lookups: `placering.ts` `placeraNiva` r. ~491–505 (den nya provar mindre storlek för att stå längre fram), `rader()` r. 226, `byggnadsord()` r. 626, `kroppMatt()` r. 78.
- **Prov:** ny kontroll i `skarm-prov.mjs` för varje byggnadsord: den nya byggnadens id-pass-nederkant (`y1`) är ≥ `y1` för alla äldre byggnader i bild. Den ligger också högst en rad (`steg`) från bandets främsta rad, räknat med `sakRuta` på samma kamera. Annars skriver provet namnet på det djur som höll den bakåt. Skogen, ord 9 "ett slott": grönt.

### Krav 4 – sjukhuset på ängen högst 10 % skymt
- **Fel idag:** id-passet visar sjukhuset till 85 % (15 % skymt) och slottet till 63 % i ängens slutläge.
- **Regel (data, ingen kod per sak):** nytt fält i `data/placering.json`, till exempel `"byggnad_nyaste": { "antal": 2, "max_skymd": 0.10 }`. De två nyaste byggnaderna på en plats är högst 10 % skymda, äldre byggnader följer `max_skymd_aldre`. Byggnaderna får stå bredvid varandra i x i stället för bakom varandra. Lookups: `placeraNiva`, `varst()` r. 563, `src/spel/skymning.ts` `synligAndel`, `dekorSkymd()` r. 174.
- **Prov:** ny kontroll i `skarm-prov.mjs` scen ang: efter ord 5–10 är sjukhuset ≥ 90 % synligt i id-passet. Allmänt: de två nyaste byggnaderna är ≥ 90 % synliga. Rött före (85 %), grönt efter.

## Acceptans = Doodles genomspelning, punkt 1–5
`node rundor/P3a-fix-2/genomspelning.mjs --dist dist-pages --ut genomspelning` (Doodles skript från 21 okt; riktig pekskärm, inget `__troll`). Punkterna är dess fem scener:
1. **Ängen** (10 ord): högst en sover per ord, en banner per somnad, sjukhuset högst 10 % skymt, ≥ 6 vakna och synliga.
2. **Sjön** (9 ord): ingen försvinner, högst en sover per ord.
3. **Skogen** (11 ord): slottet längst fram i byggnadszonen, puck och kopp ≥ 40 px, högst en sover per ord.
4. **Grottan** (8 ord): 8:e "en säl" syns, ingen sover.
5. **Småsaker** (kopp, puck, katt): puck och kopp ≥ 40 px och främst, proportion rimlig, inga sidfel.

Skärmbilder: `genomspelning/<scen>-slut.png` och `-08.png`.

## Snabbprov (kör efter varje steg)
`npm run build:pages && node rundor/P3a-fix/skarm-prov.mjs --dist dist-pages --fron 0 --varv 1 --bara ang,skogen,smasaker` plus `node --experimental-strip-types --test src/spel/p3a.test.ts`. Det tar några minuter.
**Bara i slutet:** `npm run test:product`, `npm run typecheck`, `npm run typecheck:pages`, `npx eslint .`, `npm run check:struktur`, hela skärmprovet (alla fem scener) och genomspelningen. Varje jobb ska ta under 30 minuter.

## Ordning och fallback
1. Prov först: krav 1–4 i proven ska vara röda på `bf28af9`. Committa.
2. Krav 1 (sover). 3. Krav 2 (kalibrering, sedan regel). 4. Krav 3. 5. Krav 4.

**Tar det för lång tid:** leverera krav 1 och 2 gröna, och skriv krav 3–4 i RUNDA.md.

## Skyddsräcken
- **Inga färdiga patchar** (grindpunkt 13). Applicera, återskapa eller sök inte efter `*.patch`. Läs inte andra arbetskopior på maskinen.
- **`src/spel/Spel.tsx` får inte växa** (1842 rader, `check:struktur`).
- **`src/tolk/*` är låst.**
- **Inget per sak:** ingen kod per djur eller byggnad. Siffror ligger i `data/placering.json`.
- **Prestanda:** ingen `setState` i `useFrame`, inga allokeringar per bildruta. Id-passet körs bara i provet.
- **Data:** ändra inte Copilot-granskad data (`granskad: true`). Ändra inga sparnycklar.
- **Commit:** committa inte `node_modules` eller symlänkar.

Ändra inget annat. Inga nya funktioner.
