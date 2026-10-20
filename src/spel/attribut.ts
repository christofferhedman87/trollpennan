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

/** R8-3a2: ett mönster som målas på kroppen (data/attribut.json "kroppsmonster"). */
export type KroppsMonster = { typ: "band" | "rander" | "prickar"; farger: string[]; antal: number; ersatter: string | null };
const KM = (attributJson as { kroppsmonster?: Record<string, unknown> }).kroppsmonster ?? {};
const TYPER = ["band", "rander", "prickar"] as const;

/** Varelsens kroppsmönster ur datan, eller null. Färger: datans, annars ordets mönsterfärg, annars tomt (kroppens mörkare ton). */
export function kroppsMonsterFor(v: Pick<Varelse, "monster" | "monsterfarg">): KroppsMonster | null {
  if (!v.monster) return null;
  const r = KM[`monster:${v.monster}`] as { typ?: string; farger?: string[]; antal?: number; ersatter?: string } | undefined;
  if (!r || !(TYPER as readonly string[]).includes(r.typ ?? "")) return null;
  const farger = r.farger?.length ? r.farger : v.monsterfarg ? [v.monsterfarg] : [];
  return { typ: r.typ as KroppsMonster["typ"], farger, antal: Math.max(1, r.antal ?? 5), ersatter: r.ersatter ?? null };
}

/** Effekterna som ritas bredvid kroppen. På en GLB-kropp (`paKroppen`) ritas inte den effekt som kroppsmönstret ersätter. */
export function effekterBredvid(v: Pick<Varelse, "formagor" | "monster" | "monsterfarg">, paKroppen: boolean): EffektNamn[] {
  const ers = paKroppen ? kroppsMonsterFor(v)?.ersatter : null;
  return effekterFor(v).filter((e) => e !== ers);
}
