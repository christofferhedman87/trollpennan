// R9: det bytta färgfältet träffar den begärda nyansen (±3°) för vita, gräddvita, gråa och bruna kroppar, för blå, röd, grön och gul.
import assert from "node:assert/strict";
import { test } from "node:test";
import miljo from "../../data/miljo.json" with { type: "json" };
import { byttPixel, hexTillHsl, ljusTint, nyansAvstand, rgbTillHsl, traffarPalett, type Palett } from "./palett.ts";

const MAL = { blå: "#1E88E5", röd: "#E53935", grön: "#43A047", gul: "#FDD835" };
const KROPPAR: { namn: string; rgb: [number, number, number]; pal: Palett }[] = [
  { namn: "vit", rgb: [250, 250, 250], pal: { from: 0, range: -1, bodyL: 0.98 } },
  { namn: "gräddvit", rgb: [240, 228, 205], pal: { from: 40, range: 22, bodyL: 0.87 } },
  { namn: "grå", rgb: [150, 150, 155], pal: { from: 0, range: -1, bodyL: 0.6 } },
  { namn: "brun", rgb: [150, 100, 60], pal: { from: 28, range: 22, bodyL: 0.42 } },
];

test("byttPixel träffar målnyansen exakt för alla kroppar och färgord", () => {
  for (const [ord, hex] of Object.entries(MAL)) {
    const mal = hexTillHsl(hex);
    for (const k of KROPPAR) {
      const p = rgbTillHsl(...k.rgb);
      assert.ok(traffarPalett(p, k.pal), `${k.namn} träffas av sin egen palett`);
      const [r, g, b] = byttPixel(p, k.pal, mal);
      const ut = rgbTillHsl(r, g, b);
      assert.ok(nyansAvstand(ut[0], mal[0]) <= 3, `${ord} på ${k.namn}: nyans ${Math.round(ut[0])} mot ${Math.round(mal[0])}`);
      assert.ok(ut[1] >= mal[1] - 0.03, `${ord} på ${k.namn}: tydlig färg, mättnad ${ut[1].toFixed(2)}`);
    }
  }
});

test("hsl-rundtur och skuggning bevaras", () => {
  const [r, g, b] = [30, 136, 229];
  const h = rgbTillHsl(r, g, b);
  const t = byttPixel(h, { from: 207, range: 22, bodyL: h[2] }, h);
  assert.ok(Math.abs(t[0] - r) <= 2 && Math.abs(t[1] - g) <= 2 && Math.abs(t[2] - b) <= 2);
  const mal = hexTillHsl(MAL.blå);
  const morkare = byttPixel([0, 0, 0.5], { from: 0, range: -1, bodyL: 0.7 }, mal);
  const ljusare = byttPixel([0, 0, 0.9], { from: 0, range: -1, bodyL: 0.7 }, mal);
  assert.ok(rgbTillHsl(...morkare)[2] < rgbTillHsl(...ljusare)[2]);
});

test("med ljusets färgton förkompenserad syns den begärda nyansen även under varmt ljus", () => {
  const tint = ljusTint(miljo.ljus, miljo.farg.ljusforstark);
  assert.ok(tint[0] > tint[2], "ljuset är varmt (mer rött än blått)");
  for (const [ord, hex] of Object.entries(MAL)) {
    const mal = hexTillHsl(hex);
    for (const k of KROPPAR) {
      const p = rgbTillHsl(...k.rgb);
      const [r, g, b] = byttPixel(p, k.pal, mal, tint);
      // simulerad visning: albedo (linjär) × ljusets ton, tillbaka till sRGB
      const vis = [r, g, b].map((c, i) => Math.round(255 * Math.min(1, Math.pow(Math.pow(c / 255, 2.2) * tint[i]!, 1 / 2.2)))) as [number, number, number];
      const ut = rgbTillHsl(...vis);
      assert.ok(nyansAvstand(ut[0], mal[0]) <= 6, `${ord} på ${k.namn}: syns som ${Math.round(ut[0])}° mot ${Math.round(mal[0])}°`);
    }
  }
});
