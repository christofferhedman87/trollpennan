# PROJECT.md – Trollpennan (projektkarta)

## Grundtanken (Christoffer, 2026-10-18) – allt i den här filen mäts mot den

> Trollpennan är ett spel där yngre barn skapar en helt egen värld genom att använda svenska korrekt och kreativt. Det barnet skriver ska materialiseras/visualiseras på skärmen, nästan oavsett vad hen skriver. Därför behövs enorma mängder modeller och attribut, och att få in modeller enkelt och i bulk är helt centralt. Nu djur, men även hus, stall, hagar mm. Uppdrag på andra platser (skogen, sjön, grottan), främst från Doktor Bengtsson. Fast kameravinkel som i Hay Day är ok.

**Mätaren (avsnitt 11):** andel av det barnet skriver som blir något synligt. Idag (mätt 2026-10-18, kod och live överensstämmer): **1,2 % av de 1 000 vanligaste substantiven, 1,9 % av adjektiven och 0,5 % av verben** blir en egen synlig form; ca 13 % av en handvald barnlista med 70 vardagssubstantiv. Ett okänt ord blir **ingenting** (en "Pennan behöver ett djur"-ruta; ordet sparas i en lista som barnet inte ser). Se avsnitt 12 för reservformen som ska göra det till 100 % synligt.

**Viktigaste fyndet i live-spelningen (avsnitt 17):** den publicerade versionen på https://trollpennan.grok.me/ är **äldre än `main`**: den saknar Runda 1 och alla tillbehörsrundor. Hatt, halsduk, glasögon, rosett, mantel och ryggsäck syns inte alls där. Ingen verifiering av `main` är gjord i spelad version förrän `main` är publicerad.

Skriven av Arkitekten 2026-10-18 mot `main` = `697be95` ("Runda 5A: ryggsäck, mantel och horn (#11)", 2026-10-18 10:39 Stockholmstid). Allt som är "läst" kommer ur filer, git och `gh`; allt som är "mätt" är körda lässkript (parsern `tolka`/`tolkaBygg` buntad med esbuild utanför repot, ingen spelstart); allt som är "live" är spelat headless mot den publicerade adressen (Playwright, 375×812, touch). Där något är en slutsats eller gissning står det. Uppdaterad 2026-10-19 (köordning). Uppdatera filen efter varje sammanslagen runda (grindregel 1 i skillen `build-round-gate`).

Källor: `/workspace/trollpennan-nulage/` (copilot-inventering.md, ritning-tillbehor.md, motorjamforelse.md, analys-kod.md, plan-A-B.md, natt-rapport-runda*.md, rounds.tsv, assets-bengtsson/RAPPORT.md, bengtsson-uppdrag.md, spel/rapport.md), repots `HANDOFF.md`, `projektregler.md`, `CREDITS.md`, `data/*.json`, `src/`, samt `git` och `gh pr list`. Mätunderlag: `verification/tackning-2026-10-18.md`. Skärmbilder: `docs/skarmbilder/` (avsnitt 17).

---

## 1. Vad spelet är
Trollpennan är ett 3D-lässpel för barn 7–12 på mobil (375×812 stående är måttet). Barnet skriver/väljer ord (97 ord i `data/ord.json`) och det som skrivs blir levande: en gul kanin, en drake med krona, ett hus. Skrivandet är verbet, aldrig ett prov (inga röda kryss, inga liv, ingen tidspress; se `projektregler.md`).
Spelaren i tankarna är Dagny, 7 år, som älskar Minecraft och Slime Rancher. Publiceras som statiskt bygge (`npm run build:pages` → `dist-pages`); Cloudflare Pages/Workers är inte ett krav (`wrangler.jsonc` finns, PR #10).

## 2. Vad som finns (med sökvägar)
Mått från `wc -l` på `main` 697be95. Totalt ca 16 000 rader i `src/spel/`, `src/tolk/`, `src/pages-main.tsx`.

### 2.1 Två renderare, båda aktiva
| Renderare | Filer | Vad den ritar |
|---|---|---|
| **R3F/Three (3D)** | `src/spel/angen3d.tsx` (2202), `gltfDjur.tsx` (327), `djurmesh.ts` (447), `tillbehorFaste.ts` (619), `effekter.tsx` (311), `kenneyNatur.tsx` (277) | Ängen (`varld === "ang"`, `visa3d` i `Spel.tsx` r.2044 → `<Angen3D>` r.2090), djuren (9 GLB + procedurella former), tillbehör, effekter (eld, glöd, glitter), Kenney-natur |
| **Phaser 2D** | `src/spel/starta.ts` (47, dynamisk import från `Spel.tsx` r.1654), `scen.ts` (967, ängen i 2D, dold bakom 3D), `gard.ts` (563, Gården + byggläge), `avscen.ts` (556, äventyret: skog/sjö/grotta), `ritaBygg.ts` (811, byggen ritade proceduellt), `avbro.ts` (41, React→Phaser-brygga), `deladeBilder.ts`, `texturKo.ts`, `natthimmel.ts` (53, nattljus i Phaser-scenerna), `kit.ts` (380, läser 2D-kitet; `billboard.ts` (138) ritar djurbilder till canvas för bok/önskebubblor via `Spel.tsx`) | Gård, byggande och äventyr. 2D-konst från `public/kit/` (8 MB, 349 PNG enligt motorjamforelse.md) |
Phaser används i 7–8 filer, ca 3 000 rader (motorjamforelse.md). Båda motorerna laddas: JS-chunkarna är ca 1,3 MB (R3F/Three) och 1,25 MB (Phaser) enligt motorjamforelse.md (inte omräknade).
**Konsekvens:** de nya 3D-djuren och 3D-tillbehören syns inte i Gården och äventyret, som visar 2D-kitet. Två konststilar, två världar.

### 2.2 UI och tillstånd
- `src/spel/Spel.tsx` – **3133 rader**, en komponent `Spel()` (r.466–3091) med **50 `useState`**, 9 `useEffect`/`useLayoutEffect`, **108 `data-testid`** i JSX. Innehåller: karta, område, HUD, meny, Pennans bok (`panel`: `spel`/`byggbok`/`uppdrag`), skylt, välj-djur, formelkort, ordbok, köp-fråga, föräldravy, mossa-panel, ca 20 händelsefunktioner (`tryckPlats` r.753, `utfor` r.1202, `skrivTecken` r.1285, `oppnaOnska` r.1377, `flyttaInDjur` r.1454 …). Rader 104–205 är JSON-importer/konstanter, 206–465 hjälpfunktioner (`OnskaAnsikte`, `kanEtikett`, `lastBygge`, `exportera` …), 3092–3133 `HoldOppnare`.
- `src/spel/minne.ts` (494; zustand + sparformat `trollpennan-v2/v1`, `lagring.ts`), `liv.ts` (472; album, skatter, vilda vänner, sällsynthet), `samling.tsx` (214; album), `intro.tsx` (201), `formel.tsx` (104), `onska.ts` (150), `ljud.ts` (115), `dialogFokus.ts`/`dialogIsolering.ts`, `ideer`/`replik`/`saga`/`fyll`/`beteende.ts`.

### 2.3 Ordtolkning (renderar-oberoende)
`src/tolk/` – `tolka.ts` (833; ord → `Varelse`, `laggTillbehor` ~r.453, `laggFormaga` ~r.123), `byggtolk.ts` (375; fri text → byggstruktur), `gavotolk.ts` (140), `lexikon.ts`, `avstand.ts` (stavningsavstånd), `typer.ts` (`TillbehorSpec = {id, farg, glans}` r.83, `Varelse` r.85), `sparr.ts`, `data.ts`. Tester: `tolk.test.ts` (344), `bygg.test.ts`, `gavo.test.ts` + `data/test-fraser*.json`.

### 2.4 Äventyr, uppdrag, byggande (spelregler)
`src/spel/aventyr.ts` (183, typer/uppslag), `avflode.ts` (242, regler: öppna hinder, skicka djur, bli vän, gåvor, plocka skatt), `bygge.ts` (82, sparformat `SparatBygge`), `taggar.ts`, `brygga.ts` (`Sparad`-typen). Se även 4 för status i menyn.

### 2.5 Data (`data/*.json`, 30 filer, alla importeras av någon källfil)
`ord.json` (39 KB; 97 ord; 12 med `klass: "tillbehor"`: hatt, krona, glasögon, halsduk, rosett, horn, ryggsäck, mantel, kappa, trollkarlshatt, solglasögon, guldkrona), `bygg.json` (20 KB; 36 byggord, 6 delar, 9 material), `onskningar.json`, `onskningar-bygg.json`, `byggsidor.json`, `sidor.json`, `omraden.json`, `uppdrag.json` (12 uppdrag), `skyltar.json` (12), `skatter.json` (6), `vilda-djur.json` (7), `album.json`, `ledtradar.json`, `gavor.json`, `egenskaper.json`, `beteenden.json`, `texter-gard.json`, `texter-aventyr.json`, `firande.json`, `dygn.json`, `humor.json`, `intro.json`, `ljud.json`, `mossa.json`, `foralder-r6.json`, `upplevelse.json`, `blocklist.json`, `test-fraser*.json` (3, bara tester). Inget av detta beskriver *utseende i 3D*; det ligger i kod (se 5).

### 2.6 Tillgångar (`public/`, 13 MB; `public/models/` 1,6 MB)
- **GLB-djur (9 filer, 9 kroppar):** `animal-bunny/cat/dog/fish/chick/parrot.glb` + `Textures/colormap.png` (Kenney Cube Pets; fågel och uggla delar `animal-chick.glb`), `drake.glb` (Quaternius, skinnad, ben `Head`/`Neck`/`Head_end`), `hast.glb` (Quaternius, skinnad, ben `Head`/`Neck`/`Body`), `groda.glb` (en enda mesh, **CC BY 3.0**). Kenney-djuren har noderna `root > body` + ben och animationerna `static/idle/walk/run/eat/dance`; **inga huvudben och inga ankarnoder** (läst ur GLB-filernas JSON 2026-10-18).
- **Kroppar utan GLB (procedurella former i `djurmesh.ts`):** gris, dinosaurie, ekorre, bäver, haj (+ uggla delar fågelns GLB). Förmågor och mönster ritas av `effekter.tsx` och `djurmesh.ts`.
- **Natur:** `public/models/natur/*.glb` (22 filer, Kenney Nature Kit), används av `kenneyNatur.tsx`.
- **2D-kit:** `public/kit/` (`kit.json`, `LASMIG.md`, 14 kroppar med lager + ankare, tillbehör i `tillbehor/*.png` med `bas`/`linje`, `platser`, `anim.json`). **Kitet är redan datadrivet** (`kit.json` → `tillbehor.<id>.{ankare,plats,delar,farg}`, `platser`: huvud→hatt/krona/horn, rygg→ryggsäck/mantel, hals→halsduk, ogon→glasögon, huvudsida→rosett). Det är mönstret 3D saknar.
- Ljud `public/ljud/` (Kenney Interface Sounds), `ljud-ui/`, `intro/`, typsnitt `typsnitt/`.
- Licenser: `CREDITS.md` (tabell). Groda-krediten visas i spelet (`Spel.tsx` r.2953, testid `groda-kredit`).

### 2.7 Beroenden (`package.json`)
Spelet använder: `react`/`react-dom` 19, `three` 0.186, `@react-three/fiber` 9, `@react-three/drei` 10 (+ `three-stdlib` via drei), `phaser` 3.90, `zustand` 5, `vite` 8, `typescript` 5.7, `@fontsource/fraunces|nunito`, `playwright` 1.62 (dev). **Mall-ballast från Groks fullstack-mall** (inte använd av `build:pages`): `@tanstack/*`, `better-auth`, `kysely`, `pg`, `@electric-sql/pglite`, `jose`, `nitro`, `recharts`, `react-hook-form`, `zod`, alla `@radix-ui/*`, `cmdk`, `vaul`, `sonner`, `date-fns` m.fl. Dessutom `server/`, `migrations/`, `src/lib/`, `src/routes/`, `routeTree.gen.ts`, `vercel.json`. analys-kod.md uppskattade ca 70 oanvända beroenden och ca 5 000 rader plattformsballast; jag har inte räknat om det. `typecheck`, `lint` och `npm test` (plattformssviten) var röda enligt analys-kod.md; gränsen som gäller för produkten är `typecheck:pages` + `test:product` + `build:pages` (75/75 tester i runda 5A).
Verktyg som inte finns i repot: `@gltf-transform/cli` (4.5.1, MIT, verifierat på npm 2026-10-18) – ingår i flödet i avsnitt 9.

## 3. Låst eller halvkopplat
**Byggt men inte inkopplat / dolt (koden finns, ingången saknas):**
- Menyknapparna **Gården, Byggboken, Albumet, Ut på äventyr, Uppdragsboken, Bok** är hårdkodat låsta som demoläge (`lasMeny` → "Kommer senare – i fulla spelet …", `data/texter-gard.json` `demo.senare`, `Spel.tsx` r.2346–2365; **verifierat live**, avsnitt 17). Gården nås ändå via kartan ("Gården" → `tryckPlats("garden")` → "Bygg något").
- `panel === "uppdrag"` (`Spel.tsx` r.2644–2736) har ingen ingång (inget anropar `setPanel("uppdrag")`); albumet (`samling.tsx`) öppnas bara via `window.__troll`-kroken.
- `scen.ts` (ängen i 2D) körs men döljs bakom 3D-ängen.
- Ljud, album, föräldravy (`foralder-r6.json`) är kopplade men bakom lås.
- **Tillbehör i 3D finns men är per-sak-kod** (se 5): 8 tillbehörsformer + placering/skala per djur och per sak i `tillbehorFaste.ts`. Glasögon, krona, hatt, rosett, halsduk, horn, ryggsäck, mantel är kopplade; svagheter enligt natt-rapport-runda5a.md: mantel katt/kanin, horn katt/häst, ryggsäck fågel.
- Äventyret har ingen React-vy för områden; skogen/sjön/grottan är Phaser-scenen `avscen.ts`. Kartan är React-knappar, inte en ritad karta.
- Byggord ritas i 3D bara som 6 grova former (`angen3d.tsx` `slag()` ~r.171); alla 36 ord ritas först i 2D (`ritaBygg.ts`).

**Får inte röras utan beställning (låst):**
- **Text/data som Copilot redan granskat:** `data/ord.json`, `onskningar*.json`, `sidor.json`, `ledtradar.json`, `firande.json`, `texter-*.json`, `humor.json` m.fl. samt `text/granskning-1` (rättade texter, ej ombaserade, 3 commits före main på `origin/text/granskning-1`) och `copilot-jobb` (ordlistefix `regnbågsfärgada`, stavningstester). Rör inte; nämn bara.
- Parser och tester: `src/tolk/*`, `data/test-fraser*.json` ska passera oförändrade.
- **Sparformat:** nycklarna `trollpennan-v2`/`v1` (`lagring.ts`, `minne.ts`); parser och sparnycklar får inte brytas (HANDOFF.md).
- `recovery/` (rör inte, mandatet 2026-10-17), `_handoff-copilot/` (gammal, gäller inget), `RUNDA*.md` och `HANDOFF.md`/`BLOCK-STATUS.md`/`IMPROVEMENT-LOG.md` är historik.
- Mandat (`projektregler.md`): "React/R3F och Phaser bevaras tills ett byte har motiverats och verifierats". Phaser tas alltså inte bort utan Christoffers ja. Högst 8 numrerade skärmbilder per runda; inga nya checkpoint-dokument.

## 4. Arkitekturregler
1. **Innehåll är data, inte kod.** Ett nytt djur, tillbehör, byggord, uppdrag eller ord = **en datarad + en tillgångsfil**, läst av ett generellt system. Lägger en runda till per-sak-kod (`byggKrona`, `skalaFor("hatt")`, `if (kropp === "katt")`) ska rundan stoppas och systemet ritas om först (grindregel 3).
2. **En renderväg.** Målet är R3F för allt (rekommendation i motorjamforelse.md, "väg 1"). Ingen ny vy byggs i Phaser. Under övergången gäller: nya tillbehör/effekter/byggdelar skrivs bara för R3F; Phaser får bara bugfixar. Phaser tas bort i R7 efter verifierade R5–R6 (beslut a, avsnitt 10.1).
3. **`Spel.tsx` ska delas.** Ingen ny vy, panel eller dialog läggs i `Spel.tsx`. Ny UI = egen komponent i `src/spel/ui/`; ny logik = egen hook/modul. Gräns som skripten ska vakta: ingen ny fil över 800 rader. Idag över 800: `Spel.tsx` (3133), `angen3d.tsx` (2202), `scen.ts` (967), `tolka.ts` (833), `ritaBygg.ts` (811). Planen delar `Spel.tsx` (R1) och `angen3d.tsx` (R4A) och tar bort `scen.ts`/`ritaBygg.ts` (R7); **`angen3d.tsx` (2202) delas i R4A** (beslut d, avsnitt 10.1); `tolka.ts` (833) har ingen runda ännu.
4. **Inga modeller utan dokumenterad licens.** Varje fil i `public/models/` har en rad i `data/tillgangar.json` (manifest) och `LICENSES.md` med källa-URL, upphovsperson, licens och hämtdatum. Tillåtna licenser: CC0. CC BY (kräver namn) bara med synlig kredit i spelet; ingen NC, ingen ND, ingen "personligt bruk". Idag: `groda.glb` är CC BY 3.0 (jeremy) och krediten visas.
5. **Ankare i modellerna, siffror i data.** Placeringspunkter för tillbehör är namngivna noder (`anchor_*`) i GLB-filen, med reservvärden i `data/djur.json`. Inga `kropp === "…"`-kedjor i koden.
6. **Bevis är bilder, inte rapporter.** Granska mot skärmbilder 375×812, inte mot Builds egen rapport (grindskillen). Högst 8 bilder per runda.
7. **Plattformsrörelsen:** `npm run build:pages` är bygget; kör inte `npm run build` (injicerar Grok-script och migrering, plan-A-B.md).

## 5. Tillbehörskoden som ska ersättas (läget idag)
Tillbehör tog 9 rundor (3A–3F, 5A, 5B, 5B-1; ca 11,9 USD av ca 25,7 USD totalt enligt `rounds.tsv`, summerat av mig) eftersom varje sak och varje djur är kod:
- `src/spel/tillbehorFaste.ts` (619 rader; en bygg-funktion per sak plus gren per sak och djur): `byggKrona` r.325, `byggHatt` r.350, `byggHalsduk` r.365, `byggRosett` r.377, `byggRyggsack` r.389, `byggMantel` r.401, `byggHorn` r.411, `byggGlas` r.420 (formerna), `skalaFor` r.445–494 (en gren per tillbehör och djur), `platsFor` r.549, `pannaPlats` r.516, `mantelPlats` r.531, `framRiktning` r.498, `vandRygg` r.583 (54 förekomster av `kropp ===`/djurnamn), `PROC_ANKARE` r.120 (ankare för 14 generiska kroppar), `glbRygg`/`procRygg` r.142–178, `ankareFor` r.215–324 (ankare ur `Box3`-fraktioner, speciallösningar för drake/häst).
- `src/spel/gltfDjur.tsx`: `FIL` r.12, `MAL_HOJD` r.24, `PALETT` r.38 (djurdata i kod), `fastAnkare` r.184.
- `src/spel/djurmesh.ts` r.308–330: gamla `krona`/`horn` bakade i formen (`byggPack`), död väg (`angen3d.tsx` r.586–588 skickar `krona:false`, `horn:false`).
- `src/spel/kit.ts` (2D) har redan det datadrivna mönstret (`kit.json`), men läses bara av Phaser/formelkort.

---

## 6. Öppna PR och grenar (`gh pr list --repo christofferhedman87/trollpennan --state all`, hämtat 2026-10-18)
**Öppna PR: inga.** 11 PR totalt: 9 sammanslagna (#1, #2, #4, #5, #6, #8, #9, #10, #11), 2 stängda utan merge (#3 runda 3B, #7 runda 4). Senast: #11 "Runda 5A" sammanslagen 2026-10-18 08:39 UTC (10:39 Stockholm).
Fjärrgrenar på `origin` (14): `main` (standard, repot är privat), `build/runda-1, 3a, 3b, 3c, 3d, 3e, 4, 4c, 4e, 5a` (alla sammanslagna eller stängda, kan städas), `cloudflare-wrangler` (sammanslagen #10), `copilot-jobb` (Copilots textgren, 1 commit före main), `text/granskning-1` (3 commits före main; ej ombaserad).
**Bara lokala grenar** i `/workspace/trollpennan-build` (separat klon, ej pushade): `build/runda-3f`, `4b`, `5b`, `5b1` (inga commits före main), **`build/runda-4d`** (3 commits före main; 4D:s glitter, glöden gick vidare i 4E). I `/workspace/trollpennan-repo`: `cloudflare-wrangler`, `copilot-jobb`, `text/granskning-1`, `main`, och `arkitekt/project-md` (den här filen, ej pushad). `git worktree list` i repot: bara huvudträdet. `/workspace/trollpennan-nulage` är inte ett git-repo (arbetsmapp med rapporter och skärmbilder).

## 7. De tre senaste rundorna (natt-rapporter, `rounds.tsv`, git)
| Runda | Mål | Resultat | Lärdom |
|---|---|---|---|
| **5A** (build-fast medium, 30 turer, 2,92 USD) | ryggsäck, mantel, horn | **Delvis bra, PR #11 sammanslagen.** `tillbehorFaste.ts` +191, `angen3d.tsx` (horn ritas inte dubbelt). Mantel tydlig på häst/drake/gris; horn bra på drake/fågel/gris/kanin. **Fel kvar:** ryggsäck på fågel (båge över huvudet), mantel katt/kanin (mörk kil), horn katt (flyter) och häst (förskjutet). Nådde max-turer före `RUNDA5A.md` | Ännu en runda med per-sak-kod; det genererar nästa felrunda |
| **5B** (medium, ~40 turer, ~1 USD) | tillbehör som data (alla steg) | **Inget.** Build mätte kroppars bbox i stället för att skriva `data/fastpunkter.json`/`tillbehor.json`; avbruten (SIGTERM 10:50) | Beställningen var för stor och tillät mätning |
| **5B-1** (low, 20 turer) | bara datafilerna | **Inget.** `Transport error` (API) i omförsök, avbruten 11:00 | Tillfälligt API-fel; omkörning stoppades av grinden. Skriv filerna utan Build eller kör om efter 5 min med Arkitektens ritning |
Före dem: **4E** (PR #9, 0,52 USD, glöd som rund gloria bakom djuret, bra på häst/katt, svag på kanin) och **4D** (partial, glitter bra, glöden för stor; lokal gren). `rounds.tsv` har 17 rundor (ca 25,7 USD): 7 merged (1, 3A, 3C, 3E, 4C, 4E, 5A), 5 partial (3B, 3D, 4, 4B, 4D), **5 utan resultat** (2, 2B, 3F, 5B, 5B-1); orsaker i `rounds.tsv`: för stor beställning, Build mätte i stället för att ändra, API-fel, ingen ritning/fastpunkter.

---

## 8. Färdplan: rundor i ordning (följer grundtanken)

### KÖORDNING (gäller nu, 2026-10-19) – `rundor/BLOCK-platser/PLAN.md`
**Skript** = `kor.sh`/patch, 0 Build-USD. **Build** = Grok Build. Doodle skriver aldrig spelkod utan kor.sh eller prompt. Arkitekten levererar → skickar körkommando samma stund.

**Klart på main:** R3G (#56) · R9D–F (#60/#62/#64) · B0 (#61) · B1.1–B1.4-fix (#67/#68/#71/#75/#77/#78) · R9G (#80, 37f2db9).

**Pågår:** **R9H** fel 1–5 ur speltestet efter R9G (Phaser-genomslag från UI → "Till stallet"/gåvoruta av sig själv, stall-banner kvar, djuret bakom, klistrigt gåvoläge, läsbar stall-lista) — **skript** `git checkout main && git pull && git checkout -b runda-r9h-kod && bash rundor/R9H-fix/kor.sh` (`rundor/R9H-fix/PLAN.md`). Phaser-äventyret förblir avstängt.

**Nästa, i denna ordning (inga parallella steg utom B5):**
1. ~~B1.4-fix~~ klar (#78)
2. ~~R9G~~ klar (#80)
2b. **R9H** fel 1–5 efter R9G — **skript** (`rundor/R9H-fix/kor.sh`, ingen Build)
2c. **R9I** sugen djur bjuder in till gåva bara vid första trycket, "Till stallet" i gåvorutan, ingen gåta under uppdrag — **skript** (`git checkout main && git pull && git checkout -b runda-r9i-kod && bash rundor/R9I-fix/kor.sh`). Kräver R9H på main; körs efter R8-2a-merge, eller före om R8-2a inte startat
3. ~~**R8-2a**~~ Build blev ofullständig (gren `runda-r8-2a`, mergas **inte**; `rundor/R8-grafik/RUNDA-R8-2a.md`) → **R8-2b** gör klart R8-2a + horisont per plats (grottan: berg), inget svävar (ankare, stalagmiter), skapelser bara på land, sjön får strand — **skript** `git checkout main && git pull && git checkout -b runda-r8-2b-kod && bash rundor/R8-2b/kor.sh` (`rundor/R8-2b/PLAN.md`). Kontur på GLB, vattenshader, FPS-vakt: senare
4. **B2** Skogen — **skript**, efter R8-2b: `git checkout main && git pull && git checkout -b runda-b-skogen && bash rundor/BLOCK-platser/kor-plats.sh skogen` → committa `data/`, `src/spel/uppdragsmotor.test.ts`, `rundor/BLOCK-platser/prov-skogen-375x812.png`, PR, merge (torrkört ovanpå R8-2b: EXIT 0)
5. **B3** Sjön — **skript**, samma mönster med `runda-b-sjon` / `kor-plats.sh sjon` (torrkört: EXIT 0)
6b. **R9J** humöret på alla platser — **skript** `git checkout main && git pull && git checkout -b runda-r9j-kod && bash rundor/R9J-humor/kor.sh` (efter R8-2b; före eller efter B2–B4)
6. **B4** Grottan — **skript**, `runda-b-grottan` / `kor-plats.sh grottan` (torrkört: EXIT 0) + **B4.1** ljuskällor **Build**
7. **B5** modeller (prio 1/2) — **skript**, får köras parallellt med B2–B4. **B5a = R3F-M10** (utter, svan, abborre, gädda, kräfta, vattensalamander + skogens bäck, stig, vägskylt; alla CC0, `rundor/R3F-modellserie/M10/B5A.md`): `git checkout main && git pull && git checkout -b runda-r3f-m10 && bash rundor/R3F-modellserie/kor.sh M10` → push, PR, merge. Efter B3 (eller om B3 redan körts): kör om `kor-plats.sh sjon` så att de sex djuren får område och repliker. Grottans `drake` behöver ingen modell (vanligt ordkort, nivå kort). B5b (kodritade: gris, kulting, ekorre, bäver, haj, dinosaurie) kvar
7b. **Dubblingen av modellerna** (577 → ca 1 150, `rundor/R3F-modellserie/DUBBLING.md`): M11 småkryp och nya djur (37, CC0) — **skript** `git checkout main && git pull && git checkout -b runda-r3f-m11 && bash rundor/R3F-modellserie/kor.sh M11` (efter M10); M12 människor och familj (19, CC0) — `… -b runda-r3f-m12 && bash rundor/R3F-modellserie/kor.sh M12` (efter M11); M13 mat och fika (21, CC0) — `… -b runda-r3f-m13 && bash rundor/R3F-modellserie/kor.sh M13` (efter M12); M14 saker och leksaker (18, CC0) — `… -b runda-r3f-m14 && bash rundor/R3F-modellserie/kor.sh M14` (efter M13); **MFIX** rättelser M10–M14 + former (20, CC0) — `… -b runda-r3f-mfix && bash rundor/R3F-modellserie/kor.sh MFIX` (efter M14); M15 stad/båtar/fabrik/arkad (48, CC0) — `… -b runda-r3f-m15 && bash rundor/R3F-modellserie/kor.sh M15` (efter MFIX); M16 kit + egna natur/rymd/väder (39, CC0) — `… -b runda-r3f-m16 && bash rundor/R3F-modellserie/kor.sh M16` (efter M15). M17–M25 planerade
8. **B6** kontroll + buggfix — **skript** (B6.1) sedan **Build** (B6.2–3)
9. **TTS** gratis svensk röst — efter B6; eget block

**Christoffers låsta beslut:** stall = meny (ingen stallbyggnad än) · ERROR-automaten behålls + text "Inte riktigt än" under · R8-2 efter B1, före platserna · TTS efter områdena · röd/grön på djur (R9C) **pausad**.

Efter blocken kvar: R4B kamera, R5 Gården, R7 Phaser bort. Copilot-data: `rundor/BLOCK-platser/data-utkast/`. Historik/grindtabell nedan är bakgrund; **följ bara köordningen ovan.**

**Mått mot grundtanken** (varje runda anger före/efter; mätmetod i avsnitt 11): *täckning* = andel av orden i `verification/tackning-2026-10-18.md` (slumpurval 100, barnurval 70 + 30 + 30, topp-1000) som blir en egen synlig form; *synlig* = egen form **eller** reservform. Utgångsläge: egen form 1,2 % / 1,9 % / 0,5 % (topp-1000 substantiv/adjektiv/verb), barnlistans substantiv 9/70, synlig 0 % för okända ord.

Grinden (skillen `build-round-gate`, 7 punkter): (1) projektkarta aktuell, (2) återanvändning kontrollerad, (3) arkitekturregeln hålls, (4) ritning i prompten, (5) bevis definierat, (6) inställningar valda, (7) ett logiskt mål. **Grindutlåtande idag (2026-10-18), före start:**

| Runda | Grind | Skäl |
|---|---|---|
| R0 Publicera `main` | **Christoffers ja** | Ingen kodrunda; ger spelbar verifiering. Rekommendation: ja |
| R1 Dela `Spel.tsx` | **R1A klar (PR #14); R1B JA** | Alla 7 uppfyllda: ren flytt utan nytt beteende, ritning och prompt i `rundor/R1-dela-spel/`, bevis = strukturvakt + typkontroll + DOM-jämförelse + bilder. Delad i två körningar enligt `build-prompt` (mätt omfattning > 40 turer). Lägst risk, störst hävstång |
| R2 Tillbehör som data | **JA** | JSON och kod skrivna och provkörda av Arkitekten (utan Build), bifogade som `git apply`-patch; Build kopplar bara in och kontrollerar. 5B och 5B-1 misslyckades för att Build skulle mäta/skriva dem. R1 är mergad |
| R3A Entiteter (djuren) + manifest | **JA** | Förbyggd patch och data, ett körsteg, hårda stoppregler (ritningen avsnitt 8); R2 är mergad. Byggnader och reservform ingår inte |
| R3B Reservform (ordägg + lista över saknade ord för Modellspanaren, bara lokalt, ingen server) | **JA** (bilden godkänns av Christoffer efter merge) | Förbyggd patch, data, bild och provkörning; `tolka.ts` orörd; gissningsrättningen ingår (verb 25,2 → 1,6 %, hållet urval 14,8 → 0,4 %). Ritning och prompt i `rundor/R3B-reservform/`. Produktregeln i `projektregler.md` ändras först när han sett `docs/skarmbilder/r3b/ordagg-elefant-375x812.png` |
| R3C Bulkrutin + första 43 modellerna | **JA** | Förbyggd patch, skript, regler i data, urval och provkörning (`rundor/R3C-bulkrutin/`); R3A mergad; modellerna ligger utanför repot och läggs in av Build med rutinen. Paketen är CC0 och redan hämtade av Modellspanaren; Gobkit (kan vara AI-genererat, CC0 enligt utgivaren) kan tas bort ur urvalet om Christoffer vill |
| **R3D Bulkrutinen, andra omgången: 234 CC0-modeller i ett körsteg** | **JA** | Förbyggd patch (1 testfil), skript med `--runda` och flera inkorgar, urval, tillval, bevisskript och kontaktark (`rundor/R3D-bulk-2/`); mätt i skräpkopia: 234 inlagda, 9,6 MB, 0 KB vid start, 0 fel. Kräver att `/workspace/modell-inkorg/` finns för Build. Tre frågor till Christoffer (vapenord, fyra uteslutna OGA-modeller, ordet `monster`) blockerar inte |
| R3G Föremål som egna entiteter (ensam sak + "med"-sak bredvid djuret) | **JA** | Ren patch utan Build (`rundor/R3G-foremal/`): ord härleds ur `entiteter.json` (allt med modell som inte är djur), ingen kod per ord; prov 7/7 (375x812), test:product 118/118. Dinosaurier 1,7, platta saker skalas på längsta sidan |
| R9D Ett uppdrag i taget + förslag som fungerar | **JA** | Ren patch utan Build (`rundor/R9D-uppdragsfix/`): önskningar följer `takt.onskan` (aldrig under Bengtssons uppdrag, aldrig före hans regel), prepositioner (i/vid/under/på …) som "med"-ord, fras-mot-uppdrag-test i test:product; prov 14/14 (375x812), test:product 121/121 |
| R4A Dela `angen3d.tsx` | **NEJ (idag)** | Ren flytt; kommer efter R3 och R6A så deras nya filer inte krockar. Blir JA när R6A-1 är mergad |
| R4B Kamera | **NEJ (idag)** | Beror på R4A (kameran bor i `ang-kamera.tsx`) och Christoffers smak-ja efter två bilder. Efter R6A |
| R5 Byggnader i R3F (Gården) | **NEJ** | Beror på R3A–C, R6A, R4A–B. Kräver ett ja till att Phaser-gården ersätts |
| **R6A-1 Doktor Bengtsson ger de 10 uppdragen (givare + utkast till text, olåst Uppdragsbok)** | **KLAR** (mergad, PR #31) | Texterna är utkast (`granskad: false`) och väntar på Copilot och Christoffers ton-ja |
| **R6A-2 Klicka på Bengtsson: figur på ängen, klick öppnar Skapa-menyn med uppdraget, miner ur data, kravkontroll mot det barnet skrev** | **JA** | Förbyggd patch + data + 16 optimerade bilder + bevisskript (`rundor/R6A-2-klicka-bengtsson/`); tre skriv-uppdrag som utkast; Christoffers smak-frågor (figurens läge, felminen) blockerar inte bygget |
| **R6A-3 Bara Bengtsson ger uppdrag (lappar och önskebubbla pekar på honom via data) + logiska förslag med modell** | **RITNING+PROMPT+patch klara, GO** (`rundor/R6A-3-bara-bengtsson/`) | Kod bevisad i scratch (`ref/r6a-3-1.patch`); förslag ur `data/bengtsson.json` `val`, 14 av 14 har modell (`forslag-prov.ts`). Modellbehov (paraply, regnrock, stövlar, hatt, parasoll, filt m.fl.) → `modellbehov.tsv` till Modellspanaren. Mossas 24 dagliga uppdrag flyttas till **R6A-4** (väntar på Copilot och tonen) |
| **R6A-3B Tangentbord ur data (svensk QWERTY)** | **klar att köra efter R6A-3** (`ref/r6a-3b-2.patch`) | `data/tangentbord.json`, rader som fyller bredden i 375 px; orsaken var `min-width:44px` + `flex-wrap` |
| **R8 Grafik (ersätter 'Snyggare grafik' och Färgrunda)** | **R8-1: RITNING+PROMPT+patch klara, GO** (`rundor/R8-grafik/`); R8-2 ritas efter Christoffers smak | R8-1: `data/miljo.json` (ljus, himmel, dis, färggrad, vinjett, marktextur, kvalitet hög/låg), generell färgrunda (isbjörnen blir blå), före/efter-bilder och mobilmått. R8-2: horisont, träd, blobbskuggor, kontur på djur, vatten, FPS-vakt; filstorlekstaket höjs när R8-2 behöver texturer |
| **R9 Tydlighet (färgord, hemliga djur + gåtor, Bengtssons takt + ikon, stjärnförklaring)** | **Körd av Doodle (PR #41); färgfelet för röd/grön kvar → R9C** (`rundor/R9-tydlighet/`) | Färg: sRGB-fix + gråskala/material för vita djur (blå och gul OK i bild; röd och grön gulsticka kvar, steg 0 för Doodle). 123 nya gåtor, ledtrådsyta, takt 3 djur/150 s/75 s i `data/bengtsson.json`, stjärnor öppnar Ordbokssidor (`data/stjarnor.json`) |
| **R9B Layout-småfixar** (ledtrådsyta kompakt vid uppdrag, Bengtsson skärmrelativ via data/npc.json, förslagsraden avklippt) | **Klar, inlagd direkt** (`rundor/R9B-layout/`, `ref/r9b.patch`, bevis `r9b-prov.mjs`) |
| **R9C Färgord röd/grön** (röd isbjörn ~23° mot 1°, grön ~76° mot 123°; tulpaner rätt) | **Väntar** (pausad av Christoffer; ingen färgpatch) |
| R6B Platserna (skog, sjö, grotta) som R3F-scener | **NEJ** | Beror på R5 (R3F-scener för byggnader/gård) och R4B (kamera) |
| R7 Phaser bort | **NEJ** | Beror på R5 och R6B verifierade i bild |

### R1 – Dela `Spel.tsx` (ren flytt, noll beteendeändring) – delad i R1A (klar) och R1B
**Ritning och prompter:** `rundor/R1-dela-spel/RITNING.md` (exakta rader, filer, props med typer, bevis, stoppvillkor, grindutlåtande), `PROMPT.md` (R1A, körd) och `PROMPT-R1B.md` (R1B, färdig). Den här sektionen är en sammanfattning; vid skillnad gäller RITNING.md, som är mätt.
- **Rättelser mot första utkastet (mätta):** målet "≤ 1 900 rader" var en gissning på fel radnummer. "Pixlarna ska vara lika" är inte mätbart (animerad 3D-scen); beviset är i stället normaliserad DOM före/efter i 28 lägen, textlikhet för det UI:t inte når, `tsc`, strukturvakt och bilder för mänskligt öga. Under ca 1 780 rader kommer filen först när händelsefunktionerna delas i hooks (första steget i R4, inte R1).
- **R1A – KLAR (PR #14, `89fd859`):** `src/spel/ui/typer.ts`, `spelData.ts`, `hjalp.ts` (rena funktioner), `OnskaAnsikte.tsx`, `HoldOppnare.tsx`; `Spel.tsx` 3 133 → 2 740 rader; strukturvakt `scripts/check-spel-struktur.mjs` (`npm run check:struktur`), DOM-tur `verification/r1-dom-tur.mjs`. 23 turer, `medium`, 1,04 USD (`rounds.tsv`). Granskad av Arkitekten: byte-identisk med ritningen, `Spel()`-kroppen oförändrad, DOM 20/20 lika (RITNING.md 4.7).
- **R1B – klar att köra (30 turer, build-fast low, gissning 0,5–1,2 USD):** ett **skript** (`rundor/R1-dela-spel/r1b-flytta.mjs`, skrivet och provkört av Arkitekten) flyttar nio JSX-block (15 komponenter, 171 props) till `AngLager.tsx`, `KartaLager.tsx`, `Hud.tsx`, `BokSkarm.tsx`, `Dialoger.tsx`, `OrdbokDialog.tsx`, `ForalderDialog.tsx`; Build kör det och bevisar. **Mätt i provkörning: `Spel.tsx` 2 740 → 1 781 rader** (gräns steg b: **≤ 1 850**; tidigare gissning 1 960/2 050 var för hög), 0 typfel utan handrättning, 28 av 28 DOM-lägen identiska, 15/15 kroppar byte-lika.
- **Bevisning:** `check:struktur` röd före → grön efter; `r1b-ordagrant.mjs` (textlikhet byte för byte mot `89fd859`, även för dialoger som inget läge når) röd → grön; `typecheck:pages` (0 fel); `eslint` 0 fel/4 varningar; `test:product` med **Node ≥ 22.6** (75/75; på Node 20 ger kommandot `bad option`); DOM-tur 28 lägen före (två körningar, incheckade) mot efter; sex bilder 375×812 före/efter; `kropp ===` 141 före och efter; `git diff origin/main -- data src/tolk` tomt.
- **Mått mot grundtanken:** ingen täckningsändring (parsern rörs inte); värdet är att `Spel.tsx` inte längre blockerar R3.
- **Grind: R1A genomförd; R1B JA** (alla sju punkter, RITNING.md avsnitt 0).

### Åtgärdsmål: djuren ska stå vända mot kameran (standard utan data; `framAxel` bara valfri åsidosättning)
**Prioritet (Christoffer, 2026-10-18):** enkelt kunna fylla spelet med enorma mängder djur och egenskaper. Därför: **standardläget är "vänd mot kameran" och kräver inget fält per djur**; en bulkmodell fungerar utan extra data. `framAxel` är en *valfri* åsidosättning, och bulkrutinens valideringsskript (R3C) mäter/gissar framriktningen automatiskt och flaggar avvikelser.
- **Läge idag (mätt/kodläst, 2026-10-18, utgångsläge `main` före R2):** djuren visar ofta ryggen. Bild `docs/skarmbilder/framriktning/nulage-10-djur.png` (en ögonblicksbild per djur ur byggd `main`, 375×812 beskuren, djuren rör sig så detta är ett stickprov): **kanin, katt, hund och fisk visar ryggen eller sidan; drake, groda, gris och fågel visar framsidan; häst visar sidan; uggla syns inte tydligt i bilden (inte bedömd).** Orsak i `src/spel/angen3d.tsx` r.797–818 (`djurPlats`):
  1. Kameran står på +z (`camera position [0, 4.15, 9.8]`, r.2184). Ett djur som ska vara vänt mot kameran ska ha sin framsida mot +z.
  2. **Kenney-modellerna har sin framsida på +z redan i filen** (mätt ur GLB-JSON: `animal-cat.glb` svansnoden vid z = −0,55 och framben vid z = +0,25; `animal-bunny/dog.glb` framben vid +0,25, bakben vid −0,25). Ändå vrids `kanin`, `katt`, `hund`, `fisk` med `Math.PI` via en hårdkodad lista (`kenney`, r.815) → de vänds bort från kameran. (Min första hypotes, att Kenney-djuren pekar mot −z, var fel; mätningen visar att vridningen själv är felet.)
  3. Flyggrenen (`flygare(spec)`: fågel, uggla, allt med förmågan `vingar`, r.797–803) får ingen vridning alls (vilket råkar stämma för `animal-chick.glb`), men den får det inte heller för andra flygare med annan modell.
  4. Draken har fast `rotation.y = 0.35`; groda och häst får bara `yaw × 0,35` utan kontroll av GLB:ns framriktning (skinnade modeller `drake.glb`/`hast.glb`: framriktning ej uppmätt än, ben `Head`/`Neck` finns).
  5. Gångriktningen vägs bara 35 % (`yaw * 0.35`), så ett djur som går åt sidan vänder sig knappt.
- **Åtgärd (generell, ingen kod per djur):**
  1. *Standard:* modellens framsida antas vara **+z** (konventionen i 9.2). Djuret **vänds mot kameran när det står stilla eller är valt** och **mot gångriktningen vid rörelse** (vikt 1, mjuk utjämning). Ingen lista över djur, ingen `Math.PI`-gren.
  2. *Valfri åsidosättning:* fältet `framAxel` (`"+z" | "-z" | "+x" | "-x"`) på modellen i data (R2: `data/fastpunkter.json` → `kroppar.<kropp>.framAxel`; R3A: `data/entiteter.json` → entitetens `framAxel`). Saknas fältet gäller +z. Fältet får finnas bara där mätningen visar att modellen avviker.
  3. *Automatisk mätning i bulkrutinen (R3C):* `scripts/inkorg/kontrollera.mjs` får kontrollen **Framriktning** (13.4): framsidan mäts ur modellen utan handinmatning, i ordning (a) noden `anchor_face` (dess z-komponent i förhållande till modellens mitt), (b) benet `Head` relativt `Body`/`Root` för skinnade modeller, (c) saknas båda: gissa ur bounding box (kroppsaxeln = längsta horisontella axeln; huvudänden = änden där de högsta hörnen finns). Avviker det uppmätta från det som gäller (standard +z eller satt `framAxel`) **skriver skriptet ut ett förslag på `framAxel` och flaggar raden**, och kräver ingen handinmatning för modeller som redan stämmer. Gissningar märks `(gissad)`.
- **Bevisning:** (a) `framriktning.test.ts` (ren funktion `framVinkel(framAxel)` och `malYaw(...)`: alla fyra axlar ger framsida mot +z; stilla → mot kameran, rörelse → mot gångriktningen); (b) i R3C: `kontrollera.test.mjs` med en falsk modell vänd åt −z ska ge flaggan och förslaget `"framAxel": "-z"`; (c) i webbläsaren, mätbart utan ögonmått: ny testkrok `window.__troll.riktningar()` ger per djur vinkeln mellan modellens framsida i världen och vektorn mot kameran (stilla djur ≤ 20°); (d) bilder 375×812, en per djurtyp (9 GLB-djur + 5 procedurella = 14), där alla är vända mot kameran: tas med ett skript som ett kontaktark per sju djur (två ark; skälet är regeln i `projektregler.md` om högst åtta numrerade bilder per runda, de 14 enskilda filerna ligger kvar som underlag utanför repot).
- **Grindpunkt:** *R2 tar bort `Math.PI`-listan och speglar tillbehörsankarna* (de nio GLB-djuren har framsidan +z, inget `framAxel` behövs i datan; bevis: ritningen R2 avsnitt 1 och 6, bilden ovan före, kontaktarken efter). *R3A* lägger det valfria `framAxel` som verklig kod (standard 0 = vänd mot kameran; en rad i `entiteter.json` vrider modellen) och R3C mäter framriktningen för nya modeller och föreslår fältet. Gångriktning i `djurPlats` ändras inte (djuren vänder sig redan med `yaw*0.35`); en eventuell ny riktningsregel hör till R4B/R6.
- **Kamerakoppling:** riktningen "mot kameran" läses ur kameran (R4B: `data/kamera.json`, `yaw`), inte hårdkodat +z, så att den följer den fasta Hay Day-vinkeln.

### R2 – Tillbehör som data + ett generellt fästsystem (ritning och prompt färdiga: `rundor/R2-tillbehor-som-data/`)
- **Mål:** ett nytt tillbehör = en rad i `data/tillbehor.json` (+ ordrad i `ord.json`), ett nytt djur = en rad i `data/fastpunkter.json`. Placering, skala och riktning ur data, aldrig ur `kropp ===` (0 träffar i `src/spel/tillbehor/`; totalt 141 → 36). De fem kända felen (5A) rättas genom *siffror i JSON* (horn på kanin/katt/hund/fågel/uggla: en `plats`-rad; fågel-ryggsäck och kanin-mantel förbättrade; katt-mantel och häst-horn är kvarstående, se ritningen avsnitt 5).
- **Filer (Arkitekten har skrivit och provkört allt; Build kör `git apply`, skriver varken kod eller siffror):** `data/tillbehor.json` (8 tillbehör, 100 rader), `data/fastpunkter.json` (15 kroppar, 615 rader, härledd mekaniskt ur `tillbehorFaste.ts` med skript, ingen gissad siffra), `src/spel/tillbehor/{data,ankare,bygg,faest,index}.ts` + `data.test.ts` (ersätter `src/spel/tillbehorFaste.ts`, 619 rader, som tas bort), fem små ändringar i `gltfDjur.tsx`, `angen3d.tsx`, `effekter.tsx`, `package.json`. `data.ts` har ingen three-import. Signaturer och dataformer: ritningen avsnitt 2 (utkastet som stod här, med `fram`, `delar`/`mot: huvudbredd` och `modell: null`, är ersatt av de provkörda formerna).
- **Framriktning (åtgärdsmålet i avsnitt 8, ändrat av två mätfynd):** alla nio GLB-djur har framsidan på +z (mätt med orörda renderingar mot kameran) – **inget `framAxel` behövs i någon rad**; fältet är fortsatt tillåtet som valfri åsidosättning men finns inte i datan. Kenney-djurens tillbehör satt på svansänden och tog ut ett annat fel (`Math.PI` i `djurPlats`); R2 speglar därför ankarna (fz′ = 1 − fz) **och tar bort `Math.PI`-listan** i samma runda, så att kanin, katt, hund och fisk tittar mot kameran och tillbehören sitter kvar på rätt ställe. R3A:s del av framriktningen blir alltså bara den allmänna riktningsregeln (stilla mot kameran, rörelse mot gångriktning, valfritt `framAxel` ur entiteten) och `window.__troll.riktningar()`.
- **Bevis:** `data.test.ts` 8/8, `test:product` 83/83, `typecheck:pages` 0, 180-fallsjämförelse gammal/ny kod på de riktiga GLB-filerna (`r2-jamfor.mjs`: 0 oavsiktliga avvikelser, 9 avsiktliga), åtta kontaktark 375×812 (ett per tillbehör, 14 djur) tagna i det byggda spelet med `ark-tillbehor.mjs`.
- **Mått mot grundtanken:** kostnaden för ett nytt tillbehör: **idag ca 9 rundor / 11,9 USD för 8 tillbehör (≈1,5 USD och en runda per tillbehör)** → **efter: en datarad**. Täckning oförändrad (inga nya ord i R2).
- **Storlek:** liten–medium för Build, 14–22 turer, 1,0–1,8 USD (gissning; Arkitektens förarbete ligger utanför Build). **Risk:** `git apply` kan falla om `main` rört `gltfDjur.tsx`/`angen3d.tsx` (reservrecept i ritningen avsnitt 4); skinnade drake/häst är mätta med offsets men synas bara i spelet.
- **Grind: JA** (JSON och kod bifogade, R1 mergad, Build skriver och mäter ingenting; prompten stoppar vid första avvikelse).

### R3A – Entiteter: djuren som data (ritning och prompt färdiga: `rundor/R3A-entiteter/`; medvetet liten)
- **Mål:** `data/entiteter.json` blir sanningen om vilka djur som finns (14 rader), `data/tillgangar.json` manifest med licens/upphov/källa för alla modellfiler. Koden läser data i stället för hårdkodade listor. **Standard = vänd mot kameran utan fält per djur; `framAxel` är en valfri åsidosättning** som är verklig kod (`framVinkel`, vridning runt y på modellen) men som inget djur behöver.
- **Avgränsning (efter R2 och Builds två körningar utan commit):** ingår djurens tabeller (`FIL`, `MAL_HOJD`, `PALETT`, `ART`, `KROPPAR`, `flygare`/`simmare`/`vikt`/`kanHoppa`, drake/groda-material, ugglans natt) → data; `kropp ===` **36 → 20** (mätt). Skjuts upp: byggnader och föremål (R5, ingen kod läser dem förr), `LICENSES.md` och animationsnamn per djur (`klipp`, R3C), Phaser-filerna (R7), kodritade former i `djurmesh.ts`, **reservformen (R3B, med skäl i ritningen avsnitt 9)**.
- **Filer:** NYA `data/entiteter.json`, `data/tillgangar.json`, `src/spel/entiteter.ts` (ren, ingen three-import), `src/spel/entiteter.test.ts`; ÄNDRAS `gltfDjur.tsx`, `angen3d.tsx`, `liv.ts`, `ui/AngLager.tsx`, `Spel.tsx`, `package.json`. Allt i en förbyggd patch (`rundor/R3A-entiteter/ref/r3a-integrera.patch`); Build applicerar och kontrollerar.
- **Bevis:** 8 tester, `test:product` 91, jämförskriptet `r3a-jamfor.mjs` (gamla tabeller ordagrant ur git mot nya data: 322 fall, 0 avvikelser), `check:struktur` grön, DOM-tur 28/28 lika (Arkitektens provkörning), ett krona-ark.
- **Storlek:** liten, 12–18 turer, 0,6–1,2 USD (gissning). **Hårda stoppregler i prompten:** commit + rapport senast tur 24 av 30, högst ett kontaktark, inga dataändringar, ingen mätning. **Grind: JA.**

### R3B – Reservform: ordens väg till synlig form (avsnitt 12; körklar ritning: `rundor/R3B-reservform/RITNING.md`)
- **Mål:** inget ord ger "ingenting". Okänt ord → kategori (lista, lemma, sammansatt, regel, plats) → generisk synlig form (ordägget) med ordets text; varje steg i data. **Ändring mot ursprungsritningen (12.4):** `tolka.ts` ändras *inte*; `tolkaMedReserv()` i `src/tolk/reserv.ts` anropar `tolka()` och lägger ägg på utfallet (`Varelse.reserv?`), så inga befintliga tester ändras. Kropp `"ägg"` för mening utan djur, små svävande ägg över ett vanligt djur.
- **Filer:** NYA `data/reserv.json`, `data/kategori-ord.json` (387 grundord, handskrivna), `data/test-fraser-reserv.json` (50 fraser), `src/tolk/reserv.ts`, `src/tolk/reserv.test.ts` (12 tester), `src/tolk/saknade.ts` + test (8), `src/spel/ordagg.tsx`, `src/spel/ui/SaknadeOrd.tsx`, `data/saknade-ord.json`, `scripts/saknade-ord.mjs` (+ test, 4), `docs/modellbestallning/`; ÄNDRAS `typer.ts`, `Spel.tsx` (ett anrop), `angen3d.tsx`, `liv.ts`, `package.json` (`test:reserv`). Allt i en förbyggd patch (`ref/r3b-reservform.patch`, 8 filer, 659 rader); Build applicerar och kontrollerar. Kompatibel med R3A och R2.1 i alla ordningar.
- **Bevis:** 12 tester + 28 gamla testfraser oförändrade, `test:product` 91/91, `test:reserv` 20/20, DOM-tur 27 av 28 lika (den 28:e är den avsiktliga ändringen), `agg-tur` 0 sidfel och 0 nätverksbegäranden utanför servern, bild `docs/skarmbilder/r3b/ordagg-elefant-375x812.png`, ark `provkorning-ark.png`.
- **Mått mot grundtanken:** *synlig* andel av okända ord (Kelly topp-1000) substantiv 0 → 97,6 %, verb 0 → 97,2 %, adjektiv 0 → 97,1 % (resten är egen form, spärrat eller en kvarvarande gissning); felaktiga "Menade du …?" för verb **25,2 % → 1,6 %** (hållet urval 14,8 → 0,4 %); riktiga djurstavfel som fortfarande ger rätt gissning 92,4 %.
- **Storlek:** liten–medel, 8–12 turer, 0,4–0,8 USD (gissning). **Risk/osäkerhet:** utseendet är Arkitektens förslag (Christoffer har inte sett det); ägg syns inte i Gården (Phaser, försvinner i R7); verb/adjektiv blir ägg, inte rörelse/färg (R3C). **Grind: JA.**

### R3C – Bulkrutin och första modellsatsen (ritning och prompt färdiga: `rundor/R3C-bulkrutin/`; ersätter den ursprungliga skissen i avsnitt 13)
- **Mål:** en mapp GLB + Modellspanarens manifest + en urvalslista → validerade, optimerade modeller med datarader **utan kod**. Första satsen: 43 modeller ur de 322 CC0-modellerna i `/workspace/modell-inkorg/_prioriterad-batch-1/`.
- **Filer:** NYA `scripts/modell-inlagg.mjs` (+ `.test.mjs`, 10 tester), `scripts/modell-verktyg/` (gltf-transform 4.5.1, sharp; installeras separat), `data/inlagg.json` (reglerna: licens, tak, målhöjder, rörelse, böjning, budget), `rundor/R3C-bulkrutin/{forsta-omgangen.txt,kontaktark.mjs,lista.mjs,spel-prov.mjs,mat/}`; patch `ref/r3c-bulkrutin.patch` (4 filer: `entiteter.ts`, `gltfDjur.tsx`, `entiteter.test.ts`, `package.json`). Build genererar `entiteter.json`, `tillgangar.json`, `ord.json`, `kategori-ord.json`, `fastpunkter.json`, `LICENSES.md`, `CREDITS.md` och lägger in GLB-filerna i `public/models/bulk/`.
- **Bevis (provkört):** 322 → **266 klarar valideringen automatiskt (82,6 %)**, 150 utan flagga (46,6 %), 55 hoppas över (ordet taget eller bara flerord), 1 fel; 43 modeller inlagda, 0 fel, `test:product` 92/92; kontaktark och textprov (`spel-prov.mjs`) visar att **0 KB extra hämtas vid start** och att varje modell hämtas när ordet används; **2 044 KB** för 43 modeller (medel 48 KB), projektion ca 11 MB för alla godkända mot budget 25 MB.
- **Mått mot grundtanken:** barnurvalets substantiv med egen form **9/70 → 15/70** (12,9 → 21,4 %); Kelly topp-1000 substantiv 1,3 → 1,6 %. Hus, föremål och mat finns som data och filer men ritas först i R5; "Menade du …?"-gissningarna ökar något tills R3B:s regel är på plats (kombinationen ej mätt).
- **Storlek:** liten–medel, 8–14 turer, 0,5–1 USD (gissning). **Risk:** framsidan går inte att mäta för alla (46 flaggade, kontaktarket är skyddet), färgbyte på modeller utan palett, albumet 14 → 37 djur. **Grind: JA.**

### R3D – Bulkrutinen, andra omgången (ritning och prompt färdiga: `rundor/R3D-bulk-2/`)
- **Mål:** 234 fler CC0-modeller (djur, fordon, mat, möbler, verktyg, växter, sagoväsen m.m.) i spelet utan kod per modell, ett `lagg`-steg. **Skript:** `--runda`, flera inkorgar i ett steg, `urval`-kommandot och `paket_prioritet` (Kenney/Quaternius/KayKit före Gobkit/Poly Pizza/OGA när två vill ha samma ord) i `data/inlagg.json`. **Patch:** bara `src/spel/entiteter.test.ts` (R3C eller R3D, nytt CC0-test).
- **Mått (skräpkopia, mätt):** 234 inlagda (100 djurord, 192 kategoriord, 292 nya ord), 0 fel; 9,6 MB, totalt 13,1 MB av 25 MB; 0 KB hämtat vid start; 43 KB per nytt ord i snitt; appbundeln +14 KB gzip; `test:product` 103 → 104. **Utanför:** alla CC-BY (väntar på kreditvisning), fyra över triangeltaket, tre med trasig konvertering, fyra oanvändbara OGA-basmodeller.
- **Storlek:** 8–12 turer, ca 0,4–0,9 USD (gissning). **Grind: JA.** **Osäkert:** 44 modeller utan mätt framsida (arket kontrollerar djuren, inte nio fordon), ord/genus är regler som Copilot ska granska, mobil är inte mätt på telefon. **R3E (Tack-ruta med krediter, inkl. Meshy-raden) och R4A-ritningen skrivs senare** (kvoten).


### R4A – Dela `angen3d.tsx` (2202 rader, ren flytt) (= BLOCK-platser B1.1)
- **Mål:** ingen fil över 800 rader. **Filer (nya, `src/spel/ang/`):** `scen.tsx` (`Scen`, ljus, natt), `djur-i-scen.tsx` (`DjurIScen`, `djurPlats`, `ModellGren`), `natur.tsx` (`TradOchBlommor`, `GrasTuvor`, `Stenar`, `Nackrosor`, `Forgrund`, `NaturGren`), `saga.tsx` (`SagaKamera`, `SagaPenna`, `SagaBoll`, `SagaKanin`, `SagaLjus`), `kamera.tsx` (`KameraRam`, OrbitControls), `ang3d.tsx` (`Angen3D`, `TredGren`, sonden `window.__tred`). **Bevis:** `check-spel-struktur` utökas till `angen3d`; bilder oförändrade pixel för pixel. **Mått:** täckning oförändrad. **Storlek:** medium, 20–25 turer, 2 USD (gissning). **Grind: NEJ idag.**

### R4B – Kamera: fast Hay Day-liknande vy (avsnitt 16)
- **Mål:** ortografisk kamera, fast vinkel, pan/zoom med gränser, stående mobil som mått. **Filer:** NY `data/kamera.json`, `src/spel/ang/kamera.tsx` (ersätter `KameraRam`/OrbitControls), test `kamera.test.ts` (rena beräkningar: frustum, pan-gränser). **Bevis:** bilder `01-ang-10-djur`, `02-ang-zoom-in`, `03-ang-pan-gransen`, `04-landskap`; kontroll att ingen av 10 djur + 8 byggnader klipps på 375×812. **Mått:** andel av scenen som syns utan att barnet drar: alla djur 100 %. **Storlek:** medium, 20–30 turer, 2–3 USD (gissning). **Risk:** touch-gester i R3F (skillen `controls`), HUD-ytor. **Grind: NEJ idag** (Christoffers smak).

### R5 – Byggnader i R3F (Gården, avsnitt 14.3)
- **Mål:** de 36 byggorden i `data/bygg.json` som entiteter (`typ:"byggnad"`) i `data/entiteter.json`, ritade i 3D via samma system som djur och tillbehör (ankarpunkter `anchor_door`, `anchor_window_*`, `anchor_roof`, `anchor_chimney`, `anchor_slot_*` för boende). **Filer:** NYA `src/spel/gard3d.tsx`, `src/spel/byggdelar3d.ts`; ÄNDRAS `Spel.tsx` (`varld === "gard"` → `<Gard3D/>`), `data/entiteter.json`; `bygge.ts`/`SparatBygge` och `data/bygg.json` rörs inte (läses). **Bevis:** bilder `01-gard-tom`, `02-hus-3-fonster`, `03-stall-med-djur`, `04-flytta-byggnad`, `05-hage-och-staket`, `06-alla-grundbyggen`. **Mått:** byggord med egen 3D-form **6 av 36 grova former (`slag()`) → ≥ 24 av 36 egna modeller/material**; byggord utan form → reservform (kategori `byggnad`). **Storlek:** stor, 2 rundor à 30–40 turer, 6–8 USD (gissning). **Grind: NEJ.**

### R6A – Doktor Bengtsson ger uppdragen (ritning och prompt färdiga: `rundor/R6A-bengtsson/`) – förd fram: direkt efter R3C
- **Beslut (Christoffer 2026-10-18):** Bengtsson kommer efter content-motorn (R3C) och före kamera, byggnader och Phaser-borttagning. **Alla uppdrag i spelet ska komma från Bengtsson.** Copilot hinner inte ikväll, därför delas rundan så här.
- **R6A-1 (körklar, mycket liten): givaren byts för de 10 befintliga uppdragen.** Samma mål och regler (data), bara givare + text: `data/uppdrag.json` får `givare: "bengtsson"`, `text_bengtsson`, `klart_bengtsson`, `granskad: false` (mina utkast; Copilots originaltexter ligger kvar som `text`/`klart`), ny `data/npc.json`. Patch (`ref/r6a-1.patch`, 6 filer + test): hjälparna `uppdragText`/`uppdragKlart`/`nyttUppdragRad`, Uppdragsboken visar "Doktor Bengtsson: …", och menyvalet "Uppdragsboken" är olåst (enda ingången). Phaser rörs inte. **Mått:** uppdrag med Bengtsson som givare 0 → 10 av 10; uppdrag som går att nå i Uppdragsboken 0 → 10; `test:product` 92 → 97. **Storlek:** 6–9 turer, ca 0,3–0,6 USD. **Grind: JA.**
- **R6A-2 (körklar, liten): klicka på Bengtsson (ritning och prompt: `rundor/R6A-2-klicka-bengtsson/`).** Christoffer ville att man klickar på Bengtsson för att få uppdraget, då öppnas Skapa-menyn och man löser det; han hittade också färdiga bilder (OneDrive `Troll/Bengtsson`, 16 PNG). **Bilderna:** hämtade, frilagda, WebP, 595 KB under `public/npc/` (Bengtsson åtta miner, Syntaxviruset fem, biljett/sjö/solros), beskrivna i `data/npc.json` (`bilder`, `miner`, `reserverade`); egna bilder, källa i `CREDITS.md`; flödet `mat/npc-bild.py`. **Designen:** Bengtsson är en 2D-bild över ängen (ingen 3D-modell, ingen Phaser-ändring); vilken mine som visas styrs av regler i `data/npc.json` (läge → bild: pågår = tänkande, klarat = glad, fel svar = automaten, bara äventyr kvar = karta, allt klart = solbränd, annars framsida), ingen kod per mine. Klicket startar ett **skriv-uppdrag** (nytt: `data/bengtsson.json`, tre utkast, ett med Christoffers egen formulering "din kanin fryser") och öppnar Pennans bok med uppdraget överst; efter skapandet jämför en ren motor (`uppdragsmotor.ts`) det barnet skrev med `krav.ord` (böjning och sammansättning räknas, ägg räknas). Skapandet sker alltid; fel svar ger ett skämt, inget straff. Uppdragsboken är kvar som lista. **Mått:** `test:product` 97 → 103; Spel.tsx 1794 → 1809 av 1850; provkörning i byggd sida exit 0. **Storlek:** 10–14 turer, ca 0,4–0,8 USD. **Grind: JA.**
- **R6A-3 (klar att köra, Christoffer 2026-10-18):** (1) bara Bengtsson ger uppdrag: lappar (`data/skyltar.json`: `givare`, `text_bengtsson`) och önskebubblan (`data/firande.json`: `fran_bengtsson`-mallar) pekar på honom via data, Phaser rörs inte; (2) logiska förslag per uppdrag i `data/bengtsson.json` `val`, alla med modell (bevisskript), saknade modeller i `modellbehov.tsv`; (3) **R6A-3B** tangentbord ur `data/tangentbord.json`. Se `rundor/R6A-3-bara-bengtsson/RITNING.md`. **R6A-4:** de 24 utkasten i `/workspace/trollpennan-nulage/bengtsson-uppdrag.md`, väntar på Copilot och tonen (design i `rundor/R6A-bengtsson/RITNING.md` avsnitt 5). **Grind: GO.**
- **R8 Grafik (ersätter 'Snyggare grafik'):** appen 'långt sämre än Minecraft'. Största bovarna: platt mark utan textur, hårt horisontband (dis och himmel olika färg), platt ljus utan färggrad, vit isbjörn (palett-bytet träffar inga pixlar på färgatlas-modeller). R8-1 löser mark, ljus, dis, färggrad, vinjett och färgrundan via `data/miljo.json` och ett generellt `karnfarg()`; R8-2 (väntar) tar horisont, träd, skuggor, kontur, vatten, FPS-vakt. Se `rundor/R8-grafik/RITNING.md`. **Grind: R8-1 GO; R8-2 JA efter R9G (före B2).**
- **Öppet:** Mossa har 24 egna dagliga uppdrag (`data/mossa.json`) på den låsta Gården; de rörs inte i R6A (Christoffer avgör om Bengtsson ersätter dem; `RITNING.md` avsnitt 6).
- **Kvot:** 25 USD extra men veckokvoten 91 %: R6A-1 är medvetet liten och har stoppregel (commit + rapport senast tur 24 av 30).

### R6B – Platserna (skog, sjö, grotta) som R3F-scener (ERSATT av BLOCK-platser B1–B4)
- **Mål:** platserna ur `data/platser.json` som R3F-scener med kamera och byggnader från R4B/R5; Bengtssons uppdrag får sina riktiga platser. **Grind: NEJ** (beror på R4B och R5). **Storlek:** stor, 2 rundor, 5–8 USD (gissning).

### R7 – Phaser bort och menyn upplåst
- **Mål:** `phaser`, `scen.ts`, `gard.ts`, `avscen.ts`, `starta.ts`, `avbro.ts`, `ritaBygg.ts`, `deladeBilder.ts` bort; menyknapparna (Gården, Byggboken, Albumet, Ut på äventyr, Uppdragsboken, Bok) upplåsta (`lasMeny` bort, `Spel.tsx` r.2346–2365). **Bevis:** `rg -l phaser src package.json` = 0; Phaser-chunken (1,25 MB) borta i `check:pages-output`; bilder `01-meny-upplast`, `02-alla-vyer-r3f`. **Mått:** bundle −1,25 MB; alla vyer visar samma 3D-modeller (tillbehören syns i Gården och äventyret). **Storlek:** medium, 25–30 turer, 3 USD (gissning). **Grind: NEJ** (beror på R5–R6; upplåsning = Christoffers ja, 10.2).

---

## 9. Tillgångsflöde (utkast; bulkrutinen med inkorg och validering är avsnitt 13)
Stil i en rad (ur koden): **mjuk low-poly leksak, platt toon-skuggning (3-stegs `DataTexture` 72/158/255), tjock mörk kontur `#3B2F2F` via inverterat skal (`BackSide`, 1,18× större kopia)**. Alla fria 3D-modeller saknar kontur; kontur och toon läggs i koden för allt, då smälter olika paket ihop (assets-bengtsson/RAPPORT.md).

### 9.1 Namngivning och mappar
`public/models/<kategori>/<id>.glb`, kategori ∈ `djur | tillbehor | bygg | natur | foremal`. `<id>` = ASCII-gemener med bindestreck (`hast`, `trollkarlshatt`; inga å/ä/ö i filnamn; svenska namnet bor i data). Befintliga filer (`animal-*.glb`, `drake.glb`, `hast.glb`, `groda.glb`, `natur/`) flyttas inte; de får manifestrader. Nodnamn i filen: `anchor_*` (gemener, understreck) för ankare, `attach` för tillbehörets fästpunkt. Källfiler (FBX/Blend) sparas **inte** i repot.

### 9.2 Skala och orientering
- Enhet: 1 = en meter i modellen; **koden normaliserar djur till `malhojd`** (`MAL_HOJD`, idag 0,7–1,5) så importen behöver inte skalas exakt, men filens egen höjd ska vara 0,3–3,0.
- Y upp, **framåt = +z** i nya filer. **Standard = vänd mot kameran, utan fält per djur** (se åtgärdsmålet "Djuren vända mot kameran" i avsnitt 8). Avviker en modells framsida från +z anges det som valfri åsidosättning `"framAxel": "-z"`; valideringsskriptet (13.4) mäter framriktningen och flaggar avvikelser i stället för att kräva handinmatning. **Kenney-djuren avviker inte** (mätt 2026-10-18 ur GLB-filerna: svans/bakben vid −z, framben vid +z, alltså framsida +z); den hårdkodade `Math.PI`-vridningen i `angen3d.tsx` r.815 är det som får dem att visa ryggen.
- Origo i marken under djurets mitt (fötterna på y=0). Tillbehör: origo = fästpunkten (kronans bas, glasögonens mitt mellan ögonen), bredd mot huvudets bredd = 1,0 enhet.
- Ankarnoder (tomma noder, +z ut från ytan, skala 1): `anchor_head` (huvudets topp), `anchor_brow` (pannan, för horn), `anchor_face` (mitt mellan ögonen, för glasögon), `anchor_ear_l`/`anchor_ear_r` (rosett), `anchor_neck` (halsduk), `anchor_back` (ryggsäck/mantel), `anchor_mouth` (eld). På skinnade modeller (drake, häst) är noderna barn till benet (`Head`, `Neck`, `Body`) så de följer animationen; på Kenney-djuren (inget huvudben) barn till `body`.

### 9.3 gltf-transform-steg (CLI 4.5.1, MIT; flaggor verifierade med `--help` 2026-10-18)
```bash
npx @gltf-transform/cli@4.5.1 validate in.glb
npx @gltf-transform/cli@4.5.1 inspect  in.glb            # trianglar, texturer, noder
# 1) optimera UTAN att platta scenträdet (annars försvinner ankare och ben)
npx @gltf-transform/cli@4.5.1 optimize in.glb tmp.glb \
  --flatten false --join false --instance false --palette false --prune false \
  --compress meshopt --texture-compress webp --texture-size 512
# 2) rensa ändå, men behåll tomma noder (ankare!)
npx @gltf-transform/cli@4.5.1 prune tmp.glb public/models/djur/<id>.glb --keep-leaves true
# 3) lägg ankare (eget skript, gltf-transform-API): node scripts/tillgangar/ankare.mjs <id>
```
Flaggorna `--flatten`, `--join`, `--instance`, `--palette`, `--prune`, `--compress`, `--texture-compress`, `--texture-size` och `prune --keep-leaves` finns i 4.5.1. **Standardvärdena för `optimize` är `flatten=true`, `join=true`, `prune=true`**: kör aldrig bara `optimize in out`. `drei useGLTF` laddar Meshopt som standard (att verifiera i R3). FBX → GLB: Blender eller `FBX2glTF` utanför repot (Quaternius Farm Animal/Cute Monsters/Cute Fish/Dinosaurs levereras som FBX/OBJ/Blend, inte glTF).

### 9.4 Manifest och `LICENSES.md`
`data/tillgangar.json` (se R3) är källan; `LICENSES.md` genereras av skriptet och checkas in:
```
## <titel> – <upphov>
- Licens: CC0-1.0   (CC-BY-3.0 → "Kredit i spelet: ja, <testid>")
- Källa: <URL till paketets/modellens licenssida>
- Hämtad: 2026-10-18   Av: <vem>
- Filer: public/models/djur/hast.glb, …
- Ändringar: gltf-transform optimize …; ankarnoder tillagda
```
Spelet visar bara kredit för CC BY (idag groda, `Spel.tsx` r.2953). CC0 kräver ingen kredit men skrivs in här.

### 9.5 Kandidater (licens verifierad via WebFetch/curl av licenssidorna 2026-10-18; inget är nedladdat eller inlagt i repot)
| # | Paket / modell | Upphov | Licens (verifierad på) | Passar till |
|---|---|---|---|---|
| 1 | Cube Pets 2.0 – https://kenney.nl/assets/cube-pets | Kenney | CC0 ("License: Creative Commons CC0" på paketsidan; Kenneys support https://kenney.nl/support säger CC0, attribution ej krav) | Redan använd (6 djur). Mer av samma stil |
| 2 | Ultimate Animated Animals – https://quaternius.com/packs/ultimateanimatedanimals.html | Quaternius | CC0 (paketsidan "License CC0"; https://quaternius.com/faq.html "All models are under the CC0 License", ingen kredit krävs). 12 djur, 12+ animationer, **glTF ingår** | Luckor: groda (byter ut CC BY-grodan, **art i paketet ej kontrollerad**), ekorre, bäver, gris – kontrollera artlista vid nedladdning |
| 3 | Animated Dinosaurs – https://quaternius.com/packs/animateddinosaurs.html | Quaternius | CC0 (paketsidan). 6 dinosaurier, FBX/OBJ/Blend (konvertera) | `dinosaurie` (idag procedurell form) |
| 4 | Farm Animal Pack – https://quaternius.com/packs/farmanimal.html | Quaternius | CC0 (paketsidan). 7 gårdsdjur, FBX/OBJ/Blend | Gris och gårdsdjur till Gården |
| 5 | Cute Fish – https://quaternius.com/packs/cutefish.html | Quaternius | CC0 (paketsidan). 50+ animerade fiskar | `haj`, fler fiskar i sjön |
| 6 | Cute Monsters / Ultimate Monsters – https://quaternius.com/packs/cutemonsters.html, https://quaternius.com/packs/ultimatemonsters.html | Quaternius | CC0 (båda paketsidorna). 21 resp. 50 monster. Dragon: https://poly.pizza/m/3rUm1cN3yp (CC0 1.0, Poly Pizza-sidan) är redan `drake.glb` | Vilda djur i äventyret, nattdraken |
| 7 | Nature Kit – https://kenney.nl/assets/nature-kit | Kenney | CC0 (paketsidan). Redan använd (22 filer) | Äventyrets skog/sjö/grotta (R5) |
| 8 | Furniture Kit / Food Kit / Holiday Kit – https://kenney.nl/assets/furniture-kit, https://kenney.nl/assets/food-kit, https://kenney.nl/assets/holiday-kit | Kenney | CC0 (alla tre paketsidor) | Gårdens inredning, gåvor, lyktor, bänkar (se assets-bengtsson/RAPPORT.md för valda filer) |
| 9 | Crown – https://poly.pizza/m/i0PZVuVlYv; Cupcake – https://poly.pizza/m/XL70IUDIrZ; Arrow Sign – https://poly.pizza/m/dwmvPHHCdq | Quaternius (via Poly Pizza) | CC0 1.0 (modellsidorna visar `Licence: CC0 1.0`) | Krona som riktig tillbehörsmodell i R3, gåva, skylt |
| 10 | Hat (fedora, "hat-stylised") – https://poly.pizza/m/lNN3PlrjSa | hat_my_guy (Poly Pizza) | CC0 1.0 (modellsidan) | Hatt-kandidat; "vuxen" form enligt assets-bengtsson/RAPPORT.md, kitets hatt är sötare |
| 11 | KayKit Halloween Bits – https://kaylousberg.itch.io/halloween-bits; KayKit Adventurers – https://kaylousberg.itch.io/kaykit-adventurers | Kay Lousberg | CC0 (itch-sidans "Asset license: Creative Commons Zero v1.0 Universal" och "no attribution required"). Adventurers har vapen: välj bort för barnspel | Hattar/rekvisita (innehåll ej inspekterat) |
| 12 | Cute Cloud (2D SVG) – https://opengameart.org/content/cute-cloud | Urs Roesch (insänd av qubodup) | CC0 (OpenGameArt-sidan "License(s): CC0") | Moln/väder i 2D-UI |
**Redan i spelet med krav:** `groda.glb`, "Frog" av jeremy, **CC BY 3.0** (https://poly.pizza/m/07-wJ9bkzul, Poly Pizza-sidan visar `Licence: CC-BY 3.0`) – namnangivelse krävs och finns. Mål: byt mot en CC0-groda.
**Fällor:** Poly Pizza-sidor har *olika* licens per modell (CC0 eller CC BY); kontrollera varje modell, inte sajten. Poly Pizzas FAQ/about-sidor (https://poly.pizza/faq, /about) gav 404 vid försök; verifiering skedde på modellsidorna. Quaternius' FAQ visar licenstexten men svaren är hopfällda i den hämtade sidan; paketsidorna visar "License CC0". Licenskontroller görs om vid varje ny hämtning (datum i manifestet).

---


## 10. Beslut och öppna frågor

### 10.1 Beslut (Arkitekten) – fattade, ingen fråga till Christoffer
- **(a) Phaser tas bort, i R7.** Skäl: grundtanken kräver att allt barnet skriver syns med samma modeller överallt, och med två renderare (R3F och Phaser) måste varje tillbehör, byggnad och uppdragsscen göras två gånger; mätt idag syns inte de 3D-tillbehören i Gården och äventyret. Men inte förrän R5 (Gården) och R6 (äventyret) är verifierade i bild; fram till dess bevaras Phaser (mandatet i `projektregler.md`: "bevaras tills ett byte har motiverats och verifierats" – motiveringen är den här, verifieringen sker i R5–R6) och får bara bugfixar. Under övergången en nödutgång `?renderare=phaser`.
- **(b) `LICENSES.md` (genereras ur `data/tillgangar.json`) och `CREDITS.md` blir en kort pekare plus den publika krediten för CC BY (grodan).** Skäl: en maskinläst, komplett licensfil som skriptet kan kontrollera och skriva om utan att handskrivna tack skrivs över; spelet visar bara det som licensen kräver.
- **(c) `build/runda-4d` (lokal gren i `/workspace/trollpennan-build`, commits `db8a1e4`, `29dff5d`, `b772cf1`): släng.** Skäl (granskat): grenen ändrar bara `src/spel/effekter.tsx` (+20/−13) och `RUNDA4D.md`; 4E (PR #9, redan i `main`) bygger vidare på samma kod och har samma glittervärden (32 prickar) och en annan glöd (rund gloria), så ingenting unikt finns kvar. Lärdomen i `RUNDA4D.md` ("`test:product` föll: Node 20.19.2 tar inte `--experimental-strip-types`") är införd i R1:s förutsättningar. Utfört: **nej** (jag rör inte den klonen); den som städar kör `git branch -D build/runda-4d` i `/workspace/trollpennan-build` (hasharna ovan återskapar den).
- **(d) `angen3d.tsx` delas i R4A, direkt efter R3 och före kamera (R4B) och byggnader (R5).** Skäl: R3 lägger nya filer i stället för i den, kameran och Gården måste in i den, och 2202 rader är nästa `Spel.tsx`-problem. Ren flytt, inga nya beteenden, bevis = oförändrade bilder.
- **Grenhantering generellt:** en gren per runda `build/runda-N` utgår från aktuell `origin/main`; Arkitektens dokument ligger på `arkitekt/*`; en gren raderas lokalt och på `origin` när PR:en är sammanslagen eller stängd (raderingen på `origin` kräver ja, se 10.2); inga långlivade lokala grenar utan PR (idag lokalt i `/workspace/trollpennan-build`: `build/runda-3f`, `4b`, `5b`, `5b1` utan commits före `main`, och `4d`: alla raderas); `text/granskning-1` och `copilot-jobb` är Copilots och rörs inte av Arkitekten; en runda startas bara när föregående är sammanslagen eller avvisad, så grenarna aldrig staplas.
- **Övrigt beslutat:** Ordningen R1 före R2 (10.3 punkt 9 gäller fortfarande som konfliktrisk). `HANDOFF.md`, `BLOCK-STATUS.md`, `IMPROVEMENT-LOG.md` ligger kvar som historik tills vidare (ingen åtgärd, ingen risk). Reservformen (avsnitt 12) och entitetsmodellen (avsnitt 14) är mina beslutade riktningar; själva ändringen av produktregeln och utseendet kräver ja nedan.

### 10.2 Kräver Christoffers ja (smak, pengar, kvot, publicering, push/PR/merge)
1. **Publicera `main` på https://trollpennan.grok.me/ (R0).** Live är äldre än `main` (avsnitt 17). *Rekommendation: ja,* så fort Runda 1–5A-innehållet är kontrollerat i bild; annars testas fel version.
2. **Ändra produktregeln "Bara ord i ord.json skapar något" (`projektregler.md`, Säkerhet) så att varje icke-spärrat ord får en synlig reservform (ordägg).** Det är en smakfråga och en regeländring: grundtanken ("nästan oavsett vad hen skriver") kräver den, men utseendet och tonen ("Det här har jag aldrig sett – jag ritade en gissning") är hans. *Rekommendation: ja,* med att han godkänner äggen på bild i R3B. Spärrlistan gäller alltid och ger aldrig en form.
3. **Kvot och pengar.** Mina gissningar: R1 2–3 USD, R2 2–3, R3A 0,6–1,2 (nu liten), R3B 3, R3C 3–4, R4A 2, R4B 2–3, R5 6–8, R6 8–12, R7 3, summa ca 35–45 USD (inte mätta; `rounds.tsv` visar ca 25,7 USD för 17 rundor, varav 5 utan resultat). *Rekommendation: ja till R1–R2 nu* (lägst risk, stoppar läckan) *och R3A–R3C därefter;* R4–R7 beslutas efter R3C med uppmätta kostnader. **Uppdatering 2026-10-18:** Christoffer har lagt till 25 USD i kvot för projektet, men veckokvoten är på 91 %: alla rundor hålls små (en logisk förändring), har förbyggd patch där det går och en stoppregel (commit + rapport senast tur 24 av 30, inga omkörningar). R6A delas därför i två körningar.
4. **Vilka modellpaket som hämtas (stil och smak).** Förslag i 9.5; första satsen R3C: Quaternius Ultimate Animated Animals, Cute Fish, Farm Animal Pack, Kenney Food Kit och Furniture Kit (alla CC0, licenssidor kontrollerade 2026-10-18). *Rekommendation: ja till dessa fem* (inget laddas innan du säger ja).
5. **Push och PR för `arkitekt/project-md`** (PROJECT.md, projektregler.md, mätunderlag, skärmbilder). *Rekommendation: ja,* så att alla agenter läser samma plan.
6. **Radera de 10 gamla fjärrgrenarna `build/runda-*` på `origin`** (alla sammanslagna eller stängda). *Rekommendation: ja,* men först när R1 är startad så ingen historik behövs.
7. **Doktor Bengtssons uppdrag: ton och innehåll (smak).** 24 utkast ligger i `/workspace/trollpennan-nulage/bengtsson-uppdrag.md`; spelets 10 befintliga uppdrag har andra givare (Ekorren, Mossugglan, Bävern …) vilket strider mot regeln "bara Bengtsson ger uppdrag". *Rekommendation: ja till att alla givare blir Bengtsson i R6* (de 10 gamla texterna skrivs om av Copilot) och att du läser de sex första uppdragen på bild innan resten görs.
8. **Kamerastilen (smak):** ortografisk, 35° ned, fast, pan/zoom i gränser (avsnitt 16). *Rekommendation: ja,* efter två bilder i R4B (före/efter).
9. **Upplåsning av menyknapparna (Gården, Byggboken, Albumet, Ut på äventyr, Uppdragsboken, Bok)** – idag hårdkodade som "Kommer senare" (demoläge, `data/texter-gard.json` `demo.senare`). *Rekommendation: ja, i R7* (efter att vyerna finns i R3F), inte tidigare.

### 10.3 Osäkerheter (ärligt)
1. **Inget av det som är "kodläst" är körts om i en byggd `main`**; live-spelningen (avsnitt 17) gäller en äldre version. Rundkostnaderna i `rounds.tsv` är delvis uppskattade (5B, 5B-1: `grok usage` saknar registrering).
2. **Kvarvarande tillbehörsfel är bedömda ur Builds och min bildläsning (5A-rapporten), inte omkontrollerade** i spelad version.
3. **`HANDOFF.md` i repot är gammal** (B03-checkpoint, 2026-10-13) och stämmer inte med läget.
4. **`ord.json` rörs inte av planen,** men nya ord (R3C) kräver ordrader som Copilot/Christoffer granskar; det är utanför Builds ramar.
5. **Mobilprestanda är omätt** (ingen riktig telefon; allt är SwiftShader). Triangel- och filbudgetarna är mina startvärden, inte mätta.
6. **Licensverifieringen av Quaternius FAQ:** de enskilda paketsidorna visar CC0; zip-filernas egna licensfiler är inte öppnade (inget nedladdat). Artlistorna i paket 2–5 är inte kontrollerade.
7. **Kelly-listans licens är dubbeltydig** (resurssidan: filerna CC-BY-4.0; beskrivningstexten: CC-BY-SA 3.0/LGPL 3.0). Jag använde den bara för mätning och lagrar den inte i repot; mätunderlaget innehåller bara de ord jag räknat, inte listan.
8. **Täckningsmåttet mäter kodens beteende mot en frekvenslista för vuxen webbtext,** som underrepresenterar barnens konkreta ord. Därför finns även en handvald barnlista (Arkitektens urval, inte ur lista). Båda är ofullkomliga mått; det viktiga är trenden före/efter.
9. **Ordningen på R1/R2:** kan köras i valfri ordning tekniskt (olika filer), men R2 kräver att R1 inte pågår samtidigt i `Spel.tsx`/`gltfDjur.tsx` (konfliktrisk i `package.json`).
10. **Gamla 2D-bilder** (`public/kit/tillbehor/*.png`) används kvar i bok och formelkort; om UI också ska visa 3D-bilder är inte beslutat.

## 11. Täckningsmått: hur mycket av det barnet skriver blir synligt (mätt 2026-10-18)

### 11.1 Hur text tolkas idag (läst i koden, bekräftat mätt och live)
`tolka()` (`src/tolk/tolka.ts`) delar texten i ord (`tokensAv`), slår upp varje ord mot `data/ord.json` (97 ord: 26 djur, 21 färger, 18 förmågor, 12 mönster, 12 tillbehör, 6 storlekar, 2 egenskaper; `lexikon.ts`), delar sammansättningar bakifrån (sista delen måste vara ett djur eller tillbehör, `delaOrd`/`lasPrefix`; förleden ur `ord.json` `sammansattningar.forled`, 31 stycken), gissar stavning (`avstand.ts`, `felgrans`: ≤5 tecken 1 fel, annars 2) och föreslår "Menade du …?". Byggord går en annan väg (`byggtolk.ts`, `data/bygg.json`: 36 byggord, 6 delar, 9 material) och gåvor en tredje (`gavotolk.ts`, 20 gåvor).
**Ett okänt ord** blir `okand`: ett *skapat djur* ignorerar ordet tyst (och sparar det inte: `Spel.tsx` sparar bara okända ord vid `behover_djur` och byggen), en mening utan djur ger rutan "Pennan behöver ett djur. Prova … kanin / katt / hund" och sparar ordet i `onskelista` (högst 80, visas bara under "Önskelista – Ord som Trollpennan inte kunde än" i föräldravyn (håll inne 3 s), `Spel.tsx` r.3028–3034, alltså inte för barnet). Ingenting ritas för ordet. **Täckningen för "okänt ord" är alltså 0 %.**

### 11.2 Metod
- **Källa:** Kelly-listan, Språkbanken Text (Volodina & Johansson Kokkinakis; 8 425 lemman ur webbkorpusen SweWaC, 114 miljoner ord; uppdaterad 2017-09-15; https://spraakbanken.gu.se/en/resources/kelly; licens: se 10.3 punkt 7). Rangordning efter `wpm` (ord per miljon) bland poster med uppmätt frekvens (källa SweWaC). Ordklasser: substantiv = `noun-en`, `noun-ett`, `noun`; adjektiv; verb. Lemmat är grundform.
- **Urval:** (A) topp 1 000 substantiv (997 unika lemman) och topp 1 000 verb; **adjektiv: 849** (så många har uppmätt frekvens; hela listan har 1 354); (B) alla A1–A2-ord (CEFR, 1 251 / 390 / 614); (C) **handvalt barnurval** (Arkitektens, ej ur frekvenslista): 70 vardagssubstantiv, 30 adjektiv, 30 verb; (D) **slumpurval 100** (frö 20261018) ur A: 34 substantiv, 33 adjektiv, 33 verb, spelat **live** (avsnitt 17).
- **Test per ordklass** (parsern `tolka`/`tolkaBygg` buntad med esbuild utanför repot, ingen spelstart): *substantiv* = något av `tolka("N")` skapar något utan att N är okänt, `tolka("en kanin med N")` ändrar djuret, eller `tolkaBygg("ett N")` bygger något; *adjektiv* = `tolka("en ADJ kanin")` ändrar djuret och ordet är inte okänt; *verb* = `tolka("en kanin som kan V")` eller `…som <presens>` (-ar/-er/-r) ändrar djuret. "Blir synligt" = djurets formel/kropp/tillbehör/förmåga/färg/mönster/storlek skiljer sig från `en kanin`. **Förslag** ("Menade du …?") räknas inte som täckt: det är en gissning, inget syns.
- **Begränsningar:** böjningar av verb är en regel (-ar/-er/-r + infinitiv efter "kan"), inte SALDO; substantiv testas i grundform. Verbfalska träffar rättade för hand (nedan).

### 11.3 Resultat (kod)
| Urval | n | Blir egen synlig form | Andel | "Menade du"-gissning | Frekvensviktad täckning |
|---|---|---|---|---|---|
| Substantiv, topp 1 000 | 1 000 (997 unika) | **12** unika: hus, port, katt, hund, häst, fisk, träd, mur, krona, sjö, eld, guld | **1,2 %** | 117 (11,7 %) | 1,1 % |
| Adjektiv, topp 849 | 849 | **16**: liten, stor, vit, svart, snabb, röd, grön, enorm, blå, gul, grå, rödgrön, rosa, osynlig, brun, gyllene | **1,9 %** | 42 (4,9 %) | 21,1 % (liten, stor väger tungt) |
| Verb, topp 1 000 | 1 000 | rått 8, **5 äkta**: hoppa, springa, flyga, lysa, simma (supa, pricka, fiska är slumpträffar: `super`, `prickar`, `fiskar`) | **0,5 %** | 252 (25,2 %) | 0,2 % |
| A1–A2: substantiv / adj / verb | 1 251 / 390 / 614 | 18 / 10 / 4 | 1,4 % / 2,6 % / 0,7 % | 130 / 23 / 176 | – |
| Barnurval (C): substantiv | 70 | 9: gris, blomma, regnbåge, tält, rutschkana, gunga, stall, bro, sjö | **13 %** | 6 (får, mus, stol, kanon, skatt, grotta) | – |
| Barnurval (C): adjektiv / verb | 30 / 30 | 1 (randig) / 5 (springa, hoppa, flyga, simma, lysa) | 3 % / 17 % | 2 / 12 | – |

**Verkliga felgissningar (viktigt för barn):** `en kanin som går` → "Menade du *grå*?"; `en kanin som dansar` → "Menade du *dino* / *nasse*?"; `med land` → "*ränder*"; `viga` → "*vit*"/"*vingar*"; `hänga` → "*hund*, *häst*, *vingar*, *ränder*"; `stå` → "*liten* / *stor*". 25 % av de vanligaste verben ger en gissning som är fel.

**Konkretandel (min handbedömning, inte mätt):** av 100 slumpade ur topp-1000 substantiv bedömde jag 18 som något man kan rita som en sak (orm, katt, ost, ben, gata, hotell, restaurang, gåva, mur, flod, hamn, himmel, mage, konung, far, mamma, te, peng). Det ger ca 18 % (± ca 8 procentenheter, litet urval) = **ca 180 av 1 000 vanliga substantiv är ritbara; 8–9 av dem har form idag (≈ 5 %).** Resten (arbete, skillnad, verksamhet …) är abstrakta och är exakt de ord som behöver *reservformen* (avsnitt 12) i stället för en modell.

**Live mot kod (slumpurval D):** substantiv 1/34 (bara `port`, och den är låst bakom "Slottssidan, 10 stjärnor", så ingenting byggs), adjektiv 3/33 (blå, liten, snabb), verb 0/33; **koden förutsåg alla 100 orden rätt** (efter att jag rättat en mätartefakt: ett kvarliggande meddelande i Gården gav 13 falska träffar i första sammanställningen). Slutsats: täckningsmåttet från koden stämmer mot spelad version för parsern; osäkerheten ligger i stickprovets storlek, inte i metoden. Underlag: `verification/tackning-2026-10-18.md`.

### 11.4 Vad som krävs per 100 nya ord
Mätta förhållanden i dagens data (`ord.json`, 97 ord): djur 26 ord → 14 kroppar (**1,9 ord per kropp**, 9 med GLB); förmågor 18 ord → 6 effekter (**3,0 ord per effekt**); tillbehör 12 ord → 8 former (**1,5 ord per form**); färg 21 ord → 0 modeller (bara ett hexvärde); mönster 12 ord → 4 mönster. En ordrad är ca 400 byte JSON (39 KB / 97). Med dessa kvoter (uppskattning, inte mätt för nya ord):

| 100 nya ord av typen | Ordrader | Modeller (GLB) | Attribut/effekter | Övrigt |
|---|---|---|---|---|
| Substantiv, djur/föremål/mat | 100 (ca 55 `entiteter`-rader) | **≈ 55** (1,8 ord per modell, synonymer delar modell) | 0 | licensrad per paket, ankare per kropp (6 noder) |
| Substantiv, tillbehör | 100 | ≈ 65 (1,5 ord/form) | 0 | ankarnamn finns (`anchor_*`) |
| Substantiv, byggnader/hagar | 100 | ≈ 40 (material och färg ger varianter) | 0 | 4–6 ankarnoder per byggnad |
| Adjektiv (färg/storlek/mönster) | 100 | 0 | ≈ 0 (hexvärde, skalfaktor) | färger och storlekar är rena datarader |
| Adjektiv (känsla: glad, arg, trött) | 100 | 0 | **≈ 30** (ansiktsuttryck/ikon, ca 3,3 ord per effekt) | Kenney Emotes Pack (8 stilar, CC0, redan hämtat i `assets-bengtsson/`) täcker bara en bråkdel; resten ritas |
| Verb (förmåga/handling) | 100 | 0 | **≈ 33** animationsklipp eller effekter (3 ord per effekt) | Kenney-djuren har klippen `idle/walk/run/eat/dance`; fler klipp kräver rigg |
| **Valfritt ord (reservform)** | 1 (hela `reserv.json`) | **0–7 generiska** | 0 | alla okända ord blir synliga från dag 1 |

Läsning: **de första 100 orden kostar 55–65 modeller om de ska ha egen form,** och mindre än 10 modeller om reservformen finns först. Därför ligger reservformen (R3B) före modellbulken (R3C) i planen: hela ordmängden blir synlig direkt, och modellerna ersätter äggen ord för ord där barnen faktiskt skriver (onskelistan visar vilka).

## 12. Reservform: hur ett okänt ord ändå blir något synligt

### 12.1 Nuvarande beteende (läst + live-bekräftat, avsnitt 11.1, 17)
Okänt ord: (1) tyst ignorerat i ett skapat djur (`en kanin med paraply` → kanin, inget om paraplyet, inget sparat); (2) i en mening utan djur "Pennan behöver ett djur. Prova … kanin/katt/hund" + ordet sparas för föräldravyn (`elefant`, `pizza`, `hmmmx`, `pojke`, `tårta`); (3) nära ett känt ord "Menade du …?" (rätt för `kannin`→`kanin`, fel för `dansar`→`dino`). Aldrig en synlig form. Strider mot grundtanken.

### 12.2 Reservkedja (varje steg är data, första träff vinner)
| # | Steg | Källa (data) | Exempel |
|---|---|---|---|
| 1 | **Exakt ord** | `ord.json` (befintliga ord) + `entiteter.json` `ord[]` | `kanin`, `krona` |
| 2 | **Lemma/böjning** | `former[]` i entiteten; ändelseregler i `reserv.json` `andelser` (`-en`, `-et`, `-ar`, `-or`, `-er`, `-n`, `-na`, `-s`) | `elefanten`→`elefant`, `paraplyer`→`paraply` |
| 3 | **Sammansättning** | sista ledet slås upp (finns redan för djur/tillbehör, utvidgas till alla entiteter): huvudledet ger form, förleden ger färg/material/förmåga | `pepparkakshus`→`hus`+`pepparkaka`, `regnbågskanin` (finns) |
| 4 | **Synonym** | `synonymer.json`: `{ "kisse": "katt", "mössa": "hatt", "sjal": "halsduk" }` | `mössa`→`hatt` |
| 5 | **Kategori ur lexikon** | `kategori-ord.json` (genereras offline ur SALDO/Blingbring, båda CC BY 4.0 enligt Språkbankens lista; **att verifiera vid bygget**): `{ "elefant": "djur", "tårta": "mat", "paraply": "foremal", "skog": "plats", "glad": "kansla", "dansa": "handling" }` | `tårta`→`mat` |
| 6 | **Kategori via enkel regel** | `reserv.json` `regler`: suffix/prefix → kategori (`-are`,`-ist`→person; `-het`,`-ning`,`-else`→abstrakt→`kansla`-ikon; `-blomma`,`-träd`,`-bär`→växt; `-hus`,`-stuga`,`-stall`→byggnad; `-bil`,`-båt`,`-tåg`→fordon; `-a` + verbläge→handling) | `kaninbur`→byggnad |
| 7 | **Generisk form** | `reserv.json` `kategorier.<k>.form`: ett **ordägg** per kategori (mönster per kategori) | `hmmmx`→ägg (kategori `okant`) |

Stavningsgissningen (`avstand.ts`, "Menade du …?") körs **före** steg 5–7 men skärps: `forslag.minlangd` 4 tecken, `forslag.maxavstand` 1, och ett förslag visas bara om ordet i förslaget har samma kategori som den plats ordet står på (verb efter "som", substantiv efter "med"); annars går kedjan vidare. Det tar bort `går`→`grå` och `dansar`→`dino` (11–12 av 33 verb i slumpurvalet fick fel gissning live).

### 12.3 Hur reservformen ser ut (förslag, Christoffer godkänner på bild i R3B)
**Ordägget** (skissen här var ursprungligen en kristall; Christoffer valde ett ägg 2026-10-18, och i R3B är ägget en äggform med *mönster* per kategori i stället för siluett, se `rundor/R3B-reservform/RITNING.md`): en mjukt lysande låg-poly-äggform (samma toon- och konturstil som djuren) som svävar och guppar, färgad ur en fast, behaglig palett om 12 färger vald med ordets hash (`fnv1a32(ord) % 12`, så samma ord får samma färg varje gång), med **ordets egen text** som etikett (en Html-/sprite-etikett över den, max 16 tecken, spärrlistan gäller). Sex kategorivarianter (samma ägg med olika siluett): `djur` (ägg på fyra små ben – "mystisk varelse"; använder närmaste kroppsform, `djur`→ hund-kropp skalad efter `storleksgrupp` när ordet har en känd), `mat` (ägg på ett fat), `foremal` (ägg på en liten sockel), `vaxt` (ägg med blad), `byggnad` (ägghus), `kansla` (ägg med en emote-ikon över). Handling (verb) blir **en animation + pratbubbla med ordet** på djuret (hopp/skak/snurr enligt `reserv.json` `handling`), inte ett föremål. Adjektiv utan känd attribut ger **en aura i ordets färg + ordet i en bubbla**. Allt i barnets ord, ingenting är ett fel. Pennans svar (data, Copilot granskar): "Det här har jag aldrig sett! Jag ritade en gissning. Vill du lära mig hur det ser ut?" – ordet läggs i `onskelista`, som blir innehållsteamets att-göra-lista (vilka ord barnen faktiskt skriver).

### 12.4 Dataformer och filer
`data/reserv.json`:
```json
{
  "version": 1,
  "kedja": ["exakt", "lemma", "sammansatt", "synonym", "kategori_ord", "kategori_regel", "agg"],
  "andelser": ["en","et","ar","or","er","n","na","s"],
  "forslag": { "minlangd": 4, "maxavstand": 1, "samma_plats": true },
  "regler": [ { "suffix": "are", "kategori": "person" }, { "suffix": "het", "kategori": "kansla" }, { "suffix": "hus", "kategori": "byggnad" } ],
  "kategorier": {
    "djur":    { "form": "generisk/agg-djur",    "kropp": "hund",  "skala": 1.0 },
    "mat":     { "form": "generisk/agg-mat",     "skala": 0.6 },
    "foremal": { "form": "generisk/agg-foremal", "skala": 0.6 },
    "vaxt":    { "form": "generisk/agg-vaxt",    "skala": 0.8 },
    "byggnad": { "form": "generisk/agg-hus",     "skala": 1.4 },
    "kansla":  { "form": "generisk/agg",         "ikon": "emote" },
    "handling":{ "animation": ["hopp","skak","snurr"] },
    "okant":   { "form": "generisk/agg",         "skala": 0.7 }
  },
  "agg": { "palett": ["#F06292","#BA68C8","#7986CB","#4FC3F7","#4DB6AC","#81C784","#DCE775","#FFD54F","#FFB74D","#FF8A65","#A1887F","#90A4AE"], "hash": "fnv1a32", "etikett_max": 16 }
}
```
`Utfall` (typer.ts) utökas additivt: `{ typ:"skapad", varelse:{ …, reserv?: { ord: string; kategori: string; steg: "lemma"|"sammansatt"|"synonym"|"kategori_ord"|"kategori_regel"|"agg"; entitet?: string }[] } }`. `Varelse.reserv` ritas av `src/spel/ordagg.tsx`. En mening utan känt djur (`en pizza`) skapar **reservdjuret** (kategori `djur`/`okant`) i stället för `behover_djur` (kortbygget "Pennan behöver ett djur" finns kvar bara för tom text). `src/tolk/reserv.ts` är en ren funktion `reservFor(token: string, plats: "djur"|"med"|"som"|"adj"): Reserv` utan three-import, testbar med `node --test`.

### 12.5 Bevis (R3B)
`reserv.test.ts`: (1) varje ord i `verification/tackning-2026-10-18.md` ger `reserv` eller en känd form (100 %); (2) spärrade ord ger aldrig en form; (3) befintliga 28 + bygg- och gåvofraser ger oförändrat resultat; (4) samma ord ger samma färg; (5) bilder (≤ 5) av `elefant`, `pizza`, `kanin med paraply`, `hmmmx`, tre okända i samma mening.

## 13. Bulkrutin: en mapp med GLB-filer + manifest ger nya ord och modeller utan kod

*Ritning för en framtida runda (R3C), ingen kod.* Bygger på tillgångsflödet i avsnitt 9 (namn, skala, ankare, licenser) och entiteterna i avsnitt 14.

### 13.1 Mappen
```
assets/inkorg/
  LASMIG.md                 # 10 rader: så här lägger du in en modell
  manifest.json             # en rad per fil, se 13.2 (handskrivs eller skapas av `npm run inkorg:ny`)
  djur/ tillbehor/ bygg/ foremal/ natur/     # GLB-filer som ska in; källfiler (FBX/Blend) ligger kvar utanför repot
  _klart/                   # skriptet flyttar godkända filer hit (original sparas, tas inte med i bygget)
  _avvisade/                # + <fil>.fel.txt med felmeddelandena
```
`npm run inkorg` kör hela kedjan (13.3); `npm run kontrollera:tillgangar` kör bara kontrollen mot `public/models/**` (ingår i `test:product`).

### 13.2 Manifestformat (`assets/inkorg/manifest.json`)
```json
{
  "version": 1,
  "paket": {
    "quaternius-farm-animals": {
      "titel": "Farm Animal Pack", "upphov": "Quaternius", "licens": "CC0-1.0",
      "kalla": "https://quaternius.com/packs/farmanimal.html", "hamtad": "2026-10-18", "av": "arkitekten",
      "kredit_i_spel": false
    }
  },
  "filer": [
    { "fil": "djur/cow.glb", "id": "ko", "typ": "djur", "paket": "quaternius-farm-animals",
      "ord": ["ko", "kon", "kor", "korna", "kossa"], "genus": "u",
      "malhojd": 1.2, "rorelse": "land", "kategori": "djur",
      "ankare": "auto", "storlek": "normal" }
  ]
}
```
`typ` ∈ `djur | tillbehor | bygg | foremal | natur`; `ankare:"auto"` låter `ankare.mjs` lägga noderna från kroppens bounding box enligt fraktionerna i `data/entiteter.json` `ankarmall.<typ>`, annars en lista `["anchor_head", …]` för modeller som redan har dem; `ord` ger ordraden (Copilot granskar ordlistan innan den slås in i `ord.json`).

### 13.3 Kedjan (per fil)
1. `kontrollera.mjs --fas fore` (namn, paketets licens, att filen är en giltig GLB: `gltf-transform validate`).
2. **gltf-transform**, i exakt denna ordning (flaggorna verifierade i 4.5.1, avsnitt 9.3):
```bash
npx @gltf-transform/cli@4.5.1 optimize in.glb tmp.glb \
  --flatten false --join false --instance false --palette false --prune false \
  --compress meshopt --texture-compress webp --texture-size 512
npx @gltf-transform/cli@4.5.1 prune tmp.glb ut.glb --keep-leaves true
```
(`optimize`s standardvärden är `flatten`, `join` och `prune` = sant, vilket tar bort ankarnoder och ben; därför tre `false` och sedan `prune --keep-leaves true`.)
3. `ankare.mjs <id>`: lägger tomma noder `anchor_*` (gltf-transform-API) i rätt fäste (barn till benet `Head`/`Neck`/`Body` på skinnade modeller, annars till `body`).
4. `kontrollera.mjs --fas efter` (regler nedan) på den färdiga filen.
5. Kopia till `public/models/<typ>/<id>.glb`, en rad i `data/tillgangar.json`, en rad i `data/entiteter.json`, omgenerera `LICENSES.md`.

### 13.4 Valideringsskriptet `scripts/inkorg/kontrollera.mjs`
**In:** `--fas fore|efter`, valfritt `--fil <sökväg>`; läser `assets/inkorg/manifest.json`, `data/tillgangar.json`, `LICENSES.md`, `data/entiteter.json`. **Ut:** utskrift per fil (`OK <fil>` eller `FEL <fil>: <meddelande>`), exit 0 om alla OK, 1 annars; JSON-rapport `verification/inkorg-rapport.json`. Alla fel är på svenska och säger vad som ska göras:

| Kontroll | Regel | Felmeddelande |
|---|---|---|
| **Licens** | paketet finns i manifestet, har `kalla`/`upphov`/`licens`/`hamtad`; licens är `CC0-1.0` (eller `CC-BY-3.0\|4.0` med `kredit_i_spel:true` och kredit-testid i källkoden); **och** paketets rad finns i `LICENSES.md` | `FEL djur/ko.glb: paketet "quaternius-farm-animals" saknar licens i manifestet. Lägg till licens, källa och hämtdatum, eller ta bort filen.` / `… licensen "CC-BY-NC-4.0" är inte tillåten (endast CC0, eller CC BY med kredit i spelet).` / `… finns inte i LICENSES.md. Kör npm run inkorg:licenser.` |
| **Namngivning** | `id` = ASCII-gemener och bindestreck, 2–32 tecken, unikt i `entiteter.json`; filnamn = `<id>.glb`; inga å/ä/ö | `FEL …: id "Kö" är ogiltigt. Använd gemener a–z och bindestreck, t.ex. "ko".` / `… id "ko" finns redan.` |
| **Skala** | modellens höjd (bounding box) 0,3–3,0 enhet; origo i marken (min.y inom ±0,05) | `FEL …: höjden är 7,2 (tillåtet 0,3–3,0). Skala modellen i Blender eller sätt "malhojd".` / `… står inte på marken (min.y = 0,40).` |
| **Ankarnoder** | för `djur`: `anchor_head`, `anchor_face`, `anchor_neck`, `anchor_back` finns; `bygg`: `anchor_door`, `anchor_roof`; `tillbehor`: `attach` | `FEL …: saknar noderna anchor_head, anchor_back. Kör node scripts/inkorg/ankare.mjs ko.` |
| **Triangelbudget** | djur ≤ 6 000, tillbehör ≤ 800, byggnad ≤ 4 000, natur/föremål ≤ 1 500 (startvärden, mäts om efter första satsen) | `FEL …: 12 480 trianglar (högst 6 000 för djur). Förenkla i Blender (Decimate) eller välj en annan modell.` |
| **Filstorlek** | djur ≤ 300 KB, tillbehör ≤ 60 KB, byggnad ≤ 200 KB, natur/föremål ≤ 80 KB (efter `optimize`) | `FEL …: 1,8 MB (högst 300 KB för djur). Kontrollera texturen (högst 512 px).` |
| **Struktur** | exakt en scen, inga kameror/ljus, högst 1 material per 2 000 trianglar, texturer inbäddade | `FEL …: filen innehåller 2 kameror. Ta bort dem.` |
| **Framriktning** | framsidan mäts automatiskt (a) `anchor_face` relativt modellens mitt, (b) `Head` mot `Body`/`Root` för skinnade, (c) annars gissning ur bounding box (längsta horisontella axeln; huvudänden = änden med de högsta hörnen); jämförs med det som gäller (standard +z eller `framAxel`). Ingen handinmatning krävs; avvikelse flaggas med förslag | `FLAGGA …: framsidan verkar vara −z (mätt via anchor_face), standard är +z. Lägg till "framAxel": "-z" på entiteten (eller bekräfta).` / `… (gissad ur bounding box)` |
| **Dubbletter/manifest** | varje GLB i `public/models/**` finns i `tillgangar.json` (och tvärtom) | `FEL public/models/djur/ko.glb: saknas i data/tillgangar.json.` |

**Enhetstest** (`kontrollera.test.mjs`): en falsk fil per rad ovan (nu nio rader), i en temporär kopia, en per rad ovan, ska ge exakt respektive felmeddelande; en korrekt fil ger `OK`.

### 13.5 Vad rutinen ger per modell
En fil + en rad i manifestet → ordrad(er) (efter Copilots granskning), entitetsrad, manifestrad, licensrad, och modellen syns i spelet utan kodändring och får automatiskt tillbehörsplatser. Målet i R3C: ≤ 10 minuters handpåläggning per modell (gissning, mäts).

## 14. Byggande (hus, stall, hagar) som samma datamodell som djuren: `data/entiteter.json`

### 14.1 Idag: tre modeller för "saker som finns"
- **Djur:** ord i `ord.json` (`klass:"djur"`, `del.kropp`) + allt om utseende i kod: `gltfDjur.tsx` (`FIL`, `MAL_HOJD`, `PALETT`), `djurmesh.ts` (procedurella former), `angen3d.tsx` (`ART`, `flygare()`, `simmare()`, `vikt`, `LAND_SLOT` – 8 fasta platser x ±1,6, z −0,15…1,05), `tillbehorFaste.ts`. 14 kroppar, 9 med GLB. 141 `kropp ===`-förekomster på 85 rader i 9 filer i `src/spel/` (mätt 2026-10-18: `rg -o "kropp ===" src/spel | wc -l`; tidigare siffra 116 gick inte att återskapa). Kitet (`public/kit/kit.json`) har en egen, delvis datadriven djurmodell för 2D.
- **Byggnader:** `data/bygg.json` (`bygg_ord`: 36, med `typ` natur 14 / byggnad 13 / lek 6 / djurhem 3; `delar` (6), `material` (9)) + `src/tolk/byggtolk.ts` (fri text → `ByggeTolk`) + `src/spel/bygge.ts` (`SparatBygge`: `bygg, ord, antal, fargId, fargHex, monster, material, delar[], x, y, boende[]`) + **ritning i kod**: `ritaBygg.ts` (811 rader, 59 jämförelser per byggords id, 2D) och `angen3d.tsx` `slag()` (36 byggord → **6 grova former**: hus, träd, blomma, damm, tält, mur). 17 byggord är `hem` för djur (`hem.kroppar[]`, `hem.platser`, 1–4).
- **Föremål/gåvor/skatter:** `gavor.json` (20), `skatter.json` (6), ritade procedurellt i `ritaBygg.ts` (`ritaSkatt`).
Tre scheman, tre kodvägar. Grundtanken ("hus, stall, hagar, allt") och arkitekturregeln (en datarad + en tillgångsfil) kräver **ett** schema.

### 14.2 Gemensam entitetsmodell
`data/entiteter.json` – en post per sak. **R3A inför bara djurdelen** (14 rader, fält enligt `rundor/R3A-entiteter/RITNING.md` avsnitt 4.1: `typ`, `kategori`, `modell` som nyckel i `tillgangar.json`, `malhojd`, `palett`, `art`, `rorelse`, `vikt`, `hopp`, `natt`, `standardfarg`, `material`, `framAxel`); resten av formen nedan (`ord[]`, `ankare`, `platser[]`, byggnader) är riktningen för R3B/R3C/R5:
```json
{
  "version": 1,
  "ankarmall": { "djur": ["anchor_head","anchor_face","anchor_neck","anchor_back"], "byggnad": ["anchor_door","anchor_roof"] },
  "entiteter": {
    "hund": {
      "typ": "djur", "kategori": "djur",
      "ord": ["hund", "hunden", "hundar", "hundarna", "vovve", "valp"],
      "modell": "/models/animal-dog.glb", "licens": "kenney-cube-pets",
      "malhojd": 1.05, "storlek": "normal",
      "attribut": { "farg": true, "monster": true, "skala": true, "formaga": ["springa","hoppa","flyga","lysa","simma"] },
      "ankare": { "anchor_head": [0, 0.92, -0.10], "anchor_back": [0, 0.58, 0.16] },
      "platser": [],
      "beteende": { "rorelse": "land", "klipp": {"vila":"idle","gang":"walk"}, "vikt": 1 }
    },
    "stall": {
      "typ": "byggnad", "kategori": "byggnad",
      "ord": ["stall", "stallet", "stall", "stallen"],
      "modell": "/models/bygg/stall.glb", "licens": "quaternius-farm",
      "malhojd": 1.6, "storlek": "stor",
      "attribut": { "farg": true, "material": true, "monster": false, "delar": ["fönster","dörr","tak","skorsten","flagga"] },
      "ankare": { "anchor_door": [0,0,0.6], "anchor_roof": [0,1.2,0] },
      "platser": [ { "id": "box-1", "pos": [-0.3,0,0.2], "for": ["häst","ko","får"] }, { "id": "box-2", "pos": [0.3,0,0.2], "for": ["häst","ko","får"] } ],
      "beteende": { "rorelse": "fast", "sida": "start", "pris": 0, "max_pa_garden": 15, "hem": true }
    },
    "hage": {
      "typ": "byggnad", "kategori": "byggnad", "ord": ["hage","hagen","hagar","hagarna"],
      "modell": "/models/bygg/hage.glb", "licens": "kenney-nature",
      "attribut": { "farg": false, "skala": true, "kakel": { "stapel": "staket", "storlek": [4,4] } },
      "platser": [ { "id": "inne", "area": [4,4], "for": ["*"] } ],
      "beteende": { "rorelse": "fast", "hem": true }
    }
  }
}
```
**Fält:** `typ` ∈ `djur | tillbehor | byggnad | foremal | natur` (styr vilka fält som krävs, kontrolleras av `kontrolleraEntiteter()`); `kategori` är reservformens kategori (avsnitt 12); `ord[]` ersätter `former`/`id`-listorna (böjningar ur SALDO); `modell`/`licens` pekar på manifestet; `ankare` har reservvärden (nodernas värden i GLB vinner); `platser[]` är *vart något kan placeras i entiteten* (boxar i ett stall, en yta i en hage, `sit`-platser på en bänk) och ersätter `hem.platser` (ett tal); `beteende.rorelse` ∈ `land | flyg | sim | fast` ersätter `flygare()`/`simmare()`/`kropp ===`.
**Hur byggnaderna ryms:** `bygg_ord[]` → `entiteter` med `typ:"byggnad"`: `typ` (natur/byggnad/lek/djurhem) blir `kategori` + tagg, `hem.kroppar` blir `platser[].for`, `delar` blir `attribut.delar`, `material`/färg ligger kvar i `bygg.json` och refereras. `byggtolk.ts` läser entiteterna i stället för `bord`/`delar` (`bord.get(w)` blir `entitetFranOrd(w)`). `SparatBygge` ändras **inte** (spar­format låst); `bygg` är entitetens `id`. En 6-formsritning i `slag()` ersätts av `modell` (R5) med `reservform` för byggord som saknar modell.
**Hagar:** en hage är en byggnad med `attribut.kakel` (staketet upprepas runt en yta) och en stor `platser[0].area`; djur som "bor" i den placeras fritt inom ytan, inte i en slot (nytt i R5: `flyttaIn` i `minne.ts` får `plats` som id i stället för ett antal).
**Skalbarhet:** ett nytt hus eller djur = en rad i `entiteter.json` + en GLB + (efter Copilots granskning) en ordrad. Inga `if (kropp === …)`, inga `ritaBygg`-funktioner per byggord.

### 14.3 Bevis
`entiteter.test.ts`: (1) varje `bygg_ord` i `bygg.json` har en entitet; (2) varje entitet med `hem` har `platser` med `for`; (3) alla ankarnoder finns i entiteten eller GLB; (4) `rg 'bygg === "' src/spel` ≈ 0; (5) alla 14 kroppar migrerade, bilderna från R2 oförändrade.

## 15. Doktor Bengtsson och platserna (skogen, sjön, grottan) som uppdragsmotor i data

### 15.1 Vad som finns idag (läst + live)
- **Doktor Bengtsson finns inte i repot** (`rg Bengtsson` i repot: 0 träffar). Hans 24 uppdrag ligger bara som utkast i `/workspace/trollpennan-nulage/bengtsson-uppdrag.md`: fyra nivåer (N1 välj bland fyra ord, N2 välj/fyll i, N3 skriv en kort fras, N4 fri text), regler från Christoffer 17 okt ("bara Bengtsson ger uppdrag; svårigheten växer; varje uppdrag ger synlig belöning"), plus en gag (sjön Chargoggagogg…).
- **Uppdrag i spelet:** `data/uppdrag.json` – **10 uppdrag i 3 områden** (skogen 3, sjön 4, grottan 3), 4 typer (`hitta`, `van`, `ge`, `skicka`), givare är djur och lappar (Ekorren, Mossugglan, Gamla bävern, Pärlhajen, Nattdraken …), `mal`, `klart`, `stjarnor`, `skatt`. `data/skyltar.json` 12 skyltar/lappar (`startar` → uppdrag), `data/skatter.json` 6 skatter, `data/vilda-djur.json` 7 vilda vänner (`gillar`, `ledtrad`, `tack`), `data/gavor.json` 20 gåvor, `data/omraden.json` 3 områden (`skogen` ← gården, `sjon` ← gården, `grottan` ← skogen; `hinder.kraver.nagon_av:["flyga"]`, `eller_bygg:"bro"`; sjön har delområdet ön med `kraver:["simma"]`). Reglerna i `avflode.ts` (`oppnaHinder`, `skickaDjur`, `bliVan`, `geGava`, `plockaSkatt`).
- **Vyer:** områdena är Phaser-scenen `avscen.ts` (ritar skog/sjö/grotta procedurellt "ritning_reserv"); **Uppdragsboken (`panel === "uppdrag"`, `Spel.tsx` r.2644–2736) har ingen ingång** och menyn är låst; **live: "Ut på äventyr" och "Uppdragsboken" är låsta (lås-ikon, "Kommer senare")** – inga uppdrag går att spela via spelets egen väg.
- **Ordkrav idag:** bara indirekt (taggar: `skicka_tagg:"hoppa"`, vilda djur `gillar.farg/taggar/gavor`). Ingen kontroll av *vilket ord barnet skrev*, och ingen fritext-bedömning.
- **Belöning idag:** stjärnor + en skatt i Lådan på gården; Bengtssons utkast kräver synlig belöning på djuren/världen (filt på alla djur, regnbåge på himlen, natthimmel efter text) – **finns inte**, och 7 av 9 N1-svaren är okända ord idag (mätt: `filt`, `paraply`, `havregryn`, `kudde`, `badkar`, `tårta`, `mössa` ger ingen form; `solhatt` och `lykta` gör det).

### 15.2 Vad som saknas
(1) Bengtsson som NPC (entitet, plats, röst). (2) En plats som data i stället för Phaser-kod. (3) Uppdrag med *ordkrav* (ett visst ord, en kategori, ett attribut). (4) Belöningar som effekter på djuren/världen. (5) Ingång till Uppdragsboken och kartan. (6) Fritextnivåerna N3–N4 (tolka med `tolka()` och bedöma: "kräver att varelsen har ett tillbehör i kategori `plagg`"). (7) Att de 10 befintliga uppdragens givare enligt regeln ska bli Bengtsson (Christoffers ja, 10.2 punkt 7).

### 15.3 Dataform (R6)
`data/platser.json`:
```json
{ "skogen": { "namn": "Skogen", "nas_fran": "garden", "scen": "scener/skogen", "ljus": "dag", "musik": null,
              "hinder": { "text": "…", "kraver": { "nagon_av": ["flyga"] }, "eller_bygg": "bro" },
              "karta": { "x": 0.3, "y": 0.4 },
              "objekt": [ { "entitet": "gran", "pos": [2,0,-3], "vrid": 0.4 } ],
              "skyltar": { "skogen-1": [1,0,-2] }, "vilda": { "mossugglan": [3,0,1] } } }
```
`data/npc.json`: `{ "bengtsson": { "namn": "Doktor Bengtsson", "entitet": "bengtsson", "plats": "garden", "ton": "språkdoktor, varm, lite virrig" } }`.
`data/uppdrag.json` (v2; de 10 gamla behåller `typ`/`mal`, får `givare:"bengtsson"`):
```json
{ "id": "n1-regn", "plats": "garden", "givare": "bengtsson", "niva": 1,
  "typ": "valj",
  "fraga": "Det regnar! Något på P som skyddar mot regn?",
  "alternativ": { "ratt": ["paraply"], "fel": ["pizza","penna","pinne"] },
  "ordkrav": { "ord": ["paraply"] },
  "belonning": { "effekt": "tillbehor_alla", "entitet": "paraply", "stjarnor": 2 },
  "klart": "Tack! Nu blir ingen blöt." }
{ "id": "n3-klader", "plats": "garden", "givare": "bengtsson", "niva": 3,
  "typ": "skriv", "fraga": "Skriv vad djuren ska ha på sig, och vilken färg.",
  "ordkrav": { "kategori": "plagg", "min": 1, "farg": true },
  "belonning": { "effekt": "tillbehor_alla_av_ord" } }
```
`typ` ∈ `valj | fyll | skriv | fri | hitta | van | ge | skicka`; `ordkrav` ∈ `{ord:[…]}` (exakt ord), `{kategori, min, farg?}` (kategori ur `entiteter.json`, avsnitt 14; reservformsord räknas om kategorin är känd), `{tagg}`; `belonning.effekt` ∈ `tillbehor_alla | entitet_pa_gard | vader | natthimmel | nytt_djur | stjarnor`, definierade i `data/belonningar.json` (varje effekt = en funktion, men *ett* ställe; nya uppdrag återanvänder effekterna). Kontrolltest `uppdrag.test.ts`: varje `plats`, `givare`, `entitet`, `effekt`, `kategori` och `skatt` finns.
`src/spel/uppdragsmotor.ts` (ersätter delar av `avflode.ts`): `startaUppdrag(id)`, `bedomSvar(uppdrag, utfall)` (matchar `ordkrav` mot `Utfall.funna`/`varelse`/`reserv`), `delUtBelonning(uppdrag)`. `Spel.tsx`: ingång till `UppdragPanel` från menyn och via Bengtsson-lappen på gården.
**Hur platserna passar grundtanken:** `scener/*.json` är entitetslistor (avsnitt 14) med positioner; ett nytt ställe (en äng, en strand) = en plats-rad + entiteter ur befintliga modeller. Uppdrag på platser använder samma ordtolkning och reservform, så *vad barnet skriver* alltid blir synligt också där.

## 16. Kameran: fast Hay Day-liknande vy i R3F

### 16.1 Idag (`angen3d.tsx`, läst)
Perspektivkamera, `fov` 58 stående / 46 liggande (`KameraRam`, r.1984), startposition (0, 4,15, 9,8) som tittar mot (0, 1,05, −0,15): **ca 17° över horisonten**, avstånd ca 10,4. `OrbitControls` (r.2092): `enablePan={false}`, azimut ±1,05 rad (±60°), polarvinkel 1,1–1,42 rad (**8–27° över horisonten**), avstånd 6–14, `touches: ONE=ROTATE, TWO=DOLLY_PAN`, dämpning 0,08. Dessutom en `SagaKamera` (sagoläge, r.1584) som flyttar kameran längs en bana och ett test-/sondobjekt `window.__tred` som läser kamerans position, fov och zoom. Djuren står på 8 fasta platser (x ±1,6, z −0,15…1,05) plus en flygrad (y 1,55) och en damm; ängen visar max 10 djur. **Det är en lågt sittande, fritt orbiterande perspektivvy – inte Hay Day** (där kameran är fast, ser snett ovanifrån och barnet panorerar och zoomar). Ingen gräns för att det barnet byggde ska synas, och byggnader (36 byggord, 6 former) är små i bild.

### 16.2 Förslag (data i `data/kamera.json`, komponent `src/spel/ang/kamera.tsx`, R4B)
- **Typ:** `OrthographicCamera` (parallellprojektion: alla djur och byggnader är lika stora oavsett djup, byggnader går att lägga i ett rutnät, ingen perspektivförvrängning av ansikten och tillbehör, enklare att räkna ut vad som är synligt).
- **Vinkel:** **35° ned** (isometrisk-lik; Hay Days ca 30–40°), **yaw 0°** på ängen (djuren tittar mot kameran så ansikte och tillbehör syns, som idag), **yaw 30–35°** i Gården (diagonal Hay Day-känsla för byggnader). Ingen orbit: barnet roterar inte (det är det som gör vyn "fast").
- **Zoom (synlig världsbredd vid zoom 1):** ängen **5,0 enheter**, Gården **9,0 enheter**; djuret är ca 1 enhet högt, så ett djur blir ca 75 px högt på 375 px bredd (bra för att se ansiktet; idag ca 100 px högt i live-bild 02, grov bedömning ur skärmbilden). Pinch: zoom 0,7–1,6 (Gården upp till 2,0).
- **Pan och gränser:** ett finger på tom mark panorerar; hårda gränser = markrektangeln minus halva synfältet (kameran kan aldrig visa tomhet); om världen är mindre än vyn (ängen) låses axeln. Mjuk dämpning, 0,12 s. Dubbeltryck återställer. **Långt tryck (350 ms)** på en byggnad/djur i Gården plockar upp för flytt, tryck markerar. (Tryck och drag på djur får inte kollidera med pan: drag på tom mark = pan.)
- **Stående mobil (375×812):** vyn är 2,17 × högre än bred. Bredd 5,0 ger synlig markdjup ≈ 5,0 × 2,17 / sin(35°) ≈ 19 enheter längs marken (alla 8 djurplatser plus flygrad + dammen får plats utan att barnet drar). Säkra ytor: topp 72 px (HUD, stjärnor) och botten 96 px (knappen "Pennans bok"); kameran skjuter fokuspunkten så att leken ligger mellan dem (`setViewOffset`). Liggande: samma synlig höjd, bredare värld.
- **Dataform:**
```json
{ "version": 1,
  "scener": {
    "ang":  { "typ": "ortho", "elev": 35, "yaw": 0,  "bredd": 5.0, "zoom": [0.7, 1.6], "pan": false, "safe": { "topp": 72, "botten": 96 }, "mal": [0, 0.6, 0.4] },
    "gard": { "typ": "ortho", "elev": 38, "yaw": 33, "bredd": 9.0, "zoom": [0.6, 2.0], "pan": true,  "mark": [24, 24], "safe": { "topp": 72, "botten": 96 } }
  },
  "gester": { "pan": "ett_finger_tom_mark", "zoom": "pinch", "plocka_upp_ms": 350, "dubbeltryck": "centrera" } }
```
- **Bevis (R4B):** `kamera.test.ts` (rena funktioner `frustum(bredd, aspekt)`, `klammaPan(mal, mark, frustum)`: 5 testfall), bilder `01-ang-10-djur` (inga klippta), `02-gard-8-byggnader`, `03-zoom-in`, `04-pan-gransen`, `05-liggande`; `window.__tred` utökas med `typ:"ortho"` så att befintliga skript fortsätter fungera. `SagaKamera` behålls oförändrad som läge.

## 17. Live-läge (publicerad version, https://trollpennan.grok.me/)
Spelad 2026-10-18 kl. ca 11:30–11:50 (Stockholmstid) med Playwright (Chromium headless 156, viewport 375×812, `hasTouch`, mobil-UA iPhone, SwiftShader/ANGLE), ett skript per test utanför repot (`/workspace/arkitekt-verk/`). Inga formulär skickades och ingen data lämnade webbläsaren utöver att läsa sidan och spela. Alla skärmbilder ligger i `docs/skarmbilder/` (8 st, 375×812 CSS-px i 2× upplösning; överst syns plattformens "Created with Grok / Remix"-list, den ligger inte i spelet).

### 17.1 Motsvarar publicerad version `main`? **Nej, den är äldre.**
**Så avgjorde jag det (och vad jag inte kunde):**
- **Hash/byggdatum:** sidan laddar `assets/index-Cwk_3HJv.js`, `routes-CdcM0cXe.js` (1,3 MB, innehåller Spel + R3F), `starta-oFY4Y7gm.js` (Phaser) och `styles-B3KduHyE.css`; `last-modified` på `index-…js` är **Sun, 18 Oct 2026 09:24:37 GMT = 11:24 Stockholmstid**, alltså publicerad ca två minuter innan jag hämtade den. (Så den är *nypublicerad men innehåller äldre kod*.) Det är plattformens bygge (TanStack-start, `/__grok/manifest.webmanifest`, `grok-app-builder/extensions.js`), **inte** `npm run build:pages`; jag har inga lokala byggen att jämföra hashar mot (jag får inte bygga, och Vite-hashar beror på byggmiljön), så **hash-jämförelse mot `main` gick inte**.
- **Strängmarkörer ur git:** jag sökte, för varje commit på `main`, de strängar commiten lade till i `src/` och `data/` i den publicerade bundlen. Resultat: importcommiten `ef7b64b` ("Importera Trollpennan B003 (Version0006) från Copilot-handoff", 2026-10-17 14:07) hittas (1 306 av 2 065 strängar; resten är sannolikt bortminifierade eller i annan form), men **Runda 1 (`1f9c261`) 0 av 6, och inga av tillbehörsrundornas strängar** finns: `intro-ideer`, "Prova en idé", `tillbehor-krona|hatt|halsduk|rosett|glasogon|ryggsack|mantel|horn`, `anchor`, `faestTillbehor`, glöd/glitter-markörer (alla 0 träffar i `routes.js`). Däremot finns `__troll`, `__tred`, `groda-kredit`, `ladd-3d`, `trollpennan-v2`, `Kommer senare`.
- **Synliga funktioner (spelat):** hatt, halsduk, glasögon, rosett, mantel, ryggsäck syns inte på något djur (bild 06); introt saknar idéknapparna; i övrigt som koden. Kronan syns på draken (bakad i formen i äldre koden, `djurmesh.ts` r.308–330); på `rosa enhörning med glasögon` syns varken horn eller glasögon (rosa häst bakifrån; bilden är inte bland de åtta).
- **Slutsats:** den publicerade versionen är **ungefär importen B003 (`ef7b64b`), före Runda 1** (merge `7896342`) och före alla tillbehörsrundor; `main` = `697be95` är **37 commits nyare** (9 sammanslagna PR). Jag kan **inte** avgöra exakt vilken commit (bundlen är minifierad, det finns ingen versionssträng eller byggdatum i sidan, och inga lokala byggen att jämföra hash mot). Grenarna (`copilot-jobb`, `text/granskning-1`) kunde jag inte skilja från `main` via strängar utan att veta deras text; jag har inte jämfört dem.
- **Åtgärd:** R0 (publicera `main`) är Christoffers ja (10.2 punkt 1).

### 17.2 Spelat läge (bilder 01–08)
| Moment | Resultat live | Bild |
|---|---|---|
| Laddning | `load` efter 2,3 s på ett vanligt nät; introt spelar självt (pennan skriver K-A-N-I-N); "Hör pennan" och "Hoppa över" syns; inga `console.error`; bara varningar (THREE.Clock, GPU-stall) | 01 |
| Ängen efter introt | 3D-äng med damm, träd, växthus; ett rosa kaninbarn finns redan; hint "Dra för att titta runt"; stjärnor 0; knappen "Pennans bok" | 01, 02 |
| Skriva (bok + eget tangentbord) | pennan → skärmtangentbord (inget systemtangentbord); `Vakna!`; fungerar med tryck | 03–05 |
| Meny (☰) | **Ängen** öppen, **Gården, Byggboken, Albumet, Ut på äventyr, Uppdragsboken, Bok: alla låsta (lås-ikon)**; tryck ger "Kommer senare – i fulla spelet kan du bygga hus och gå på äventyr i skogen." (demoläge, hårdkodat) | 07 |
| Uppdragsvy | **Går inte att nå** via spelet (Uppdragsboken och "Ut på äventyr" låsta; ingen testkrok för den). Ej spelad; bara kodläst | – |
| Gården | Nås bara med testkroken `__troll.plats("gard")`; 2D (Phaser) med knappen "Bygg något"; `ett hus med fönster` byggs (`Klart! ett hus med fönster står på gården.`); `… och en pool` → poolen **ignoreras tyst**; `ett torn` → "Det ordet finns i Slottssidan. Den kostar 10 stjärnor." | 08 |
| Tillbehör | `en blå drake med krona`: krona syns (bild 02). `en katt med hatt och glasögon och halsduk`: **ingenting syns** (bild 06); sex djur med hatt/halsduk/rosett/mantel/ryggsäck/glasögon: **inget tillbehör syns** (utom sådant som är bakat i formen) | 02, 06 |

Skärmbilder (alla 375×812 CSS-px, 2×): `docs/skarmbilder/01-intro-start.png`, `02-ang-bla-drake-med-krona.png`, `03-okant-ord-elefant.png`, `04-felstavat-menade-du.png`, `05-glad-kanin-som-dansar.png`, `06-katt-med-hatt-glasogon-halsduk-syns-ej.png`, `07-meny-allt-last.png`, `08-garden-hus-med-fonster.png`.

### 17.3 Övriga fynd i live
1. **Testkroken `window.__troll` (25 funktioner: `vakna`, `plats`, `stjarnor`, `kop`, `aterstall` …) finns i den publicerade versionen** och kan ge stjärnor, köpa sidor och radera spelet från konsolen. Produktfråga: ska den tas bort i produktionsbygget? (Går inte att åtgärda utan en kodrunda; läggs i R1:s förutsättningar som liten punkt.)
2. Plattformens "Created with Grok / Remix"-list tar ca 43 CSS-px överst (mätt ur bilden, 86 av 1 624 bildpunkter) i varje bild; HUD:en ligger under den.
3. Pratbubblan och guldordsbannern överlappar varandra (bild 02: "Guldord! Du skrev …" delvis under "Hej! Här kommer …").
4. Det skapade djurets ord som saknas (paraply, mössa) ignoreras **utan meddelande** och sparas inte (live bekräftar koden).
5. Rutan "Pennan behöver ett djur" erbjuder bara kanin/katt/hund (de tre första "kort"-djuren), även när barnet skrev `elefant` eller `pizza`.
6. Verbgissningar är ofta fel: `dansar` → "dino/nasse" (bild 05); live-slumpurvalet gav "Menade du …" för 11 av 33 verb, t.ex. `hänga` → hund/häst/vingar/ränder, `stå` → liten/stor, `viga` → vit/vingar, `summa` → simmar.
7. Gården i 2D visar en grön groda med röd hatt i mitten medan ängens djur var en rosa kanin; jag har inte kartlagt varför.

### 17.4 Täckning mätt live (slumpurval, frö 20261018, 100 ord)
Substantiv 34, adjektiv 33, verb 33 ur topp-1000 (adjektiv ur topp 849). Substantiv testades som `N`, `en kanin med N`, och som `ett N` i Gården (via `__troll.vakna`); adjektiv som `en ADJ kanin`; verb som `en kanin som kan V` och tre presensformer. "Synligt" = djurets formel ändrades (live-djurets `formel`, tillbehör, förmågor), för byggord att något byggdes.
| Ordklass | Live synligt | Kod förutsåg | Kommentar |
|---|---|---|---|
| Substantiv (34) | **0** byggdes; 1 igenkänt men låst (`port`, Slottssidan 10 ★) | 1 | 32 gav "Pennan behöver ett djur", 1 gav förslag (`summa`→`simmar`) |
| Adjektiv (33) | **3** (blå, liten, snabb) | 3 | 30 ignorerades tyst; inga förslag |
| Verb (33) | **0** | 0 | 11 gav felaktig gissning, 22 ignorerades tyst |
Kod och live **överensstämmer på alla 100 ord** (efter rättning av en mätartefakt, avsnitt 11.3). Rådata och skript: `verification/tackning-2026-10-18.md`. Stickprovet är litet (konfidensintervall för 3/33 är grovt 2–24 %); det är jämförelsen kod mot live som är poängen, och den håller.

## 18. Verklighetskontroll: vad är verifierat i spelad version?
Status 2026-10-18 efter live-spelningen (avsnitt 17). **Viktigt: allt "live" gäller den publicerade versionen, som är äldre än `main`.** Ingen del av `main` från Runda 1 och framåt är verifierad i spelad version av mig.

| Påstående i PROJECT.md | Status |
|---|---|
| Parsern (`tolka`, `tolkaBygg`) beter sig som koden säger: okänt ord → "Pennan behöver ett djur" och sparas; skapat djur ignorerar okänt ord tyst; fuzzy-förslag | **Verifierat live** (9 fraser + slumpurval 100) och **mätt** i kod; stämmer |
| Täckningstalen (avsnitt 11) | **Mätt** i kod, **verifierat live** på 100 ord (3 av 3 ordklasser stämmer) |
| Menyn är låst (Gården, Byggboken, Albumet, Ut på äventyr, Uppdragsboken, Bok) | **Verifierat live** (bild 07, texten "Kommer senare …") |
| Uppdragsvyn saknar ingång | **Verifierat live** (går inte att nå; bara via kod: ingen `setPanel("uppdrag")`) |
| Gården (Phaser, 2D) fungerar med byggord | **Verifierat live** (hus byggs; kräver testkrok för att nå) |
| Djuren är vända mot kameran | **Delvis:** kodläst + GLB-mätt + en ögonblicksbild per djur ur byggd `main` (`docs/skarmbilder/framriktning/nulage-10-djur.png`): kanin/katt/hund/fisk visar ryggen, drake/groda/gris/fågel framsidan, uggla ej bedömd; **inte** verifierat i publicerad version eller över tid (djuren rör sig) |
| Krona och horn syns på djuren | **Delvis live:** krona på drake syns (bild 02); **horn syns inte** på enhörningen |
| Hatt, halsduk, glasögon, rosett, mantel, ryggsäck syns | **Motbevisat live:** syns inte i den publicerade versionen (äldre kod) |
| 3D-tillbehören syns inte i Gården/äventyret (två renderare) | **Kodläst; delvis live:** Gården är 2D och visar inga 3D-tillbehör |
| Runda 5A: mantel/ryggsäck/horn på häst/drake/gris bra, fel kvar på fågel/katt/kanin | **Kodläst + Builds/min bildläsning, inte verifierat** (live saknar koden) |
| Glöd/glitter/eld (4C–4E) | **Ej verifierat** (live saknar koden; kodläst) |
| Uppdrag (10 st), skyltar, vilda djur, skatter, områden | **Kodläst/datalästa, ej spelade** (äventyret går inte att nå) |
| `Spel.tsx` 3133 rader, 50 `useState`, 108 testid; `angen3d.tsx` 2202 | **Mätt i kod** (`wc -l`, `rg`) |
| Phaser 1,25 MB / R3F 1,3 MB chunkar | **Delvis live:** `routes.js` är 1,3 MB, `starta-…js` hämtas; storlek på Phaser-chunken inte omräknad |
| Mobilprestanda | **Ej verifierat** (SwiftShader, ingen telefon). Laddtid 2,3 s mot `load` i min miljö |
| Föräldravyn (håll 3 s), Önskelista, ljud, album | **Ej spelade** (kod + bakom lås) |
| Svenska texter är granskade (Copilot) | **Utanför min kontroll;** jag rör dem inte |
| 75/75 `test:product` | **Ej omkört** (Node 20.19.2 här stöder inte `--experimental-strip-types`) |

### 18.1 Testfraser för Doodle mot en körande build av `main` (förväntat resultat)
Kör via riktiga UI-vägen (Pennans bok → pennan → skärmtangentbord → Vakna!). Fraserna 1–9 är redan spelade mot den **publicerade** versionen; kolumnen visar vad som förväntas på en build av `main` och vad live gav.
| # | Fras (barnskriven) | Förväntat på `main` (kod) | Live idag |
|---|---|---|---|
| 1 | `en blå drake med krona` | Blå drake, krona på huvudet; 3 stjärnor | Som väntat, krona syns (bild 02) |
| 2 | `rosa enhörning med glasögon` | Rosa häst med horn **och** glasögon; guldord "enhörning" | Formel rätt (häst, horn, glasögon), men varken horn eller glasögon syns i bild (rosa häst bakifrån) |
| 3 | `en elefant` | "Pennan behöver ett djur. Prova … kanin/katt/hund"; ordet i önskelistan | Som väntat (bild 03). *Efter R3B:* ett ägg med texten "elefant" |
| 4 | `en kanin med paraply` | Kanin utan paraply, inget meddelande | Som väntat. *Efter R3B:* kanin med ett ägg/ikon "paraply" över huvudet |
| 5 | `en kannin med glasögen` (felstavat) | "Menade du kanin?" (ett förslag åt gången) | Som väntat (bild 04) |
| 6 | `en glad kanin som dansar` (okända adjektiv/verb) | I kod: "Menade du dino / nasse?" (fel gissning) | Som väntat (bild 05); *Efter R3B:* kanin som dansar-animation, ingen gissning |
| 7 | `tre röda hundar som kan flyga och spruta eld` | Tre röda hundar med vingar och eld | Formel rätt (`flyger och sprutar eld`), 3 djur |
| 8 | `blå hmmmx` / `en pizza` (nonsens/okänt) | "Pennan behöver ett djur …", ordet sparas | Som väntat. *Efter R3B:* ägg med texten, aldrig ett fel |
| 9 | `ett hus med fönster och en pool` (Gården) | Hus med 2 fönster; poolen ignoreras | Som väntat (bild 08) |
| 10 | `en katt med hatt och glasögon och halsduk` | **Alla tre syns på katten** (hatt ovanpå, glasögon framför ögonen, halsduk runt halsen) | **Syns inte alls** (bild 06) – kör mot `main` |
| 11 | `en häst med mantel` + `en fågel med ryggsäck` | Mantel och ryggsäck syns (5A: häst bra, fågel svag) | Syns inte live – kör mot `main` |
| 12 | `en ko som kan sjunga` | Idag: tyst ignorerat + förslag; *efter R3B/R3C:* ko-modell, sjunga som animation | – |
Gränsfall att lägga till vid R3B: tomt fält, 60 tecken, versaler, `Å Ä Ö`, spärrat ord (ska ge puff, aldrig form).

## 19. Öppna fel (2026-10-19) – kort; blocket som tar hand om felet
| # | Fel | När |
|---|-----|-----|
| 1 | ~~Platsbyte syns inte i scenen~~ | B1.3b klar |
| 2 | ~~Uppdrag+gåta samtidigt; gåta byts för tidigt; otydligt var man skriver; stall saknas~~ | **R9G** klar |
| 3 | "Inte riktigt än" under ERROR-automaten | **B1.4** |
| 4 | Valfisk/snurra/gaffel/släde/jacka/planka/brandpost/julkrans konstiga eller svåra att se | **B5** |
| 5 | Mantel/horn/halsduk sitter fel; färgord färgar inte föremål | **B6.2** |
| 6 | Felstavat föremål → inget "Menade du …?"; DOM 03–05 ostabila; saknar `djur`/`final` i data | **B6.1** / B2–B4 |
| 7 | Röd/grön på djurmodeller | **R9C pausad** (Christoffer) |
| 8 | Tackbubbla vs Guldord: ej bildverifierad | R9G-bevis |
| 9 | "Till stallet" vid ankomst utan tryck (Phaser räknade UI-tryck) · stall-banner kvar efter hämtning · tryck träffar djuret bakom · klistrigt "Vad vill du ge?" | **R9H** (`rundor/R9H-fix/`) |
| 10 | "en röv" i stall-listan: **inget fel** – texten är "en räv" (test mot blocklist.json för alla djur); typsnitt/bildskärpa. Större namn i R9H | R9H |
| 11 | Karttexten bara på kartan: **avsiktligt** (R9G punkt 7) | – |
| 12 | Skogen/sjön/grottan nästan tomma: startdekoren ligger mest utanför synfältet (telefon ser bara plats-x ≈ 0,30–0,70) och i fel skala | **R8-2a** (Build) |
| 13 | DOM-lägen 10–11 inaktuella, 03–05 ostabila · 10 eslint-varningar | **B6.1** |
| 14 | ~~`lagg-data.mjs --plats` ersätter hela platsraden~~ → slår nu ihop: `start`/`zoner`/`dekor`/`miljo` behålls från data/platser.json, övrigt från Copilot-utkastet (R8-2a steg 0 är därmed redan gjort) | **R9I** (underlag, klar) |
| 15 | ~~`kor-plats.sh` hittade inte `plats-prov.mjs` (ligger i `B1.4/`)~~ – B2 hade stoppat med exit 2 | **R9I** (underlag, klar) |
| 16 | "Sugen" djur öppnade gåvorutan vid varje tryck och dolde "Till stallet" | **R9I** (Christoffer: bara första trycket) |
| 18 | Grottan hade horisont med gröna trädkoner; droppstenar och "planka" (grottans `grotta`-modell bakom horisontbandet) svävade; djur ute på vattnet i sjön/skogen | **R8-2b** (`rundor/R8-2b/`) |
| 19 | ~~Djur på andra platser än ängen får aldrig humör~~ → humöret lever på alla platser, tryck på djur på en plats hittar djuret | **R9J** (`rundor/R9J-humor/`, Arkitektens beslut) |
| 20 | B2–B4 hade stoppat: 33 förslagsfraser gav ägg (utanför, stängd, matsäck, sjön, vattnet, vatten, ben) · ängs-testerna antog att bara ängen har uppdrag · plats-provet kunde inte resa till sjön/grottan · fel platsbild | ~~rättat i underlaget~~ (frasfix i data-utkast, `B2-test/b2-test.patch` via kor-plats.sh, plats-prov lägger klara uppdrag i sparningen) |
| 21 | Kenney Blocky Characters (och andra GLB med `KHR_materials_unlit`) ger sidfel i spelet: `TypeError: Cannot read properties of undefined (reading 'value')` när modellen visas (spelets material/uniform förutsätter upplyst material). M12 går runt det med härledda `-belyst.glb` | **kodrunda** (rätta i modellinläsningen, sedan kan originalfilerna användas) |
| 17 | Gåtrutan ("Hemligt djur att stava (0/181 hittade) Visa gåtan") syntes hopfälld under uppdrag | **R9I** (Christoffer: ingen gåta alls under uppdrag) |
