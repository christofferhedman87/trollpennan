// Introts bilder och delningsbilderna (2026-10-30): en bild per fas, stående och liggande, små nog för mobilen.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import introJson from "../../data/intro.json" with { type: "json" };

const las = (fil: string) => fs.readFileSync(fil, "utf8");

/** Bredd och höjd ur en WebP (VP8 eller VP8X) eller JPEG. */
function matt(fil: string): [number, number] {
  const b = fs.readFileSync(fil);
  if (b.subarray(0, 4).toString() === "RIFF") {
    const typ = b.subarray(12, 16).toString();
    if (typ === "VP8X") return [(b[24]! | (b[25]! << 8) | (b[26]! << 16)) + 1, (b[27]! | (b[28]! << 8) | (b[29]! << 16)) + 1];
    if (typ === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    throw new Error(`${fil}: okänt WebP-format ${typ}`);
  }
  for (let i = 2; i < b.length; ) {
    const m = b[i + 1]!;
    if (m >= 0xc0 && m <= 0xc2) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error(`${fil}: hittar inte JPEG-mått`);
}

test("Introt: en bild per fas, stående 1080×1920 och liggande 1920×1080, under 200 kB", () => {
  const faser = new Set(introJson.scener.map((s) => s.fas));
  assert.equal(faser.size, 6);
  for (let n = 1; n <= 6; n++) {
    for (const [lage, w, h] of [["staende", 1080, 1920], ["liggande", 1920, 1080]] as const) {
      const fil = `public/intro/${n}-${lage}.webp`;
      assert.deepEqual(matt(fil), [w, h], fil);
      assert.ok(fs.statSync(fil).size < 200_000, `${fil}: ${fs.statSync(fil).size} byte`);
    }
  }
  for (let n = 1; n <= 6; n++) assert.ok(!fs.existsSync(`public/intro/${n}.jpg`), "de gamla jpg-bilderna är borttagna");
});

test("Introt: bilderna följer scenens fas, tonar över, och zoomen stängs av vid minskad rörelse", () => {
  const tsx = las("src/spel/intro.tsx");
  assert.match(tsx, /n === scen\.fas \? "intro-bild aktiv"/);
  assert.match(tsx, /media="\(orientation: portrait\)" srcSet=\{`\/intro\/\$\{n \+ 1\}-staende\.webp`\}/);
  const css = las("src/spel/intro.css");
  assert.match(css, /@keyframes intro-kenburns/);
  assert.match(css, /prefers-reduced-motion: reduce\)\s*\{\s*\.intro \.intro-bild img \{ animation: none; \}/);
});

test("Delningsbilderna: og.jpg 1200×630 och x-banner.jpg 1200×264", () => {
  assert.deepEqual(matt("public/og.jpg"), [1200, 630]);
  assert.deepEqual(matt("public/x-banner.jpg"), [1200, 264]);
});
