// Nya Skapa 6.10: hologrammaterialet. Modellens egna material klonas (originalen delas via useGLTF och får inte
// röras), blir 80 % genomskinliga och får en ljusblå fresnelkant och svaga ljuslinjer som rör sig uppåt.
// Samma teknik som slime-glöden i belys.ts (onBeforeCompile), egen programnyckel.
import * as THREE from "three";

export const HOLO_TID = { value: 0 };
const NYCKEL = "trollpennan-holo-v1";
const KANT = new THREE.Color("#7CC8FF");

function holoAv(m: THREE.Material, solid: { value: number }): THREE.Material {
  const k = m.clone();
  k.transparent = true;
  k.depthWrite = true;
  const harNormal = !(k as THREE.MeshBasicMaterial).isMeshBasicMaterial;
  k.customProgramCacheKey = () => `${NYCKEL}-${harNormal ? 1 : 0}`;
  k.onBeforeCompile = (shader) => {
    shader.uniforms.holoTid = HOLO_TID;
    shader.uniforms.holoSolid = solid;
    shader.uniforms.holoKant = { value: KANT };
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", "uniform float holoTid;\nuniform float holoSolid;\nuniform vec3 holoKant;\nvoid main() {")
      .replace(
        "#include <opaque_fragment>",
        `#include <opaque_fragment>
        float holoLinje = step(0.62, fract(gl_FragCoord.y / 7.0 - holoTid * 2.2));
        ${harNormal ? "float holoF = smoothstep(0.35, 0.95, 1.0 - max(dot(normalize(vNormal), normalize(vViewPosition)), 0.0));" : "float holoF = 0.35;"}
        vec3 holoFarg = mix(gl_FragColor.rgb, holoKant, 0.25) + holoKant * holoF * 0.9 + vec3(0.18) * holoLinje;
        gl_FragColor.rgb = mix(holoFarg, gl_FragColor.rgb, holoSolid);
        gl_FragColor.a *= mix(0.8, 1.0, holoSolid);`,
      );
  };
  k.needsUpdate = true;
  return k;
}

/** Byt till hologrammaterial på alla nät under roten som inte redan har det. Anropas varje bildruta (billigt). */
export function gorHolo(rot: THREE.Object3D, solid: { value: number }): void {
  rot.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material || mesh.userData.holo) return;
    mesh.userData.holo = true;
    mesh.castShadow = false;
    mesh.raycast = () => undefined;
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map((m) => holoAv(m, solid)) : holoAv(mesh.material, solid);
  });
}
