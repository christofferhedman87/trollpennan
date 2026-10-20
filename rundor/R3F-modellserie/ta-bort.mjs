// R3F (fixpaket): tar bort entiteter ur datan innan lagg lägger in dem igen med ny modell/nya värden. Bara data + modellfilen.
// Användning (från repots rot): node rundor/R3F-modellserie/ta-bort.mjs <bort.txt>   (en entitets-id per rad, # = kommentar)
// Tar bort: data/entiteter.json, data/tillgangar.json, data/fastpunkter.json (kroppar), djurord i data/ord.json med del.kropp = id,
// public/models/bulk/<id>.glb. Rör inte gåtor (data/ledtradar.json), målhöjder eller kategori-ord.json.
import fs from "node:fs";
const ids = fs.readFileSync(process.argv[2], "utf8").split("\n").map((r) => r.replace(/#.*/, "").trim()).filter(Boolean);
const las = (f) => fs.readFileSync(f, "utf8");
const stada = (s) => s.replace(/,(\n\s*\})/g, "$1");
function enRad(fil, avsnitt) {
  let s = las(fil); const fore = Object.keys(JSON.parse(s)[avsnitt]).length;
  for (const id of ids) s = s.replace(new RegExp(`\\n {4}"${id}": \\{.*\\},?(?=\\n)`), "");
  s = stada(s); const j = JSON.parse(s); const efter = Object.keys(j[avsnitt]).length;
  for (const id of ids) if (j[avsnitt][id]) throw new Error(`${fil}: ${id} kunde inte tas bort`);
  fs.writeFileSync(fil, s); return fore - efter;
}
const ent = JSON.parse(las("data/entiteter.json")).entiteter;
for (const id of ids) if (!ent[id]) throw new Error(`okänd entitet: ${id}`);
const nE = enRad("data/entiteter.json", "entiteter");
const nT = enRad("data/tillgangar.json", "tillgangar");
let fp = las("data/fastpunkter.json"); let nF = 0;
for (const id of ids) {
  const m = fp.match(new RegExp(`\\n {2}"${id}": \\{[\\s\\S]*?\\n {2}\\},?(?=\\n)`));
  if (m) { fp = fp.replace(m[0], ""); nF++; }
}
fp = stada(fp); JSON.parse(fp); fs.writeFileSync("data/fastpunkter.json", fp);
const ord = JSON.parse(las("data/ord.json")); const fore = ord.ord.length;
ord.ord = ord.ord.filter((o) => !(o.klass === "djur" && ids.includes(o.del?.kropp)));
fs.writeFileSync("data/ord.json", JSON.stringify(ord, null, 1) + "\n");
let nG = 0; for (const id of ids) { const f = `public/models/bulk/${id}.glb`; if (fs.existsSync(f)) { fs.rmSync(f); nG++; } }
console.log(`borttaget: ${nE} entiteter, ${nT} tillgångar, ${nF} fastpunkter, ${fore - ord.ord.length} djurord, ${nG} modellfiler (${ids.join(", ")})`);
