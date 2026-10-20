// R3F-MFIX7: nya modellfiler för saker som var fel i spelet (Doodles granskning av M24–M28) (barnord utan modell) (Trollpennan, CC0). +y upp, +z fram, står på y=0. Kör från en mapp med @gltf-transform och sharp.
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, unpartition, mergeDocuments } from "@gltf-transform/functions";
import sharp from "sharp";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const I = "/workspace/modell-inkorg";
const UT = process.env.UT ?? `${I}/trollpennan-mfix7`;
const lin = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255); return [...c.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)), 1]; };

// ---------- triangelsoppa
function delarTillMesh(doc, namn, delar) {
  const buf = doc.getRoot().listBuffers()[0] ?? doc.createBuffer();
  const mesh = doc.createMesh(namn);
  for (const [farg, tris] of delar) {
    const pos = [], nor = [];
    for (const [a, b, c] of tris) {
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const l = Math.hypot(...n) || 1; n = n.map((x) => x / l);
      pos.push(...a, ...b, ...c); nor.push(...n, ...n, ...n);
    }
    if (!pos.length) continue;
    const mat = doc.createMaterial(farg).setBaseColorFactor(lin(farg)).setRoughnessFactor(0.8).setMetallicFactor(0);
    mesh.addPrimitive(doc.createPrimitive().setMaterial(mat)
      .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(new Float32Array(pos)).setBuffer(buf))
      .setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(new Float32Array(nor)).setBuffer(buf)));
  }
  return mesh;
}
function bygg(namn, delar) {
  const doc = new Document(); doc.createBuffer(); const scen = doc.createScene(namn);
  scen.addChild(doc.createNode(namn).setMesh(delarTillMesh(doc, namn, delar))); doc.getRoot().setDefaultScene(scen);
  return doc;
}
const quad = (a, b, c, d) => [[a, b, c], [a, c, d]];
function lada([cx, cy, cz], [sx, sy, sz]) {
  const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
  return [
    ...quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]), ...quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]),
    ...quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]), ...quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]),
    ...quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]), ...quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]),
  ];
}
function ellips([cx, cy, cz], [rx, ry, rz], nu = 12, nv = 8, ymin = -1) {
  const p = (i, j) => { const u = (i / nu) * 2 * Math.PI, v = -Math.PI / 2 + (j / nv) * Math.PI; return [cx + rx * Math.cos(v) * Math.sin(u), cy + Math.max(ymin, Math.sin(v)) * ry, cz + rz * Math.cos(v) * Math.cos(u)]; };
  const t = [];
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = p(i, j), b = p(i + 1, j), c = p(i + 1, j + 1), d = p(i, j + 1); t.push([a, b, c], [a, c, d]); }
  return t;
}
// rör längs en punktlista (i yz- eller xz-plan), radie per punkt
function ror(punkter, radier, n = 8) {
  const t = [];
  const ring = (k) => {
    const p = punkter[k], q = punkter[Math.min(k + 1, punkter.length - 1)], o = punkter[Math.max(k - 1, 0)];
    let d = [q[0] - o[0], q[1] - o[1], q[2] - o[2]]; const l = Math.hypot(...d) || 1; d = d.map((x) => x / l);
    let a = Math.abs(d[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    let u = [d[1] * a[2] - d[2] * a[1], d[2] * a[0] - d[0] * a[2], d[0] * a[1] - d[1] * a[0]]; const lu = Math.hypot(...u); u = u.map((x) => x / lu);
    const v = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
    return Array.from({ length: n }, (_, i) => { const w = (i / n) * 2 * Math.PI, r = radier[k]; return [0, 1, 2].map((c) => p[c] + r * (Math.cos(w) * u[c] + Math.sin(w) * v[c])); });
  };
  const R = punkter.map((_, k) => ring(k));
  for (let k = 0; k < R.length - 1; k++) for (let i = 0; i < n; i++) { const a = R[k][i], b = R[k][(i + 1) % n], c = R[k + 1][(i + 1) % n], d = R[k + 1][i]; t.push([a, d, c], [a, c, b]); }
  return t;
}
function cyl([cx, cy, cz], r, h, n = 16, axel = "y", r2 = r) {
  const t = [], P = (w, y, rr) => (axel === "y" ? [cx + rr * Math.cos(w), cy + y, cz + rr * Math.sin(w)] : [cx + rr * Math.cos(w), cy + rr * Math.sin(w), cz + y]);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI, b = ((i + 1) / n) * 2 * Math.PI;
    t.push(...quad(P(a, 0, r), P(b, 0, r), P(b, h, r2), P(a, h, r2)));
    t.push([P(0, h, 0).map((x, k) => (k === (axel === "y" ? 1 : 2) ? x : [cx, cy, cz][k])), P(b, h, r2), P(a, h, r2)]);
    t.push([P(0, 0, 0).map((x, k) => (k === (axel === "y" ? 1 : 2) ? x : [cx, cy, cz][k])), P(a, 0, r), P(b, 0, r)]);
  }
  return t;
}
const vand = (t) => t.map(([a, b, c]) => [a, c, b]);

const L = lada;
const cylX = ([cx, cy, cz], r, w, n = 14) => vand(cyl([0, 0, 0], r, w, n, "z").map((t) => t.map(([a, b, c]) => [cx - w / 2 + c, cy + b, cz + a])));
const cylZ = ([cx, cy, cz], r, l, n = 14, r2 = r) => cyl([cx, cy, cz - l / 2], r, l, n, "z", r2);
// ring (däck) i yz-planet runt x-axeln
const ringX = ([cx, cy, cz], R, r, n = 18) => { const p = []; for (let i = 0; i <= n; i++) { const a = (i / n) * 2 * Math.PI; p.push([cx, cy + R * Math.sin(a), cz + R * Math.cos(a)]); } return ror(p, p.map(() => r), 6); };
const hjul = (x, z, r = 0.22, w = 0.16) => [["#263238", cylX([x, r, z], r, w)], ["#B0BEC5", cylX([x + Math.sign(x) * 0.01, r, z], r * 0.5, w + 0.02)]];
const fyraHjul = (bx, zf, zb, r) => [...hjul(bx, zf, r), ...hjul(-bx, zf, r), ...hjul(bx, zb, r), ...hjul(-bx, zb, r)];
const fonsterSidor = (y0, y1, z0, z1, x, f = "#4FC3F7") => [[f, [...L([x, (y0 + y1) / 2, (z0 + z1) / 2], [0.02, y1 - y0, z1 - z0]), ...L([-x, (y0 + y1) / 2, (z0 + z1) / 2], [0.02, y1 - y0, z1 - z0])]]];
const ljus = (y, z, x = 0.35) => [["#FFF59D", [...L([x, y, z], [0.16, 0.1, 0.03]), ...L([-x, y, z], [0.16, 0.1, 0.03])]]];
// platta: en del kan vara en lista av former; platta ut till rena trianglar
const platta = (t) => t.flatMap((x) => (!x.length ? [] : Array.isArray(x[0][0]) ? platta(x) : [x]));
const slaUt = (delar) => { const m = new Map(); for (const [f, t] of delar) m.set(f, [...(m.get(f) ?? []), ...platta(t)]); return [...m]; };
async function spara(namn, delar) { await io.write(`${UT}/${namn}-egen.glb`, bygg(namn, slaUt(delar))); }
async function kenneyPlus(namn, kalla, delar) {
  const doc = await io.read(kalla); const root = doc.getRoot(); const scen = root.listScenes()[0];
  scen.addChild(doc.createNode(`till-${namn}`).setMesh(delarTillMesh(doc, `till-${namn}`, slaUt(delar))));
  for (const t of root.listTextures()) t.setURI("");
  await io.write(`${UT}/${namn}-kenney.glb`, doc);
}

const E = ellips;
// svarv: profil [[r, y], …] nedifrån och upp runt y-axeln (ut och upp = utsida; tillbaka ner = insida)
function varv(prof, n = 20, [cx, cz] = [0, 0]) {
  const t = [], P = (i, k) => { const w = (i / n) * 2 * Math.PI; return [cx + prof[k][0] * Math.cos(w), prof[k][1], cz + prof[k][0] * Math.sin(w)]; };
  for (let i = 0; i < n; i++) for (let k = 0; k < prof.length - 1; k++) t.push(...quad(P(i, k), P(i + 1, k), P(i + 1, k + 1), P(i, k + 1)));
  return t;
}
// kopp/skål: utsida, kant, insida
const skal = (r0, r1, h, tj = 0.02, y0 = 0, botten = 0.02) => [[0, y0], [r0, y0], [r1, y0 + h], [r1 - tj, y0 + h], [r0 - tj, y0 + botten], [0, y0 + botten]];
const ring = ([cx, cy, cz], R, r, plan = "xy", n = 14) => { const p = []; for (let i = 0; i <= n; i++) { const a = (i / n) * 2 * Math.PI; p.push(plan === "xy" ? [cx + R * Math.cos(a), cy + R * Math.sin(a), cz] : plan === "zy" ? [cx, cy + R * Math.sin(a), cz + R * Math.cos(a)] : [cx + R * Math.cos(a), cy, cz + R * Math.sin(a)]); } return ror(p, p.map(() => r), 6); };
const halvRing = ([cx, cy, cz], R, r, plan = "zy", fran = -Math.PI / 2, till = Math.PI / 2, n = 10) => { const p = []; for (let i = 0; i <= n; i++) { const a = fran + ((till - fran) * i) / n; p.push(plan === "xy" ? [cx + R * Math.cos(a), cy + R * Math.sin(a), cz] : [cx, cy + R * Math.sin(a), cz + R * Math.cos(a)]); } return ror(p, p.map(() => r), 6); };
const prickar = (pos, r, f) => [[f, pos.flatMap((p) => E(p, [r, r, r], 6, 4))]];
// punkter på en svarvad yta (radie r vid höjd y), n st runt om
const runt = (r, y, n, fas = 0) => Array.from({ length: n }, (_, i) => { const a = fas + (i / n) * 2 * Math.PI; return [r * Math.cos(a), y, r * Math.sin(a)]; });

// ---------- hjälp för M21
const tra = "#A1887F", mtra = "#6D4C41", met = "#B0BEC5", sv = "#212121", vit = "#FAFAFA";
const flytta = (t, [dx, dy, dz]) => platta(t).map((tri) => tri.map(([x, y, z]) => [x + dx, y + dy, z + dz]));
const skala = (t, [sx, sy, sz], [cx, cy, cz] = [0, 0, 0]) => platta(t).map((tri) => tri.map(([x, y, z]) => [cx + (x - cx) * sx, cy + (y - cy) * sy, cz + (z - cz) * sz]));
const rotX = (t, a) => platta(t).map((tri) => tri.map(([x, y, z]) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)]));
const rotY = (t, a) => platta(t).map((tri) => tri.map(([x, y, z]) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)]));
const rotZ = (t, a) => platta(t).map((tri) => tri.map(([x, y, z]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z]));
const par = (fn) => [...fn(0.1, 1), ...fn(-0.1, -1)];
const box = (c, s, rz = 0, ry = 0) => flytta(rotY(rotZ(L([0, 0, 0], s), rz), ry), c);
const torus = (R, r, n = 22, m = 10) => varv(Array.from({ length: m + 1 }, (_, k) => { const t = (k / m) * 2 * Math.PI; return [R + r * Math.cos(t), r * Math.sin(t)]; }), n);
const tallrik = (r = 0.3, f = vit) => [f, varv([[0, 0], [r * 0.6, 0], [r, 0.04], [r - 0.02, 0.045], [r * 0.6, 0.015], [0, 0.015]], 22)];
const glas = (r, h, f = "#E1F5FE") => [f, varv(skal(r * 0.85, r, h, 0.012), 16)];

// ---------- hjälp för M27
// prisma: konvex polygon (moturs i xy) utdragen i z runt zc
const prisma = (pts, zc, d) => { const t = [], f = pts.map(([x, y]) => [x, y, zc + d / 2]), b = pts.map(([x, y]) => [x, y, zc - d / 2]);
  for (let i = 1; i < pts.length - 1; i++) { t.push([f[0], f[i], f[i + 1]], [b[0], b[i + 1], b[i]]); }
  for (let i = 0; i < pts.length; i++) { const j = (i + 1) % pts.length; t.push(...quad(b[i], b[j], f[j], f[i])); }
  return t; };
const torusXY = (c, R, r) => flytta(rotX(torus(R, r), Math.PI / 2), c);
const guld = "#FFC107";

// ---------- hjälp för MFIX6
// golv: flytta alla delar så att lägsta punkten hamnar på y = 0
const golv = (delar) => { const d = delar.map(([f, t]) => [f, platta(t)]); let m = Infinity; for (const [, t] of d) for (const tri of t) for (const p of tri) m = Math.min(m, p[1]); return d.map(([f, t]) => [f, flytta(t, [0, -m, 0])]); };
const roteraDelar = (delar, fn) => delar.map(([f, t]) => [f, fn(platta(t))]);
// stråkinstrument i xy-planet (framsidan +z), kroppens nederkant y = 0, snäckan högst upp vid y ≈ 1.0
function strak({ trä, mork = "#3E2723", d = 0.07, axlar = false, ljus = "#F5DEB3" }) {
  const kropp = [...E([0, 0.24, 0], [axlar ? 0.22 : 0.2, axlar ? 0.22 : 0.2, d], 16, 8), ...(axlar ? [...E([0, 0.44, 0], [0.15, 0.12, d], 16, 8), ...prisma([[-0.16, 0.42], [0.16, 0.42], [0.03, 0.7], [-0.03, 0.7]], 0, d * 1.5)] : E([0, 0.5, 0], [0.16, 0.15, d], 16, 8))];
  return [[trä, [...kropp, ...L([0, 0.79, -0.005], [0.05, 0.24, 0.04]), ...L([0, 0.94, 0], [0.04, 0.1, 0.05]), ...E([0, 1.0, 0], [0.035, 0.035, 0.03], 8, 5)]],
    [mork, [...L([0, 0.62, d * 0.75 + 0.012], [0.05, 0.6, 0.016]), ...prisma([[-0.035, 0.07], [0.035, 0.07], [0.05, 0.22], [-0.05, 0.22]], d * 0.85, 0.016), ...[-0.07, 0.07].map((x) => box([x, 0.33, d * 0.8], [0.012, 0.11, 0.01], x > 0 ? -0.15 : 0.15)), ...[0.9, 0.95].flatMap((y) => [L([0.035, y, 0], [0.04, 0.012, 0.012]), L([-0.035, y, 0], [0.04, 0.012, 0.012])])]],
    [ljus, [...L([0, 0.3, d * 0.82], [0.1, 0.04, 0.012]), ...[-0.018, -0.006, 0.006, 0.018].map((x) => L([x, 0.55, d * 0.75 + 0.024], [0.003, 0.72, 0.003]))]]];
}
// stråke längs y (0 … l), frosch nertill
const strake = (l) => [["#5D4037", L([0, l / 2, 0], [0.012, l, 0.012])], [vit, L([0.022, l / 2 + 0.02, 0], [0.006, l * 0.9, 0.01])], [sv, L([0.012, 0.06, 0], [0.04, 0.06, 0.02])]];
const delarFlytta = (delar, v) => roteraDelar(delar, (t) => flytta(t, v));

// ---------- täcke: ligger platt på marken (stod upprätt som en vägg), vadderat med stjärnor och vikt kant
{ const B = 0.6, puff = [], stj = [];
  puff.push(...L([0, 0.03, 0], [B, 0.06, B]));
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const x = -0.2 + i * 0.2, z = -0.2 + j * 0.2; puff.push(...E([x, 0.06, z], [0.1, 0.035, 0.1], 10, 6, 0)); stj.push(...prisma([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => { const a = Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 0.014 : 0.034; return [x + r * Math.cos(a), -z + r * Math.sin(a)]; }), 0, 0.008).map((tri) => tri.map(([px, py, pz]) => [px, 0.097 + pz, -py]))); }
  await spara("tacke", [["#90CAF9", puff], ["#FFF176", stj], ["#64B5F6", cylX([0, 0.05, B / 2], 0.05, B, 14)], ["#BBDEFB", [...[-0.1, 0.1].map((x) => L([x, 0.066, 0], [0.01, 0.01, B])), ...[-0.1, 0.1].map((z) => L([0, 0.066, z], [B, 0.01, 0.01]))]], [vit, L([0, 0.13, -0.24], [0.3, 0.07, 0.12])]]); }
// ---------- kajak: lång röd kajak med sittbrunn, flytväst-gul kant och en paddel snett över
{ const skrov = varv(Array.from({ length: 13 }, (_, i) => { const t = i / 12; return [Math.max(0.002, 0.13 * Math.sin(Math.PI * t) ** 0.7), -0.6 + 1.2 * t]; }), 14).map((tri) => tri.map(([x, y, z]) => [y, 0.1 + z * 0.8, x]));
  const skrovNed = skrov.filter((tri) => tri.every((p) => p[1] >= 0.0));
  await spara("kajak", [["#E53935", skrov], ["#212121", [...varv([[0, 0], [0.12, 0], [0.12, 0.03], [0.1, 0.03], [0, 0.01]], 16).map((tri) => tri.map(([x, y, z]) => [x * 1.5, y + 0.19, z * 0.8]))]], ["#FDD835", [...L([0.3, 0.19, 0], [0.05, 0.012, 0.16]), ...L([-0.3, 0.19, 0], [0.05, 0.012, 0.16])]],
    ["#90A4AE", flytta(rotZ(cylX([0, 0, 0], 0.012, 1.0, 8), 0.35), [0.02, 0.38, 0.06])], ["#1E88E5", [...flytta(rotZ(L([0, 0, 0], [0.16, 0.07, 0.012]), 0.35), [0.5, 0.55, 0.06]), ...flytta(rotZ(L([0, 0, 0], [0.16, 0.07, 0.012]), 0.35), [-0.46, 0.21, 0.06])]]]); }
// ---------- kikare: stående kikare med två tydliga tuber, okular upptill och vridhjul (tuberna syns från sidan)
{ const tub = (x) => [...cyl([x, 0, 0], 0.055, 0.2, 14, "y", 0.045), ...cyl([x, 0.2, 0], 0.035, 0.06, 12)];
  await spara("kikare", [[sv, [...tub(0.065), ...tub(-0.065), ...L([0, 0.16, 0], [0.08, 0.04, 0.04])]], ["#455A64", [...cyl([0.065, 0.26, 0], 0.04, 0.025, 12), ...cyl([-0.065, 0.26, 0], 0.04, 0.025, 12), ...cylZ([0, 0.2, 0], 0.022, 0.07, 12)]], ["#4FC3F7", [...cyl([0.065, -0.004, 0], 0.047, 0.006, 14), ...cyl([-0.065, -0.004, 0], 0.047, 0.006, 14)]], ["#B0BEC5", [...cyl([0.065, 0.08, 0], 0.057, 0.02, 14), ...cyl([-0.065, 0.08, 0], 0.057, 0.02, 14)]]].map(([f, t]) => [f, flytta(rotY(platta(t), 0.35), [0, 0.006, 0])])); }
// ---------- spelkonsol: konsol med skärm (spel på skärmen) och en handkontroll framför
await spara("spelkonsol", [[sv, [...L([0, 0.22, -0.06], [0.5, 0.32, 0.03]), ...L([0, 0.03, -0.06], [0.12, 0.06, 0.08])]], ["#4FC3F7", L([0, 0.22, -0.044], [0.46, 0.28, 0.004])], ["#66BB6A", L([0, 0.1, -0.04], [0.46, 0.04, 0.004])], ["#E53935", [...L([-0.1, 0.15, -0.04], [0.04, 0.06, 0.004]), ...L([0.12, 0.2, -0.04], [0.05, 0.05, 0.004])]], ["#FDD835", [...[[-0.05, 0.25], [0.0, 0.29], [0.05, 0.25]].map(([x, y]) => cylZ([x, y, -0.04], 0.012, 0.004, 8))]],
  [vit, [...L([0.0, 0.03, 0.12], [0.3, 0.06, 0.16])]], ["#1E88E5", L([0, 0.061, 0.2], [0.24, 0.004, 0.004])], ["#37474F", [...E([0.0, 0.03, 0.27], [0.11, 0.025, 0.05], 10, 5), ...E([-0.08, 0.03, 0.29], [0.04, 0.025, 0.045], 8, 5), ...E([0.08, 0.03, 0.29], [0.04, 0.025, 0.045], 8, 5)]], ["#E53935", E([0.085, 0.055, 0.28], [0.012, 0.006, 0.012], 6, 3)], ["#43A047", E([0.065, 0.055, 0.295], [0.012, 0.006, 0.012], 6, 3)], ["#9E9E9E", [...L([-0.08, 0.056, 0.285], [0.04, 0.006, 0.012]), ...L([-0.08, 0.056, 0.285], [0.012, 0.006, 0.04])]]]);
// ---------- sylt: syltburk med rutigt lock och etikett (utan skeden som stack ut)
await spara("sylt", [["#E1F5FE", varv([[0, 0], [0.11, 0], [0.12, 0.02], [0.12, 0.2], [0.1, 0.24], [0, 0.24]], 16)], ["#AD1457", varv([[0, 0.01], [0.11, 0.01], [0.112, 0.02], [0.112, 0.2], [0, 0.2]], 16)], ["#E53935", [...varv([[0, 0.24], [0.11, 0.24], [0.13, 0.27], [0, 0.28]], 16)]], [vit, [...[-0.06, 0, 0.06].flatMap((x) => L([x, 0.275, 0], [0.025, 0.006, 0.2])), ...[-0.06, 0, 0.06].flatMap((z) => L([0, 0.276, z], [0.2, 0.006, 0.025])), ...L([0, 0.12, 0.122], [0.1, 0.07, 0.004])]], ["#E53935", E([0, 0.12, 0.125], [0.02, 0.02, 0.004], 8, 3)]]);
// ---------- hängslen: bara hängslena (inga byxor) – två röda band med spännen nertill, ihop i en läderlapp upptill, på en krok
await spara("hangslen", [["#E53935", [...box([0.05, 0.32, 0], [0.04, 0.42, 0.012], -0.13), ...box([-0.05, 0.32, 0], [0.04, 0.42, 0.012], 0.13), ...box([0.12, 0.12, 0], [0.04, 0.2, 0.012], -0.2), ...box([-0.12, 0.12, 0], [0.04, 0.2, 0.012], 0.2)]], ["#6D4C41", [...prisma([[-0.05, 0.48], [0.05, 0.48], [0.07, 0.54], [0, 0.58], [-0.07, 0.54]], 0.003, 0.016)]], [met, [...[0.1, -0.1].flatMap((x) => [L([x * 1.05, 0.11 + 0.0, 0.004], [0.05, 0.03, 0.012])]), ...[0.15, -0.15].map((x) => L([x, 0.012, 0.004], [0.045, 0.024, 0.012])), ...halvRing([0, 0.6, 0], 0.025, 0.005, "xy", 0, Math.PI, 8)]]].map(([f, t]) => [f, platta(t)]));
// ---------- napp: tydlig napp – bred sköld med två lufthål, knapp och stor ring framåt, napp bakåt; vriden så att nappen syns
await spara("napp", golv(roteraDelar([["#F06292", [...E([0, 0.12, 0], [0.13, 0.085, 0.008], 18, 8)]], [vit, [...cylZ([-0.095, 0.12, 0.0], 0.017, 0.03, 8), ...cylZ([0.095, 0.12, 0.0], 0.017, 0.03, 8)]], ["#FFE082", [...cylZ([0, 0.12, -0.03], 0.02, 0.05, 10), ...E([0, 0.12, -0.1], [0.04, 0.04, 0.055], 12, 8)]], ["#F8BBD0", [...cylZ([0, 0.12, 0.03], 0.03, 0.03, 12), ...torusXY([0, 0.12, 0.065], 0.05, 0.01)]]], (t) => rotY(t, 1.0))));
// ---------- studsboll: randig studsboll som står på marken (ingen skugga eller svävning)
await spara("studsboll", [["#FF4081", E([0, 0.1, 0], [0.1, 0.1, 0.1], 14, 10).filter((tri) => Math.floor(Math.atan2(tri[0][2], tri[0][0]) / 0.8 + 8) % 2 === 0)], ["#FFEB3B", E([0, 0.1, 0], [0.1, 0.1, 0.1], 14, 10).filter((tri) => Math.floor(Math.atan2(tri[0][2], tri[0][0]) / 0.8 + 8) % 2 === 1)], [vit, E([-0.035, 0.15, 0.07], [0.02, 0.015, 0.012], 6, 4)]]);
// ---------- risboll: trekantig onigiri med sjögräsband nertill, på ett litet fat (såg ut som ett spöke)
{ const tri = prisma([[-0.13, 0.0], [0.13, 0.0], [0.0, 0.2]], 0, 0.09).map((t) => t.map(([x, y, z]) => [x, y + 0.02, z]));
  await spara("risboll", [["#5D4037", cyl([0, 0, 0], 0.17, 0.02, 18)], [vit, [...tri, ...E([0, 0.2, 0], [0.04, 0.03, 0.045], 8, 5), ...E([-0.11, 0.035, 0], [0.035, 0.03, 0.045], 8, 5), ...E([0.11, 0.035, 0], [0.035, 0.03, 0.045], 8, 5)]], ["#1B5E20", [...L([0, 0.06, 0.0], [0.1, 0.08, 0.096])]]]); }
// ---------- sovmask: blå sovmask med slutna ögon och resåren i en ögla bakåt (liknade hörlurar)
await spara("sovmask", [["#3949AB", [...E([-0.075, 0.08, 0.12], [0.085, 0.07, 0.025], 12, 6), ...E([0.075, 0.08, 0.12], [0.085, 0.07, 0.025], 12, 6), ...L([0, 0.1, 0.12], [0.04, 0.03, 0.04])]], ["#9FA8DA", flytta(torus(0.14, 0.008, 22, 5), [0, 0.08, 0])], [vit, [-0.075, 0.075].flatMap((x) => [...halvRing([x, 0.09, 0.144], 0.035, 0.005, "xy", Math.PI, 2 * Math.PI, 8), ...[-0.025, 0, 0.025].map((d) => L([x + d, 0.045, 0.144], [0.004, 0.018, 0.004]))])]].map(([f, t]) => [f, flytta(platta(t), [0, -0.01, 0])]));
// ---------- lakrits: lakritssnäckor med röd mitt och en lakritsrem på ett fat (liknade två ögon på en planka)
{ const snacka = (cx, cz) => ror(Array.from({ length: 30 }, (_, i) => { const a = i * 0.45, r = 0.012 + i * 0.0028; return [cx + r * Math.cos(a), 0.035, cz + r * Math.sin(a)]; }), Array(30).fill(0.012), 6);
  await spara("lakrits", [tallrik(0.3), [sv, [...snacka(-0.11, 0.02), ...snacka(0.1, -0.05), ...ror([[-0.15, 0.03, 0.17], [-0.02, 0.05, 0.13], [0.1, 0.03, 0.16], [0.2, 0.04, 0.1]], [0.014, 0.014, 0.014, 0.014], 6)]], ["#E53935", [...E([-0.11, 0.04, 0.02], [0.016, 0.014, 0.016], 6, 4), ...E([0.1, 0.04, -0.05], [0.016, 0.014, 0.016], 6, 4)]]]); }
// ---------- sopskyffel: tydlig sopskyffel (platt skopa med kant och skaft) och en borste bredvid
await spara("sopskyffel", [["#FFB300", [...L([0, 0.008, 0.02], [0.3, 0.016, 0.24]), ...L([0, 0.07, -0.1], [0.3, 0.14, 0.02]), ...prisma([[-0.1, 0.0], [0.14, 0.0], [-0.1, 0.13]], 0, 0.016).map((t) => t.map(([x, y, z]) => [0.15, y + 0.0, x])), ...prisma([[-0.1, 0.0], [0.14, 0.0], [-0.1, 0.13]], 0, 0.016).map((t) => t.map(([x, y, z]) => [-0.15, y, x])), ...flytta(rotX(L([0, 0, 0], [0.04, 0.03, 0.22]), 0.5), [0, 0.15, -0.2])]],
  ["#1565C0", [...L([0.0, 0.05, 0.25], [0.24, 0.05, 0.06]), ...cylX([0.22, 0.06, 0.25], 0.018, 0.22, 8)]], ["#795548", L([0.0, 0.015, 0.25], [0.23, 0.03, 0.055])]]);
console.log("klart");
