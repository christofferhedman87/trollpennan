// R3B: går igenom spelets vyer med ordägg i ängen och räknar sidfel. Ska ge 0 sidfel.
// Användning: node rundor/R3B-reservform/agg-tur.mjs [--dist dist-pages] [--ut /tmp/r3b-tur]
// Skapar "elefant" (ägg) och "en glad kanin som dansar", öppnar Gården, Albumet och ängen igen (via window.__troll).
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
const utgaende = [];
p.on("request", (r) => utgaende.push(r.url()));
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
// För vuxna: listan över saknade ord (lokal), export som fil, rensa. Ingen begäran får gå utanför servern.
await p.evaluate(() => window.__troll.album(false));
await p.waitForTimeout(500);
await p.evaluate(() => window.__troll.foralder(true));
await p.waitForTimeout(800);
const lista = await p.locator('[data-saknade="lista"] li').allTextContents();
await p.locator('[data-saknade="ord"]').scrollIntoViewIfNeeded();
await p.screenshot({ path: path.join(ut, "06-foralder-saknade.png") });
const [nedladdning] = await Promise.all([p.waitForEvent("download"), p.locator('[data-saknade="fil"]').click()]);
const exportFil = JSON.parse(fs.readFileSync(await nedladdning.path(), "utf8"));
const lagrat = await p.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("trollpennan-saknade")));
await p.locator('[data-saknade="rensa"]').click();
const efterRensa = await p.evaluate(() => localStorage.getItem("trollpennan-saknade-ord"));
const state = await p.evaluate(() => window.__troll.state());
const ute = utgaende.filter((u) => !u.startsWith(`http://127.0.0.1:${server.address().port}/`) && !u.startsWith("data:") && !u.startsWith("blob:"));
const kroppar = state.ang.map((a) => a.kropp);
console.log(JSON.stringify({ steg, kroppar, album: Object.keys(state.album), onskelista: state.onskelista, saknade_lista: lista, export_ord: exportFil.ord.map((o) => `${o.ord}/${o.grund}/${o.kategori}/${o.antal}`), lagrat, efterRensa, utgaende_utanfor_servern: ute, sidfel: fel }, null, 1));
await browser.close();
server.close();
const ok = !fel.length && kroppar.includes("agg") && !Object.keys(state.album).includes("agg") && lista.some((t) => t.startsWith("elefant")) && exportFil.ord.some((o) => o.ord === "elefant" && o.antal >= 1) && lagrat.length === 1 && efterRensa === null && ute.length === 0;
process.exit(ok ? 0 : 1);
