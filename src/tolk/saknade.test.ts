import assert from "node:assert/strict";
import test from "node:test";
import { franExport, lasLokalt, noteraSaknade, NYCKEL, registrera, rensaLokalt, sammanfoga, tillExport, tillText, type Saknad } from "./saknade.ts";
import { reservFor } from "./reserv.ts";

const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m };
};

test("första gången: ord, grundord, kategori, antal 1, datum", () => {
  const l = registrera([], [reservFor("elefanter", "djur")], "2026-10-18");
  assert.equal(l.length, 1);
  assert.deepEqual({ ...l[0] }, { ord: "elefanter", grund: l[0]!.grund, kategori: l[0]!.kategori, antal: 1, forst: "2026-10-18", sist: "2026-10-18" });
});

test("samma ord igen räknar upp antal och sist, behåller förstadatum", () => {
  let l = registrera([], [reservFor("elefant", "djur")], "2026-10-18");
  l = registrera(l, [reservFor("elefant", "djur")], "2026-10-20");
  assert.equal(l.length, 1);
  assert.equal(l[0]!.antal, 2);
  assert.equal(l[0]!.forst, "2026-10-18");
  assert.equal(l[0]!.sist, "2026-10-20");
});

test("grundord för böjda och sammansatta ord kommer ur reservkedjan", () => {
  assert.equal(reservFor("pizzor", "djur").grund, "pizza");
  assert.equal(reservFor("pizza", "djur").grund, "pizza");
  assert.equal(reservFor("xyzzy", "djur").grund, null);
});

test("bara rena ord sparas: siffror, för korta och för långa ord hoppas över", () => {
  const d = (ord: string) => ({ ...reservFor("elefant", "djur"), ord });
  assert.equal(registrera([], [d("a"), d("ab1"), d("x".repeat(30)), d("ok")], "2026-10-18").map((s) => s.ord).join(), "ok");
});

test("sammanfoga summerar antal och tar tidigaste förstadatum (flera enheter)", () => {
  const a: Saknad[] = [{ ord: "pizza", grund: "pizza", kategori: "mat", antal: 2, forst: "2026-10-20", sist: "2026-10-21" }];
  const b: Saknad[] = [{ ord: "pizza", grund: null, kategori: "mat", antal: 3, forst: "2026-10-18", sist: "2026-10-19" }, { ord: "orm", grund: null, kategori: "djur", antal: 9, forst: "2026-10-19", sist: "2026-10-19" }];
  const s = sammanfoga(a, b);
  assert.deepEqual(s.map((x) => [x.ord, x.antal]), [["orm", 9], ["pizza", 5]]);
  assert.equal(s[1]!.forst, "2026-10-18");
  assert.equal(s[1]!.sist, "2026-10-21");
  assert.equal(s[1]!.grund, "pizza");
});

test("export och import ger samma lista; trasiga rader kastas", () => {
  const l = registrera([], [reservFor("elefant", "djur"), reservFor("pizza", "djur")], "2026-10-18");
  const igen = franExport(tillExport(l, "2026-10-18"));
  assert.deepEqual(igen.map((s) => s.ord).sort(), ["elefant", "pizza"]);
  assert.deepEqual(franExport(JSON.stringify({ ord: [{ ord: "x" }, "skräp", null] })), []);
  assert.ok(tillText(l).includes("× 1"));
});

test("lokal lagring: skapar, läser, rensar; aldrig kast och bara en nyckel", () => {
  const m = mem();
  noteraSaknade([reservFor("elefant", "djur")], m, "2026-10-18");
  noteraSaknade([reservFor("elefant", "djur")], m, "2026-10-19");
  assert.equal(lasLokalt(m)[0]!.antal, 2);
  assert.deepEqual([...m.m.keys()], [NYCKEL]);
  assert.ok(NYCKEL.startsWith("trollpennan"), "Börja om rensar alla nycklar som börjar på trollpennan");
  rensaLokalt(m);
  assert.deepEqual(lasLokalt(m), []);
  m.setItem(NYCKEL, "{trasigt");
  assert.deepEqual(lasLokalt(m), []);
  assert.doesNotThrow(() => noteraSaknade([reservFor("elefant", "djur")], null));
  assert.doesNotThrow(() =>
    noteraSaknade([reservFor("elefant", "djur")], { getItem: () => null, setItem: () => { throw new Error("fullt"); }, removeItem: () => {} }),
  );
});

test("listan hålls under taket", () => {
  let l: Saknad[] = [];
  for (let i = 0; i < 320; i++) l = registrera(l, [{ ...reservFor("elefant", "djur"), ord: "ord" + "abcdefghijklmnopqrstuvxyz"[i % 25]! + "abcdefghijklmnopqrstuvxyz"[Math.floor(i / 25)]! }], "2026-10-18");
  assert.ok(l.length <= 300);
});
