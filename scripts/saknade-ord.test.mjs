import assert from "node:assert/strict";
import test from "node:test";
import { arOrd, bestallning, lasExport, sammanfoga, spärradeOrd, taktaOrd } from "./saknade-ord.mjs";

const rad = (ord, antal, extra = {}) => ({ ord, grund: null, kategori: "okant", antal, forst: "2026-10-18", sist: "2026-10-18", ...extra });

test("sammanfoga: antal summeras, tidigaste/senaste datum, sorterat på antal", () => {
  const l = sammanfoga([rad("elefant", 2, { forst: "2026-10-19", sist: "2026-10-20" })], [rad("elefant", 3, { forst: "2026-10-18", sist: "2026-10-19", kategori: "djur" }), rad("pizza", 9)]);
  assert.deepEqual(l.map((s) => [s.ord, s.antal]), [["pizza", 9], ["elefant", 5]]);
  const e = l.find((s) => s.ord === "elefant");
  assert.equal(e.forst, "2026-10-18");
  assert.equal(e.sist, "2026-10-20");
  assert.equal(e.kategori, "djur");
});

test("lasExport tar bara välformade rader och släpper spärrade ord", () => {
  const text = JSON.stringify({ version: 1, ord: [rad("elefant", 1), { ord: "Fel Ord!", antal: 1 }, rad("fan", 1)] });
  const r = lasExport(text, spärradeOrd({ ord: ["fan"] }));
  assert.deepEqual(r.ok.map((s) => s.ord), ["elefant"]);
  assert.deepEqual(r.avvisade.map((a) => a.skal).sort(), ["fel format", "spärrat ord"]);
});

test("en rad får aldrig bära mer än ord, grundord, kategori, antal och datum", () => {
  const r = lasExport(JSON.stringify({ ord: [{ ...rad("elefant", 1), mening: "min kanin heter Eva", djur: "kanin" }] }));
  assert.deepEqual(Object.keys(r.ok[0]).sort(), ["antal", "forst", "grund", "kategori", "ord", "sist"]);
  assert.equal(arOrd(rad("a", 1)), false);
});

test("beställningen: tabell sorterad på antal, täckta och ignorerade tas bort, tom lista ger tydlig text", () => {
  const lista = sammanfoga([rad("elefant", 5), rad("pizza", 9, { kategori: "mat", grund: "pizza" }), rad("zebra", 2), rad("spöke", 1, { status: "ignorerad" })]);
  const text = bestallning(lista, { datum: "2026-10-18", takta: taktaOrd({ entiteter: { zebra: {} } }) });
  assert.match(text, /Ord att hitta modell till \(2\)/);
  assert.ok(text.indexOf("**pizza**") < text.indexOf("**elefant**"));
  assert.doesNotMatch(text, /\*\*spöke\*\*/);
  assert.match(text, /Redan täckta \(1, behöver inget\)\n\nzebra/);
  const g = bestallning(sammanfoga([rad("pizzor", 2, { grund: "pizza", kategori: "mat" }), rad("pizza", 3, { grund: "pizza", kategori: "mat" })]), { datum: "2026-10-18" });
  assert.match(g, /Ord att hitta modell till \(1\)/);
  assert.match(g, /\| 1 \| \*\*pizza\*\* \| pizzor \| mat \| 5 \|/);
  assert.match(bestallning([], { datum: "2026-10-18" }), /Inga ord ännu/);
  assert.match(text, /Bara \*\*CC0-1\.0\*\*/);
});
