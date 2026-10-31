import egenJson from "../../data/egenskaper.json" with { type: "json" };
import { tolka } from "../tolk/tolka.ts";
import type { TillbehorSpec, Varelse } from "../tolk/typer.ts";
import { medTemperatur, temperaturFranOrd } from "./temperatur.ts";
const E = egenJson as typeof egenJson & { tillbehorsord?: Record<string, string[]> };
const aldre = new WeakMap<Varelse, TillbehorSpec[]>();

/** Äldre v2 behåller sitt innehåll. Torr läsning av formeln binds i samma ordning
 * som den verkliga tolkens tillbehör, aldrig ett alias över hela modellgruppen. */
export function tillbehorMedBetydelse(v: Varelse): TillbehorSpec[] {
  if (v.tillbehor.every((t) => t.ord !== undefined)) return v.tillbehor;
  const sparade = aldre.get(v);
  if (sparade) return sparade;
  const u = tolka(v.formel, { kalla: "kort", noteraBlandning: false });
  const ko = new Map<string, TillbehorSpec[]>();
  if (u.typ === "skapad") for (const t of u.varelse.tillbehor) ko.set(t.id, [...(ko.get(t.id) ?? []), t]);
  const ut = v.tillbehor.map((t) => {
    const infererat = ko.get(t.id)?.shift();
    return t.ord !== undefined || !infererat ? t : { ...infererat, ...t };
  });
  aldre.set(v, ut);
  return ut;
}

export function taggarForTillbehor(t: TillbehorSpec): ReadonlySet<string> {
  const taggar = new Set((t.ord && E.tillbehorsord?.[t.ord]) ?? (E.tillbehor as Record<string, string[]>)[t.id] ?? []);
  return medTemperatur({ taggar, antal: 1, djur: false }, temperaturFranOrd(t.egenskaper ?? [])).taggar;
}
