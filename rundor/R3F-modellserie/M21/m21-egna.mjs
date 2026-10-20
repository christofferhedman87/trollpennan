// R3F-M21: egna lågpolymodeller för kläder, sovsaker och bad (Bengtssons uppdrag) (Trollpennan, CC0). +y upp, +z fram, står på y=0. Kör från en mapp med @gltf-transform och sharp.
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, unpartition, mergeDocuments } from "@gltf-transform/functions";
import sharp from "sharp";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const I = "/workspace/modell-inkorg";
const UT = process.env.UT ?? `${I}/trollpennan-klader-m21`;
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

// ---------- hjälp för M21
const tra = "#A1887F", mtra = "#6D4C41", met = "#B0BEC5", sv = "#212121", vit = "#FAFAFA";
const flytta = (t, [dx, dy, dz]) => t.map((tri) => tri.map(([x, y, z]) => [x + dx, y + dy, z + dz]));
const skala = (t, [sx, sy, sz], [cx, cy, cz] = [0, 0, 0]) => t.map((tri) => tri.map(([x, y, z]) => [cx + (x - cx) * sx, cy + (y - cy) * sy, cz + (z - cz) * sz]));
const rotX = (t, a) => t.map((tri) => tri.map(([x, y, z]) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)]));
const rotY = (t, a) => t.map((tri) => tri.map(([x, y, z]) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)]));
const rotZ = (t, a) => t.map((tri) => tri.map(([x, y, z]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z]));
// tröja/jacka på osynlig docka: kropp, ärmar, krage. Öppen = två framstycken med glipa.
function plagg(f, { y0 = 0.05, h = 0.5, b = 0.42, d = 0.16, arm = true, oppen = false, luva = null, krage = null, knappar = null, langArm = true } = {}) {
  const yc = y0 + h / 2, delar = [];
  if (oppen) delar.push([f, [...L([-b / 4 - 0.01, yc, 0], [b / 2 - 0.02, h, d]), ...L([b / 4 + 0.01, yc, 0], [b / 2 - 0.02, h, d])]], ["#ECEFF1", L([0, yc, -0.01], [0.04, h - 0.02, d - 0.04])]);
  else delar.push([f, L([0, yc, 0], [b, h, d])]);
  if (arm) { const la = langArm ? 0.42 : 0.18; for (const s of [1, -1]) delar.push([f, ror([[s * (b / 2 - 0.03), y0 + h - 0.06, 0], [s * (b / 2 + 0.08), y0 + h - 0.12 - la * 0.35, 0], [s * (b / 2 + 0.12), y0 + h - 0.08 - la, 0]].slice(0, langArm ? 3 : 2), langArm ? [0.07, 0.065, 0.055] : [0.07, 0.065], 8)]); }
  if (luva) delar.push([luva, E([0, y0 + h + 0.02, -0.05], [0.13, 0.12, 0.1], 10, 6)]);
  if (krage) delar.push([krage, [...rotZ(L([0, 0, 0], [0.12, 0.03, d + 0.02]), 0.5).map((t) => t.map(([x, y, z]) => [x - 0.06, y + y0 + h, z])), ...rotZ(L([0, 0, 0], [0.12, 0.03, d + 0.02]), -0.5).map((t) => t.map(([x, y, z]) => [x + 0.06, y + y0 + h, z]))]]);
  if (knappar) delar.push([knappar, [0.12, 0.24, 0.36].map((k) => [oppen ? 0.04 : 0.0, y0 + h * k * 1.9 - 0.02, d / 2 + 0.01]).flatMap((p) => E(p, [0.018, 0.018, 0.01], 6, 4))]);
  return delar;
}
const par = (fn) => [...fn(0.1, 1), ...fn(-0.1, -1)];

// ---------- kläder, sovsaker och bad
// filt: hopvikt rutig röd filt (pläd) i två lager, med fransar
await spara("filt", [["#C62828", [...L([0, 0.05, 0], [0.62, 0.1, 0.44]), ...L([0.01, 0.15, 0.01], [0.6, 0.1, 0.42])]], [vit, [...[-0.2, 0, 0.2].flatMap((x) => [L([x, 0.201, 0], [0.04, 0.003, 0.42]), L([x, 0.1, 0.222], [0.04, 0.2, 0.003])]), ...[-0.12, 0.08].flatMap((z) => L([0, 0.201, z], [0.6, 0.003, 0.04]))]], ["#FFCDD2", Array.from({ length: 10 }, (_, i) => -0.18 + i * 0.04).flatMap((z) => [L([0.33, 0.05, z], [0.04, 0.012, 0.012]), L([0.32, 0.15, z], [0.04, 0.012, 0.012])])]]);
// täcke: vadderat blått täcke (rutor) med vit kudde
await spara("tacke", [["#64B5F6", [...[-0.27, 0, 0.27].flatMap((x) => [-0.35, -0.1, 0.15, 0.4].flatMap((z) => E([x, 0.06, z], [0.15, 0.06, 0.14], 8, 6, 0)))]], ["#1E88E5", [...L([0, 0.01, 0.02], [0.84, 0.02, 1.02])]], [vit, E([0, 0.06, -0.62], [0.36, 0.08, 0.14], 10, 6, 0)], ["#FFF59D", [[-0.27, 0.15], [0, 0.4], [0.27, -0.1]].flatMap(([x, z]) => E([x, 0.12, z], [0.03, 0.01, 0.03], 5, 3))]]);
// kofta: öppen stickad kofta med knappar
await spara("kofta", [...plagg("#8E24AA", { oppen: true, knappar: "#FFEB3B" }), ["#6A1B9A", [...L([0, 0.07, 0], [0.43, 0.04, 0.17]), ...cyl([0.33, 0.06, 0], 0.06, 0.04, 8), ...cyl([-0.33, 0.06, 0], 0.06, 0.04, 8)]]]);
// regnjacka: gul regnjacka (regnkappa) med luva, dragkedja och reflexband
await spara("regnjacka", [...plagg("#FDD835", { h: 0.6, luva: "#FBC02D" }), [sv, L([0, 0.35, 0.082], [0.012, 0.58, 0.004])], ["#B0BEC5", [...L([0, 0.18, 0.082], [0.42, 0.03, 0.004]), ...L([0.33, 0.12, 0], [0.12, 0.03, 0.12]), ...L([-0.33, 0.12, 0], [0.12, 0.03, 0.12])]]]);
// gummistövel: ett par gröna gummistövlar
await spara("gummistovel", [["#2E7D32", par((x) => [...cyl([x, 0.06, -0.03], 0.075, 0.34, 12), ...L([x, 0.06, 0.06], [0.13, 0.08, 0.2]), ...E([x, 0.07, 0.15], [0.065, 0.055, 0.07], 8, 5)])], [sv, par((x) => [...L([x, 0.015, 0.04], [0.15, 0.03, 0.34])])], ["#A5D6A7", par((x) => varv([[0.075, 0.38], [0.085, 0.38], [0.085, 0.41], [0.075, 0.41]], 12, [x, -0.03]))]]);
// vante: ett par röda tumvantar med vit rand och snöre
await spara("vante", [["#E53935", par((x, s) => [...E([x * 1.6, 0.27, 0], [0.09, 0.14, 0.045], 10, 6), ...rotZ(E([0, 0, 0], [0.035, 0.065, 0.035], 6, 4), -s * 0.6).map((t) => t.map(([a, b, c]) => [a + x * 1.6 + s * 0.08, b + 0.24, c]))])], [vit, par((x) => [...skala(cyl([x * 1.6, 0.02, 0], 0.085, 0.12, 12), [1, 1, 0.55], [x * 1.6, 0, 0]), ...skala(cyl([x * 1.6, 0.3, 0], 0.092, 0.04, 12), [1, 1, 0.52], [x * 1.6, 0, 0])])], ["#FFEB3B", ror([[0.16, 0.06, 0], [0.06, 0.02, 0.06], [-0.06, 0.02, 0.06], [-0.16, 0.06, 0]], [0.008, 0.008, 0.008, 0.008], 4)]]);
// strumpa: randig strumpa (socka) som står med foten framåt
{ const leg = [], rand = []; for (let i = 0; i < 6; i++) (i % 2 ? rand : leg).push(...cyl([0, 0.1 + i * 0.06, 0], 0.07, 0.06, 12));
  const fot = [], frand = []; for (let i = 0; i < 4; i++) (i % 2 ? frand : fot).push(...cylZ([0, 0.065, 0.06 + i * 0.05], 0.065, 0.05, 12));
  await spara("strumpa", [["#43A047", [...leg, ...fot, ...E([0, 0.07, 0.25], [0.065, 0.062, 0.05], 10, 6)]], [vit, [...rand, ...frand, ...E([0, 0.08, -0.02], [0.072, 0.08, 0.07], 10, 6), ...cyl([0, 0.46, 0], 0.074, 0.04, 12)]]]); }
// skjorta: ljusblå skjorta med krage och knappar
await spara("skjorta", [...plagg("#81D4FA", { krage: vit, knappar: vit }), ["#4FC3F7", L([0.11, 0.42, 0.081], [0.08, 0.07, 0.004])]]);
// byxor: blå jeans med linning, fickor och sömmar
await spara("byxor", [["#1565C0", [...L([0, 0.64, 0], [0.38, 0.08, 0.15]), ...L([0, 0.56, 0], [0.38, 0.1, 0.14]), ...L([0.1, 0.27, 0], [0.17, 0.54, 0.13]), ...L([-0.1, 0.27, 0], [0.17, 0.54, 0.13])]], ["#0D47A1", [...L([0, 0.5, 0.072], [0.006, 0.14, 0.004]), ...L([0.12, 0.56, 0.072], [0.1, 0.006, 0.004]), ...L([-0.12, 0.56, 0.072], [0.1, 0.006, 0.004]), ...L([0, 0.03, 0], [0.38, 0.06, 0.135])]], ["#FFB300", [...L([0.17, 0.27, 0.0], [0.004, 0.52, 0.004]), ...L([-0.17, 0.27, 0.0], [0.004, 0.52, 0.004]), ...E([0, 0.64, 0.077], [0.015, 0.015, 0.008], 6, 4)]]]);
// sko: ett par gympaskor med vit sula och snören
await spara("sko", [[vit, par((x) => [...L([x, 0.025, 0.02], [0.12, 0.05, 0.3]), ...E([x, 0.03, 0.16], [0.06, 0.03, 0.04], 8, 4)])], ["#E53935", par((x) => [...E([x, 0.08, 0.0], [0.065, 0.07, 0.15], 10, 6, 0), ...L([x, 0.1, -0.1], [0.12, 0.1, 0.08])])], ["#FFFDE7", par((x) => [0.0, 0.04, 0.08].map((z) => L([x, 0.14 - z * 0.35, z], [0.08, 0.012, 0.012])).flat())], ["#1E88E5", par((x, s) => L([x + s * 0.062, 0.08, 0.02], [0.004, 0.03, 0.12]))]]);
// festhatt: randig kalashatt med tofs
{ const st = [], st2 = []; for (let i = 0; i < 5; i++) (i % 2 ? st2 : st).push(...cyl([0, i * 0.08, 0], 0.15 - i * 0.03, 0.08, 16, "y", 0.15 - (i + 1) * 0.03 + 0.001));
  await spara("festhatt", [["#AB47BC", st], ["#FFEB3B", st2], ["#FF7043", [...E([0, 0.41, 0], [0.05, 0.05, 0.05], 8, 6), ...runt(0.105, 0.11, 6).flatMap((p) => E([p[0] * 1.02, p[1], p[2] * 1.02], [0.016, 0.016, 0.016], 5, 3))]]]); }
// madrass: randig madrass med knappar
await spara("madrass", [[vit, L([0, 0.1, 0], [0.7, 0.2, 1.2])], ["#90CAF9", [...[-0.25, -0.1, 0.05, 0.2].flatMap((x) => [L([x, 0.201, 0], [0.05, 0.003, 1.2]), L([x, 0.1, 0.601], [0.05, 0.2, 0.003]), L([x, 0.1, -0.601], [0.05, 0.2, 0.003])])]], ["#1E88E5", [...[-0.18, 0.12].flatMap((x) => [-0.4, 0, 0.4].map((z) => E([x, 0.2, z], [0.02, 0.008, 0.02], 5, 3))).flat(), ...ror([[0.35, 0.2, 0.6], [-0.35, 0.2, 0.6], [-0.35, 0.2, -0.6], [0.35, 0.2, -0.6], [0.35, 0.2, 0.6]], [0.012, 0.012, 0.012, 0.012, 0.012], 4)]]]);
// hundbädd: rund brun hundbädd med kudde och ett tuggben
await spara("hundbadd", [["#8D6E63", varv([[0, 0.0], [0.4, 0.0], [0.44, 0.08], [0.43, 0.18], [0.37, 0.22], [0.31, 0.17], [0.3, 0.08], [0, 0.06]], 22)], ["#FFE0B2", E([0, 0.07, 0], [0.31, 0.05, 0.31], 14, 6, 0)], [vit, [...ror([[-0.08, 0.13, 0.05], [0.08, 0.13, 0.05]], [0.018, 0.018], 6), ...[-0.09, 0.09].flatMap((x) => [E([x, 0.13, 0.03], [0.025, 0.02, 0.025], 5, 3), E([x, 0.13, 0.07], [0.025, 0.02, 0.025], 5, 3)])]], ["#5D4037", runt(0.37, 0.205, 10).flatMap((p) => E(p, [0.012, 0.012, 0.012], 4, 3))]]);
// balja: oval zinkbalja (tvättbalja) med handtag, vatten och bubblor
await spara("balja", [["#90A4AE", [...skala(varv([[0, 0], [0.3, 0], [0.36, 0.26], [0.34, 0.26], [0.28, 0.02], [0, 0.02]], 20), [1, 1, 0.65]), ...[1, -1].flatMap((s) => skala(halvRing([s * 0.37, 0.22, 0], 0.05, 0.012, "xy", s > 0 ? -Math.PI / 2 : Math.PI / 2, s > 0 ? Math.PI / 2 : 1.5 * Math.PI), [1, 1, 1]))]], ["#4FC3F7", skala(varv([[0, 0.19], [0.335, 0.19], [0, 0.191]], 20), [1, 1, 0.65])], [vit, [[0.1, 0.21, 0.05], [-0.05, 0.22, -0.04], [0.0, 0.2, 0.1], [-0.15, 0.21, 0.03], [0.18, 0.2, -0.05]].flatMap((p, i) => E(p, [0.04 - i * 0.004, 0.035 - i * 0.003, 0.04 - i * 0.004], 6, 4))], ["#B0BEC5", [0.08, 0.16].flatMap((y) => skala(varv([[0.32 + y * 0.18, y], [0.335 + y * 0.18, y], [0.335 + y * 0.18, y + 0.012], [0.32 + y * 0.18, y + 0.012]], 20), [1, 1, 0.66]))]]);
// borste: ryktborste i trä med band och gula borst
await spara("borste", [[tra, [...skala(cyl([0, 0.08, 0], 0.2, 0.05, 16), [0.6, 1, 1]), ...skala(E([0, 0.13, 0], [0.2, 0.025, 0.2], 12, 4), [0.6, 1, 1])]], ["#C62828", [...L([0, 0.15, 0], [0.13, 0.025, 0.04]), ...L([0.065, 0.12, 0], [0.01, 0.06, 0.04]), ...L([-0.065, 0.12, 0], [0.01, 0.06, 0.04])]], ["#FBC02D", Array.from({ length: 5 }, (_, i) => -0.08 + i * 0.04).flatMap((x) => Array.from({ length: 8 }, (_, j) => -0.15 + j * 0.043).map((z) => cyl([x, 0, z], 0.02, 0.085, 6)).flat())]]);
// schampo: rosa schampoflaska med vit kork, etikett och bubblor
await spara("schampo", [["#F06292", skala(varv([[0, 0], [0.11, 0], [0.12, 0.02], [0.12, 0.34], [0.08, 0.4], [0.04, 0.42], [0, 0.42]], 16), [1, 1, 0.6])], [vit, [...cyl([0, 0.41, 0], 0.045, 0.06, 12), ...L([0, 0.48, 0.02], [0.06, 0.025, 0.07]), ...skala(cyl([0, 0.12, 0], 0.124, 0.14, 16), [1, 1, 0.62]), ...[[0.12, 0.5, 0.05], [0.17, 0.58, 0.0], [0.1, 0.64, -0.02]].flatMap((p, i) => E(p, [0.035 - i * 0.008, 0.035 - i * 0.008, 0.035 - i * 0.008], 6, 4))]], ["#AB47BC", [...E([0, 0.2, 0.075], [0.04, 0.03, 0.006], 8, 4)]]]);
// tvättlapp: hopvikt randig tvättlapp med upphängningsögla
await spara("tvattlapp", [["#4DD0E1", [...L([0, 0.025, 0], [0.24, 0.05, 0.24])]], [vit, [...[-0.08, 0, 0.08].flatMap((z) => L([0, 0.051, z], [0.24, 0.003, 0.025])), ...ror([[0.1, 0.05, -0.12], [0.12, 0.09, -0.16], [0.08, 0.1, -0.18], [0.07, 0.05, -0.12]], [0.008, 0.008, 0.008, 0.008], 4)]]]);
// kam: blå kam som står på tänderna
await spara("kam", [["#1E88E5", [...L([0, 0.12, 0], [0.4, 0.05, 0.025]), ...Array.from({ length: 16 }, (_, i) => -0.18 + i * 0.024).flatMap((x) => L([x, 0.05, 0], [0.012, 0.1, 0.02]))]], [vit, L([0.12, 0.12, 0.013], [0.1, 0.02, 0.002])]]);
// pool: rund uppblåsbar pool (bassäng) med vatten, stege och badring
await spara("pool", [["#29B6F6", varv([[0, 0], [0.6, 0], [0.62, 0.3], [0.56, 0.3], [0.54, 0.03], [0, 0.03]], 26)], [vit, ring([0, 0.31, 0], 0.59, 0.04, "xz", 26)], ["#81D4FA", varv([[0, 0.24], [0.55, 0.24], [0, 0.241]], 26)], ["#FF7043", ring([0.15, 0.26, 0.1], 0.13, 0.05, "xz", 14)], ["#FDD835", ring([0.15, 0.262, 0.1], 0.13, 0.051, "xz", 14).filter((_, i) => (i >> 3) % 2 === 0)], ["#B0BEC5", [...[-0.06, 0.06].flatMap((z) => ror([[0.7, 0, z], [0.66, 0.38, z], [0.58, 0.42, z]], [0.012, 0.012, 0.012], 5)), ...[0.1, 0.2, 0.3].flatMap((y) => L([0.69 - y * 0.1, y, 0], [0.03, 0.012, 0.12]))]]]);
// höstack: rund höstack med strån och en hötjuga
await spara("hostack", [["#F9A825", E([0, 0, 0], [0.5, 0.6, 0.5], 14, 8, 0)], ["#FDD835", [...Array.from({ length: 14 }, (_, i) => i).flatMap((i) => { const a = i * 2.4, r = 0.36 + (i % 3) * 0.04, y = 0.12 + (i % 5) * 0.08; return L([r * Math.cos(a), y, r * Math.sin(a)], [0.18, 0.012, 0.012]).map((t) => t); }), ...E([0, 0.58, 0], [0.18, 0.06, 0.18], 8, 4)]], [tra, ror([[0.46, 0.0, 0.25], [0.3, 0.9, 0.18]], [0.02, 0.02], 6)], [met, [0.02, -0.02, 0.0].flatMap((d) => ror([[0.3 + d, 0.9, 0.18 + d], [0.29 + d, 1.05, 0.17 + d]], [0.008, 0.006], 4))]]);
// nattlampa: svamplampa med röd hatt och vita prickar
await spara("nattlampa", [["#FFF8E1", [...varv([[0, 0], [0.12, 0], [0.12, 0.03], [0.06, 0.05], [0.055, 0.22], [0, 0.22]], 14)]], ["#E53935", varv([[0, 0.2], [0.2, 0.2], [0.19, 0.26], [0.14, 0.33], [0.06, 0.37], [0, 0.375]], 18)], [vit, [[0, 0.37, 0], [0.12, 0.31, 0.06], [-0.1, 0.32, 0.08], [0.05, 0.3, -0.13], [-0.12, 0.29, -0.06], [0.0, 0.33, 0.12]].flatMap((p) => E(p, [0.03, 0.02, 0.03], 6, 4))], ["#FFEB3B", E([0, 0.19, 0], [0.12, 0.02, 0.12], 10, 4)], [sv, [...cylZ([0.13, 0.015, 0.02], 0.008, 0.12, 4)]]]);
// pyjamas: blå pyjamas med stjärnor (tröja och byxor)
await spara("pyjamas", [...plagg("#3949AB", { y0: 0.5, h: 0.42, knappar: "#FFEB3B" }), ["#3949AB", [...L([0.1, 0.25, 0], [0.17, 0.5, 0.13]), ...L([-0.1, 0.25, 0], [0.17, 0.5, 0.13])]], ["#FFEB3B", [[0.12, 0.8], [-0.1, 0.65], [0.08, 0.6], [-0.12, 0.85], [0.1, 0.3], [-0.1, 0.15], [0.12, 0.08]].flatMap(([x, y]) => skala(cyl([x, y, y > 0.5 ? 0.082 : 0.067], 0.025, 0.004, 5, "z"), [1, 1, 1]))], [vit, [...cyl([0, 0.92, 0], 0.07, 0.02, 10)]]]);
// baddräkt: randig baddräkt med axelband
await spara("baddrakt", [["#26C6DA", [...L([0, 0.42, 0], [0.32, 0.36, 0.13]), ...cyl([0, 0.12, -0.0], 0.12, 0.13, 10, "y", 0.16).map((t) => t.map(([x, y, z]) => [x, y, z * 0.5])), ...[0.11, -0.11].flatMap((x) => L([x, 0.65, 0], [0.04, 0.1, 0.06]))]], ["#FFEB3B", [0.3, 0.42, 0.54].flatMap((y) => L([0, y, 0.067], [0.32, 0.03, 0.004]))], ["#F06292", E([0.09, 0.47, 0.068], [0.04, 0.04, 0.006], 8, 4)]]);
// nappflaska: nappflaska med skala, ring och napp
await spara("nappflaska", [["#E1F5FE", varv([[0, 0], [0.08, 0], [0.085, 0.02], [0.085, 0.28], [0.07, 0.3], [0, 0.3]], 16)], [vit, varv([[0, 0.0], [0.065, 0.0], [0.065, 0.2], [0, 0.2]], 14)], ["#4FC3F7", [...varv([[0.068, 0.28], [0.09, 0.28], [0.09, 0.33], [0.068, 0.33]], 16), ...[0.06, 0.1, 0.14, 0.18].flatMap((y) => L([0, y, 0.086], [0.04, 0.006, 0.004]))]], ["#FFCC80", varv([[0, 0.33], [0.045, 0.33], [0.03, 0.38], [0.02, 0.42], [0.025, 0.44], [0, 0.45]], 12)]]);
// barnvagn: blå barnvagn i profil (längs x) med sufflett, handtag och fyra hjul
await spara("barnvagn", [["#1E88E5", [...E([0, 0.42, 0], [0.34, 0.15, 0.22], 14, 6).filter((tri) => tri.every((p) => p[1] <= 0.45)), ...L([0, 0.44, 0], [0.62, 0.05, 0.42])]], ["#0D47A1", [...E([-0.14, 0.44, 0], [0.22, 0.26, 0.215], 12, 8, 0).filter((tri) => tri.some((p) => p[0] < -0.12))]], [vit, [...E([0.12, 0.48, 0], [0.13, 0.05, 0.16], 8, 4), ...L([0.31, 0.44, 0], [0.02, 0.06, 0.42])]], [sv, [...[0.2, -0.2].flatMap((z) => ror([[-0.28, 0.42, z], [-0.46, 0.7, z], [-0.52, 0.8, z]], [0.015, 0.015, 0.015], 5)), ...cylZ([-0.52, 0.8, 0], 0.025, 0.44, 8), ...[0.18, -0.18].flatMap((z) => [...ror([[0.2, 0.38, z], [0.28, 0.12, z]], [0.012, 0.012], 4), ...ror([[-0.2, 0.38, z], [-0.28, 0.12, z]], [0.012, 0.012], 4)])]], ...[[0.28, 0.2], [0.28, -0.2], [-0.28, 0.2], [-0.28, -0.2]].flatMap(([x, z]) => [["#263238", cylZ([x, 0.11, z], 0.11, 0.04, 14)], ["#B0BEC5", cylZ([x, 0.11, z + Math.sign(z) * 0.005], 0.04, 0.05, 8)]])]);
// vagga: trävagga i profil (längs x) på medar, med kudde och rosa filt
await spara("vagga", [[tra, [...L([0, 0.32, 0], [0.7, 0.04, 0.4]), ...L([0, 0.42, 0.2], [0.7, 0.22, 0.03]), ...L([0, 0.42, -0.2], [0.7, 0.22, 0.03]), ...L([0.35, 0.45, 0], [0.03, 0.3, 0.43]), ...L([-0.35, 0.5, 0], [0.03, 0.4, 0.43]), ...[0.18, -0.18].flatMap((z) => [L([0.25, 0.17, z], [0.03, 0.29, 0.03]), L([-0.25, 0.17, z], [0.03, 0.29, 0.03])])]], [mtra, [0.18, -0.18].flatMap((z) => ror([[-0.45, 0.12, z], [-0.25, 0.04, z], [0, 0.02, z], [0.25, 0.04, z], [0.45, 0.12, z]], [0.025, 0.025, 0.025, 0.025, 0.025], 6))], [vit, E([-0.22, 0.38, 0], [0.09, 0.05, 0.14], 8, 4)], ["#F48FB1", [...L([0.08, 0.37, 0], [0.42, 0.05, 0.36])]], ["#FFEB3B", [...[-0.2, 0, 0.2].map((x) => E([x, 0.44, 0.217], [0.04, 0.04, 0.01], 6, 4)).flat()]]]);
console.log("klart");
