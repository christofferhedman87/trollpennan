// Ett framräknat mål för hela boken. Ingen kopia av sparat tillstånd och inga mutationer.
import ui from "../../../data/skapa-ui.json" with { type: "json" };
import type { Krav } from "../uppdragsmotor.ts";
export type MalSlag = "fri" | "uppdrag" | "onskan" | "gava" | "tomt" | "plats" | "vaktare";
export type MalLapp = { fran: string; text: string; bild: string | null; portratt?: boolean };
export type MalKalla = { id: string; lapp: MalLapp; losningar: string[]; ideer?: string[]; malDjur?: string | null; krav?: Krav | null };
export type MalIndata = Partial<Record<Exclude<MalSlag, "fri">, MalKalla | null>>;
export type BokMal = { id: string; slag: MalSlag; lapp: MalLapp | null; tips: string; losningar: string[]; ideer: string[]; malDjur: string | null; krav: Krav | null };
const UI = ui as unknown as { bokmal: { tips: Record<MalSlag, string>; fria_ideer: string[] } };
const meningar = (lista: readonly string[]) => [...new Set(lista.map((s) => s.trim()).filter(Boolean))];
const PRIORITET: Exclude<MalSlag, "fri">[] = ["gava", "uppdrag", "onskan", "tomt", "vaktare", "plats"];
export function aktivtMal(indata: MalIndata): BokMal {
  for (const slag of PRIORITET) {
    const k = indata[slag];
    if (!k) continue;
    return { id: `${slag}:${k.id}`, slag, lapp: k.lapp, tips: UI.bokmal.tips[slag], losningar: meningar(k.losningar), ideer: meningar(k.ideer ?? k.losningar), malDjur: k.malDjur ?? null, krav: k.krav ?? null };
  }
  return { id: "fri", slag: "fri", lapp: null, tips: UI.bokmal.tips.fri, losningar: [...UI.bokmal.fria_ideer], ideer: [...UI.bokmal.fria_ideer], malDjur: null, krav: null };
}
/** Visar en idé, fyller aldrig i barnets mening. Samma mål som hjälpkorten och lappen. */
export function ideForMal(mal: BokMal, foregaende: string | null, slump = Math.random()): string | null {
  const andra = mal.ideer.filter((s) => s !== foregaende);
  const val = andra.length ? andra : mal.ideer;
  return val[Math.min(val.length - 1, Math.max(0, Math.floor(slump * val.length)))] ?? null;
}
