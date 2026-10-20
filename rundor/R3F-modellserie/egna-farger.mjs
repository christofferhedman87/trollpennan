// R3F: inlagg-tillagg.json "egna_farger" är UTAN VERKAN sedan B6.4. Fältet togs fram i MFIX3 för att jultomten blev orange,
// brandmannens hjälm laxrosa och narvalen blek utan färgord. Rotorsaken låg i spelet (gltfDjur.tsx/fargning.ts: guldordets glans
// lades som varmgult självlyse över hela kroppen, och "ljus"-material fick en fast gul nyans, också utan färgord) och är rättad där.
// Paletten och farg-materialet behövs för färgord ("en blå jultomte"), så de tas inte längre bort. Fältet får ligga kvar.
// Användning (från repots rot): node rundor/R3F-modellserie/egna-farger.mjs <inlagg-tillagg.json>
import fs from "node:fs";
const ids = JSON.parse(fs.readFileSync(process.argv[2], "utf8")).egna_farger ?? [];
if (ids.length) console.log(`egna_farger utan verkan (B6.4: spelet visar alltid modellens egna färger utan färgord): ${ids.join(", ")}`);
