// Ställer upp en liggande modell: node upprest.mjs in.glb ut.glb <axel x|z> <grader>
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
const [inn, ut, ax, g] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inn);
const r = (Number(g) * Math.PI) / 360, s = Math.sin(r), c = Math.cos(r);
const q = ax === "x" ? [s, 0, 0, c] : ax === "y" ? [0, s, 0, c] : [0, 0, s, c];
for (const scen of doc.getRoot().listScenes()) {
  const n = doc.createNode("upprest").setRotation(q);
  for (const b of scen.listChildren()) { scen.removeChild(b); n.addChild(b); }
  scen.addChild(n);
}
await io.write(ut, doc);
console.log("skrev", ut);
