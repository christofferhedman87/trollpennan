# Blockserie S (`S1`–`S5`) — Slime Rancher-magi, Levande Ansiktsuttryck, Largos, Väktardjur & Solstjärne-loop (`375×812`)

**Datum:** 2026-10-26  
**Arkitektgren:** `origin/arkitekt/s1-s5-bestallning` (utgår från `origin/arkitekt/f1-f5-bestallning` `cf54676`)  
**Startar efter:** Blockserie F (`F1`–`F5`), med **0 rader omskrivning** av `F1`–`F5` tack vare de 5 förberedda krokarna i [`docs/blockserie-f-2026-10-26.md`](blockserie-f-2026-10-26.md).

## Alla 4 specialistunderlagen på disk
1. **Game Art Director (Visuell magi, Ian McConville-ljussättning, 5 biompaletter, 5 ansiktsuttryck, Largos, Väktardjur & Solstjärne-loop):**
   - `/workspace/slime-rancher-studie/art-och-story.md`
   - `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 9.1–9.7)
2. **Kodspanaren (Teknisk R3F-arkitektur, Fresnel-rim via `customProgramCacheKey`, instansierat vindgräs i 1 draw call, `<AnsiktsUttryck />` i `useFrame`, `malPunkt`-skutt & Väktardjur/Solstjärne-loop):**
   - `/workspace/slime-rancher-studie/teknik-och-loop.md`
3. **Modellspanaren (25 CC0 1.0 `s-*.glb`-modeller i `public/models/bulk/` (9 biom/mat/leksaker + 16 rundade djur `s-djur-*.glb`), krockfria `par`-ankare, `<AnsiktsUttryck />` & Largo-attribut):**
   - `/workspace/slime-rancher-studie/modeller-och-uttryck.md`
   - `/workspace/modell-inkorg/_blockserie-s/BLOCKSERIE-S.md`
   - `/workspace/modell-inkorg/_blockserie-s/manifest-utkast.tsv`
4. **Critiquito (Låsta acceptansmått på `375×812` för S1–S5):**
   - `/workspace/slime-rancher-studie/ui-kritik-s.md`
5. **Förkalibrering på disk för `S3` (Grindpunkt 6):**
   - `rundor/S1-S3-slime-varld-ansikten-largo/matt/kalibrera-s3.mjs`
   - `rundor/S1-S3-slime-varld-ansikten-largo/matt/kalibrering-s3.json`

---

## 1. Kärnidé: Svenska språket är vår Vacpack

I *Slime Rancher* fångas en 7-åring på 1 sekund av varma godisfärger, fjädrande *squash-and-stretch* och stora uttrycksfulla ögon (`^‿^`, `★‿★`, `•o•`, `•︵•`, `>‿<`), medan en 10-åring stannar i tiotals timmar för *Largos* (djurkombinationer), *Favoritmat* (dubbla Plorts), *Gordo Slimes* som öppnar skattkistor och *Slimepedia*.  
I **Trollpennan** är det **att läsa och skriva på svenska** som driver alla 5 kugghjul i loopen — helt i 60 fps på mobil (`375×812`) med `0` postprocessing-pass och `0` nya npm-beroenden.

---

## 2. Rundindelning `S1`–`S5` (1 sammanhållen mekanism per runda)

| Runda | Rundmapp & Beställning | Mål (1 sammanhållet mål per runda) | Turtak | Bevisbild (`375×812`) |
|---|---|---|---|---|
| **S1** | `rundor/S1-S3-slime-varld-ansikten-largo/BESTALLNING-S1.md` | **Solvarm Slime Rancher-värld i 60 fps på `375×812`:** `mjukrundaScen(rot, arKubDjur)` (`toCreasedNormals` + 1 nivå Loop/Spherify-puff på kubdjur i `mjukGeometri.ts` & `belys.ts`), delad `appliceraSlimeGlod(m)` i `src/spel/belys.ts` & `src/spel/gltfDjur.tsx` (`customProgramCacheKey = "trollpennan-slime-rim-v1"`, `TOON_MAP` golv `124`, 0 extra draw calls), `<hemisphereLight args={["#FFF8E1", "#7CB342", 0.65]} />`, `<VindGras antal={180} />` i 1 draw call + `<Solkorn antal={35} />`, de 5 biompaletterna (`slimePalett`) + CC0-biomrekvisitan (`s-biom-svampkluster-cc0.glb`, `s-biom-nackros-cc0.glb`, `s-plort-kristall-cc0.glb`) i `PlatsDekor.tsx`, samt ogenomskinliga `#FFF6E5` HUD-piller med `2px solid #3B2F2F` (`0 %` mörk scrim). | `--max-turns 42` | `s1-slime-varld.png` |
| **S2** | `rundor/S1-S3-slime-varld-ansikten-largo/BESTALLNING-S2.md` | **Rundade CC0-djurmodeller (`s-djur-*.glb` för 15 kub-/klossdjur) & uttrycksfulla Slime Rancher-ansikten i bulk (`<AnsiktsUttryck />`):** monterad i `src/spel/tillbehor/AnsiktsUttryck.tsx` via `rot.userData.ankare` på `ogonL`, `ogonR` och `mun` (`par: "uttryck"`). 5 reaktiva uttryck (`"glad"` `^‿^`, `"fortjust"` `★‿★`, `"hungrig"` `•o•`, `"somnig"` `•︵•`, `"busig"` `>‿<`) med dubbla vita *catchlights* och korallrosa kinder (`#F48FB1`), styrda i `useFrame` utan React-state, skärmstorlek `≥ 24×14 px` i främre zonen och `0 px` bubbel-överlapp över ansiktet under klapp/matning. | `--max-turns 42` | `s2-ansiktsuttryck.png` |
| **S3** | `rundor/S1-S3-slime-varld-ansikten-largo/BESTALLNING-S3.md` | **Dedikerad 3D-placerings- och rörelselösare för Largo-djurblandningar (`1.25×`) och Slime-skutt mot mat & leksaker:** `largoSkala` `[1.25, 1.18, 1.25]` (`≥ 68×68 px`) + krockfria signaturdelar (`par: "oron"`, `"vingar"`, `"horn"` med `≥ 12 px` utstick enligt `matt/kalibrering-s3.json`), aktivt skutt (`stegMotMalPunkt` / `malPunkt`) inom `1.2 s` mot mat/leksaker (`s-leksak-studsboll-cc0.glb`, `s-leksak-kudde-cc0.glb`, `s-mat-jordgubbe-cc0.glb`, `s-mat-honung-cc0.glb`) och synkroniserat kompisskutt i `djur.tsx` & `vandra.ts`. | `--max-turns 36` | `s3-largo-leksak.png` |
| **S4** | `rundor/S4-S5-vaktardjur-solstjarnor-album/BESTALLNING-S4.md` | **Mysiga Väktardjur (*Gordo Slimes*, `scale 2.1×`) i Skogen (*Bamse-Bum*), Sjön (*Kapten Plask*) och Grottan (*Glitter-Glim*):** `data/vaktardjur.json` + `src/spel/ang/vaktardjur.tsx` med 3-zons matningsvy på `375×812` (`Zon A y=58..126 px` aptitbubbla `0/3 → 3/3` + `🔊`, `Zon B y=128..366 px` fri 3D-sikt, `Zon C y=366..812 px` `Pennans bok`), `+12 %` svällning per matning och vid `3/3` stjärnfyrverkeri + `s-vaktar-skattkista-cc0.glb` + 5 Solstjärnor + gårdsritning. | `--max-turns 42` | `s4-vaktardjur-gordo.png` |
| **S5** | `rundor/S4-S5-vaktardjur-solstjarnor-album/BESTALLNING-S5.md` | **Solstjärne-loop (*Plorts* `+1 ★` / `+2 ★ Favorit!`), Gårdsuppgraderingar & 3-stjärnigt *Slimepedia*-Album:** `src/spel/solstjarna.ts` med `s-solstjarna-plort-cc0.glb` & `s-plort-kristall-cc0.glb` kopplad till gårdsuppgraderingar i `Garden3D.tsx`/`byggsidor.json` samt luftigt 3-stjärnigt *Slimepedia*-Album i `AlbumDialog.tsx` (max 2 kort/rad `≥ 156 px`, max 4 staplade element per kort, `★ ★ ☆`, favoritmat-piller och `✍️ Skriv till djuret` ≥ `44 px`). | `--max-turns 42` | `s5-solstjarnor-slimepedia.png` |

---

## 3. Verifieringskommandon

```bash
# Snabbprov & kalibrering (S1–S3)
node rundor/S1-S3-slime-varld-ansikten-largo/matt/kalibrera-s3.mjs
node rundor/S1-S3-slime-varld-ansikten-largo/prov-s1-s3.mjs --snabb --del alla

# Snabbprov (S4–S5)
node rundor/S4-S5-vaktardjur-solstjarnor-album/prov-s4-s5.mjs --snabb --del alla

# Full kontroll efter respektive runda på 375×812
npm run typecheck && npm run test:product && npm run check:struktur
node rundor/S1-S3-slime-varld-ansikten-largo/prov-s1-s3.mjs --del alla
node rundor/S4-S5-vaktardjur-solstjarnor-album/prov-s4-s5.mjs --del alla
```
