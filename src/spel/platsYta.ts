// R8-2b: var skapelser får stå på en plats. Ren logik utan three, testas i Node.
// Platsens zoner (rekt i 0–1) ritas i PlatsDekors grupp med skala DEKOR_SKALA, så en världspunkt
// (wx, wz) motsvarar platspunkten tillPlats(wx / DEKOR_SKALA, wz / DEKOR_SKALA).
// Landdjur och saker står bara i en zon av typ "land" eller "fri" och aldrig i en "vattenyta".
// Simmare hålls i vattenytan om platsen har en. B6.3 (I): ängen har zoner för dammen (platser.json), med egen kant_marginal.
import { PLATSDATA, type Plats, type Zon } from "./platser.ts";

export const YTA_SKALA = 1.45;
/** Djurets kropp (≈0,4) + vickningen i djur.tsx (±0,22) + en synlig bit strand: så långt från vattenkanten ska mitten stå
 *  (världsenheter). B6.2: 0,6 → 1,0, räven på sjön stod med tassarna i vattenbrynet (kameran ser vattnet bakom djuret). */
export const KANT_MARGINAL = 1.0;

export function iRekt(x: number, y: number, r: Zon["rekt"]): boolean {
  const [x0, y0, x1, y1] = r;
  return x >= Math.min(x0, x1) && x <= Math.max(x0, x1) && y >= Math.min(y0, y1) && y <= Math.max(y0, y1);
}

/** Världspunkt → platspunkt (0–1). */
export function tillPlats(wx: number, wz: number, yta = PLATSDATA.yta): [number, number] {
  const [x0, x1] = yta.x;
  const [z0, z1] = yta.z;
  return [(wx / YTA_SKALA - x0) / (x1 - x0), (wz / YTA_SKALA - z0) / (z1 - z0)];
}

/** Platspunkt → världspunkt (samma skala som vattenytan och startobjekten ritas med). */
export function franPlats(x: number, y: number, yta = PLATSDATA.yta): [number, number] {
  const [x0, x1] = yta.x;
  const [z0, z1] = yta.z;
  return [(x0 + (x1 - x0) * x) * YTA_SKALA, (z0 + (z1 - z0) * y) * YTA_SKALA];
}

export function iVatten(p: Plats, x: number, y: number): boolean {
  return p.zoner.some((z) => z.typ === "vattenyta" && iRekt(x, y, z.rekt));
}

/** Land = inuti en "land"- eller "fri"-zon och utanför varje "vattenyta". */
export function paLand(p: Plats, x: number, y: number): boolean {
  if (iVatten(p, x, y)) return false;
  return p.zoner.some((z) => (z.typ === "land" || z.typ === "fri") && iRekt(x, y, z.rekt));
}

/** Land för en hel kropp: mitten på land och inget av kroppens kantprov (±marginal) i vatten. */
export function torrKropp(p: Plats, wx: number, wz: number, m = p.kant_marginal ?? KANT_MARGINAL): boolean {
  if (!paLand(p, ...tillPlats(wx, wz))) return false;
  // B6.3: 16 riktningar på avståndet m och en ring på m/2 (med 8 kom vattnet närmare än m mellan riktningarna)
  for (let i = 0; i < 16; i++) {
    const v = (i * Math.PI) / 8;
    for (const r of [m, m / 2]) if (iVatten(p, ...tillPlats(wx + Math.cos(v) * r, wz + Math.sin(v) * r))) return false;
  }
  return true;
}

/** P3: halva bildens bredd (världsenheter) på djupet wz i stående läge (kameran på z 9,8, fov 58). */
export function synligHalv(wz: number): number {
  return 0.25 * (9.8 - wz);
}
