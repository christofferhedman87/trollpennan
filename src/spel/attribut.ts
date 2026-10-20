// B6.5: attributraderna (data/attribut.json). Varje egenskap som ett ord ger (formaga:<id>, monster:<id>) har en effekt
// som ritas på ängen (effekter.tsx), också på GLB-modeller. Ren logik utan three, testas i Node (b6-5.test.ts).
import attributJson from "../../data/attribut.json" with { type: "json" };
import type { Varelse } from "../tolk/typer.ts";

export const EFFEKT_NAMN = ["eld", "lagor", "glod", "glitter", "regnbage"] as const;
export type EffektNamn = (typeof EFFEKT_NAMN)[number];
export const EFFEKT_TABELL = attributJson.effekter as Record<string, string[]>;
export const I_KROPPEN: readonly string[] = attributJson.i_kroppen.lista;

/** Varelsens effekter i tabellens ordning, utan dubbletter. */
export function effekterFor(v: Pick<Varelse, "formagor" | "monster">): EffektNamn[] {
  const nycklar = [...v.formagor.map((f) => `formaga:${f}`), ...(v.monster ? [`monster:${v.monster}`] : [])];
  const ut: EffektNamn[] = [];
  for (const k of nycklar)
    for (const e of EFFEKT_TABELL[k] ?? []) if ((EFFEKT_NAMN as readonly string[]).includes(e) && !ut.includes(e as EffektNamn)) ut.push(e as EffektNamn);
  return ut;
}
