// R3D: skriver listan till kontaktark.mjs (rundor/R3C-bulkrutin) ur data/entiteter.json: alla rader med inlagd === runda.
// Användning: node rundor/R3D-bulk-2/lista.mjs --ut /tmp/r3d-lista.json [--runda R3D]
import fs from "node:fs";
import path from "node:path";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const ut = arg("ut", "/tmp/r3d-lista.json");
const runda = arg("runda", "R3D");
const ent = JSON.parse(fs.readFileSync("data/entiteter.json", "utf8")).entiteter;
const lista = Object.entries(ent)
  .filter(([, v]) => v.inlagd === runda)
  .map(([k, v]) => ({ fil: path.resolve("public/models/bulk", `${v.modell}.glb`), etikett: k + (v.framAxel ? ` ${v.framAxel}` : ""), axel: v.framAxel ?? "+z" }));
fs.writeFileSync(ut, JSON.stringify(lista));
console.log(`${lista.length} modeller (${runda}) → ${ut}`);
