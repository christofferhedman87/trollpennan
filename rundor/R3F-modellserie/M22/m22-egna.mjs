// R3F-M22: egna lågpolymodeller för skola och lek (Trollpennan, CC0). +y upp, +z fram, står på y=0. Kör från en mapp med @gltf-transform och sharp.
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, unpartition, mergeDocuments } from "@gltf-transform/functions";
import sharp from "sharp";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const I = "/workspace/modell-inkorg";
const UT = process.env.UT ?? `${I}/trollpennan-skola-m22`;
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

// ---------- hjälp (som i M21)
const tra = "#A1887F", mtra = "#6D4C41", met = "#B0BEC5", sv = "#212121", vit = "#FAFAFA";
const flytta = (t, [dx, dy, dz]) => t.map((tri) => tri.map(([x, y, z]) => [x + dx, y + dy, z + dz]));
const skala = (t, [sx, sy, sz], [cx, cy, cz] = [0, 0, 0]) => t.map((tri) => tri.map(([x, y, z]) => [cx + (x - cx) * sx, cy + (y - cy) * sy, cz + (z - cz) * sz]));
const rotX = (t, a) => t.map((tri) => tri.map(([x, y, z]) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)]));
const rotY = (t, a) => t.map((tri) => tri.map(([x, y, z]) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)]));
const rotZ = (t, a) => t.map((tri) => tri.map(([x, y, z]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z]));
const par = (fn) => [...fn(0.1, 1), ...fn(-0.1, -1)];
const box = (c, s, rz = 0, ry = 0) => flytta(rotY(rotZ(L([0, 0, 0], s), rz), ry), c);
// halv skiva (gradskiva) i xy-planet, tjocklek längs z
function halvskiva(r, tj, n = 18, r0 = 0) {
  const t = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI, b = ((i + 1) / n) * Math.PI;
    const P = (w, rr, z) => [rr * Math.cos(w), rr * Math.sin(w), z];
    t.push(...quad(P(a, r0, tj / 2), P(a, r, tj / 2), P(b, r, tj / 2), P(b, r0, tj / 2)), ...quad(P(b, r0, -tj / 2), P(b, r, -tj / 2), P(a, r, -tj / 2), P(a, r0, -tj / 2)), ...quad(P(a, r, tj / 2), P(a, r, -tj / 2), P(b, r, -tj / 2), P(b, r, tj / 2)));
  }
  t.push(...L([0, 0.005, 0], [2 * r, 0.01, tj]));
  return t;
}
const krita1 = (x, z, f, h = 0.32) => [[f, [...cyl([x, 0, z], 0.035, h, 8), ...cyl([x, h, z], 0.035, 0.07, 8, "y", 0.006)]], ["#212121", cyl([x, h * 0.75, z], 0.037, 0.02, 8)]];
const regnbage = ["#E53935", "#FB8C00", "#FDD835", "#43A047", "#1E88E5", "#8E24AA"];

// ---------- skola och lek
// pussel: fyra pusselbitar i en ram, upprätt, och en lös bit framför
{ const C = ["#E53935", "#1E88E5", "#FDD835", "#43A047"], d = [];
  [[-0.12, 0.42], [0.12, 0.42], [-0.12, 0.18], [0.12, 0.18]].forEach(([x, y], i) => d.push([C[i], L([x, y, 0], [0.235, 0.235, 0.04])]));
  d.push([C[0], cylZ([0.0, 0.42, 0], 0.045, 0.04, 10)], [C[1], cylZ([0.12, 0.3, 0], 0.045, 0.04, 10)], [C[2], cylZ([-0.12, 0.3, 0], 0.045, 0.04, 10)], [C[3], cylZ([0.0, 0.18, 0], 0.045, 0.04, 10)]);
  d.push([tra, [...L([0, 0.3, -0.03], [0.54, 0.54, 0.02]), ...L([0, 0.02, -0.06], [0.5, 0.04, 0.16])]], ["#AB47BC", [...L([0.12, 0.02, 0.18], [0.2, 0.04, 0.2]), ...cyl([0.22, 0, 0.18], 0.045, 0.04, 10), ...cyl([0.12, 0, 0.28], 0.045, 0.04, 10)]]);
  await spara("pussel", d); }
// krita: kritask med sex färgkritor
await spara("krita", [["#FFC107", [...L([0, 0.1, 0], [0.4, 0.2, 0.12])]], ["#1E88E5", L([0, 0.1, 0.061], [0.3, 0.1, 0.004])], ...regnbage.flatMap((f, i) => krita1(-0.15 + i * 0.06, 0, f, 0.3 + (i % 2) * 0.04))]);
// byggkloss: tre klossar med knoppar i en trappa
{ const kloss = (c, w, f) => [[f, [...L([c[0], c[1] + 0.07, c[2]], [w, 0.14, 0.16]), ...Array.from({ length: Math.round(w / 0.08) }, (_, i) => c[0] - w / 2 + 0.04 + i * 0.08).flatMap((x) => [0.04, -0.04].flatMap((z) => cyl([x, c[1] + 0.14, c[2] + z], 0.025, 0.03, 10)))]]];
  await spara("byggkloss", [...kloss([0, 0, 0], 0.48, "#E53935"), ...kloss([0.08, 0.14, 0], 0.32, "#1E88E5"), ...kloss([0.16, 0.28, 0], 0.16, "#FDD835"), ...kloss([-0.2, 0, 0.22], 0.16, "#43A047")]); }
// docka: trasdocka med klänning, flätor och förkläde
await spara("docka", [["#E91E63", [...varv([[0, 0], [0.14, 0], [0.08, 0.26], [0.05, 0.3], [0, 0.3]], 14)]], [vit, [...L([0, 0.13, 0.06], [0.1, 0.16, 0.06]), ...E([0, 0.3, 0], [0.065, 0.02, 0.065], 8, 3)]], ["#FFCCBC", [...E([0, 0.39, 0], [0.085, 0.09, 0.08], 10, 8), ...[1, -1].flatMap((s) => ror([[s * 0.06, 0.27, 0], [s * 0.13, 0.17, 0.02]], [0.025, 0.022], 6)), ...[1, -1].flatMap((s) => cyl([s * 0.05, 0, 0], 0.022, 0.05, 6))]], ["#FDD835", [...E([0, 0.43, -0.01], [0.09, 0.06, 0.085], 10, 6), ...[1, -1].flatMap((s) => ror([[s * 0.08, 0.42, -0.01], [s * 0.11, 0.33, 0], [s * 0.1, 0.25, 0.01]], [0.025, 0.022, 0.018], 6))]], ["#E53935", [...[1, -1].map((s) => E([s * 0.1, 0.26, 0.01], [0.025, 0.015, 0.025], 6, 3)).flat(), ...E([0, 0.36, 0.078], [0.02, 0.008, 0.006], 6, 3)]], [sv, [...E([0.03, 0.4, 0.075], [0.012, 0.014, 0.008], 6, 4), ...E([-0.03, 0.4, 0.075], [0.012, 0.014, 0.008], 6, 4)]]]);
// bilderbok: uppslagen sagobok med bilder (sol, träd, hus)
await spara("bilderbok", [["#C62828", [...box([0.14, 0.2, -0.015], [0.3, 0.4, 0.02], 0, -0.35), ...box([-0.14, 0.2, -0.015], [0.3, 0.4, 0.02], 0, 0.35), ...L([0, 0.2, -0.06], [0.04, 0.4, 0.03])]], ["#FFFDE7", [...box([0.135, 0.2, 0.0], [0.28, 0.38, 0.02], 0, -0.35), ...box([-0.135, 0.2, 0.0], [0.28, 0.38, 0.02], 0, 0.35)]], ["#FDD835", E([-0.18, 0.3, 0.075], [0.04, 0.04, 0.01], 8, 4)], ["#43A047", [...E([0.12, 0.25, 0.06], [0.06, 0.06, 0.015], 8, 4)]], [mtra, [...L([0.12, 0.15, 0.055], [0.02, 0.08, 0.01])]], ["#1E88E5", [...L([-0.1, 0.12, 0.04], [0.1, 0.08, 0.012])]], ["#E53935", [...L([-0.1, 0.18, 0.04], [0.11, 0.04, 0.012])]]]);
// jordglob: blå jordglob med gröna kontinenter på fot
await spara("jordglob", [["#1E88E5", E([0, 0.38, 0], [0.2, 0.2, 0.2], 18, 12)], ["#43A047", [[0.12, 0.44, 0.13], [-0.06, 0.48, 0.17], [0.05, 0.3, 0.18], [-0.16, 0.33, 0.08], [0.17, 0.36, -0.08], [-0.05, 0.42, -0.18], [0.08, 0.52, -0.12]].flatMap(([x, y, z], i) => E([x, y, z], [0.07 + (i % 3) * 0.015, 0.05 + (i % 2) * 0.02, 0.06], 8, 5))], [vit, E([0, 0.575, 0], [0.06, 0.02, 0.06], 8, 4)], ["#FFC107", [...halvRing([0, 0.38, 0], 0.235, 0.012, "zy", -Math.PI * 0.6, Math.PI * 0.6, 14).map((t) => t), ...cyl([0, 0, 0], 0.13, 0.04, 16), ...cyl([0, 0.04, 0], 0.02, 0.1, 8)]]]);
// tidning: hopvikt tidning (serietidning) som står som ett tält, med rubrik och bilder
await spara("tidning", [["#ECEFF1", [...flytta(rotX(L([0, 0.17, 0], [0.42, 0.34, 0.01]), 0.35), [0, 0, 0.06]), ...flytta(rotX(L([0, 0.17, 0], [0.42, 0.34, 0.01]), -0.35), [0, 0, -0.06])]], ["#212121", [...flytta(rotX(L([0, 0.28, 0.006], [0.36, 0.05, 0.004]), 0.35), [0, 0, 0.06]), ...[0.2, 0.15, 0.1, 0.05].flatMap((y) => flytta(rotX(L([0.08, y, 0.006], [0.18, 0.012, 0.004]), 0.35), [0, 0, 0.06]))]], ["#E53935", flytta(rotX(L([-0.11, 0.14, 0.007], [0.14, 0.14, 0.004]), 0.35), [0, 0, 0.06])], ["#FDD835", flytta(rotX(E([-0.11, 0.14, 0.01], [0.04, 0.04, 0.004], 6, 3), 0.35), [0, 0, 0.06])]]);
// surfplatta: surfplatta (läsplatta) på stöd med färgglada appar
await spara("surfplatta", [["#37474F", [...box([0, 0.2, 0], [0.4, 0.3, 0.02], 0, 0).map((t) => t), ...L([0, 0.01, -0.05], [0.3, 0.02, 0.16])]], ...regnbage.map((f, i) => [f, L([-0.12 + (i % 3) * 0.12, 0.26 - Math.floor(i / 3) * 0.1, 0.012], [0.07, 0.07, 0.004])]), ["#4FC3F7", L([0, 0.2, 0.0105], [0.36, 0.26, 0.002])], ["#90A4AE", [...flytta(rotX(L([0, 0.1, 0], [0.12, 0.2, 0.015]), -0.5), [0, 0, -0.07])]]].map(([f, t], k) => [f, k === 0 ? t : t]).map(([f, t]) => [f, f === "#90A4AE" || f === "#37474F" && false ? t : t]).map(([f, t]) => [f, t.map((tri) => tri.map(([x, y, z]) => (f === "#90A4AE" || y < 0.025 ? [x, y, z] : [x, 0.05 + (y - 0.05) * Math.cos(0.3), z - (y - 0.05) * Math.sin(0.3)])))]));
// kamera: kamera med objektiv, blixt, knapp och rem
await spara("kamera", [["#37474F", [...L([0, 0.15, 0], [0.4, 0.24, 0.14]), ...L([-0.1, 0.29, 0], [0.12, 0.05, 0.1])]], [sv, [...cylZ([0.04, 0.15, 0.1], 0.085, 0.08, 16), ...ror([[0.2, 0.22, 0], [0.24, 0.3, 0], [0.2, 0.4, 0], [-0.2, 0.4, 0], [-0.24, 0.3, 0], [-0.2, 0.22, 0]], [0.012, 0.012, 0.012, 0.012, 0.012, 0.012], 4)]], ["#4FC3F7", cylZ([0.04, 0.15, 0.145], 0.06, 0.01, 16)], [vit, [...L([-0.13, 0.22, 0.072], [0.08, 0.04, 0.004])]], ["#E53935", [...cyl([0.13, 0.27, 0], 0.025, 0.02, 10)]], ["#B0BEC5", [...L([0, 0.04, 0], [0.4, 0.02, 0.14])]]]);
// teckning: barnteckning (hus, sol och gräs) på ett litet staffli
await spara("teckning", [[tra, [...ror([[-0.18, 0, 0.08], [0, 0.72, 0]], [0.018, 0.015], 5), ...ror([[0.18, 0, 0.08], [0, 0.72, 0]], [0.018, 0.015], 5), ...ror([[0, 0, -0.25], [0, 0.66, -0.01]], [0.015, 0.015], 5), ...L([0, 0.2, 0.08], [0.44, 0.03, 0.06])]], [vit, flytta(rotX(L([0, 0.42, 0], [0.42, 0.38, 0.01]), -0.12), [0, 0, 0.09])], ["#FDD835", flytta(rotX(E([0.12, 0.54, 0.008], [0.045, 0.045, 0.004], 8, 3), -0.12), [0, 0, 0.09])], ["#E53935", flytta(rotX(L([-0.06, 0.37, 0.008], [0.14, 0.12, 0.004]), -0.12), [0, 0, 0.09])], ["#5D4037", flytta(rotX(L([-0.06, 0.46, 0.009], [0.16, 0.05, 0.004]), -0.12), [0, 0, 0.09])], ["#43A047", flytta(rotX(L([0, 0.27, 0.008], [0.4, 0.04, 0.004]), -0.12), [0, 0, 0.09])]]);
// suddgummi: rosa och blått suddgummi, lite snett
await spara("suddgummi", [["#F48FB1", L([0.02, 0.05, 0], [0.3, 0.09, 0.11])], ["#1E88E5", [...L([-0.05, 0.05, 0], [0.18, 0.1, 0.12])]], [vit, L([-0.05, 0.05, 0.061], [0.12, 0.04, 0.004])]]);
// linjal: gul linjal som står på kanten, med streck och siffror
await spara("linjal", [["#FDD835", L([0, 0.06, 0], [0.6, 0.12, 0.02])], [sv, [...Array.from({ length: 25 }, (_, i) => -0.28 + i * 0.0233).flatMap((x, i) => L([x, 0.115 - (i % 5 ? 0.012 : 0.025), 0.011], [0.004, i % 5 ? 0.024 : 0.05, 0.003])), ...[-0.28, -0.163, -0.047, 0.07, 0.187].flatMap((x) => L([x, 0.05, 0.011], [0.016, 0.022, 0.003]))]]]);
// pennvässare: blå vässare med blyerts i
await spara("pennvassare", [["#1E88E5", [...L([0, 0.06, 0], [0.16, 0.12, 0.12])]], ["#B0BEC5", [...L([0, 0.06, 0.061], [0.12, 0.08, 0.004])]], ["#FDD835", [...cylX([0.25, 0.06, 0], 0.025, 0.26, 6)]], ["#F48FB1", cylX([0.395, 0.06, 0], 0.025, 0.03, 6)]]);
// skolväska: röd skolväska med lock, spännen och bärhandtag
await spara("skolvaska", [["#E53935", [...L([0, 0.22, 0], [0.42, 0.44, 0.18]), ...flytta(rotX(L([0, -0.12, 0], [0.42, 0.24, 0.02]), 0), [0, 0.44, 0.1])]], ["#B71C1C", [...halvRing([0, 0.44, 0], 0.08, 0.015, "xy", 0, Math.PI), ...[0.12, -0.12].map((x) => L([x, 0.3, 0.112], [0.04, 0.12, 0.006])).flat()]], ["#FFC107", [...[0.12, -0.12].map((x) => L([x, 0.25, 0.115], [0.05, 0.03, 0.008])).flat()]], ["#FDD835", [...[[-0.12, 0.36], [0.0, 0.4], [0.1, 0.36]].flatMap(([x, y]) => E([x, y, 0.112], [0.025, 0.025, 0.006], 6, 3))]]]);
// pennfodral: grönt pennskrin med dragkedja och pennor som sticker upp
await spara("pennfodral", [["#43A047", [...cylX([0, 0.08, 0], 0.08, 0.42, 14)]], ["#FDD835", [...L([0, 0.16, 0], [0.4, 0.008, 0.02])]], ...regnbage.slice(0, 4).flatMap((f, i) => [[f, flytta(rotZ(cyl([0, 0, 0], 0.016, 0.22, 6), 0.3 - i * 0.2), [-0.09 + i * 0.06, 0.12, 0.0])]])]);
// häftapparat: svart häftapparat i profil
await spara("haftapparat", [[sv, [...L([0, 0.02, 0], [0.4, 0.04, 0.1]), ...flytta(rotZ(L([0, 0, 0], [0.38, 0.06, 0.09]), 0.06), [0.0, 0.11, 0])]], ["#E53935", [...flytta(rotZ(L([0, 0, 0], [0.34, 0.03, 0.08]), 0.06), [0.0, 0.155, 0])]], ["#B0BEC5", [...L([-0.18, 0.08, 0], [0.04, 0.08, 0.06]), ...L([0.15, 0.042, 0], [0.06, 0.006, 0.05])]]]);
// tejp: tejprulle på en hållare med tagg
await spara("tejp", [["#37474F", [...L([0, 0.04, 0], [0.36, 0.08, 0.16]), ...L([-0.02, 0.12, 0], [0.04, 0.12, 0.1])]], ["#E1F5FE", flytta(rotX(varv([[0.04, -0.05], [0.12, -0.05], [0.12, 0.05], [0.04, 0.05], [0.04, -0.05]], 18), Math.PI / 2), [-0.02, 0.2, 0])], ["#B0BEC5", [...L([0.17, 0.1, 0], [0.03, 0.06, 0.1])]], ["#FFF59D", L([0.08, 0.15, 0], [0.18, 0.004, 0.09]).map((tri) => tri.map(([x, y, z]) => [x, y - (x - 0.0) * 0.4, z]))]]);
// lim: vit limflaska med orange kork och etikett
await spara("lim", [[vit, varv([[0, 0], [0.09, 0], [0.095, 0.02], [0.095, 0.26], [0.06, 0.3], [0, 0.3]], 14)], ["#FF7043", [...varv([[0, 0.29], [0.04, 0.29], [0.035, 0.36], [0.012, 0.4], [0, 0.41]], 12)]], ["#1E88E5", [...cyl([0, 0.08, 0], 0.097, 0.12, 14)]], ["#FDD835", E([0, 0.14, 0.096], [0.04, 0.03, 0.006], 8, 3)]]);
// pensel: tre penslar i ett glas med färgvatten
await spara("pensel", [["#B3E5FC", varv(skal(0.09, 0.1, 0.2, 0.01), 16)], ["#80DEEA", varv([[0, 0.02], [0.085, 0.02], [0.093, 0.13], [0, 0.13]], 14)], ...[["#E53935", -0.03, 0.25], ["#1E88E5", 0.035, -0.2], ["#FDD835", 0, 0.0]].flatMap(([f, x, a]) => [[tra, flytta(rotZ(cyl([0, 0, 0], 0.012, 0.36, 6), a), [x, 0.03, x])], [sv, flytta(rotZ(cyl([0, 0.36, 0], 0.016, 0.03, 6), a), [x, 0.03, x])], [f, flytta(rotZ(cyl([0, 0.39, 0], 0.018, 0.07, 6, "y", 0.003), a), [x, 0.03, x])]])]);
// miniräknare: grå miniräknare med display och knappar, lutad
{ const k = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) k.push(L([-0.09 + c * 0.06, 0.07 + r * 0.06, 0.016], [0.045, 0.045, 0.012]));
  const luta = (t) => t.map((tri) => tri.map(([x, y, z]) => [x, y * Math.cos(0.35) + 0.01, z - y * Math.sin(0.35)]));
  await spara("miniraknare", [["#455A64", luta(L([0, 0.19, 0], [0.26, 0.38, 0.03]))], ["#C5E1A5", luta(L([0, 0.32, 0.016], [0.22, 0.07, 0.006]))], [vit, luta(k.slice(0, 12).flat())], ["#FF7043", luta(k.slice(12).flat())], ["#455A64", L([0, 0.04, -0.08], [0.24, 0.08, 0.04])]]); }
// griffeltavla: svart tavla i träram på stöd, med krita och ABC
await spara("griffeltavla", [["#263238", L([0, 0.4, 0], [0.5, 0.36, 0.02])], [tra, [...L([0, 0.6, 0], [0.56, 0.04, 0.04]), ...L([0, 0.2, 0], [0.56, 0.04, 0.04]), ...L([0.27, 0.4, 0], [0.04, 0.44, 0.04]), ...L([-0.27, 0.4, 0], [0.04, 0.44, 0.04]), ...ror([[0.2, 0, 0.08], [0.25, 0.25, 0]], [0.02, 0.02], 5), ...ror([[-0.2, 0, 0.08], [-0.25, 0.25, 0]], [0.02, 0.02], 5), ...ror([[0, 0, -0.22], [0, 0.55, -0.02]], [0.02, 0.02], 5)]], [vit, [...box([-0.16, 0.46, 0.012], [0.015, 0.12, 0.004], 0.35), ...box([-0.12, 0.46, 0.012], [0.015, 0.12, 0.004], -0.35), ...box([-0.14, 0.45, 0.012], [0.04, 0.012, 0.004]), ...box([-0.03, 0.46, 0.012], [0.015, 0.13, 0.004]), ...E([0.0, 0.49, 0.012], [0.03, 0.03, 0.004], 6, 3), ...E([0.0, 0.43, 0.012], [0.035, 0.035, 0.004], 6, 3), ...halvRing([0.12, 0.46, 0.012], 0.06, 0.008, "xy", Math.PI / 4, 1.75 * Math.PI, 10), ...L([0.1, 0.225, 0.03], [0.08, 0.02, 0.02])]]]);
// skolbänk: skolbänk med bord och stol i ett
await spara("skolbank", [["#1E88E5", [...[[0.25, 0.28], [-0.25, 0.28], [0.25, -0.05], [-0.25, -0.05]].flatMap(([x, z]) => cyl([x, 0, z], 0.02, z > 0 ? 0.62 : 0.38, 8)), ...L([0, 0.06, 0.12], [0.5, 0.03, 0.03]).map((t) => t)]], ["#FFE0B2", [...L([0, 0.64, 0.28], [0.62, 0.04, 0.34]), ...L([0, 0.4, -0.06], [0.5, 0.04, 0.3])]], ["#FFCC80", [...L([0, 0.6, -0.22], [0.5, 0.3, 0.03])]], ["#E53935", [...L([0.12, 0.67, 0.3], [0.16, 0.02, 0.2])]], ["#FDD835", flytta(rotY(cylX([0, 0, 0], 0.012, 0.18, 6), 0.4), [-0.12, 0.675, 0.3])]]);
// mikroskop: vitt mikroskop med svart tub, bord och linser
await spara("mikroskop", [[vit, [...L([0, 0.03, 0], [0.3, 0.06, 0.3]), ...ror([[0, 0.06, -0.1], [0, 0.3, -0.12], [0, 0.45, -0.04]], [0.04, 0.035, 0.035], 8), ...L([0, 0.22, 0.02], [0.2, 0.02, 0.18])]], [sv, [...flytta(rotX(cyl([0, 0, 0], 0.035, 0.3, 12), 0.35), [0, 0.22, 0.04]), ...flytta(rotX(cyl([0, 0.3, 0], 0.045, 0.06, 12), 0.35), [0, 0.22, 0.04]), ...cylX([0.05, 0.33, -0.1], 0.04, 0.04, 10), ...cylX([-0.05, 0.33, -0.1], 0.04, 0.04, 10)]], ["#B0BEC5", [...cyl([0, 0.16, 0.08], 0.02, 0.06, 8)]], ["#4FC3F7", L([0, 0.235, 0.06], [0.1, 0.008, 0.06])]]);
// tuschpenna: tre tuschpennor som står, med korkar i olika färger
await spara("tuschpenna", [...[["#E53935", -0.08], ["#43A047", 0], ["#1E88E5", 0.08]].flatMap(([f, x]) => [[vit, cyl([x, 0, 0], 0.03, 0.3, 10)], [f, [...cyl([x, 0.3, 0], 0.032, 0.12, 10), ...E([x, 0.42, 0], [0.032, 0.02, 0.032], 8, 4), ...L([x, 0.36, 0.035], [0.012, 0.08, 0.012]), ...cyl([x, 0.1, 0], 0.031, 0.08, 10)]]])]);
// vattenfärg: öppen färglåda med åtta färger, lock bakom och en pensel
await spara("vattenfarg", [["#ECEFF1", [...L([0, 0.02, 0], [0.44, 0.04, 0.2]), ...flytta(rotX(L([0, 0.1, 0], [0.44, 0.2, 0.02]), -0.25), [0, 0.03, -0.11])]], ...["#E53935", "#FB8C00", "#FDD835", "#43A047", "#1E88E5", "#3949AB", "#8E24AA", "#5D4037"].map((f, i) => [f, E([-0.15 + (i % 4) * 0.1, 0.04, (i < 4 ? -0.045 : 0.045)], [0.04, 0.012, 0.035], 8, 3)]), ["#1E88E5", flytta(rotX(L([0, 0.12, 0.012], [0.4, 0.16, 0.004]), -0.25), [0, 0.03, -0.11])], [tra, flytta(rotY(cylX([0, 0, 0], 0.01, 0.34, 6), 0.2), [0.0, 0.06, 0.14])], [sv, E([0.18, 0.06, 0.11], [0.025, 0.012, 0.012], 6, 3)]]);
// gradskiva: genomskinligt blå gradskiva som står upp, med streck
await spara("gradskiva", [["#4FC3F7", halvskiva(0.3, 0.015, 20, 0.12)], [sv, Array.from({ length: 19 }, (_, i) => (i / 18) * Math.PI).flatMap((a, i) => flytta(rotZ(L([0, 0, 0], [i % 3 ? 0.03 : 0.06, 0.005, 0.004]), a), [(0.3 - (i % 3 ? 0.015 : 0.03)) * Math.cos(a), (0.3 - (i % 3 ? 0.015 : 0.03)) * Math.sin(a), 0.009]))], ["#E53935", L([0, 0.02, 0.009], [0.04, 0.02, 0.004])]]);
// passare: passare med två ben, gångjärn och penna
await spara("passare", [["#B0BEC5", [...ror([[0, 0.5, 0], [-0.14, 0.04, 0]], [0.016, 0.012], 6), ...ror([[0, 0.5, 0], [0.12, 0.12, 0]], [0.016, 0.014], 6), ...cyl([-0.14, 0, 0], 0.004, 0.05, 4, "y", 0.012)]], ["#E53935", [...cyl([0, 0.5, 0], 0.03, 0.05, 10), ...cyl([0, 0.55, 0], 0.012, 0.08, 6)]], ["#FDD835", [...flytta(rotZ(cyl([0, 0, 0], 0.016, 0.14, 6), 0.3), [0.14, 0.02, 0.0])]], [sv, [...cyl([0.142, 0.0, 0], 0.004, 0.03, 4, "y", 0.016)]]]);
// tumstock: gul tumstock vikt i sicksack
await spara("tumstock", [["#FDD835", [0, 1, 2, 3].flatMap((i) => box([-0.24 + i * 0.16, 0.15, 0], [0.34, 0.03, 0.006], i % 2 ? -1.1 : 1.1))], [sv, [0, 1, 2, 3].flatMap((i) => Array.from({ length: 6 }, (_, j) => -0.13 + j * 0.05).flatMap((s) => box([-0.24 + i * 0.16 + s * Math.cos(i % 2 ? -1.1 : 1.1), 0.15 + s * Math.sin(i % 2 ? -1.1 : 1.1), 0.0035], [0.004, 0.02, 0.003], i % 2 ? -1.1 : 1.1)))], ["#B0BEC5", [1, 2, 3].map((i) => E([-0.32 + i * 0.16, i % 2 ? 0.3 : 0.0, 0.0], [0.012, 0.012, 0.006], 6, 3)).flat()]]);
console.log("klart");
