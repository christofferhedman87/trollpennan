// @ts-nocheck – node:test-fil i ren JS (DOM-attrapper); typerna kontrolleras inte här (R9E).
// R2.1: vakt mot att fingerskrollningen i Pennans bok går sönder igen (se rundor/R2-1-bok-skrollning/RITNING.md).
// Ren textkontroll av CSS-filerna; själva fingerdraget bevisas av rundor/R2-1-bok-skrollning/bok-touch.mjs i en webbläsare.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const css = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const regel = (kalla, valjare) => {
  const i = kalla.indexOf(valjare + "{");
  assert.ok(i >= 0, `regeln ${valjare} saknas`);
  return kalla.slice(i, kalla.indexOf("}", i));
};

test("kort-yta i bok-mitt är ingen egen skrollyta (annars fastnar fingret i den)", () => {
  const r = regel(css, ".bok .bok-mitt .kort-yta");
  assert.match(r, /overflow:visible/);
  assert.match(r, /overscroll-behavior:auto/);
});

test("bok-mitt är bokens skrollyta och flikarna ligger kvar överst", () => {
  assert.match(regel(css, ".bok-mitt"), /overflow:auto/);
  assert.match(regel(css, ".bok .bok-mitt .flikar"), /position:sticky/);
});
