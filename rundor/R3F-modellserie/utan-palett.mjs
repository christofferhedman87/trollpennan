// R3F: tar bort lagg-paletten för entiteterna i inlagg-tillagg.json "utan_palett" (bara data/entiteter.json, en rad per entitet).
// Med palett målas kroppen om efter art-färgen i spelet; en klarröd modell blev orange/brun (jultomten, MFIX3).
// Användning (från repots rot): node rundor/R3F-modellserie/utan-palett.mjs <inlagg-tillagg.json>
import fs from "node:fs";
const ids = JSON.parse(fs.readFileSync(process.argv[2], "utf8")).utan_palett ?? [];
if (!ids.length) process.exit(0);
const p = "data/entiteter.json";
const rader = fs.readFileSync(p, "utf8").split("\n");
for (const id of ids) {
  const i = rader.findIndex((r) => r.trimStart().startsWith(`"${id}": {`));
  if (i < 0) throw new Error(`utan_palett: ${id} finns inte`);
  rader[i] = rader[i].replace(/"palett": \{[^}]*\}, /, "");
}
const s = rader.join("\n"); const j = JSON.parse(s);
for (const id of ids) if (j.entiteter[id].palett) throw new Error(`utan_palett: ${id} har kvar paletten`);
fs.writeFileSync(p, s);
console.log(`utan palett: ${ids.join(", ")}`);
