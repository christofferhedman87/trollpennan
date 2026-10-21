// P3a-fix (Arkitekten 09:16): regeln mot skärmen. Läser skarm-prov.mjs --kalib (läget och id-passet för varje ord) och
// räknar om regeln (placera) på samma läge. Skriver per skapelse regelns skymning i värsta läget och den mätta, och hur
// mycket skärmen visar mer skymt än regeln räknade – det är marginalen regeln behöver (data/placering.json sakerhet).
// Körs: npx tsx rundor/P3a-fix/kalibrera.ts FIL.jsonl [FIL2.jsonl ...]
import fs from "node:fs";
import { kameraFor, kroppMatt, placera, PLACERING, rollFor, siluettAndel } from "../../src/spel/placering.ts";
import { sakRuta } from "../../src/spel/skymning.ts";
import { platsMed, START_PLATS } from "../../src/spel/platser.ts";
import type { Sparad } from "../../src/spel/brygga.ts";

type Id = Record<string, { sil: number; syn: number; silHuvud: number; synHuvud: number; kant: boolean; x0: number; y0: number; x1: number; y1: number }>;
type Pos = Record<string, { x: number; z: number; y: number; k: number; stall?: boolean }>;
// storleken: siluettens ruta på skärmen mot regelns låda (kärnan c) där spelet faktiskt ritade (window.__tredPos)
const andel: Record<string, { w: number[]; h: number[] }> = {};
const rader: { plats: string; block: string; n: number; kropp: string; nya: boolean; pT: number; pH: number; mT: number; mH: number; kant: boolean }[] = [];
for (const fil of process.argv.slice(2)) {
  for (const l of fs.readFileSync(fil, "utf8").split("\n")) {
    if (!l.trim()) continue;
    const { plats, block, n, st, id, pos } = JSON.parse(l) as { plats: string; block: string; n: number; st: Sparad[]; id: Id; pos?: Pos };
    const p = plats === START_PLATS ? undefined : platsMed(plats);
    for (const d of st) {
      const q = pos?.[d.uid];
      const m = id[d.uid];
      if (!q || q.stall || !m || !m.sil || m.kant) continue;
      const mm = kroppMatt({ kropp: d.kropp, skala: (d.skala || 1) * (q.k || 1) }, q.z, p, rollFor(d, p), 1);
      const c = sakRuta(q.x, q.z, mm.kx, mm.kh, mm.kd, q.y + mm.ky0, kameraFor(p));
      const a = (andel[d.kropp] ??= { w: [], h: [] });
      a.w.push((m.x1 - m.x0) / (c.x1 - c.x0));
      a.h.push((m.y1 - m.y0) / (c.y1 - c.y0));
    }
    const lagen = placera(st, p);
    const ordning = [...st].sort((a, b) => b.skapad - a.skapad);
    ordning.forEach((d, i) => {
      const l0 = lagen.get(d.uid);
      const m = id[d.uid];
      if (!l0 || l0.stall || !l0.skymd || !m || !m.sil) return;
      rader.push({ plats, block, n, kropp: d.kropp, nya: i < (PLACERING.nya_antal ?? 3), pT: l0.skymd.tackt, pH: l0.skymd.huvud, mT: 1 - m.syn / m.sil, mH: m.silHuvud ? 1 - m.synHuvud / m.silHuvud : 0, kant: m.kant });
    });
  }
}
const pct = (x: number) => `${Math.round(x * 1000) / 10}`.padStart(5);
const sak = PLACERING.sakerhet ?? 0;
const gT = (nya: boolean) => (nya ? PLACERING.max_skymd : PLACERING.max_skymd_aldre ?? PLACERING.max_skymd);
const gH = PLACERING.huvud_skymd ?? 1;
const fel = rader.filter((r) => r.mT > gT(r.nya) || r.mH > gH || r.kant);
console.log(`${rader.length} mätningar (skapelse × ord), ${fel.length} över skärmprovets gräns. Regelns marginal nu: ${sak}`);
const dT = rader.map((r) => r.mT - r.pT).sort((a, b) => b - a);
const dH = rader.map((r) => r.mH - r.pH).sort((a, b) => b - a);
const q = (a: number[], f: number) => a[Math.min(a.length - 1, Math.floor(a.length * f))] ?? 0;
console.log(`skärmen minus regeln, kroppen: störst ${pct(dT[0] ?? 0)} %, 1 % ${pct(q(dT, 0.01))} %, 5 % ${pct(q(dT, 0.05))} %`);
console.log(`skärmen minus regeln, huvudet: störst ${pct(dH[0] ?? 0)} %, 1 % ${pct(q(dH, 0.01))} %, 5 % ${pct(q(dH, 0.05))} %`);
console.log("\nde 15 där skärmen visar mest mer skymt än regeln (huvud eller kropp):");
for (const r of [...rader].sort((a, b) => Math.max(b.mH - b.pH, b.mT - b.pT) - Math.max(a.mH - a.pH, a.mT - a.pT)).slice(0, 15))
  console.log(`  ${r.block.padEnd(22)} ord ${String(r.n).padStart(2)} ${r.kropp.padEnd(12)} kropp regel ${pct(r.pT)} skärm ${pct(r.mT)} | huvud regel ${pct(r.pH)} skärm ${pct(r.mH)}${r.kant ? " KANT" : ""}`);
if (fel.length) {
  console.log("\növer skärmprovets gräns:");
  for (const r of fel) console.log(`  ${r.block.padEnd(22)} ord ${String(r.n).padStart(2)} ${r.kropp.padEnd(12)} kropp ${pct(r.mT)} (gräns ${pct(gT(r.nya))}, regel ${pct(r.pT)}) huvud ${pct(r.mH)} (regel ${pct(r.pH)})${r.kant ? " KANT" : ""}`);
}

console.log("\nstorleken: siluettens ruta / regelns låda (minst, median; regeln använder nu):");
const forslag: Record<string, [number, number]> = {};
for (const k of Object.keys(andel).sort()) {
  const w = andel[k]!.w.sort((a, b) => a - b), h = andel[k]!.h.sort((a, b) => a - b);
  const nu = siluettAndel(k);
  forslag[k] = [Math.floor(w[0]! * 20) / 20, Math.floor(h[0]! * 20) / 20];
  console.log(`  ${k.padEnd(12)} bredd ${w[0]!.toFixed(2)} / ${w[w.length >> 1]!.toFixed(2)}  höjd ${h[0]!.toFixed(2)} / ${h[h.length >> 1]!.toFixed(2)}  n ${w.length}  regeln ${nu[0]} × ${nu[1]}${nu[2] ? "" : " (standard)"}${w[0]! < nu[0] - 1e-9 || h[0]! < nu[1] - 1e-9 ? "  ← skärmen mindre än regeln" : ""}`);
}
console.log("förslag siluett_andel (minsta, nedåt till 0,05):", JSON.stringify(forslag));
