#!/usr/bin/env node
// Strukturvakt för runda R1 (dela Spel.tsx). Skriven av Arkitekten, ska kopieras OFÖRÄNDRAD
// till scripts/check-spel-struktur.mjs. Kör: npm run check:struktur
//   node scripts/check-spel-struktur.mjs --steg a   efter körning R1A (typer, data, hjälpfunktioner)
//   node scripts/check-spel-struktur.mjs            efter körning R1B (slutläget, = --steg b)
//   node scripts/check-spel-struktur.mjs --skriv    skriv ny testid-baslinje (används INTE i R1)
// Kontroller (alla måste vara gröna):
//   1. src/spel/Spel.tsx har högst MAX_SPEL rader (steg a: 2800, steg b: 2050)
//   2. mängden data-testid (JSX-attribut) i src/spel/**/*.tsx är identisk med baslinjen
//   3. src/spel/Spel.tsx och src/spel/ui/** har inga oanvända importer
//   4. inga filer i src/spel/ui/ importerar Spel.tsx (ingen cirkulär import)
//   5. alla filer i KRAVD_UI finns
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const STEG = process.argv.includes("--steg") ? process.argv[process.argv.indexOf("--steg") + 1] : "b";
if (STEG !== "a" && STEG !== "b") {
  console.error('--steg måste vara "a" eller "b"');
  process.exit(2);
}
const MAX_SPEL = STEG === "a" ? 2800 : 2050;
const BASLINJE = "rundor/R1-dela-spel/testid-baslinje.json";
const KRAVD_A = ["typer.ts", "spelData.ts", "hjalp.ts", "OnskaAnsikte.tsx", "HoldOppnare.tsx"];
const KRAVD_B = [
  "AngLager.tsx",
  "KartaLager.tsx",
  "Hud.tsx",
  "BokSkarm.tsx",
  "Dialoger.tsx",
  "OrdbokDialog.tsx",
  "ForalderDialog.tsx",
];
const KRAVD_UI = STEG === "a" ? KRAVD_A : [...KRAVD_A, ...KRAVD_B];
const rot = process.cwd();
const spelDir = path.join(rot, "src/spel");
const uiDir = path.join(spelDir, "ui");

function filer(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  const ut = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) ut.push(...filer(p, ext));
    else if (ext.some((x) => e.name.endsWith(x))) ut.push(p);
  }
  return ut.sort();
}
function tolka(fil) {
  const kalla = fs.readFileSync(fil, "utf8");
  const typ = fil.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return ts.createSourceFile(fil, kalla, ts.ScriptTarget.Latest, true, typ);
}
function testids() {
  const rakna = {};
  for (const fil of filer(spelDir, [".tsx"])) {
    const sf = tolka(fil);
    (function besok(n) {
      if (ts.isJsxAttribute(n) && n.name.getText() === "data-testid" && n.initializer) {
        const nyckel = n.initializer.getText();
        rakna[nyckel] = (rakna[nyckel] ?? 0) + 1;
      }
      ts.forEachChild(n, besok);
    })(sf);
  }
  return Object.fromEntries(Object.entries(rakna).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}
function oanvandaImporter(fil) {
  const sf = tolka(fil);
  const namn = [];
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause) continue;
    const c = st.importClause;
    if (c.name) namn.push(c.name.text);
    if (c.namedBindings) {
      if (ts.isNamespaceImport(c.namedBindings)) namn.push(c.namedBindings.name.text);
      else for (const e of c.namedBindings.elements) namn.push(e.name.text);
    }
  }
  const anvanda = new Set();
  (function besok(n) {
    if (ts.isImportDeclaration(n)) return;
    if (ts.isIdentifier(n)) anvanda.add(n.text);
    ts.forEachChild(n, besok);
  })(sf);
  return namn.filter((n) => !anvanda.has(n));
}
function radantal(fil) {
  const s = fs.readFileSync(fil, "utf8");
  return s.split("\n").length - (s.endsWith("\n") ? 1 : 0);
}

const nu = testids();
if (process.argv.includes("--skriv")) {
  fs.mkdirSync(path.dirname(path.join(rot, BASLINJE)), { recursive: true });
  fs.writeFileSync(path.join(rot, BASLINJE), JSON.stringify(nu, null, 2) + "\n");
  console.log(`Skrev ${BASLINJE}: ${Object.keys(nu).length} olika data-testid, ${Object.values(nu).reduce((a, b) => a + b, 0)} förekomster.`);
  process.exit(0);
}

const fel = [];
const spel = path.join(spelDir, "Spel.tsx");
const rader = radantal(spel);
if (rader > MAX_SPEL) fel.push(`Spel.tsx har ${rader} rader, gränsen är ${MAX_SPEL}. Flytta ut mer enligt rundor/R1-dela-spel/RITNING.md.`);

const bas = JSON.parse(fs.readFileSync(path.join(rot, BASLINJE), "utf8"));
for (const k of new Set([...Object.keys(bas), ...Object.keys(nu)])) {
  if ((bas[k] ?? 0) !== (nu[k] ?? 0)) fel.push(`data-testid ${k}: baslinje ${bas[k] ?? 0}, nu ${nu[k] ?? 0}. Ett testid får varken försvinna, dyka upp eller ändras i R1.`);
}

const ui = filer(uiDir, [".ts", ".tsx"]);
for (const fil of [spel, ...ui]) {
  const ov = oanvandaImporter(fil);
  if (ov.length) fel.push(`${path.relative(rot, fil)}: oanvända importer: ${ov.join(", ")}. Ta bort dem.`);
}
for (const fil of ui) {
  const kalla = fs.readFileSync(fil, "utf8");
  if (/from\s+["'](\.\.\/Spel|\.\.\/Spel\.tsx|\.\/Spel|\.\/Spel\.tsx)["']/.test(kalla)) fel.push(`${path.relative(rot, fil)} importerar Spel.tsx (cirkulär import). Flytta typen eller funktionen till ui/typer.ts eller ui/hjalp.ts.`);
}
for (const f of KRAVD_UI) if (!fs.existsSync(path.join(uiDir, f))) fel.push(`src/spel/ui/${f} saknas.`);

console.log(`steg ${STEG}: Spel.tsx: ${rader} rader (gräns ${MAX_SPEL}); data-testid: ${Object.keys(nu).length} olika, ${Object.values(nu).reduce((a, b) => a + b, 0)} förekomster; ui-filer: ${ui.length}`);
if (fel.length) {
  console.error("\ncheck:struktur RÖD:\n- " + fel.join("\n- "));
  process.exit(1);
}
console.log("check:struktur GRÖN");
