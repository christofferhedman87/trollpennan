import placeringJson from "../../data/placering.json" with { type: "json" };
import modellmattJson from "../../data/modellmatt.json" with { type: "json" };
import type { Sparad } from "./brygga.ts";
import { arSak, ENTITETER, flyger, harModell, halvBredd, malhojd, simmar, storlekKlass, svavar, synSkala, takSkala } from "./entiteter.ts";
import { START_PLATS, type Plats } from "./platser.ts";
import { KAMERA_ANG, KAMERA_PLATS, type Kamera, type Ruta } from "./skarm.ts";

import { skapelsePlan } from "./skapelsePlan.ts";

export type Roll = "mark" | "vatten" | "luft" | "bak";
export type Band = { z: [number, number]; y?: [number, number] };
type Fast = { namn: string; x: number; z: number; halv: number; djup: number; hojd: number; plan?: boolean; /** egen gräns (grinden: förbjuden zon) */ max_skymd?: number };
export type PlatsRegel = { skala?: number; band: Partial<Record<Roll, Band>>; varld_reserverat: { namn: string; x: [number, number]; z: [number, number] }[]; fasta: Fast[] };
type Data = {
  max_skymd: number;
  bak_lucka?: number;
  matfel_px?: number;
  max_skymd_aldre?: number;
  nya_antal?: number;
  huvud_skymd?: number;
  krymp_aldre_min?: number;
  krymp_steg?: number;
  vandra?: { x: number; z: number; steg: number[] };
  steg: { x: number; z: number; y: number };
  vickning: Record<Roll, number>;
  vrid?: { djur: number };
  krymp_min?: number;
  synlig_golv?: { storst_px: number; minst_px: number; yta_px: number };
  smasak_px?: number;
  smasak_min_px?: number;
  smasak_center_px?: number;
  byggnad_max_skymd?: number;
  reserv_krymp?: number[];
  sakerhet?: number;
  smasak_vaxa?: number[];
  djup: number;
  skarm_reserverat: (Ruta & { namn: string })[];
  platser: Record<string, PlatsRegel>;
};
export const PLACERING = placeringJson as unknown as Data;
const MODELLMATT = (modellmattJson as unknown as { matt: Record<string, number[]> }).matt;
export const SKARM_RESERVERAT: readonly Ruta[] = PLACERING.skarm_reserverat.map(({ x0, y0, x1, y1 }) => ({ x0, y0, x1, y1 }));
export const SKARM = { w: 375, h: 812 };
export const GOLV = PLACERING.synlig_golv;
export const KANT_PX = 8;
/** reserv_krymp bara i spelets storlek (tak 10 per plats): med 30 i prestandaprovet vore det för dyrt */
export const RESERV_MAX = 16;

export function regelFor(plats?: Plats): PlatsRegel {
  return PLACERING.platser[plats?.id ?? START_PLATS] ?? PLACERING.platser.standard!;
}

/** En vattenfågel (entiteter.json vattenfagel) utan barnets vingar simmar på en plats med vattenyta – också i ängens damm
 *  (Doodle 18:46: den blå ankan svävade vid trädkanten på ängen). */
export function vidVatten(d: Pick<Sparad, "kropp" | "formagor">, plats?: Plats): boolean {
  return !!plats && !!ENTITETER[d.kropp]?.vattenfagel && !d.formagor.includes("vingar") && plats.zoner.some((z) => z.typ === "vattenyta");
}

export function rollFor(d: Pick<Sparad, "kropp" | "formagor">, plats?: Plats): Roll {
  if (flyger(d.kropp, d.formagor) && !vidVatten(d, plats)) return "luft";
  if (simmar(d.kropp, d.formagor) || vidVatten(d, plats)) return "vatten";
  if (storlekKlass(d.kropp)?.zon === "bak") return "bak";
  return "mark";
}

export type Lage = { x: number; y: number; z: number; roll: Roll; /** skärmrutan som regeln räknade med */ r: Ruta; stall: boolean; /** ritas så här mycket mindre (äldre när det är trångt; den nya bara om den inte ryms i bild alls) */ krymp?: number; /** del av full vandring (djur.tsx), 1 = fritt bete */ vand?: number; /** kroppen själv i vila på sin ruta (r är rutan den rör sig inom) */ kropp?: Ruta; /** regelns räknade skymning i värsta läget (kalibrering mot skärmprovet) */ skymd?: { tackt: number; huvud: number } };

/** Kroppens mått på djupet z: halva bredden, höjden och djupet (barnets storleksord, taket och minsta synliga storlek). */
export function kroppMatt(d: Pick<Sparad, "kropp" | "skala"> & Partial<Pick<Sparad, "tillbehor">>, z: number, plats?: Plats, roll?: Roll, vandDel = 1): { halv: number; hojd: number; djup: number; f: number; vand: [number, number]; /** lådans botten över foten */ y0: number; /** kroppen själv i varje ögonblick, minsta läget: halva bredden, höjden, halva djupet, botten (P3a torr 4) */ kx: number; kh: number; kd: number; ky0: number } {
  const f = ritSkala(d, z, plats);
  const plan = d.tillbehor?.length ? skapelsePlan(d) : null, sammansatt = !!plan?.saker.length;
  const djur = ENTITETER[d.kropp]?.typ === "djur";
  const ror = sammansatt ? 0 : djur && roll !== "luft" ? vandDel : djur ? 1 : 0;
  const V = PLACERING.vandra;
  const vand: [number, number] = !sammansatt && djur && roll !== "luft" && V ? [V.x * vandDel, V.z * vandDel] : [0, 0];
  // P3a (Arkitekten 20:40): modellens egna mått (data/modellmatt.json, samma Box3 och skala som gltfDjur) och den
  // vridning djur.tsx ger den: ett djur som vandrar vrider sig upp till 0,35·π·vandring, en flygare ±0,14 (och rullar
  // 0,28), en svävare 0,35, en sak inte alls. Rutan är den axelparallella lådan runt den vridna kroppen.
  const r = plan?.ruta;
  const mm = plan && r ? [2 * Math.max(-r.min[0], r.max[0]), r.max[1] - r.min[1], 2 * Math.max(-r.min[2], r.max[2]), r.min[1]] : MODELLMATT[d.kropp];
  if (mm && (harModell(d.kropp) || mm.length > 3)) {
    const k = takSkala(d.kropp, d.skala || 1) * f;
    const [a, b] = [(mm[0] * k) / 2, (mm[2] * k) / 2];
    const th = sammansatt ? 0 : arSak(d.kropp) ? 0 : roll === "luft" ? 0.14 : svavar(d.kropp) ? 0.35 : djur ? 0.35 * Math.PI * ror : 0;
    const halv = vriden(a, b, th);
    const djup = vriden(b, a, th);
    const rull = !sammansatt && roll === "luft" ? Math.sin(0.28) * halv : 0; // flygaren rullar: lite högre
    const bob = sammansatt ? 0 : arSak(d.kropp) ? 0 : roll === "luft" ? 0.16 : roll === "vatten" ? 0.08 : 0.04; // djur.tsx: guppar upp och ned
    // P3a-fix torr 4 (Doodle 7): ett djur som hoppar av sig själv (entiteter.json hopp: kaninen) lyfter upp till 0,45 m
    // (djur.tsx lyft) – rutan det rör sig inom räknar med hoppet, annars skymde kaninen grinden mitt i ett hopp (86 %)
    const lyft = !sammansatt && !arSak(d.kropp) && ENTITETER[d.kropp]?.hopp ? 0.45 : 0;
    // kärnan: kroppen i ett ögonblick, i sitt smalaste läge (vridningen gör den bara bredare, ändpunkterna är minst)
    const [kx, kd] = [Math.min(a, a * Math.cos(th) + b * Math.sin(th)), Math.min(b, b * Math.cos(th) + a * Math.sin(th))];
    return { halv, hojd: mm[1] * k + rull + 2 * bob + lyft, djup: Math.max(0.05, djup), f, vand, y0: (mm[3] ?? 0) * k - bob, kx, kh: mm[1] * k, kd: Math.max(0.05, kd), ky0: (mm[3] ?? 0) * k };
  }
  // procedurkropp (ingen modell): målhöjden och fotavtrycket, som förut
  const vrid = 1 + ((PLACERING.vrid?.djur ?? 1) - 1) * ror;
  const bas = halvBredd(d.kropp, d.skala || 1) * f;
  const halv = bas * vrid;
  const djup = djur ? bas * PLACERING.djup + (halv - bas * PLACERING.djup) * ror : halv * PLACERING.djup;
  const hojd = malhojd(d.kropp) * takSkala(d.kropp, d.skala || 1) * f;
  return { halv, hojd, djup: Math.max(0.2, djup), f, vand, y0: 0, kx: bas, kh: hojd, kd: Math.max(0.2, djur ? bas * PLACERING.djup : djup), ky0: 0 };
}

/** P3a (Arkitekten 20:40): kameran som platsen ritas med – ängens, eller närmare på samma linje (skarm.ts). */
export function kameraFor(plats?: Plats): Kamera {
  return !plats || plats.id === START_PLATS ? KAMERA_ANG : KAMERA_PLATS;
}

/** Största halva utbredningen a·|cos θ| + b·|sin θ| för en låda med halva måtten a (längs axeln) och b, vriden |θ| ≤ th. */
function vriden(a: number, b: number, th: number): number {
  const topp = Math.atan2(b, a);
  return topp <= th ? Math.hypot(a, b) : a * Math.cos(th) + b * Math.sin(th);
}

/** Hur mycket djur.tsx ritar kroppen större/mindre: platsens skala (data) × minsta synliga storlek på djupet z. */
export function ritSkala(d: Pick<Sparad, "kropp" | "skala">, z: number, plats?: Plats): number {
  const k = regelFor(plats).skala ?? 1;
  return k * synSkala(d.kropp, (d.skala || 1) * k, z);
}

