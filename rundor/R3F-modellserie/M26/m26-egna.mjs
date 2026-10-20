// R3F-M26: egna lågpolymodeller för mat och fika samt byggnader (barnord utan modell) (Trollpennan, CC0). +y upp, +z fram, står på y=0. Kör från en mapp med @gltf-transform och sharp.
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, unpartition, mergeDocuments } from "@gltf-transform/functions";
import sharp from "sharp";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const I = "/workspace/modell-inkorg";
const UT = process.env.UT ?? `${I}/trollpennan-mat-hus-m26`;
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
const flytta = (t, [dx, dy, dz]) => t.map((tri) => tri.map(([x, y, z]) => [x + dx, y + dy, z + dz]));
const skala = (t, [sx, sy, sz], [cx, cy, cz] = [0, 0, 0]) => t.map((tri) => tri.map(([x, y, z]) => [cx + (x - cx) * sx, cy + (y - cy) * sy, cz + (z - cz) * sz]));
const rotX = (t, a) => t.map((tri) => tri.map(([x, y, z]) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)]));
const rotY = (t, a) => t.map((tri) => tri.map(([x, y, z]) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)]));
const rotZ = (t, a) => t.map((tri) => tri.map(([x, y, z]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z]));
const par = (fn) => [...fn(0.1, 1), ...fn(-0.1, -1)];
const box = (c, s, rz = 0, ry = 0) => flytta(rotY(rotZ(L([0, 0, 0], s), rz), ry), c);
const torus = (R, r, n = 22, m = 10) => varv(Array.from({ length: m + 1 }, (_, k) => { const t = (k / m) * 2 * Math.PI; return [R + r * Math.cos(t), r * Math.sin(t)]; }), n);
const tallrik = (r = 0.3, f = vit) => [f, varv([[0, 0], [r * 0.6, 0], [r, 0.04], [r - 0.02, 0.045], [r * 0.6, 0.015], [0, 0.015]], 22)];
const glas = (r, h, f = "#E1F5FE") => [f, varv(skal(r * 0.85, r, h, 0.012), 16)];
const dryck = (r, h, f) => [f, varv([[0, 0.012], [r * 0.85 - 0.012, 0.012], [r - 0.014, h], [0, h]], 16)];
const brod = "#E0A050", ljusbrod = "#F3C77A";
// tak: sadeltak längs x över en låda (b bred, d djup), y0 = takfot, h = höjd
const sadeltak = (b, d, y0, h, f) => [f, [...quad([-b / 2, y0, d / 2], [b / 2, y0, d / 2], [b / 2, y0 + h, 0], [-b / 2, y0 + h, 0]), ...quad([b / 2, y0, -d / 2], [-b / 2, y0, -d / 2], [-b / 2, y0 + h, 0], [b / 2, y0 + h, 0]), [[b / 2, y0, d / 2], [b / 2, y0, -d / 2], [b / 2, y0 + h, 0]], [[-b / 2, y0, -d / 2], [-b / 2, y0, d / 2], [-b / 2, y0 + h, 0]]]];
const fonster = (xs, ys, z, f = "#81D4FA", w = 0.14, h = 0.16) => [f, xs.flatMap((x) => ys.map((y) => L([x, y, z], [w, h, 0.01])))];

// ---------- mat och fika
// bulle: vetebulle med pärlsocker
await spara("bulle", [[brod, E([0, 0, 0], [0.2, 0.14, 0.2], 14, 8, 0)], [vit, Array.from({ length: 14 }, (_, i) => { const a = i * 2.4, r = 0.03 + (i % 5) * 0.03; const y = 0.14 * Math.sqrt(Math.max(0, 1 - (r / 0.2) ** 2)); return E([r * Math.cos(a), y, r * Math.sin(a)], [0.012, 0.01, 0.012], 4, 3); })], ["#C07A30", ror(Array.from({ length: 12 }, (_, i) => { const a = i * 0.55, r = 0.02 + i * 0.012; return [r * Math.cos(a), 0.14 * Math.sqrt(Math.max(0, 1 - (r / 0.2) ** 2)) + 0.003, r * Math.sin(a)]; }), Array(12).fill(0.008), 4)]]);
// glasspinne: rosa och vit isglass på pinne med ett bett
await spara("glasspinne", [["#F48FB1", [...L([0, 0.3, 0], [0.16, 0.24, 0.07]), ...E([0, 0.42, 0], [0.08, 0.04, 0.035], 10, 4).filter((tri) => tri.some((p) => p[1] > 0.42))].filter((tri) => !tri.every((p) => p[0] > 0.04 && p[1] > 0.38))], [vit, L([0, 0.21, 0], [0.165, 0.06, 0.075])], ["#8D6E63", [...L([0, 0.09, 0], [0.04, 0.2, 0.012])]], ["#FDD835", [[0.03, 0.34], [-0.04, 0.28], [0.05, 0.25]].flatMap(([x, y]) => E([x, y, 0.036], [0.012, 0.006, 0.004], 4, 2))]]);
// gurka: grön gurka med knottror och en skiva
await spara("gurka", [["#2E7D32", skala(E([0, 0.07, 0], [0.32, 0.07, 0.07], 14, 8), [1, 1, 1])], ["#66BB6A", Array.from({ length: 12 }, (_, i) => E([-0.26 + i * 0.047, 0.07 + 0.06 * Math.sin(i * 1.7), 0.06 * Math.cos(i * 1.7) + 0.0], [0.008, 0.008, 0.008], 4, 3))], ["#C5E1A5", flytta(cylZ([0, 0, 0], 0.07, 0.02, 14), [0.42, 0.07, 0.05])], ["#F1F8E9", flytta(cylZ([0, 0, 0.011], 0.04, 0.004, 10), [0.42, 0.07, 0.05])], ["#2E7D32", flytta(rotX(torus(0.068, 0.006, 14, 4), Math.PI / 2), [0.42, 0.07, 0.05])]]);
// juice: apelsinjuice i paket och ett glas, med en apelsinhalva
await spara("juice", [["#FB8C00", [...L([0.08, 0.2, 0], [0.18, 0.4, 0.14]), ...sadeltak(0.18, 0.14, 0.4, 0.06, "#FB8C00")[1]]], [vit, [...L([0.08, 0.15, 0.071], [0.14, 0.12, 0.004])]], ["#FFA726", E([0.08, 0.15, 0.075], [0.04, 0.04, 0.006], 8, 3)], glas(0.07, 0.2), dryck(0.07, 0.17, "#FFB74D")].map(([f, t], i) => [f, i >= 3 ? flytta(t, [-0.15, 0, 0.06]) : t]).concat([["#FB8C00", E([-0.02, 0.0, 0.18], [0.06, 0.05, 0.06], 8, 4, 0)], ["#FFE0B2", cyl([-0.02, 0.0, 0.18], 0.055, 0.004, 10)]]));
// korvbröd: varmkorv i bröd med senap och ketchup
await spara("korvbrod", [[ljusbrod, [...E([0, 0.06, 0.04], [0.26, 0.07, 0.05], 12, 6, 0), ...E([0, 0.06, -0.04], [0.26, 0.07, 0.05], 12, 6, 0)]], ["#C62828", [...skala(E([0, 0.1, 0], [0.31, 0.04, 0.04], 12, 6), [1, 1, 1])]], ["#FDD835", ror(Array.from({ length: 9 }, (_, i) => [-0.24 + i * 0.06, 0.142, 0.015 * Math.sin(i * 1.8)]), Array(9).fill(0.01), 4)], ["#E53935", ror(Array.from({ length: 9 }, (_, i) => [-0.22 + i * 0.055, 0.135, 0.02 * Math.cos(i * 1.8) + 0.015]), Array(9).fill(0.009), 4)]]);
// lakrits: lakritssnäckor och lakritsrör
await spara("lakrits", [[sv, [...[[-0.1, 0], [0.12, 0.02]].flatMap(([x, z]) => flytta(rotX(ror(Array.from({ length: 22 }, (_, i) => { const a = i * 0.6, r = 0.015 + i * 0.0045; return [r * Math.cos(a), r * Math.sin(a), 0]; }), Array(22).fill(0.014), 5), 0), [x, 0.13, z])), ...cylX([0, 0.03, 0.14], 0.03, 0.4, 8)]], ["#E91E63", [...E([-0.1, 0.13, 0.016], [0.02, 0.02, 0.01], 6, 3), ...E([0.12, 0.13, 0.036], [0.02, 0.02, 0.01], 6, 3)]], ["#424242", [...cylX([0.03, 0.03, 0.08], 0.03, 0.36, 8)]]]);
// pannkaka: hög med pannkakor, sylt och grädde
await spara("pannkaka", [tallrik(0.3), ["#F6C86B", [0, 1, 2, 3, 4].flatMap((i) => varv([[0, 0.02 + i * 0.03], [0.21, 0.02 + i * 0.03], [0.22, 0.035 + i * 0.03], [0.21, 0.05 + i * 0.03], [0, 0.05 + i * 0.03]], 18))], ["#E0A050", [0, 1, 2, 3, 4].flatMap((i) => varv([[0.218, 0.032 + i * 0.03], [0.222, 0.032 + i * 0.03], [0.222, 0.038 + i * 0.03], [0.218, 0.038 + i * 0.03]], 18))], ["#C62828", E([0, 0.17, 0], [0.12, 0.025, 0.12], 10, 4, 0)], [vit, [...E([0.02, 0.19, 0.02], [0.06, 0.05, 0.06], 8, 5, 0), ...E([0.02, 0.24, 0.02], [0.02, 0.03, 0.02], 6, 3)]]]);
// pasta: skål med penne och tomatsås och basilika
await spara("pasta", [["#FAFAFA", varv(skal(0.16, 0.28, 0.14, 0.015), 20)], ["#FFE082", Array.from({ length: 20 }, (_, i) => { const a = i * 2.4, r = 0.04 + (i % 4) * 0.05; return box([r * Math.cos(a), 0.14 + (i % 3) * 0.02 - r * 0.1, r * Math.sin(a)], [0.09, 0.03, 0.03], (i % 5) * 0.3, a); }).flat()], ["#D84315", E([0, 0.15, 0], [0.12, 0.04, 0.12], 10, 4)], ["#43A047", [...E([0.03, 0.19, 0.04], [0.04, 0.008, 0.025], 6, 3), ...E([-0.03, 0.19, 0.03], [0.035, 0.008, 0.02], 6, 3)]]]);
// popcorn: randig popcornbägare full med popcorn
{ const st = [], st2 = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * 2 * Math.PI, b = ((i + 1) / 12) * 2 * Math.PI; (i % 2 ? st : st2).push(...quad([0.12 * Math.cos(a), 0, 0.12 * Math.sin(a)], [0.12 * Math.cos(b), 0, 0.12 * Math.sin(b)], [0.17 * Math.cos(b), 0.3, 0.17 * Math.sin(b)], [0.17 * Math.cos(a), 0.3, 0.17 * Math.sin(a)]).map(([p, q, r]) => [p, r, q])); }
  await spara("popcorn", [["#E53935", st], [vit, [...st2, ...cyl([0, 0, 0], 0.12, 0.005, 12)]], ["#FFF8E1", Array.from({ length: 26 }, (_, i) => { const a = i * 2.4, r = 0.02 + (i % 6) * 0.028; return E([r * Math.cos(a), 0.3 + (0.17 - r) * 0.4 + (i % 3) * 0.02, r * Math.sin(a)], [0.035, 0.03, 0.035], 6, 4); })], ["#FFD54F", [[0.05, 0.38, 0.05], [-0.06, 0.36, 0.08]].flatMap((p) => E(p, [0.02, 0.015, 0.02], 5, 3))]]); }
// saft: flaska med röd saft och ett glas
await spara("saft", [["#E1F5FE", varv([[0, 0], [0.08, 0], [0.085, 0.02], [0.085, 0.24], [0.04, 0.32], [0.03, 0.38], [0, 0.38]], 16)], ["#C62828", varv([[0, 0.012], [0.072, 0.012], [0.077, 0.03], [0.077, 0.22], [0, 0.22]], 16)], [vit, cyl([0, 0.37, 0], 0.033, 0.04, 10)], ["#FDD835", L([0, 0.13, 0.082], [0.08, 0.06, 0.004])], ...[glas(0.06, 0.16), dryck(0.06, 0.13, "#E57373")].map(([f, t]) => [f, flytta(t, [0.17, 0, 0.06])])]);
// smör: smörpaket på ett fat med en smörkniv
await spara("smor", [[vit, varv([[0, 0], [0.18, 0], [0.22, 0.03], [0.2, 0.035], [0, 0.015]], 18)], ["#FFF176", [...L([0, 0.07, 0], [0.22, 0.1, 0.12]), ...E([0.06, 0.12, 0.02], [0.04, 0.015, 0.03], 6, 3)]], ["#FDD835", [...L([-0.04, 0.07, 0.0], [0.14, 0.104, 0.124])]], [sv, L([-0.04, 0.07, 0.063], [0.08, 0.03, 0.004])], ["#B0BEC5", [...box([0.08, 0.13, 0.05], [0.18, 0.008, 0.03], 0.2, 0.5)]]]);
// spagetti: tallrik med spagetti och tomatsås
await spara("spagetti", [tallrik(0.3), ["#FFE082", [...Array.from({ length: 10 }, (_, k) => ror(Array.from({ length: 10 }, (_, i) => { const a = i * 0.9 + k * 1.3, r = 0.04 + ((i + k) % 5) * 0.035; return [r * Math.cos(a), 0.03 + (0.2 - r) * 0.4 + (i % 2) * 0.01, r * Math.sin(a)]; }), Array(10).fill(0.01), 4)).flat()]], ["#D84315", E([0, 0.09, 0], [0.09, 0.03, 0.09], 10, 4)], ["#43A047", E([0.02, 0.12, 0.02], [0.03, 0.006, 0.02], 6, 3)], ["#FFF8E1", [[0.03, 0.12, -0.02], [-0.02, 0.12, 0.03], [0.0, 0.125, 0.0]].flatMap((p) => E(p, [0.012, 0.006, 0.012], 4, 3))]]);
// sylt: syltburk med rutigt lock och sked
await spara("sylt", [["#E1F5FE", varv([[0, 0], [0.11, 0], [0.12, 0.02], [0.12, 0.2], [0.1, 0.24], [0, 0.24]], 16)], ["#AD1457", varv([[0, 0.01], [0.11, 0.01], [0.112, 0.02], [0.112, 0.2], [0, 0.2]], 16)], ["#E53935", [...varv([[0, 0.24], [0.11, 0.24], [0.13, 0.27], [0, 0.28]], 16)]], [vit, [...[-0.06, 0, 0.06].flatMap((x) => L([x, 0.275, 0], [0.025, 0.006, 0.2])), ...[-0.06, 0, 0.06].flatMap((z) => L([0, 0.276, z], [0.2, 0.006, 0.025])), ...L([0, 0.12, 0.122], [0.1, 0.07, 0.004])]], ["#B0BEC5", [...flytta(rotZ(cyl([0, 0, 0], 0.008, 0.22, 4), -0.3), [-0.16, 0.0, 0.08]), ...E([-0.165, 0.03, 0.08], [0.025, 0.012, 0.035], 6, 3)]]]);
// semla: semla med mandelmassa, grädde, lock och florsocker
await spara("semla", [[brod, E([0, 0, 0], [0.18, 0.12, 0.18], 14, 8, 0)], [vit, E([0, 0.1, 0], [0.17, 0.1, 0.17], 14, 6, 0)], [brod, flytta(rotX(E([0, 0, 0], [0.13, 0.04, 0.13], 12, 6), -0.3), [0, 0.22, 0.02])], ["#FAFAFA", flytta(rotX(E([0, 0.01, 0], [0.12, 0.035, 0.12], 12, 6), -0.3), [0, 0.225, 0.02]).filter((tri) => tri.every((p) => p[1] > 0.23))], ["#C8A165", E([0, 0.1, 0.12], [0.08, 0.025, 0.04], 8, 3)]]);
// lussekatt: S-formad saffransbulle med russin
// (står upp: S-formen i xy-planet så att den syns framifrån, på ett litet fat)
await spara("lussekatt", [tallrik(0.26), ...[["#FFB300", [...ror(Array.from({ length: 26 }, (_, i) => { const t = (i / 25) * 2 - 1, a = t * Math.PI * 1.1; return [t * 0.2, 0.05, 0.11 * Math.sin(a) * (1 - 0.3 * Math.abs(t))]; }), Array(26).fill(0.045), 8), ...ror(Array.from({ length: 10 }, (_, i) => { const a = (i / 9) * Math.PI * 1.4; return [0.2 + 0.06 * Math.sin(a), 0.05, 0.07 * Math.cos(a) - 0.0]; }), Array(10).fill(0.04), 8), ...ror(Array.from({ length: 10 }, (_, i) => { const a = (i / 9) * Math.PI * 1.4; return [-0.2 - 0.06 * Math.sin(a), 0.05, -0.07 * Math.cos(a)]; }), Array(10).fill(0.04), 8)]], [sv, [[0.22, 0.09, 0.03], [-0.22, 0.09, -0.03]].flatMap((p) => E(p, [0.018, 0.015, 0.018], 6, 3))]].map(([f, t]) => [f, platta(t).map((tri) => tri.map(([x, y, z]) => [x, 0.17 - z * 1.0, (y - 0.05) + 0.0]))])]);
// köttbullar: tallrik med köttbullar, potatismos och lingon
await spara("kottbullar", [tallrik(0.3), ["#795548", Array.from({ length: 7 }, (_, i) => { const a = i * 0.9; return E([0.1 + 0.07 * Math.cos(a), 0.06, 0.07 * Math.sin(a)], [0.045, 0.04, 0.045], 8, 5); })], ["#FFF8E1", E([-0.1, 0.02, -0.03], [0.1, 0.07, 0.09], 10, 5, 0)], ["#C62828", Array.from({ length: 8 }, (_, i) => E([-0.08 + (i % 4) * 0.025, 0.03, 0.12 + Math.floor(i / 4) * 0.025], [0.014, 0.014, 0.014], 4, 3))], ["#43A047", E([-0.12, 0.08, -0.03], [0.02, 0.006, 0.015], 4, 3)]]);
// persika: persika med blad
await spara("persika", [["#FFAB91", E([0, 0.15, 0], [0.15, 0.15, 0.15], 14, 10)], ["#FF7043", E([0.03, 0.15, 0.1], [0.1, 0.11, 0.06], 10, 6)], ["#5D4037", cyl([0, 0.29, 0], 0.012, 0.04, 5)], ["#43A047", flytta(rotZ(E([0, 0, 0], [0.07, 0.01, 0.035], 8, 3), 0.4), [0.06, 0.33, 0])]]);
// kakao: mugg med varm kakao, grädde och marshmallows
await spara("kakao", [["#1E88E5", [...varv(skal(0.1, 0.11, 0.24, 0.015), 18), ...halvRing([0.13, 0.13, 0], 0.06, 0.018, "xy", -Math.PI / 2, Math.PI / 2)]], ["#6D4C41", varv([[0, 0.2], [0.1, 0.2], [0, 0.201]], 16)], [vit, [...E([0, 0.22, 0], [0.08, 0.05, 0.08], 10, 5, 0), ...[[0.06, 0.24, 0.04], [-0.05, 0.23, 0.05]].flatMap((p) => L(p, [0.03, 0.03, 0.03]))]], ["#F48FB1", L([0.0, 0.26, -0.04], [0.03, 0.03, 0.03])], ["#FAFAFA", [0, 1].flatMap((k) => ror([[0.0 + k * 0.04, 0.3, 0], [0.02 + k * 0.04, 0.38, 0], [0.0 + k * 0.04, 0.45, 0]], [0.012, 0.01, 0.006], 4))]]);
// risboll: risboll (onigiri) med sjögräs
await spara("risboll", [[vit, skala(E([0, 0.13, 0], [0.15, 0.14, 0.07], 3, 6), [1, 1, 1]).map((tri) => tri.map(([x, y, z]) => [x * (1 - (y / 0.27) * 0.5), Math.max(y, 0), z]))], ["#1B5E20", L([0, 0.06, 0], [0.16, 0.12, 0.15])], [sv, [...E([0.04, 0.16, 0.06], [0.012, 0.012, 0.01], 4, 3), ...E([-0.04, 0.16, 0.06], [0.012, 0.012, 0.01], 4, 3)]], ["#F48FB1", [...E([0.07, 0.13, 0.055], [0.02, 0.012, 0.01], 4, 3), ...E([-0.07, 0.13, 0.055], [0.02, 0.012, 0.01], 4, 3)]]]);
// smoothie: rosa smoothie i glas med sugrör och jordgubbe
await spara("smoothie", [glas(0.08, 0.26), dryck(0.08, 0.23, "#F06292"), [vit, E([0, 0.24, 0], [0.07, 0.03, 0.07], 10, 4)], ["#4FC3F7", ror([[0.02, 0.1, 0], [0.04, 0.4, 0], [0.09, 0.45, 0]], [0.01, 0.01, 0.01], 6)], ["#E53935", E([-0.06, 0.27, 0.03], [0.03, 0.035, 0.03], 8, 5)], ["#43A047", E([-0.06, 0.305, 0.03], [0.02, 0.008, 0.02], 6, 3)]]);
// ---------- byggnader
// skola: röd skola med klocka, flaggstång och trappa
await spara("skola", [["#E53935", L([0, 0.45, 0], [1.6, 0.9, 0.7])], sadeltak(1.7, 0.8, 0.9, 0.35, "#455A64"), fonster([-0.6, -0.3, 0.3, 0.6], [0.3, 0.65], 0.352), [vit, [...[-0.6, -0.3, 0.3, 0.6].flatMap((x) => [0.3, 0.65].flatMap((y) => [L([x, y, 0.356], [0.16, 0.012, 0.01]), L([x, y, 0.356], [0.012, 0.18, 0.01])])), ...flytta(cylZ([0, 0, 0], 0.12, 0.03, 16), [0, 1.0, 0.36]), ...L([0, 0.04, 0.42], [0.4, 0.08, 0.16])]], ["#5D4037", L([0, 0.2, 0.352], [0.22, 0.4, 0.01])], [sv, [...box([0, 1.03, 0.38], [0.012, 0.08, 0.006]), ...box([0.03, 1.0, 0.38], [0.06, 0.012, 0.006])]], [vit, [...cyl([0.95, 0, 0.3], 0.015, 1.4, 6)]], ["#1565C0", L([1.08, 1.27, 0.3], [0.24, 0.15, 0.008])], ["#FDD835", [...L([1.05, 1.27, 0.301], [0.03, 0.15, 0.01]), ...L([1.08, 1.27, 0.301], [0.24, 0.03, 0.01])]]]);
// sjukhus: vitt sjukhus med blått H, ambulansport och många fönster
await spara("sjukhus", [[vit, [...L([0, 0.7, 0], [1.4, 1.4, 0.7]), ...L([0, 1.45, 0], [0.5, 0.1, 0.5])]], fonster([-0.5, -0.25, 0.25, 0.5], [0.45, 0.8, 1.15], 0.352, "#4FC3F7", 0.15, 0.18), ["#1E88E5", [...L([-0.05, 1.27, 0.352], [0.04, 0.2, 0.01]), ...L([0.05, 1.27, 0.352], [0.04, 0.2, 0.01]), ...L([0, 1.27, 0.352], [0.1, 0.04, 0.01]), ...L([0, 0.2, 0.4], [0.5, 0.04, 0.12])]], ["#90A4AE", [...L([0, 0.15, 0.354], [0.36, 0.3, 0.01])]], ["#E53935", [...L([0, 1.51, 0], [0.3, 0.02, 0.3])]]]);
// bibliotek: bibliotek med pelare, trappa och stora böcker på fasaden
await spara("bibliotek", [["#FFE0B2", L([0, 0.45, 0], [1.4, 0.8, 0.7])], ["#BCAAA4", [...L([0, 0.04, 0.42], [1.2, 0.08, 0.2]), ...L([0, 0.9, 0.05], [1.5, 0.1, 0.8])]], [vit, [-0.45, -0.15, 0.15, 0.45].flatMap((x) => cyl([x, 0.08, 0.42], 0.05, 0.77, 10))], sadeltak(1.5, 0.8, 0.95, 0.25, "#8D6E63"), ...["#E53935", "#1E88E5", "#43A047", "#FDD835", "#8E24AA"].map((f, i) => [f, L([-0.24 + i * 0.12, 0.4, 0.352], [0.09, 0.36 + (i % 2) * 0.06, 0.01])]), ["#5D4037", L([0, 0.6, 0.353], [0.6, 0.02, 0.01])]]);
// biograf: biograf med lampor, skylt och filmrulle
await spara("biograf", [["#3949AB", L([0, 0.6, 0], [1.3, 1.2, 0.7])], ["#E53935", [...L([0, 0.9, 0.4], [1.1, 0.3, 0.1]), ...L([0, 0.25, 0.352], [0.5, 0.5, 0.01])]], ["#FFF59D", [...Array.from({ length: 12 }, (_, i) => E([-0.5 + i * 0.09, 1.06, 0.45], [0.025, 0.025, 0.025], 6, 3)).flat(), ...Array.from({ length: 12 }, (_, i) => E([-0.5 + i * 0.09, 0.74, 0.45], [0.025, 0.025, 0.025], 6, 3)).flat()]], [vit, [...L([0, 0.9, 0.452], [0.9, 0.16, 0.01])]], [sv, [...flytta(cylZ([0, 0, 0], 0.16, 0.04, 16), [0, 1.38, 0.2]), ...L([0, 1.24, 0.2], [0.05, 0.1, 0.05]), ...[-0.25, -0.1, 0.05, 0.2].map((x) => L([x, 0.9, 0.46], [0.08, 0.08, 0.01])).flat()]], [vit, [0, 1, 2, 3, 4].flatMap((k) => { const a = (k / 5) * 2 * Math.PI; return flytta(cylZ([0, 0, 0.022], 0.035, 0.01, 8), [0.09 * Math.cos(a), 1.38 + 0.09 * Math.sin(a), 0.2]); })], fonster([-0.45, 0.45], [0.3], 0.352, "#FDD835", 0.18, 0.24)]);
// borg: medeltida borg av sten med fyra torn, mur, port och vindbrygga
{ const sten = "#9E9E9E", m = "#757575", krenel = (cx, cz, r, y) => Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * 2 * Math.PI; return L([cx + r * Math.cos(a), y, cz + r * Math.sin(a)], [0.07, 0.08, 0.07]); }).flat();
  const torn = [[0.6, 0.35], [-0.6, 0.35], [0.6, -0.35], [-0.6, -0.35]];
  await spara("borg", [[sten, [...L([0, 0.3, 0.35], [1.2, 0.6, 0.12]), ...L([0, 0.3, -0.35], [1.2, 0.6, 0.12]), ...L([0.6, 0.3, 0], [0.12, 0.6, 0.7]), ...L([-0.6, 0.3, 0], [0.12, 0.6, 0.7]), ...torn.flatMap(([x, z]) => cyl([x, 0, z], 0.16, 0.95, 12)), ...L([0, 0.55, -0.05], [0.5, 1.1, 0.4])]], [m, [...Array.from({ length: 8 }, (_, i) => L([-0.5 + i * 0.14, 0.64, 0.35], [0.08, 0.08, 0.13])).flat(), ...torn.flatMap(([x, z]) => krenel(x, z, 0.15, 0.99)), ...Array.from({ length: 4 }, (_, i) => L([-0.18 + i * 0.12, 1.14, 0.15], [0.07, 0.08, 0.07])).flat()]], ["#5D4037", [...L([0, 0.18, 0.415], [0.26, 0.36, 0.01]), ...flytta(rotX(L([0, 0, 0.18], [0.26, 0.03, 0.36]), 0), [0, 0.015, 0.42])]], [sv, [...fonster([-0.12, 0.12], [0.85], 0.153, sv, 0.06, 0.12)[1], ...torn.filter(([, z]) => z > 0).map(([x, z]) => L([x, 0.7, z + 0.16], [0.04, 0.12, 0.01])).flat()]], ["#E53935", [...cyl([0, 1.1, -0.05], 0.01, 0.35, 4), ...L([0.08, 1.38, -0.05], [0.15, 0.1, 0.01])]]]); }
// cirkus: randigt cirkustält med flagga och ingång
{ const st = [], st2 = [], tak = [], tak2 = []; for (let i = 0; i < 16; i++) { const a = (i / 16) * 2 * Math.PI, b = ((i + 1) / 16) * 2 * Math.PI, P = (w, r, y) => [r * Math.cos(w), y, r * Math.sin(w)];
    (i % 2 ? st : st2).push(...quad(P(a, 0.7, 0), P(a, 0.7, 0.55), P(b, 0.7, 0.55), P(b, 0.7, 0)));
    (i % 2 ? tak2 : tak).push(...quad(P(a, 0.72, 0.55), P(a, 0.02, 1.25), P(b, 0.02, 1.25), P(b, 0.72, 0.55))); }
  await spara("cirkus", [["#E53935", [...st, ...tak]], [vit, [...st2, ...tak2]], ["#FDD835", [...cyl([0, 1.2, 0], 0.012, 0.3, 4), ...L([0.08, 1.45, 0], [0.15, 0.09, 0.01]), ...Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * 2 * Math.PI; return E([0.73 * Math.cos(a), 0.55, 0.73 * Math.sin(a)], [0.04, 0.04, 0.04], 5, 3); }).flat()]], ["#3949AB", [...L([0, 0.22, 0.69], [0.3, 0.44, 0.04])]]]); }
// garage: garage med upprullningsport och en bil som tittar fram
await spara("garage", [["#BDBDBD", L([0, 0.4, 0], [0.9, 0.8, 0.8])], ["#607D8B", [...L([0, 0.82, 0], [1.0, 0.06, 0.9])]], [vit, [...Array.from({ length: 6 }, (_, i) => L([0, 0.12 + i * 0.07, 0.402], [0.62, 0.05, 0.01])).flat()]], ["#9E9E9E", [...L([0, 0.6, 0.402], [0.66, 0.02, 0.012]), ...L([0.33, 0.3, 0.402], [0.02, 0.6, 0.012]), ...L([-0.33, 0.3, 0.402], [0.02, 0.6, 0.012])]], ["#1E88E5", [...L([0, 0.05, 0.47], [0.5, 0.06, 0.12])]], [sv, [...cylX([0.2, 0.05, 0.5], 0.05, 0.04, 10), ...cylX([-0.2, 0.05, 0.5], 0.05, 0.04, 10)]], ["#FDD835", [...L([0.3, 0.7, 0.402], [0.12, 0.06, 0.01])]]]);
// museum: museum med pelare, gavel och ett dinosaurieskelett utanför
await spara("museum", [["#ECEFF1", [...L([0, 0.06, 0.05], [1.4, 0.12, 0.9]), ...L([0, 0.5, -0.1], [1.2, 0.76, 0.5]), ...L([0, 0.92, 0.05], [1.3, 0.08, 0.8])]], [vit, [-0.5, -0.25, 0, 0.25, 0.5].flatMap((x) => cyl([x, 0.12, 0.35], 0.045, 0.76, 10))], ["#CFD8DC", [...quad([-0.65, 0.96, 0.45], [0.65, 0.96, 0.45], [0, 1.25, 0.45], [0, 1.25, 0.45]).slice(0, 1), ...sadeltak(1.3, 0.9, 0.96, 0.29, "#CFD8DC")[1]]], ["#5D4037", L([0, 0.35, 0.152], [0.2, 0.4, 0.01])], ["#FFF8E1", [...ror([[0.75, 0.0, 0.4], [0.72, 0.18, 0.4]], [0.012, 0.012], 4), ...ror([[0.6, 0.0, 0.4], [0.62, 0.18, 0.4]], [0.012, 0.012], 4), ...ror([[0.52, 0.2, 0.4], [0.62, 0.2, 0.4], [0.75, 0.22, 0.4], [0.82, 0.3, 0.4], [0.86, 0.36, 0.4]], [0.02, 0.02, 0.02, 0.015, 0.015], 5), ...E([0.9, 0.38, 0.4], [0.05, 0.03, 0.025], 6, 3), ...ror([[0.52, 0.2, 0.4], [0.42, 0.14, 0.4], [0.34, 0.06, 0.4]], [0.015, 0.012, 0.006], 4), ...[0.58, 0.65, 0.72].flatMap((x) => ror([[x, 0.21, 0.4], [x, 0.14, 0.43]], [0.006, 0.006], 3))]]]);
console.log("klart");
