// P1: skrivläget är standard. Äldre sparningar (startLage "kort" som standard) flyttas till "skriv",
// men ett aktivt val i föräldravyn (startLageVald) behålls.
import { test } from "node:test";
import assert from "node:assert/strict";
import { franSparning } from "./minne.ts";

test("P1: nytt barn börjar i skrivläget", () => {
  const d = franSparning({});
  assert.equal(d.startLage, "skriv");
  assert.equal(d.startLageVald, false);
});

test("P1: gammal sparning med standard-\"kort\" migreras till skriv", () => {
  assert.equal(franSparning({ version: 2, introSedd: true, startLage: "kort" }).startLage, "skriv");
});

test("P1: förälderns aktiva val av kortläget behålls", () => {
  const d = franSparning({ version: 2, startLage: "kort", startLageVald: true });
  assert.equal(d.startLage, "kort");
  assert.equal(d.startLageVald, true);
});

test("P1: valt skrivläge behålls också", () => {
  assert.equal(franSparning({ version: 2, startLage: "skriv", startLageVald: true }).startLage, "skriv");
});
