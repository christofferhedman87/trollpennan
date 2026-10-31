import assert from "node:assert/strict";
import { test } from "node:test";
import prov from "../../data/test-antal-och-bojning.json" with { type: "json" };
import { tolka } from "./tolka.ts";

for (const p of prov.fraser) test(`T08 antal/böjning: ${p.fras}`, () => {
  const u = tolka(p.fras, { kalla: "kort", noteraBlandning: false });
  assert.equal(u.typ, "skapad"); if (u.typ !== "skapad") return;
  assert.equal(u.antal, p.antal, "tillbehörets antal får inte bli fler huvuddjur");
  assert.equal(u.varelse.formel, p.formel);
  const saker: Record<string, number> = {};
  for (const t of u.varelse.tillbehor) saker[t.id] = (saker[t.id] ?? 0) + (t.antal ?? 1);
  assert.deepEqual(saker, p.saker);
});
