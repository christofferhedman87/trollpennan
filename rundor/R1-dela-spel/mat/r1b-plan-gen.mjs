// Genererar rundor/R1-dela-spel/r1b-plan.json (utan 'bas', 'filer' och rubrikimporter; det slutför Arkitektens gen_plan) från src/spel/Spel.tsx vid 89fd859.
// Läser bara. Körs från repots rot: node rundor/R1-dela-spel/mat/r1b-plan-gen.mjs rundor/R1-dela-spel/mat/r1b-spec.json > plan0.json
// r1b-spec.json = vilka block (radnummer vid 89fd859) som ska bli komponenter; typerna och namnen mäts med kompilatorn.
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
const root = process.cwd();
const require = createRequire(path.join(root, "package.json"));
const ts = require("typescript");
const cfg = ts.getParsedCommandLineOfConfigFile(path.join(root, "tsconfig.pages.json"), {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: (d) => console.error(d.messageText) });
const file = path.join(root, "src/spel/Spel.tsx");
const prog = ts.createProgram({ rootNames: [file], options: cfg.options });
const sf = prog.getSourceFile(file);
const chk = prog.getTypeChecker();
const lines = fs.readFileSync(file, "utf8").split("\n");
const line = (p) => sf.getLineAndCharacterOfPosition(p).line + 1;
let spel; sf.forEachChild((n) => { if (ts.isFunctionDeclaration(n) && n.name?.text === "Spel") spel = n; });
function declStmt(d) { let n = d; if (ts.isBindingElement(d)) { let v = d; while (v && !ts.isVariableDeclaration(v)) v = v.parent; n = v; } return ts.isVariableDeclaration(n) ? n.parent.parent : n; }
function kind(sym) { const d = sym.declarations?.[0]; if (!d) return null; if (d.getSourceFile() !== sf) return "annan"; if (ts.isImportSpecifier(d) || ts.isImportClause(d) || ts.isNamespaceImport(d)) return "import"; const s = declStmt(d); if (s.parent === spel.body) return "spel"; if (s.parent === sf) return "modul"; return "lokal"; }
const SPEC = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const flags = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;
function find(rad) { let el; (function v(n) { if (!el && (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) && line(n.getStart()) === rad) el = n; ts.forEachChild(n, v); })(spel); return el; }
function scan(ranges) {
  const props = new Map(), imps = new Map();
  (function v(n) {
    if (ts.isIdentifier(n) && ranges.some(([a, b]) => line(n.getStart()) >= a && line(n.getStart()) <= b)) {
      const p = n.parent;
      const skip = (ts.isPropertyAccessExpression(p) && p.name === n) || (ts.isPropertyAssignment(p) && p.name === n) || (ts.isJsxAttribute(p) && p.name === n) || ts.isJsxClosingElement(p) || (ts.isParameter(p) && p.name === n) || (ts.isBindingElement(p) && p.name === n) || (ts.isPropertySignature(p) && p.name === n);
      if (!skip) {
        const sym = ts.isShorthandPropertyAssignment(p) ? chk.getShorthandAssignmentValueSymbol(p) : chk.getSymbolAtLocation(n);
        if (sym) {
          const k = kind(sym);
          if (k === "spel") props.set(n.text, sym);
          if (k === "import") imps.set(n.text, sym);
          if (k === "modul") throw new Error("modulnivå-namn kvar i Spel.tsx: " + n.text);
        }
      }
    }
    ts.forEachChild(n, v);
  })(sf);
  return { props, imps };
}
const out = [];
for (const s of SPEC) {
  let fran, till, cond = null, condRad = null;
  if (s.fragment) { fran = s.fran; till = s.till; }
  else if (s.cond) {
    const l0 = s.cond; const je = (() => { let h; (function v(n) { if (!h && ts.isJsxExpression(n) && line(n.getStart()) === l0) h = n; ts.forEachChild(n, v); })(spel); return h; })();
    const e = je.expression; const inner = e.whenTrue.expression ?? e.whenTrue;
    fran = line(inner.getStart()); till = line(inner.getEnd()); cond = e.condition.getText(); condRad = l0;
  } else { const el = find(s.rad); fran = line(el.getStart()); till = line(el.getEnd()); }
  const { props, imps } = scan([[fran, till]]);
  const pl = [...props].map(([n, sym]) => {
    let t = chk.getTypeOfSymbolAtLocation(sym, sym.declarations[0]);
    let ts_ = chk.typeToString(t, spel, flags);
    if (s.nonNull?.includes(n)) ts_ = ts_.replace(/ \| null$/, "");
    if (s.typ?.[n]) ts_ = s.typ[n];
    return { n, t: ts_ };
  });
  const imports = [...imps].map(([n, sym]) => {
    const d = sym.declarations[0]; const decl = ts.isImportClause(d) ? d.parent : d.parent.parent.parent;
    return { n, mod: decl.moduleSpecifier.text, typ: !!(decl.importClause.isTypeOnly || d.isTypeOnly), def: ts.isImportClause(d), json: !!decl.attributes };
  });
  out.push({ namn: s.namn, fil: s.fil, cond, condRad, fran, till, forst: lines[fran - 1].trim(), sist: lines[till - 1].trim(), condForst: condRad ? lines[condRad - 1].trim() : null, condSist: condRad ? lines[till].trim() : null, props: pl, imports, fragment: !!s.fragment });
}
console.log(JSON.stringify(out, null, 1));
