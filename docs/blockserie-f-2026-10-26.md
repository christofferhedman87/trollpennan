# Blockserie F (`F1`–`F5`) — Första minuterna, Slime Rancher-känsla & UX i världsklass (`375×812`)

**Datum:** 2026-10-26  
**Bas-commit:** `origin/main` (`2f17ee8`, PR #215 V9b mergad — hela Blockserie V klar)  
**Visuell & taktil målbild (HUR):** **Slime Rancher** (`https://slimeranchers.com/play/`) — solbelyst, levande 3D-diorama där söta djur studsar med mjuk, volymbevarande *squash-and-stretch* kring `y = 0`, blinkar nyfiket mot kameran, sprider svävande 3D-glädjestjärnor (`f-magisk-stjarna-effekt-cc0.glb`) och ger ifrån sig mjuka plopp-/djurljud medan startvyn och `Pennans bok` ligger över en kristallklar, oskymd 3D-äng (`0 %` mörk scrim/blur), kombinerat med rundade kuddknappar (`border-radius: 18–24 px`, `0 4px 0` 3D-bottenläpp) och fjädrande `cubic-bezier(0.34, 1.56, 0.64, 1)`-tryckrespons.  
**Funktionell målbild (VAD):** Åtgärdar samtliga **9 fynd** i Granskningschefens rapport (`/workspace/granskning/2026-10-26-forsta-minuterna/rapport.md`) på `375×812`.

---

## 1. Spårbarhet: Specialistunderlag på disk

1. **Granskningschefen (Fynd 1–9):** `/workspace/granskning/2026-10-26-forsta-minuterna/rapport.md`
2. **Kodspanaren (rotorsaker, radnummer, ljudfiler, test-invarianter & Slime Rancher-kod):** `/workspace/kod-inkorg/F1-F6/spaning.md`
3. **Game Art Director (Stilguide avsnitt 6, 7, 8.1–8.4 inkl. Slime Rancher squash-and-stretch & Juicy UI):** `/workspace/trollpennan-nulage/stilguide.md`
4. **Modellspanaren (8 nya CC0 1.0 `.glb`-modeller, fästkoordinater, 3D-Bengtsson & `slimeStuds`):** `/workspace/modell-inkorg/_blockserie-f/BLOCKSERIE-F.md`, `/workspace/modell-inkorg/_blockserie-f/manifest-utkast.tsv` och `public/models/bulk/f-*.glb`
5. **Critiquito (låsta acceptansmått på `375×812`):** Låsta i `GRIND.md`, `facit-f1-f3.json` och `facit-f4-f5.json`.

---

## 2. Spårbarhetsmatris: Granskningschefens 9 fynd → Runda `F1`–`F5`

| Fynd i `rapport.md` | Problem på `375×812` | Runda | Lösning (VAD + Slime Rancher HUR) |
|---|---|---|---|
| **Fynd 1 (P0)** | `Pennans bok` staplar `.ord-kort` och `.tangenter` samtidigt (`45–62 px` överlapp med `.remsa.skriv-remsa`), oetiketterad grön pennknapp och 149 px uppdragsruta. | **F1 & F2** | **F1:** Avskalat Första skapelse-läge (`max-height: 55dvh`, `≤ 446 px`, `0 %` mörk scrim ovanför) med `🃏 Ordkort` förvalt och tangentbordet infällt.<br>**F2:** Exklusiv segmenterad lägesväxlare **`🃏 Ordkort`** / **`⌨️ Stava själv`** (`≥ 44 px` hög, `≥ 140 px` bred), `0 px` överlapp (`ordkort.bottom <= skrivRemsa.top - 8 px`), 1-radig uppdragsremsa (`≤ 40 px`) och Slime Rancher Juicy UI (`border-radius: 18–24 px`, `0 4px 0` läpp, `cubic-bezier(0.34, 1.56, 0.64, 1)`). |
| **Fynd 2 (P0)** | Bengtssons 1:a uppdrag hårdkodar *"din kanin fryser"* även när barnet skapade katt/drake/hund; `"sol"` avvisas; `"en kanin med mössa"` visar ingen mössa; tack-replik hörs aldrig. | **F3 & F4** | **F3:** Dynamisk djurersättning i `uppdragText(u)`/`uppdragKlart(u)`/`ideRad(u)` utifrån `ang[0]?.kropp` (med befintlig djurneutral röst `/ljud/rost/a2a025a1c8d070b1.mp3` & `d9eb3f54f84c6cad.mp3`, 0 nya TTS!), `"sol"`/`"solen"`/`"solsken"`/`"värme"`/`"luva"` i `krav.ord`, samt tack-bubbla + röst när uppdraget klaras.<br>**F4:** Nya CC0-plagg (`f-mossa-vinter-cc0.glb`, `f-halsduk-cc0.glb`, `f-filt-draperad-cc0.glb`) med kalibrerade fästpunkter (`≥ 25 %` skärmsynlighet) och generellt djurstöd i `mossaKanin.ts`. |
| **Fynd 3 (P1)** | Introt klipper talet vid `7,5 s` mitt i *"Titta här: kå, a..."*, visar aldrig hur ord blir djur, har mörkt nattfilter och synlig HUD bakom. | **F1** | Fullt 3-stegs intro med befintliga `/ljud/rost/d2ae27a14447d446.mp3` (`18,704 s`, 0 nya TTS) + `"Nästa ▸"` (`data-testid="intro-nasta"`), 3D-Trollpenna (`f-trollpenna-magisk-cc0.glb`) som bokstaverar `K – A – N – I – N` i luften och trollar fram `SagaKanin` med Slime Rancher *squash-and-stretch*, glada plopp-ljud och `f-magisk-stjarna-effekt-cc0.glb`, `0` HUD-knappar under introt och varmt dagsljus från ruta 1. |
| **Fynd 4 (P1)** | 3 konkurrerande Bengtsson på Ängen (varav 3D-Bengtsson 53 % utanför vänsterkanten `x = -41..34 px`); klick på `"en kanin med …"` + ordkort `"halsduk"` raderar `"en kanin"` och ger `"med halsduk"`. | **F2 & F4** | **F2:** `fyllExempel` och `valjKort` i `useSkriv.ts` parsar befintlig fras med `valUrText(fras)` och byter flik till `"tillbehor"` (`Har`) vid `"med …"`, så `"en kanin med …"` + `"halsduk"` blir `"en kanin med halsduk"`.<br>**F4:** 3D-Bengtsson flyttas till `[-1.45, 0, 1.50]` (`x = 29.8..104.1 px` på `375×812`) med `96×146 px` hitbox, och den dubbla 2D-cirkeln tas bort. |
| **Fynd 5 (P1)** | Första djuret via ordkort ger `★ 0` stjärnor; `🏡 Gården` saknar tydlig hemknapp till Ängen; räknare spretar (`337` vs `340` vs `665`). | **F1 & F5** | **F1:** `useBelona.ts` ger alltid första stjärnan (`★ 1` + `FIR.stjarnor.fa_en`) vid barnets första unika djur även med ordkort.<br>**F5:** Tydlig `🏡 Till Ängen`-knapp i topp-HUD på Gården samt enhetliga, ärliga räknare i `Djuralbum` och `Ordbok`. |
| **Fynd 6 (P1)** | `🔒 För vuxna` renderar alla reglage och röd `Börja om`-knapp på rad 51–182 *innan* matematiklåset är löst; `Djuralbum`/`Ordbok` har `Stäng` på `y = 15 100 px`. | **F5** | `ForalderDialog.tsx` omsluter rad 51–182 med `{upplast ? (<> ... </>) : null}` (`0` reglage/knappar före rätt svar). Alla modaler får fast `×`-stängknapp (`48×48 px`, `top ≤ 80 px`, `right: 12..20 px`) och menyval i `☰` stänger öppen modal. |
| **Fynd 7 (P1)** | Två `📋 Uppdrag`-ingångar öppnar olika vyer; tryck på pratbubbla ovanför djur missar (`28×28 px`) och gåvorutan visar djurkort (`kanin`, `katt`) i stället för gåvokort. | **F3** | Enhetlig Uppdragsvy med **`✍️ Lös i boken`** (`≥ 48 px`); pratbubbla ovanför djur får `≥ 44×44 px` tryckyta; gåvorutan (`gavaTill !== null`) visar klickbara gåvokort ur `data/gavor.json` (`0` djurkort). |
| **Fynd 8 (P2)** | Streckad spöklåda + `🔒`-hänglås mitt på startängen teleporterar till Skogen; 3D-Trollpennan saknar stjärnglans; skarp grästextur. | **F1** | Dölj `SpokHus`-spöklådan och `<Hanglas />` på startängen när platserna är öppna (behåll `<group name="grind">` och `data/placering.json` för `p3a.test.ts`), använd `f-trollpenna-magisk-cc0.glb` med stjärna och mjuk marktextur. |
| **Fynd 9 (P2)** | `"en dansande katt"` tappar stjärnglans; `"kat"` ger ledtråden *"hörs två T"* och avslöjar hela ordet; kompakta gåtraden duplicerar `❓ Gåta`; `mellanslag` är `36 px` hög. | **F2 & F5** | **F2:** Ta bort duplicerad kompakt gåtrad ur skrivfliken och höj `mellanslag` + flikar till `≥ 44 px`.<br>**F5:** Lägg in participet `"dansande"` i `data/ord.json` (`formaga: "studs"`, rör ej `"dansa"`) + `glans: true` i `useSkapa.ts`, och ändra `dubbel_mall` i `data/lasning.json` till `"Rätt ljud! I {mal} är vokalen kort, så det stavas med två {bokstav}."`. |

---

## 3. Uppdelning i 5 fokuserade rundor (`F1`–`F5`, Grindpunkt 10: 1 runda = 1 mål, ≤ 8 filer/runda)

| Runda | Mapp & Beställning | Ett sammanhållet mål | Max berörda filer |
|---|---|---|---|
| **F1** | `rundor/F1-F3-intro-bok-uppdrag/BESTALLNING-F1.md` | Magiskt Slime Rancher-intro i dagsljus (3D-Trollpenna som bokstaverar `K-A-N-I-N`, studsande `SagaKanin` med `slimeStuds` & stjärnbubblor, 0 HUD-knappar, ostört 18,7 s tal + `Nästa ▸`), ren startäng utan spöklåda/hänglås, kristallklart Första skapelse-läge (`≤ 55dvh`, `0 %` scrim) & 1:a stjärnan vid ordkort. | 7 kod-/datafiler + 1 ny testfil |
| **F2** | `rundor/F1-F3-intro-bok-uppdrag/BESTALLNING-F2.md` | `Pennans bok` med Slime Rancher Juicy UI & `0 px` överlapp: exklusiv lägesväxlare (`🃏 Ordkort` / `⌨️ Stava själv`), 1-radig uppdragsremsa (`≤ 40 px`), alla tryckytor `≥ 44 px` och ordkorts-byggare (`valUrText`) som bygger vidare på `"en kanin med …"`. | 5 kod-/CSS-filer + 1 ny testfil |
| **F3** | `rundor/F1-F3-intro-bok-uppdrag/BESTALLNING-F3.md` | Dynamiskt första Bengtsson-uppdrag för barnets faktiska djur (med `"sol"`/`"värme"` + Bengtssons tack-bubbla & röst), enhetlig Uppdragsvy med `✍️ Lös i boken` samt gåvoruta med gåvokort ur `data/gavor.json`. | 7 kod-/datafiler + 1 ny testfil |
| **F4** | `rundor/F4-F5-3d-plagg-vuxenlas/BESTALLNING-F4.md` | Dedikerad 3D-fästnings- och kamerasiktslösare med kalibrering på disk (`kalibrera-f4.mjs` / `kalibrering-f4.json`): synlig CC0-mössa, halsduk & filt på djur (`≥ 25 %` på `375×812`, `mossaKanin.ts` för alla djur) samt exakt 1 osliten, klickbar 3D-Bengtsson (`x = 29.8..104.1 px`). | 7 kod-/datafiler + 1 ny testfil |
| **F5** | `rundor/F4-F5-3d-plagg-vuxenlas/BESTALLNING-F5.md` | Äkta Vuxenlås (`0` reglage före rätt svar), fast `×`-stängknapp (`48×48 px`) i alla modaler, `🏡 Till Ängen` på Gården, enhetliga räknare, `"dansande"` med stjärnglans & ärlig dubbelteckningsledtråd. | 7 kod-/datafiler + 1 ny testfil |

---

## 4. Låsta test-invarianter (0 ändrade befintliga testfiler!)

1. **`src/test/v7a-intro.test.ts`:** Behåll symbolen `V7A_LANGD`, `data-testid="intro-text"` och `data-testid="intro-hoppa"` i `src/spel/intro.tsx`.
2. **`src/spel/v3.test.ts`:** Behåll `data-v3="skapar-vy-flikar"`, `vy-flik-skriv`, `vy-flik-gata`, `vy-flik-ideer`, `bok-stang`, `ordkort`, `skriv-remsa`, `exempel-chip-` i `BokSkarm.tsx`, `kompakt` i `Ledtradsyta.tsx` samt `.bok{` och `max-height:66dvh` i `bok-p1.css` (använd `.bok.forsta-skapelse{max-height:55dvh;height:auto}` för Första skapelse-läget!).
3. **`src/spel/v2.test.ts` & `src/spel/p4a.test.ts`:** Behåll alla `data-v2`- och `data-p4`-attribut i `BokSkarm.tsx`, `Ledtradsyta.tsx`, `UppdragsRemsa.tsx`, `BokSvar.tsx` och `ForalderDialog.tsx`.
4. **`src/spel/uppdragsmotor.test.ts` & `src/spel/rost.test.ts`:** Behåll `SKRIV[0]!.text_bengtsson` i `data/bengtsson.json` och 12 scener i `data/intro.json` oförändrade; ersätt `"kanin"`/`"kaninen"` dynamiskt i `uppdragText(u)` / `uppdragKlart(u)` (`src/spel/aventyr.ts`) och `ideRad(u)` (`src/spel/ideRad.ts`).
5. **`src/spel/tillbehor/p3b2.test.ts` & `src/spel/tillbehor/data.test.ts`:** Behåll exakt `38` poster i `ENTITETER` med `typ === "tillbehor" && !!modellUrl(id)` (peka `"alvmossa"` på `/models/bulk/f-mossa-vinter-cc0.glb` och `"luva"` på `/models/bulk/f-mossa-toppluva-cc0.glb` i `data/tillgangar.json`), och lägg **inte** in nyckeln `"mössa"` i `data/tillbehor.json` (`data.test.ts` rad 79 kräver att `kontrolleraTillbehor(["mössa"])` ger fel när `"mössa"` inte är ett procedur-tillbehör).
6. **`src/tolk/reserv.test.ts` & `src/spel/b6-5.test.ts`:** Lägg endast in participet `"dansande"` i `data/ord.json` — rör **aldrig** grundformen `"dansa"` (som ligger i `data/kategori-ord.json`).
7. **`src/spel/p3a.test.ts` & `src/spel/p3a-matt.test.ts`:** Behåll `<group name="grind">` i `src/spel/ang/byggnader.tsx`, behåll `spokhus`/`damm`/`grind` i `data/placering.json`, och nollställ Slime Rancher *squash-and-stretch* när `window.__PAUSE_ANIM === true`.

---

## 5. Avsnitt 5: De 5 bakåtkompatibla krokarna mot Blockserie S (`0` rader omskrivning i `S1`–`S5`)

Enligt den kompletta Slime Rancher-förstudien (`/workspace/slime-rancher-studie/art-och-story.md`, `/workspace/slime-rancher-studie/teknik-och-loop.md`, `/workspace/slime-rancher-studie/modeller-och-uttryck.md` och [`docs/blockserie-s-slime-rancher.md`](blockserie-s-slime-rancher.md)) reserveras dessa 5 krokar direkt i `F1`–`F5`:

1. **I `F1` (`src/spel/gltfDjur.tsx`, `src/spel/ang/saga.tsx` & `src/spel/ang/djur.tsx`):**
   - Utöka `DjurSignal` med valfria `humör?: "glad" | "hungrig" | "fortjust" | "somnig" | "busig"` och `malPunkt?: [number, number] | null`.
   - Samla `slimeStuds` / squash-and-stretch i en delad ren hjälpfunktion `squashSkala(t, fas, amp, humör)` så att `S2` (Slime-hopp mot mat/leksak & humör) kopplas rakt in utan att ändra `F1`-koden.
2. **I `F2` (`src/spel/BokSkarm.tsx` & `src/spel/ui/bok-p1.css`):**
   - Behåll `.bok{max-height:66dvh;height:66dvh}` i `bok-p1.css` (för `v3.test.ts`) och styr 55 dvh-läget via `.bok.forsta-skapelse{max-height:var(--bok-max-h, 55dvh);height:auto}`, så både `F2` och `S4`/`S5` (Väktardjur-matning med synlig 3D-scen i övre halvan) använder exakt samma öppna halvyta (`y = 0..366 px`).
3. **I `F3` (`src/spel/aventyr.ts` & `src/spel/minne.ts`):**
   - Låt `uppdragText(u, malDjur?)` och `uppdragKlart(u, s, malDjur?)` ta valfri `malDjur?: string` (default `ang[0]?.kropp ?? "kanin"`).
   - Reservera valfria fält `solstjarnor?: number` (default `0`) och `vaktardjur?: Record<string, { matad: number; vackt: boolean }>` (default `{}`) i `minne.ts` (`franSparning`) redan nu så att sparningsformatet aldrig behöver migreras om i `S4`–`S5`.
4. **I `F4` (`src/spel/tillbehor/faest.ts` & `src/spel/tillbehor/ankare.ts`):**
   - Låt `faestTillbehor` i `src/spel/tillbehor/faest.ts` spara det beräknade ankaret på `rot.userData.ankare = a`.
   - Separera `par`-grupper (`par: "hatt"`, `"hals"`, `"rygg"`) så att `S2`-ansiktsuttryck (`par: "uttryck"` på `ansikte`/`ogonL`/`ogonR`/`mun`) och `S3`-Largo-öron (`par: "oron"`) + vingar (`par: "vingar"`) aldrig krockar med `F4`-plaggen.
5. **Tillgångspipeline redo i `public/models/bulk/` & `LICENSES.md`:**
   - Både de 8 `f-*.glb`-modellerna och de 9 `s-*.glb`-modellerna (`s-solstjarna-plort-cc0.glb`, `s-plort-kristall-cc0.glb`, `s-leksak-studsboll-cc0.glb`, `s-leksak-kudde-cc0.glb`, `s-mat-honung-cc0.glb`, `s-mat-jordgubbe-cc0.glb`, `s-biom-svampkluster-cc0.glb`, `s-biom-nackros-cc0.glb`, `s-vaktar-skattkista-cc0.glb`) ligger på plats i `public/models/bulk/` och `LICENSES.md`.
