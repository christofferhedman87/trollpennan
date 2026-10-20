// R3F-MFIX4: nya egna modeller för eld, fjällräv, björn, hamster, marsvin, fenix och sjöorm (bygger på M20/m20-egna.mjs) (Trollpennan, CC0). +y upp, +z fram, står på y=0. Kör från en mapp med @gltf-transform och sharp.
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, unpartition, mergeDocuments } from "@gltf-transform/functions";
import sharp from "sharp";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const I = "/workspace/modell-inkorg";
const UT = process.env.UT ?? `${I}/trollpennan-mfix4`;
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

const sv = "#212121", vi = "#FAFAFA";
const ogon = (x, y, z, r = 0.04) => [[sv, [...E([x, y, z], [r, r, r * 0.7], 6, 4), ...E([-x, y, z], [r, r, r * 0.7], 6, 4)]], [vi, [...E([x + r * 0.3, y + r * 0.35, z + r * 0.55], [r * 0.3, r * 0.3, r * 0.2], 4, 3), ...E([-x + r * 0.3, y + r * 0.35, z + r * 0.55], [r * 0.3, r * 0.3, r * 0.2], 4, 3)]]];
// spegla en del i x
const spx = (t) => t.map((tri) => [tri[0], tri[2], tri[1]].map(([x, y, z]) => [-x, y, z]));
// låga, böjda lågtungor: rör uppåt med vågor, radien smalnar till en spets
const tunga = ([x, z], h, r, fas, sv2 = 0.08) => { const n = 7, p = [], rr = []; for (let i = 0; i <= n; i++) { const t = i / n; p.push([x + Math.sin(fas + t * 4) * sv2 * t, h * t, z + Math.cos(fas + t * 3) * sv2 * 0.6 * t]); rr.push(Math.max(0.006, r * (1 - t) ** 0.8 * (t < 0.15 ? 0.7 + 2 * t : 1))); } return ror(p, rr, 10); };

// ---------- eld: lägereld med korslagda vedträn, stenring och flammor i tre lager
{ const ved = [0, 1.05, 2.1].flatMap((a) => cylZ([0, 0.07, 0], 0.06, 0.7, 10).map((t) => t.map(([x, y, z]) => [x * Math.cos(a) + z * Math.sin(a), y + 0.0, -x * Math.sin(a) + z * Math.cos(a)])));
  const stenar = runt(0.42, 0.05, 11, 0.2).flatMap((p, i) => E(p, [0.09, 0.06 + 0.015 * (i % 3), 0.08], 7, 4));
  const rod = [[0, 0, 0.62, 0.2, 0], [0.13, 0.05, 0.45, 0.13, 1.7], [-0.12, 0.06, 0.48, 0.13, 3.1], [0.03, -0.13, 0.5, 0.13, 4.4], [-0.02, 0.14, 0.42, 0.12, 5.6]];
  const ora = [[0.02, 0.01, 0.48, 0.15, 0.8], [0.09, -0.06, 0.34, 0.1, 2.4], [-0.09, -0.02, 0.36, 0.1, 4.0], [-0.03, 0.09, 0.32, 0.09, 5.1]];
  const gul = [[0, 0.1, 0.4, 0.11, 1.3], [0.1, 0.12, 0.26, 0.07, 3.3], [-0.1, 0.1, 0.28, 0.07, 0.4], [0.04, -0.12, 0.26, 0.07, 2.2]];
  const f = (L2, k) => L2.flatMap(([x, z, hh, r, fas]) => tunga([x * k, z * k], hh, r, fas).map((t) => t.map(([a, b, c]) => [a, b + 0.08, c])));
  await spara("eld", [["#6D4C41", ved], ["#9E9E9E", stenar], ["#F4511E", f(rod, 1)], ["#FFB300", f(ora, 1)], ["#FFF176", f(gul, 1)], ["#FFAB40", [[0.15, 0.1, 0.12], [-0.17, 0.08, -0.05], [0.05, 0.1, -0.18]].flatMap((p) => E(p, [0.03, 0.02, 0.03], 6, 3))]]); }

// ---------- fjällräv: vit räv med spetsig nos, trekantiga öron, smala ben och stor yvig svans (fram +z)
{ const vit = "#F5F5F5", gra = "#CFD8DC";
  const ben = [[0.09, 0.2], [-0.09, 0.2], [0.09, -0.22], [-0.09, -0.22]].flatMap(([x, z]) => ror([[x, 0.3, z], [x, 0.15, z + 0.01], [x, 0.03, z + 0.02]], [0.055, 0.042, 0.035], 8));
  const ora = (sx) => { const b = [0.07 * sx, 0.64, 0.33]; return [[b[0] - 0.045 * sx, b[1], b[2] - 0.02], [b[0] + 0.045 * sx, b[1], b[2] - 0.02], [b[0] + 0.01 * sx, b[1] + 0.14, b[2] - 0.03]]; };
  const oraT = (sx) => { const [a, b, c] = ora(sx); const d = [ (a[0] + b[0]) / 2, a[1] + 0.02, a[2] - 0.04 ]; return sx > 0 ? [[a, b, c], [b, a, c], [a, d, c], [d, b, c]] : [[b, a, c], [a, b, c], [d, a, c], [b, d, c]]; };
  await spara("fjallrav", [[vit, [...E([0, 0.36, 0], [0.17, 0.16, 0.3], 12, 8), ...E([0, 0.5, 0.3], [0.12, 0.11, 0.12], 12, 8), ...varv([[0, 0], [0.08, 0.02], [0.035, 0.15], [0, 0.17]], 10).map((t) => t.map(([x, y, z]) => [x * 0.9, 0.47 + z * 0.8, 0.36 + y])), ...ben, ...oraT(1), ...oraT(-1), ...ror([[0, 0.36, -0.26], [0, 0.32, -0.42], [0.05, 0.38, -0.6], [0.06, 0.5, -0.68]], [0.07, 0.12, 0.13, 0.04], 10)]],
    [gra, [...E([0, 0.28, 0.08], [0.11, 0.08, 0.2], 10, 6), ...[[0.09, 0.2], [-0.09, 0.2], [0.09, -0.22], [-0.09, -0.22]].flatMap(([x, z]) => E([x, 0.03, z + 0.04], [0.04, 0.025, 0.05], 6, 3))]], [sv, E([0, 0.45, 0.54], [0.025, 0.02, 0.02], 6, 4)], ...ogon(0.06, 0.55, 0.39, 0.025)]); }

// ---------- björn: tung kropp med skulderpuckel, rundade knubbiga ben med tassar och klor (fram +z)
{ const b = "#6D4C41", m = "#4E342E", l = "#BCAAA4";
  const ben = (x, z, fram) => ror([[x, 0.62, z], [x * 1.05, 0.38, z + (fram ? 0.04 : -0.02)], [x * 1.05, 0.12, z + (fram ? 0.06 : 0.0)]], [0.17, 0.15, 0.13], 10);
  const tass = (x, z) => [...E([x * 1.05, 0.07, z + 0.06], [0.15, 0.08, 0.18], 10, 5)];
  const klor = (x, z) => [-0.06, 0, 0.06].map((dx) => E([x * 1.05 + dx, 0.05, z + 0.23], [0.02, 0.02, 0.03], 4, 3)).flat();
  await spara("bjorn", [[b, [...E([0, 0.72, -0.05], [0.42, 0.38, 0.7], 14, 9), ...E([0, 0.95, 0.28], [0.36, 0.3, 0.32], 12, 8), ...E([0, 0.98, 0.72], [0.25, 0.24, 0.24], 12, 8), ...E([0.17, 1.2, 0.68], [0.08, 0.08, 0.05], 8, 5), ...E([-0.17, 1.2, 0.68], [0.08, 0.08, 0.05], 8, 5), ...ben(0.24, 0.4, true), ...ben(-0.24, 0.4, true), ...ben(0.24, -0.45, false), ...ben(-0.24, -0.45, false), ...E([0, 0.8, -0.76], [0.08, 0.08, 0.07], 6, 4)]],
    [m, [...tass(0.24, 0.4), ...tass(-0.24, 0.4), ...tass(0.24, -0.45), ...tass(-0.24, -0.45)]], [l, [...E([0, 0.9, 0.94], [0.13, 0.1, 0.12], 10, 6), ...E([0.17, 1.2, 0.71], [0.04, 0.04, 0.03], 6, 4), ...E([-0.17, 1.2, 0.71], [0.04, 0.04, 0.03], 6, 4)]],
    [sv, [...E([0, 0.95, 1.05], [0.05, 0.04, 0.03], 6, 4), ...klor(0.24, 0.4), ...klor(-0.24, 0.4)]], ...ogon(0.1, 1.04, 0.92, 0.03)]); }

// ---------- hamster: sitter upprätt med kindpåsar, små öron, framtassar som håller ett solrosfrö (fram +z)
{ const o = "#E8A15A", v = "#FFF3E0", r = "#F48FB1";
  await spara("hamster", [[o, [...E([0, 0.2, 0], [0.19, 0.2, 0.17], 12, 8), ...E([0, 0.43, 0.04], [0.15, 0.13, 0.14], 12, 8), ...E([0.1, 0.55, 0.02], [0.05, 0.05, 0.025], 8, 5), ...E([-0.1, 0.55, 0.02], [0.05, 0.05, 0.025], 8, 5)]],
    [v, [...E([0, 0.18, 0.08], [0.14, 0.15, 0.11], 10, 6), ...E([0.1, 0.39, 0.1], [0.08, 0.07, 0.07], 8, 6), ...E([-0.1, 0.39, 0.1], [0.08, 0.07, 0.07], 8, 6), ...E([0, 0.4, 0.16], [0.06, 0.05, 0.03], 8, 5)]],
    [r, [...E([0.1, 0.55, 0.035], [0.03, 0.03, 0.01], 6, 4), ...E([-0.1, 0.55, 0.035], [0.03, 0.03, 0.01], 6, 4), ...E([0, 0.43, 0.185], [0.018, 0.014, 0.012], 6, 4), ...E([0.035, 0.29, 0.19], [0.025, 0.02, 0.03], 6, 4), ...E([-0.035, 0.29, 0.19], [0.025, 0.02, 0.03], 6, 4), ...E([0.09, 0.02, 0.12], [0.04, 0.02, 0.05], 6, 3), ...E([-0.09, 0.02, 0.12], [0.04, 0.02, 0.05], 6, 3)]],
    [sv, E([0, 0.295, 0.215], [0.02, 0.035, 0.012], 6, 4)], ["#9E9E9E", E([0, 0.297, 0.218], [0.008, 0.03, 0.006], 4, 3)], ...ogon(0.065, 0.47, 0.155, 0.022)]); }

// ---------- marsvin: långt bröd-format marsvin i tre färger, hängande blomöron, små fötter (fram +z)
{ const vit = vi, br = "#A1662F", sva = "#3E2723";
  await spara("marsvin", [[vit, [...E([0, 0.17, -0.02], [0.17, 0.16, 0.3], 12, 8), ...E([0, 0.19, 0.25], [0.13, 0.13, 0.12], 10, 8)]],
    [br, [...E([0.02, 0.21, -0.18], [0.172, 0.14, 0.15], 12, 8), ...E([0.06, 0.23, 0.23], [0.1, 0.12, 0.1], 10, 6), ...E([0.12, 0.31, 0.2], [0.06, 0.05, 0.02], 8, 4).map((t) => t.map(([x, y, z]) => [x, y, z])), ...E([-0.12, 0.31, 0.2], [0.06, 0.05, 0.02], 8, 4)]],
    [sva, [...E([-0.05, 0.22, 0.03], [0.15, 0.13, 0.11], 10, 6)]], ["#F8BBD0", [[0.09, 0.15], [-0.09, 0.15], [0.09, -0.18], [-0.09, -0.18]].flatMap(([x, z]) => E([x, 0.02, z], [0.035, 0.025, 0.045], 6, 3))],
    [sv, E([0, 0.16, 0.36], [0.02, 0.016, 0.012], 6, 4)], ...ogon(0.09, 0.24, 0.31, 0.024)]); }

// ---------- fenix: eldfågel med utbredda vingar av fjädrar, tofs och lång flammande stjärt (fram +z, flyger)
{ const rod = "#D32F2F", ora = "#FB8C00", gul = "#FFD54F";
  const vinge = (sx) => { const d = { [rod]: [], [ora]: [], [gul]: [] }; for (let i = 0; i < 6; i++) { const t = i / 5; const x = sx * (0.18 + t * 0.62), y = 0.62 + Math.sin(t * 2.2) * 0.22, l = 0.34 - t * 0.12; const f = [rod, ora, gul][i % 3]; d[f].push(...ror([[x, y, 0.02], [x + sx * 0.04, y - 0.05, -l * 0.5], [x + sx * 0.06, y - 0.12, -l]], [0.06, 0.05, 0.012], 8)); } d[rod].push(...ror([[sx * 0.1, 0.6, 0.05], [sx * 0.45, 0.78, 0.03], [sx * 0.8, 0.82, 0.0]], [0.07, 0.06, 0.03], 8)); return d; };
  const v1 = vinge(1), v2 = vinge(-1);
  const stjart = [[0, rod, 0.0], [0.12, ora, 0.6], [-0.12, ora, -0.6], [0.24, gul, 1.2], [-0.24, gul, -1.2]];
  const st = { [rod]: [], [ora]: [], [gul]: [] };
  for (const [x, f, a] of stjart) st[f].push(...ror([[0, 0.52, -0.2], [x * 0.5, 0.42, -0.5], [x, 0.35 + Math.abs(a) * 0.04, -0.85], [x * 1.3, 0.42, -1.1]], [0.06, 0.05, 0.04, 0.01], 8));
  await spara("fenix", [[rod, [...E([0, 0.58, 0], [0.13, 0.13, 0.24], 12, 8), ...E([0, 0.78, 0.2], [0.1, 0.1, 0.1], 10, 8), ...v1[rod], ...v2[rod], ...st[rod]]], [ora, [...v1[ora], ...v2[ora], ...st[ora], ...E([0, 0.54, 0.08], [0.1, 0.09, 0.14], 10, 6)]], [gul, [...v1[gul], ...v2[gul], ...st[gul], ...[[0, 0.02], [0.04, -0.03], [-0.04, -0.03]].flatMap(([x, z]) => tunga([x, 0.18 + z], 0.18, 0.025, x * 20, 0.04).map((t) => t.map(([a, b, c]) => [a, b + 0.82, c])))]],
    ["#FFA000", [...varv([[0, 0], [0.035, 0.0], [0, 0.1]], 8).map((t) => t.map(([x, y, z]) => [x, 0.76 - y * 0.3, 0.29 + y]))]], ...ogon(0.055, 0.81, 0.27, 0.02), ["#FFA000", [...ror([[0.04, 0.45, 0.05], [0.05, 0.3, 0.08]], [0.015, 0.012], 5), ...ror([[-0.04, 0.45, 0.05], [-0.05, 0.3, 0.08]], [0.015, 0.012], 5)]]]); }

// ---------- sjöorm: tjock orm vars puckel-bågar sticker upp ur vattnet, upprest huvud med kam och fenor (fram +z, simmar)
{ const g = "#00897B", lj = "#B2DFDB", k = "#FFB300";
  const bage = (z0, R, r0) => { const p = [], rr = []; for (let i = 0; i <= 10; i++) { const a = Math.PI * (i / 10); p.push([Math.sin(i * 0.6) * 0.03, R * Math.sin(a), z0 - R + R * Math.cos(Math.PI - a) * -1 + 2 * R * 0]); rr.push(r0); } return p.map(([x, y, z], i) => [x, y, z0 - R * Math.cos(Math.PI * (i / 10))]); };
  const b1 = bage(-0.2, 0.22, 0.1), b2 = bage(-0.75, 0.18, 0.085), b3 = bage(-1.2, 0.13, 0.065);
  const hals = [[0, 0, 0.02], [0, 0.25, 0.08], [0, 0.5, 0.12], [0, 0.66, 0.24]];
  await spara("sjoorm", [[g, [...ror(b1, b1.map(() => 0.1), 10), ...ror(b2, b2.map(() => 0.085), 10), ...ror(b3, b3.map(() => 0.065), 10), ...ror(hals, [0.1, 0.1, 0.095, 0.09], 10), ...E([0, 0.7, 0.32], [0.11, 0.09, 0.15], 12, 8), ...E([0, 0.66, 0.46], [0.07, 0.05, 0.08], 10, 6), ...ror([[0, 0.02, -1.33], [0.05, 0.08, -1.45], [0.03, 0.18, -1.5]], [0.05, 0.035, 0.01], 8)]],
    [lj, [...ror(hals.map(([x, y, z]) => [x, y, z + 0.06]), [0.07, 0.07, 0.065, 0.06], 8), ...E([0, 0.63, 0.44], [0.065, 0.035, 0.07], 8, 5)]],
    [k, [...[0.45, 0.6, 0.73, 0.8].map((y, i) => ror([[0, y + 0.06, 0.12 + i * 0.05 - 0.05], [0, y + 0.18, 0.07 + i * 0.05 - 0.05]], [0.05, 0.005], 6)).flat(), ...[-0.2, -0.75, -1.2].map((z, i) => ror([[0, [0.32, 0.27, 0.2][i] - 0.02, z], [0, [0.32, 0.27, 0.2][i] + 0.1, z - 0.04]], [0.045, 0.005], 6)).flat(), ...ror([[0.09, 0.72, 0.3], [0.2, 0.78, 0.22]], [0.035, 0.005], 6), ...ror([[-0.09, 0.72, 0.3], [-0.2, 0.78, 0.22]], [0.035, 0.005], 6)]],
    ...ogon(0.075, 0.76, 0.4, 0.028), ["#E53935", ror([[0, 0.63, 0.53], [0, 0.62, 0.62], [0.02, 0.6, 0.66]], [0.008, 0.008, 0.004], 4)]]); }
console.log("klart");
