import type { Sparad } from "../brygga.ts";
import { faestTillbehor } from "../tillbehor/index.ts";
import { monteraLargoDel } from "../tillbehor/largo.ts";
import * as THREE from "three";
import { appliceraSlimeGlod } from "../belys.ts";
import { mjukrundaScen } from "../mjukGeometri.ts";

export function klippNamn(actions: Record<string, THREE.AnimationAction | null>, suffix: string) {
  const re = new RegExp(`(^|\\|)${suffix}$`, "i");
  return Object.keys(actions).find((n) => re.test(n)) ?? null;
}

function utanRot(clip: THREE.AnimationClip) {
  const tracks = clip.tracks.filter((t) => {
    const n = t.name.toLowerCase();
    if (!n.endsWith(".position")) return true;
    return !(n.startsWith("root.") || n.startsWith("all.") || n.includes("|all.position"));
  });
  if (tracks.length === clip.tracks.length) return clip;
  return new THREE.AnimationClip(clip.name + "-rot", clip.duration, tracks);
}

const KLIPP = new Map<string, THREE.AnimationClip>();

export function tryggKlipp(clip: THREE.AnimationClip) {
  const finns = KLIPP.get(clip.uuid);
  if (finns) return finns;
  const ny = utanRot(clip);
  KLIPP.set(clip.uuid, ny);
  return ny;
}

/** R9K: byt färg på material med de namnen. Materialet klonas först så att originalet (delat via useGLTF) är orört. */
export function fargaOm(rot: THREE.Object3D, farger: Record<string, string>) {
  rot.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const byt = (m: THREE.Material) => {
      const f = farger[m.name];
      if (!f || !("color" in m)) return m;
      const k = m.clone() as THREE.MeshStandardMaterial;
      k.color.set(f);
      return k;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(byt) : byt(mesh.material);
  });
}

/** S1: mjukrunda klonen (kubdjur får puff) och lägg Slime-glöd på varje standardmaterial. */
export function slimePaKlon(klon: THREE.Object3D, modellSokvag: string) {
  const arKubDjur = /animal-|blocky/i.test(modellSokvag);
  mjukrundaScen(klon, arKubDjur);
  klon.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const lista = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of lista) {
      if ((m as THREE.MeshStandardMaterial).isMeshStandardMaterial) appliceraSlimeGlod(m as THREE.MeshStandardMaterial);
    }
  });
}

export function metallNoll(rot: THREE.Object3D) {
  rot.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const lista = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of lista) {
      const std = m as THREE.MeshStandardMaterial;
      if (std && "metalness" in std) {
        std.metalness = 0;
        std.roughness = Math.max(std.roughness ?? 1, 0.75);
      }
    }
  });
}

/** Animerade modeller (skinnade nät) har en omslutande sfär för vilopositionen; utan det här kan de klippas bort mitt i en rörelse. */
export function ingenKulling(rot: THREE.Object3D) {
  rot.traverse((o) => {
    const sm = o as THREE.SkinnedMesh;
    if (!sm.isSkinnedMesh) return;
    o.frustumCulled = false;
    // B6.1: ett skinnat nät räknar sin träffsfär EN gång, vid första strålen. Kommer den medan djuret poppar fram
    // (t.ex. ett djur som hämtas ut ur stallet på en plats) blir sfären 0 och djuret går aldrig mer att trycka på.
    // Räkna om sfären vid varje stråle; strålar skjuts bara vid pekarhändelser och näten är små.
    sm.raycast = (stral, traffar) => {
      sm.computeBoundingSphere();
      THREE.SkinnedMesh.prototype.raycast.call(sm, stral, traffar);
    };
  });
}

export function fastAnkare(rot: THREE.Object3D, spec: Sparad) {
  faestTillbehor(rot, spec.kropp, spec.tillbehor, "modell");
  monteraLargoDel(rot, spec, rot.userData.ankare);
}

