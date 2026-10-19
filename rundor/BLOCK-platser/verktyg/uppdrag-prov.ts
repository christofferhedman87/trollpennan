// B2–B4-bevis: varje förslag i en uppdragsfil (bengtsson-format) har modell, godkänns av uppdragsmotorn och skapar något i tolken.
// node --experimental-strip-types rundor/BLOCK-platser/verktyg/uppdrag-prov.ts <fil.json> [--omrade skogen]   exit 0 = allt ok
import fs from "node:fs";
import path from "node:path";
import { tolkaMedReserv } from "../../../src/tolk/reserv.ts";
import { kravUppfyllt } from "../../../src/spel/uppdragsmotor.ts";
const rot = path.resolve(import.meta.dirname, "../../..");
const las = (f: string) => JSON.parse(fs.readFileSync(path.resolve(rot, f), "utf8"));
const fil = process.argv[2]; const omr = process.argv.includes("--omrade") ? process.argv[process.argv.indexOf("--omrade") + 1] : null;
const ent = las("data/entiteter.json").entiteter as Record<string, { ord?: string[]; modell?: string | null }>;
const till = las("data/tillgangar.json").tillgangar as Record<string, { fil?: string }>;
const ordj = las("data/ord.json").ord as { id: string; former?: string[]; del?: { kropp?: string } }[];
const entPaOrd = new Map<string, string>();
for (const [id, e] of Object.entries(ent)) for (const o of e.ord ?? [id]) entPaOrd.set(o, id);
for (const r of ordj) if (r.del?.kropp) for (const f of [r.id, ...(r.former ?? [])]) if (!entPaOrd.has(f)) entPaOrd.set(f, r.del.kropp);
type F = { ord: string; fras: string; agg?: string };
const uppdrag = (las(fil).uppdrag as { id: string; omrade: string; krav: { ord: string[]; min?: number }; val: { grupper: { forslag: F[] }[] } }[]).filter((u) => !omr || u.omrade === omr);
const rader = [];
for (const u of uppdrag) for (const g of u.val.grupper) for (const f of g.forslag) {
  const id = entPaOrd.get(f.ord); const m = id ? ent[id]?.modell : null; const fl = m ? till[m]?.fil : null;
  const modell = !!fl && fs.existsSync(path.join(rot, "public", fl));
  const kravOk = kravUppfyllt(u.krav, f.fras);
  const t = tolkaMedReserv(f.fras); const skapar = t.typ === "skapad";
  rader.push({ uppdrag: u.id, fras: f.fras, ord: f.ord, modell, kravOk, skapar, ok: (modell || !!f.agg) && kravOk && skapar });
}
const fela = rader.filter((r) => !r.ok);
console.log(JSON.stringify({ uppdrag: uppdrag.length, forslag: rader.length, ok: rader.length - fela.length, utan_modell: fela.filter((r) => !r.modell).length, krav_nej: fela.filter((r) => !r.kravOk).length, skapar_inte: fela.filter((r) => !r.skapar).length, fel: fela }, null, 1));
process.exit(fela.length ? 1 : 0);
