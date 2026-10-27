// B6.1: GLB med KHR_materials_unlit (t.ex. Kenney Blocky Characters) blir MeshBasicMaterial i GLTFLoader. Spelet behandlar
// alla modeller som upplysta (glans = emissive, metalness/roughness, ljuset i scenen), och three.js kraschar när ett
// MeshBasicMaterial får `emissive` ("Cannot read properties of undefined (reading 'value')" i refreshMaterialUniforms).
// Därför byts sådana material mot ett upplyst MeshStandardMaterial med samma textur och färg när modellen läses in,
// samma sak som de härledda "-belyst.glb" i M12 gjorde i filen. Originalfilerna kan då användas direkt.
// W1: Half-Lambert (dotNL * 0.52 + 0.48), varma skuggtoner och gyllene Fresnel. Ett delat shaderprogram.
import * as THREE from "three";
import { mjukrundaScen } from "./mjukGeometri.ts";

const BYTT = new WeakMap<THREE.Material, THREE.Material>();
const SLIME_KEY = "trollpennan-slime-rim-v1";

function klammaSaga(std: THREE.MeshStandardMaterial) {
  std.roughness = Math.min(0.95, Math.max(0.45, std.roughness ?? 0.72));
  std.metalness = Math.min(0.28, Math.max(0, std.metalness ?? 0.04));
  std.envMapIntensity = 0.65;
}

/** Varm Half-Lambert, gyllene Fresnel-kantljus och solvarm skuggton. Ett delat shaderprogram. */
export function appliceraSlimeGlod(m: THREE.MeshStandardMaterial) {
  klammaSaga(m);
  if (m.userData.slimeGlod === true && m.customProgramCacheKey() === SLIME_KEY) return;
  m.customProgramCacheKey = () => SLIME_KEY;
  m.onBeforeCompile = (shader) => {
    const ljus = THREE.ShaderChunk.lights_physical_pars_fragment
      .replace(
        "float dotNL = saturate( dot( geometryNormal, directLight.direction ) );",
        "float dotNL = saturate( dot( geometryNormal, directLight.direction ) );\n\tdotNL = dotNL * 0.52 + 0.48;",
      )
      .replace(
        "vec3 irradiance = dotNL * directLight.color;",
        "vec3 irradiance = dotNL * directLight.color + (vec3(0.145, 0.427, 0.231) + vec3(0.306, 0.212, 0.161)) * (1.0 - dotNL) * 0.34;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <lights_physical_pars_fragment>", ljus)
      .replace(
        "#include <opaque_fragment>",
        "#include <opaque_fragment>\n\t#ifndef FLAT_SHADED\n\tfloat sagaFresnel = smoothstep(0.52, 0.94, 1.0 - max(dot(normalize(vNormal), normalize(vViewPosition)), 0.0));\n\tgl_FragColor.rgb += vec3(1.0, 0.92, 0.72) * sagaFresnel * 0.28;\n\t#endif",
      );
  };
  m.userData.slimeGlod = true;
  m.needsUpdate = true;
}

function glodOm(material: THREE.Material | THREE.Material[]) {
  const lista = Array.isArray(material) ? material : [material];
  for (const m of lista) {
    const std = m as THREE.MeshStandardMaterial;
    if (std.isMeshStandardMaterial) appliceraSlimeGlod(std);
  }
}

/** Upplyst motsvarighet till ett obelyst material (samma objekt tillbaka om det redan är upplyst). Delas per källmaterial. */
export function belysMaterial(m: THREE.Material): THREE.Material {
  const somStd = m as THREE.MeshStandardMaterial;
  if (somStd.isMeshStandardMaterial) {
    klammaSaga(somStd);
    return m;
  }
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
  klammaSaga(ny);
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
    glodOm(mesh.material);
  });
  mjukrundaScen(rot);
  return n;
}
