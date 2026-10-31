import dekorJson from "../../data/dekor-karta.json" with { type: "json" };
import { START_PLATS, type Plats } from "./platser.ts";
import type { Ruta } from "./skarm.ts";

type DekorKarta = { w: number; h: number; z: Int8Array };
const DEKOR = (dekorJson as unknown as { cell: number; platser: Record<string, { w: number; h: number; z: string }> });
const dekorMinne = new Map<string, DekorKarta | null>();
/** Per plats, sedan z×4. Ingen ny sträng per ruta (GC syntes i prestandaprovets CPU-tid). */
export const satMinne = new Map<string, Map<number, Int32Array>>();
function b64(s: string): Int8Array {
  const bin = typeof atob === "function" ? atob(s) : Buffer.from(s, "base64").toString("binary");
  const ut = new Int8Array(bin.length);
  for (let i = 0; i < bin.length; i++) ut[i] = (bin.charCodeAt(i) << 24) >> 24;
  return ut;
}
function dekorFor(plats?: Plats): DekorKarta | null {
  const id = plats?.id ?? START_PLATS;
  let k = dekorMinne.get(id);
  if (k === undefined) {
    const d = DEKOR.platser?.[id];
    dekorMinne.set(id, (k = d ? { w: d.w, h: d.h, z: b64(d.z) } : null));
  }
  return k;
}
/** Summerad tabell över cellerna där dekorn står framför djupet z (z × 4, avrundat uppåt). */
function dekorSat(id: string, k: DekorKarta, z4: number): Int32Array {
  let per = satMinne.get(id);
  if (!per) satMinne.set(id, (per = new Map()));
  let t = per.get(z4);
  if (t) return t;
  const W = k.w + 1;
  t = new Int32Array(W * (k.h + 1));
  for (let y = 0; y < k.h; y++) {
    let rad = 0;
    for (let x = 0; x < k.w; x++) {
      const v = k.z[y * k.w + x]!;
      if (v !== -128 && v > z4) rad++;
      t[(y + 1) * W + x + 1] = t[y * W + x + 1]! + rad;
    }
  }
  per.set(z4, t);
  return t;
}
// dekor strax bakom kroppens mitt räknas också (−0,15): kroppens yta sitter framför mitten, och cellerna är grova
const DEKOR_MARGINAL = -0.15;
/** Senaste anropet fyller båda. Ett svep räcker (kropp och huvud delar x-lederna). */
export let dekorUtK = 0;
export let dekorUtH = 0;
export function dekorSkymd(plats: Plats | undefined, r: Ruta, c: Ruta, zFram: number, huvud: boolean): number {
  const k = dekorFor(plats);
  if (!k) {
    dekorUtK = dekorUtH = 0;
    return 0;
  }
  const C = DEKOR.cell;
  // kartan avrundar z × 4 till närmaste heltal (dekor-karta.mjs): cellen v kan stå ända till (v + 0,5) / 4. Den räknas
  // därför om v > 4·(z + marginal) − 0,5 (kalib3: busken på z 0–0,12 framför katten på z 0 räknades inte – huvudet 89 %)
  const t = dekorSat(plats?.id ?? START_PLATS, k, Math.floor((zFram + DEKOR_MARGINAL) * 4 - 0.5));
  const W = k.w + 1;
  const y0 = c.y0;
  const cy0 = Math.max(0, Math.floor(y0 / C));
  // P3a-fix torr 4: varje cell kroppen rör räknas (golv/tak, inte närmaste): en liten kropp (hästen 25 × 48 px, fyra
  // celler) tappade annars en hel kantcell, och huvudet syntes 81 % där regeln räknade det fritt
  const cyH = Math.min(k.h, Math.max(cy0 + 1, Math.ceil((y0 + (c.y1 - y0) / 2) / C)));
  const cyK = Math.min(k.h, Math.max(cy0 + 1, Math.ceil(c.y1 / C)));
  const bw = c.x1 - c.x0;
  let vk = 0;
  let vh = 0;
  // kärnan längst till vänster, i mitten och längst till höger i rutan den rör sig inom
  for (const x0 of [r.x0, c.x0, r.x1 - bw]) {
    const cx0 = Math.max(0, Math.floor(x0 / C));
    const cx1 = Math.min(k.w, Math.max(cx0 + 1, Math.ceil((x0 + bw) / C)));
    const dx = cx1 - cx0;
    if (dx <= 0) continue;
    const bas = t[cy0 * W + cx0]!;
    const basX = t[cy0 * W + cx1]!;
    const nK = dx * (cyK - cy0);
    if (nK > 0) vk = Math.max(vk, (t[cyK * W + cx1]! - basX - t[cyK * W + cx0]! + bas) / nK);
    const nH = dx * (cyH - cy0);
    if (nH > 0) vh = Math.max(vh, (t[cyH * W + cx1]! - basX - t[cyH * W + cx0]! + bas) / nH);
  }
  dekorUtK = vk;
  dekorUtH = vh;
  return huvud ? vh : vk;
}

