// B5a: bygger inkorgspaketet b5a-sjo-cc0 (alla CC0). Körs: node bygg.mjs  (från /workspace/modell-inkorg/_b5a-bygg)
// - utter: Gobkit SeaOtter (CC0), oförändrad.
// - svan: Gobkit Goose (CC0), texturen omfärgad till vit (härledd, CC0).
// - abborre: Quaternius "Fish" (clownfisk, Poly Pizza BEcU9rjiAq, CC0), omfärgad olivgul med mörka ränder (härledd, CC0).
// - gädda: Quaternius "Fish" (Poly Pizza XWl86YFtpF, CC0), omfärgad grön/ljus (härledd, CC0).
// - kräfta, vattensalamander: egna lågpolymodeller byggda här (Trollpennan, CC0).
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import sharp from "sharp";
import fs from "node:fs";
const UT = "../b5a-sjo-cc0";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const lin = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255); return [...c.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)), 1]; };

// 1. utter
fs.copyFileSync("gob-seaotter.glb", `${UT}/utter-seaotter.glb`);

// 2. svan: ljusa, omättade pixlar → vita; orange/svart behålls
{
  const d = await io.read("gob-goose.glb");
  for (const t of d.getRoot().listTextures()) {
    const { data, info } = await sharp(Buffer.from(t.getImage())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx - mn < 40 && mx > 90) { const l = 236 + Math.round((mx - 90) / 165 * 18); data[i] = l; data[i + 1] = l; data[i + 2] = Math.min(255, l + 2); }
    }
    t.setImage(new Uint8Array(await sharp(data, { raw: info }).png().toBuffer())).setMimeType("image/png");
  }
  await io.write(`${UT}/svan-goose-vit.glb`, d);
}

// 3–4. omfärgade fiskar (materialfärger)
async function omfarga(in_, ut, farger) {
  const d = await io.read(in_);
  for (const m of d.getRoot().listMaterials()) if (farger[m.getName()]) m.setBaseColorFactor(lin(farger[m.getName()]));
  await io.write(ut, d);
}
await omfarga("pp-BEcU9rjiAq.glb", `${UT}/abborre-fish-omfargad.glb`, { Body: "#9AA43C", Stripes: "#3E4A22" });
await omfarga("pp-XWl86YFtpF.glb", `${UT}/gadda-fish-omfargad.glb`, { Top: "#3F6B2E", Bottom: "#C9D08E", Fins: "#8A6E34" });

// 5–6. egna modeller: platta lågpolyellipsoider, +y upp, +z framåt, står på y=0
function rot(v, [rx, ry, rz]) {
  let [x, y, z] = v;
  [y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)];
  [x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
  [x, y] = [x * Math.cos(rz) - y * Math.sin(rz), x * Math.sin(rz) + y * Math.cos(rz)];
  return [x, y, z];
}
function ellipsoid(s, t, r = [0, 0, 0], seg = 8, ring = 5) {
  const v = [];
  for (let i = 0; i <= ring; i++) for (let j = 0; j < seg; j++) {
    const th = (i / ring) * Math.PI, ph = (j / seg) * 2 * Math.PI;
    const p = [Math.sin(th) * Math.cos(ph) * s[0], Math.cos(th) * s[1], Math.sin(th) * Math.sin(ph) * s[2]];
    const q = rot(p, r); v.push([q[0] + t[0], q[1] + t[1], q[2] + t[2]]);
  }
  const tri = [];
  for (let i = 0; i < ring; i++) for (let j = 0; j < seg; j++) {
    const a = i * seg + j, b = i * seg + ((j + 1) % seg), c = (i + 1) * seg + j, e = (i + 1) * seg + ((j + 1) % seg);
    if (i > 0) tri.push([v[a], v[b], v[c]]);
    if (i < ring - 1) tri.push([v[b], v[e], v[c]]);
  }
  return tri;
}
// pinne mellan två punkter (ellipsoid längs riktningen)
function pinne(a, b, rad, seg = 6) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...d);
  const ry = Math.atan2(d[0], d[2]), rx = -Math.asin(d[1] / L);
  return ellipsoid([rad, rad, L / 2], [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], [rx, ry, 0], seg, 4);
}
async function skriv(namn, delar, farger) {
  const d = new Document();
  const buf = d.createBuffer();
  const mesh = d.createMesh(namn);
  for (const [mat, tris] of Object.entries(delar)) {
    const pos = [], nor = [];
    for (const [p0, p1, p2] of tris) {
      const u = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], w = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
      let n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
      const l = Math.hypot(...n) || 1; n = n.map((x) => x / l);
      // utåtriktad yta: sfärernas triangelordning ger inåt-normaler, vänd
      for (const p of [p0, p2, p1]) { pos.push(...p); nor.push(...n.map((x) => -x)); }
    }
    const prim = d.createPrimitive()
      .setAttribute("POSITION", d.createAccessor().setType("VEC3").setArray(new Float32Array(pos)).setBuffer(buf))
      .setAttribute("NORMAL", d.createAccessor().setType("VEC3").setArray(new Float32Array(nor)).setBuffer(buf))
      .setMaterial(d.createMaterial(mat).setBaseColorFactor(lin(farger[mat])).setRoughnessFactor(0.85).setMetallicFactor(0));
    mesh.addPrimitive(prim);
  }
  d.createScene(namn).addChild(d.createNode(namn).setMesh(mesh));
  await io.write(`${UT}/${namn}.glb`, d);
}
const spegel = (f) => [f(1), f(-1)].flat();

// kräfta (ca 1,5 lång, 0,35 hög): röd som på en kräftskiva, klor fram (+z)
{
  const skal = [], mork = [], ogon = [];
  skal.push(...ellipsoid([0.22, 0.15, 0.36], [0, 0.2, 0.12]));
  skal.push(...ellipsoid([0.05, 0.04, 0.12], [0, 0.24, 0.5]));
  for (let i = 0; i < 5; i++) (i % 2 ? mork : skal).push(...ellipsoid([0.19 - 0.02 * i, 0.125 - 0.012 * i, 0.1], [0, 0.19 - 0.012 * i, -0.22 - 0.15 * i]));
  skal.push(...ellipsoid([0.07, 0.02, 0.12], [0, 0.13, -1.0]));
  for (const k of [1, -1]) skal.push(...ellipsoid([0.06, 0.018, 0.11], [k * 0.1, 0.13, -0.97], [0, k * 0.5, 0]));
  for (const k of [1, -1]) {
    skal.push(...pinne([k * 0.16, 0.18, 0.35], [k * 0.3, 0.2, 0.55], 0.045));
    skal.push(...pinne([k * 0.3, 0.2, 0.55], [k * 0.3, 0.2, 0.75], 0.055));
    skal.push(...ellipsoid([0.12, 0.08, 0.2], [k * 0.32, 0.2, 0.9]));
    mork.push(...pinne([k * 0.27, 0.21, 1.02], [k * 0.23, 0.21, 1.22], 0.045));
    mork.push(...pinne([k * 0.38, 0.2, 1.02], [k * 0.39, 0.2, 1.18], 0.04));
    for (let j = 0; j < 4; j++) {
      const z = 0.26 - 0.12 * j;
      mork.push(...pinne([k * 0.17, 0.15, z], [k * 0.33, 0.12, z + 0.02], 0.022));
      mork.push(...pinne([k * 0.33, 0.12, z + 0.02], [k * 0.4, 0.0, z], 0.018));
    }
    mork.push(...pinne([k * 0.05, 0.26, 0.55], [k * 0.32, 0.42, 1.3], 0.012, 4));
    mork.push(...pinne([k * 0.03, 0.25, 0.58], [k * 0.12, 0.3, 0.85], 0.012, 4));
    ogon.push(...ellipsoid([0.035, 0.035, 0.035], [k * 0.08, 0.3, 0.46]));
  }
  await skriv("krafta-egen", { Skal: skal, Mork: mork, Ogon: ogon }, { Skal: "#C9472C", Mork: "#8E2F1D", Ogon: "#151515" });
}

// vattensalamander (ca 1,5 lång, 0,3 hög): mörk rygg med prickar, orange buk, platt svans med kam
{
  const rygg = [], buk = [], prick = [], ogon = [];
  rygg.push(...ellipsoid([0.15, 0.1, 0.42], [0, 0.15, 0]));
  buk.push(...ellipsoid([0.135, 0.06, 0.38], [0, 0.11, 0]));
  rygg.push(...ellipsoid([0.125, 0.09, 0.13], [0, 0.155, 0.36]));
  rygg.push(...ellipsoid([0.13, 0.075, 0.17], [0, 0.165, 0.5]));
  buk.push(...ellipsoid([0.1, 0.045, 0.14], [0, 0.125, 0.52]));
  for (let i = 0; i < 5; i++) rygg.push(...ellipsoid([0.06 - 0.009 * i, 0.09 - 0.013 * i, 0.15], [0, 0.15, -0.46 - 0.2 * i]));
  rygg.push(...ellipsoid([0.012, 0.05, 0.5], [0, 0.2, -0.82]));
  rygg.push(...ellipsoid([0.012, 0.03, 0.3], [0, 0.245, -0.05]));
  for (const k of [1, -1]) for (const z of [0.27, -0.25]) {
    rygg.push(...pinne([k * 0.11, 0.13, z], [k * 0.25, 0.07, z + 0.05], 0.035));
    rygg.push(...pinne([k * 0.25, 0.07, z + 0.05], [k * 0.29, 0.015, z + 0.11], 0.028));
    buk.push(...ellipsoid([0.05, 0.015, 0.05], [k * 0.3, 0.012, z + 0.14]));
  }
  for (const k of [1, -1]) {
    for (const z of [-0.25, -0.05, 0.15]) prick.push(...ellipsoid([0.035, 0.012, 0.045], [k * 0.085, 0.235, z], [0, 0, k * -0.5]));
    for (const z of [-0.6, -0.85]) prick.push(...ellipsoid([0.012, 0.03, 0.04], [k * 0.045, 0.16, z]));
    ogon.push(...ellipsoid([0.032, 0.032, 0.032], [k * 0.085, 0.215, 0.55]));
  }
  await skriv("vattensalamander-egen", { Rygg: rygg, Buk: buk, Prick: prick, Ogon: ogon }, { Rygg: "#6A5B36", Buk: "#EE8A2A", Prick: "#1F1A12", Ogon: "#121212" });
}
console.log("klart:", fs.readdirSync(UT).join(" "));
