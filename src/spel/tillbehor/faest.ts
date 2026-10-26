import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import type { TillbehorSpec } from "../../tolk/typer.ts";
import { entitet, framVinkel } from "../entiteter.ts";
import { forskjutning, kroppRad, plaggKonfig, skalaVarde, tillbehorRad, type Plats, type TillbehorRad } from "./data.ts";
import { ankareFor, procAnkare, type Ankare } from "./ankare.ts";
import { byggTillbehor } from "./bygg.ts";
import { largoParGrupp } from "./largo.ts";

const _qRot = new THREE.Quaternion();
const _qFram = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _onskad = new THREE.Matrix4();
const _inv = new THREE.Matrix4();
const _lokal = new THREE.Matrix4();
const _s = new THREE.Vector3();
const Y_AXEL = new THREE.Vector3(0, 1, 0);

function framForKropp(kropp: string): number {
  const kr = kroppRad(kropp);
  return framVinkel(kr.modell?.framAxel ?? kr.framAxel ?? entitet(kropp)?.framAxel);
}

/** Världsorientering där plaggets +z pekar mot nosen efter djurets framAxel-vridning. */
function orientFor(rot: THREE.Object3D, kropp: string): THREE.Quaternion {
  rot.getWorldQuaternion(_qRot);
  const fram = framForKropp(kropp);
  if (fram) _qRot.multiply(_qFram.setFromAxisAngle(Y_AXEL, -fram));
  return _qRot;
}

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

function fastVarld(parent: THREE.Object3D, rot: THREE.Object3D, kropp: string, obj: THREE.Object3D, pos: THREE.Vector3, skala: number) {
  rot.updateWorldMatrix(true, true);
  parent.updateWorldMatrix(true, true);
  _s.set(skala, skala, skala);
  _onskad.compose(pos, orientFor(rot, kropp), _s);
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
  const a = rum === "modell" ? ankareFor(rot, kropp, "modell") : procAnkare(kropp);
  rot.userData.ankare = a;
  const parent = a.ben ?? rot;
  for (const t of tillbehor) {
    const rad: TillbehorRad | null = tillbehorRad(t.id, kropp);
    if (!rad) continue;
    const obj = byggTillbehor(t.id, rad, t.farg);
    const par = largoParGrupp(t.id);
    if (par) { obj.userData.par = par; obj.userData.plaggPar = par; }
    const p = a.varld ? rad.plats : (rad.platsMesh ?? rad.plats);
    const q = a.varld ? orientFor(rot, kropp).clone() : null;
    const pos = platsFor(p, a, q);
    const skala = skalaVarde(rad.skala, a.bredd, a.hojd);
    if (a.varld) fastVarld(parent, rot, kropp, obj, pos, skala);
    else {
      obj.position.copy(pos);
      obj.scale.setScalar(skala);
      parent.add(obj);
    }
  }
}

function basFor(ankare: string, a: Ankare, rotPos: THREE.Vector3): THREE.Vector3 {
  if (ankare === "huvudTopp") return a.huvudTopp.clone();
  if (ankare === "hals") return a.hals.clone();
  if (ankare === "rygg") return a.rygg.clone();
  if (ankare === "fot") return new THREE.Vector3(a.hals.x, (a.fotY ?? rotPos.y) + 0.02 * a.hojd, rotPos.z + (a.hals.z - rotPos.z) * 0.55);
  return new THREE.Vector3(a.hals.x, (a.fotY ?? rotPos.y) + 0.45 * a.hojd, rotPos.z + (a.hals.z - rotPos.z) * 0.45);
}

function taBortPar(rot: THREE.Object3D, plaggId: string, par: string) {
  const borta: THREE.Object3D[] = [];
  rot.traverse((o) => {
    if (o.name === "tillbehor-" + plaggId || (par && o.userData?.plaggPar === par)) borta.push(o);
  });
  for (const o of borta) o.parent?.remove(o);
}

function fargaKlon(klon: THREE.Object3D, farg: string) {
  klon.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const byt = (m: THREE.Material) => {
      const k = m.clone();
      if ("color" in k && k.color instanceof THREE.Color) k.color.set(farg);
      return k;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(byt) : byt(mesh.material);
  });
}

/** Monterar ett GLB-plagg på djurets ankare. Returnerar hållaren, eller null om id saknas i plagg.json. */
export function faestPlaggKlon(
  rot: THREE.Object3D,
  kropp: string,
  plaggId: string,
  plaggScen: THREE.Object3D,
  farg?: string | null,
): THREE.Object3D | null {
  const cfg = plaggKonfig(plaggId);
  if (!cfg) return null;
  const a = ankareFor(rot, kropp, "modell");
  rot.userData.ankare = a;
  const parent = (cfg.ankare === "huvudTopp" ? a.ben : null) ?? rot;
  taBortPar(rot, plaggId, cfg.par);
  const rotPos = rot.getWorldPosition(new THREE.Vector3());
  const bas = basFor(cfg.ankare, a, rotPos);
  const off = new THREE.Vector3(-cfg.ut * a.bredd, cfg.upp * a.hojd, cfg.fram * a.bredd);
  off.applyQuaternion(orientFor(rot, kropp));
  const pos = bas.add(off);
  const klon = SkeletonUtils.clone(plaggScen);
  klon.updateMatrixWorld(true);
  const box0 = new THREE.Box3().setFromObject(klon);
  const sz = box0.getSize(new THREE.Vector3());
  const rad0 = Math.max(0.001, sz.x, sz.y, sz.z);
  // V8b: tröjan (djupSkala) får vara högre och djupare så den syns framifrån. Övriga plagg behåller P3b-2-måttet.
  const malMatt = cfg.djupSkala
    ? Math.min(a.hojd * 0.85, Math.max(0.24, a.bredd * cfg.skala))
    : Math.min(a.hojd * 0.55, Math.max(0.14, a.bredd * cfg.skala));
  const sc = malMatt / rad0;
  const scZ = sc * (cfg.djupSkala ?? 1);
  klon.scale.set(sc, sc, scZ);
  const pc = new THREE.Vector3(
    (box0.min.x + box0.max.x) / 2,
    cfg.botten ? box0.min.y : (box0.min.y + box0.max.y) / 2,
    (box0.min.z + box0.max.z) / 2,
  );
  klon.position.set(-pc.x * sc, -pc.y * sc, -pc.z * scZ);
  if (farg) fargaKlon(klon, farg);
  const hallare = new THREE.Group();
  hallare.name = "tillbehor-" + plaggId;
  hallare.userData.plaggPar = cfg.par;
  hallare.userData.plaggId = plaggId;
  hallare.add(klon);
  fastVarld(parent, rot, kropp, hallare, pos, 1);
  return hallare;
}
