// Enbart passiv avläsning för dev/webdriver. Ändrar inga modeller eller speltillstånd.
import * as THREE from "three";
import { synligModellRuta } from "../modeller/synligRuta.ts";
import { materialAlpha } from "../modeller/materialAlpha.ts";
const PROV = import.meta.env.DEV || (typeof navigator !== "undefined" && navigator.webdriver);
const box = new THREE.Box3(), v = new THREE.Vector3(), inv = new THREE.Matrix4();
type Nod = { id: string; nod: THREE.Object3D | null };

export function matSkapelseProv(uid: string, rot: THREE.Object3D, kropp: THREE.Object3D, saker: Nod[], camera: THREE.Camera, duk: DOMRect, holo = false, formel = "", kroppId = "") {
  if (!PROV) return;
  rot.updateWorldMatrix(true, true);
  inv.copy(rot.matrixWorld).invert();
  const mat = (nod: THREE.Object3D) => {
    synligModellRuta(nod, box);
    const min = box.min.toArray(), max = box.max.toArray();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, mesh = 0;
    const farger = new Set<string>(), modeller = new Set<string>();
    nod.traverseVisible((o) => {
      if (typeof o.userData.gltfKropp === "string") modeller.add(o.userData.gltfKropp);
      if (!(o instanceof THREE.Mesh)) return;
      const material = Array.isArray(o.material) ? o.material : [o.material];
      if (material.some((m) => m.visible && materialAlpha(m) > 0)) mesh++;
      for (const m of material) if ("color" in m && m.color instanceof THREE.Color) farger.add(m.color.getHexString());
    });
    const lokal = new THREE.Box3();
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      v.set(x, y, z); lokal.expandByPoint(v.clone().applyMatrix4(inv)); v.project(camera);
      const sx = duk.left + (v.x + 1) * duk.width / 2, sy = duk.top + (1 - v.y) * duk.height / 2;
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    return { min, max, lokal: { min: lokal.min.toArray(), max: lokal.max.toArray() }, skarm: { x0, y0, x1, y1 }, mesh, farger: [...farger], modeller: [...modeller] };
  };
  const plagg: Nod[] = [];
  kropp.traverse((n) => { if (n.name.startsWith("tillbehor-")) plagg.push({ id: String(n.userData.plaggId ?? n.name.slice(10)), nod: n }); });
  const resultat = { uid, formel, kroppId, kropp: mat(kropp), saker: saker.filter((s) => s.nod).map((s) => ({ id: s.id, ...mat(s.nod!) })), plagg: plagg.map((s) => ({ id: s.id, ...mat(s.nod!) })) };
  const w = window as unknown as { __skapelseGeometri?: Record<string, unknown>; __holoGeometri?: unknown };
  if (holo) w.__holoGeometri = resultat;
  else (w.__skapelseGeometri ??= {})[uid] = resultat;
}
