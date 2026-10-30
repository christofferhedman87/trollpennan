// Kameran efter introt (2026-10-30): SagaKamera styr bara medan introt pågår, inte tills första djuret finns.
// Webbläsarprovet scripts/prov-kamera-efter-intro.mjs (npm run prov:kamera) drar och zoomar på riktigt.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("Kameran: ingen spärr mellan introts slut och första djuret", () => {
  const saga = fs.readFileSync("src/spel/ang/saga.tsx", "utf8");
  const kamera = saga.slice(saga.indexOf("export function SagaKamera"), saga.indexOf("export function SagaLjus"));
  assert.match(kamera, /const styrd = sagaNu\.aktiv;/);
  assert.doesNotMatch(kamera, /harDjur/);
  assert.ok(fs.existsSync("scripts/prov-kamera-efter-intro.mjs"));
});
