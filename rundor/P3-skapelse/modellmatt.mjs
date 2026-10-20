// P3a (Arkitekten 20:40): data/modellmatt.json – modellens egna mått i spelets skala (bredd x, höjd y, djup z, världsenheter
// vid skala 1, efter framAxel-vridningen som gltfDjur gör), ur samma Box3 som renderaren (GLB, nodernas transformer
// inräknade) och samma skala (skalaFor). Placeringsregeln räknar skärmrutan ur dem i stället för målhöjden och
// fotavtrycket. Körs av kor.sh på main efter fotavtryck.mjs (så alla modellpaket som finns räknas).
//   node --experimental-strip-types rundor/P3-skapelse/modellmatt.mjs   (skriver data/modellmatt.json)
import fs from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

globalThis.self ??= globalThis;
if (!fs.existsSync("data/modellmatt.json")) fs.writeFileSync("data/modellmatt.json", '{ "matt": {} }\n');
const { skalaFor, framVinkel } = await import("../../src/spel/entiteter.ts");
const E = JSON.parse(fs.readFileSync("data/entiteter.json", "utf8")).entiteter;
const T = JSON.parse(fs.readFileSync("data/tillgangar.json", "utf8")).tillgangar;
const L = new GLTFLoader();
L.setMeshoptDecoder(MeshoptDecoder);
L.register(() => ({ name: "inga-bilder", loadTexture: () => Promise.resolve(null) }));
const [tyst, tystE] = [console.warn, console.error];
console.warn = () => {};
console.error = () => {};
const ut = {};
const cache = new Map();
let fel = 0;
for (const [id, e] of Object.entries(E).sort(([a], [b]) => a.localeCompare(b))) {
  const fil = e.modell && T[e.modell]?.fil;
  if (!fil || !fs.existsSync(`public${fil}`)) continue;
  try {
    let s = cache.get(fil);
    if (!s) {
      const b = fs.readFileSync(`public${fil}`);
      const g = await new Promise((res, rej) => L.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), "", res, rej));
      g.scene.updateMatrixWorld(true);
      s = new THREE.Box3().setFromObject(g.scene).getSize(new THREE.Vector3());
      cache.set(fil, s);
    }
    const k = skalaFor(id, s.y, s.x, s.z);
    const v = Math.abs(Math.sin(framVinkel(e.framAxel))) > 0.5; // ±x fram: bredd och djup byter plats
    const r = (q) => Math.round(q * k * 1000) / 1000;
    ut[id] = [r(v ? s.z : s.x), r(s.y), r(v ? s.x : s.z)];
  } catch (err) {
    fel++;
    tyst(`VARNING: ${id}: ${String(err).slice(0, 120)}`);
  }
}
// procedurkroppar (ingen modellfil; DjurForm i djur.tsx): byggPack i skala 1, som kroppen ritas (4:e talet = lådans botten)
const { byggPack } = await import("../../src/spel/djurmesh.ts");
for (const [id, e] of Object.entries(E).sort(([a], [b]) => a.localeCompare(b))) {
  if (e.typ !== "djur" || ut[id] || (e.modell && T[e.modell]?.fil)) continue;
  try {
    const pk = byggPack({ kropp: id, farg: "#888888", krona: false, horn: false, monster: false, monsterFarg: "#6D4C41" });
    const box = new THREE.Box3();
    for (const g of [pk.geo, pk.outline, pk.ogon]) { g.computeBoundingBox(); box.union(g.boundingBox); }
    const s = box.getSize(new THREE.Vector3());
    const r = (q) => Math.round(q * 1000) / 1000;
    ut[id] = [r(s.x), r(s.y), r(s.z), r(box.min.y)];
  } catch (err) {
    fel++;
    tyst(`VARNING: ${id} (procedur): ${String(err).slice(0, 120)}`);
  }
}
console.warn = tyst;
console.error = tystE;
const json = { _om: "P3a: modellens bredd (x), höjd (y) och djup (z) i världsenheter vid skala 1, i spelets skala, ur modellens Box3 som renderaren (gltfDjur). Genereras av rundor/P3-skapelse/modellmatt.mjs. Procedurkroppar (byggPack) har ett fjärde tal: lådans botten. Saknas en entitet räknar placeringen med målhöjden och fotavtrycket.", matt: ut };
fs.writeFileSync("data/modellmatt.json", JSON.stringify(json, null, 1).replace(/\n {2}"/g, ' "').replace(/\n {3}/g, "").replace(/\n {2}\]/g, "]").replace(/\n \}/, " }") + "\n");
JSON.parse(fs.readFileSync("data/modellmatt.json", "utf8"));
console.log(`modellmatt: ${Object.keys(ut).length} entiteter${fel ? `, ${fel} VARNING` : ""}`);
