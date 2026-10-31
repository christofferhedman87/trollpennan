import type { Sparad } from "./brygga.ts";
import type { Plats } from "./platser.ts";
import type { Ruta } from "./skarm.ts";
import { FOT_MARGINAL, fotKant, storlekKlass } from "./entiteter.ts";
import { iVatten, KANT_MARGINAL, tillPlats, torrKropp } from "./platsYta.ts";
import { PLACERING, type Band, type Roll } from "./placeringGrund.ts";

export type Satt = { /** huvudets fyllnad (huvud_fyllnad): skymd yta i huvudrutan delas med den */ fh: number; id: string; x: number; z: number; halv: number; djup: number; r: Ruta; /** kroppen själv (kärnan) i rutan r */ k: Ruta; tackt: number; huvud: number; grans: number; plan?: boolean; roll?: Roll; /** småsak: fri siktlinje mot andra småsaker */ sma?: boolean };
/**
 * P3a-fix (Arkitekten 09:16: regeln mäter som skärmen). Skärmprovet räknar huvudet som de synliga pixlarna i övre halvan av
 * kroppens siluett; regeln har bara rutan. Siluetten fyller bara en del av rutan (katten 0,53, bläckfisken 0,31 – mätt i
 * id-passet, data/placering.json huvud_fyllnad), och skymningen kan falla just där pixlarna är. Den skymda ytan i rutan
 * delas därför med fyllnaden: i värsta fall är all skymd yta siluett – samma mått som skärmen, uppåt begränsat.
 */
const FYLL = (PLACERING as unknown as { huvud_fyllnad?: Record<string, number> }).huvud_fyllnad ?? {};
// byggnaderna (zon bak) står still och fyller sin ruta upptill där den skyms: kalib1 visade aldrig mer skymt huvud på skärmen
// än i regeln (slottet 1,6 % räknat, 0 % mätt) – med fyllnaden fick det nya slottet ingen ruta alls (kal2 ängen ord 4)
export const huvudFyllnad = (kropp: string): number => (storlekKlass(kropp)?.zon === "bak" ? 1 : Math.min(1, Math.max(0.2, FYLL[kropp] ?? FYLL._standard ?? 1)));
const ANDEL = (PLACERING as unknown as { siluett_andel?: Record<string, [number, number]> }).siluett_andel ?? {};
/** [bredd, höjd, mätt] – hur stor den ritade siluettens ruta är av kroppens låda (kärnan c) på skärmen. */
export const siluettAndel = (kropp: string): [number, number, boolean] => {
  const a = ANDEL[kropp];
  if (Array.isArray(a)) return [a[0], a[1], true];
  const st = ANDEL._standard;
  return Array.isArray(st) ? [st[0], st[1], false] : [1, 1, false];
};
/** Övre halvan av rutan: där huvudet sitter (modellens huvud går inte att mäta i regeln). */
export const topp = (r: Ruta): Ruta => ({ ...r, y1: r.y0 + (r.y1 - r.y0) / 2 });

/** Raderna i ett band (djup z och höjd y), främst först; varje rad har sina x närmast mitten först. Räknas en gång. */
type Rad = { z: number; y: number; xs: number[] };
export const radMinne = new Map<string, Rad[]>();
export function rader(b: Band, roll: Roll): Rad[] {
  const nyckel = `${roll}|${b.z}|${b.y ?? ""}`;
  let ut = radMinne.get(nyckel);
  if (ut) return ut;
  const S = PLACERING.steg;
  const xs: number[] = [];
  for (let i = 0; i <= Math.ceil(6 / S.x); i++) xs.push((i % 2 ? 1 : -1) * Math.ceil(i / 2) * S.x);
  const ys = roll === "luft" && b.y ? steg(b.y[0], b.y[1], S.y) : [roll === "vatten" ? 0.16 : 0];
  ut = [];
  for (const z of steg(b.z[0], b.z[1], S.z).reverse()) for (const y of ys) ut.push({ z, y, xs });
  radMinne.set(nyckel, ut);
  return ut;
}
function steg(a: number, b: number, s: number): number[] {
  const ut: number[] = [];
  for (let v = a; v <= b + 1e-9; v += s) ut.push(Math.round(v * 1000) / 1000);
  return ut;
}

export const underMinne = new Map<string, Map<number, Map<number, boolean>>>();
/** Torr mark per ruta (x, z, marginal). En plats i taget, så nyckeln behöver inget plats-id. */
export const torrMinne = new Map<number, boolean>();
export const TOM: Ruta = { x0: 0, y0: 0, x1: 0, y1: 0 };
/**
 * P3a torr 4: hur stor del av b:s kropp (kärnan kb, som rör sig inom rutan rb) som a (kärnan ka inom ra) skymmer i
 * värsta läget – de två har vandrat så nära varandra det går, i x och y var för sig. huvud: bara b:s övre halva.
 */
export const MATFEL = PLACERING.matfel_px ?? 0;
function axel(a0: number, a1: number, ea: number, b0: number, b1: number, eb: number): number {
  const ha = (a1 - a0) / 2;
  const hb2 = (b1 - b0) / 2;
  const d = Math.max(0, Math.abs((a0 + a1) / 2 - (b0 + b1) / 2) - ea - eb);
  return Math.max(0, Math.min(ha + hb2 - d, 2 * ha, 2 * hb2));
}
// P3a torr 6: utan mellanobjekt (varst är det mesta av placeringens tid: 43 % i profilen) – samma räkning som förut
export function varst(ra: Ruta, ka: Ruta, rb: Ruta, kb: Ruta, huvud: boolean): number {
  const hy1 = huvud ? kb.y0 + (kb.y1 - kb.y0) / 2 : kb.y1;
  const eax = Math.max(0, ka.x0 - ra.x0, ra.x1 - ka.x1) + MATFEL; // den framför kan vara mätfelet större
  const eay = Math.max(0, ka.y0 - ra.y0, ra.y1 - ka.y1) + MATFEL;
  const ebx = Math.max(0, kb.x0 - rb.x0, rb.x1 - kb.x1);
  const eby = Math.max(0, kb.y0 - rb.y0, rb.y1 - kb.y1);
  const yta = Math.max(1e-6, (kb.x1 - kb.x0) * (hy1 - kb.y0));
  return (axel(ka.x0, ka.x1, eax, kb.x0, kb.x1, ebx) * axel(ka.y0, ka.y1, eay, kb.y0, hy1, eby)) / yta;
}


export function underlag(roll: Roll, plats: Plats | undefined, x: number, z: number, d: Pick<Sparad, "kropp" | "skala">, m: { halv: number; djup: number; f: number }): boolean {
  if (!plats || !plats.zoner.length) return roll !== "vatten";
  if (roll === "luft") return true;
  if (roll === "vatten") {
    const pkt: [number, number][] = [[x, z], [x - m.halv * 0.7, z], [x + m.halv * 0.7, z], [x, z - m.djup * 0.7], [x, z + m.djup * 0.7]];
    return pkt.every(([a, b]) => iVatten(plats, ...tillPlats(a, b)));
  }
  // kroppens kant med vickning och marginal (B6.3: fotKant), i den storlek som ritas
  const kant = Math.max(fotKant(d.kropp, (d.skala || 1) * m.f), Math.max(m.halv, m.djup) + FOT_MARGINAL);
  // kanten avrundas uppåt till 0,05 (lite större marginal, aldrig mindre) så att alla kroppar delar samma uträkning per ruta
  const marg = Math.ceil(Math.max(kant, plats.kant_marginal ?? KANT_MARGINAL) * 20 - 1e-9) / 20;
  // x och z ligger på tusendelar inom ±64, marginalen på 0,05. Fälten går inte in i varandra.
  const nyckel = Math.round(marg * 20) * 2 ** 34 + Math.round((z + 64) * 1000) * 2 ** 17 + Math.round((x + 64) * 1000);
  let ok = torrMinne.get(nyckel);
  if (ok === undefined) torrMinne.set(nyckel, (ok = torrKropp(plats, x, z, marg)));
  return ok;
}

