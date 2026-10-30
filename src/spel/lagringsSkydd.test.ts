import { test } from "node:test";
import assert from "node:assert/strict";
import { begarBestandigLagring, markeraKopia, senasteKopia, SENASTE_KOPIA } from "./lagringsSkydd.ts";
test("T-14: persist får nekas, saknas eller kasta utan att start/sparvärld påverkas", async () => {
  assert.equal(await begarBestandigLagring(() => ({ persist: async () => true })), "beviljad");
  assert.equal(await begarBestandigLagring(() => ({ persist: async () => false })), "nekad");
  assert.equal(await begarBestandigLagring(() => undefined), "saknas");
  assert.equal(await begarBestandigLagring(() => { throw new Error("getter nekad"); }), "nekad");
  assert.equal(await begarBestandigLagring(() => ({ persist: async () => { throw new Error("nekad"); } })), "nekad");
});
test("T-14: kopiedatum läses efter omladdning och felaktigt/nekad metadata ger inget påhittat datum", () => {
  const data = new Map([["trollpennan-v2", '{"version":2,"stjarnor":17}']]);
  const lokal = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); } };
  assert.equal(senasteKopia(() => lokal), null);
  assert.equal(markeraKopia(() => lokal, 12345), true);
  assert.equal(senasteKopia(() => lokal), 12345);
  assert.equal(data.get("trollpennan-v2"), '{"version":2,"stjarnor":17}');
  for (const raw of ["", "NaN", "Infinity", "-1"]) { data.set(SENASTE_KOPIA, raw); assert.equal(senasteKopia(() => lokal), null); }
  assert.equal(markeraKopia(() => { throw new Error("nekad"); }), false);
  assert.equal(senasteKopia(() => { throw new Error("nekad"); }), null);
});
