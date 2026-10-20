# B6.4 – modellens egna färger utan färgord

Från Doodle: utan färgord blev jultomten orange, brandhjälmen laxrosa, narvalen blek och krakens lila lavendel.

## Rotorsak (mätt, inte gissad)
- Paletten och farg-materialet målade **inte** om något utan färgord: `fargAv(spec)` är `null` och palettbytet körs bara med hex
  (loggat i spelet: jultomtens material är orörda, `#D32F2F`, `#FAFAFA` och textur `texture-i`).
- Det som färgade: **guldordets glans**. Första gången ett ord skrivs är det ett guldord, och `Spel.tsx` sätter då `glans = true`.
  `gltfDjur.tsx` lade glansen som ett varmgult självlyse (`#FFE082`, 0,28) över **hela** kroppen på varje modell med palett
  (eller på farg-materialet), också utan färgord. Rött + gult blir orange (jultomten), rött blir laxrosa (hjälmen),
  grått/vitt blir blekt (narvalen) och lila blir lavendel (kraken).
- Därför "hjälpte" MFIX3:s `egna_farger` (palett och material bort): då föll glansvillkoret bort. Men då tog inte heller färgord.
- Dessutom fick ett `"ljus"`-material en fast gul nyans (`#ffd27a`) utan färgord. Det är också en ommålning och är borttaget.

## Rättelse
- `src/spel/fargning.ts` (ny): beslutet per material. Utan färgord blir det **ingenting**: ingen färg, inget palettbyte och ingen glans.
  Med färgord blir det exakt som förut (palettbyte, farg/ljus, glans), eftersom R9C är pausad.
- `gltfDjur.tsx` använder `fargning()`. Provräknaren `window.__tredFarg` finns bara när ett prov har lagt dit den.
- `egna-farger.mjs` är utan verkan: den skriver bara ut listan. Fältet `egna_farger` får ligga kvar, och paletten behålls så att "en blå jultomte" tar.
  MFIX3 kördes på main (2758471) med det gamla skriptet, så de åtta saknar palett/material. `b64-data.mjs` lägger tillbaka exakt
  det lagg mätte fram för MFIX3-modellerna (MFIX3 omkörd med B6.4 i en simulering, raderna i övrigt identiska):
  jultomte, narval, rörmokare och mekaniker palett; brandman, äventyrare, detektiv och sjöman farg-material. Bara om entiteten är inlagd av R3F-MFIX3 och saknar båda.

## Bevis
- `b6-4.test.ts`: utan färgord blir det ingen färgning för alla kombinationer av roll, palett och glans. Med färgord blir det som förut.
- `b64-prov.mjs`: jultomte, brandman, narval och kraken (om M19 är körd), alla skrivna första gången, alltså med glans.
  Alla material har egen färg och egen textur och inget självlyse, och jultomtens dräkt är röd i pixlarna (röd > 3 × orange).
  "en blå jultomte" ger palettbytt textur och blå pixlar. Med den gamla logiken faller prov-stegen (kontrollerat).
- Bilder: `b64-<ord>.png` och `b64-<ord>-nara.png`.

## Kvar, R9C (ingen ändring här)
- Med färgord och guldord lägger glansen fortfarande sitt gula självlyse över hela kroppen. På "en blå jultomte" blir
  mössan och ärmarna (`#D32F2F`) då orange. Det är nuvarande beteende med färgord och ändras inte, eftersom R9C är pausad.
