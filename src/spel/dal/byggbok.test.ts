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

test("Block 8: byggönskningar med form och egenskaper uppfylls av rätt meningar, och exemplen fungerar", async () => {
  const { ONSK_BYGG, byggTraff } = await import("../onska.ts");
  const ons = (id: string) => ONSK_BYGG.onskningar.find((o) => o.id === id)!;
  const traff = (fras: string, id: string, kropp?: string) => {
    const u = tolkaByggFormel(fras);
    return u.typ === "bygge" && !!byggTraff(u.byggen, ons(id), kropp);
  };
  assert.ok(traff("ett hus som ser ut som en kanin", "som-jag", "kanin"));
  assert.ok(!traff("ett hus som ser ut som en katt", "som-jag", "kanin"));
  assert.ok(traff("ett flygande hus", "flygande-hus"));
  assert.ok(traff("ett hus med vingar", "flygande-hus"));
  assert.ok(traff("ett hus av moln", "flygande-hus"));
  assert.ok(!traff("ett hus", "flygande-hus"));
  assert.ok(traff("ett slottsstall", "slottsstall"));
  assert.ok(traff("ett hus som ser ut som ett äpple", "frukthus"));
  assert.ok(traff("ett hus som dansar", "dansande-hus"));
  assert.ok(traff("ett magiskt slott", "lysande"));
  for (const o of ONSK_BYGG.onskningar) {
    if (o.krav.hem_for_djuret || o.krav.bara_for) continue;
    for (const ex of o.exempel) assert.ok(traff(ex.replace("{djur}", "en kanin"), o.id, "kanin"), `${o.id}: ${ex}`);
  }
});
