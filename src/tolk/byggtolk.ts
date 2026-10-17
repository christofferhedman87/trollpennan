import { avstand, felgrans } from "./avstand.ts";
import byggJson from "../../data/bygg.json" with { type: "json" };
import { ORD } from "./data.ts";

type ByggOrd = {
  id: string;
  genus: "en" | "ett";
  former: string[];
  typ: string;
  sida: string;
  hem: { kroppar: string[]; platser: number } | null;
  standardfarg: string;
  delar: string[];
  ritning: string;
  kit_nyckel?: string;
  efterled?: string;
  monster?: string;
};

type DelOrd = {
  id: string;
  genus: "en" | "ett";
  former: string[];
  max: number;
  ritning: string;
};

type Material = {
  id: string;
  forled: string;
  sida: string;
  farg: string;
  glans: boolean;
  alpha: number;
  ritning: string;
};

export type ByggData = {
  bygg_ord: ByggOrd[];
  delar: DelOrd[];
  material: Material[];
  max_pa_garden: number;
};

export const BYGG = byggJson as ByggData;

const ODEKL = new Set(["lila", "rosa", "orange", "ljusrosa", "gyllene"]);
const ANTAL: Record<string, number> = { ...ORD.funktionsord.antal, en: 1, ett: 1 };

type Adj = { klass: string; id: string };

const adj = new Map<string, Adj>();
for (const e of ORD.ord) {
  const monsterOk =
    e.klass === "monster" &&
    ["prickig", "randig", "glittrig", "spräcklig", "tigerrandig", "regnbågsfärgad", "skimrande", "gnistrande"].includes(e.id);
  if (e.klass === "farg" || e.klass === "storlek" || monsterOk) {
    if (e.id === "guld" || e.id === "silver") continue;
    for (const f of e.former) adj.set(f, { klass: e.klass, id: e.id });
    adj.set(e.visa, { klass: e.klass, id: e.id });
    adj.set(e.id, { klass: e.klass, id: e.id });
  }
}

const bord = new Map<string, { b: ByggOrd; k: number }>();
for (const b of BYGG.bygg_ord) {
  b.former.forEach((f, k) => {
    if (!bord.has(f)) bord.set(f, { b, k });
  });
}
const delar = new Map<string, { d: DelOrd; k: number }>();
for (const d of BYGG.delar) {
  d.former.forEach((f, k) => {
    if (!delar.has(f)) delar.set(f, { d, k });
  });
}
const mat = new Map(BYGG.material.map((m) => [m.id, m]));
const matForled = new Map(BYGG.material.map((m) => [m.forled, m]));

export type ByggDel = {
  del: string;
  antal: number;
  antalOrd: string | null;
  ord: string;
  adj: Adj[];
  material: string | null;
};

export type ByggeTolk = {
  bygg: string;
  ord: string;
  antal: number;
  antalOrd: string | null;
  adj: Adj[];
  material: string | null;
  delar: ByggDel[];
  sida: string;
  genus: "en" | "ett";
};

export type ByggUtfall =
  | { typ: "inget"; okanda: string[] }
  | { typ: "forslag"; token: string; text: string; forslag: { id: string; visa: string }[] }
  | { typ: "bygge"; formel: string; byggen: ByggeTolk[]; okanda: string[] };

function ordMed(id: string) {
  return ORD.ord.find((x) => x.id === id);
}

export function bojBygg(aid: string, genus: "en" | "ett", plural: boolean): string {
  if (ODEKL.has(aid)) return aid;
  const e = ordMed(aid);
  if (!e) return aid;
  const fs = e.former ?? [];
  if (aid === "liten") return plural ? "små" : genus === "ett" ? "litet" : "liten";
  if (aid === "pytteliten" || aid === "jätteliten") {
    const tab = {
      pytteliten: ["pyttesmå", "pyttelitet"],
      jätteliten: ["jättesmå", "jättelitet"],
    } as const;
    if (plural) return tab[aid][0];
    if (genus === "ett") return tab[aid][1];
    return aid;
  }
  if (plural) {
    const a = fs.find((f) => f.endsWith("a") && f !== aid);
    return a ?? aid;
  }
  if (genus === "ett") return fs.find((f) => f.endsWith("t") && f !== aid) ?? aid;
  return aid;
}

function splitComp(w: string): { b: ByggOrd; k: number; pre: string } | null {
  if (bord.has(w)) return null;
  const former = [...bord.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [f, träff] of former) {
    if (w.endsWith(f) && w.length > f.length) {
      const pre = w.slice(0, w.length - f.length);
      if (mat.has(pre) || matForled.has(pre)) return { b: träff.b, k: träff.k, pre: mat.has(pre) ? pre : matForled.get(pre)!.id };
    }
  }
  return null;
}

function fargForled(w: string): { text: string; visa: string } | null {
  const former = [...bord.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [f, träff] of former) {
    if (!w.endsWith(f) || w.length <= f.length) continue;
    const pre = w.slice(0, w.length - f.length);
    if (mat.has(pre) || matForled.has(pre)) continue;
    const a = adj.get(pre);
    if (!a || a.klass !== "farg") continue;
    const genus = träff.b.genus;
    const text = `Menade du ${genus} ${bojBygg(a.id, genus, false)} ${träff.b.former[0]}?`;
    return { text, visa: träff.b.former[0]! };
  }
  return null;
}

function narmast(token: string, former: string[]): string | null {
  const gr = felgrans(token.length);
  let best: { form: string; avst: number } | null = null;
  for (const form of former) {
    if (form === token) continue;
    if (Math.abs(form.length - token.length) > gr + 1) continue;
    const d = avstand(token, form);
    if (d <= 0 || d > gr) continue;
    if (!best || d < best.avst) best = { form, avst: d };
  }
  return best?.form ?? null;
}

function forslagFor(token: string): { id: string; visa: string; text: string } | null {
  const farg = fargForled(token);
  if (farg) return { id: farg.visa, visa: farg.visa, text: farg.text };
  const byggFormer = [...bord.keys()];
  const delFormer = [...delar.keys()];
  const hit = narmast(token, [...byggFormer, ...delFormer]);
  if (!hit) return null;
  return { id: hit, visa: hit, text: `Menade du ${hit}?` };
}

type Cur = {
  bygg: ByggOrd | null;
  ord: string | null;
  antal: number;
  antalOrd: string | null;
  adj: Adj[];
  material: string | null;
  delar: ByggDel[];
};

function ny(): Cur {
  return { bygg: null, ord: null, antal: 1, antalOrd: null, adj: [], material: null, delar: [] };
}

export function tolkaBygg(fras: string): ByggUtfall {
  const t = fras.toLocaleLowerCase("sv").match(/[a-zåäö]+/g) ?? [];
  const byggen: Cur[] = [];
  let cur = ny();
  let pendAntal: { n: number; w: string } | null = null;
  let pendAdj: Adj[] = [];
  let pendPl: boolean[] = [];
  let mode: "bygg" | "del" = "bygg";
  const okanda: string[] = [];
  let i = 0;
  while (i < t.length) {
    const w = t[i]!;
    if (w === "och") {
      let j = i + 1;
      while (j < t.length && (ANTAL[t[j]!] != null || adj.has(t[j]!))) j += 1;
      const nw = t[j];
      const byggTraff = nw && (bord.has(nw) || splitComp(nw));
      const delNu = mode === "del" && nw && delar.has(nw);
      if (byggTraff && !delNu) {
        byggen.push(cur);
        cur = ny();
        mode = "bygg";
      }
      i += 1;
      continue;
    }
    if (w === "med") {
      mode = "del";
      i += 1;
      continue;
    }
    if (w === "av") {
      const id = t[i + 1];
      const m = id ? mat.get(id) ?? matForled.get(id) : undefined;
      if (m) {
        const tgt = mode === "del" && cur.delar.length ? cur.delar[cur.delar.length - 1]! : cur;
        tgt.material = m.id;
        i += 2;
        continue;
      }
    }
    if (ANTAL[w] != null) {
      pendAntal = { n: ANTAL[w]!, w };
      i += 1;
      continue;
    }
    const a = adj.get(w);
    if (a) {
      pendAdj.push(a);
      pendPl.push(w.endsWith("a") && !ODEKL.has(w) && w !== a.id);
      i += 1;
      continue;
    }
    const del = delar.get(w);
    if (mode === "del" && del) {
      const n = pendAntal
        ? pendAntal.n
        : del.k >= 2 || pendPl.some(Boolean) || del.d.former[0] === del.d.former[2]
          ? 2
          : 1;
      cur.delar.push({
        del: del.d.id,
        antal: Math.min(n, del.d.max),
        antalOrd: pendAntal?.w ?? null,
        ord: w,
        adj: pendAdj,
        material: null,
      });
      pendAntal = null;
      pendAdj = [];
      pendPl = [];
      i += 1;
      continue;
    }
    const direkt = bord.get(w);
    const hit = direkt ? { b: direkt.b, k: direkt.k, pre: null as string | null } : splitComp(w);
    if (hit && mode === "bygg" && cur.bygg == null) {
      cur.bygg = hit.b;
      cur.ord = w;
      cur.adj = pendAdj;
      cur.material = hit.pre ?? cur.material;
      if (pendAntal) {
        cur.antal = Math.min(pendAntal.n, 3);
        cur.antalOrd = pendAntal.w;
      }
      pendAntal = null;
      pendAdj = [];
      pendPl = [];
      i += 1;
      continue;
    }
    okanda.push(w);
    i += 1;
  }
  byggen.push(cur);
  const klara = byggen.filter((b) => b.bygg).slice(0, 3);
  if (okanda.length) {
    for (const w of okanda) {
      const f = forslagFor(w);
      if (f) return { typ: "forslag", token: w, text: f.text, forslag: [{ id: f.id, visa: f.visa }] };
    }
  }
  if (!klara.length) return { typ: "inget", okanda };
  const tolkade: ByggeTolk[] = klara.map((b) => ({
    bygg: b.bygg!.id,
    ord: b.ord ?? b.bygg!.former[0]!,
    antal: b.antal,
    antalOrd: b.antalOrd,
    adj: b.adj,
    material: b.material,
    delar: b.delar,
    sida: b.bygg!.sida,
    genus: b.bygg!.genus,
  }));
  return { typ: "bygge", formel: tolkade.map(formelBygg).join(" och "), byggen: tolkade, okanda };
}

export function formelBygg(b: ByggeTolk): string {
  const bo = BYGG.bygg_ord.find((x) => x.id === b.bygg)!;
  const pl = b.antal > 1 || (!!b.antalOrd && b.antalOrd !== "en" && b.antalOrd !== "ett");
  let base = bo.former;
  let ordet = b.ord;
  if (!base.includes(ordet)) {
    const suf = [...base].sort((a, c) => c.length - a.length).find((f) => ordet.endsWith(f));
    const pre = suf ? ordet.slice(0, ordet.length - suf.length) : "";
    base = base.map((f) => pre + f);
    ordet = base[pl ? 2 : 0] ?? ordet;
  } else ordet = base[pl ? 2 : 0] ?? ordet;
  const adjs = b.adj.map((a) => bojBygg(a.id, bo.genus, pl)).join(" ");
  const art = pl ? b.antalOrd || "" : bo.genus;
  let s = [art, adjs, ordet].filter(Boolean).join(" ");
  if (b.material && !(b.ord || "").includes(b.material)) s += " av " + b.material;
  if (b.delar.length) {
    const parts = b.delar.map((d) => {
      const info = BYGG.delar.find((x) => x.id === d.del)!;
      const dpl = d.antal > 1;
      const a = d.adj.map((x) => bojBygg(x.id, info.genus, dpl)).join(" ");
      const num = dpl ? d.antalOrd || "" : d.del === "tak" ? "" : info.genus;
      const namn = dpl ? info.former[2] : info.former[0];
      return [num, a, namn].filter(Boolean).join(" ") + (d.material ? " av " + d.material : "");
    });
    s += " med " + (parts.length > 1 ? parts.slice(0, -1).join(", ") + " och " + parts[parts.length - 1] : parts[0]);
  }
  return s;
}

export function bestamdBygg(b: Pick<ByggeTolk, "bygg" | "adj" | "material" | "ord">): string {
  const bo = BYGG.bygg_ord.find((x) => x.id === b.bygg)!;
  let def = bo.former[1] ?? bo.former[0]!;
  if (b.material && (b.ord || "").includes(b.material)) {
    const suf = [...bo.former].sort((a, c) => c.length - a.length).find((f) => (b.ord || "").endsWith(f));
    const pre = suf ? (b.ord || "").slice(0, (b.ord || "").length - suf.length) : "";
    def = pre + (bo.former[1] ?? def);
    if (!b.adj.length) return def;
  }
  const aForm = b.adj
    .map((a) => (a.id === "liten" ? "lilla" : bojBygg(a.id, "en", true)))
    .filter(Boolean)
    .join(" ");
  const art = bo.genus === "ett" ? "det" : "den";
  if (aForm) return `${art} ${aForm} ${def}`;
  return def;
}

export function byggMedId(id: string): ByggOrd | undefined {
  return BYGG.bygg_ord.find((b) => b.id === id);
}

export function materialMed(id: string | null): Material | undefined {
  if (!id) return undefined;
  return BYGG.material.find((m) => m.id === id);
}

export function fargHexFor(id: string | null): string | null {
  if (!id) return null;
  const o = ORD.ord.find((x) => x.id === id && x.klass === "farg");
  const hex = o?.del?.farg;
  return hex && hex.startsWith("#") ? hex : null;
}
