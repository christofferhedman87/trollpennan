// R3F (fixpaket): ändringar i data/inlagg.json som inte bara lägger till. Valfria nycklar i inlagg-tillagg.json:
//   malhojd_ord_ersatt: { "narval": 0.5 }   byter (eller lägger till) målhöjden för ordet
//   rorelse_ord_tillagg: { "sim": ["svan"] } lägger ordet i rörelselistan (och tar bort det ur de andra)
//   kategori_tri: 6000                       nytt tak för trianglar per sak i alla kategorier
// Skriver om bara de berörda raderna; filen ska vara giltig JSON efteråt.
import fs from "node:fs";
const t = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const C = "data/inlagg.json";
let s = fs.readFileSync(C, "utf8");
const ut = [];
const mh = t.malhojd_ord_ersatt ?? {};
if (Object.keys(mh).length) {
  const i = s.indexOf('"malhojd_ord": {'); const j = s.indexOf("}", i); let blk = s.slice(i, j);
  for (const [ord, h] of Object.entries(mh)) {
    const re = new RegExp(`("${ord}": )[0-9.]+`);
    blk = re.test(blk) ? blk.replace(re, `$1${h}`) : blk.replace('"malhojd_ord": {\n', `"malhojd_ord": {\n    "${ord}": ${h},\n`);
  }
  s = s.slice(0, i) + blk + s.slice(j); ut.push(`målhöjder ersatta: ${Object.keys(mh).length}`);
}
for (const [ror, lista] of Object.entries(t.rorelse_ord_tillagg ?? {})) {
  const i = s.indexOf('"rorelse_ord": {'); const j = s.indexOf("\n  }", i); let blk = s.slice(i, j);
  for (const ord of lista) {
    blk = blk.replace(new RegExp(`, "${ord}"(?=[,\\]])`, "g"), "").replace(new RegExp(`"${ord}", `, "g"), "");
    blk = blk.replace(`"${ror}": [`, `"${ror}": ["${ord}", `);
  }
  s = s.slice(0, i) + blk + s.slice(j); ut.push(`rörelseord ${ror}: ${lista.join(", ")}`);
}
if (t.kategori_tri) {
  const i = s.indexOf('"kategorier": {'); const j = s.indexOf("\n  }", i);
  s = s.slice(0, i) + s.slice(i, j).replace(/("tri": )[0-9]+/g, `$1${t.kategori_tri}`) + s.slice(j); ut.push(`tak trianglar per sak: ${t.kategori_tri}`);
}
const j = JSON.parse(s);
for (const [ord, h] of Object.entries(mh)) if (j.malhojd_ord[ord] !== h) throw new Error(`malhojd_ord ${ord} blev fel`);
for (const [ror, lista] of Object.entries(t.rorelse_ord_tillagg ?? {})) for (const ord of lista) if (!j.rorelse_ord[ror].includes(ord) || Object.entries(j.rorelse_ord).some(([k, l]) => k !== ror && l.includes(ord))) throw new Error(`rorelse_ord ${ord} blev fel`);
fs.writeFileSync(C, s);
if (ut.length) console.log(ut.join(", "));
