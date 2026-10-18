// Mäter vilka namn ur Spel()-scopet varje JSX-block använder, med typer från tsc. Läser bara. Kör från repots rot.
// Exempel: node rundor/R1-dela-spel/mat/props.mjs '[{"namn":"KartaLager","cond":2248},{"namn":"AngLager","rad":2091}]'
import { createRequire } from "node:module";
import path from "node:path";
const root = process.cwd();
const require = createRequire(path.join(root, "package.json"));
const ts = require("typescript");

const cfgPath = path.join(root, "tsconfig.pages.json");
const cfg = ts.getParsedCommandLineOfConfigFile(cfgPath, {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: (d) => console.error(d.messageText) });
const prog = ts.createProgram({ rootNames: [path.join(root, "src/spel/Spel.tsx")], options: cfg.options });
const sf = prog.getSourceFile(path.join(root, "src/spel/Spel.tsx"));
const chk = prog.getTypeChecker();
const line = (p) => sf.getLineAndCharacterOfPosition(p).line + 1;
let spel; sf.forEachChild((n) => { if (ts.isFunctionDeclaration(n) && n.name?.text === "Spel") spel = n; });
function kind(sym) {
  const d = sym.declarations?.[0]; if (!d) return null;
  let n = d; if (ts.isBindingElement(d)) { let v = d; while (v && !ts.isVariableDeclaration(v)) v = v.parent; n = v; }
  const stmt = ts.isVariableDeclaration(n) ? n.parent.parent : n;
  if (stmt.parent === spel.body) return "spel";
  if (stmt.parent === sf) return "modul";
  return "lokal";
}
function namesIn(node) {
  const m = new Map();
  (function v(n) {
    if (ts.isIdentifier(n)) {
      const p = n.parent;
      const skip = (ts.isPropertyAccessExpression(p) && p.name === n) || (ts.isPropertyAssignment(p) && p.name === n) || (ts.isJsxAttribute(p) && p.name === n) || ts.isJsxClosingElement(p);
      if (!skip) {
        const sym = ts.isShorthandPropertyAssignment(p) ? chk.getShorthandAssignmentValueSymbol(p) : chk.getSymbolAtLocation(n);
        if (sym && kind(sym) === "spel") m.set(n.text, sym);
      }
    }
    ts.forEachChild(n, v);
  })(node);
  return m;
}
const flags = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;
function tstr(sym, nonNull) {
  const decl = sym.declarations[0];
  let t = chk.getTypeOfSymbolAtLocation(sym, decl);
  if (nonNull) t = chk.getNonNullableType(t);
  return chk.typeToString(t, spel, flags);
}
// hitta JsxExpression som börjar på rad L och är cond ? (...) : null
function jsxAt(L) {
  let hit;
  (function v(n) { if (ts.isJsxExpression(n) && line(n.getStart()) === L) hit = hit ?? n; ts.forEachChild(n, v); })(spel);
  return hit;
}
const out = [];
function add(namn, node, extra = {}) {
  const m = namesIn(node);
  const props = [...m].map(([n, sym]) => {
    const k = sym.declarations[0];
    return { n, t: tstr(sym, extra.nonNull?.includes(n)) };
  });
  out.push({ namn, fran: line(node.getStart()), till: line(node.getEnd()), props });
}
const specs = JSON.parse(process.argv[2]);
for (const s of specs) {
  if (s.cond) {
    const je = jsxAt(s.cond);
    const e = je.expression;
    const inner = e.whenTrue.expression ?? e.whenTrue; // paren
    out.push({ namn: s.namn, cond: e.condition.getText(), ...(() => { const m = namesIn(inner); return {}; })() });
    out.pop();
    const m = namesIn(inner);
    const props = [...m].map(([n, sym]) => ({ n, t: tstr(sym, s.nonNull?.includes(n)) }));
    out.push({ namn: s.namn, cond: e.condition.getText(), fran: line(inner.getStart()), till: line(inner.getEnd()), props });
  } else {
    // rad-intervall: hitta JSX-element som börjar på rad a
    let el; (function v(n) { if ((ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) && line(n.getStart()) === s.rad && !el) el = n; ts.forEachChild(n, v); })(spel);
    const m = namesIn(el);
    out.push({ namn: s.namn, fran: line(el.getStart()), till: line(el.getEnd()), props: [...m].map(([n, sym]) => ({ n, t: tstr(sym, false) })) });
  }
}
console.log(JSON.stringify(out, null, 1));
