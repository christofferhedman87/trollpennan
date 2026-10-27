# PROJECT.md – Trollpennan (kort projektkarta)

**Uppdaterad 2026-10-27 av Arkitekten, mot `main` = `aa2470a` (#235, C4 mergad — hela Blockserie F #216–#220, S #221–#225, D #226–#228, M #229–#231 samt C #232–#235 klara; Blockserie R R1–R2 beställd).** Uppdatera efter varje sammanslagen runda (grindregel 1 i `build-round-gate`).
Granskning: https://trollpennan.christofferhedman87.workers.dev/ (byggs från `main`, Playwright 375×812). `trollpennan.grok.me` är gammal och ska inte användas.

- **Plan för Blockserie F (`F1`–`F5`, 2026-10-26 — Första minuterna, UX i världsklass & 5 krokar till Blockserie S):** [`docs/blockserie-f-2026-10-26.md`](docs/blockserie-f-2026-10-26.md)
- **Plan för Blockserie S (`S1`–`S5`, 2026-10-26 — Slime Rancher-magi, Biomer, Ansiktsuttryck, Largos & Väktardjur):** [`docs/blockserie-s-slime-rancher.md`](docs/blockserie-s-slime-rancher.md)
- **Plan för Blockserie M (`M1`–`M3`, 2026-10-26 — NPF-anpassat & Visuellt Vackert Meny- och Navigationssystem på `375×812`):** [`rundor/M1-M3-npf-ux-menyer/GRIND.md`](rundor/M1-M3-npf-ux-menyer/GRIND.md)
- **Plan för Blockserie C (`C1`–`C4`, 2026-10-27 — Copilots v0.8 Redesign *Trollpennan: Levande Ord*):** [`rundor/C1-C4-levande-ord/GRIND.md`](rundor/C1-C4-levande-ord/GRIND.md)
- **Plan för Blockserie R (`R1`–`R2`, 2026-10-27 — Kompletta Röstinspelningar i ElevenLabs, Noll Web Speech TTS & 1-MP3-meningar):** [`rundor/R1-R2-kompletta-roster/GRIND.md`](rundor/R1-R2-kompletta-roster/GRIND.md)
- **Fysiska specialistunderlag på disk (Blockserie F, S, D, M, C & R):**
  - **Granskningschefen (Fynd 1–9 på `375×812`):** `/workspace/granskning/2026-10-26-forsta-minuterna/rapport.md`
  - **Kodspanaren (`F1`–`F5`, `S1`–`S5`, `D1`–`D3`, `M1`–`M3`, `C1`–`C4`, `R1`–`R2`):** `/workspace/kod-inkorg/F1-F6/spaning.md`, `/workspace/slime-rancher-studie/teknik-och-loop.md`, `/workspace/kod-inkorg/D1-D3/spaning.md`, `/workspace/kod-inkorg/M1-M4/spaning.md`, `/workspace/kod-inkorg/c1-c4/spaning.md` & `/workspace/kod-inkorg/r1-r3-roster/spaning.md`
  - **Game Art Director (Stilguide avsnitt 6–11 + Slime Rancher art & story):** `/workspace/trollpennan-nulage/stilguide.md` & `/workspace/slime-rancher-studie/art-och-story.md`
  - **Modellspanaren (`f-*.glb` + `s-*.glb` CC0 1.0, ankarkalibrering, uttryck & Largos):** `/workspace/modell-inkorg/_blockserie-f/BLOCKSERIE-F.md`, `/workspace/slime-rancher-studie/modeller-och-uttryck.md`, `/workspace/modell-inkorg/_blockserie-s/` & `/workspace/modell-inkorg/S1-S5/manifest.json`
  - **Critiquito (låsta acceptansmått på `375×812` & `320×568`):** `/workspace/slime-rancher-studie/ui-kritik-s.md`, `/workspace/trollpennan-nulage/npf-ux-feedback/ui-kritik-m.md`, `/workspace/trollpennan-nulage/kritik-c1-c4.md`, `rundor/C1-C4-levande-ord/GRIND.md` & `rundor/R1-R2-kompletta-roster/GRIND.md`
- **Plan för Blockserie V (`V1`–`V9b`, 100 % klar 2026-10-26):** [`docs/blockserie-v-2026-10-25.md`](docs/blockserie-v-2026-10-25.md)
- **Blockserien P1–P10 (klar t.o.m. P4c #203):** [`rundor/PREMIUM/BLOCKSERIE.md`](rundor/PREMIUM/BLOCKSERIE.md)
- **Skriptkön och rundhistoriken:** [`rundor/KO.md`](rundor/KO.md)

## Grundtanken (Christoffer, 2026-10-18 & 2026-10-27)
> Yngre barn skapar en egen värld genom att skriva svenska. Det barnet skriver ska materialiseras på skärmen, nästan oavsett vad hen skriver. Modeller ska kunna läggas in i bulk. Djur, men även hus, stall och hagar. Uppdrag på andra platser (skogen, sjön, grottan), främst från Doktor Bengtsson. En fast kameravinkel som i Hay Day är ok. Kartan ska vara visuellt vacker, pedagogisk och väcka känslan av att vilja utforska hela spelet. Upplevelsen i de första minuterna, i biomerna och på Gården ska ha **Slime Rancher**-känsla (Minecraft var endast ett tidigt minimigolv): varm Pixar-/leksaksljussättning utan grå skuggor, mjuk volymbevarande *squash-and-stretch*, rena djuransikten med svävande humör-aura, tokroliga *Largos* (*"en vingad kattgris"*), favoritmat som ger dubbla Solstjärnor och jättelika *Väktardjur* (*Gordos*) som väcks med kreativa svenska meningar. Menyer och skaparpanel ska vara NPF-anpassade, visuellt vackra i nordiskt sagotema (*Levande Ord* v0.8) och helt självförklarande för en 7-åring, med kompletta och sammanhållna röstinspelningar från ElevenLabs utan robotaktig webbläsar-TTS.

**Täckning** (Kelly topp-1000, `rundor/R3B-reservform/r3b-matt.mjs`; 18 okt → 21 okt): egen form för substantiv 1,3 → 9,6 %, adjektiv 1,9 → 2,1 % och verb 0,8 → 3,2 %. Något synligt (egen form eller ordägg) 0 → 95–97 %. Metod: `verification/tackning-2026-10-18.md`.

## Vad som finns på `main` (`aa2470a`)
| Del | Var |
|---|---|
| Ordtolkning, bisatser, smeknamn & svensk grammatik (`O1a` #190, `O1b` #191, `P3b-1` #199, `V4` #207, `V8a` #212, `D2` #227, `D3` #228) | `src/tolk/` (`tolka.ts`, `ochMening.ts`, `lexikon.ts`, `sparr.ts`, `avstand.ts`, `reserv.ts`, `v4-sprak.test.ts`), `src/spel/fyll.ts`, `data/ord.json`, `data/blocklist.json`, `data/kannetecken.json`, `data/orddelar.json` |
| Entiteter & kläder på kroppen (`P3b-2` #200, `V8b` #213, `F4` #219) | `data/entiteter.json`, `data/tillgangar.json`, `data/faste.json`, `data/plagg.json`, `src/spel/tillbehor/` (`ankare.ts`, `faest.ts`, `data.ts`, `AnsiktsUttryck.tsx`), `LICENSES.md`, `public/models/` |
| 3D (R3F), Ängen, Väktardjur, Largos & adaptiv prestanda (`G2` #198, `V6` #209, `V8b` #213, `V9b` #215, `S1`–`S4` #221–#224, `D1`–`D3` #226–#228) | `src/spel/angen3d.tsx`, `src/spel/Bengtsson3D.tsx`, `src/spel/modeller/forladda.ts`, `src/spel/modeller/StjarnPuffReserv.tsx`, `src/spel/ang/` (`djur.tsx`, `humorIkon.tsx`, `vaktardjur.tsx`, `saga.tsx`, `byggnader.tsx`, `ljus.tsx`), `data/platser.json`, `data/placering.json`, `data/vaktardjur.json` |
| Världskartan i sagoboksstil (`V1` #204) | `src/spel/KartaVy.tsx`, `src/spel/ui/karta-v1.css`, `data/platser.json`, `data/omraden.json` |
| Samlade menyer, Fristående Uppdragslösare, Slimepedia-Album & Ordbok (`V2` #205, `V9a` #214, `S5` #225, `D3` #228, `M1`–`M2` #229–#230) | `src/spel/ui/Hud.tsx`, `src/spel/ui/UppdragVy.tsx`, `src/spel/samling.tsx`, `src/spel/ui/OrdbokDialog.tsx`, `src/spel/ui/ForalderDialog.tsx`, `src/spel/ui/BokSkarm.tsx` |
| *Levande Ord* v0.8 skaparpanel i halvhöjd (`V3` #206, `V5` #208, `F2` #217, `D1` #226, `M3` #231, `C1`–`C4` #232–#235) | `src/spel/ui/BokSkarm.tsx`, `src/spel/ui/SkapelseBar.tsx`, `src/spel/ui/BokKort.tsx`, `src/spel/ui/StegKortValjare.tsx`, `src/spel/ui/GavoPanel.tsx`, `src/spel/ui/Ledtradsyta.tsx`, `src/spel/styr/useSkriv.ts`, `src/spel/ui/bok-p1.css`, `src/spel/ui/bok-komp.css`, `src/spel/ui/bok-v08.css` |
| Gården i 3D & Solstjärnor (`G1a`–`G1c` #195–#197, `V7b` #211, `V8b` #213, `S5` #225) | `src/spel/gard/` (`Garden3D.tsx`, `ByggModell.tsx`, `GardDjur.tsx`, `MarkPlan.tsx`, `rutnat.ts`), `src/spel/solstjarna.ts`, `data/gard-3d.json`, `public/models/gard/` |
| Röster (4 136 förgenererade ElevenLabs-MP3-filer i `-16 LUFS`, `pennan`/`bengtsson`/`syntaxviruset`) | `src/spel/rost.ts`, `src/spel/rostManifest.ts`, `src/spel/rostKo.ts`, `scripts/rost-kandidater.mjs`, `scripts/rost-generera.mjs`, `data/rost-takt.json`, `data/rost.json`, `data/rost-manifest.json`, `data/rost-klient.json`, `public/ljud/rost/`. |

## Arkitekturregler
1. **Data + tillgång = ingen ny kod per sak.** Ett nytt djur, föremål, plagg, byggnad, uppdrag eller ord är en datarad plus en tillgångsfil som läses av ett generellt system.
2. **En renderväg:** R3F (`phaser` är helt borttaget sedan PR #198).
3. **Ingen ny vy i `Spel.tsx`.** `Spel.tsx` (49 rader) hålls orörd; nya/ändrade kodfiler i `src/` hålls ≤ 400 rader.
4. **Licens:** CC0, eller CC BY med synlig kredit. Allt dokumenteras i `LICENSES.md` och `CREDITS.md`.
5. **Bevis är bilder och prov som mäter det barnet ser på skärmen (`375×812`)**, inte bara antal i scenen.
6. **Arbetsdelning & obligatoriska specialistbotar (`build-round-gate`):** Build skriver spelkoden. Arkitekten anropar alltid `Kodspanaren`, `Game Art Director`, `Modellspanaren` och `Critiquito` och levererar fysiska filsökvägar i `GRIND.md` före beställning. Doodle verifierar filerna fysiskt på disk, kör Build och mergar.

## Läget 2026-10-27: Blockserie V (`#204`–`#215`), F (`#216`–`#220`), S (`#221`–`#225`), D (`#226`–`#228`), M (`#229`–`#231`) & C (`#232`–`#235`, `aa2470a`) 100 % mergade på `main` — Blockserie R (`R1`–`R2`) beställd

### 1. Mergat i Blockserie V, F, S, D & M på `main` (`#204`–`#231`, 100 % klara)
- **Blockserie V (`#204`–`#215`):** Sagobokskarta, samlade menyer, halvhöjdsbok, svensk grammatik, mobiltangentbord, 3D-Bengtsson, interaktivt intro, 3D-gård, ängstak 16, fri siktlinje, visuellt album och adaptiv 3D-mobilprestanda.
- **Blockserie F (`#216`–`#220`):** Magiskt Slime Rancher-intro (`K-A-N-I-N`), Juicy UI i `Pennans bok`, dynamiskt första Bengtsson-uppdrag, 3D-plaggfästning (`kalibrering-f4.json`), Vuxenlås och `"dansande"`.
- **Blockserie S (`#221`–`#225`):** Solvarm Slime Rancher-värld i 60 fps (`<VindGras />`, `<Solkorn />`), rundade CC0-djur (`s-djur-*.glb`), Largos (`1.25×`), Väktardjur (*Gordos*, `2.1×`) och Solstjärne-loop (*Plorts* `+1 ★` / `+2 ★ Favorit!`).
- **Blockserie D (`#226`–`#228`, `f057a48`):** Rena 3D-djuransikten med svävande humör-aura (`D1`), bisatser/rumsscener på plattform (`D2`) samt egna djur-smeknamn och 5 sammanhållna röstfraser (`D3`).
- **Blockserie M (`#229`–`#231`, `b71fadc`):** NPF-anpassad startskärm (`M1`), fristående Uppdragslösare i `UppdragVy.tsx` (`M2`) och steg-för-steg-byggare i `StegKortValjare.tsx` (`M3`).

### 2. Mergat i Blockserie C på `main` (`#232`–`#235`, `aa2470a`, 100 % klar)
- **#232 (`C1`, `37a38a4`)** – Klickbar Meningsbyggare (`SkapelseBar.tsx`) med `48 px` ordbrickor, Ångra (`↶`), långmeningsläge (`>= 7` ord) & magisk statusrad + `casting`-spärr.
- **#233 (`C2`, `b195060`)** – Stort `2×2`-ordkortsrutnät (`BokKort.tsx` + `StegKortValjare.tsx`, `174×64 px`), `✓ Vald`-markering, separat `🔊`-lyssnaknapp & ärlig 2D-minipreview.
- **#234 (`C3`, `edef234`)** – Dedikerat Gåvo- & Döpläge (`GavoPanel.tsx`) låst till mottagardjurets UID, `2×2` illustrerade gåvokort utan dubblettdjur, inline Döp-flöde (`Skuttis`) & förlustfri `Stava själv`-synk.
- **#235 (`C4`, `aa2470a`)** – Nordiskt sagotema (`bok-v08.css` med `--tp-*` tokens), Bottom-Sheet-geometri på `375×812` (`sheetTop: 292 px`) & `320×568` (`sheetTop: 138 px`), `.bok-grab`, `:focus-visible` & `Escape`-stängning.

### 3. Aktuell serie: Blockserie R (`R1`–`R2`: Kompletta Röstinspelningar i ElevenLabs — Noll Web Speech TTS & 1-MP3-meningar) i `rundor/R1-R2-kompletta-roster/` (Beställd på `origin/arkitekt/r1-r2-bestallning`)

- **Grindbevis (`build-round-gate`):** `rundor/R1-R2-kompletta-roster/GRIND.md`
- **Kodspaning (totalinventering Lista A + B + C & arkitekturfynd):** `/workspace/kod-inkorg/r1-r3-roster/spaning.md`
- **Förgenererade ljudfiler (`4 136` MP3-filer i `-16 LUFS`, `65,79 MB`):** `public/ljud/rost/*.mp3`, `data/rost-manifest.json`, `data/rost-klient.json`, `scripts/rost-kandidater.mjs`
- **Verifikationsskript (`--steg=r1|r2|alla` + Playwright `375×812`):** `rundor/R1-R2-kompletta-roster/prov-r1-r2.mjs`

| # | Runda | Beställning | Innehåll (1 sammanhållet mål per runda) | Turtak | Status |
|---|---|---|---|---|---|
| 1 | **R1** | `rundor/R1-R2-kompletta-roster/BESTALLNING-R1.md` | **Röstmotor & Manifestuppslag (`src/spel/rostManifest.ts` & `src/spel/rost.ts`):** Emoji-/dubbelpunktsnormalisering i `normalisera`, 1-MP3-prioritet i `ettPlan` och `sammanhallenRostText`, backtracking i `ordSekvens`, `vardeDelar`-fallback för fria flerordsmeningar, flermeningsstöd i `rostPlan`, 9 nya sammanhållna ersättningsmeningar samt `dynamisk: "tyst"` (avveckling av Web Speech TTS). | 40 | **Beställd (`origin/arkitekt/r1-r2-bestallning`)** |
| 2 | **R2** | `rundor/R1-R2-kompletta-roster/BESTALLNING-R2.md` | **Koppla in kompletta röster i `UppdragVy.tsx`, `Ledtradsyta.tsx`, `ideRad.ts` & UI-flöden på `375×812`:** `uppdragText(aktivtUpp, ang[0]?.kropp)` på `🔊` i `UppdragVy.tsx:93`, komplett neutrum (`ETT_ORD`) i `ideRad.ts`, understrecksfri `lasText` på steg 1 i `Ledtradsyta.tsx:47` och 3 bevisbilder i `/workspace/trollpennan-nulage/ko-27okt-r/`. | 40 | **Beställd (`origin/arkitekt/r1-r2-bestallning`)** |
