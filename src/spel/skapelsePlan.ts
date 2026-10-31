// Samma lokala sammansättning i värld, hologram och placeringsregel. Ingen three eller lagringsmutation.
import data from "../../data/placering.json" with { type: "json" };
import mattJson from "../../data/modellmatt.json" with { type: "json" };
import ordJson from "../../data/ord.json" with { type: "json" };
import type { Relation, TillbehorSpec } from "../tolk/typer.ts";
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

export const barsPaKropp = (t: TillbehorSpec) => !t.relation || t.relation === "med";
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
  const saker: DelPlan[] = [];
  let ankare: DelPlan | undefined;
  let bredvid = 0;
  for (const [index, t] of (spec.tillbehor ?? []).entries()) {
    if (!friSak(t)) continue;
    const relation = t.relation ?? (index === 0 && PLATTFORM.has(t.id) ? "på" : "med");
    const regel = REGLER[relation], m = matt(t.id), form = FORMER[t.id];
    let skala = t.egenskaper?.reduce((s, ord) => STORLEK.get(ord) ?? s, 1) ?? 1;
    if (!ankare && regel.lage === "under" && form?.undersida) skala = Math.max(skala, (kroppMatt[1] + regel.glipa + (regel.rorelsemarginal ?? 0)) / (m[1] * form.undersida));
    if (!ankare && regel.lage === "inuti") skala = Math.max(skala, (kroppMatt[0] + 2 * regel.glipa) / (m[0] * 0.8), (kroppMatt[1] + regel.glipa) / (m[1] * 0.8), (kroppMatt[2] + 2 * regel.glipa) / (m[2] * 0.8));
    for (let exemplar = 0; exemplar < (t.antal ?? 1); exemplar++) {
      const d: DelPlan = { t, index, exemplar, position: [0, 0, 0], skala, alpha: regel.genomskinlighet ?? 1 };
      if (!ankare && regel.lage !== "bredvid") {
        ankare = d;
        if (regel.lage === "ovanpa") kropp[1] = m[1] * skala + regel.glipa - (kroppMatt[3] ?? 0);
        else if (regel.lage === "under" && !form?.undersida) d.position[1] = kroppMatt[1] + (kroppMatt[3] ?? 0) + regel.glipa;
        else if (regel.lage === "inuti") kropp[1] = m[1] * skala * (form?.botten ?? 0.1) - (kroppMatt[3] ?? 0);
      } else {
        const sida = bredvid % 2 === 0 ? 1 : -1;
        d.position = [sida * (kroppMatt[0] / 2 + m[0] * skala / 2 + regel.glipa + Math.floor(bredvid / 2) * (m[0] * skala + regel.glipa)), 0, 0];
        // När den första saken omger kroppen ligger följande saker utanför dess kant.
        if (ankare) d.position[0] += sida * matt(ankare.t.id)[0] * ankare.skala / 2;
        bredvid++;
      }
      saker.push(d);
    }
  }
  const ruta = delRuta(kroppMatt, kropp);
  for (const d of saker) forena(ruta, delRuta(matt(d.t.id), d.position, d.skala));
  return { kropp, saker, ruta, bunden: !!ankare };
}

export function skapelsePlan(spec: Spec): SkapelsePlan {
  let p = cache.get(spec);
  if (!p) { p = byggSkapelsePlan(spec); cache.set(spec, p); }
  return p;
}
