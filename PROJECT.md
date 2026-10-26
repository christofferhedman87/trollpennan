# PROJECT.md – Trollpennan (kort projektkarta)

**Uppdaterad 2026-10-26 av Arkitekten, mot `main` = `f057a48` (#228, D3 mergad — hela Blockserie F #216–#220, hela Blockserie S #221–#225 samt hela Blockserie D #226–#228 klara, Blockserie M M1–M3 beställd).** Uppdatera efter varje sammanslagen runda (grindregel 1 i `build-round-gate`).
Granskning: https://trollpennan.christofferhedman87.workers.dev/ (byggs från `main`, Playwright 375×812). `trollpennan.grok.me` är gammal och ska inte användas.

- **Plan för Blockserie F (`F1`–`F5`, 2026-10-26 — Första minuterna, UX i världsklass & 5 krokar till Blockserie S):** [`docs/blockserie-f-2026-10-26.md`](docs/blockserie-f-2026-10-26.md)
- **Plan för Blockserie S (`S1`–`S5`, 2026-10-26 — Slime Rancher-magi, Biomer, Ansiktsuttryck, Largos & Väktardjur):** [`docs/blockserie-s-slime-rancher.md`](docs/blockserie-s-slime-rancher.md)
- **Plan för Blockserie M (`M1`–`M3`, 2026-10-26 — NPF-anpassat & Visuellt Vackert Meny- och Navigationssystem på `375×812`):** [`rundor/M1-M3-npf-ux-menyer/GRIND.md`](rundor/M1-M3-npf-ux-menyer/GRIND.md)
- **Fysiska specialistunderlag på disk (Blockserie F, S, D & M):**
  - **Granskningschefen (Fynd 1–9 på `375×812`):** `/workspace/granskning/2026-10-26-forsta-minuterna/rapport.md`
  - **Kodspanaren (`F1`–`F5`, `S1`–`S5`, `D1`–`D3`, `M1`–`M3`):** `/workspace/kod-inkorg/F1-F6/spaning.md`, `/workspace/slime-rancher-studie/teknik-och-loop.md`, `/workspace/kod-inkorg/D1-D3/spaning.md` & `/workspace/kod-inkorg/M1-M4/spaning.md`
  - **Game Art Director (Stilguide avsnitt 6–10 + Slime Rancher art & story):** `/workspace/trollpennan-nulage/stilguide.md` & `/workspace/slime-rancher-studie/art-och-story.md`
  - **Modellspanaren (`f-*.glb` + `s-*.glb` CC0 1.0, ankarkalibrering, uttryck & Largos):** `/workspace/modell-inkorg/_blockserie-f/BLOCKSERIE-F.md`, `/workspace/slime-rancher-studie/modeller-och-uttryck.md`, `/workspace/modell-inkorg/_blockserie-s/` & `/workspace/modell-inkorg/S1-S5/manifest.json`
  - **Critiquito (låsta acceptansmått på `375×812`):** `/workspace/slime-rancher-studie/ui-kritik-s.md`, `/workspace/trollpennan-nulage/npf-ux-feedback/ui-kritik-m.md`, `rundor/F1-F3-intro-bok-uppdrag/GRIND.md`, `rundor/F4-F5-3d-plagg-vuxenlas/GRIND.md`, `rundor/S1-S3-slime-varld-ansikten-largo/GRIND.md`, `rundor/S4-S5-vaktardjur-solstjarnor-album/GRIND.md`, `rundor/D1-D3-dagnys-speltest-fixar/GRIND.md` & `rundor/M1-M3-npf-ux-menyer/GRIND.md`
- **Plan för Blockserie V (`V1`–`V9b`, 100 % klar 2026-10-26):** [`docs/blockserie-v-2026-10-25.md`](docs/blockserie-v-2026-10-25.md)
- **Blockserien P1–P10 (klar t.o.m. P4c #203):** [`rundor/PREMIUM/BLOCKSERIE.md`](rundor/PREMIUM/BLOCKSERIE.md)
- **Skriptkön och rundhistoriken:** [`rundor/KO.md`](rundor/KO.md)
- **Gamla långa projektkartan:** [`docs/PROJECT-arkiv-2026-10-20.md`](docs/PROJECT-arkiv-2026-10-20.md)

## Grundtanken (Christoffer, 2026-10-18 & 2026-10-26)
> Yngre barn skapar en egen värld genom att skriva svenska. Det barnet skriver ska materialiseras på skärmen, nästan oavsett vad hen skriver. Modeller ska kunna läggas in i bulk. Djur, men även hus, stall och hagar. Uppdrag på andra platser (skogen, sjön, grottan), främst från Doktor Bengtsson. En fast kameravinkel som i Hay Day är ok. Kartan ska vara visuellt vacker, pedagogisk och väcka känslan av att vilja utforska hela spelet. Upplevelsen i de första minuterna, i biomerna och på Gården ska ha **Slime Rancher**-känsla (Minecraft var endast ett tidigt minimigolv): varm Pixar-/leksaksljussättning utan grå skuggor, mjuk volymbevarande *squash-and-stretch*, rena djuransikten med svävande humör-aura, tokroliga *Largos* (*"en vingad kattgris"*), favoritmat som ger dubbla Solstjärnor och jättelika *Väktardjur* (*Gordos*) som väcks med kreativa svenska meningar. Menyer och navigation ska vara NPF-anpassade, visuellt vackra och helt självförklarande för en 7-åring (*Progressive Disclosure*, 100 % separation mellan Doktor Bengtssons uppdrag och fri skapelse i Pennans bok, stor central meningsruta överst och steg-för-steg-kort med Bakåt/Framåt-pilar utan dolda rullistor).

**Täckning** (Kelly topp-1000, `rundor/R3B-reservform/r3b-matt.mjs`; 18 okt → 21 okt): egen form för substantiv 1,3 → 9,6 %, adjektiv 1,9 → 2,1 % och verb 0,8 → 3,2 %. Något synligt (egen form eller ordägg) 0 → 95–97 %. Metod: `verification/tackning-2026-10-18.md`.

## Vad som finns på `main` (`f057a48`)
| Del | Var |
|---|---|
| Ordtolkning, bisatser, smeknamn & svensk grammatik (`O1a` #190, `O1b` #191, `P3b-1` #199, `V4` #207, `V8a` #212, `D2` #227, `D3` #228) | `src/tolk/` (`tolka.ts`, `ochMening.ts`, `lexikon.ts`, `sparr.ts`, `avstand.ts`, `reserv.ts`, `v4-sprak.test.ts`), `src/spel/fyll.ts`, `data/ord.json`, `data/blocklist.json`, `data/kannetecken.json`, `data/orddelar.json` |
| Entiteter & kläder på kroppen (`P3b-2` #200, `V8b` #213, `F4` #219) | `data/entiteter.json`, `data/tillgangar.json`, `data/faste.json`, `data/plagg.json`, `src/spel/tillbehor/` (`ankare.ts`, `faest.ts`, `data.ts`, `AnsiktsUttryck.tsx`), `LICENSES.md`, `public/models/` |
| 3D (R3F), Ängen, Väktardjur, Largos & adaptiv prestanda (`G2` #198, `V6` #209, `V8b` #213, `V9b` #215, `S1`–`S4` #221–#224, `D1`–`D3` #226–#228) | `src/spel/angen3d.tsx`, `src/spel/Bengtsson3D.tsx`, `src/spel/modeller/forladda.ts`, `src/spel/modeller/StjarnPuffReserv.tsx`, `src/spel/ang/` (`djur.tsx`, `humorIkon.tsx`, `vaktardjur.tsx`, `saga.tsx`, `byggnader.tsx`, `ljus.tsx`), `data/platser.json`, `data/placering.json`, `data/vaktardjur.json` |
| Världskartan i sagoboksstil (`V1` #204) | `src/spel/KartaVy.tsx`, `src/spel/ui/karta-v1.css`, `data/platser.json`, `data/omraden.json` |
| Samlade menyer, Slimepedia-Album & Ordbok (`V2` #205, `V9a` #214, `S5` #225, `D3` #228) | `src/spel/ui/Hud.tsx`, `src/spel/samling.tsx`, `src/spel/ui/OrdbokDialog.tsx`, `src/spel/ui/ForalderDialog.tsx`, `src/spel/ui/BokSkarm.tsx` |
| Luftigt skrivfönster i halvhöjd (`V3` #206, `V5` #208, `F2` #217, `D1` #226) | `src/spel/ui/BokSkarm.tsx`, `src/spel/ui/Ledtradsyta.tsx`, `src/spel/useSkriv.ts`, `src/spel/ui/bok-p1.css`, `src/spel/v3.test.ts`, `src/spel/v5.test.ts` |
| Gården i 3D & Solstjärnor (`G1a`–`G1c` #195–#197, `V7b` #211, `V8b` #213, `S5` #225) | `src/spel/gard/` (`Garden3D.tsx`, `ByggModell.tsx`, `GardDjur.tsx`, `MarkPlan.tsx`, `rutnat.ts`), `src/spel/solstjarna.ts`, `data/gard-3d.json`, `public/models/gard/` |
| Röster (förgenererade, ElevenLabs, inkl. 5 sammanhållna röstfraser i `D3` #228) | `src/spel/rost.ts`, `src/spel/rostManifest.ts`, `src/spel/rostKo.ts`, `data/rost-takt.json`, `data/rost.json`, `data/rost-manifest.json`, `data/rost-klient.json`, `public/ljud/rost/`. |

## Arkitekturregler
1. **Data + tillgång = ingen ny kod per sak.** Ett nytt djur, föremål, plagg, byggnad, uppdrag eller ord är en datarad plus en tillgångsfil som läses av ett generellt system.
2. **En renderväg:** R3F (`phaser` är helt borttaget sedan PR #198).
3. **Ingen ny vy i `Spel.tsx`.** `Spel.tsx` (49 rader) hålls orörd; nya/ändrade kodfiler i `src/` hålls ≤ 400 rader.
4. **Licens:** CC0, eller CC BY med synlig kredit. Allt dokumenteras i `LICENSES.md` och `CREDITS.md`.
5. **Bevis är bilder och prov som mäter det barnet ser på skärmen (`375×812`)**, inte bara antal i scenen.
6. **Arbetsdelning & obligatoriska specialistbotar (`build-round-gate`):** Build skriver spelkoden. Arkitekten anropar alltid `Kodspanaren`, `Game Art Director`, `Modellspanaren` och `Critiquito` och levererar fysiska filsökvägar i `GRIND.md` före beställning. Doodle verifierar filerna fysiskt på disk, kör Build och mergar.

## Läget 2026-10-26: Blockserie V (`#204`–`#215`), Blockserie F (`#216`–`#220`), Blockserie S (`#221`–`#225`) och Blockserie D (`#226`–`#228`, `f057a48`) 100 % mergade på `main` — Blockserie M (`M1`–`M3`) beställd

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

### 2. Mergat i Blockserie F på `main` (`#216`–`#220`, 100 % klar)
- **#216 (`F1`)** – Magiskt Slime Rancher-intro i dagsljus, `K-A-N-I-N` i 3D, ren startäng & Första skapelse-läge (`≤ 55dvh`).
- **#217 (`F2`)** – `Pennans bok` med Slime Rancher Juicy UI, `0 px` överlapp & `valUrText`-byggare.
- **#218 (`F3`)** – Dynamiskt första Bengtsson-uppdrag för barnets faktiska djur, Enhetlig Uppdragsvy & Gåvokort ur `data/gavor.json`.
- **#219 (`F4`)** – Dedikerad 3D-fästnings- och kamerasiktsrunda med förkalibrering (`kalibrering-f4.json`).
- **#220 (`F5`)** – Äkta Vuxenlås, fasta `×`-stängknappar i alla modaler (`top ≤ 80 px`), `🏡 Till Ängen` på Gården & `"dansande"` med stjärnglans.

### 3. Mergat i Blockserie S på `main` (`#221`–`#225`, 100 % klar)
- **#221 (`S1`)** – Solvarm Slime Rancher-värld i 60 fps (`appliceraSlimeGlod`, `<VindGras />`, `<Solkorn />`, 5 biompaletter).
- **#222 (`S2`)** – Rundade CC0-djurmodeller (`s-djur-*.glb`) & uttrycksfulla ansiktsuttryck.
- **#223 (`S3`)** – Largo-djurblandningar (`1.25×`) och aktivt Slime-skutt mot mat/leksak.
- **#224 (`S4`, `a1dabdc`)** – Mysiga Väktardjur (*Gordo Slimes*, `2.1×`) i Skogen (*Bamse-Bum*), Sjön (*Kapten Plask*) & Grottan (*Glitter-Glim*).
- **#225 (`S5`, `dc7d4bb`)** – Solstjärne-loop (*Plorts* `+1 ★` / `+2 ★ Favorit!`), Gårdsuppgraderingar & 3-stjärnigt *Slimepedia*-Album.

### 4. Mergat i Blockserie D på `main` (`#226`–`#228`, `f057a48`, 100 % klar)
- **#226 (`D1`, `4683612`)** – Rena 3D-djuransikten med svävande humör-aura ovanför `huvudTopp` (`D1`), Lås mot mobilens systemtangentbord (`inputMode="none"`, `D2`) & 2D-Doktor Bengtsson på ängen + konsekvent titel `"Doktor Bengtsson"` (`D6`).
- **#227 (`D2`, `3e24ca4`)** – Bisatser, bindeord (`som`/`har`/`med`/`och`/`är`/`kan`) & påklädning utan reserv-ägg (`D3`) + Sammansatta rumsscener (`"på en sten sitter en hund"`) med plattformsplacering i 3D (`D4`).
- **#228 (`D3`, `f057a48`)** – Egna namn/smeknamn på djuren i text (`"en katt som heter Misse"`, `"döp katten till Misse"`), i UI (`"🏷️ Döp"`/`"🏷️ Byt namn"`), på 3D-namnskylt & i Album (`D5`) + inkoppling av de 5 sammanhållna ElevenLabs-röstfraserna i `src/spel/rost.ts` (`D7`).

### 5. Aktuell serie: Blockserie M (`M1`–`M3`: NPF-anpassat & Visuellt Vackert Meny- och Navigationssystem på `375×812`) i `rundor/M1-M3-npf-ux-menyer/` (Beställd på `origin/arkitekt/m1-m3-bestallning`)

- **Grindbevis (`build-round-gate`):** `rundor/M1-M3-npf-ux-menyer/GRIND.md`
- **Kodspaning (NPF/UX-forskning, alla 24+ hjälp-uppdrag & 175 `data-testid`-invarianter):** `/workspace/kod-inkorg/M1-M4/spaning.md`
- **Stilguide (Avsnitt 10):** `/workspace/trollpennan-nulage/stilguide.md`
- **UI-kritik på `375×812`:** `/workspace/trollpennan-nulage/npf-ux-feedback/ui-kritik-m.md`
- **Verifikationsskript (`--snabb` + Playwright `375×812`):** `rundor/M1-M3-npf-ux-menyer/prov-m1-m3.mjs`

| # | Runda | Beställning | Innehåll (1 sammanhållet mål per runda) | Turtak | Status |
|---|---|---|---|---|---|
| 1 | **M1** | `rundor/M1-M3-npf-ux-menyer/BESTALLNING-M1.md` | **NPF-anpassad Startskärm & Bottennavigering utan dubbelt Bengtsson-porträtt eller dubbla hjälpbubblor:** Två särpräglade huvudkort längst ner (**👩‍🔬 Doktor Bengtsson · 📋 Uppdrag** i varm solguld med porträttet integrerat i kortet till vänster, och **🪄 Pennans bok · Trolla fram · Skriv** i bär-rosa till höger), noll dubbla Bengtsson-porträtt på startängen och max 1 lugn hjälpbubbla åt gången. | 38 | **Beställd (`origin/arkitekt/m1-m3-bestallning`)** |
| 2 | **M2** | `rundor/M1-M3-npf-ux-menyer/BESTALLNING-M2.md` | **100 % Fristående Uppdragslösare i `src/spel/ui/UppdragVy.tsx` & Dubblettfria Hjälp-uppdrag:** Egen inbyggd svarsruta, `✨ Gör det!`, `💡 Förslag` (4 klickbara kort i 2×2-rutnät), `🧩 Ordkort` och `⌨️ Skriv själv` (skärmtangentbord) direkt inne i Uppdragsrutan utan hopp till *Pennans bok*, samt fix av alla 24+ hjälp-uppdrag (`uppdragForslag`, `hjalpDjurPaAngen`, `useSkapa.ts`) så att förslagskorten visar rena hjälp-föremål och det befintliga djuret på ängen hjälps/värms/matas med **0 dubblett-kaniner**. | 45 | **Beställd (`origin/arkitekt/m1-m3-bestallning`)** |
| 3 | **M3** | `rundor/M1-M3-npf-ux-menyer/BESTALLNING-M3.md` | **NPF-anpassad Steg-för-steg-byggare i `Pennans bok` (`src/spel/ui/StegKortValjare.tsx`) med stor meningsruta högst upp & 0 dolda rullistor:** Noll Bengtsson/gåtor i `Pennans bok`, stor vit meningsruta med guldram (`#FFB300`) och ordbrickor + `✨ Vakna!` allra högst upp, en enda ren lägesrad (`🧩 Ordkort` / `⌨️ Stava själv` + `💡 Idé`), och en 3-stegs kortväljare (`1. Välj djur 🐾` ➔ `2. Färg & Storlek 🎨` ➔ `3. Kläder & Kraft 🎩`) som visar exakt 6 stora 3D-ordkort per sida (`overflow: hidden`) med tydliga sid- och stegpilar (`◀ Fler`, `Sida 1/3`, `Fler ▶`, `Nästa steg ▶`). | 45 | **Beställd (`origin/arkitekt/m1-m3-bestallning`)** |
