import RESERV from "../../data/reserv.json" with { type: "json" };
import KATEGORI_ORD from "../../data/kategori-ord.json" with { type: "json" };
import { avstand } from "./avstand.ts";
import { langstaSuffix, lasToken, ordMedId } from "./lexikon.ts";
import { noteraSaknade } from "./saknade.ts";
import { arSparrat } from "./sparr.ts";
import { blandPar, tolka } from "./tolka.ts";
import type { ReservDel, TolkaOpts, Utfall } from "./typer.ts";

/**
 * Reservkedjan: ett ord som tolka() inte känner blir en synlig ordägg i stället för ingenting,
 * och en "Menade du …?"-gissning som inte är trovärdig blir också ett ägg.
 * Allt som styr kedjan står i data/reserv.json och data/kategori-ord.json. Ren funktion, ingen three-import.
 */

type Plats = ReservDel["plats"];
type Steg = ReservDel["steg"];

type Regel = { suffix: string; kategori: string };
type ReservData = {
  andelar: Record<string, string[]>;
  lemma_min_stam: number;
  sammansatt_min_led: number;
  regler: Regel[];
  plats: Record<Plats, string>;
  agg: { palett: string[]; etikett_max: number; max_totalt: number };
  forslag: { ej_om_kand: boolean; max_fel: { upptill: number; max: number }[]; klasser_per_plats: Record<Plats, string[]> };
  texter: { ny: string; formel: string; beskrivning: string; sparr: string; ersatter: string };
};
const R = RESERV as unknown as ReservData;

/** Samma uppdelning i ord som tokensAv() i tolka.ts. */
export function tokensAv(raw: string): string[] {
  return raw
    .toLocaleLowerCase("sv")
    .replace(/[^a-zåäö0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60)
    .split(" ")
    .filter(Boolean);
}

const ORDLISTA = new Map<string, string>();
for (const [kategori, lista] of Object.entries(
  (KATEGORI_ORD as unknown as { kategorier: Record<string, string[]> }).kategorier,
)) {
  for (const ord of lista) if (!ORDLISTA.has(ord)) ORDLISTA.set(ord, kategori);
}
const SAMMANSATT = [...ORDLISTA.keys()]
  .filter((o) => o.length >= R.sammansatt_min_led)
  .sort((a, b) => b.length - a.length);
const ANDELAR = [...new Set(Object.values(R.andelar).flat())].sort((a, b) => b.length - a.length);

export function fnv1a32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function aggFarg(ord: string): string {
  const p = R.agg.palett;
  return p[fnv1a32(ord) % p.length]!;
}

function arDjurToken(t: string): boolean {
  const x = lasToken(t);
  if (x?.t === "ord" && x.o.klass === "djur") return true;
  return langstaSuffix(t)?.kind === "djur";
}

/** Var i meningen står ordet: efter "som"/"kan", efter "med", före ett djur (adjektiv) eller annars som djuret självt. */
export function platsAv(tokens: string[], i: number): Plats {
  let lage: "fore" | "med" | "som" = "fore";
  for (let j = 0; j < i; j++) {
    const f = lasToken(tokens[j] ?? "");
    if (f?.t !== "funk") continue;
    if (f.v === "med") lage = "med";
    else if (f.v === "som" || f.v === "kan") lage = "som";
  }
  if (lage !== "fore") return lage;
  for (let j = i + 1; j < tokens.length; j++) if (arDjurToken(tokens[j] ?? "")) return "adj";
  return "djur";
}

function lemmaTraff(ord: string): { kategori: string; grund: string } | null {
  for (const e of ANDELAR) {
    if (!ord.endsWith(e)) continue;
    const stam = ord.slice(0, ord.length - e.length);
    if (stam.length < R.lemma_min_stam) continue;
    for (const kand of [stam, stam + "a", stam + "e"]) {
      const k = ORDLISTA.get(kand);
      if (k) return { kategori: k, grund: kand };
    }
  }
  return null;
}

/** Grundordet är ordet i kategori-ord.json som träffen byggde på (ordet självt, stammen eller sista leden); null när bara en regel eller platsen avgjorde. */
export function kategoriFor(ord: string, plats: Plats): { kategori: string; steg: Steg; grund: string | null } {
  const exakt = ORDLISTA.get(ord);
  if (exakt) return { kategori: exakt, steg: "kategori_ord", grund: ord };
  const lemma = lemmaTraff(ord);
  if (lemma) return { kategori: lemma.kategori, steg: "lemma", grund: lemma.grund };
  for (const led of SAMMANSATT) {
    if (ord.length > led.length && ord.endsWith(led)) return { kategori: ORDLISTA.get(led)!, steg: "sammansatt", grund: led };
  }
  for (const r of R.regler) {
    if (ord.length > r.suffix.length + 1 && ord.endsWith(r.suffix)) return { kategori: r.kategori, steg: "regel", grund: null };
  }
  const p = R.plats[plats];
  if (p && p !== "okant") return { kategori: p, steg: "plats", grund: null };
  return { kategori: "okant", steg: "agg", grund: null };
}

export function reservFor(ord: string, plats: Plats): ReservDel {
  const k = kategoriFor(ord, plats);
  return { ord, kategori: k.kategori, steg: k.steg, plats, farg: aggFarg(ord), grund: k.grund };
}

function maxFel(langd: number): number {
  for (const s of R.forslag.max_fel) if (langd <= s.upptill) return s.max;
  return 0;
}

/** Behåller bara de gissningar som är trovärdiga för ordet och platsen. Tom lista = ingen gissning. */
function trovardiga(token: string, plats: Plats, forslag: { id: string; visa: string }[]) {
  const klasser = R.forslag.klasser_per_plats[plats];
  const grans = maxFel(token.length);
  return forslag.filter((f) => {
    const ord = ordMedId(f.id);
    if (!klasser.includes(ord?.klass ?? "djur")) return false;
    const former = [f.visa, ...(ord?.former ?? [])];
    return Math.min(...former.map((x) => avstand(token, x))) <= grans + 1e-9;
  });
}

function fyllText(mall: string, ord: string): string {
  return mall.replace(/\{ord\}/g, ord);
}

/** Två kända djur i en blandning: notera frasen, men lägg inget i varelse.reserv. */
function noteraBlandning(raw: string): void {
  const par = blandPar(raw);
  if (!par) return;
  const slug = tokensAv(raw).join("").slice(0, 24);
  if (!/^[a-zåäö]{2,24}$/.test(slug)) return;
  noteraSaknade([
    {
      ord: slug,
      kategori: "blandning",
      steg: "agg",
      plats: "djur",
      farg: "#9E9E9E",
      grund: `${par.a.id}+${par.b.id}`,
    },
  ]);
}

/** tolka() + reservkedjan. tolka() är oförändrad; det här lägger ägg där den ger "ingenting". */
export function tolkaMedReserv(raw: string, opts: TolkaOpts = {}): Utfall {
  let u = tolka(raw, opts);
  if (u.typ === "sparr") return u;
  const tokens = tokensAv(raw);
  if (tokens.some((t) => arSparrat(t))) return { typ: "sparr", text: R.texter.sparr };

  let kvar = tokens;
  const bort: string[] = [];
  for (let n = 0; n < 4 && u.typ === "forslag"; n++) {
    const i = kvar.indexOf(u.token);
    const plats = platsAv(kvar, i < 0 ? 0 : i);
    const kand = R.forslag.ej_om_kand && ["kategori_ord", "lemma"].includes(kategoriFor(u.token, plats).steg);
    const behallen = opts.behall?.includes(u.token) ?? false;
    const bra = kand || behallen ? [] : trovardiga(u.token, plats, u.forslag);
    if (bra.length) {
      return {
        typ: "forslag",
        token: u.token,
        text: bra.length === 1 ? `Menade du ${bra[0]!.visa}?` : "Menade du …?",
        forslag: bra.map((f) => ({ id: f.id, visa: f.visa })),
      };
    }
    bort.push(u.token);
    kvar = kvar.filter((_, j) => j !== i);
    u = tolka(kvar.join(" "), opts);
  }
  if (u.typ === "forslag" || u.typ === "sparr") return u;

  const heltOkanda = u.typ === "skapad" || u.typ === "behover_djur" ? u.okanda.filter((o) => tokens.includes(o)) : [];
  const ord = tokens.filter((t, i) => (heltOkanda.includes(t) || bort.includes(t)) && tokens.indexOf(t) === i);
  if (!ord.length) {
    if (u.typ === "skapad") noteraBlandning(raw);
    return u;
  }
  const max = R.agg.max_totalt;
  const delar = ord.map((t) => reservFor(t.slice(0, R.agg.etikett_max), platsAv(tokens, tokens.indexOf(t))));

  const okanda = [...new Set([...u.okanda, ...bort])];
  if (u.typ === "skapad") {
    const meddelanden = [
      fyllText(R.texter.ny, delar[0]!.ord),
      ...u.meddelanden.filter((m) => !m.startsWith(R.texter.ersatter)),
    ];
    return { ...u, okanda, meddelanden, varelse: { ...u.varelse, reserv: delar.slice(0, max - 1) } };
  }
  if (u.typ !== "behover_djur") return u;
  const andra = (d: ReservDel) => d.kategori === "handling" || d.kategori === "egenskap";
  const huvud =
    [...delar].reverse().find((d) => d.plats === "djur" && !andra(d)) ??
    [...delar].reverse().find((d) => !andra(d)) ??
    delar[delar.length - 1]!;
  const resten = delar.filter((d) => d !== huvud).slice(0, max - 1);
  const formel = fyllText(R.texter.formel, huvud.ord);
  return {
    typ: "skapad",
    varelse: {
      kropp: "agg",
      farg: huvud.farg,
      monster: null,
      monsterfarg: null,
      formagor: [],
      tillbehor: [],
      skala: 1,
      alpha: 1,
      kontur: false,
      glans: false,
      formel,
      beskrivning: fyllText(R.texter.beskrivning, huvud.ord),
      overraskningar: [],
      reserv: [huvud, ...resten],
    },
    antal: 1,
    funna: [],
    guld: [],
    okanda,
    meddelanden: [fyllText(R.texter.ny, huvud.ord)],
  };
}
