// R3F-MFIX: egna modeller och härledda Kenney-figurer (allt CC0) till /workspace/modell-inkorg/trollpennan-mfix.
// Människor: Kenney Blocky Characters (CC0) med omfärgad tröja (bara klädpixlar, hud/hår skyddas) och egna klosshattar.
// Egna: svan (lång hals), mask (rosa daggmask), gitarr (akustisk), ris (skål med ris). +y upp, +z fram, står på y=0.
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, unpartition, mergeDocuments } from "@gltf-transform/functions";
import sharp from "sharp";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const I = "/workspace/modell-inkorg";
const UT = `${I}/trollpennan-mfix`;
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

// ---------- svan: vit kropp, lång S-hals, orange näbb
{
  const hals = [], hr = [];
  for (let i = 0; i <= 12; i++) { const s = i / 12; hals.push([0, 0.42 + s * 0.62, 0.32 + Math.sin(s * Math.PI) * 0.12 - s * 0.02]); hr.push(0.075 - s * 0.02); }
  await io.write(`${UT}/svan-egen.glb`, bygg("svan", [
    ["#FAFAFA", [...ellips([0, 0.32, -0.05], [0.3, 0.2, 0.45]), ...ellips([0, 0.4, -0.45], [0.12, 0.1, 0.14]), ...ror(hals, hr), ...ellips([0, 1.06, 0.34], [0.085, 0.08, 0.11])]],
    ["#ECEFF1", [...ellips([0.24, 0.42, -0.1], [0.08, 0.12, 0.34]), ...ellips([-0.24, 0.42, -0.1], [0.08, 0.12, 0.34])]],
    ["#FB8C00", cyl([0, 1.04, 0.42], 0.035, 0.13, 8, "z", 0.008)],
    ["#212121", [...ellips([0.06, 1.09, 0.4], [0.018, 0.018, 0.018], 6, 4), ...ellips([-0.06, 1.09, 0.4], [0.018, 0.018, 0.018], 6, 4), ...ellips([0, 1.05, 0.44], [0.03, 0.03, 0.02], 6, 4)]],
  ]));
}
// ---------- mask: rosa daggmask i en våg längs z, ringar, två ögon
{
  const p = [], r = [], ringar = [];
  for (let i = 0; i <= 24; i++) { const s = i / 24; p.push([Math.sin(s * Math.PI * 2) * 0.12, 0.08 + Math.sin(s * Math.PI) * 0.06, -0.5 + s]); r.push(0.075 * (i === 0 ? 0.6 : i === 24 ? 0.85 : 1)); }
  for (const k of [6, 9, 12, 15, 18]) ringar.push(...ror(p.slice(k, k + 2), [0.083, 0.083], 10));
  await io.write(`${UT}/mask-egen.glb`, bygg("mask", [
    ["#F48FB1", [...ror(p, r, 10), ...ellips(p[24], [0.064, 0.064, 0.064], 8, 6), ...ellips(p[0], [0.045, 0.045, 0.045], 8, 6)]],
    ["#EC407A", ringar],
    ["#212121", [...ellips([p[24][0] + 0.03, p[24][1] + 0.04, p[24][2] + 0.045], [0.014, 0.014, 0.014], 6, 4), ...ellips([p[24][0] - 0.03, p[24][1] + 0.04, p[24][2] + 0.045], [0.014, 0.014, 0.014], 6, 4)]],
  ]));
}
// ---------- gitarr: akustisk, står upp, framsidan +z
{
  const djup = 0.09;
  await io.write(`${UT}/gitarr-egen.glb`, bygg("gitarr", [
    ["#D4914A", [...cyl([0, 0.25, -djup / 2], 0.2, djup, 20, "z"), ...cyl([0, 0.5, -djup / 2], 0.155, djup, 20, "z")]],
    ["#3E2723", [...cyl([0, 0.4, djup / 2], 0.065, 0.004, 16, "z"), ...lada([0, 0.82, 0], [0.06, 0.5, 0.04]), ...lada([0, 1.1, -0.005], [0.09, 0.12, 0.035]), ...lada([0, 0.2, djup / 2 + 0.006], [0.12, 0.03, 0.012])]],
    ["#ECEFF1", [-0.018, -0.006, 0.006, 0.018].flatMap((x) => lada([x, 0.66, 0.03], [0.004, 0.92, 0.004]))],
  ]));
}
// ---------- ris: blå skål med vitt ris (kupol + korn)
{
  const korn = [];
  for (let i = 0; i < 14; i++) { const a = i * 2.4, r = 0.08 + (i % 4) * 0.045; korn.push(...ellips([r * Math.cos(a), 0.3 + Math.sqrt(Math.max(0, 0.06 - r * r)) * 0.9, r * Math.sin(a)], [0.03, 0.018, 0.018], 6, 4)); }
  await io.write(`${UT}/ris-egen.glb`, bygg("ris", [
    ["#1E88E5", [...cyl([0, 0.02, 0], 0.18, 0.26, 20, "y", 0.34)]],
    ["#E3F2FD", [...cyl([0, 0, 0], 0.15, 0.02, 20, "y")]],
    ["#FFFDF5", [...ellips([0, 0.27, 0], [0.32, 0.12, 0.32], 16, 8, 0), ...korn]],
  ]));
}

// ---------- människor: Kenney Blocky Characters
const hsv = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; return [h, mx ? d / mx : 0, mx]; };
const rgb = (h, s, v) => { const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [r + m, g + m, b + m]; };
async function omfarga(png, { fran, till, s = 1, v = 1 }) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const [h0, h1] = fran; const mitt = h0 <= h1 ? (h0 + h1) / 2 : ((h0 + h1 + 360) / 2) % 360;
  for (let i = 0; i < data.length; i += 4) {
    const [h, ss, vv] = hsv(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
    const inne = h0 <= h1 ? h >= h0 && h <= h1 : h >= h0 || h <= h1;
    if (!inne || ss < 0.22 || vv < 0.12) continue;
    const nh = (till + (((h - mitt + 540) % 360) - 180) * 0.25 + 360) % 360;
    const [r, g, b] = rgb(nh, Math.min(1, ss * s), Math.min(1, vv * v));
    data[i] = r * 255; data[i + 1] = g * 255; data[i + 2] = b * 255;
  }
  return sharp(data, { raw: info }).png().toBuffer();
}
const HATT = {
  cowboy: [["#8D5A2B", [...lada([0, 8.3, 0], [13, 0.6, 12]), ...lada([0, 10, 0], [7.6, 3.2, 7.6])]], ["#4E342E", lada([0, 8.9, 0], [7.8, 0.8, 7.8])]],
  hjalm: [["#FDD835", [...lada([0, 8.2, 0], [9, 2.6, 9]), ...lada([0, 7.1, 4.6], [9, 0.5, 1.6])]]],
  soldathjalm: [["#556B2F", [...lada([0, 8.0, 0], [9.2, 2.4, 9.2]), ...lada([0, 6.9, 0], [10, 0.6, 10])]]],
  keps: (f) => [[f, [...lada([0, 8.4, 0], [8.6, 1.6, 8.6]), ...lada([0, 7.7, 5.6], [8, 0.4, 3.4])]]],
  piratHatt: [["#212121", [...lada([0, 8.6, 0], [10.5, 2.6, 7.5]), ...lada([0, 10.2, 0], [6, 1.2, 5])]], ["#FAFAFA", lada([0, 9, 3.8], [1.6, 1.6, 0.2])]],
  lurar: [["#424242", [...lada([0, 8.6, 0], [9.6, 1.0, 1.4]), ...lada([4.7, 4.6, 0], [1.2, 3, 3]), ...lada([-4.7, 4.6, 0], [1.2, 3, 3])]], ["#E040FB", [...lada([5.35, 4.6, 0], [0.2, 2, 2]), ...lada([-5.35, 4.6, 0], [0.2, 2, 2])]]],
  napp: [["#F06292", lada([0, 2.2, 4.3], [2.2, 1.6, 0.6])], ["#FFF59D", lada([0, 2.2, 4.75], [0.8, 0.8, 0.4])]],
};
async function figur(namn, skin, farg, hattar = [], { bebis = false, krona = false } = {}) {
  const doc = await io.read(`${I}/kenney-blocky-characters/character-${skin}.glb`);
  const root = doc.getRoot();
  if (farg) for (const t of root.listTextures()) t.setImage(new Uint8Array(await omfarga(Buffer.from(t.getImage()), farg))).setURI("");
  const head = root.listNodes().find((n) => n.getName() === "head");
  for (const h of hattar) head.addChild(doc.createNode(`hatt-${namn}`).setMesh(delarTillMesh(doc, `hatt-${namn}`, h)));
  if (krona) {
    const k = await io.read(`${I}/polypizza-cc0/crown-crown-i0pzvu.glb`);
    mergeDocuments(doc, k);
    const [huvudScen, kronScen] = root.listScenes();
    const kron = root.listNodes().find((n) => n.getName() === "Crown2");
    for (const c of kronScen.listChildren()) kronScen.removeChild(c);
    kron.getParentNode()?.removeChild(kron);
    kron.setScale([980, 980, 980]).setRotation([-Math.SQRT1_2, 0, 0, Math.SQRT1_2]).setTranslation([0, 8.9, 0]);
    head.addChild(kron); kronScen.dispose(); root.setDefaultScene(huvudScen);
    for (const m of root.listMaterials()) if (m.getName() === "Gold") m.setBaseColorFactor([1.0, 0.78, 0.15, 1]).setMetallicFactor(0).setRoughnessFactor(0.6);
    for (const m of root.listMaterials()) if (m.getName() === "Red") m.setMetallicFactor(0).setRoughnessFactor(0.6);
  }
  if (bebis) {
    // kort kropp och ben, huvudet behåller sin storlek (barnproportioner)
    for (const n of root.listNodes()) {
      if (n.getName().startsWith("leg-")) { const t = n.getTranslation(); n.setTranslation([t[0], 0.5, t[2]]).setScale([1, 0.5, 1]); }
      if (n.getName() === "torso") n.setTranslation([0, 0.5 - 0.3 * 0.7, 0]).setScale([1, 0.7, 1]);
      if (n.getName() === "head") n.setScale([0.1, 0.1 / 0.7, 0.1]).setTranslation([0, 1.2, 0]);
      if (n.getName().startsWith("arm-")) n.setScale([1, 0.75, 1]);
    }
    // animationer som flyttar benen/torson stämmer inte med de nya måtten: bara statisk pose kvar
    for (const a of root.listAnimations()) a.dispose();
  }
  for (const m of root.listMaterials()) m.setExtension("KHR_materials_unlit", null);
  for (const e of root.listExtensionsUsed()) if (e.extensionName === "KHR_materials_unlit") e.dispose();
  await doc.transform(prune(), unpartition());
  await io.write(`${UT}/${namn}-blocky.glb`, doc);
}
// klädfärger: fran = tröjans nyans i originalet, till = ny nyans
const LILA = [255, 300], GRON = [120, 175], BLA = [215, 255], ROD = [345, 8], LJBLA = [195, 215];
await figur("mamma", "n", { fran: GRON, till: 8, s: 1.05 });
await figur("pappa", "c", { fran: GRON, till: 215 });
await figur("larare", "e", { fran: LILA, till: 130, s: 0.8 });
await figur("pojke", "f", { fran: GRON, till: 50, s: 1.2, v: 1.25 }, [HATT.keps("#E53935")]);
await figur("cowboy", "k", { fran: ROD, till: 205, s: 0.7 }, [HATT.cowboy]);
await figur("byggarbetare", "m", { fran: [70, 175], till: 26, s: 1.5, v: 1.35 }, [HATT.hjalm]);
await figur("pirat", "p", { fran: BLA, till: 355, s: 1.05 }, [HATT.piratHatt]);
await figur("drottning", "e", { fran: LILA, till: 340, s: 1.1 }, [], { krona: true });
await figur("bebis", "c", { fran: GRON, till: 195, s: 0.6, v: 1.15 }, [HATT.napp], { bebis: true });
await figur("tjej", "e", { fran: LILA, till: 52, s: 1.1, v: 1.2 });
await figur("skejtare", "b", { fran: ROD, till: 285 }, [HATT.keps("#43A047")]);
await figur("soldat", "m", { fran: [85, 160], till: 80, s: 0.6, v: 0.85 }, [HATT.soldathjalm]);
await figur("expedit", "f", { fran: GRON, till: 0, s: 1.1 });
await figur("gamer", "c", { fran: GRON, till: 275 }, [HATT.lurar]);
console.log("klart");
