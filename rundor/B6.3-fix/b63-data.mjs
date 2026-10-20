// B6.3: data för (H) uppmaningens längd, (I) ängens dammzon och (J) den bakre zonen för stora saker.
// Per nyckel och idempotent: varje ändring görs bara om det gamla värdet står kvar exakt; annars VARNING och filen lämnas.
// Filformaten behålls (platser.json och aterkoppling.json: JSON med indrag 1; storlek.json: bara bak-blocket byts).
//   node rundor/B6.3-fix/b63-data.mjs   (exit 0 = klart, 2 = fil saknas/ser fel ut)
import fs from "node:fs";

const andrat = [];
const varningar = [];
const las = (f) => {
  if (!fs.existsSync(f)) { console.error(`${f} saknas`); process.exit(2); }
  return fs.readFileSync(f, "utf8");
};
const lika = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// (H) aterkoppling.json: kan_inte_rita_ms
{
  const f = "data/aterkoppling.json";
  const s = las(f);
  const j = JSON.parse(s);
  if (j.kan_inte_rita_ms === undefined) {
    if (JSON.stringify(j, null, 1) + "\n" !== s) varningar.push(`${f}: oväntat format, lämnas`);
    else {
      j._om_ms = "B6.3 (H): uppmaningen står minst så här länge (ms, aldrig under 5000) eller tills barnet trycker på den.";
      j.kan_inte_rita_ms = 6000;
      fs.writeFileSync(f, JSON.stringify(j, null, 1) + "\n");
      andrat.push(`${f} kan_inte_rita_ms`);
    }
  }
}

// (I) platser.json: ängens zoner (land + dammen) och kantmarginal
{
  const f = "data/platser.json";
  const s = las(f);
  const j = JSON.parse(s);
  const ang = j.platser?.find((p) => p.id === "ang");
  if (!ang) { console.error(`${f}: ängen saknas`); process.exit(2); }
  const zoner = [
    { id: "angen", typ: "land", rekt: [0, 0, 1, 1] },
    { id: "damm", typ: "vattenyta", rekt: [0.5251, 0.6402, 0.6154, 0.7506] },
  ];
  if (lika(ang.zoner, zoner) && ang.kant_marginal === 0.28) { /* redan gjort */ }
  else if (!lika(ang.zoner, [])) varningar.push(`${f}: ängens zoner är inte tomma längre, lämnas (${JSON.stringify(ang.zoner).slice(0, 80)})`);
  else if (JSON.stringify(j, null, 1) + "\n" !== s) varningar.push(`${f}: oväntat format, lämnas`);
  else {
    ang.zoner = zoner;
    ang.kant_marginal = 0.28;
    fs.writeFileSync(f, JSON.stringify(j, null, 1) + "\n");
    andrat.push(`${f} ang.zoner`, `${f} ang.kant_marginal`);
  }
}

// (J) storlek.json: bak.platser (en rad) → bak.zon med spridning, min_avstand och fri_x (grinden syns alltid)
{
  const f = "data/storlek.json";
  let s = las(f);
  const j = JSON.parse(s);
  const gamla = [[-1.6, -1.3], [1.6, -1.3], [-0.8, -1.4], [0.8, -1.4], [0, -1.45], [-2.2, -1.1], [2.2, -1.1]];
  if (j.bak?.zon) { /* redan gjort */ }
  else if (!lika(j.bak?.platser, gamla)) varningar.push(`${f}: bak.platser har ändrats, lämnas`);
  else {
    const start = s.indexOf(' "bak": {');
    const slut = s.lastIndexOf("\n }\n}");
    if (start < 0 || slut < start) { console.error(`${f}: oväntat format`); process.exit(2); }
    const bak = ` "bak": {
  "_om": "B6.3 (J): stora saker sprids i den bakre zonen (x, z i ängens koordinater; djurens platser har z ≥ -0.15), med slumpat men fast läge per skapelse (uid), ingen rad. min_avstand mellan två stora saker; kant (per klass) = sakens halva bredd, så långt från vattnet står den; fri_x = sträckor i x där ingen stor sak får ha sin mitt (grinden och mitten av staketet syns alltid, med sakens halva bredd inräknad). Saker på ängen hålls också borta från dammen (platser.json, ängens zon 'damm').",
  "zon": { "x": [-2.7, 2.7], "z": [-1.9, -1.15] },
  "min_avstand": 0.95,
  "fri_x": [[-1.4, 0.0]]`;
    s = s.slice(0, start) + bak + s.slice(slut);
    const k = JSON.parse(s);
    if (!k.bak.zon || k.bak.platser) { console.error(`${f}: bytet blev fel`); process.exit(2); }
    fs.writeFileSync(f, s);
    andrat.push(`${f} bak`);
  }
}
// (J) storlek.json: kant per klass = sakens halva bredd; så långt från vattnet håller sig en stor sak (dammen på ängen, sjön …)
{
  const f = "data/storlek.json";
  let s = las(f);
  for (const [klass, gammal, kant] of [["stor", '"stor": { "tak": 1.5, "zon": "bak" }', 0.85], ["fordon", '"fordon": { "tak": 1.1, "zon": "bak" }', 0.65]]) {
    if (JSON.parse(s).klasser?.[klass]?.kant !== undefined) continue;
    if (!s.includes(gammal)) { varningar.push(`${f}: klasser.${klass} har ändrats, lämnas`); continue; }
    s = s.replace(gammal, gammal.replace(' }', `, "kant": ${kant} }`));
    JSON.parse(s);
    fs.writeFileSync(f, s);
    andrat.push(`${f} klasser.${klass}.kant`);
  }
}
// package.json: b6-3.test.ts sist i test:product (textuellt, så att andra rundors tillägg står kvar)
{
  const f = "package.json";
  let s = las(f);
  if (!s.includes("src/spel/b6-3.test.ts")) {
    const m = s.match(/("test:product": "[^"]*)"/);
    if (!m) varningar.push(`${f}: test:product saknas, lämnas`);
    else {
      s = s.replace(m[0], `${m[1]} src/spel/b6-3.test.ts"`);
      JSON.parse(s);
      fs.writeFileSync(f, s);
      andrat.push(`${f} test:product + b6-3.test.ts`);
    }
  }
}
for (const a of andrat) console.log(`ändrat: ${a}`);
for (const v of varningar) console.log(`VARNING: ${v}`);
console.log(`b63-data: ${andrat.length} ändrade, ${varningar.length} varningar`);
