// R3F-M13: kopierar valda GLB ur Kenney Food Kit (fullständiga nedladdningen) till kenney-food-kit-2 med texturen inbäddad.
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const K = "/workspace/modell-inkorg/_nedladdning/x-food-kit/Models/GLB format";
const U = "/workspace/modell-inkorg/kenney-food-kit-2";
const filer = process.argv.slice(2);
for (const f of filer) { const d = await io.read(`${K}/${f}`); for (const t of d.getRoot().listTextures()) t.setURI(""); await io.write(`${U}/${f}`, d); console.log("ok", f); }
