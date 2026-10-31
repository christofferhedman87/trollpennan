// Avgränsat granskningsprov, ingen ny obligatorisk grind.
// node --experimental-strip-types scripts/prov-siffermask.mjs [baslinje] [kandidat]
import assert from "node:assert/strict";
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import vm from "node:vm";
import ts from "typescript";
import { arSparrat } from "../src/tolk/sparr.ts";
import { tolka } from "../src/tolk/tolka.ts";
import { ordFranForm } from "../src/tolk/lexikon.ts";
import { BLOCK, ORD } from "../src/tolk/data.ts";

const baslinje = process.argv[2] ?? "c87821808eea87c64eaf4bf82631425cd3c03bca";
const kandidat = process.argv[3] ?? "fd990c3908841978a0769c0efd267cea3abce9d3";
assert.equal(realpathSync(process.cwd()), realpathSync(fileURLToPath(new URL("../", import.meta.url))), "kör från samma reporot som skriptet, så att kod och git-kontroller gäller samma källa");
const git = (...args) => execFileSync("git", args, { encoding:"utf8" }).trimEnd();
git("merge-base", "--is-ancestor", kandidat, "HEAD");
assert.equal(readFileSync("src/tolk/sparr.ts", "utf8").trimEnd(), git("show", `${kandidat}:src/tolk/sparr.ts`), "kandidatens spärrkod används");
// Baslinjen körs med samma orddata/lexikon. Placering och prov påverkar inte dem.
const tillatna = new Set(["src/tolk/sparr.ts", "src/tolk/antalBojning.test.ts", "data/placering.json"]);
const andrade = git("diff", "--name-only", baslinje, "--", "src/tolk", "data").split("\n").filter(Boolean);
assert.deepEqual(andrade.filter((p) => !tillatna.has(p)), [], "orddata/lexikon får inte ändras mellan jämförelserna");

const gammal = {};
const kod = ts.transpileModule(git("show", `${baslinje}:src/tolk/sparr.ts`), {
  compilerOptions:{ module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ESNext },
}).outputText;
vm.runInNewContext(kod, {
  exports:gammal,
  require:(id) => {
    if (id === "./lexikon.ts") return { ordFranForm };
    if (id === "./data.ts") return { BLOCK, ORD };
    throw new Error(`Oväntad baslinjeimport: ${id}`);
  },
});

let forsok = 0;
const nyaLuckor = [];
for (const term of [...BLOCK.ord, ...BLOCK.stammar]) for (let i = 1; i < term.length; i++) {
  for (const n of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]) {
    for (const text of [`${term.slice(0,i)} ${n} ${term.slice(i)}`, `${term.slice(0,i)} ${n} ${term.slice(i+1)}`]) {
      forsok++;
      if (gammal.arSparrat(text) && !arSparrat(text)) nyaLuckor.push(text);
    }
  }
}
for (const text of ["svart 5 kalle", "svart 5 kall", "1 5 1 5", "en katt med svart 5 kalle", "en katt som 1 5 1 5"]) {
  assert.equal(arSparrat(text), true, text);
  assert.equal(tolka(text).typ, "sparr", text);
}
for (let n = 1; n <= 10; n++) {
  const u = tolka(`en katt med ${n} ${n === 1 ? "hatt" : "hattar"}`, { noteraBlandning:false });
  assert.equal(u.typ, "skapad");
  assert.equal(u.antal, 1);
  assert.equal(u.varelse.tillbehor[0].antal ?? 1, n);
}
assert.equal(forsok, 9920);
assert.deepEqual(nyaLuckor, []);
console.log(JSON.stringify({ baslinje, kandidat, forsok, nyaLuckor:nyaLuckor.length, fastaRegressionsfall:5, legitimaHattantal:10 }));
