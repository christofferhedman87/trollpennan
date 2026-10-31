import type { Lage } from "../placering.ts";
import type { ForhandSpec } from "./forhand.ts";

/** undefined = vanlig värld, null = skulle somna, annars samma läge som i den torra förhandsberäkningen. */
export function lageForVisning(uid: string, plats: string, lage: {
  oppen: boolean; plats: string; spec: ForhandSpec; placering: ReadonlyMap<string, Lage> | null;
}): Lage | null | undefined {
  if (!lage.oppen || lage.plats !== plats || lage.spec?.typ !== "djur" || !lage.placering) return undefined;
  return lage.placering.get(uid) ?? null;
}
