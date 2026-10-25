// P3b-2: GLB-plagg och procedurtillbehör sitter på djurets kropp, inte på marken.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { SkeletonUtils } from "three-stdlib";
import plaggJson from "../../../data/plagg.json" with { type: "json" };
import { ENTITETER, arPlagg, entitet, framVinkel, modellUrl, skalaFor } from "../entiteter.ts";
import type { TillbehorSpec } from "../../tolk/typer.ts";
import { faestPlaggKlon, faestTillbehor } from "./index.ts";

(globalThis as { self?: unknown }).self ??= globalThis;

const DJUR = ["kanin", "katt", "hund", "rav", "häst", "krokodil", "kapybara"] as const;
const HUVUD = ["hatt", "krona", "alvmossa", "haxhatt", "keps"] as const;
const PROC = new Set(["hatt", "krona", "glasögon", "halsduk", "mantel"]);
const PLAGG = plaggJson as { plagg: Record<string, string> };

const cache = new Map<string, THREE.Object3D>();
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
loader.register(() => ({ name: "inga-bilder", loadTexture: () => Promise.resolve(null) }) as never);

function ladda(id: string): Promise<THREE.Object3D> {
  const finns = cache.get(id);
  if (finns) return Promise.resolve(finns);
  const url = modellUrl(id);
  if (!url) return Promise.reject(new Error("saknar modell " + id));
  const b = fs.readFileSync("public" + url);
  return new Promise((res, rej) => {
    loader.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer, "", (g) => {
      cache.set(id, g.scene);
      res(g.scene);
    }, rej);
  });
}

function stall(scen: THREE.Object3D, id: string) {
  const djur = SkeletonUtils.clone(scen);
  djur.updateMatrixWorld(true);
  const b0 = new THREE.Box3().setFromObject(djur);
  const s = skalaFor(id, b0.max.y - b0.min.y, b0.max.x - b0.min.x, b0.max.z - b0.min.z);
  djur.scale.setScalar(s);
  djur.position.set(-((b0.min.x + b0.max.x) / 2) * s, -b0.min.y * s, -((b0.min.z + b0.max.z) / 2) * s);
  const ytter = new THREE.Group();
  ytter.rotation.set(0, framVinkel(entitet(id)?.framAxel), 0);
  ytter.add(djur);
  ytter.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(ytter);
  return { djur, ytter, hojd: box.max.y - box.min.y, bredd: box.max.x - box.min.x };
}

function mat(nod: THREE.Object3D, ytter: THREE.Object3D) {
  ytter.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(nod);
  return { box, c: box.getCenter(new THREE.Vector3()) };
}

async function fast(djur: THREE.Object3D, kropp: string, id: string) {
  if (PROC.has(id)) {
    const spec: TillbehorSpec = { id, farg: null, glans: false };
    faestTillbehor(djur, kropp, [spec], "modell");
    return djur.getObjectByName("tillbehor-" + id) ?? null;
  }
  return faestPlaggKlon(djur, kropp, id, await ladda(id), null);
}

test("P3b-2: alla 38 GLB-plagg är plagg och finns i plagg.json", () => {
  const ids = Object.keys(ENTITETER).filter((id) => ENTITETER[id]?.typ === "tillbehor" && !!modellUrl(id));
  assert.equal(ids.length, 38);
  for (const id of ids) {
    assert.equal(arPlagg(id), true, id);
    assert.ok(PLAGG.plagg[id], id + " saknas i plagg.json");
  }
  assert.equal(arPlagg("kanin"), false);
  assert.equal(arPlagg("hus"), false);
  assert.equal(arPlagg("hink"), false);
});

test("P3b-2: plagg och tillbehör sitter på rätt kroppsdel", async () => {
  const fel: string[] = [];
  const krav = (ok: boolean, m: string) => {
    if (!ok) fel.push(m);
  };
  for (const kropp of DJUR) {
    const scen = await ladda(kropp);
    const kolla = async (id: string, prov: (m: ReturnType<typeof mat>, hojd: number, bredd: number) => void) => {
      const s = stall(scen, kropp);
      const nod = await fast(s.djur, kropp, id);
      if (!nod) {
        fel.push(`${kropp} ${id}: nod saknas`);
        return;
      }
      const m = mat(nod, s.ytter);
      const före = fel.length;
      prov(m, s.hojd, s.bredd);
      if (fel.length > före) return;
    };
    for (const id of HUVUD) {
      await kolla(id, (m, hojd) => {
        krav(m.box.min.y >= 0.45 * hojd && m.box.max.y >= 0.7 * hojd, `${kropp} ${id} huvud min=${(m.box.min.y / hojd).toFixed(2)} max=${(m.box.max.y / hojd).toFixed(2)}`);
      });
    }
    await kolla("glasögon", (m, hojd) => {
      krav(m.c.y >= 0.35 * hojd && m.c.z > 0, `${kropp} glasögon y=${(m.c.y / hojd).toFixed(2)} z=${m.c.z.toFixed(3)}`);
    });
    for (const id of ["halsduk", "halsband", "slips"] as const) {
      await kolla(id, (m, hojd) => {
        krav(m.box.min.y >= 0.2 * hojd, `${kropp} ${id} hals min=${(m.box.min.y / hojd).toFixed(3)}`);
      });
    }
    for (const id of ["mantel", "troja", "jacka", "klanning"] as const) {
      await kolla(id, (m, hojd, bredd) => {
        krav(
          m.box.max.y >= 0.35 * hojd && m.box.min.y >= 0.15 * hojd && Math.abs(m.c.x) < 0.25 * bredd,
          `${kropp} ${id} kropp min=${(m.box.min.y / hojd).toFixed(2)} max=${(m.box.max.y / hojd).toFixed(2)} cx=${(m.c.x / bredd).toFixed(2)}`,
        );
      });
    }
    for (const id of ["stovlar", "sko"] as const) {
      await kolla(id, (m, hojd, bredd) => {
        krav(
          m.box.min.y >= -0.05 * hojd && Math.abs(m.c.x) <= 0.6 * bredd,
          `${kropp} ${id} fot min=${(m.box.min.y / hojd).toFixed(2)} cx=${(m.c.x / bredd).toFixed(2)}`,
        );
      });
    }
  }
  assert.deepEqual(fel, []);
});

test("P3b-2: färg #E53935 sätts på klonens material och lämnar originalet", async () => {
  const scen = await ladda("troja");
  const före = new Map<THREE.Material, string>();
  scen.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const lista = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of lista) {
      if ("color" in m && m.color instanceof THREE.Color) före.set(m, "#" + m.color.getHexString());
    }
  });
  const djur = stall(await ladda("kanin"), "kanin");
  const nod = faestPlaggKlon(djur.djur, "kanin", "troja", scen, "#E53935");
  assert.ok(nod);
  let träff = 0;
  nod!.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const lista = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of lista) {
      if ("color" in m && m.color instanceof THREE.Color) {
        assert.equal("#" + m.color.getHexString(), "#e53935");
        träff++;
      }
    }
  });
  assert.ok(träff > 0, "inget material fick färg");
  for (const [m, hex] of före) {
    assert.equal("#" + (m as THREE.MeshStandardMaterial).color.getHexString(), hex);
  }
});
