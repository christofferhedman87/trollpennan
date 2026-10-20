// R3F: entiteterna i inlagg-tillagg.json "egna_farger" behåller modellens egna färger i spelet: lagg-paletten och farg-materialet tas bort
// (bara data/entiteter.json, en rad per entitet). Utan färgord målar spelet annars kroppen (palett) eller det utpekade materialet med
// art-färgen: jultomtens röda dräkt blev orange/brun, brandmannens hjälm laxrosa och narvalen blek (provat i spelet, MFIX3).
// Användning (från repots rot): node rundor/R3F-modellserie/egna-farger.mjs <inlagg-tillagg.json>
import fs from "node:fs";
const ids = JSON.parse(fs.readFileSync(process.argv[2], "utf8")).egna_farger ?? [];
if (!ids.length) process.exit(0);
const p = "data/entiteter.json";
const rader = fs.readFileSync(p, "utf8").split("\n");
for (const id of ids) {
  const i = rader.findIndex((r) => r.trimStart().startsWith(`"${id}": {`));
  if (i < 0) throw new Error(`egna_farger: ${id} finns inte`);
  rader[i] = rader[i].replace(/"palett": \{[^}]*\}, /, "").replace(/"material": \{[^}]*\}, /, "");
}
const s = rader.join("\n"); const j = JSON.parse(s);
for (const id of ids) if (j.entiteter[id].palett || j.entiteter[id].material) throw new Error(`egna_farger: ${id} har kvar palett eller material`);
fs.writeFileSync(p, s);
console.log(`egna färger (ingen palett, inget farg-material): ${ids.join(", ")}`);
