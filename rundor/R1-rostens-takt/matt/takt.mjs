// R1 facit: räknar det barnet HÖR i en rostlogg (Arkitekten 2026-10-24). Mätskript, ingen spelkod.
// Läser både det nya formatet (rostlogg-r1.mjs: tider ur sidans klocka) och det gamla (O1-ordtolk/matt/rostlogg.json: s i sekunder).
// Hörd rad = satt fil, mall, reserv eller tyst. "tyst" = dynamisk rad som ska läsas med telefonens svenska röst; headless saknar röst,
// en telefon har den, så raden räknas som hörd (samma tid). satt saknas/struken/avbruten hörs inte. Klass: radens 'klass' om rostKo loggar den,
// annars tabellen KLASS nedan (bara för loggar från före R1). Slutkod 0 = facit uppfyllt.
// Facit: (A) högst 3 oombedda hörda rader 0–30 s efter introt, (B) aldrig två oombedda inom 10 s,
//        (C) varje väckning får sitt svar (klass svar) inom 1,5 s, (D) ingen hörd rad senare än 6 s efter sin orsak (om fodd loggas).
import fs from "node:fs";
const fil = process.argv[2] ?? "rostlogg.json";
const j = JSON.parse(fs.readFileSync(fil, "utf8"));
const KLASS = [ // före R1: klass ur texten (samma indelning som data/rost-takt.json kallor)
  [/^Hej! Här kommer /, "svar"], [/^(Det ordet kan|Ordet .* kan jag inte|Wow, ett ovanligt)/, "folj"], [/^\+\d+ stjärn|^Nytt ord i boken|^Guldord|^Toppen!|^Tack!|^Hihi/, "belonung"],
];
const HORS = ["fil", "mall", "reserv", "tyst"];
const klassAv = (r) => r.klass ?? (KLASS.find(([re]) => re.test(r.text))?.[1] ?? "guide");
let tIntro, rader, hand;
if (j.logg) { // gammalt format
  tIntro = j.tIntroSlut * 1000;
  rader = j.logg.filter((x) => x.typ === "rost").map((x) => ({ t: x.s * 1000, text: x.text, satt: x.satt }));
  hand = j.logg.filter((x) => x.typ === "handling" && /vakna/.test(x.text)).map((x) => ({ t: x.s * 1000, text: "vakna " + ([...j.logg].reverse().find((y) => y.s <= x.s && /^skriver /.test(y.text ?? ""))?.text.slice(8) ?? "?") }));
} else { tIntro = j.tIntroSlut; rader = j.rost; hand = j.hand.filter((h) => h.text.startsWith("vakna")); }
const hord = rader.filter((r) => HORS.includes(r.satt)).map((r) => ({ ...r, klass: klassAv(r), s: (r.t - tIntro) / 1000 }));
const oomb = hord.filter((r) => r.klass !== "svar");
const fmt = (x) => x.toFixed(1).replace(".", ",");
console.log(`Hörda rader efter introt (s från introts slut, klass, text):`);
for (const r of hord.filter((r) => r.s >= 0)) console.log(`  ${fmt(r.s).padStart(6)}  ${r.klass.padEnd(8)} ${r.text}`);
const A = oomb.filter((r) => r.s >= 0 && r.s <= 30).length;
let minGap = Infinity, par = null;
for (let i = 1; i < oomb.length; i++) { const g = (oomb[i].t - oomb[i - 1].t) / 1000; if (oomb[i].s >= 0 && g < minGap) { minGap = g; par = [oomb[i - 1].text, oomb[i].text]; } }
const B = oomb.filter((r) => r.s >= 0).length < 2 ? Infinity : minGap;
// svaret = hörd svarsrad om just det djuret ("Hej! Här kommer en blå hund!"); hörs det aldrig blir det "inget"
const C = hand.map((h) => { const fras = h.text.replace(/^vakna /, ""); const s = hord.find((r) => r.klass === "svar" && r.t >= h.t - 50 && r.text.includes(fras)); return { h: h.text, ms: s ? Math.round(s.t - h.t) : null }; });
const efter = hand.map((h) => ({ h: h.text, n: hord.filter((r) => r.t >= h.t && r.t <= h.t + 20000).length, tyst: rader.filter((r) => r.t >= h.t && r.t <= h.t + 20000 && !HORS.includes(r.satt)).length }));
const D = rader.filter((r) => typeof r.fodd === "number" && HORS.includes(r.satt)).map((r) => r.t - r.fodd);
const okA = A <= 3, okB = B >= 10, okC = C.every((c) => c.ms !== null && c.ms <= 1500), okD = D.every((x) => x <= 6000);
console.log(`\n(A) oombedda hörda 0–30 s efter introt: ${A} (facit ≤ 3) ${okA ? "OK" : "FEL"}`);
console.log(`(B) minsta avstånd mellan två oombedda: ${B === Infinity ? "–" : fmt(B) + " s"} (facit ≥ 10 s) ${okB ? "OK" : "FEL"}${par && !okB ? `  [${par[0]} → ${par[1]}]` : ""}`);
console.log(`(C) svar efter väckning: ${C.map((c) => `${c.h.replace("vakna ", "")} ${c.ms === null ? "inget" : fmt(c.ms / 1000) + " s"}`).join(", ")} (facit ≤ 1,5 s) ${okC ? "OK" : "FEL"}`);
console.log(`(D) längsta väntan från orsak till hörd rad: ${D.length ? fmt(Math.max(...D) / 1000) + " s" : "loggas inte (före R1)"} (facit ≤ 6 s) ${okD ? "OK" : "FEL"}`);
console.log(`Info: hörda rader 0–20 s efter varje väckning: ${efter.map((e) => `${e.h.replace("vakna ", "")} ${e.n}${e.tyst ? ` (+${e.tyst} tysta)` : ""}`).join(", ")}`);
process.exit(okA && okB && okC && okD ? 0 : 1);
