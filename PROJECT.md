# PROJECT.md – Trollpennan (kort projektkarta)

**Uppdaterad 2026-10-26 av Arkitekten, mot `main` = `2f17ee8` (#215, V9b mergad — hela Blockserie V klar).** Uppdatera efter varje sammanslagen runda (grindregel 1 i `build-round-gate`).
Granskning: https://trollpennan.christofferhedman87.workers.dev/ (byggs från `main`, Playwright 375×812). `trollpennan.grok.me` är gammal och ska inte användas.

- **Plan för Blockserie F (`F1`–`F5`, 2026-10-26 — Första minuterna, UX i världsklass & 5 krokar till Blockserie S):** [`docs/blockserie-f-2026-10-26.md`](docs/blockserie-f-2026-10-26.md)
- **Plan för Blockserie S (`S1`–`S5`, 2026-10-26 — Slime Rancher-magi, Biomer, Ansiktsuttryck, Largos & Väktardjur):** [`docs/blockserie-s-slime-rancher.md`](docs/blockserie-s-slime-rancher.md)
- **Fysiska specialistunderlag på disk (Blockserie F & Slime Rancher-förstudien för Blockserie S):**
  - **Granskningschefen (Fynd 1–9 på `375×812`):** `/workspace/granskning/2026-10-26-forsta-minuterna/rapport.md`
  - **Kodspanaren (`F1`–`F5` + `S1`–`S5` teknik & spelloop):** `/workspace/kod-inkorg/F1-F6/spaning.md` & `/workspace/slime-rancher-studie/teknik-och-loop.md`
  - **Game Art Director (Stilguide avsnitt 6–9 + Slime Rancher art & story):** `/workspace/trollpennan-nulage/stilguide.md` & `/workspace/slime-rancher-studie/art-och-story.md`
  - **Modellspanaren (`f-*.glb` + `s-*.glb` CC0 1.0, ankarkalibrering, uttryck & Largos):** `/workspace/modell-inkorg/_blockserie-f/BLOCKSERIE-F.md`, `/workspace/slime-rancher-studie/modeller-och-uttryck.md` & `/workspace/modell-inkorg/_blockserie-s/`
  - **Critiquito (låsta acceptansmått på `375×812`):** `rundor/F1-F3-intro-bok-uppdrag/GRIND.md`, `rundor/F1-F3-intro-bok-uppdrag/facit-f1-f3.json`, `rundor/F4-F5-3d-plagg-vuxenlas/GRIND.md` & `rundor/F4-F5-3d-plagg-vuxenlas/facit-f4-f5.json`
- **Plan för Blockserie V (`V1`–`V9b`, 100 % klar 2026-10-26):** [`docs/blockserie-v-2026-10-25.md`](docs/blockserie-v-2026-10-25.md)
- **Blockserien P1–P10 (klar t.o.m. P4c #203):** [`rundor/PREMIUM/BLOCKSERIE.md`](rundor/PREMIUM/BLOCKSERIE.md)
- **Skriptkön och rundhistoriken:** [`rundor/KO.md`](rundor/KO.md)
- **Gamla långa projektkartan:** [`docs/PROJECT-arkiv-2026-10-20.md`](docs/PROJECT-arkiv-2026-10-20.md)

## Grundtanken (Christoffer, 2026-10-18 & 2026-10-26)
> Yngre barn skapar en egen värld genom att skriva svenska. Det barnet skriver ska materialiseras på skärmen, nästan oavsett vad hen skriver. Modeller ska kunna läggas in i bulk. Djur, men även hus, stall och hagar. Uppdrag på andra platser (skogen, sjön, grottan), främst från Doktor Bengtsson. En fast kameravinkel som i Hay Day är ok. Kartan ska vara visuellt vacker, pedagogisk och väcka känslan av att vilja utforska hela spelet. Upplevelsen i de första minuterna, i biomerna och på Gården ska ha **Slime Rancher**-känsla (Minecraft var endast ett tidigt minimigolv): varm Pixar-/leksaksljussättning utan grå skuggor, mjuk volymbevarande *squash-and-stretch*, 5 uttrycksfulla djuransikten (`^‿^`, `★‿★`, `•o•`, `•︵•`, `>‿<`), tokroliga *Largos* (*"en vingad kattgris"*), favoritmat som ger dubbla Solstjärnor och jättelika *Väktardjur* (*Gordos*) som väcks med kreativa svenska meningar.

**Täckning** (Kelly topp-1000, `rundor/R3B-reservform/r3b-matt.mjs`; 18 okt → 21 okt): egen form för substantiv 1,3 → 9,6 %, adjektiv 1,9 → 2,1 % och verb 0,8 → 3,2 %. Något synligt (egen form eller ordägg) 0 → 95–97 %. Metod: `verification/tackning-2026-10-18.md`.

## Vad som finns på `main` (`2f17ee8`)
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

### 3. Efterföljande serie: Blockserie S (`S1`–`S5`) i [`docs/blockserie-s-slime-rancher.md`](docs/blockserie-s-slime-rancher.md)
- **S1:** Slime Rancher-ljussättning, Fresnel-rim (`appliceraSlimeGlod`), 3-stegs himmelskupol, instansierat vindgräs (`1` draw call) & nya biompaletter för Ängen, Gården, Smaragd-Skogen, Korall-Sjön och Kristall-Grottan.
- **S2:** Djurens 5 reaktiva ansiktsuttryck (`^‿^`, `★‿★`, `•o•`, `•︵•`, `>‿<`) på `rot.userData.ankare`, skutta-fram-till-mat/leksak (`malPunkt`), nos-boop & *Slime Stack*.
- **S3:** Trollpennans *"Largos"* (sammansatta djur & djurblandningar med `1.25×` rundhet, förledets öron/vingar/horn, dubbla Solstjärnor `★ +2` och Largo-flik i Albumet).
- **S4:** Favoritmat & adjektivbonus (`★ +2`), vilda/glittrande biomdjur och 3-stjärnigt *Slimepedia*-Djuralbum med silhuetter.
- **S5:** Jättelika *"Väktardjur"* (*Gordo Slimes*, `2.4×` skala, `0/3 → 3/3` meningar → stjärnfyrverkeri & `s-vaktar-skattkista-cc0.glb`) samt interaktiva hagleksaker på Drömgården.
