// R9H: tryck som inte började på duken når inga 2D-djur, osynliga träffar tar inget tryck, stall-listan visar aldrig spärrade ord.
import assert from "node:assert/strict";
import { test } from "node:test";
import block from "../../data/blocklist.json" with { type: "json" };
import ord from "../../data/ord.json" with { type: "json" };
import { tolka } from "../tolk/tolka.ts";
import { paDuken, synligKedja } from "./pekare.ts";

test("R9H: Phaser-tryck räknas bara när det började på Phaser-duken", () => {
  const duk = {};
  assert.equal(paDuken({ downElement: duk, manager: { canvas: duk } }), true);
  assert.equal(paDuken({ downElement: { knapp: "plats-skogen" }, manager: { canvas: duk } }), false, "kartknapp");
  assert.equal(paDuken({ downElement: { tred: true }, manager: { canvas: duk } }), false, "3D-duken ovanpå");
  assert.equal(paDuken({ downElement: undefined, manager: { canvas: duk } }), false);
  assert.equal(paDuken({ downElement: duk, manager: null }), false);
});

test("R9H: bara synliga träffar tar trycket (puff/plask är osynliga)", () => {
  const rot = { visible: true, parent: null };
  const grupp = { visible: true, parent: rot };
  const puff = { visible: false, parent: grupp };
  assert.equal(synligKedja({ visible: true, parent: grupp }), true);
  assert.equal(synligKedja({ visible: true, parent: puff }), false, "barn till osynlig grupp");
  assert.equal(synligKedja(puff), false);
  assert.equal(synligKedja(null), false);
});

const norm = (t: string) => t.toLocaleLowerCase("sv").replace(/[^a-zåäö]/g, "");
const SPARR = new Set((block.ord as string[]).map(norm));

test("R9H: 'en räv' i stallet är 'en räv' (inte ett spärrat ord)", () => {
  const u = tolka("en räv");
  assert.equal(u.typ, "skapad");
  if (u.typ !== "skapad") return;
  assert.equal(u.varelse.formel, "en räv");
  assert.ok(!SPARR.has("räv") && SPARR.has("röv"), "blocklistan har röv men inte räv");
});

test("R9H: stall-listan (formeln) för alla djur i ord.json innehåller aldrig ett ord ur blocklist.json", () => {
  const djur = (ord.ord as { id: string; klass: string; visa: string; genus?: string }[]).filter((o) => o.klass === "djur");
  assert.ok(djur.length > 20, `djur i ord.json: ${djur.length}`);
  const fel: string[] = [];
  for (const d of djur) {
    const u = tolka(`${d.genus === "n" ? "ett" : "en"} ${d.visa}`);
    if (u.typ !== "skapad") continue;
    for (const w of u.varelse.formel.split(/\s+/)) if (SPARR.has(norm(w))) fel.push(`${d.id}: ${u.varelse.formel}`);
  }
  assert.deepEqual(fel, []);
});
