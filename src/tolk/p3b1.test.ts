// P3b-1: sak-ord, spärr och dubbeltydiga ord. Rött före kodändringen.
import assert from "node:assert/strict";
import test from "node:test";
import entiteterJson from "../../data/entiteter.json" with { type: "json" };
import { BLOCK } from "./data.ts";
import { arSparrat } from "./sparr.ts";
import { tolka } from "./tolka.ts";
import type { Utfall } from "./typer.ts";

type Ent = { typ: string; modell: string | null; ord?: string[] };

function skapad(fras: string): Extract<Utfall, { typ: "skapad" }> {
  const u = tolka(fras);
  assert.equal(u.typ, "skapad", `${fras} → ${u.typ}${"text" in u ? " " + u.text : ""}`);
  if (u.typ !== "skapad") throw new Error(fras);
  return u;
}

test("sak-ord och böjningar: varje icke-djur med modell skapas", () => {
  const rader = Object.entries((entiteterJson as { entiteter: Record<string, Ent> }).entiteter).filter(
    ([, e]) => e.typ !== "djur" && !!e.modell,
  );
  assert.ok(rader.length >= 35, `väntade minst 35 saker, fick ${rader.length}`);
  for (const [id, e] of rader) {
    const ord = e.ord?.length ? e.ord : [id];
    for (const w of ord) {
      const fras = `en ${w}`;
      assert.equal(arSparrat(fras), false, fras);
      const u = tolka(fras);
      assert.equal(u.typ, "skapad", `${fras} → ${u.typ}`);
    }
  }
  for (const [fras, kropp] of [
    ["en biff", "biff"],
    ["biffar", "biff"],
    ["en sportbil", "sportbil"],
    ["sportbilen", "sportbil"],
    ["sportbilar", "sportbil"],
    ["en röd sportbil", "sportbil"],
    ["en stor sportbil", "sportbil"],
    ["en ubåt", "ubat"],
    ["en skattkista", "skattkista"],
    ["ett svärd", "svard"],
    ["en grottport", "grottport"],
    ["en röd grottport", "grottport"],
    ["en port", "valv"],
    ["en stor port", "valv"],
    ["porten", "valv"],
  ] as const) {
    assert.equal(arSparrat(fras), false, fras);
    assert.equal(skapad(fras).varelse.kropp, kropp, fras);
  }
});

test("dubbelSak: eld och regnbåge fristående, oförändrat på djur", () => {
  for (const fras of ["en gul eld", "en röd eld", "en stor eld", "en liten eld", "två stora eldar"]) {
    assert.equal(skapad(fras).varelse.kropp, "eld", fras);
  }
  assert.equal(skapad("en gul eld").varelse.farg, "#FDD835");
  assert.equal(skapad("en röd eld").varelse.farg, "#E53935");
  assert.equal(skapad("två stora eldar").antal, 2);
  for (const fras of ["en stor regnbåge", "en röd regnbåge"]) {
    assert.equal(skapad(fras).varelse.kropp, "regnbage", fras);
  }
  const drake = skapad("en drake med eld");
  assert.equal(drake.varelse.kropp, "drake");
  assert.ok(drake.varelse.formagor.includes("flammor"));
  const kanin = skapad("en eldkanin");
  assert.equal(kanin.varelse.kropp, "kanin");
  assert.ok(kanin.varelse.formagor.includes("flammor"));
  const katt = skapad("en katt med regnbåge");
  assert.equal(katt.varelse.kropp, "katt");
  assert.equal(katt.varelse.monster, "regnbåge");
  const komposit = skapad("en regnbågskatt");
  assert.equal(komposit.varelse.kropp, "katt");
  assert.equal(komposit.varelse.monster, "regnbåge");
});

test("jätte är cyklop, jättestor är fortfarande en stor katt", () => {
  for (const fras of ["jätte", "en jätte", "en stor jätte", "en grön jätte", "en jätte med hatt"]) {
    assert.equal(skapad(fras).varelse.kropp, "cyklop", fras);
  }
  assert.equal(skapad("en jätte med hatt").varelse.tillbehor[0]?.id, "hatt");
  for (const fras of ["en jättestor katt", "en jätte stor katt"]) {
    const u = skapad(fras);
    assert.equal(u.varelse.kropp, "katt", fras);
    assert.ok(u.varelse.skala > 1.2, `${fras} skala ${u.varelse.skala}`);
  }
});

test("falska spärrträffar släpps, riktiga spärrord består", () => {
  for (const fras of ["en sportbil", "sportbilen", "sportbilar", "en grottport", "en port", "porten"]) {
    assert.equal(arSparrat(fras), false, fras);
    assert.equal(tolka(fras).typ, "skapad", fras);
  }
  for (const w of [...BLOCK.ord, ...BLOCK.stammar, "dum katt"]) {
    assert.equal(arSparrat(w), true, w);
    assert.equal(tolka(w).typ, "sparr", w);
  }
});

test("trollkarl, trollkvinna och magiker blir trollkarlen", () => {
  // Kroppens id är entiteten trollkarl (modellen). Orden magiker och trollkvinna pekar dit.
  for (const fras of ["en trollkarl", "trollkarlen", "en trollkvinna", "en magiker"]) {
    assert.equal(skapad(fras).varelse.kropp, "trollkarl", fras);
  }
});
