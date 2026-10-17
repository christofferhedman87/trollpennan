import * as THREE from "three";

export type DjurBygg = {
  kropp: string;
  farg: string;
  krona: boolean;
  horn: boolean;
  monster: boolean;
  monsterFarg: string;
};

export type Pack = {
  geo: THREE.BufferGeometry;
  outline: THREE.BufferGeometry;
  ogon: THREE.BufferGeometry;
  base: Float32Array;
  obase: Float32Array;
  tag: Uint8Array;
  pivL: THREE.Vector3;
  pivR: THREE.Vector3;
  pivSvans: THREE.Vector3;
  pivHals: THREE.Vector3;
  pivTass: THREE.Vector3;
  rorlig: boolean;
};

const BOLL = new THREE.SphereGeometry(1, 8, 6);
const KON = new THREE.ConeGeometry(0.5, 1, 5);
const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
const GEO: Record<string, THREE.BufferGeometry> = { boll: BOLL, kon: KON, box: BOX, cyl: CYL };

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();

type Acc = { p: number[]; n: number[]; c: number[]; t: number[] };

function lagg(
  acc: Acc,
  nyckel: string,
  color: string,
  position: [number, number, number],
  scale: [number, number, number] = [1, 1, 1],
  rotation: [number, number, number] = [0, 0, 0],
  tag = 0,
) {
  const src = GEO[nyckel] ?? BOLL;
  const g = src.clone();
  _e.set(rotation[0], rotation[1], rotation[2]);
  _q.setFromEuler(_e);
  _p.set(position[0], position[1], position[2]);
  _s.set(scale[0], scale[1], scale[2]);
  _m.compose(_p, _q, _s);
  g.applyMatrix4(_m);
  const flat = g.index ? g.toNonIndexed() : g;
  if (!flat.getAttribute("normal")) flat.computeVertexNormals();
  const pos = flat.getAttribute("position");
  const nor = flat.getAttribute("normal");
  _c.set(color);
  for (let i = 0; i < pos.count; i++) {
    acc.p.push(pos.getX(i), pos.getY(i), pos.getZ(i));
    acc.n.push(nor.getX(i), nor.getY(i), nor.getZ(i));
    acc.c.push(_c.r, _c.g, _c.b);
    acc.t.push(tag);
  }
  if (flat !== g) flat.dispose();
  g.dispose();
}

function laggRaw(acc: Acc, pos: number[], color: string, tag: number) {
  _c.set(color);
  for (let i = 0; i < pos.length; i += 9) {
    const ax = pos[i] ?? 0;
    const ay = pos[i + 1] ?? 0;
    const az = pos[i + 2] ?? 0;
    const bx = pos[i + 3] ?? 0;
    const by = pos[i + 4] ?? 0;
    const bz = pos[i + 5] ?? 0;
    const cx = pos[i + 6] ?? 0;
    const cy = pos[i + 7] ?? 0;
    const cz = pos[i + 8] ?? 0;
    const ux = bx - ax;
    const uy = by - ay;
    const uz = bz - az;
    const vx = cx - ax;
    const vy = cy - ay;
    const vz = cz - az;
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;
    if (nz < 0) {
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }
    acc.p.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    acc.n.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    acc.c.push(_c.r, _c.g, _c.b, _c.r, _c.g, _c.b, _c.r, _c.g, _c.b);
    acc.t.push(tag, tag, tag);
  }
}

function vinge(side: 1 | -1): { hinna: number[]; ben: number[] } {
  const s = side;
  const root: [number, number, number] = [s * 0.34, 0.82, 0.06];
  const tips: [number, number, number][] = [
    [s * 0.48, 1.58, 0.04],
    [s * 1.02, 1.52, 0.0],
    [s * 1.38, 1.02, -0.02],
    [s * 1.22, 0.42, 0.0],
    [s * 0.7, 0.16, 0.04],
  ];
  const hinna: number[] = [];
  for (let i = 0; i < tips.length - 1; i++) {
    const a = tips[i];
    const b = tips[i + 1];
    if (!a || !b) continue;
    hinna.push(root[0], root[1], root[2], a[0], a[1], a[2], b[0], b[1], b[2]);
  }
  const ben: number[] = [];
  for (const tip of tips) {
    const dx = tip[0] - root[0];
    const dy = tip[1] - root[1];
    const len = Math.hypot(dx, dy) || 1;
    const px = (-dy / len) * 0.045;
    const py = (dx / len) * 0.045;
    ben.push(root[0] + px, root[1] + py, root[2] + 0.04, root[0] - px, root[1] - py, root[2] + 0.04, tip[0], tip[1], tip[2] + 0.03);
  }
  return { hinna, ben };
}

function geoAv(acc: Acc): { geo: THREE.BufferGeometry; tag: Uint8Array; base: Float32Array } {
  const geo = new THREE.BufferGeometry();
  const p = new Float32Array(acc.p);
  geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(acc.n), 3));
  geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(acc.c), 3));
  const tag = new Uint8Array(acc.t);
  return { geo, tag, base: p.slice() };
}

function skalUt(geo: THREE.BufferGeometry, mangd: number) {
  const p = geo.attributes.position;
  const n = geo.attributes.normal;
  if (!p || !n) return;
  for (let i = 0; i < p.count; i++) {
    p.setXYZ(i, p.getX(i) + n.getX(i) * mangd, p.getY(i) + n.getY(i) * mangd, p.getZ(i) + n.getZ(i) * mangd);
  }
  p.needsUpdate = true;
}

function ogon(
  par: [number, number, number, number][],
): THREE.BufferGeometry {
  const acc: Acc = { p: [], n: [], c: [], t: [] };
  for (const [x, y, z, r] of par) {
    lagg(acc, "boll", "#FFF8F2", [x, y, z], [r, r * 1.05, r * 0.72]);
    lagg(acc, "boll", "#241C18", [x, y - r * 0.06, z + r * 0.42], [r * 0.58, r * 0.62, r * 0.4]);
    lagg(acc, "boll", "#FFFFFF", [x + r * 0.22, y + r * 0.28, z + r * 0.62], [r * 0.22, r * 0.22, r * 0.16]);
  }
  return geoAv(acc).geo;
}

export function byggPack(b: DjurBygg): Pack {
  const acc: Acc = { p: [], n: [], c: [], t: [] };
  const f = b.farg;
  const mage = "#F6E7C8";
  const mork = "#C65A12";
  const guld = "#F2B632";
  const k = b.kropp;
  const pivL = new THREE.Vector3(-0.34, 0.82, 0.06);
  const pivR = new THREE.Vector3(0.34, 0.82, 0.06);
  const pivSvans = new THREE.Vector3(0, 0.48, -0.32);
  const pivHals = new THREE.Vector3(0, 0.42, 0.32);
  const pivTass = new THREE.Vector3(-0.16, 0.22, 0.22);

  if (k === "drake") {
    lagg(acc, "boll", f, [0, 0.5, 0], [0.48, 0.38, 0.72]);
    lagg(acc, "boll", mage, [0, 0.38, 0.16], [0.3, 0.16, 0.42]);
    lagg(acc, "box", "#E7C98A", [0, 0.34, 0.28], [0.22, 0.035, 0.06]);
    lagg(acc, "box", "#E7C98A", [0, 0.32, 0.12], [0.18, 0.03, 0.05]);
    lagg(acc, "boll", f, [0, 0.98, 0.52], [0.4, 0.36, 0.38]);
    lagg(acc, "boll", f, [0, 0.9, 0.82], [0.16, 0.13, 0.24]);
    lagg(acc, "boll", "#3B2F2F", [-0.05, 0.88, 1.02], [0.03, 0.025, 0.02]);
    lagg(acc, "boll", "#3B2F2F", [0.05, 0.88, 1.02], [0.03, 0.025, 0.02]);
    lagg(acc, "kon", guld, [-0.14, 1.28, 0.46], [0.07, 0.42, 0.07], [0.35, 0, 0.55]);
    lagg(acc, "kon", guld, [0.14, 1.28, 0.46], [0.07, 0.42, 0.07], [0.35, 0, -0.55]);
    lagg(acc, "kon", guld, [0, 0.86, 0.12], [0.06, 0.2, 0.06]);
    lagg(acc, "kon", guld, [0, 0.8, -0.12], [0.055, 0.18, 0.055]);
    lagg(acc, "kon", guld, [0, 0.72, -0.32], [0.05, 0.16, 0.05]);
    lagg(acc, "kon", guld, [0, 0.64, -0.5], [0.045, 0.14, 0.045]);
    lagg(acc, "boll", f, [0.05, 0.46, -0.62], [0.13, 0.12, 0.16], [0, 0, 0], 3);
    lagg(acc, "boll", f, [0.28, 0.5, -0.82], [0.11, 0.1, 0.14], [0, 0, 0], 3);
    lagg(acc, "boll", f, [0.52, 0.62, -0.9], [0.09, 0.08, 0.12], [0, 0, 0], 3);
    lagg(acc, "kon", f, [0.78, 0.78, -0.82], [0.22, 0.28, 0.08], [0.4, 0, -0.9], 3);
    lagg(acc, "boll", f, [-0.2, 0.16, 0.28], [0.09, 0.08, 0.1]);
    lagg(acc, "boll", f, [0.2, 0.16, 0.28], [0.09, 0.08, 0.1]);
    lagg(acc, "boll", f, [-0.22, 0.16, -0.22], [0.1, 0.08, 0.12]);
    lagg(acc, "boll", f, [0.22, 0.16, -0.22], [0.1, 0.08, 0.12]);
    const vL = vinge(-1);
    const vR = vinge(1);
    laggRaw(acc, vL.hinna, "#F08A2A", 1);
    laggRaw(acc, vL.ben, mork, 1);
    laggRaw(acc, vR.hinna, "#F08A2A", 2);
    laggRaw(acc, vR.ben, mork, 2);
    pivSvans.set(0.02, 0.46, -0.48);
  } else if (k === "groda") {
    lagg(acc, "boll", f, [0, 0.32, 0], [0.78, 0.32, 0.62]);
    lagg(acc, "boll", mage, [0, 0.28, 0.16], [0.46, 0.12, 0.28]);
    lagg(acc, "boll", f, [0, 0.48, 0.28], [0.46, 0.28, 0.36]);
    lagg(acc, "boll", "#C5E1A5", [0, 0.4, 0.42], [0.22, 0.12, 0.12], [0, 0, 0], 4);
    lagg(acc, "box", "#2E4A22", [0, 0.34, 0.5], [0.28, 0.03, 0.04]);
    lagg(acc, "boll", f, [-0.34, 0.12, 0.22], [0.12, 0.07, 0.14]);
    lagg(acc, "boll", f, [0.34, 0.12, 0.22], [0.12, 0.07, 0.14]);
    lagg(acc, "boll", f, [-0.28, 0.1, -0.22], [0.11, 0.07, 0.14]);
    lagg(acc, "boll", f, [0.28, 0.1, -0.22], [0.11, 0.07, 0.14]);
    pivHals.set(0, 0.4, 0.36);
  } else if (k === "katt") {
    lagg(acc, "boll", f, [0, 0.42, 0], [0.36, 0.3, 0.48]);
    lagg(acc, "boll", "#FFF8F4", [0, 0.36, 0.14], [0.2, 0.16, 0.16]);
    lagg(acc, "boll", f, [0, 0.86, 0.18], [0.36, 0.32, 0.32]);
    lagg(acc, "kon", f, [-0.14, 1.12, 0.16], [0.1, 0.26, 0.08]);
    lagg(acc, "kon", f, [0.14, 1.12, 0.16], [0.1, 0.26, 0.08]);
    lagg(acc, "boll", "#3B2F2F", [0, 0.8, 0.46], [0.045, 0.04, 0.04]);
    lagg(acc, "box", "#3B2F2F", [0.22, 0.78, 0.4], [0.22, 0.012, 0.012], [0, 0.3, 0.1]);
    lagg(acc, "box", "#3B2F2F", [0.22, 0.74, 0.4], [0.2, 0.012, 0.012], [0, 0.3, 0]);
    lagg(acc, "box", "#3B2F2F", [-0.22, 0.78, 0.4], [0.22, 0.012, 0.012], [0, -0.3, -0.1]);
    lagg(acc, "box", "#3B2F2F", [-0.22, 0.74, 0.4], [0.2, 0.012, 0.012], [0, -0.3, 0]);
    lagg(acc, "boll", f, [0.12, 0.55, -0.28], [0.08, 0.08, 0.1], [0, 0, 0], 3);
    lagg(acc, "boll", f, [0.22, 0.72, -0.22], [0.07, 0.07, 0.08], [0, 0, 0], 3);
    lagg(acc, "boll", f, [0.08, 0.86, -0.12], [0.06, 0.06, 0.07], [0, 0, 0], 3);
    lagg(acc, "boll", f, [-0.16, 0.16, 0.22], [0.07, 0.06, 0.09], [0, 0, 0], 5);
    lagg(acc, "boll", f, [0.16, 0.14, 0.22], [0.07, 0.06, 0.08]);
    lagg(acc, "boll", f, [-0.14, 0.12, -0.18], [0.06, 0.05, 0.08]);
    lagg(acc, "boll", f, [0.14, 0.12, -0.18], [0.06, 0.05, 0.08]);
    pivSvans.set(0.05, 0.48, -0.22);
    pivTass.set(-0.16, 0.28, 0.18);
  } else if (k === "hund") {
    lagg(acc, "boll", f, [0, 0.42, 0.05], [0.4, 0.32, 0.5]);
    lagg(acc, "boll", f, [0, 0.86, 0.28], [0.38, 0.34, 0.36]);
    lagg(acc, "boll", f, [0, 0.78, 0.55], [0.16, 0.13, 0.2]);
    lagg(acc, "boll", "#241C18", [0, 0.76, 0.72], [0.06, 0.05, 0.05]);
    lagg(acc, "boll", f, [-0.22, 0.78, 0.22], [0.08, 0.16, 0.05], [0.5, 0, 0.8]);
    lagg(acc, "boll", f, [0.22, 0.78, 0.22], [0.08, 0.16, 0.05], [0.5, 0, -0.8]);
    lagg(acc, "boll", f, [0, 0.48, -0.38], [0.08, 0.08, 0.14], [0.6, 0, 0], 3);
    lagg(acc, "boll", f, [-0.16, 0.12, 0.24], [0.08, 0.07, 0.1]);
    lagg(acc, "boll", f, [0.16, 0.12, 0.24], [0.08, 0.07, 0.1]);
    lagg(acc, "boll", f, [-0.16, 0.12, -0.16], [0.08, 0.07, 0.1]);
    lagg(acc, "boll", f, [0.16, 0.12, -0.16], [0.08, 0.07, 0.1]);
    pivSvans.set(0, 0.48, -0.28);
  } else if (k === "häst") {
    lagg(acc, "boll", f, [0, 0.55, 0], [0.36, 0.36, 0.7]);
    lagg(acc, "boll", f, [0, 0.95, 0.48], [0.22, 0.26, 0.28]);
    lagg(acc, "boll", f, [0, 0.88, 0.78], [0.12, 0.12, 0.28]);
    lagg(acc, "box", "#6D4C41", [0, 1.05, 0.28], [0.08, 0.28, 0.2], [0.7, 0, 0]);
    lagg(acc, "box", "#6D4C41", [0, 0.7, -0.62], [0.06, 0.32, 0.08], [0.8, 0, 0], 3);
    lagg(acc, "cyl", f, [-0.14, 0.28, 0.22], [0.07, 0.4, 0.07]);
    lagg(acc, "cyl", f, [0.14, 0.28, 0.22], [0.07, 0.4, 0.07]);
    lagg(acc, "cyl", f, [-0.14, 0.28, -0.22], [0.07, 0.4, 0.07], [0, 0, 0], 5);
    lagg(acc, "cyl", f, [0.14, 0.28, -0.22], [0.07, 0.4, 0.07]);
    pivTass.set(-0.14, 0.12, -0.22);
  } else if (k === "fågel" || k === "uggla") {
    lagg(acc, "boll", f, [0, 0.55, 0], [0.32, 0.3, 0.34]);
    lagg(acc, "boll", f, [0, 0.88, 0.08], [0.28, 0.26, 0.26]);
    lagg(acc, "kon", "#F9A825", [0, 0.82, 0.32], [0.07, 0.18, 0.07], [1.2, 0, 0]);
    lagg(acc, "boll", f, [-0.28, 0.62, 0], [0.22, 0.06, 0.14], [0, 0, 0.4], 1);
    lagg(acc, "boll", f, [0.28, 0.62, 0], [0.22, 0.06, 0.14], [0, 0, -0.4], 2);
    lagg(acc, "kon", f, [0, 0.5, -0.28], [0.06, 0.16, 0.04], [1.2, 0, 0], 3);
    pivL.set(-0.12, 0.62, 0);
    pivR.set(0.12, 0.62, 0);
  } else if (k === "fisk" || k === "haj") {
    lagg(acc, "boll", f, [0, 0.22, 0], [0.18, 0.22, 0.48]);
    lagg(acc, "kon", f, [0, 0.22, -0.48], [0.16, 0.2, 0.08], [1.4, 0, 0], 3);
    lagg(acc, "kon", f, [0, 0.38, -0.05], [0.04, 0.16, 0.1], [0, 0, 0]);
    lagg(acc, "box", f, [0.16, 0.18, 0.05], [0.16, 0.02, 0.1]);
    lagg(acc, "box", f, [-0.16, 0.18, 0.05], [0.16, 0.02, 0.1]);
    pivSvans.set(0, 0.22, -0.28);
  } else if (k === "kanin" || k === "ekorre") {
    lagg(acc, "boll", f, [0, 0.42, 0], [0.34, 0.32, 0.4]);
    lagg(acc, "boll", f, [0, 0.86, 0.12], [0.36, 0.34, 0.32]);
    lagg(acc, "boll", "#FFF8F6", [0, 0.78, 0.32], [0.14, 0.1, 0.08]);
    lagg(acc, "boll", "#C06078", [0, 0.76, 0.4], [0.045, 0.04, 0.04]);
    const orY = k === "kanin" ? 0.55 : 0.32;
    lagg(acc, "boll", f, [-0.1, 0.86 + orY, 0.08], [0.1, orY, 0.08], [-0.15, 0, 0.2]);
    lagg(acc, "boll", f, [0.1, 0.86 + orY, 0.08], [0.1, orY, 0.08], [-0.15, 0, -0.2]);
    lagg(acc, "boll", "#F8BBD0", [-0.1, 0.82 + orY * 0.85, 0.12], [0.045, orY * 0.65, 0.03]);
    lagg(acc, "boll", "#F8BBD0", [0.1, 0.82 + orY * 0.85, 0.12], [0.045, orY * 0.65, 0.03]);
    lagg(acc, "boll", "#FFFFFF", [0, 0.48, -0.32], [0.1, 0.1, 0.1]);
    lagg(acc, "boll", f, [-0.12, 0.12, 0.16], [0.07, 0.06, 0.08]);
    lagg(acc, "boll", f, [0.12, 0.12, 0.16], [0.07, 0.06, 0.08]);
    lagg(acc, "boll", f, [-0.12, 0.1, -0.14], [0.06, 0.05, 0.08]);
    lagg(acc, "boll", f, [0.12, 0.1, -0.14], [0.06, 0.05, 0.08]);
  } else {
    lagg(acc, "boll", f, [0, 0.45, 0], [0.4, 0.34, 0.46]);
    lagg(acc, "boll", f, [0, 0.88, 0.16], [0.36, 0.32, 0.32]);
    lagg(acc, "boll", f, [-0.14, 0.12, 0.16], [0.08, 0.07, 0.09]);
    lagg(acc, "boll", f, [0.14, 0.12, 0.16], [0.08, 0.07, 0.09]);
  }

  if (b.krona) {
    const y = k === "groda" ? 0.72 : k === "drake" ? 1.28 : 1.16;
    lagg(acc, "cyl", guld, [0, y, k === "drake" ? 0.48 : 0.12], [0.22, 0.08, 0.2]);
    lagg(acc, "kon", guld, [-0.12, y + 0.08, k === "drake" ? 0.48 : 0.12], [0.05, 0.14, 0.05]);
    lagg(acc, "kon", guld, [0, y + 0.1, k === "drake" ? 0.48 : 0.12], [0.05, 0.16, 0.05]);
    lagg(acc, "kon", guld, [0.12, y + 0.08, k === "drake" ? 0.48 : 0.12], [0.05, 0.14, 0.05]);
  }
  if (b.horn && k !== "drake") {
    lagg(acc, "kon", guld, [0, 1.2, 0.16], [0.05, 0.28, 0.05]);
  }
  if (b.monster) {
    lagg(acc, "boll", b.monsterFarg, [0.12, 0.55, 0.28], [0.06, 0.06, 0.05]);
    lagg(acc, "boll", b.monsterFarg, [-0.1, 0.48, 0.22], [0.045, 0.045, 0.04]);
  }

  const kropp = geoAv(acc);
  const outline = kropp.geo.clone();
  skalUt(outline, 0.055);
  const obase = (outline.getAttribute("position").array as Float32Array).slice();
  const rorlig = kropp.tag.some((t) => t > 0);

  let ogonGeo: THREE.BufferGeometry;
  if (k === "groda") ogonGeo = ogon([[-0.16, 0.68, 0.32, 0.16], [0.16, 0.68, 0.32, 0.16]]);
  else if (k === "drake") ogonGeo = ogon([[-0.14, 1.05, 0.78, 0.11], [0.14, 1.05, 0.78, 0.11]]);
  else if (k === "fisk" || k === "haj") ogonGeo = ogon([[0.1, 0.28, 0.28, 0.06], [-0.1, 0.28, 0.28, 0.06]]);
  else if (k === "fågel" || k === "uggla") ogonGeo = ogon([[-0.1, 0.94, 0.26, 0.09], [0.1, 0.94, 0.26, 0.09]]);
  else if (k === "häst") ogonGeo = ogon([[-0.08, 1.02, 0.62, 0.07], [0.08, 1.02, 0.62, 0.07]]);
  else ogonGeo = ogon([[-0.12, 0.92, 0.36, 0.1], [0.12, 0.92, 0.36, 0.1]]);

  return {
    geo: kropp.geo,
    outline,
    ogon: ogonGeo,
    base: kropp.base,
    obase,
    tag: kropp.tag,
    pivL,
    pivR,
    pivSvans,
    pivHals,
    pivTass,
    rorlig,
  };
}

function rotera(
  arr: Float32Array,
  base: Float32Array,
  tag: Uint8Array,
  id: number,
  piv: THREE.Vector3,
  ang: number,
) {
  if (ang === 0) return;
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  for (let i = 0; i < tag.length; i++) {
    if (tag[i] !== id) continue;
    const x = (base[i * 3] ?? 0) - piv.x;
    const y = (base[i * 3 + 1] ?? 0) - piv.y;
    const z = base[i * 3 + 2] ?? 0;
    arr[i * 3] = piv.x + x * c - y * s;
    arr[i * 3 + 1] = piv.y + x * s + y * c;
    arr[i * 3 + 2] = z;
  }
}

function skalaTag(
  arr: Float32Array,
  base: Float32Array,
  tag: Uint8Array,
  id: number,
  piv: THREE.Vector3,
  s: number,
) {
  if (s === 1) return;
  for (let i = 0; i < tag.length; i++) {
    if (tag[i] !== id) continue;
    arr[i * 3] = piv.x + ((base[i * 3] ?? 0) - piv.x) * s;
    arr[i * 3 + 1] = piv.y + ((base[i * 3 + 1] ?? 0) - piv.y) * s;
    arr[i * 3 + 2] = piv.z + ((base[i * 3 + 2] ?? 0) - piv.z) * s;
  }
}

export function forma(pack: Pack, t: number, kropp: string) {
  if (!pack.rorlig) return;
  const pos = pack.geo.attributes.position;
  const opos = pack.outline.attributes.position;
  if (!pos || !opos) return;
  const arr = pos.array as Float32Array;
  const oarr = opos.array as Float32Array;
  arr.set(pack.base);
  oarr.set(pack.obase);
  const tag = pack.tag;
  if (kropp === "drake") {
    const u = t % 5.2;
    const ang = u < 1.35 ? Math.sin((u / 1.35) * Math.PI * 4) * 0.34 : 0;
    rotera(arr, pack.base, tag, 1, pack.pivL, ang);
    rotera(arr, pack.base, tag, 2, pack.pivR, -ang);
    rotera(oarr, pack.obase, tag, 1, pack.pivL, ang);
    rotera(oarr, pack.obase, tag, 2, pack.pivR, -ang);
    const sv = Math.sin(t * 1.4) * 0.18;
    rotera(arr, pack.base, tag, 3, pack.pivSvans, sv);
    rotera(oarr, pack.obase, tag, 3, pack.pivSvans, sv);
  } else if (kropp === "katt") {
    const sv = Math.sin(t * 1.6) * 0.45;
    rotera(arr, pack.base, tag, 3, pack.pivSvans, sv);
    rotera(oarr, pack.obase, tag, 3, pack.pivSvans, sv);
    const u = t % 7;
    const tass = u < 1.4 ? Math.sin((u / 1.4) * Math.PI) * 0.9 : 0;
    rotera(arr, pack.base, tag, 5, pack.pivTass, tass);
    rotera(oarr, pack.obase, tag, 5, pack.pivTass, tass);
  } else if (kropp === "hund") {
    const sv = Math.sin(t * 8) * 0.7;
    rotera(arr, pack.base, tag, 3, pack.pivSvans, sv);
    rotera(oarr, pack.obase, tag, 3, pack.pivSvans, sv);
  } else if (kropp === "groda") {
    const u = t % 4.2;
    const s = u < 1.1 ? 1 + Math.sin((u / 1.1) * Math.PI) * 0.55 : 1;
    skalaTag(arr, pack.base, tag, 4, pack.pivHals, s);
    skalaTag(oarr, pack.obase, tag, 4, pack.pivHals, s);
  } else if (kropp === "häst") {
    const u = t % 6.5;
    const hov = u < 0.7 ? Math.sin((u / 0.7) * Math.PI) * 0.35 : 0;
    rotera(arr, pack.base, tag, 5, pack.pivTass, hov);
    rotera(oarr, pack.obase, tag, 5, pack.pivTass, hov);
  } else if (kropp === "fågel" || kropp === "uggla") {
    const ang = Math.sin(t * 9) * 0.45;
    rotera(arr, pack.base, tag, 1, pack.pivL, ang);
    rotera(arr, pack.base, tag, 2, pack.pivR, -ang);
    rotera(oarr, pack.obase, tag, 1, pack.pivL, ang);
    rotera(oarr, pack.obase, tag, 2, pack.pivR, -ang);
  } else if (kropp === "fisk" || kropp === "haj") {
    const sv = Math.sin(t * 6) * 0.55;
    rotera(arr, pack.base, tag, 3, pack.pivSvans, sv);
    rotera(oarr, pack.obase, tag, 3, pack.pivSvans, sv);
  }
  pos.needsUpdate = true;
  opos.needsUpdate = true;
}
