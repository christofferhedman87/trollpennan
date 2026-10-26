// Värmeplagg på djuret som redan står på ängen, i stället för en dubblett.
import type { TillbehorSpec, Varelse } from "../../tolk/typer.ts";
import type { Sparad } from "../brygga.ts";
import { useMinne } from "../minne.ts";

const VARME_PLAGG = ["alvmossa", "mossa", "mössa", "luva", "halsduk", "filt", "troja", "tröja"] as const;

/** Sant för mössa, luva, halsduk, filt och tröja, inklusive stavningsvarianterna. */
export function arVarmePlagg(id: string): boolean {
  return (VARME_PLAGG as readonly string[]).includes(id);
}

/** `"mössa"` sitter som älvmössa och `"tröja"` som tröja-modellen. */
function normPlagg(id: string): string {
  if (id === "mössa") return "alvmossa";
  if (id === "tröja") return "troja";
  return id;
}

function harPlagg(d: { tillbehor: TillbehorSpec[] }, id: string): boolean {
  const ny = normPlagg(id);
  return d.tillbehor.some((t) => normPlagg(t.id) === ny);
}

/**
 * Fristående värmeplagg (`en mössa`, `en filt`, `en luva`, `en tröja`, `en halsduk`)
 * eller `en <djur> med <plagg>`: klä djuret som redan står på ängen.
 * null betyder att meningen ska skapa något nytt.
 */
export function mossaPaFrysKanin(v: Varelse): { uid: string; spec: Varelse } | null {
  const s = useMinne.getState();
  if (s.plats !== "ang") return null;
  const fristaende = arVarmePlagg(v.kropp);
  const plaggen = fristaende
    ? [normPlagg(v.kropp)]
    : [...new Set(v.tillbehor.filter((t) => arVarmePlagg(t.id)).map((t) => normPlagg(t.id)))];
  if (plaggen.length === 0) return null;
  const art = fristaende ? null : v.kropp;
  const saknar = (d: Sparad) => plaggen.some((id) => !harPlagg(d, id));
  const pool = s.ang.filter((d) => (art === null || d.kropp === art) && saknar(d));
  const fryser = s.uppdrag["kanin-fryser"] === "pagar" || s.ang.some((d) => s.liv[d.uid]?.humor === "fryser");
  if (fristaende && !fryser) return null;
  if (pool.length === 0) return null;
  const mal =
    pool.find((d) => s.liv[d.uid]?.humor === "fryser") ??
    (fristaende ? (pool.find((d) => d.kropp === "kanin") ?? pool[0]) : pool[0]);
  if (!mal) return null;
  const tillbehor = [...mal.tillbehor];
  for (const id of plaggen) {
    if (harPlagg({ tillbehor }, id)) continue;
    const kalla = fristaende ? null : v.tillbehor.find((t) => normPlagg(t.id) === id);
    tillbehor.push({ id, farg: fristaende ? v.farg : (kalla?.farg ?? null), glans: kalla?.glans ?? false });
  }
  if (!fristaende) {
    for (const t of v.tillbehor) {
      if (arVarmePlagg(t.id) || tillbehor.some((e) => e.id === t.id)) continue;
      tillbehor.push(t);
    }
  }
  const spec: Varelse = { ...mal, tillbehor };
  return { uid: mal.uid, spec };
}

/** Samma klädsel som `mossaPaFrysKanin`, för anrop som fortfarande säger kanin. */
export function mossaPaKanin(v: Varelse): { uid: string; spec: Varelse } | null {
  return mossaPaFrysKanin(v);
}
