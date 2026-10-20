// R3F-M17: människor 2 som Kenney Blocky Characters (CC0) med omfärgade kläder och egna klossaccessoarer (Trollpennan, CC0).
// Huvudets enheter: kub 8x8x8 (y 0..8, ansiktet mot +z vid z=4). Bål: x ±0.4, y 0.3..1.2, z ±0.3. Höger arm: handen vid y≈-1.
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, unpartition, mergeDocuments } from "@gltf-transform/functions";
import sharp from "sharp";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const I = "/workspace/modell-inkorg";
const UT = `${I}/trollpennan-folk-m17`;
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

// ---------- människor: Kenney Blocky Characters
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
const L = lada;
const guldKrona = (y = 8, h = 1.6, f = "#FFC107") => [[f, [...L([0, y + 0.3, 0], [8.6, 0.6, 8.6]), ...[-3.4, 0, 3.4].flatMap((x) => [...L([x, y + 0.6 + h / 2, 4], [1.2, h, 0.6]), ...L([x, y + 0.6 + h / 2, -4], [1.2, h, 0.6])]), ...L([4, y + 0.6 + h / 2, 0], [0.6, h, 1.2]), ...L([-4, y + 0.6 + h / 2, 0], [0.6, h, 1.2])]], ["#E53935", L([0, y + 0.9, 4.35], [1, 1, 0.3])]];
const keps = (f) => [[f, [...L([0, 8.4, 0], [8.6, 1.6, 8.6]), ...L([0, 7.7, 5.6], [8, 0.4, 3.4])]]];
const hatt = (f, band) => [[f, [...L([0, 8.3, 0], [11, 0.5, 11]), ...L([0, 9.8, 0], [7.4, 2.8, 7.4])]], [band, L([0, 8.9, 0], [7.6, 0.7, 7.6])]];
const mossa = (f) => [[f, [...L([0, 8.5, 0], [8.8, 2.4, 8.8]), ...L([0, 7.5, 0], [9.2, 0.8, 9.2])]]];
const harKnut = (f) => [[f, [...L([0, 8.6, -1], [6, 1.4, 6]), ...L([0, 10, -1.5], [3.4, 2.4, 3.4])]]];
const iHand = (delar) => delar; // i höger arms rum, handen kring (-0.2, -1, 0)
const R = { LILA: [255, 300], GRON: [120, 175], BLA: [215, 255], ROD: [345, 8], LJBLA: [195, 215], MGRON: [70, 175], BRUN: [15, 45], GRA: null };
async function figur2(namn, skin, farger, { huvud = [], bal = [], hand = [], barn = false, allt = null } = {}) {
  const doc = await io.read(`${I}/kenney-blocky-characters/character-${skin}.glb`);
  const root = doc.getRoot();
  for (const t of root.listTextures()) {
    let png = Buffer.from(t.getImage());
    for (const f of farger) png = await omfarga(png, f);
    if (allt) png = await helfarg(png, allt);
    t.setImage(new Uint8Array(png)).setURI("");
  }
  const nod = (n) => root.listNodes().find((x) => x.getName() === n);
  const lagg = (n, delar, tag) => { if (delar.length) nod(n).addChild(doc.createNode(`${tag}-${namn}`).setMesh(delarTillMesh(doc, `${tag}-${namn}`, delar))); };
  lagg("head", huvud, "huvud"); lagg("torso", bal, "bal"); lagg("arm-right", hand, "hand");
  if (barn) {
    for (const n of root.listNodes()) {
      if (n.getName().startsWith("leg-")) { const t = n.getTranslation(); n.setTranslation([t[0], 0.7, t[2]]).setScale([1, 0.7, 1]); }
      if (n.getName() === "torso") n.setTranslation([0, 0.7 - 0.3 * 0.8, 0]).setScale([1, 0.8, 1]);
      if (n.getName() === "head") n.setScale([0.1, 0.1 / 0.8, 0.1]);
    }
    for (const a of root.listAnimations()) a.dispose();
  }
  for (const m of root.listMaterials()) m.setExtension("KHR_materials_unlit", null);
  for (const e of root.listExtensionsUsed()) if (e.extensionName === "KHR_materials_unlit") e.dispose();
  await doc.transform(prune(), unpartition());
  await io.write(`${UT}/${namn}-blocky.glb`, doc);
}
// hela texturen mot en färg (mumie): ljus, nästan grå, ögon (mörka pixlar) kvar
async function helfarg(png, { h, s }) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const [, , v] = hsv(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
    if (v < 0.18) continue;
    const [r, g, b] = rgb(h, s, Math.min(1, 0.62 + v * 0.38));
    data[i] = r * 255; data[i + 1] = g * 255; data[i + 2] = b * 255;
  }
  return sharp(data, { raw: info }).png().toBuffer();
}
const vit = (fran) => ({ fran, till: 0, s: 0.05, v: 1.9 });
const svart = (fran) => ({ fran, till: 220, s: 0.3, v: 0.35 });
const F = [
  ["bonde", "a", [], { huvud: [["#F2D16B", [...L([0, 8.3, 0], [13, 0.5, 13]), ...L([0, 9.6, 0], [8, 2.4, 8])]], ["#C62828", L([0, 8.9, 0], [8.2, 0.6, 8.2])]], hand: [["#8D6E63", L([-0.2, -0.6, 0.25], [0.08, 1.6, 0.08])], ["#B0BEC5", [...L([-0.2, 0.2, 0.25], [0.5, 0.06, 0.06]), ...[-0.4, -0.2, 0, 0.2, 0.4].flatMap((x) => L([-0.2 + x, 0.3, 0.25], [0.05, 0.2, 0.05]))]]] }],
  ["ninja", "r", [], { hand: [["#B0BEC5", L([-0.2, -1.05, 0.55], [0.06, 0.06, 0.9])], ["#212121", L([-0.2, -1.05, 0.08], [0.1, 0.1, 0.3])]] }],
  ["kvinna", "e", [{ fran: R.LILA, till: 205 }], {}],
  ["brandman", "k", [{ fran: R.ROD, till: 45, s: 1.1, v: 1.2 }], { huvud: [["#D32F2F", [...L([0, 8.2, 0], [9.2, 2.6, 9.2]), ...L([0, 7.1, -4.8], [9.2, 0.5, 2])]], ["#FFC107", L([0, 8.6, 4.65], [2, 1.6, 0.3])]] }],
  ["clown", "c", [{ fran: R.GRON, till: 300, s: 1.1 }], { huvud: [["#E53935", L([0, 3.2, 4.6], [1.8, 1.8, 1.4])], ["#FF7043", [...L([4.8, 6.6, 0], [1.8, 3, 7]), ...L([-4.8, 6.6, 0], [1.8, 3, 7]), ...L([0, 8.5, 0], [6, 1.2, 6])]], ["#FDD835", L([0, 9.8, 0], [1.6, 1.6, 1.6])]] }],
  ["doktor", "c", [vit(R.GRON)], { bal: [["#455A64", [...L([0.14, 0.95, 0.31], [0.04, 0.4, 0.02]), ...L([-0.14, 0.95, 0.31], [0.04, 0.4, 0.02]), ...L([0, 0.75, 0.31], [0.32, 0.04, 0.02])]], ["#B0BEC5", L([0, 0.68, 0.32], [0.1, 0.1, 0.03])]] }],
  ["kock", "f", [vit(R.GRON)], { huvud: [["#FAFAFA", [...L([0, 8.6, 0], [8.4, 1.4, 8.4]), ...L([0, 11.0, 0], [9.8, 3.6, 9.8])]]], hand: [["#9E9E9E", L([-0.2, -1.05, 0.45], [0.1, 0.06, 0.6])], ["#795548", L([-0.2, -1.05, 0.08], [0.08, 0.08, 0.25])]] }],
  ["mormor", "i", [{ fran: [185, 230], till: 330, s: 4, v: 0.95, minS: 0.06 }], { huvud: harKnut("#E0E0E0") }],
  ["farmor", "i", [{ fran: [185, 230], till: 270, s: 4, v: 0.85, minS: 0.06 }], { huvud: [...harKnut("#BDBDBD"), ["#7B1FA2", L([0, 9.6, -1.5], [3.6, 0.5, 3.6])]] }],
  ["prins", "f", [{ fran: R.GRON, till: 220, s: 1.1 }], { huvud: guldKrona(8, 1.4) }],
  ["prinsessa", "e", [{ fran: R.LILA, till: 320, s: 1.1, v: 1.1 }], { huvud: [["#FFD54F", [...L([0, 8.2, 0], [7.6, 0.5, 7.6]), ...L([0, 9.2, 3.6], [1.4, 1.6, 0.4]), ...L([2.2, 8.8, 3.6], [0.8, 0.9, 0.4]), ...L([-2.2, 8.8, 3.6], [0.8, 0.9, 0.4])]], ["#E91E63", L([0, 9.3, 3.85], [0.7, 0.7, 0.2])]] }],
  ["barn", "c", [{ fran: R.GRON, till: 95, s: 1.0, v: 1.15 }], { barn: true }],
  ["alva", "e", [{ fran: R.LILA, till: 150, s: 0.8, v: 1.25 }], { bal: [["#B3E5FC", [...L([0.32, 0.95, -0.36], [0.5, 0.7, 0.03]), ...L([-0.32, 0.95, -0.36], [0.5, 0.7, 0.03]), ...L([0.26, 0.5, -0.36], [0.36, 0.4, 0.03]), ...L([-0.26, 0.5, -0.36], [0.36, 0.4, 0.03])]]], hand: [["#FFF176", L([-0.2, -0.75, 0.3], [0.04, 0.6, 0.04])], ["#FFEB3B", L([-0.2, -0.4, 0.3], [0.16, 0.16, 0.06])]] }],
  ["frisor", "n", [svart(R.GRON)], { hand: [["#B0BEC5", [...L([-0.2, -1.05, 0.4], [0.04, 0.04, 0.4]), ...L([-0.14, -1.05, 0.38], [0.04, 0.04, 0.38])]], ["#E53935", [...L([-0.2, -1.05, 0.15], [0.12, 0.08, 0.08]), ...L([-0.12, -1.05, 0.15], [0.12, 0.08, 0.08])]]] }],
  ["sjukskoterska", "n", [vit(R.GRON)], { huvud: [["#FAFAFA", L([0, 8.6, 1], [7, 1.4, 4])], ["#E53935", [...L([0, 8.6, 3.05], [1.4, 0.4, 0.2]), ...L([0, 8.6, 3.05], [0.4, 1.2, 0.2])]]] }],
  ["dykare", "m", [svart([70, 175])], { huvud: [["#4FC3F7", L([0, 5.0, 4.4], [6.4, 2.4, 0.8])], ["#212121", L([0, 5.0, 4.1], [8.2, 0.6, 0.4])], ["#FDD835", [...L([3.4, 6.4, 3.6], [0.6, 4, 0.6])]]], bal: [["#FDD835", [...L([0.12, 0.85, -0.42], [0.18, 0.6, 0.2]), ...L([-0.12, 0.85, -0.42], [0.18, 0.6, 0.2])]]] }],
  ["brevbarare", "b", [{ fran: R.ROD, till: 50, s: 1.1, v: 1.2 }], { huvud: keps("#1565C0"), bal: [["#1565C0", L([0.46, 0.55, 0], [0.12, 0.35, 0.4])], ["#795548", L([0, 0.95, 0.31], [0.85, 0.06, 0.02])]] }],
  ["malare", "f", [vit(R.GRON)], { huvud: keps("#FAFAFA"), hand: [["#8D6E63", L([-0.2, -1.05, 0.3], [0.06, 0.06, 0.4])], ["#E53935", L([-0.2, -1.05, 0.55], [0.2, 0.14, 0.12])]], bal: [["#42A5F5", L([0.15, 0.6, 0.31], [0.1, 0.1, 0.02])], ["#FFEB3B", L([-0.2, 0.9, 0.31], [0.12, 0.08, 0.02])]] }],
  ["snickare", "k", [{ fran: R.ROD, till: 210, s: 0.6 }], { huvud: keps("#F57C00"), hand: [["#8D6E63", L([-0.2, -1.05, 0.35], [0.06, 0.06, 0.5])], ["#616161", L([-0.2, -1.05, 0.62], [0.08, 0.22, 0.1])]] }],
  ["kapten", "j", [], { huvud: [["#FAFAFA", [...L([0, 8.6, 0], [9, 1.6, 9]), ...L([0, 9.6, 0], [9.6, 0.6, 9.6])]], ["#212121", L([0, 8.0, 5], [8, 0.4, 2.2])], ["#FFC107", L([0, 8.8, 4.6], [1.6, 1, 0.3])]] }],
  ["fiskare", "m", [{ fran: [70, 175], till: 52, s: 1.4, v: 1.35 }], { huvud: [["#FDD835", [...L([0, 8.4, -0.5], [9.6, 2, 9.6]), ...L([0, 7.6, -2], [11, 0.5, 9])]]], hand: [["#8D6E63", L([-0.2, -0.4, 0.4], [0.05, 1.8, 0.05])]] }],
  ["viking", "k", [{ fran: R.ROD, till: 25, s: 0.9, v: 0.8 }], { huvud: [["#9E9E9E", [...L([0, 8.2, 0], [9, 2.6, 9]), ...L([0, 6.0, 4.6], [1, 3, 0.6])]], ["#FFF8E1", [...L([5.4, 9.4, 0], [2, 1, 1]), ...L([-5.4, 9.4, 0], [2, 1, 1]), ...L([6.2, 10.6, 0], [0.8, 2, 0.8]), ...L([-6.2, 10.6, 0], [0.8, 2, 0.8])]]] }],
  ["superhjalte", "b", [{ fran: R.ROD, till: 215, s: 1.1 }], { bal: [["#E53935", L([0, 0.55, -0.34], [0.8, 1.3, 0.03])], ["#FDD835", L([0, 0.9, 0.31], [0.3, 0.26, 0.02])]], huvud: [["#E53935", L([0, 5.2, 4.1], [8.2, 1.2, 0.3])]] }],
  ["tjuv", "f", [svart(R.GRON)], { huvud: [["#212121", [...L([0, 5.0, 4.1], [8.2, 1.4, 0.3]), ...L([0, 8.4, 0], [8.8, 2, 8.8])]]], bal: [["#FAFAFA", [0.95, 0.75, 0.55].flatMap((y) => L([0, y, 0.31], [0.82, 0.07, 0.02]))]] }],
  ["aventyrare", "k", [{ fran: R.ROD, till: 40, s: 0.6, v: 1.1 }], { huvud: hatt("#A1887F", "#3E2723"), bal: [["#5D4037", L([0, 0.95, 0.31], [0.85, 0.06, 0.02])]] }],
  ["detektiv", "k", [{ fran: R.ROD, till: 30, s: 0.7, v: 0.9 }], { huvud: hatt("#6D4C41", "#212121"), hand: [["#5D4037", L([-0.2, -1.05, 0.3], [0.06, 0.06, 0.35])], ["#B3E5FC", L([-0.2, -1.05, 0.58], [0.26, 0.26, 0.04])]] }],
  ["forskare", "i", [{ ...vit([185, 230]), minS: 0.06 }], { hand: [["#81C784", L([-0.2, -0.95, 0.3], [0.1, 0.35, 0.1])], ["#ECEFF1", L([-0.2, -0.72, 0.3], [0.12, 0.08, 0.12])]] }],
  ["konstnar", "e", [{ fran: R.LILA, till: 15, s: 1, v: 1.1 }], { huvud: [["#212121", [...L([0.6, 8.4, 0], [9, 1.2, 9]), ...L([0.4, 9.2, 0], [1, 0.6, 1])]]], hand: [["#D7CCC8", L([-0.2, -1.05, 0.4], [0.45, 0.04, 0.35])], ["#E53935", L([-0.32, -1.02, 0.45], [0.08, 0.03, 0.08])], ["#1E88E5", L([-0.1, -1.02, 0.45], [0.08, 0.03, 0.08])], ["#FDD835", L([-0.2, -1.02, 0.3], [0.08, 0.03, 0.08])]] }],
  ["ballerina", "n", [{ fran: R.GRON, till: 335, s: 0.7, v: 1.25 }], { bal: [["#F8BBD0", L([0, 0.35, 0], [1.3, 0.1, 1.1])]], huvud: harKnut("#3E2723") }],
  ["mekaniker", "m", [{ fran: [70, 175], till: 215, s: 1.2, v: 1.1 }], { huvud: keps("#E53935"), hand: [["#90A4AE", [...L([-0.2, -1.05, 0.4], [0.06, 0.06, 0.5]), ...L([-0.2, -1.05, 0.67], [0.16, 0.06, 0.08])]]] }],
  ["jagare", "k", [{ fran: R.ROD, till: 95, s: 0.7, v: 0.8 }], { huvud: [["#33691E", [...L([0, 8.3, 0], [10, 0.5, 10]), ...L([0, 9.4, 0], [7.4, 2, 7.4])]], ["#FF7043", L([3.8, 10, 0], [0.4, 1.6, 0.4])]] }],
  ["skogshuggare", "b", [], { huvud: mossa("#C62828"), hand: [["#8D6E63", L([-0.2, -1.05, 0.4], [0.07, 0.07, 0.7])], ["#90A4AE", L([-0.2, -0.92, 0.72], [0.05, 0.3, 0.2])]] }],
  ["vakt", "j", [svart([200, 260])], { huvud: [["#212121", L([0, 10.5, 0], [8.8, 6, 8.8])]], bal: [["#E53935", L([0, 0.95, 0.31], [0.85, 0.08, 0.02])]] }],
  ["kejsare", "f", [{ fran: R.GRON, till: 280, s: 1.1 }], { huvud: guldKrona(8, 2.2, "#FFB300"), bal: [["#B71C1C", L([0, 0.5, -0.34], [0.86, 1.4, 0.03])], ["#FAFAFA", L([0, 1.18, -0.2], [0.9, 0.08, 0.3])]] }],
  ["jultomte", "i", [{ fran: [185, 230], till: 0, s: 6, v: 0.85, minS: 0.06 }], { huvud: [["#D32F2F", [...L([0, 9.0, 0], [8, 2.2, 8]), ...L([0, 10.6, -1], [5, 1.6, 5])]], ["#FAFAFA", [...L([0, 8.1, 0], [9, 1.2, 9]), ...L([0, 11.6, -2.6], [1.8, 1.8, 1.8]), ...L([0, 1.6, 4.4], [7.6, 3.2, 1]), ...L([0, 3.6, 4.4], [3, 0.8, 0.8])]]] }],
  ["mumie", "a", [], { allt: { h: 40, s: 0.12 }, bal: [["#D7CCC8", [0.4, 0.65, 0.9].flatMap((y) => L([0, y, 0.31], [0.82, 0.04, 0.02]))]] }],
  ["alien", "l", [{ fran: [190, 260], till: 200, s: 0.15, v: 1.5 }], { huvud: [["#7CB342", [...L([2, 9.5, 0], [0.5, 3, 0.5]), ...L([-2, 9.5, 0], [0.5, 3, 0.5])]], ["#E040FB", [...L([2, 11.3, 0], [1.2, 1.2, 1.2]), ...L([-2, 11.3, 0], [1.2, 1.2, 1.2])]]] }],
  ["sjoman", "k", [{ fran: R.ROD, till: 215, s: 1.1, v: 1.0 }], { huvud: [["#FAFAFA", [...L([0, 8.5, 0], [8.6, 1.2, 8.6]), ...L([0, 9.3, 0], [9.6, 0.6, 9.6])]], ["#1565C0", L([0, 8.5, 4.35], [8.7, 0.4, 0.1])]], bal: [["#FAFAFA", [...L([0, 1.12, 0.31], [0.6, 0.06, 0.02]), ...L([0, 1.12, -0.31], [0.8, 0.3, 0.02])]]] }],
  ["rormokare", "b", [{ fran: R.ROD, till: 215, s: 1.1 }], { huvud: keps("#E53935"), hand: [["#90A4AE", [...L([-0.2, -1.05, 0.4], [0.07, 0.07, 0.55]), ...L([-0.2, -1.05, 0.7], [0.22, 0.07, 0.1]), ...L([-0.29, -1.05, 0.78], [0.05, 0.07, 0.14]), ...L([-0.11, -1.05, 0.78], [0.05, 0.07, 0.14])]]], bal: [["#1565C0", [...L([0.2, 1.05, 0.31], [0.1, 0.35, 0.02]), ...L([-0.2, 1.05, 0.31], [0.1, 0.35, 0.02])]]] }],
  ["servitor", "f", [vit(R.GRON)], { bal: [["#212121", [...L([0.07, 1.12, 0.32], [0.12, 0.1, 0.03]), ...L([-0.07, 1.12, 0.32], [0.12, 0.1, 0.03])]]], hand: [["#B0BEC5", L([-0.2, -1.05, 0.35], [0.6, 0.04, 0.6])], ["#4FC3F7", L([-0.2, -0.92, 0.35], [0.12, 0.22, 0.12])]] }],
  ["sangare", "e", [{ fran: R.LILA, till: 48, s: 1.2, v: 1.2 }], { hand: [["#212121", L([-0.2, -0.9, 0.35], [0.06, 0.45, 0.06])], ["#90A4AE", L([-0.2, -0.6, 0.35], [0.16, 0.16, 0.16])]], huvud: harKnut("#5D4037") }],
];
const bara = process.argv.slice(2);
for (const [namn, skin, farger, opt] of F) if (!bara.length || bara.includes(namn)) await figur2(namn, skin, farger, opt);
console.log("klart", F.length);
