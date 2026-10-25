// V3: luftigt skrivfönster, tre vyflikar och synliga ordkort. Rör inte befintliga testfiler.
import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";

const las = (fil: string) => fs.readFileSync(fil, "utf8");

test("V3: skrivfönstret har tre vyflikar, stäng, ordkort och idéer", () => {
  const bok = las("src/spel/ui/BokSkarm.tsx");
  for (const krav of [
    'data-v3="skapar-vy-flikar"',
    'data-v3="vy-flik-skriv"',
    'data-v3="vy-flik-gata"',
    'data-v3="vy-flik-ideer"',
    'data-v3="bok-stang"',
    'data-v3="ordkort"',
    "skriv-remsa",
    "exempel-chip-",
    'data-v2="aktivt-uppdrag-kort"',
    'data-v2="lyssna-aktivt-uppdrag"',
  ]) {
    assert.equal(bok.includes(krav), true, krav);
  }
});

test("V3: ledtrådsytan kan vara kompakt under Skriv", () => {
  assert.equal(las("src/spel/ui/Ledtradsyta.tsx").includes("kompakt"), true);
});

test("V3: bok-p1 har halvhöjd och hela idéknappar", () => {
  const css = las("src/spel/ui/bok-p1.css");
  assert.equal(css.includes("white-space:normal") || css.includes("white-space: normal"), true);
  assert.equal(css.includes(".bok{"), true);
  assert.equal(css.includes("max-height:66dvh"), true);
});
