#!/usr/bin/env node
// R1B: flyttar nio JSX-block ur Spel() i src/spel/Spel.tsx till komponenter i src/spel/ui/.
// Skriven och provkörd av Arkitekten i en skräpkopia. Kör från repots rot: node rundor/R1-dela-spel/r1b-flytta.mjs
// Alla rad- och textankare kommer från rundor/R1-dela-spel/r1b-plan.json (mätt på R1A-läget, 2 740 rader).
// Skriptet stoppar (exit 2) utan att ändra något om något ankare inte stämmer. Kroppen flyttas ordagrant.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const rot = process.cwd();
const plan = JSON.parse(fs.readFileSync(path.join(rot, "rundor/R1-dela-spel/r1b-plan.json"), "utf8"));
const spelFil = path.join(rot, "src/spel/Spel.tsx");
const uiDir = path.join(rot, "src/spel/ui");
const stopp = (m) => { console.error("STOPP: " + m); process.exit(2); };

const text = fs.readFileSync(spelFil, "utf8");
const rader = text.split("\n");
const antalRader = text.endsWith("\n") ? rader.length - 1 : rader.length;
if (antalRader !== plan.forvantat_rader_spel) stopp(`Spel.tsx har ${antalRader} rader, väntade ${plan.forvantat_rader_spel}`);
for (const f of Object.keys(plan.filer)) if (fs.existsSync(path.join(uiDir, f))) stopp(`src/spel/ui/${f} finns redan (skriptet är redan körd?)`);
const rad = (n) => rader[n - 1];

// 1. Kontrollera alla ankare först.
for (const k of plan.komponenter) {
  if (rad(k.fran).trim() !== k.forst) stopp(`${k.namn}: rad ${k.fran} är "${rad(k.fran).trim()}", väntade "${k.forst}"`);
  if (rad(k.till).trim() !== k.sist) stopp(`${k.namn}: rad ${k.till} är "${rad(k.till).trim()}", väntade "${k.sist}"`);
  if (k.cond) {
    if (rad(k.condRad).trim() !== k.condForst) stopp(`${k.namn}: rad ${k.condRad} är "${rad(k.condRad).trim()}", väntade "${k.condForst}"`);
    if (rad(k.till + 1).trim() !== k.condSist) stopp(`${k.namn}: rad ${k.till + 1} är "${rad(k.till + 1).trim()}", väntade "${k.condSist}"`);
  }
}

// 2. Skriv komponentfilerna.
fs.mkdirSync(uiDir, { recursive: true });
for (const [fil, def] of Object.entries(plan.filer)) {
  let ut = def.import.join("\n") + "\n";
  for (const namn of def.komponenter) {
    const k = plan.komponenter.find((x) => x.namn === namn);
    const typ = `type ${k.namn}Props = {\n${k.props.map((p) => `  ${p.n}: ${p.t};`).join("\n")}\n};\n`;
    const sig = `export function ${k.namn}({ ${k.props.map((p) => p.n).join(", ")} }: ${k.namn}Props) {`;
    const kropp = rader.slice(k.fran - 1, k.till).join("\n");
    ut += `\n${typ}\n${sig}\n  return (\n${k.fragment ? "<>\n" : ""}${kropp}\n${k.fragment ? "</>\n" : ""}  );\n}\n`;
  }
  fs.writeFileSync(path.join(uiDir, fil), ut);
}

// 3. Ersätt blocken i Spel.tsx, nerifrån och upp.
const anrop = (k) => {
  const attr = k.props.map((p) => `${p.n}={${p.n}}`).join(" ");
  return `<${k.namn}${attr ? " " + attr : ""} />`;
};
let ny = rader.slice();
for (const k of [...plan.komponenter].sort((a, b) => b.fran - a.fran)) {
  const forst = k.cond ? k.condRad : k.fran;
  const sist = k.cond ? k.till + 1 : k.till;
  const indrag = rad(forst).match(/^\s*/)[0];
  const rad1 = k.cond ? `${indrag}{${k.cond} ? ${anrop(k)} : null}` : `${indrag}${anrop(k)}`;
  ny.splice(forst - 1, sist - forst + 1, rad1);
}
let nyText = ny.join("\n");

// 4. Rensa importer i Spel.tsx som inte längre används, och lägg till de nya.
const require = createRequire(path.join(rot, "package.json"));
const ts = require("typescript");
function rensa(src) {
  const sf = ts.createSourceFile(spelFil, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const bruk = new Set();
  (function v(n) {
    if (ts.isImportDeclaration(n)) return;
    if (ts.isIdentifier(n)) bruk.add(n.text);
    ts.forEachChild(n, v);
  })(sf);
  const edits = [];
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause) continue;
    const c = st.importClause;
    const namn = c.name && !bruk.has(c.name.text) ? c.name.text : null;
    const els = c.namedBindings && ts.isNamedImports(c.namedBindings) ? c.namedBindings.elements : [];
    const kvar = els.filter((e) => bruk.has(e.name.text));
    if (!namn && kvar.length === els.length) continue;
    const hel = st.getText(sf);
    const flerrad = hel.includes("\n");
    const mod = st.moduleSpecifier.getText(sf);
    const attr = st.attributes ? " " + src.slice(st.attributes.getFullStart(), st.attributes.getEnd()).trim() : "";
    const behallDef = c.name && !namn ? c.name.text : null;
    let ny_;
    if (!behallDef && !kvar.length) ny_ = "";
    else {
      const del = [];
      if (behallDef) del.push(behallDef);
      if (kvar.length) del.push(flerrad ? "{\n" + kvar.map((e) => "  " + e.getText(sf) + ",").join("\n") + "\n}" : "{ " + kvar.map((e) => e.getText(sf)).join(", ") + " }");
      ny_ = `import ${c.isTypeOnly ? "type " : ""}${del.join(", ")} from ${mod}${attr};`;
    }
    edits.push({ a: st.getStart(sf), b: st.getEnd(), t: ny_ });
  }
  edits.sort((x, y) => y.a - x.a);
  let r = src;
  for (const e of edits) {
    let b = e.b;
    if (e.t === "" && r[b] === "\n") b += 1;
    r = r.slice(0, e.a) + e.t + r.slice(b);
  }
  return r;
}
nyText = rensa(nyText);
const nyaImport = [
  'import { AngLager } from "./ui/AngLager.tsx";',
  'import { BokSkarm } from "./ui/BokSkarm.tsx";',
  'import { KopDialog, MossaPanel, SkyltDialog, ValjDjurDialog, VisKortBygg, VisKortDjur } from "./ui/Dialoger.tsx";',
  'import { ForalderDialog } from "./ui/ForalderDialog.tsx";',
  'import { Hud, HudBot, MenyPanel } from "./ui/Hud.tsx";',
  'import { KartaLager, OmradeHud } from "./ui/KartaLager.tsx";',
  'import { OrdbokDialog } from "./ui/OrdbokDialog.tsx";',
].join("\n");
{
  const sf = ts.createSourceFile(spelFil, nyText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const sista = [...sf.statements].filter((s) => ts.isImportDeclaration(s)).pop();
  nyText = nyText.slice(0, sista.getEnd()) + "\n" + nyaImport + nyText.slice(sista.getEnd());
}
fs.writeFileSync(spelFil, nyText);
console.log(`Klart: ${Object.keys(plan.filer).length} filer skrivna, ${plan.komponenter.length} block ersatta, Spel.tsx har nu ${nyText.split("\n").length - 1} rader.`);
