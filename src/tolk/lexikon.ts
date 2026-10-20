import { avstand, felgrans } from "./avstand.ts";
import { ORD } from "./data.ts";
import entiteterJson from "../../data/entiteter.json" with { type: "json" };
import type { Forled, Ord } from "./typer.ts";

export const ALLA = ORD.ord;

const formMap = new Map<string, Ord>();
for (const o of ALLA) {
  const former = new Set<string>([o.visa, o.id, ...(o.former ?? [])]);
  for (const f of former) {
    if (!f) continue;
    const prev = formMap.get(f);
    if (!prev) formMap.set(f, o);
    else if (prev.klass !== "djur" && o.klass === "djur") formMap.set(f, o);
  }
}

// R3G: varje entitet med modell som inte är ett djur (föremål, natur, byggnad, mat, fordon, kläder) blir ett ord av klass "foremal".
// Härleds ur entiteter.json (fältet ord, annars nyckeln) och böjs med en regel för båda genus. Ett ord som redan finns i ord.json vinner alltid.
const VOKAL = /[aeiouyåäö]$/;
export function foremalsFormer(w: string): { singular: string[]; plural: string[] } {
  const v = VOKAL.test(w);
  const singular = [w, v ? w + "n" : w + "en", v ? w + "t" : w + "et"];
  const plural = new Set<string>();
  if (w.endsWith("a")) plural.add(w.slice(0, -1) + "or");
  else if (w.endsWith("e")) plural.add(w.slice(0, -1) + "ar");
  else if (!v) {
    plural.add(w + "ar");
    plural.add(w + "er");
  }
  if (v) plural.add(w + "na");
  for (const p of [...plural]) if (!p.endsWith("na")) plural.add(p + "na");
  return {
    singular: [...new Set(singular)],
    plural: [...plural].filter((p) => !singular.includes(p)),
  };
}

type EntRad = { typ: string; modell: string | null; ord?: string[] };
export const FOREMAL: Ord[] = [];
// Ord som redan betyder något i grammatiken (förled som "ljus", förstärkning, funktionsord) tas aldrig.
const reserverade = new Set<string>([
  ...Object.keys(ORD.sammansattningar.forled),
  ...Object.keys(ORD.funktionsord.forstarkning),
  ...Object.keys(ORD.funktionsord.antal),
  ...ORD.funktionsord.artiklar,
  ...ORD.funktionsord.som,
  ...ORD.funktionsord.med,
  ...ORD.funktionsord.och,
  ...ORD.funktionsord.kan,
]);
const sakRader = Object.entries(
  (entiteterJson as { entiteter: Record<string, EntRad> }).entiteter,
).filter(([, e]) => e.typ !== "djur" && !!e.modell);
// Ett ord går först till entiteten med samma nyckel ("lok" → lok, inte ånglok), sedan i dataordning.
const sakOrd: [string, string][] = [];
for (const [id, e] of sakRader)
  for (const w of e.ord?.length ? e.ord : [id]) if (w === id) sakOrd.push([id, w]);
for (const [id, e] of sakRader)
  for (const w of e.ord?.length ? e.ord : [id]) if (w !== id) sakOrd.push([id, w]);
for (const [id, w] of sakOrd) {
  if (!w || w.includes(" ") || formMap.has(w) || reserverade.has(w)) continue;
  const { singular, plural } = foremalsFormer(w);
  const o: Ord = {
    id: w,
    klass: "foremal",
    niva: "fritt",
    visa: w,
    former: [...singular, ...plural],
    plural,
    del: { kropp: id },
  };
  FOREMAL.push(o);
  for (const f of o.former) if (!formMap.has(f) && !reserverade.has(f)) formMap.set(f, o);
}

/** B6.2: förled som också är en sak ("ljus" = stearinljus). Grammatiken behåller förledet ("en ljus katt"),
 *  men ensamt eller före med/och/som blir ordet saken (tolka.ts). Böjda former ("ljuset", "ljusen") är bara saken. */
const LED_SAK = new Map<string, Ord>();
const forledNycklar = new Set(Object.keys(ORD.sammansattningar.forled));
for (const [id, w] of sakOrd) {
  if (!forledNycklar.has(w) || LED_SAK.has(w)) continue;
  const { singular, plural } = foremalsFormer(w);
  const o: Ord = { id: w, klass: "foremal", niva: "fritt", visa: w, former: [...singular, ...plural], plural, del: { kropp: id } };
  LED_SAK.set(w, o);
  for (const f of o.former) if (f !== w && !formMap.has(f) && !reserverade.has(f)) formMap.set(f, o);
}
export function ledSak(token: string): Ord | undefined {
  return LED_SAK.get(token);
}

/** B6.2: ord som redan betyder något annat (mönster "regnbåge", förmåga "eld") men också har en modell som sak.
 *  Nyckel = varje form av ordet ("regnbåge", "regnbågen", "elden" …). tolka.ts väljer saken bara när ordet står fristående. */
const DUBBEL_SAK = new Map<string, Ord>();
for (const [id, w] of sakOrd) {
  const annan = formMap.get(w);
  if (!annan || annan.klass === "foremal" || annan.klass === "djur" || DUBBEL_SAK.has(w)) continue;
  const o: Ord = { id: w, klass: "foremal", niva: "fritt", visa: w, former: [...new Set([...annan.former, w])], plural: [], del: { kropp: id } };
  for (const f of o.former) if (!DUBBEL_SAK.has(f)) DUBBEL_SAK.set(f, o);
}
export function dubbelSak(token: string): Ord | undefined {
  return DUBBEL_SAK.get(token);
}

export type Fras = { ord: Ord; slots: string[][]; valfritt: boolean };

const fraser: Fras[] = [];
for (const o of ALLA) {
  if (o.fras && o.fras.length) {
    fraser.push({ ord: o, slots: o.fras, valfritt: !!o.valfritt_ord2 });
  }
}
fraser.sort((a, b) => b.slots.length - a.slots.length);

export function ordMedId(id: string): Ord | undefined {
  return ALLA.find((o) => o.id === id);
}

export function ordFranForm(form: string): Ord | undefined {
  return formMap.get(form);
}

export function matchaFras(tokens: string[], i: number): { ord: Ord; n: number } | null {
  let best: { ord: Ord; n: number } | null = null;
  for (const fr of fraser) {
    const n = langd(tokens, i, fr);
    if (n > 0 && (!best || n > best.n)) best = { ord: fr.ord, n };
  }
  return best;
}

function langd(tokens: string[], i: number, fr: Fras): number {
  const a = fr.slots[0];
  if (!a || i >= tokens.length || !a.includes(tokens[i] ?? "")) return 0;
  if (fr.slots.length < 2) return 1;
  const b = fr.slots[1];
  if (b && i + 1 < tokens.length && b.includes(tokens[i + 1] ?? "")) return 2;
  if (fr.valfritt) return 1;
  return 0;
}

const artiklar = new Set(ORD.funktionsord.artiklar);
const antalOrd = ORD.funktionsord.antal;
const forstarkning = ORD.funktionsord.forstarkning;
const funkSom = new Set(ORD.funktionsord.som);
const funkMed = new Set(ORD.funktionsord.med);
const funkOch = new Set(ORD.funktionsord.och);
const funkKan = new Set(ORD.funktionsord.kan);

export type Funk = "som" | "med" | "och" | "kan";

export function lasToken(
  token: string,
):
  | { t: "antal"; n: number }
  | { t: "artikel" }
  | { t: "boost"; dir: string; skala: number; raw: string }
  | { t: "funk"; v: Funk }
  | { t: "ord"; o: Ord }
  | null {
  if (antalOrd[token] != null) return { t: "antal", n: antalOrd[token]! };
  if (artiklar.has(token)) return { t: "artikel" };
  if (forstarkning[token]) {
    const led = ORD.sammansattningar.forled[token];
    const dir = forstarkning[token]!;
    const skala = led?.skala ?? (dir === "storlek+" ? 1.6 : 0.5);
    return { t: "boost", dir, skala, raw: token };
  }
  if (funkSom.has(token)) return { t: "funk", v: "som" };
  if (funkMed.has(token)) return { t: "funk", v: "med" };
  if (funkOch.has(token)) return { t: "funk", v: "och" };
  if (funkKan.has(token)) return { t: "funk", v: "kan" };
  // "och så" hanteras av anroparen innan enkelord.
  const o = formMap.get(token);
  if (o) return { t: "ord", o };
  return null;
}

export function arOchSa(tokens: string[], i: number): boolean {
  return tokens[i] === "och" && tokens[i + 1] === "så";
}

export type Suffix = { ord: Ord; form: string; kind: "djur" | "tillbehor" };

const suffixen: Suffix[] = [];
for (const o of ALLA) {
  if (o.klass !== "djur" && o.klass !== "tillbehor") continue;
  const former = new Set<string>([
    o.id,
    o.visa,
    ...(o.former ?? []),
    ...(o.sammansattningsled ?? []),
  ]);
  for (const form of former) {
    if (form.length >= 3) suffixen.push({ ord: o, form, kind: o.klass });
  }
}
suffixen.sort((a, b) => b.form.length - a.form.length || (a.kind === "djur" ? -1 : 1));

export function langstaSuffix(ord: string): Suffix | null {
  for (const s of suffixen) {
    if (ord.endsWith(s.form) && ord.length - s.form.length >= 2) return s;
  }
  return null;
}

export type Atom =
  | { kind: "forled"; key: string; len: number; del: Forled }
  | { kind: "djur"; ord: Ord; len: number };

const atomer: { kind: "forled"; key: string; del: Forled }[] = Object.entries(
  ORD.sammansattningar.forled,
).map(([key, del]) => ({ kind: "forled" as const, key, del }));

const djurStam: { ord: Ord; stam: string }[] = [];
for (const o of ALLA) {
  if (o.klass !== "djur") continue;
  const stammar = new Set<string>([...(o.sammansattningsled ?? []), o.visa, o.id]);
  for (const stam of stammar) {
    if (stam.length >= 3) djurStam.push({ ord: o, stam });
  }
}

export function langstaAtom(rest: string): Atom | null {
  let best: Atom | null = null;
  for (const a of atomer) {
    if (rest.startsWith(a.key) && (!best || a.key.length > best.len)) {
      best = { kind: "forled", key: a.key, len: a.key.length, del: a.del };
    }
  }
  for (const d of djurStam) {
    if (rest.startsWith(d.stam) && (!best || d.stam.length > best.len)) {
      best = { kind: "djur", ord: d.ord, len: d.stam.length };
    }
  }
  return best;
}

export function forslagTill(token: string): { id: string; visa: string; avst: number }[] {
  const grans = felgrans(token.length);
  const bast = new Map<string, number>();
  for (const o of ALLA) {
    const former = new Set<string>([o.visa, o.id, ...(o.former ?? [])]);
    for (const f of former) {
      if (!f || f === token) continue;
      if (Math.abs(f.length - token.length) > grans + 1) continue;
      const d = avstand(token, f);
      const prev = bast.get(o.id);
      if (prev == null || d < prev) bast.set(o.id, d);
    }
  }
  const inom = [...bast.entries()].filter(([, d]) => d <= grans + 1e-9 && d > 0);
  if (!inom.length) return [];
  inom.sort((a, b) => a[1] - b[1]);
  const bastAvst = inom[0]![1];
  const lika = inom.filter(([, d]) => Math.abs(d - bastAvst) < 1e-9);
  lika.sort((a, b) => {
    const oa = ordMedId(a[0])!;
    const ob = ordMedId(b[0])!;
    const ka = oa.niva === "kort" ? 0 : 1;
    const kb = ob.niva === "kort" ? 0 : 1;
    if (ka !== kb) return ka - kb;
    return oa.visa.localeCompare(ob.visa, "sv");
  });
  return lika.slice(0, 3).map(([id, avst]) => {
    const o = ordMedId(id)!;
    return { id, visa: o.visa, avst };
  });
}

export function kortDjur(n: number): { id: string; visa: string }[] {
  return ALLA.filter((o) => o.klass === "djur" && o.niva === "kort")
    .slice(0, n)
    .map((o) => ({ id: o.id, visa: o.visa }));
}

export function hemligaAntal(): number {
  return ALLA.filter((o) => o.niva === "fritt").length;
}

export function arPluralForm(o: Ord, form: string): boolean {
  if (o.klass === "foremal") return !!o.plural?.includes(form);
  if (o.genus === "pl") return true;
  if (form === o.visa || form === o.id) return false;
  if (!o.former.includes(form) && form !== o.visa) {
    // sammansättningsled är stammen, inte plural
    if (o.sammansattningsled?.includes(form)) return false;
  }
  const visa = o.visa;
  if (o.genus === "n") return !(form === visa + "et" || form === visa + "t");
  return !(form === visa + "en" || form === visa + "n");
}

export function pluralOrd(o: Ord): string {
  const visa = o.visa;
  for (const f of o.former) {
    if (f !== visa && arPluralForm(o, f) && !f.endsWith("na")) return f;
  }
  for (const f of o.former) {
    if (f !== visa && arPluralForm(o, f)) return f;
  }
  return visa;
}

export function boj(o: Ord, key: "u" | "n" | "pl"): string {
  return o.bojning?.[key] ?? o.visa;
}

export function forledTillOrd(key: string): Ord | undefined {
  return ordMedId(key);
}

export { antalOrd, forstarkning, ORD };
