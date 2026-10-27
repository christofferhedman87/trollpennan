import { useGLTF } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { belysScen } from "./belys.ts";
import { DAMM } from "./ang/damm.ts";
import { forladdaNarLedig, forladdningsStatus, onBakgrundsForladdningKlar } from "./modeller/forladda.ts";

const FARG: Record<string, string> = {
  grass: "#63c34a",
  leafsGreen: "#4fae3e",
  leafsDark: "#2f8a46",
  woodBark: "#8b5a3c",
  woodBarkDark: "#6e4630",
  wood: "#b07a4c",
  woodDark: "#8a5a36",
  woodInner: "#e8c99a",
  stone: "#c9ccd0",
  stoneDark: "#9aa0a6",
  dirt: "#a89f96",
  colorRed: "#e8463c",
  colorYellow: "#ffd23f",
  colorPurple: "#a67cff",
  colorTan: "#e9c79a",
  _defaultMat: "#fff6ea",
};

type Del = { geo: THREE.BufferGeometry; mat: THREE.MeshStandardMaterial };

function geoGrupp(geo: THREE.BufferGeometry, start: number, count: number) {
  const g = new THREE.BufferGeometry();
  const g0 = geo;
  const kalla = g0.getAttribute("position");
  let pos = kalla ? kalla.clone() : null;
  if (pos && !(pos.array instanceof Float32Array)) {
    const f32 = new Float32Array(pos.count * pos.itemSize);
    for (let i = 0; i < pos.count; i++) {
      f32[i * 3] = pos.getX(i);
      f32[i * 3 + 1] = pos.getY(i);
      f32[i * 3 + 2] = pos.getZ(i);
    }
    pos = new THREE.BufferAttribute(f32, 3);
  }
  if (pos) g.setAttribute("position", pos);
  const nor = g0.getAttribute("normal");
  const uv = g0.getAttribute("uv");
  if (nor) g.setAttribute("normal", nor.clone());
  if (uv) g.setAttribute("uv", uv.clone());
  const index = g0.getIndex();
  if (index) g.setIndex(Array.from(index.array.slice(start, start + count)));
  return g;
}

function slåIhopOfargade(delar: Del[]): Del[] {
  if (!(delar.length > 1 && delar.every((d) => !d.mat.map))) return delar;
  const bitar = delar.map((d) => {
    const ug = d.geo.index ? d.geo.toNonIndexed() : d.geo;
    return { pos: ug.getAttribute("position"), nor: ug.getAttribute("normal"), f: d.mat.color };
  });
  const n = bitar.reduce((s, b) => s + (b.pos?.count ?? 0), 0);
  const pA = new Float32Array(n * 3), nA = new Float32Array(n * 3), cA = new Float32Array(n * 3);
  let o = 0;
  for (const b of bitar) {
    if (!b.pos) continue;
    for (let i = 0; i < b.pos.count; i++, o++) {
      const j = o * 3;
      pA[j] = b.pos.getX(i); pA[j + 1] = b.pos.getY(i); pA[j + 2] = b.pos.getZ(i);
      if (b.nor) { nA[j] = b.nor.getX(i); nA[j + 1] = b.nor.getY(i); nA[j + 2] = b.nor.getZ(i); }
      cA[j] = b.f.r; cA[j + 1] = b.f.g; cA[j + 2] = b.f.b;
    }
  }
  const mergedGeo = new THREE.BufferGeometry();
  mergedGeo.setAttribute("position", new THREE.BufferAttribute(pA, 3));
  mergedGeo.setAttribute("normal", new THREE.BufferAttribute(nA, 3));
  mergedGeo.setAttribute("color", new THREE.BufferAttribute(cA, 3));
  const mergedMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0 });
  belysScen(new THREE.Mesh(mergedGeo, mergedMat));
  return [{ geo: mergedGeo, mat: mergedMat }];
}

function baka(scene: THREE.Object3D, farger?: Record<string, string>): Del[] {
  belysScen(scene); // B6.1: KHR_materials_unlit → upplyst material, som alla andra modeller
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxD = Math.max(size.x, size.y, size.z, 0.001);
  const s = 1 / maxD;
  const cx = (box.min.x + box.max.x) / 2;
  const cz = (box.min.z + box.max.z) / 2;
  const delar: Del[] = [];
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.MeshStandardMaterial[];
    const groups = mesh.geometry.groups.length ? mesh.geometry.groups : [{ start: 0, count: mesh.geometry.getIndex()?.count ?? mesh.geometry.getAttribute("position").count, materialIndex: 0 }];
    for (const gr of groups) {
      const src = mats[gr.materialIndex ?? 0] ?? mats[0];
      if (!src) continue;
      const geo = geoGrupp(mesh.geometry, gr.start, gr.count);
      geo.applyMatrix4(mesh.matrixWorld);
      geo.translate(-cx, -box.min.y, -cz);
      geo.scale(s, s, s);
      const mat = src.clone();
      mat.metalness = 0;
      mat.roughness = Math.max(mat.roughness ?? 1, 0.75);
      const ny = farger?.[mat.name] ?? FARG[mat.name];
      if (ny) mat.color.set(ny);
      delar.push({ geo, mat });
    }
  });
  return slåIhopOfargade(delar);
}

/** x, z, höjd, rotation, y-sänkning (andel av höjden som grävs ner) */
type Plats = readonly [number, number, number, number, number];

/** `vand` (R8-2b): varje instans vänds upp och ner med botten kvar på marken. */
/** R9K: `farger` (materialnamn → färg, ur data/platser.json) går före standardfärgerna i FARG. */
export function InstansModell({ url, platser, vand = false, farger, cull = false }: { url: string; platser: readonly Plats[]; vand?: boolean; farger?: Record<string, string>; cull?: boolean }) {
  const gltf = useGLTF(url);
  const fargNyckel = farger ? JSON.stringify(farger) : "";
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fargNyckel bär innehållet i farger
  const delar = useMemo(() => baka(gltf.scene, farger), [gltf.scene, fargNyckel]);
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const sv = new THREE.Vector3();
    const e = new THREE.Euler();
    for (let di = 0; di < delar.length; di++) {
      const mesh = refs.current[di];
      if (!mesh) continue;
      platser.forEach(([x, z, hojd, ry, ner], i) => {
        p.set(x, -ner * hojd + (vand ? hojd : 0), z);
        e.set(vand ? Math.PI : 0, ry, 0);
        q.setFromEuler(e);
        sv.set(hojd, hojd, hojd);
        m.compose(p, q, sv);
        mesh.setMatrixAt(i, m);
      });
      mesh.count = platser.length;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.frustumCulled = cull;
      if (cull) mesh.boundingSphere = null;
    }
  }, [delar, platser, vand, cull]);
  return (
    <>
      {delar.map((d, i) => (
        <instancedMesh
          key={`${url}-${i}`}
          ref={(n) => {
            refs.current[i] = n;
          }}
          args={[d.geo, d.mat, platser.length]}
          frustumCulled={cull}
        />
      ))}
    </>
  );
}

/** Samma instansiering som ängens dekor. */
export const Stall = InstansModell;

const TRAD: Plats[] = [
  [-3.4, -1.6, 2.4, 0.4, 0],
  [-4.1, -3.2, 2.8, 1.2, 0],
  [3.5, -1.4, 2.5, 0.8, 0],
  [4.2, -3.4, 3.0, 2.1, 0],
  [-2.6, -4.4, 2.2, 0.2, 0],
  [2.4, -4.6, 2.6, 1.7, 0],
];
const TJOCK: Plats[] = [
  [-3.8, -2.4, 2.3, 0.6, 0],
  [3.2, -2.6, 2.4, 2.4, 0],
];
const VANLIG: Plats[] = [
  [-4.6, -4.8, 2.1, 0.3, 0],
  [4.6, -4.6, 2.0, 1.1, 0],
];
const GRAN: Plats[] = [
  [-5.2, -5.4, 2.6, 0.2, 0],
  [5.0, -5.6, 2.8, 1.4, 0],
];
const BUSKE: Plats[] = [
  [-2.3, -0.4, 1.5, 0.5, 0.45],
  [2.4, -0.2, 1.4, 1.2, 0.45],
  [-1.7, 2.35, 0.85, 0.4, 0.15],
  [1.55, 2.55, 0.75, 1.1, 0.15],
  [-0.35, 2.9, 0.6, 0.8, 0.1],
];
const EKAR: Plats[] = [...TRAD, ...BUSKE];
const BLOM_R: Plats[] = [
  [-1.35, 1.55, 0.38, 0.2, 0],
  [-1.05, 1.75, 0.34, 1.1, 0],
  [-1.55, 1.8, 0.36, 2.2, 0],
  [-1.2, 1.95, 0.32, 0.7, 0],
  [-0.85, 1.6, 0.3, 1.6, 0],
  [-0.7, 2.45, 0.34, 0.4, 0],
  [-0.95, 2.65, 0.3, 1.3, 0],
  [-1.7, 3.7, 0.28, 0.4, 0],
  [-1.35, 4.15, 0.24, 1.2, 0],
  [-1.9, 4.55, 0.22, 0.8, 0],
];
const BLOM_G: Plats[] = [
  [1.15, 1.45, 0.36, 0.5, 0],
  [1.4, 1.7, 0.32, 1.4, 0],
  [0.95, 1.65, 0.34, 2.0, 0],
  [1.25, 1.9, 0.3, 0.9, 0],
  [-0.45, 2.5, 0.32, 0.3, 0],
  [0.15, 2.7, 0.28, 1.2, 0],
  [1.55, 3.85, 0.26, 0.6, 0],
  [1.15, 4.35, 0.22, 1.5, 0],
  [0.35, 4.7, 0.2, 0.3, 0],
];
const BLOM_L: Plats[] = [
  [-1.55, 1.45, 0.34, 0.8, 0],
  [1.0, 1.95, 0.32, 1.7, 0],
  [-1.15, 2.35, 0.3, 0.2, 0],
  [1.45, 2.4, 0.28, 2.2, 0],
  [0.55, 2.85, 0.26, 0.6, 0],
  [-0.55, 3.95, 0.24, 1.1, 0],
  [0.85, 4.45, 0.2, 0.4, 0],
  [-2.15, 4.9, 0.22, 1.8, 0],
];
const SVAMP_R: Plats[] = [
  [0.85, 2.45, 0.32, 0.4, 0],
  [-1.85, 2.15, 0.28, 1.2, 0],
];
const SVAMP_T: Plats[] = [
  [1.15, 2.7, 0.26, 0.7, 0],
  [-0.2, 2.55, 0.22, 1.5, 0],
];
const STEN_S: Plats[] = [
  [1.7, -0.15, 0.28, 0.3, 0],
  [0.55, -0.7, 0.22, 1.1, 0],
  [1.55, 2.15, 0.18, 0.6, 0],
];
const STEN_L: Plats[] = [[1.85, -0.85, 0.45, 0.8, 0]];
const GRAS: Plats[] = [
  [-0.4, 1.15, 0.35, 0.2, 0],
  [0.55, 1.25, 0.32, 1.3, 0],
  [-1.7, 0.9, 0.4, 0.5, 0],
  [1.8, 0.7, 0.38, 2.0, 0],
  [-2.2, 1.7, 0.36, 0.9, 0],
  [0.1, 2.15, 0.3, 1.6, 0],
  [-0.9, 3.55, 0.28, 0.4, 0],
  [1.7, 3.65, 0.26, 1.2, 0],
  [0.2, 4.35, 0.22, 0.7, 0],
  [-1.55, 4.85, 0.24, 1.6, 0],
  [2.05, 4.95, 0.2, 0.2, 0],
];
const LILJA: Plats[] = [
  [1.05, -0.28, 0.42, 0.4, 0],
  [1.35, -0.5, 0.36, 1.5, 0],
];
const LILJA_S: Plats[] = [[0.85, -0.48, 0.28, 0.9, 0]];
const STIG: Plats[] = [
  [0.15, 2.7, 0.55, 0.15, 0],
  [0.35, 2.15, 0.5, 0.35, 0],
  [0.55, 1.6, 0.48, 0.2, 0],
  [0.75, 1.05, 0.46, 0.5, 0],
  [0.9, 0.5, 0.44, 0.1, 0],
  [1.05, 3.35, 0.4, 0.25, 0],
  [1.15, 4.05, 0.34, 0.45, 0],
];
const STAKET: Plats[] = [
  [-1.55, -2.15, 0.7, 0.15, 0],
  [-0.15, -2.15, 0.7, 0.05, 0],
];
const GRIND: Plats[] = [[-0.7, -2.15, 0.85, 0.1, 0]];
const STUBBE: Plats[] = [[-1.9, 1.15, 0.32, 0.4, 0]];
const ORM: Plats[] = [
  [2.1, 1.4, 0.4, 0.6, 0],
  [-2.15, -1.1, 0.35, 1.4, 0],
];

const URL = {
  ek: "/models/natur/tree_oak.glb",
  tjock: "/models/natur/tree_fat.glb",
  van: "/models/natur/tree_default.glb",
  gran: "/models/natur/tree_pineRoundA.glb",
  rod: "/models/natur/flower_redA.glb",
  gul: "/models/natur/flower_yellowA.glb",
  lila: "/models/natur/flower_purpleA.glb",
  svampr: "/models/natur/mushroom_redGroup.glb",
  svampt: "/models/natur/mushroom_tanGroup.glb",
  sten: "/models/natur/rock_smallA.glb",
  stenl: "/models/natur/rock_largeA.glb",
  gras: "/models/natur/grass_large.glb",
  lilja: "/models/natur/lily_large.glb",
  liljas: "/models/natur/lily_small.glb",
  stig: "/models/natur/path_stone.glb",
  staket: "/models/natur/fence_simple.glb",
  grind: "/models/natur/fence_gate.glb",
  stubbe: "/models/natur/stump_round.glb",
  orm: "/models/natur/plant_bush.glb",
};

forladdaNarLedig(Object.values(URL));

export function KenneyNatur() {
  const [allaDetaljer, setAllaDetaljer] = useState(() => forladdningsStatus().forstaBildrutaKlar);
  useEffect(() => onBakgrundsForladdningKlar(() => setAllaDetaljer(true)), []);
  return (
    <group>
      <Stall url={URL.ek} platser={EKAR} />
      <Stall url={URL.van} platser={VANLIG} />
      <Stall url={URL.gran} platser={GRAN} />
      <Stall url={URL.rod} platser={BLOM_R} />
      <Stall url={URL.gul} platser={BLOM_G} />
      <Stall url={URL.sten} platser={STEN_S} />
      <group position={[0, DAMM.y, 0]}>
        {/* B6.3 (G): näckrosorna ligger på vattnet, som nu ligger över markens svaj */}
        <Stall url={URL.lilja} platser={LILJA} />
        {allaDetaljer ? <Stall url={URL.liljas} platser={LILJA_S} /> : null}
      </group>
      {allaDetaljer ? (
        <>
          <Stall url={URL.tjock} platser={TJOCK} />
          <Stall url={URL.lila} platser={BLOM_L} />
          <Stall url={URL.svampr} platser={SVAMP_R} />
          <Stall url={URL.svampt} platser={SVAMP_T} />
          <Stall url={URL.stenl} platser={STEN_L} />
          <Stall url={URL.gras} platser={GRAS} />
          <Stall url={URL.stig} platser={STIG} />
          <Stall url={URL.staket} platser={STAKET} />
          <Stall url={URL.grind} platser={GRIND} />
          <Stall url={URL.stubbe} platser={STUBBE} />
          <Stall url={URL.orm} platser={ORM} />
        </>
      ) : null}
    </group>
  );
}
