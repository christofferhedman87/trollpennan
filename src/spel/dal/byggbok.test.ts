import assert from "node:assert/strict";
import test from "node:test";
import { tolkaByggFormel } from "../../tolk/byggform.ts";
import { BYGGBOK, START_VAL, byggMening, raFras } from "./byggbok.ts";

test("Block 5: Bygg själv sätter ihop meningen i svensk ordning och böjer rätt", () => {
  assert.equal(byggMening(START_VAL), "ett hus");
  assert.equal(byggMening({ ...START_VAL, farg: "röd" }), "ett rött hus");
  assert.equal(byggMening({ ...START_VAL, funktion: "en lada", farg: "röd" }), "en röd lada");
  assert.equal(
    byggMening({ funktion: "ett stall", form: "ett slott", material: "godis", farg: "rosa", del: "två torn", egenskap: "flygande" }),
    "ett flygande rosa stall av godis som ser ut som ett slott med två torn",
  );
  assert.equal(byggMening({ ...START_VAL, egenskap: "magisk" }), "ett magiskt hus");
});

test("Block 5: varje kombination av kort i Byggboken blir ett bygge", () => {
  for (const [, funktion] of BYGGBOK.funktioner)
    for (const [, form] of [["", null], ...BYGGBOK.former] as [string, string | null][])
      for (const [, material] of [["", null], ...BYGGBOK.material] as [string, string | null][]) {
        const v = { funktion, form, material, farg: "blå", del: "en flagga", egenskap: "lysande" };
        const u = tolkaByggFormel(raFras(v));
        assert.equal(u.typ, "bygge", raFras(v));
      }
  for (const [, del] of BYGGBOK.delar) assert.equal(tolkaByggFormel(raFras({ ...START_VAL, del })).typ, "bygge", del);
  for (const [, egenskap] of BYGGBOK.egenskaper) assert.equal(tolkaByggFormel(raFras({ ...START_VAL, egenskap })).typ, "bygge", egenskap);
  for (const idé of BYGGBOK.ideer) assert.equal(tolkaByggFormel(idé).typ, "bygge", idé);
});
