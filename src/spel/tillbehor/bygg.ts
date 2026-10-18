import * as THREE from "three";
import { tillbehorDelar, tillbehorFarg, type TillbehorRad } from "./data.ts";

const TOON = (() => {
  const data = new Uint8Array([72, 158, 255]);
  const t = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.colorSpace = THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
})();

const KONTUR = new THREE.MeshBasicMaterial({ color: "#3B2F2F", side: THREE.BackSide });

/** Platt trapets. Origon är nacken, tyget hänger ned och bakåt (−z). */
function mantelGeo() {
  const top = 0.46;
  const bot = 0.86;
  const drop = 1.15;
  const back = -0.5;
  const A = [-top, 0, 0];
  const B = [top, 0, 0];
  const C = [bot, -drop, back];
  const D = [-bot, -drop, back];
  const pos = new Float32Array([
    ...A, ...B, ...C,
    ...A, ...C, ...D,
    ...A, ...C, ...B,
    ...A, ...D, ...C,
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return geo;
}

const GEO: Record<string, THREE.BufferGeometry> = {
  cyl: new THREE.CylinderGeometry(0.5, 0.55, 0.28, 7),
  kon: new THREE.ConeGeometry(0.16, 0.46, 5),
  ring: new THREE.TorusGeometry(0.22, 0.07, 6, 14),
  kub: new THREE.BoxGeometry(1, 1, 1),
  /** Rundad säck. Radie 0,5 så skalan är hela storleken. */
  sfar: new THREE.SphereGeometry(0.5, 8, 6),
  mantel: mantelGeo(),
};

const toonCache = new Map<string, THREE.MeshToonMaterial>();

function toonMat(color: string) {
  const key = color.toLowerCase();
  let m = toonCache.get(key);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: TOON });
    toonCache.set(key, m);
  }
  return m;
}

/** Bygger tillbehöret ur dess datarad. Origo = fästpunkten, +z framåt. */
export function byggTillbehor(id: string, rad: TillbehorRad, farg: string | null): THREE.Group {
  const mat = toonMat(tillbehorFarg(rad, farg));
  const g = new THREE.Group();
  g.name = `tillbehor-${id}`;
  for (const d of tillbehorDelar(rad, farg)) {
    const geo = GEO[d.form] ?? GEO["kub"]!;
    const del = new THREE.Group();
    const kant = new THREE.Mesh(geo, KONTUR);
    kant.scale.setScalar(d.kant);
    del.add(new THREE.Mesh(geo, mat), kant);
    del.position.set(...d.pos);
    del.scale.set(...d.skala);
    if (d.rot) del.rotation.set(...d.rot);
    g.add(del);
  }
  return g;
}
