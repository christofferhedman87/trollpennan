// Parallaxlagren (2026-10-30): bilderna, deras mått, att ytorna täcker största panorering och att de gamla
// kull- och bergmodellerna är borta. Skärmbilderna (rosa kanter, skarvar, höjder) granskas med ögonen i rundan.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { ATLAS_LUFT, LAGER, PARALLAX_FAR, atlasRader, parallaxUrl, synligHalvbredd, upprepning } from "./ang/parallaxLager.ts";
import MATT from "./ang/parallaxLager.json" with { type: "json" };
import DALEN from "../../data/dalen.json" with { type: "json" };

const las = (fil: string) => fs.readFileSync(fil, "utf8");

/** Bredd och höjd ur en WebP:s VP8X-huvud (utökat format, som alltid används när bilden har alfa). */
function webpMatt(fil: string): { bredd: number; hojd: number; alfa: boolean } {
  const b = fs.readFileSync(fil);
  assert.equal(b.subarray(0, 4).toString(), "RIFF");
  assert.equal(b.subarray(8, 12).toString(), "WEBP");
  assert.equal(b.subarray(12, 16).toString(), "VP8X", `${fil} saknar alfa (VP8X)`);
  const tal24 = (o: number) => b[o]! | (b[o + 1]! << 8) | (b[o + 2]! << 16);
  return { bredd: tal24(24) + 1, hojd: tal24(27) + 1, alfa: (b[20]! & 0x10) !== 0 };
}

test("Parallax: tre WebP med alfa, högst 2048 px breda, under 300 kB, mått som i parallaxLager.json", () => {
  for (const l of LAGER) {
    const fil = `public${parallaxUrl(l.namn)}`;
    const m = webpMatt(fil);
    assert.ok(m.alfa, `${l.namn}: alfa`);
    assert.ok(m.bredd <= 2048, `${l.namn}: ${m.bredd} px`);
    assert.deepEqual({ bredd: m.bredd, hojd: m.hojd }, MATT[l.namn], `${l.namn}: kör scripts/parallax-lager.py igen`);
    assert.ok(fs.statSync(fil).size < 300_000, `${l.namn}: ${fs.statSync(fil).size} byte`);
    assert.ok(fs.existsSync(`kallfiler/parallax/${l.namn}.png`), `${l.namn}: originalet ska finnas kvar utanför bygget`);
  }
});

test("Parallax: längst bort ritas först, bergen högst och trädraden närmast", () => {
  const z = LAGER.map((l) => l.z);
  assert.deepEqual([...z].sort((a, b) => a - b), z, "ordningen i LAGER är ritordningen");
  const [berg, kullar, tradrad] = LAGER;
  assert.ok(berg!.botten + berg!.hojd > kullar!.botten + kullar!.hojd, "bergen når högst");
  assert.ok(tradrad!.botten < 0 && tradrad!.fot > 0, "trädradens gräsremsa står i marken och tonas ut");
});

test("Parallax: ytorna täcker största panorering och utzoomning, även i liggande läge", () => {
  // Värsta läget: målet längst åt sidan och längst fram, kameran längst bort, liggande 812×375 (fov 58° lodrätt).
  const kamX = Math.max(...DALEN.kamera.x.map(Math.abs));
  const kamZ = Math.max(...DALEN.kamera.z) + DALEN.kamera.avstand[1];
  const hfov = (2 * Math.atan(Math.tan(((58 / 2) * Math.PI) / 180) * (812 / 375)) * 180) / Math.PI;
  for (const l of LAGER) {
    const behov = synligHalvbredd(l, kamX, kamZ, hfov);
    assert.ok(l.bredd / 2 >= behov, `${l.namn}: halva bredden ${l.bredd / 2} < ${behov.toFixed(1)}`);
    const horn = Math.hypot(l.bredd / 2 + kamX, kamZ - l.z);
    assert.ok(horn < PARALLAX_FAR, `${l.namn}: hörnet (${horn.toFixed(0)}) klipps av kamerans far`);
  }
});

test("Parallax: bildens mitt står mitt i dalen och upprepningen speglas", () => {
  for (const l of LAGER) {
    const { gangar, start } = upprepning(l);
    assert.ok(gangar > 1, `${l.namn}: ytan är bredare än en bild`);
    assert.ok(Math.abs(start + gangar / 2 - (0.5 - l.skift)) < 1e-9, `${l.namn}: x = 0 ska visa bildens mitt (plus skift)`);
  }
  assert.match(las("src/spel/ang/Parallax.tsx"), /abs\(1\.0 - mod\(vMapUv\.x, 2\.0\)\)/, "speglad upprepning i shadern");
});

test("Parallax: atlasens rader överlappar inte och har luft emellan", () => {
  const { hojd, rader } = atlasRader();
  const r = LAGER.map((l) => rader[l.namn]);
  for (let i = 1; i < r.length; i++) assert.equal(r[i]!.y, r[i - 1]!.y + r[i - 1]!.h + ATLAS_LUFT);
  assert.equal(hojd, r.at(-1)!.y + r.at(-1)!.h);
  for (const x of r) assert.ok(x.v0 >= 0 && x.v0 + x.vh <= 1 + 1e-9);
});

test("Parallax: de gamla 3D-kullarna och 3D-bergen är borta, och lagren är ett ritanrop", () => {
  const hv = las("src/spel/ang/HorisontVarld.tsx");
  assert.doesNotMatch(hv, /w-kulle-cc0|w-berg-cc0/);
  const px = las("src/spel/ang/Parallax.tsx");
  assert.match(px, /MeshBasicMaterial\(\{[^}]*transparent: true[^}]*depthWrite: false[^}]*toneMapped: false/);
  assert.equal((px.match(/<mesh /g) ?? []).length, 1, "en mesh = ett ritanrop för alla tre lagren");
  assert.match(las("src/spel/angen3d.tsx"), /<Parallax /);
});

test("Parallax: lagren väntar på ängens första bild (försidan blir inte långsammare)", () => {
  const px = las("src/spel/ang/Parallax.tsx");
  assert.match(px, /useStart\(\(s\) => s\.angRedo\)/);
  assert.doesNotMatch(las("index.html"), /parallax/, "ingen förladdning som tävlar med försidans bilder");
});
