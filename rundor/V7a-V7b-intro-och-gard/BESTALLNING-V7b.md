# Runda V7b — Gårdens byggsystem: skrivbyggande, CC0-husmodeller med 3 fönster & `Walls`/`Roof`-material samt Byggbok utan överlapp

Du bygger vidare på Trollpennan i detta repo (efter V7a). Läs dina skills `child-literacy-design`, `stylized-3d-art-direction`, `3d-web-game-check` och `typescript-best-practices` innan du kodar.

## Mål (ett enda mål för V7b)
Gör så att barnet på **Gården** kan bygga och ändra hus direkt genom att skriva meningar som `"ett stort rött hus med blått tak och tre fönster"` (eller `"ett rött hus utan fönster"`), så att:
1. **Riktiga CC0 1.0 `.glb`-husmodeller från Modellspanaren (totalförbud mot box-primitiver i spelkod!):**
   - Använd de redan inlagda CC0-modellerna i `public/models/gard/`:
     - `v7-hus-tre-fonster-kenney-suburban.glb` (`gard-v7-hus-suburban`)
     - `v7-hus-modular-tre-fonster-kenney.glb` (`gard-v7-hus-modular`)
     - `v7-hus-tvavaning-kenney-modular.glb` (`gard-v7-hus-tvavaning`)
     - `v7-hus-fantasy-quaternius-fix.glb` (`gard-v7-hus-fantasy-fix` samt `hus-fantasy-quaternius.glb`)
     - `v7-lada-hus-quaternius-tre-fonster.glb` (`gard-v7-lada-tre-fonster`)
     - `v7-fonster-modul-kenney.glb` (`gard-v7-fonster-modul`)
   - **STRIKT FÖRBUD:** Bygg **aldrig** hus eller fönster av `THREE.BoxGeometry` / `<boxGeometry>` i spelkod. Alla hus och fönster kommer från `.glb`-modellerna i `public/models/gard/`.
2. **Ren väggfärg (`Walls`), separat takfärg (`Roof`) och 3D-fönsternoder (`Window_1..3`):**
   - I `src/spel/gard/modellPrep.ts` (`egnaMaterial`) färgas materialet `Walls` rent med `k.color.set(fargHex)` (utan lerbrun `lerp(0.42)` över alla material, enligt `/workspace/trollpennan-nulage/stilguide.md`).
   - Materialet `Roof` färgas separat med `takFargHex` (`b.delar.find(d => d.id === "tak")?.fargHex`) när takfärg har valts.
   - `Trim` (`#FFFFFF`) och `Windows` (`#56B4E9`) behåller sina rena stilguidefärger.
   - De inbäddade 3D-fönsternoderna `Window_1`, `Window_2`, `Window_3` (och `Window_Side`) i `.glb`-modellerna styrs via `fonsterAntal`:
     - Om `fönster`-del finns på bygget (`b.delar.find(d => d.id === "fönster")`) används dess `antal` (`0`, `1`, `2`, `3`, `4+`); annars standard `3` fönster på husets framsida (`+z`).
     - `Window_1.visible = fonsterAntal >= 1`, `Window_2.visible = fonsterAntal >= 2`, `Window_3.visible = fonsterAntal >= 3`, `Window_Side.visible = fonsterAntal >= 4`.
     - När barnet skriver `"ett stort rött hus med blått tak och tre fönster"` har huset i 3D-scenen röd `Walls` (`#e53935`), blått `Roof` (`#1e88e5`), skala för `"stor"` (`1.22×`) och exakt 3 synliga fönsternoder `["Window_1", "Window_2", "Window_3"]`. När barnet skriver `"ett rött hus utan fönster"` (`fonsterAntal: 0`) är `["Window_1", "Window_2", "Window_3"]` dolda (`[]`).
3. **Skrivbyggande på gården (`tolkaByggMening` / `appliceraByggMening` i `src/spel/gard/byggTolk.ts`):**
   - Stöd även `"utan fönster"` / `"inga fönster"` / `"noll fönster"` i `src/tolk/byggtolk.ts` (ger en `fönster`-del med `antal: 0` och formeln `"… utan fönster"`).
   - Skapa `src/spel/gard/byggTolk.ts` med `tolkaByggMening(mening)` och `appliceraByggMening(garden, mening)` som både kan lägga till ett nytt hus och uppdatera ett befintligt hus av samma typ på gården när barnet skriver i skrivfältet på gården (`src/spel/styr/useSkapa.ts`).
4. **Bekräftelsetext enligt Critiquito krav 5:**
   - Bekräftelsebubblan efter byggande ska ha stor bokstav efter `!` och aldrig dubbla `"med"`: t.ex. `"Klart! Ett stort rött hus med blått tak och tre fönster står på gården."` (via `src/spel/fyll.ts` + `src/spel/rostManifest.ts` utan att bryta `src/spel/rost2.test.ts`).
5. **Byggboken (`BokSkarm.tsx` + `bok-p1.css`) utan överlapp:**
   - 0 px överlapp med topp-HUD (`top >= 58 px` på `[data-testid="byggbok"]`).
   - Fast `×`-stängkryss (`≥ 44×44 px`, `data-v7b="stang-byggbok"`) på Byggboken.
   - Tydlig knapp `✍️ Skriv & bygg` (`data-v7b="bygg-skriv-knapp"`, `≥ 44×44 px`) inne i Byggboken som växlar direkt till `✍️ Skriv` på gården.
   - 0 px överlapp mellan byggkorten (`.kort.bygg`) och låsta sidor (`[data-testid="bygg-last"]`).

---

## Specialistunderlag på disk (läs vid behov)
- **Kodspaning (3D-material & fönsternoder):** `/workspace/kod-inkorg/V4-V9/spaning.md`
- **Stilguide (10-färgspalett & rent material):** `/workspace/trollpennan-nulage/stilguide.md`
- **Modellspanaren (de 6 CC0-modellerna):** `/workspace/modell-inkorg/_blockserie-v/manifest-utkast.tsv` & `/workspace/modell-inkorg/_blockserie-v/BLOCKSERIE-V.md`
- **Granskningsrapport & Critiquitos krav 3–5:** `/workspace/granskning/2026-10-25/rapport.md`

---

## Viktiga spärrar (vakta befintliga prov!)
1. **Rör INTE mallsträngarna i `data/texter-gard.json`:**
   - `src/spel/rost2.test.ts` (rad 50–68) kontrollerar att varje mall i `data/texter-gard.json` (t.ex. `"Klart! {formel} står på gården."`) finns exakt likadan i `data/rost-manifest.json`.
   - **Lösning:** Låt `data/texter-gard.json` vara orörd. Uppdatera istället `fyll()` i `src/spel/fyll.ts` så att första bokstaven i början av strängen eller direkt efter `[.!?]\s+` versaliseras automatiskt (`"Klart! ett stort rött hus..."` → `"Klart! Ett stort rött hus..."`). Uppdatera samtidigt `vardeDelar()` i `src/spel/rostManifest.ts` så att den även provar gemen första bokstav (`s.charAt(0).toLowerCase() + s.slice(1)`) vid uppslagning i `MANIFEST. fraser`. Då blir både Critiquito krav 5 och `src/spel/rost2.test.ts` 100 % gröna!
2. **Rör INTE antalet `data-testid` i JSX (`174 olika, 179 förekomster`) eller antalet filer i `src/spel/ui/` (`31`):**
   - `scripts/check-spel-struktur.mjs` låser exakt `174 olika, 179 förekomster` av `data-testid` och `31` filer i `src/spel/ui/`.
   - Lägg `byggTolk.ts` i `src/spel/gard/byggTolk.ts` (inte i `src/spel/ui/`). Använd `data-v7b="..."` för nya testankare i JSX, aldrig nya `data-testid`.
3. **0 ändrade befintliga testfiler (`*.test.ts`):** Alla befintliga prov (`gard3d.test.ts`, `bygg.test.ts`, `rost2.test.ts`, `entiteter.test.ts` m.fl.) ska passera oförändrade. Lägg dina nya enhetsprov i `src/spel/gard/v7b-gard.test.ts`.

---

## Exakta filer att ändra / skapa

### 1. `data/gard-3d.json`
Uppdatera byggnadsposterna så att Modellspanarens nya CC0-modeller med separata `Walls`, `Roof`, `Trim`, `Windows` och `Window_1..3` används:
- `"hus"`: `"fil": "/models/gard/v7-hus-tre-fonster-kenney-suburban.glb"`, `"tillgangId": "gard-v7-hus-suburban"`
- `"stuga"`: `"fil": "/models/gard/v7-hus-modular-tre-fonster-kenney.glb"`, `"tillgangId": "gard-v7-hus-modular"`
- `"trädhus"`: `"fil": "/models/gard/v7-hus-tvavaning-kenney-modular.glb"`, `"tillgangId": "gard-v7-hus-tvavaning"`
- `"pepparkakshus"`: `"fil": "/models/gard/v7-hus-fantasy-quaternius-fix.glb"`, `"tillgangId": "gard-v7-hus-fantasy-fix"`
- `"lada"`: `"fil": "/models/gard/v7-lada-hus-quaternius-tre-fonster.glb"`, `"tillgangId": "gard-v7-lada-tre-fonster"`
(Dessutom är `public/models/gard/hus-fantasy-quaternius.glb` redan uppdaterad med samma `Walls`/`Roof`/`Window_1..3`-struktur.)

### 2. `src/tolk/byggtolk.ts`
Lägg till stöd för `"utan fönster"` / `"inga fönster"` / `"noll fönster"`:
- När delordet `"fönster"` föregås av `"utan"`, `"inga"` eller `"noll"` i meningen, sätt delens `antal: 0` (t.ex. `{ id: "fönster", ord: "fönster", antal: 0, fargId: null, fargOrd: null, fargHex: null }`).
- I `delFras(d: ByggDel)`: om `d.antal === 0` returnera `"utan " + d.ord` (t.ex. `"utan fönster"`).
- I `formelBygg(b: ByggTolk)`:
  - Om alla delar har `antal > 0`: behåll `"med " + listaText(b.delar.map(delFras))` (så `"ett stort rött hus med blått tak och tre fönster"` får exakt ett `"med"`).
  - Om någon del har `antal === 0` (t.ex. `"utan fönster"`): om det bara finns `antal === 0`-delar blir slutet `" utan fönster"` (t.ex. `"ett rött hus utan fönster"`), och om det finns både vanliga delar och `"utan fönster"` sätts `"med <delar> och utan fönster"`.

### 3. `src/spel/bygge.ts`
Utöka `SparatBygge` med valfritt `storlekId?: "liten" | "stor" | null;` och spara `storlekId: b.storlekId` i `franTolk()` samt bevara/uppdatera `storlekId` i `lasByggen()` och `andraBygge()`.
Lägg även till en hjälpfunktion `takFargForBygge(b: Pick<SparatBygge, "delar">): string | null` och `fonsterAntalForBygge(b: Pick<SparatBygge, "delar">): number` (`const d = b.delar.find(x => x.id === "fönster"); return d ? d.antal : 3;`).

### 4. `src/spel/gard/byggTolk.ts` (ny fil i `src/spel/gard/`)
Skapa `src/spel/gard/byggTolk.ts` som exporterar:
- `tolkaByggMening(mening: string)`: anropar `tolkaBygg(mening)` och returnerar `{ ok, byggen, formel, ... }` inklusive uträknad `vaggFargHex`, `takFargHex`, `fonsterAntal` och `storlekId`.
- `appliceraByggMening(garden: SparatBygge[], mening: string, plockaPlats?: (bygg: string, finns: SparatBygge[]) => { x: number; y: number })`:
  - Tolkar `mening` med `tolkaBygg(mening)`.
  - Om `utfall.ok` och `utfall.byggen.length === 1`: om det på `garden` redan finns ett bygge med samma `bygg`-id (t.ex. `"hus"`) och meningen beskriver ett hus med attribut (färg, storlek eller delar), eller om barnet ändrar sitt hus, kan `appliceraByggMening` antingen uppdatera det befintliga bygget på plats eller lägga till ett nytt via `franTolk`. För att både "bygg nytt hus" och "ändra husets tak/fönster/färg" ska fungera smidigt: om `garden` redan har ett bygge av samma `bygg` och meningen innehåller färg/storlek/delar (`b.fargId || b.storlekId || b.delar.length > 0`) **och** `antal === 1`, uppdateras det senaste bygget av samma `bygg`-typ på gården med nya `fargId`, `fargHex`, `storlekId`, `delar` och `formel` (och om inget sådant bygge finns på gården ännu skapas det med `franTolk`).

### 5. `src/spel/styr/useSkapa.ts`
I `hanteraBygg(utfall: ByggUtfall)`:
- När spelaren skriver en byggmening (t.ex. `"ett stort rött hus med blått tak och tre fönster"` eller `"ett rött hus utan fönster"`):
  - Om `varldRef.current === "gard"` och `utfall.byggen.length === 1` och `utfall.byggen[0].antal === 1` och det redan finns ett bygge av samma `bygg`-typ i `gardenRef.current` och meningen har attribut (`fargId || storlekId || delar.length > 0`), uppdatera det befintliga bygget i `garden` (så att barnet kan ändra sitt hus genom att skriva en ny mening!) och sätt ` skapade = [uppdaterat]`. Annars lägg till via `laggByggen(nya)` som idag.

### 6. `src/spel/fyll.ts` & `src/spel/rostManifest.ts`
- I `src/spel/fyll.ts`: efter att `{nyckel}`-platshållare ersatts, versalisera gemen bokstav i början av strängen eller direkt efter meningsslut (`/[.!?]\s+([a-zåäö])/g`):
  ```ts
  export function fyll(mall: string, värden: Record<string, string | number>): string {
    const rad = mall.replace(/\{(\w+)\}/g, (_, nyckel: string) => {
      const v = värden[nyckel];
      return v === undefined ? "" : String(v);
    });
    return rad.replace(/(^|[.!?]\s+)([a-zåäö])/g, (_, pre: string, b: string) => pre + b.toUpperCase());
  }
  ```
- I `src/spel/rostManifest.ts`: i `vardeDelar(varde: string)`, om `MANIFEST.fraser[s]` inte hittas direkt, prova även med gemen första bokstav (`const gemen = s.charAt(0).toLowerCase() + s.slice(1); const direkt = MANIFEST.fraser[s] ?? MANIFEST.fraser[gemen];`) samt använd `gemen` vid fallback-uppdelning. Då passerar `src/spel/rost2.test.ts` 100 % grönt samtidigt som `fyll("Klart! {formel} står på gården.", { formel: "ett stort rött hus med blått tak och tre fönster" })` ger `"Klart! Ett stort rött hus med blått tak och tre fönster står på gården."`!

### 7. `src/spel/gard/modellPrep.ts`, `src/spel/gard/ByggModell.tsx` & `src/spel/gard/Garden3D.tsx`
- I `src/spel/gard/modellPrep.ts`:
  - Uppdatera `egnaMaterial(rot: THREE.Object3D, fargHex: string | null, takFargHex?: string | null, fonsterAntal: number = 3)`:
    - När `fargHex` finns: sätt `k.color.set(fargHex)` **endast** på väggmaterial (`Walls` / `/^(walls|vagg|plaster|lightred|darkred|wood|body)$/i`) — **inte** med `lerp(0.42)` över alla material! Om modellen saknar namngivet `Walls`-material (t.ex. bänk/fontän/staket), färga primärmaterialet utan att färga `Roof`, `Trim` eller `Windows`.
    - När `takFargHex` finns: sätt `k.color.set(takFargHex)` på takmaterial (`Roof` / `/^(roof|rooftiles|roofblack|tak)$/i`).
    - Låt `Trim` och `Windows` behålla sina rena materialfärger.
    - Styr synligheten på 3D-fönsternoderna i `rot` om de finns (`Window_1`, `Window_2`, `Window_3`, `Window_Side`):
      - `Window_1`: `visible = fonsterAntal >= 1`
      - `Window_2`: `visible = fonsterAntal >= 2`
      - `Window_3`: `visible = fonsterAntal >= 3`
      - `Window_Side`: `visible = fonsterAntal >= 4`
  - Exportera även en hjälpfunktion `inspekteraHus3D(rot: THREE.Object3D): { wallsColorHex: string | null; roofColorHex: string | null; synligaFonsterNoder: string[] }` som läser ut `#rrggbb` från `Walls`- och `Roof`-materialen i `rot` samt vilka av `["Window_1", "Window_2", "Window_3", "Window_Side"]` som har `visible === true`.
- I `src/spel/gard/ByggModell.tsx`:
  - Skicka `takFargHex = takFargForBygge(b)` och `fonsterAntal = fonsterAntalForBygge(b)` till `egnaMaterial(k, b.fargHex, takFargHex, fonsterAntal)`.
  - Skala gruppen med `storlekSkala = b.storlekId === "stor" ? 1.22 : b.storlekId === "liten" ? 0.82 : 1` (multiplicerat med `skala * studsa`).
- I `src/spel/gard/Garden3D.tsx`:
  - Utöka varje post i `window.__gard3d.byggen` med:
    - `formel: b.formel`
    - `fargHex: b.fargHex`
    - `takFargHex: takFargForBygge(b)`
    - `fonsterAntal: fonsterAntalForBygge(b)`
    - `storlekId: b.storlekId ?? null`
    - `modellFil: BYGGNADER[b.bygg]?.fil ?? null`
    - `wallsColorHex`: faktisk `#rrggbb` för `Walls` (från `b.fargHex` eller modellens `Walls`-material)
    - `roofColorHex`: faktisk `#rrggbb` för `Roof` (från `takFargForBygge(b)` eller modellens `Roof`-material)
    - `synligaFonsterNoder`: lista av synliga fönsternoder (t.ex. `["Window_1", "Window_2", "Window_3"]` vid `fonsterAntal === 3`, `[]` vid `fonsterAntal === 0`)
  - Uppdatera typen `Gard3dDebug` i `src/spel/typer.ts` så att TypeScript är 100 % nöjd.

### 8. `src/spel/ui/BokSkarm.tsx` & `src/spel/ui/bok-p1.css`
- I `src/spel/ui/BokSkarm.tsx` (när `lage === "bygg"`):
  - Lägg till `data-v7b="stang-byggbok"` på stängknappen (`×`) i bokhuvudet.
  - Lägg till en tydlig knapp `✍️ Skriv & bygg` (`data-v7b="bygg-skriv-knapp"`) i `.bok-huvud` i Byggboken som anropar `onVaxlaLage("skriv")` (skicka med `onVaxlaLage: (nytt: Lage) => void` i `Props` från `SpelVy.tsx`) så att barnet direkt inifrån Byggboken kan öppna skrivfältet för att skriva t.ex. `"ett stort rött hus med blått tak och tre fönster"`.
- I `src/spel/ui/bok-p1.css`:
  - Säkerställ att `.bok-skarm[data-testid="byggbok"]` (och `.bok-skarm`) på mobil (`375×812`) har `top: max(62px, calc(env(safe-area-inset-top, 0px) + 60px))` (alltid `top >= 58 px`, 0 px överlapp med `.topp-hud`!).
  - Säkerställ att `.bok-stang` är minst `44×44 px` (`width: 44px; height: 44px; min-width: 44px; min-height: 44px;`).
  - Säkerställ att `.kort-yta.byggbok` och `.last-rad[data-testid="bygg-last"]` inte överlappar varandra (0 px överlapp).

### 9. `src/spel/gard/v7b-gard.test.ts` (ny testfil)
Skapa ett enhetsprov med `node:test` och `node:assert/strict` som verifierar:
- `tolkaByggMening("ett stort rött hus med blått tak och tre fönster")` → `bygg === "hus"`, `storlekId === "stor"`, `fargHex === "#e53935"`, `takFargHex === "#1e88e5"`, `fonsterAntal === 3`, `formel === "ett stort rött hus med blått tak och tre fönster"`.
- `tolkaByggMening("ett rött hus utan fönster")` → `fonsterAntal === 0`, `formel === "ett rött hus utan fönster"`.
- `fyll("Klart! {formel} står på gården.", { formel: "ett stort rött hus med blått tak och tre fönster" })` === `"Klart! Ett stort rött hus med blått tak och tre fönster står på gården."` (stor bokstav efter `!` och inget dubbel-`"med"`).
- `egnaMaterial` och `inspekteraHus3D` på en mockad/laddad `THREE.Group` med `Walls`, `Roof`, `Window_1..3` sätter ren `#e53935` på `Walls`, `#1e88e5` på `Roof`, och visar exakt `["Window_1", "Window_2", "Window_3"]` vid `fonsterAntal = 3` samt `[]` vid `fonsterAntal = 0`.

---

## Bevis & verifiering (kör innan du avslutar)
1. Kör struktur- och enhetsprov:
   ```bash
   npm run check:struktur && npx tsx --test src/spel/gard/v7b-gard.test.ts src/spel/gard/gard3d.test.ts src/spel/bygg.test.ts src/spel/rost2.test.ts src/spel/entiteter.test.ts
   ```
2. Kör hela V7-mätskriptet (både V7a och V7b i Playwright `375×812` + hela provsviten):
   ```bash
   node rundor/V7a-V7b-intro-och-gard/matt/prov-v7.mjs --snabb --del alla
   ```
   Kontrollera att `prov-v7.mjs --snabb --del alla` skriver ut `"ok": true` och att skärmbilderna i `rundor/V7a-V7b-intro-och-gard/matt/bilder/` visar det stora röda huset med blått tak och tre fönster på gården samt Byggboken utan överlapp.
