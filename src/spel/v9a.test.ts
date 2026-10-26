import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { olastaOrd, ordbokKategorier } from "./v9aHjalp.ts";

function las(rel: string) {
  return fs.readFileSync(rel, "utf8");
}

test("V9a album har bild, plats, stäng och ta-bild", () => {
  const s = las("src/spel/samling.tsx");
  for (const a of ["album-bild", "album-plats", "album-stang", "album-ta-bild"]) {
    assert.ok(s.includes(`data-v9a="${a}"`), a);
  }
  assert.ok(s.includes("📸 Ta bild på din skapelse"));
  assert.ok(s.split("\n").length <= 400);
});

test("V9a ordbok visar hittade ord och saknar frågevärgg", () => {
  const s = las("src/spel/ui/OrdbokDialog.tsx");
  for (const a of ["mina-hittade-ord", "ordbok-kategori", "ordbok-ord", "ordbok-stang"]) {
    assert.ok(s.includes(`data-v9a="${a}"`), a);
  }
  assert.ok(s.includes("Mina hittade ord"));
  assert.equal(/className="hemlig"[^>]*>\s*\?\??\s*<\/li>/.test(s), false);
  assert.equal(s.includes('className="hemlig"'), false);
  assert.equal(s.includes('"hemlig"'), false);
  assert.ok(s.split("\n").length <= 400);
});

test("V9a stjärnruta har lyssna, stäng och platshållare", () => {
  const d = las("src/spel/ui/Dialoger.tsx");
  const h = las("src/spel/ui/Hud.tsx");
  for (const a of ["stjarn-ruta", "stjarn-lyssna", "stjarn-stang"]) assert.ok(d.includes(`data-v9a="${a}"`), a);
  assert.ok(h.includes('data-v9a="hud-stjarnor"'));
  assert.ok(h.includes("⭐ {stjarnor}"));
  assert.ok(d.includes("data-testid=\"stjarn-nasta\""));
  assert.ok(d.includes("data-testid=\"stjarn-ordbok\""));
  assert.ok(d.includes("data-dialog-close"));
  assert.ok(d.split("\n").length <= 400);
  const stj = JSON.parse(las("data/stjarnor.json")) as { ger: string[]; gor: string };
  const plats = new Set(stj.ger.flatMap((t) => [...t.matchAll(/\{(\w+)\}/g)].map((m) => m[1])));
  assert.deepEqual([...plats].sort(), ["guld", "hemligt", "onskan", "sida", "uppdrag"]);
  assert.ok(stj.gor.includes("Ordboken"));
});

test("olåsta ord och kategorier räknas utan låsta brickor", () => {
  const tom = olastaOrd([], { kanin: { guld: true }, rod: { guld: false } });
  assert.ok(tom.some((o) => o.id === "kanin" && o.visa === "kanin"));
  const fylld = olastaOrd([{ id: "katt", visa: "katt" }], { kanin: { guld: true } });
  assert.deepEqual(fylld, [{ id: "katt", visa: "katt" }]);
  const kat = ordbokKategorier({ kanin: { guld: true } });
  assert.ok(kat.length >= 4);
  const djur = kat.find((k) => k.namn === "Djur");
  assert.ok(djur && djur.hittat >= 1 && djur.totalt >= djur.hittat);
  assert.ok(kat.every((k) => k.totalt >= k.hittat));
});
