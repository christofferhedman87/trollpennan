// R3F: granskade böjningsformer (SAOL-mönster, kontrollerade mot SALDO) ersätter lagg-gissningarna i data/ord.json.
// Användning: node rundor/R3F-modellserie/former.mjs <former.tsv> [lagg-ordgranskning.tsv]
// former.tsv: ord<TAB>genus (u/n)<TAB>former, kommaseparerade, grundformen först. Osäker plural utelämnas hellre än gissas.
// Med lagg-ordgranskning.tsv: varje djurord som paketet lade in MÅSTE ha en rad i former.tsv, annars exit 1 (ingen gissad form når barnen).
import fs from "node:fs";
const [ff, gransk] = process.argv.slice(2);
const rader = fs.readFileSync(ff, "utf8").split("\n").filter((r) => r.trim() && !r.startsWith("#") && !r.startsWith("ord\t"));
const F = new Map(rader.map((r) => { const [ord, genus, former] = r.split("\t"); return [ord.trim(), { genus: genus.trim(), former: former.split(",").map((x) => x.trim()).filter(Boolean) }]; }));
for (const [ord, f] of F) {
  if (!["u", "n"].includes(f.genus)) throw new Error(`${ord}: genus måste vara u eller n`);
  if (f.former[0] !== ord) throw new Error(`${ord}: första formen ska vara grundformen`);
  if (new Set(f.former).size !== f.former.length) throw new Error(`${ord}: samma form två gånger`);
}
const saknas = [];
if (gransk && fs.existsSync(gransk)) for (const r of fs.readFileSync(gransk, "utf8").split("\n").slice(1)) { const o = r.split("\t")[0]; if (o && !F.has(o)) saknas.push(o); }
if (saknas.length) { console.log(`STOPP: djurord utan granskade former i ${ff}: ${saknas.join(", ")}`); process.exit(1); }
const d = JSON.parse(fs.readFileSync("data/ord.json", "utf8"));
const alla = new Map(); for (const o of d.ord) for (const f of o.former ?? []) alla.set(f.toLocaleLowerCase("sv"), o.id);
let n = 0; const ok = [];
for (const o of d.ord) {
  const f = F.get(o.id); if (!f || o.klass !== "djur") continue;
  for (const x of f.former) { const ag = alla.get(x); if (ag && ag !== o.id) throw new Error(`${o.id}: formen "${x}" finns redan hos ${ag}`); }
  if (JSON.stringify(o.former) !== JSON.stringify(f.former) || o.genus !== f.genus) n++;
  o.former = f.former; o.genus = f.genus; ok.push(o.id);
}
const ej = [...F.keys()].filter((k) => !ok.includes(k));
fs.writeFileSync("data/ord.json", JSON.stringify(d, null, 1) + "\n");
console.log(`former granskade: ${ok.length} ord, ändrade: ${n}${ej.length ? `, rader utan ord i ord.json: ${ej.join(", ")}` : ""}`);
