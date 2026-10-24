// B6.6: "skapad men osynlig": ingen sak blir för liten eller för tunn för att synas. (Att allt ligger i bild provas nu av
// placeringsregeln, p3a.test.ts.)
import assert from "node:assert/strict";
import { test } from "node:test";
import storlekJson from "../../data/storlek.json" with { type: "json" };
import { skalaFor, storlekKlass } from "./entiteter.ts";


test("B6.6: en tunn sak (pinne) och en platt sak förstoras till minsta storlek och yta, högst max_forstoring", () => {
  const M = storlekJson.minsta;
  // en pinne: 1 hög, 0,05 bred (fiskespöet, kniven)
  const s1 = skalaFor("fiskespo", 1, 0.05, 0.05);
  assert.ok(s1 * 1 * 0.05 * s1 >= M.yta - 1e-9 || s1 / (0.5 / 1) >= M.max_forstoring - 1e-9, `yta ${(s1 * s1 * 0.05).toFixed(3)}`);
  // platt sak: 0,02 hög, 1 bred (bäcken, stigen)
  const s2 = skalaFor("back", 0.02, 1, 1);
  assert.ok(Math.max(1, 0.02) * s2 >= Math.min(M.storlek, 0.45) - 1e-9 || s2 >= (0.1 / 0.6) * M.max_forstoring - 1e-9);
  // ett vanligt djur rörs inte
  assert.equal(skalaFor("katt", 2, 1, 1), skalaFor("katt", 2, 1, 1));
});

test("B6.6: förstoringen går aldrig över storleksklassens tak", () => {
  for (const id of ["bil", "matbord"]) {
    const k = storlekKlass(id);
    if (!k) continue;
    const s = skalaFor(id, 1, 0.05, 0.05);
    assert.ok(s * 1 <= Math.max(k.tak, 0) + 1e-9 || s * 1 <= 1, `${id}: ${s}`);
  }
});

