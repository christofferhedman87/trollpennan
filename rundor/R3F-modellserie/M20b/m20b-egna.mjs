// R3F-M20b: egna lågpolymodeller för hemmet (bygger på M20/m20-egna.mjs) (Trollpennan, CC0). +y upp, +z fram, står på y=0. Kör från en mapp med @gltf-transform och sharp.
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, unpartition, mergeDocuments } from "@gltf-transform/functions";
import sharp from "sharp";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const I = "/workspace/modell-inkorg";
const UT = process.env.UT ?? `${I}/trollpennan-hem-m20b`;
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

const tra = "#A1887F", mtra = "#6D4C41", met = "#B0BEC5", sv = "#212121";
const klockSiffror = (cx, cy, z, R, n = 12) => Array.from({ length: n }, (_, i) => { const a = (i / n) * 2 * Math.PI; return L([cx + R * Math.sin(a), cy + R * Math.cos(a), z], [0.02, 0.035, 0.01]); }).flat();
const visare = (cx, cy, z, l1 = 0.08, l2 = 0.12) => [...L([cx, cy + l2 / 2, z], [0.015, l2, 0.01]), ...L([cx + l1 / 2, cy, z], [l1, 0.018, 0.01])];
// ---------- hemmet
// väggklocka: rund klocka på fot (står på bordet) med röd ram
await spara("vaggklocka", [["#E53935", [...cylZ([0, 0.3, 0], 0.28, 0.08, 24)]], ["#FAFAFA", cylZ([0, 0.3, 0.045], 0.24, 0.01, 24)], [sv, [...klockSiffror(0, 0.3, 0.052, 0.2), ...visare(0, 0.3, 0.056), ...E([0, 0.3, 0.058], [0.02, 0.02, 0.01], 6, 4)]], ["#B0BEC5", [...L([0.15, 0.03, 0], [0.04, 0.06, 0.06]), ...L([-0.15, 0.03, 0], [0.04, 0.06, 0.06])]]]);
// gökur: hus med tak, klocktavla, lucka med gök och två kottvikter
await spara("gokur", [[mtra, [...L([0, 0.75, 0], [0.4, 0.4, 0.15]), ...quad([-0.27, 0.95, 0.1], [0.27, 0.95, 0.1], [0, 1.18, 0.1], [0, 1.18, 0.1]).slice(0, 1), ...L([0, 0.53, 0.02], [0.44, 0.04, 0.2])]], ["#4E342E", [...quad([-0.27, 0.93, 0.11], [0, 1.18, 0.11], [0, 1.18, -0.11], [-0.27, 0.93, -0.11]), ...quad([0, 1.18, 0.11], [0.27, 0.93, 0.11], [0.27, 0.93, -0.11], [0, 1.18, -0.11]), ...quad([-0.27, 0.93, -0.11], [0, 1.18, -0.11], [0, 1.18, 0.11], [-0.27, 0.93, 0.11]).map(([a, b, c]) => [a, c, b])]], ["#FFF8E1", cylZ([0, 0.72, 0.08], 0.12, 0.01, 18)], [sv, [...klockSiffror(0, 0.72, 0.087, 0.095), ...visare(0, 0.72, 0.09, 0.05, 0.08), ...ror([[0.08, 0.52, 0.03], [0.08, 0.2, 0.03]], [0.006, 0.006], 4), ...ror([[-0.08, 0.52, 0.03], [-0.08, 0.3, 0.03]], [0.006, 0.006], 4), ...L([0, 0.98, 0.08], [0.1, 0.09, 0.01])]], ["#8D6E63", [...E([0.08, 0.14, 0.03], [0.04, 0.08, 0.04], 8, 6), ...E([-0.08, 0.24, 0.03], [0.04, 0.08, 0.04], 8, 6)]], ["#FDD835", [...E([0, 0.99, 0.12], [0.035, 0.03, 0.04], 8, 6), ...L([0, 0.99, 0.165], [0.015, 0.012, 0.03])]], ["#43A047", [...[-0.15, 0.15].flatMap((x) => E([x, 0.58, 0.1], [0.05, 0.03, 0.02], 8, 4))]], ["#B0BEC5", ror([[0, 0.53, 0.04], [0.04, 0.38, 0.04]], [0.006, 0.006], 4)], ["#FFC107", E([0.045, 0.36, 0.04], [0.035, 0.035, 0.01], 8, 4)]]);
// pendelur: högt golvur med glasruta och guldpendel
await spara("pendelur", [[mtra, [...L([0, 0.06, 0], [0.42, 0.12, 0.3]), ...L([0, 0.65, -0.02], [0.34, 1.1, 0.24]), ...L([0, 1.35, 0], [0.42, 0.42, 0.3]), ...L([0, 1.6, 0], [0.46, 0.08, 0.34])]], ["#FFF8E1", cylZ([0, 1.35, 0.15], 0.15, 0.01, 20)], [sv, [...klockSiffror(0, 1.35, 0.158, 0.12), ...visare(0, 1.35, 0.162, 0.06, 0.1)]], ["#B3E5FC", L([0, 0.65, 0.102], [0.24, 0.85, 0.01])], ["#FFC107", [...ror([[0, 1.05, 0.08], [0, 0.45, 0.08]], [0.008, 0.008], 4), ...cylZ([0, 0.42, 0.08], 0.07, 0.02, 16), ...ror([[0.06, 1.0, 0.08], [0.06, 0.6, 0.08]], [0.006, 0.006], 4), ...E([0.06, 0.58, 0.08], [0.025, 0.05, 0.025], 6, 4), ...L([0, 1.67, 0.1], [0.12, 0.08, 0.04])]]]);
// skrivbordslampa: ledad gul arbetslampa
await spara("skrivbordslampa", [["#FBC02D", [...cyl([0, 0, 0], 0.16, 0.04, 18), ...ror([[0, 0.04, 0], [0.05, 0.35, 0]], [0.02, 0.02], 6), ...ror([[0.05, 0.35, 0], [0, 0.55, 0.15]], [0.02, 0.02], 6), ...varv([[0.03, 0.0], [0.15, -0.12], [0.16, -0.14], [0.05, -0.02], [0.03, 0.03]], 16).map((t) => t.map(([x, y, z]) => [x, 0.55 + y * 0.9 - z * 0.45, 0.17 + z * 0.9 + y * 0.45]))]], [sv, [...E([0.05, 0.35, 0], [0.035, 0.035, 0.035], 8, 6), ...E([0, 0.55, 0.15], [0.035, 0.035, 0.035], 8, 6)]], ["#FFF59D", E([0, 0.47, 0.22], [0.06, 0.06, 0.06], 8, 6)]]);
// ficklampa: röd ficklampa med ljuskägla
await spara("ficklampa", [["#D32F2F", [...cylZ([0, 0.08, -0.05], 0.07, 0.3, 14), ...cylZ([0, 0.08, 0.15], 0.07, 0.1, 14, 0.1)]], ["#B0BEC5", [...cylZ([0, 0.08, 0.205], 0.105, 0.02, 16), ...L([0, 0.155, -0.02], [0.04, 0.02, 0.06])]], ["#FFF59D", [...cylZ([0, 0.08, 0.215], 0.09, 0.01, 16)]], [sv, L([0, 0.08, -0.205], [0.1, 0.1, 0.01])]]);
// glödlampa: stor glödlampa med sockel och glödtråd
await spara("glodlampa", [["#FFF59D", varv([[0, 0.22], [0.08, 0.24], [0.08, 0.3], [0.17, 0.42], [0.19, 0.52], [0.15, 0.62], [0.08, 0.66], [0, 0.67]], 18)], ["#B0BEC5", [...varv([[0, 0], [0.04, 0.0], [0.07, 0.04], [0.085, 0.06], [0.085, 0.24], [0, 0.24]], 14), ...[0.09, 0.13, 0.17].flatMap((y) => varv([[0.085, y], [0.095, y + 0.015], [0.085, y + 0.03]], 14))]], ["#FB8C00", ror([[-0.05, 0.3, 0], [-0.04, 0.45, 0], [-0.02, 0.48, 0], [0, 0.45, 0], [0.02, 0.48, 0], [0.04, 0.45, 0], [0.05, 0.3, 0]], [0.008, 0.008, 0.008, 0.008, 0.008, 0.008, 0.008], 4)]]);
// ljuslykta: svart lykta med glas, ljus och bärhandtag
await spara("ljuslykta", [[sv, [...L([0, 0.02, 0], [0.3, 0.04, 0.3]), ...L([0, 0.42, 0], [0.32, 0.04, 0.32]), ...[[0.14, 0.14], [-0.14, 0.14], [0.14, -0.14], [-0.14, -0.14]].flatMap(([x, z]) => L([x, 0.22, z], [0.025, 0.4, 0.025])), ...cyl([0, 0.44, 0], 0.15, 0.08, 4, "y", 0.03), ...ring([0, 0.6, 0], 0.07, 0.012, "xy")]], ["#E1F5FE", [...L([0, 0.22, 0.135], [0.25, 0.36, 0.005]), ...L([0, 0.22, -0.135], [0.25, 0.36, 0.005]), ...L([0.135, 0.22, 0], [0.005, 0.36, 0.25]), ...L([-0.135, 0.22, 0], [0.005, 0.36, 0.25])]], ["#FAFAFA", cyl([0, 0.04, 0], 0.06, 0.18, 12)], ["#FFB300", E([0, 0.27, 0], [0.025, 0.05, 0.025], 6, 4)]]);
// sittsäck: stor röd sittsäck med grop
await spara("sittsack", [["#E53935", [...varv([[0, 0], [0.38, 0], [0.45, 0.1], [0.44, 0.25], [0.36, 0.38], [0.22, 0.44], [0.1, 0.36], [0, 0.34]], 20)]], ["#FAFAFA", [...varv([[0.441, 0.15], [0.452, 0.15], [0.452, 0.18], [0.441, 0.18]], 20)]]]);
// hängmatta: randig hängmatta mellan två stolpar
{ const bage = []; const n = 10; for (let i = 0; i <= n; i++) { const x = -0.6 + (1.2 * i) / n; bage.push([x, 0.75 - 0.35 * (1 - (x / 0.6) ** 2), 0]); }
  const rand = [], f = ["#E53935", "#FDD835", "#1E88E5"];
  const del = [[], [], []];
  for (let i = 0; i < n; i++) for (let k = 0; k < 6; k++) { const a = bage[i], b = bage[i + 1]; const z0 = -0.25 + k * (0.5 / 6), z1 = z0 + 0.5 / 6; const sag = (z) => 0.06 * (1 - (z / 0.25) ** 2); del[k % 3].push(...quad([a[0], a[1] - sag(z0), z0], [b[0], b[1] - sag(z0), z0], [b[0], b[1] - sag(z1), z1], [a[0], a[1] - sag(z1), z1]), ...quad([a[0], a[1] - sag(z1), z1], [b[0], b[1] - sag(z1), z1], [b[0], b[1] - sag(z0), z0], [a[0], a[1] - sag(z0), z0])); }
  await spara("hangmatta", [...f.map((c, k) => [c, del[k]]), [mtra, [...cyl([0.8, 0, 0], 0.04, 1.0, 10), ...cyl([-0.8, 0, 0], 0.04, 1.0, 10)]], ["#D7CCC8", [...ror([[0.6, 0.75, 0], [0.8, 0.9, 0]], [0.01, 0.01], 4), ...ror([[-0.6, 0.75, 0], [-0.8, 0.9, 0]], [0.01, 0.01], 4)]]]); }
// gunghäst: vit gunghäst med röd sadel på medar
await spara("gunghast", [["#FAFAFA", [...E([0, 0.5, 0], [0.12, 0.13, 0.3], 12, 8), ...ror([[0, 0.55, 0.22], [0, 0.72, 0.32]], [0.08, 0.06], 8), ...E([0, 0.76, 0.38], [0.07, 0.07, 0.13], 10, 6), ...[[0.07, 0.15], [-0.07, 0.15], [0.07, -0.15], [-0.07, -0.15]].flatMap(([x, z]) => ror([[x, 0.45, z], [x * 1.5, 0.12, z * 1.3]], [0.035, 0.03], 6))]], ["#5D4037", [...ror([[0, 0.82, 0.22], [0, 0.66, 0.2], [0, 0.55, 0.15]], [0.03, 0.03, 0.02], 6), ...ror([[0, 0.5, -0.3], [0, 0.35, -0.42]], [0.04, 0.02], 6), ...E([0.06, 0.8, 0.44], [0.015, 0.015, 0.015], 4, 3), ...E([-0.06, 0.8, 0.44], [0.015, 0.015, 0.015], 4, 3)]], ["#E53935", [...L([0, 0.62, -0.02], [0.26, 0.04, 0.2]), ...ror([[0.14, 0.12, -0.5], [0.14, 0.05, -0.2], [0.14, 0.03, 0.2], [0.14, 0.12, 0.5]], [0.03, 0.03, 0.03, 0.03], 6), ...ror([[-0.14, 0.12, -0.5], [-0.14, 0.05, -0.2], [-0.14, 0.03, 0.2], [-0.14, 0.12, 0.5]], [0.03, 0.03, 0.03, 0.03], 6)]], ["#FDD835", [...L([0.115, 0.6, 0.05], [0.01, 0.1, 0.02]), ...L([-0.115, 0.6, 0.05], [0.01, 0.1, 0.02])]]]);
// dockskåp: öppet tvåvåningshus med rum, tak och små möbler
await spara("dockskap", [["#FFF3E0", [...L([0, 0.02, 0], [0.8, 0.04, 0.4]), ...L([0, 0.4, 0], [0.8, 0.03, 0.4]), ...L([0.39, 0.4, 0], [0.03, 0.8, 0.4]), ...L([-0.39, 0.4, 0], [0.03, 0.8, 0.4]), ...L([0, 0.4, -0.19], [0.8, 0.8, 0.02]), ...L([0, 0.4, 0], [0.02, 0.76, 0.38])]], ["#E57373", [...quad([-0.45, 0.78, 0.22], [0.45, 0.78, 0.22], [0, 1.08, 0.22], [0, 1.08, 0.22]).slice(0, 1), ...quad([-0.45, 0.78, -0.22], [0, 1.08, -0.22], [0.45, 0.78, -0.22], [0.45, 0.78, -0.22]).slice(0, 1), ...quad([-0.45, 0.78, 0.22], [0, 1.08, 0.22], [0, 1.08, -0.22], [-0.45, 0.78, -0.22]), ...quad([0, 1.08, 0.22], [0.45, 0.78, 0.22], [0.45, 0.78, -0.22], [0, 1.08, -0.22]), ...quad([-0.45, 0.78, -0.22], [0, 1.08, -0.22], [0, 1.08, 0.22], [-0.45, 0.78, 0.22]).map(([a, b, c]) => [a, c, b]), ...quad([0, 1.08, -0.22], [0.45, 0.78, -0.22], [0.45, 0.78, 0.22], [0, 1.08, 0.22]).map(([a, b, c]) => [a, c, b])]], ["#81D4FA", [...L([0, 0.6, -0.175], [0.76, 0.36, 0.005])]], ["#C5E1A5", [...L([0, 0.21, -0.175], [0.76, 0.36, 0.005])]], ["#5D4037", [...L([0.2, 0.08, 0.02], [0.18, 0.08, 0.14]), ...L([-0.2, 0.47, 0.0], [0.22, 0.05, 0.16])]], ["#E53935", [...L([-0.2, 0.08, 0.0], [0.2, 0.08, 0.12]), ...L([-0.2, 0.14, -0.05], [0.2, 0.06, 0.03])]], ["#FDD835", [...L([0.2, 0.5, -0.05], [0.05, 0.16, 0.05]), ...E([0.2, 0.62, -0.05], [0.06, 0.04, 0.06], 8, 4)]]]);
// leksakslåda: blå låda med gult lock på glänt, boll och klossar
await spara("leksakslada", [["#1E88E5", [...L([0, 0.18, 0], [0.6, 0.36, 0.36])]], ["#FDD835", [...L([0, 0.42, -0.2], [0.62, 0.03, 0.38]).map((t) => t.map(([x, y, z]) => [x, 0.38 + (y - 0.42) + (z + 0.2) * 0.0 + (-(z + 0.01) * 0.9), -0.18 + (z + 0.2) * 0.3 + (y - 0.42)]))]], ["#E53935", E([0.12, 0.4, 0.05], [0.1, 0.1, 0.1], 10, 8)], ["#43A047", L([-0.12, 0.39, 0.04], [0.1, 0.1, 0.1])], ["#FB8C00", L([-0.02, 0.4, 0.1], [0.08, 0.08, 0.08])], ["#FAFAFA", [...L([0, 0.18, 0.181], [0.3, 0.12, 0.01])]], ["#7E57C2", [...E([-0.06, 0.18, 0.187], [0.03, 0.03, 0.005], 6, 4), ...E([0.06, 0.18, 0.187], [0.03, 0.03, 0.005], 6, 4)]]]);
// spargris: rosa spargris med springa och mynt
await spara("spargris", [["#F48FB1", [...E([0, 0.25, 0], [0.2, 0.18, 0.26], 14, 10), ...cylZ([0, 0.24, 0.28], 0.07, 0.06, 12), ...[[0.1, 0.12], [-0.1, 0.12], [0.1, -0.12], [-0.1, -0.12]].flatMap(([x, z]) => cyl([x, 0, z], 0.045, 0.12, 8)), ...E([0.1, 0.42, 0.14], [0.05, 0.06, 0.02], 6, 4), ...E([-0.1, 0.42, 0.14], [0.05, 0.06, 0.02], 6, 4), ...ror([[0, 0.28, -0.26], [0.04, 0.32, -0.32], [-0.02, 0.36, -0.32]], [0.012, 0.012, 0.012], 4)]], ["#AD1457", [...E([0.025, 0.24, 0.312], [0.012, 0.018, 0.006], 4, 3), ...E([-0.025, 0.24, 0.312], [0.012, 0.018, 0.006], 4, 3), ...L([0, 0.43, -0.02], [0.02, 0.01, 0.12])]], [sv, [...E([0.08, 0.32, 0.21], [0.02, 0.022, 0.015], 6, 4), ...E([-0.08, 0.32, 0.21], [0.02, 0.022, 0.015], 6, 4)]], ["#FFC107", cyl([0, 0.44, -0.02], 0.04, 0.01, 12)]]);
// kontorsstol: snurrstol med fem hjul, armstöd och blå sits
{ const fot = []; for (let i = 0; i < 5; i++) { const a = (i / 5) * 2 * Math.PI; fot.push(...ror([[0, 0.08, 0], [0.28 * Math.cos(a), 0.06, 0.28 * Math.sin(a)]], [0.025, 0.02], 6)); }
  const hjul5 = []; for (let i = 0; i < 5; i++) { const a = (i / 5) * 2 * Math.PI; hjul5.push(...E([0.28 * Math.cos(a), 0.035, 0.28 * Math.sin(a)], [0.035, 0.035, 0.035], 6, 4)); }
  await spara("kontorsstol", [["#455A64", [...fot, ...cyl([0, 0.08, 0], 0.03, 0.32, 10), ...ror([[0.24, 0.45, 0.05], [0.24, 0.6, 0.05], [0.24, 0.6, -0.12]], [0.015, 0.015, 0.015], 5), ...ror([[-0.24, 0.45, 0.05], [-0.24, 0.6, 0.05], [-0.24, 0.6, -0.12]], [0.015, 0.015, 0.015], 5)]], [sv, hjul5], ["#1E88E5", [...varv([[0, 0.4], [0.24, 0.4], [0.26, 0.44], [0.24, 0.48], [0, 0.48]], 18), ...L([0, 0.78, -0.22], [0.4, 0.42, 0.07]), ...L([0, 0.55, -0.22], [0.08, 0.15, 0.04])]], ["#212121", [...L([0.24, 0.61, -0.03], [0.05, 0.03, 0.2]), ...L([-0.24, 0.61, -0.03], [0.05, 0.03, 0.2])]]]); }
// hatthylla: klädhängare på fot med hatt, mössa och halsduk
await spara("hatthylla", [[mtra, [...cyl([0, 0, 0], 0.2, 0.04, 16), ...cyl([0, 0.04, 0], 0.025, 1.45, 10), ...[0, 1.2, 2.4, 3.6, 4.8].flatMap((a) => ror([[0, 1.38, 0], [0.16 * Math.cos(a), 1.46, 0.16 * Math.sin(a)], [0.2 * Math.cos(a), 1.52, 0.2 * Math.sin(a)]], [0.015, 0.015, 0.015], 5)), ...E([0, 1.5, 0], [0.04, 0.04, 0.04], 8, 6)]], ["#212121", [...cyl([0.19, 1.5, 0.06], 0.13, 0.015, 14), ...cyl([0.19, 1.51, 0.06], 0.08, 0.1, 14)]], ["#E53935", [...ror([[-0.18, 1.5, 0.08], [-0.2, 1.3, 0.12], [-0.18, 1.0, 0.1]], [0.04, 0.045, 0.04], 8), ...ror([[-0.18, 1.5, 0.08], [-0.12, 1.25, 0.14], [-0.1, 1.05, 0.14]], [0.04, 0.04, 0.035], 8)]], ["#FAFAFA", [...L([-0.18, 1.0, 0.1], [0.08, 0.04, 0.05]), ...L([-0.1, 1.05, 0.14], [0.07, 0.04, 0.05])]]]);
// toapapper: stående rulle med hål i mitten och ett flärp som hänger ner framtill
await spara("toapapper", [["#FAFAFA", [...varv([[0.05, 0.3], [0.05, 0.0], [0.17, 0.0], [0.17, 0.3], [0.05, 0.3]], 22), ...L([0, 0.16, 0.172], [0.16, 0.3, 0.006]), ...L([0, -0.0, 0.2], [0.16, 0.005, 0.06]).map((t) => t.map(([x, y, z]) => [x, 0.003, z]))]], ["#9E9E9E", varv([[0.045, 0.302], [0.045, 0.0], [0.05, 0.0], [0.05, 0.302]], 16)], ["#B3E5FC", [...[0.06, 0.12, 0.18, 0.24].flatMap((y) => L([0, y, 0.176], [0.16, 0.006, 0.004]))]]]);
// byrå: tre lådor, knoppar och en lampa ovanpå
await spara("byra", [["#90CAF9", [...L([0, 0.42, 0], [0.8, 0.8, 0.42]), ...[[0.33, 0.33], [-0.33, 0.33], [0.33, -0.17], [-0.33, -0.17]].flatMap(([x, z]) => L([x, 0.02, z], [0.06, 0.04, 0.06]))]], ["#FAFAFA", [...[0.18, 0.43, 0.68].flatMap((y) => L([0, y, 0.212], [0.72, 0.2, 0.01])), ...L([0, 0.835, 0], [0.84, 0.03, 0.46])]], ["#FFC107", [...[0.18, 0.43, 0.68].flatMap((y) => [0.2, -0.2].flatMap((x) => E([x, y, 0.225], [0.025, 0.025, 0.02], 6, 4)))]]]);
// garderob: hög tvådörrars garderob med krona
await spara("garderob", [["#8D6E63", [...L([0, 0.75, 0], [0.8, 1.42, 0.45]), ...L([0, 1.5, 0], [0.88, 0.08, 0.5]), ...L([0, 0.02, 0], [0.84, 0.04, 0.48]), ...cyl([0, 1.54, 0.18], 0.12, 0.06, 3, "y", 0.02)]], ["#A1887F", [...L([0.2, 0.78, 0.23], [0.36, 1.3, 0.01]), ...L([-0.2, 0.78, 0.23], [0.36, 1.3, 0.01])]], ["#6D4C41", [...L([0.2, 1.1, 0.24], [0.26, 0.4, 0.01]), ...L([-0.2, 1.1, 0.24], [0.26, 0.4, 0.01]), ...L([0.2, 0.45, 0.24], [0.26, 0.4, 0.01]), ...L([-0.2, 0.45, 0.24], [0.26, 0.4, 0.01])]], ["#FFC107", [...E([0.04, 0.78, 0.25], [0.02, 0.05, 0.02], 6, 4), ...E([-0.04, 0.78, 0.25], [0.02, 0.05, 0.02], 6, 4)]]]);
// gungstol: trägungstol med medar och kudde
await spara("gungstol", [[tra, [...[0.25, -0.25].flatMap((x) => ror([[x, 0.1, -0.45], [x, 0.03, -0.2], [x, 0.02, 0.1], [x, 0.08, 0.4]], [0.025, 0.025, 0.025, 0.025], 6)), ...[0.25, -0.25].flatMap((x) => [...ror([[x, 0.04, 0.2], [x, 0.45, 0.18]], [0.02, 0.02], 6), ...ror([[x, 0.03, -0.2], [x, 0.45, -0.18], [x, 1.0, -0.32]], [0.02, 0.02, 0.02], 6), ...ror([[x, 0.62, -0.2], [x, 0.62, 0.2], [x, 0.45, 0.2]], [0.02, 0.02, 0.02], 6)]), ...L([0, 0.45, 0], [0.52, 0.04, 0.42]), ...[0.6, 0.75, 0.9].flatMap((y) => L([0, y, -0.18 - (y - 0.45) * 0.25], [0.52, 0.05, 0.025]))]], ["#E53935", [...L([0, 0.49, 0.01], [0.44, 0.05, 0.36])]]]);
// barnstol: hög barnstol med bricka
await spara("barnstol", [["#FAFAFA", [...[[0.2, 0.18], [-0.2, 0.18], [0.2, -0.18], [-0.2, -0.18]].flatMap(([x, z]) => ror([[x * 1.3, 0, z * 1.3], [x * 0.8, 0.6, z * 0.8]], [0.025, 0.02], 6)), ...L([0, 0.62, 0], [0.36, 0.04, 0.32]), ...L([0, 0.9, -0.15], [0.36, 0.5, 0.04]), ...L([0.18, 0.75, 0], [0.03, 0.22, 0.3]), ...L([-0.18, 0.75, 0], [0.03, 0.22, 0.3])]], ["#4DB6AC", [...L([0, 0.86, 0.2], [0.5, 0.03, 0.25]), ...L([0, 0.66, 0.0], [0.3, 0.03, 0.26]), ...L([0, 0.2, 0.16], [0.36, 0.03, 0.06])]], ["#FFC107", [...E([0.1, 0.9, 0.22], [0.035, 0.03, 0.035], 6, 4)]]]);
// dammsugare: röd dammsugare på hjul med slang och munstycke
await spara("dammsugare", [["#D32F2F", [...E([0, 0.2, -0.1], [0.2, 0.17, 0.28], 14, 8), ...E([0, 0.32, -0.02], [0.08, 0.05, 0.12], 8, 4)]], [sv, [...cylX([0.19, 0.08, -0.25], 0.08, 0.05, 14), ...cylX([-0.19, 0.08, -0.25], 0.08, 0.05, 14), ...E([0, 0.04, 0.12], [0.04, 0.04, 0.04], 6, 4)]], ["#757575", ror([[0, 0.25, 0.17], [0.05, 0.35, 0.35], [0.12, 0.6, 0.45], [0.18, 0.75, 0.5]], [0.03, 0.03, 0.03, 0.03], 8)], ["#B0BEC5", [...ror([[0.18, 0.75, 0.5], [0.22, 0.4, 0.62], [0.24, 0.05, 0.7]], [0.02, 0.02, 0.02], 6), ...L([0.24, 0.03, 0.72], [0.3, 0.05, 0.1])]], ["#FDD835", L([0, 0.3, 0.17], [0.08, 0.03, 0.02])]]);
// kvast: sopkvast med gult ris och band
await spara("kvast", [["#8D6E63", ror([[0, 0.3, 0], [0, 1.4, 0]], [0.025, 0.025], 8)], ["#FBC02D", [...varv([[0, 0], [0.18, 0], [0.12, 0.25], [0.05, 0.38], [0, 0.4]], 16).map((t) => t.map(([x, y, z]) => [x, y, z * 0.45])), ...Array.from({ length: 9 }, (_, i) => -0.16 + i * 0.04).flatMap((x) => L([x, 0.02, 0], [0.015, 0.06, 0.08]))]], ["#E53935", varv([[0.08, 0.3], [0.09, 0.3], [0.08, 0.36], [0.06, 0.36]], 14).map((t) => t.map(([x, y, z]) => [x, y, z * 0.6]))]]);
// tandborste i mugg med tandkräm
await spara("tandborste", [["#80CBC4", varv(skal(0.1, 0.11, 0.24, 0.015), 18)], ["#E53935", ror([[0.02, 0.1, 0], [0.04, 0.3, 0], [0.06, 0.5, 0]], [0.015, 0.015, 0.015], 6)], ["#FAFAFA", [...L([0.063, 0.53, 0.02], [0.03, 0.08, 0.04]), ...ror([[-0.03, 0.1, 0.02], [-0.06, 0.32, 0.03]], [0.035, 0.03], 8)]], ["#1E88E5", [...L([0.063, 0.53, 0.045], [0.03, 0.08, 0.015]), ...ror([[-0.06, 0.32, 0.03], [-0.065, 0.37, 0.03]], [0.02, 0.02], 6)]]]);
console.log("klart");
