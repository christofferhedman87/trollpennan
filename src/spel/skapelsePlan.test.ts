import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { SkeletonUtils } from "three-stdlib";
import { tolkaMedReserv } from "../tolk/reserv.ts";
import type { Varelse } from "../tolk/typer.ts";
import { djurGltfUrl, entitet, framVinkel, modellUrl, skalaFor } from "./entiteter.ts";
import { byggSkapelsePlan, skapelsePlan, type Vektor } from "./skapelsePlan.ts";
import { faestPlaggKlon, faestTillbehor } from "./tillbehor/faest.ts";
import { kladesExemplar } from "./tillbehor/exemplar.ts";
import { kroppMatt, placeraMedMinne } from "./placering.ts";
import type { Sparad } from "./brygga.ts";
import { friHoloYta } from "./ang/holoYta.ts";
import { synligModellRuta } from "./modeller/synligRuta.ts";
import { gorHolo } from "./ang/holoMaterial.ts";

(globalThis as { self?: unknown }).self ??= globalThis;
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
loader.register(() => ({ name: "inga-bilder", loadTexture: () => Promise.resolve(null) }) as never);
const cache = new Map<string, THREE.Object3D>();
async function ladda(id: string, djur = false) {
  const url = (djur ? djurGltfUrl(id) : modellUrl(id))!;
  if (!cache.has(url)) {
    const b = fs.readFileSync("public" + url);
    const g = await new Promise<THREE.Object3D>((res, rej) => loader.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), "", (g) => res(g.scene), rej));
    cache.set(url, g);
  }
  return SkeletonUtils.clone(cache.get(url)!);
}
async function stall(id: string, position: Vektor = [0, 0, 0], skala = 1) {
  const nod = await ladda(id, entitet(id)?.typ === "djur");
  const b = new THREE.Box3().setFromObject(nod), s = b.getSize(new THREE.Vector3());
  const k = skalaFor(id, s.y, s.x, s.z);
  nod.scale.setScalar(k);
  nod.position.set(-(b.min.x + b.max.x) * k / 2, -b.min.y * k, -(b.min.z + b.max.z) * k / 2);
  const g = new THREE.Group(); g.rotation.y = framVinkel(entitet(id)?.framAxel); g.add(nod);
  const ytter = new THREE.Group(); ytter.position.set(...position); ytter.scale.setScalar(skala); ytter.add(g); ytter.updateMatrixWorld(true);
  return { nod, ytter, box: new THREE.Box3().setFromObject(ytter) };
}
function varelse(text: string): Varelse {
  const u = tolkaMedReserv(text, { kalla: "kort" }); assert.equal(u.typ, "skapad");
  return (u as { varelse: Varelse }).varelse;
}
const sparad = (v: Varelse): Sparad => ({ ...v, uid: "c1c-prov", skapad: 1 });

test("Relationen under: hela katten ryms under den verkliga bordsskivan", async () => {
  const v = varelse("en katt under ett bord"), p = skapelsePlan(v), d = p.saker[0]!;
  const katt = await stall(v.kropp, p.kropp), bord = await stall(d.t.id, d.position, d.skala);
  assert.ok(katt.box.max.y < bord.box.max.y - 0.06);
  assert.ok(katt.box.min.x > bord.box.min.x && katt.box.max.x < bord.box.max.x);
  assert.ok(katt.box.min.z > bord.box.min.z && katt.box.max.z < bord.box.max.z);
  const ray = new THREE.Raycaster(new THREE.Vector3(0, katt.box.max.y, 0), new THREE.Vector3(0, 1, 0));
  const traff = ray.intersectObject(bord.ytter, true);
  assert.ok(traff.length > 0 && traff[0]!.distance > 0, "en verklig bordsskiva finns ovanför huvudet");
});

test("Relationen på: tassarna landar på den verkliga stenens överkant", async () => {
  const v = varelse("en katt på en sten"), p = skapelsePlan(v), d = p.saker[0]!;
  const katt = await stall(v.kropp, p.kropp), sten = await stall(d.t.id, d.position, d.skala);
  assert.ok(Math.abs(katt.box.min.y - sten.box.max.y - 0.02) < 0.005);
});

test("Relationen i: hela kroppen ligger inom lådans verkliga gränser", async () => {
  const v = varelse("en katt i en låda"), p = skapelsePlan(v), d = p.saker[0]!;
  const katt = await stall(v.kropp, p.kropp), lada = await stall(d.t.id, d.position, d.skala);
  for (const axel of ["x", "y", "z"] as const) assert.ok(katt.box.min[axel] > lada.box.min[axel] && katt.box.max[axel] < lada.box.max[axel]);
  assert.ok(d.alpha > 0 && d.alpha < 1, "kroppen går att se i en sluten modell");
});

test("Med, vid och bredvid ger skilda föremål och egen färg per exemplar", async () => {
  for (const rel of ["med", "vid", "bredvid"]) {
    const v = varelse(`en katt ${rel} två röda äpplen`), p = skapelsePlan(v);
    assert.equal(p.saker.length, 2);
    const katt = await stall(v.kropp, p.kropp);
    for (const d of p.saker) {
      const sak = await stall(d.t.id, d.position, d.skala);
      assert.ok(sak.box.min.x > katt.box.max.x || sak.box.max.x < katt.box.min.x);
      assert.equal(d.t.farg, "#E53935");
    }
    assert.notDeepEqual(p.saker[0]!.position, p.saker[1]!.position);
  }
});

test("Äldre v2 behåller med och implicit första plattform utan mutation", () => {
  const v = varelse("en katt med en sten"); delete v.tillbehor[0]!.relation;
  const fore = JSON.stringify(v); assert.ok(byggSkapelsePlan(v).kropp[1] > 0); assert.equal(JSON.stringify(v), fore);
  assert.equal(byggSkapelsePlan(varelse("en katt med en sten")).kropp[1], 0, "uttryckligt med betyder bredvid");
});

test("Två GLB-strumpor har skilda fästpunkter och lämnar originalmodellen orörd", async () => {
  const v = varelse("en kanin med två strumpor"), djur = await stall(v.kropp), scen = await ladda("strumpa");
  const fore = new THREE.Box3().setFromObject(scen).toJSON();
  const noder = kladesExemplar(v.tillbehor, v.kropp).map(({ t, index, antal }) => faestPlaggKlon(djur.nod, v.kropp, t.id, scen, t.farg, { index, antal, bevara: true })!);
  assert.equal(noder.length, 2); djur.ytter.updateMatrixWorld(true);
  const a = new THREE.Box3().setFromObject(noder[0]!), b = new THREE.Box3().setFromObject(noder[1]!);
  assert.ok(Math.abs(a.getCenter(new THREE.Vector3()).x - b.getCenter(new THREE.Vector3()).x) > 0.03);
  assert.deepEqual(new THREE.Box3().setFromObject(scen).toJSON(), fore);
});

test("Upprepade procedurhattar ersätter inte varandra", async () => {
  const v = varelse("en katt med två hattar"), djur = await stall(v.kropp);
  faestTillbehor(djur.nod, v.kropp, v.tillbehor, "modell");
  const noder: THREE.Object3D[] = []; djur.nod.traverse((n) => { if (n.name === "tillbehor-hatt") noder.push(n); });
  assert.equal(noder.length, 2); assert.notEqual(noder[0]!.position.y, noder[1]!.position.y);
});

test("Placeringsrutan omfattar föremålen och cachen följer ändrat antal/relation", () => {
  const v = sparad(varelse("en katt med två äpplen")), fore = JSON.stringify(v);
  const m = kroppMatt(v, 0), p = skapelsePlan(v), k = m.f * v.skala;
  assert.ok(m.halv >= Math.max(-p.ruta.min[0], p.ruta.max[0]) * k - 1e-8);
  const a = placeraMedMinne([v]);
  const annan = { ...v, tillbehor: [{ ...v.tillbehor[0]!, relation: "under" as const, antal: 1 }] };
  const b = placeraMedMinne([annan]); assert.notEqual(a, b);
  assert.equal(JSON.stringify(v), fore);
});

test("Varje under-exemplar och ett blandat på/under följer relationen", async () => {
  for (const text of ["en katt under två bord", "en katt på en sten och under ett bord"]) {
    const v = varelse(text), p = skapelsePlan(v), katt = await stall(v.kropp, p.kropp);
    for (const d of p.saker.filter((s) => s.t.relation === "under")) {
      const bord = await stall(d.t.id, d.position, d.skala);
      assert.ok(katt.box.max.y < bord.box.max.y - 0.06, text);
      assert.ok(katt.box.min.x > bord.box.min.x && katt.box.max.x < bord.box.max.x, text);
      assert.ok(katt.box.min.z > bord.box.min.z && katt.box.max.z < bord.box.max.z, text);
    }
  }
});

test("Alla i-behållare omsluter kroppen och flera på-saker blir ett stöd", async () => {
  const v = varelse("en katt i två lådor"), p = skapelsePlan(v), katt = await stall(v.kropp, p.kropp);
  assert.equal(p.saker.length, 2);
  for (const d of p.saker) {
    const lada = await stall(d.t.id, d.position, d.skala);
    for (const axel of ["x", "y", "z"] as const) assert.ok(katt.box.min[axel] > lada.box.min[axel] && katt.box.max[axel] < lada.box.max[axel]);
  }
  const pa = skapelsePlan(varelse("en katt på två stenar"));
  assert.equal(pa.saker.length, 2);
  for (const d of pa.saker) assert.ok(pa.kropp[1] >= (await stall(d.t.id, d.position, d.skala)).box.max.y);
});

test("Legacy-plattformen följer första fria saken även efter ett plagg", () => {
  const v = varelse("en katt med en hatt och en sten");
  for (const t of v.tillbehor) delete t.relation;
  assert.ok(skapelsePlan(v).kropp[1] > 0);
});

test("Fria saker står kvar på marken även när kroppen står på/i en sak", () => {
  for (const text of ["en katt på en sten med en boll", "en katt i en låda bredvid ett äpple"]) {
    const p = skapelsePlan(varelse(text));
    assert.ok(p.kropp[1] > 0);
    assert.equal(p.saker.at(-1)!.position[1], 0);
  }
});

test("Hologrammet använder ytan ovanför låga kontroller och Ängens liggande yta", () => {
  const p = friHoloYta({ left: 8, right: 367, top: 90, bottom: 353.5 }, [
    { left: 187.594, right: 363, top: 313.5, bottom: 397.5 },
    { left: 14, right: 62, top: 339.5, bottom: 387.5 },
    { left: 72, right: 145.906, top: 341.5, bottom: 385.5 },
  ]);
  assert.deepEqual(p, { left: 8, right: 367, top: 90, bottom: 305.5 });
  const l = friHoloYta({ left: 8, right: 244, top: 90, bottom: 367 }, [
    { left: 12, right: 116, top: 12, bottom: 104 },
  ]);
  assert.ok(l && l.left === 8 && l.right === 244 && l.top >= 112 && l.bottom === 367);
});

test("Skinnade modellmått följer aktuell skala utan minne av förra bildrutan", async () => {
  const djur = await stall("fisk");
  let skinn = 0; djur.ytter.traverse((n) => { if (n instanceof THREE.SkinnedMesh) skinn++; });
  assert.ok(skinn > 0, "provet använder en verkligt skinnad modell");
  const fore = synligModellRuta(djur.ytter).getSize(new THREE.Vector3());
  assert.ok(fore.length() > 0.1, "provet mäter den synliga fisken");
  djur.ytter.scale.setScalar(0.1);
  const liten = synligModellRuta(djur.ytter).getSize(new THREE.Vector3());
  for (const axel of ["x", "y", "z"] as const) assert.ok(Math.abs(liten[axel] - fore[axel] * 0.1) < 0.001, axel);
  djur.ytter.updateMatrixWorld(true); // renderersteget mellan två bildrutor
  djur.ytter.scale.setScalar(1);
  const ater = synligModellRuta(djur.ytter).getSize(new THREE.Vector3());
  assert.ok(ater.distanceTo(fore) < 0.001);
});

test("Opak GLB med opacity=0 syns även som hologram; avsiktlig transparens bevaras", () => {
  for (const [transparent, opacity, vantat] of [[false, 0, 1], [true, 0.4, 0.4], [true, 0, 0]] as const) {
    const m = new THREE.MeshStandardMaterial({ transparent, opacity });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), m), rot = new THREE.Group(); rot.add(mesh);
    gorHolo(rot, { value: 0 });
    assert.equal(mesh.material.opacity, vantat); assert.equal(m.opacity, opacity);
    assert.notEqual(mesh.material, m);
  }
});

test("Flera verkliga hattar ligger inom hela placeringsrutan", async () => {
  for (const [antal, fras] of [[2, "två hattar"], [10, "tio hattar"], [2, "två lila hattar"]] as const) {
    const v = varelse(`en katt med ${fras}`), p = skapelsePlan(v), djur = await stall(v.kropp);
    faestTillbehor(djur.nod, v.kropp, v.tillbehor, "modell"); djur.ytter.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(djur.ytter);
    for (const [i, axel] of ["x", "y", "z"].entries()) {
      assert.ok(b.min[axel as "x"] >= p.ruta.min[i]! - 0.005, `${antal} hattar min ${axel}`);
      assert.ok(b.max[axel as "x"] <= p.ruta.max[i]! + 0.005, `${antal} hattar max ${axel}`);
    }
    assert.ok(kroppMatt(sparad(v), 0).hojd >= b.max.y - b.min.y);
  }
});
