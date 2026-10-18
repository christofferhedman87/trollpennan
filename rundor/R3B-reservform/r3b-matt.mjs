// R3B: mäter reservkedjan mot Kelly-listan (Språkbanken, hämtas utanför repot, se verification/tackning-2026-10-18.md).
// Användning (Node >= 22.6):
//   node --experimental-strip-types rundor/R3B-reservform/r3b-matt.mjs --kelly /sökväg/kelly.json [--rot .] [--ut resultat.json]
// Mäter: (1) andel ord med en "Menade du …?"-gissning före/efter, (2) andel ord som blir synliga (egen form eller ägg),
// (3) att riktiga stavfel mot kända ord fortfarande ger rätt gissning (recall), (4) spärrade ord ger aldrig ägg.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : d; };
const rot = path.resolve(arg("rot", "."));
const kellyFil = arg("kelly", "/workspace/arkitekt-mat/kelly.json");
const imp = (f) => import(pathToFileURL(path.join(rot, f)).href);
const { tolka } = await imp("src/tolk/tolka.ts");
const { tolkaMedReserv } = await imp("src/tolk/reserv.ts");
const { ordLista } = await imp("src/tolk/tolka.ts");

const rader = JSON.parse(fs.readFileSync(kellyFil, "utf8"));
const rent = (g) => g.split(" (")[0].split(" ")[0].toLocaleLowerCase("sv");
const sw = rader.filter((r) => r.source.toLowerCase() === "swewac" && r.raw !== "");
const topp = (f) => sw.filter(f).sort((a, b) => b.wpm - a.wpm).slice(0, 1000).map((r) => rent(r.gf));
const lista = {
  verb: topp((r) => r.pos === "verb"),
  adjektiv: topp((r) => r.pos === "adjective"),
  substantiv: topp((r) => ["noun-en", "noun-ett", "noun", "noun-en/-ett"].includes(r.pos)),
};
// Hållen kontroll: nästa 500 orden efter topp-1000 (efter frekvens, alla källor i Kelly). Frölistan i data/kategori-ord.json är inte vald mot dem.
const pos = { verb: (r) => r.pos === "verb", adjektiv: (r) => r.pos === "adjective", substantiv: (r) => ["noun-en", "noun-ett", "noun", "noun-en/-ett"].includes(r.pos) };
for (const typ of ["verb", "adjektiv", "substantiv"]) {
  const topp1000 = new Set(lista[typ]);
  const kvar = rader.filter(pos[typ]).sort((a, b) => b.wpm - a.wpm).map((r) => rent(r.gf)).filter((w) => !topp1000.has(w) && w.length >= 2);
  lista["hallen_" + typ] = [...new Set(kvar)].slice(0, 500);
}
const pres = (inf) => { const s = inf.endsWith("a") ? inf.slice(0, -1) : inf; return [...new Set([s + "ar", s + "er", s + "r", inf + "r", inf])]; };
const typAv = (t) => t.replace("hallen_", "");
const fraserAv = (t) => fraser[typAv(t)];
const fraser = {
  verb: (w) => ["en kanin som kan " + w, ...pres(w).map((p) => "en kanin som " + p)],
  adjektiv: (w) => ["en " + w + " kanin"],
  substantiv: (w) => [w, "en kanin med " + w],
};
const bas = JSON.stringify({ ...tolka("en kanin").varelse, formel: 0, beskrivning: 0 });
const sig = (u) => (u.typ === "skapad" ? JSON.stringify({ ...u.varelse, formel: 0, beskrivning: 0, reserv: undefined }) : null);

function klass(fn, ph) {
  let forslag = false, reserv = false, synlig = false, sparr = false;
  for (const f of ph) {
    const u = fn(f);
    if (u.typ === "forslag") forslag = true;
    if (u.typ === "sparr") sparr = true;
    if (u.typ === "skapad" && u.varelse.reserv?.length) reserv = true;
    if (u.typ === "skapad" && !u.okanda.length && sig(u) !== bas) synlig = true;
  }
  return synlig ? "egen form" : forslag ? "gissning" : reserv ? "agg" : sparr ? "spärrat" : "ingenting";
}

const ut = { mat: {}, stavfel: {} };
for (const [typ, ord] of Object.entries(lista)) {
  const fore = {}, efter = {};
  const gissadeEfter = [];
  for (const w of ord) {
    const a = klass(tolka, fraserAv(typ)(w));
    const b = klass(tolkaMedReserv, fraserAv(typ)(w));
    fore[a] = (fore[a] ?? 0) + 1;
    efter[b] = (efter[b] ?? 0) + 1;
    if (b === "gissning") gissadeEfter.push(w);
  }
  ut.mat[typ] = { n: ord.length, fore, efter, kvarvarande_gissningar: gissadeEfter.slice(0, 40) };
}

// Stavfel mot kända ord (djur och alla klasser): ska fortfarande ge rätt gissning.
const typo = (o) => {
  const s = new Set();
  for (let i = 1; i < o.length - 1; i++) {
    s.add(o.slice(0, i) + o.slice(i + 1));
    s.add(o.slice(0, i) + o[i + 1] + o[i] + o.slice(i + 2));
    s.add(o.slice(0, i) + o[i] + o.slice(i));
  }
  s.delete(o);
  return [...s];
};
let n = 0, fore = 0, efter = 0;
const tapp = [];
for (const o of ordLista()) {
  if (o.klass !== "djur" || o.visa.length < 4) continue;
  for (const t of typo(o.visa)) {
    const a = tolka(t), b = tolkaMedReserv(t);
    const traff = (u) => u.typ === "forslag" && u.forslag.some((f) => f.id === o.id);
    // Stavfel som redan är ett annat känt ord eller inte gav gissning före räknas inte.
    if (!traff(a)) continue;
    n++;
    if (traff(a)) fore++;
    if (traff(b)) efter++;
    else tapp.push(`${t}→${o.visa}`);
  }
}
ut.stavfel = { djurstavfel_med_gissning_fore: n, fore, efter, andel_kvar: +(efter / Math.max(1, n) * 100).toFixed(1), tappade_exempel: tapp.slice(0, 30) };

console.log(JSON.stringify(ut, null, 1));
const f = arg("ut", null);
if (f) fs.writeFileSync(f, JSON.stringify(ut, null, 1));
