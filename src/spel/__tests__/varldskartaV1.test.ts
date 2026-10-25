import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import platserJson from "../../../data/platser.json" with { type: "json" };

const IDS = ["ang", "garden", "skogen", "sjon", "grottan"] as const;

const ANKARE = [
  'data-v1="karta-stang"',
  'data-v1="karta-lyssna"',
  'data-v1="varldskarta-stig"',
  'data-v1="plats-ang"',
  'data-v1="plats-illustration"',
  'data-v1="har-ar-du"',
  'data-v1="plats-ordbricka"',
  'data-v1="plats-framsteg"',
  'data-v1="plats-lyssna"',
  'data-testid="karta"',
  'data-testid="plats-garden"',
  'data-testid="karta-text"',
  'data-testid="hem-knapp"',
  'data-testid="byt-folje"',
  "data-testid={`plats-${o.id}`}",
];

test("V1: varldskarta har fem platser med lockelse, röst och tre ordbrickor", () => {
  const vk = platserJson.varldskarta;
  assert.equal(vk.length, 5);
  assert.deepEqual(
    vk.map((p) => p.id),
    [...IDS],
  );
  for (const p of vk) {
    assert.equal(typeof p.lockelse, "string");
    assert.ok(p.lockelse.length > 0, p.id);
    assert.equal(typeof p.rost_text, "string");
    assert.ok(p.rost_text.length > 0, p.id);
    assert.equal(p.ordbrickor.length, 3, p.id);
    for (const b of p.ordbrickor) {
      assert.equal(typeof b.ikon, "string");
      assert.ok(b.ikon.length > 0);
      assert.equal(typeof b.ord, "string");
      assert.ok(b.ord.length > 0);
    }
  }
});

test("V1: KartaLager har V1-ankare och bakåtkompatibla data-testid", () => {
  const kalla = fs.readFileSync("src/spel/ui/KartaLager.tsx", "utf8");
  for (const ankare of ANKARE) assert.ok(kalla.includes(ankare), ankare);
  assert.equal(kalla.split("PLATSER.map((o) =>").length - 1, 1);
  assert.equal(kalla.split("data-testid={`plats-${o.id}`}").length - 1, 1);
});
