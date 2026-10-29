// Block 2 (En värld): byggformeln. Nya fraser i data/test-fraser-bygg-form.json; alla gamla byggfraser ska ge
// exakt samma utfall genom tolkaByggFormel som genom tolkaBygg (inga regressioner i Gården).
import assert from "node:assert/strict";
import test from "node:test";
import gamla from "../../data/test-fraser-bygg.json" with { type: "json" };
import nya from "../../data/test-fraser-bygg-form.json" with { type: "json" };
import { tolkaBygg } from "./byggtolk.ts";
import { tolkaByggFormel } from "./byggform.ts";

test("Block 2: minst 60 formfraser tolkas till rätt funktion, form, egenskaper, material och delar", () => {
  assert.ok(nya.fraser.length >= 60);
  for (const rad of nya.fraser) {
    const u = tolkaByggFormel(rad.fras);
    assert.equal(u.typ, "bygge", rad.fras);
    if (u.typ !== "bygge") continue;
    assert.equal(u.formel, rad.formel, rad.fras);
    assert.equal(u.byggen.length, rad.byggen.length, rad.fras);
    rad.byggen.forEach((v, i) => {
      const b = u.byggen[i]!;
      assert.equal(b.bygg, v.bygg, rad.fras);
      assert.equal(b.form ? `${b.form.slag}:${b.form.id}` : null, v.form, rad.fras);
      assert.deepEqual(b.egenskaper, v.egenskaper, rad.fras);
      assert.equal(b.material, v.material, rad.fras);
      assert.deepEqual(Object.fromEntries(b.delar.map((d) => [d.del, d.antal])), v.delar, rad.fras);
    });
  }
});

test("Block 2: alla gamla byggfraser ger samma utfall som förut", () => {
  for (const rad of gamla.fraser) {
    const fore = tolkaBygg(rad.fras);
    const nu = tolkaByggFormel(rad.fras);
    assert.equal(nu.typ, fore.typ, rad.fras);
    if (fore.typ === "bygge" && nu.typ === "bygge") {
      assert.equal(nu.formel, fore.formel, rad.fras);
      assert.deepEqual(
        nu.byggen.map(({ form, egenskaper, ...b }) => {
          assert.equal(form, null, rad.fras);
          assert.deepEqual(egenskaper, [], rad.fras);
          return b;
        }),
        fore.byggen,
        rad.fras,
      );
    }
    if (fore.typ === "forslag" && nu.typ === "forslag") assert.equal(nu.text, fore.text, rad.fras);
  }
});

test("Block 2: felstavad form ger 'Menade du …?', djur ensamt är inget bygge", () => {
  const u = tolkaByggFormel("ett hus som ser ut som en slot");
  assert.equal(u.typ, "forslag");
  if (u.typ === "forslag") assert.equal(u.text, "Menade du slott?");
  assert.equal(tolkaByggFormel("en katt").typ, "inget");
  assert.equal(tolkaByggFormel("en ko som ser ut som ett hus").typ, "inget");
});

test("Block 2: material- och färgsammansättningar blir inte former", () => {
  for (const [fras, material] of [["ett stenhus", "sten"], ["ett isslott", "is"], ["ett godishus", "godis"]] as const) {
    const u = tolkaByggFormel(fras);
    assert.equal(u.typ, "bygge", fras);
    if (u.typ === "bygge") {
      assert.equal(u.byggen[0]!.material, material, fras);
      assert.equal(u.byggen[0]!.form, null, fras);
    }
  }
  const rod = tolkaByggFormel("ett rödhus");
  assert.equal(rod.typ, "forslag");
});
