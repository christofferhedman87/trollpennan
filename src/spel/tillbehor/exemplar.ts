import type { TillbehorSpec } from "../../tolk/typer.ts";
import { barsPaKropp } from "./bars.ts";
import { plaggKonfig, tillbehorRad } from "./data.ts";

/** Procedurreserv och GLB delar ordning även när flera plagg använder samma kroppsdel. */
export function kladesExemplar(tillbehor: TillbehorSpec[], kropp: string) {
  const lista = tillbehor.flatMap((t) => {
    if (!barsPaKropp(t)) return [];
    const ankare = plaggKonfig(t.id)?.ankare ?? tillbehorRad(t.id, kropp)?.plats.ankare;
    return ankare ? Array.from({ length: t.antal ?? 1 }, () => ({ t, ankare })) : [];
  });
  const antal = new Map<string, number>(), index = new Map<string, number>();
  for (const d of lista) antal.set(d.ankare, (antal.get(d.ankare) ?? 0) + 1);
  return lista.map((d) => {
    const i = index.get(d.ankare) ?? 0;
    index.set(d.ankare, i + 1);
    return { ...d, index: i, antal: antal.get(d.ankare)! };
  });
}

export function exemplarOffset(ankare: string, index: number, antal: number, bredd: number, hojd: number): [number, number, number] {
  if (antal === 1) return [0, 0, 0];
  if (ankare === "fot" || ankare === "hand") return [(index - (antal - 1) / 2) * bredd * 0.5, 0, 0];
  return [0, index * hojd * (ankare === "huvudTopp" ? 0.33 : 0.16), 0];
}
