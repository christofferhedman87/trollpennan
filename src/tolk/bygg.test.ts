import assert from "node:assert/strict";
import test from "node:test";
import fraser from "../../data/test-fraser-bygg.json" with { type: "json" };
import { tolka } from "./tolka.ts";
import { tolkaBygg } from "./byggtolk.ts";

test("test-fraser-bygg.json", () => {
  for (const rad of fraser.fraser) {
    const u = tolkaBygg(rad.fras);
    if ("forvantat" in rad && rad.forvantat === "forslag") {
      assert.equal(u.typ, "forslag", rad.fras);
      if (u.typ !== "forslag") continue;
      if ("text" in rad && rad.text) assert.equal(u.text, rad.text, rad.fras);
      if ("forslag" in rad && rad.forslag) {
        assert.ok(
          u.forslag.some((f) => f.visa === rad.forslag || f.id === rad.forslag),
          `${rad.fras} → ${u.forslag.map((f) => f.visa).join(",")}`,
        );
      }
      continue;
    }
    if ("forvantat" in rad && String(rad.forvantat).startsWith("djur")) {
      assert.equal(u.typ, "inget", rad.fras);
      assert.equal(tolka(rad.fras).typ, "skapad", rad.fras);
      continue;
    }
    assert.equal(u.typ, "bygge", `${rad.fras} → ${u.typ}`);
    if (u.typ !== "bygge") continue;
    assert.equal(u.formel, rad.formel, rad.fras);
    const vantat = rad.byggen ?? [];
    assert.equal(u.byggen.length, vantat.length, rad.fras);
    vantat.forEach((v, i) => {
      const b = u.byggen[i]!;
      assert.equal(b.bygg, v.bygg, rad.fras);
      assert.equal(b.antal, v.antal, rad.fras);
      assert.equal(b.material, v.material, rad.fras);
      const farger = b.adj.filter((a) => a.klass === "farg").map((a) => a.id);
      assert.deepEqual(farger, v.farg, rad.fras);
      const del: Record<string, number> = {};
      for (const d of b.delar) del[d.del] = d.antal;
      assert.deepEqual(del, v.delar, rad.fras);
    });
  }
});
