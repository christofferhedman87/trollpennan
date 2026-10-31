// Nya Skapa 6.7: Ordhjälpens hylla. Hjälporden är en liten del av allt som går att skapa: djurens hjälpord är
// orden med niva "kort" i ord.json, byggens står i skapa-ui.json → hjalpord. Varje del slutar med "Skriv fler!"
// och antalet ord som bara finns för den som skriver. En aktiv önskan lägger till korten som uppfyller den.
import uiJson from "../../../data/skapa-ui.json" with { type: "json" };
import { ORD } from "../../tolk/data.ts";
import { ordFranForm } from "../../tolk/lexikon.ts";
import type { Ord } from "../../tolk/typer.ts";
import { BYGG_DELAR, BYGG_MATERIAL, BYGG_ORD, EGENSKAPER, KANSLOR, type Fraga, type Genus, type Kalla, type Slot } from "./lexikon.ts";
import type { Kort } from "./insattning.ts";
import { meningsbrickor } from "./meningsbrickor.ts";
import type { MOrd } from "./mening.ts";
import { kortBild } from "./ikoner.ts";

export type HyllKort = Kort & { nyckel: string; bild: string };
export type Sektion = { id: string; fraga: Fraga; namn: string; ikon: string; kort: HyllKort[]; fler: number | "alla" };
export type Typ = "djur" | "bygg";

const UI = uiJson as unknown as { sektioner: Record<string, string>; hjalpord: Record<string, string[]> };
const H = UI.hjalpord;
const ALLA = ORD.ord;

const genusAv = (o: Ord): Genus => (o.genus === "n" ? "ett" : "en");
const nyckel = (k: Kort) => `${k.slot}:${k.id}`;
const med = (k: Kort): HyllKort => ({ ...k, nyckel: nyckel(k), bild: kortBild(k.id, k.lex, k.slot) });

function franOrd(o: Ord): HyllKort | null {
  const b = o.bojning?.u && o.bojning?.n ? { en: o.bojning.u, ett: o.bojning.n } : undefined;
  switch (o.klass) {
    case "djur":
    case "foremal":
      return med({ id: o.id, visa: o.visa, fraga: "vad", slot: "vad", lex: "ord", genus: genusAv(o) });
    case "farg":
    case "storlek":
    case "monster":
      return med({ id: o.id, visa: o.visa, fraga: "hurdan", slot: o.klass, lex: "ord", ...(b ? { bojning: b } : {}) });
    case "tillbehor":
      return med({ id: o.id, visa: o.visa, fraga: "har", slot: "har", lex: "ord", genus: genusAv(o) });
    case "formaga":
      return med({ id: o.id, visa: o.visa, fraga: "gor", slot: "gor", lex: "ord" });
  }
  return null;
}

function byggKort(id: string, slot: Slot = "vad"): HyllKort | null {
  const b = BYGG_ORD.find((x) => x.id === id);
  if (!b) return null;
  return med({ id, visa: b.former[0] ?? id, fraga: slot === "form" ? "hurdan" : "vad", slot, lex: "bygg", genus: b.genus });
}
function delKort(id: string): HyllKort | null {
  const d = BYGG_DELAR.find((x) => x.id === id);
  return d ? med({ id, visa: d.former[0] ?? id, fraga: "har", slot: "har", lex: "del", genus: d.genus }) : null;
}
function materialKort(id: string): HyllKort | null {
  return BYGG_MATERIAL.some((m) => m.id === id) ? med({ id, visa: id, fraga: "hurdan", slot: "material", lex: "material" }) : null;
}
/** Byggets egenskaper: en känsla står före ordet ("ett magiskt hus"), resten är något bygget gör ("som flyger"). */
export function egenskapKort(id: string): HyllKort | null {
  const e = EGENSKAPER.find((x) => x.id === id);
  if (!e) return null;
  if (KANSLOR.has(id)) {
    const fore = id !== "upp_och_ner";
    return med({ id, visa: e.former[0]!, fraga: "hurdan", slot: "kansla", lex: "egenskap", ...(fore ? { bojning: { en: e.former[0]!, ett: e.former[1]! } } : {}) });
  }
  const verb = e.andra.find((a) => /r$/.test(a)) ?? e.former[0]!;
  return med({ id, visa: verb, fraga: "gor", slot: "gor", lex: "egenskap" });
}

/** "Ser ut som" med ett djur eller en sak ("som ser ut som ett äpple"). */
export function formKort(id: string): HyllKort | null {
  const b = BYGG_ORD.find((x) => x.id === id);
  if (b) return byggKort(id, "form");
  const o = ordFranForm(id);
  if (!o || (o.klass !== "djur" && o.klass !== "foremal")) return null;
  return med({ id: o.id, visa: o.visa, fraga: "hurdan", slot: "form", lex: "ord", genus: genusAv(o) });
}

const finns = <T,>(x: T | null): x is T => x != null;
const kortOrd = (klass: string) => ALLA.filter((o) => o.klass === klass && o.niva === "kort");
const fler = (klass: string) => ALLA.filter((o) => o.klass === klass && o.niva !== "kort").length;
const byggTyp = (typer: string[]) => BYGG_ORD.filter((b) => typer.includes(b.typ)).length;

function sektion(id: string, fraga: Fraga, ikon: string, kort: HyllKort[], antal: number | "alla"): Sektion {
  return { id, fraga, namn: UI.sektioner[id] ?? id, ikon, kort, fler: antal };
}

/** Hyllans delar i ordningen Vad? → Hurdan? → Har → Gör, för en mening om ett djur eller ett bygge. */
const hyllCache = new Map<Typ, Sektion[]>();
export function hylla(typ: Typ): Sektion[] {
  const c = hyllCache.get(typ);
  if (c) return c;
  const h = byggHylla(typ);
  hyllCache.set(typ, h);
  return h;
}

function byggHylla(typ: Typ): Sektion[] {
  const vad: Sektion[] = [
    sektion("djur", "vad", "djur", kortOrd("djur").map(franOrd).filter(finns), fler("djur")),
    sektion("hus", "vad", "hus", H.hus!.map((id) => byggKort(id)).filter(finns), byggTyp(["byggnad", "djurhem"]) - H.hus!.length),
    sektion("natur", "vad", "natur", H.natur!.map((id) => byggKort(id)).filter(finns), byggTyp(["natur"]) - H.natur!.length),
    sektion("lek", "vad", "lek", H.lek!.map((id) => byggKort(id)).filter(finns), byggTyp(["lek"]) - H.lek!.length),
  ];
  const farg = sektion("farg", "hurdan", "farg", kortOrd("farg").map(franOrd).filter(finns), fler("farg"));
  const storlek = sektion("storlek", "hurdan", "storlek", kortOrd("storlek").map(franOrd).filter(finns), fler("storlek"));
  if (typ === "djur") {
    return [
      ...vad,
      storlek,
      farg,
      sektion("monster", "hurdan", "monster", kortOrd("monster").map(franOrd).filter(finns), fler("monster")),
      sektion("klader", "har", "tillbehor", kortOrd("tillbehor").map(franOrd).filter(finns), fler("tillbehor")),
      sektion("kan", "gor", "formaga", kortOrd("formaga").map(franOrd).filter(finns), fler("formaga")),
    ];
  }
  const gor = EGENSKAPER.filter((e) => !KANSLOR.has(e.id)).length;
  return [
    ...vad,
    storlek,
    farg,
    sektion("material", "hurdan", "material", H.material!.map(materialKort).filter(finns), BYGG_MATERIAL.length - H.material!.length),
    sektion("form", "hurdan", "form", H.form!.map((id) => byggKort(id, "form")).filter(finns), "alla"),
    sektion("kansla", "hurdan", "egenskap", H.kansla!.map(egenskapKort).filter(finns), KANSLOR.size - H.kansla!.length),
    sektion("delar", "har", "delar", H.delar!.map(delKort).filter(finns), BYGG_DELAR.length - H.delar!.length),
    sektion("gor", "gor", "egenskap", H.gor!.map(egenskapKort).filter(finns), gor - H.gor!.length),
  ];
}

/** Kort för orden i en önskans exempel ("med halsduk", "ett hus som ser ut som ett äpple"). De glöder i hyllan
 *  och läggs till om de inte redan finns, så att varje önskan går att uppfylla med hjälporden (7.6). */
export function onskeKort(exempel: readonly string[]): HyllKort[] {
  const ut = new Map<string, HyllKort>();
  for (const ex of exempel) {
    const ord = ex.toLocaleLowerCase("sv").split(/\s+/).filter(Boolean).map((t) => ({ t, k: "kort" as const }));
    for (const b of meningsbrickor(ord)) {
      if (!b.id || !b.slot || b.klass === "smaord") continue;
      const k = kortFor(b.id, b.slot, b.lex);
      if (k && !ut.has(k.nyckel)) ut.set(k.nyckel, k);
    }
  }
  return [...ut.values()];
}

export function kortFor(id: string, slot: Slot, lex?: Kalla): HyllKort | null {
  if (lex === "bygg") return byggKort(id, slot === "form" ? "form" : "vad");
  if (slot === "form") return formKort(id);
  if (lex === "del") return delKort(id);
  if (lex === "material") return materialKort(id);
  if (lex === "egenskap") return egenskapKort(id);
  const o = ALLA.find((x) => x.id === id) ?? ordFranForm(id);
  const kort = o ? franOrd(o) : null;
  return kort && o?.klass === "foremal" && slot === "har" ? { ...kort, slot: "har", fraga: "har" } : kort;
}

/** Sektionen som ett kort hör hemma i, för korten en önskan lägger till. */
function sektionFor(k: HyllKort, del: Sektion[]): Sektion | undefined {
  const id =
    k.slot === "vad" ? (k.lex === "bygg" ? (BYGG_ORD.find((b) => b.id === k.id)?.typ === "natur" ? "natur" : BYGG_ORD.find((b) => b.id === k.id)?.typ === "lek" ? "lek" : "hus") : "djur")
    : k.slot === "har" ? (k.lex === "del" ? "delar" : "klader")
    : k.slot === "gor" ? (k.lex === "egenskap" ? "gor" : "kan")
    : k.slot;
  return del.find((s) => s.id === id) ?? del.find((s) => s.fraga === k.fraga);
}

/** Hyllan med önskans kort först i sina delar. */
export function hyllaMedOnskan(typ: Typ, onskade: readonly HyllKort[]): Sektion[] {
  const del = hylla(typ).map((s) => ({ ...s, kort: [...s.kort] }));
  for (const k of [...onskade].reverse()) {
    const s = sektionFor(k, del);
    if (!s) continue;
    const i = s.kort.findIndex((x) => x.nyckel === k.nyckel);
    if (i >= 0) s.kort.splice(i, 1);
    s.kort.unshift(k);
  }
  return del;
}

/** 6.7: har barnet börjat skriva ett ord visas först hjälporden som börjar likadant. */
export function prefixKort(del: readonly Sektion[], prefix: string): HyllKort[] {
  const p = prefix.toLocaleLowerCase("sv");
  if (!p) return [];
  const sett = new Set<string>();
  const ut: HyllKort[] = [];
  for (const s of del) for (const k of s.kort) {
    if (!k.visa.startsWith(p) || sett.has(k.visa)) continue;
    sett.add(k.visa);
    ut.push(k);
  }
  return ut;
}

/** Ordet som kortet visar just nu: adjektiv i meningens form ("rött" om det står "ett hus"). */
export function kortVisa(k: Kort, genus: Genus): string {
  return k.bojning ? k.bojning[genus] : k.visa;
}

/** Meningens genus (efter första Vad). */
export function meningensGenus(ord: readonly MOrd[]): Genus {
  return meningsbrickor(ord).find((b) => b.slot === "vad")?.genus ?? "en";
}
/** Kortets ord står redan i meningen som barnets eget guldord. */
export function arGuld(ord: readonly MOrd[], kort: Kort): boolean {
  return meningsbrickor(ord).some((b) => b.id === kort.id && b.guld);
}
/** Skrivord = känt ord som inte finns bland hjälpkorten. */
export function arSkrivord(id: string): boolean {
  return hylla("djur").concat(hylla("bygg")).every((s) => s.kort.every((k) => k.id !== id));
}
