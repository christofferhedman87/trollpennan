import assert from "node:assert/strict";
import { test } from "node:test";
import prov from "../../data/test-antal-och-bojning.json" with { type: "json" };
import { tolka } from "./tolka.ts";
import { arSparrat } from "./sparr.ts";
import { BLOCK } from "./data.ts";

for (const p of prov.fraser) test(`T08 antal/böjning: ${p.fras}`, () => {
  const u = tolka(p.fras, { kalla: "kort", noteraBlandning: false });
  assert.equal(u.typ, "skapad"); if (u.typ !== "skapad") return;
  assert.equal(u.antal, p.antal, "tillbehörets antal får inte bli fler huvuddjur");
  assert.equal(u.varelse.formel, p.formel);
  const saker: Record<string, number> = {};
  for (const t of u.varelse.tillbehor) saker[t.id] = (saker[t.id] ?? 0) + (t.antal ?? 1);
  assert.deepEqual(saker, p.saker);
});


test("T08: antal vid ett sekundärt djur får inte flyttas till en efterföljande hatt", () => {
  const u = tolka("en katt med två hundar och en hatt");
  assert.equal(u.typ, "skapad"); if (u.typ !== "skapad") return;
  assert.equal(u.antal, 1); assert.equal(u.varelse.tillbehor.find((t) => t.id === "hatt")?.antal ?? 1, 1);
  // Sekundära djurs egen placering/representation är öppet i C1c; lås inte dess gamla bortfall.
});


for (const djur of ["blåhundar", "drakhundar", "regnbågskatter"]) test(`T08: sekundära ${djur} släpper inte sitt antal till en hatt`, () => {
  const u = tolka(`en katt med två ${djur} och hatt`);
  assert.equal(u.typ, "skapad"); if (u.typ !== "skapad") return;
  assert.equal(u.antal, 1); assert.equal(u.varelse.tillbehor.find((t) => t.id === "hatt")?.antal ?? 1, 1);
});

test("T08: sifferantal gör inte kända, trygga ord till spärrade sammansättningar", () => {
  for (let n = 1; n <= 10; n++) {
    const text = `en katt med ${n} ${n === 1 ? "hatt" : "hattar"}`;
    assert.equal(arSparrat(text), false, text);
    const u = tolka(text, { kalla: "kort" });
    assert.equal(u.typ, "skapad"); if (u.typ !== "skapad") continue;
    assert.equal(u.antal, 1); assert.equal(u.varelse.tillbehor[0]?.antal ?? 1, n);
    assert.equal(u.varelse.formel, text, "barnets skrivna siffra bevaras");
  }
});

test("T08: sifferantal kring spärrade eller maskerade ord öppnar inte spärren", () => {
  for (const ord of [...BLOCK.ord, ...BLOCK.stammar]) for (const n of [1, 2, 6, 10]) {
    assert.equal(arSparrat(`${n} ${ord}`), true);
    assert.equal(arSparrat(`${ord} ${n}`), true);
  }
  for (const text of ["pistol", "p1st0l", "p i s t o l", "pi 2 stol", "2 pistol", "pistol 2", "en katt med 2 pistoler"]) {
    assert.equal(arSparrat(text), true, text);
    assert.equal(tolka(text).typ, "sparr");
  }
});
