// P3a (Arkitekten 20:40): placeringsregelns förutsagda skärmruta stämmer med det som ritas. Modellen laddas som i spelet
// (GLB, GLTFLoader, skalaFor, mitten på platsen och botten på marken, framAxel-vridningen, takSkala × ritSkala) och dess
// Box3 projiceras med en riktig three-kamera i platsens läge – samma sätt som window.__tredSyn mäter i webbläsaren.
// Regelns ruta (kroppMatt + sakRuta, utan vandring och vridning) ska ligga inom några px. Dessutom: regelns
// projektion (skarm.ts) är samma som three-kamerans, för ängens kamera och de andra platsernas (PlatsDekor maxDistance).
import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { ENTITETER, framVinkel, skalaFor, takSkala } from "./entiteter.ts";
import { kameraFor, kroppMatt, PLACERING } from "./placering.ts";
import { platsMed, START_PLATS } from "./platser.ts";
import { KAMERA_ANG, KAMERA_PLATS, projicera, type Kamera } from "./skarm.ts";
import { sakRuta } from "./skymning.ts";
import tillgangar from "../../data/tillgangar.json" with { type: "json" };

(globalThis as { self?: unknown }).self ??= globalThis;
const TILL = (tillgangar as unknown as { tillgangar: Record<string, { fil?: string }> }).tillgangar;
const PX = PLACERING.matfel_px ?? 3; // = placeringsregelns mätfel (data/placering.json matfel_px); tillåtet fel per kant (px): avrundning och meshar som ligger snett i modellen

function threeKamera(P: Kamera): THREE.PerspectiveCamera {
  const c = new THREE.PerspectiveCamera(58, 375 / 812, 0.1, 90);
  c.position.set(P[0], P[1], P[2]);
  c.lookAt(0, 1.05, -0.15);
  c.updateMatrixWorld(true);
  return c;
}
function projBox(b: THREE.Box3, c: THREE.Camera) {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  const p = new THREE.Vector3();
  for (let i = 0; i < 8; i++) {
    p.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).project(c);
    const [sx, sy] = [((p.x + 1) / 2) * 375, ((1 - p.y) / 2) * 812];
    [x0, y0, x1, y1] = [Math.min(x0, sx), Math.min(y0, sy), Math.max(x1, sx), Math.max(y1, sy)];
  }
  return { x0, y0, x1, y1 };
}
async function laddaModell(kropp: string): Promise<THREE.Object3D> {
  const e = ENTITETER[kropp]!;
  const fil = TILL[e.modell!]!.fil!;
  const L = new GLTFLoader();
  L.setMeshoptDecoder(MeshoptDecoder);
  L.register(() => ({ name: "inga-bilder", loadTexture: () => Promise.resolve(null) }) as never);
  const b = fs.readFileSync(`public${fil}`);
  const g = await new Promise<{ scene: THREE.Object3D }>((res, rej) => L.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer, "", res as never, rej));
  return g.scene;
}

test("P3a: regelns projektion (skarm.ts) = three-kamerans, på ängen och på de andra platserna (≤ 0,5 px)", () => {
  for (const P of [KAMERA_ANG, KAMERA_PLATS]) {
    const c = threeKamera(P);
    for (const [x, y, z] of [[0, 0, 0], [-2.5, 0, -5], [2, 1.5, 3], [1, 0, -1.95], [-1.5, 2.2, 4]] as const) {
      const v = new THREE.Vector3(x, y, z).project(c);
      const [sx, sy] = projicera(x, y, z, P);
      assert.ok(Math.abs(((v.x + 1) / 2) * 375 - sx) < 0.5 && Math.abs(((1 - v.y) / 2) * 812 - sy) < 0.5, `${P} (${x}, ${y}, ${z})`);
    }
  }
  assert.deepEqual(kameraFor(platsMed(START_PLATS)), KAMERA_ANG);
  assert.deepEqual(kameraFor(platsMed("sjon")), KAMERA_PLATS);
  // PlatsDekor håller kameran på samma avstånd som regeln räknar med
  assert.match(fs.readFileSync("src/spel/ang/PlatsDekor.tsx", "utf8"), /maxDistance=\{PLATS_MAX_AVSTAND\}/);
});

test(`P3a: regelns ruta = den ritade modellens Box3 genom kameran, inom ${PX} px per kant (urval modeller, djup och platser)`, async () => {
  const urval = ["katt", "ko", "spinosaurus", "manniska", "fjallrav", "monsterkatt", "hast", "häst", "hage", "kniv", "slott", "valfisk", "pepparkaka"].filter((k) => ENTITETER[k]?.modell && TILL[ENTITETER[k]!.modell!]?.fil);
  assert.ok(urval.length >= 10, `urval ${urval.length}`);
  const fel: string[] = [];
  for (const kropp of urval) {
    const scen = await laddaModell(kropp);
    scen.updateMatrixWorld(true);
    const box0 = new THREE.Box3().setFromObject(scen);
    const s = skalaFor(kropp, box0.max.y - box0.min.y, box0.max.x - box0.min.x, box0.max.z - box0.min.z);
    for (const [platsId, x, z] of [[START_PLATS, 0, 1.5], [START_PLATS, -1.2, -1.95], ["sjon", 1, 2.5], ["skogen", -1.5, -5]] as const) {
      const plats = platsMed(platsId)!;
      const d = { kropp, skala: 1 };
      const m = kroppMatt(d, z, plats, "mark", 0);
      const k = takSkala(kropp, 1) * m.f;
      // som gltfDjur: skala s, mitten på platsen och botten på marken, framAxel-vridning; djur.tsx: takSkala × ritSkala
      const klon = scen.clone(true);
      klon.scale.setScalar(s);
      klon.position.set(-((box0.min.x + box0.max.x) / 2) * s, -box0.min.y * s, -((box0.min.z + box0.max.z) / 2) * s);
      const fram = new THREE.Group();
      fram.rotation.y = framVinkel(ENTITETER[kropp]?.framAxel);
      fram.add(klon);
      const yttre = new THREE.Group();
      yttre.position.set(x, 0, z);
      yttre.scale.setScalar(k);
      yttre.add(fram);
      yttre.updateMatrixWorld(true);
      const ritad = projBox(new THREE.Box3().setFromObject(yttre), threeKamera(kameraFor(plats)));
      const regel = sakRuta(x, z, m.halv, m.hojd, m.djup, m.y0, kameraFor(plats));
      // djur guppar ±0,04 (räknat i regeln): ta bort det ur regelns ruta innan jämförelsen
      const bob = ENTITETER[kropp]?.typ === "djur" ? 0.04 : 0;
      const regelUtanBob = sakRuta(x, z, m.halv, m.hojd - 2 * bob, m.djup, m.y0 + bob, kameraFor(plats));
      const d4 = [regelUtanBob.x0 - ritad.x0, regelUtanBob.y0 - ritad.y0, regelUtanBob.x1 - ritad.x1, regelUtanBob.y1 - ritad.y1];
      if (d4.some((v) => Math.abs(v) > PX)) fel.push(`${kropp} ${platsId} z ${z}: ${d4.map((v) => v.toFixed(1)).join(", ")} (regel ${[regel.x0, regel.y0, regel.x1, regel.y1].map(Math.round)})`);
    }
  }
  assert.deepEqual(fel, []);
});
