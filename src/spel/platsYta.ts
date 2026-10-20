// R8-2b: var skapelser får stå på en plats. Ren logik utan three, testas i Node.
// Platsens zoner (rekt i 0–1) ritas i PlatsDekors grupp med skala DEKOR_SKALA, så en världspunkt
// (wx, wz) motsvarar platspunkten tillPlats(wx / DEKOR_SKALA, wz / DEKOR_SKALA).
// Landdjur och saker står bara i en zon av typ "land" eller "fri" och aldrig i en "vattenyta".
// Simmare hålls i vattenytan om platsen har en. B6.3 (I): ängen har zoner för dammen (platser.json), med egen kant_marginal.
import { PLATSDATA, type Plats, type Zon } from "./platser.ts";

export const YTA_SKALA = 1.45;
/** Minsta avstånd mellan två skapelser när en punkt måste flyttas (världsenheter). */
const MIN_AVSTAND = 0.85;
const STEG = 0.01;
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

function harZoner(p: Plats | undefined): p is Plats {
  return !!p && p.zoner.some((z) => z.typ === "land" || z.typ === "fri");
}

/** Närmaste tillåtna punkt (platsrutnät STEG) till `onskad`, minst `min` från `upptagna`. Deterministisk. */
/** B6.6: så långt ut i sidled (världsenheter) ser kameran en skapelse i stående läge (375 px). Förut kunde en flyttad
 *  skapelse (bort från dammen) hamna utanför bildens högra kant. Hittas ingen plats inom gränsen söks utan gräns. */
export const SYNLIG_X = 1.6;

/** B6.6: längre fram (större z) ser kameran smalare, och en stor kropp (marginal m) sticker ut mot kameran. Bilden är
 *  ≈ 0,25 · (9,8 − z) åt vardera hållet i stående läge (kameran på z 9,8, fov 58). Giraffen längst fram (z 2,6) stod förut utanför. */
export function synligX(wz: number, m = 0): number {
  return Math.min(SYNLIG_X, 0.25 * (9.8 - wz - m));
}

function narmast(p: Plats, onskad: [number, number], upptagna: [number, number][], ok: (wx: number, wz: number) => boolean, m = 0): [number, number] {
  return narmastInom(p, onskad, upptagna, (wx, wz) => Math.abs(wx) <= synligX(wz, m) && ok(wx, wz)) ?? narmastInom(p, onskad, upptagna, ok) ?? onskad;
}

function narmastInom(p: Plats, onskad: [number, number], upptagna: [number, number][], ok: (wx: number, wz: number) => boolean): [number, number] | null {
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
  return null;
}

/**
 * Flytta de önskade världspunkterna (i ordning) så att landdjur står på land och simmare i vatten.
 * Punkter som redan är tillåtna och fria behålls exakt. `sim[i]` = punkt i är en simmare.
 */
/** `kant` (B6.3): egen kantmarginal per skapelse (stora saker: halva bredden ur storlek.json), annars platsens. */
/** `sikt` (B6.3, Doodle 09:17): extra villkor per skapelse (ängen: siktzonen mellan kameran och dammen, damm.ts siktFri). */
export function placeraPaPlats(
  p: Plats | undefined,
  onskade: [number, number][],
  sim: boolean[] = [],
  kant: (number | undefined)[] = [],
  sikt: (((wx: number, wz: number) => boolean) | undefined)[] = [],
): [number, number][] {
  if (!harZoner(p)) return onskade;
  const harVatten = p.zoner.some((z) => z.typ === "vattenyta");
  const ut: [number, number][] = [];
  onskade.forEach((o, i) => {
    const simmare = !!sim[i] && harVatten;
    const m = Math.max(kant[i] ?? 0, p.kant_marginal ?? KANT_MARGINAL);
    const villkor = sikt[i];
    const ok = simmare
      ? (wx: number, wz: number) => iVatten(p, ...tillPlats(wx, wz))
      : (wx: number, wz: number) => torrKropp(p, wx, wz, m) && (!villkor || villkor(wx, wz));
    const fri = !ut.some(([ux, uz]) => Math.hypot(ux - o[0], uz - o[1]) < MIN_AVSTAND);
    ut.push(ok(o[0], o[1]) && fri ? o : narmast(p, o, ut, ok, simmare ? 0 : m));
  });
  return ut;
}

/**
 * B6.5: önskade lägen för `n` simmare, spridda över platsens största vattenyta (världspunkter). Deterministiskt:
 * ett rutnät i ytan (12 % marginal, i sidled inom platsens fri-zon), första punkten närmast ytans mitt, sedan alltid den punkt som ligger längst från
 * de redan valda. Förut önskade alla simmare samma lilla ring, så de klumpade sig vid bryggan. null = platsen saknar vatten.
 */
export function simPlatser(p: Plats | undefined, n: number): [number, number][] | null {
  const ytor = (p?.zoner ?? []).filter((z) => z.typ === "vattenyta");
  if (!p || !ytor.length || n <= 0) return null;
  const area = (r: Zon["rekt"]) => Math.abs((r[2] - r[0]) * (r[3] - r[1]));
  const z = ytor.slice().sort((a, b) => area(b.rekt) - area(a.rekt))[0]!;
  let [x0, x1] = [Math.min(z.rekt[0], z.rekt[2]), Math.max(z.rekt[0], z.rekt[2])];
  // Inom platsens "fri"-zon i sidled (där kameran ramar in), så att ingen simmare hamnar utanför bilden på stora sjöar.
  const fri = p.zoner.find((q) => q.typ === "fri");
  if (fri) {
    const f0 = Math.max(x0, Math.min(fri.rekt[0], fri.rekt[2]));
    const f1 = Math.min(x1, Math.max(fri.rekt[0], fri.rekt[2]));
    if (f1 - f0 > 0.05) [x0, x1] = [f0, f1];
  }
  const [y0, y1] = [Math.min(z.rekt[1], z.rekt[3]), Math.max(z.rekt[1], z.rekt[3])];
  const mx = (x1 - x0) * 0.12;
  const my = (y1 - y0) * 0.12;
  const kand: [number, number][] = [];
  for (let i = 0; i <= 8; i++)
    for (let j = 0; j <= 5; j++) {
      const w = franPlats(x0 + mx + ((x1 - x0 - 2 * mx) * i) / 8, y0 + my + ((y1 - y0 - 2 * my) * j) / 5);
      if (iVatten(p, ...tillPlats(w[0], w[1]))) kand.push(w);
    }
  if (!kand.length) return null;
  const mitt = franPlats((x0 + x1) / 2, (y0 + y1) / 2);
  const ut: [number, number][] = [];
  let forsta = kand[0]!;
  for (const k of kand) if (Math.hypot(k[0] - mitt[0], k[1] - mitt[1]) < Math.hypot(forsta[0] - mitt[0], forsta[1] - mitt[1])) forsta = k;
  ut.push(forsta);
  while (ut.length < n) {
    let bast = kand[0]!;
    let bastD = -1;
    for (const k of kand) {
      const d = Math.min(...ut.map((u) => Math.hypot(u[0] - k[0], u[1] - k[1])));
      if (d > bastD) {
        bastD = d;
        bast = k;
      }
    }
    ut.push(bast);
  }
  return ut;
}
