import { test } from "node:test";
import assert from "node:assert/strict";
import { tolka } from "../tolk/tolka.ts";
import texter from "../../data/upplevelse.json" with { type: "json" };
for (const fras of texter.examples) test(`skapandeidé: ${fras}`, () => assert.equal(tolka(fras).typ, "skapad"));
