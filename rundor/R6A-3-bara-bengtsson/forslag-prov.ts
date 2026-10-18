// R6A-3: bevis att varje förslag i data/bengtsson.json (a) har en modell i data/entiteter.json + tillgangar.json och filen finns i public/
// (eller bär "agg": "skäl" som uttryckligt undantag), (b) godkänns av uppdragsmotorn (kravUppfyllt) och (c) får spelet att skapa något (tolkaMedReserv "skapad").
// Användning: node --experimental-strip-types rundor/R6A-3-bara-bengtsson/forslag-prov.ts   (exit 0 = allt stämde; JSON på stdout)
import fs from "node:fs";
import path from "node:path";
import { tolkaMedReserv } from "../../src/tolk/reserv.ts";
import { SKRIV } from "../../src/spel/aventyr.ts";
import { kravUppfyllt } from "../../src/spel/uppdragsmotor.ts";

const rot = path.resolve(import.meta.dirname, "../..");
const las = (f: string) => JSON.parse(fs.readFileSync(path.join(rot, f), "utf8"));
const ent = las("data/entiteter.json").entiteter as Record<string, { ord?: string[]; modell?: string | null }>;
const till = las("data/tillgangar.json").tillgangar as Record<string, { fil?: string }>;
const entPaOrd = new Map<string, string>();
for (const [id, e] of Object.entries(ent)) for (const o of e.ord ?? [id]) entPaOrd.set(o, id);

const rader: { uppdrag: string; ord: string; fras: string; modell: string | null; fil: string | null; modellFinns: boolean; agg: string | null; kravOk: boolean; skapar: boolean; ok: boolean }[] = [];
for (const u of SKRIV) {
  for (const g of u.val?.grupper ?? []) {
    for (const f of g.forslag as { ord: string; fras: string; agg?: string }[]) {
      const id = entPaOrd.get(f.ord);
      const modell = id ? (ent[id]?.modell ?? null) : null;
      const fil = modell ? (till[modell]?.fil ?? null) : null;
      const modellFinns = !!fil && fs.existsSync(path.join(rot, "public", fil));
      const kravOk = kravUppfyllt(u.krav!, f.fras);
      const skapar = tolkaMedReserv(f.fras).typ === "skapad";
      rader.push({ uppdrag: u.id, ord: f.ord, fras: f.fras, modell, fil, modellFinns, agg: f.agg ?? null, kravOk, skapar, ok: (modellFinns || !!f.agg) && kravOk && skapar });
    }
  }
}
const saknas = rader.filter((r) => !r.modellFinns && !r.agg).map((r) => `${r.uppdrag}: ${r.ord}`);
const ok = rader.length >= 9 && rader.every((r) => r.ok);
console.log(JSON.stringify({ forslag: rader.length, med_modell: rader.filter((r) => r.modellFinns).length, agg_undantag: rader.filter((r) => r.agg).length, saknar_modell: saknas, ok, rader }, null, 1));
process.exit(ok ? 0 : 1);
