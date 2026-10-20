// R3F-MFIX3: narvalen (Gobkit, CC0) var blek. Grå pixlar i texturen blir mörkare blågrå med ljusare buk; beten (gulvit) och ögonen är kvar. Omfärgning: Trollpennan (CC0).
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import sharp from "sharp";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const I = "/workspace/modell-inkorg";
const doc = await io.read(`${I}/trollpennan-mfix2/narval-gobkit.glb`);
const hsv = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(h * 60 + 360) % 360, mx ? d / mx : 0, mx]; };
const rgb = (h, s, v) => { const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [r + m, g + m, b + m]; };
for (const t of doc.getRoot().listTextures()) {
  const { data, info } = await sharp(Buffer.from(t.getImage())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, v] = hsv(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
    if (v < 0.15 || (s > 0.12 && h > 25 && h < 70)) continue;
    const [r, g, b] = rgb(208, 0.42 - v * 0.2, 0.25 + v * 0.55);
    data[i] = r * 255; data[i + 1] = g * 255; data[i + 2] = b * 255;
  }
  t.setImage(new Uint8Array(await sharp(data, { raw: info }).png().toBuffer()));
}
for (const m of doc.getRoot().listMaterials()) m.setBaseColorFactor([1, 1, 1, 1]);
await io.write(`${I}/trollpennan-mfix3/narval-gobkit.glb`, doc);
console.log("klart");
