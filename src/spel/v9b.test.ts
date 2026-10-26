import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { forladdaNarLedig, forladdningsStatus, startaBakgrundsForladdning } from "./modeller/forladda.ts";

const las = (fil: string) => fs.readFileSync(fil, "utf8");
const loop = /for\s*\(const\s+\w+\s+of\s+[^\n]+\)\s*useGLTF\.preload\(/;

test("V9b kön tar unika adresser och startar inte före första bildrutan", () => {
  const url = `/models/v9b-prov-${Date.now()}.glb`;
  const fore = forladdningsStatus();
  assert.equal(fore.forstaBildrutaKlar, false);
  forladdaNarLedig([url, url, "", url]);
  const efter = forladdningsStatus();
  assert.equal(efter.koade, fore.koade + 1);
  assert.equal(efter.startade, fore.startade);
  assert.equal(efter.forstaBildrutaKlar, false);
  assert.equal(typeof startaBakgrundsForladdning, "function");
});

test("V9b källan köar med requestIdleCallback och saknar synkrona preload-loopar", () => {
  const f = las("src/spel/modeller/forladda.ts");
  assert.match(f, /export function forladdaNarLedig/);
  assert.match(f, /requestIdleCallback/);
  assert.match(f, /setTimeout\(steg, 120\)/);
  assert.match(f, /1600/);
  assert.equal(loop.test(las("src/spel/gard/ByggModell.tsx")), false);
  assert.equal(loop.test(las("src/spel/kenneyNatur.tsx")), false);
  assert.equal(loop.test(las("src/spel/gltfDjur.tsx")), false);
  assert.match(las("src/spel/gard/ByggModell.tsx"), /forladdaNarLedig\(FILER\)/);
  assert.match(las("src/spel/kenneyNatur.tsx"), /forladdaNarLedig\(Object\.values\(URL\)\)/);
  assert.match(las("src/spel/gltfDjur.tsx"), /forladdaNarLedig\(forladdaUrls\(\)\)/);
});

test("V9b scenen har adaptiv DPR och stjärnpuffen finns", () => {
  const ang = las("src/spel/angen3d.tsx") + las("src/spel/Scen3D.tsx");
  for (const k of ["AdaptiveDpr", "PerformanceMonitor", "Bvh", "OrbitControls"]) assert.match(ang, new RegExp(k));
  assert.match(ang, /data-v9b-r3f="adaptive-bvh"/);
  assert.match(ang, /startaBakgrundsForladdning\(\)/);
  assert.match(las("src/spel/modeller/StjarnPuffReserv.tsx"), /export function StjarnPuffReserv/);
  assert.match(las("src/spel/modeller/StjarnPuffReserv.tsx"), /export class DjurModellGren/);
  assert.ok(las("src/spel/angen3d.tsx").split("\n").length <= 400);
  assert.ok(las("src/spel/kenneyNatur.tsx").split("\n").length <= 400);
  assert.ok(las("src/spel/gard/ByggModell.tsx").split("\n").length <= 400);
});
