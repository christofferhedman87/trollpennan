// R3F-MFIX3: tre lastbilar som skiljer sig åt (Kenney Car Kit truck-flat, CC0, med omfärgad hytt och egna tillägg, Trollpennan, CC0). Bygger på M18/egna-m18.mjs. +y upp, +z fram, står på y=0.
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, unpartition, mergeDocuments } from "@gltf-transform/functions";
import sharp from "sharp";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const I = "/workspace/modell-inkorg";
const UT = `${I}/trollpennan-mfix3`;
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
async function kenneyPlus(namn, kalla, delar, hytt = null) {
  const doc = await io.read(kalla); const root = doc.getRoot(); const scen = root.listScenes()[0];
  scen.addChild(doc.createNode(`till-${namn}`).setMesh(delarTillMesh(doc, `till-${namn}`, slaUt(delar))));
  for (const t of root.listTextures()) { if (hytt) t.setImage(new Uint8Array(await tona(Buffer.from(t.getImage()), hytt))); t.setURI(""); }
  await io.write(`${UT}/${namn}-kenney.glb`, doc);
}
// vita pixlar i Kenneys färgkarta (hytten) får en egen färg; fönster, däck och ljus är kvar
const hex3 = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
async function tona(png, farg) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); const [r, g, b] = hex3(farg);
  for (let i = 0; i < data.length; i += 4) { const mx = Math.max(data[i], data[i + 1], data[i + 2]), mn = Math.min(data[i], data[i + 1], data[i + 2]); if (mx < 200 || mx - mn > 25) continue; const k = mx / 255; data[i] = r * k; data[i + 1] = g * k; data[i + 2] = b * k; }
  return sharp(data, { raw: info }).png().toBuffer();
}
const KC = "/tmp/k18"; // K="<kenney_car-kit>/Models/GLB format" U=/tmp/k18 node MFIX3/kenney-inbadda.mjs truck-flat.glb (kör skripten från en mapp med @gltf-transform och sharp, t.ex. inkorgens _b5a-bygg)
// tankbil: röd hytt, lång silverfärgad tank med röda band och en stege
await kenneyPlus("tankbil", `${KC}/truck-flat.glb`, [["#E0E0E0", [...cylZ([0, 0.98, -0.55], 0.45, 1.35, 18), ...ellips([0, 0.98, 0.13], [0.45, 0.45, 0.14], 18, 6), ...ellips([0, 0.98, -1.23], [0.45, 0.45, 0.14], 18, 6)]], ["#C62828", [...cylZ([0, 0.98, -0.2], 0.465, 0.12, 18), ...cylZ([0, 0.98, -0.95], 0.465, 0.12, 18)]], ["#90A4AE", [...L([0, 0.55, -0.55], [0.55, 0.12, 1.35]), ...L([0, 1.45, -0.55], [0.18, 0.06, 0.25])]], ["#424242", [...L([0.47, 0.95, -1.15], [0.03, 0.6, 0.03]), ...L([0.47, 0.8, -1.05], [0.03, 0.03, 0.2]), ...L([0.47, 1.05, -1.05], [0.03, 0.03, 0.2])]]], "#D32F2F");
// betongbil: grå hytt, stor snedställd orange-vit randig trumma och en ränna bak
{ const trumma = []; const n = 16, nv = 10, rx = 0.5, rz = 0.8, cy = 1.05, cz = -0.6, lut = 0.25;
  const p = (i, j) => { const u = (i / n) * 2 * Math.PI, v = -Math.PI / 2 + (j / nv) * Math.PI; const z = rz * Math.sin(v), r = rx * Math.cos(v); return [r * Math.sin(u), cy + r * Math.cos(u) + z * Math.sin(lut), cz + z * Math.cos(lut)]; };
  const fa = [], fb = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < nv; j++) { const a = p(i, j), b = p(i + 1, j), c = p(i + 1, j + 1), d = p(i, j + 1); ((j >> 1) % 2 ? fb : fa).push([a, b, c], [a, c, d]); }
  await kenneyPlus("betongbil", `${KC}/truck-flat.glb`, [["#FF8F00", fa], ["#FAFAFA", fb], ["#616161", [...L([0, 0.6, -0.6], [0.6, 0.14, 1.25]), ...L([0, 0.75, -1.35], [0.2, 0.3, 0.3])]], ["#9E9E9E", ror([[0, 0.8, -1.45], [0, 0.55, -1.75]], [0.07, 0.07], 6)]], "#78909C"); }
// bärgningsbil: orange hytt, gult kranarmsflak som står högt över hytten, krok och varningsljus
await kenneyPlus("bargningsbil", `${KC}/truck-flat.glb`, [["#FDD835", [...L([0, 0.62, -0.6], [0.8, 0.12, 1.3]), ...ror([[0, 0.7, -0.4], [0, 1.85, -0.85]], [0.09, 0.09], 8), ...ror([[0, 1.85, -0.85], [0, 1.6, -1.55]], [0.07, 0.07], 8)]], ["#212121", [...L([0, 1.2, -1.58], [0.02, 0.75, 0.02]), ...ror([[0, 0.82, -1.58], [0, 0.72, -1.5], [0, 0.78, -1.42]], [0.025, 0.025, 0.025], 6)]], ["#FF6F00", [...L([0.2, 1.36, 0.3], [0.18, 0.1, 0.12]), ...L([-0.2, 1.36, 0.3], [0.18, 0.1, 0.12])]], ["#424242", L([0, 1.3, 0.3], [0.6, 0.04, 0.12])], ["#212121", [...L([0.4, 0.45, -1.25], [0.06, 0.5, 0.06]), ...L([-0.4, 0.45, -1.25], [0.06, 0.5, 0.06])]]], "#FB8C00");
console.log("klart");
