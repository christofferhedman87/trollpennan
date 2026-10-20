// R3F-M27: egna lågpolymodeller för kläder, smycken, hygien och hem (barnord utan modell) (Trollpennan, CC0). +y upp, +z fram, står på y=0. Kör från en mapp med @gltf-transform och sharp.
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, unpartition, mergeDocuments } from "@gltf-transform/functions";
import sharp from "sharp";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const I = "/workspace/modell-inkorg";
const UT = process.env.UT ?? `${I}/trollpennan-klader-hem-m27`;
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

// ---------- kläder och accessoarer
// kjol: rosa klockkjol med prickar och linning
await spara("kjol", [["#EC407A", varv([[0, 0.02], [0.27, 0.02], [0.2, 0.2], [0.13, 0.38], [0, 0.38]], 14)], ["#AD1457", cyl([0, 0.37, 0], 0.135, 0.05, 14)], [vit, [0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = -Math.PI / 2 + (i - 3.5) * 0.32, y = 0.07 + (i % 3) * 0.09, r = 0.27 - (y - 0.02) * 0.4 + 0.004; return E([r * Math.sin(-a - Math.PI / 2) * -1, y, r * Math.cos(a + Math.PI / 2) * -1], [0.02, 0.02, 0.02], 6, 4); }).map((t) => t.map((tri) => tri.map(([x, y, z]) => [x, y, Math.abs(z)])))]]);
// sandal: ett par sandaler med korsade remmar, lite vridna
{ const en = (x) => [["#8D6E63", flytta(skala(cyl([0, 0, 0], 0.07, 0.03, 12), [1, 1, 2.2]), [x, 0, 0])], ["#FF7043", [...flytta(rotY(L([0, 0.045, 0], [0.15, 0.02, 0.03]), 0.6), [x, 0, 0.06]), ...flytta(rotY(L([0, 0.045, 0], [0.15, 0.02, 0.03]), -0.6), [x, 0, 0.06]), ...flytta(L([0, 0.05, 0], [0.15, 0.03, 0.03]), [x, 0, -0.07]), ...L([x, 0.08, -0.13], [0.12, 0.08, 0.02])]], [guld, E([x + 0.075, 0.05, -0.07], [0.012, 0.012, 0.012], 6, 4)]];
  await spara("sandal", [...en(0.1), ...en(-0.1)].map(([f, t]) => [f, flytta(rotX(rotY(platta(t), 0.35), 0.55), [0, 0.09, 0])])); }
// slips: randig slips som står på spetsen, med vit krage
await spara("slips", [["#1565C0", [...prisma([[-0.03, 0.62], [-0.085, 0.13], [0, 0.0], [0.085, 0.13], [0.03, 0.62]].reverse(), 0, 0.025)]], ["#0D47A1", prisma([[-0.05, 0.7], [-0.032, 0.61], [0.032, 0.61], [0.05, 0.7]], 0.004, 0.035)], ["#FFEB3B", [0.2, 0.32, 0.44, 0.55].map((y) => L([0, y, 0.014], [0.11 - y * 0.08, 0.02, 0.005]))], [vit, [...box([0.09, 0.69, -0.01], [0.13, 0.05, 0.02], -0.5), ...box([-0.09, 0.69, -0.01], [0.13, 0.05, 0.02], 0.5)]]]);
// plånbok: brun plånbok på högkant med sedel och kort som sticker upp
await spara("planbok", [["#6D4C41", L([0, 0.12, 0], [0.32, 0.22, 0.05])], ["#8D6E63", [...L([0, 0.12, 0.027], [0.3, 0.2, 0.005]), ...L([0, 0.16, 0.031], [0.3, 0.07, 0.005])]], ["#81C784", L([-0.04, 0.25, -0.005], [0.24, 0.1, 0.006])], ["#42A5F5", L([0.08, 0.255, 0.008], [0.12, 0.09, 0.006])], [guld, cylZ([0.13, 0.16, 0.036], 0.014, 0.01, 8)]]);
// hårborste: paddelborste som står på skaftet, borstsidan framåt
await spara("harborste", [["#AB47BC", [...cyl([0, 0, 0], 0.03, 0.3, 10, "y", 0.022), ...E([0, 0.42, 0], [0.11, 0.14, 0.03], 14, 8)]], ["#212121", E([0, 0.42, 0.028], [0.09, 0.12, 0.008], 14, 6)], [vit, [-0.05, -0.017, 0.017, 0.05].flatMap((x) => [0.33, 0.37, 0.41, 0.45, 0.49].filter((y) => ((x / 0.09) ** 2 + ((y - 0.42) / 0.12) ** 2) < 0.8).map((y) => E([x, y, 0.045], [0.008, 0.008, 0.012], 5, 3)))]]);
// armband: pärlarmband som står upp, pärlor i regnbågens färger
{ const f = ["#E53935", "#FB8C00", "#FDD835", "#43A047", "#1E88E5", "#8E24AA"]; const n = 18;
  await spara("armband", f.map((c, k) => [c, Array.from({ length: n }, (_, i) => i).filter((i) => i % 6 === k).map((i) => { const a = (i / n) * 2 * Math.PI; return E([0.14 * Math.cos(a), 0.17 + 0.14 * Math.sin(a), 0], [0.03, 0.03, 0.03], 8, 6); })])); }
// armbandsur: klocka med rem i en ögla, urtavlan framåt
await spara("armbandsur", [["#5D4037", flytta(rotZ(torus(0.13, 0.025, 22, 6), Math.PI / 2), [0, 0.16, 0]).map((tri) => tri.map(([x, y, z]) => [x * 1.8, y, z]))], ["#B0BEC5", cylZ([0, 0.16, 0.13], 0.075, 0.04, 18)], [vit, cylZ([0, 0.16, 0.152], 0.062, 0.006, 18)], [sv, [...L([0, 0.185, 0.157], [0.008, 0.05, 0.004]), ...box([0.018, 0.16, 0.157], [0.04, 0.008, 0.004], 0), ...[0, 1, 2, 3].map((i) => { const a = (i * Math.PI) / 2; return L([0.052 * Math.cos(a), 0.16 + 0.052 * Math.sin(a), 0.157], [0.01, 0.01, 0.004]); })]], ["#B0BEC5", L([0.085, 0.16, 0.13], [0.02, 0.016, 0.016])]]);
// hängslen: kortbyxor med röda hängslen och spännen
await spara("hangslen", [["#5D4037", [...L([0, 0.26, 0], [0.32, 0.12, 0.13]), ...L([0.085, 0.14, 0], [0.15, 0.16, 0.12]), ...L([-0.085, 0.14, 0], [0.15, 0.16, 0.12])]], ["#E53935", [...box([0.065, 0.45, 0.07], [0.035, 0.32, 0.012], 0.12), ...box([-0.065, 0.45, 0.07], [0.035, 0.32, 0.012], -0.12), ...box([0.065, 0.45, -0.07], [0.035, 0.32, 0.012], 0.12), ...box([-0.065, 0.45, -0.07], [0.035, 0.32, 0.012], -0.12), ...L([0, 0.5, 0.072], [0.1, 0.03, 0.01])]], [met, [...L([0.085, 0.32, 0.075], [0.05, 0.035, 0.012]), ...L([-0.085, 0.32, 0.075], [0.05, 0.035, 0.012])]]]);
// overall: blå snickarbyxor med bröstlapp, axelband och knappar
await spara("overall", [["#1E88E5", [...L([0.08, 0.17, 0], [0.15, 0.34, 0.12]), ...L([-0.08, 0.17, 0], [0.15, 0.34, 0.12]), ...L([0, 0.42, 0], [0.32, 0.18, 0.13]), ...L([0, 0.58, 0.04], [0.2, 0.16, 0.03]), ...box([0.08, 0.68, 0.0], [0.04, 0.2, 0.02], 0.15), ...box([-0.08, 0.68, 0.0], [0.04, 0.2, 0.02], -0.15)]], ["#1565C0", [...L([0, 0.57, 0.058], [0.1, 0.07, 0.006]), ...L([0, 0.03, 0], [0.33, 0.04, 0.125])]], ["#FDD835", [...cylZ([0.07, 0.63, 0.058], 0.016, 0.01, 8), ...cylZ([-0.07, 0.63, 0.058], 0.016, 0.01, 8)]]]);
// hårspänne: rosett på ett spänne
await spara("harspanne", [["#F06292", [...prisma([[0, 0.12], [-0.16, 0.2], [-0.16, 0.04]], 0, 0.04), ...prisma([[0, 0.12], [0.16, 0.04], [0.16, 0.2]], 0, 0.04)]], ["#C2185B", L([0, 0.12, 0], [0.05, 0.07, 0.05])], [vit, prickar([[-0.11, 0.15, 0.022], [-0.09, 0.09, 0.022], [0.11, 0.15, 0.022], [0.09, 0.09, 0.022]], 0.012)[0][1]], [met, L([0, 0.02, -0.01], [0.26, 0.03, 0.02])]]);
// diadem: guldbåge med spetsar och stenar
await spara("diadem", [[guld, [...halvRing([0, 0, 0], 0.18, 0.014, "xy", 0, Math.PI, 18), ...[-0.1, -0.05, 0, 0.05, 0.1].flatMap((x) => { const y = Math.sqrt(0.18 ** 2 - x ** 2), h = x === 0 ? 0.11 : 0.07; return prisma([[x - 0.025, y - 0.01], [x + 0.025, y - 0.01], [x, y + h]], 0, 0.014); })]], ["#E91E63", E([0, 0.21, 0.012], [0.02, 0.025, 0.012], 8, 4)], ["#00BCD4", [-0.1, 0.1].flatMap((x) => E([x, Math.sqrt(0.18 ** 2 - x ** 2) + 0.01, 0.012], [0.014, 0.014, 0.01], 6, 4))]]);
// sovmask: blå sovmask med slutna ögon och resår
await spara("sovmask", [["#3949AB", [...E([-0.08, 0.085, 0], [0.09, 0.075, 0.025], 12, 6), ...E([0.08, 0.085, 0], [0.09, 0.075, 0.025], 12, 6)]], ["#C5CAE9", flytta(rotZ(halvRing([0, 0, -0.04], 0.15, 0.008, "xy", 0, Math.PI, 14), 0), [0, 0.09, 0])], [vit, [-0.08, 0.08].flatMap((x) => [...halvRing([x, 0.1, 0.024], 0.04, 0.006, "xy", Math.PI, 2 * Math.PI, 8), ...[-0.03, 0, 0.03].map((d) => L([x + d, 0.05, 0.024], [0.005, 0.02, 0.005]))])]]);
// nattmössa: lång randig toppluva som böjer sig, med tofs
{ const P = Array.from({ length: 10 }, (_, i) => { const t = i / 9; return [0.18 * t * t, 0.04 + 0.38 * Math.sin(t * 1.4), 0]; }); const R = P.map((_, i) => 0.14 * (1 - i / 9.5) + 0.005);
  const del = (a, b) => ror(P.slice(a, b + 1), R.slice(a, b + 1), 12);
  await spara("nattmossa", [["#3F51B5", [...del(0, 2), ...del(4, 6), ...del(8, 9)]], ["#FFEB3B", [...prickar([[0.05, 0.25, 0.1], [-0.06, 0.2, 0.1], [0.09, 0.36, 0.06]], 0.012, "")[0][1]]], [vit, [...del(2, 4), ...del(6, 8), ...cyl([0, 0, 0], 0.15, 0.06, 16), ...E([P[9][0] + 0.02, P[9][1], 0], [0.045, 0.045, 0.045], 8, 6)]]]); }
// badmössa: badmössa med blommor
await spara("badmossa", [["#26C6DA", E([0, 0, 0], [0.15, 0.15, 0.16], 16, 8, 0)], ["#00838F", cyl([0, 0, 0], 0.152, 0.025, 16)], ...[[0, 0.1], [0.075, 0.08], [-0.08, 0.06], [0.03, 0.14]].flatMap(([x, y]) => { const z = Math.sqrt(Math.max(0, 1 - (x / 0.15) ** 2 - (y / 0.15) ** 2)) * 0.16 + 0.004; return [["#F48FB1", [0, 1, 2, 3, 4].map((i) => E([x + 0.018 * Math.cos(i * 1.256), y + 0.018 * Math.sin(i * 1.256), z], [0.013, 0.013, 0.008], 6, 3))], ["#FFEB3B", E([x, y, z + 0.004], [0.01, 0.01, 0.008], 6, 3)]]; })]);
// simglasögon: två blå glas och ett band i en ögla bakåt
await spara("simglasogon", [["#0288D1", [...cylZ([0.075, 0.1, 0.15], 0.055, 0.04, 14), ...cylZ([-0.075, 0.1, 0.15], 0.055, 0.04, 14)]], ["#81D4FA", [...cylZ([0.075, 0.1, 0.172], 0.042, 0.006, 14), ...cylZ([-0.075, 0.1, 0.172], 0.042, 0.006, 14)]], ["#212121", [...flytta(torus(0.16, 0.012, 24, 6), [0, 0.1, -0.01]).map((tri) => tri.map(([x, y, z]) => [x, y, z])), ...L([0, 0.1, 0.16], [0.05, 0.015, 0.015])]]].map(([f, t]) => [f, flytta(platta(t), [0, -0.04, 0])]));
// halmhatt: halmhatt med rött band, lite framåtlutad
await spara("halmhatt", [["#E6C36A", [...varv([[0, 0], [0.32, 0], [0.33, 0.015], [0, 0.015]], 22), ...cyl([0, 0, 0], 0.15, 0.15, 18, "y", 0.13), ...cyl([0, 0.15, 0], 0.13, 0.01, 18, "y", 0.0)]], ["#E53935", cyl([0, 0.015, 0], 0.155, 0.04, 18)], ["#C9A24E", [0.2, 0.25, 0.3].flatMap((r) => varv([[r, 0.016], [r + 0.005, 0.016], [r + 0.005, 0.02], [r, 0.02]], 22))]].map(([f, t]) => [f, flytta(rotX(platta(t), 0.4), [0, 0.13, 0])]));
// morgonrock: ljusblå morgonrock med skärp och vit krage
await spara("morgonrock", [["#90CAF9", [...prisma([[-0.2, 0], [0.2, 0], [0.16, 0.62], [-0.16, 0.62]], 0, 0.14), ...box([0.22, 0.47, 0], [0.09, 0.3, 0.12], 0.45), ...box([-0.22, 0.47, 0], [0.09, 0.3, 0.12], -0.45)]], [vit, [...prisma([[-0.1, 0.63], [-0.02, 0.38], [0.02, 0.38], [0.1, 0.63]], 0.07, 0.012), ...box([0.29, 0.33, 0], [0.1, 0.05, 0.125], 0.45), ...box([-0.29, 0.33, 0], [0.1, 0.05, 0.125], -0.45)]], ["#90CAF9", prisma([[-0.06, 0.63], [-0.0, 0.43], [0.06, 0.63]], 0.08, 0.008)], ["#1565C0", [...L([0, 0.3, 0.0], [0.36, 0.04, 0.155]), ...box([0.05, 0.22, 0.078], [0.03, 0.14, 0.01], 0.15), ...box([0.0, 0.23, 0.078], [0.03, 0.13, 0.01], -0.15)]], ["#64B5F6", [...L([0.1, 0.16, 0.072], [0.09, 0.08, 0.006]), ...L([-0.1, 0.16, 0.072], [0.09, 0.08, 0.006])]]]);
// napp: napp med sköld, ring framåt och napp bakåt, står upp
await spara("napp", [["#4DD0E1", [...E([-0.055, 0.12, 0], [0.065, 0.075, 0.02], 12, 6), ...E([0.055, 0.12, 0], [0.065, 0.075, 0.02], 12, 6)]], ["#FFE082", E([0, 0.12, -0.06], [0.03, 0.035, 0.05], 10, 6)], [vit, [...cylZ([0, 0.12, 0.03], 0.025, 0.03, 12), ...torusXY([0, 0.12, 0.05], 0.06, 0.012)]], ["#00838F", [-0.06, 0.06].flatMap((x) => cylZ([x, 0.12, 0.018], 0.012, 0.008, 8))]].map(([f, t]) => [f, flytta(platta(t), [0, -0.04, 0])]));
// spjälsäng: vit spjälsäng på längden med madrass och filt
{ const sp = []; for (let i = 0; i <= 12; i++) { const x = -0.42 + i * 0.07; sp.push(...cyl([x, 0.25, 0.24], 0.012, 0.38, 6), ...cyl([x, 0.25, -0.24], 0.012, 0.38, 6)); }
  await spara("spjalsang", [[vit, [...sp, ...[0.46, -0.46].flatMap((x) => [...L([x, 0.36, 0], [0.04, 0.72, 0.52]), ...[0.24, -0.24].map((z) => L([x, 0.36, z], [0.05, 0.72, 0.05]))]), ...[0.24, -0.24].flatMap((z) => [L([0, 0.64, z], [0.92, 0.04, 0.04]), L([0, 0.25, z], [0.92, 0.04, 0.04])])]], ["#BBDEFB", L([0, 0.3, 0], [0.88, 0.08, 0.46])], ["#F8BBD0", [...L([0.12, 0.35, 0], [0.5, 0.03, 0.44])]], ["#FFF9C4", E([-0.3, 0.37, 0], [0.09, 0.04, 0.14], 10, 5)]]); }
// handväska: röd handväska med handtag och guldlås
await spara("handvaska", [["#C62828", [...prisma([[-0.2, 0], [0.2, 0], [0.16, 0.24], [-0.16, 0.24]], 0, 0.1), ...halvRing([0, 0.24, 0], 0.11, 0.014, "xy", 0, Math.PI, 12)]], ["#8E0000", prisma([[-0.165, 0.24], [-0.17, 0.15], [0.17, 0.15], [0.165, 0.24]].reverse().reverse(), 0.055, 0.012)], [guld, [...L([0, 0.15, 0.064], [0.05, 0.035, 0.012]), ...cylZ([0, 0.135, 0.068], 0.012, 0.01, 8)]]]);
// läppstift: öppet läppstift med snett skuren topp och locket bredvid
{ const topp = cyl([0, 0, 0], 0.03, 0.09, 12).map((tri) => tri.map(([x, y, z]) => [x, y > 0.05 ? 0.09 - 0.05 * (x + 0.03) / 0.06 + 0.0 : y, z]));
  await spara("lappstift", [[guld, [...cyl([0, 0, 0], 0.045, 0.14, 14), ...cyl([0, 0.14, 0], 0.036, 0.04, 14)]], ["#D50000", flytta(topp, [0, 0.18, 0])], ["#212121", [...cylZ([0.15, 0.045, 0.02], 0.045, 0.16, 14)]], [guld, cylZ([0.15, 0.045, 0.1], 0.047, 0.01, 14)]]); }
// parfym: rosa parfymflaska med guldhals och sprayboll
await spara("parfym", [["#F8BBD0", [...L([0, 0.13, 0], [0.22, 0.26, 0.1])]], ["#EC407A", L([0, 0.1, 0.051], [0.16, 0.16, 0.004])], [guld, [...cyl([0, 0.26, 0], 0.025, 0.05, 10), ...ror([[0, 0.3, 0], [0.04, 0.33, 0], [0.11, 0.32, 0]], [0.008, 0.008, 0.008], 6), ...L([0, 0.06, 0.054], [0.1, 0.02, 0.004])]], ["#AD1457", E([0.15, 0.32, 0], [0.045, 0.045, 0.045], 10, 6)]]);
// nagellack: liten röd nagellacksflaska med svart kork
await spara("nagellack", [["#E53935", [...E([0, 0.08, 0], [0.08, 0.08, 0.06], 12, 6, -0.8).map((tri) => tri.map(([x, y, z]) => [x, Math.max(0, y), z]))]], ["#FFCDD2", E([-0.03, 0.11, 0.045], [0.015, 0.03, 0.012], 6, 4)], [sv, [...cyl([0, 0.14, 0], 0.025, 0.02, 10), ...cyl([0, 0.16, 0], 0.032, 0.17, 10, "y", 0.028)]]]);
// tandkräm: tandkrämstub som står på korken
{ const tub = skala(cyl([0, 0.06, 0], 0.07, 0.32, 16, "y", 0.075), [1.25, 1, 0.7]).map((tri) => tri.map(([x, y, z]) => [x, y, y > 0.3 ? z * Math.max(0.15, 1 - (y - 0.3) / 0.09) : z]));
  await spara("tandkram", [[vit, [...cyl([0, 0, 0], 0.045, 0.06, 12), ...tub]], ["#1E88E5", L([0, 0.42, 0], [0.19, 0.03, 0.02])], ["#E53935", [...L([0, 0.22, 0.054], [0.17, 0.08, 0.004])]], ["#1E88E5", L([0, 0.14, 0.054], [0.17, 0.03, 0.004])]]); }
// termometer: utetermometer på en träskiva med röd stapel och skala
await spara("termometer", [[tra, [...L([0, 0.32, 0], [0.16, 0.6, 0.03]), ...L([0, 0.015, 0], [0.24, 0.03, 0.12])]], [vit, [...L([0, 0.34, 0.02], [0.03, 0.46, 0.012])]], ["#E53935", [...E([0, 0.1, 0.026], [0.03, 0.03, 0.02], 10, 6), ...L([0, 0.25, 0.027], [0.012, 0.28, 0.008])]], [sv, Array.from({ length: 9 }, (_, i) => L([0.035, 0.14 + i * 0.05, 0.017], [i % 2 ? 0.02 : 0.035, 0.006, 0.004]))], ["#1E88E5", L([0, 0.56, 0.017], [0.11, 0.05, 0.004])]]);
// plåster: plåster som står snett med sårkudde och små hål
{ const pl = [...L([0, 0, 0], [0.34, 0.1, 0.012]), ...cylZ([0.17, 0, 0], 0.05, 0.012, 12), ...cylZ([-0.17, 0, 0], 0.05, 0.012, 12)];
  const vr = (t) => flytta(rotZ(t, 0.35), [0, 0.13, 0]);
  await spara("plaster", [["#F0B98D", vr(pl)], ["#FFF3E0", vr(L([0, 0, 0.008], [0.11, 0.08, 0.008]))], ["#D7A27A", vr([-0.18, -0.13, 0.13, 0.18].flatMap((x) => [-0.025, 0.025].map((y) => L([x, y, 0.007], [0.01, 0.01, 0.004]))))]]); }
// kalender: bordskalender med röd rubrik, rutnät och spiral
{ const sida = [["#FAFAFA", L([0, 0, 0], [0.34, 0.3, 0.012])], ["#E53935", L([0, 0.12, 0.007], [0.34, 0.06, 0.004])], ["#90A4AE", Array.from({ length: 20 }, (_, i) => L([-0.12 + (i % 5) * 0.06, 0.06 - Math.floor(i / 5) * 0.05, 0.007], [0.04, 0.035, 0.004]))], ["#FFC107", L([0.0, 0.01, 0.009], [0.04, 0.035, 0.004])]];
  await spara("kalender", [...sida.map(([f, t]) => [f, flytta(rotX(t, -0.3), [0, 0.15, 0.045])]), ["#455A64", flytta(rotX(L([0, 0, 0], [0.34, 0.3, 0.012]), 0.3), [0, 0.15, -0.05])], [met, [-0.12, -0.06, 0, 0.06, 0.12].flatMap((x) => flytta(rotZ(torus(0.018, 0.004, 10, 4), Math.PI / 2), [x, 0.3, 0]))]]); }
// fotoalbum: stående fotoalbum med ett foto på framsidan och ett lösfoto
{ const foto = (c, s) => [["#FAFAFA", flytta(L([0, 0, 0], [0.16 * s, 0.13 * s, 0.006]), c)], ["#81D4FA", flytta(L([0, 0.015 * s, 0.004], [0.13 * s, 0.07 * s, 0.004]), c)], ["#66BB6A", flytta(L([0, -0.035 * s, 0.004], [0.13 * s, 0.03 * s, 0.004]), c)], ["#FDD835", flytta(E([0.04 * s, 0.03 * s, 0.006], [0.015 * s, 0.015 * s, 0.004], 6, 3), c)]];
  await spara("fotoalbum", [["#2E7D32", [...L([0, 0.19, 0], [0.3, 0.38, 0.03]), ...L([0, 0.19, -0.05], [0.3, 0.38, 0.03])]], ["#FFF8E1", L([0.005, 0.19, -0.025], [0.29, 0.37, 0.025])], ["#1B5E20", L([-0.15, 0.19, -0.025], [0.02, 0.38, 0.085])], ...foto([0.0, 0.22, 0.017], 1.2), ...foto([0.24, 0.07, 0.02], 1.0).map(([f, t]) => [f, rotZ(t, -0.3)]), [guld, L([0, 0.06, 0.017], [0.12, 0.02, 0.004])]]); }
// adventsljus: adventsljusstake med mossa, lingon och fyra ljus (två tända)
await spara("adventsljus", [["#5D4037", L([0, 0.03, 0], [0.7, 0.06, 0.14])], ["#558B2F", E([0, 0.06, 0], [0.36, 0.03, 0.08], 16, 4, 0)], ["#C62828", [[-0.25, 0.07, 0.06], [-0.08, 0.08, 0.07], [0.1, 0.07, 0.065], [0.27, 0.075, 0.05], [0.0, 0.08, -0.06]].flatMap((p) => E(p, [0.014, 0.014, 0.014], 6, 4))], [vit, [-0.24, -0.08, 0.08, 0.24].flatMap((x, i) => cyl([x, 0.06, 0], 0.03, 0.26 - i * 0.03, 12))], [sv, [-0.24, -0.08, 0.08, 0.24].flatMap((x, i) => cyl([x, 0.32 - i * 0.03, 0], 0.003, 0.02, 4))], ["#FFB300", [-0.24, -0.08].flatMap((x, i) => E([x, 0.36 - i * 0.03, 0], [0.014, 0.03, 0.014], 8, 5))]]);
console.log("klart");
