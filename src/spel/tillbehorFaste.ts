import * as THREE from "three";
import type { TillbehorSpec } from "../tolk/typer.ts";

/** Ankare i samma rum som djuret ritas: värld för GLB, mesh-rum för generiska former. */
export type Ankare = {
  huvudTopp: THREE.Vector3;
  ansikte: THREE.Vector3;
  ogonL: THREE.Vector3;
  ogonR: THREE.Vector3;
  mun: THREE.Vector3;
  hals: THREE.Vector3;
  rygg: THREE.Vector3;
  bredd: number;
  hojd: number;
  /** Förälder som följer idle: Head-ben, body-nod, eller null (generiskt, fäst på anroparens rot). */
  ben: THREE.Object3D | null;
  /** true = positioner är i rotens världsrum och ska räknas om till benets lokala rum. */
  varld: boolean;
};

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

const GEO = {
  cyl: new THREE.CylinderGeometry(0.5, 0.55, 0.28, 7),
  kon: new THREE.ConeGeometry(0.16, 0.46, 5),
  ring: new THREE.TorusGeometry(0.2, 0.045, 6, 12),
  brygga: new THREE.BoxGeometry(1, 1, 1),
  skalm: new THREE.BoxGeometry(1, 1, 1),
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

function del(geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number) {
  const g = new THREE.Group();
  const mesh = new THREE.Mesh(geo, mat);
  const kant = new THREE.Mesh(geo, KONTUR);
  kant.scale.setScalar(1.07);
  g.add(mesh, kant);
  g.position.set(x, y, z);
  g.scale.set(sx, sy, sz);
  return g;
}

/** Lexikonet märker guldkrona som #FFC107. På djuret ska den vara samma guld som en vanlig krona. */
export function kronFarg(farg: string | null) {
  if (!farg || farg.toLowerCase() === "#ffc107") return "#F2B632";
  return farg;
}

/** Vanliga bågar syns mot päls. Solglasögon bär #212121 i t.farg. */
export function glasFarg(farg: string | null) {
  return farg ?? "#6D4C41";
}

type ProcRad = {
  topp: [number, number, number];
  ogonY: number;
  ogonZ: number;
  ogonX: number;
  mun: [number, number, number];
  bredd: number;
  hojd: number;
};

const STANDARD: ProcRad = {
  topp: [0, 1.2, 0.12],
  ogonY: 0.92,
  ogonZ: 0.36,
  ogonX: 0.12,
  mun: [0, 0.82, 0.48],
  bredd: 0.72,
  hojd: 1.2,
};

const PROC_ANKARE: Record<string, ProcRad> = {
  standard: STANDARD,
  gris: STANDARD,
  dinosaurie: STANDARD,
  bäver: STANDARD,
  katt: STANDARD,
  kanin: STANDARD,
  ekorre: STANDARD,
  hund: { ...STANDARD, mun: [0, 0.78, 0.75], bredd: 0.74 },
  fågel: { topp: [0, 1.14, 0.08], ogonY: 0.94, ogonZ: 0.26, ogonX: 0.1, mun: [0, 0.82, 0.4], bredd: 0.5, hojd: 1.14 },
  uggla: { topp: [0, 1.14, 0.08], ogonY: 0.94, ogonZ: 0.26, ogonX: 0.1, mun: [0, 0.82, 0.4], bredd: 0.5, hojd: 1.14 },
  fisk: { topp: [0, 0.44, 0.02], ogonY: 0.28, ogonZ: 0.3, ogonX: 0.1, mun: [0, 0.24, 0.42], bredd: 0.4, hojd: 0.44 },
  haj: { topp: [0, 0.46, 0.02], ogonY: 0.28, ogonZ: 0.3, ogonX: 0.1, mun: [0, 0.24, 0.42], bredd: 0.42, hojd: 0.46 },
  groda: { topp: [0, 0.78, 0.06], ogonY: 0.68, ogonZ: 0.36, ogonX: 0.16, mun: [0, 0.55, 0.4], bredd: 0.7, hojd: 0.85 },
  drake: { topp: [0, 1.34, 0.42], ogonY: 1.05, ogonZ: 0.82, ogonX: 0.14, mun: [0, 0.9, 1.06], bredd: 0.7, hojd: 1.4 },
  häst: { topp: [0, 1.24, 0.42], ogonY: 1.02, ogonZ: 0.66, ogonX: 0.08, mun: [0, 0.88, 0.78], bredd: 0.42, hojd: 1.35 },
};

function radTillAnkare(r: ProcRad): Ankare {
  const ansikte = new THREE.Vector3(0, r.ogonY, r.ogonZ);
  return {
    huvudTopp: new THREE.Vector3(...r.topp),
    ansikte,
    ogonL: new THREE.Vector3(-r.ogonX, r.ogonY, r.ogonZ),
    ogonR: new THREE.Vector3(r.ogonX, r.ogonY, r.ogonZ),
    mun: new THREE.Vector3(...r.mun),
    hals: new THREE.Vector3(0, r.ogonY - 0.28, r.ogonZ * 0.45),
    rygg: new THREE.Vector3(0, r.hojd * 0.55, -0.2),
    bredd: r.bredd,
    hojd: r.hojd,
    ben: null,
    varld: false,
  };
}

export function procAnkare(kropp: string): Ankare {
  return radTillAnkare(PROC_ANKARE[kropp] ?? STANDARD);
}

function hitta(rot: THREE.Object3D) {
  let huvud: THREE.Object3D | null = null;
  let hals: THREE.Object3D | null = null;
  let body: THREE.Object3D | null = null;
  rot.traverse((o) => {
    if (o.name === "Head") huvud = o;
    if (o.name === "Neck") hals = o;
    if (o.name === "body") body = o;
  });
  return { huvud, hals, body };
}

function lyft(bas: THREE.Vector3, q: THREE.Quaternion, x: number, y: number, z: number) {
  return bas.clone().add(new THREE.Vector3(x, y, z).applyQuaternion(q));
}

export function ankareFor(rot: THREE.Object3D, kropp: string, _s: number): Ankare {
  rot.updateMatrixWorld(true);
  const { huvud, body } = hitta(rot);
  const box = new THREE.Box3().setFromObject(rot);
  const breddR = Math.max(0.2, box.max.x - box.min.x);
  const hojd = Math.max(0.2, box.max.y - box.min.y);
  const bredd = Math.min(breddR, hojd * 0.95);

  if ((kropp === "drake" || kropp === "häst") && huvud) {
    const q = new THREE.Quaternion();
    rot.getWorldQuaternion(q);
    const bas = new THREE.Vector3();
    huvud.getWorldPosition(bas);
    const zKrona = kropp === "drake" ? 0.1 : 0.02;
    const yKrona = kropp === "drake" ? 0.42 : 0.48;
    const huvudTopp = lyft(bas, q, 0, yKrona, zKrona);
    const ansikte = lyft(bas, q, 0, kropp === "drake" ? 0.16 : 0.22, kropp === "drake" ? 0.28 : 0.22);
    const ogonSpr = kropp === "drake" ? 0.12 : 0.08;
    return {
      huvudTopp,
      ansikte,
      ogonL: lyft(bas, q, -ogonSpr, kropp === "drake" ? 0.16 : 0.22, kropp === "drake" ? 0.28 : 0.22),
      ogonR: lyft(bas, q, ogonSpr, kropp === "drake" ? 0.16 : 0.22, kropp === "drake" ? 0.28 : 0.22),
      mun: lyft(bas, q, 0, kropp === "drake" ? 0.02 : 0.08, kropp === "drake" ? 0.42 : 0.34),
      hals: lyft(bas, q, 0, -0.06, 0.1),
      rygg: lyft(bas, q, 0, -0.15, -0.25),
      bredd: kropp === "drake" ? Math.min(bredd, 0.85) : Math.min(bredd, 0.55),
      hojd,
      ben: huvud,
      varld: true,
    };
  }

  const mat = body ?? rot;
  const b = new THREE.Box3().setFromObject(mat);
  const w = Math.max(0.15, b.max.x - b.min.x);
  const h = Math.max(0.15, b.max.y - b.min.y);
  const cx = (b.min.x + b.max.x) / 2;
  const cz = (b.min.z + b.max.z) / 2;
  let toppY = b.max.y;
  let toppZ = cz;
  if (kropp === "kanin") {
    toppY = Math.min(b.max.y, b.min.y + 0.72 * h);
    toppZ = b.min.z + 0.48 * (b.max.z - b.min.z);
  } else if (kropp === "katt") {
    toppY = b.min.y + 0.9 * h;
    toppZ = b.min.z + 0.55 * (b.max.z - b.min.z);
  } else if (kropp === "hund") {
    toppY = b.min.y + 0.9 * h;
    toppZ = b.min.z + 0.62 * (b.max.z - b.min.z);
  } else if (kropp === "fågel" || kropp === "uggla") {
    toppY = b.min.y + 0.92 * h;
    toppZ = b.min.z + 0.55 * (b.max.z - b.min.z);
  } else if (kropp === "fisk") {
    toppY = b.min.y + 0.78 * h;
    toppZ = b.min.z + 0.58 * (b.max.z - b.min.z);
  } else if (kropp === "groda") {
    toppY = b.max.y + 0.02;
    toppZ = b.min.z + 0.42 * (b.max.z - b.min.z);
  }
  const ansY = b.min.y + (kropp === "fisk" ? 0.55 : kropp === "groda" ? 0.72 : 0.62) * h;
  const ansZ = b.max.z;
  const ogonX = 0.16 * w;
  return {
    huvudTopp: new THREE.Vector3(cx, toppY, toppZ),
    ansikte: new THREE.Vector3(cx, ansY, ansZ),
    ogonL: new THREE.Vector3(cx - ogonX, ansY, ansZ),
    ogonR: new THREE.Vector3(cx + ogonX, ansY, ansZ),
    mun: new THREE.Vector3(cx, b.min.y + 0.5 * h, ansZ),
    hals: new THREE.Vector3(cx, b.min.y + 0.5 * h, b.min.z + (b.max.z - b.min.z) * 0.6),
    rygg: new THREE.Vector3(cx, b.min.y + 0.55 * h, b.min.z + 0.15 * (b.max.z - b.min.z)),
    bredd: Math.min(w, h * 0.9),
    hojd: h,
    ben: mat,
    varld: true,
  };
}

function byggKrona(farg: string) {
  const mat = toonMat(farg);
  const g = new THREE.Group();
  g.name = "tillbehor-krona";
  g.add(del(GEO.cyl, mat, 0, 0.08, 0, 0.46, 0.7, 0.4));
  const taggar: [number, number, number][] = [
    [0, 0.22, 0.12],
    [-0.14, 0.18, 0.06],
    [0.14, 0.18, 0.06],
    [-0.1, 0.16, -0.08],
    [0.1, 0.16, -0.08],
  ];
  taggar.forEach(([x, y, z], i) => {
    const h = i === 0 ? 1 : 0.78;
    g.add(del(GEO.kon, mat, x, y, z, h, h, h));
  });
  return g;
}

function byggGlas(farg: string) {
  const mat = toonMat(farg);
  const g = new THREE.Group();
  g.name = "tillbehor-glasogon";
  g.add(del(GEO.ring, mat, -0.28, 0, 0, 1, 1, 1));
  g.add(del(GEO.ring, mat, 0.28, 0, 0, 1, 1, 1));
  g.add(del(GEO.brygga, mat, 0, 0.02, 0, 0.2, 0.05, 0.05));
  g.add(del(GEO.skalm, mat, -0.46, 0.02, -0.12, 0.04, 0.04, 0.22));
  g.add(del(GEO.skalm, mat, 0.46, 0.02, -0.12, 0.04, 0.04, 0.22));
  return g;
}

/** Bara krona och glasögon. Andra id ger null. */
export function byggTillbehor(t: TillbehorSpec, _a: Ankare): THREE.Group | null {
  if (t.id === "krona") return byggKrona(kronFarg(t.farg));
  if (t.id === "glasögon") return byggGlas(glasFarg(t.farg));
  return null;
}

function skalaFor(id: string, a: Ankare) {
  if (id === "krona") return Math.max(0.22, Math.min(a.bredd * 0.85, a.hojd * 0.42));
  if (id === "glasögon") return Math.max(0.2, Math.min(a.bredd * 0.95, a.hojd * 0.5));
  return 1;
}

function platsFor(id: string, a: Ankare) {
  if (id === "krona") return a.huvudTopp;
  return a.ansikte;
}

const _onskad = new THREE.Matrix4();
const _inv = new THREE.Matrix4();
const _lokal = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();

function fastVarld(parent: THREE.Object3D, rot: THREE.Object3D, obj: THREE.Object3D, pos: THREE.Vector3, skala: number) {
  rot.updateWorldMatrix(true, true);
  parent.updateWorldMatrix(true, true);
  rot.getWorldQuaternion(_q);
  _s.set(skala, skala, skala);
  _onskad.compose(pos, _q, _s);
  _inv.copy(parent.matrixWorld).invert();
  _lokal.multiplyMatrices(_inv, _onskad);
  _lokal.decompose(obj.position, obj.quaternion, obj.scale);
  parent.add(obj);
}

export function faestTillbehor(
  rot: THREE.Object3D,
  a: Ankare,
  spec: { tillbehor: TillbehorSpec[]; kropp: string },
) {
  const parent = a.ben ?? rot;
  for (const t of spec.tillbehor) {
    const obj = byggTillbehor(t, a);
    if (!obj) continue;
    const pos = platsFor(t.id, a);
    const skala = skalaFor(t.id, a);
    if (a.varld) fastVarld(parent, rot, obj, pos, skala);
    else {
      obj.position.copy(pos);
      obj.scale.setScalar(skala);
      parent.add(obj);
    }
  }
}
