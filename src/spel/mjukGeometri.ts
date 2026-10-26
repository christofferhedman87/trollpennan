// S1: mjukrunda GLB-nät. toCreasedNormals slätar fasetter. Kubdjur får ett Midpoint-steg och en Spherify-puff.
import * as THREE from "three";
import { mergeVertices, toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const PUFF = 0.28;
const ATTR = ["position", "normal", "uv", "color"] as const;

function svets(g: THREE.BufferGeometry): THREE.BufferGeometry {
  g.deleteAttribute("tangent");
  if (!g.getAttribute("position")) return g;
  const m = mergeVertices(g);
  m.userData = { ...g.userData };
  m.deleteAttribute("tangent");
  return m;
}

/** Ett Midpoint-steg: varje triangel blir fyra, med delade kantmittpunkter. */
function midpoint(src: THREE.BufferGeometry): THREE.BufferGeometry {
  let g = src;
  if (!g.getIndex()) {
    const pos0 = g.getAttribute("position");
    if (!pos0) return src;
    const ix = new Uint32Array(pos0.count);
    for (let i = 0; i < pos0.count; i++) ix[i] = i;
    g = g.clone();
    g.setIndex(new THREE.BufferAttribute(ix, 1));
  }
  const idx = g.getIndex();
  const pos = g.getAttribute("position");
  if (!idx || !pos) return src;
  const namn = ATTR.filter((n) => g.getAttribute(n));
  const data = new Map<string, number[]>();
  for (const n of namn) {
    const a = g.getAttribute(n);
    const rad: number[] = [];
    for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) rad.push(a.getComponent(i, k));
    data.set(n, rad);
  }
  const kant = new Map<string, number>();
  const mid = (i: number, j: number) => {
    const lo = i < j ? i : j;
    const hi = i < j ? j : i;
    const key = `${lo}:${hi}`;
    const finns = kant.get(key);
    if (finns != null) return finns;
    const id = (data.get("position")?.length ?? 0) / 3;
    for (const n of namn) {
      const a = g.getAttribute(n);
      const rad = data.get(n)!;
      for (let k = 0; k < a.itemSize; k++) rad.push((a.getComponent(i, k) + a.getComponent(j, k)) * 0.5);
    }
    kant.set(key, id);
    return id;
  };
  const utI: number[] = [];
  for (let t = 0; t < idx.count; t += 3) {
    const a = idx.getX(t);
    const b = idx.getX(t + 1);
    const c = idx.getX(t + 2);
    const ab = mid(a, b);
    const bc = mid(b, c);
    const ca = mid(c, a);
    utI.push(a, ab, ca, b, bc, ab, c, ca, bc, ab, bc, ca);
  }
  const ut = new THREE.BufferGeometry();
  for (const n of namn) {
    const a = g.getAttribute(n);
    const rad = data.get(n)!;
    const Arr = a.array.constructor as Float32ArrayConstructor;
    ut.setAttribute(n, new THREE.BufferAttribute(new Arr(rad), a.itemSize, a.normalized));
  }
  ut.setIndex(utI);
  ut.userData = { ...g.userData };
  return ut;
}

/** Drar hörn ovanför fotsulan mot del-meshen sfär. Fötterna (y <= minY + 0.08 * h) står kvar. */
function spherify(g: THREE.BufferGeometry, puffStyrka: number) {
  const pos = g.getAttribute("position");
  if (!pos) return;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const golv = minY + 0.08 * Math.max(1e-4, maxY - minY);
  let cx = 0;
  let cy = 0;
  let cz = 0;
  let n = 0;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) <= golv) continue;
    cx += pos.getX(i);
    cy += pos.getY(i);
    cz += pos.getZ(i);
    n++;
  }
  if (!n) return;
  cx /= n;
  cy /= n;
  cz /= n;
  let rad = 0;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) <= golv) continue;
    rad += Math.hypot(pos.getX(i) - cx, pos.getY(i) - cy, pos.getZ(i) - cz);
  }
  rad /= n;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y <= golv) continue;
    const dx = pos.getX(i) - cx;
    const dy = y - cy;
    const dz = pos.getZ(i) - cz;
    const len = Math.hypot(dx, dy, dz) || 1;
    pos.setXYZ(
      i,
      pos.getX(i) + (cx + (dx / len) * rad - pos.getX(i)) * puffStyrka,
      y + (cy + (dy / len) * rad - y) * puffStyrka,
      pos.getZ(i) + (cz + (dz / len) * rad - pos.getZ(i)) * puffStyrka,
    );
  }
  pos.needsUpdate = true;
}

function markera(g: THREE.BufferGeometry, kub: boolean) {
  g.userData.mjukrundad = true;
  if (kub) g.userData.kubPuff = true;
  return g;
}

/** Slätar hårda fasetter. `arKubDjur` rundar icke-skinnade låddjur med puff före crease. */
export function mjukrundaScen(rot: THREE.Object3D, arKubDjur = false) {
  rot.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry?.getAttribute("position")) return;
    const skinned = (mesh as THREE.SkinnedMesh).isSkinnedMesh === true;
    const kub = arKubDjur && !skinned;
    const start = mesh.geometry;
    if (start.userData.mjukrundad && (!kub || start.userData.kubPuff)) return;
    try {
      let g = start;
      const fler = () => g.groups.length > 1;
      if (kub && !g.userData.kubPuff && !fler()) {
        g = svets(g);
        g = midpoint(g);
        spherify(g, PUFF);
        g.userData.kubPuff = true;
      }
      g.deleteAttribute("tangent");
      if (fler()) {
        mesh.geometry = markera(g, false);
        return;
      }
      g = svets(g);
      if (g.groups.length > 1) {
        mesh.geometry = markera(g, !!g.userData.kubPuff);
        return;
      }
      const vinkel = g.userData.kubPuff ? Math.PI * 0.44 : Math.PI * 0.42;
      const creased = toCreasedNormals(g, vinkel);
      creased.userData = { ...g.userData };
      mesh.geometry = markera(creased, !!g.userData.kubPuff);
    } catch {
      start.userData.mjukrundad = true;
    }
  });
}
