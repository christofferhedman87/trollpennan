import onskJson from "../../data/onskningar.json" with { type: "json" };
import byggOnskJson from "../../data/onskningar-bygg.json" with { type: "json" };
import { ordFranForm } from "../tolk/lexikon.ts";
import { tolka } from "../tolk/tolka.ts";
import { byggMedId, tolkaBygg, type ByggeTolk } from "../tolk/byggtolk.ts";
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

export function tillaggFras(bas: Varelse, tillagg: string): string | null {
  const extra = utanDjur(tillagg);
  if (!extra.trim()) return null;
  return `${bas.formel} ${extra}`.replace(/\s+/g, " ").trim();
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

