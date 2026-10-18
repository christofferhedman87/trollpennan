// R3B: går igenom spelets vyer med ordkristaller i ängen och räknar sidfel. Ska ge 0 sidfel.
// Användning: node rundor/R3B-reservform/kristall-tur.mjs [--dist dist-pages] [--ut /tmp/r3b-tur]
// Skapar "elefant" och "en glad kanin som dansar", öppnar Gården, Albumet och ängen igen (via window.__troll).
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const dist = path.resolve(arg("dist", "dist-pages"));
const ut = path.resolve(arg("ut", "/tmp/r3b-tur"));
fs.mkdirSync(ut, { recursive: true });
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
p.on("pageerror", (e) => fel.push("pageerror: " + e));
p.on("console", (m) => m.type() === "error" && fel.push("console: " + m.text()));
await p.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => !!window.__troll, null, { timeout: 20000 });
await p.waitForTimeout(900);
const steg = [];
const gor = async (namn, f, vanta = 1200) => {
  await p.evaluate(f);
  await p.waitForTimeout(vanta);
  await p.screenshot({ path: path.join(ut, `${namn}.png`) });
  steg.push(namn);
};
await gor("01-elefant", () => window.__troll.vakna("elefant"), 3500);
await gor("02-glad-kanin-dansar", () => window.__troll.vakna("en glad kanin som dansar"), 3500);
await gor("03-garden", () => window.__troll.plats("gard"), 1500);
await gor("04-ang-igen", () => window.__troll.plats("ang"), 1500);
await gor("05-album", () => window.__troll.album(true), 1500);
const state = await p.evaluate(() => window.__troll.state());
const kroppar = state.ang.map((a) => a.kropp);
console.log(JSON.stringify({ steg, kroppar, album: Object.keys(state.album), onskelista: state.onskelista, sidfel: fel }, null, 1));
await browser.close();
server.close();
process.exit(fel.length || !kroppar.includes("kristall") || Object.keys(state.album).includes("kristall") ? 1 : 0);
