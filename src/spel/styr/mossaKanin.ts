// Mössa på en kanin som redan står på ängen, i stället för en dubblettkanin.
import type { Varelse } from "../../tolk/typer.ts";
import { useMinne } from "../minne.ts";

function arMossa(id: string): boolean {
  return id === "alvmossa" || id === "mossa";
}

/**
 * Kanin med mössa, eller bara "en mössa" medan kaninen fryser: uppdatera den
 * befintliga kaninen. null betyder att meningen ska skapa något nytt.
 */
export function mossaPaFrysKanin(v: Varelse): { uid: string; spec: Varelse } | null {
  const s = useMinne.getState();
  if (s.plats !== "ang") return null;
  const ren = v.kropp === "alvmossa" || v.kropp === "mossa";
  const kaninMossa = v.kropp === "kanin" && v.tillbehor.some((t) => arMossa(t.id));
  if (!kaninMossa && !ren) return null;
  const utan = s.ang.filter((d) => d.kropp === "kanin" && !d.tillbehor.some((t) => arMossa(t.id)));
  const fryser = s.uppdrag["kanin-fryser"] === "pagar" || utan.some((d) => s.liv[d.uid]?.humor === "fryser");
  if (ren && !fryser) return null;
  if (!fryser && utan.length === 0) return null;
  const kanin = utan.find((d) => s.liv[d.uid]?.humor === "fryser") ?? utan[0];
  if (!kanin) return null;
  const extra = kaninMossa
    ? v.tillbehor.filter((t) => arMossa(t.id))
    : [{ id: v.kropp === "mossa" ? "mossa" : "alvmossa", farg: v.farg, glans: false }];
  const tillbehor = [...kanin.tillbehor, ...extra.filter((t) => !kanin.tillbehor.some((e) => e.id === t.id))];
  const spec: Varelse = kaninMossa ? { ...v, tillbehor } : { ...kanin, tillbehor };
  return { uid: kanin.uid, spec };
}
