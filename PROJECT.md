# PROJECT.md – Trollpennan (projektkarta)

Skriven av Arkitekten 2026-10-18 mot `main` = `697be95` ("Runda 5A: ryggsäck, mantel och horn (#11)", 2026-10-18 10:39 Stockholmstid). Allt här är läst ur filer, git och `gh`; inget är körts om (inga byggen, inga tester, ingen webbläsare). Där något är en slutsats eller gissning står det. Uppdatera filen efter varje sammanslagen runda (grindregel 1 i skillen `build-round-gate`).

Källor: `/workspace/trollpennan-nulage/` (copilot-inventering.md, ritning-tillbehor.md, motorjamforelse.md, analys-kod.md, plan-A-B.md, natt-rapport-runda*.md, rounds.tsv, assets-bengtsson/RAPPORT.md), repots `HANDOFF.md`, `projektregler.md`, `CREDITS.md`, `data/*.json`, `src/`, samt `git` och `gh pr list`.

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
- Menyknapparna **Gården, Byggboken, Album, Uppdragsboken, Ordbok** är låsta (`lasMeny` → "Kommer senare", `Spel.tsx` ~r.2361). Gården nås ändå via kartan ("Gården" → `tryckPlats("garden")` → "Bygg något").
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
2. **En renderväg.** Målet är R3F för allt (rekommendation i motorjamforelse.md, "väg 1"). Ingen ny vy byggs i Phaser. Under övergången gäller: nya tillbehör/effekter/byggdelar skrivs bara för R3F; Phaser får bara bugfixar. Borttagning av Phaser kräver Christoffers ja (mandatet).
3. **`Spel.tsx` ska delas.** Ingen ny vy, panel eller dialog läggs i `Spel.tsx`. Ny UI = egen komponent i `src/spel/ui/`; ny logik = egen hook/modul. Gräns som skripten ska vakta: ingen ny fil över 800 rader. Idag över 800: `Spel.tsx` (3133), `angen3d.tsx` (2202), `scen.ts` (967), `tolka.ts` (833), `ritaBygg.ts` (811). Planen delar `Spel.tsx` (R1/R4) och tar bort `scen.ts`/`ritaBygg.ts` (R5); **`angen3d.tsx` (2202) och `tolka.ts` har ingen runda ännu** (fråga 12).
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

## 8. Färdplan: nästa 5 rundor i ordning
Alla rundor: Grok Build CLI, `--prompt-file`, gren per runda (`build/runda-N`), loggfil, commit efter varje delmål, `RUNDA<N>.md` först. Ingen mätning/utforskning i Build; Arkitekten lägger siffror och filrader i prompten. Kostnadsuppskattningar är min gissning utifrån `rounds.tsv` (low/medium, 11–30 turer = 0,5–3 USD), inte mätt.

Grinden (skillen `build-round-gate`, 7 punkter): (1) projektkarta aktuell, (2) återanvändning kontrollerad, (3) arkitekturregeln hålls, (4) ritning i prompten, (5) bevis definierat, (6) inställningar valda, (7) ett logiskt mål. **Grindutlåtande idag (2026-10-18), före start:**

| Runda | Grind | Skäl |
|---|---|---|
| R1 Dela Spel.tsx | **JA** | Alla 7 uppfyllda när PROJECT.md är mergad: ren flytt utan nytt beteende, ritning nedan, bevis = testid-ögonblicksbild + skärmbilder. Lägst risk, störst hävstång |
| R2 Tillbehör som data | **JA, med villkor** | Villkor: JSON-filerna skrivs av Arkitekten (utan Build) och bifogas prompten; Build ska bara koppla in. 5B och 5B-1 misslyckades just för att Build skulle mäta/skriva dem. R1 bör vara mergad så `Spel.tsx` inte krockar |
| R3 Tillgångsflöde + `djur.json` | **NEJ (idag)** | Beror på R2:s dataform (`djur.json` delar ankarnamn med `tillbehor.json`). Blir JA när R2 är mergad och Christoffer valt `LICENSES.md` vs `CREDITS.md` (fråga 4) |
| R4 Gården i R3F | **NEJ** | Beror på R1–R3, kräver Christoffers ja till att Phaser-gården ersätts (mandatet), och att `Spel.tsx` hook-delas (R1B, se nedan). Grindpunkt 7 (ett mål) kräver att R4 delas i 4A/4B |
| R5 Äventyret i R3F, Phaser bort | **NEJ** | Beror på R4; kräver uttryckligt ja till att ta bort `phaser` |

### R1 – Dela `Spel.tsx` (ren flytt, noll beteendeändring)
- **Mål:** `Spel.tsx` från 3133 till ≤ 1900 rader genom att flytta ut JSX-block, konstanter och hjälpkomponenter. Hook-delning av händelsefunktioner (r.575–1600) är R1B, första steget i R4.
- **Filer (nya, `src/spel/ui/`):** `spelData.ts` (r.104–205: JSON-importer, `SIDOR`, `BYGGSIDOR`, `TEXTER`, `FIR`, `LED`, `RADER`), `hjalp.ts` (r.228–465 rena funktioner: `kanEtikett`, `kortIkon`, `meningAv`, `normFras`, `exempelFor`, `bastaFlik`, `bytOrd`, `taBortOrd`, `djurPris`, `lastBygge`, `exportera` …), `OnskaAnsikte.tsx` (r.206–227), `HoldOppnare.tsx` (r.3092–3133), `KartaLager.tsx` (r.2248–2286, karta + område), `Hud.tsx` (r.2287–2432: HUD, meny, `hud-bot`), `BokPanel.tsx` (r.2433–2643), `UppdragPanel.tsx` (r.2644–2736), `Dialoger.tsx` (r.2737–3091: skylt, valj-djur, formel, ordbok-sida, kop-fraga, foralder, mossa-panel).
- **Funktioner/dataformer:** varje komponent tar en tydligt typad `props` med exakt de värden/funktioner JSX:en redan använder (state och handlers stannar i `Spel()` i R1). Inga nya state, inga ändrade `data-testid`, inga ändrade klassnamn, ingen ny logik. Exporterna typas; ingen cirkulär import in i `Spel.tsx`.
- **Bevisning (Doodle):** (a) nytt skript `scripts/check-spel-struktur.mjs` + `npm run check:struktur`: misslyckas om `Spel.tsx` > 1900 rader eller om mängden `data-testid` i `src/spel/**/*.tsx` skiljer sig från `verification/testid-baseline.json` (skapas av skriptet ur main före ändring) – **röd före, grön efter**; (b) `npm run typecheck:pages`, `test:product`, `build:pages` gröna; (c) `verification/browser-B02R-3.mjs` oförändrad grön; (d) fyra bilder 375×812, före/efter sida vid sida: `01-intro`, `02-ang-med-djur`, `03-bok-oppen`, `04-karta`; pixlarna ska vara lika (kontrollera med bildjämförelse, inte ögonmått).
- **Storlek:** medium, ca 25–30 turer, 2–3 USD (gissning). **Risk:** props-drilling blir stor; acceptera, det är ett mellansteg.
- **Grind: JA** (se tabell).

### R2 – Tillbehör som data + ett generellt fästsystem (ersätter ca 450 rader per-sak-kod)
- **Mål:** ett nytt tillbehör = en rad i `data/tillbehor.json` (+ ordrad i `ord.json` + glTF vid behov). Placering/skala/riktning kommer ur data per djur, aldrig ur `kropp ===`. De fem kända felen (5A) rättas genom att ändra *siffror i JSON*, och det är rundans bevis.
- **Filer:** NYA `data/tillbehor.json`, `data/fastpunkter.json`, `src/spel/tillbehorData.ts` (typer, laddning, `kontrolleraTillbehor()`; **ingen three-import** så det går att testa med `node --experimental-strip-types`), `src/spel/tillbehorData.test.ts`; ÄNDRAS `src/spel/tillbehorFaste.ts` (faestTillbehor blir generisk), `src/spel/gltfDjur.tsx` (`fastAnkare`, r.184), `package.json` (lägg testfilen i `test:product` och `test`), `src/spel/djurmesh.ts` (ta bort r.308–330 krona/horn) och `angen3d.tsx` r.586–588.
- **Dataform – `data/tillbehor.json`** (ersätter `byggKrona…byggGlas`, `skalaFor`, `platsFor`; samma idé som `kit.json`):
```json
{
  "version": 1,
  "tillbehor": {
    "krona": {
      "ankare": "anchor_head",
      "delar": [
        { "form": "cyl",  "pos": [0, 0, 0],    "skala": [1, 0.6, 1], "farg": "$tillbehor", "kant": true },
        { "form": "kon",  "pos": [0.2, 0.3, 0], "skala": [0.5, 1, 0.5], "farg": "$tillbehor" }
      ],
      "modell": null,
      "standardfarg": "#F2B632",
      "skala": { "mot": "huvudbredd", "faktor": 1.6, "min": 0.28, "max_hojd_andel": 0.55 },
      "framat": 0.0,
      "lyft": 0.0,
      "vrid": "fram"
    },
    "glasögon": { "ankare": "anchor_face", "…": "…" },
    "mantel":   { "ankare": "anchor_back", "vrid": "bak", "…": "…" }
  }
}
```
`form` är en av `cyl|kon|ring|sack|box|torus|kil` (primitiverna som redan finns i `GEO`, r.33–44; `mantel` blir `kil` med parametrar). `modell` (sökväg till glTF i `public/models/tillbehor/`) ersätter `delar` när en riktig modell finns (R3). `skala.mot` ∈ `huvudbredd|kroppsbredd|hojd`. Färg: `$tillbehor` = färgen från `TillbehorSpec.farg` (idag ignoreras den i GLB-vägen, enligt ritning-tillbehor.md; testa).
- **Dataform – `data/fastpunkter.json`** (ersätter `PROC_ANKARE`, `glbRygg`, `procRygg`, specialgrenarna i `ankareFor` och alla `kropp ===` i `skalaFor/platsFor/vandRygg`):
```json
{
  "version": 1,
  "kroppar": {
    "katt": {
      "fram": "-z",
      "ankare": {
        "anchor_head": [0, 0.92, -0.10], "anchor_brow": [0, 0.78, -0.40],
        "anchor_face": [0, 0.62, -0.55], "anchor_neck": [0, 0.5, -0.30],
        "anchor_back": [0, 0.55, 0.20],  "anchor_ear_l": [-0.2, 0.9, -0.2]
      },
      "huvudbredd": 0.45,
      "overstyr": { "mantel": { "skala": 0.9, "lyft": 0.05 }, "horn": { "framat": 0.1 } }
    }
  }
}
```
(Siffrorna ovan är exempel på formen; riktiga värden transkriberas av Arkitekten ur `tillbehorFaste.ts` r.120–324 och `ankareFor`:s fraktioner innan rundan startar; de är normaliserade mot djurets `MAL_HOJD`.) Koordinater i djurets lokala rum, normaliserat; `fram` ∈ `+z|-z` ersätter `vandRygg`/`framRiktning`.
- **Funktion (ny kärna):** `faestTillbehor(rot, kropp, tillbehor[])`: 1) slå upp rad i `TILLBEHOR[t.id]`; 2) hitta ankarpunkt: `rot.getObjectByName(rad.ankare)` om noden finns i GLB, annars `FASTPUNKTER[kropp].ankare[rad.ankare]`; 3) skala = `skala.faktor * <mått>` begränsad av `min`/`max_hojd_andel`, gånger `overstyr[t.id].skala`; 4) rikta med `fram`/`vrid`; 5) bygg ur `delar` eller ladda `modell`; 6) lägg under benet/noden så den följer idle. Allt tillbehör följer samma sju rader kod.
- **Tas bort/ersätts:** `byggKrona`, `byggHatt`, `byggHalsduk`, `byggRosett`, `byggRyggsack`, `byggMantel`, `byggHorn`, `byggGlas`, `arTrollkarlshatt`, `skalaFor`, `platsFor`, `pannaPlats`, `mantelPlats`, `framRiktning`, `vandRygg`, `PROC_ANKARE`, `STANDARD`, `glbRygg`, `procRygg` (ca 450 av 619 rader). Behåll: `Ankare`-typ, `TOON`, `KONTUR`, `del()`, `toonMat()`, `fastVarld()`.
- **Bevisning (Doodle):** (a) `tillbehorData.test.ts` – röd före (modulen saknas), grön efter: varje `del.tillbehor` i `ord.json` har en rad; varje rads `ankare` finns för alla 14 kroppar i `fastpunkter.json`; alla vektorer ändliga; inga okända `form`; (b) `scripts/ark-tillbehor.mjs` (Playwright, 375×812, `window.__troll`) tar ett ark per tillbehör med alla 10 kroppar (9 GLB + gris): `01-krona` … `08-mantel` (8 bilder = max); (c) före/efter: de som var bra i 5A får inte ändras; de fem felen (fågel ryggsäck, katt/kanin mantel, katt/häst horn) ska vara rättade **med en JSON-ändring per fel** (visa diff); (d) `rg "kropp ===" src/spel/tillbehorFaste.ts` ger 0 träffar.
- **Storlek:** medium, 25–30 turer, 2–3 USD; JSON-filerna förbereds utanför Build. **Risk:** att riktningen (`fram`/`vrid`) blir fel för skinnade djur (drake/häst) – ge dem `anchor_*` via ben i R3, tills dess `ben`-fältet i `fastpunkter`.
- **Grind: JA, med villkor** (JSON bifogas; R1 mergad helst).

### R3 – Tillgångsflöde + `data/djur.json` + ankarnoder i GLB
- **Mål:** en ny modell läggs till med ett kommando och en datarad, med licens kontrollerad av ett skript; de nio befintliga djuren får `anchor_*`-noder; djurlistan flyttas ur kod till data.
- **Filer:** NYA `data/djur.json`, `data/tillgangar.json` (manifest), `LICENSES.md` (genereras), `scripts/tillgangar/lagg-till.mjs` (kopierar, optimerar, lägger ankare, uppdaterar manifest), `scripts/tillgangar/kontrollera.mjs` (+ `.test.mjs`), `scripts/tillgangar/ankare.mjs` (lägger tomma noder med gltf-transform-API), `package.json` (`"kontrollera:tillgangar"`, ny devDependency `@gltf-transform/cli` + `@gltf-transform/core`); ÄNDRAS `src/spel/gltfDjur.tsx` (ta bort `FIL`, `MAL_HOJD`, `PALETT`, `harModell`, `modellUrl` → läs `data/djur.json`), `src/spel/tillbehorData.ts` (läs ankare ur noder först), `public/models/*.glb` (9 filer får `anchor_*`-noder; nya sökvägar `public/models/djur/` införs bara för nya modeller), `CREDITS.md` (pekar på `LICENSES.md`, behåller groda-raden).
- **Dataform – `data/djur.json`:** `{ "hund": { "modell": "/models/animal-dog.glb", "malhojd": 1.05, "fram": "-z", "palett": {"from":25,"range":22,"bodyL":0.55}, "klipp": {"vila":"idle","gang":"walk"}, "licens": "kenney-cube-pets" } }`. `licens` pekar på manifestets `id`.
- **Dataform – `data/tillgangar.json`:** `{ "id":"kenney-cube-pets", "filer":["models/animal-dog.glb", …], "titel":"Cube Pets 2.0", "upphov":"Kenney", "licens":"CC0-1.0", "kalla":"https://kenney.nl/assets/cube-pets", "hamtad":"2026-10-17", "andrad":["gltf-transform optimize …"], "kredit_i_spel":false }`.
- **Funktioner:** `kontrollera.mjs` misslyckas om: en GLB i `public/models/**` saknas i manifestet; en rad saknar `kalla`/`upphov`/`licens`; licensen inte är `CC0-1.0` (eller `CC-BY-3.0|4.0` med `kredit_i_spel:true` och kredit-testid i källkoden); en `djur.json`-modell saknar noderna `anchor_head`, `anchor_face`, `anchor_neck`, `anchor_back`; filen är > budget (djur 300 KB, tillbehör 60 KB, natur 80 KB); trianglar över budget (djur 6 000, tillbehör 800).
- **Första verkliga modellen genom flödet:** Quaternius **Crown** (https://poly.pizza/m/i0PZVuVlYv, CC0, verifierad 2026-10-18) som `public/models/tillbehor/krona.glb`; raden i `tillbehor.json` byter `delar` mot `modell`. Visar att *en fil + en rad* räcker.
- **Bevisning (Doodle):** (a) `kontrollera:tillgangar` – röd före (manifest saknas), grön efter; (b) enhetstest som lägger till en falsk rad utan licens i en temporär kopia och förväntar fel; (c) `node scripts/tillgangar/lista-ankare.mjs` skriver `verification/ankare-lista.txt` med noderna per GLB (9 av 9 kompletta); (d) bilder: `01-nio-djur-oforandrade`, `02-krona-som-modell-pa-alla`, `03-hund-med-krona-narbild` (3 bilder). Jämför `01` mot R2:s bilder: oförändrade.
- **Storlek:** medium, 30 turer, 3–4 USD; skripten är små men 9 modellfiler ändras. **Risk:** `gltf-transform optimize` plattar scenträdet och tar bort tomma noder som standard (se avsnitt 9). Kommandot måste därför ges med `--flatten false --join false --prune false` och följas av `prune --keep-leaves true`; annars försvinner ankarna och benen.
- **Grind: NEJ idag** (beror på R2; blir JA när R2 är mergad och fråga 4 är besvarad).

### R4 – Gården i R3F (renderväg steg 1; delas i R4A hook-delning + R4B Gård)
- **Mål (R4A, första commit, ca 10 turer):** hook-delning ur `Spel()` (r.575–1600): `useAventyrFlode.ts` (`tryckPlats`, `bjud`, `synkaAv`), `useSkriv.ts` (`utfor`, `skrivTecken`, `rensaSkriv`), `useOnskan.ts` (`oppnaOnska`, `stangOnska`), `useBygge.ts` (`flyttaInDjur`, `lasInKopia`); `Spel.tsx` ≤ 1000 rader (och `check:struktur` skärps till 1000). **Mål (R4B):** Gården och byggläget ritas i R3F, läser samma data och samma `SparatBygge`; Phaser-gården ligger kvar bakom `?renderare=phaser` tills R5.
- **Filer:** NYA `src/spel/gard3d.tsx` (R3F-scen: mark, byggen, flytta, bo i hus), `src/spel/byggdelar3d.ts` (data → three-grupp, samma generiska system som tillbehör), `data/byggdelar.json`, `src/spel/byggdelar3d.test.ts`; ÄNDRAS `Spel.tsx` (`varld === "gard"` → `<Gard3D/>`), `bygge.ts` (inget i sparformatet), `data/bygg.json` rörs inte (läser `delar`, `material`, `hem`).
- **Dataform – `data/byggdelar.json`:** `{ "hus": { "stomme": { "modell": "/models/bygg/hus.glb" | null, "form": "box", "skala": [1.2,0.8,1] }, "fastpunkter": { "dorr": [0,0,0.5], "fonster": [[-0.3,0.4,0.5],[0.3,0.4,0.5]], "tak": [0,0.8,0], "skorsten": [0.3,1,0] }, "standardfarg": "#C9694A" }, "stuga": { "som": "hus", "skala_mult": 0.8 } }`. `som` ger alias så de 36 byggorden inte blir 36 modeller; 8 egna rader först (hus, stuga, stall, tält, staket, träd, bro, torn).
- **Bevisning:** (a) test: varje `id` i `bygg.json` har en rad eller `som`-alias i `byggdelar.json`; (b) röd→grön `check:struktur` med ny gräns 1000 rader för `Spel.tsx`; (c) bilder: `01-gard-tom`, `02-hus-3-fonster`, `03-stall-med-djur`, `04-flytta-byggnad`, `05-bro-och-tradslag`, `06-alla-8-grundbyggen` (6 bilder), jämfört med Phaser-gårdens bilder; (d) `verification/browser-B02R-3.mjs` grön (scenbyten).
- **Storlek:** stor, 2 rundor à 30–40 turer, 5–8 USD totalt (gissning). **Risk:** drag/placering på touch i 3D (`controls`-skillen), `hem.platser` är bara ett antal. Det finns ingen placeringsmodell (copilot-inventering.md).
- **Grind: NEJ** (se tabell).

### R5 – Äventyret i R3F och Phaser bort
- **Mål:** skog, sjö, ön, grottan som R3F-scener ur data; ta bort `phaser`, `scen.ts`, `gard.ts`, `avscen.ts`, `starta.ts`, `avbro.ts`, `ritaBygg.ts`, `deladeBilder.ts` (`texturKo` bara om ingen annan använder den; kolla `rg`). 2D-kitet i `public/kit/` stannar för formelkort och bok (`kit.ts`).
- **Filer:** NYA `src/spel/aventyr3d.tsx`, `src/spel/omrade3d.ts` (data → scen), `data/scener.json`; ÄNDRAS `data/omraden.json` rörs inte (läser `hinder`); `Spel.tsx` (`omrade` → `<Aventyr3D/>`), `package.json` (`phaser` bort), `vite.pages.config.ts` (chunk), `src/spel/natthimmel.ts` (Phaser-typ bort).
- **Dataform – `data/scener.json`:** `{ "skogen": { "mark": {"modell":"natur/ground_grass"}, "objekt": [ {"modell":"natur/tree_oak","pos":[2,0,-3],"vrid":0.4}, … ], "skyltar": {"skylt-1":[1,0,-2]}, "vilda": {"rav":[3,0,1]}, "ljus": {"typ":"dag"} } }` (ersätter `VILD_POS`, skyltpositioner och proceduell ritning i `avscen.ts`).
- **Bevisning:** (a) test: varje `skylt`/`vilt djur`-id i `skyltar.json`/`vilda-djur.json` finns på sin scen; `rg -l phaser src package.json` ger 0 träffar; `check:pages-output` visar att Phaser-chunken (1,25 MB) är borta; (b) bilder: `01-karta`, `02-skog`, `03-sjo`, `04-on-med-fyr`, `05-grotta-med-ljuscirkel`, `06-vilt-djur-gava`, `07-bro-byggs`, `08-tillbaka-till-ang` (8 = max); (c) `browser-B02R-2/3` anpassade för scenbyten utan varning.
- **Storlek:** stor, 2 rundor à 30–40 turer, 6–9 USD (gissning). **Risk:** grottans skuggor/ljuscirkel; flodens bro (`avbro.ts` finns för att React bygger bron åt Phaser).
- **Grind: NEJ** (se tabell). **Efter R5:** Uppdragsboken/Album/Gården/Byggboken kan låsas upp (R6, litet): `lasMeny` + ingång till `panel === "uppdrag"`; vyn är redan skriven.

---

## 9. Tillgångsflöde (utkast)
Stil i en rad (ur koden): **mjuk low-poly leksak, platt toon-skuggning (3-stegs `DataTexture` 72/158/255), tjock mörk kontur `#3B2F2F` via inverterat skal (`BackSide`, 1,18× större kopia)**. Alla fria 3D-modeller saknar kontur; kontur och toon läggs i koden för allt, då smälter olika paket ihop (assets-bengtsson/RAPPORT.md).

### 9.1 Namngivning och mappar
`public/models/<kategori>/<id>.glb`, kategori ∈ `djur | tillbehor | bygg | natur | foremal`. `<id>` = ASCII-gemener med bindestreck (`hast`, `trollkarlshatt`; inga å/ä/ö i filnamn; svenska namnet bor i data). Befintliga filer (`animal-*.glb`, `drake.glb`, `hast.glb`, `groda.glb`, `natur/`) flyttas inte; de får manifestrader. Nodnamn i filen: `anchor_*` (gemener, understreck) för ankare, `attach` för tillbehörets fästpunkt. Källfiler (FBX/Blend) sparas **inte** i repot.

### 9.2 Skala och orientering
- Enhet: 1 = en meter i modellen; **koden normaliserar djur till `malhojd`** (`MAL_HOJD`, idag 0,7–1,5) så importen behöver inte skalas exakt, men filens egen höjd ska vara 0,3–3,0.
- Y upp, **framåt = +z** i nya filer. Äldre Kenney-djur har ansiktet mot −z; det anges som `"fram":"-z"` i `djur.json` (idag fångas det med `kropp ===`-grenar).
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

## 10. Öppna frågor och osäkerheter (ärligt)
1. **Inget har körts om.** Inga tester, byggen eller webbläsare i detta arbete; siffror (rader, rundor, kostnad, tester 75/75) är ur filer och rapporter. Rundkostnaderna i `rounds.tsv` är delvis uppskattade (5B, 5B-1: `grok usage` saknar registrering).
2. **Kvarvarande tillbehörsfel är bedömda ur Builds och min bildläsning (5A-rapporten), inte omkontrollerade.** Siffror för `fastpunkter.json` ska transkriberas ur koden och prövas mot bild i R2; det kan krävas en iteration.
3. **`HANDOFF.md` i repot är gammal** (B03-checkpoint, 2026-10-13, "B04 får inte påbörjas") och stämmer inte med läget; `HANDOFF.md`, `BLOCK-STATUS.md`, `IMPROVEMENT-LOG.md` är historik. Ska de arkiveras? Rör dem inte förrän Christoffer sagt ja.
4. **`LICENSES.md` eller `CREDITS.md`?** Idag finns `CREDITS.md` (publik tack + licens). Förslag: `LICENSES.md` genereras ur manifestet och `CREDITS.md` blir en kort pekare. Behöver Christoffers val före R3.
5. **Phaser bort?** Mandatet säger "bevaras tills ett byte har motiverats och verifierats". motorjamforelse.md rekommenderar R3F (väg 1) men beslutet är inte taget. R4 och R5 kräver ett uttryckligt ja.
6. **`ord.json` rörs inte av planen**, men nya tillbehörsord (t.ex. "mössa", "badring") kräver ordrader som Copilot/Christoffer granskar. Det är utanför Builds ramar.
7. **Mobilprestanda är omätt** (ingen riktig telefon; allt är SwiftShader). Triangel- och filbudgetarna i R3 (djur 6 000 trianglar, 300 KB) är mina startvärden, inte mätta; sätt dem efter första mätning (`inspect`).
8. **Licensverifieringen av Quaternius FAQ:** se fällor. De enskilda paketsidorna visar CC0; jag har inte öppnat licensfilerna i själva zip-paketen (inget nedladdat).
9. **Artlistan i paket 2–5 är inte kontrollerad** (jag har bara paketsidorna). Vilka arter som finns avgörs vid nedladdning. Detsamma gäller om "hatt/krona"-modeller finns i KayKit-paketen.
10. **Lokala grenar utanför repot:** `build/runda-4d` (3 commits, glitterfix) finns bara i `/workspace/trollpennan-build`. Städa eller bevara? Beslut hos Christoffer.
11. **Ordningen på R1/R2:** kan köras i valfri ordning tekniskt (olika filer), men R2:s grind kräver att R1 inte pågår samtidigt i `Spel.tsx`/`gltfDjur.tsx` (konfliktrisk i `package.json`).
12. **`angen3d.tsx` (2202 rader) delas inte i planen.** Ängen, djurscenen, effekterna och natten ligger i en fil; den blir nästa Spel.tsx-problem när Gården och äventyret flyttar in. Förslag: en R6 delar den (`ang-scen.tsx`, `djur-i-scen.tsx`, `natur.tsx`). Ej beslutat.
13. **Gamla Phaser-bildkonst och 2D-tillbehörsbilder** (`public/kit/tillbehor/*.png`) används kvar i bok och formelkort; om det ska bli 3D-bilder också (en renderväg även i UI) är inte beslutat.
