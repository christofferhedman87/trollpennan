// B6.6 data (idempotent; textuellt så att de kompakta raderna står kvar):
//  - data/storlek.json "minsta": en sak blir aldrig mindre än 0,45 i sitt största mått eller 0,06 i yta framifrån (högst ×2,5)
//  - data/storlek.json: storlek per byggnadstyp (klasser jatte/liten_byggnad, ids), byggnaderna bakom staketet (rad "bortom",
//    bak.bortom, bak.synlig_x)
//  - data/entiteter.json: "nyckelring" som ord för nyckelknippa (som teve = tv), puck målhöjd 0,4 → 0,3 (även inlagg.json), isglass framAxel +x (bredsidan mot kameran)
//  - package.json: b6-6.test.ts i test:product
import fs from "node:fs";
const logg = (s) => console.log(s);
{
  const p = "data/storlek.json";
  let s = fs.readFileSync(p, "utf8");
  const o = JSON.parse(s);
  if (!o.minsta) {
    s = s.replace(/\n \},\n "kategori": \{/, '\n },\n "minsta": { "_om": "B6.6: ingen sak försvinner i gräset. Skalan höjs (högst max_forstoring, aldrig över klassens tak) tills största måttet och ytan framifrån räcker.", "storlek": 0.45, "yta": 0.06, "max_forstoring": 2.5 },\n "kategori": {');
    logg(JSON.parse(s).minsta ? "storlek.json: minsta" : "VARNING: storlek.json: hittar inte klasser-slutet");
  } else logg("storlek.json: minsta fanns");
  JSON.parse(s);
  fs.writeFileSync(p, s);
}

// B6.6 (Doodle 08:26): storlek per typ och byggnaderna längst bak, bakom staketet
const JATTE = ["slott", "borg", "kyrka", "skyskrapa", "pyramid", "fabrik", "hangar", "slottstorn", "torn", "vattentorn", "vindkraftverk", "hotell"];
const LITEN = ["kiosk", "bajamaja", "koja", "skjul", "honshus", "marknadsstand", "brunn", "gatlykta", "flagga", "garage", "segelskjul", "skorsten"];
{
  const p = "data/storlek.json";
  let s = fs.readFileSync(p, "utf8");
  const E = JSON.parse(fs.readFileSync("data/entiteter.json", "utf8")).entiteter;
  const byt = (gammal, ny, namn) => {
    if (s.includes(ny)) return logg(`storlek.json: ${namn} fanns`);
    if (!s.includes(gammal)) return logg(`VARNING: storlek.json: ${namn} – hittar inte ${gammal.slice(0, 60)}`);
    s = s.replace(gammal, ny);
    logg(`storlek.json: ${namn}`);
  };
  byt('"stor": { "tak": 1.5, "zon": "bak", "kant": 0.85 },', '"stor": { "tak": 1.5, "zon": "bak", "kant": 0.85, "rad": "bortom" },\n  "jatte": { "tak": 1.9, "zon": "bak", "kant": 1.0, "rad": "bortom", "max_halv": 1.3 },\n  "liten_byggnad": { "tak": 1.0, "zon": "bak", "kant": 0.5, "rad": "bortom" },', "klasser jatte/liten_byggnad, stor bortom");
  byt('  "fri_x": [[-1.4, 0.0]]\n }', '  "fri_x": [[-1.4, 0.0]],\n  "_om_bortom": "B6.6: byggnaderna (klass med rad bortom) står bakom staketet i det här djupet, högst längst bak; synlig_x = halva synliga bredden längst bak i stående läge, kroppen ska rymmas. Bakom staketet hålls bara själva grinden fri (bortom.fri_x), den syns framför byggnaderna.",\n  "bortom": { "z": [-3.3, -2.35], "fri_x": [[-1.2, -0.2]] },\n  "synlig_x": 2.9\n }', "bak.bortom, synlig_x");
  const rader = [...JATTE.map((k) => [k, "jatte"]), ...LITEN.map((k) => [k, "liten_byggnad"])].filter(([k]) => E[k] && !new RegExp(`\n  "${k}": "`).test(s));
  if (rader.length) {
    const m = s.match(/\n "ids": \{\n {2}"_om": "[^"]*",\n/);
    if (!m) logg("VARNING: storlek.json: ids-blocket saknas");
    else { s = s.replace(m[0], m[0] + rader.map(([k, c]) => `  "${k}": "${c}",\n`).join("")); logg(`storlek.json: ${rader.length} byggnader i jatte/liten_byggnad`); }
  }
  JSON.parse(s);
  fs.writeFileSync(p, s);
}
{
  const p = "data/entiteter.json";
  let s = fs.readFileSync(p, "utf8");
  const E = JSON.parse(s).entiteter;
  const rad = (id) => s.split("\n").find((r) => r.startsWith(`    "${id}": {`));
  const n = E.nyckelknippa;
  if (n && !(n.ord ?? []).includes("nyckelring")) {
    const r = rad("nyckelknippa");
    if (n.granskad) logg("OBS: nyckelknippa har granskad:true – ordet läggs ändå till (bara ett ord, ingen modell- eller måttändring)");
    if (r && r.includes('"ord": ["nyckelknippa"]')) { s = s.replace(r, r.replace('"ord": ["nyckelknippa"]', '"ord": ["nyckelknippa", "nyckelring"]')); logg("nyckelknippa: ordet nyckelring"); }
    else logg("VARNING: nyckelknippa: oväntad rad, rörs inte");
  } else logg(`nyckelknippa: ${n ? "nyckelring fanns" : "VARNING: saknas"}`);
  const pk = E.puck;
  if (pk && pk.malhojd === 0.4 && !pk.granskad) { const r = rad("puck"); s = s.replace(r, r.replace('"malhojd": 0.4', '"malhojd": 0.3')); logg("puck: målhöjd 0,3"); }
  else logg(`puck: ${pk?.malhojd === 0.3 ? "0,3 fanns" : "VARNING: oväntat läge – rörs inte"}`);
  // isglassen syntes inte på ängen (5 px bred): modellen är 0,075 bred i x och 0,18 i z, så kameran såg pinnen från sidan.
  // framAxel "+x" vänder den bredda sidan mot kameran (ingen storleksändring).
  const ig = E.isglass;
  if (ig && !ig.framAxel && !ig.granskad) { const r = rad("isglass"); s = s.replace(r, r.replace('"malhojd": 0.4,', '"malhojd": 0.4, "framAxel": "+x",')); logg("isglass: framAxel +x"); }
  else logg(`isglass: ${ig?.framAxel === "+x" ? "framAxel +x fanns" : "VARNING: oväntat läge (eller granskad) – rörs inte"}`);
  JSON.parse(s);
  fs.writeFileSync(p, s);
  const q = "data/inlagg.json";
  const t = fs.readFileSync(q, "utf8");
  if (t.includes('    "puck": 0.4,')) { fs.writeFileSync(q, t.replace('    "puck": 0.4,', '    "puck": 0.3,')); JSON.parse(fs.readFileSync(q, "utf8")); logg("inlagg.json: puck 0,3"); }
}
{
  const p = "package.json";
  const s = fs.readFileSync(p, "utf8");
  const m = s.match(/("test:product": "[^"]*)"/);
  if (!m) throw new Error("test:product saknas");
  if (!m[1].includes("src/spel/b6-6.test.ts")) { const ny = s.replace(m[0], `${m[1]} src/spel/b6-6.test.ts"`); JSON.parse(ny); fs.writeFileSync(p, ny); logg("test:product: b6-6.test.ts"); }
}
