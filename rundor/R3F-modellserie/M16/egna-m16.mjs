// R3F-M16: egna lågpolymodeller (Trollpennan, CC0): sol, måne, regnbåge, blixt, vulkan, istapp, ö, sandslott, diamant, pyramid, planet, komet, regndroppe, eld, tornado, kub.
// +y upp, +z framåt, står på y=0. Platt skuggning (triangelsoppa).
import { Document, NodeIO } from "@gltf-transform/core";
const io = new NodeIO();
const UT = "/workspace/modell-inkorg/trollpennan-egna-m16";
const lin = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255); return [...c.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)), 1]; };
function bygg(namn, delar) {
  const doc = new Document(); const buf = doc.createBuffer(); const scen = doc.createScene(namn); const mesh = doc.createMesh(namn);
  for (const [farg, tris] of delar) {
    const pos = [], nor = [];
    for (const [a, b, c] of tris) {
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const l = Math.hypot(...n) || 1; n = n.map((x) => x / l);
      pos.push(...a, ...b, ...c); nor.push(...n, ...n, ...n);
    }
    const mat = doc.createMaterial(farg).setBaseColorFactor(lin(farg)).setRoughnessFactor(0.8).setMetallicFactor(0);
    const p = doc.createPrimitive().setMaterial(mat)
      .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(new Float32Array(pos)).setBuffer(buf))
      .setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(new Float32Array(nor)).setBuffer(buf));
    mesh.addPrimitive(p);
  }
  scen.addChild(doc.createNode(namn).setMesh(mesh)); doc.getRoot().setDefaultScene(scen);
  return doc;
}

const quad = (a, b, c, d) => [[a, b, c], [a, c, d]];
const both = (t) => [...t, ...t.map(([a, b, c]) => [a, c, b])];
// sol: platt skiva (båda sidor) med åtta trekantiga strålar, står upp i xy-planet
{
  const R = 0.32, cy = 0.55, n = 24, skiva = [], stralar = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * 2 * Math.PI, b = ((i + 1) / n) * 2 * Math.PI;
    skiva.push([[0, cy, 0.03], [R * Math.cos(a), cy + R * Math.sin(a), 0.03], [R * Math.cos(b), cy + R * Math.sin(b), 0.03]]); }
  for (let i = 0; i < 8; i++) { const a = (i / 8) * 2 * Math.PI, w = 0.16;
    stralar.push([[ (R + 0.04) * Math.cos(a - w), cy + (R + 0.04) * Math.sin(a - w), 0], [0.52 * Math.cos(a), cy + 0.52 * Math.sin(a), 0], [(R + 0.04) * Math.cos(a + w), cy + (R + 0.04) * Math.sin(a + w), 0]]); }
  await io.write(`${UT}/sol-egen.glb`, bygg("sol", [["#FDD835", both(skiva)], ["#FB8C00", both(stralar)]]));
}
// måne: skära (två cirkelbågar), tjocklek 0.08
{
  const n = 20, cy = 0.5, R = 0.45, t = [], kant = [];
  const yttre = (i) => { const a = -Math.PI / 2 + (i / n) * Math.PI; return [R * Math.cos(a) , cy + R * Math.sin(a)]; };
  const inre = (i) => { const a = -Math.PI / 2 + (i / n) * Math.PI; return [R * 0.55 * Math.cos(a) , cy + R * Math.sin(a) * 0.92]; };
  for (let i = 0; i < n; i++) for (const z of [0.04, -0.04]) { const A = yttre(i), B = yttre(i + 1), C = inre(i + 1), D = inre(i);
    t.push(...quad([A[0], A[1], z], [B[0], B[1], z], [C[0], C[1], z], [D[0], D[1], z])); }
  for (let i = 0; i < n; i++) { const A = yttre(i), B = yttre(i + 1); kant.push(...quad([A[0], A[1], 0.04], [A[0], A[1], -0.04], [B[0], B[1], -0.04], [B[0], B[1], 0.04])); }
  await io.write(`${UT}/mane-egen.glb`, bygg("mane", [["#FFF59D", both(t)], ["#FBC02D", both(kant)]]));
}
// regnbåge: sex färgade bågar
{
  const farger = ["#E53935", "#FB8C00", "#FDD835", "#43A047", "#1E88E5", "#8E24AA"], n = 24, delar = [];
  farger.forEach((f, k) => { const r1 = 0.5 - k * 0.06, r0 = r1 - 0.06, t = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI, b = ((i + 1) / n) * Math.PI;
      for (const z of [0.04]) t.push(...quad([r0 * Math.cos(a), r0 * Math.sin(a), z], [r1 * Math.cos(a), r1 * Math.sin(a), z], [r1 * Math.cos(b), r1 * Math.sin(b), z], [r0 * Math.cos(b), r0 * Math.sin(b), z])); }
    delar.push([f, both(t)]); });
  await io.write(`${UT}/regnbage-egen.glb`, bygg("regnbage", delar));
}
// blixt: sicksack-polygon, extruderad
{
  const P = [[0.1, 1.0], [-0.2, 0.45], [0.02, 0.45], [-0.12, 0.0], [0.25, 0.6], [0.03, 0.6], [0.22, 1.0]];
  const tris = [[0, 1, 2], [0, 2, 5], [0, 5, 6], [2, 3, 4], [2, 4, 5]], t = [], s = [];
  for (const z of [0.05, -0.05]) for (const [a, b, c] of tris) t.push([[...P[a], z], [...P[b], z], [...P[c], z]]);
  for (let i = 0; i < P.length; i++) { const A = P[i], B = P[(i + 1) % P.length]; s.push(...quad([...A, 0.05], [...A, -0.05], [...B, -0.05], [...B, 0.05])); }
  await io.write(`${UT}/blixt-egen.glb`, bygg("blixt", [["#FFEB3B", both(t)], ["#F9A825", both(s)]]));
}
// vulkan: stympad kon (grå) med glödande krater och lavaströmmar
{
  const n = 16, R0 = 0.6, R1 = 0.16, H = 0.6, sida = [], krater = [], lava = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * 2 * Math.PI, b = ((i + 1) / n) * 2 * Math.PI;
    const A = [R0 * Math.cos(a), 0, R0 * Math.sin(a)], B = [R0 * Math.cos(b), 0, R0 * Math.sin(b)], C = [R1 * Math.cos(b), H, R1 * Math.sin(b)], D = [R1 * Math.cos(a), H, R1 * Math.sin(a)];
    (i % 4 === 1 ? lava : sida).push([A, C, B], [A, D, C]);
    krater.push([[0, H - 0.05, 0], D, C]); }
  await io.write(`${UT}/vulkan-egen.glb`, bygg("vulkan", [["#6D4C41", both(sida)], ["#FF5722", both(krater)], ["#FF7043", both(lava)]]));
}
// istapp: smal kon nedåt från en isbit
{
  const n = 8, top = [], kon = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * 2 * Math.PI, b = ((i + 1) / n) * 2 * Math.PI;
    const A = [0.12 * Math.cos(a), 1.0, 0.12 * Math.sin(a)], B = [0.12 * Math.cos(b), 1.0, 0.12 * Math.sin(b)];
    kon.push([A, B, [0, 0.0, 0]]); top.push([[0, 1.0, 0], B, A]); }
  await io.write(`${UT}/istapp-egen.glb`, bygg("istapp", [["#B3E5FC", both(kon)], ["#E1F5FE", both(top)]]));
}
// hjälpare: sfär (UV) och kon/cylinder runt y
const sfar = (R, c, seg = 16, ring = 10, sy = 1) => { const P = (i, j) => { const th = (i / ring) * Math.PI, ph = (j / seg) * 2 * Math.PI; return [c[0] + R * Math.sin(th) * Math.cos(ph), c[1] + R * sy * Math.cos(th), c[2] + R * Math.sin(th) * Math.sin(ph)]; };
  const t = []; for (let i = 0; i < ring; i++) for (let j = 0; j < seg; j++) { const a = P(i, j), b = P(i, j + 1), cc = P(i + 1, j), d = P(i + 1, j + 1); if (i > 0) t.push([a, b, cc]); if (i < ring - 1) t.push([b, d, cc]); } return t; };
const kon = (r0, r1, y0, y1, n = 12, cx = 0, cz = 0, vrid = 0) => { const t = []; for (let i = 0; i < n; i++) { const a = (i / n) * 2 * Math.PI, b = ((i + 1) / n) * 2 * Math.PI;
  const A = [cx + r0 * Math.cos(a), y0, cz + r0 * Math.sin(a)], B = [cx + r0 * Math.cos(b), y0, cz + r0 * Math.sin(b)], C = [cx + r1 * Math.cos(b + vrid), y1, cz + r1 * Math.sin(b + vrid)], D = [cx + r1 * Math.cos(a + vrid), y1, cz + r1 * Math.sin(a + vrid)];
  t.push([A, C, B], [A, D, C], [[cx, y1, cz], C, D], [[cx, y0, cz], A, B]); } return t; };
const lada = (x0, y0, z0, x1, y1, z1) => { const v = (x, y, z) => [x ? x1 : x0, y ? y1 : y0, z ? z1 : z0]; const f = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]].map((q) => v(...q));
  return [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [3, 7, 6, 2], [0, 4, 7, 3], [1, 2, 6, 5]].flatMap(([a, b, c, d]) => [[f[a], f[b], f[c]], [f[a], f[c], f[d]]]); };
// ö: sandskiva i vatten med en palm
await io.write(`${UT}/o-egen.glb`, bygg("o", [["#4FC3F7", kon(0.6, 0.6, 0, 0.03, 20)], ["#FFE082", kon(0.42, 0.3, 0.03, 0.14, 16)], ["#8D6E63", kon(0.035, 0.03, 0.14, 0.75, 6, 0.05, 0)],
  ["#43A047", [...kon(0.0, 0.3, 0.82, 0.68, 6, 0.05, 0), ...kon(0.3, 0.0, 0.68, 0.72, 6, 0.05, 0)]]]));
// sandslott: fyra torn och en mur
{ const t = [], tak = []; for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) { t.push(...kon(0.12, 0.12, 0, 0.5, 10, x, z)); tak.push(...kon(0.14, 0.0, 0.5, 0.68, 10, x, z)); }
  t.push(...lada(-0.3, 0, -0.3, 0.3, 0.32, 0.3)); await io.write(`${UT}/sandslott-egen.glb`, bygg("sandslott", [["#E6C27A", t], ["#D4A44C", tak], ["#E53935", kon(0.005, 0.005, 0.68, 0.85, 4, 0.3, 0.3)]])); }
// diamant: oktaederliknande ädelsten
{ const n = 8, t = [], ov = []; for (let i = 0; i < n; i++) { const a = (i / n) * 2 * Math.PI, b = ((i + 1) / n) * 2 * Math.PI; const A = [0.35 * Math.cos(a), 0.55, 0.35 * Math.sin(a)], B = [0.35 * Math.cos(b), 0.55, 0.35 * Math.sin(b)];
  t.push([[0, 0, 0], A, B]); ov.push([[0, 0.75, 0], B, A]); } await io.write(`${UT}/diamant-egen.glb`, bygg("diamant", [["#4DD0E1", t], ["#B2EBF2", ov]])); }
// pyramid: fyrsidig
{ const T = [0, 0.8, 0], c = [[-0.5, 0, -0.5], [0.5, 0, -0.5], [0.5, 0, 0.5], [-0.5, 0, 0.5]], t = []; for (let i = 0; i < 4; i++) t.push([T, c[(i + 1) % 4], c[i]]); t.push([c[0], c[1], c[2]], [c[0], c[2], c[3]]);
  await io.write(`${UT}/pyramid-egen.glb`, bygg("pyramid", [["#E0B060", t]])); }
// planet: sfär med ring
{ const r = [], n = 24; for (let i = 0; i < n; i++) { const a = (i / n) * 2 * Math.PI, b = ((i + 1) / n) * 2 * Math.PI, q = (R, w) => [R * Math.cos(w), 0.5 + 0.12 * Math.cos(w) * 0.6, R * Math.sin(w)];
  r.push([q(0.38, a), q(0.55, a), q(0.55, b)], [q(0.38, a), q(0.55, b), q(0.38, b)]); } await io.write(`${UT}/planet-egen.glb`, bygg("planet", [["#FF8A65", sfar(0.3, [0, 0.5, 0])], ["#FFE0B2", both(r)]])); }
// komet: isklump med svans
await io.write(`${UT}/komet-egen.glb`, bygg("komet", [["#E3F2FD", sfar(0.16, [0.3, 0.6, 0], 10, 6)], ["#FFF59D", (() => { const t = []; for (const dz of [-0.06, 0, 0.06]) t.push(...both([[[0.3, 0.72, dz], [0.3, 0.48, dz], [-0.5, 0.75 + dz, dz * 2]]])); return t; })()]]));
// regndroppe
await io.write(`${UT}/regndroppe-egen.glb`, bygg("regndroppe", [["#42A5F5", [...sfar(0.25, [0, 0.25, 0], 14, 8), ...kon(0.25, 0.0, 0.27, 0.75, 14)]]]));
// eld: tre lågor
await io.write(`${UT}/eld-egen.glb`, bygg("eld", [["#FF7043", kon(0.28, 0.0, 0, 0.75, 8)], ["#FFCA28", [...kon(0.16, 0.0, 0, 0.5, 7, 0.18, 0.05), ...kon(0.16, 0.0, 0, 0.45, 7, -0.17, 0.05)]], ["#5D4037", lada(-0.35, 0, -0.06, 0.35, 0.08, 0.06)]]));
// tornado: vriden kon i flera led
{ const t = []; for (let k = 0; k < 6; k++) t.push(...kon(0.06 + k * 0.07, 0.06 + (k + 1) * 0.07, k * 0.16, (k + 1) * 0.16, 10, 0.03 * Math.sin(k), 0, 0.4));
  await io.write(`${UT}/tornado-egen.glb`, bygg("tornado", [["#90A4AE", t]])); }
// kub: leksakskloss med färgade sidor
{ const f = lada(-0.3, 0, -0.3, 0.3, 0.6, 0.3); const sid = (i) => f.slice(i * 2, i * 2 + 2);
  await io.write(`${UT}/kub-egen.glb`, bygg("kub", [["#E53935", [...sid(0), ...sid(1)]], ["#1E88E5", [...sid(2), ...sid(3)]], ["#FDD835", [...sid(4), ...sid(5)]]])); }
console.log("klart");
