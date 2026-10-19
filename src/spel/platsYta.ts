// R8-2b: var skapelser får stå på en plats. Ren logik utan three, testas i Node.
// Platsens zoner (rekt i 0–1) ritas i PlatsDekors grupp med skala DEKOR_SKALA, så en världspunkt
// (wx, wz) motsvarar platspunkten tillPlats(wx / DEKOR_SKALA, wz / DEKOR_SKALA).
// Landdjur och saker står bara i en zon av typ "land" eller "fri" och aldrig i en "vattenyta".
// Simmare hålls i vattenytan om platsen har en. Ängen (inga zoner) rörs inte.
import { PLATSDATA, type Plats, type Zon } from "./platser.ts";

export const YTA_SKALA = 1.45;
/** Minsta avstånd mellan två skapelser när en punkt måste flyttas (världsenheter). */
const MIN_AVSTAND = 0.85;
const STEG = 0.01;
/** Djurets kropp (≈0,4) + vickningen i djur.tsx (±0,22): så långt från vattenkanten ska mitten stå (världsenheter). */
export const KANT_MARGINAL = 0.6;

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
export function torrKropp(p: Plats, wx: number, wz: number, m = KANT_MARGINAL): boolean {
  if (!paLand(p, ...tillPlats(wx, wz))) return false;
  for (const [dx, dz] of [[m, 0], [-m, 0], [0, m], [0, -m], [m * 0.7, m * 0.7], [-m * 0.7, m * 0.7], [m * 0.7, -m * 0.7], [-m * 0.7, -m * 0.7]] as const)
    if (iVatten(p, ...tillPlats(wx + dx, wz + dz))) return false;
  return true;
}

function harZoner(p: Plats | undefined): p is Plats {
  return !!p && p.zoner.some((z) => z.typ === "land" || z.typ === "fri");
}

/** Närmaste tillåtna punkt (platsrutnät STEG) till `onskad`, minst `min` från `upptagna`. Deterministisk. */
function narmast(p: Plats, onskad: [number, number], upptagna: [number, number][], ok: (wx: number, wz: number) => boolean): [number, number] {
  for (const min of [MIN_AVSTAND, MIN_AVSTAND / 2, 0]) {
    let bast: [number, number] | null = null;
    let bastD = Infinity;
    for (let x = STEG; x < 1; x += STEG) {
      for (let y = 0.3; y <= 1; y += STEG) {
        const [wx, wz] = franPlats(x, y);
        if (!ok(wx, wz)) continue;
        if (upptagna.some(([ux, uz]) => Math.hypot(ux - wx, uz - wz) < min)) continue;
        const d = Math.hypot(wx - onskad[0], wz - onskad[1]);
        if (d < bastD) {
          bastD = d;
          bast = [wx, wz];
        }
      }
    }
    if (bast) return bast;
  }
  return onskad;
}

/**
 * Flytta de önskade världspunkterna (i ordning) så att landdjur står på land och simmare i vatten.
 * Punkter som redan är tillåtna och fria behålls exakt. `sim[i]` = punkt i är en simmare.
 */
export function placeraPaPlats(p: Plats | undefined, onskade: [number, number][], sim: boolean[] = []): [number, number][] {
  if (!harZoner(p)) return onskade;
  const harVatten = p.zoner.some((z) => z.typ === "vattenyta");
  const ut: [number, number][] = [];
  onskade.forEach((o, i) => {
    const simmare = !!sim[i] && harVatten;
    const ok = simmare ? (wx: number, wz: number) => iVatten(p, ...tillPlats(wx, wz)) : (wx: number, wz: number) => torrKropp(p, wx, wz);
    const fri = !ut.some(([ux, uz]) => Math.hypot(ux - o[0], uz - o[1]) < MIN_AVSTAND);
    ut.push(ok(o[0], o[1]) && fri ? o : narmast(p, o, ut, ok));
  });
  return ut;
}
