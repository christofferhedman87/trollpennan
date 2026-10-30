// V3: luftigt skrivfönster, tre vyflikar och synliga ordkort. Rör inte befintliga testfiler.
import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";

const las = (fil: string) => fs.readFileSync(fil, "utf8");

// Nya Skapa (docs/skapa/SPEC-skapa.md 9.7): flikarna Ordkort/Stava själv/Idé är ersatta av skriv först + Ordhjälp.
test("V3 (nya Skapa): boken öppnar med tangenterna, Ordhjälpen har frågeflikar och Idé finns i hjälpraden", () => {
  const ark = las("src/spel/ui/skapa/SkapaArk.tsx");
  const hjalp = las("src/spel/ui/skapa/Ordhjalp.tsx");
  const rad = las("src/spel/ui/skapa/Hjalprad.tsx");
  assert.match(ark, /vy === "skriv" \?/);
  assert.match(ark, /<Tangenter /);
  assert.match(ark, /data-v3="bok-stang"/);
  assert.match(hjalp, /role="tablist"/);
  assert.match(hjalp, /data-flik=\{f\.id\}/);
  assert.match(rad, /data-dal="ide"/);
  assert.match(rad, /data-dal="ordhjalp"/);
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
