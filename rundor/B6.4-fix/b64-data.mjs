// B6.4: lägger src/spel/b6-4.test.ts sist i package.json test:product (idempotent; fungerar med och utan B6.3).
// Lägger tillbaka MFIX3:s palett/farg-material (borttagna av gamla egna-farger.mjs) så att färgord tar på de åtta igen.
import fs from "node:fs";
const p = "package.json";
const s = fs.readFileSync(p, "utf8");
const m = s.match(/("test:product": "[^"]*)"/);
if (!m) throw new Error("test:product saknas i package.json");
if (m[1].includes("src/spel/b6-4.test.ts")) console.log("test:product: b6-4.test.ts fanns redan");
else {
  const ny = s.replace(m[0], `${m[1]} src/spel/b6-4.test.ts"`);
  JSON.parse(ny);
  fs.writeFileSync(p, ny);
  console.log("test:product: b6-4.test.ts tillagd");
}
// MFIX3 kördes (på main 2758471) med den gamla egna-farger.mjs: paletten/farg-materialet som lagg mätte fram togs bort, så färgord
// tar inte på de åtta. Värdena nedan är exakt vad lagg ger för MFIX3-modellerna (körd igen med B6.4, samma rader i övrigt).
// Läggs tillbaka bara om entiteten är inlagd av R3F-MFIX3 och saknar både palett och material (idempotent), annars VARNING.
const ATER = {
  jultomte: '"palett": { "from": 355, "range": 22, "bodyL": 0.21 }',
  brandman: '"material": { "#9A1218": "farg" }',
  narval: '"palett": { "from": 45, "range": 22, "bodyL": 0.6 }',
  aventyrare: '"material": { "#E6D3A3": "farg" }',
  detektiv: '"material": { "#8D6E63": "farg" }',
  sjoman: '"material": { "#1565C0": "farg" }',
  rormokare: '"palett": { "from": 135, "range": 22, "bodyL": 0.43 }',
  mekaniker: '"palett": { "from": 25, "range": 22, "bodyL": 0.53 }',
};
const ep = "data/entiteter.json";
const rader = fs.readFileSync(ep, "utf8").split("\n");
const fore = JSON.parse(rader.join("\n")).entiteter;
const lagda = [];
for (const [id, del] of Object.entries(ATER)) {
  const e = fore[id];
  if (!e) { console.log(`VARNING: ${id} finns inte i data/entiteter.json`); continue; }
  if (e.palett || e.material) continue;
  if (e.inlagd !== "R3F-MFIX3") { console.log(`VARNING: ${id} saknar palett/material men är inlagd av ${e.inlagd} – rörs inte`); continue; }
  const i = rader.findIndex((r) => r.startsWith(`    "${id}": {`));
  const ny = rader[i].replace(/("malhojd": [0-9.]+, )/, `$1${del}, `);
  if (ny === rader[i]) { console.log(`VARNING: ${id}: hittar inte malhojd på raden – rörs inte`); continue; }
  rader[i] = ny;
  lagda.push(id);
}
if (lagda.length) {
  const ut = rader.join("\n");
  const efter = JSON.parse(ut).entiteter;
  for (const id of lagda) if (!efter[id].palett && !efter[id].material) throw new Error(`${id}: återläggningen tog inte`);
  fs.writeFileSync(ep, ut);
  console.log(`palett/material tillbaka (färgord tar igen): ${lagda.join(", ")}`);
} else console.log("palett/material: inget att lägga tillbaka");
