import beteenden from "../../data/beteenden.json" with { type: "json" };

export type Stil = "ga" | "rus" | "hopp" | "flyg" | "sim";

export type ZonNamn = "himmel" | "ang" | "damm" | "dammkant";

type KroppsRegel = {
  stil: Stil;
  zon: ZonNamn;
  ibland?: Stil;
  ibland_andel?: number;
};

const OVER = ["vingar", "fenor", "fartlinjer", "studs"] as const;

const ZON_FOR: Record<Stil, ZonNamn> = {
  flyg: "himmel",
  sim: "damm",
  rus: "ang",
  hopp: "ang",
  ga: "ang",
};

export function valjStil(
  v: { kropp: string; formagor: string[] },
  slump: () => number = Math.random,
): { stil: Stil; zon: ZonNamn } {
  const over = beteenden.formaga_overstyr as Record<string, { stil: Stil; zon: ZonNamn }>;
  for (const ny of OVER) {
    if (v.formagor.includes(ny)) return over[ny]!;
  }
  const kroppar = beteenden.kroppar as Record<string, KroppsRegel>;
  const k = kroppar[v.kropp] ?? { stil: "ga" as Stil, zon: "ang" as ZonNamn };
  if (k.ibland && slump() < (k.ibland_andel ?? 0)) {
    return { stil: k.ibland, zon: ZON_FOR[k.ibland] };
  }
  return { stil: k.stil, zon: k.zon };
}

export function zonLada(namn: string): { x0: number; x1: number; y0: number; y1: number } {
  const zoner = beteenden.zoner as Record<string, { x: number[]; y: number[] }>;
  const z = zoner[namn] ?? zoner.ang!;
  return { x0: z.x[0]!, x1: z.x[1]!, y0: z.y[0]!, y1: z.y[1]! };
}
