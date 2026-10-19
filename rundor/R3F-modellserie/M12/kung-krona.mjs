// R3F-M12: kung = Kenney Blocky character-a (CC0) + Quaternius Crown (CC0, poly.pizza/m/i0PZVuVlYv) på huvudet.
// KHR_materials_unlit tas bort (spelets material ger sidfel på oupplysta material).
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, unpartition, mergeDocuments } from "@gltf-transform/functions";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const I = "/workspace/modell-inkorg";
const doc = await io.read(`${I}/kenney-blocky-characters/character-a.glb`);
const krona = await io.read(`${I}/polypizza-cc0/crown-crown-i0pzvu.glb`);
mergeDocuments(doc, krona);
const root = doc.getRoot();
const [huvudScen, kronScen] = root.listScenes();
const head = root.listNodes().find((n) => n.getName() === "head");
const kron = root.listNodes().find((n) => n.getName() === "Crown2");
for (const c of kronScen.listChildren()) kronScen.removeChild(c);
kron.getParentNode()?.removeChild(kron);
const s = 980;
kron.setScale([s, s, s]).setRotation([-Math.SQRT1_2, 0, 0, Math.SQRT1_2]).setTranslation([0, 8.9, 0]);
head.addChild(kron);
kronScen.dispose();
root.setDefaultScene(huvudScen);
for (const m of root.listMaterials()) m.setExtension("KHR_materials_unlit", null);
// Kronans guld blir mörkt utan miljöljus: ljusare guld, ingen metall.
for (const m of root.listMaterials()) if (m.getName() === "Gold") m.setBaseColorFactor([1.0, 0.78, 0.15, 1]).setMetallicFactor(0).setRoughnessFactor(0.6);
for (const m of root.listMaterials()) if (m.getName() === "Red") m.setMetallicFactor(0).setRoughnessFactor(0.6);
for (const e of root.listExtensionsUsed()) if (e.extensionName === "KHR_materials_unlit") e.dispose();
await doc.transform(prune(), unpartition());
await io.write(`${I}/kenney-blocky-characters/kung-krona.glb`, doc);
console.log("skrev kung-krona.glb");
