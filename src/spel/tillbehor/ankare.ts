import * as THREE from "three";
import { entitet, framVinkel } from "../entiteter.ts";
import { kroppRad, type AnkareVarde, type MeshRad, type Vec3 } from "./data.ts";

/** Ankare i samma rum som djuret ritas: värld för GLB, mesh-rum för generiska former. Djurets framsida är +z. */
export type Ankare = {
  huvudTopp: THREE.Vector3;
  ansikte: THREE.Vector3;
  ogonL: THREE.Vector3;
  ogonR: THREE.Vector3;
  mun: THREE.Vector3;
  hals: THREE.Vector3;
  rygg: THREE.Vector3;
  bredd: number;
  hojd: number;
  /** Förälder som följer idle: benet/noden, eller null (generiskt, fäst på anroparens rot). */
  ben: THREE.Object3D | null;
  /** true = positioner är i rotens världsrum och ska räknas om till förälderns lokala rum. */
  varld: boolean;
  /** Enhetsvektor åt nosen (+z när djuret vetter mot kameran). */
  fram: THREE.Vector3;
  /** Marknivå (världens y) under djuret. Saknas på rena mesh-ankare. */
  fotY?: number;
};

const NAMN = ["huvudTopp", "ansikte", "ogonL", "ogonR", "mun", "hals", "rygg"] as const;

const vec = (v: Vec3) => new THREE.Vector3(v[0], v[1], v[2]);

/** Ankare för generiska former och effekter: absoluta vektorer ur fastpunkter.json (`mesh`). Okänd kropp ger `standard`. */
export function procAnkare(kropp: string): Ankare {
  const m: MeshRad = kroppRad(kropp).mesh;
  return {
    huvudTopp: vec(m.huvudTopp as Vec3),
    ansikte: vec(m.ansikte as Vec3),
    ogonL: vec(m.ogonL as Vec3),
    ogonR: vec(m.ogonR as Vec3),
    mun: vec(m.mun as Vec3),
    hals: vec(m.hals as Vec3),
    rygg: vec(m.rygg as Vec3),
    bredd: m.bredd,
    hojd: m.hojd,
    ben: null,
    varld: false,
    fram: new THREE.Vector3(0, 0, 1),
  };
}

function hitta(rot: THREE.Object3D, namn: string) {
  let hit: THREE.Object3D | null = null;
  rot.traverse((o) => {
    if (o.name === namn) hit = o;
  });
  return hit as THREE.Object3D | null;
}

/** Redan monterade plagg får inte ingå i djurets box när nästa plagg mäts. */
function losTillbehor(rot: THREE.Object3D): [THREE.Object3D, THREE.Object3D][] {
  const traff: THREE.Object3D[] = [];
  rot.traverse((o) => {
    if (o !== rot && (o.name.startsWith("tillbehor-") || o.userData?.plaggPar)) traff.push(o);
  });
  const bort: [THREE.Object3D, THREE.Object3D][] = [];
  for (const o of traff) {
    const p = o.parent;
    if (!p || traff.includes(p)) continue;
    bort.push([o, p]);
    p.remove(o);
  }
  return bort;
}

const _min = new THREE.Vector3();
const _max = new THREE.Vector3();

/**
 * Ankare ur modellen enligt `fastpunkter.json` (`modell`): bråkdelar av nodens Box3, eller offset från ett ben.
 * Saknas modell-rad används `procAnkare`. `rum` "mesh" ger procedurankare med fotY 0.
 * Ytterrotation (krokodil `framAxel: "+x"`) nollställs medan boxen mäts, så tvärbredden följer modellen.
 */
export function ankareFor(rot: THREE.Object3D, kropp: string, rum: "modell" | "mesh" = "modell"): Ankare {
  if (rum === "mesh") return { ...procAnkare(kropp), fotY: 0 };
  let rad = kroppRad(kropp).modell;
  if (!rad && rot.children.length > 0) rad = kroppRad("kanin").modell;
  if (!rad) return { ...procAnkare(kropp), fotY: 0 };
  const nod = rad.nod === "body" ? (hitta(rot, "body") ?? rot) : rot;
  const oldQ = rot.parent ? rot.parent.quaternion.clone() : null;
  if (oldQ && rot.parent) rot.parent.quaternion.identity();
  const bort = losTillbehor(rot);
  rot.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(nod);
  const p0 = rot.getWorldPosition(new THREE.Vector3());
  const q0 = rot.getWorldQuaternion(new THREE.Quaternion());
  for (const [o, p] of bort) p.add(o);
  if (oldQ && rot.parent) rot.parent.quaternion.copy(oldQ);
  rot.updateWorldMatrix(true, true);

  const fram = framVinkel(rad.framAxel ?? kroppRad(kropp).framAxel ?? entitet(kropp)?.framAxel);
  const w = Math.abs(Math.sin(fram)) > 0.5 ? Math.max(0.15, box.max.z - box.min.z) : Math.max(0.15, box.max.x - box.min.x);
  const h = Math.max(0.15, box.max.y - box.min.y);
  _min.copy(box.min);
  _max.copy(box.max);
  const qRot = rot.getWorldQuaternion(new THREE.Quaternion());
  const p1 = rot.getWorldPosition(new THREE.Vector3());
  const qDelta = qRot.clone().multiply(q0.clone().invert());
  const flytta = qDelta.angleTo(new THREE.Quaternion()) > 1e-5 || p0.distanceTo(p1) > 1e-5;
  const ben = rad.ref === "ben" ? hitta(rot, rad.ben ?? "") : null;
  const bas = new THREE.Vector3();
  if (ben) ben.getWorldPosition(bas);
  const punkt = (v: AnkareVarde | undefined): THREE.Vector3 => {
    const f = Array.isArray(v) ? v : v?.f;
    const d = Array.isArray(v) ? undefined : v?.d;
    const p = new THREE.Vector3();
    if (rad.ref === "bbox" && f) {
      p.set(_min.x + f[0] * (_max.x - _min.x), _min.y + f[1] * (_max.y - _min.y), _min.z + f[2] * (_max.z - _min.z));
      if (d) p.add(new THREE.Vector3(d[0], d[1], d[2]));
      if (flytta) p.sub(p0).applyQuaternion(qDelta).add(p1);
      return p;
    }
    p.set(d?.[0] ?? 0, d?.[1] ?? 0, d?.[2] ?? 0).applyQuaternion(qRot).add(bas);
    return p;
  };
  const a = {} as Record<(typeof NAMN)[number], THREE.Vector3>;
  for (const n of NAMN) a[n] = punkt(rad.ankare[n]);
  const bredd = Math.min(w, h * rad.matt.bredd.hojd, rad.matt.bredd.tak ?? Infinity);
  if (rad.ref === "ben" && !ben) return { ...procAnkare(kropp), fotY: 0 };
  return { ...a, bredd, hojd: h, ben: ben ?? (rad.nod === "body" ? nod : null), varld: true, fotY: _min.y, fram: new THREE.Vector3(0, 0, 1) };
}
