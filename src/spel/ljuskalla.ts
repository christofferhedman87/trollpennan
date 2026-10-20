// B4.1: saker som barnet skapar lyser på platser där datan säger det (data/platser.json `miljo.ljuskalla_skapad`).
// Ren logik utan three och React: vilken plats har ljus, hur stort/starkt, vilka entiteter lyser och vilka skapelser som får
// ett av de högst 4 ljusen (de senast skapade). Platsdekoren lyser aldrig – bara det barnet skapat (DjurIScen).
import type { Sparad } from "./brygga.ts";
import { PLATSDATA, type Plats } from "./platser.ts";

/** Ljusets styrka i datan är 0–1; three.js-styrkan är den gånger LJUS_STYRKA (samma 8 som i B4.1-prompten). */
export const LJUS_STYRKA = 8;
export const MAX_LJUS = 4;

export type Ljuskalla = { farg: string; intensitet: number; avstand: number; entiteter: string[] };

/** Ytans bredd i världen (data/platser.json `yta.x`), som `radie` räknas mot. */
export function ytansBredd(): number {
  const [a, b] = PLATSDATA.yta.x;
  return Math.abs(b - a);
}

/**
 * Platsens ljuskälla ur `miljo.ljuskalla_skapad` = { radie, intensitet, farg, entiteter }.
 * `radie` är andel av ytans bredd (0,24 × 11 ≈ 2,6 världsenheter), `intensitet` 0–1 (× LJUS_STYRKA).
 * null när platsen inte har någon ljuskälla eller ingen entitet som lyser (ängen, eller en plats utan listan).
 */
export function ljuskallaFor(p: Pick<Plats, "miljo"> | undefined, bredd = ytansBredd()): Ljuskalla | null {
  const l = p?.miljo?.ljuskalla_skapad as { radie?: unknown; intensitet?: unknown; farg?: unknown; entiteter?: unknown } | undefined;
  if (!l || typeof l !== "object") return null;
  const entiteter = Array.isArray(l.entiteter) ? l.entiteter.filter((e): e is string => typeof e === "string" && e.length > 0) : [];
  if (!entiteter.length) return null;
  const radie = typeof l.radie === "number" && l.radie > 0 ? l.radie : 0.24;
  const intensitet = typeof l.intensitet === "number" && l.intensitet > 0 ? l.intensitet : 0.35;
  const farg = typeof l.farg === "string" && /^#[0-9a-f]{6}$/i.test(l.farg) ? l.farg : "#FFD58A";
  return { farg, intensitet: intensitet * LJUS_STYRKA, avstand: radie * bredd, entiteter };
}

/** Vad i skapelsen som lyser: kroppen själv ("en lykta") eller första saken den har med sig ("en kanin med en lykta"). */
export function lyserVad(spec: Pick<Sparad, "kropp" | "tillbehor">, k: Pick<Ljuskalla, "entiteter">): string | null {
  if (k.entiteter.includes(spec.kropp)) return spec.kropp;
  return spec.tillbehor.map((t) => t.id).find((id) => k.entiteter.includes(id)) ?? null;
}

/** De högst `max` senast skapade skapelserna som lyser: uid → vad som lyser. Samma `skapad` → den senare i listan räknas som nyare. */
export function valjLjus(djur: Pick<Sparad, "uid" | "kropp" | "tillbehor" | "skapad">[], k: Pick<Ljuskalla, "entiteter">, max = MAX_LJUS): Map<string, string> {
  const lysande = djur
    .map((d, i) => ({ d, i, vad: lyserVad(d, k) }))
    .filter((x): x is { d: (typeof djur)[number]; i: number; vad: string } => x.vad !== null)
    .sort((a, b) => b.d.skapad - a.d.skapad || b.i - a.i)
    .slice(0, Math.max(0, max));
  return new Map(lysande.map((x) => [x.d.uid, x.vad]));
}
