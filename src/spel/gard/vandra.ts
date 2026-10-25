import type { Sparad } from "../brygga.ts";
import type { SparatBygge } from "../bygge.ts";
import type { Hemdjur } from "../minne.ts";
import {
  CELL_STORLEK,
  GARD_BREDD,
  GARD_DJUP,
  X_MIN,
  X_SPAN,
  Y_MIN,
  Y_SPAN,
  arKantBygge,
  cellTillVarld,
  kantNyckel,
  varldTillCell,
  xyTillCell,
  xyTillKant,
  type CellPlats,
  type KantPlats,
  type SlutenHage,
} from "./rutnat.ts";

export type GardId = string | number;

export interface GardVandrare {
  uid: GardId;
  hemUid: GardId;
  hageId: string | null;
  tillatnaCeller: CellPlats[];
  cell: CellPlats;
  malCell: CellPlats;
  wx: number;
  wz: number;
  malWx: number;
  malWz: number;
  rotY: number;
  vantar: number;
  fart: number;
  fro: number;
  forflyttad: number;
}

export interface GardBoende {
  uid: string;
  hemUid: string;
  hemBygge: Pick<SparatBygge, "uid" | "bygg" | "x" | "y">;
  spec: Sparad;
}

export interface GardDjurSnap {
  uid: string;
  ord: string;
  hemUid: string;
  hageId: string | null;
  wx: number;
  wz: number;
  gx: number;
  gz: number;
  forflyttad: number;
  iTillatenCell: boolean;
}

const FALLBACK: CellPlats = { gx: 2, gz: 4 };
const TEST_NYCKEL = "trollpennan:v1";

function arObjekt(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function nastaSlump(fro: number): { slump: number; fro: number } {
  const nasta = (Math.imul(fro >>> 0, 1664525) + 1013904223) >>> 0;
  return { slump: (nasta & 0xffffff) / 0x1000000, fro: nasta };
}

function froAv(uid: GardId, index: number): number {
  const bas =
    typeof uid === "number"
      ? uid * 7919
      : [...String(uid)].reduce((a, c) => a * 31 + c.charCodeAt(0), 17);
  return bas + index * 101 + 1;
}

function kopia(celler: CellPlats[]): CellPlats[] {
  return celler.map((c) => ({ gx: c.gx, gz: c.gz }));
}

/** Sluten hage om staketet ingår i den, eller om byggnaden står i eller intill den. Annars bara hemrutan. */
export function tillatnaCellerForHem(
  hemBygge: Pick<SparatBygge, "uid" | "bygg" | "x" | "y">,
  hagar: SlutenHage[],
  _kanter?: KantPlats[],
): { celler: CellPlats[]; hageId: string | null } {
  if (arKantBygge(hemBygge.bygg)) {
    const kant = xyTillKant(hemBygge.x, hemBygge.y);
    const nyckel = kantNyckel(kant);
    const h = hagar.find((x) => x.kanter.includes(nyckel)) ?? hagar[0];
    if (h && h.celler.length > 0) return { celler: kopia(h.celler), hageId: h.id };
    return {
      celler: [{ gx: Math.min(kant.gx, GARD_BREDD - 1), gz: Math.min(kant.gz, GARD_DJUP - 1) }],
      hageId: null,
    };
  }
  const hemCell = xyTillCell(hemBygge.x, hemBygge.y);
  for (const h of hagar) {
    const nara = h.celler.some((c) => Math.abs(c.gx - hemCell.gx) <= 1 && Math.abs(c.gz - hemCell.gz) <= 1);
    if (nara && h.celler.length > 0) return { celler: kopia(h.celler), hageId: h.id };
  }
  return { celler: [{ gx: hemCell.gx, gz: hemCell.gz }], hageId: null };
}

export function skapaGardVandrare(
  uid: GardId,
  hemUid: GardId,
  tillatnaCeller: CellPlats[],
  hageId: string | null,
  index = 0,
): GardVandrare {
  const celler = kopia(tillatnaCeller.length > 0 ? tillatnaCeller : [FALLBACK]);
  const c0 = celler[Math.abs(index) % celler.length] ?? FALLBACK;
  const bas = cellTillVarld(c0.gx, c0.gz);
  const ox = ((Math.abs(index) % 5) - 2) * 0.09;
  const oz = (((Math.abs(index) + 2) % 5) - 2) * 0.09;
  return {
    uid,
    hemUid,
    hageId,
    tillatnaCeller: celler,
    cell: { gx: c0.gx, gz: c0.gz },
    malCell: { gx: c0.gx, gz: c0.gz },
    wx: bas.wx + ox,
    wz: bas.wz + oz,
    malWx: bas.wx + ox,
    malWz: bas.wz + oz,
    rotY: 0,
    vantar: 0.1 + (Math.abs(index) % 3) * 0.1,
    fart: 0.85,
    fro: froAv(uid, index),
    forflyttad: 0,
  };
}

/** Samma cell: motsatt kvadrant, minst 0.22 från där djuret står, och 0.28 innanför kanten. */
function malISammaCell(v: GardVandrare, mitt: { wx: number; wz: number }): { wx: number; wz: number } {
  const sx = v.wx >= mitt.wx ? -1 : 1;
  const sz = v.wz >= mitt.wz ? -1 : 1;
  let wx = mitt.wx + sx * 0.2;
  let wz = mitt.wz + sz * 0.2;
  if (Math.hypot(wx - v.wx, wz - v.wz) < 0.22) {
    wx = mitt.wx + sx * 0.2;
    wz = mitt.wz - sz * 0.2;
  }
  return { wx, wz };
}

function valjMal(v: GardVandrare): void {
  const grannar = v.tillatnaCeller.filter(
    (c) => Math.abs(c.gx - v.cell.gx) + Math.abs(c.gz - v.cell.gz) === 1,
  );
  if (grannar.length > 0) {
    const valt = nastaSlump(v.fro);
    v.fro = valt.fro;
    const mal = grannar[Math.min(grannar.length - 1, Math.floor(valt.slump * grannar.length))] ?? v.cell;
    const rx = nastaSlump(v.fro);
    const rz = nastaSlump(rx.fro);
    v.fro = rz.fro;
    const mitt = cellTillVarld(mal.gx, mal.gz);
    v.malCell = { gx: mal.gx, gz: mal.gz };
    v.malWx = mitt.wx + (rx.slump * 2 - 1) * 0.22;
    v.malWz = mitt.wz + (rz.slump * 2 - 1) * 0.22;
    return;
  }
  const mitt = cellTillVarld(v.cell.gx, v.cell.gz);
  const mal = malISammaCell(v, mitt);
  v.malCell = { gx: v.cell.gx, gz: v.cell.gz };
  v.malWx = mal.wx;
  v.malWz = mal.wz;
}

function gaMotMal(v: GardVandrare, stegDt: number): void {
  const dx = v.malWx - v.wx;
  const dz = v.malWz - v.wz;
  const avst = Math.hypot(dx, dz);
  const steg = v.fart * stegDt;
  if (avst <= steg || avst < 0.015) {
    v.forflyttad += avst;
    v.wx = v.malWx;
    v.wz = v.malWz;
    v.cell = varldTillCell(v.wx, v.wz);
    const vant = nastaSlump(v.fro);
    v.fro = vant.fro;
    v.vantar = 0.25 + vant.slump * 0.35;
    return;
  }
  v.wx += (dx / avst) * steg;
  v.wz += (dz / avst) * steg;
  v.forflyttad += steg;
  v.rotY = Math.atan2(dx, dz);
  v.cell = varldTillCell(v.wx, v.wz);
}

function snapHem(v: GardVandrare): void {
  const c0 = v.tillatnaCeller[0] ?? FALLBACK;
  const mitt = cellTillVarld(c0.gx, c0.gz);
  v.wx = mitt.wx;
  v.wz = mitt.wz;
  v.cell = { gx: c0.gx, gz: c0.gz };
  v.malCell = { gx: c0.gx, gz: c0.gz };
  v.malWx = mitt.wx;
  v.malWz = mitt.wz;
}

/** Muterar vandraren. Ortogonala steg håller linjen inne i tillåtna rutor, även i en L-hage. */
export function uppdateraGardVandrare(v: GardVandrare, dt: number): GardVandrare {
  const stegDt = Math.min(Math.max(dt, 0), 0.1);
  const arTillaten = (c: CellPlats) => v.tillatnaCeller.some((t) => t.gx === c.gx && t.gz === c.gz);
  if (v.vantar > 0) {
    v.vantar -= stegDt;
    if (v.vantar <= 0) valjMal(v);
  }
  if (v.vantar <= 0) gaMotMal(v, stegDt);
  if (!arTillaten(v.cell)) snapHem(v);
  return v;
}

export function varldTillNorm(wx: number, wz: number): { x: number; y: number } {
  return {
    x: X_MIN + ((wx / CELL_STORLEK + GARD_BREDD / 2) / GARD_BREDD) * X_SPAN,
    y: Y_MIN + ((wz / CELL_STORLEK + GARD_DJUP / 2) / GARD_DJUP) * Y_SPAN,
  };
}

function specAv(f: Record<string, unknown>): Sparad {
  const kropp = String(f.djur ?? f.kropp ?? f.ord ?? "djur");
  const formel = String(f.formel ?? f.ord ?? kropp);
  const skapad = Number(f.skapad ?? 1);
  return {
    uid: String(f.uid),
    kropp,
    farg: null,
    monster: null,
    monsterfarg: null,
    formagor: [],
    tillbehor: [],
    skala: 1,
    alpha: 1,
    kontur: false,
    glans: false,
    formel,
    beskrivning: formel,
    overraskningar: [],
    skapad: Number.isFinite(skapad) ? skapad : 1,
  };
}

function byggeAv(g: Record<string, unknown>): SparatBygge | null {
  const x = Number(g.x);
  const y = Number(g.y);
  if (!Number.isFinite(x) || !Number.isFinite(y) || g.uid === undefined || g.bygg === undefined) return null;
  const antal = Number(g.antal ?? 1);
  return {
    uid: String(g.uid),
    bygg: String(g.bygg),
    ord: String(g.ord ?? g.bygg),
    formel: String(g.formel ?? g.bygg),
    antal: Number.isFinite(antal) && antal > 0 ? antal : 1,
    fargId: typeof g.farg === "string" ? g.farg : null,
    fargHex: typeof g.fargHex === "string" ? g.fargHex : null,
    monster: null,
    material: null,
    delar: [],
    x,
    y,
    boende: Array.isArray(g.boende) ? g.boende.map((id) => String(id)) : [],
  };
}

/** Läser `trollpennan:v1` (skärmprovet) när gården fortfarande är tom. */
export function synkaTestSparning(
  minne: {
    getState: () => { garden: { length: number } };
    setState: (del: { introSedd: true; forstaGard: false; garden: SparatBygge[]; hemma: Hemdjur[] }) => void;
  },
  lagring: { getItem: (nyckel: string) => string | null },
): void {
  if (minne.getState().garden.length > 0) return;
  const text = lagring.getItem(TEST_NYCKEL);
  if (!text) return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return;
  }
  const raw = arObjekt(parsed) ? parsed : null;
  if (!raw || !Array.isArray(raw.garden)) return;
  const garden: SparatBygge[] = [];
  for (const item of raw.garden) {
    if (!arObjekt(item)) continue;
    const bygge = byggeAv(item);
    if (bygge) garden.push(bygge);
  }
  if (garden.length === 0) return;
  const flock = Array.isArray(raw.flock) ? raw.flock : [];
  const hemma: Hemdjur[] = [];
  for (const g of garden) {
    for (const bId of g.boende) {
      const traff = flock.find((f) => arObjekt(f) && String(f.uid) === String(bId));
      if (!arObjekt(traff)) continue;
      hemma.push({ hem: g.uid, spec: specAv(traff) });
    }
  }
  minne.setState({ introSedd: true, forstaGard: false, garden, hemma });
}

export function samlaGardDjur(
  garden: readonly SparatBygge[],
  hemma: readonly Hemdjur[],
  ang: readonly Sparad[],
): GardBoende[] {
  const ut: GardBoende[] = [];
  const sedda = new Set<string>();
  const lagg = (hem: SparatBygge, spec: Sparad | undefined) => {
    if (!spec) return;
    const uid = String(spec.uid);
    if (sedda.has(uid)) return;
    sedda.add(uid);
    ut.push({
      uid,
      hemUid: hem.uid,
      hemBygge: { uid: hem.uid, bygg: hem.bygg, x: hem.x, y: hem.y },
      spec,
    });
  };
  for (const b of garden) {
    for (const id of b.boende) {
      const spec =
        hemma.find((h) => String(h.spec.uid) === String(id))?.spec ??
        ang.find((a) => String(a.uid) === String(id));
      lagg(b, spec);
    }
  }
  for (const h of hemma) {
    const b = garden.find((g) => g.uid === h.hem);
    if (b) lagg(b, h.spec);
  }
  return ut;
}
