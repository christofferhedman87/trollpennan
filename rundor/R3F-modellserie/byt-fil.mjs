// R3F (fixpaket): byter BARA modellfilen för befintliga entiteter, utan att röra deras ord, gåtor, inlagg-data eller "inlagd".
// Används när entiteten lades in av en annan runda (t.ex. eld från B6.2) och bort + lagg skulle tappa den rundans data.
// inlagg-tillagg.json: "byt_fil": { "eld": "trollpennan-mfix4/eld-egen.glb" }  (sökväg i inkorgen)
// Gör: samma optimeringskedja som lagg → public/models/bulk/<id>.glb, uppdaterar raden i data/tillgangar.json
// (paket, trianglar, bytes), skriver om CREDITS.md och LICENSES.md. Stopp om filen saknas eller är över kategorins tak.
// Användning (från repots rot): node rundor/R3F-modellserie/byt-fil.mjs <inlagg-tillagg.json> <inkorg>
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { optimera, matt, byggKontext, licenser } from "../../scripts/modell-inlagg.mjs";
const [tf, ink] = process.argv.slice(2);
const byt = JSON.parse(fs.readFileSync(tf, "utf8")).byt_fil ?? {};
if (!Object.keys(byt).length) process.exit(0);
const ctx = byggKontext(".");
const ent = JSON.parse(fs.readFileSync("data/entiteter.json", "utf8")).entiteter;
const tp = "data/tillgangar.json";
let rader = fs.readFileSync(tp, "utf8").split("\n");
for (const [id, rel] of Object.entries(byt)) {
  const src = path.join(ink, rel);
  if (!ent[id]) throw new Error(`byt_fil: entiteten ${id} finns inte`);
  if (!fs.existsSync(src)) throw new Error(`byt_fil: ${src} saknas`);
  const tak = ctx.cfg.kategorier[ent[id].kategori]?.tri ?? 6000;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "byt-"));
  const ut = path.join(tmp, "ut.glb");
  const r = await optimera(src, ut, tmp, ctx.cfg.kedja.texturstorlek, ctx.cfg);
  if (r.fel) throw new Error(`byt_fil ${id}: ${r.fel}`);
  const m = await matt(ut);
  if (m.tri > tak) throw new Error(`byt_fil ${id}: ${m.tri} trianglar (tak ${tak})`);
  const bytes = fs.statSync(ut).size;
  fs.copyFileSync(ut, `public/models/bulk/${id}.glb`);
  fs.rmSync(tmp, { recursive: true, force: true });
  const i = rader.findIndex((x) => x.trimStart().startsWith(`"${id}": {`));
  if (i < 0) throw new Error(`byt_fil: ${id} saknas i ${tp}`);
  rader[i] = rader[i].replace(/"paket": "[^"]*"/, `"paket": "${rel.split("/")[0]}"`).replace(/"trianglar": [0-9]+/, `"trianglar": ${m.tri}`).replace(/"bytes": [0-9]+/, `"bytes": ${bytes}`);
  console.log(`fil bytt: ${id} ← ${rel} (${m.tri} trianglar, ${Math.round(bytes / 1024)} KB; ord och data orörda)`);
}
const s = rader.join("\n"); JSON.parse(s); fs.writeFileSync(tp, s);
licenser(".");
