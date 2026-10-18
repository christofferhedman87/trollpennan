#!/usr/bin/env node
// Bevis för R1B som inte kräver att spelet körs: (1) varje flyttad komponents kropp är BYTE-LIK med de ursprungliga
// raderna i Spel.tsx vid basen (plan.bas), (2) i resten av Spel() är ingenting ändrat förutom att blocken ersatts av
// exakt ett anrop var, (3) varje anrop skickar varje prop som namn={namn}. Täcker även dialoger som DOM-turen inte når
// (skylt, mossa, uppdragsvyn m.fl.). Läser bara. Kör från repots rot: node rundor/R1-dela-spel/r1b-ordagrant.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const rot = process.cwd();
const plan = JSON.parse(fs.readFileSync(path.join(rot, "rundor/R1-dela-spel/r1b-plan.json"), "utf8"));
const orig = execFileSync("git", ["show", `${plan.bas}:src/spel/Spel.tsx`], { cwd: process.env.GIT_KATALOG ?? rot, encoding: "utf8", maxBuffer: 1 << 26 }).split("\n");
const nu = fs.readFileSync(path.join(rot, "src/spel/Spel.tsx"), "utf8").split("\n");
const fel = [];
let ok = 0;
// (1) kroppar
for (const k of plan.komponenter) {
  const fp = path.join(rot, "src/spel/ui", k.fil);
  if (!fs.existsSync(fp)) { fel.push(`${k.namn}: src/spel/ui/${k.fil} saknas`); continue; }
  const f = fs.readFileSync(fp, "utf8");
  const start = f.indexOf(`export function ${k.namn}(`);
  if (start < 0) { fel.push(`${k.namn}: finns inte i ui/${k.fil}`); continue; }
  const a = f.indexOf("  return (\n", start) + "  return (\n".length;
  const slut = f.indexOf("\n  );\n}\n", a);
  let kropp = f.slice(a, slut);
  if (k.fragment) kropp = kropp.replace(/^<>\n/, "").replace(/\n<\/>$/, "");
  const vantat = orig.slice(k.fran - 1, k.till).join("\n");
  if (kropp === vantat) ok++; else fel.push(`${k.namn}: kroppen i ui/${k.fil} skiljer sig från ${plan.bas}:src/spel/Spel.tsx r.${k.fran}–${k.till}`);
}
// (2) och (3) resten av Spel()
const anrop = (k) => `<${k.namn}${k.props.length ? " " + k.props.map((p) => `${p.n}={${p.n}}`).join(" ") : ""} />`;
const rad1 = (k) => (k.cond ? `{${k.cond} ? ${anrop(k)} : null}` : anrop(k));
const borttag = new Set();
for (const k of plan.komponenter) for (let i = k.cond ? k.condRad : k.fran; i <= (k.cond ? k.till + 1 : k.till); i++) borttag.add(i);
const spelStart = (a) => a.findIndex((l) => l.startsWith("export function Spel() {"));
const o = orig.map((l, i) => [i + 1, l]).filter(([n]) => n >= spelStart(orig) + 1 && !borttag.has(n)).map(([, l]) => l);
const anropsrader = new Set(plan.komponenter.map((k) => rad1(k)));
const funna = new Map();
const n = nu.slice(spelStart(nu)).filter((l) => {
  if (anropsrader.has(l.trim())) { funna.set(l.trim(), (funna.get(l.trim()) ?? 0) + 1); return false; }
  return true;
});
for (const k of plan.komponenter) if (funna.get(rad1(k)) !== 1) fel.push(`${k.namn}: väntade exakt ett anrop \`${rad1(k)}\`, hittade ${funna.get(rad1(k)) ?? 0}`);
if (o.length !== n.length) fel.push(`Spel() utanför blocken har ${n.length} rader nu men ${o.length} vid ${plan.bas}`);
else for (let i = 0; i < o.length; i++) if (o[i] !== n[i]) { fel.push(`Spel() utanför blocken skiljer sig: nu "${n[i].trim().slice(0, 80)}" mot "${o[i].trim().slice(0, 80)}" (rad ${i + 1} efter Spel()-start)`); break; }
console.log(`r1b-ordagrant: ${ok}/${plan.komponenter.length} kroppar byte-lika; Spel() utanför blocken: ${o.length} rader jämförda`);
if (fel.length) { console.log("RÖD:\n- " + fel.join("\n- ")); process.exit(1); }
console.log("GRÖN");
