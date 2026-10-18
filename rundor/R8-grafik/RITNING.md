# R8 – Grafik: ljus, mark, färg, kvalitet (ersätter "Snyggare grafik")

Christoffer: appen är "långt mycket sämre än Minecraft". Telefonen är målet (375×812). Filstorlekstaket får höjas, men R8-1 behöver inga nya filer.

## Bedömning (bilder i `docs/skarmbilder/r8/fore/`, mätning i `*-matt.json`)
Redan bra: toon-shading, mjuka lågpolygon-träd, söta djur, kantljus. Det som drar ner, i ordning efter synbar effekt:
1. **Marken är en enda platt limegrön yta** (vertexfärger, 28×28 rutor på 160 m). Inget säger "gräs": ingen textur, inga fläckar. Minecraft vinner mest här.
2. **Horisonten är ett hårt band**: dis (`#C5D5E0`, 28–55) och himmelens horisont (`#A9CDE6`) har olika färg, och bakom ängen står en mörkgrön trädvägg. Inget djup.
3. **Ljuset är platt**: hemisfärljuset 2.4 äter nyckelljusets skuggor; ingen färggrad, ingen vinjett. Allt ser överexponerat och kontrastlöst ut.
4. **Färgrundan:** 'en blå isbjörn' blir vit. Orsak: bulkmodeller får standardpalett (nyans 25, brun). Kenney-modeller delar en färgatlas där isbjörnen är gräddvit, så inga pixlar träffas och färgordet tas inte. Gäller alla vita/grå/icke-bruna bulkdjur.
5. **Kontur och material:** bara en del av objekten har mörk kantlinje; djurens GLB-modeller har ingen. Blandade materialtyper (toon + standard) ger olika look.
6. **Vatten, gräs, träd:** tre damm/träd-varianter, enhetlig gröna, ingen vind i träden, platt vatten. UI-stilen (bubblor/knappar) är konsekvent och fungerar; inte en prioritet.
7. **Post-processing (bloom, AO):** rekommenderas inte på telefon. Ersätts med billiga knep: CSS-vinjett, CSS-färggrad, blobbskuggor, emissiva halos.

Mobil idag (headless, mjukvaru-GL, bara RELATIVT): ca 131 draw calls och 22 000 trianglar per ruta: gott om utrymme. Mål efter R8: ≤180 draw calls, ≤40 000 trianglar, ingen ny nedladdning i R8-1.

## R8-1 (förberett, patch `ref/r8-1.patch`, applicera på main efter R6A-3)
Allt som data i **`data/miljo.json`** (ny), läst av `src/spel/miljo.ts`:
- `himmel`, `dis`, `ljus` (ambient, hemi, nyckel, fyll, kant), `kontur.farg`: ersätter alla hårdkodade färger i `Scen()`/`Himmel`/`KONTUR_MAT`. Hemisfärljus 2.4→1.9 och varmare nyckelljus 3.0 ger läsbara skuggor; dis och himmelshorisont får samma färg.
- `mark`: marktextur ritas en gång på en 128 px canvas (fläckar + gräsprickar), multipliceras med marken. `filter: "mjuk"` eller `"pixel"` (Minecraft-aktigt). Ingen bildfil.
- `farggrad` (mättnad 1.08, kontrast 1.05) som CSS-filter på canvasen och `vinjett` (0.22) som CSS-overlay. Billigt, ingen post-processing.
- `kvalitet.hog` / `kvalitet.lag`: skuggkarta 1024/512, `dpr_max` 2/1.5, färggrad på/av. `lag` väljs automatiskt (≤4 kärnor eller ≤3 GB) eller med `?kvalitet=lag`.
- **Färgrunda, generellt:** `karnfarg()` i `gltfDjur.tsx` mäter vilken färg kroppen använder (vanligaste texeln vid nätets UV) och ställer in paletten efter den; låg färgmättnad ger neutralt läge. Modeller utan textur tonas via materialfärgen. Ingen rad per djur.
- Smakprov utan ändring: `localStorage.trollpennan-miljo = '{"mark":{"filter":"pixel"}}'` (slås ihop med datan).

**Resultat (före → efter, `docs/skarmbilder/r8/`):** marken får textur och djup, isbjörnen blir blå, draw calls 131 → 130, trianglar 21 902 → 21 892 (oförändrat), JS-heap oförändrad. Bildrutetid i mjukvaru-GL 91 ms → 93–113 ms (brus ±15 %, ej telefonmätning): **Doodle mäter på riktig telefon eller sänker till `lag`.** Bilder: `fore/main-*`, `efter/mjuk-*`, `efter/pixel-*`.

## R8-2 (inte förberett; ritas när R8-1 är sedd)
Horisont: mjuk bergs-/trädsilhuett i två lager och lägre dis; trädvariation (instansering med färgjitter, vind); blobbskuggor under alla djur/hus; kantlinje (inverterat skal) på GLB-djur med `kontur.tjocklek` i datan (+1 draw call per djur: mät först); vatten med enkel vågrörelse; automatisk FPS-vakt som byter `hog`→`lag` om p95 > 40 ms i 3 s. Här kan filtaket behöva höjas (KTX2 512 px för mark/träd).

## Bevis
`fore-efter.mjs`: 375×812, äng med tre djur, Bengtsson-läge, draw calls/trianglar/bildrutetid/heap per körning (`--kvalitet`, `--miljo` för varianter). `miljo.test.ts` (data giltig). `typecheck:pages`, `test:product` 109/0, `build:pages` gröna i scratch.

## Stoppregel
Commit + rapport senast tur 14 av 20. Rör inte Phaser, spellogik eller Copilot-granskat. Går en ändring över 180 draw calls eller sänker `lag` under målet: ta bort den och rapportera. Behåll `miljo.json` värden om smaken tvekar; ändra i data, inte i kod.

## Kostnadsgissning och grind
Doodle R8-1: ca 8–12 turer (patch, bygga, bilder före/efter, telefonmätning av Christoffer). **Grind-dom: GO för R8-1; NEJ för R8-2** (ritas efter Christoffers smak).
## Kräver Christoffers ja (smak)
`mjuk` eller `pixel` mark; färgmättnad/vinjett (för starka?); om marken blir för neon; och om bilder på riktig telefon visar att `lag` ska bli standard.
