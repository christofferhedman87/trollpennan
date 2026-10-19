#!/usr/bin/env node
// Lägger in data-utkast i data/ (ingen kod). Idempotent: kör två gånger = samma resultat.
// node rundor/BLOCK-platser/verktyg/lagg-data.mjs [--uppdrag fil] [--omrade id] [--ledtradar fil] [--plats id] [--genus fil]
// --plats id: platsraden ur data-utkast/platser.json -> data/platser.json (skapas av B1.3) + repliker -> data/npc.json repliker_plats.
// Skriver en rad per ändring till stdout. Exit 1 = något kunde inte läggas in (inget skrivet).
import fs from "node:fs";
import path from "node:path";
const ROT = path.resolve(import.meta.dirname, "../../..");
const U = path.join(ROT, "rundor/BLOCK-platser/data-utkast");
const arg = (n) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : null);
const las = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const skrivs = new Map();
const data = (f) => { const p = path.join(ROT, "data", f); if (!skrivs.has(p)) skrivs.set(p, las(p)); return skrivs.get(p); };
const fel = []; const logg = (s) => console.log(s);
const ordj = data("ord.json").ord;
const ordId = new Map(ordj.map((r) => [r.id, r]));

if (arg("--uppdrag")) {
  const omr = arg("--omrade");
  const b = data("bengtsson.json");
  const finns = new Set([...b.uppdrag.map((u) => u.id), ...data("uppdrag.json").uppdrag.map((u) => u.id)]);
  for (const u of las(path.resolve(ROT, arg("--uppdrag"))).uppdrag) {
    if (omr && u.omrade !== omr) continue;
    if (finns.has(u.id)) { logg(`uppdrag ${u.id}: finns redan`); continue; }
    const { _villkor, ...rad } = u;
    b.uppdrag.push(rad); finns.add(u.id); logg(`uppdrag ${u.id}: inlagt (${u.omrade})`);
  }
}
if (arg("--ledtradar")) {
  const omr = arg("--omrade");
  const l = data("ledtradar.json").ledtradar;
  for (const [o, g] of Object.entries(las(path.resolve(ROT, arg("--ledtradar"))).ledtradar)) {
    if (omr && g.omrade && g.omrade !== omr) continue;
    const r = ordId.get(o);
    if (!r) { logg(`gåta ${o}: HOPPAS ÖVER (ingen rad i ord.json – modell + ordrad först, B5)`); continue; }
    if (r.niva !== "fritt") { logg(`gåta ${o}: HOPPAS ÖVER (niva ${r.niva}, inte hemligt)`); continue; }
    const rad = { gata: g.gata, forsta: o[0].toUpperCase(), langd: [...o].length };
    for (const k of ["gata_latt", "bengtsson_fore", "bengtsson_klart", "omrade"]) if (g[k]) rad[k] = g[k];
    rad.granskad = false;
    logg(`gåta ${o}: ${l[o] ? "ny text (Copilot)" : "ny"}`); l[o] = { ...(l[o] ?? {}), ...rad };
  }
}
if (arg("--genus")) {
  for (const [o, g] of Object.entries(las(path.resolve(ROT, arg("--genus"))).genus)) {
    const r = ordId.get(o); if (!r) { fel.push(`genus ${o}: ingen ordrad`); continue; }
    if (r.genus !== g) { logg(`genus ${o}: ${r.genus} -> ${g}`); r.genus = g; }
  }
}
if (arg("--plats")) {
  const id = arg("--plats");
  const P = las(path.join(U, "platser.json"));
  const rad = P.platser.find((p) => p.id === id);
  const pf = path.join(ROT, "data/platser.json");
  if (!rad) fel.push(`plats ${id}: finns inte i utkastet`);
  else if (!fs.existsSync(pf)) fel.push("data/platser.json saknas (B1.3 är inte inlagd)");
  else {
    const d = data("platser.json"); d.platser = d.platser.filter((p) => p.id !== rad.id); d.platser.push(rad);
    const bel = P.beloningar.find((b) => b.final === rad.milstolpe.final);
    if (bel) { d.beloningar = (d.beloningar ?? []).filter((b) => b.id !== bel.id); d.beloningar.push(bel); }
    logg(`plats ${id}: inlagd${bel ? " + belöning " + bel.id : ""}`);
    const npc = data("npc.json"); const rep = las(path.join(U, "repliker-platser.json")).repliker_plats[id];
    if (rep) { npc.repliker_plats = { ...(npc.repliker_plats ?? {}), [id]: rep }; logg(`repliker ${id}: ${Object.values(rep).flat().length}`); }
  }
}
if (fel.length) { console.error("FEL:\n" + fel.join("\n")); process.exit(1); }
for (const [p, d] of skrivs) fs.writeFileSync(p, JSON.stringify(d, null, 1) + "\n");
