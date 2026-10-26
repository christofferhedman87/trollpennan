# GRIND — Blockserie S (`S1`–`S3`): Solvarm Slime Rancher-värld, Mjukrundade Djur (`mjukrundaScen` + 16 `s-djur-*.glb`), Levande Ansiktsuttryck & Largo-djurblandningar (`375×812`)

Grindutlåtande enligt `build-round-gate` (alla 13 grindpunkter **GRÖNA**) inför rundorna `S1`, `S2` och `S3`. Startas direkt ovanpå `F5` (där de 5 S-krokarna ur `docs/blockserie-f-2026-10-26.md` redan ligger i `main`).

## Specialistunderlag på disk (fysiska filsökvägar verifierade)
1. **Game Art Director (Ian McConville-ljussättning, 5 biompaletter, 5 ansiktsuttryck & Largo-design):**
   - `/workspace/slime-rancher-studie/art-och-story.md`
   - `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 9.1–9.5)
2. **Kodspanaren (Fresnel-rim via `customProgramCacheKey`, `mjukrundaScen` med `toCreasedNormals` + 1 nivå Loop/Spherify-puff i avsnitt 2.3, instansierat vindgräs i 1 draw call, `<AnsiktsUttryck />` i `useFrame` & `malPunkt`-skutt):**
   - `/workspace/slime-rancher-studie/teknik-och-loop.md` (Avsnitt 2.1–2.3 & 3.1–3.2)
3. **Modellspanaren (25 CC0 1.0 `s-*.glb`-modeller i `public/models/bulk/` — 9 rekvisita/mat/leksaker + 16 rundade djur `s-djur-*.glb` i avsnitt 4 — samt krockfria `par`-ankare för `F4` + `S2` + `S3`):**
   - `/workspace/slime-rancher-studie/modeller-och-uttryck.md` (Avsnitt 1–4)
   - `/workspace/modell-inkorg/_blockserie-s/BLOCKSERIE-S.md`
   - `/workspace/modell-inkorg/_blockserie-s/manifest-utkast.tsv`
4. **Critiquito (Låsta acceptansmått på `375×812` för HUD-kontrast, ansiktsstorlek `≥ 24×14 px` & Largo `≥ 68×68 px`):**
   - `/workspace/slime-rancher-studie/ui-kritik-s.md` (Avsnitt 1 & 2)
5. **Förkalibrering på disk för `S3` (Grindpunkt 6):**
   - `rundor/S1-S3-slime-varld-ansikten-largo/matt/kalibrera-s3.mjs`
   - `rundor/S1-S3-slime-varld-ansikten-largo/matt/kalibrering-s3.json`

---

## De 13 grindpunkterna i `build-round-gate` (alla GRÖNA)

1. **Projektkartan är aktuell (GRÖN):** `PROJECT.md` och `docs/blockserie-s-slime-rancher.md` är uppdaterade mot `V9b` (`2f17ee8`) och synkade med `Blockserie F` (`cf54676`).
2. **Återanvändnings- & specialistkontroll klar (GRÖN):** Alla 4 specialistfiler i `/workspace/slime-rancher-studie/`, `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 9) och `/workspace/modell-inkorg/_blockserie-s/manifest-utkast.tsv` ligger fysiskt på disk.
3. **Arkitekturregeln respekterad (GRÖN):** Samtliga 25 `s-*.glb`-modeller (9 biomrekvisita/leksaker/mat + 16 rundade `s-djur-*.glb` ur Quaternius och GobKit) ligger fysiskt i `public/models/bulk/` och är dokumenterade i `LICENSES.md` med `CC0-1.0`. `Spel.tsx` (49 rader) hålls orörd och nya/ändrade filer i `src/` hålls `≤ 400` rader.
4. **Exakt ritning i varje beställning (GRÖN):** `BESTALLNING-S1.md`, `BESTALLNING-S2.md` och `BESTALLNING-S3.md` namnger exakta filer, funktioner och datastrukturer i prioritetsordning.
5. **Dataväg och befintliga enhetstester spårade (GRÖN):**
   - **`src/spel/platser.test.ts` (rad 114–120):** Kräver att `miljoFor(platsMed("skogen")?.miljo).mark === "#718957"`, `"sjon" === "#DCCB9B"`, `"grottan" === "#8A8595"`, och `ljusSkala > 0 && ljusSkala <= 1`. Därför behålls `mark.grundfarg` och `ljus.skala <= 1` i `data/platser.json`, medan Slime Rancher-markpaletten och biomljuset läses ur `slimePalett` i `data/platser.json` / `src/spel/ang/PlatsDekor.tsx`!
   - **`src/spel/entiteter.test.ts` (rad 95, 128–130) & `src/spel/p3a.test.ts` (rad 31):** Kräver att `modellUrl("uggla") === "/models/animal-chick.glb"`, `modellUrl("gris") === null`, `forladdaUrls()` innehåller `"/models/animal-bunny.glb"` och att `harModell(k)` returnerar exakt samma mängd för `p3a.test.ts`-slumpen! Därför behålls `modell`-fältet i `data/entiteter.json` oförändrat för enhetstesterna, medan de 15 rundade djurmodellerna kopplas via `rundModell` i `data/entiteter.json` + `djurGltfUrl(kropp)` i `src/spel/entiteter.ts` / `src/spel/gltfDjur.tsx` / `src/spel/ang/djur.tsx` / `src/spel/gard/GardDjur.tsx`!
   - **`scripts/check-spel-struktur.mjs`:** Inga nya `data-testid`-attribut får läggas till i `src/spel/**/*.tsx` (använd `data-s1`, `data-s2`, `data-s3` istället för `data-testid`!).
6. **Beviset mäter det spelaren ser — med förkalibrering på disk (GRÖN):** `rundor/S1-S3-slime-varld-ansikten-largo/matt/kalibrera-s3.mjs` är körd och har skrivit `kalibrering-s3.json` (`largoSkarmPx: 76.3×110.3 px >= 68×68 px`, `utstickPx: 12.1–22.7 px >= 12 px`, `nollParKrockarMellanF4S2S3: true`, `skuttNarFramInom1_2s: true`).
7. **Snabbprov finns på disk (GRÖN):** `node rundor/S1-S3-slime-varld-ansikten-largo/prov-s1-s3.mjs --snabb --del s1|s2|s3|alla`.
8. **Bevis definierade med namngivna skärmbilder på `375×812` (GRÖN):** `s1-slime-varld.png`, `s2-ansiktsuttryck.png` och `s3-largo-leksak.png`.
9. **Körinställningar valda med flit (GRÖN):** `S1` (`--max-turns 42`), `S2` (`--max-turns 42`), `S3` (`--max-turns 36`, dedikerad placerings- och rörelselösare).
10. **Ett logiskt mål per runda (GRÖN):** `S1` = Ljus, `mjukrundaScen` (`toCreasedNormals` + Spherify), vindgräs, biomrekvisita & HUD-kontrast; `S2` = `<AnsiktsUttryck />` i bulk + de 15 rundade `s-djur-*.glb`-djurmodellerna; `S3` = Dedikerad 3D-placerings- och rörelselösare för Largo-djurblandningar och skutt till mat/leksak.
11. **Build skriver spelkoden (GRÖN):** `0` ändrade rader i `src/` på arkitektgrenen.
12. **Ingen merge över eget fynd (GRÖN):** `prov-s1-s3.mjs` + `npm run test:product` + `npm run check:struktur` måste vara 100 % gröna före merge.
13. **Ingen färdig patch nåbar (GRÖN):** Endast dokument, kalibrering, CC0-modeller och prov ligger på `arkitekt/s1-s5-bestallning`.

---

## Verifieringskommandon för `S1`–`S3`
```bash
node rundor/S1-S3-slime-varld-ansikten-largo/prov-s1-s3.mjs --snabb --del alla
node rundor/S1-S3-slime-varld-ansikten-largo/matt/kalibrera-s3.mjs
npm run typecheck
npm run test:product
npm run check:struktur
node rundor/S1-S3-slime-varld-ansikten-largo/prov-s1-s3.mjs --del alla
```
