// R3F-M19: egna sagoväsen och saker (Trollpennan, CC0), fenix (Gobkit-örn omfärgad) och pegasus (Quaternius vit häst + egna vingar). +y upp, +z fram, står på y=0.
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, unpartition, mergeDocuments } from "@gltf-transform/functions";
import sharp from "sharp";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const I = "/workspace/modell-inkorg";
const UT = `${I}/trollpennan-saga-m19`;
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
const hsv = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; return [h, mx ? d / mx : 0, mx]; };
const rgb = (h, s, v) => { const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [r + m, g + m, b + m]; };
async function omfarga(png, { fran, till, s = 1, v = 1, minS = 0.22 }) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const [h0, h1] = fran; const mitt = h0 <= h1 ? (h0 + h1) / 2 : ((h0 + h1 + 360) / 2) % 360;
  for (let i = 0; i < data.length; i += 4) {
    const [h, ss, vv] = hsv(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
    const inne = h0 <= h1 ? h >= h0 && h <= h1 : h >= h0 || h <= h1;
    if (!inne || ss < minS || vv < 0.12) continue;
    const nh = (till + (((h - mitt + 540) % 360) - 180) * 0.25 + 360) % 360;
    const [r, g, b] = rgb(nh, Math.min(1, ss * s), Math.min(1, vv * v));
    data[i] = r * 255; data[i + 1] = g * 255; data[i + 2] = b * 255;
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

const E = ellips, sv = "#212121", vi = "#FAFAFA";
const ogon = (x, y, z, r = 0.04) => [[sv, [...E([x, y, z], [r, r, r * 0.7], 6, 4), ...E([-x, y, z], [r, r, r * 0.7], 6, 4)]], [vi, [...E([x + r * 0.3, y + r * 0.35, z + r * 0.55], [r * 0.3, r * 0.3, r * 0.2], 4, 3), ...E([-x + r * 0.3, y + r * 0.35, z + r * 0.55], [r * 0.3, r * 0.3, r * 0.2], 4, 3)]]];
// sjöhäst: S-formad kropp, krökt svans, trut, rygg-fena (i profil: fram = +x)
{ const P = [[0, 1.05, 0.12], [0, 0.92, 0.0], [0, 0.72, -0.05], [0, 0.52, 0.02], [0, 0.36, 0.08], [0, 0.22, 0.04], [0, 0.14, -0.08], [0, 0.16, -0.18], [0, 0.24, -0.2]], R = [0.11, 0.15, 0.17, 0.16, 0.12, 0.08, 0.05, 0.035, 0.02];
  await spara("sjohast", [["#FFB300", [...ror(P, R, 10), ...E([0, 1.1, 0.12], [0.1, 0.11, 0.13], 10, 6), ...ror([[0, 1.08, 0.2], [0, 1.04, 0.36]], [0.045, 0.035], 8), ...[1.18, 1.13].map(() => 0) && [[[0, 1.19, 0.06], [0, 1.27, 0.0], [0, 1.18, -0.02]], [[0, 1.19, 0.06], [0, 1.18, -0.02], [0, 1.27, 0.0]]]]], ["#FF8F00", [[[0, 0.85, -0.12], [0, 0.6, -0.28], [0, 0.5, -0.1]], [[0, 0.85, -0.12], [0, 0.5, -0.1], [0, 0.6, -0.28]]].map((t) => t.map(([x, y, z]) => [x, y, z])).flatMap((t) => [t, t.map(([x, y, z]) => [x + 0.005, y, z])])], ["#FFE082", E([0, 0.7, 0.08], [0.1, 0.18, 0.08], 8, 6)], ...ogon(0.07, 1.14, 0.17, 0.03)]); }
// sjöorm: puckelryggad orm i vågor
{ const P = [], R = []; for (let i = 0; i <= 40; i++) { const t = i / 40; P.push([0.12 * Math.sin(t * 9), Math.max(0.05, 0.28 * Math.sin(t * Math.PI * 3.2) + 0.12), 1.2 - t * 2.4]); R.push(0.16 * (1 - t * 0.85) + 0.02); }
  const kr = ror(P, R, 10); const ff = { "#2E7D6B": [], "#4DB6AC": [] }; kr.forEach((t, k) => ff[Math.floor(k / 20) % 3 ? "#2E7D6B" : "#4DB6AC"].push(t));
  await spara("sjoorm", [...Object.entries(ff), ["#2E7D6B", [...E([0, 0.32, 1.3], [0.2, 0.17, 0.26], 10, 7), ...[[0.1, 0.48, 1.22], [-0.1, 0.48, 1.22]].flatMap((p) => cyl(p, 0.035, 0.18, 6, "y", 0.005))]], ["#80CBC4", [0.95, 0.4, -0.15, -0.7].flatMap((z) => { const i = Math.round(((1.2 - z) / 2.4) * 40); const p = P[i]; return [[[p[0], p[1] + R[i] * 0.8, z - 0.1], [p[0], p[1] + R[i] + 0.15, z], [p[0], p[1] + R[i] * 0.8, z + 0.1]], [[p[0], p[1] + R[i] * 0.8, z - 0.1], [p[0], p[1] + R[i] * 0.8, z + 0.1], [p[0], p[1] + R[i] + 0.15, z]]]; })], ["#E53935", ror([[0, 0.25, 1.53], [0.04, 0.22, 1.65], [0.02, 0.2, 1.7]], [0.015, 0.01, 0.006], 4)], ...ogon(0.1, 0.4, 1.47, 0.04)]); }
// kraken: jättebläckfisk som sticker upp med armar
{ const f = "#8E24AA", lj = "#CE93D8", armar = [];
  for (let k = 0; k < 8; k++) { const a = (k / 8) * 2 * Math.PI, P = [], R = []; for (let i = 0; i <= 10; i++) { const t = i / 10, r = 0.3 + t * 0.7; P.push([r * Math.sin(a), 0.1 + Math.sin(t * Math.PI) * (0.25 + (k % 2) * 0.35) + (t > 0.8 ? (t - 0.8) * 2 : 0), r * Math.cos(a)]); R.push(0.12 * (1 - t) + 0.02); } armar.push(...ror(P, R, 8)); }
  await spara("kraken", [[f, [...E([0, 0.95, -0.05], [0.42, 0.62, 0.42], 14, 9), ...armar, ...[[0, 1.55, -0.2]].flatMap((p) => [[[p[0] - 0.3, 1.35, p[2]], [p[0], 1.7, p[2] - 0.15], [p[0] + 0.3, 1.35, p[2]]], [[p[0] - 0.3, 1.35, p[2]], [p[0] + 0.3, 1.35, p[2]], [p[0], 1.7, p[2] - 0.15]]])]], [lj, [0, 1, 2, 3].flatMap((i) => E([0.3 * Math.sin(i), 0.5 + i * 0.12, 0.35 * Math.cos(i * 0.3)], [0.05, 0.05, 0.05], 5, 3))], ...ogon(0.17, 0.95, 0.36, 0.1)]); }
// drakägg: prickigt ägg i ett bo
await spara("drakagg", [["#43A047", E([0, 0.38, 0], [0.24, 0.34, 0.24], 14, 10)], ["#FDD835", [[0.15, 0.5, 0.15], [-0.18, 0.35, 0.12], [0.05, 0.62, 0.18], [-0.08, 0.2, 0.2], [0.2, 0.25, -0.05], [-0.15, 0.55, -0.12], [0.02, 0.4, -0.23]].flatMap((p) => { const l = Math.hypot(p[0], (p[1] - 0.38) * 0.7, p[2]) || 1; const q = [p[0] / l * 0.235, 0.38 + (p[1] - 0.38) / l * 0.33, p[2] / l * 0.235]; return E(q, [0.04, 0.04, 0.025], 6, 4); })], ["#8D6E63", ror(Array.from({ length: 25 }, (_, i) => { const a = (i / 24) * 2 * Math.PI; return [0.28 * Math.cos(a), 0.08, 0.28 * Math.sin(a)]; }), Array(25).fill(0.07), 6)], ["#6D4C41", cyl([0, 0, 0], 0.26, 0.05, 14)]]);
// kristallkula på fot
await spara("kristallkula", [["#B39DDB", E([0, 0.52, 0], [0.3, 0.3, 0.3], 16, 10)], ["#EDE7F6", E([-0.1, 0.62, 0.21], [0.07, 0.05, 0.03], 6, 4)], ["#7E57C2", E([0.04, 0.48, 0.05], [0.12, 0.1, 0.12], 8, 5)], ["#5D4037", [...cyl([0, 0, 0], 0.26, 0.08, 14, "y", 0.22), ...cyl([0, 0.08, 0], 0.13, 0.16, 12, "y", 0.2)]], ["#FFC107", ror(Array.from({ length: 17 }, (_, i) => { const a = (i / 16) * 2 * Math.PI; return [0.2 * Math.cos(a), 0.25, 0.2 * Math.sin(a)]; }), Array(17).fill(0.025), 5)]]);
// fenix: Gobkit-örnen i eldfärger (ljusheten styr röd → orange → gul)
{ const d = await io.read(`${I}/gobkit-cc0-djur-och-natur/eagle.glb`);
  for (const t of d.getRoot().listTextures()) { const { data, info } = await sharp(Buffer.from(t.getImage())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) { const [h, s, v] = hsv(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255); if (v < 0.12) continue; const [r, g, b] = rgb(v * v * 55, 1, Math.min(1, 0.8 + v * 0.2)); data[i] = r * 255; data[i + 1] = g * 255; data[i + 2] = b * 255; }
    t.setImage(new Uint8Array(await sharp(data, { raw: info }).png().toBuffer())).setURI(""); }
  await io.write(`${UT}/fenix-gobkit.glb`, d); }
// pegasus: Quaternius vit häst med egna vingar på ryggbenet (Torso2), följer animationen
{ const d = await io.read(`${I}/quaternius-ultimate-animated-animals/horse-white.glb`); const root = d.getRoot();
  for (const m of root.listMaterials()) { if (m.getName() === "Main") m.setBaseColorFactor([...lin("#FAFAFA"), 1]); if (m.getName() === "Hair") m.setBaseColorFactor([...lin("#B3E5FC"), 1]); }
  const ben = root.listNodes().find((n) => n.getName() === "Torso"); const W = ben.getWorldMatrix(); const inv = invertera(W);
  const vinge = (s) => { const t = []; const P = (u, v) => [s * (0.3 + u * 2.2), 3.0 + v * 0.9 + u * 0.9 - u * u * 0.6, 0.6 - v * 0.9 - u * 0.4]; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { const q = [[P(i / 6, j / 3), P((i + 1) / 6, j / 3), P((i + 1) / 6, (j + 1) / 3)], [P(i / 6, j / 3), P((i + 1) / 6, (j + 1) / 3), P(i / 6, (j + 1) / 3)]]; t.push(...q, ...vand(q)); } return t; };
  const tv = (p) => { const [x, y, z] = p; return [0, 1, 2].map((r) => inv[r] * x + inv[4 + r] * y + inv[8 + r] * z + inv[12 + r]); };
  const tris = [...vinge(1), ...vinge(-1)].map((tr) => tr.map(tv));
  ben.addChild(d.createNode("vingar").setMesh(delarTillMesh(d, "vingar", [["#E3F2FD", tris]])));
  await io.write(`${UT}/pegasus-quaternius.glb`, d); }
function invertera(m) { const a = Array.from(m), inv = new Array(16); // 4x4, kolumnordning
  inv[0] = a[5] * a[10] * a[15] - a[5] * a[11] * a[14] - a[9] * a[6] * a[15] + a[9] * a[7] * a[14] + a[13] * a[6] * a[11] - a[13] * a[7] * a[10];
  inv[4] = -a[4] * a[10] * a[15] + a[4] * a[11] * a[14] + a[8] * a[6] * a[15] - a[8] * a[7] * a[14] - a[12] * a[6] * a[11] + a[12] * a[7] * a[10];
  inv[8] = a[4] * a[9] * a[15] - a[4] * a[11] * a[13] - a[8] * a[5] * a[15] + a[8] * a[7] * a[13] + a[12] * a[5] * a[11] - a[12] * a[7] * a[9];
  inv[12] = -a[4] * a[9] * a[14] + a[4] * a[10] * a[13] + a[8] * a[5] * a[14] - a[8] * a[6] * a[13] - a[12] * a[5] * a[10] + a[12] * a[6] * a[9];
  inv[1] = -a[1] * a[10] * a[15] + a[1] * a[11] * a[14] + a[9] * a[2] * a[15] - a[9] * a[3] * a[14] - a[13] * a[2] * a[11] + a[13] * a[3] * a[10];
  inv[5] = a[0] * a[10] * a[15] - a[0] * a[11] * a[14] - a[8] * a[2] * a[15] + a[8] * a[3] * a[14] + a[12] * a[2] * a[11] - a[12] * a[3] * a[10];
  inv[9] = -a[0] * a[9] * a[15] + a[0] * a[11] * a[13] + a[8] * a[1] * a[15] - a[8] * a[3] * a[13] - a[12] * a[1] * a[11] + a[12] * a[3] * a[9];
  inv[13] = a[0] * a[9] * a[14] - a[0] * a[10] * a[13] - a[8] * a[1] * a[14] + a[8] * a[2] * a[13] + a[12] * a[1] * a[10] - a[12] * a[2] * a[9];
  inv[2] = a[1] * a[6] * a[15] - a[1] * a[7] * a[14] - a[5] * a[2] * a[15] + a[5] * a[3] * a[14] + a[13] * a[2] * a[7] - a[13] * a[3] * a[6];
  inv[6] = -a[0] * a[6] * a[15] + a[0] * a[7] * a[14] + a[4] * a[2] * a[15] - a[4] * a[3] * a[14] - a[12] * a[2] * a[7] + a[12] * a[3] * a[6];
  inv[10] = a[0] * a[5] * a[15] - a[0] * a[7] * a[13] - a[4] * a[1] * a[15] + a[4] * a[3] * a[13] + a[12] * a[1] * a[7] - a[12] * a[3] * a[5];
  inv[14] = -a[0] * a[5] * a[14] + a[0] * a[6] * a[13] + a[4] * a[1] * a[14] - a[4] * a[2] * a[13] - a[12] * a[1] * a[6] + a[12] * a[2] * a[5];
  inv[3] = -a[1] * a[6] * a[11] + a[1] * a[7] * a[10] + a[5] * a[2] * a[11] - a[5] * a[3] * a[10] - a[9] * a[2] * a[7] + a[9] * a[3] * a[6];
  inv[7] = a[0] * a[6] * a[11] - a[0] * a[7] * a[10] - a[4] * a[2] * a[11] + a[4] * a[3] * a[10] + a[8] * a[2] * a[7] - a[8] * a[3] * a[6];
  inv[11] = -a[0] * a[5] * a[11] + a[0] * a[7] * a[9] + a[4] * a[1] * a[11] - a[4] * a[3] * a[9] - a[8] * a[1] * a[7] + a[8] * a[3] * a[5];
  inv[15] = a[0] * a[5] * a[10] - a[0] * a[6] * a[9] - a[4] * a[1] * a[10] + a[4] * a[2] * a[9] + a[8] * a[1] * a[6] - a[8] * a[2] * a[5];
  const det = a[0] * inv[0] + a[1] * inv[4] + a[2] * inv[8] + a[3] * inv[12]; return inv.map((x) => x / det); }
console.log("klart");
