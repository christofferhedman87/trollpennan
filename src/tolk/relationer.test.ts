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

test("T-08: tillbehörets adjektiv får inte flytta till nästa sak", () => {
  for (const fras of ["en katt med en varm hatt och en filt", "en katt med en varm hatt och en kall filt"]) {
    const u = tolkaMedReserv(fras);
    assert.equal(u.typ, "skapad");
    if (u.typ === "skapad") assert.equal(u.varelse.formel, fras);
  }
});

test("T-07: kända sammansatta tillbehör behåller sin relation och artikel", () => {
  const u = tolkaMedReserv("en katt under en blåhatt");
  assert.equal(u.typ, "skapad");
  if (u.typ !== "skapad") return;
  assert.deepEqual(u.okanda, []);
  assert.equal(u.varelse.formel, "en katt under en blå hatt");
  assert.deepEqual(u.varelse.tillbehor.map((t) => [t.id, t.relation, t.farg]), [["hatt", "under", "#1E88E5"]]);
});


test("T-08: en överhoppad upprepad sak får inte beskriva nästa sak", () => {
  for (const [fras, nastaSak] of [
    ["en katt med en varm filt och en kall filt och ett bord", "ett bord"],
    ["en katt med en hög sten och en låg sten och en hink", "en hink"],
  ]) {
    const u = tolkaMedReserv(fras!);
    assert.equal(u.typ, "skapad");
    if (u.typ === "skapad") assert.ok(u.varelse.formel.endsWith(nastaSak!), "nästa sak får inget av föregående saks adjektiv");
  }
});

test("B1: omvänt placerade föremål behåller läget i båda tolkarna", () => {
  for (const tolk of [tolka, tolkaMedReserv]) for (const [text, relation] of [
    ["en mössa under en kanin", "på"],
    ["en mössa bredvid en kanin", "bredvid"],
    ["en mössa vid en kanin", "vid"],
  ] as const) {
    const u = tolk(text, { noteraBlandning: false });
    assert.equal(u.typ, "skapad", text);
    if (u.typ === "skapad") assert.equal(u.varelse.tillbehor.find((t) => t.id === "alvmossa")?.relation, relation, text);
  }
});

test("B1: en omvänd relation får inte flyttas till ett annat djur", () => {
  for (const text of ["en mössa under en kanin och en katt", "en mössa bredvid en kanin och en katt", "en mössa under en kanin och en kanin"]) {
    const u = tolkaMedReserv(text, { noteraBlandning: false });
    assert.equal(u.typ, "skapad", text);
    if (u.typ === "skapad") {
      assert.equal(u.varelse.kropp, text.endsWith("en katt") ? "katt" : "kanin", text);
      assert.equal(u.varelse.tillbehor.find((t) => t.id === "alvmossa")?.relation, undefined, text);
    }
  }
});

test("B1: omvänd relation behålls även för sammansatt huvuddjur", () => {
  for (const [text, relation] of [["en mössa under en blåkanin", "på"], ["en mössa bredvid en blåkanin", "bredvid"]] as const) {
    const u = tolkaMedReserv(text, { noteraBlandning: false });
    assert.equal(u.typ, "skapad", text);
    if (u.typ === "skapad") assert.equal(u.varelse.tillbehor.find((t) => t.id === "alvmossa")?.relation, relation, text);
  }
});

test("B1: omvänd inneslutning är osäker utan att sparformatet ändras", () => {
  for (const tolk of [tolka, tolkaMedReserv]) {
    for (const text of ["en mössa i en kanin", "en mössa i en blåkanin"]) {
      const u = tolk(text, { noteraBlandning: false });
      assert.equal(u.typ, "skapad", text);
      if (u.typ !== "skapad") continue;
      assert.deepEqual(u.osakraRelationer, [0], text);
      assert.ok(!JSON.stringify(u.varelse).includes("osakraRelationer"), "bedömningens metadata sparas inte i varelse");
    }
    const tydlig = tolk("en kanin i en mössa", { noteraBlandning: false });
    assert.equal(tydlig.typ, "skapad");
    if (tydlig.typ === "skapad") assert.equal(tydlig.osakraRelationer, undefined);
  }
});
