// R3F-M18b: omfärgade CC0-djur (nya ord): Quaternius via materialfärger, Gobkit via texturen. Upphov behålls, omfärgning: Trollpennan (CC0).
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import sharp from "sharp";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const I = "/workspace/modell-inkorg", UT = `${I}/trollpennan-djur-m18b`;
const lin = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
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

async function material(namn, kalla, farger) {
  const d = await io.read(`${I}/${kalla}`);
  for (const m of d.getRoot().listMaterials()) if (farger[m.getName()]) m.setBaseColorFactor([...lin(farger[m.getName()]), 1]);
  await io.write(`${UT}/${namn}.glb`, d);
}
async function textur(namn, kalla, steg) {
  const d = await io.read(`${I}/${kalla}`);
  for (const t of d.getRoot().listTextures()) { let png = Buffer.from(t.getImage()); png = await steg(png); t.setImage(new Uint8Array(png)).setURI(""); }
  await io.write(`${UT}/${namn}.glb`, d);
}
// hela texturen mot en kulör men ljusheten kvar (ögon och mörka linjer behålls)
async function kulor(png, { h, s, vmul = 1, vadd = 0, vmin = 0.18, fran = null }) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) { const [, , v] = hsv(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255); if (v < vmin) continue; if (fran) { const [hh, ss] = hsv(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255); if (ss > 0.15 && (hh < fran[0] || hh > fran[1])) continue; }
    const [r, g, b] = rgb(h, s, Math.min(1, vadd + v * vmul)); data[i] = r * 255; data[i + 1] = g * 255; data[i + 2] = b * 255; }
  return sharp(data, { raw: info }).png().toBuffer();
}
const P = "polypizza-cc0-m18b", G = "gobkit-cc0-djur-och-natur", Q = "quaternius-ultimate-animated-animals";
await material("spackhuggare-delfin", `${P}/delfin-3lzfgi.glb`, { Top: "#1A1A1E", Bottom: "#F4F4F4" });
await material("blaval-val", `${P}/val-jgfwp6.glb`, { Top: "#4A6A8C", Bottom: "#C9D3DC" });
await material("duva-pigeon", `${P}/duva-9nglbt.glb`, { Pigeon_Main: "#8A93A6", Pigeon_Secondary: "#E08A3C" });
await material("fjallrav-fox", `${Q}/fox.glb`, { Main: "#F5F5F5", Main_Light: "#FFFFFF", Grey: "#B0BEC5" });
await material("kraka-pigeon", `${P}/duva-9nglbt.glb`, { Pigeon_Main: "#2E3036", Pigeon_Secondary: "#3A3A3A" });
await textur("snouggla-owl", `${G}/owl.glb`, (p) => kulor(p, { h: 210, s: 0.04, vmul: 0.35, vadd: 0.66, fran: [5, 40], vmin: 0.25 }));
await textur("beluga-whale", `${G}/whale.glb`, (p) => kulor(p, { h: 200, s: 0.06, vmul: 0.3, vadd: 0.7 }));
await textur("sjolejon-seal", `${G}/seal.glb`, (p) => kulor(p, { h: 28, s: 0.55, vmul: 0.8, vadd: 0.05 }));
console.log("klart");
