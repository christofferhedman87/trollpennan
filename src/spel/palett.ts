// R9: palettbyte i sRGB. Tidigare räknades byten i three.js arbetsfärgrymd (linjär) men skrevs som sRGB-byte på en canvas, så målnyansen
// hamnade fel (blå 207° blev ca 245°, röd blev orange). All färgmatte här utgår från sRGB-byte, rent och testbart utan three.js.
export type Hsl = [number, number, number]; // nyans 0-360, mättnad 0-1, ljushet 0-1
export type Palett = { from: number; range: number; bodyL: number };

export function rgbTillHsl(r: number, g: number, b: number): Hsl {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const mx = Math.max(R, G, B);
  const mn = Math.min(R, G, B);
  const l = (mx + mn) / 2;
  const d = mx - mn;
  if (d === 0) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === R ? (G - B) / d + (G < B ? 6 : 0) : mx === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return [h * 60, s, l];
}

export function hslTillRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] = hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  const m = l - c / 2;
  return [Math.round((r1 + m) * 255), Math.round((g1 + m) * 255), Math.round((b1 + m) * 255)];
}

export function hexTillHsl(hex: string): Hsl {
  const n = parseInt(hex.replace("#", ""), 16);
  return rgbTillHsl((n >> 16) & 255, (n >> 8) & 255, n & 255);
}

export function nyansAvstand(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

/** Träffar pixeln paletten? range < 0 = neutralt läge (vit, grå, gräddvit kropp): låg mättnad och ljushet nära kroppens. */
export function traffarPalett(p: Hsl, pal: Palett): boolean {
  return pal.range < 0 ? p[1] < 0.35 && Math.abs(p[2] - pal.bodyL) < 0.12 : nyansAvstand(p[0], pal.from) <= pal.range && p[1] > 0.25;
}

const lin = (b: number) => Math.pow(b / 255, 2.2);
const sRgb = (v: number) => Math.round(255 * Math.min(1, Math.max(0, Math.pow(Math.max(0, v), 1 / 2.2))));
export type Tint = [number, number, number];

/** Ljusets verkliga förstärkning per färgkanal (linjärt), ur data/miljo.json. Scenen är starkt belyst (nyckel 3.0, hemisfär 1.9) så en färg på kroppen lyser upp, överexponeras och dras mot gult/vitt (röd blev orange, grön blev gulgrön, blå blev blekblå). Därför delar vi albedot med förstärkningen så att den visade färgen blir den begärda. `justering` (data: miljo.json farg.ljusforstark) kalibrerar mot bild. */
export function ljusTint(
  ljus: {
    ambient: { farg: string; styrka: number };
    hemi: { himmel: string; mark: string; styrka: number };
    nyckel: { farg: string; styrka: number };
    fyll: { farg: string; styrka: number };
    kant: { farg: string; styrka: number };
  },
  justering = 1,
): Tint {
  const lv = (hex: string): Tint => {
    const n = parseInt(hex.replace("#", ""), 16);
    return [lin((n >> 16) & 255), lin((n >> 8) & 255), lin(n & 255)];
  };
  // vikt = styrka / pi, med en medelvinkel för hur stor del av ytan som vetter mot ljuset
  const delar: [Tint, number][] = [
    [lv(ljus.ambient.farg), ljus.ambient.styrka],
    [lv(ljus.hemi.himmel), ljus.hemi.styrka * 0.6],
    [lv(ljus.hemi.mark), ljus.hemi.styrka * 0.4],
    [lv(ljus.nyckel.farg), ljus.nyckel.styrka * 0.75],
    [lv(ljus.fyll.farg), ljus.fyll.styrka * 0.4],
    [lv(ljus.kant.farg), ljus.kant.styrka * 0.3],
  ];
  const t: Tint = [0, 0, 0];
  for (const [c, w] of delar) {
    t[0] += (c[0] * w) / Math.PI;
    t[1] += (c[1] * w) / Math.PI;
    t[2] += (c[2] * w) / Math.PI;
  }
  return [t[0] * justering, t[1] * justering, t[2] * justering];
}

/** Ny pixel: exakt målets nyans och mättnad; ljusheten följer pixelns avvikelse från kroppens (skuggning och mönster bevaras). Med `tint` förkompenseras ljusets färgton så att färgen SYNS som begärd. */
export function byttPixel(p: Hsl, pal: Palett, mal: Hsl, tint: Tint = [1, 1, 1]): [number, number, number] {
  const l = Math.min(0.95, Math.max(0.06, mal[2] + (p[2] - pal.bodyL) * 0.6));
  const [r, g, b] = hslTillRgb(mal[0], mal[1], l);
  if (tint[0] === 1 && tint[1] === 1 && tint[2] === 1) return [r, g, b];
  const c: Tint = [lin(r) / tint[0], lin(g) / tint[1], lin(b) / tint[2]];
  const mx = Math.max(c[0], c[1], c[2], 1);
  return [sRgb(c[0] / mx), sRgb(c[1] / mx), sRgb(c[2] / mx)];
}

/** R9: målets albedo (linjärt, för material.color) så att färgen SYNS som begärd i scenens ljus. Används för vita/gråa kroppar. */
export function malAlbedo(hex: string, tint: Tint): Tint {
  const n = parseInt(hex.replace("#", ""), 16);
  const c: Tint = [lin((n >> 16) & 255) / tint[0], lin((n >> 8) & 255) / tint[1], lin(n & 255) / tint[2]];
  const mx = Math.max(c[0], c[1], c[2], 1);
  return [c[0] / mx, c[1] / mx, c[2] / mx];
}

/** R9: gråskala av en texel, normerad så att kroppens ljushet blir vit (1). Mörka ögon och nos förblir mörka. */
export function graNiva(r: number, g: number, b: number, bodyL: number): number {
  const l = rgbTillHsl(r, g, b)[2];
  return Math.round(255 * Math.min(1, Math.max(0, l / Math.max(0.05, bodyL))));
}
