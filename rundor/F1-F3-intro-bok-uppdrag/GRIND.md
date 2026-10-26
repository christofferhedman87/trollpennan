# GRIND — Blockserie F (`F1`–`F3`): Intro, Pennans bok & Uppdrag i Slime Rancher-känsla (`375×812`)

## 1. Obligatoriska färdigheter (måste läsas av Grok Build före start)
- `child-literacy-design`
- `3d-web-game-check`
- `stylized-3d-art-direction`
- `typescript-best-practices`

## 2. Underlag som ligger klara på disk (läs före kodning)
1. **Stilguide (Avsnitt 8.1–8.4 inkl. Slime Rancher-känsla):** `/workspace/trollpennan-nulage/stilguide.md`
2. **Kodspaning (Rotorsaker, radnummer & Slime Rancher-kod i avsnitt 1–6):** `/workspace/kod-inkorg/F1-F6/spaning.md`
3. **Modellspaning (3D-Trollpenna, stjärneffekt & `slimeStuds`):** `/workspace/modell-inkorg/_blockserie-f/BLOCKSERIE-F.md`
4. **Serieplan:** `docs/blockserie-f-2026-10-26.md` och `docs/blockserie-s-slime-rancher.md`
5. **Slime Rancher-förstudien (GRÖN framtidssäkring mot Blockserie S — 0 rader i `F1`–`F5` skrivs om i `S1`–`S5`):**
   - `/workspace/slime-rancher-studie/art-och-story.md` (och `/workspace/trollpennan-nulage/stilguide.md` avsnitt 9)
   - `/workspace/slime-rancher-studie/teknik-och-loop.md` (Avsnitt 1: de 5 bakåtkompatibla S-krokarna i `F1`–`F5`)
   - `/workspace/slime-rancher-studie/modeller-och-uttryck.md` (och `/workspace/modell-inkorg/_blockserie-s/`)

---

## 3. Låsta Critiquito-mått på `375×812` (Grindkrav)

### Runda F1 — Slime Rancher-intro, Ren startäng, Första skapelse-läge & 1:a stjärnan
1. **HUD under introt (`saga === true`):**
   - `0` synliga element ur `.topp-hud`, `.botten-nav` eller `.sidomeny` (`display: none` eller ej monterade).
   - Endast 2 toppknappar under introt: `🔊 Hör pennan` (`x = 12..156, y = 12..56, height ≥ 44 px`) och `Hoppa över` (`data-testid="intro-hoppa"`, `x = 235..363, y = 12..56, height ≥ 44 px`), med `gap ≥ 24 px` (`0 px` överlapp).
2. **Luftig 3D-sikt & Svävande intro-bubbla (Slime Rancher-diorama):**
   - `≥ 70 %` av skärmytan (`375×812`) är helt fri 3D-äng utan UI-täckning under introt.
   - Intro-pratbubblan svävar i nedre delen (`y = 540..732 px`, `border-radius ≥ 22 px`, varm pergamentbotten `#FFF6E5` med `0 5px 0 #E4CFA4`) så att 3D-djuret ploppar fram rakt ovanför bubblan (`y ≈ 230..450 px`).
   - Dagsljus från ruta 1: `natt = 0` i `src/spel/ang/ljus.tsx` (ingen mörk natthimmel `0x0e0b22` under introt).
3. **Ostörd 3-stegs berättarröst (`18,704 s`, 0 nya TTS!) & Visuell ord-till-liv (`K-A-N-I-N`):**
   - Använder befintliga `/ljud/rost/d2ae27a14447d446.mp3` (`18,704 s`) i 3 naturliga steg (`0–5,10 s`, `5,74–13,20 s`, `13,80–18,704 s`) med tydlig knapp **`"Nästa ▸"`** (`data-testid="intro-nasta"`, `height ≥ 48 px`). Behåll `V7A_LANGD`, `data-testid="intro-text"` och `data-testid="intro-hoppa"` för `src/test/v7a-intro.test.ts`.
   - Under steg 2 (`K – A – N – I – N`) sveper 3D-Trollpennan (`public/models/bulk/f-trollpenna-magisk-cc0.glb`) i 3D-scenen och tänder 5 gyllene bokstavsbrickor (`K`, `A`, `N`, `I`, `N`, `≥ 44×48 px` i `y = 260..340 px`) som smälter ihop i en stjärnpuff (`public/models/bulk/f-magisk-stjarna-effekt-cc0.glb`) varpå `SagaKanin` ploppar fram vaken och glad (`0` `💤`-ikoner) med `ljud.plopp()` + `ljud.boing()`.
4. **Slime Rancher *squash-and-stretch* & Kristallklar övre 3D-halva i Första skapelse-läget:**
   - Volymbevarande `slimeStuds` (`sxz = 1 / Math.sqrt(sy)`, bottenpivot `y = 0` så fötter aldrig sjunker `< 0`, nollställd när `window.__PAUSE_ANIM === true`) och 3–4 svävande stjärnkloner ur `f-magisk-stjarna-effekt-cc0.glb` i `src/spel/ang/saga.tsx` och `src/spel/ang/djur.tsx`.
   - `SagaKanin` står kvar och studsar i övre skärmhalvan (`y = 0..366 px`, landning vid `(0.0, 0.35, -0.35)`) även i `fas === 5` och när `Pennans bok` öppnas i Första skapelse-läget (`egnaDjur === 0`).
   - **`0 %` mörk scrim/blur ovanför boken** i `y = 0..366 px` (`backdrop-filter: none`, genomskinlig övre vy).
   - `.bok.forsta-skapelse { max-height: 55dvh; height: auto; }` (`height ≤ 446 px`, `top ≥ 366 px` på `375×812`), medan `.bok{max-height:66dvh` i `src/spel/ui/bok-p1.css` bevaras för `src/spel/v3.test.ts`.
   - Första skapelse-läget visar `🃏 Ordkort` förvalt (`0` synligt tangentbord), `6–8` startdjurkort (`height ≥ 52 px`) och **ingen** `"0 av 337 djur"`-text.
5. **Ren startäng & 1:a stjärnan vid ordkort:**
   - Streckade `SpokHus`-lådan och `<Hanglas />` döljs på startängen när platserna är öppna (behåll `<group name="grind">` och `data/placering.json` för `src/spel/p3a.test.ts`).
   - Barnets första unika djur (`forstaUnika === true` & `arDjur === true`) ger alltid `★ 1` i `src/spel/useBelona.ts` även när det skapas med ordkort (`anvandeOrdkort === true`).

### Runda F2 — `Pennans bok` med Slime Rancher Juicy UI, `0 px` överlapp & `valUrText`-byggare
1. **Exklusiv lägesväxlare (`🃏 Ordkort` vs `⌨️ Stava själv`):**
   - Segmenterad lägesväxlare med både ikon och svensk etikett (`height ≥ 44 px`, `width ≥ 140 px`, ersätter den oetiketterade `38×38 px` penn-cirkeln).
   - **Aldrig** `.ord-kort` och `.tangenter` synliga samtidigt (`!(ordkortSynliga && tangenterSynliga)`).
   - I `🃏 Ordkort`-läge: `ordkort.bottom <= skrivRemsa.top - 8` (`0 px` överlapp) och minst 2 rader ordkort (`≥ 6` kort) synliga utan scroll.
   - I `⌨️ Stava själv`-läge: `skrivRemsa.bottom <= tangenter.top - 4` (`0 px` överlapp).
2. **Smal 1-radig uppdragsremsa i boken (`≤ 40 px`) & ingen dubblett-gåta:**
   - Aktivt uppdrag inuti boken visas som en kompakt 1-radig remsa (`height ≤ 42 px`) med `🔊`-knapp (`≥ 44×44 px` träffyta) och `flex-wrap: wrap` på idé-chips (`chip.right <= 363 px`).
   - Dubblett-gåtraden (`Ledtradsyta kompakt`) i skrivfliken och `Dölj gåtan`-knappen inuti `❓ Gåta`-fliken är borttagna (`❓ Gåta`-flikens gåtkort `≤ 165 px`).
3. **Alla tryckytor `≥ 44 px` & Slime Rancher Juicy UI:**
   - Bokflikar (`✍️ Skriv`, `❓ Gåta`, `💡 Idéer`), kategoriflikar (`Djur`, `Färg`, `Storlek`, `Gör`, `Har`) och `mellanslag`-tangenten har `height ≥ 44 px`.
   - Kuddknappar och kort har `border-radius: 18–24 px`, `0 4px 0` 3D-läpp, `@keyframes bok-pop-in` och `cubic-bezier(0.34, 1.56, 0.64, 1)`-fjädring (`:active` `translateY(3px) scale(0.96, 0.94)`).
4. **Ordkorts-byggare för `"en <djur> med …"`:**
   - Klick på idé-chipet `"en kanin med …"` (eller `"en katt med …"`) sätter både djurvalet via `valUrText(fras)` och byter aktiv ordkortsflik till `"tillbehor"` (`Har`).
   - Efterföljande klick på ordkortet `"halsduk"` eller `"mössa"` ger `"en kanin med halsduk"` / `"en katt med mössa"` — djurordet raderas aldrig!

### Runda F3 — Dynamiskt Bengtsson-uppdrag, Enhetlig Uppdragsvy & Gåvokort
1. **Dynamiskt första Bengtsson-uppdrag (`kanin-fryser`) med befintligt ljud (0 nya TTS):**
   - `uppdragText(u)` och `uppdragKlart(u)` i `src/spel/aventyr.ts` samt `ideRad(u)` i `src/spel/ideRad.ts` ersätter `"kanin"`/`"kaninen"` med barnets faktiska första djur på ängen (`ang[0]?.kropp`, t.ex. `"katt"` → *"Det verkar som att din katt fryser..."* och idé-chips `["en katt med halsduk", "en katt med mössa", "en varm filt", "en sol"]`). Behåll råsträngen `SKRIV[0]!.text_bengtsson` i `data/bengtsson.json` oförändrad för `src/spel/uppdragsmotor.test.ts`!
   - Spelar upp befintlig djurneutral röst `/ljud/rost/a2a025a1c8d070b1.mp3` (start) och `/ljud/rost/d9eb3f54f84c6cad.mp3` (klart) när djuret inte är kanin.
   - `krav.ord` för `kanin-fryser` i `data/bengtsson.json` utökas med `"sol"`, `"solen"`, `"solsken"`, `"värme"`, `"luva"`, `"toppluva"`, `"vintermössa"`.
   - När ett Bengtsson-uppdrag klaras visas en glad tack-bubbla i `4,5 s` och `uppdrag_klart`-rösten spelas upp (får aldrig tystas av `guldord`).
2. **Enhetlig Uppdragsvy & Gåvokort ur `data/gavor.json`:**
   - Både bottenknappen `📋 Uppdrag`, `☰ -> Uppdrag` och klick på 3D-Bengtsson öppnar samma fokuserade Uppdragsvy med en primärknapp **`✍️ Lös i boken`** (`data-testid="uppdrag-los-i-boken"`, `height ≥ 48 px`).
   - Pratbubblan ovanför djur har `≥ 44×44 px` tryckyta och öppnar `Pennans bok` i gåvoläge (`gavaTill !== null`) där ordkorten visar gåvokort ur `data/gavor.json` (`äpple`, `morot`, `vatten`, `kudde`, `filt` m.fl. — `0` djurkort som `kanin`/`katt`).

---

## 4. Verifieringskommandon (måste vara 100 % gröna före commit)
```bash
npx tsc --noEmit
npm test
npx vite build
node rundor/F1-F3-intro-bok-uppdrag/prov-f1-f3.mjs
```
