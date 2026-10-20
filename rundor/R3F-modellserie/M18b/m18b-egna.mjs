// R3F-M18b: egna lågpolydjur (Trollpennan, CC0). +y upp, +z fram (huvudet), står på y=0.
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, unpartition, mergeDocuments } from "@gltf-transform/functions";
import sharp from "sharp";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const I = "/workspace/modell-inkorg";
const UT = `${I}/trollpennan-djur-m18b`;
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
const slaUt = (delar) => { const m = new Map(); for (const [f, t] of delar) m.set(f, [...(m.get(f) ?? []), ...t]); return [...m]; };
async function spara(namn, delar) { await io.write(`${UT}/${namn}-egen.glb`, bygg(namn, slaUt(delar))); }
async function kenneyPlus(namn, kalla, delar) {
  const doc = await io.read(kalla); const root = doc.getRoot(); const scen = root.listScenes()[0];
  scen.addChild(doc.createNode(`till-${namn}`).setMesh(delarTillMesh(doc, `till-${namn}`, slaUt(delar))));
  for (const t of root.listTextures()) t.setURI("");
  await io.write(`${UT}/${namn}-kenney.glb`, doc);
}

const E = ellips, sv = "#212121", vi = "#FAFAFA";
const ogon = (x, y, z, r = 0.04) => [[sv, [...E([x, y, z], [r, r, r * 0.7], 6, 4), ...E([-x, y, z], [r, r, r * 0.7], 6, 4)]], [vi, [...E([x + r * 0.3, y + r * 0.35, z + r * 0.55], [r * 0.3, r * 0.3, r * 0.2], 4, 3), ...E([-x + r * 0.3, y + r * 0.35, z + r * 0.55], [r * 0.3, r * 0.3, r * 0.2], 4, 3)]]];
const ben4 = (f, x, zf, zb, y, r, fot = f) => [[f, [x, -x].flatMap((xx) => [zf, zb].flatMap((z) => cyl([xx, 0.04, z], r, y, 8)))], [fot, [x, -x].flatMap((xx) => [zf, zb].flatMap((z) => E([xx, 0.05, z + 0.02], [r * 1.15, 0.06, r * 1.3], 8, 4)))]];
// björn
await spara("bjorn", [["#7B5038", [...E([0, 0.78, 0], [0.45, 0.42, 0.72], 14, 9), ...E([0, 1.02, 0.78], [0.3, 0.29, 0.3], 12, 8), ...E([0.2, 1.3, 0.72], [0.1, 0.1, 0.07], 8, 5), ...E([-0.2, 1.3, 0.72], [0.1, 0.1, 0.07], 8, 5), ...E([0, 0.86, -0.7], [0.09, 0.09, 0.08], 6, 4)]],
  ...ben4("#7B5038", 0.25, 0.42, -0.42, 0.55, 0.16, "#5D3A28"), ["#C4A27A", [...E([0, 0.94, 1.03], [0.15, 0.12, 0.14], 10, 6), ...E([0.2, 1.3, 0.76], [0.05, 0.05, 0.03], 6, 4), ...E([-0.2, 1.3, 0.76], [0.05, 0.05, 0.03], 6, 4)]],
  [sv, E([0, 0.99, 1.17], [0.06, 0.045, 0.04], 6, 4)], ...ogon(0.12, 1.1, 1.03, 0.035)]);
// hamster
await spara("hamster", [["#E3A35E", [...E([0, 0.27, 0], [0.3, 0.27, 0.34], 14, 9), ...E([0.15, 0.53, 0.12], [0.07, 0.07, 0.04], 8, 5), ...E([-0.15, 0.53, 0.12], [0.07, 0.07, 0.04], 8, 5)]], ["#FFF3E0", [...E([0, 0.2, 0.12], [0.22, 0.17, 0.22], 12, 7), ...E([0.13, 0.25, 0.26], [0.1, 0.09, 0.08], 8, 5), ...E([-0.13, 0.25, 0.26], [0.1, 0.09, 0.08], 8, 5)]],
  ["#F48FB1", [...E([0, 0.32, 0.335], [0.03, 0.025, 0.02], 6, 4), ...E([0.15, 0.53, 0.145], [0.04, 0.04, 0.02], 6, 4), ...E([-0.15, 0.53, 0.145], [0.04, 0.04, 0.02], 6, 4), ...[0.12, -0.12].flatMap((x) => E([x, 0.03, 0.22], [0.05, 0.03, 0.06], 6, 3)), ...[0.14, -0.14].flatMap((x) => E([x, 0.03, -0.18], [0.06, 0.03, 0.07], 6, 3))]], ...ogon(0.09, 0.38, 0.29, 0.035)]);
// marsvin (vitt med bruna och svarta fläckar)
await spara("marsvin", [[vi, E([0, 0.26, 0], [0.27, 0.24, 0.4], 14, 9)], ["#A0622D", [...E([0.05, 0.33, -0.18], [0.24, 0.2, 0.22], 12, 7), ...E([0.08, 0.36, 0.25], [0.2, 0.17, 0.17], 10, 6)]], [sv, [...E([-0.12, 0.34, -0.05], [0.17, 0.17, 0.16], 10, 6)]],
  ["#F8BBD0", [...E([0, 0.27, 0.4], [0.035, 0.025, 0.02], 6, 4), ...E([0.13, 0.46, 0.26], [0.05, 0.04, 0.02], 6, 4), ...E([-0.13, 0.46, 0.26], [0.05, 0.04, 0.02], 6, 4), ...[0.13, -0.13].flatMap((x) => [0.22, -0.2].flatMap((z) => E([x, 0.03, z], [0.05, 0.03, 0.06], 6, 3)))]], ...ogon(0.1, 0.35, 0.34, 0.035)]);
// snigel
{ const sp = [], rr = []; for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * 2.6 * 2 * Math.PI, R = 0.24 * (1 - t * 0.85); sp.push([0, 0.42 + R * Math.sin(a), -0.08 + R * Math.cos(a)]); rr.push(0.16 * (1 - t * 0.8) + 0.02); }
  const skal = ror(sp, rr, 12); const ff = { "#C66A2B": [], "#F0B36A": [] }; skal.forEach((t, k) => ff[Math.floor(k / 24) % 2 ? "#C66A2B" : "#F0B36A"].push(t));
  await spara("snigel", [...Object.entries(ff), ["#B5C99A", [...E([0, 0.08, 0.05], [0.14, 0.09, 0.5], 12, 7, 0), ...E([0, 0.16, 0.42], [0.11, 0.12, 0.13], 10, 6), ...ror([[0.05, 0.22, 0.47], [0.08, 0.38, 0.52]], [0.018, 0.015], 6), ...ror([[-0.05, 0.22, 0.47], [-0.08, 0.38, 0.52]], [0.018, 0.015], 6)]], [sv, [...E([0.08, 0.39, 0.52], [0.03, 0.03, 0.03], 6, 4), ...E([-0.08, 0.39, 0.52], [0.03, 0.03, 0.03], 6, 4)]], ["#7B5038", ror([[-0.05, 0.15, 0.55], [0, 0.135, 0.56], [0.05, 0.15, 0.55]], [0.01, 0.01, 0.01], 4)]]); }
// nyckelpiga
await spara("nyckelpiga", [["#E53935", E([0, 0.06, -0.02], [0.3, 0.26, 0.36], 14, 8, 0)], [sv, [...ror(Array.from({ length: 13 }, (_, i) => { const v = -Math.PI / 2 + (i / 12) * Math.PI; return [0, 0.06 + 0.262 * Math.cos(v), -0.02 + 0.362 * Math.sin(v)]; }), Array(13).fill(0.012), 4), ...E([0, 0.13, 0.36], [0.17, 0.12, 0.12], 10, 6), ...[[0.13, 0.22, 0.1], [-0.13, 0.22, 0.1], [0.18, 0.18, -0.15], [-0.18, 0.18, -0.15], [0.08, 0.27, -0.12], [-0.08, 0.27, -0.12], [0.1, 0.1, -0.3], [-0.1, 0.1, -0.3]].flatMap((p) => E(p, [0.055, 0.055, 0.055], 6, 4)), ...[0.15, 0, -0.15].flatMap((z) => [...ror([[0.2, 0.06, z], [0.32, 0.04, z + 0.03], [0.36, 0, z + 0.05]], [0.012, 0.012, 0.012], 4), ...ror([[-0.2, 0.06, z], [-0.32, 0.04, z + 0.03], [-0.36, 0, z + 0.05]], [0.012, 0.012, 0.012], 4)]), ...ror([[0.05, 0.2, 0.42], [0.1, 0.32, 0.5]], [0.01, 0.01], 4), ...ror([[-0.05, 0.2, 0.42], [-0.1, 0.32, 0.5]], [0.01, 0.01], 4)]], [vi, [...E([0.07, 0.16, 0.465], [0.03, 0.03, 0.02], 6, 4), ...E([-0.07, 0.16, 0.465], [0.03, 0.03, 0.02], 6, 4)]]]);
// sjöstjärna, stående med ansikte
{ const t = [], n = 5, R = 0.5, r = 0.2, cy = 0.45, d = 0.09, pt = (k) => { const a = Math.PI / 2 + (k * Math.PI) / n, rr = k % 2 ? r : R; return [rr * Math.cos(a), cy + rr * Math.sin(a)]; };
  for (let k = 0; k < 2 * n; k++) { const a = pt(k), b = pt(k + 1); t.push([[0, cy, d], [a[0], a[1], d * 0.25], [b[0], b[1], d * 0.25]], [[0, cy, -d], [b[0], b[1], -d * 0.25], [a[0], a[1], -d * 0.25]]); t.push(...quad([a[0], a[1], -d * 0.25], [b[0], b[1], -d * 0.25], [b[0], b[1], d * 0.25], [a[0], a[1], d * 0.25])); }
  const rot = (p) => { const w = Math.PI / 5, c = Math.cos(w), s = Math.sin(w), x = p[0], y = p[1] - cy; return [x * c - y * s, cy + x * s + y * c, p[2]]; };
  const st = t.map((tr) => tr.map((p) => { const q = rot(p); return [q[0], q[1] - (cy - 0.5 * Math.cos(Math.PI / 5)) + 0.0, q[2]]; }));
  const ymin = Math.min(...st.flat().map((p) => p[1])); const st2 = st.map((tr) => tr.map((p) => [p[0], p[1] - ymin, p[2]]));
  await spara("sjostjarna", [["#FF8A50", st2], ["#FFCCBC", [[0.2, 0.75], [-0.25, 0.7], [0.3, 0.35], [-0.3, 0.3], [0, 0.95]].flatMap(([x, y]) => E([x, y, 0.06], [0.025, 0.025, 0.02], 5, 3))], ...ogon(0.07, 0.62, 0.075, 0.04), [sv, ror([[-0.07, 0.5, 0.08], [0, 0.46, 0.085], [0.07, 0.5, 0.08]], [0.012, 0.012, 0.012], 4)]]); }
// humla
{ const kr = E([0, 0.45, -0.05], [0.25, 0.24, 0.32], 14, 9), ff = { "#FDD835": [], "#212121": [] }; for (const tr of kr) { const z = (tr[0][2] + tr[1][2] + tr[2][2]) / 3; ff[(z > 0.12) || (z < -0.02 && z > -0.14) ? "#212121" : "#FDD835"].push(tr); }
  await spara("humla", [...Object.entries(ff), [sv, [...E([0, 0.47, 0.3], [0.15, 0.14, 0.12], 10, 6), ...cyl([0, 0.45, -0.39], 0.03, 0.08, 6, "z", 0.005).map((t) => t.map(([x, y, z]) => [x, y, -0.37 - (z + 0.39)])), ...[0.1, 0, -0.1].flatMap((z) => [...ror([[0.12, 0.3, z], [0.18, 0.1, z + 0.03], [0.2, 0, z + 0.05]], [0.015, 0.012, 0.01], 4), ...ror([[-0.12, 0.3, z], [-0.18, 0.1, z + 0.03], [-0.2, 0, z + 0.05]], [0.015, 0.012, 0.01], 4)]), ...ror([[0.05, 0.57, 0.37], [0.1, 0.7, 0.42]], [0.01, 0.01], 4), ...ror([[-0.05, 0.57, 0.37], [-0.1, 0.7, 0.42]], [0.01, 0.01], 4)]], ["#D6EEFF", [...E([0.22, 0.72, -0.05], [0.24, 0.02, 0.13], 10, 3), ...E([-0.22, 0.72, -0.05], [0.24, 0.02, 0.13], 10, 3)]], [vi, [...E([0.06, 0.5, 0.41], [0.03, 0.035, 0.02], 6, 4), ...E([-0.06, 0.5, 0.41], [0.03, 0.035, 0.02], 6, 4)]]]); }
// krokodil och ödla (samma byggare)
function odla(f, mage, { L: LL = 1, h = 1, tand = true, tagg = true } = {}) {
  const s = (p) => [p[0] * h, p[1] * h, p[2] * LL];
  const kropp = E([0, 0.24, 0], [0.3, 0.18, 0.6], 14, 8).map((t) => t.map(s));
  const svans = ror([[0, 0.22, -0.5], [0, 0.17, -0.9], [0, 0.12, -1.3], [0.05, 0.08, -1.6]].map(s), [0.17, 0.13, 0.08, 0.02].map((r) => r * h), 10);
  const huvud = [...E([0, 0.25, 0.65], [0.2, 0.13, 0.22], 12, 7), ...L([0, 0.2, 0.95], [0.26, 0.11, 0.45]), ...E([0.09, 0.36, 0.7], [0.06, 0.06, 0.06], 6, 4), ...E([-0.09, 0.36, 0.7], [0.06, 0.06, 0.06], 6, 4)].map((t) => t.map(s));
  const ben = [0.25, -0.25].flatMap((x) => [0.35, -0.3].flatMap((z) => ror([[x * 0.8, 0.2, z], [x * 1.4, 0.12, z + 0.03], [x * 1.45, 0, z + 0.08]].map(s), [0.07, 0.06, 0.05].map((r) => r * h), 6)));
  const d = [[f, [...kropp, ...svans, ...huvud, ...ben]], [mage, [...E([0, 0.12, 0.05], [0.25, 0.08, 0.5], 12, 5).map((t) => t.map(s))]], ...ogon(0.1, 0.4, 0.73, 0.03).map(([c, t]) => [c, t.map((tr) => tr.map(s))])];
  if (tand) d.push([vi, [0.12, -0.12].flatMap((x) => [0.8, 0.92, 1.04, 1.13].flatMap((z) => [[[x, 0.15, z - 0.03], [x, 0.15, z + 0.03], [x, 0.11, z]], [[x, 0.15, z - 0.03], [x, 0.11, z], [x, 0.15, z + 0.03]]].map((tr) => tr.map(s))))]);
  if (tagg) d.push([mage === "#C5E1A5" ? "#33691E" : "#2E4F1E", [0.3, 0.1, -0.1, -0.3, -0.6, -0.9].flatMap((z) => [[[0, 0.42 - Math.max(0, -z) * 0.15, z - 0.06], [0, 0.42 - Math.max(0, -z) * 0.15, z + 0.06], [0, 0.5 - Math.max(0, -z) * 0.15, z]], [[0, 0.42 - Math.max(0, -z) * 0.15, z - 0.06], [0, 0.5 - Math.max(0, -z) * 0.15, z], [0, 0.42 - Math.max(0, -z) * 0.15, z + 0.06]]].map((tr) => tr.map(s)))]);
  return d;
}
await spara("krokodil", odla("#4E7D32", "#C5E1A5"));
await spara("odla", odla("#7CB342", "#FFF59D", { L: 0.7, h: 0.6, tand: false, tagg: false }));
// stork
{ const ben = [0.08, -0.08].flatMap((x) => [...ror([[x, 0.62, -0.02], [x, 0.32, 0.02], [x, 0, 0]], [0.018, 0.016, 0.016], 6), ...E([x, 0.01, 0.06], [0.04, 0.01, 0.08], 6, 3)]);
  await spara("stork", [[vi, [...E([0, 0.8, 0], [0.2, 0.2, 0.34], 12, 8), ...ror([[0, 0.9, 0.2], [0, 1.12, 0.28], [0, 1.3, 0.26]], [0.07, 0.055, 0.05], 8), ...E([0, 1.33, 0.27], [0.08, 0.08, 0.09], 8, 6)]], [sv, [...E([0.13, 0.82, -0.1], [0.1, 0.13, 0.3], 8, 6), ...E([-0.13, 0.82, -0.1], [0.1, 0.13, 0.3], 8, 6), ...E([0, 0.78, -0.35], [0.12, 0.06, 0.12], 8, 4)]], ["#E53935", [...ben, ...cyl([0, 1.32, 0.33], 0.035, 0.32, 8, "z", 0.005)]], ...ogon(0.05, 1.36, 0.32, 0.018)]); }
// struts
{ const ben = [0.11, -0.11].flatMap((x) => [...E([x, 0.82, 0.02], [0.08, 0.14, 0.09], 8, 5), ...ror([[x, 0.72, 0.03], [x, 0.38, 0.06], [x, 0, 0.04]], [0.04, 0.03, 0.03], 6), ...E([x, 0.02, 0.1], [0.06, 0.02, 0.1], 6, 3)]);
  await spara("struts", [["#2B2B2B", [...E([0, 1.0, -0.02], [0.32, 0.27, 0.42], 12, 8)]], [vi, [...E([0, 1.08, -0.42], [0.22, 0.16, 0.12], 10, 6), ...E([0.3, 1.02, -0.12], [0.05, 0.12, 0.18], 6, 4), ...E([-0.3, 1.02, -0.12], [0.05, 0.12, 0.18], 6, 4)]], ["#E8B9A8", [...ben, ...ror([[0, 1.12, 0.3], [0, 1.45, 0.38], [0, 1.75, 0.36]], [0.05, 0.04, 0.035], 8), ...E([0, 1.79, 0.38], [0.07, 0.07, 0.08], 8, 6)]], ["#F5D0A0", cyl([0, 1.78, 0.44], 0.03, 0.09, 6, "z", 0.012)], ...ogon(0.045, 1.82, 0.42, 0.022)]); }
// kamel (dromedar)
{ const f = "#D7A86E";
  await spara("kamel", [[f, [...E([0, 1.1, 0], [0.3, 0.28, 0.6], 12, 8), ...E([0, 1.38, -0.02], [0.22, 0.22, 0.3], 10, 7), ...ror([[0, 1.2, 0.5], [0, 1.4, 0.72], [0, 1.65, 0.82]], [0.11, 0.09, 0.08], 8), ...E([0, 1.7, 0.92], [0.1, 0.1, 0.17], 8, 6), ...E([0.07, 1.8, 0.86], [0.03, 0.04, 0.02], 5, 3), ...E([-0.07, 1.8, 0.86], [0.03, 0.04, 0.02], 5, 3), ...ror([[0, 1.15, -0.58], [0, 0.95, -0.66], [0, 0.75, -0.66]], [0.03, 0.025, 0.02], 6)]], ["#B8895A", [0.17, -0.17].flatMap((x) => [0.4, -0.38].flatMap((z) => [...ror([[x, 0.95, z], [x, 0.5, z + 0.02], [x, 0.05, z]], [0.07, 0.05, 0.05], 6), ...E([x, 0.5, z + 0.02], [0.065, 0.06, 0.065], 6, 4), ...E([x, 0.03, z + 0.03], [0.07, 0.03, 0.09], 6, 3)]))], ["#5D4037", [...E([0, 1.68, 1.08], [0.06, 0.04, 0.03], 6, 3), ...E([0, 0.75, -0.66], [0.04, 0.06, 0.04], 6, 4)]], ...ogon(0.08, 1.77, 0.98, 0.025)]); }
// känguru med unge i pungen
{ const f = "#C9864B", lj = "#EBC9A0";
  await spara("kanguru", [[f, [...E([0, 0.75, -0.05], [0.25, 0.4, 0.24], 12, 8), ...E([0, 1.28, 0.08], [0.15, 0.15, 0.17], 10, 7), ...E([0.08, 1.48, 0.03], [0.045, 0.14, 0.03], 6, 5), ...E([-0.08, 1.48, 0.03], [0.045, 0.14, 0.03], 6, 5), ...ror([[0, 0.5, -0.25], [0, 0.25, -0.5], [0, 0.07, -0.85]], [0.12, 0.09, 0.05], 8), ...[0.2, -0.2].flatMap((x) => [...E([x, 0.42, -0.02], [0.11, 0.22, 0.2], 8, 6), ...E([x, 0.04, 0.12], [0.07, 0.04, 0.24], 6, 4), ...ror([[x * 0.6, 0.95, 0.15], [x * 0.7, 0.8, 0.28], [x * 0.6, 0.72, 0.3]], [0.035, 0.03, 0.03], 6)])]], [lj, [...E([0, 0.68, 0.12], [0.17, 0.25, 0.1], 10, 6), ...E([0, 1.22, 0.22], [0.07, 0.06, 0.08], 6, 4)]], [f, [...E([0, 0.8, 0.2], [0.07, 0.07, 0.07], 8, 5), ...E([0.03, 0.88, 0.2], [0.02, 0.05, 0.02], 4, 3), ...E([-0.03, 0.88, 0.2], [0.02, 0.05, 0.02], 4, 3)]], [sv, [...E([0, 1.24, 0.3], [0.03, 0.02, 0.02], 5, 3), ...E([0.025, 0.81, 0.265], [0.01, 0.01, 0.01], 4, 3), ...E([-0.025, 0.81, 0.265], [0.01, 0.01, 0.01], 4, 3)]], ...ogon(0.06, 1.32, 0.22, 0.025)]); }
console.log("klart");
