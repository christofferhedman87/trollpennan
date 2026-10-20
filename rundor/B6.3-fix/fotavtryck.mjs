// B6.3: data/fotavtryck.json – halva bredden på marken (världsenheter) för varje entitet med modell, ur modellens egen
// bbox (GLB, nodernas transformer inräknade) och spelets skala (skalaFor, samma som gltfDjur). Placeringen håller
// skapelsens kropp – inte bara mitten – borta från dammen. Körs av kor.sh på main (så alla modellpaket som finns räknas).
//   node --experimental-strip-types rundor/B6.3-fix/fotavtryck.mjs   (skriver data/fotavtryck.json)
import fs from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

globalThis.self ??= globalThis;
// entiteter.ts läser fotavtryck.json själv; första gången finns den inte än
if (!fs.existsSync("data/fotavtryck.json")) fs.writeFileSync("data/fotavtryck.json", '{ "halvbredd": {} }\n');
const { skalaFor } = await import("../../src/spel/entiteter.ts");
const E = JSON.parse(fs.readFileSync("data/entiteter.json", "utf8")).entiteter;
const T = JSON.parse(fs.readFileSync("data/tillgangar.json", "utf8")).tillgangar;
const L = new GLTFLoader();
L.setMeshoptDecoder(MeshoptDecoder);
L.register(() => ({ name: "inga-bilder", loadTexture: () => Promise.resolve(null) })); // texturer behövs inte för måtten
const tyst = console.warn;
const tystE = console.error;
console.warn = () => {};
console.error = () => {};
const ut = {};
let fel = 0;
for (const [id, e] of Object.entries(E).sort(([a], [b]) => a.localeCompare(b))) {
  const fil = e.modell && T[e.modell]?.fil;
  if (!fil || !fs.existsSync(`public${fil}`)) continue;
  try {
    const b = fs.readFileSync(`public${fil}`);
    const g = await new Promise((res, rej) => L.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), "", res, rej));
    g.scene.updateMatrixWorld(true);
    const s = new THREE.Box3().setFromObject(g.scene).getSize(new THREE.Vector3());
    const k = skalaFor(id, s.y, s.x, s.z);
    ut[id] = Math.round(0.5 * Math.max(s.x, s.z) * k * 100) / 100;
  } catch (err) {
    fel++;
    tyst(`VARNING: ${id}: ${String(err).slice(0, 120)}`);
  }
}
console.warn = tyst;
console.error = tystE;
const json = { _om: "B6.3: halva bredden på marken (världsenheter, spelets skala) per entitet, ur modellens bbox. Genereras av rundor/B6.3-fix/fotavtryck.mjs. Saknas en entitet gäller 0,5 × målhöjden.", halvbredd: ut };
fs.writeFileSync("data/fotavtryck.json", JSON.stringify(json, null, 1).replace(/\n {2}"/g, ' "').replace(/\n \}/, " }") + "\n");
JSON.parse(fs.readFileSync("data/fotavtryck.json", "utf8"));
console.log(`fotavtryck: ${Object.keys(ut).length} entiteter${fel ? `, ${fel} VARNING` : ""}`);
