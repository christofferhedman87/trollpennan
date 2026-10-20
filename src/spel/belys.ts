// B6.1: GLB med KHR_materials_unlit (t.ex. Kenney Blocky Characters) blir MeshBasicMaterial i GLTFLoader. Spelet behandlar
// alla modeller som upplysta (glans = emissive, metalness/roughness, ljuset i scenen), och three.js kraschar när ett
// MeshBasicMaterial får `emissive` ("Cannot read properties of undefined (reading 'value')" i refreshMaterialUniforms).
// Därför byts sådana material mot ett upplyst MeshStandardMaterial med samma textur och färg när modellen läses in,
// samma sak som de härledda "-belyst.glb" i M12 gjorde i filen. Originalfilerna kan då användas direkt.
import * as THREE from "three";

const BYTT = new WeakMap<THREE.Material, THREE.Material>();

/** Upplyst motsvarighet till ett obelyst material (samma objekt tillbaka om det redan är upplyst). Delas per källmaterial. */
export function belysMaterial(m: THREE.Material): THREE.Material {
  const b = m as THREE.MeshBasicMaterial;
  if (!b.isMeshBasicMaterial) return m;
  const finns = BYTT.get(m);
  if (finns) return finns;
  const ny = new THREE.MeshStandardMaterial({
    name: b.name,
    color: b.color.clone(),
    map: b.map,
    alphaMap: b.alphaMap,
    aoMap: b.aoMap,
    vertexColors: b.vertexColors,
    transparent: b.transparent,
    opacity: b.opacity,
    alphaTest: b.alphaTest,
    side: b.side,
    depthWrite: b.depthWrite,
    metalness: 0,
    roughness: 1,
  });
  ny.userData = { ...b.userData, belystFran: "KHR_materials_unlit" };
  BYTT.set(m, ny);
  return ny;
}

/** Byter obelysta material i en inläst scen på plats (idempotent; anropas före kloning). Ger antalet bytta nät. */
export function belysScen(rot: THREE.Object3D): number {
  let n = 0;
  rot.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    if (Array.isArray(mesh.material)) {
      const nya = mesh.material.map(belysMaterial);
      if (nya.some((x, i) => x !== (mesh.material as THREE.Material[])[i])) n++;
      mesh.material = nya;
    } else {
      const ny = belysMaterial(mesh.material);
      if (ny !== mesh.material) n++;
      mesh.material = ny;
    }
  });
  return n;
}
