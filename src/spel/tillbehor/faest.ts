import * as THREE from "three";
import type { TillbehorSpec } from "../../tolk/typer.ts";
import { forskjutning, skalaVarde, tillbehorRad, type Plats, type TillbehorRad } from "./data.ts";
import { ankareFor, procAnkare, type Ankare } from "./ankare.ts";
import { byggTillbehor } from "./bygg.ts";

const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _onskad = new THREE.Matrix4();
const _inv = new THREE.Matrix4();
const _lokal = new THREE.Matrix4();
const _s = new THREE.Vector3();

/** Läge för tillbehöret: ankaret, ev. draget mot ett annat ankare, plus förskjutning ut (−x), upp (+y) och fram (+z) i rotens axlar. */
export function platsFor(p: Plats, a: Ankare, q: THREE.Quaternion | null): THREE.Vector3 {
  const pos = a[p.ankare as keyof Ankare] instanceof THREE.Vector3 ? (a[p.ankare as "hals"] as THREE.Vector3).clone() : new THREE.Vector3();
  if (p.mot) {
    const mal = a[p.mot.ankare as "hals"] as THREE.Vector3;
    if (p.mot.t !== undefined) pos.lerp(mal, p.mot.t);
    if (p.mot.y !== undefined) pos.y += (mal.y - pos.y) * p.mot.y;
  }
  _v.set(-forskjutning(p.ut, a.bredd, a.hojd), forskjutning(p.upp, a.bredd, a.hojd), forskjutning(p.fram, a.bredd, a.hojd));
  if (q) _v.applyQuaternion(q);
  return pos.add(_v);
}

function fastVarld(parent: THREE.Object3D, rot: THREE.Object3D, obj: THREE.Object3D, pos: THREE.Vector3, skala: number) {
  rot.updateWorldMatrix(true, true);
  parent.updateWorldMatrix(true, true);
  rot.getWorldQuaternion(_q);
  _s.set(skala, skala, skala);
  _onskad.compose(pos, _q, _s);
  _inv.copy(parent.matrixWorld).invert();
  _lokal.multiplyMatrices(_inv, _onskad);
  _lokal.decompose(obj.position, obj.quaternion, obj.scale);
  parent.add(obj);
}

/**
 * Fäster alla tillbehör på djuret. `rum` = "modell" för inladdad GLB (ankare ur modellen, värld → benets rum),
 * "mesh" för generiska former (ankare i meshrummet). Allt ritas med +z framåt; djuret vänds av anroparen.
 */
export function faestTillbehor(
  rot: THREE.Object3D,
  kropp: string,
  tillbehor: TillbehorSpec[],
  rum: "modell" | "mesh" = "mesh",
) {
  const a = rum === "modell" ? ankareFor(rot, kropp) : procAnkare(kropp);
  const parent = a.ben ?? rot;
  for (const t of tillbehor) {
    const rad: TillbehorRad | null = tillbehorRad(t.id, kropp);
    if (!rad) continue;
    const obj = byggTillbehor(t.id, rad, t.farg);
    const p = a.varld ? rad.plats : (rad.platsMesh ?? rad.plats);
    const q = a.varld ? rot.getWorldQuaternion(new THREE.Quaternion()) : null;
    const pos = platsFor(p, a, q);
    const skala = skalaVarde(rad.skala, a.bredd, a.hojd);
    if (a.varld) fastVarld(parent, rot, obj, pos, skala);
    else {
      obj.position.copy(pos);
      obj.scale.setScalar(skala);
      parent.add(obj);
    }
  }
}
