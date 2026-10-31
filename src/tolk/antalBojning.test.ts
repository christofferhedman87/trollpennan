import assert from "node:assert/strict";
import { test } from "node:test";
import prov from "../../data/test-antal-och-bojning.json" with { type: "json" };
import { tolka } from "./tolka.ts";
import { tolkaMedReserv } from "./reserv.ts";
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
  for (const text of ["pistol", "p1st0l", "p i s t o l", "pi 2 stol", "2 pistol", "pistol 2", "en katt med 2 pistoler", "svart 5 kalle", "svart 5 kall", "1 5 1 5", "en katt med svart 5 kalle", "en katt som 1 5 1 5"]) {
    assert.equal(arSparrat(text), true, text);
    assert.equal(tolka(text).typ, "sparr");
  }
});

// Siffror mitt i ord kan skrivas sedan 58aea12. Varje maskering av ett spärrat ord eller en stam ska spärras,
// både med sifferbokstäver (0/1/3/4/5/7) och med siffror som skjuts in, utan att vanliga antal spärras.
const MASK: Record<string, string> = { o: "0", i: "1", e: "3", a: "4", s: "5", t: "7" };
function maskeringar(w: string): string[] {
  const pos = [...w].map((c, i) => (MASK[c] ? i : -1)).filter((i) => i >= 0).slice(0, 8);
  const ut = new Set<string>();
  for (let m = 1; m < 1 << pos.length; m++) {
    const a = [...w];
    pos.forEach((p, b) => { if (m & (1 << b)) a[p] = MASK[a[p]!]!; });
    ut.add(a.join(""));
  }
  for (let i = 1; i < w.length; i++) for (const d of ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "22"]) ut.add(w.slice(0, i) + d + w.slice(i));
  return [...ut];
}

test("T08: siffror mitt i ett ord öppnar aldrig spärren", () => {
  let antal = 0;
  const luckor: string[] = [];
  for (const term of [...BLOCK.ord, ...BLOCK.stammar]) {
    if (!arSparrat(term)) continue;
    for (const v of maskeringar(term.toLocaleLowerCase("sv"))) {
      antal++;
      if (!arSparrat(v) || !arSparrat(`en katt med ${v}`) || tolka(`en katt med ${v}`, { kalla: "skriv" }).typ !== "sparr") luckor.push(v);
    }
  }
  assert.ok(antal > 3000, `för få maskeringar provade: ${antal}`);
  assert.deepEqual(luckor.length, 0, `${luckor.length} maskerade varianter kom förbi spärren`);
  for (let n = 1; n <= 10; n++) {
    for (const s of [`en katt med ${n} hatt`, `en katt med ${n} hattar`, `${n} katter`, `en katt med ${n} röda äpplen`]) assert.equal(arSparrat(s), false, s);
  }
});

// Före 58aea12 tog inmatningen bort alla siffror innan spärren. Det som då spärrades ska fortfarande spärras,
// även när en fristående siffra står mellan två ordhalvor ("pi 0 stol").
test("T08: en fristående siffra mellan ordhalvor öppnar aldrig det som spärrades utan siffror", () => {
  let antal = 0;
  const luckor: string[] = [];
  for (const term of [...BLOCK.ord, ...BLOCK.stammar]) {
    const w = term.toLocaleLowerCase("sv");
    for (let i = 1; i < w.length; i++) {
      const a = w.slice(0, i);
      const b = w.slice(i);
      for (const d of ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "22", "0 0"]) {
        for (const v of [`${a} ${d} ${b}`, `${a}${d} ${b}`, `${a} ${d}${b}`, `en katt med ${a} ${d} ${b}`]) {
          if (!arSparrat(v.replace(/[0-9]/g, ""))) continue;
          antal++;
          if (!arSparrat(v) || tolka(v, { kalla: "skriv" }).typ !== "sparr") luckor.push(v);
        }
      }
    }
  }
  assert.ok(antal > 3000, `för få delade varianter provade: ${antal}`);
  assert.deepEqual(luckor.slice(0, 12), [], `${luckor.length} delade varianter kom förbi spärren`);
});

// Main spärrade sammansättningar som "idiotkatt" när ordet delades i led. En siffra inne i ordet ("idiot2katt")
// får inte göra det till ett okänt ord som kläcks som ägg.
test("T08: en siffra i en sammansättning öppnar aldrig det som spärrades utan siffror", () => {
  let antal = 0;
  const luckor: string[] = [];
  for (const term of [...BLOCK.ord, ...BLOCK.stammar]) {
    const w = term.toLocaleLowerCase("sv");
    for (const djur of ["katt", "hund", "häst", "drake", "fisk", "gris"]) {
      for (let d = 0; d <= 9; d++) {
        for (const v of [`${w}${d}${djur}`, `${djur}${d}${w}`, `en katt med ${w}${d}${djur}`]) {
          if (tolka(v.replace(/[0-9]/g, ""), { kalla: "skriv", noteraBlandning: false }).typ !== "sparr") continue;
          antal++;
          if (tolka(v, { kalla: "skriv", noteraBlandning: false }).typ !== "sparr" || tolkaMedReserv(v, { kalla: "skriv", noteraBlandning: false }).typ !== "sparr") luckor.push(v);
        }
      }
    }
  }
  assert.ok(antal > 3000, `för få sammansättningar provade: ${antal}`);
  assert.deepEqual(luckor.slice(0, 12), [], `${luckor.length} sammansättningar med siffra kom förbi spärren`);
});
