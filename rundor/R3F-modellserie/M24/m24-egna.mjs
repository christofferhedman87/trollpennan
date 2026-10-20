// R3F-M24: egna lågpolymodeller för sport, bad och friluftsliv (Trollpennan, CC0). +y upp, +z fram, står på y=0. Kör från en mapp med @gltf-transform och sharp.
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, unpartition, mergeDocuments } from "@gltf-transform/functions";
import sharp from "sharp";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const I = "/workspace/modell-inkorg";
const UT = process.env.UT ?? `${I}/trollpennan-sport-m24`;
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
const silver = "#CFD8DC", guld = "#FFC107";
const varvX = (prof, n, [cy, cz] = [0, 0], x0 = 0) => flytta(rotZ(varv(prof, n), -Math.PI / 2), [x0, cy, cz]);
// racket (tennis, badminton, pingis) upprätt i xy-planet: ram + nät + skaft
function racket(R, f, { sk = 0.3, nat = true, platt = false, fs = sv } = {}) {
  const yc = sk + R * 1.2, d = [];
  if (platt) d.push([f, skala(cylZ([0, yc, 0], R, 0.02, 16), [1, 1.15, 1], [0, yc, 0])]);
  else d.push([f, skala(ring([0, yc, 0], R, 0.016, "xy", 18), [1, 1.25, 1], [0, yc, 0])]);
  if (nat && !platt) d.push([vit, [...[-0.6, -0.3, 0, 0.3, 0.6].flatMap((k) => L([k * R, yc, 0], [0.004, 2.2 * R * Math.sqrt(1 - k * k) * 1.1, 0.004])), ...[-0.6, -0.3, 0, 0.3, 0.6].flatMap((k) => L([0, yc + k * R * 1.25, 0], [2 * R * Math.sqrt(1 - k * k) * 0.95, 0.004, 0.004]))]]);
  d.push([fs, [...cyl([0, 0, 0], 0.022, sk + 0.02, 8), ...(platt ? [] : ror([[0, sk, 0], [R * 0.3, sk + R * 0.25, 0]], [0.012, 0.012], 4).concat(ror([[0, sk, 0], [-R * 0.3, sk + R * 0.25, 0]], [0.012, 0.012], 4)))]]);
  return d;
}
const fot = (d) => [[sv, L([0, 0.01, 0], [d, 0.02, d * 0.6])]];

// ---------- sport, bad och friluftsliv
// tennisracket med boll
await spara("tennisracket", [...racket(0.14, "#1E88E5", { sk: 0.26, fs: "#212121" }).map(([f, t]) => [f, flytta(t, [0, 0.0, 0])]), ["#C6FF00", E([0.18, 0.05, 0.05], [0.05, 0.05, 0.05], 10, 8)]]);
// tennisboll: gulgrön boll med vita sömmar
await spara("tennisboll", [["#C6FF00", E([0, 0.12, 0], [0.12, 0.12, 0.12], 14, 10)], [vit, [...ror(Array.from({ length: 13 }, (_, i) => { const a = (i / 12) * 2 * Math.PI; return [0.122 * Math.cos(a) * Math.cos(0.5 * Math.sin(2 * a)), 0.12 + 0.122 * Math.sin(0.5 * Math.sin(2 * a)), 0.122 * Math.sin(a) * Math.cos(0.5 * Math.sin(2 * a))]; }), Array(13).fill(0.008), 4)]]]);
// badmintonracket med fjäderboll
await spara("badmintonracket", [...racket(0.11, "#E53935", { sk: 0.36 })]);
// pingisracket: rött pingisracket och vit boll
await spara("pingisracket", [...racket(0.11, "#E53935", { sk: 0.14, platt: true, fs: "#8D6E63" }), [sv, skala(cylZ([0, 0.272, -0.012], 0.11, 0.006, 16), [1, 1.15, 1], [0, 0.272, 0])], ["#FF7043", E([0.16, 0.035, 0.04], [0.035, 0.035, 0.035], 8, 6)]]);
// pingisbord: grönt bord med nät
await spara("pingisbord", [["#1B5E20", L([0, 0.6, 0], [1.4, 0.04, 0.78])], [vit, [...L([0, 0.621, 0], [1.4, 0.004, 0.02]).map((t) => t), ...L([0, 0.621, 0.38], [1.4, 0.004, 0.02]), ...L([0, 0.621, -0.38], [1.4, 0.004, 0.02]), ...L([0.69, 0.621, 0], [0.02, 0.004, 0.78]), ...L([-0.69, 0.621, 0], [0.02, 0.004, 0.78]), ...L([0, 0.68, 0], [0.01, 0.12, 0.84])]], [sv, [...[[0.6, 0.32], [-0.6, 0.32], [0.6, -0.32], [-0.6, -0.32]].flatMap(([x, z]) => cyl([x, 0, z], 0.025, 0.58, 8)), ...L([0, 0.75, 0.42], [0.03, 0.02, 0.03]), ...L([0, 0.75, -0.42], [0.03, 0.02, 0.03])]]]);
// hockeyklubba (ishockeyklubba) med puck
await spara("hockeyklubba", [[sv, [...box([0, 0.5, 0], [0.04, 1.0, 0.025], 0.12), ...box([0.2, 0.04, 0], [0.32, 0.07, 0.025], 0)]], [vit, [...box([-0.055, 0.9, 0], [0.045, 0.16, 0.03], 0.12), ...box([0.22, 0.04, 0.0], [0.2, 0.072, 0.027], 0)]], ["#1E88E5", box([0.0, 0.5, 0], [0.045, 0.05, 0.03], 0.12)]]);
// puck: svart puck
await spara("puck", [[sv, cyl([0, 0, 0], 0.12, 0.08, 18)], ["#E53935", cyl([0, 0.081, 0], 0.06, 0.003, 12)]]);
// innebandyklubba med boll med hål
await spara("innebandyklubba", [["#E53935", [...box([0, 0.45, 0], [0.035, 0.9, 0.035], 0.1)]], [sv, box([-0.045, 0.8, 0], [0.04, 0.16, 0.04], 0.1)], [vit, [...flytta(rotY(skala(E([0, 0, 0], [0.14, 0.05, 0.02], 10, 6), [1, 1, 1]), 0), [0.16, 0.04, 0]), ...E([0.3, 0.05, 0.08], [0.05, 0.05, 0.05], 10, 6)]], ["#B0BEC5", [[0.3, 0.05, 0.13], [0.35, 0.05, 0.08], [0.3, 0.1, 0.08], [0.25, 0.05, 0.08]].flatMap((p) => E(p, [0.012, 0.012, 0.012], 4, 3))]]);
// basketkorg: korg med nät, tavla och stolpe
await spara("basketkorg", [[silver, [...cyl([0, 0, -0.2], 0.035, 1.6, 8), ...L([0, 0.02, -0.2], [0.4, 0.04, 0.4])]], [vit, L([0, 1.5, -0.15], [0.7, 0.45, 0.03])], ["#E53935", [...L([0, 1.42, -0.13], [0.24, 0.02, 0.005]), ...L([0, 1.55, -0.13], [0.24, 0.02, 0.005]), ...L([0.11, 1.48, -0.13], [0.02, 0.15, 0.005]), ...L([-0.11, 1.48, -0.13], [0.02, 0.15, 0.005])]], ["#FF6D00", [...ring([0, 1.38, 0.0], 0.13, 0.012, "xz", 16), ...L([0, 1.38, -0.12], [0.06, 0.02, 0.06])]], [vit, Array.from({ length: 10 }, (_, i) => (i / 10) * 2 * Math.PI).flatMap((a) => ror([[0.13 * Math.cos(a), 1.38, 0.13 * Math.sin(a)], [0.08 * Math.cos(a + 0.3), 1.2, 0.08 * Math.sin(a + 0.3)]], [0.004, 0.004], 3))]]);
// fotbollsmål: litet fotbollsmål med nät
await spara("fotbollsmal", [[vit, [...cyl([0.6, 0, 0], 0.03, 0.7, 8), ...cyl([-0.6, 0, 0], 0.03, 0.7, 8), ...cylX([0, 0.7, 0], 0.03, 1.26, 8), ...ror([[0.6, 0.7, 0], [0.6, 0.0, -0.45]], [0.015, 0.015], 4), ...ror([[-0.6, 0.7, 0], [-0.6, 0.0, -0.45]], [0.015, 0.015], 4), ...cylX([0, 0.015, -0.45], 0.015, 1.2, 4)]], ["#ECEFF1", [...Array.from({ length: 11 }, (_, i) => -0.5 + i * 0.1).flatMap((x) => ror([[x, 0.7, 0], [x, 0.0, -0.45]], [0.004, 0.004], 3)), ...Array.from({ length: 6 }, (_, j) => j / 6).flatMap((t) => cylX([0, 0.7 - t * 0.7, -0.45 * t], 0.004, 1.2, 3))]]]);
// hopprep: hopprep med handtag i ögla
await spara("hopprep", [["#E91E63", [...ror(Array.from({ length: 15 }, (_, i) => { const a = (i / 14) * Math.PI; return [-0.25 * Math.cos(a), 0.02 + 0.0 * Math.sin(a), 0.2 * Math.sin(a) * 1.0]; }), Array(15).fill(0.012), 5), ...ror([[-0.25, 0.02, 0], [-0.25, 0.1, -0.02], [-0.22, 0.2, -0.02]], [0.012, 0.012, 0.012], 5), ...ror([[0.25, 0.02, 0], [0.25, 0.1, -0.02], [0.22, 0.2, -0.02]], [0.012, 0.012, 0.012], 5)]], ["#FDD835", [...flytta(rotZ(cyl([0, 0, 0], 0.025, 0.16, 8), 0.2), [-0.21, 0.2, -0.02]), ...flytta(rotZ(cyl([0, 0, 0], 0.025, 0.16, 8), -0.2), [0.21, 0.2, -0.02])]]]);
// frisbee: blå frisbee lite på sned
await spara("frisbee", [["#1E88E5", flytta(rotX(varv([[0, 0.03], [0.2, 0.025], [0.22, 0.0], [0.215, -0.01], [0.19, 0.01], [0, 0.015]], 22), 0.5), [0, 0.13, 0])], [vit, flytta(rotX(varv([[0.12, 0.031], [0.15, 0.03], [0.15, 0.032], [0.12, 0.033]], 22), 0.5), [0, 0.13, 0])]]);
// skridsko: vit konståkningsskridsko i profil
await spara("skridsko", [[vit, [...L([0, 0.13, 0], [0.26, 0.08, 0.1]), ...E([0.12, 0.13, 0], [0.06, 0.04, 0.05], 8, 4), ...L([-0.07, 0.26, 0], [0.12, 0.2, 0.1])]], ["#ECEFF1", [...L([0.03, 0.08, 0], [0.04, 0.03, 0.02]), ...L([-0.09, 0.08, 0], [0.04, 0.03, 0.02])]], [silver, [...L([-0.0, 0.05, 0], [0.32, 0.025, 0.008]), ...ror([[0.16, 0.05, 0], [0.19, 0.08, 0], [0.17, 0.11, 0]], [0.005, 0.005, 0.005], 3)]], ["#E53935", [0.18, 0.24, 0.3].flatMap((y) => L([-0.02, y, 0.051], [0.04, 0.008, 0.004]))]]);
// rullskridsko: rullskridsko med fyra hjul i profil
await spara("rullskridsko", [["#7E57C2", [...L([0, 0.12, 0], [0.26, 0.08, 0.1]), ...E([0.12, 0.12, 0], [0.06, 0.04, 0.05], 8, 4), ...L([-0.07, 0.25, 0], [0.12, 0.2, 0.1])]], [vit, L([0, 0.075, 0], [0.3, 0.02, 0.08])], ["#FDD835", [-0.11, -0.04, 0.04, 0.11].flatMap((x) => cylZ([x, 0.035, 0], 0.035, 0.03, 10))], [vit, [0.17, 0.23, 0.29].flatMap((y) => L([-0.02, y, 0.051], [0.04, 0.008, 0.004]))]]);
// skida: ett par skidor och stavar som står uppställda
await spara("skida", [["#E53935", [...[0.06, -0.06].flatMap((x) => [...L([x, 0.6, 0], [0.08, 1.2, 0.02]), ...flytta(rotX(L([0, 0, 0], [0.08, 0.12, 0.02]), 0.4), [x, 1.24, 0.02])])]], [sv, [0.06, -0.06].flatMap((x) => L([x, 0.55, 0.015], [0.06, 0.12, 0.02]))], [silver, [...[0.18, -0.18].flatMap((x) => [...ror([[x, 0.0, 0.06], [x * 0.7, 1.1, 0]], [0.01, 0.01], 4), ...ring([x * 0.98, 0.1, 0.055], 0.04, 0.006, "xz", 8)])]], ["#1E88E5", [0.18, -0.18].flatMap((x) => cyl([x * 0.7, 1.05, 0], 0.02, 0.1, 6))]]);
// snowboard: snowboard med bindningar, lutad mot en snöhög
await spara("snowboard", [["#00ACC1", flytta(rotX(skala(cylZ([0, 0, 0], 0.13, 0.02, 14), [1, 4.5, 1]), -0.25), [0, 0.6, 0])], ["#FDD835", flytta(rotX(skala(cylZ([0, 0, 0.012], 0.1, 0.004, 14), [1, 4.2, 1]).filter((tri) => tri.every((p) => Math.abs(p[1]) < 0.15)), -0.25), [0, 0.6, 0])], [sv, flytta(rotX([...L([0, 0.2, 0.03], [0.18, 0.05, 0.04]), ...L([0, -0.2, 0.03], [0.18, 0.05, 0.04])], -0.25), [0, 0.6, 0])], ["#FAFAFA", E([0, 0, -0.18], [0.3, 0.2, 0.2], 10, 6, 0)]]);
// hjälm: blå cykelhjälm med ventiler och spänne
await spara("hjalm", [["#1E88E5", E([0, 0.0, 0], [0.18, 0.18, 0.22], 14, 8, 0)], [sv, [...[-0.08, 0, 0.08].flatMap((x) => L([x, 0.17, 0.0], [0.03, 0.02, 0.2])), ...L([0, 0.04, 0.2], [0.1, 0.03, 0.04])]], ["#FDD835", [...L([0, 0.13, 0.17], [0.24, 0.03, 0.04]), ...ror([[0.16, 0.02, 0.05], [0.12, -0.0, 0.12]], [0.008, 0.008], 4), ...ror([[-0.16, 0.02, 0.05], [-0.12, -0.0, 0.12]], [0.008, 0.008], 4)]]].map(([f, t]) => [f, flytta(t, [0, 0.02, 0])]));
// medalj: guldmedalj med band, upprätt
await spara("medalj", [[guld, [...flytta(cylZ([0, 0, 0], 0.12, 0.03, 18), [0, 0.12, 0]), ...L([0, 0.0, 0], [0.12, 0.012, 0.08])]], ["#FFE082", [...flytta(cylZ([0, 0, 0.016], 0.08, 0.006, 5), [0, 0.12, 0])]], ["#1E88E5", [...box([-0.06, 0.34, -0.005], [0.07, 0.24, 0.006], -0.3), ...box([0.06, 0.34, -0.005], [0.07, 0.24, 0.006], 0.3)]], ["#FDD835", [...box([-0.06, 0.34, -0.001], [0.02, 0.24, 0.006], -0.3), ...box([0.06, 0.34, -0.001], [0.02, 0.24, 0.006], 0.3)]]]);
// kägla: tre bowlingkäglor
await spara("kagla", [...[[0, -0.06], [-0.13, 0.06], [0.13, 0.06]].flatMap(([x, z]) => [[vit, varv([[0, 0], [0.05, 0], [0.075, 0.08], [0.07, 0.15], [0.035, 0.24], [0.03, 0.28], [0.045, 0.34], [0.03, 0.39], [0, 0.4]], 14, [x, z])], ["#E53935", [...varv([[0.035, 0.25], [0.038, 0.25], [0.034, 0.27], [0.031, 0.27]], 14, [x, z]), ...varv([[0.04, 0.2], [0.045, 0.2], [0.04, 0.22], [0.036, 0.22]], 14, [x, z])]]])]);
// bowlingklot: blått bowlingklot med tre hål
await spara("bowlingklot", [["#3949AB", E([0, 0.15, 0], [0.15, 0.15, 0.15], 16, 12)], ["#7986CB", [[0.1, 0.24, 0.05], [-0.08, 0.1, 0.11], [0.05, 0.05, -0.13]].flatMap((p) => E(p, [0.03, 0.03, 0.03], 6, 3))], [sv, [[0, 0.22, 0.13], [0.04, 0.27, 0.11], [-0.04, 0.27, 0.11]].flatMap((p) => E(p, [0.02, 0.02, 0.01], 6, 3))]]);
// visselpipa: visselpipa med snöre
await spara("visselpipa", [[silver, [...cylX([0, 0.06, 0], 0.05, 0.12, 12), ...L([0.1, 0.08, 0], [0.12, 0.04, 0.05])]], [sv, [...L([0.04, 0.11, 0], [0.03, 0.006, 0.04])]], ["#E53935", ring([-0.13, 0.06, 0], 0.07, 0.008, "xz", 12)]]);
// stoppur: stoppur med knapp och visare
await spara("stoppur", [[silver, [...flytta(cylZ([0, 0, 0], 0.13, 0.05, 18), [0, 0.13, 0]), ...cyl([0, 0.26, 0], 0.025, 0.04, 8), ...cyl([0, 0.3, 0], 0.035, 0.02, 8)]], [vit, flytta(cylZ([0, 0, 0.026], 0.11, 0.004, 18), [0, 0.13, 0])], ["#E53935", [...box([0, 0.17, 0.03], [0.008, 0.08, 0.004]), ...box([0.1, 0.24, 0], [0.03, 0.03, 0.03], -0.6)]], [sv, Array.from({ length: 12 }, (_, i) => (i / 12) * 2 * Math.PI).flatMap((a) => L([0.095 * Math.sin(a), 0.13 + 0.095 * Math.cos(a), 0.03], [0.01, 0.01, 0.004]))], [sv, [...L([0, 0.01, 0], [0.14, 0.02, 0.06])]]]);
// hantel: två hantlar
await spara("hantel", [...[[0, 0.08], [0.05, -0.12]].flatMap(([x, z]) => [[sv, [...cylX([x - 0.13, 0.08, z], 0.08, 0.07, 14), ...cylX([x + 0.13, 0.08, z], 0.08, 0.07, 14)]], [silver, [...cylX([x, 0.08, z], 0.022, 0.32, 8)]], ["#E53935", [...cylX([x - 0.13, 0.08, z], 0.082, 0.02, 14), ...cylX([x + 0.13, 0.08, z], 0.082, 0.02, 14)]]])]);
// skivstång: skivstång med vikter på ett ställ
await spara("skivstang", [[silver, [...cylX([0, 0.5, 0], 0.02, 1.3, 8)]], [sv, [...cylX([0.5, 0.5, 0], 0.2, 0.06, 16), ...cylX([-0.5, 0.5, 0], 0.2, 0.06, 16), ...cylX([0.57, 0.5, 0], 0.15, 0.05, 16), ...cylX([-0.57, 0.5, 0], 0.15, 0.05, 16)]], ["#E53935", [...cylX([0.5, 0.5, 0], 0.08, 0.065, 12), ...cylX([-0.5, 0.5, 0], 0.08, 0.065, 12)]], ["#455A64", [...[0.3, -0.3].flatMap((x) => [...L([x, 0.24, 0], [0.04, 0.48, 0.04]), ...L([x, 0.01, 0], [0.06, 0.02, 0.3]), ...L([x, 0.47, 0.03], [0.04, 0.06, 0.02])])]]]);
// boxningshandske: ett par röda boxningshandskar
await spara("boxningshandske", [...[0.13, -0.13].flatMap((x, i) => [["#E53935", [...E([x, 0.2, 0.02], [0.11, 0.13, 0.1], 12, 8), ...E([x - Math.sign(x) * 0.09, 0.17, 0.06], [0.04, 0.06, 0.04], 6, 4)]], [vit, [...cyl([x, 0.0, 0], 0.08, 0.1, 12)]], ["#B71C1C", [...cyl([x, 0.09, 0], 0.085, 0.03, 12)]]])]);
// darttavla: darttavla på stativ med pilar
await spara("darttavla", [["#212121", flytta(cylZ([0, 0, 0], 0.26, 0.04, 20), [0, 0.6, 0])], ["#E53935", flytta(cylZ([0, 0, 0.021], 0.2, 0.004, 20), [0, 0.6, 0])], ["#FFF8E1", flytta(cylZ([0, 0, 0.024], 0.14, 0.004, 20), [0, 0.6, 0])], ["#43A047", flytta(cylZ([0, 0, 0.027], 0.07, 0.004, 16), [0, 0.6, 0])], ["#E53935", flytta(cylZ([0, 0, 0.03], 0.025, 0.004, 10), [0, 0.6, 0])], [tra, [...L([0, 0.2, -0.05], [0.04, 0.6, 0.04]), ...L([0, 0.01, -0.05], [0.3, 0.02, 0.3])]], [silver, [[0.05, 0.63], [-0.08, 0.56], [0.02, 0.5]].flatMap(([x, y]) => cylZ([x, y, 0.08], 0.006, 0.1, 4))], ["#FDD835", [[0.05, 0.63], [-0.08, 0.56], [0.02, 0.5]].flatMap(([x, y]) => [...L([x, y, 0.14], [0.04, 0.004, 0.04]), ...L([x, y, 0.14], [0.004, 0.04, 0.04])])]]);
// simring: randig simring
{ const torus = (R, r, n = 22, m = 10) => varv(Array.from({ length: m + 1 }, (_, k) => { const t = (k / m) * 2 * Math.PI; return [R + r * Math.cos(t), r * Math.sin(t)]; }), n);
  const band = (a) => flytta(rotZ(rotX(cylZ([0, 0, 0], 0.088, 0.07, 12), Math.PI / 2), a), [0.2 * Math.cos(a), 0.2 * Math.sin(a), 0]);
  await spara("simring", [["#FF7043", flytta(rotX(torus(0.2, 0.08), Math.PI / 2), [0, 0.28, 0])], [vit, [0.4, 0.4 + Math.PI / 2, 0.4 + Math.PI, 0.4 + 1.5 * Math.PI].flatMap((a) => flytta(band(a), [0, 0.28, 0]))]]); }
// flytväst: orange flytväst med spännen och reflexer
await spara("flytvast", [["#FF6D00", [...L([0.11, 0.3, 0], [0.18, 0.5, 0.16]), ...L([-0.11, 0.3, 0], [0.18, 0.5, 0.16]), ...L([0, 0.32, -0.06], [0.4, 0.46, 0.06]), ...L([0.11, 0.6, -0.02], [0.1, 0.12, 0.1]), ...L([-0.11, 0.6, -0.02], [0.1, 0.12, 0.1])]], [sv, [0.2, 0.35].flatMap((y) => [...L([0, y, 0.082], [0.4, 0.03, 0.004]), ...L([0, y, 0.085], [0.06, 0.05, 0.01])])], ["#B0BEC5", [...L([0.12, 0.47, 0.082], [0.12, 0.03, 0.004]), ...L([-0.12, 0.47, 0.082], [0.12, 0.03, 0.004])]]]);
// surfbräda: surfbräda som står i sanden
await spara("surfbrada", [["#FDD835", flytta(skala(cylZ([0, 0, 0], 0.18, 0.04, 16), [1, 4.2, 1]), [0, 0.76, 0])], ["#E53935", [...L([0, 0.76, 0.021], [0.03, 1.4, 0.004])]], ["#1E88E5", [...L([0, 1.05, 0.022], [0.2, 0.04, 0.004]), ...L([0, 0.45, 0.022], [0.2, 0.04, 0.004])]], ["#FFE0B2", E([0, 0.0, 0], [0.32, 0.12, 0.25], 10, 6, 0)]]);
// kajak: röd kajak i profil med paddel
await spara("kajak", [["#E53935", skala(E([0, 0.12, 0], [0.9, 0.12, 0.2], 18, 8), [1, 1, 1]).map((tri) => tri.map(([x, y, z]) => [x, Math.max(y, 0.03) + (Math.abs(x) > 0.5 ? (Math.abs(x) - 0.5) * 0.15 : 0), z]))], [sv, [...skala(cyl([0, 0.22, 0], 0.14, 0.03, 14), [1.6, 1, 1])]], ["#FDD835", [...flytta(rotY(cylX([0, 0, 0], 0.015, 1.2, 6), 0.3), [0.05, 0.3, 0.05]), ...flytta(rotY(skala(cylX([0, 0, 0], 0.08, 0.02, 10), [1, 1, 0.5]), 0.3), [0.6, 0.3, -0.13]).map((t) => t), ...flytta(rotY(skala(cylX([0, 0, 0], 0.08, 0.02, 10), [1, 1, 0.5]), 0.3), [-0.52, 0.3, 0.23])]]]);
// paddel: kanotpaddel som står
await spara("paddel", [[tra, [...cyl([0, 0.4, 0], 0.02, 0.6, 8), ...L([0, 1.02, 0], [0.12, 0.04, 0.04])]], ["#FF7043", [...skala(E([0, 0.22, 0], [0.1, 0.22, 0.02], 10, 6), [1, 1, 1])]]]);
// metspö: metspö med rulle, lina och flöte i ett ställ
await spara("metspo", [[tra, [...ror([[0, 0.0, -0.1], [0.4, 1.1, 0.0]], [0.02, 0.008], 6)]], [sv, [...cyl([0.05, 0.14, -0.08], 0.03, 0.04, 10), ...L([0.0, 0.01, -0.1], [0.16, 0.02, 0.16])]], ["#ECEFF1", ror([[0.4, 1.1, 0.0], [0.45, 0.6, 0.02], [0.47, 0.25, 0.02]], [0.003, 0.003, 0.003], 3)], ["#E53935", E([0.47, 0.22, 0.02], [0.025, 0.035, 0.025], 6, 4)], [vit, E([0.47, 0.18, 0.02], [0.022, 0.02, 0.022], 6, 3)]]);
// håv: fiskhåv med nät och skaft
await spara("hav", [[tra, [...ror([[-0.5, 0.05, 0], [0.05, 0.3, 0]], [0.02, 0.02], 6)]], [silver, ring([0.24, 0.36, 0], 0.15, 0.012, "xz", 16)], ["#4DB6AC", E([0.24, 0.3, 0], [0.12, 0.12, 0.15], 10, 6).filter((tri) => tri.every((p) => p[1] <= 0.36))]]);
// gungbräda: gungbräda med handtag
await spara("gungbrada", [[tra, [...flytta(rotZ(L([0, 0, 0], [1.4, 0.05, 0.18]), 0.15), [0, 0.28, 0])]], ["#E53935", [...L([0, 0.12, 0], [0.12, 0.24, 0.24]), ...cylZ([0, 0.27, 0], 0.04, 0.3, 8)]], ["#FDD835", [...[0.5, -0.5].flatMap((x) => { const y = 0.28 + x * Math.sin(0.15) + 0.03; return [...ror([[x - 0.06, y, 0.06], [x - 0.06, y + 0.14, 0.06], [x - 0.06, y + 0.14, -0.06], [x - 0.06, y, -0.06]], [0.012, 0.012, 0.012, 0.012], 4)]; })]]]);
console.log("klart");
