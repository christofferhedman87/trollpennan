// R3F-M23: egna lågpolymodeller för musik (instrument) (Trollpennan, CC0). +y upp, +z fram, står på y=0. Kör från en mapp med @gltf-transform och sharp.
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, unpartition, mergeDocuments } from "@gltf-transform/functions";
import sharp from "sharp";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const I = "/workspace/modell-inkorg";
const UT = process.env.UT ?? `${I}/trollpennan-musik-m23`;
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

// ---------- hjälp (som i M21)
const tra = "#A1887F", mtra = "#6D4C41", met = "#B0BEC5", sv = "#212121", vit = "#FAFAFA";
const flytta = (t, [dx, dy, dz]) => t.map((tri) => tri.map(([x, y, z]) => [x + dx, y + dy, z + dz]));
const skala = (t, [sx, sy, sz], [cx, cy, cz] = [0, 0, 0]) => t.map((tri) => tri.map(([x, y, z]) => [cx + (x - cx) * sx, cy + (y - cy) * sy, cz + (z - cz) * sz]));
const rotX = (t, a) => t.map((tri) => tri.map(([x, y, z]) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)]));
const rotY = (t, a) => t.map((tri) => tri.map(([x, y, z]) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)]));
const rotZ = (t, a) => t.map((tri) => tri.map(([x, y, z]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z]));
const par = (fn) => [...fn(0.1, 1), ...fn(-0.1, -1)];
const box = (c, s, rz = 0, ry = 0) => flytta(rotY(rotZ(L([0, 0, 0], s), rz), ry), c);
const guld = "#FFC107", silver = "#CFD8DC", morkTra = "#5D4037", rodTra = "#8D4A2F";
// svarvad form längs x (profil [[r, x], …])
const varvX = (prof, n, [cy, cz] = [0, 0], x0 = 0) => flytta(rotZ(varv(prof, n), -Math.PI / 2), [x0, cy, cz]);
// fiolkropp (fiol, cello, kontrabas, ukulele, gitarr): upprätt i xy-planet, djup längs z
function strakKropp(h, f, { midja = 0.72, djup = 0.12, hals = 0.45, nackf = morkTra, hal = true, strangar = 4, fhal = false } = {}) {
  const ru = h * 0.3, ro = ru * midja;
  const d = [[f, [...E([0, ru * 1.05, 0], [ru, ru * 1.05, djup / 2], 14, 6), ...E([0, ru * 2.0 + ro * 0.5, 0], [ro, ro * 1.0, djup / 2], 14, 6)]]];
  const topp = ru * 2.0 + ro * 1.4, nl = h * hals;
  d.push([nackf, [...L([0, topp + nl / 2 - 0.02, -0.0], [h * 0.06, nl, djup * 0.35]), ...E([0, topp + nl + h * 0.03, 0], [h * 0.04, h * 0.05, djup * 0.3], 8, 4), ...L([0, ru * 1.4 + (topp + nl - ru * 1.4) / 2, djup / 2 + 0.006], [h * 0.05, topp + nl - ru * 1.4, 0.008])]]);
  if (hal) d.push([sv, E([0, ru * 1.6, djup / 2 + 0.002], [ru * 0.25, ru * 0.25, 0.006], 10, 3)]);
  if (fhal) d.push([sv, [...L([ru * 0.4, ru * 1.3, djup / 2 + 0.002], [0.012, ru * 0.5, 0.006]), ...L([-ru * 0.4, ru * 1.3, djup / 2 + 0.002], [0.012, ru * 0.5, 0.006])]]);
  d.push(["#ECEFF1", Array.from({ length: strangar }, (_, i) => (i - (strangar - 1) / 2) * h * 0.012).flatMap((x) => L([x, ru * 0.6 + (topp + nl - ru * 0.6) / 2, djup / 2 + 0.014], [0.004, topp + nl - ru * 0.6, 0.004]))]);
  d.push([sv, L([0, ru * 0.6, djup / 2 + 0.008], [h * 0.1, 0.02, 0.012])]);
  return d;
}
const tangenter = (x0, x1, y, z, djup = 0.12) => { const n = Math.round((x1 - x0) / 0.04), v = [], s = [];
  for (let i = 0; i < n; i++) { const x = x0 + 0.02 + i * 0.04; v.push(...L([x, y, z], [0.036, 0.03, djup])); if ([0, 1, 3, 4, 5].includes(i % 7) && i < n - 1) s.push(...L([x + 0.02, y + 0.03, z - djup * 0.2], [0.022, 0.03, djup * 0.6])); }
  return [[vit, v], [sv, s]]; };

// ---------- musik
// piano: brunt pianino med tangenter, noter och pall
await spara("piano", [[morkTra, [...L([0, 0.45, -0.1], [0.9, 0.9, 0.24]), ...L([0, 0.5, 0.06], [0.9, 0.06, 0.2]), ...[0.42, -0.42].flatMap((x) => L([x, 0.25, 0.1], [0.05, 0.5, 0.06]))]], ...tangenter(-0.4, 0.4, 0.545, 0.07, 0.16), [vit, flytta(rotX(L([0, 0, 0], [0.3, 0.2, 0.01]), -0.2), [0, 0.78, 0.03])], [sv, [...[-0.08, 0, 0.08].map((x) => E([x, 0.76, 0.045], [0.012, 0.01, 0.006], 6, 3)).flat()]], [sv, [...L([0, 0.3, 0.55], [0.4, 0.05, 0.25]), ...[[0.17, 0.45], [-0.17, 0.45], [0.17, 0.65], [-0.17, 0.65]].flatMap(([x, z]) => cyl([x, 0, z], 0.02, 0.28, 6))]]]);
// flöjt: silverflöjt (tvärflöjt) på ett litet stöd
await spara("flojt", [[silver, [...cylX([0, 0.16, 0], 0.022, 0.7, 10), ...Array.from({ length: 8 }, (_, i) => -0.15 + i * 0.06).flatMap((x) => cyl([x, 0.18, 0], 0.016, 0.012, 8))]], [sv, [...E([-0.28, 0.181, 0], [0.014, 0.004, 0.01], 6, 3)]], [mtra, [...[0.22, -0.22].flatMap((x) => [...L([x, 0.06, 0], [0.04, 0.12, 0.04]), ...L([x, 0.01, 0], [0.12, 0.02, 0.12]), ...L([x, 0.13, 0], [0.02, 0.04, 0.06])])]]]);
// fiol: fiol (violin) med stråke
await spara("fiol", [...strakKropp(0.62, rodTra, { fhal: true, hal: false }), [mtra, [...ror([[0.2, 0.02, 0.05], [0.25, 0.6, 0.05]], [0.008, 0.008], 4), ...L([0.205, 0.06, 0.05], [0.03, 0.05, 0.02])]], ["#ECEFF1", ror([[0.215, 0.05, 0.065], [0.262, 0.58, 0.065]], [0.004, 0.004], 3)]]);
// xylofon: xylofon med åtta färgade stavar och två klubbor
{ const C = ["#E53935", "#FB8C00", "#FDD835", "#7CB342", "#43A047", "#1E88E5", "#3949AB", "#8E24AA"];
  await spara("xylofon", [[tra, [...flytta(rotY(L([0, 0.05, 0], [0.62, 0.06, 0.03]), 0.12), [0, 0, 0.12]), ...flytta(rotY(L([0, 0.05, 0], [0.62, 0.06, 0.03]), -0.12), [0, 0, -0.12])]], ...C.map((f, i) => [f, L([-0.26 + i * 0.075, 0.095, 0], [0.06, 0.03, 0.34 - i * 0.025])]), [mtra, [...ror([[0.1, 0.12, 0.28], [0.35, 0.13, 0.32]], [0.008, 0.008], 4), ...ror([[0.05, 0.12, 0.33], [0.3, 0.13, 0.42]], [0.008, 0.008], 4)]], ["#E53935", [...E([0.1, 0.12, 0.28], [0.025, 0.025, 0.025], 6, 4), ...E([0.05, 0.12, 0.33], [0.025, 0.025, 0.025], 6, 4)]], [vit, C.flatMap((_, i) => [E([-0.26 + i * 0.075, 0.112, 0.12 - i * 0.008], [0.008, 0.006, 0.008], 4, 2), E([-0.26 + i * 0.075, 0.112, -0.12 + i * 0.008], [0.008, 0.006, 0.008], 4, 2)])]]); }
// trumpet: guldtrumpet i profil med tre ventiler
await spara("trumpet", [[guld, [...varvX([[0.02, 0], [0.025, 0.12], [0.05, 0.2], [0.11, 0.25], [0.11, 0.255], [0.02, 0.255]], 16, [0.13, 0], 0.12), ...cylX([0.02, 0.13, 0], 0.02, 0.24, 8), ...ror([[-0.1, 0.13, 0], [-0.17, 0.13, 0], [-0.2, 0.07, 0], [-0.17, 0.03, 0], [0.12, 0.03, 0], [0.15, 0.07, 0], [0.13, 0.11, 0]], [0.018, 0.018, 0.018, 0.018, 0.018, 0.018, 0.018], 6), ...cylX([-0.25, 0.13, 0], 0.016, 0.12, 8), ...varvX([[0.02, 0], [0.028, 0.03], [0.008, 0.04], [0, 0.04]], 8, [0.13, 0], -0.36)]], [silver, [...[-0.03, 0.02, 0.07].flatMap((x) => [...cyl([x, 0.03, 0], 0.02, 0.14, 8), ...cyl([x, 0.17, 0], 0.012, 0.03, 6), ...cyl([x, 0.2, 0], 0.022, 0.012, 8)])]]]);
// tamburin: tamburin med bjällror, stående på kant
await spara("tamburin", [["#E53935", flytta(cylZ([0, 0, 0], 0.2, 0.06, 20), [0, 0.21, 0])], ["#FFF3E0", flytta(cylZ([0, 0, 0.031], 0.185, 0.004, 20), [0, 0.21, 0])], [guld, Array.from({ length: 8 }, (_, i) => (i / 8) * 2 * Math.PI + 0.2).flatMap((a) => cylZ([0.2 * Math.cos(a), 0.21 + 0.2 * Math.sin(a), 0], 0.03, 0.012, 8).concat(cylZ([0.2 * Math.cos(a), 0.21 + 0.2 * Math.sin(a), 0.015], 0.03, 0.012, 8)))], ["#FDD835", [...E([0, 0.21, 0.035], [0.05, 0.05, 0.004], 8, 3)]]]);
// maracas: två randiga maracas i kors
{ const mar = (a, x, f, f2) => [[f, flytta(rotZ([...E([0, 0.3, 0], [0.09, 0.11, 0.09], 10, 8)], a), [x, 0, 0])], [f2, flytta(rotZ([...cyl([0, 0.29, 0], 0.092, 0.03, 10), ...E([0, 0.41, 0], [0.02, 0.012, 0.02], 6, 3)], a), [x, 0, 0])], [tra, flytta(rotZ(cyl([0, 0, 0], 0.022, 0.2, 8), a), [x, 0, 0])]];
  await spara("maracas", [...mar(0.35, 0.08, "#FB8C00", "#43A047"), ...mar(-0.35, -0.08, "#8E24AA", "#FDD835").map(([f, t]) => [f, flytta(t, [0, 0, -0.04])])]); }
// dragspel: rött dragspel med bälg, tangenter och knappar
{ const balg = []; for (let i = 0; i < 6; i++) balg.push(...box([-0.15 + i * 0.06, 0.24, 0], [0.03, 0.4, 0.2], 0, 0), ...box([-0.12 + i * 0.06, 0.24, 0], [0.03, 0.36, 0.18], 0, 0));
  await spara("dragspel", [["#C62828", [...L([0.26, 0.24, 0], [0.16, 0.46, 0.22]), ...L([-0.26, 0.24, 0], [0.12, 0.46, 0.22])]], [sv, balg.slice(0, balg.length / 2)], [vit, balg.slice(balg.length / 2)], ...tangenter(0.2, 0.36, 0, 0, 0.04).map(([f, t]) => [f, rotZ(t, Math.PI / 2).map((tri) => tri.map(([x, y, z]) => [x + 0.185, y + 0.05, z + 0.11]))]), [vit, [...Array.from({ length: 12 }, (_, i) => E([-0.26 + (i % 3) * 0.035 - 0.035, 0.12 + Math.floor(i / 3) * 0.08, 0.112], [0.012, 0.012, 0.006], 6, 3)).flat()]], [guld, [...L([0.26, 0.24, 0.112], [0.1, 0.03, 0.004]), ...L([-0.26, 0.42, 0.112], [0.08, 0.03, 0.004])]]]); }
// ukulele: liten gul ukulele
await spara("ukulele", [...strakKropp(0.5, "#FFB74D", { midja: 0.8, strangar: 4, hals: 0.35 })]);
// munspel: munspel i silver med hål och blå sidor
await spara("munspel", [[silver, [...L([0, 0.04, 0], [0.4, 0.035, 0.1]), ...L([0, 0.1, 0], [0.4, 0.035, 0.1])]], ["#1E88E5", L([0, 0.07, -0.005], [0.38, 0.03, 0.09])], [sv, Array.from({ length: 10 }, (_, i) => L([-0.17 + i * 0.038, 0.07, 0.042], [0.02, 0.02, 0.006])).flat()], [vit, L([0, 0.1, 0.05], [0.22, 0.02, 0.004])]]);
// harpa: guldharpa med strängar
await spara("harpa", [[guld, [...ror([[-0.2, 0.05, 0], [-0.22, 0.5, 0], [-0.15, 0.95, 0]], [0.04, 0.035, 0.03], 8), ...ror([[-0.15, 0.95, 0], [0.0, 0.92, 0], [0.12, 0.75, 0], [0.22, 0.55, 0], [0.28, 0.42, 0]], [0.03, 0.03, 0.03, 0.03, 0.03], 8), ...L([0.05, 0.03, 0], [0.55, 0.06, 0.18])]], [rodTra, [...ror([[-0.18, 0.08, 0], [0.28, 0.42, 0]], [0.05, 0.04], 8)]], ["#ECEFF1", Array.from({ length: 9 }, (_, i) => i).flatMap((i) => { const t = (i + 0.7) / 10, xb = -0.18 + t * 0.46, yb = 0.08 + t * 0.34; const yt = t < 0.33 ? 0.95 - t * 0.1 : t < 0.7 ? 0.92 - (t - 0.33) * 0.6 : 0.7 - (t - 0.7) * 0.9; return ror([[xb, yb, 0], [xb, yt, 0]], [0.004, 0.004], 3); })]]);
// cello: stor cello med pigg och stråke
await spara("cello", [...strakKropp(1.15, rodTra, { fhal: true, hal: false, djup: 0.2 }), [mtra, [...ror([[0.36, 0.02, 0.08], [0.42, 0.95, 0.08]], [0.01, 0.01], 4), ...L([0.365, 0.07, 0.08], [0.04, 0.06, 0.03])]]].map(([f, t]) => [f, flytta(t, [0, 0.06, 0])]).concat([[silver, cyl([0, 0, 0], 0.01, 0.07, 6)]]));
// saxofon: guldsaxofon med klaffar
await spara("saxofon", [[guld, [...ror([[0, 0.95, -0.04], [0, 0.88, 0], [0, 0.7, 0], [0, 0.3, 0], [0.02, 0.12, 0], [0.1, 0.06, 0], [0.18, 0.12, 0], [0.2, 0.3, 0]], [0.025, 0.03, 0.035, 0.045, 0.05, 0.055, 0.06, 0.065], 10), ...varv([[0.065, 0], [0.08, 0.1], [0.13, 0.16], [0.13, 0.17], [0.07, 0.17]], 14, [0.2, 0]).map((tri) => tri.map(([x, y, z]) => [x, y + 0.28, z])), ...ror([[0, 0.95, -0.04], [0, 1.0, -0.12]], [0.02, 0.012], 6)]], [silver, [0.35, 0.45, 0.55, 0.65, 0.75].flatMap((y) => E([0.0, y, 0.045], [0.025, 0.025, 0.012], 6, 3))], [sv, ror([[0, 1.0, -0.12], [0, 1.02, -0.17]], [0.012, 0.006], 5)], [mtra, [...L([0.08, 0.01, 0], [0.4, 0.02, 0.2])]]]);
// banjo: banjo med rund vit trumma och lång hals
await spara("banjo", [[silver, flytta(cylZ([0, 0, 0], 0.17, 0.07, 18), [0, 0.18, 0])], ["#FFF8E1", flytta(cylZ([0, 0, 0.036], 0.155, 0.004, 18), [0, 0.18, 0])], [morkTra, [...L([0, 0.6, 0], [0.04, 0.6, 0.03]), ...L([0, 0.93, 0], [0.07, 0.1, 0.03])]], ["#ECEFF1", [-0.012, -0.004, 0.004, 0.012].flatMap((x) => L([x, 0.55, 0.045], [0.003, 0.74, 0.003]))], [sv, L([0, 0.13, 0.042], [0.06, 0.012, 0.01])]]);
// trombon: trombon i profil med drag och klocka, på stöd
await spara("trombon", [[guld, [...varvX([[0.018, 0], [0.03, 0.15], [0.06, 0.24], [0.11, 0.28], [0.11, 0.285], [0.02, 0.285]], 16, [0.32, 0], 0.15), ...cylX([0.0, 0.32, 0], 0.015, 0.3, 8), ...cylX([-0.2, 0.22, 0], 0.013, 0.6, 8), ...cylX([-0.2, 0.28, 0], 0.013, 0.6, 8), ...ror([[-0.5, 0.22, 0], [-0.53, 0.25, 0], [-0.5, 0.28, 0]], [0.013, 0.013, 0.013], 6), ...ror([[0.1, 0.22, 0], [0.18, 0.25, 0], [0.15, 0.32, 0]], [0.013, 0.013, 0.013], 6)]], [silver, [...L([-0.1, 0.25, 0], [0.02, 0.07, 0.02]), ...cylX([-0.12, 0.32, 0], 0.01, 0.1, 6)]], [sv, [...cyl([0.0, 0, 0], 0.01, 0.22, 4), ...cyl([-0.35, 0, 0], 0.01, 0.22, 4), ...L([-0.17, 0.005, 0], [0.5, 0.01, 0.12])]]]);
// tuba: stor guldtuba med klockan uppåt
await spara("tuba", [[guld, [...varv([[0.05, 0.4], [0.08, 0.6], [0.14, 0.72], [0.22, 0.78], [0.22, 0.79], [0.07, 0.79]], 18), ...varv([[0, 0.05], [0.1, 0.05], [0.12, 0.15], [0.1, 0.35], [0.07, 0.42], [0, 0.42]], 14), ...ring([0, 0.32, 0.0], 0.15, 0.035, "zy", 16).map((t) => t), ...ror([[0.0, 0.2, 0.1], [0.12, 0.35, 0.14], [0.08, 0.5, 0.14]], [0.025, 0.025, 0.025], 6)]], [silver, [-0.04, 0.0, 0.04].flatMap((x) => cyl([x + 0.1, 0.4, 0.14], 0.02, 0.14, 8))], [sv, L([0, 0.01, 0], [0.3, 0.02, 0.3])]]);
// kontrabas: jättestor kontrabas
await spara("kontrabas", [...strakKropp(1.6, "#6D4C41", { fhal: true, hal: false, djup: 0.26, midja: 0.7 })].map(([f, t]) => [f, flytta(t, [0, 0.08, 0])]).concat([[silver, cyl([0, 0, 0], 0.014, 0.09, 6)]]));
// cymbal: cymbal på stativ
await spara("cymbal", [[guld, varv([[0, 0.79], [0.08, 0.785], [0.28, 0.75], [0.28, 0.745], [0.08, 0.775], [0, 0.78]], 22)], [silver, [...cyl([0, 0.0, 0], 0.016, 0.8, 8), ...[0, 2.1, 4.2].flatMap((a) => ror([[0, 0.25, 0], [0.25 * Math.cos(a), 0.0, 0.25 * Math.sin(a)]], [0.012, 0.012], 4))]], [sv, cyl([0, 0.79, 0], 0.03, 0.03, 8)]]);
// keyboard: keyboard på ett X-stativ
await spara("keyboard", [[sv, [...L([0, 0.62, 0], [0.9, 0.06, 0.24]), ...[0.3, -0.3].flatMap((x) => [...flytta(rotX(L([0, 0, 0], [0.03, 0.03, 0.8]), 0.9), [x, 0.3, 0]), ...flytta(rotX(L([0, 0, 0], [0.03, 0.03, 0.8]), -0.9), [x, 0.3, 0])])]], ...tangenter(-0.4, 0.4, 0.665, 0.03, 0.14), ["#4FC3F7", L([0.2, 0.655, -0.09], [0.12, 0.012, 0.04])], ["#E53935", [-0.3, -0.25, -0.2].map((x) => cyl([x, 0.65, -0.09], 0.012, 0.012, 6)).flat()]]);
// notställ: notställ med noter
await spara("notstall", [[sv, [...cyl([0, 0.1, 0], 0.012, 0.8, 6), ...[0, 2.1, 4.2].flatMap((a) => ror([[0, 0.2, 0], [0.22 * Math.cos(a), 0.0, 0.22 * Math.sin(a)]], [0.01, 0.01], 4)), ...flytta(rotX(L([0, 0, 0], [0.46, 0.32, 0.01]), -0.3), [0, 1.0, 0]), ...flytta(rotX(L([0, -0.16, 0.03], [0.46, 0.02, 0.06]), -0.3), [0, 1.0, 0])]], [vit, flytta(rotX(L([0, 0, 0.01], [0.4, 0.28, 0.006]), -0.3), [0, 1.0, 0])], [sv, flytta(rotX([...[-0.08, -0.03, 0.02, 0.07].flatMap((y) => L([0, y, 0.014], [0.36, 0.003, 0.003])), ...[[-0.1, -0.06], [0.0, -0.01], [0.1, 0.04], [-0.05, 0.08]].flatMap(([x, y]) => [...E([x, y, 0.015], [0.014, 0.01, 0.004], 6, 3), ...L([x + 0.012, y + 0.035, 0.015], [0.004, 0.07, 0.003])])], -0.3), [0, 1.0, 0])]]);
// skivspelare: skivspelare med svart skiva och tonarm
await spara("skivspelare", [[tra, [...L([0, 0.06, 0], [0.5, 0.12, 0.4])]], [silver, [...cyl([-0.05, 0.12, 0], 0.17, 0.015, 20), ...cyl([0.18, 0.12, -0.12], 0.025, 0.04, 8), ...flytta(rotY(L([0, 0, 0], [0.012, 0.012, 0.26]), -0.5), [0.12, 0.165, -0.0])]], [sv, cyl([-0.05, 0.135, 0], 0.16, 0.01, 20)], ["#E53935", cyl([-0.05, 0.145, 0], 0.05, 0.004, 12)], [vit, [...[0.12, 0.18].map((x) => cyl([x, 0.12, 0.15], 0.018, 0.012, 8)).flat()]]]);
// bongotrumma: två bongotrummor ihop
await spara("bongotrumma", [["#FB8C00", [...varv([[0, 0], [0.09, 0], [0.13, 0.3], [0, 0.3]], 14, [0.12, 0]), ...varv([[0, 0], [0.07, 0], [0.1, 0.26], [0, 0.26]], 14, [-0.11, 0])]], ["#FFF3E0", [...varv([[0, 0.3], [0.135, 0.3], [0.135, 0.31], [0, 0.31]], 14, [0.12, 0]), ...varv([[0, 0.26], [0.105, 0.26], [0.105, 0.27], [0, 0.27]], 14, [-0.11, 0])]], [sv, [...varv([[0.133, 0.27], [0.14, 0.27], [0.14, 0.3], [0.133, 0.3]], 14, [0.12, 0]), ...varv([[0.1, 0.23], [0.107, 0.23], [0.107, 0.26], [0.1, 0.26]], 14, [-0.11, 0]), ...L([0, 0.18, 0], [0.06, 0.06, 0.06])]], [guld, [...[0, 1, 2, 3, 4, 5].flatMap((i) => { const a = (i / 6) * 2 * Math.PI; return [L([0.12 + 0.12 * Math.cos(a), 0.2, 0.12 * Math.sin(a)], [0.012, 0.12, 0.012])]; }).flat()]]]);
// panflöjt: panflöjt av bambu med band
await spara("panflojt", [["#D7CCC8", Array.from({ length: 7 }, (_, i) => cyl([-0.15 + i * 0.05, 0, 0], 0.023, 0.42 - i * 0.045, 10)).flat()], ["#E53935", [...L([0, 0.12, 0], [0.36, 0.03, 0.055]), ...L([0, 0.06, 0], [0.36, 0.03, 0.055])]], [mtra, Array.from({ length: 7 }, (_, i) => cyl([-0.15 + i * 0.05, 0.42 - i * 0.045, 0], 0.014, 0.003, 8)).flat()]]);
// triangel: triangel som hänger i ett stativ, med pinne
await spara("triangel", [[silver, [...ror([[-0.15, 0.2, 0], [0.15, 0.2, 0], [0.0, 0.48, 0], [-0.14, 0.22, 0]], [0.012, 0.012, 0.012, 0.012], 6), ...ror([[0.25, 0.08, 0.1], [0.05, 0.3, 0.1]], [0.008, 0.008], 4)]], [mtra, [...L([0.0, 0.01, 0], [0.4, 0.02, 0.16]), ...L([-0.18, 0.3, 0], [0.025, 0.6, 0.025]), ...L([-0.08, 0.59, 0], [0.22, 0.025, 0.025])]], ["#E53935", [...ror([[0.0, 0.58, 0], [0.0, 0.48, 0]], [0.004, 0.004], 3), ...cyl([0.25, 0.06, 0.1], 0.016, 0.04, 6)]]]);
// trumset: trumset med bastrumma, virvel, puka och cymbal
await spara("trumset", [["#1E88E5", [...flytta(cylZ([0, 0, 0], 0.24, 0.24, 18), [0, 0.25, 0]), ...cyl([0.32, 0.3, 0.12], 0.12, 0.12, 14), ...cyl([-0.2, 0.52, 0.0], 0.09, 0.1, 12), ...cyl([0.12, 0.52, -0.05], 0.09, 0.1, 12)]], [vit, [...flytta(cylZ([0, 0, 0.122], 0.21, 0.004, 18), [0, 0.25, 0]), ...cyl([0.32, 0.42, 0.12], 0.115, 0.006, 14), ...cyl([-0.2, 0.62, 0.0], 0.085, 0.006, 12), ...cyl([0.12, 0.62, -0.05], 0.085, 0.006, 12)]], [guld, [...varv([[0, 0.92], [0.2, 0.9], [0.2, 0.895], [0, 0.915]], 16, [-0.4, -0.05]), ...varv([[0, 0.62], [0.13, 0.61], [0.13, 0.605], [0, 0.615]], 14, [0.55, 0.0])]], [silver, [...cyl([-0.4, 0, -0.05], 0.012, 0.9, 6), ...cyl([0.55, 0, 0.0], 0.012, 0.6, 6), ...cyl([0.32, 0, 0.12], 0.01, 0.3, 6)]], ["#E53935", [...E([0, 0.25, 0.126], [0.07, 0.07, 0.004], 8, 3)]]]);
// elgitarr: röd elgitarr på stativ
await spara("elgitarr", [["#E53935", [...E([0, 0.24, 0], [0.18, 0.18, 0.04], 12, 6), ...E([-0.05, 0.4, 0], [0.11, 0.1, 0.04], 10, 6), ...E([0.1, 0.4, 0], [0.06, 0.1, 0.04], 8, 6)]], [vit, [...L([0.0, 0.24, 0.042], [0.2, 0.12, 0.004])]], [morkTra, [...L([0, 0.68, 0], [0.05, 0.5, 0.025]), ...L([0, 0.96, 0], [0.07, 0.1, 0.025])]], [sv, [...L([0, 0.28, 0.046], [0.08, 0.025, 0.006]), ...L([0, 0.2, 0.046], [0.08, 0.025, 0.006]), ...[0.08, 0.11].map((x) => cylZ([x, 0.14, 0.045], 0.015, 0.012, 8)).flat(), ...ror([[0.15, 0.0, 0.08], [0, 0.08, 0.08], [-0.15, 0.0, 0.08]], [0.012, 0.012, 0.012], 4), ...ror([[0, 0.0, -0.15], [0, 0.6, -0.04]], [0.01, 0.01], 4)]], ["#ECEFF1", [-0.012, -0.004, 0.004, 0.012].flatMap((x) => L([x, 0.6, 0.032], [0.003, 0.76, 0.003]))]]);
// skallra: bebisskallra med boll och ringar
await spara("skallra", [["#FDD835", [...cyl([0, 0, 0], 0.03, 0.22, 8), ...E([0, 0.01, 0], [0.05, 0.02, 0.05], 8, 3)]], ["#4FC3F7", E([0, 0.32, 0], [0.11, 0.11, 0.11], 12, 8)], ["#F06292", [...ring([0, 0.32, 0], 0.115, 0.015, "xz", 14), ...ring([0, 0.32, 0], 0.115, 0.015, "zy", 14)]], [vit, [[0.05, 0.36, 0.09], [-0.06, 0.28, 0.09], [0.0, 0.4, 0.08]].flatMap((p) => E(p, [0.02, 0.02, 0.02], 6, 3))]]);
// speldosa: speldosa med öppet lock, ballerina och vev
await spara("speldosa", [["#F48FB1", [...L([0, 0.1, 0], [0.4, 0.2, 0.3]), ...flytta(rotX(L([0, 0.13, 0], [0.4, 0.26, 0.03]), -0.3), [0, 0.2, -0.15])]], ["#FFF59D", [...L([0, 0.201, 0], [0.36, 0.004, 0.26]), ...flytta(rotX(L([0, 0.13, 0.016], [0.34, 0.22, 0.004]), -0.3), [0, 0.2, -0.15])]], ["#81D4FA", flytta(rotX(L([0, 0.13, 0.019], [0.12, 0.16, 0.004]), -0.3), [0, 0.2, -0.15])], [vit, [...cyl([0, 0.2, 0.02], 0.05, 0.012, 12), ...varv([[0, 0.22], [0.06, 0.24], [0.01, 0.27], [0, 0.27]], 10, [0, 0.02]), ...E([0, 0.32, 0.02], [0.018, 0.04, 0.016], 6, 4)]], ["#FFCCBC", [...E([0, 0.37, 0.02], [0.018, 0.02, 0.018], 6, 4), ...ror([[-0.04, 0.36, 0.02], [0.0, 0.34, 0.02], [0.04, 0.36, 0.02]], [0.006, 0.006, 0.006], 3), ...cyl([0, 0.21, 0.02], 0.006, 0.05, 4)]], [guld, [...cylX([0.22, 0.1, 0.05], 0.008, 0.06, 6), ...L([0.25, 0.07, 0.05], [0.01, 0.06, 0.01]), ...E([0.26, 0.04, 0.05], [0.015, 0.015, 0.015], 6, 3), ...[0.15, -0.15].flatMap((x) => [0.12, -0.12].map((z) => E([x, 0.0, z], [0.02, 0.015, 0.02], 6, 3))).flat()]]]);
// klarinett: svart klarinett på ett litet stöd
await spara("klarinett", [[sv, [...varv([[0.03, 0.05], [0.07, 0.07], [0.04, 0.14], [0.028, 0.16], [0.025, 0.62], [0.02, 0.68], [0.008, 0.72], [0, 0.72]], 12)]], [silver, [...[0.25, 0.32, 0.39, 0.46, 0.53].flatMap((y) => [...E([0, y, 0.026], [0.012, 0.012, 0.006], 6, 3), ...L([0.02, y + 0.02, 0.02], [0.006, 0.05, 0.006])]), ...[0.18, 0.6].flatMap((y) => varv([[0.027, y], [0.032, y], [0.032, y + 0.02], [0.027, y + 0.02]], 12))]], [mtra, [...cyl([0, 0, 0], 0.12, 0.03, 14), ...cyl([0, 0.03, 0], 0.02, 0.06, 8)]]]);
console.log("klart");
