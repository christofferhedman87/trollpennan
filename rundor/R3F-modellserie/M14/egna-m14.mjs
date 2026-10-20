// R3F-M14: egna lågpolymodeller (Trollpennan, CC0): boll (badboll med sex färgfält), trumma (med två pinnar) och ballong (med snöre).
// +y upp, +z framåt, står på y=0. Platt skuggning (triangelsoppa).
import { Document, NodeIO } from "@gltf-transform/core";
const io = new NodeIO();
const UT = "/workspace/modell-inkorg/trollpennan-egna-m14";
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
// boll: UV-sfär, radie 0.5, sex färgfält runt y-axeln, vita poler
{
  const R = 0.5, seg = 24, ring = 12, farger = ["#E53935", "#FFFFFF", "#FDD835", "#FFFFFF", "#1E88E5", "#FFFFFF"];
  const P = (i, j) => { const th = (i / ring) * Math.PI, ph = (j / seg) * 2 * Math.PI; return [R * Math.sin(th) * Math.cos(ph), R + R * Math.cos(th), R * Math.sin(th) * Math.sin(ph)]; };
  const per = new Map();
  for (let i = 0; i < ring; i++) for (let j = 0; j < seg; j++) {
    const f = i < 2 || i >= ring - 2 ? "#FFFFFF" : farger[Math.floor(j / (seg / 6))];
    if (!per.has(f)) per.set(f, []);
    const a = P(i, j), b = P(i, j + 1), c = P(i + 1, j), d = P(i + 1, j + 1);
    if (i > 0) per.get(f).push([a, b, c]);
    if (i < ring - 1) per.get(f).push([b, d, c]);
  }
  await io.write(`${UT}/boll-egen.glb`, bygg("boll", [...per.entries()]));
}
// trumma: cylinder (röd), vita skinn, gula kanter, två pinnar
{
  const seg = 20, r = 0.45, h = 0.5, cyl = [], topp = [], kant = [], pinne = [];
  const ring = (y, rr) => Array.from({ length: seg }, (_, j) => { const ph = (j / seg) * 2 * Math.PI; return [rr * Math.cos(ph), y, rr * Math.sin(ph)]; });
  const b0 = ring(0.06, r), b1 = ring(h - 0.06, r), k0 = ring(0, r + 0.02), k1 = ring(0.06, r + 0.02), k2 = ring(h - 0.06, r + 0.02), k3 = ring(h, r + 0.02);
  for (let j = 0; j < seg; j++) { const n = (j + 1) % seg;
    cyl.push([b0[j], b1[j], b0[n]], [b0[n], b1[j], b1[n]]);
    kant.push([k0[j], k1[j], k0[n]], [k0[n], k1[j], k1[n]], [k2[j], k3[j], k2[n]], [k2[n], k3[j], k3[n]]);
    topp.push([[0, h, 0], k3[n], k3[j]], [[0, 0, 0], k0[j], k0[n]]);
  }
  const stav = (x0, z0, x1, y1, z1) => { const w = 0.02; const A = [x0, h + 0.02, z0], B = [x1, y1, z1];
    const o = [[w, 0, 0], [0, w, 0], [-w, 0, 0], [0, -w, 0]];
    for (let k = 0; k < 4; k++) { const p = o[k], q = o[(k + 1) % 4]; const a = A.map((v, i) => v + p[i]), b = A.map((v, i) => v + q[i]), c = B.map((v, i) => v + p[i]), d = B.map((v, i) => v + q[i]); pinne.push([a, c, b], [b, c, d]); } };
  stav(-0.1, 0.1, -0.35, h + 0.35, 0.3); stav(0.1, 0.1, 0.35, h + 0.35, 0.3);
  await io.write(`${UT}/trumma-egen.glb`, bygg("trumma", [["#C62828", cyl], ["#FFF8E1", topp], ["#FBC02D", kant], ["#8D6E63", pinne]]));
}
// ballong: röd droppe (sfär, något spetsig nedåt) på ett snöre, totalt 1,0 hög
{
  const seg = 16, ring = 10, R = 0.22, cy = 0.75, kropp = [], knut = [], snore = [];
  const P = (i, j) => { const th = (i / ring) * Math.PI, ph = (j / seg) * 2 * Math.PI; const k = Math.cos(th) < 0 ? 1.25 : 1.0; return [R * Math.sin(th) * Math.cos(ph), cy + R * k * Math.cos(th), R * Math.sin(th) * Math.sin(ph)]; };
  for (let i = 0; i < ring; i++) for (let j = 0; j < seg; j++) { const a = P(i, j), b = P(i, j + 1), c = P(i + 1, j), d = P(i + 1, j + 1); if (i > 0) kropp.push([a, b, c]); if (i < ring - 1) kropp.push([b, d, c]); }
  const ky = cy - R * 1.25; const kn = Array.from({ length: 6 }, (_, j) => { const ph = (j / 6) * 2 * Math.PI; return [0.035 * Math.cos(ph), ky - 0.01, 0.035 * Math.sin(ph)]; });
  for (let j = 0; j < 6; j++) knut.push([[0, ky + 0.02, 0], kn[(j + 1) % 6], kn[j]], [[0, ky - 0.05, 0], kn[j], kn[(j + 1) % 6]]);
  const w = 0.008, pts = Array.from({ length: 9 }, (_, i) => [0.03 * Math.sin(i * 1.3), ky - 0.04 - (i / 8) * (ky - 0.04), 0]);
  for (let i = 0; i < 8; i++) { const A = pts[i], B = pts[i + 1]; for (const [dx, dz] of [[w, 0], [0, w]]) { snore.push([[A[0] - dx, A[1], A[2] - dz], [B[0] - dx, B[1], B[2] - dz], [A[0] + dx, A[1], A[2] + dz]], [[A[0] + dx, A[1], A[2] + dz], [B[0] - dx, B[1], B[2] - dz], [B[0] + dx, B[1], B[2] + dz]]); } }
  await io.write(`${UT}/ballong-egen.glb`, bygg("ballong", [["#E53935", kropp], ["#C62828", knut], ["#EEEEEE", snore]]));
}
console.log("klart");
