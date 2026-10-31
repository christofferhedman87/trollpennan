import assert from "node:assert/strict";
import { test } from "node:test";
import { tolka } from "./tolka.ts";
import { tolkaMedReserv } from "./reserv.ts";

const fall = [
  ["en katt under ett bord", "bord", "under"],
  ["en katt på en sten", "sten", "på"],
  ["en katt vid en hink", "hink", "vid"],
  ["en katt bredvid ett bord", "bord", "bredvid"],
  ["en katt i en låda", "kartong", "i"],
  ["en kanin med strumpor", "strumpa", "med"],
] as const;

test("T-07/T-08: faktiska relationer, artiklar och plural bevaras i båda tolkarna", () => {
  for (const tolk of [tolka, tolkaMedReserv]) for (const [fras, id, relation] of fall) {
    const u = tolk(fras, { noteraBlandning: false });
    assert.equal(u.typ, "skapad", fras);
    if (u.typ !== "skapad") continue;
    assert.equal(u.varelse.formel, fras, fras);
    assert.equal(u.varelse.kropp, fras.includes("kanin") ? "kanin" : "katt");
    assert.equal(u.varelse.tillbehor.find((t) => t.id === id)?.relation, relation, fras);
    assert.deepEqual(u.okanda, []);
  }
});

test("T-08: med vingar är en ägd del, inte verbfrasen som vingar", () => {
  for (const tolk of [tolka, tolkaMedReserv]) {
    const u = tolk("en kanin med vingar", { noteraBlandning: false });
    assert.equal(u.typ, "skapad");
    if (u.typ !== "skapad") continue;
    assert.equal(u.varelse.formel, "en kanin med vingar");
    assert.ok(u.varelse.formagor.includes("vingar"));
  }
});

test("T-07: flera relationer behåller sitt eget mål", () => {
  const u = tolkaMedReserv("en katt med en hatt under ett bord");
  assert.equal(u.typ, "skapad");
  if (u.typ !== "skapad") return;
  assert.equal(u.varelse.formel, "en katt med en hatt under ett bord");
  assert.deepEqual(u.varelse.tillbehor.map((t) => [t.id, t.relation]), [["hatt", "med"], ["bord", "under"]]);
});
