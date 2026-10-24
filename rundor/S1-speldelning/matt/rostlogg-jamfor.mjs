#!/usr/bin/env node
// S1: röstloggen före och efter delningen (bara om R1 är mergad). Läser två rostlogg.json från
// rundor/R1-rostens-takt/matt/rostlogg-r1.mjs och kräver samma hörda rader i samma ordning (text och sätt).
// Tiderna jämförs inte strikt (riktig klocka); varje rad får skilja högst --tol ms (standard 750).
// takt.mjs ska dessutom ge slutkod 0 på båda loggarna; det körs separat.
//   node rundor/S1-speldelning/matt/rostlogg-jamfor.mjs fore/rostlogg.json efter/rostlogg.json [--tol 750]
import fs from "node:fs";
const [a, b] = process.argv.slice(2).filter((x) => !x.startsWith("--") && !/^\d+$/.test(x));
const ti = process.argv.indexOf("--tol"); const TOL = ti > 0 ? Number(process.argv[ti + 1]) : 750;
const las = (f) => { const j = JSON.parse(fs.readFileSync(f, "utf8")); const t0 = j.tIntroSlut ?? 0;
  return (j.rost ?? []).filter((r) => r.satt && !["saknas", "struken"].includes(r.satt)).map((r) => ({ t: r.t - t0, rad: `${r.satt === "tyst" ? "tyst" : "hörd"}  ${r.text}` })); };
const [A, B] = [las(a), las(b)]; const fel = [];
for (let i = 0; i < Math.max(A.length, B.length); i++) {
  const x = A[i], y = B[i];
  if (!x || !y || x.rad !== y.rad) { fel.push(`rad ${i + 1}: före "${x?.rad ?? "–"}", efter "${y?.rad ?? "–"}"`); continue; }
  if (Math.abs(x.t - y.t) > TOL) fel.push(`rad ${i + 1} "${x.rad}": ${(x.t / 1000).toFixed(1)} s före, ${(y.t / 1000).toFixed(1)} s efter (tol ${TOL} ms)`);
}
console.log(`före ${A.length} rader, efter ${B.length} rader`);
if (fel.length) { console.error("rostlogg-jamfor RÖD:\n- " + fel.join("\n- ")); process.exit(1); }
console.log("rostlogg-jamfor GRÖN: samma rader i samma ordning");
