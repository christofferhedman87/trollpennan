// R8: data/miljo.json är giltig (hexfärger, dis nära < fjärran, kvalitetsnivåer, marktextur) så att en felskriven rad inte tömmer ängen.
import assert from "node:assert/strict";
import { test } from "node:test";
import miljo from "../../data/miljo.json" with { type: "json" };

const hex = /^#[0-9a-fA-F]{6}$/;
const farger = (o: unknown, ut: string[] = []): string[] => {
  if (typeof o === "string" && o.startsWith("#")) ut.push(o);
  else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) if (!k.startsWith("_")) farger(v, ut);
  return ut;
};

test("miljo.json: alla färger är hex och siffrorna rimliga", () => {
  const alla = farger(miljo);
  assert.ok(alla.length >= 15);
  for (const f of alla) assert.match(f, hex);
  assert.ok(miljo.dis.nara > 0 && miljo.dis.nara < miljo.dis.fjarran && miljo.dis.fjarran <= 90, "dis inom kamerans far (90)");
  assert.ok(miljo.farggrad.mattnad >= 0.8 && miljo.farggrad.mattnad <= 1.4 && miljo.farggrad.kontrast >= 0.8 && miljo.farggrad.kontrast <= 1.3);
  assert.ok(miljo.vinjett.styrka >= 0 && miljo.vinjett.styrka <= 0.5);
  assert.deepEqual(miljo.ljus.nyckel.position.length, 3);
});

test("miljo.json: kvalitetsnivåerna hog och lag finns och lag är billigare", () => {
  const { hog, lag } = miljo.kvalitet;
  assert.ok(lag.skuggkarta <= hog.skuggkarta && lag.dpr_max <= hog.dpr_max);
  for (const k of [hog, lag]) assert.ok([256, 512, 1024, 2048].includes(k.skuggkarta) && k.dpr_max >= 1 && k.dpr_max <= 3);
  assert.ok(miljo.mark.storlek >= 32 && miljo.mark.storlek <= 256 && ["mjuk", "pixel"].includes(miljo.mark.filter));
  assert.ok(miljo.mark.farger.length >= 2);
});
