import * as THREE from "three";
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
  };
}

function hitta(rot: THREE.Object3D, namn: string) {
  let hit: THREE.Object3D | null = null;
  rot.traverse((o) => {
    if (o.name === namn) hit = o;
  });
  return hit as THREE.Object3D | null;
}

const _min = new THREE.Vector3();
const _max = new THREE.Vector3();

/** Ankare ur modellen enligt `fastpunkter.json` (`modell`): bråkdelar av nodens Box3, eller offset från ett ben. Saknas modell-rad används `procAnkare`. */
export function ankareFor(rot: THREE.Object3D, kropp: string): Ankare {
  const rad = kroppRad(kropp).modell;
  if (!rad) return procAnkare(kropp);
  rot.updateMatrixWorld(true);
  const nod = rad.nod === "body" ? (hitta(rot, "body") ?? rot) : rot;
  const box = new THREE.Box3().setFromObject(nod);
  const w = Math.max(0.15, box.max.x - box.min.x);
  const h = Math.max(0.15, box.max.y - box.min.y);
  _min.copy(box.min);
  _max.copy(box.max);
  const ben = rad.ref === "ben" ? hitta(rot, rad.ben ?? "") : null;
  const bas = new THREE.Vector3();
  const q = new THREE.Quaternion();
  if (ben) {
    ben.getWorldPosition(bas);
    rot.getWorldQuaternion(q);
  }
  const punkt = (v: AnkareVarde | undefined): THREE.Vector3 => {
    const f = Array.isArray(v) ? v : v?.f;
    const d = Array.isArray(v) ? undefined : v?.d;
    const p = new THREE.Vector3();
    if (rad.ref === "bbox" && f) {
      p.set(_min.x + f[0] * (_max.x - _min.x), _min.y + f[1] * (_max.y - _min.y), _min.z + f[2] * (_max.z - _min.z));
      if (d) p.add(new THREE.Vector3(d[0], d[1], d[2]));
      return p;
    }
    p.set(d?.[0] ?? 0, d?.[1] ?? 0, d?.[2] ?? 0).applyQuaternion(q).add(bas);
    return p;
  };
  const a = {} as Record<(typeof NAMN)[number], THREE.Vector3>;
  for (const n of NAMN) a[n] = punkt(rad.ankare[n]);
  const bredd = Math.min(w, h * rad.matt.bredd.hojd, rad.matt.bredd.tak ?? Infinity);
  // Skinnade djur utan Head-ben faller tillbaka på mesh-ankare via bounding box-noden `rot`.
  if (rad.ref === "ben" && !ben) return procAnkare(kropp);
  return { ...a, bredd, hojd: h, ben: ben ?? (rad.nod === "body" ? nod : null), varld: true };
}
