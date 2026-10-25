# Blockserie V (V1–V9b): Världskarta, Verktyg & Barnupplevelse

**Datum:** 2026-10-25  
**Bas på `main`:** `608b700` (PR #204 `V1` mergad ovanpå `83bf89a` #203, 419/419 gröna prov, en enda 3D-renderväg i R3F, `Spel.tsx` 49 rader)  
**Underlag:**
1. Granskningschefens oberoende granskning (`/workspace/granskning/2026-10-25/rapport.md` samt delrapporterna `barnpanelen.md`, `pedagogen.md`, `ux.md`, `speltestaren.md`, `foraldern.md`).
2. Christoffers direktiv (`[t196u]`, 2026-10-25): *"Inkludera även önskemål från mig; Kartan måste göra mycket mer visuellt vackert och mer pedagogiskt. Den ska väcka känslan av att vilja utforska hela spelet."*
3. Kvarvarande punkter från förra serien (`P3a` krav 2–4: småsaker ≥ 40 px på skärmen, nyaste byggnad längst fram i zonen, sjukhuset ≤ 10 % skymt; samt `P3b-2`: positiv Z-/fram-förskjutning på `kropp`-gruppen i `data/plagg.json` så att tröjan syns tydligt på blockiga djur som katt).

---

## 1. Fysiska specialistunderlag på disk samt hårda arkitektur- och grindregler (`build-round-gate`)

### A. Fysiska specialistfiler på disk (Grindpunkt 2, 3 & 7)
Samtliga fyra specialistbotar har levererat fysiska underlag på disk som styr `V1`–`V9b`:
1. **Kodspanaren (`build-round-gate` punkt 2):** `/workspace/kod-inkorg/V4-V9/spaning.md`
   - **0 nya npm-beroenden och 0 externa ordlistor:** Folkets lexikon (LGPL/CC BY-SA) och WikDict (CC BY-SA) avvisas av licensskäl; `data/ord.json` och `formelAv()` i `src/tolk/tolka.ts` (r. 1007) har redan färdig neutrumböjning (`bojning: { u, n, pl }`) för alla 21 färger, 6 storlekar och 11 egenskaper så fort t-orden märks med `genus: "n"`.
   - **Rotorsak till att `"kniv"` slank igenom (`V4`):** `if (arOrdform(t)) continue;` i `src/tolk/sparr.ts` r. 58 släppte igenom alla ord i `data/entiteter.json`.
   - **Svensk fonetik (`V5`):** ~25 rader `ljudStam(s)` i `src/tolk/avstand.ts` för tje-/sje-/j-ljud (`tj/kj/k+mjuk vokal -> K`, `skj/stj/sch/sj/sh/sk+mjuk vokal -> S`, `hj/lj/dj/gj/j/g+mjuk vokal -> J`, `ck -> k`) + `typ: "ljud"` i `src/spel/lasniva.ts` efter `omkastad` men före `allman`.
   - **Rotorsak till röd `"ERROR"`-skylt (`V6`):** Bilden `/npc/bengtsson/automat.webp` i `src/spel/ui/NpcFigur.tsx` när `mine === "automat"`.
   - **Rotorsak till seg start & färdiga R3F-hjälpare (`V9b`):** Toppnivå-loopar kör `useGLTF.preload` synkront för 56 GLB-filer vid sidstart (29 i `ByggModell.tsx`, 19 i `kenneyNatur.tsx`, 8 i `gltfDjur.tsx`). Redan installerade `@react-three/drei@10.7.9` och `three-mesh-bvh@0.8.3` ger `<PerformanceMonitor />`, `<AdaptiveDpr />`, `<AdaptiveEvents />` och `<Bvh firstHitOnly />`.
2. **Game Art Director (`stylized-3d-art-direction` & `build-round-gate` punkt 7):** `/workspace/trollpennan-nulage/stilguide.md`
   - Låst 10-färgspalett (`Ink #3B2F2F`, `Cream #FFF6E5`, `Paper #F6E7C8`, **`Solkorn #F2B632` som reserverad interaktiv accent**, `Hallon #C93A5A`, `Ängsgrön #7DCE6A`, `Himmelblå #7EC8F2`, `Skogsmossa #5E8A6A`, `Grottlila #6B4C9A`, `Stugteglet #D8433E`, `Fönsterglöd #FFE082`), matta leksaksytor (`roughness 0.65–0.90`, `metalness ≤ 0.15`), varmt solljus (`#FFE9C4` styrka `3.0` från `[3,6,5]`) och fokusbudget på `375×812`.
3. **Modellspanaren (`build-round-gate` punkt 2 & 3):** `/workspace/modell-inkorg/_blockserie-v/manifest-utkast.tsv` + `/workspace/modell-inkorg/_blockserie-v/BLOCKSERIE-V.md` (samt `/workspace/modell-inkorg/trollpennan-folk-m17/LICENSE.txt` och `/workspace/modell-inkorg/_garden-1/manifest-utkast.tsv`)
   - **För `V6` (Doktor Bengtsson i 3D, CC0 1.0):** `v6-doktor-bengtsson-blocky.glb` (468 tri, 155,7 KB, 27 animationer, med 3D-vågigt ljusbrunt hår, svarta rektangulära 3D-glasögon, 3D-stetoskop, färgrik skjorta och grön/blå penna i bröstfickan, kopierad till `public/models/bulk/bengtsson.glb` och `public/models/folk/v6-doktor-bengtsson-blocky.glb`) samt `v6-doktor-bengtsson-vitrock-blocky.glb` (468 tri, 155,8 KB, vit läkarrock, i `public/models/folk/v6-doktor-bengtsson-vitrock-blocky.glb`). Aldrig proceduella box-primitiver!
   - **För `V7b` (Gårdens hus med 3 fönster och separata material `Walls`, `Roof`, `Trim`, `Windows`, CC0 1.0):** `v7-hus-tre-fonster-kenney-suburban.glb` (1 510 tri), `v7-hus-modular-tre-fonster-kenney.glb` (648 tri), `v7-hus-fantasy-quaternius-fix.glb` (6 094 tri), `v7-lada-hus-quaternius-tre-fonster.glb` (2 512 tri) och `v7-fonster-modul-kenney.glb` (52 tri) i `/workspace/modell-inkorg/_blockserie-v/`.
4. **Critiquito (`build-round-gate` punkt 7 & `3d-web-game-check`):** De 5 skarpa designkraven på `375×812` utifrån `/workspace/granskning/2026-10-25/rapport.md`:
   - **Krav 1 (`V3`):** Halvhöjds skrivfönster (`top ≥ 250 px`, max 55–60 % av höjden), 3 flikar med ikon + etikett, ordkort synliga ovanför `Väck!` utan skroll, töm inmatningsrutan efter `Väck!`.
   - **Krav 2 (`V6`):** Högst 1 aktiv pratbubbla åt gången, fri mittyta (`y: 140..640`), djurbubblor klämda inom skärmen, bort med engelsk `ERROR`-skylt.
   - **Krav 3 (`V2`):** Bildikoner på menyrader, minst `48×48 px` tryckyta och `12 px` mellanrum i menyn, statusraden `"Stallet är tomt."` får inte se ut som en knapp, konsekventa namn (`Skriv`, `Uppdrag`), `Börja om` i `För vuxna` och fasta `×`-stängkryss (`≥ 44×44 px`).
   - **Krav 4 (`V1` & `V7b`):** Ärlig kartstatus med `🔊 Lyssna` och `×`, noll överlappning i Byggboken och inga avklippta flikar vid `x: 375`.
   - **Krav 5 (`V4`, `V5`, `V6`, `V7b`):** 100 % överensstämmelse mellan text och 3D-hus på Gården, alltid stor begynnelsebokstav i meningsstart i pratbubblor (`"Klart! Ett rött hus..."`), minst `18 px` (`1.4` radhöjd, kontrast `≥ 7:1`) i pratbubblor och minst `33×44 px` bokstavstangenter med `ABC/abc`-växlare.

### B. Hårda arkitektur- och grindregler för hela V-serien
1. **En sammanhållen mekanism per runda och kalibrering före placeringsregel (Grindpunkt 6 & 10):**
   - Varje runda löser **ett** sammanhållet problemområde i ≤ 6–7 kodfiler (aldrig två orelaterade mål i samma runda, aldrig placerings-/siktlösare blandat med annat, och kalibreringsskript på disk före placeringsregel).
   - Därför är de sena rundorna uppdelade i **`V7a`** (Intro), **`V7b`** (Gårdens byggsystem & CC0-hus), **`V8a`** (Rika skapelser utan tyst radering), **`V8b`** (Dedikerad placerings- och siktlösarrunda med kalibreringsskript först), **`V9a`** (Album, Ordbok & Stjärnruta) och **`V9b`** (Mobilprestanda & mjuk offline-reserv).
   - Turbudget beräknas som `~8 modellanrop per filändring + 10 för prov och RUNDA.md`, med ett hårt tak på **65–70 turer** per runda.
2. **Ingen TTS-generering (0 nya `.mp3`-filer):**
   - Inga anrop till ElevenLabs får göras. Alla `🔊 Lyssna`-knappar och röstpekare återanvänder befintliga ljudfiler i `public/ljud/rost/` via `rostKo.lasUpp(text)` och `data/rost-manifest.json`.
3. **Filstorlek och komposition (`check-spel-struktur.mjs`):**
   - `src/spel/Spel.tsx` (49 rader) hålls helt orörd.
   - Varje ny eller ändrad kodfil hålls **≤ 400 rader**.
   - JSX-attributen `data-testid` i `src/spel/**/*.tsx` måste matcha `rundor/R1-dela-spel/testid-baslinje.json` (174 unika nycklar, 179 förekomster). Nya testankare i V-serien sätts med `data-v1`, `data-v2`, `data-v3` osv.
4. **0 ändrade befintliga testfiler & 0 `.patch`-filer (Grindpunkt 11 och 13):**
   - Samtliga befintliga produktprov (`npm run test:product`) ska passera oförändrade, och varje runda lägger till ett eget enhetsprov samt verifieras visuellt i `375×812` med Playwright.

---

## 2. Spårbarhetsmatris: Alla 12 granskningsfynd + Christoffers Världskarta + P3a/P3b

| Källa / Fynd i `rapport.md` | Prioritet & Roller | Lösning i V-serien | Runda |
|---|---|---|---|
| **Christoffers önskemål (`[t196u]`) + Fynd 3 + Critiquito krav 4:** Kartan måste göras mycket mer visuellt vacker och mer pedagogisk, väcka känslan av att vilja utforska hela spelet, ha ärlig text om att platserna är öppna och ha tydlig stängknapp (`×`). | **Prio 1** (Christoffer + Alla 5 roller) | Sammanhängande illustrerad sagokarta över alla 5 platser (**Ängen**, **Gården**, **Skogen**, **Sjön**, **Grottan**) enligt `stilguide.md` med vandringsstig, SVG-landskap, *"📍 Här är du nu"*, 3 pedagogiska ord+bild-brickor per plats, besöksstjärnor, `🔊 Lyssna` per plats och tydlig `×`-stängknapp (`≥ 44×44 px`). | **V1** *(mergad #204 `608b700`)* |
| **Fynd 2 + Fynd 11 + Critiquito krav 3:** Fem olika "böcker", motstridiga namn på knappar, meny med 10 textrader utan ikoner, statusraden *"Stallet är tomt."* ser ut som en knapp, aktivt uppdrag saknas i Uppdragsboken och *"Börja om"* ligger oskyddat i barnmenyn. | **Prio 2** (Alla 5 roller) | Konsekventa namn (`✍️ Skriv` via `visa_text`, `📋 Uppdrag` överallt), bildikoner på varje menyrad med `min-height: 48px` och `gap: 12px`, statusraden *"Stallet är tomt."* stylad som informationskort (ej knapp), Bengtssons aktiva uppdrag överst i Uppdragsboken med `🔊 Lyssna`, direkt `🔊 Ljud: På/Av`-knapp och *"Börja om"* flyttat in bakom vuxenlåset i `ForalderDialog.tsx`. | **V2** |
| **Fynd 1 + Fynd 6 (del 1) + Critiquito krav 1:** Skrivfönstret täcker 3D-världen och trycker bort ordkorten (`y = 881 px`), avklippta idéknappar (`...`) och gammal text kvar i skrivrutan efter `Väck!`. | **Prio 3** (Alla 5 roller) | Luftigt halvhöjds-sheet (`top ≥ 250–280 px` på `375×812`) som visar 3D-världen ovanför, 3 flikar (`✍️ Skriv & ordkort` förvald med `≥ 4` synliga ordkort ovanför skrivrutan utan skroll, `🧩 Gåta`, `💡 Idéer` med fullbreddsknappar utan `...`) och tömd skrivruta efter `Väck!`. | **V3** |
| **Fynd 5 + Critiquito krav 5:** Språkfel i pratbubblor (*"en träd"*, *"en röd hus"*, *"1 stjärnor"*, liten bokstav i *"Klart! ett rött hus..."*), felstavade ordägg som läses upp högt och `kniv`/`pistol` slinker igenom. | **Prio 4** (Alla 5 roller) | Neutrum-kongruens (`"ett träd"`, `"ett rött hus"`, `"ett stort slott"`), stor begynnelsebokstav i meningsstart i pratbubblor (`"Klart! Ett rött hus..."`), singular `"1 stjärna"`, utökad `blocklist.json` + fix av `sparr.ts` r. 58 (`kniv`, `pistol`, `gevär`, `bomb`, `blod` spärras medan `smörkniv`/`vattenpistol` tillåts) och stopp för Web Speech-uppläsning av okända ordägg. | **V4** |
| **Fynd 6 (del 2) + Critiquito krav 5:** Smala bokstavstangenter (`27×42 px`) på mobilen, svaga fonetiska stavningsförslag (`"tjykling"`, `"en röd kat"`) och ledtråd som ger bort hela svaret. | **Prio 5** (Alla 5 roller) | Bredare mobiltangenter (`≥ 33×44 px` på `375×812`) med `ABC/abc`-skiftknapp, fonetisk stavningshjälp via `ljudStam` (`"tjykling" → "kyckling"`, ord-i-fras `"en röd kat" → "en röd katt"`) och Steg 3 med maskerad sista stavelse + bevarat tangentbord. | **V5** |
| **Fynd 4 + Critiquito krav 2 & 5:** Staplade pratbubblor, platt 2D-figur för Bengtsson, engelsk `"ERROR"`-skylt (`automat.webp`) och felplacerade pratbubblor. | **Prio 6** (Alla 5 roller) | Högst 1 pratbubbla åt gången (klämd inom `375×812`, `≥ 18 px`, kontrast `≥ 7:1`), `automat.webp` borttagen + 3D-stjärnpuff som reserv enligt `stilguide.md`, och Bengtsson i 3D på ängen via Modellspanarens CC0 GLB (`v6-doktor-bengtsson-blocky.glb` / `bengtsson.glb`) + rund porträttmedaljong med guldkant (`#F2B632`). | **V6** |
| **Fynd 7:** Introt är passivt i 24 s, startar tyst på mobil, läcker tryck till bakgrunden och ger bort första ordet gratis. | **Prio 7a** (4 av 5 roller) | Kort 8 s-intro i 3 rappa steg med ljudupplåsning i samma pek-gest, `Hoppa över ⏭` (`≥ 44×44 px`), full pointer-isolering (`stopPropagation`) och avslutning som öppnar `Skriv` utan gratis djur. | **V7a** |
| **Fynd 8 + Critiquito krav 4 & 5:** Byggandet på Gården sker utan att barnet skriver, visar fel hus på gårdsplanen (*"ett rött hus med tre fönster"* blir litet blått hus utan fönster) och Byggbokens knappar täcker varandra. | **Prio 7b** (Alla 5 roller) | Skrivbyggande på Gården + Modellspanarens CC0-husmodeller med 3 tydliga 3D-fönster (`Window_1..3`) och separata `Walls`/`Roof`/`Trim`/`Windows`-material (`/workspace/modell-inkorg/_blockserie-v/manifest-utkast.tsv`) + Byggbok utan knappöverlapp. | **V7b** |
| **Fynd 10:** Skapelser raderas i smyg vid 10 objekt, `"tio katter"` ger bara 6, `"en katt och en hund"` tappar katten och frysande kanin får inte mössan. | **Prio 8a** (3 av 5 roller) | Höjt ängstak (16 enheter) med vänlig påminnelse i stället för tyst radering, antal upp till 10 (`"tio katter"`), stöd för två djur med `"och"` och mössa fäst på frysande kanin vid önskan. | **V8a** |
| **P3a krav 2–4 + P3b-2 (Grindpunkt 6 & 10):** Småsaker (`puck`, `kopp`) `< 40 px`, nyaste byggnad ej längst fram, sjukhuset `> 10 %` skymt och `troja` inne i kattens kropp. | **Prio 8b** (Slutkontroll) | Dedikerad placerings- och siktlösarrunda med kalibreringsskript på disk först: småsaker `≥ 40 px`, nyaste byggnad längst fram (`z_ny >= max(z_aldre) - 0.3`), sjukhuset `≤ 10 %` skymt och `troja` fram-förskjuten i Z. | **V8b** |
| **Fynd 9:** Album utan bilder, Ordbok med 389 `???` och Stjärnruta med lång vuxentext utan ljud. | **Prio 9a** (4 av 5 roller) | Visuella miniatyrer i Albumet, upptäckar-Ordbok som öppnar *"Mina hittade ord"* först med bild + `🔊 Lyssna` (utan 389 `???`) och barnvänlig Stjärnruta med `🔊 Lyssna`. | **V9a** |
| **Fynd 12 + Kodspanarens fynd:** Seg start (56 synkrona GLB-preloads) och låg FPS på enklare mobiler samt avbrott vid svajigt nät. | **Prio 9b** (3 av 5 roller) | `PerformanceMonitor`, `AdaptiveDpr`, `AdaptiveEvents` och `Bvh firstHitOnly` i `angen3d.tsx` + `requestIdleCallback`-kö för `ByggModell`/`gltfDjur`-preload enligt `/workspace/kod-inkorg/V4-V9/spaning.md` samt mjuk offline-reserv. | **V9b** |

---

## 3. Detaljerad plan runda för runda (`V1`–`V9b`)

### Runda V1: Visuell & pedagogisk Världskarta som väcker upptäckarlust *(Mergad som PR #204, `608b700`)*
- **Löser:** Christoffers önskemål (`[t196u]`) + Fynd 3 i `rapport.md` + Critiquito krav 4 + `stilguide.md`.
- **Levererat i PR #204 (`608b700`):** Sammanhängande sagokarta på varmt pergament (`#FFF6E5`→`#F6E7C8`) med vandringsstig, 5 unika SVG-landskap (**Ängen**, **Gården**, **Skogen**, **Sjön**, **Grottan**), *"📍 Här är du nu"*, 15 pedagogiska ord+bild-brickor, ärlig kartstatus, `🔊 Lyssna` (`102×44 px`) och `×`-stängknapp (`44×44 px`).

### Runda V2: Samlade menyer med bildikoner, konsekventa namn, aktivt uppdrag i Uppdragsboken & trygg barnmeny
- **Löser:** Fynd 2 + Fynd 11 i `rapport.md` + Critiquito krav 3 + `stilguide.md`.
- **Mål & mekanism:**
  1. **Konsekventa namn mellan pratbubbla, HUD och meny:** `pennans-bok` visar `✍️ Skriv` (undertitel `Pennans bok`), `Coach.tsx` visar `visa_text` (*"Tryck på Skriv..."*) medan `rostKo` spelar `steg.text`, och Uppdragsboken heter `📋 Uppdrag` överallt.
  2. **Bildikoner, tryckytor `≥ 48×48 px`, `12 px` mellanrum & statusrad som informationskort (Critiquito krav 3):** Varje synlig menyrad har bildikon (`data-v2="meny-ikon"`), `min-height: 48px` och `gap: 12px` i menyradernas behållare. Statusraden `"Stallet är tomt."` stylas som ett mjukt informationskort (`#FFF6E5`, kursiv text, `cursor: default`, ingen knappram) så den aldrig ser ut som en knapp. Direkt `🔊 Ljud: På/Av`-knapp (`data-v2="meny-ljud"`).
  3. **Bengtssons aktiva uppdrag överst i Uppdragsboken (`data-v2="aktivt-uppdrag-kort"`) med `🔊 Lyssna` (`≥ 44×44 px`).**
  4. **"Börja om" bakom vuxenlåset i `ForalderDialog.tsx` + ren rubrik `"För vuxna"`.**
- **Berörda filer (8 filer + 1 ny testfil):** `data/meny.json`, `data/forsta-stunden.json`, `src/spel/ui/Hud.tsx`, `src/spel/ui/Coach.tsx`, `src/spel/ui/ForalderDialog.tsx`, `src/spel/ui/BokSkarm.tsx`, `src/spel/ui/SpelVy.tsx`, `src/spel/ui/hud-p2.css`, `src/spel/v2.test.ts` (ny).
- **Turbudget:** 52 turer (tak 65).

### Runda V3: Luftigt skrivfönster i halvhöjd med 3 flikar, synliga ordkort direkt på `375×812` & tömd skrivruta
- **Löser:** Fynd 1 + Fynd 6 (del 1) i `rapport.md` + Critiquito krav 1 + `stilguide.md`.
- **Mål & mekanism:**
  1. **Skrivfönstret i halvhöjd (`top ≥ 280 px` på `375×812`, Critiquito krav `top ≥ 250 px`)** i varm pergamentpalett (`#FFF6E5`/`#F6E7C8`) så att 3D-världen syns ovanför.
  2. **Tre tydliga flikar med ikon + etikett (`data-v3="skapar-vy-flikar"`, `min-height: 44px`, aktiv flik i `Solkorn #F2B632`):** `✍️ Skriv & ordkort` (förvald, `≥ 4` ordkort synliga ovanför skrivrutan utan skroll), `🧩 Gåta` och `💡 Idéer` (fullbreddsknappar med `white-space: normal`, aldrig `...`).
  3. **Skrivrutan töms rent efter `Väck!` och vid val av idé-chip.**
- **Berörda filer (4 filer + 1 ny testfil):** `src/spel/ui/BokSkarm.tsx`, `src/spel/ui/Ledtradsyta.tsx`, `src/spel/styr/useSkriv.ts`, `src/spel/ui/bok-p1.css`, `src/spel/v3.test.ts` (ny).
- **Turbudget:** 48 turer (tak 65).

### Runda V4: Svensk grammatik (`en`/`ett` & kongruens), stor meningsstart, trygg röst vid okända ord & utökad spärrlista
- **Löser:** Fynd 5 i `rapport.md` + Critiquito krav 5 + `/workspace/kod-inkorg/V4-V9/spaning.md`.
- **Mål & mekanism:**
  1. **Neutrum-kongruens i `src/tolk/lexikon.ts` och `src/tolk/tolka.ts`:** `NEUTRUM_ORD` (43 t-ord) ger `FOREMAL` `genus: "n"` och `nastaArSak` i `tolka.ts` returnerar `false` vid `n.o === ensamSak` så att `"ett träd"`, `"ett äppelträd"`, `"ett rött hus"`, `"ett stort slott"`, `"ett rymdskepp"`, `"ett svärd"` böjs rätt i både tolken och pratbubblor.
  2. **Stor begynnelsebokstav i meningsstart i pratbubblor/bannrar (Critiquito krav 5):** Hjälpare `storMeningsStart(text)` säkerställer att meningar efter `. ` / `! ` / `? ` alltid inleds med versal (`"Klart! Ett rött hus står på gården."`, aldrig `"Klart! ett rött hus..."`), samt singular `"1 stjärna"` vs `"2 stjärnor"`.
  3. **Spärrlista & fix av `sparr.ts` r. 58 + trygg röst vid okända ord:** Ändra `kniv.ord` till `["smörkniv"]`, ta bort `"kniv"` ur `orddelar.json` och `"äppelträd"` ur `kategori-ord.json`, lägg `TILLATNA_ORD = new Set(["smörkniv", "vattenpistol"])` i `sparr.ts`, utöka `data/blocklist.json` med vapen-/våldsord (`kniv`, `pistol`, `gevär`, `bomb`, `blod`, `döda`, `skjuta` m.fl.) och stoppa syntetisk Web Speech-uppläsning av okända ord i ordägg.
- **Berörda filer (8 kod-/datafiler + 1 ny testfil):** `src/tolk/lexikon.ts`, `src/tolk/tolka.ts`, `src/tolk/sparr.ts`, `src/tolk/avstand.ts`, `data/blocklist.json`, `data/entiteter.json`, `data/orddelar.json`, `data/kategori-ord.json`, `src/spel/rost.ts`, `src/spel/texter.ts`, `src/spel/v4.test.ts` (ny).
- **Turbudget:** 52 turer (tak 65).

### Runda V5: Bredare mobiltangentbord (`≥ 33×44 px` + `ABC/abc`), fonetiska stavningsförslag & oförstörbar ledtrådstrappa
- **Löser:** Fynd 6 (del 2) i `rapport.md` + Critiquito krav 5 + `/workspace/kod-inkorg/V4-V9/spaning.md`.
- **Mål & mekanism:**
  1. **Mobiltangenter `≥ 33×44 px` på `375×812` + `ABC/abc`-skiftknapp (`data-v5="skift-knapp"`)** samt fullbredda idéknappar utan horisontellt utstick (`right ≤ 375`).
  2. **Fonetisk stavningsåterkoppling i `src/spel/lasniva.ts` (`typ: "ljud"`) & ord-i-fras-ersättning (`bytSistaOrdIFras`):** `"tjykling"` ger `"Menade du kyckling?"` och klick på `"katt"` vid `"en röd kat"` ger `"en röd katt"`.
  3. **Oförstörbar ledtrådstrappa & bevarat skärmtangentbord:** Maskerar sista stavelsen vid reserv-ledtråd i `ledtradsSteg` och håller tangentbordet + inmatningsfokus synligt när `BokSvar` visas.
- **Berörda filer (5 filer + 1 ny testfil):** `src/spel/lasniva.ts`, `src/spel/ui/BokSkarm.tsx`, `src/spel/ui/SkrivRemsa.tsx`, `src/spel/ui/BokSvar.tsx`, `src/spel/ui/bok-p1.css`, `src/spel/v5.test.ts` (ny).
- **Turbudget:** 50 turer (tak 65).

### Runda V6: Pratbubblor utan kollision, Doktor Bengtsson i 3D (CC0 GLB) & vänlig felhantering utan `"ERROR"`
- **Löser:** Fynd 4 i `rapport.md` + Critiquito krav 2 & 5 + `stilguide.md` + Modellspanarens CC0 GLB (`/workspace/modell-inkorg/_blockserie-v/manifest-utkast.tsv`).
- **Mål & mekanism:**
  1. **Högst 1 aktiv pratbubbla/banner åt gången, fri mittyta & klämd placering inom `375×812`:** `.slice(-1)` i `useBannrar.ts`, rensning vid nytt ord/platsbyte, dölj när `panel !== "spel"`, kläm djurbubblor till `left: 12..363 px`, `top: 56..700 px` med `font-size: 18px`, `line-height: 1.4` och kontrast `≥ 7:1` (`#3B2F2F` på `#FFF6E5`).
  2. **Bort med engelsk `"ERROR"`-skylt (`automat.webp`) & gyllene 3D-stjärnpuff som modellreserv:** Ersätt `automat.webp` i `NpcFigur.tsx` med `glad.webp` och låt `ModellGren` i `djur.tsx` visa en mjuk gyllene 3D-stjärnpuff (`#F2B632`, `emissive #FFE082`) vid sakfel.
  3. **Doktor Bengtsson i 3D med Modellspanarens CC0 GLB (`public/models/bulk/bengtsson.glb` / `public/models/folk/v6-doktor-bengtsson-blocky.glb` och `v6-doktor-bengtsson-vitrock-blocky.glb`):** Riktig 3D-modell på ängen i `src/spel/ang/Bengtsson3D.tsx` (med 3D-hår, 3D-glasögon, 3D-stetoskop och pennor i bröstfickan — aldrig proceduella boxar!) samt rund `48×48 px` porträttmedaljong med guldkant (`#F2B632`, `data-v6="bengtsson-medaljong"`).
- **Berörda filer (6 kodfiler + tillgångar + 1 ny testfil):** `src/spel/styr/useBannrar.ts`, `src/spel/ui/AngLager.tsx`, `src/spel/ui/NpcFigur.tsx`, `src/spel/ang/Bengtsson3D.tsx` (ny), `src/spel/ang/djur.tsx`, `src/spel/angen3d.tsx`, `public/models/bulk/bengtsson.glb`, `public/models/folk/v6-doktor-bengtsson-blocky.glb`, `public/models/folk/v6-doktor-bengtsson-vitrock-blocky.glb`, `data/tillgangar.json`, `LICENSES.md`, `CREDITS.md`, `src/spel/v6.test.ts` (ny).
- **Turbudget:** 55 turer (tak 70).

### Runda V7a: Kort, interaktivt intro med ljudupplåsning & noll tryckläckage (Grindpunkt 10 — eget mål)
- **Löser:** Fynd 7 i `rapport.md`.
- **Mål & mekanism:**
  1. **Kort 8 s-intro i 3 rappa steg (`Titel.tsx` & `data/intro.json`):** Stor `▶ Starta`-knapp som låser upp WebAudio i samma pek-gest (`pointerdown`/`click`) och spelar förinspelad berättarröst direkt på mobil.
  2. **Alltid synlig `Hoppa över ⏭`-knapp (`≥ 44×44 px`, `data-v7a="intro-hoppa-over"`)** i övre högra hörnet från första bildrutan.
  3. **Full pointer-isolering (`stopPropagation`) & interaktiv avslutning:** Inga tryck läcker igenom till 3D-ängen bakom under introt; när introt slutar öppnas `Skriv` (`BokSkarm`) direkt utan att ge bort första djuret gratis.
- **Berörda filer (4 filer + 1 ny testfil):** `src/spel/ui/Titel.tsx`, `src/spel/styr/useIntro.ts`, `data/intro.json`, `src/spel/ui/hud-p2.css`, `src/spel/v7a.test.ts` (ny).
- **Turbudget:** 45 turer (tak 65).

### Runda V7b: Gårdens byggsystem med skrivbyggande, Modellspanarens CC0-hus med 3 fönster & Byggbok utan överlapp
- **Löser:** Fynd 8 i `rapport.md` + Critiquito krav 4 & 5 + `stilguide.md` + Modellspanarens CC0-hus (`/workspace/modell-inkorg/_blockserie-v/manifest-utkast.tsv`).
- **Mål & mekanism:**
  1. **100 % visuell sanning för Gårdens 3D-hus via Modellspanarens CC0-modeller (`/workspace/modell-inkorg/_blockserie-v/`):**
     - Kopiera in `v7-hus-tre-fonster-kenney-suburban.glb`, `v7-hus-modular-tre-fonster-kenney.glb`, `v7-hus-fantasy-quaternius-fix.glb`, `v7-lada-hus-quaternius-tre-fonster.glb` och `v7-fonster-modul-kenney.glb` till `public/models/gard/` och registrera i `data/tillgangar.json` + `LICENSES.md`/`CREDITS.md`.
     - Uppdatera `egnaMaterial` / `ByggModell.tsx` enligt `/workspace/modell-inkorg/_blockserie-v/BLOCKSERIE-V.md`: färga `Walls`-materialet rent med `k.color.set(fargHex)` (så *"ett rött hus"* blir klarrött `#D8433E`/`#E53935` medan `Trim` `#FFFFFF` och `Windows` `#56B4E9` behåller full kontrast) och styr antalet synliga 3D-fönster (`Window_1..3`, `Window_Side` samt `v7-fonster-modul-kenney.glb`) efter `antalFonster`.
  2. **Skrivbyggande på Gården + stor bokstav i bekräftelsebubblan:** När barnet skriver eller väljer en byggmening på Gården (*"ett rött hus med tre fönster"*) byggs huset direkt på gårdsplanen och pratbubblan visar `"Klart! Ett rött hus med tre fönster står på gården."`.
  3. **Noll överlappning i Byggboken (Critiquito krav 4):** `🔊 Lyssna` och `Bygg!` läggs i en egen flex-rad (`gap: 8px`) och skrollistan får bottenmarginal (`padding-bottom: 96px`) så att inga kort eller flikar täcker varandra eller klipps vid `x: 375`.
- **Berörda filer (6 kod-/datafiler + CC0 GLB + 1 ny testfil):** `src/spel/gard/ByggModell.tsx`, `src/spel/gard/modellPrep.ts`, `src/spel/gard/Garden3D.tsx`, `data/gard-3d.json`, `src/spel/ui/BokSkarm.tsx`, `src/spel/ui/bok-p1.css`, `public/models/gard/v7-*.glb`, `data/tillgangar.json`, `LICENSES.md`, `CREDITS.md`, `src/spel/v7b.test.ts` (ny).
- **Turbudget:** 55 turer (tak 65).

### Runda V8a: Rika skapelser utan tyst radering, antal upp till 10, två djur med `"och"` & mössa på frysande djur
- **Löser:** Fynd 10 i `rapport.md` (helt separerat från placeringslösare enligt Grindpunkt 10).
- **Mål & mekanism:**
  1. **Ingen tyst radering på ängen:** Höj ängstaket från 10 till 16 enheter och visa en vänlig påminnelse när ängen är full i stället för att radera äldsta skapelsen i smyg.
  2. **Antal upp till 10 (`"tio katter"` → 10 katter):** Höj antalsgränsen i `src/tolk/tolka.ts` / `useSkapa.ts` från 6 till 10.
  3. **Sammansatta meningar med två djur (`"en katt och en hund"`):** `useSkapa.ts` skapar båda djuren när meningen innehåller två samordnade substantiv med `"och"`.
  4. **Klädesplagg fästs vid frys-önskan:** När barnet skriver `"en mössa"` eller `"en halsduk"` till ett frysande djur i `useOnska.ts` läggs plagget i djurets `tillbehor` så att det syns direkt på djuret i 3D.
- **Berörda filer (4 filer + 1 ny testfil):** `src/tolk/tolka.ts`, `src/spel/styr/useSkapa.ts`, `src/spel/styr/useOnska.ts`, `data/ang-regler.json`, `src/spel/v8a.test.ts` (ny).
- **Turbudget:** 50 turer (tak 65).

### Runda V8b: Dedikerad placerings- och siktlösarrunda med kalibreringsskript först (`P3a` krav 2–4 & `P3b-2`)
- **Löser:** Sparade 3D-mått från `P3a` (krav 2–4) och `P3b-2` i en egen ren placeringsrunda enligt Grindpunkt 6 och 10.
- **Mål & mekanism:**
  1. **Kalibreringsskript på disk först (Grindpunkt 6):** `rundor/V8b-placering-kalibrering/matt/kalibrera-v8b.mjs` mäter det exakta förhållandet mellan 3D-skala/Z-koordinat i `angen3d.tsx` och skärmpixlar på `375×812` innan dataändringen görs.
  2. **Småsaker `≥ 40 px` på `375×812` (`P3a` krav 2):** Justera skalan för småsaker (`puck`, `kopp` m.fl.) i `data/storlek.json` / `data/entiteter.json` utifrån kalibreringstabellen.
  3. **Nyaste byggnad längst fram (`z_ny >= max(z_aldre) - 0.3`, `P3a` krav 3) & sjukhuset `≤ 10 %` skymt (`P3a` krav 4):** Justera byggzon och trädplacering i `src/spel/placering.ts` och `data/placering.json`.
  4. **Synlig `troja` framifrån på blockiga djur (`P3b-2`):** Ge `kropp`-gruppen i `data/plagg.json` positiv `fram`-förskjutning / Z-skalning så att tröjan syns tydligt utanpå kattens bröstkorg.
- **Berörda filer (4 filer + kalibreringsskript + 1 ny testfil):** `data/storlek.json`, `data/placering.json`, `src/spel/placering.ts`, `data/plagg.json`, `src/spel/v8b.test.ts` (ny).
- **Turbudget:** 48 turer (tak 65).

### Runda V9a: Visuellt Album med miniatyrer, upptäckar-Ordbok & barnvänlig Stjärnruta med `🔊 Lyssna`
- **Löser:** Fynd 9 i `rapport.md` (separerat från 3D-prestanda enligt Grindpunkt 10).
- **Mål & mekanism:**
  1. **Album med riktiga visuella miniatyrer (`src/spel/samling.tsx`):** Sparade foton och djurkort visar en riktig visuell miniatyrbild / färgad djurikon med tillbehör i stället för tomma textkort.
  2. **Upptäckar-Ordbok (`src/spel/ui/OrdbokDialog.tsx`):** Öppnar fliken ***"Mina hittade ord"*** först med bildikon och `🔊 Lyssna` per ord, utan att visa en vägg av 389 `???`.
  3. **Barnvänlig Stjärnruta med `🔊 Lyssna` (`src/spel/ui/Dialoger.tsx`):** Kort, varm förklaring med stjärnikoner och `🔊 Lyssna`-knapp (`≥ 44×44 px`, 0 ny TTS).
- **Berörda filer (4 filer + 1 ny testfil):** `src/spel/samling.tsx`, `src/spel/ui/OrdbokDialog.tsx`, `src/spel/ui/Dialoger.tsx`, `src/spel/ui/hud-p2.css`, `src/spel/v9a.test.ts` (ny).
- **Turbudget:** 48 turer (tak 65).

### Runda V9b: Mobilprestanda (`PerformanceMonitor`, `AdaptiveDpr`, `Bvh`, `requestIdleCallback`-preload) & mjuk offline-reserv
- **Löser:** Fynd 12 i `rapport.md` + Kodspanarens fynd i `/workspace/kod-inkorg/V4-V9/spaning.md`.
- **Mål & mekanism:**
  1. **Slut på 56 synkrona GLB-preloads vid sidstart (`/workspace/kod-inkorg/V4-V9/spaning.md`):** Flytta toppnivå-looparna för `useGLTF.preload` i `src/spel/gard/ByggModell.tsx` (29 st) och `src/spel/gltfDjur.tsx` (8 st) till en `requestIdleCallback`-kö som startar först efter att `[data-testid="ladd-3d"][data-klar="ja"]` satts, samt on-demand vid platsbyte.
  2. **Inbyggda R3F-prestandahjälpare i `src/spel/angen3d.tsx`:** Aktivera redan installerade `<PerformanceMonitor flipflops={3} />`, `<AdaptiveDpr />`, `<AdaptiveEvents />` och `<Bvh firstHitOnly>` runt `<Scen />` så att enklare mobiler håller `≥ 30 FPS`.
  3. **Mjuk offline-/nätverksreserv:** Om en sen modell- eller ljudfil inte kan hämtas vid svajigt nät fortsätter spelet mjukt med lokal reservform / skärmtext utan krash eller felruta.
- **Berörda filer (4 filer + 1 ny testfil):** `src/spel/angen3d.tsx`, `src/spel/gard/ByggModell.tsx`, `src/spel/gltfDjur.tsx`, `src/spel/ang/kenneyNatur.tsx`, `src/spel/v9b.test.ts` (ny).
- **Turbudget:** 48 turer (tak 65).

---

## 4. Sammanfattande körordning och turbudget (`V1`–`V9b`)

| Ordning | Runda | Fokus (1 sammanhållen mekanism per runda) | Fynd / Krav | Beräknade turer | Turtak | Status |
|---|---|---|---|---|---|---|
| 1 | **V1** | Visuell & pedagogisk Världskarta som väcker upptäckarlust | Christoffers önskemål + Fynd 3 + Critiquito 4 | 63 (faktiskt) | 65 | **Mergad som PR #204 (`608b700`)** |
| 2 | **V2** | Bildikoner i menyn (`≥ 48px`, `gap 12px`), konsekventa namn, aktivt uppdrag & "Börja om" i För vuxna | Fynd 2 + Fynd 11 + Critiquito 3 | ~52 | 65 | **Beställd (`arkitekt/v1-v3-bestallning`)** |
| 3 | **V3** | Luftigt skrivfönster i halvhöjd med 3 flikar, synliga ordkort på `375×812` & tömd skrivruta | Fynd 1 + Fynd 6 (del 1) + Critiquito 1 | ~48 | 65 | **Beställd (`arkitekt/v1-v3-bestallning`)** |
| 4 | **V4** | Svensk grammatik (`en`/`ett` & kongruens), stor meningsstart, trygg röst & utökad spärrlista | Fynd 5 + Critiquito 5 | ~52 | 65 | **Beställd (`arkitekt/v4-v6-bestallning`)** |
| 5 | **V5** | Bredare mobiltangentbord (`≥ 33×44 px` + `ABC/abc`), fonetiska stavningsförslag & ledtrådstrappa | Fynd 6 (del 2) + Critiquito 5 | ~50 | 65 | **Beställd (`arkitekt/v4-v6-bestallning`)** |
| 6 | **V6** | Pratbubblor utan kollision, Doktor Bengtsson i 3D (CC0 GLB) & 3D-stjärnpuff utan `"ERROR"` | Fynd 4 + Critiquito 2 & 5 | ~55 | 70 | **Beställd (`arkitekt/v4-v6-bestallning`)** |
| 7 | **V7a** | Kort, interaktivt 8 s-intro med ljudupplåsning, `Hoppa över ⏭` & 0 tryckläckage | Fynd 7 | ~45 | 65 | Planerad i V-serien |
| 8 | **V7b** | Gårdens byggsystem med skrivbyggande, Modellspanarens CC0-hus med 3 fönster & Byggbok utan överlapp | Fynd 8 + Critiquito 4 & 5 | ~55 | 65 | Planerad i V-serien |
| 9 | **V8a** | Rika skapelser utan tyst radering (ängstak 16), antal ≤ 10, två djur med `"och"` & mössa på kanin | Fynd 10 | ~50 | 65 | Planerad i V-serien |
| 10 | **V8b** | Dedikerad placerings- och siktlösarrunda med kalibreringsskript först (`P3a` krav 2–4 + `P3b-2`) | P3a krav 2–4 + P3b-2 (Grind 6 & 10) | ~48 | 65 | Planerad i V-serien |
| 11 | **V9a** | Visuellt Album med miniatyrer, upptäckar-Ordbok (*"Mina hittade ord"*) & barnvänlig Stjärnruta med ljud | Fynd 9 | ~48 | 65 | Planerad i V-serien |
| 12 | **V9b** | Mobilprestanda (`PerformanceMonitor`, `AdaptiveDpr`, `Bvh`, `requestIdleCallback`-preload) & offline-reserv | Fynd 12 + Kodspanaren | ~48 | 65 | Planerad i V-serien |
