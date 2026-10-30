// V2: samlade menyer, visa_text och aktivt uppdrag. Rör inte befintliga testfiler.
import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import forstaJson from "../../data/forsta-stunden.json" with { type: "json" };

const las = (fil: string) => fs.readFileSync(fil, "utf8");

test("V2: visa_text ligger bredvid oförändrad rösttext", () => {
  const steg = forstaJson.steg;
  const ord = steg.find((s) => s.id === "forsta-ordet");
  const upp = steg.find((s) => s.id === "uppdraget");
  assert.equal(ord?.text, "Tryck på Pennans bok och skriv ett djur!");
  assert.equal(ord?.visa_text, "Tryck på Skriv och skriv ett djur!");
  assert.equal(upp?.text, "Skriv det Doktor Bengtsson ber om i Pennans bok.");
  assert.equal(upp?.visa_text, "Tryck på Skriv och skriv det Doktor Bengtsson ber om!");
});

test("V2: Coach visar visa_text och anmäler fortfarande steg.text", () => {
  const coach = las("src/spel/ui/Coach.tsx");
  assert.match(coach, /visa_text \?\? steg\.steg\.text/);
  assert.match(coach, /const text = steg\?\.steg\.text/);
  assert.match(coach, /rostKo\.anmal\(\{ text/);
});

test("V2 (nya Skapa, fas E): HUD:en har Skriv, Min bok har ljudknappen och inga ikoner är emoji", () => {
  const hud = las("src/spel/ui/Hud.tsx");
  const bok = las("src/spel/ui/MinBok.tsx");
  assert.equal(hud.includes('data-v2="skriv-knapp"'), true);
  assert.equal(bok.includes('data-v2="meny-ljud"'), true);
  assert.equal(hud.includes('data-last="ja"'), false);
  assert.doesNotMatch(hud + bok, /[🪄📋🔒⭐]/u);
});

test("V2: Uppdragsboken har aktivt kort och Lyssna", () => {
  const bok = las("src/spel/ui/skapa/UppdragArk.tsx");
  assert.equal(bok.includes('data-v2="aktivt-uppdrag-kort"'), true);
  assert.equal(bok.includes('data-v2="lyssna-aktivt-uppdrag"'), true);
});

test("V2: För vuxna saknar rundkod och har tvåstegs Börja om", () => {
  const dialog = las("src/spel/ui/ForalderDialog.tsx");
  assert.equal(dialog.includes("(P1–P3)"), false);
  for (const krav of ['data-v2="foralder-borja-om"', 'data-v2="foralder-borja-ja"', 'data-v2="foralder-borja-nej"']) {
    assert.equal(dialog.includes(krav), true, krav);
  }
});
