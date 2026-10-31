// Bind uttryckliga temperaturord till samma kända sak som skapandet tolkat fram.
import { ordFranForm } from "../tolk/lexikon.ts";
import type { Varelse } from "../tolk/typer.ts";
import type { TolkadSkapelse } from "./krav.ts";
type Temperatur = "varm" | "kall";
export function temperaturFranOrd(ord: readonly string[]): Temperatur | undefined {
  let temperatur: Temperatur | undefined;
  for (const w of ord) { const id = ordFranForm(w)?.id; if (id === "varm" || id === "kall") temperatur = id; }
  return temperatur;
}

export function temperaturer(text: string, v: Varelse): Map<string, Temperatur> {
  const finns = new Set([v.kropp, ...v.tillbehor.map((t) => t.id)]);
  const ut = new Map<string, Temperatur>();
  let temperatur: Temperatur | null = null;
  for (const token of text.toLocaleLowerCase("sv").match(/[a-zåäöéü]+/g) ?? []) {
    const ord = ordFranForm(token);
    if (ord?.klass === "egenskap" && (ord.id === "varm" || ord.id === "kall")) temperatur = ord.id;
    const sak = ord?.del?.kropp ?? ord?.del?.tillbehor ?? token;
    if (finns.has(sak)) {
      if (temperatur) ut.set(sak, temperatur);
      temperatur = null;
    } else if (["med", "som", "på", "under", "i", "vid", "bredvid", "och"].includes(token)) temperatur = null;
  }
  return ut;
}

export function medTemperatur(s: TolkadSkapelse, temperatur: Temperatur | undefined): TolkadSkapelse {
  if (!temperatur) return s;
  const taggar = new Set(s.taggar);
  for (const t of taggar) if (t === "varm" || t === "kall" || t === "egenskap:varm" || t === "egenskap:kall" || temperatur === "kall" && t.startsWith("varm:")) taggar.delete(t);
  taggar.add(temperatur); taggar.add(`egenskap:${temperatur}`);
  return { ...s, taggar };
}
