# PROJECT.md – Trollpennan (kort projektkarta)

**Uppdaterad 2026-10-26 av Arkitekten, mot `main` = `a1dabdc` (#224, S4 mergad — hela Blockserie F #216–#220 samt S1–S4 #221–#224 klara, S5 pågår, Blockserie D D1–D3 beställd).** Uppdatera efter varje sammanslagen runda (grindregel 1 i `build-round-gate`).
Granskning: https://trollpennan.christofferhedman87.workers.dev/ (byggs från `main`, Playwright 375×812). `trollpennan.grok.me` är gammal och ska inte användas.

- **Plan för Blockserie F (`F1`–`F5`, 2026-10-26 — Första minuterna, UX i världsklass & 5 krokar till Blockserie S):** [`docs/blockserie-f-2026-10-26.md`](docs/blockserie-f-2026-10-26.md)
- **Plan för Blockserie S (`S1`–`S5`, 2026-10-26 — Slime Rancher-magi, Biomer, Ansiktsuttryck, Largos & Väktardjur):** [`docs/blockserie-s-slime-rancher.md`](docs/blockserie-s-slime-rancher.md)
- **Fysiska specialistunderlag på disk (Blockserie F & Slime Rancher-förstudien för Blockserie S):**
  - **Granskningschefen (Fynd 1–9 på `375×812`):** `/workspace/granskning/2026-10-26-forsta-minuterna/rapport.md`
  - **Kodspanaren (`F1`–`F5` + `S1`–`S5` teknik & spelloop):** `/workspace/kod-inkorg/F1-F6/spaning.md` & `/workspace/slime-rancher-studie/teknik-och-loop.md`
  - **Game Art Director (Stilguide avsnitt 6–9 + Slime Rancher art & story):** `/workspace/trollpennan-nulage/stilguide.md` & `/workspace/slime-rancher-studie/art-och-story.md`
  - **Modellspanaren (`f-*.glb` + `s-*.glb` CC0 1.0, ankarkalibrering, uttryck & Largos):** `/workspace/modell-inkorg/_blockserie-f/BLOCKSERIE-F.md`, `/workspace/slime-rancher-studie/modeller-och-uttryck.md` & `/workspace/modell-inkorg/_blockserie-s/`
  - **Critiquito (låsta acceptansmått på `375×812`):** `/workspace/slime-rancher-studie/ui-kritik-s.md`, `rundor/F1-F3-intro-bok-uppdrag/GRIND.md`, `rundor/F4-F5-3d-plagg-vuxenlas/GRIND.md`, `rundor/S1-S3-slime-varld-ansikten-largo/GRIND.md` & `rundor/S4-S5-vaktardjur-solstjarnor-album/GRIND.md`
- **Plan för Blockserie V (`V1`–`V9b`, 100 % klar 2026-10-26):** [`docs/blockserie-v-2026-10-25.md`](docs/blockserie-v-2026-10-25.md)
- **Blockserien P1–P10 (klar t.o.m. P4c #203):** [`rundor/PREMIUM/BLOCKSERIE.md`](rundor/PREMIUM/BLOCKSERIE.md)
- **Skriptkön och rundhistoriken:** [`rundor/KO.md`](rundor/KO.md)
- **Gamla långa projektkartan:** [`docs/PROJECT-arkiv-2026-10-20.md`](docs/PROJECT-arkiv-2026-10-20.md)

## Grundtanken (Christoffer, 2026-10-18 & 2026-10-26)
> Yngre barn skapar en egen värld genom att skriva svenska. Det barnet skriver ska materialiseras på skärmen, nästan oavsett vad hen skriver. Modeller ska kunna läggas in i bulk. Djur, men även hus, stall och hagar. Uppdrag på andra platser (skogen, sjön, grottan), främst från Doktor Bengtsson. En fast kameravinkel som i Hay Day är ok. Kartan ska vara visuellt vacker, pedagogisk och väcka känslan av att vilja utforska hela spelet. Upplevelsen i de första minuterna, i biomerna och på Gården ska ha **Slime Rancher**-känsla (Minecraft var endast ett tidigt minimigolv): varm Pixar-/leksaksljussättning utan grå skuggor, mjuk volymbevarande *squash-and-stretch*, 5 uttrycksfulla djuransikten (`^‿^`, `★‿★`, `•o•`, `•︵•`, `>‿<`), tokroliga *Largos* (*"en vingad kattgris"*), favoritmat som ger dubbla Solstjärnor och jättelika *Väktardjur* (*Gordos*) som väcks med kreativa svenska meningar.

**Täckning** (Kelly topp-1000, `rundor/R3B-reservform/r3b-matt.mjs`; 18 okt → 21 okt): egen form för substantiv 1,3 → 9,6 %, adjektiv 1,9 → 2,1 % och verb 0,8 → 3,2 %. Något synligt (egen form eller ordägg) 0 → 95–97 %. Metod: `verification/tackning-2026-10-18.md`.

## Vad som finns på `main` (`a1dabdc`)
| Del | Var |
|---|---|
| Ordtolkning & svensk grammatik (`O1a` #190, `O1b` #191, `P3b-1` #199, `V4` #207, `V8a` #212) | `src/tolk/` (`tolka.ts`, `lexikon.ts`, `sparr.ts`, `avstand.ts`, `reserv.ts`, `v4-sprak.test.ts`), `src/spel/fyll.ts`, `data/ord.json`, `data/blocklist.json`, `data/kannetecken.json`, `data/orddelar.json` |
| Entiteter & kläder på kroppen (`P3b-2` #200, `V8b` #213) | `data/entiteter.json`, `data/tillgangar.json`, `data/faste.json`, `data/plagg.json`, `src/spel/tillbehor/` (`ankare.ts`, `faest.ts`, `data.ts`), `LICENSES.md`, `public/models/` |
| 3D (R3F), Ängen, Bengtsson i 3D & adaptiv prestanda (`G2` #198, `V6` #209, `V8b` #213, `V9b` #215) | `src/spel/angen3d.tsx`, `src/spel/Bengtsson3D.tsx`, `src/spel/modeller/forladda.ts`, `src/spel/modeller/StjarnPuffReserv.tsx`, `src/spel/ang/` (`djur.tsx`, `saga.tsx`, `byggnader.tsx`, `ljus.tsx`), `data/platser.json`, `data/placering.json` |
| Världskartan i sagoboksstil (`V1` #204) | `src/spel/KartaVy.tsx`, `src/spel/ui/karta-v1.css`, `data/platser.json`, `data/omraden.json` |
| Samlade menyer, Album & Ordbok (`V2` #205, `V9a` #214) | `src/spel/SpelRot.tsx`, `src/spel/ui/AlbumDialog.tsx`, `src/spel/ui/OrdbokDialog.tsx`, `src/spel/ui/ForalderDialog.tsx`, `src/spel/BokSkarm.tsx` |
| Luftigt skrivfönster i halvhöjd med 3 flikar (`V3` #206, `V5` #208) | `src/spel/BokSkarm.tsx`, `src/spel/ui/Ledtradsyta.tsx`, `src/spel/useSkriv.ts`, `src/spel/ui/bok-p1.css`, `src/spel/v3.test.ts`, `src/spel/v5.test.ts` |
| Gården i 3D (`G1a`–`G1c` #195–#197, `V7b` #211, `V8b` #213) | `src/spel/gard/` (`Garden3D.tsx`, `ByggModell.tsx`, `GardDjur.tsx`, `MarkPlan.tsx`, `rutnat.ts`), `data/gard-3d.json`, `public/models/gard/` |
| Röster (förgenererade, ElevenLabs) | `src/spel/rostKo.ts`, `data/rost-takt.json`, `data/rost.json`, `data/rost-manifest.json`, `public/ljud/rost/`. **Blockserie F återanvänder 100 % befintliga `.mp3`-filer (0 nya TTS).** |

## Arkitekturregler
1. **Data + tillgång = ingen ny kod per sak.** Ett nytt djur, föremål, plagg, byggnad, uppdrag eller ord är en datarad plus en tillgångsfil som läses av ett generellt system.
2. **En renderväg:** R3F (`phaser` är helt borttaget sedan PR #198).
3. **Ingen ny vy i `Spel.tsx`.** `Spel.tsx` (49 rader) hålls orörd; nya/ändrade kodfiler i `src/` hålls ≤ 400 rader.
4. **Licens:** CC0, eller CC BY med synlig kredit. Allt dokumenteras i `LICENSES.md` och `CREDITS.md`.
5. **Bevis är bilder och prov som mäter det barnet ser på skärmen (`375×812`)**, inte bara antal i scenen.
6. **Arbetsdelning & obligatoriska specialistbotar (`build-round-gate`):** Build skriver spelkoden. Arkitekten anropar alltid `Kodspanaren`, `Game Art Director`, `Modellspanaren` och `Critiquito` och levererar fysiska filsökvägar i `GRIND.md` före beställning. Doodle verifierar filerna fysiskt på disk, kör Build och mergar.

## Läget 2026-10-26: Hela Blockserie V (`V1`–`V9b`) mergad t.o.m. #215 (`2f17ee8`), Blockserie F (`F1`–`F5`) synkad med Slime Rancher-studien och redo för start, följd av Blockserie S (`S1`–`S5`)

### 1. Mergat i Blockserie V på `main` (`#204`–`#215`, 100 % klar)
- **#204 (`608b700`) V1 – Världskarta i sagoboksstil**
- **#205 (`54b3cc4`) V2 – Samlade menyer med bildikoner & aktivt uppdrag**
- **#206 (`d9068f2`) V3 – Skrivfönster i halvhöjd med 3 flikar**
- **#207 (`f313f47`) V4 – Svensk grammatik `en`/`ett`, ljudstam & spärrlista**
- **#208 (`955d446`) V5 – Bredare mobiltangentbord & fonetisk stavningshjälp**
- **#209 (`3afcd61`) V6 – Pratbubblor utan kollision & Doktor Bengtsson i 3D**
- **#210 (`df73df8`) V7a – Kort interaktivt intro & `Hoppa över`**
- **#211 (`06e8346`) V7b – Gårdens byggsystem med CC0-hus & 3 fönster**
- **#212 (`7f8f883`) V8a – Ängstak 16, antal 1–10, `"och"`-meningar & mössa på frysande kanin**
- **#213 (`d1ed8f4`) V8b – Småsaker i fri siktlinje, nyaste byggnad främst, sjukhus ≤ 10 % skymt & röd tröja**
- **#214 (`ac397c3`) V9a – Visuellt Album med 2D-brickor & platstaggar, upptäckar-Ordbok utan frågevägg & Stjärnruta med Lyssna**
- **#215 (`2f17ee8`) V9b – Mobilprestanda (`≤ 12` GLB vid kallstart via `forladdaNarLedig`), adaptiv R3F (`AdaptiveDpr`, `PerformanceMonitor`, `Bvh`) & gyllene `StjarnPuffReserv`**

### 2. Nästa serie: Blockserie F (`F1`–`F5`) i [`docs/blockserie-f-2026-10-26.md`](docs/blockserie-f-2026-10-26.md) (Beställd på `origin/arkitekt/f1-f5-bestallning`, framtidssäkrad med 5 S-krokar)

| # | Runda | Innehåll (1 sammanhållen mekanism per runda + S-krok så 0 rader skrivs om i Blockserie S) | Fynd i `rapport.md` | Turtak | Status |
|---|---|---|---|---|---|
| 1 | **F1** | **Magiskt Slime Rancher-intro i dagsljus, `K-A-N-I-N` i 3D, ren startäng, kristallklart Första skapelse-läge (`≤ 55dvh`, `0 %` scrim) & 1:a stjärnan vid ordkort** + **S-krok 1:** `DjurHumör` & `malPunkt` i `DjurSignal` samt delad `squashSkala(t, fas, amp, humör)`. | Fynd 1, 3, 5A, 8 | 65 | **Beställd (`origin/arkitekt/f1-f5-bestallning`)** |
| 2 | **F2** | **`Pennans bok` med Slime Rancher Juicy UI, `0 px` överlapp, 1-radig uppdragsremsa & `valUrText`-byggare** + **S-krok 2:** `.bok{max-height:66dvh;height:66dvh}` bevaras medan `.bok.forsta-skapelse{max-height:var(--bok-max-h, 55dvh)}` ger fri 3D-sikt i `y = 0..366 px` även för Väktardjur i `S5`. | Fynd 1, 4B, 9C–9D | 65 | **Beställd (`origin/arkitekt/f1-f5-bestallning`)** |
| 3 | **F3** | **Dynamiskt första Bengtsson-uppdrag för barnets faktiska djur, Enhetlig Uppdragsvy & Gåvokort ur `data/gavor.json`** + **S-krok 3:** valfri `malDjur?: string` i `uppdragText`/`uppdragKlart` samt reserverade `solstjarnor` och `vaktardjur` i `minne.ts`. | Fynd 2A, 2B, 2D, 7A–7B | 65 | **Beställd (`origin/arkitekt/f1-f5-bestallning`)** |
| 4 | **F4** | **Dedikerad 3D-fästnings- och kamerasiktsrunda med förkalibrering (`kalibrering-f4.json`)** + **S-krok 4:** `rot.userData.ankare = a` i `faest.ts` och krockfria `par`-grupper (`"hatt"`, `"hals"`, `"rygg"` vs `"uttryck"`, `"oron"`, `"vingar"`). | Fynd 2C, 4A (Grind 6 & 10) | 65 | **Beställd (`origin/arkitekt/f1-f5-bestallning`)** |
| 5 | **F5** | **Äkta Vuxenlås (`0` reglage före rätt svar), fasta `×`-stängknappar i alla modaler (`top ≤ 80 px`), `🏡 Till Ängen` på Gården, enhetliga räknare, `"dansande"` med stjärnglans & ärlig dubbelteckningsledtråd.** | Fynd 5B–5C, 6A–6B, 9A–9B | 65 | **Beställd (`origin/arkitekt/f1-f5-bestallning`)** |

### 3. Efterföljande serie: Blockserie S (`S1`–`S5`) i [`docs/blockserie-s-slime-rancher.md`](docs/blockserie-s-slime-rancher.md) (Beställd på `origin/arkitekt/s1-s5-bestallning`)

| # | Runda | Rundmapp & Beställning | Innehåll (1 sammanhållet mål per runda) | Turtak | Status |
|---|---|---|---|---|---|
| 1 | **S1** | `rundor/S1-S3-slime-varld-ansikten-largo/BESTALLNING-S1.md` | **Solvarm Slime Rancher-värld i 60 fps (`375×812`):** `appliceraSlimeGlod` med `customProgramCacheKey` (0 extra draw calls), `<VindGras antal={180} />` i 1 draw call + `<Solkorn antal={35} />`, de 5 biompaletterna (`slimePalett`) + CC0-biomrekvisita (`s-biom-svampkluster-cc0.glb`, `s-biom-nackros-cc0.glb`, `s-plort-kristall-cc0.glb`) och `#FFF6E5` HUD-piller med `2px solid #3B2F2F` (`0 %` scrim). | 42 | **Mergad (#221)** |
| 2 | **S2** | `rundor/S1-S3-slime-varld-ansikten-largo/BESTALLNING-S2.md` | **Rundade CC0-djurmodeller (`s-djur-*.glb` för 15 kub-/klossdjur) & uttrycksfulla Slime Rancher-ansikten i bulk (`<AnsiktsUttryck />`):** monterad i `AnsiktsUttryck.tsx` via `rot.userData.ankare` (`par: "uttryck"`), 5 reaktiva uttryck (`^‿^`, `★‿★`, `•o•`, `•︵•`, `>‿<`) med dubbel vit *catchlight* och `#F48FB1`-kinder i `useFrame`, `≥ 24×14 px` på skärmen och `0 px` bubbel-överlapp. | 42 | **Mergad (#222)** |
| 3 | **S3** | `rundor/S1-S3-slime-varld-ansikten-largo/BESTALLNING-S3.md` | **Dedikerad 3D-placerings- & rörelselösare för Largo-djurblandningar (`1.25×`) och Slime-skutt mot mat/leksak:** förkalibrerad i `matt/kalibrering-s3.json` (`≥ 68×68 px`, krockfria `par`-ankare `"oron"`, `"vingar"`, `"horn"` med `≥ 12 px` utstick), aktivt skutt (`stegMotMalPunkt` inom `1.2 s`) mot `s-leksak-studsboll-cc0.glb`, `s-leksak-kudde-cc0.glb`, `s-mat-jordgubbe-cc0.glb`, `s-mat-honung-cc0.glb` & kompisskutt. | 36 | **Mergad (#223)** |
| 4 | **S4** | `rundor/S4-S5-vaktardjur-solstjarnor-album/BESTALLNING-S4.md` | **Mysiga Väktardjur (*Gordo Slimes*, `2.1×`) i Skogen (*Bamse-Bum*), Sjön (*Kapten Plask*) & Grottan (*Glitter-Glim*):** `data/vaktardjur.json` + `src/spel/ang/vaktardjur.tsx` med 3-zons matningsvy på `375×812` (`Zon A y=58..126`, `Zon B y=128..366` fri 3D-sikt, `Zon C y=366..812`), `+12 %` svällning per mening och vid `3/3` `s-vaktar-skattkista-cc0.glb` + 5 Solstjärnor + gårdsritning. | 42 | **Mergad (#224, `a1dabdc`)** |
| 5 | **S5** | `rundor/S4-S5-vaktardjur-solstjarnor-album/BESTALLNING-S5.md` | **Solstjärne-loop (*Plorts* `+1 ★` / `+2 ★ Favorit!`), Gårdsuppgraderingar & 3-stjärnigt *Slimepedia*-Album:** `src/spel/solstjarna.ts` (`s-solstjarna-plort-cc0.glb` & `s-plort-kristall-cc0.glb`), gårdsuppgraderingar i `Garden3D.tsx`/`byggsidor.json` och 3-stjärnigt *Slimepedia*-Album i `AlbumDialog.tsx` (max 2 kort/rad, max 4 staplade element/kort, `★ ★ ☆`, favoritmat-piller och `✍️ Skriv till djuret`). | 42 | **Beställd (`origin/arkitekt/s1-s5-bestallning`)** |

### 4. Nästa serie direkt efter S5: Blockserie D (`D1`–`D3`: Dagnys speltest, Mobilfixar, Smeknamn & Sammanhållna Röstfraser) i `rundor/D1-D3-dagnys-speltest-fixar/` (Beställd på `origin/arkitekt/d1-d3-bestallning`)

- **Grindbevis:** `rundor/D1-D3-dagnys-speltest-fixar/GRIND.md`
- **Kodspaning (Fynd D1–D7):** `/workspace/kod-inkorg/D1-D3/spaning.md`
- **5 nya sammanhållna ElevenLabs-röstfiler för Trollpennan (`pennan`, `4Ct5uMEndw4cJ7q0Jx0l`, `-16 LUFS`):**
  1. `public/ljud/rost/cd6dfbe4984fa1c4.mp3` (`14c9a5af`: *"Wow, du har skrivit ett guldord! Du får en stjärna!"*, `6766 ms`)
  2. `public/ljud/rost/3e4aec0917aef47a.mp3` (`8841cbf5`: *"Titta! Du hittade ett helt nytt ord till boken!"*, `4963 ms`)
  3. `public/ljud/rost/f88da967ffcbd8f5.mp3` (`666f97f2`: *"Titta, det du skrev vaknar till liv!"*, `4023 ms`)
  4. `public/ljud/rost/a4981119866c1746.mp3` (`5133aa4c`: *"Tadaa! Snyggt bygge, nu står det på gården!"*, `4362 ms`)
  5. `public/ljud/rost/bc39930f05380799.mp3` (`3dcac43d`: *"Hurra! Du fick nya stjärnor!"*, `2534 ms`)

| # | Runda | Beställning | Innehåll (1 sammanhållet mål per runda) | Turtak | Status |
|---|---|---|---|---|---|
| 1 | **D1** | `rundor/D1-D3-dagnys-speltest-fixar/BESTALLNING-D1.md` | **Rena 3D-djuransikten med humör-aura ovanför `huvudTopp` (`D1`), Lås mot mobilens systemtangentbord (`inputMode="none"`, `D2`) & 2D-Doktor Bengtsson på ängen + konsekvent titel `"Doktor Bengtsson"` (`D6`).** | 38 | **Beställd (`origin/arkitekt/d1-d3-bestallning`)** |
| 2 | **D2** | `rundor/D1-D3-dagnys-speltest-fixar/BESTALLNING-D2.md` | **Bisatser, bindeord (`som`/`har`/`med`/`och`/`är`/`kan`) & påklädning utan reserv-ägg (`D3`) + Sammansatta rumsscener (`"på en sten sitter en hund"`) med plattformsplacering i 3D (`D4`).** | 40 | **Beställd (`origin/arkitekt/d1-d3-bestallning`)** |
| 3 | **D3** | `rundor/D1-D3-dagnys-speltest-fixar/BESTALLNING-D3.md` | **Egna namn/smeknamn på djuren i text (`"en katt som heter Misse"`, `"döp katten till Misse"`), i UI (`"🏷️ Döp"`/`"🏷️ Byt namn"`), på 3D-namnskylt & i Album (`D5`) + inkoppling av de 5 sammanhållna ElevenLabs-röstfraserna i `src/spel/rost.ts` (`D7`).** | 40 | **Beställd (`origin/arkitekt/d1-d3-bestallning`)** |
