import assert from "node:assert/strict";
import test from "node:test";
import { boLage, somnighet } from "./boende.ts";

const hem = { x: -3.5, z: 0.4 };

test("Block 4: på dagen strövar djuren runt sitt hem, på kvällen går de in genom dörren", () => {
  for (let t = 0; t < 60; t += 3.7) {
    const d = boLage(t, 1, hem, false, 0);
    assert.ok(Math.hypot(d.x - hem.x, d.z - hem.z) < 1.8, "nära hemmet");
    assert.equal(d.skala, 1);
    assert.equal(d.inne, false);
  }
  const kvall = boLage(10, 1, hem, false, 1, 0.6);
  assert.ok(kvall.inne, "inne när kvällen kommit");
  assert.ok(Math.abs(kvall.x - hem.x) < 0.01 && Math.abs(kvall.z - (hem.z + 0.75)) < 0.01, "vid dörren");
  const skymning = boLage(10, 1, hem, false, 0.62, 0.6);
  assert.ok(skymning.skala > 0.5 && !skymning.inne, "på väg hem i skymningen");
});

test("Block 4: i hagen stannar djuren ute och somnar där, inne i stängslet", () => {
  for (let t = 0; t < 60; t += 2.3) {
    const d = boLage(t, 2, hem, true, 0.2);
    assert.ok(Math.hypot(d.x - hem.x, d.z - hem.z) <= 0.6, "inne i hagen");
  }
  assert.ok(boLage(5, 2, hem, true, 1).sover);
  assert.ok(!boLage(5, 2, hem, true, 0).sover);
  assert.equal(somnighet(0), 0);
  assert.equal(somnighet(1), 1);
});
