// R3F-M28: egna lågpolymodeller för kök, hem, lek och post (barnord utan modell) (Trollpennan, CC0). +y upp, +z fram, står på y=0. Kör från en mapp med @gltf-transform och sharp.
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, unpartition, mergeDocuments } from "@gltf-transform/functions";
import sharp from "sharp";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const I = "/workspace/modell-inkorg";
const UT = process.env.UT ?? `${I}/trollpennan-hem-lek-m28`;
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
const platta = (t) => t.flatMap((x) => (Array.isArray(x[0][0]) ? platta(x) : [x]));
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

// ---------- kök och hem
// våffeljärn: öppet våffeljärn med en våffla
{ const rutor = (y, z0, f) => [f, Array.from({ length: 16 }, (_, i) => L([-0.105 + (i % 4) * 0.07, y, z0 + Math.floor(i / 4) * 0.07], [0.05, 0.012, 0.05]))];
  await spara("vaffeljarn", [["#B71C1C", [...L([0, 0.04, 0.05], [0.34, 0.08, 0.32]), ...flytta(rotX(L([0, 0.04, 0], [0.34, 0.08, 0.32]), -1.25), [0, 0.2, -0.17])]], ["#424242", [...L([0, 0.081, 0.05], [0.3, 0.004, 0.28]), ...cylX([0, 0.05, 0.25], 0.016, 0.2, 8)]], ["#F3C77A", L([0, 0.095, 0.05], [0.28, 0.02, 0.27])], rutor(0.107, -0.055, "#D9A24E"), [sv, L([0, 0.03, 0.23], [0.08, 0.03, 0.08])]]); }
// diskmaskin: diskmaskin med luckan nedfälld och tallrikar i korgen
await spara("diskmaskin", [["#ECEFF1", [...L([0, 0.42, -0.05], [0.6, 0.84, 0.55]), ...L([0, 0.03, 0.45], [0.58, 0.04, 0.44])]], ["#455A64", [...L([0, 0.8, 0.23], [0.6, 0.08, 0.012]), ...L([0, 0.42, 0.226], [0.54, 0.7, 0.004])]], ["#90A4AE", [...L([0, 0.12, 0.05], [0.5, 0.02, 0.4]), ...L([0, 0.45, 0.05], [0.5, 0.02, 0.4])]], [vit, [-0.15, -0.08, -0.01, 0.06, 0.13].flatMap((x) => cylX([x, 0.24, 0.05], 0.11, 0.015, 14))], ["#4FC3F7", [-0.12, 0.0, 0.12].flatMap((x) => cyl([x, 0.46, 0.05], 0.04, 0.12, 10, "y", 0.05))], ["#66BB6A", [0.18, 0.21, 0.24].map((x) => L([x, 0.8, 0.237], [0.015, 0.015, 0.006]))]]);
// strykjärn: strykjärn som står på bakkanten
{ const sula = prisma([[-0.15, 0], [0.12, 0], [0.18, 0.0001]].length ? [[-0.15, -0.09], [0.1, -0.09], [0.2, 0], [0.1, 0.09], [-0.15, 0.09]] : [], 0, 0.04);
  const ner = (t) => platta(t).map((tri) => tri.map(([x, y, z]) => [x, z, y]));
  await spara("strykjarn", [["#B0BEC5", flytta(ner(sula), [0, 0.02, 0])], ["#26A69A", [...flytta(ner(skala(prisma([[-0.14, -0.08], [0.08, -0.08], [0.16, 0], [0.08, 0.08], [-0.14, 0.08]], 0, 0.06), [1, 1, 1])), [0, 0.07, 0]), ...ror([[-0.12, 0.1, 0], [-0.1, 0.2, 0], [0.04, 0.2, 0], [0.09, 0.1, 0]], [0.02, 0.02, 0.02, 0.02], 8)]], ["#FF7043", cylZ([-0.02, 0.13, 0.085], 0.02, 0.012, 10)], [vit, ror([[-0.15, 0.08, 0], [-0.25, 0.04, 0.05], [-0.32, 0.01, 0.12]], [0.008, 0.008, 0.008], 6)]]); }
// strykbräda: strykbräda med kryssben och ett strykjärn
await spara("strykbrada", [["#90A4AE", [...box([0.18, 0.4, 0.08], [0.02, 0.85, 0.02], 0.55), ...box([-0.18, 0.4, 0.08], [0.02, 0.85, 0.02], -0.55), ...box([0.18, 0.4, -0.08], [0.02, 0.85, 0.02], 0.55), ...box([-0.18, 0.4, -0.08], [0.02, 0.85, 0.02], -0.55)]], ["#81D4FA", [...L([-0.05, 0.76, 0], [0.8, 0.05, 0.28]), ...cyl([0.35, 0.735, 0], 0.14, 0.05, 16)].map((tri) => tri.map(([x, y, z]) => [x, y, x > 0.3 ? z * Math.max(0.3, 1 - (x - 0.3) / 0.2) : z]))], ["#4FC3F7", Array.from({ length: 7 }, (_, i) => E([-0.35 + i * 0.1, 0.787, 0.06 * ((i % 2) * 2 - 1)], [0.02, 0.004, 0.02], 6, 3))], ["#26A69A", flytta(skala(E([0, 0, 0], [0.12, 0.07, 0.07], 10, 5, 0), [1, 1, 1]), [-0.3, 0.785, 0])]]);
// ostkupa: ostbricka av trä med glaskupa och en ost
await spara("ostkupa", [[tra, cyl([0, 0, 0], 0.22, 0.03, 20)], ["#FFD54F", [...prisma([[-0.1, 0], [0.1, 0], [0.04, 0.09], [-0.1, 0.09]], 0, 0.12).map((tri) => tri.map(([x, y, z]) => [x, y + 0.03, z]))]], ["#FFB300", [-0.05, 0.02, 0.06].map((x, i) => cylZ([x, 0.06 + (i % 2) * 0.03, 0.061], 0.012, 0.004, 8))], ["#B3E5FC", varv([[0.19, 0.03], [0.19, 0.2], [0.14, 0.28], [0.05, 0.31], [0, 0.31]], 18)], ["#E1F5FE", E([0, 0.335, 0], [0.03, 0.03, 0.03], 8, 5)]]);
// bestick: kniv, gaffel och sked på en servett, stående snett mot betraktaren
{ const serv = L([0, 0, 0], [0.34, 0.006, 0.34]);
  const gaffel = [...L([0, 0.003, 0.08], [0.03, 0.006, 0.2]), ...[-0.012, -0.004, 0.004, 0.012].map((x) => L([x, 0.003, -0.07], [0.005, 0.006, 0.1])), ...L([0, 0.003, -0.02], [0.034, 0.006, 0.02])];
  const sked = [...L([0, 0.003, 0.08], [0.028, 0.006, 0.2]), ...E([0, 0.004, -0.06], [0.03, 0.006, 0.045], 10, 4)];
  const kniv = [...L([0, 0.003, 0.09], [0.028, 0.008, 0.16]), ...prisma([[-0.012, -0.12], [0.014, -0.12], [0.014, 0.01], [-0.012, 0.01]], 0, 0.004).map((tri) => tri.map(([x, y, z]) => [x, 0.004, -y - 0.0]))];
  const T = (t) => flytta(rotX(platta(t), 1.05), [0, 0.17, 0.02]);
  await spara("bestick", [["#FFCDD2", T(serv)], [met, T([...flytta(gaffel, [-0.09, 0.006, 0]), ...flytta(kniv, [0.0, 0.006, 0]), ...flytta(sked, [0.09, 0.006, 0])])], [tra, L([0, 0.01, -0.06], [0.36, 0.02, 0.08])]]); }
// kaffekopp: kopp på fat med ånga
await spara("kaffekopp", [[vit, [...varv(skal(0.06, 0.08, 0.1, 0.01, 0.02), 16), ...varv([[0, 0], [0.15, 0], [0.16, 0.02], [0.14, 0.022], [0.07, 0.012], [0, 0.012]], 18), ...halvRing([0.085, 0.07, 0], 0.03, 0.01, "xy", -Math.PI / 2, Math.PI / 2, 8)]], ["#5D4037", varv([[0, 0.1], [0.072, 0.1], [0.072, 0.105], [0, 0.105]], 16)], ["#1E88E5", varv([[0.075, 0.09], [0.082, 0.09], [0.082, 0.1], [0.075, 0.1]], 16)], ["#ECEFF1", [...ror([[0, 0.13, 0], [0.02, 0.17, 0], [-0.01, 0.21, 0], [0.01, 0.25, 0]], [0.012, 0.012, 0.01, 0.006], 6), ...ror([[0.04, 0.13, 0], [0.06, 0.16, 0], [0.035, 0.2, 0]], [0.01, 0.01, 0.005], 6)]]]);
// sugrör: randiga böjsugrör i ett glas
await spara("sugror", [["#E1F5FE", varv(skal(0.06, 0.07, 0.18, 0.008), 16)], ["#FFAB91", varv([[0, 0.01], [0.062, 0.01], [0.068, 0.13], [0, 0.13]], 16)], ...[[0.02, 0.0, "#E53935", 0.4], [-0.02, 0.02, "#43A047", -0.4], [0.0, -0.02, "#1E88E5", 0.0]].flatMap(([x, z, f, a]) => { const P = [[x, 0.03, z], [x + Math.sin(a) * 0.05, 0.24, z], [x + Math.sin(a) * 0.055, 0.27, z], [x + Math.sin(a) * 0.1 + Math.sign(a || 1) * 0.04, 0.29, z]]; return [[f, ror(P.slice(0, 2), [0.009, 0.009], 6)], [vit, ror(P.slice(1), [0.009, 0.009, 0.009], 6)]]; })]);
// grytlapp: rutig grytlapp som hänger i en ögla på en krok
await spara("grytlapp", [["#E53935", [...L([0, 0.13, 0], [0.25, 0.25, 0.02]), ...halvRing([0, 0.255, 0], 0.03, 0.008, "xy", 0, Math.PI, 8)]], [vit, Array.from({ length: 25 }, (_, i) => i).filter((i) => (i % 5 + Math.floor(i / 5)) % 2 === 0).map((i) => L([-0.1 + (i % 5) * 0.05, 0.03 + Math.floor(i / 5) * 0.05, 0.0105], [0.05, 0.05, 0.003]))], ["#B71C1C", [...L([0, 0.005, 0.0], [0.26, 0.012, 0.024]), ...L([0, 0.255, 0.0], [0.26, 0.012, 0.024]), ...L([0.125, 0.13, 0.0], [0.012, 0.26, 0.024]), ...L([-0.125, 0.13, 0.0], [0.012, 0.26, 0.024])]]]);
// hårtork: rosa hårtork som står på handtaget
await spara("hartork", [["#F06292", [...cylX([0.02, 0.27, 0], 0.07, 0.24, 14), ...cyl([0, 0, 0], 0.035, 0.22, 10, "y", 0.03)]], ["#424242", [...cylX([0.16, 0.27, 0], 0.045, 0.04, 12), ...cylX([-0.11, 0.27, 0], 0.06, 0.02, 14)]], [vit, cylZ([0, 0.14, 0.032], 0.012, 0.01, 8)], ["#9E9E9E", ror([[0, 0.01, 0], [-0.06, 0.0, 0.05], [-0.15, 0.003, 0.06]], [0.008, 0.008, 0.008], 6)]]);
// sopskyffel: sopskyffel och liten borste
await spara("sopskyffel", [["#FFB300", [...prisma([[-0.15, 0], [0.15, 0], [0.13, 0.12], [-0.13, 0.12]], 0, 0.02).map((tri) => tri.map(([x, y, z]) => [x, z * 0 + 0.01 + (y < 0.06 ? 0 : 0), y < 0.06 ? 0.1 - y : -y + 0.1])), ...L([0, 0.06, -0.02], [0.28, 0.12, 0.012]), ...box([0, 0.2, -0.02], [0.04, 0.2, 0.03], 0)]], ["#1565C0", [...cyl([0.0, 0.0, 0.0], 0.001, 0.001, 3), ...flytta(rotZ(L([0, 0, 0], [0.2, 0.04, 0.05]), 0.25), [0.18, 0.08, 0.12]), ...flytta(rotZ(cylX([0, 0, 0], 0.018, 0.16, 8), 0.25), [0.04, 0.05, 0.12])]], ["#795548", flytta(rotZ(L([0, -0.035, 0], [0.19, 0.04, 0.045]), 0.25), [0.18, 0.08, 0.12])]]);
// tvättkorg: flätad tvättkorg med kläder som sticker upp
await spara("tvattkorg", [["#D7B98E", varv(skal(0.17, 0.2, 0.32, 0.015), 18)], ["#A1887F", [0.08, 0.16, 0.24].flatMap((y) => varv([[0.17 + y * 0.094, y], [0.177 + y * 0.094, y], [0.177 + y * 0.094, y + 0.02], [0.17 + y * 0.094, y + 0.02]], 18))], ["#42A5F5", E([0.05, 0.3, 0.03], [0.12, 0.06, 0.1], 10, 5)], ["#FFEB3B", E([-0.07, 0.31, -0.02], [0.1, 0.05, 0.1], 10, 5)], ["#E53935", box([0.12, 0.38, 0.06], [0.06, 0.16, 0.02], -0.4)]]);
// galge: klädgalge av trä med krok
await spara("galge", [[tra, [...ror([[-0.22, 0.05, 0], [-0.1, 0.12, 0], [0, 0.15, 0], [0.1, 0.12, 0], [0.22, 0.05, 0]], [0.014, 0.018, 0.02, 0.018, 0.014], 8)]], [met, [...cyl([0, 0.15, 0], 0.006, 0.06, 6), ...halvRing([0.025, 0.215, 0], 0.025, 0.006, "xy", 0, Math.PI * 1.3, 10), ...cylX([0, 0.05, 0], 0.006, 0.44, 6)]]]);
// ---------- lek, nycklar och post
// nyckelknippa: tre nycklar och en hjärtbricka på en ring
{ const nyckel = (a, f) => [f, rotZ([...torusXY([0, -0.04, 0], 0.025, 0.009), ...L([0, -0.13, 0], [0.018, 0.14, 0.008]), ...L([0.016, -0.18, 0], [0.016, 0.012, 0.008]), ...L([0.014, -0.15, 0], [0.012, 0.012, 0.008])], a)];
  await spara("nyckelknippa", [[met, torusXY([0, 0, 0], 0.045, 0.006)], nyckel(0.4, "#FFC107"), nyckel(-0.1, "#B0BEC5"), nyckel(-0.6, "#BCAAA4"), ["#E91E63", rotZ(flytta(prisma([[0, -0.05], [0.045, 0.0], [0.03, 0.025], [0, 0.01], [-0.03, 0.025], [-0.045, 0]], 0, 0.01), [0, -0.06, 0]), 1.0)]].map(([f, t]) => [f, flytta(platta(t), [0, 0.24, 0])])); }
// hänglås: hänglås med bygel och nyckelhål
await spara("hanglas", [[guld, L([0, 0.09, 0], [0.18, 0.15, 0.06])], [met, [...halvRing([0, 0.165, 0], 0.06, 0.013, "xy", 0, Math.PI, 12), ...cyl([0.06, 0.13, 0], 0.013, 0.04, 8), ...cyl([-0.06, 0.13, 0], 0.013, 0.04, 8)]], [sv, [...cylZ([0, 0.105, 0.031], 0.014, 0.004, 10), ...L([0, 0.08, 0.031], [0.01, 0.035, 0.004])]]]);
// tändsticka: tändsticksask med några stickor, en tänd
await spara("tandsticka", [["#1E88E5", L([0, 0.04, 0], [0.24, 0.08, 0.15])], ["#FFEB3B", L([0, 0.04, 0.076], [0.16, 0.05, 0.004])], ["#FFE0B2", [...L([0.05, 0.084, 0.02], [0.24, 0.008, 0.008]), ...L([0.06, 0.084, -0.02], [0.24, 0.008, 0.008]), ...flytta(rotZ(L([0, 0, 0], [0.008, 0.2, 0.008]), -0.25), [-0.05, 0.18, 0.05])]], ["#C62828", [...E([0.17, 0.084, 0.02], [0.012, 0.008, 0.008], 6, 3), ...E([0.18, 0.084, -0.02], [0.012, 0.008, 0.008], 6, 3), ...E([-0.025, 0.28, 0.05], [0.009, 0.012, 0.009], 6, 3)]], ["#FFB300", E([-0.022, 0.32, 0.05], [0.018, 0.035, 0.018], 8, 5)], ["#FF7043", E([-0.022, 0.31, 0.06], [0.009, 0.02, 0.009], 6, 4)]]);
// frimärke: stort frimärke med takkant och ett hjärta, på högkant
{ const kant = []; for (let i = 0; i < 6; i++) { for (const [x, y] of [[-0.1 + i * 0.04, 0.0], [-0.1 + i * 0.04, 0.27], [-0.12, 0.025 + i * 0.044], [0.12, 0.025 + i * 0.044]]) kant.push(...cylZ([x, y + 0.0, 0], 0.012, 0.012, 8)); }
  await spara("frimarke", [[vit, L([0, 0.135, 0], [0.24, 0.27, 0.008])], ["#4FC3F7", L([0, 0.15, 0.003], [0.19, 0.2, 0.006])], ["#E53935", prisma([[0, 0.08], [0.06, 0.15], [0.04, 0.19], [0, 0.17], [-0.04, 0.19], [-0.06, 0.15]], 0.006, 0.006)], ["#1565C0", L([0, 0.03, 0.006], [0.12, 0.025, 0.004])], ["#F5F5F5", kant.map((tri) => tri.map(([x, y, z]) => [x, y, z * 0.3]))], [tra, L([0, 0.004, -0.03], [0.2, 0.008, 0.06])]].map(([f, t]) => [f, flytta(platta(t), [0, 0.012, 0])])); }
// vykort: vykort med sol, hav och båt som står mot ett stöd
await spara("vykort", [[vit, L([0, 0.12, 0], [0.34, 0.22, 0.008])], ["#81D4FA", L([0, 0.16, 0.005], [0.31, 0.12, 0.004])], ["#1E88E5", L([0, 0.07, 0.005], [0.31, 0.07, 0.004])], ["#FDD835", cylZ([0.1, 0.18, 0.008], 0.03, 0.004, 12)], ["#E53935", prisma([[-0.09, 0.08], [-0.01, 0.08], [0.0, 0.1], [-0.1, 0.1]], 0.009, 0.004)], [vit, prisma([[-0.06, 0.1], [-0.03, 0.1], [-0.06, 0.16]], 0.009, 0.004)], ["#8D6E63", L([0, 0.04, -0.05], [0.04, 0.08, 0.1])]].map(([f, t]) => [f, rotX(platta(t), -0.1)]));
// påskägg: stort påskägg i papp, randigt och prickigt
await spara("paskagg", [["#FDD835", E([0, 0.17, 0], [0.13, 0.17, 0.13], 16, 10)], ["#AB47BC", [0.11, 0.23].flatMap((y) => { const r = 0.13 * Math.sqrt(1 - ((y - 0.17) / 0.17) ** 2) + 0.004; return varv([[r, y - 0.015], [r, y + 0.015]], 16).concat(varv([[r - 0.01, y - 0.016], [r, y - 0.015]], 16)); })], ["#43A047", [0, 1, 2, 3, 4].map((i) => { const a = (i / 5) * Math.PI * 2; return E([0.132 * Math.sin(a), 0.17, 0.132 * Math.cos(a)], [0.018, 0.018, 0.018], 6, 4); })], ["#F48FB1", L([0, 0.17, 0], [0.001, 0.001, 0.001])]]);
// såpbubblor: flaska med blåsring och bubblor
await spara("sapbubblor", [["#7E57C2", varv([[0, 0], [0.05, 0], [0.05, 0.16], [0.03, 0.18], [0, 0.18]], 14)], ["#FFEB3B", cyl([0, 0.18, 0], 0.03, 0.03, 12)], ["#E040FB", [...cyl([0.1, 0, 0], 0.005, 0.2, 6).map((tri) => tri.map(([x, y, z]) => [x + y * 0.3, y, z])), ...torusXY([0.165, 0.24, 0], 0.035, 0.007)]], ["#B3E5FC", [[0.22, 0.34, 0], [0.12, 0.42, 0.02], [0.26, 0.47, -0.02], [-0.05, 0.36, 0], [0.04, 0.52, 0]].flatMap((p, i) => E(p, [0.03 + (i % 3) * 0.012, 0.03 + (i % 3) * 0.012, 0.03 + (i % 3) * 0.012], 10, 6))], [vit, [[0.21, 0.355, 0.03], [0.11, 0.435, 0.05], [-0.06, 0.375, 0.03]].flatMap((p) => E(p, [0.008, 0.008, 0.008], 4, 3))]]);
// vattenpistol: färgglad vattenpistol med tank, sedd från sidan
await spara("vattenpistol", [["#43A047", [...L([0.02, 0.2, 0], [0.32, 0.08, 0.07]), ...box([-0.09, 0.09, 0], [0.07, 0.17, 0.06], -0.3)]], ["#FF9800", [...cylX([0.2, 0.2, 0], 0.025, 0.08, 10), ...L([0.01, 0.13, 0], [0.03, 0.05, 0.02])]], ["#4FC3F7", cyl([0.03, 0.24, 0], 0.05, 0.1, 12)], ["#1565C0", cyl([0.03, 0.34, 0], 0.02, 0.02, 8)], ["#81D4FA", ror([[0.24, 0.2, 0], [0.32, 0.21, 0], [0.4, 0.18, 0]], [0.008, 0.01, 0.006], 6)]]);
// leksaksbil: liten röd leksaksbil med stora hjul
await spara("leksaksbil", [["#E53935", [...L([0, 0.1, 0], [0.34, 0.08, 0.16]), ...L([-0.02, 0.17, 0], [0.18, 0.07, 0.15])]], ["#81D4FA", [...L([0.075, 0.17, 0], [0.005, 0.05, 0.12]), ...L([-0.02, 0.17, 0.076], [0.14, 0.045, 0.004])]], ...[[0.11, 0.08], [-0.11, 0.08], [0.11, -0.08], [-0.11, -0.08]].flatMap(([x, z]) => [[sv, cylZ([x, 0.05, z], 0.05, 0.035, 12)], ["#FDD835", cylZ([x, 0.05, z + Math.sign(z) * 0.018], 0.022, 0.004, 8)]]), ["#FFF59D", [...L([0.171, 0.11, 0.05], [0.005, 0.025, 0.03]), ...L([0.171, 0.11, -0.05], [0.005, 0.025, 0.03])]]].map(([f, t]) => [f, rotY(platta(t), 0.35)]));
// studsboll: randig studsboll som studsar (två skuggor)
await spara("studsboll", [["#FF4081", E([0, 0.2, 0], [0.1, 0.1, 0.1], 14, 10).filter((tri) => Math.floor(Math.atan2(tri[0][2], tri[0][0]) / 0.8 + 8) % 2 === 0)], ["#FFEB3B", E([0, 0.2, 0], [0.1, 0.1, 0.1], 14, 10).filter((tri) => Math.floor(Math.atan2(tri[0][2], tri[0][0]) / 0.8 + 8) % 2 === 1)], ["#B0BEC5", cyl([0, 0, 0], 0.07, 0.004, 14)], [vit, [...ror([[-0.04, 0.06, 0.02], [-0.05, 0.035, 0.02]], [0.005, 0.005], 4), ...ror([[0.04, 0.06, 0.02], [0.05, 0.035, 0.02]], [0.005, 0.005], 4)]]]);
// kulor: glaskulor i olika färger runt en påse
await spara("kulor", [["#8D6E63", [...E([0, 0.08, 0], [0.09, 0.09, 0.08], 12, 8, -0.8), ...cyl([0, 0.16, 0], 0.03, 0.04, 10, "y", 0.05)]], ["#FDD835", cyl([0, 0.165, 0], 0.033, 0.01, 10)], ...[["#E53935", 0.14, 0.06], ["#1E88E5", -0.13, 0.07], ["#43A047", 0.06, 0.13], ["#FFB300", -0.04, 0.14], ["#AB47BC", 0.16, -0.05]].flatMap(([f, x, z]) => [[f, E([x, 0.03, z], [0.03, 0.03, 0.03], 10, 6)], [vit, E([x - 0.01, 0.045, z + 0.022], [0.007, 0.007, 0.007], 4, 3)]])]);
// jojo: jojo på högkant med snöre
await spara("jojo", [["#E53935", [...cylZ([0, 0.14, 0.025], 0.1, 0.035, 18, 0.09), ...cylZ([0, 0.14, -0.025], 0.09, 0.035, 18, 0.1)]], ["#FDD835", [...cylZ([0, 0.14, 0.044], 0.04, 0.004, 14)]], [vit, [...cylZ([0, 0.14, 0], 0.015, 0.02, 8), ...cyl([0, 0.14, 0.0], 0.003, 0.22, 4), ...torusXY([0, 0.37, 0], 0.012, 0.003)]]].map(([f, t]) => [f, flytta(platta(t), [0, -0.035, 0])]));
// picknickkorg: picknickkorg med rutig duk och lock
await spara("picknickkorg", [["#C8A06A", L([0, 0.1, 0], [0.4, 0.2, 0.26])], ["#A1887F", [0.05, 0.1, 0.15].map((y) => L([0, y, 0.131], [0.4, 0.015, 0.004]))], ["#8D6E63", [...flytta(rotX(L([0, 0, 0], [0.4, 0.02, 0.13]), -0.9), [0, 0.25, -0.1]), ...halvRing([0, 0.2, 0], 0.13, 0.012, "xy", 0, Math.PI, 12)]], ["#E53935", [0, 1, 2, 3].map((i) => L([-0.12 + i * 0.08, 0.215, 0.05], [0.04, 0.02, 0.14]))], [vit, [0, 1, 2].map((i) => L([-0.08 + i * 0.08, 0.215, 0.05], [0.04, 0.019, 0.14]))]]);
console.log("klart");
