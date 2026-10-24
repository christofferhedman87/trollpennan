// P3a: hur saker får skymma varandra på skärmen. En regel för alla platser, inga specialfall per modell.
// Varje sak syns till minst (1 − max_skymd) av sin skärmruta (data/placering.json): summan av hur mycket de som står
// framför den täcker. Rutan räknas med den stående kameran (skarm.ts): en låda x ± halv, z ± djup, y … y + hojd.
import { skarmRuta, tacker, type Kamera, type Ruta } from "./skarm.ts";

/** Skärmrutan för en låda med botten på höjden y: x ± halv, z ± djup, y … y + hojd (unionen av fram- och baksidan). */
export function sakRuta(x: number, z: number, halv: number, hojd: number, djup = halv, y = 0, P?: Kamera): Ruta {
  const f = skarmRuta(x, y, z + djup, halv, hojd, P);
  const b = skarmRuta(x, y, z - djup, halv, hojd, P);
  return { x0: Math.min(f.x0, b.x0), x1: Math.max(f.x1, b.x1), y0: Math.min(f.y0, b.y0), y1: Math.max(f.y1, b.y1) };
}

/** Står a framför b (närmare kameran)? Samma djup (±0,05) räknas inte: där får kropparna inte gå in i varandra alls. */
export const framfor = (a: { z: number }, b: { z: number }) => a.z > b.z + 0.05;

/** Synlig andel per sak (1 − summan av täckningen från dem framför och från `framst`, som står framför allt). */
export function synligAndel(saker: readonly { id: string; z: number; r: Ruta }[], framst: readonly Ruta[] = []): Record<string, number> {
  const ut: Record<string, number> = {};
  for (const s of saker) {
    let t = framst.reduce((a, r) => a + tacker(r, s.r), 0);
    for (const o of saker) if (o !== s && framfor(o, s)) t += tacker(o.r, s.r);
    ut[s.id] = Math.max(0, 1 - t);
  }
  return ut;
}
