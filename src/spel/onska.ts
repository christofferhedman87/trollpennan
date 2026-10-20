import onskJson from "../../data/onskningar.json" with { type: "json" };
import byggOnskJson from "../../data/onskningar-bygg.json" with { type: "json" };
import { lasToken, ordFranForm } from "../tolk/lexikon.ts";
import { tolka } from "../tolk/tolka.ts";
import { byggMedId, type ByggeTolk } from "../tolk/byggtolk.ts";
import type { Varelse } from "../tolk/typer.ts";
import { nyaTaggar, taggarAv, uppfyller } from "./taggar.ts";

export type DjurOnska = {
  id: string;
  typ: "ge" | "kompis";
  text: string;
  nagon_av: string[];
  alla: string[];
  exempel: string[];
  tack: string;
  stjarnor: number;
  bara_for?: string[];
};

export type ByggKrav = {
  bygg?: string[];
  farg?: string[];
  material?: string[];
  del_min?: Record<string, number>;
  antal_min?: number;
  typ?: string[];
  hem_for_djuret?: boolean;
  bara_for?: string[];
  eller_bygg?: string[];
};

export type ByggOnska = {
  id: string;
  text: string;
  krav: ByggKrav;
  exempel: string[];
  tack: string;
  stjarnor: number;
};

type OnskFil = { nastan: string[]; onskningar: DjurOnska[] };
type ByggFil = { onskningar: ByggOnska[] };

export const ONSK = onskJson as OnskFil;
export const ONSK_BYGG = byggOnskJson as ByggFil;

export function nastanRad(i: number): string {
  const r = ONSK.nastan;
  return r[i % r.length] ?? r[0]!;
}

export function gePassar(v: Varelse, o: DjurOnska): boolean {
  if (o.typ !== "ge") return true;
  const har = taggarAv(v, false);
  return !o.nagon_av.some((t) => har.has(t));
}

export function matchBygg(b: ByggeTolk, krav: ByggKrav, kropp?: string): boolean {
  const bo = byggMedId(b.bygg);
  if (!bo) return false;
  if (krav.hem_for_djuret) {
    if (!kropp || !bo.hem?.kroppar.includes(kropp)) return false;
  }
  if (krav.antal_min && b.antal < krav.antal_min) return false;
  if (krav.del_min) {
    for (const [id, n] of Object.entries(krav.del_min)) {
      const har = b.delar.find((d) => d.del === id)?.antal ?? 0;
      if (har < Number(n)) return false;
    }
  }
  if (krav.farg?.length) {
    const f = b.adj.find((a) => a.klass === "farg")?.id;
    if (!f || !krav.farg.includes(f)) return false;
  }
  const typ = krav.typ ?? [];
  if (typ.length && !typ.includes(bo.typ)) return false;
  const byggLista = krav.bygg ?? [];
  const eller = krav.eller_bygg ?? [];
  if (byggLista.length && !byggLista.includes(b.bygg) && !eller.includes(b.bygg)) return false;
  const material = krav.material ?? [];
  if (material.length || (eller.length && !byggLista.length)) {
    const matOk = !!b.material && material.includes(b.material);
    const ellerOk = eller.includes(b.bygg);
    const listOk = byggLista.includes(b.bygg);
    if (!(matOk || ellerOk || listOk)) return false;
  }
  return true;
}

function utanDjur(text: string): string {
  const delar = text
    .toLocaleLowerCase("sv")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => ordFranForm(w)?.klass !== "djur");
  return delar.join(" ");
}

/** Lägg tillägg på ett djur. Djurord i svaret ignoreras. */
export function laggPa(bas: Varelse, tillagg: string): Varelse | null {
  const fras = tillaggFras(bas, tillagg);
  if (!fras) return null;
  const u = tolka(fras, { kalla: "skriv" });
  if (u.typ !== "skapad") return null;
  return u.varelse;
}

/** R9F: färg och storlek finns bara en av på djuret. Säger barnet en ny ("lila" till "en blå katt") ersätter den den gamla. */
const ERSATTS = new Set(["farg", "storlek"]);

function klasserFore(ord: string[]): Set<string> {
  const k = new Set<string>();
  for (const w of ord) {
    const t = lasToken(w);
    if (t?.t === "funk" && t.v !== "och") break; // efter "med"/"som" hör orden till något annat
    const kl = ordFranForm(w)?.klass;
    if (kl && ERSATTS.has(kl)) k.add(kl);
  }
  return k;
}

export function tillaggFras(bas: Varelse, tillagg: string): string | null {
  const extra = utanDjur(tillagg);
  if (!extra.trim()) return null;
  const byt = klasserFore(extra.split(/\s+/).filter(Boolean));
  const ut: string[] = [];
  let fore = true;
  for (const w of bas.formel.split(/\s+/).filter(Boolean)) {
    const t = lasToken(w.toLocaleLowerCase("sv"));
    if (t?.t === "funk" && t.v !== "och") fore = false;
    const kl = ordFranForm(w.toLocaleLowerCase("sv"))?.klass;
    if (fore && kl && byt.has(kl)) {
      if (ut.at(-1) === "och") ut.pop();
      continue;
    }
    ut.push(w);
  }
  // "en och katt" kan bli kvar när första färgen ströks: ta bort ett "och" direkt efter artikeln
  const rensad = ut.filter((w, i) => !(w === "och" && i > 0 && ["en", "ett", "två", "tre"].includes(ut[i - 1]!)));
  // adjektiven i början av tillägget ställs före djuret ("lila" → "en lila katt med hatt"), resten ("med halsduk", "som flyger") sist
  const ex = extra.split(/\s+/).filter(Boolean);
  let n = 0;
  while (n < ex.length && !(lasToken(ex[n]!)?.t === "funk" && ex[n] !== "och")) n++;
  const adj = ex.slice(0, n);
  const rest = ex.slice(n);
  const forstaArArtikel = rensad.length > 1 && ["artikel", "antal"].includes(lasToken(rensad[0]!.toLocaleLowerCase("sv"))?.t ?? "");
  const ny = adj.length && forstaArArtikel ? [rensad[0]!, ...adj, ...rensad.slice(1), ...rest] : [...rensad, ...ex];
  return ny.join(" ").replace(/\s+/g, " ").trim();
}

export function geTraff(fore: Varelse, efter: Varelse, o: DjurOnska): boolean {
  return uppfyller(nyaTaggar(fore, efter), o.nagon_av, o.alla);
}

export function kompisTraff(ny: Varelse, o: DjurOnska): boolean {
  const t = taggarAv(ny, true);
  t.add("kompis");
  return uppfyller(t, o.nagon_av, o.alla);
}

export function byggTraff(byggen: ByggeTolk[], o: ByggOnska, kropp?: string): ByggeTolk | null {
  return byggen.find((b) => matchBygg(b, o.krav, kropp)) ?? null;
}

export function valjDjurOnska(v: Varelse, undvik: Set<string>): DjurOnska | null {
  const lista = ONSK.onskningar.filter((o) => !undvik.has(o.id) && (o.typ === "kompis" || gePassar(v, o)));
  if (!lista.length) return null;
  return lista[Math.floor(Math.random() * lista.length)]!;
}

export function valjByggOnska(kropp: string, undvik: Set<string>): ByggOnska | null {
  const lista = ONSK_BYGG.onskningar.filter((o) => {
    if (undvik.has(o.id)) return false;
    const bara = o.krav.bara_for;
    if (bara?.length && !bara.includes(kropp)) return false;
    if (o.krav.hem_for_djuret) {
      return ["hus", "stuga", "koja", "tält", "träd", "damm", "slott", "stall", "hundkoja", "fågelholk", "trädhus", "gran", "äppelträd", "palm", "torn"].some(
        (id) => byggMedId(id)?.hem?.kroppar.includes(kropp),
      );
    }
    return true;
  });
  if (!lista.length) return null;
  return lista[Math.floor(Math.random() * lista.length)]!;
}

