// P3a-fix (beslut A/D): platsernas dekor (träd, buskar, staket, klippor) mätt i den riktiga renderingen, som data åt
// placeringsregeln. Varje plats laddas tom; id-passets dekorkarta (window.__dekorKarta) ger för varje cell × cell px
// världens z för den främsta dekorytan. Regeln (placering.ts) räknar en kropp på djupet z som skymd i de celler där dekorn
// står framför den. Skrivs till data/dekor-karta.json: z × 4 som Int8 i base64 (−128 = ingen dekor).
// Kör efter build:pages: node rundor/P3a-fix/dekor-karta.mjs --dist dist-pages
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const dist = path.resolve(arg("dist", "dist-pages"));
const CELL = 6;
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg" };
const server = http.createServer((req, res) => {
  let f = path.join(dist, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!f.startsWith(dist)) { res.writeHead(403); res.end(); return; }
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, "index.html");
  res.setHeader("Content-Type", mime[path.extname(f)] ?? "application/octet-stream");
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const URL0 = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const PLATSER = ["skogen", "sjon", "grottan"];
const ut = { _om: "P3a-fix: platsernas dekor mätt i renderingen (rundor/P3a-fix/dekor-karta.mjs). z = världens z × 4 för den främsta dekorytan per cell, Int8 i base64, −128 = ingen.", cell: CELL, platser: {} };
for (const plats of ["ang", ...PLATSER]) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE" });
  await ctx.addInitScript((s) => localStorage.setItem("trollpennan-v2", JSON.stringify(s)), { version: 2, introSedd: true, dragit: true, ang: [], garden: [], stjarnor: 12, oppnadePlatser: PLATSER, seddaIntro: [...PLATSER, "garden", "gard"], platsSkapelser: {}, ...(plats === "ang" ? {} : { plats }) });
  const p = await ctx.newPage();
  await p.goto(URL0, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__dekorKarta, null, { timeout: 90000 });
  await p.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => undefined);
  await p.waitForTimeout(4000);
  const k = await p.evaluate((c) => window.__dekorKarta(c), CELL);
  const b = Buffer.alloc(k.z.length);
  k.z.forEach((z, i) => b.writeInt8(z === null ? -128 : Math.max(-127, Math.min(127, Math.round(z * 4))), i));
  ut.platser[plats] = { w: k.w, h: k.h, z: b.toString("base64") };
  console.error(`${plats}: ${k.w}×${k.h}, dekor i ${k.z.filter((z) => z !== null).length} celler`);
  await ctx.close();
}
fs.writeFileSync("data/dekor-karta.json", JSON.stringify(ut, null, 1) + "\n");
await browser.close();
server.close();
