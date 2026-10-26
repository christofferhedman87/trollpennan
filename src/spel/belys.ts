// B6.1: GLB med KHR_materials_unlit (t.ex. Kenney Blocky Characters) blir MeshBasicMaterial i GLTFLoader. Spelet behandlar
// alla modeller som upplysta (glans = emissive, metalness/roughness, ljuset i scenen), och three.js kraschar när ett
// MeshBasicMaterial får `emissive` ("Cannot read properties of undefined (reading 'value')" i refreshMaterialUniforms).
// Därför byts sådana material mot ett upplyst MeshStandardMaterial med samma textur och färg när modellen läses in,
// samma sak som de härledda "-belyst.glb" i M12 gjorde i filen. Originalfilerna kan då användas direkt.
// S1: upplysta standardmaterial får en delad Slime-glöd, och scenens nät mjukrundas en gång.
import * as THREE from "three";
import { mjukrundaScen } from "./mjukGeometri.ts";

const BYTT = new WeakMap<THREE.Material, THREE.Material>();
const SLIME_KEY = "trollpennan-slime-rim-v1";

/** Varm wrap-around half-Lambert, Fresnel-kantljus och solvarmt studsljus underifrån. Ett delat shaderprogram. */
export function appliceraSlimeGlod(m: THREE.MeshStandardMaterial) {
  if (m.userData.slimeGlod === true && m.customProgramCacheKey() === SLIME_KEY) return;
  m.roughness = Math.min(Math.max(m.roughness ?? 0.62, 0.55), 0.72);
  m.metalness = 0;
  m.customProgramCacheKey = () => "trollpennan-slime-rim-v1";
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "float dotNL = saturate( dot( geometryNormal, directLight.direction ) );",
        "float dotNL = saturate( dot( geometryNormal, directLight.direction ) * 0.5 + 0.5 );\n\tdotNL *= dotNL;",
      )
      .replace(
        "vec3 irradiance = dotNL * directLight.color;",
        "vec3 irradiance = dotNL * directLight.color + vec3(1.0, 0.74, 0.40) * pow(saturate(-geometryNormal.y), 1.35) * 0.22;",
      )
      .replace(
        "#include <opaque_fragment>",
        "#include <opaque_fragment>\n\tfloat slimeNdv = saturate(1.0 - dot(normalize(normal), normalize(vViewPosition)));\n\tgl_FragColor.rgb += vec3(1.0, 0.96, 0.82) * smoothstep(0.55, 0.95, slimeNdv) * 0.28;",
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
    glodOm(mesh.material);
  });
  mjukrundaScen(rot);
  return n;
}
