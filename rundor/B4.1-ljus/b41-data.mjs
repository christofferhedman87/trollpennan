// B4.1: vilka saker som lyser står i data/platser.json, per plats: `miljo.ljuskalla_skapad.entiteter` (entitets-id:n i
// data/entiteter.json). Läggs in per nyckel (inte som diff) så att modellpaketen M10–M13 kan ha ändrat filen. Idempotent.
// En plats som redan har en egen lista lämnas orörd.
//   node rundor/B4.1-ljus/b41-data.mjs     (exit 0 = klart, 2 = platsen eller ljuskällan saknas)
import fs from "node:fs";

const FIL = "data/platser.json";
const LYSER = { grottan: ["lykta", "lampa", "golvlampa", "bordslampa", "ljusslinga", "ljus", "fackla", "lagereld", "kristall"] };
const s = fs.readFileSync(FIL, "utf8");
const j = JSON.parse(s);
const ent = JSON.parse(fs.readFileSync("data/entiteter.json", "utf8")).entiteter;
const andrat = [];
for (const [id, lista] of Object.entries(LYSER)) {
  const p = j.platser.find((x) => x.id === id);
  const l = p?.miljo?.ljuskalla_skapad;
  if (!l) { console.error(`STOPP: ${FIL} ${id}.miljo.ljuskalla_skapad saknas`); process.exit(2); }
  if (Array.isArray(l.entiteter)) continue;
  l.entiteter = lista.filter((e) => ent[e]);
  const borta = lista.filter((e) => !ent[e]);
  if (borta.length) console.log(`VARNING: finns inte i entiteter.json, hoppas över: ${borta.join(", ")}`);
  andrat.push(`${id}.miljo.ljuskalla_skapad.entiteter (${l.entiteter.length})`);
}
if (andrat.length) fs.writeFileSync(FIL, JSON.stringify(j, null, 1) + (s.endsWith("\n") ? "\n" : ""));
console.log(`b41-data: ${andrat.length ? andrat.join(", ") : "redan inlagt"}`);
