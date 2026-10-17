import { avstand, felgrans } from "./avstand.ts";
import { ORD } from "./data.ts";
import gavaJson from "../../data/gavor.json" with { type: "json" };
import { bojBygg } from "./byggtolk.ts";

type GavaOrd = {
  id: string;
  genus: "en" | "ett";
  former: string[];
  farg: string;
  taggar: string[];
};

type GavaData = { gavor: GavaOrd[] };

export const GAVOR = gavaJson as GavaData;

const ANTAL: Record<string, number> = { ...ORD.funktionsord.antal, en: 1, ett: 1 };

type Adj = { klass: string; id: string };

const adj = new Map<string, Adj>();
for (const e of ORD.ord) {
  if (e.klass !== "farg" && e.klass !== "storlek") continue;
  if (e.id === "guld" || e.id === "silver") continue;
  for (const f of e.former) adj.set(f, { klass: e.klass, id: e.id });
  adj.set(e.visa, { klass: e.klass, id: e.id });
  adj.set(e.id, { klass: e.klass, id: e.id });
}

const gf = new Map<string, { g: GavaOrd; k: number }>();
for (const g of GAVOR.gavor) {
  g.former.forEach((f, k) => {
    if (!gf.has(f)) gf.set(f, { g, k });
  });
}

const djurFormer = new Set<string>();
for (const e of ORD.ord) {
  if (e.klass !== "djur") continue;
  for (const f of e.former) djurFormer.add(f);
  djurFormer.add(e.id);
  djurFormer.add(e.visa);
}

export type GavaTolk = {
  gava: string;
  antal: number;
  antalOrd: string | null;
  farg: string;
  ord: string;
  taggar: string[];
  adj: Adj[];
};

export type GavaUtfall =
  | { typ: "gavor"; formel: string; gavor: GavaTolk[]; okanda: string[] }
  | { typ: "djur" }
  | { typ: "forslag"; token: string; text: string; forslag: string }
  | { typ: "okant"; okanda: string[] }
  | { typ: "tom" };

function narmast(token: string): string | null {
  const gr = felgrans(token.length);
  let best: { form: string; avst: number } | null = null;
  for (const form of gf.keys()) {
    if (form === token) continue;
    if (Math.abs(form.length - token.length) > gr + 1) continue;
    const d = avstand(token, form);
    if (d <= 0 || d > gr) continue;
    if (!best || d < best.avst) best = { form, avst: d };
  }
  return best?.form ?? null;
}

export function formelGava(x: GavaTolk): string {
  const g = GAVOR.gavor.find((y) => y.id === x.gava);
  if (!g) return x.ord;
  if (x.antalOrd === "lite") return `lite ${g.former[0]}`;
  const pl = x.antal > 1;
  const a = x.adj.map((z) => bojBygg(z.id, g.genus, pl)).join(" ");
  const art = pl ? x.antalOrd ?? "" : g.genus;
  const ord = pl ? g.former[2]! : g.former[0]!;
  return [art, a, ord].filter(Boolean).join(" ");
}

export function tolkaGava(fras: string): GavaUtfall {
  const t = fras.toLocaleLowerCase("sv").match(/[a-zåäö]+/g) ?? [];
  if (t.some((w) => djurFormer.has(w) && !gf.has(w))) return { typ: "djur" };
  const out: GavaTolk[] = [];
  const ok: string[] = [];
  let pa: [number | "lite", string] | null = null;
  let adjs: Adj[] = [];
  for (const w of t) {
    if (w === "och") continue;
    if (w === "lite") {
      pa = ["lite", "lite"];
      continue;
    }
    if (w in ANTAL) {
      pa = [ANTAL[w]!, w];
      continue;
    }
    const a = adj.get(w);
    if (a) {
      adjs.push(a);
      continue;
    }
    const traff = gf.get(w);
    if (traff) {
      const { g, k } = traff;
      const n =
        pa && pa[0] === "lite" ? 1 : pa && typeof pa[0] === "number" ? Math.min(pa[0], 5) : k >= 2 || g.former[0] === g.former[2] ? 2 : 1;
      const farg = adjs.find((x) => x.klass === "farg")?.id ?? g.farg;
      out.push({
        gava: g.id,
        antal: n,
        antalOrd: pa ? pa[1] : null,
        farg,
        ord: w,
        taggar: g.taggar,
        adj: adjs,
      });
      pa = null;
      adjs = [];
      continue;
    }
    ok.push(w);
  }
  if (out.length) {
    return { typ: "gavor", formel: out.map(formelGava).join(" och "), gavor: out, okanda: ok };
  }
  const okand = ok[0];
  if (okand) {
    const hit = narmast(okand);
    if (hit) return { typ: "forslag", token: okand, text: `Menade du ${hit}?`, forslag: hit };
    return { typ: "okant", okanda: ok };
  }
  return { typ: "tom" };
}
