// R3F: skriver om <M>/ordgranskning.tsv så att formkolumnen visar formerna som ligger i data/ord.json (de granskade), inte lagg-gissningarna.
// Användning (från repots rot): node rundor/R3F-modellserie/ordgranskning-granskad.mjs <ordgranskning.tsv> [fler …]
// Ord som inte (längre) finns i ord.json får kolumnen "(borttaget)". Gissningar som "spelarar" eller "bondar" ska aldrig synas som former.
import fs from "node:fs";
const d = JSON.parse(fs.readFileSync("data/ord.json", "utf8"));
const per = new Map(); for (const o of d.ord) if (o.former?.length) for (const k of [o.id, o.former[0], o.visa]) if (k && !per.has(k)) per.set(k, o);
let n = 0;
for (const fil of process.argv.slice(2)) {
  const rader = fs.readFileSync(fil, "utf8").split("\n");
  const ut = rader.map((r, i) => {
    if (i === 0) return r.replace("former (gissade)", "former (granskade, ur data/ord.json)");
    const c = r.split("\t"); if (c.length < 3 || !c[0]) return r;
    const o = per.get(c[0]); const ny = o ? o.former.join(", ") : "(borttaget)";
    if (ny !== c[2]) n++; c[2] = ny; return c.join("\t");
  });
  fs.writeFileSync(fil, ut.join("\n"));
}
console.log(`ordgranskning: ${n} rader rättade till granskade former`);
