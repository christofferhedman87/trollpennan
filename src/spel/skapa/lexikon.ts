// Nya Skapa: ett gemensamt uppslag för meningsremsan och Ordhjälpen. Läser samma tabeller som tolken
// (ord.json via tolk/lexikon.ts och bygg.json) men svarar bara på frågan "vilken fråga svarar ordet på?"
// (Vad? Hurdan? Har? Gör?) och vilken plats i meningen det har. Tolken själv är oförändrad.
import byggJson from "../../../data/bygg.json" with { type: "json" };
import { lasToken, matchaFras, ordFranForm } from "../../tolk/lexikon.ts";
import type { Ord } from "../../tolk/typer.ts";
import { ORD } from "../../tolk/data.ts";

const ORD_ALLA = ORD.ord;

export type Fraga = "vad" | "hurdan" | "har" | "gor";
/** Platsen i meningen, i den ordning adjektiven står före substantivet: storlek → känsla → färg → mönster. */
export type Slot = "vad" | "storlek" | "kansla" | "farg" | "monster" | "material" | "har" | "form" | "gor";
export type Genus = "en" | "ett";
export type Kalla = "ord" | "bygg" | "del" | "material" | "egenskap";

export type Uppslag = {
  id: string;
  fraga: Fraga;
  slot: Slot;
  kalla: Kalla;
  /** Antal ord i texten (2 för "sprutar eld", 3 för "upp och ner"). */
  n: number;
  /** Substantivets genus (Vad). */
  genus?: Genus;
  /** Ordet står i obestämd singular ("hus", inte "huset" eller "husen"). */
  bas?: boolean;
  /** Adjektivets former: en-form och ett-form. */
  bojning?: { en: string; ett: string };
};

type ByggOrd = { id: string; genus: Genus; former: string[]; typ: string };
type ByggDel = { id: string; genus: Genus; former: string[] };
type Egenskap = { id: string; former: string[]; andra: string[] };
const BJ = byggJson as unknown as {
  bygg_ord: ByggOrd[];
  delar: ByggDel[];
  material: { id: string; forled: string }[];
  egenskaper: { lista: Egenskap[] };
  form: { fraser: string[][] };
};

export const BYGG_ORD = BJ.bygg_ord;
export const BYGG_DELAR = BJ.delar;
export const BYGG_MATERIAL = BJ.material;
export const EGENSKAPER = BJ.egenskaper.lista;
export const FORM_FRASER = BJ.form.fraser;
/** Egenskaper som är en känsla (står före ordet). De andra (flygande, dansande …) är något bygget gör. */
export const KANSLOR = new Set(["magisk", "varm", "mysig", "upp_och_ner"]);

const byggForm = new Map<string, { b: ByggOrd; k: number }>();
for (const b of BYGG_ORD) b.former.forEach((f, k) => { if (!byggForm.has(f)) byggForm.set(f, { b, k }); });
const delForm = new Map<string, ByggDel>();
for (const d of BYGG_DELAR) for (const f of d.former) if (!delForm.has(f)) delForm.set(f, d);
const material = new Map<string, string>();
for (const m of BYGG_MATERIAL) { material.set(m.id, m.id); material.set(m.forled, m.id); }
/** Egenskapernas former, även flerordsformen "upp och ner". */
const egenskapForm = new Map<string, Egenskap>();
const egenskapVerb = new Map<string, Egenskap>();
for (const e of EGENSKAPER) {
  for (const f of e.former) egenskapForm.set(f, e);
  for (const f of e.andra) egenskapVerb.set(f, e);
}

const genusAv = (o: Ord): Genus => (o.genus === "n" ? "ett" : "en");

function franOrd(o: Ord, w: string, n: number): Uppslag | null {
  const bas = w === o.visa || w === o.id || w === o.former[0];
  switch (o.klass) {
    case "djur":
    case "foremal":
      return { id: o.id, fraga: "vad", slot: "vad", kalla: "ord", n, genus: genusAv(o), bas };
    case "farg":
    case "storlek":
    case "monster":
    case "egenskap": {
      if (o.klass === "monster" && o.efter === "med") return { id: o.id, fraga: "har", slot: "har", kalla: "ord", n };
      const b = o.bojning;
      const slot: Slot = o.klass === "egenskap" ? "kansla" : o.klass;
      return { id: o.id, fraga: "hurdan", slot, kalla: "ord", n, ...(b?.u && b?.n ? { bojning: { en: b.u, ett: b.n } } : {}) };
    }
    case "tillbehor":
      return { id: o.id, fraga: "har", slot: "har", kalla: "ord", n, genus: genusAv(o), bas };
    case "formaga":
      return { id: o.id, fraga: "gor", slot: "gor", kalla: "ord", n };
  }
  return null;
}

function franBygg(w: string): Uppslag | null {
  const t = byggForm.get(w);
  return t ? { id: t.b.id, fraga: "vad", slot: "vad", kalla: "bygg", n: 1, genus: t.b.genus, bas: t.k === 0 } : null;
}
function franDel(w: string): Uppslag | null {
  const d = delForm.get(w);
  return d ? { id: d.id, fraga: "har", slot: "har", kalla: "del", n: 1, genus: d.genus, bas: w === d.former[0] } : null;
}
function franMaterial(w: string): Uppslag | null {
  const m = material.get(w);
  return m ? { id: m, fraga: "hurdan", slot: "material", kalla: "material", n: 1 } : null;
}
function franEgenskap(tokens: string[], i: number): Uppslag | null {
  const tre = tokens.slice(i, i + 3).join(" ");
  const e3 = egenskapForm.get(tre);
  if (e3) return { id: e3.id, fraga: "hurdan", slot: "kansla", kalla: "egenskap", n: 3 };
  const w = tokens[i]!;
  const e = egenskapForm.get(w);
  if (!e) return null;
  return { id: e.id, fraga: "hurdan", slot: "kansla", kalla: "egenskap", n: 1, bojning: { en: e.former[0]!, ett: e.former[1]! } };
}
function franEgenskapVerb(w: string): Uppslag | null {
  const e = egenskapVerb.get(w);
  return e ? { id: e.id, fraga: "gor", slot: "gor", kalla: "egenskap", n: 1 } : null;
}

export type Sammanhang = "fri" | "med" | "som" | "av" | "form";

/** Slå upp ordet på plats i i sitt sammanhang. Ordningen avgör när ett ord finns på flera ställen
 *  ("torn" är både byggord och del, "guld" både färg och material). */
export function slaUpp(tokens: string[], i: number, ctx: Sammanhang, typ: "djur" | "bygg" = "djur"): Uppslag | null {
  const w = tokens[i];
  if (!w) return null;
  const fras = matchaFras(tokens, i);
  if (fras && fras.n > 1) {
    const u = franOrd(fras.ord, w, fras.n);
    if (u) return u;
  }
  const ord = ordFranForm(w);
  const ordU = ord ? franOrd(ord, w, 1) : null;
  const ordEj = ord && ord.klass !== "foremal" ? ordU : null;
  if (ctx === "med") return franDel(w) ?? ordEj ?? franBygg(w) ?? ordU ?? franMaterial(w);
  if (ctx === "av") return franMaterial(w) ?? ordEj ?? franBygg(w) ?? ordU;
  if (ctx === "som") {
    if (typ === "bygg") return franEgenskapVerb(w) ?? franEgenskap(tokens, i) ?? ordEj ?? franBygg(w) ?? ordU;
    return ordEj ?? franEgenskapVerb(w) ?? franEgenskap(tokens, i) ?? franBygg(w) ?? ordU;
  }
  if (ctx === "form") {
    const u = franBygg(w) ?? ordEj ?? ordU;
    return u && u.fraga === "vad" ? { ...u, fraga: "hurdan", slot: "form" } : u;
  }
  if (typ === "bygg") {
    const e = franEgenskap(tokens, i);
    if (e && (ordEj?.fraga !== "vad")) return e;
  }
  return ordEj ?? franBygg(w) ?? franEgenskap(tokens, i) ?? ordU ?? franMaterial(w) ?? franDel(w) ?? franEgenskapVerb(w);
}

/** Småord som binder ihop meningen. Står i dämpad färg och kan inte ge guld. */
export function arSmaord(w: string): boolean {
  const t = lasToken(w);
  if (t && (t.t === "artikel" || t.t === "antal" || t.t === "funk")) return true;
  return SMAORD_EXTRA.has(w);
}
const SMAORD_EXTRA = new Set(["av", "ser", "ut", "liknar", "formad", "format", "formade", "form", "heter", "kallas", "för", "den", "det", "jätte", "super", "pytte", "mini"]);

/** Hur många ord en formfras tar ("som ser ut som" = 4) om den börjar på plats i. */
export function formFrasVid(tokens: string[], i: number): number {
  let bast = 0;
  for (const f of FORM_FRASER) {
    if (f.length > bast && f.every((w, j) => tokens[i + j] === w)) bast = f.length;
  }
  return bast;
}

export function genusFor(id: string, kalla: Kalla): Genus | undefined {
  if (kalla === "bygg") return BYGG_ORD.find((b) => b.id === id)?.genus;
  if (kalla === "del") return BYGG_DELAR.find((d) => d.id === id)?.genus;
  const o = ordFranForm(id);
  return o ? genusAv(o) : undefined;
}

/** Första ordet i en flerordsfras ("sprutar" i "sprutar eld", "upp" i "upp och ner"). Mellanslaget efter ett sådant
 *  ord avslutar inte ordet, och ordet kollas inte förrän frasen är klar. */
const FRAS_START = new Set<string>();
for (const o of ORD_ALLA) if (o.fras && o.fras.length > 1 && !o.valfritt_ord2) for (const w of o.fras[0] ?? []) FRAS_START.add(w);
for (const e of EGENSKAPER) for (const f of e.former) if (f.includes(" ")) FRAS_START.add(f.split(" ")[0]!);
export function arFrasStart(w: string): boolean {
  const t = w.toLocaleLowerCase("sv");
  return FRAS_START.has(t) && !ordFranForm(t) && !byggForm.has(t);
}
