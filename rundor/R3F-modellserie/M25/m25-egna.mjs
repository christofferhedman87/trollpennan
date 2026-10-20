// R3F-M25: egna lågpolymodeller för trädgård, verktyg och teknik (Trollpennan, CC0). +y upp, +z fram, står på y=0. Kör från en mapp med @gltf-transform och sharp.
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, unpartition, mergeDocuments } from "@gltf-transform/functions";
import sharp from "sharp";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const I = "/workspace/modell-inkorg";
const UT = process.env.UT ?? `${I}/trollpennan-tradgard-m25`;
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
// platta: en del kan vara en lista av former (flatMap som returnerar [L(…), L(…)]); platta ut till rena trianglar
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
const flytta = (t, [dx, dy, dz]) => t.map((tri) => tri.map(([x, y, z]) => [x + dx, y + dy, z + dz]));
const skala = (t, [sx, sy, sz], [cx, cy, cz] = [0, 0, 0]) => t.map((tri) => tri.map(([x, y, z]) => [cx + (x - cx) * sx, cy + (y - cy) * sy, cz + (z - cz) * sz]));
const rotX = (t, a) => t.map((tri) => tri.map(([x, y, z]) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)]));
const rotY = (t, a) => t.map((tri) => tri.map(([x, y, z]) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)]));
const rotZ = (t, a) => t.map((tri) => tri.map(([x, y, z]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z]));
const par = (fn) => [...fn(0.1, 1), ...fn(-0.1, -1)];
const box = (c, s, rz = 0, ry = 0) => flytta(rotY(rotZ(L([0, 0, 0], s), rz), ry), c);
const silver = "#CFD8DC", guld = "#FFC107", gron = "#43A047", morkgron = "#2E7D32", jord = "#5D4037";
const torus = (R, r, n = 22, m = 10) => varv(Array.from({ length: m + 1 }, (_, k) => { const t = (k / m) * 2 * Math.PI; return [R + r * Math.cos(t), r * Math.sin(t)]; }), n);
const luta = (t, a, y0 = 0) => t.map((tri) => tri.map(([x, y, z]) => [x, y0 + (y - y0) * Math.cos(a) + 0, z - (y - y0) * Math.sin(a)]));
const galler = (x0, x1, y0, y1, z, n, f = silver, r = 0.006) => [[f, Array.from({ length: n + 1 }, (_, i) => x0 + ((x1 - x0) * i) / n).flatMap((x) => L([x, (y0 + y1) / 2, z], [r * 2, y1 - y0, r * 2]))]];

// ---------- trädgården
// vattenslang: grön slang i en rulle på en vagn med munstycke
await spara("vattenslang", [[gron, [...flytta(rotX(torus(0.16, 0.035, 18, 6), Math.PI / 2), [0, 0.3, 0.03]), ...flytta(rotX(torus(0.11, 0.035, 16, 6), Math.PI / 2), [0, 0.3, 0.03]), ...ror([[0.16, 0.25, 0.05], [0.3, 0.08, 0.15], [0.45, 0.03, 0.25], [0.55, 0.04, 0.2]], [0.02, 0.02, 0.02, 0.02], 6)]], ["#FDD835", [...cylX([0.6, 0.04, 0.2], 0.03, 0.1, 8), ...flytta(cylZ([0, 0, 0], 0.08, 0.04, 12), [0, 0.3, 0.03])]], ["#455A64", [...[0.2, -0.2].flatMap((x) => [...L([x, 0.28, 0.03], [0.03, 0.5, 0.04])]), ...cylX([0, 0.3, 0.03], 0.015, 0.42, 6), ...cylX([0, 0.06, 0.03], 0.06, 0.06, 10).map((t) => t), ...L([0, 0.55, 0.03], [0.44, 0.03, 0.04])]]]);
// gräsklippare: röd gräsklippare i profil med handtag
await spara("grasklippare", [["#E53935", [...L([0, 0.16, 0], [0.5, 0.14, 0.38]), ...E([0, 0.24, 0], [0.22, 0.06, 0.17], 10, 4, 0)]], [sv, [...[[0.2, 0.18], [0.2, -0.18], [-0.2, 0.18], [-0.2, -0.18]].flatMap(([x, z]) => cylZ([x, 0.08, z], 0.08, 0.05, 12)), ...[0.15, -0.15].flatMap((z) => ror([[-0.2, 0.25, z], [-0.5, 0.75, z * 1.1]], [0.015, 0.015], 5)), ...cylZ([-0.5, 0.75, 0], 0.025, 0.36, 8)]], [silver, [...cyl([0.05, 0.28, 0], 0.06, 0.08, 10), ...L([-0.2, 0.32, 0], [0.12, 0.12, 0.3])]], [gron, [...L([-0.2, 0.42, 0], [0.13, 0.08, 0.3])]]]);
// grep: grep (hötjuga med fyra pinnar) som står
await spara("grep", [[tra, [...cyl([0, 0.3, 0], 0.02, 1.0, 8), ...L([0, 1.32, 0], [0.12, 0.03, 0.03])]], [silver, [...L([0, 0.3, 0], [0.22, 0.04, 0.03]), ...[-0.09, -0.03, 0.03, 0.09].flatMap((x) => cyl([x, 0.0, 0], 0.01, 0.3, 4, "y", 0.012))]]]);
// sekatör: röd sekatör, upprätt
await spara("sekator", [["#E53935", [...box([0.06, 0.15, 0], [0.04, 0.3, 0.03], -0.2), ...box([-0.06, 0.15, 0], [0.04, 0.3, 0.03], 0.2)]], [silver, [...box([0.03, 0.36, 0.0], [0.03, 0.16, 0.015], 0.3), ...box([-0.02, 0.36, 0.0], [0.04, 0.16, 0.015], -0.25), ...cylZ([0, 0.29, 0], 0.025, 0.04, 8)]], [sv, ror([[0.04, 0.12, 0.02], [0.0, 0.16, 0.02], [-0.04, 0.12, 0.02]], [0.006, 0.006, 0.006], 3)]]);
// trädgårdstomte: liten tomte i lera med röd luva, skägg och spade
await spara("tradgardstomte", [["#1E88E5", varv([[0, 0], [0.12, 0], [0.11, 0.2], [0.09, 0.26], [0, 0.26]], 14)], [sv, [...E([0.05, 0.02, 0.04], [0.04, 0.025, 0.06], 6, 3), ...E([-0.05, 0.02, 0.04], [0.04, 0.025, 0.06], 6, 3), ...cyl([0, 0.14, 0], 0.115, 0.03, 14)]], ["#FFCCBC", [...E([0, 0.32, 0.01], [0.08, 0.08, 0.08], 10, 6), ...E([0, 0.32, 0.09], [0.022, 0.02, 0.02], 6, 3)]], [vit, [...E([0, 0.25, 0.06], [0.07, 0.09, 0.04], 8, 6)]], ["#E53935", [...cyl([0, 0.35, 0], 0.085, 0.25, 12, "y", 0.005)]], [tra, [...ror([[0.13, 0.02, 0.06], [0.11, 0.3, 0.06]], [0.012, 0.012], 4)]], [silver, L([0.13, 0.04, 0.06], [0.06, 0.08, 0.01])], ["#FFCCBC", E([0.1, 0.18, 0.06], [0.03, 0.03, 0.03], 6, 3)]]);
// fågelbad: stenskål på fot med vatten och en liten fågel
await spara("fagelbad", [["#B0BEC5", [...varv([[0, 0], [0.2, 0], [0.2, 0.04], [0.07, 0.08], [0.06, 0.5], [0.3, 0.58], [0.32, 0.64], [0.29, 0.64], [0.0, 0.6]], 18)]], ["#4FC3F7", varv([[0, 0.62], [0.28, 0.62], [0, 0.621]], 18)], ["#FDD835", [...E([0.2, 0.7, 0.1], [0.05, 0.04, 0.035], 6, 4), ...E([0.24, 0.74, 0.1], [0.03, 0.03, 0.03], 6, 4)]], ["#FF7043", cyl([0.27, 0.74, 0.1], 0.01, 0.02, 4, "y", 0.001).map((tri) => tri.map(([x, y, z]) => [x + (y - 0.74) * 1.0, 0.74, z]))]]);
// kompost: kompostlåda av brädor med jord, skal och en mask
await spara("kompost", [["#558B2F", [...[0.05, 0.17, 0.29].flatMap((y) => [L([0, y, 0.25], [0.56, 0.08, 0.03]), L([0, y, -0.25], [0.56, 0.08, 0.03]), L([0.27, y, 0], [0.03, 0.08, 0.5]), L([-0.27, y, 0], [0.03, 0.08, 0.5])])]], [mtra, [...[[0.27, 0.25], [-0.27, 0.25], [0.27, -0.25], [-0.27, -0.25]].flatMap(([x, z]) => L([x, 0.18, z], [0.05, 0.36, 0.05]))]], [jord, E([0, 0.28, 0], [0.25, 0.08, 0.23], 10, 4)], ["#FDD835", box([0.08, 0.35, 0.05], [0.12, 0.02, 0.04], 0.3)], ["#FF7043", E([-0.1, 0.35, -0.04], [0.04, 0.025, 0.03], 6, 3)], [gron, E([0.0, 0.35, 0.1], [0.05, 0.015, 0.04], 6, 3)], ["#F48FB1", ror([[-0.05, 0.34, 0.15], [0.0, 0.36, 0.17], [0.05, 0.34, 0.16]], [0.012, 0.012, 0.012], 4)]]);
// växthus: litet växthus av glas med vita spröjs och plantor
{ const glas = "#B3E5FC", sp = vit;
  await spara("vaxthus", [[glas, [...L([0, 0.4, -0.3], [0.9, 0.8, 0.01]), ...L([0.45, 0.4, 0], [0.01, 0.8, 0.6]), ...L([-0.45, 0.4, 0], [0.01, 0.8, 0.6]), ...L([0, 0.6, 0.3], [0.9, 0.4, 0.01]), ...quad([-0.45, 0.8, 0.3], [0.45, 0.8, 0.3], [0.45, 1.1, 0], [-0.45, 1.1, 0]), ...quad([0.45, 0.8, -0.3], [-0.45, 0.8, -0.3], [-0.45, 1.1, 0], [0.45, 1.1, 0]), [[0.45, 0.8, 0.3], [0.45, 0.8, -0.3], [0.45, 1.1, 0]], [[-0.45, 0.8, -0.3], [-0.45, 0.8, 0.3], [-0.45, 1.1, 0]]]], [sp, [...[-0.45, -0.15, 0.15, 0.45].flatMap((x) => [L([x, 0.4, 0.3], [0.03, 0.8, 0.03]), L([x, 0.4, -0.3], [0.03, 0.8, 0.03])]), ...L([0, 0.8, 0.3], [0.92, 0.03, 0.03]), ...L([0, 0.8, -0.3], [0.92, 0.03, 0.03]), ...L([0, 1.1, 0], [0.92, 0.03, 0.03]), ...L([0, 0.4, 0.302], [0.9, 0.02, 0.01])]], [jord, L([0, 0.06, 0.12], [0.8, 0.12, 0.2])], [gron, [-0.3, -0.1, 0.1, 0.3].flatMap((x) => E([x, 0.2, 0.12], [0.07, 0.08, 0.07], 8, 5))], ["#E53935", [-0.3, 0.1].flatMap((x) => E([x + 0.03, 0.22, 0.18], [0.025, 0.025, 0.025], 6, 3))]]); }
// blomlåda: blomlåda med röda och gula blommor
await spara("blomlada", [[tra, L([0, 0.1, 0], [0.6, 0.2, 0.2])], [jord, L([0, 0.2, 0], [0.56, 0.02, 0.16])], [gron, [-0.2, -0.07, 0.07, 0.2].flatMap((x) => [...cyl([x, 0.2, 0], 0.01, 0.16, 4), ...E([x + 0.04, 0.28, 0.02], [0.04, 0.012, 0.025], 6, 3)])], ...[["#E53935", -0.2], ["#FDD835", -0.07], ["#E91E63", 0.07], ["#FB8C00", 0.2]].map(([f, x]) => [f, [0, 1, 2, 3, 4].flatMap((k) => { const a = (k / 5) * 2 * Math.PI; return E([x + 0.035 * Math.cos(a), 0.37 + 0.035 * Math.sin(a), 0.01], [0.025, 0.025, 0.012], 6, 3); })]), ["#FFF59D", [-0.2, -0.07, 0.07, 0.2].flatMap((x) => E([x, 0.37, 0.02], [0.02, 0.02, 0.012], 6, 3))]]);
// vattenspridare: vattenspridare med strålar och droppar
await spara("vattenspridare", [["#FDD835", [...varv([[0, 0], [0.15, 0], [0.12, 0.05], [0.03, 0.08], [0, 0.08]], 14), ...cyl([0, 0.08, 0], 0.02, 0.1, 8)]], ["#1E88E5", [...cylX([0, 0.19, 0], 0.02, 0.36, 8), ...cylX([0.18, 0.19, 0], 0.03, 0.04, 8), ...cylX([-0.18, 0.19, 0], 0.03, 0.04, 8)]], ["#4FC3F7", [...[1, -1].flatMap((s) => [0, 1, 2, 3, 4].map((k) => E([s * (0.22 + k * 0.06), 0.24 + k * 0.05 - k * k * 0.012, 0], [0.018, 0.024, 0.018], 5, 3)).flat())]], [gron, ror([[-0.1, 0.03, 0.1], [-0.3, 0.02, 0.2]], [0.018, 0.018], 6)]]);
// grill: klotgrill på tre ben med korv
await spara("grill", [[sv, [...E([0, 0.5, 0], [0.26, 0.16, 0.26], 16, 8).filter((tri) => tri.some((p) => p[1] < 0.5)), ...[0, 2.1, 4.2].flatMap((a) => ror([[0.15 * Math.cos(a), 0.4, 0.15 * Math.sin(a)], [0.28 * Math.cos(a), 0.0, 0.28 * Math.sin(a)]], [0.015, 0.015], 4))]], [silver, [...Array.from({ length: 7 }, (_, i) => -0.18 + i * 0.06).flatMap((x) => L([x, 0.5, 0], [0.008, 0.008, 0.5 * Math.sqrt(1 - (x / 0.25) ** 2)])), ...L([0, 0.5, 0], [0.48, 0.008, 0.008])]], ["#FF7043", [...[-0.08, 0.02, 0.12].flatMap((x) => flytta(cylZ([0, 0, 0], 0.025, 0.24, 8), [x, 0.53, 0]))]], [mtra, [...[[-0.12, 0.08], [0.08, -0.1]].flatMap(([x, z]) => cylX([x, 0.53, z], 0.02, 0.1, 6))]]]);
// flaggstång: flaggstång med svensk flagga och knopp
await spara("flaggstang", [[vit, [...cyl([0, 0, 0], 0.025, 1.8, 8), ...E([0, 1.82, 0], [0.04, 0.04, 0.04], 8, 6), ...cyl([0, 0, 0], 0.1, 0.06, 10)]], ["#1565C0", L([0.25, 1.55, 0], [0.48, 0.3, 0.01])], ["#FDD835", [...L([0.2, 1.55, 0.001], [0.06, 0.3, 0.012]), ...L([0.25, 1.55, 0.001], [0.48, 0.06, 0.012])]]]);
// cykelställ: cykelställ med böjda rör
await spara("cykelstall", [[silver, [...[-0.3, -0.1, 0.1, 0.3].flatMap((x) => ror([[x, 0, -0.15], [x, 0.3, -0.15], [x, 0.38, -0.05], [x, 0.38, 0.05], [x, 0.3, 0.15], [x, 0, 0.15]], [0.015, 0.015, 0.015, 0.015, 0.015, 0.015], 6)), ...cylX([0, 0.02, -0.15], 0.015, 0.7, 6), ...cylX([0, 0.02, 0.15], 0.015, 0.7, 6)]]]);
// kaninbur: kaninbur av trä och nät med hö och en morot
await spara("kaninbur", [[tra, [...L([0, 0.03, 0], [0.8, 0.06, 0.45]), ...L([0, 0.52, 0], [0.86, 0.04, 0.5]), ...[[0.39, 0.2], [-0.39, 0.2], [0.39, -0.2], [-0.39, -0.2]].flatMap(([x, z]) => L([x, 0.27, z], [0.04, 0.5, 0.04])), ...L([-0.25, 0.27, -0.0], [0.3, 0.46, 0.43])]], ...galler(-0.1, 0.39, 0.06, 0.5, 0.21, 9), ...galler(-0.39, 0.39, 0.06, 0.5, -0.21, 14), [mtra, L([-0.25, 0.27, 0.218], [0.04, 0.12, 0.01])], ["#FDD835", E([0.15, 0.08, 0.0], [0.15, 0.04, 0.12], 8, 4)], ["#FF7043", flytta(rotZ(cyl([0, 0, 0], 0.02, 0.14, 6, "y", 0.004), 1.4), [0.26, 0.09, 0.08])]]);
// fågelbur: rund fågelbur med pinne och gul fågel
await spara("fagelbur", [[guld, [...varv([[0, 0], [0.2, 0], [0.2, 0.04], [0, 0.04]], 16), ...Array.from({ length: 14 }, (_, i) => (i / 14) * 2 * Math.PI).flatMap((a) => ror([[0.19 * Math.cos(a), 0.04, 0.19 * Math.sin(a)], [0.19 * Math.cos(a), 0.4, 0.19 * Math.sin(a)], [0.1 * Math.cos(a), 0.55, 0.1 * Math.sin(a)], [0, 0.6, 0]], [0.005, 0.005, 0.005, 0.005], 3)), ...torus(0.04, 0.008, 10, 4).map((tri) => tri.map(([x, y, z]) => [x, z + 0.64, y]))]], [tra, cylX([0, 0.2, 0], 0.01, 0.36, 6)], ["#FDD835", [...E([0, 0.27, 0], [0.04, 0.05, 0.04], 8, 5), ...E([0, 0.33, 0.01], [0.03, 0.03, 0.03], 6, 4)]], ["#FF7043", E([0, 0.33, 0.045], [0.01, 0.008, 0.015], 4, 3)]]);
// akvarium: akvarium med vatten, sand, växter och fiskar
await spara("akvarium", [["#B3E5FC", L([0, 0.2, 0], [0.6, 0.36, 0.3])], ["#FFE0B2", L([0, 0.045, 0], [0.58, 0.05, 0.28])], [sv, [...L([0, 0.385, 0], [0.62, 0.03, 0.32]), ...L([0, 0.01, 0], [0.62, 0.02, 0.32])]], [gron, [-0.2, -0.12, 0.18].flatMap((x) => ror([[x, 0.06, -0.05], [x + 0.02, 0.18, -0.05], [x - 0.01, 0.3, -0.05]], [0.015, 0.012, 0.008], 4))], ["#FF7043", [...E([0.05, 0.22, 0.152], [0.05, 0.03, 0.006], 8, 3), ...[[0.1, 0.22, 0.152]].flatMap((p) => cylX(p, 0.025, 0.03, 3))]], ["#FDD835", [...E([-0.08, 0.14, 0.152], [0.04, 0.025, 0.006], 8, 3)]], [vit, [[0.15, 0.3], [0.17, 0.34], [0.14, 0.27]].flatMap(([x, y]) => E([x, y, 0.152], [0.01, 0.01, 0.004], 5, 3))]]);
// ---------- verktyg
// skruv: stor skruv med skåra
await spara("skruv", [[silver, [...cyl([0, 0.05, 0], 0.04, 0.3, 10, "y", 0.03), ...cyl([0, 0, 0], 0.005, 0.05, 6, "y", 0.03), ...varv([[0, 0.35], [0.09, 0.35], [0.08, 0.38], [0.05, 0.4], [0, 0.4]], 14), ...Array.from({ length: 7 }, (_, i) => flytta(rotY(rotZ(L([0, 0, 0], [0.1, 0.012, 0.012]), 0.2), i * 1.2), [0, 0.08 + i * 0.038, 0])).flat()]], [sv, L([0, 0.398, 0], [0.12, 0.012, 0.018])]]);
// borrmaskin: gul borrmaskin med borr
await spara("borrmaskin", [["#FDD835", [...L([0, 0.32, 0], [0.32, 0.14, 0.1]), ...box([-0.06, 0.15, 0], [0.08, 0.24, 0.08], -0.15)]], [sv, [...L([-0.06, 0.03, 0], [0.18, 0.06, 0.12]), ...cylX([0.18, 0.32, 0], 0.04, 0.06, 10), ...L([0.0, 0.24, 0.0], [0.03, 0.04, 0.04])]], [silver, [...cylX([0.28, 0.32, 0], 0.012, 0.16, 6)]]]);
// vattenpass: grönt vattenpass med bubblor, på kanten
await spara("vattenpass", [[gron, L([0, 0.05, 0], [0.6, 0.1, 0.04])], ["#FDD835", [...L([0, 0.08, 0.021], [0.1, 0.03, 0.004]), ...L([0.22, 0.05, 0.021], [0.03, 0.08, 0.004])]], [vit, E([0.01, 0.08, 0.024], [0.012, 0.008, 0.003], 5, 3)], [sv, [...L([-0.28, 0.05, 0], [0.04, 0.1, 0.045]), ...L([0.28, 0.05, 0], [0.04, 0.1, 0.045])]]]);
// måttband: gult måttband med utdraget band
await spara("mattband", [["#FDD835", [...flytta(cylZ([0, 0, 0], 0.11, 0.07, 18), [0, 0.11, 0])]], [sv, [...flytta(cylZ([0, 0, 0.036], 0.06, 0.006, 14), [0, 0.11, 0]), ...L([-0.03, 0.17, 0.0], [0.08, 0.04, 0.075])]], ["#FFF59D", [...L([0.3, 0.005, 0.0], [0.4, 0.01, 0.05])]], [sv, [...Array.from({ length: 8 }, (_, i) => L([0.13 + i * 0.05, 0.011, 0.012], [0.006, 0.002, 0.025])).flat(), ...L([0.5, 0.02, 0], [0.01, 0.04, 0.05])]]]);
// verktygslåda: röd verktygslåda med handtag, hammare och skruvmejsel
await spara("verktygslada", [["#E53935", [...L([0, 0.13, 0], [0.5, 0.26, 0.24])]], [sv, [...ror([[-0.15, 0.26, 0], [-0.15, 0.36, 0], [0.15, 0.36, 0], [0.15, 0.26, 0]], [0.015, 0.015, 0.015, 0.015], 5), ...L([0, 0.2, 0.121], [0.5, 0.02, 0.004])]], [silver, [...L([0.0, 0.2, 0.123], [0.06, 0.04, 0.006])]], [tra, flytta(rotZ(cyl([0, 0, 0], 0.015, 0.22, 6), -0.4), [0.12, 0.26, 0.05])], [silver, L([0.21, 0.47, 0.05], [0.1, 0.04, 0.04])], ["#1E88E5", flytta(rotZ(cyl([0, 0, 0], 0.02, 0.1, 6), 0.4), [-0.1, 0.26, -0.03])], [silver, flytta(rotZ(cyl([0, 0.1, 0], 0.007, 0.12, 4), 0.4), [-0.1, 0.26, -0.03])]]);
// kofot: röd kofot som står lutad
await spara("kofot", [["#C62828", [...ror([[0, 0.02, 0], [0.04, 0.6, 0], [0.04, 0.68, 0], [0.0, 0.73, 0], [-0.05, 0.71, 0]], [0.018, 0.018, 0.018, 0.018, 0.016], 6), ...ror([[0, 0.02, 0], [0.06, -0.0, 0]], [0.018, 0.014], 6)].map((tri) => tri.map(([x, y, z]) => [x, Math.max(y, 0), z]))]]);
// ---------- teknik
// spelkonsol: spelkonsol med två handkontroller
await spara("spelkonsol", [[sv, [...L([0, 0.04, -0.05], [0.4, 0.08, 0.3])]], ["#1E88E5", [...L([0, 0.081, -0.05], [0.36, 0.004, 0.02])]], [vit, [...cyl([0.15, 0.08, 0.08], 0.012, 0.004, 6)]], ...[[-0.12, 0.2], [0.14, 0.22]].flatMap(([x, z]) => [["#455A64", [...L([x, 0.03, z], [0.16, 0.05, 0.08]), ...E([x - 0.07, 0.03, z + 0.02], [0.04, 0.025, 0.05], 6, 3), ...E([x + 0.07, 0.03, z + 0.02], [0.04, 0.025, 0.05], 6, 3)]], ["#E53935", [...E([x + 0.04, 0.06, z], [0.012, 0.008, 0.012], 5, 3)]], ["#43A047", [...E([x + 0.06, 0.06, z - 0.02], [0.012, 0.008, 0.012], 5, 3)]], [sv, [...L([x - 0.04, 0.058, z], [0.04, 0.006, 0.012]), ...L([x - 0.04, 0.058, z], [0.012, 0.006, 0.04])]]])]);
// handkontroll: stor spelkontroll som står på högkant
await spara("handkontroll", [["#455A64", [...L([0, 0.16, 0], [0.32, 0.14, 0.07]), ...E([-0.14, 0.12, 0], [0.08, 0.12, 0.04], 8, 5), ...E([0.14, 0.12, 0], [0.08, 0.12, 0.04], 8, 5)]], [sv, [...L([-0.1, 0.18, 0.038], [0.08, 0.025, 0.01]), ...L([-0.1, 0.18, 0.038], [0.025, 0.08, 0.01]), ...cylZ([-0.04, 0.1, 0.04], 0.03, 0.02, 8), ...cylZ([0.04, 0.1, 0.04], 0.03, 0.02, 8)]], ["#E53935", cylZ([0.14, 0.15, 0.04], 0.018, 0.012, 6)], ["#43A047", cylZ([0.1, 0.19, 0.04], 0.018, 0.012, 6)], ["#1E88E5", cylZ([0.1, 0.11, 0.04], 0.018, 0.012, 6)], ["#FDD835", cylZ([0.18, 0.19, 0.04], 0.018, 0.012, 6)]]);
// fjärrkontroll: fjärrkontroll som står upp med knappar
await spara("fjarrkontroll", [[sv, [...L([0, 0.2, 0], [0.1, 0.4, 0.04]), ...L([0, 0.01, -0.04], [0.12, 0.02, 0.1])]], ["#E53935", cylZ([0, 0.35, 0.021], 0.018, 0.006, 8)], [vit, Array.from({ length: 9 }, (_, i) => cylZ([-0.025 + (i % 3) * 0.025, 0.12 + Math.floor(i / 3) * 0.04, 0.021], 0.009, 0.006, 6)).flat()], ["#1E88E5", [...cylZ([0, 0.27, 0.021], 0.028, 0.006, 10)]]]);
// drönare: drönare med fyra propellrar
await spara("dronare", [[vit, [...E([0, 0.12, 0], [0.1, 0.05, 0.12], 10, 6), ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].flatMap(([sx, sz]) => ror([[0, 0.12, 0], [sx * 0.2, 0.13, sz * 0.2]], [0.015, 0.012], 4))]], [sv, [...[[1, 1], [1, -1], [-1, 1], [-1, -1]].flatMap(([sx, sz]) => [...cyl([sx * 0.2, 0.13, sz * 0.2], 0.02, 0.03, 8), ...ror([[sx * 0.2 - 0.0, 0.0, sz * 0.2], [sx * 0.2, 0.13, sz * 0.2]], [0.008, 0.008], 4)]), ...cylZ([0, 0.1, 0.11], 0.025, 0.03, 8)]], ["#4FC3F7", [...[[1, 1], [1, -1], [-1, 1], [-1, -1]].flatMap(([sx, sz]) => [box([sx * 0.2, 0.165, sz * 0.2], [0.2, 0.005, 0.025], 0, sx * sz * 0.5)]).flat()]], ["#E53935", E([0, 0.17, -0.08], [0.012, 0.012, 0.012], 4, 3)]]);
// kikare: svart kikare med blå linser
await spara("kikare", [[sv, [...[0.07, -0.07].flatMap((x) => [...cylZ([x, 0.1, 0], 0.06, 0.22, 12), ...cylZ([x, 0.1, -0.15], 0.045, 0.1, 10)]), ...L([0, 0.1, -0.05], [0.08, 0.04, 0.08])]], ["#4FC3F7", [0.07, -0.07].flatMap((x) => cylZ([x, 0.1, 0.111], 0.05, 0.004, 12))], ["#E53935", ror([[0.12, 0.1, -0.05], [0.0, -0.0, 0.05], [-0.12, 0.1, -0.05]].map(([x, y, z]) => [x, Math.max(y, 0.01), z]), [0.008, 0.008, 0.008], 3)]]);
// teleskop: stjärnkikare på stativ
await spara("teleskop", [["#1E88E5", [...flytta(rotZ(cyl([0, -0.35, 0], 0.07, 0.75, 14), -0.9), [0, 0.85, 0])]], [vit, [...flytta(rotZ(cyl([0, 0.38, 0], 0.08, 0.06, 14), -0.9), [0, 0.85, 0]), ...flytta(rotZ(cyl([0, -0.4, 0], 0.03, 0.08, 8), -0.9), [0, 0.85, 0])]], [sv, [...[0, 2.1, 4.2].flatMap((a) => ror([[0, 0.8, 0], [0.35 * Math.cos(a), 0, 0.35 * Math.sin(a)]], [0.015, 0.015], 4)), ...E([0, 0.83, 0], [0.05, 0.05, 0.05], 6, 4)]]]);
// ---------- skogen
// myrstack: myrstack av barr med myror
await spara("myrstack", [["#8D6E63", E([0, 0, 0], [0.45, 0.4, 0.45], 14, 8, 0)], ["#A1887F", Array.from({ length: 22 }, (_, i) => { const a = i * 2.39, y = 0.05 + (i % 7) * 0.05, r = 0.45 * Math.sqrt(1 - (y / 0.4) ** 2); return box([r * Math.cos(a), y, r * Math.sin(a)], [0.08, 0.012, 0.012], 0.5, a); }).flat()], [sv, [[0.2, 0.32], [0.0, 0.38], [-0.25, 0.25], [0.3, 0.18]].flatMap(([x, y], i) => { const z = Math.sqrt(Math.max(0, 0.45 ** 2 * (1 - (y / 0.4) ** 2) - x * x)) + 0.01; return [...E([x, y, z], [0.02, 0.015, 0.012], 5, 3), ...E([x + 0.03, y, z], [0.015, 0.013, 0.01], 5, 3)]; })]]);
// fågelbo: fågelbo med tre blå ägg
await spara("fagelbo", [["#8D6E63", [...torus(0.18, 0.07, 18, 8).map((tri) => tri.map(([x, y, z]) => [x, y + 0.07, z])), ...cyl([0, 0, 0], 0.15, 0.04, 14)]], [mtra, Array.from({ length: 16 }, (_, i) => box([0.2 * Math.cos(i * 0.8), 0.06 + (i % 3) * 0.04, 0.2 * Math.sin(i * 0.8)], [0.14, 0.012, 0.012], 0.3 * ((i % 2) * 2 - 1), i * 0.8 + 1.4)).flat()], ["#81D4FA", [[0.04, 0.0], [-0.05, 0.03], [0.0, -0.06]].flatMap(([x, z]) => E([x, 0.08, z], [0.045, 0.055, 0.045], 8, 6))]]);
// ekollon: stort ekollon med hatt och skaft, och ett eklöv
await spara("ekollon", [["#C8A165", E([0, 0.15, 0], [0.12, 0.15, 0.12], 12, 8)], ["#6D4C41", [...varv([[0, 0.17], [0.13, 0.2], [0.14, 0.25], [0.1, 0.29], [0, 0.3]], 14), ...cyl([0, 0.29, 0], 0.015, 0.06, 6)]], [morkgron, flytta(rotX(skala(E([0, 0, 0], [0.12, 0.012, 0.2], 8, 3), [1, 1, 1]), 0), [0.2, 0.012, 0.05])]]);
console.log("klart");
