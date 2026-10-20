// R3F-M20: egna lågpolymodeller för köket (Trollpennan, CC0). +y upp, +z fram, står på y=0. Kör från en mapp med @gltf-transform och sharp.
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, unpartition, mergeDocuments } from "@gltf-transform/functions";
import sharp from "sharp";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const I = "/workspace/modell-inkorg";
const UT = process.env.UT ?? `${I}/trollpennan-kok-m20`;
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

// ---------- köket
// tekanna: rund turkos kanna med vitt lock, pip åt +x och handtag åt -x
await spara("tekanna", [["#26A69A", [...varv([[0, 0], [0.18, 0], [0.3, 0.1], [0.33, 0.22], [0.28, 0.36], [0.16, 0.42], [0, 0.42]], 20), ...ror([[0.26, 0.14], [0.42, 0.26], [0.5, 0.4]].map(([x, y]) => [x, y, 0]), [0.06, 0.045, 0.035], 8), ...halvRing([-0.3, 0.24, 0], 0.13, 0.025, "xy", Math.PI / 2, 1.5 * Math.PI)]], ["#FAFAFA", [...varv([[0, 0.41], [0.17, 0.41], [0.12, 0.46], [0, 0.47]], 18), ...E([0, 0.5, 0], [0.04, 0.04, 0.04], 8, 6), ...runt(0.315, 0.2, 8).flatMap((p) => E(p, [0.035, 0.035, 0.035], 6, 4))]]]);
// kaffekanna: hög röd emaljkanna (kokkaffe) med svart handtag, svart lock och pip
await spara("kaffekanna", [["#B71C1C", [...varv([[0, 0], [0.24, 0], [0.25, 0.04], [0.2, 0.45], [0.15, 0.55], [0, 0.55]], 20), ...ror([[0.17, 0.32, 0], [0.3, 0.45, 0], [0.34, 0.52, 0]], [0.05, 0.035, 0.03], 8)]], ["#212121", [...varv([[0, 0.54], [0.16, 0.54], [0.12, 0.6], [0, 0.61]], 18), ...E([0, 0.64, 0], [0.035, 0.035, 0.035], 8, 6), ...ror([[-0.2, 0.45, 0], [-0.33, 0.42, 0], [-0.33, 0.18, 0], [-0.23, 0.08, 0]], [0.03, 0.03, 0.03, 0.03], 6), ...varv([[0.245, 0.0], [0.255, 0.0], [0.255, 0.03], [0.245, 0.03]], 20)]], ["#FAFAFA", prickar([[0, 0.24, 0.235], [0.08, 0.3, 0.215], [-0.08, 0.3, 0.215], [0, 0.36, 0.205]], 0.025, "#FAFAFA")[0][1]]]);
// tekopp på fat, med te och handtag
await spara("tekopp", [["#F8BBD0", [...varv(skal(0.1, 0.17, 0.16, 0.015, 0.03), 20), ...ring([0.2, 0.12, 0], 0.05, 0.016, "xy")]], ["#FAFAFA", [...varv([[0, 0], [0.24, 0.0], [0.27, 0.035], [0.25, 0.04], [0, 0.03]], 22)]], ["#8D6E63", varv([[0, 0.17], [0.155, 0.17], [0, 0.171]], 18)], ["#E91E63", runt(0.135, 0.11, 6).flatMap((p) => E([p[0] * 1.05, p[1], p[2] * 1.05], [0.02, 0.02, 0.02], 6, 4))]]);
// termos: hög blå termos med silverkork och kopp som lock, randig
await spara("termos", [["#1E88E5", varv([[0, 0], [0.13, 0], [0.14, 0.02], [0.14, 0.62], [0.12, 0.66], [0, 0.66]], 18)], ["#B0BEC5", [...varv([[0, 0.65], [0.12, 0.65], [0.13, 0.67], [0.14, 0.78], [0.13, 0.8], [0, 0.8]], 18), ...varv([[0.142, 0.1], [0.145, 0.1], [0.145, 0.13], [0.142, 0.13]], 18)]], ["#FAFAFA", [0.3, 0.4, 0.5].flatMap((y) => varv([[0.141, y], [0.145, y], [0.145, y + 0.03], [0.141, y + 0.03]], 18))]]);
// slev: djup soppslev med lång böjd skaft
await spara("slev", [["#B0BEC5", [...varv([[0, 0], [0.08, 0.01], [0.13, 0.06], [0.14, 0.12], [0.12, 0.12], [0.11, 0.07], [0.07, 0.03], [0, 0.025]], 16), ...ror([[0.12, 0.12, 0], [0.2, 0.3, 0], [0.22, 0.65, 0], [0.18, 0.75, 0]], [0.02, 0.018, 0.018, 0.02], 6)]], ["#6D4C41", ror([[0.215, 0.5, 0], [0.22, 0.65, 0], [0.18, 0.76, 0]], [0.03, 0.03, 0.03], 8)]]);
// durkslag: skål med hål, fot och två handtag
{ const hal = []; for (const [r, y, n] of [[0.21, 0.08, 10], [0.24, 0.14, 12], [0.255, 0.2, 14]]) hal.push(...runt(r, y, n, 0.2).map(([x, yy, z]) => [x * 1.01, yy, z * 1.01]));
  await spara("durkslag", [["#90A4AE", [...varv([[0, 0.04], [0.15, 0.04], [0.22, 0.09], [0.26, 0.2], [0.27, 0.25], [0.25, 0.25], [0.24, 0.2], [0.2, 0.1], [0.14, 0.06], [0, 0.06]], 22), ...varv([[0.1, 0], [0.12, 0], [0.12, 0.05], [0.1, 0.05]], 18), ...halvRing([0.29, 0.22, 0], 0.05, 0.015, "xy", -Math.PI / 2, Math.PI / 2), ...halvRing([-0.29, 0.22, 0], 0.05, 0.015, "xy", Math.PI / 2, 1.5 * Math.PI)]], ["#37474F", hal.flatMap((p) => E(p, [0.018, 0.018, 0.018], 6, 4))]]); }
// ugnsvante: röd vante med tumme, vit mudd och upphängningsögla
await spara("ugnsvante", [["#D32F2F", [...E([0, 0.38, 0], [0.16, 0.24, 0.07], 14, 8), ...E([0, 0.22, 0], [0.15, 0.14, 0.07], 12, 6), ...ror([[0.12, 0.25, 0], [0.22, 0.34, 0], [0.24, 0.43, 0]], [0.055, 0.05, 0.045], 8)]], ["#FAFAFA", [...cyl([0, 0.0, 0], 0.165, 0.14, 14, "y")]], ["#FFCDD2", [...E([-0.035, 0.4, 0.06], [0.04, 0.04, 0.02], 8, 4), ...E([0.035, 0.4, 0.06], [0.04, 0.04, 0.02], 8, 4), ...L([0, 0.36, 0.06], [0.06, 0.06, 0.02])]], ["#FFC107", ring([0, 0.66, 0], 0.04, 0.01, "xy")]]);
// förkläde: grönt förkläde med vit ficka, band och hjärta (hänger på en krok)
await spara("forklade", [["#43A047", [...L([0, 0.55, 0], [0.32, 0.26, 0.03]), ...quad([-0.16, 0.42, 0.016], [0.16, 0.42, 0.016], [0.26, 0.0, 0.016], [-0.26, 0.0, 0.016]), ...quad([0.26, 0.0, -0.016], [0.16, 0.42, -0.016], [-0.16, 0.42, -0.016], [-0.26, 0.0, -0.016]), ...quad([0.16, 0.42, 0.016], [0.16, 0.42, -0.016], [0.26, 0, -0.016], [0.26, 0, 0.016]), ...quad([-0.26, 0, 0.016], [-0.26, 0, -0.016], [-0.16, 0.42, -0.016], [-0.16, 0.42, 0.016])]], ["#FAFAFA", [...L([0, 0.2, 0.02], [0.24, 0.12, 0.01]), ...ror([[-0.15, 0.67, 0], [-0.05, 0.82, 0], [0.05, 0.82, 0], [0.15, 0.67, 0]], [0.012, 0.012, 0.012, 0.012], 5), ...ror([[0.16, 0.42, 0], [0.33, 0.38, 0.04], [0.36, 0.25, 0.04]], [0.012, 0.012, 0.012], 5), ...ror([[-0.16, 0.42, 0], [-0.33, 0.38, 0.04], [-0.36, 0.25, 0.04]], [0.012, 0.012, 0.012], 5)]], ["#E53935", [...E([-0.025, 0.57, 0.02], [0.03, 0.03, 0.01], 6, 4), ...E([0.025, 0.57, 0.02], [0.03, 0.03, 0.01], 6, 4), ...L([0, 0.54, 0.02], [0.04, 0.04, 0.01])]]]);
// saltkar: vit strösslare med silverlock och hål
await spara("saltkar", [["#FAFAFA", varv([[0, 0], [0.1, 0], [0.12, 0.05], [0.11, 0.25], [0.09, 0.3], [0, 0.3]], 16)], ["#B0BEC5", varv([[0, 0.29], [0.095, 0.29], [0.1, 0.33], [0.08, 0.38], [0, 0.39]], 16)], ["#37474F", [[0, 0.395, 0], [0.035, 0.38, 0], [-0.035, 0.38, 0], [0, 0.38, 0.035], [0, 0.38, -0.035]].flatMap((p) => E(p, [0.012, 0.008, 0.012], 6, 4))], ["#1E88E5", L([0, 0.15, 0.113], [0.06, 0.07, 0.01])]]);
// pepparkvarn: hög svarvad trävarn med knopp
await spara("pepparkvarn", [["#8D6E63", varv([[0, 0], [0.11, 0], [0.12, 0.05], [0.09, 0.15], [0.085, 0.3], [0.11, 0.4], [0.11, 0.44], [0, 0.44]], 18)], ["#5D4037", [...varv([[0, 0.43], [0.1, 0.43], [0.08, 0.5], [0.05, 0.53], [0, 0.53]], 16), ...E([0, 0.56, 0], [0.03, 0.03, 0.03], 8, 6), ...varv([[0.122, 0.02], [0.125, 0.02], [0.125, 0.04], [0.122, 0.04]], 18)]]]);
// äggkopp med ägg
await spara("aggkopp", [["#FDD835", varv([[0, 0], [0.09, 0], [0.09, 0.02], [0.04, 0.05], [0.04, 0.09], [0.11, 0.15], [0.12, 0.2], [0.1, 0.2], [0, 0.12]], 18)], ["#FFF8E1", E([0, 0.25, 0], [0.09, 0.13, 0.09], 14, 10)], ["#E53935", runt(0.105, 0.17, 6).flatMap((p) => E([p[0] * 1.05, p[1], p[2] * 1.05], [0.015, 0.015, 0.015], 6, 4))]]);
// brödkorg: flätad oval korg med rutig duk och bröd
await spara("brodkorg", [["#C68B4E", [...varv(skal(0.25, 0.33, 0.16, 0.025), 22).map((t) => t.map(([x, y, z]) => [x * 1.3, y, z]))]], ["#8D5A2B", [0.05, 0.1].flatMap((y) => varv([[0.3, y], [0.33, y], [0.33, y + 0.015], [0.3, y + 0.015]], 22).map((t) => t.map(([x, yy, z]) => [x * 1.3 + Math.sign(x) * 0.002, yy, z])))], ["#E53935", [...L([0, 0.165, 0.2], [0.24, 0.02, 0.18])]], ["#FAFAFA", [...[-0.08, 0, 0.08].flatMap((x) => L([x, 0.168, 0.2], [0.03, 0.02, 0.18]))]], ["#D7A86E", [...E([-0.15, 0.2, -0.02], [0.14, 0.08, 0.08], 12, 6), ...E([0.12, 0.21, -0.05], [0.12, 0.09, 0.09], 12, 6), ...E([0.02, 0.24, 0.05], [0.09, 0.08, 0.09], 12, 6)]], ["#A1672A", [...[-0.2, -0.15, -0.1].flatMap((x) => L([x, 0.275, -0.02], [0.02, 0.01, 0.1]))]]]);
// kakburk: rund blå plåtburk med guldkant och kakor på locket
await spara("kakburk", [["#1565C0", [...varv([[0, 0], [0.24, 0], [0.24, 0.24], [0, 0.24]], 22), ...varv([[0, 0.25], [0.25, 0.25], [0.25, 0.3], [0, 0.3]], 22)]], ["#FFC107", [...varv([[0.242, 0.02], [0.245, 0.02], [0.245, 0.04], [0.242, 0.04]], 22), ...varv([[0.252, 0.255], [0.255, 0.255], [0.255, 0.27], [0.252, 0.27]], 22), ...E([0, 0.33, 0], [0.04, 0.04, 0.04], 8, 6)]], ["#D7A86E", [[0, 0.315, 0], [0.12, 0.31, 0.06], [-0.1, 0.31, 0.1], [0.02, 0.31, -0.13], [-0.13, 0.31, -0.06]].flatMap((p) => varv([[0, p[1]], [0.07, p[1]], [0.07, p[1] + 0.025], [0, p[1] + 0.03]], 12, [p[0], p[2]]))], ["#5D4037", [[0, 0.345, 0], [0.12, 0.34, 0.06], [-0.1, 0.34, 0.1], [0.02, 0.34, -0.13], [-0.13, 0.34, -0.06]].flatMap(([x, y, z]) => [[x + 0.025, y, z], [x - 0.02, y, z + 0.02], [x, y, z - 0.025]]).flatMap((p) => E(p, [0.012, 0.008, 0.012], 4, 3))]]);
// wok: svart vid stekpanna med långt trähandtag
await spara("wok", [["#37474F", varv([[0, 0.02], [0.12, 0.02], [0.24, 0.07], [0.34, 0.17], [0.33, 0.18], [0.23, 0.09], [0.11, 0.045], [0, 0.04]], 24)], ["#8D6E63", [...ror([[0.32, 0.16, 0], [0.48, 0.2, 0], [0.7, 0.24, 0]], [0.03, 0.035, 0.035], 8), ...ror([[-0.33, 0.17, 0], [-0.4, 0.2, 0]], [0.025, 0.025], 6)]], ["#212121", varv([[0, 0], [0.1, 0], [0.1, 0.025], [0, 0.025]], 16)]]);
// mortel med mortelstöt
await spara("mortel", [["#9E9E9E", varv(skal(0.15, 0.22, 0.2, 0.04, 0, 0.06), 20)], ["#757575", varv([[0.2, 0.0], [0.21, 0], [0.21, 0.03], [0.2, 0.03]], 20)], ["#BDBDBD", [...ror([[0.02, 0.08, 0], [0.12, 0.25, 0.02], [0.22, 0.42, 0.04]], [0.045, 0.035, 0.05], 10), ...E([0.23, 0.44, 0.04], [0.055, 0.055, 0.055], 10, 6)]], ["#689F38", [...E([-0.06, 0.13, 0.03], [0.04, 0.02, 0.06], 6, 4), ...E([0.04, 0.13, -0.05], [0.05, 0.02, 0.03], 6, 4)]]]);
// mjölkpaket: blåvitt paket med gavel och ko-fläckar
await spara("mjolkpaket", [["#FAFAFA", [...L([0, 0.22, 0], [0.2, 0.44, 0.2]), ...quad([-0.1, 0.44, 0.1], [0.1, 0.44, 0.1], [0.1, 0.54, 0], [-0.1, 0.54, 0]), ...quad([0.1, 0.44, -0.1], [-0.1, 0.44, -0.1], [-0.1, 0.54, 0], [0.1, 0.54, 0]), [[0.1, 0.44, 0.1], [0.1, 0.44, -0.1], [0.1, 0.54, 0]], [[-0.1, 0.44, -0.1], [-0.1, 0.44, 0.1], [-0.1, 0.54, 0]], ...L([0, 0.56, 0], [0.2, 0.05, 0.02])]], ["#1E88E5", [...L([0, 0.08, 0], [0.205, 0.16, 0.205]), ...L([0, 0.36, 0.101], [0.16, 0.05, 0.01])]], ["#212121", [...E([0.04, 0.24, 0.101], [0.035, 0.025, 0.006], 8, 4), ...E([-0.05, 0.28, 0.101], [0.025, 0.02, 0.006], 8, 4), ...E([0.101, 0.25, 0.03], [0.006, 0.03, 0.035], 4, 8)]]]);
// fruktskål med äpplen, apelsin, banan och druvor
await spara("fruktskal", [["#FFF3E0", varv([[0, 0], [0.1, 0], [0.1, 0.03], [0.26, 0.15], [0.3, 0.2], [0.28, 0.2], [0.24, 0.16], [0, 0.06]], 22)], ["#E53935", [...E([-0.1, 0.19, 0.05], [0.08, 0.075, 0.08], 10, 8), ...E([0.08, 0.22, 0.09], [0.075, 0.07, 0.075], 10, 8)]], ["#FB8C00", E([0.05, 0.2, -0.1], [0.085, 0.085, 0.085], 10, 8)], ["#FDD835", ror([[-0.18, 0.24, -0.05], [-0.06, 0.28, -0.09], [0.06, 0.29, -0.04], [0.14, 0.3, 0.02]], [0.03, 0.04, 0.04, 0.025], 8)], ["#7B1FA2", [[0.0, 0.26, 0.0], [0.04, 0.27, 0.02], [-0.03, 0.27, 0.03], [0.01, 0.3, 0.02], [0.0, 0.24, 0.05]].flatMap((p) => E(p, [0.028, 0.028, 0.028], 6, 4))], ["#5D4037", [...ror([[-0.1, 0.26, 0.05], [-0.1, 0.29, 0.05]], [0.008, 0.008], 4)]], ["#43A047", E([-0.08, 0.28, 0.06], [0.025, 0.006, 0.015], 6, 3)]]);
// tårtfat på fot med en tårta och jordgubbar
await spara("tartfat", [["#E0E0E0", [...varv([[0, 0], [0.16, 0], [0.16, 0.02], [0.04, 0.05], [0.035, 0.22], [0.3, 0.24], [0.31, 0.26], [0, 0.26]], 22)]], ["#FFF8E1", varv([[0, 0.26], [0.23, 0.26], [0.23, 0.44], [0, 0.44]], 22)], ["#F48FB1", [...varv([[0.231, 0.33], [0.235, 0.33], [0.235, 0.36], [0.231, 0.36]], 22), ...varv([[0, 0.44], [0.235, 0.44], [0.235, 0.455], [0, 0.46]], 22)]], ["#E53935", runt(0.16, 0.48, 7).flatMap((p) => E(p, [0.035, 0.04, 0.035], 8, 6))], ["#43A047", runt(0.16, 0.52, 7).flatMap((p) => E(p, [0.025, 0.008, 0.025], 6, 3))]]);
// sockerskål med lock, två handtag och sockerbitar bredvid
await spara("sockerskal", [["#FAFAFA", [...varv([[0, 0], [0.1, 0], [0.1, 0.02], [0.17, 0.08], [0.18, 0.16], [0, 0.16]], 18), ...halvRing([0.19, 0.11, 0], 0.04, 0.013, "xy", -Math.PI / 2, Math.PI / 2), ...halvRing([-0.19, 0.11, 0], 0.04, 0.013, "xy", Math.PI / 2, 1.5 * Math.PI)]], ["#1E88E5", [...varv([[0, 0.16], [0.185, 0.16], [0.15, 0.2], [0, 0.21]], 18), ...E([0, 0.23, 0], [0.03, 0.03, 0.03], 8, 6), ...runt(0.172, 0.1, 10).flatMap((p) => E([p[0] * 1.03, p[1], p[2] * 1.03], [0.018, 0.018, 0.018], 6, 4))]], ["#FFFFFF", [...L([0.27, 0.025, 0.12], [0.05, 0.05, 0.05]), ...L([0.33, 0.025, 0.08], [0.05, 0.05, 0.05]), ...L([0.3, 0.075, 0.1], [0.05, 0.05, 0.05])]]]);
// pizzaskärare: stort hjul på röd hållare
await spara("pizzaskarare", [["#CFD8DC", cylX([0, 0.2, 0], 0.2, 0.025, 24)], ["#455A64", cylX([0, 0.2, 0], 0.05, 0.06, 12)], ["#E53935", [...L([0, 0.32, -0.12], [0.07, 0.07, 0.3]), ...ror([[0, 0.38, -0.25], [0, 0.48, -0.42], [0, 0.55, -0.6]], [0.05, 0.05, 0.045], 10)]], ["#9E9E9E", [...L([0.04, 0.27, -0.03], [0.015, 0.14, 0.1]), ...L([-0.04, 0.27, -0.03], [0.015, 0.14, 0.1])]]]);
// glasskål: glasskål på fot med tre glasskulor, grädde, körsbär och rån
await spara("glasskal", [["#B3E5FC", varv([[0, 0], [0.12, 0], [0.12, 0.02], [0.03, 0.04], [0.03, 0.12], [0.2, 0.16], [0.24, 0.24], [0.22, 0.24], [0, 0.17]], 20)], ["#F8BBD0", E([-0.08, 0.27, 0.03], [0.1, 0.09, 0.1], 12, 8)], ["#FFF3E0", E([0.09, 0.27, 0.02], [0.1, 0.09, 0.1], 12, 8)], ["#6D4C41", E([0, 0.28, -0.08], [0.1, 0.09, 0.1], 12, 8)], ["#FAFAFA", varv([[0, 0.33], [0.08, 0.33], [0.05, 0.38], [0.02, 0.42], [0, 0.43]], 12, [0, 0])], ["#D32F2F", E([0, 0.46, 0], [0.035, 0.035, 0.035], 8, 6)], ["#5D4037", ror([[0, 0.48, 0], [0.03, 0.54, -0.02]], [0.006, 0.006], 4)], ["#E0B36A", L([0.12, 0.37, -0.05], [0.04, 0.16, 0.08])]]);
// äggklocka: äggformad köksklocka med ratt och siffror
await spara("aggklocka", [["#FFF8E1", E([0, 0.2, 0], [0.15, 0.2, 0.15], 16, 10)], ["#FB8C00", [...varv([[0.149, 0.17], [0.16, 0.17], [0.16, 0.22], [0.149, 0.22]], 20)]], ["#212121", [...runt(0.162, 0.195, 12).flatMap((p) => E(p, [0.008, 0.012, 0.008], 4, 3)), ...L([0, 0.26, 0.145], [0.012, 0.05, 0.01])]], ["#E53935", [...E([0, 0.37, 0], [0.04, 0.035, 0.04], 8, 6)]], ["#B0BEC5", varv([[0, 0], [0.09, 0], [0.09, 0.02], [0, 0.02]], 16)]]);
console.log("klart");
