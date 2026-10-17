import assert from "node:assert/strict";
import test from "node:test";
import fraser from "../../data/test-fraser-gavor.json" with { type: "json" };
import { tolkaGava } from "./gavotolk.ts";

type Fras = {
  fras: string;
  formel?: string;
  gavor?: { gava: string; antal: number; farg: string }[];
  forvantat?: string;
  forslag?: string;
};

test("test-fraser-gavor.json", () => {
  for (const f of (fraser as { fraser: Fras[] }).fraser) {
    const u = tolkaGava(f.fras);
    if (f.forvantat?.includes("djur_i_rutan")) {
      assert.equal(u.typ, "djur", f.fras);
      continue;
    }
    if (f.forvantat === "forslag") {
      assert.equal(u.typ, "forslag", f.fras);
      if (u.typ === "forslag") assert.equal(u.forslag, f.forslag, f.fras);
      continue;
    }
    if (f.forvantat?.includes("okant")) {
      assert.equal(u.typ, "okant", f.fras);
      continue;
    }
    assert.equal(u.typ, "gavor", f.fras);
    if (u.typ !== "gavor") continue;
    assert.equal(u.formel, f.formel, f.fras);
    assert.deepEqual(
      u.gavor.map((g) => ({ gava: g.gava, antal: g.antal, farg: g.farg })),
      f.gavor,
      f.fras,
    );
  }
});
