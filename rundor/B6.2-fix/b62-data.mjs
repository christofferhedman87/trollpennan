// B6.2: regnbåge och eld som saker – rader i data/entiteter.json och data/tillgangar.json plus modellfilerna i
// public/models/bulk/. Modellerna är Trollpennans egna (paket trollpennan-egna-m16, CC0, redan i LICENSES.md via M16),
// byggda av rundor/R3F-modellserie/M16/egna-m16.mjs; kopior ligger i rundor/B6.2-fix/modeller/.
// Per nyckel och idempotent: en rad läggs bara till om nyckeln saknas; filformatet (en rad per post) behålls.
// Manifest och LICENSES.md rörs inte.   node rundor/B6.2-fix/b62-data.mjs   (exit 0 = klart, 2 = fil saknas/ser fel ut)
import crypto from "node:crypto";
import fs from "node:fs";

const D = "rundor/B6.2-fix/modeller";
const NYA = {
 regnbage: {
  ent: { typ: "natur", kategori: "väder", modell: "regnbage", malhojd: 1.0, art: "#E3F2FD", forladda: false, ord: ["regnbåge"], inlagd: "B6.2" },
  till: { fil: "/models/bulk/regnbage.glb", licens: "CC0-1.0", upphov: "Trollpennan", kalla: "https://github.com/christofferhedman87/trollpennan", paket: "trollpennan-egna-m16", trianglar: 576, bytes: 45232, stil: "nära", inlagd: "B6.2" },
  nyckel: "regnbage", glb: "regnbage.glb", sha: "2c115dfc88d846a661bed62abd8f4c5a3594eb15cdd8c685b8bb3e35f754e419",
 },
 eld: {
  ent: { typ: "natur", kategori: "väder", modell: "eld", malhojd: 0.7, art: "#FFE0B2", forladda: false, ord: ["eld"], inlagd: "B6.2" },
  till: { fil: "/models/bulk/eld.glb", licens: "CC0-1.0", upphov: "Trollpennan", kalla: "https://github.com/christofferhedman87/trollpennan", paket: "trollpennan-egna-m16", trianglar: 100, bytes: 9176, stil: "nära", inlagd: "B6.2" },
  nyckel: "eld", glb: "eld.glb", sha: "b6535ee3e9eb9bc3f1966072dd3d0a8ad8ba54b4040dc588f6e9168fef750713",
 },
};
const andrat = [];
const varningar = [];
const rad = (k, v) => `    ${JSON.stringify(k)}: ${JSON.stringify(v).replace(/^\{/, "{ ").replace(/\}$/, " }").replace(/":/g, "\": ").replace(/,"/g, ", \"")}`;
function laggTill(fil, falt, poster) {
  if (!fs.existsSync(fil)) { console.error(`${fil} saknas`); process.exit(2); }
  let s = fs.readFileSync(fil, "utf8");
  const j = JSON.parse(s);
  if (!j[falt]) { console.error(`${fil}: ${falt} saknas`); process.exit(2); }
  const nya = Object.entries(poster).filter(([k]) => !(k in j[falt]));
  if (!nya.length) return;
  const slut = s.lastIndexOf("\n  }\n}");
  if (slut < 0) { console.error(`${fil}: oväntat slut på filen`); process.exit(2); }
  s = s.slice(0, slut) + ",\n" + nya.map(([k, v]) => rad(k, v)).join(",\n") + s.slice(slut);
  JSON.parse(s);
  fs.writeFileSync(fil, s);
  for (const [k] of nya) andrat.push(`${fil} ${falt}.${k}`);
}
laggTill("data/entiteter.json", "entiteter", Object.fromEntries(Object.entries(NYA).map(([k, v]) => [k, { ...v.ent }])));
laggTill("data/tillgangar.json", "tillgangar", Object.fromEntries(Object.values(NYA).map((v) => [v.nyckel, v.till])));
for (const v of Object.values(NYA)) {
  const ut = `public/models/bulk/${v.glb}`;
  const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
  if (sha(`${D}/${v.glb}`) !== v.sha) { console.error(`${D}/${v.glb}: fel kontrollsumma`); process.exit(2); }
  if (fs.existsSync(ut)) { if (sha(ut) !== v.sha) varningar.push(`${ut} finns redan med annat innehåll, lämnas`); continue; }
  fs.copyFileSync(`${D}/${v.glb}`, ut);
  andrat.push(ut);
}
for (const a of andrat) console.log(`ändrat: ${a}`);
for (const v of varningar) console.log(`VARNING: ${v}`);
console.log(`b62-data: ${andrat.length} ändrade, ${varningar.length} varningar`);
