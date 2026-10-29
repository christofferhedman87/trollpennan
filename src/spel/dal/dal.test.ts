import assert from "node:assert/strict";
import test from "node:test";
import { tolkaByggFormel } from "../../tolk/byggform.ts";
import { byggaPaAngen } from "./byggVal.ts";
import { DALEN, TOMTER, klampaMal, ledigTomt, naraTomt, tomtKarta } from "./tomter.ts";

test("Block 1: tomterna ligger utanför ängens mitt, dammen, skyltarna och stigarna och krockar inte", () => {
  assert.ok(TOMTER.length >= 16);
  const r = DALEN.tomt.radie;
  for (const [i, a] of TOMTER.entries()) {
    assert.ok(Math.abs(a.x) >= 3.3, `tomt ${i} för nära ängens mitt`);
    for (const [j, b] of TOMTER.entries()) if (i < j) assert.ok(Math.hypot(a.x - b.x, a.z - b.z) >= 2 * r + 0.2, `tomt ${i} och ${j} krockar`);
  }
  assert.ok(!naraTomt(1.12, -0.35), "dammen");
  assert.ok(!naraTomt(1.45, -2.65) && !naraTomt(-1.45, -2.6), "skyltarna");
});

test("Block 1: gamla byggen får lediga tomter i ordning, ingen tomt används två gånger, flytt behålls", () => {
  const byggen = [{ uid: "a" }, { uid: "b", tomt: 0 }, { uid: "c", tomt: 0 }, { uid: "d", tomt: 99 }];
  const k = tomtKarta(byggen);
  assert.equal(k.get("b"), 0);
  assert.equal(new Set(k.values()).size, 4);
  assert.equal(ledigTomt(byggen), 4);
  assert.equal(ledigTomt(byggen, 7), 7);
  assert.equal(ledigTomt(byggen, 0), 4);
  const fullt = TOMTER.map((_, i) => ({ uid: `x${i}`, tomt: i }));
  assert.equal(ledigTomt(fullt), null);
  assert.equal(tomtKarta([...fullt, { uid: "extra" }]).has("extra"), false);
});

test("Block 1: kamerans mål hålls inom dalen", () => {
  const [x, z] = klampaMal(99, -99);
  assert.equal(x, DALEN.kamera.x[1]);
  assert.equal(z, DALEN.kamera.z[0]);
});

test("Block 1: på ängen blir byggmeningar byggen, djur vinner och små naturord blir saker", () => {
  const ja = ["ett hus", "ett stall som ser ut som ett slott", "en lada", "en blomma av glas", "ett varmt hus åt kaninerna", "ett glittrigt slott"];
  const nej = ["en blomma", "ett träd", "en kanin och ett hus", "en katt", "en kanin med en svamp"];
  for (const f of ja) assert.ok(byggaPaAngen(tolkaByggFormel(f), f), f);
  for (const f of nej) assert.ok(!byggaPaAngen(tolkaByggFormel(f), f), f);
});
