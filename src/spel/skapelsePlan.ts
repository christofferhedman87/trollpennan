// Samma lokala sammansättning i värld, hologram och placeringsregel. Ingen three eller lagringsmutation.
import data from "../../data/placering.json" with { type: "json" };
import mattJson from "../../data/modellmatt.json" with { type: "json" };
import ordJson from "../../data/ord.json" with { type: "json" };
import type { Relation, TillbehorSpec } from "../tolk/typer.ts";
import { barsPaKropp } from "./tillbehor/bars.ts";
import { kladesRuta } from "./tillbehor/kladesRuta.ts";
export { barsPaKropp } from "./tillbehor/bars.ts";
import { TILLBEHOR } from "./tillbehor/data.ts";
import { arPlagg, arSak, malhojd } from "./entiteter.ts";

export type Vektor = [number, number, number];
export type Matt = [number, number, number, number?];
export type Ruta3 = { min: Vektor; max: Vektor };
export type DelPlan = { t: TillbehorSpec; index: number; exemplar: number; position: Vektor; skala: number; alpha: number };
export type SkapelsePlan = { kropp: Vektor; saker: DelPlan[]; ruta: Ruta3; bunden: boolean };
type Spec = { kropp: string; tillbehor?: TillbehorSpec[] };
type Regel = { lage: string; glipa: number; genomskinlighet?: number; rorelsemarginal?: number };
const REGLER = data.relationer as Record<Relation, Regel>;
const FORMER = data.relationsformer as Record<string, { undersida?: number; botten?: number }>;
const PLATTFORM = new Set<string>(data.med_plattform);
const MATT = mattJson.matt as Record<string, number[]>;
const STORLEK = new Map<string, number>();
for (const o of ordJson.ord) {
  const del = o.del as { skala?: number } | undefined;
  if (typeof del?.skala === "number") for (const form of [o.visa, ...o.former]) STORLEK.set(form, del.skala);
}
const cache = new WeakMap<Spec, SkapelsePlan>();


export const friSak = (t: TillbehorSpec) => (arSak(t.id) || !!TILLBEHOR[t.id]) && !((arPlagg(t.id) || !!TILLBEHOR[t.id]) && barsPaKropp(t));
export function modellMatt(id: string): Matt {
  const m = MATT[id];
  return m ? [m[0]!, m[1]!, m[2]!, m[3]] : [malhojd(id), malhojd(id), malhojd(id)];
}
export function delRuta(m: Matt, position: Vektor, skala = 1): Ruta3 {
  const [x, y, z] = position, botten = (m[3] ?? 0) * skala;
  return { min: [x - m[0] * skala / 2, y + botten, z - m[2] * skala / 2], max: [x + m[0] * skala / 2, y + botten + m[1] * skala, z + m[2] * skala / 2] };
}
function forena(a: Ruta3, b: Ruta3) {
  for (let i = 0; i < 3; i++) { a.min[i] = Math.min(a.min[i]!, b.min[i]!); a.max[i] = Math.max(a.max[i]!, b.max[i]!); }
}

/** Måtten kan ersättas med verkligt uppmätta modellmått i geometriprovet. */
export function byggSkapelsePlan(spec: Spec, matt = modellMatt): SkapelsePlan {
  const kroppMatt = matt(spec.kropp), kropp: Vektor = [0, 0, 0];
  const kroppRuta = kladesRuta(spec.kropp, spec.tillbehor ?? [], kroppMatt);
  const saker: DelPlan[] = [];
  const regler = new Map<DelPlan, Regel>();
  let forstaFria = true;
  for (const [index, t] of (spec.tillbehor ?? []).entries()) {
    if (!friSak(t)) continue;
    const relation = t.relation ?? (forstaFria && PLATTFORM.has(t.id) ? "på" : "med");
    forstaFria = false;
    const regel = REGLER[relation];
    const skala = t.egenskaper?.reduce((s, ord) => STORLEK.get(ord) ?? s, 1) ?? 1;
    for (let exemplar = 0; exemplar < (t.antal ?? 1); exemplar++) {
      const d: DelPlan = { t, index, exemplar, position: [0, 0, 0], skala, alpha: regel.genomskinlighet ?? 1 };
      regler.set(d, regel); saker.push(d);
    }
  }
  const valj = (lage: string) => saker.filter((d) => regler.get(d)!.lage === lage);
  const stod = valj("ovanpa"), inuti = valj("inuti"), under = valj("under");
  const stodHojd = stod.reduce((h, d) => h + matt(d.t.id)[1] * d.skala + regler.get(d)!.glipa, 0);
  // Behållare får samma inre golv. Flera behållare ligger runt varandra, med kroppen i samtliga.
  let golv = 0;
  for (const [i, d] of inuti.entries()) {
    const m = matt(d.t.id), g = regler.get(d)!.glipa;
    d.skala = Math.max(d.skala, (kroppRuta.max[0] - kroppRuta.min[0] + 2 * g) / (m[0] * 0.8), (stodHojd + kroppRuta.max[1] + g) / (m[1] * 0.75), (kroppRuta.max[2] - kroppRuta.min[2] + 2 * g) / (m[2] * 0.8)) * (1 + i * 0.15);
    golv = Math.max(golv, m[1] * d.skala * (FORMER[d.t.id]?.botten ?? 0.1));
  }
  for (const d of inuti) d.position[1] = golv - matt(d.t.id)[1] * d.skala * (FORMER[d.t.id]?.botten ?? 0.1);
  let stodY = golv;
  for (const d of stod) { d.position[1] = stodY; stodY += matt(d.t.id)[1] * d.skala + regler.get(d)!.glipa; }
  kropp[1] = stodY - (kroppMatt[3] ?? 0);
  // Alla under-saker ligger ovanför kroppen. Bord behåller fötterna på underlaget; flera staplas.
  let underY = 0;
  for (const d of under) {
    const m = matt(d.t.id), regel = regler.get(d)!, fri = FORMER[d.t.id]?.undersida;
    const topp = kropp[1] + kroppRuta.max[1] + regel.glipa + (regel.rorelsemarginal ?? 0);
    if (fri) d.skala = Math.max(d.skala, (topp - underY) / (m[1] * fri), (kroppRuta.max[0] - kroppRuta.min[0] + 2 * regel.glipa) / (m[0] * 0.8), (kroppRuta.max[2] - kroppRuta.min[2] + 2 * regel.glipa) / (m[2] * 0.8));
    else underY = Math.max(underY, topp);
    d.position[1] = underY; underY += m[1] * d.skala + regel.glipa;
  }
  const ruta: Ruta3 = { min: [...kroppRuta.min], max: [...kroppRuta.max] };
  ruta.min[1] += kropp[1]; ruta.max[1] += kropp[1];
  for (const d of saker.filter((d) => regler.get(d)!.lage !== "bredvid")) forena(ruta, delRuta(matt(d.t.id), d.position, d.skala));
  // Lediga saker placeras utanför hela den redan byggda gruppen, på marken.
  let hoger = ruta.max[0], vanster = ruta.min[0];
  for (const [i, d] of valj("bredvid").entries()) {
    const halv = matt(d.t.id)[0] * d.skala / 2, g = regler.get(d)!.glipa;
    if (i % 2 === 0) { d.position[0] = hoger + g + halv; hoger += 2 * halv + g; }
    else { d.position[0] = vanster - g - halv; vanster -= 2 * halv + g; }
    d.position[1] = 0;
    forena(ruta, delRuta(matt(d.t.id), d.position, d.skala));
  }
  return { kropp, saker, ruta, bunden: stod.length + inuti.length + under.length > 0 };
}

export function skapelsePlan(spec: Spec): SkapelsePlan {
  let p = cache.get(spec);
  if (!p) { p = byggSkapelsePlan(spec); cache.set(spec, p); }
  return p;
}
