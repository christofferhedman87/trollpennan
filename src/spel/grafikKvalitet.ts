// W1: procedur-PMREM (dag/natt), materialklämning och delad varm kontaktskugga. Ingen EffectComposer.
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { appliceraSlimeGlod } from "./belys.ts";

type Sagomal = { dag?: THREE.WebGLRenderTarget; natt?: THREE.WebGLRenderTarget };

const SAGO_CACHE = new WeakMap<THREE.WebGLRenderer, Sagomal>();

/** Bakar en PMREM-himmel en gång per renderer och läge (dag/natt). */
export function skapaSagomiljoTextur(gl: THREE.WebGLRenderer, natt = false): THREE.Texture {
  let post = SAGO_CACHE.get(gl);
  if (!post) {
    post = {};
    SAGO_CACHE.set(gl, post);
  }
  const nyckel = natt ? "natt" : "dag";
  const finns = post[nyckel];
  if (finns) return finns.texture;

  const pmrem = new THREE.PMREMGenerator(gl);
  pmrem.compileEquirectangularShader();
  const envScen = new THREE.Scene();
  envScen.background = new THREE.Color(natt ? "#263858" : "#e8bb81");
  const kupolGeo = new THREE.SphereGeometry(18, 16, 12);
  const markGeo = new THREE.SphereGeometry(17.5, 16, 8, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5);
  const solGeo = new THREE.SphereGeometry(2.8, 12, 12);
  const kupolMat = new THREE.MeshBasicMaterial({ color: natt ? "#52729a" : "#ffdfa8", side: THREE.BackSide });
  const markMat = new THREE.MeshBasicMaterial({ color: natt ? "#234b45" : "#63965a", side: THREE.BackSide });
  const solMat = new THREE.MeshBasicMaterial({ color: natt ? "#a8c6f2" : "#fff0b5" });
  const sol = new THREE.Mesh(solGeo, solMat);
  sol.position.set(-3, 6, -5);
  envScen.add(new THREE.Mesh(kupolGeo, kupolMat), new THREE.Mesh(markGeo, markMat), sol);
  try {
    const mal = pmrem.fromScene(envScen, 0.04);
    post[nyckel] = mal;
    return mal.texture;
  } finally {
    pmrem.dispose();
    kupolGeo.dispose();
    markGeo.dispose();
    solGeo.dispose();
    kupolMat.dispose();
    markMat.dispose();
    solMat.dispose();
  }
}

export function frigoraSagomiljo(gl: THREE.WebGLRenderer): void {
  const post = SAGO_CACHE.get(gl);
  if (!post) return;
  post.dag?.dispose();
  post.natt?.dispose();
  SAGO_CACHE.delete(gl);
}

export function useSagomiljo(natt = false): void {
  const { gl, scene } = useThree();
  useEffect(() => {
    const tidigare = scene.environment;
    scene.environment = skapaSagomiljoTextur(gl, natt);
    return () => {
      scene.environment = tidigare;
    };
  }, [gl, scene, natt]);
}

/** Klämmer standardmaterial till sagoyta: mjuk roughness, låg metall, varm miljöreflex. */
export function forbattraModellMaterial(rot: THREE.Object3D): void {
  rot.traverse((o) => {
    const mesh = o as THREE.Mesh;
    // Hologram har en egen shader; sagoytan skulle ersätta den efter högst 40 bildrutor.
    if (!mesh.isMesh || !mesh.material || mesh.userData.holo) return;
    const lista = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const raw of lista) {
      const m = raw as THREE.MeshStandardMaterial;
      if (!m?.isMeshStandardMaterial) continue;
      m.roughness = Math.min(0.95, Math.max(0.45, m.roughness ?? 0.72));
      m.metalness = Math.min(0.28, Math.max(0, m.metalness ?? 0.04));
      m.envMapIntensity = 0.65;
      if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
      appliceraSlimeGlod(m);
    }
  });
}

let deladTex: THREE.DataTexture | null = null;
let deladMat: THREE.MeshBasicMaterial | null = null;

function kontaktTextur(): THREE.DataTexture {
  if (deladTex) return deladTex;
  const n = 64;
  const data = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const u = ((x + 0.5) / n) * 2 - 1;
      const v = ((y + 0.5) / n) * 2 - 1;
      const r2 = u * u + v * v;
      const a = r2 <= 1 ? Math.round(Math.exp(-r2 * 2.8) * 115) : 0;
      const i = (y * n + x) * 4;
      data[i] = 70;
      data[i + 1] = 51;
      data[i + 2] = 35;
      data[i + 3] = a;
    }
  }
  const tex = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  deladTex = tex;
  return tex;
}

function kontaktMaterial(): THREE.MeshBasicMaterial {
  if (deladMat) return deladMat;
  deladMat = new THREE.MeshBasicMaterial({
    map: kontaktTextur(),
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    toneMapped: false,
  });
  return deladMat;
}

export function skapaKontaktSkugga(radie = 0.65): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(radie * 2, radie * 2), kontaktMaterial());
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.012;
  mesh.renderOrder = -1;
  mesh.userData.kontaktSkugga = true;
  return mesh;
}

export function frigoraKontaktSkugga(skugga: THREE.Mesh): void {
  skugga.geometry.dispose();
}
