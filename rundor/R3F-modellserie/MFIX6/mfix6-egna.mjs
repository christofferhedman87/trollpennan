// R3F-MFIX6: nya modellfiler för saker som var oigenkännliga i spelet (Doodles granskning av M20–M25) (barnord utan modell) (Trollpennan, CC0). +y upp, +z fram, står på y=0. Kör från en mapp med @gltf-transform och sharp.
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, unpartition, mergeDocuments } from "@gltf-transform/functions";
import sharp from "sharp";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const I = "/workspace/modell-inkorg";
const UT = process.env.UT ?? `${I}/trollpennan-mfix6`;
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

// ---------- stråkinstrumenten: tydlig skillnad i storlek (målhöjd), färg och form
// fiol: liten ljus fiol snett med stråken i kryss (fiol + stråke som i en bilderbok)
await spara("fiol", golv([...roteraDelar(strak({ trä: "#D2802E", d: 0.05 }), (t) => rotZ(t, -0.55)), ...roteraDelar(strake(1.05), (t) => flytta(rotZ(t, 0.75), [0.32, -0.05, 0.08]))]));
// cello: mellanbrun cello på sin pigg, stråken lutad intill och en pall (cellisten sitter)
await spara("cello", [...delarFlytta(strak({ trä: "#B5652B", d: 0.09 }), [0, 0.13, 0]), [met, cyl([0, 0, 0], 0.008, 0.14, 6)], ["#212121", cyl([0, 0, 0], 0.03, 0.01, 8)], ...roteraDelar(strake(0.75), (t) => flytta(rotZ(t, 0.18), [0.27, 0, 0.06])), [sv, [...L([-0.42, 0.42, -0.05], [0.3, 0.04, 0.28]), ...[[-0.55, 0.07], [-0.29, 0.07], [-0.55, -0.17], [-0.29, -0.17]].map(([x, z]) => L([x, 0.2, z], [0.03, 0.4, 0.03]))]]]);
// kontrabas: störst, mörk, sluttande axlar, lång pigg och stråke
await spara("kontrabas", [...delarFlytta(strak({ trä: "#6D2E17", d: 0.1, axlar: true, mork: "#1B0F0A" }), [0, 0.1, 0]), [met, cyl([0, 0, 0], 0.01, 0.11, 6)], ...roteraDelar(strake(0.6), (t) => flytta(rotZ(t, -0.22), [-0.3, 0, 0.07]))]);
// maracas: två äggformade huvuden med ränder och prickar på trähandtag, i kryss
{ const en = (f, band, prick) => { const huvud = E([0, 0.26, 0], [0.075, 0.1, 0.075], 14, 9); const ib = (tri) => { const y = (tri[0][1] + tri[1][1] + tri[2][1]) / 3; return Math.abs(y - 0.26) < 0.02 || Math.abs(y - 0.33) < 0.012 || Math.abs(y - 0.19) < 0.012; };
    return [[f, huvud.filter((t) => !ib(t))], [band, huvud.filter(ib)], [prick, [[0.3, 0.6], [0.3, 2.2], [0.3, 4.0], [0.22, 1.4], [0.22, 3.2], [0.22, 5.0]].map(([y, a]) => { const r = 0.075 * Math.sqrt(Math.max(0, 1 - ((y - 0.26) / 0.1) ** 2)) + 0.002; return E([r * Math.sin(a), y, r * Math.cos(a)], [0.012, 0.012, 0.012], 6, 4); })], [tra, [...cyl([0, 0, 0], 0.018, 0.17, 10, "y", 0.022), ...cyl([0, 0, 0], 0.025, 0.02, 10)]]]; };
  await spara("maracas", golv([...roteraDelar(en("#E53935", "#FDD835", vit), (t) => flytta(rotZ(t, 0.35), [-0.06, 0, 0])), ...roteraDelar(en("#43A047", "#FF9800", "#FDD835"), (t) => flytta(rotZ(t, -0.35), [0.06, 0, 0.02]))])); }

// ---------- pizzaskärare: hjulet står upp på en pizza med handtaget snett uppåt (framsidan +x som entitetens framAxel)
await spara("pizzaskarare", roteraDelar([["#F4C27A", cyl([0, 0, 0], 0.2, 0.025, 22)], ["#D84315", cyl([0, 0.025, 0], 0.175, 0.006, 22)], ["#FFF59D", [[0.06, 0.08], [-0.09, 0.05], [0.0, -0.1], [-0.05, -0.04], [0.1, -0.06]].map(([x, z]) => E([x, 0.032, z], [0.03, 0.006, 0.025], 6, 3))], ["#B71C1C", [[-0.1, 0.1], [0.11, 0.03], [0.02, -0.13], [-0.12, -0.06]].map(([x, z]) => cyl([x, 0.03, z], 0.025, 0.008, 10))],
  [met, cylZ([0, 0.135, 0], 0.105, 0.014, 24)], ["#78909C", [...cylZ([0, 0.135, 0], 0.03, 0.03, 12), ...prisma([[-0.0, 0.11], [0.06, 0.15], [0.05, 0.17], [-0.01, 0.16]], 0.012, 0.006), ...prisma([[-0.0, 0.11], [0.06, 0.15], [0.05, 0.17], [-0.01, 0.16]], -0.012, 0.006)]],
  ["#E53935", [...ror([[0.05, 0.16, 0], [0.12, 0.22, 0], [0.22, 0.31, 0]], [0.022, 0.026, 0.026], 10), ...E([0.23, 0.32, 0], [0.028, 0.028, 0.028], 8, 5)]]], (t) => rotY(t, Math.PI / 2)));

// ---------- tvättlapp: frottélapp som hänger i en ögla från ena hörnet på en krok mot en kakelvägg (snett, mjukt hängande)
{ const lapp = "#26C6DA", S = 0.2, mitt = [0, 0.34 - S * Math.SQRT1_2 - 0.02, 0.005];
  const vrid = (t) => flytta(rotZ(t, Math.PI / 4 + 0.08), mitt);
  const prickar2 = []; for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) prickar2.push(...E([-S / 2 + 0.015 + i * ((S - 0.03) / 6), -S / 2 + 0.015 + j * ((S - 0.03) / 6), 0.011], [0.009, 0.009, 0.005], 5, 3));
  await spara("tvattlapp", [[vit, [...L([0, 0.22, -0.04], [0.36, 0.44, 0.03]), ...L([0, 0.01, 0.0], [0.36, 0.02, 0.1])]], ["#CFD8DC", [...[0.11, 0.22, 0.33].map((y) => L([0, y, -0.024], [0.36, 0.006, 0.004])), ...[-0.09, 0, 0.09].map((x) => L([x, 0.22, -0.024], [0.006, 0.44, 0.004]))]],
    [met, [...cylZ([0, 0.37, -0.01], 0.008, 0.04, 8), ...E([0, 0.375, 0.012], [0.014, 0.014, 0.014], 6, 4)]],
    [lapp, [...torusXY([0, 0.355, 0.008], 0.018, 0.005), ...vrid(L([0, 0, 0], [S, S, 0.018]).map((tri) => tri.map(([x, y, z]) => [x, y, z + 0.012 * Math.sin((x + y) * 12)])))]],
    ["#80DEEA", vrid(prickar2)], [vit, vrid([...L([0, -S / 2 + 0.025, 0.004], [S, 0.018, 0.02]), ...L([-S / 2 + 0.025, 0, 0.004], [0.018, S, 0.02])])]]); }

// ---------- filt: vikt rutig pläd (tre lager med rundade veck), fransar i ändarna, lutad mot betraktaren
{ const B = 0.56, D = 0.36, lag = 3, h = 0.045;
  const rod = [], gron = [], gul = [], frans = [];
  for (let k = 0; k < lag; k++) { const y = h / 2 + k * h; rod.push(...L([0, y, 0], [B, h * 0.9, D]), ...cylX([0, y, D / 2], h * 0.5, B, 10)); }
  const top = lag * h;
  for (const x of [-0.21, -0.07, 0.07, 0.21]) gron.push(...L([x, top + 0.002, 0], [0.06, 0.006, D]), ...flytta(cylX([0, 0, 0], h * 0.5 + 0.004, 0.06, 10), [x, top - h / 2, D / 2]).filter((tri) => tri.some((p) => p[2] > D / 2 + 0.005)));
  for (const z of [-0.12, 0.0, 0.12]) gron.push(...L([0, top + 0.004, z], [B, 0.006, 0.06]));
  for (const x of [-0.14, 0, 0.14]) gul.push(...L([x, top + 0.007, 0], [0.01, 0.004, D]));
  for (const z of [-0.06, 0.06]) gul.push(...L([0, top + 0.008, z], [B, 0.004, 0.01]));
  for (let i = 0; i < 14; i++) { const z = -D / 2 + 0.02 + i * ((D - 0.04) / 13); for (const sx of [-1, 1]) frans.push(...box([sx * (B / 2 + 0.03), top - 0.01, z], [0.06, 0.006, 0.008], sx * -0.3)); }
  await spara("filt", golv(roteraDelar([["#C62828", rod], ["#1B5E20", gron], ["#FDD835", gul], ["#E57373", frans]], (t) => rotX(t, 0.55)))); }

// ---------- täcke: tjockt vadderat täcke (sammanhängande med fyrkantig stickning och stjärnor), vikt i nederkanten, lutat mot betraktaren
{ const B = 0.6, puff = [], stj = [];
  puff.push(...L([0, 0.04, 0], [B, 0.08, B]));
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const x = -0.2 + i * 0.2, z = -0.2 + j * 0.2; puff.push(...E([x, 0.075, z], [0.1, 0.035, 0.1], 10, 6, 0)); stj.push(...prisma([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => { const a = Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 0.012 : 0.03; return [x + r * Math.cos(a), -z + r * Math.sin(a)]; }), 0, 0.008).map((tri) => tri.map(([px, py, pz]) => [px, 0.112 + pz, -py]))); }
  await spara("tacke", golv(roteraDelar([["#90CAF9", puff], ["#FFF176", stj], ["#64B5F6", [...cylX([0, 0.06, B / 2], 0.065, B, 14)]], ["#BBDEFB", [...[-0.1, 0.1].map((x) => L([x, 0.081, 0], [0.01, 0.01, B])), ...[-0.1, 0.1].map((z) => L([0, 0.081, z], [B, 0.01, 0.01]))]]], (t) => rotX(t, 0.6)))); }

// ---------- borste: ryktborste med träryggsida, rem och ljusa borststrån, lite framåtlutad
await spara("borste", golv(roteraDelar([["#8D6E63", [...E([0, 0.13, 0], [0.17, 0.045, 0.08], 14, 6)]], ["#5D4037", [...halvRing([0, 0.16, 0], 0.11, 0.012, "xy", 0.15, Math.PI - 0.15, 10).map((tri) => tri.map(([x, y, z]) => [x, 0.16 + (y - 0.16) * 0.5, z])), ...[-0.105, 0.105].map((x) => L([x, 0.165, 0], [0.03, 0.02, 0.05]))]],
  ["#D7CCC8", Array.from({ length: 33 }, (_, i) => { const x = -0.13 + (i % 11) * 0.026, z = -0.045 + Math.floor(i / 11) * 0.045; return (x / 0.15) ** 2 + (z / 0.07) ** 2 < 1 ? cyl([x, 0.0, z], 0.011, 0.11, 6) : []; })]], (t) => rotX(t, 0.35))));

// ---------- håv: fiskhåv med ring framåt, nät och snett skaft
await spara("fiskhav", golv([[tra, ror([[-0.22, 0, 0], [0.02, 0.42, 0]], [0.016, 0.016], 8)], [met, torusXY([0.1, 0.55, 0.02], 0.13, 0.012)], ["#A5D6A7", E([0.1, 0.55, -0.06], [0.125, 0.2, 0.08], 12, 8).filter((tri) => tri.every((p) => p[1] < 0.6))], ["#2E7D32", [...Array.from({ length: 6 }, (_, i) => L([0.1 - 0.1 + i * 0.04, 0.47, 0.018], [0.004, 0.17, 0.004])), ...[0.47, 0.52, 0.58].map((y) => L([0.1, y, 0.018], [0.2, 0.004, 0.004])), ...Array.from({ length: 5 }, (_, i) => L([0.04 + i * 0.03, 0.37, -0.02], [0.004, 0.08, 0.004]))]]]));

// ---------- fjärrkontroll: bakåtlutad med stora färgade knappar framåt
await spara("fjarrkontroll", golv(roteraDelar([["#455A64", [...L([0, 0.18, 0], [0.12, 0.36, 0.04]), ...cylZ([0, 0.36, 0], 0.06, 0.04, 14)].filter((tri) => tri.every((p) => p[1] <= 0.385))], ["#E53935", cylZ([0.03, 0.335, 0.024], 0.014, 0.01, 10)], ["#CFD8DC", [...cylZ([0, 0.255, 0.022], 0.04, 0.008, 14)]], ["#78909C", cylZ([0, 0.255, 0.028], 0.016, 0.008, 10)], [vit, Array.from({ length: 12 }, (_, i) => L([-0.032 + (i % 3) * 0.032, 0.17 - Math.floor(i / 3) * 0.032, 0.022], [0.022, 0.018, 0.008]))], ...[["#E53935", -0.036], ["#43A047", -0.012], ["#FDD835", 0.012], ["#1E88E5", 0.036]].map(([f, x]) => [f, L([x, 0.205, 0.022], [0.018, 0.012, 0.008])])], (t) => rotX(t, -0.45))));
console.log("klart");
