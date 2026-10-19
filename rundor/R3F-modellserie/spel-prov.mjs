// R3F (modellserien): som R3D-provet men fraserna kommer från --fraser och en skärmbild (375x812) tas efter sista frasen.
// Användning: node rundor/R3F-modellserie/spel-prov.mjs --fraser "en valfisk=valfisk;en oxe=oxe" [--bild ut.png] [--dist dist-pages]   (exit 0 = allt stämde)
// Kräver `npm run build:pages` först. Varje fras ger ett djur som hämtas först nu; startbegäranden av bulkmodeller ska vara 0. Skriver JSON: begäranden före/efter, vilka djur som skapades, sidfel.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const dist = path.resolve(arg("dist", "dist-pages"));
const fraser = String(arg("fraser", "")).split(";").filter(Boolean).map((x) => x.split("="));
const bild = arg("bild", "");
if (!fraser.length) throw new Error('--fraser saknas, t.ex. --fraser "en valfisk=valfisk"');
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let f = path.join(dist, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, "index.html");
  res.setHeader("Content-Type", mime[path.extname(f)] ?? "application/octet-stream");
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, deviceScaleFactor: 1, locale: "sv-SE" });
await ctx.addInitScript(() => {
  if (!sessionStorage.getItem("f")) {
    localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true }));
    sessionStorage.setItem("f", "1");
  }
});
const p = await ctx.newPage();
const fel = [];
const glb = [];
p.on("pageerror", (e) => fel.push("pageerror: " + e));
p.on("console", (m) => m.type() === "error" && fel.push("console: " + m.text()));
p.on("response", (r) => /\.glb(\?|$)/.test(r.url()) && glb.push({ url: new URL(r.url()).pathname, status: r.status() }));
p.setDefaultTimeout(10000);
await p.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => !!window.__troll, null, { timeout: 20000 });
await p.waitForTimeout(2500);
const vidStart = glb.filter((g) => g.url.includes("/models/bulk/")).length;
const resultat = [];
for (const [fras, id] of fraser) {
  await p.evaluate(() => window.__troll.aterstall());
  await p.waitForTimeout(400);
  const fore = glb.length;
  await p.evaluate((x) => window.__troll.vakna(x), fras);
  await p.waitForTimeout(3500);
  const st = await p.evaluate(() => window.__troll.state());
  const nya = glb.slice(fore).map((g) => g.url);
  resultat.push({ fras, forvantad_kropp: id, kroppar: st.ang.map((a) => a.kropp), hamtade: nya, ok: st.ang.some((a) => a.kropp === id) && nya.some((u) => u.includes(`/models/bulk/${id}.glb`)) });
}
if (bild) {
  // alla fraser på en gång i samma äng, så att bilden visar flera nya djur
  await p.evaluate(() => window.__troll.aterstall());
  await p.waitForTimeout(400);
  for (const [fras] of fraser) {
    await p.evaluate((x) => window.__troll.vakna(x), fras);
    await p.waitForTimeout(2500);
  }
  await p.waitForTimeout(1500);
  fs.mkdirSync(path.dirname(path.resolve(bild)), { recursive: true });
  await p.screenshot({ path: bild });
}
const dalig = glb.filter((g) => g.status !== 200);
console.log(JSON.stringify({ bulk_glb_vid_start: vidStart, resultat, glb_med_fel: dalig, sidfel: fel }, null, 1));
await browser.close();
server.close();
process.exit(vidStart === 0 && resultat.every((r) => r.ok) && !dalig.length && !fel.length ? 0 : 1);
