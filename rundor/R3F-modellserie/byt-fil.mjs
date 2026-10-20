// R3F (fixpaket): byter BARA modellfilen för befintliga entiteter, utan att röra deras ord, gåtor, inlagg-data eller "inlagd".
// Används när entiteten lades in av en annan runda (t.ex. eld från B6.2) och bort + lagg skulle tappa den rundans data.
// inlagg-tillagg.json: "byt_fil": { "eld": "trollpennan-mfix4/eld-egen.glb" }  (sökväg i inkorgen)
// Gör: samma optimeringskedja som lagg → public/models/bulk/<id>.glb, uppdaterar raden i data/tillgangar.json
// (paket, trianglar, bytes), skriver om CREDITS.md och LICENSES.md. Stopp om filen saknas eller är över kategorins tak.
// MFIX6: målhöjder från malhojd_ord_ersatt (som inlagg-ersatt.mjs redan fört in i data/inlagg.json) förs också till
// data/entiteter.json "malhojd" för varje entitet vars ord berörs (lagg sätter den bara när entiteten läggs in;
// därför slog MFIX5:s väggklocka 0,8 aldrig igenom). Värdet blir som i lagg: största målhöjden bland entitetens ord.
// Användning (från repots rot): node rundor/R3F-modellserie/byt-fil.mjs <inlagg-tillagg.json> <inkorg>
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { optimera, matt, byggKontext, licenser } from "../../scripts/modell-inlagg.mjs";
const [tf, ink] = process.argv.slice(2);
const T = JSON.parse(fs.readFileSync(tf, "utf8"));
const byt = T.byt_fil ?? {};
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
// Målhöjder till entiteterna (bara entiteter vars ord finns i malhojd_ord_ersatt; ord och övrig data orörda)
const ersatt = Object.keys(T.malhojd_ord_ersatt ?? {});
if (ersatt.length) {
  const mo = JSON.parse(fs.readFileSync("data/inlagg.json", "utf8")).malhojd_ord ?? {};
  const ep = "data/entiteter.json";
  const er = fs.readFileSync(ep, "utf8").split("\n");
  for (const [id, e] of Object.entries(ent)) {
    const ord = e.ord ?? [];
    if (!ord.some((w) => ersatt.includes(w))) continue;
    const h = +Math.max(...ord.map((w) => mo[w] ?? 0)).toFixed(2);
    if (!(h > 0) || h === e.malhojd) continue;
    const i = er.findIndex((x) => x.trimStart().startsWith(`"${id}": {`));
    if (i < 0 || !/"malhojd": [0-9.]+/.test(er[i])) throw new Error(`malhojd: ${id} hittas inte på en rad i ${ep}`);
    er[i] = er[i].replace(/"malhojd": [0-9.]+/, `"malhojd": ${h}`);
    console.log(`målhöjd: ${id} ${e.malhojd} → ${h}`);
  }
  const es = er.join("\n"); JSON.parse(es); fs.writeFileSync(ep, es);
}
