// B6.5 data (idempotent per nyckel; ändrar bara om det gamla värdet står kvar, annars VARNING):
//  - data/ord.json: attributorden "brinnande", "flammande" (formaga lagor) och "glödande" (formaga aura)
//  - data/egenskaper.json: taggar för formaga lagor
//  - data/entiteter.json: narval och bläckfisk simmar (rorelse "sim"); "teve" pekar på samma modell som "tv"
//  - data/storlek.json: stora möbler (matbordet, soffan, sängen …) står bak med tak (klass "mobel", per id)
//  - package.json: b6-5.test.ts i test:product
//  - eslint.config.mjs: rundor/** ignoreras (rundornas prov-skript är inte produktkod)
import fs from "node:fs";
const las = (p) => fs.readFileSync(p, "utf8");
const json = (p) => JSON.parse(las(p));
const skriv = (p, o, ind = 1) => { const s = JSON.stringify(o, null, ind) + "\n"; JSON.parse(s); fs.writeFileSync(p, s); };
const logg = (s) => console.log(s);

// ord.json – nya rader läggs sist i ord-listan (samma form som "gnistrande")
{
  const p = "data/ord.json";
  const o = json(p);
  const nya = [
    { id: "brinnande", klass: "formaga", niva: "fritt", visa: "brinnande", former: ["brinnande"], bojning: { u: "brinnande", n: "brinnande", pl: "brinnande" }, ordklass: "adjektiv", kalla: "SALDO", del: { formaga: "lagor" } },
    { id: "flammande", klass: "formaga", niva: "fritt", visa: "flammande", former: ["flammande"], bojning: { u: "flammande", n: "flammande", pl: "flammande" }, ordklass: "adjektiv", kalla: "SALDO", del: { formaga: "lagor" } },
    { id: "glödande", klass: "formaga", niva: "fritt", visa: "glödande", former: ["glödande"], bojning: { u: "glödande", n: "glödande", pl: "glödande" }, ordklass: "adjektiv", kalla: "SALDO", del: { formaga: "aura" } },
  ];
  let n = 0;
  for (const r of nya) {
    const fanns = o.ord.find((x) => x.id === r.id || (x.former ?? []).includes(r.id));
    if (fanns) { if (fanns.del?.formaga !== r.del.formaga) logg(`VARNING: ord ${r.id} finns redan (${JSON.stringify(fanns.del)}) – rörs inte`); continue; }
    o.ord.push(r); n++;
  }
  // ord.json skrivs med samma indrag som förut (1 mellanslag)
  if (n) { skriv(p, o, 1); logg(`ord.json: ${n} attributord tillagda`); } else logg("ord.json: attributorden fanns redan");
}
{
  const p = "data/egenskaper.json";
  const o = json(p);
  if (!o.formaga.lagor) { o.formaga.lagor = ["eld", "varm", "lysa"]; skriv(p, o, 1); logg("egenskaper.json: formaga lagor"); } else logg("egenskaper.json: lagor fanns");
}
// entiteter.json radvis (filen har en entitet per rad)
{
  const p = "data/entiteter.json";
  const rader = las(p).split("\n");
  const E = JSON.parse(rader.join("\n")).entiteter;
  const rad = (id) => rader.findIndex((r) => r.startsWith(`    "${id}": {`));
  for (const id of ["narval", "blackfisk"]) {
    const e = E[id];
    if (!e) { logg(`VARNING: ${id} saknas`); continue; }
    if (e.granskad) { logg(`VARNING: ${id} är granskad:true – rörs inte`); continue; }
    if (e.rorelse === "sim") { logg(`${id}: simmar redan`); continue; }
    if (e.rorelse) { logg(`VARNING: ${id} har rorelse ${e.rorelse} – rörs inte`); continue; }
    const i = rad(id);
    const ny = rader[i].replace(/("art": "#[0-9A-Fa-f]+", )/, `$1"rorelse": "sim", `);
    if (ny === rader[i]) { logg(`VARNING: ${id}: hittar inte art på raden`); continue; }
    rader[i] = ny; logg(`${id}: rorelse sim`);
  }
  const tv = E.teve;
  if (tv && tv.modell === "teve" && E.tv?.modell === "tv" && !tv.granskad) {
    const i = rad("teve");
    rader[i] = rader[i].replace('"modell": "teve"', '"modell": "tv"').replace(/"malhojd": [0-9.]+/, `"malhojd": ${E.tv.malhojd}`);
    logg('teve: samma modell som tv ("modell": "tv")');
  } else logg(`teve: ${tv?.modell === "tv" ? "pekar redan på tv" : "VARNING: oväntat läge – rörs inte"}`);
  const ut = rader.join("\n");
  const efter = JSON.parse(ut).entiteter;
  if (Object.keys(efter).length !== Object.keys(E).length) throw new Error("entiteter: antalet ändrades");
  fs.writeFileSync(p, ut);
}
{
  // textuellt, så att B6.3:s kompakta rader står kvar. Stora möbler per id (alla möbler har målhöjd ~0,9 i datan,
  // så kategorin räcker inte: en kudde eller en tavla ska inte stå bak).
  const p = "data/storlek.json";
  const s = las(p);
  const STORA = ["matbord", "bord", "koksbord", "soffbord", "skrivbord", "arbetsbank", "soffa", "hornsoffa", "soffbank", "sang", "dubbelsang", "vaningssang", "bokhylla", "hylla", "skap", "koksskap", "garderob", "byra", "kylskap", "spis", "ugn", "diskbank", "badkar", "dusch", "tvattmaskin", "torktumlare", "kamin", "pendelur", "flipperspel", "arkadspel", "automat", "lyckohjul", "airhockey", "dansmaskin", "dorr"];
  const E = json("data/entiteter.json").entiteter;
  const ids = STORA.filter((id) => E[id]?.kategori === "möbel");
  for (const id of STORA) if (!ids.includes(id)) logg(`VARNING: storlek.json: ${id} är ingen möbel i entiteter.json – utelämnas`);
  if (!json(p).klasser.mobel) {
    const ny = s
      .replace(/("fordon": \{ "tak": [^}]*\})\n/, '$1,\n  "mobel": { "tak": 1.1, "zon": "bak", "kant": 0.6 }\n')
      .replace(/("fordon": "fordon"\n \}),\n/, `$1,\n "ids": {\n  "_om": "B6.5: klass per entitet (före kategorin). Stora möbler står bak så att de inte skymmer småsakerna.",\n${ids.map((id) => `  "${id}": "mobel"`).join(",\n")}\n },\n`);
    const o = JSON.parse(ny);
    if (!o.klasser.mobel || o.ids?.matbord !== "mobel") logg("VARNING: storlek.json: hittar inte fordon-raderna – rörs inte");
    else { fs.writeFileSync(p, ny); logg(`storlek.json: klass mobel för ${ids.length} stora möbler (bak, tak 1,1)`); }
  } else logg("storlek.json: mobel fanns");
}
{
  const p = "package.json";
  const s = las(p);
  const m = s.match(/("test:product": "[^"]*)"/);
  if (!m) throw new Error("test:product saknas");
  if (!m[1].includes("src/spel/b6-5.test.ts")) { const ny = s.replace(m[0], `${m[1]} src/spel/b6-5.test.ts"`); JSON.parse(ny); fs.writeFileSync(p, ny); logg("test:product: b6-5.test.ts"); }
}
{
  const p = "eslint.config.mjs";
  const s = las(p);
  if (!s.includes('"rundor/**"')) {
    const ny = s.replace('      "src/routeTree.gen.ts",\n', '      "src/routeTree.gen.ts",\n      // B6.5: rundornas prov- och dataskript är inte produktkod (varningarna 82 → 123 låg alla här)\n      "rundor/**",\n');
    if (ny === s) logg("VARNING: eslint.config.mjs: hittar inte ignores-listan");
    else { fs.writeFileSync(p, ny); logg("eslint.config.mjs: rundor/** ignoreras"); }
  }
}
