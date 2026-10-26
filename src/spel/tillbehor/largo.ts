import * as THREE from "three";
import type { Sparad } from "../brygga.ts";
import type { Ankare } from "./ankare.ts";

export const LARGO_SKALA: [number, number, number] = [1.25, 1.18, 1.25];
const EN: [number, number, number] = [1, 1, 1];
type LargoSpec = Partial<Sparad> & { blandning?: unknown; extraKropp?: string };
type Par = "oron" | "vingar" | "horn" | "svans";
type Signatur = { typ: "oron" | "vingar" | "horn"; farg: string };
type Sak = { id: string; wx: number; wz: number; uid?: string };
type Steg = { wx: number; wz: number; hoppY: number; rotY: number; dist: number; framme: boolean };

const FORLED = ["enhörnings", "enhörning", "kanin", "drake", "panda", "uggla", "fågel", "groda", "ekorr", "björn", "lejon", "tiger", "katt", "hund", "häst", "gris", "drak", "fisk", "haj", "räv", "ko"].sort((a, b) => b.length - a.length);
const EFTER = new Set(["kanin", "drake", "katt", "hund", "gris", "häst", "panda", "uggla", "fågel", "groda", "ekorre", "björn", "lejon", "tiger", "fisk", "haj", "räv", "ko", "enhörning", "hjort", "noshörning"]);
const FRAS = ["blandad", "korsad", "hälften", "och en", "med kattens", "med kaninens", "med hundens", "med drakens", "med hästens", "med grisens", "med enhörningens"];
const ORON_ORD = ["kanin", "katt", "hund", "gris", "räv", "björn", "rav", "bjorn"];

function textAv(spec: LargoSpec): string {
  return `${spec.formel ?? ""} ${spec.beskrivning ?? ""} ${spec.kropp ?? ""} ${spec.extraKropp ?? ""} ${typeof spec.blandning === "string" ? spec.blandning : ""}`.toLowerCase();
}
function arSammansatt(text: string): boolean {
  for (const w of text.split(/[^a-zåäö]+/)) for (const f of FORLED) {
    if (w.length <= f.length || !w.startsWith(f)) continue;
    const rest = w.slice(f.length);
    if (EFTER.has(rest) || (rest.startsWith("s") && EFTER.has(rest.slice(1)))) return true;
  }
  return false;
}
export function arLargoDjur(spec: LargoSpec): boolean {
  if (spec.blandning || spec.extraKropp || (spec.overraskningar?.length ?? 0) > 0) return true;
  const t = textAv(spec);
  return FRAS.some((f) => t.includes(f)) || arSammansatt(t);
}
export const largoSkala = (spec: LargoSpec): [number, number, number] => (arLargoDjur(spec) ? LARGO_SKALA : EN);
export function largoParGrupp(id: string): Par | null {
  const n = id.toLowerCase();
  if (n === "öron" || n.endsWith("oron") || n.endsWith("öron")) return "oron";
  if (n === "vinge" || n.endsWith("vinge") || n.endsWith("vingar")) return "vingar";
  if (n === "horn" || n.endsWith("horn")) return "horn";
  return n.endsWith("svans") ? "svans" : null;
}
export function largoSignaturDel(spec: LargoSpec): Signatur | null {
  if (!arLargoDjur(spec)) return null;
  const t = textAv(spec);
  if (t.includes("drake") || t.includes("drak") || t.includes("fågel") || t.includes("fagel")) return { typ: "vingar", farg: "#66BB6A" };
  if (t.includes("enhörning") || t.includes("enhorning") || t.includes("noshörning") || t.includes("noshorning") || t.includes("hjort")) return { typ: "horn", farg: "#FFE082" };
  if (ORON_ORD.some((w) => t.includes(w))) return { typ: "oron", farg: "#F48FB1" };
  return null;
}

const SFAR = new THREE.SphereGeometry(1, 8, 6);
const KON = new THREE.ConeGeometry(1, 1, 6);
const MAT = new Map<string, THREE.MeshToonMaterial>();
const _inv = new THREE.Matrix4();
function mat(farg: string): THREE.MeshToonMaterial {
  const m = MAT.get(farg) ?? new THREE.MeshToonMaterial({ color: farg });
  MAT.set(farg, m);
  return m;
}
function lokal(rot: THREE.Object3D, a: Ankare, namn: "huvudTopp" | "rygg", ut: number, upp: number, fram: number): THREE.Vector3 {
  const p = a[namn].clone();
  p.x -= ut * a.bredd; p.y += upp * a.hojd; p.z += fram * a.bredd;
  if (a.varld) { rot.updateWorldMatrix(true, true); p.applyMatrix4(_inv.copy(rot.matrixWorld).invert()); }
  return p;
}
export function monteraLargoDel(rot: THREE.Object3D, spec: LargoSpec, a: Ankare | null | undefined): void {
  rot.getObjectByName("tillbehor-largo")?.removeFromParent();
  const del = a?.huvudTopp && a.rygg ? largoSignaturDel(spec) : null;
  if (!del || !a) return;
  const g = new THREE.Group();
  g.name = "tillbehor-largo";
  g.userData = { plaggPar: del.typ, par: del.typ };
  const vingar = del.typ === "vingar";
  const horn = del.typ === "horn";
  const ut = del.typ === "oron" ? 0.28 : vingar ? 0.22 : 0;
  const upp = del.typ === "oron" ? 0.08 : vingar ? 0.14 : 0.05;
  const fram = vingar ? -0.05 : horn ? 0.18 : 0;
  const skala: [number, number, number] = del.typ === "oron" ? [0.07, 0.16, 0.05] : vingar ? [0.18, 0.05, 0.12] : [0.05, 0.24, 0.05];
  for (const u of horn ? [0] : [ut, -ut]) {
    const mesh = new THREE.Mesh(horn ? KON : SFAR, mat(del.farg));
    mesh.position.copy(lokal(rot, a, vingar ? "rygg" : "huvudTopp", u, upp, fram));
    mesh.scale.set(skala[0], skala[1], skala[2]);
    if (vingar) mesh.rotation.z = u > 0 ? -0.55 : 0.55;
    g.add(mesh);
  }
  rot.add(g);
}

export const ATTRAKTION_IDS = new Set(["äpple", "morot", "jordgubbe", "honung", "banan", "bulle", "boll", "studsboll", "badboll", "kudde", "studsmatta"]);
export const arAttraktionId = (id: string): boolean => ATTRAKTION_IDS.has(id);
export const arBollId = (id: string): boolean => id === "boll" || id === "studsboll" || id === "badboll";

export function hittaNarmasteAttraktion(djurPos: [number, number], saker: Sak[], maxAvst = 4.5): (Sak & { dist: number }) | null {
  let bast: (Sak & { dist: number }) | null = null;
  for (const s of saker) {
    if (!ATTRAKTION_IDS.has(s.id)) continue;
    const dist = Math.hypot(s.wx - djurPos[0], s.wz - djurPos[1]);
    if (dist <= maxAvst && (!bast || dist < bast.dist)) bast = { ...s, dist };
  }
  return bast;
}
export function stegMotMalPunkt(pos: [number, number], malPunkt: [number, number], dt: number, t: number, fart = 1.65): Steg {
  const dx = malPunkt[0] - pos[0];
  const dz = malPunkt[1] - pos[1];
  const dist = Math.hypot(dx, dz);
  if (dist <= 0.18) return { wx: pos[0], wz: pos[1], hoppY: 0, rotY: Math.atan2(dx, dz), dist, framme: true };
  const flytta = Math.min(dist, fart * dt);
  const nx = pos[0] + (dx / dist) * flytta;
  const nz = pos[1] + (dz / dist) * flytta;
  const ndist = Math.hypot(malPunkt[0] - nx, malPunkt[1] - nz);
  return { wx: nx, wz: nz, hoppY: ndist > 0.18 ? Math.abs(Math.sin(t * 7)) * 0.22 : 0, rotY: Math.atan2(dx, dz), dist: ndist, framme: ndist <= 0.18 };
}

type Rapport = { wx: number; wz: number; sak: boolean; kropp: string };
const senast = new Map<string, Rapport>(), puff = new Map<string, { x: number; z: number }>();
const ankomst = new Map<string, string>(), kompisTid = new Map<string, number>();
const NOLL = { x: 0, z: 0 };
const sakerBuf: Sak[] = [];
const kompisBuf: { uid: string; wx: number; wz: number }[] = [];
export const bollOffset = (uid: string): { x: number; z: number } => puff.get(uid) ?? NOLL;
export function rapportPos(uid: string, wx: number, wz: number, sak: boolean, kropp: string): void { senast.set(uid, { wx, wz, sak, kropp }); }
export function kompisNu(a: string, b: string, t: number): boolean {
  const nyckel = a < b ? `${a}|${b}` : `${b}|${a}`;
  const sen = kompisTid.get(nyckel);
  if (sen !== undefined && t - sen < 12 && sen !== t) return false;
  kompisTid.set(nyckel, t);
  return true;
}
export function mumsa(uid: string, nyckel: string | null): boolean {
  if (!nyckel || ankomst.get(uid) === nyckel) { if (!nyckel) ankomst.delete(uid); return false; }
  ankomst.set(uid, nyckel);
  return true;
}
export type SkuttBeslut = { mal: [number, number] | null; wx: number; wz: number; hoppY: number; rotY: number; humor: "busig" | "fortjust" | null; plopp: boolean; kompishopp: boolean };
export function skuttBeslut(uid: string, pos: [number, number], dt: number, t: number): SkuttBeslut {
  const tom: SkuttBeslut = { mal: null, wx: pos[0], wz: pos[1], hoppY: 0, rotY: 0, humor: null, plopp: false, kompishopp: false };
  sakerBuf.length = 0; kompisBuf.length = 0;
  for (const [id, p] of senast) {
    if (id === uid) continue;
    if (p.sak && ATTRAKTION_IDS.has(p.kropp)) sakerBuf.push({ id: p.kropp, uid: id, wx: p.wx, wz: p.wz });
    else if (!p.sak) kompisBuf.push({ uid: id, wx: p.wx, wz: p.wz });
  }
  const nara = hittaNarmasteAttraktion(pos, sakerBuf);
  if (!nara) {
    mumsa(uid, null);
    for (const k of kompisBuf) {
      if (Math.hypot(k.wx - pos[0], k.wz - pos[1]) > 1.1 || !kompisNu(uid, k.uid, t)) continue;
      return { ...tom, kompishopp: true, rotY: Math.atan2(k.wx - pos[0], k.wz - pos[1]) };
    }
    return tom;
  }
  const steg = stegMotMalPunkt(pos, [nara.wx, nara.wz], dt, t);
  const plopp = steg.framme && mumsa(uid, nara.uid ?? nara.id);
  if (!steg.framme) mumsa(uid, null);
  if (plopp && arBollId(nara.id) && nara.uid) {
    const p = puff.get(nara.uid) ?? { x: 0, z: 0 };
    puff.set(nara.uid, { x: p.x + Math.sin(steg.rotY) * 0.9, z: p.z + Math.cos(steg.rotY) * 0.9 });
  }
  return { mal: [nara.wx, nara.wz], wx: steg.wx, wz: steg.wz, hoppY: steg.hoppY, rotY: steg.rotY, humor: steg.framme ? "fortjust" : "busig", plopp, kompishopp: false };
}
