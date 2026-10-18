// R3C: skriver listan till kontaktark.mjs ur data/entiteter.json (alla rader med inlagd: "R3C").
// Användning: node rundor/R3C-bulkrutin/lista.mjs --ut /tmp/r3c-lista.json
import fs from "node:fs";
import path from "node:path";

const i = process.argv.indexOf("--ut");
const ut = i >= 0 ? process.argv[i + 1] : "/tmp/r3c-lista.json";
const ent = JSON.parse(fs.readFileSync("data/entiteter.json", "utf8")).entiteter;
const lista = Object.entries(ent)
  .filter(([, v]) => v.inlagd === "R3C")
  .map(([k, v]) => ({ fil: path.resolve("public/models/bulk", `${v.modell}.glb`), etikett: k + (v.framAxel ? ` ${v.framAxel}` : ""), axel: v.framAxel ?? "+z" }));
fs.writeFileSync(ut, JSON.stringify(lista));
console.log(`${lista.length} modeller → ${ut}`);
