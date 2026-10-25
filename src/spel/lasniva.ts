import lasningJson from "../../data/lasning.json" with { type: "json" };
import ledtradarJson from "../../data/ledtradar.json" with { type: "json" };
import { ljudStam } from "../tolk/avstand.ts";
import { gatUrval } from "./gata.ts";
import { fyll } from "./fyll.ts";

export type Lasniva = 1 | 2 | 3;
export type LasnivaVal = "auto" | Lasniva;
export type StavningsTyp = "dubbel" | "saknas" | "omkastad" | "ljud" | "allman";
export type StavningsFeedback = {
  nara: boolean;
  typ: StavningsTyp;
  rattPrefix: string;
  restenSkrivet: string;
  tips: string;
  forklaring: string;
};

type LedRad = { gata: string; gata_latt?: string; forsta: string; langd: number };
const LED = (ledtradarJson as { ledtradar: Record<string, LedRad> }).ledtradar;
const SVARA_RE = new RegExp(`(${lasningJson.lasniva.svara_ljud.join("|")})`, "i");
const DUBBEL_RE = /([bcdfghjklmnpqrstvwxz])\1/i;
const VOKAL_RE = /[aeiouyåäö]/i;
const UNDANTAG = lasningJson.lasniva.undantag as Partial<Record<string, Lasniva>>;

export function ordLasniva(id: string): Lasniva {
  const k = id.trim().toLowerCase();
  const u = UNDANTAG[k];
  if (u === 1 || u === 2 || u === 3) return u;
  if (k.length >= lasningJson.lasniva.niva3_min_langd) return 3;
  if (k.length <= lasningJson.lasniva.niva1_max_langd && !SVARA_RE.test(k) && !DUBBEL_RE.test(k)) return 1;
  return 2;
}

export function aktuellLasniva(funna: readonly string[] | Record<string, unknown>, val: LasnivaVal = "auto"): Lasniva {
  if (val === 1 || val === 2 || val === 3) return val;
  const n = Array.isArray(funna) ? funna.length : Object.keys(funna).length;
  if (n >= lasningJson.lasniva.auto_trappsteg.niva3_min_funna) return 3;
  if (n >= lasningJson.lasniva.auto_trappsteg.niva2_min_funna) return 2;
  return 1;
}

export function lasnivaUrval(kvar: readonly string[], platsHemliga: readonly string[] | undefined, niva: Lasniva): string[] {
  const bas = gatUrval([...kvar], platsHemliga);
  const exakt = bas.filter((ord) => ordLasniva(ord) === niva);
  const uppTill = bas.filter((ord) => ordLasniva(ord) <= niva);
  if (exakt.length) return [...exakt, ...uppTill.filter((ord) => ordLasniva(ord) !== niva)];
  return uppTill.length ? uppTill : bas;
}

export function delaStavelser(ord: string): string[] {
  const k = ord.trim().toLowerCase();
  if (!k) return [];
  const vok = [...k].flatMap((c, i) => (VOKAL_RE.test(c) ? [i] : []));
  if (vok.length <= 1) return [k];
  const delar: string[] = [];
  let start = 0;
  for (let i = 0; i < vok.length - 1; i++) {
    const v = vok[i]!;
    const nasta = vok[i + 1]!;
    const slut = nasta - v - 1 <= 1 ? v + 1 : nasta;
    delar.push(k.slice(start, slut));
    start = slut;
  }
  delar.push(k.slice(start));
  return delar.filter((d) => d.length > 0);
}

function synligaFor(n: number, steg: 0 | 1 | 2): number {
  if (n <= 1) return 0;
  if (steg === 0) return 1;
  if (steg === 1) return Math.min(n - 1, 2);
  return Math.min(n - 1, Math.max(2, Math.ceil(n / 2)));
}

export function ledtradsSteg(id: string, steg: 0 | 1 | 2): { streck: string; synliga: number; extraText: string | null; ljudText: string | null } | null {
  if (!id.trim()) return null;
  const k = id.trim().toLowerCase();
  const synliga = synligaFor(k.length, steg);
  const bok = [...k.toUpperCase()];
  const streck = [...bok.slice(0, synliga), ...Array.from({ length: k.length - synliga }, () => "_")].join(" ");
  let extraText: string | null = null;
  if (steg >= 1) {
    const latt = LED[k]?.gata_latt;
    if (latt) extraText = latt;
    else {
      const delar = delaStavelser(k);
      const maskerade = delar.map((d, i) => (i === delar.length - 1 ? "_".repeat(d.length) : d)).join(" – ");
      extraText = fyll(lasningJson.ledtrad.stavelser_mall, { antal: delar.length, delar: maskerade });
    }
  }
  const ljud = bok.slice(0, Math.min(4, synliga)).join(" – ");
  const ljudText = steg === 2 ? fyll(lasningJson.ledtrad.ljud_mall, { ljud }) : null;
  return { streck, synliga, extraText, ljudText };
}

function prefix(a: string, b: string): string {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return a.slice(0, i);
}

function kanTaBortEn(m: string, s: string): boolean {
  for (let i = 0; i < m.length; i++) if (m.slice(0, i) + m.slice(i + 1) === s) return true;
  return false;
}

function arOmkastad(s: string, m: string): boolean {
  const a = [...s];
  for (let i = 0; i < a.length - 1; i++) {
    const b = a.slice();
    const t = b[i]!;
    b[i] = b[i + 1]!;
    b[i + 1] = t;
    if (b.join("") === m) return true;
  }
  return false;
}

function lev(a: string, b: string): number {
  const r = Array.from({ length: a.length + 1 }, (_, i) => i);
  for (let j = 1; j <= b.length; j++) {
    let prev = r[0]!;
    r[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const cur = r[i]!;
      r[i] = Math.min(r[i]! + 1, r[i - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
  }
  return r[a.length]!;
}

function svar(typ: StavningsTyp, rattPrefix: string, resten: string, tips: string): StavningsFeedback {
  return { nara: true, typ, rattPrefix, restenSkrivet: resten, tips, forklaring: tips };
}

export function stavningsFeedback(skrivet: string, mal: string): StavningsFeedback | null {
  const s = skrivet.trim().toLowerCase();
  const m = mal.trim().toLowerCase();
  if (!s || !m || s === m) return null;
  const rattPrefix = prefix(s, m);
  const resten = s.slice(rattPrefix.length);
  if (DUBBEL_RE.test(m) && m.replace(/([bcdfghjklmnpqrstvwxz])\1/gi, "$1") === s) {
    return svar("dubbel", rattPrefix, resten, fyll(lasningJson.stavning.dubbel_mall, { bokstav: (m.match(DUBBEL_RE)?.[1] ?? "").toUpperCase(), mal: m }));
  }
  if (s !== m && ljudStam(s) === ljudStam(m)) {
    const ljudMall = lasningJson.stavning.ljud_mall ?? lasningJson.stavning.allman_mall;
    return svar("ljud", "", resten, fyll(ljudMall, { mal: m, ratt: rattPrefix || m[0] || "" }));
  }
  if (m.length === s.length + 1 && kanTaBortEn(m, s)) return svar("saknas", rattPrefix, resten, fyll(lasningJson.stavning.saknas_mall, { mal: m }));
  if (m.length === s.length && arOmkastad(s, m)) return svar("omkastad", rattPrefix, resten, fyll(lasningJson.stavning.omkastad_mall, { mal: m }));
  if (lev(s, m) <= 2 && rattPrefix.length >= 1) return svar("allman", rattPrefix, resten, fyll(lasningJson.stavning.allman_mall, { mal: m }));
  return null;
}
