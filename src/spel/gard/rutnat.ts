import type { SparatBygge } from "../bygge.ts";
import gard3d from "../../../data/gard-3d.json" with { type: "json" };

export const GARD_BREDD = gard3d.rutnat.bredd;
export const GARD_DJUP = gard3d.rutnat.djup;
export const CELL_STORLEK = gard3d.rutnat.cellStorlek;
export const X_MIN = gard3d.rutnat.xMin;
export const X_SPAN = gard3d.rutnat.xSpan;
export const Y_MIN = gard3d.rutnat.yMin;
export const Y_SPAN = gard3d.rutnat.ySpan;

export interface CellPlats { gx: number; gz: number }
/** N = norra kanten, W = västra. Syd- och östgränsen ligger på nästa index. */
export type KantRiktning = "N" | "W";
export interface KantPlats { gx: number; gz: number; kant: KantRiktning }
export interface SlutenHage { id: string; celler: CellPlats[]; kanter: string[] }

type ByggeKant = Pick<SparatBygge, "uid" | "bygg" | "ord" | "x" | "y" | "antal">;
type VandRiktning = "N" | "S" | "W" | "E";
type KantLista = [KantPlats, ...KantPlats[]];

const STEG: readonly { riktning: VandRiktning; dx: number; dz: number }[] = [
  { riktning: "N", dx: 0, dz: -1 }, { riktning: "E", dx: 1, dz: 0 },
  { riktning: "S", dx: 0, dz: 1 }, { riktning: "W", dx: -1, dz: 0 },
];
const klamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export function arKantBygge(bygg: string): boolean {
  return gard3d.staket.kantOrd.some((ord) => ord === bygg);
}
export const cellNyckel = (gx: number, gz: number) => `${gx},${gz}`;
export const kantNyckel = (k: KantPlats) => `${k.gx},${k.gz},${k.kant}`;
/** Nyckel för kanten man korsar när man lämnar cellen i riktningen. */
function nyckelFor(gx: number, gz: number, riktning: VandRiktning): string {
  switch (riktning) {
    case "N": return kantNyckel({ gx, gz, kant: "N" });
    case "S": return kantNyckel({ gx, gz: gz + 1, kant: "N" });
    case "W": return kantNyckel({ gx, gz, kant: "W" });
    case "E": return kantNyckel({ gx: gx + 1, gz, kant: "W" });
    default: { const ogiltig: never = riktning; return ogiltig; }
  }
}

function arNord(kant: KantRiktning): boolean {
  switch (kant) {
    case "N": return true;
    case "W": return false;
    default: { const ogiltig: never = kant; return ogiltig; }
  }
}
export function cellTillXy(gx: number, gz: number): { x: number; y: number } {
  return { x: X_MIN + ((gx + 0.5) / GARD_BREDD) * X_SPAN, y: Y_MIN + ((gz + 0.5) / GARD_DJUP) * Y_SPAN };
}
export function xyTillCell(x: number, y: number): CellPlats {
  const fx = ((x - X_MIN) / X_SPAN) * GARD_BREDD;
  const fz = ((y - Y_MIN) / Y_SPAN) * GARD_DJUP;
  return { gx: klamp(Math.round(fx - 0.5), 0, GARD_BREDD - 1), gz: klamp(Math.round(fz - 0.5), 0, GARD_DJUP - 1) };
}
export function kantTillXy(k: KantPlats): { x: number; y: number } {
  const fx = arNord(k.kant) ? k.gx + 0.5 : k.gx;
  const fz = arNord(k.kant) ? k.gz : k.gz + 0.5;
  return { x: X_MIN + (fx / GARD_BREDD) * X_SPAN, y: Y_MIN + (fz / GARD_DJUP) * Y_SPAN };
}

/** Lika avstånd mellan N och W ger N. */
function narmasteKant(fx: number, fz: number): KantPlats {
  const ngx = klamp(Math.round(fx - 0.5), 0, GARD_BREDD - 1);
  const ngz = klamp(Math.round(fz), 0, GARD_DJUP);
  const wgx = klamp(Math.round(fx), 0, GARD_BREDD);
  const wgz = klamp(Math.round(fz - 0.5), 0, GARD_DJUP - 1);
  const nd = Math.hypot(fx - (ngx + 0.5), fz - ngz);
  if (nd <= Math.hypot(fx - wgx, fz - (wgz + 0.5))) return { gx: ngx, gz: ngz, kant: "N" };
  return { gx: wgx, gz: wgz, kant: "W" };
}

export function xyTillKant(x: number, y: number): KantPlats {
  return narmasteKant(((x - X_MIN) / X_SPAN) * GARD_BREDD, ((y - Y_MIN) / Y_SPAN) * GARD_DJUP);
}
export function cellTillVarld(gx: number, gz: number): { wx: number; wz: number } {
  return { wx: (gx - GARD_BREDD / 2 + 0.5) * CELL_STORLEK, wz: (gz - GARD_DJUP / 2 + 0.5) * CELL_STORLEK };
}
export function varldTillCell(wx: number, wz: number): CellPlats {
  const gx = klamp(Math.floor(wx / CELL_STORLEK + GARD_BREDD / 2), 0, GARD_BREDD - 1);
  const gz = klamp(Math.floor(wz / CELL_STORLEK + GARD_DJUP / 2), 0, GARD_DJUP - 1);
  return { gx, gz };
}
export function varldTillKant(wx: number, wz: number): KantPlats {
  return narmasteKant(wx / CELL_STORLEK + GARD_BREDD / 2, wz / CELL_STORLEK + GARD_DJUP / 2);
}
/** fence_*.glb sitter på norra kanten (lokal z = -0.5). PI/2 vrider den till väst. */
export function kantTillVarld(k: KantPlats): { wx: number; wz: number; rotY: number } {
  return {
    wx: (k.gx - GARD_BREDD / 2 + 0.5) * CELL_STORLEK,
    wz: (k.gz - GARD_DJUP / 2 + 0.5) * CELL_STORLEK,
    rotY: arNord(k.kant) ? 0 : Math.PI / 2,
  };
}

function laggKant(sedda: Set<string>, ut: KantPlats[], k: KantPlats): boolean {
  const ny = kantNyckel(k);
  if (sedda.has(ny)) return false;
  sedda.add(ny);
  ut.push(k);
  return true;
}

export function kanterForByggen(garden: ByggeKant[]): KantPlats[] {
  const sedda = new Set<string>();
  const ut: KantPlats[] = [];
  for (const b of garden) {
    if (!arKantBygge(b.bygg)) continue;
    const k0 = xyTillKant(b.x, b.y);
    let lagda = laggKant(sedda, ut, k0) ? 1 : 0;
    const antal = b.antal ?? 1;
    if (antal <= 1) continue;
    const cx = Math.min(k0.gx, GARD_BREDD - 1);
    const cz = Math.min(k0.gz, GARD_DJUP - 1);
    const runt: KantPlats[] = [
      { gx: cx, gz: cz, kant: "N" }, { gx: cx + 1, gz: cz, kant: "W" },
      { gx: cx, gz: cz + 1, kant: "N" }, { gx: cx, gz: cz, kant: "W" },
    ];
    for (const k of runt) if (lagda < antal && laggKant(sedda, ut, k)) lagda += 1;
  }
  return ut;
}

export function arKantBlockerad(blockerade: ReadonlySet<string>, gx: number, gz: number, riktning: VandRiktning): boolean {
  return blockerade.has(nyckelFor(gx, gz, riktning));
}

function bfs(start: CellPlats[], blockerade: ReadonlySet<string>, stopp: ReadonlySet<string>): CellPlats[] {
  const sedd = new Set<string>();
  const ko: CellPlats[] = [];
  const lagg = (gx: number, gz: number) => {
    const ny = cellNyckel(gx, gz);
    if (sedd.has(ny) || stopp.has(ny)) return;
    sedd.add(ny);
    ko.push({ gx, gz });
  };
  for (const s of start) lagg(s.gx, s.gz);
  for (const c of ko) for (const steg of STEG) {
    const nx = c.gx + steg.dx;
    const nz = c.gz + steg.dz;
    if (nx < 0 || nz < 0 || nx >= GARD_BREDD || nz >= GARD_DJUP) continue;
    if (!arKantBlockerad(blockerade, c.gx, c.gz, steg.riktning)) lagg(nx, nz);
  }
  return ko;
}

function narUtifran(gx: number, gz: number, blockerade: ReadonlySet<string>): boolean {
  const n = gz === 0 && !arKantBlockerad(blockerade, gx, gz, "N");
  const s = gz === GARD_DJUP - 1 && !arKantBlockerad(blockerade, gx, gz, "S");
  const w = gx === 0 && !arKantBlockerad(blockerade, gx, gz, "W");
  const e = gx === GARD_BREDD - 1 && !arKantBlockerad(blockerade, gx, gz, "E");
  return n || s || w || e;
}

function kantNycklarRunt(celler: CellPlats[], blockerade: ReadonlySet<string>): string[] {
  const set = new Set<string>();
  const riktningar = ["N", "S", "W", "E"] satisfies readonly VandRiktning[];
  for (const c of celler) for (const riktning of riktningar) {
    if (arKantBlockerad(blockerade, c.gx, c.gz, riktning)) set.add(nyckelFor(c.gx, c.gz, riktning));
  }
  return [...set].sort();
}

/** Celler som inte nås från kartans utsida är inhägnade. */
export function hittaSlutnaHagar(kanter: KantPlats[]): SlutenHage[] {
  const blockerade = new Set(kanter.map(kantNyckel));
  const start: CellPlats[] = [];
  for (let gz = 0; gz < GARD_DJUP; gz += 1) for (let gx = 0; gx < GARD_BREDD; gx += 1) {
    if (narUtifran(gx, gz, blockerade)) start.push({ gx, gz });
  }
  const oppen = new Set(bfs(start, blockerade, new Set()).map((c) => cellNyckel(c.gx, c.gz)));
  const hagar: SlutenHage[] = [];
  const sedd = new Set<string>();
  for (let gz = 0; gz < GARD_DJUP; gz += 1) for (let gx = 0; gx < GARD_BREDD; gx += 1) {
    if (oppen.has(cellNyckel(gx, gz)) || sedd.has(cellNyckel(gx, gz))) continue;
    const celler = bfs([{ gx, gz }], blockerade, oppen);
    for (const c of celler) sedd.add(cellNyckel(c.gx, c.gz));
    celler.sort((a, b) => a.gz - b.gz || a.gx - b.gx);
    hagar.push({ id: `hage-${hagar.length + 1}`, celler, kanter: kantNycklarRunt(celler, blockerade) });
  }
  return hagar;
}

export function ledigCellPlats(finns: { x: number; y: number; bygg?: string }[]): { x: number; y: number } {
  const upptagna: CellPlats[] = [];
  const nycklar = new Set<string>();
  for (const b of finns) {
    if (b.bygg && arKantBygge(b.bygg)) continue;
    const c = xyTillCell(b.x, b.y);
    const ny = cellNyckel(c.gx, c.gz);
    if (nycklar.has(ny)) continue;
    nycklar.add(ny);
    upptagna.push(c);
  }
  let bast: CellPlats | undefined;
  let bastS = -1;
  let bastMitten = false;
  for (let gz = 0; gz < GARD_DJUP; gz += 1) for (let gx = 0; gx < GARD_BREDD; gx += 1) {
    if (nycklar.has(cellNyckel(gx, gz))) continue;
    const mitten = gz >= 3 && gz <= 7 && gx >= 1 && gx <= 4;
    if (bastMitten && !mitten) continue;
    const s = upptagna.length === 0 ? 0 : Math.min(...upptagna.map((o) => Math.hypot(gx - o.gx, gz - o.gz)));
    if (bast && !(mitten && !bastMitten) && !(mitten === bastMitten && s > bastS)) continue;
    bast = { gx, gz };
    bastS = s;
    bastMitten = mitten;
  }
  return cellTillXy(bast?.gx ?? 2, bast?.gz ?? 5);
}

/** Först 1×1 kring (2,4), sedan ytterkanterna på 2×2, sedan resten av rutnätet. */
function kantPrioritet(): KantLista {
  const prio: KantLista = [
    { gx: 2, gz: 4, kant: "N" }, { gx: 3, gz: 4, kant: "W" },
    { gx: 2, gz: 5, kant: "N" }, { gx: 2, gz: 4, kant: "W" },
  ];
  const har = new Set(prio.map(kantNyckel));
  const lagg = (k: KantPlats) => {
    const ny = kantNyckel(k);
    if (har.has(ny)) return;
    har.add(ny);
    prio.push(k);
  };
  for (const gx of [2, 3]) {
    lagg({ gx, gz: 4, kant: "N" });
    lagg({ gx, gz: 6, kant: "N" });
  }
  for (const gz of [4, 5]) {
    lagg({ gx: 2, gz, kant: "W" });
    lagg({ gx: 4, gz, kant: "W" });
  }
  for (let gz = 0; gz <= GARD_DJUP; gz += 1) for (let gx = 0; gx < GARD_BREDD; gx += 1) lagg({ gx, gz, kant: "N" });
  for (let gz = 0; gz < GARD_DJUP; gz += 1) for (let gx = 0; gx <= GARD_BREDD; gx += 1) lagg({ gx, gz, kant: "W" });
  return prio;
}

const KANT_PRIO = kantPrioritet();

export function ledigKantPlats(finns: { x: number; y: number; bygg?: string; antal?: number }[]): { x: number; y: number } {
  const staket: ByggeKant[] = [];
  for (const b of finns) {
    if (!b.bygg || !arKantBygge(b.bygg)) continue;
    staket.push({ uid: "", bygg: b.bygg, ord: b.bygg, x: b.x, y: b.y, antal: b.antal ?? 1 });
  }
  const upptagna = new Set(kanterForByggen(staket).map(kantNyckel));
  for (const k of KANT_PRIO) if (!upptagna.has(kantNyckel(k))) return kantTillXy(k);
  return kantTillXy(KANT_PRIO[0]);
}
