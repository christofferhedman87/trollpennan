import * as THREE from "three";
/** Osynliga ansikts-/rörelsedelar påverkar varken utsnitt eller geometriprovet. */
export function synligModellRuta(rot: THREE.Object3D, box = new THREE.Box3()): THREE.Box3 {
  rot.updateWorldMatrix(true, true); box.makeEmpty();
  rot.traverseVisible((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const material = Array.isArray(o.material) ? o.material : [o.material];
    if (!material.some((m) => m.visible && m.opacity > 0)) return;
    if (o instanceof THREE.SkinnedMesh) { o.computeBoundingBox(); if (o.boundingBox) box.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld)); }
    else { o.geometry.computeBoundingBox(); if (o.geometry.boundingBox) box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); }
  });
  return box;
}
