# GRIND — Blockserie S (`S4`–`S5`): Väktardjur (Gordo Slimes) i biomerna, Solstjärne-loop (Plorts) & 3-stjärnigt Slimepedia-Album (`375×812`)

Grindutlåtande enligt `build-round-gate` (alla 13 grindpunkter **GRÖNA**) inför rundorna `S4` och `S5`, direkt ovanpå `S3`.

## Specialistunderlag på disk (fysiska filsökvägar verifierade)
1. **Game Art Director (Väktardjurens karaktärsdesign: *Bamse-Bum*, *Kapten Plask*, *Glitter-Glim* + Solstjärnor & 3-stjärnigt Slimepedia-album):**
   - `/workspace/slime-rancher-studie/art-och-story.md` (Avsnitt 2)
   - `/workspace/trollpennan-nulage/stilguide.md` (Avsnitt 9.6 & 9.7)
2. **Kodspanaren (Väktardjur i `data/vaktardjur.json` + `src/spel/ang/vaktardjur.tsx`, Solstjärne-korskoppling mellan Album ↔ Matning ↔ Gårdsbyggnad):**
   - `/workspace/slime-rancher-studie/teknik-och-loop.md` (Avsnitt 4)
3. **Modellspanaren (CC0-modeller `s-vaktar-skattkista-cc0.glb`, `s-solstjarna-plort-cc0.glb`, `s-plort-kristall-cc0.glb` i `public/models/bulk/`):**
   - `/workspace/slime-rancher-studie/modeller-och-uttryck.md` (Avsnitt 3.1 & 3.4)
   - `/workspace/modell-inkorg/_blockserie-s/manifest-utkast.tsv`
4. **Critiquito (Låsta `375×812`-mått: 3-zons Väktardjurs-matningsvy `Zon A y=58..126 px`, `Zon B y=128..366 px`, `Zon C y=366..812 px` & Slimepedia max 2 kort/rad, max 4 staplade element/kort):**
   - `/workspace/slime-rancher-studie/ui-kritik-s.md` (Avsnitt 3 & 4)

---

## De 13 grindpunkterna i `build-round-gate` (alla GRÖNA)

1. **Projektkartan är aktuell (GRÖN):** `PROJECT.md` och `docs/blockserie-s-slime-rancher.md` dokumenterar `S4` och `S5` i detalj.
2. **Återanvändnings- & specialistkontroll klar (GRÖN):** Alla 4 specialistfiler i `/workspace/slime-rancher-studie/` och `/workspace/trollpennan-nulage/stilguide.md` avsnitt 9.6–9.7 ligger på disk.
3. **Arkitekturregeln respekterad (GRÖN):** Äkta CC0 `.glb`-modeller (`s-vaktar-skattkista-cc0.glb`, `s-solstjarna-plort-cc0.glb`, `s-plort-kristall-cc0.glb`) ligger redan i `public/models/bulk/` och `LICENSES.md`. `Spel.tsx` (49 rader) hålls orörd och alla filer i `src/` hålls `≤ 400` rader.
4. **Exakt ritning i varje beställning (GRÖN):** `BESTALLNING-S4.md` och `BESTALLNING-S5.md` namnger exakta filer, typer och funktioner.
5. **Dataväg och befintliga enhetstester spårade (GRÖN):**
   - `SparaData` i `src/persist/spara.ts` utökas bakåtkompatibelt med valfria fält (`vaktardjur?: Record<string, number>`, `albumNiva?: Record<string, number>`) med default `{}` i `lasSparat()`.
   - Inga nya `data-testid`-attribut i `src/spel/**/*.tsx` (`scripts/check-spel-struktur.mjs`); använd `data-s4` och `data-s5`.
6. **Beviset mäter det spelaren ser (GRÖN):** `prov-s4-s5.mjs` kontrollerar 3-zonslayouten på `375×812` (`Zon A y=58..126`, `Zon B y=128..366 >= 238 px`, `Zon C y=366..812`) samt att Slimepedia-korten i `AlbumDialog.tsx` har max 2 kort/rad (`width >= 156 px`) och max 4 staplade element per kort.
7. **Snabbprov finns på disk (GRÖN):** `node rundor/S4-S5-vaktardjur-solstjarnor-album/prov-s4-s5.mjs --snabb --del s4|s5|alla`.
8. **Bevis definierade med namngivna skärmbilder på `375×812` (GRÖN):** `s4-vaktardjur-gordo.png` och `s5-solstjarnor-slimepedia.png`.
9. **Körinställningar valda med flit (GRÖN):** `S4` (`--max-turns 42`), `S5` (`--max-turns 42`).
10. **Ett logiskt mål per runda (GRÖN):** `S4` = Väktardjur (*Gordo Slimes*) i Skogen, Sjön och Grottan med 3-zons matningsvy; `S5` = Solstjärne-loop (*Plorts* `+1 ★` / `+2 ★ Favorit!`), gårdsuppgraderingar och 3-stjärnigt Slimepedia-Album.
11. **Build skriver spelkoden (GRÖN):** `0` ändrade rader i `src/` på arkitektgrenen.
12. **Ingen merge över eget fynd (GRÖN):** `prov-s4-s5.mjs` + `npm run test:product` + `npm run check:struktur` måste vara 100 % gröna före merge.
13. **Ingen färdig patch nåbar (GRÖN):** Endast dokument och prov ligger på `arkitekt/s1-s5-bestallning`.

---

## Verifieringskommandon för `S4`–`S5`
```bash
node rundor/S4-S5-vaktardjur-solstjarnor-album/prov-s4-s5.mjs --snabb --del alla
npm run typecheck
npm run test:product
npm run check:struktur
node rundor/S4-S5-vaktardjur-solstjarnor-album/prov-s4-s5.mjs --del alla
```
