// Visar för varje deklaration på modulnivå i Spel.tsx r.83–465 var den används. Läser bara. Kör från repots rot.
import { createRequire } from "node:module";
const require = createRequire(path.join(process.cwd(), "package.json"));
const ts = require("typescript");
import fs from "node:fs";
import path from "node:path";
const file = path.join(process.cwd(), "src/spel/Spel.tsx");
const src = fs.readFileSync(file, "utf8");
const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const line = (n) => sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
const decl = new Map();
sf.forEachChild((n) => {
  if (n.getStart() && line(n) >= 83 && line(n) <= 465 || (ts.isFunctionDeclaration(n) && n.name?.text === "HoldOppnare")) {
    if (ts.isFunctionDeclaration(n) && n.name) decl.set(n.name.text, [line(n), sf.getLineAndCharacterOfPosition(n.end).line + 1]);
    if (ts.isVariableStatement(n)) for (const d of n.declarationList.declarations) { if (ts.isIdentifier(d.name)) decl.set(d.name.text, [line(n), sf.getLineAndCharacterOfPosition(n.end).line + 1]); else d.name.elements?.forEach(e=>decl.set(e.name.text,[line(n),sf.getLineAndCharacterOfPosition(n.end).line + 1])); }
    if (ts.isTypeAliasDeclaration(n)) decl.set(n.name.text, [line(n), sf.getLineAndCharacterOfPosition(n.end).line + 1]);
  }
});
const regions = [["handlers/spel-kropp(466-2090)", 466, 2090], ["JSX(2091-3087)", 2091, 3087]];
const use = new Map([...decl.keys()].map((k) => [k, new Set()]));
(function v(n) {
  if (ts.isIdentifier(n)) {
    const ln = line(n);
    if (decl.has(n.text) && !(ln >= decl.get(n.text)[0] && ln <= decl.get(n.text)[1]) ) {
      const p = n.parent; if ((ts.isPropertyAccessExpression(p) && p.name === n) || (ts.isPropertyAssignment(p) && p.name === n)) { /* redan en prop */ } else {
        for (const [r, a, b] of regions) if (ln >= a && ln <= b) use.get(n.text).add(r);
        if (ln > 3088) use.get(n.text).add("efter-Spel(" + ln + ")");
        if (ln < 466 && ln>=83) use.get(n.text).add("hjälp/data(" + ln + ")");
      }
    }
  }
  ts.forEachChild(n, v);
})(sf);
for (const [k, [a, b]] of decl) console.log(`${k.padEnd(18)} ${a}-${b}  ->  ${[...use.get(k)].join(" | ") || "(oanvänd utanför egen deklaration)"}`);
