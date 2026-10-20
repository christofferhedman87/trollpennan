// R3F-M13/M14: kopierar valda Kenney-GLB (K=källmapp, U=mål) med texturen inbäddad.
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const K = process.env.K;
const U = process.env.U;
const filer = process.argv.slice(2);
for (const f of filer) { const d = await io.read(`${K}/${f}`); for (const t of d.getRoot().listTextures()) t.setURI(""); await io.write(`${U}/${f}`, d); console.log("ok", f); }
