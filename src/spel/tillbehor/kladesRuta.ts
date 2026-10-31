// Konservativ rörelsemarginal runt kroppens ankare. Samma exemplarordning som faktisk montering.
import type { TillbehorSpec } from "../../tolk/typer.ts";
import type { Matt, Ruta3 } from "../skapelsePlan.ts";
import { kladesExemplar, exemplarOffset } from "./exemplar.ts";
import { plaggKonfig, tillbehorRad, skalaVarde } from "./data.ts";
const RADIE: Record<string, number> = { cyl: 0.57, kon: 0.29, ring: 0.3, kub: 0.87, sfar: 0.5, mantel: 1.53 };

export function kladesRuta(kropp: string, tillbehor: TillbehorSpec[], m: Matt): Ruta3 {
  const botten = m[3] ?? 0, h = m[1], b = Math.max(m[0], m[2]);
  const ruta: Ruta3 = { min: [-m[0] / 2, botten, -m[2] / 2], max: [m[0] / 2, botten + h, m[2] / 2] };
  for (const { t, ankare, index, antal } of kladesExemplar(tillbehor, kropp)) {
    const cfg = plaggKonfig(t.id), rad = tillbehorRad(t.id, kropp), off = exemplarOffset(ankare, index, antal, b, h);
    let r = h * (cfg?.djupSkala ? 0.85 : 0.55);
    if (!cfg && rad) {
      const k = skalaVarde(rad.skala, b, h);
      r = Math.max(...rad.delar.map((d) => (Math.hypot(...d.pos) + (RADIE[d.form] ?? 1.53) * Math.max(...d.skala.map(Math.abs))) * k));
    }
    const x = Math.abs(cfg?.ut ?? 0) * b + r + Math.abs(off[0]);
    const z = Math.abs(cfg?.fram ?? 0) * b + r;
    ruta.min[0] = Math.min(ruta.min[0], -m[0] / 2 - x); ruta.max[0] = Math.max(ruta.max[0], m[0] / 2 + x);
    ruta.min[2] = Math.min(ruta.min[2], -m[2] / 2 - z); ruta.max[2] = Math.max(ruta.max[2], m[2] / 2 + z);
    ruta.max[1] = Math.max(ruta.max[1], botten + h + Math.max(0, cfg?.upp ?? 0) * h + off[1] + r);
    ruta.min[1] = Math.min(ruta.min[1], botten - h * 0.05);
  }
  return ruta;
}
