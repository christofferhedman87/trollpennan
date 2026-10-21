// P3: var en punkt på ängen/platsen hamnar på skärmen i stående läge (KameraRam: kameran i (0, 4,15, 9,8) mot
// (0, 1,05, −0,15), fov 58, 375 × 812; alla platser har samma avstånd, PLATS_MAX_AVSTAND). Ren matematik utan three, för placeringen (vem skymmer vem) och för prov i Node.
export type Ruta = { x0: number; y0: number; x1: number; y1: number };

const MAL = [0, 1.05, -0.15] as const;
export type Kamera = readonly [number, number, number];
/** Ängens kamera (KameraRam). */
export const KAMERA_ANG: Kamera = [0, 4.15, 9.8];
/** P3a (Arkitekten 21:40): kamerans största avstånd till målet på alla platser (PlatsDekor och ängens OrbitControls
 *  får inte hålla den närmare). 10,5 ≥ ängens 10,42, så sjön, skogen och grottan ritas med ängens kamera (förut 9,5:
 *  kameran stod i (0, 3,876, 8,92) och allt ritades ca 10 % större). */
export const PLATS_MAX_AVSTAND = 10.5;
const ANG_AVSTAND = Math.hypot(KAMERA_ANG[0] - MAL[0], KAMERA_ANG[1] - MAL[1], KAMERA_ANG[2] - MAL[2]);
const kl = Math.min(1, PLATS_MAX_AVSTAND / ANG_AVSTAND);
export const KAMERA_PLATS: Kamera = [MAL[0] + (KAMERA_ANG[0] - MAL[0]) * kl, MAL[1] + (KAMERA_ANG[1] - MAL[1]) * kl, MAL[2] + (KAMERA_ANG[2] - MAL[2]) * kl];
const POS = KAMERA_ANG;
const TAN = Math.tan((58 * Math.PI) / 360);
const ASPEKT = 375 / 812;
const norm = (v: number[]) => {
  const l = Math.hypot(...v) || 1;
  return v.map((x) => x / l);
};
const F = norm([MAL[0] - POS[0], MAL[1] - POS[1], MAL[2] - POS[2]]);
const R = norm([F[1]! * 0 - F[2]! * 1, F[2]! * 0 - F[0]! * 0, F[0]! * 1 - F[1]! * 0]); // F × upp
const U = [R[1]! * F[2]! - R[2]! * F[1]!, R[2]! * F[0]! - R[0]! * F[2]!, R[0]! * F[1]! - R[1]! * F[0]!];

/** Världspunkt → skärmpunkt i CSS-px (375 × 812, origo uppe till vänster). */
export function projicera(x: number, y: number, z: number, P: Kamera = POS): [number, number] {
  const d = [x - P[0], y - P[1], z - P[2]];
  const xc = d[0]! * R[0]! + d[1]! * R[1]! + d[2]! * R[2]!;
  const yc = d[0]! * U[0]! + d[1]! * U[1]! + d[2]! * U[2]!;
  const zc = Math.max(0.01, d[0]! * F[0]! + d[1]! * F[1]! + d[2]! * F[2]!);
  return [((xc / (zc * TAN * ASPEKT) + 1) / 2) * 375, ((1 - yc / (zc * TAN)) / 2) * 812];
}

/** Skärmrutan för en kropp med fot i (x, y, z), halva bredden `halv` och höjden `hojd`. Utan mellanobjekt: placeringen
 *  räknar tusentals rutor per ny skapelse (P3a, prestanda). Skärmens x beror på x och djupet, y bara på y och z. */
export function skarmRuta(x: number, y: number, z: number, halv: number, hojd: number, P: Kamera = POS): Ruta {
  const dz = z - P[2];
  const [ya, yb] = [y - P[1], y + hojd - P[1]];
  const za = Math.max(0.01, ya * F[1]! + dz * F[2]!);
  const zb = Math.max(0.01, yb * F[1]! + dz * F[2]!);
  const pya = ((1 - (ya * U[1]! + dz * U[2]!) / (za * TAN)) / 2) * 812;
  const pyb = ((1 - (yb * U[1]! + dz * U[2]!) / (zb * TAN)) / 2) * 812;
  const r0 = R[0]!;
  const ka = 375 / (2 * za * TAN * ASPEKT);
  const kb = 375 / (2 * zb * TAN * ASPEKT);
  const a0 = 187.5 + (x - halv) * r0 * ka;
  const a1 = 187.5 + (x + halv) * r0 * ka;
  const b0 = 187.5 + (x - halv) * r0 * kb;
  const b1 = 187.5 + (x + halv) * r0 * kb;
  return { x0: Math.min(a0, a1, b0, b1), x1: Math.max(a0, a1, b0, b1), y0: Math.min(pya, pyb), y1: Math.max(pya, pyb) };
}

/** Hur många px skärmens x flyttar sig per världsenhet i x på höjden y och djupet z (placeringen räknar en rad i taget). */
export function xSkala(y: number, z: number, P: Kamera = POS): number {
  const zc = Math.max(0.01, (y - P[1]) * F[1]! + (z - P[2]) * F[2]!);
  return (R[0]! * 375) / (2 * zc * TAN * ASPEKT);
}

/** Hur stor del av `bak` som täcks av `fram` (0–1). */
export function tacker(fram: Ruta, bak: Ruta): number {
  const w = Math.max(0, Math.min(fram.x1, bak.x1) - Math.max(fram.x0, bak.x0));
  const h = Math.max(0, Math.min(fram.y1, bak.y1) - Math.max(fram.y0, bak.y0));
  return (w * h) / Math.max(1e-6, (bak.x1 - bak.x0) * (bak.y1 - bak.y0));
}
