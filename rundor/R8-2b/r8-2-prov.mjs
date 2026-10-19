// R8-2a/b: Playwright 375x812 per plats (ängen, skogen, sjön, grottan): rakt fram och vriden, utan och med djur.
// Mäter draw calls och trianglar per bildruta (GL-hook, instansierade räknas per instans) och skriver ut dem.
// Kräver npm run build:pages (eller --url mot en dev-server). Exit 0 = inga sidfel och alla steg gröna.
//   node rundor/R8-2b/r8-2-prov.mjs --bilder <mapp> [--dist dist-pages] [--url http://...]
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const bilder = arg("bilder", "");
if (bilder) fs.mkdirSync(bilder, { recursive: true });
let URL0 = arg("url", ""), server;
if (!URL0) {
  const dist = path.resolve(arg("dist", "dist-pages"));
  const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
  server = http.createServer((req, res) => {
    let f = path.join(dist, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, "index.html");
    res.setHeader("Content-Type", mime[path.extname(f)] ?? "application/octet-stream");
    res.end(fs.readFileSync(f));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  URL0 = `http://127.0.0.1:${server.address().port}/`;
}
const PLATSER = (arg("platser", "ang,skogen,sjon,grottan")).split(",");
const DJUR = ["en orange räv", "en rosa kanin", "en brun björn", "en gul anka", "en grå mus"];
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const steg = [];
const kolla = (namn, ok, info = {}) => { steg.push({ namn, ok: !!ok, ...info }); };
const matt = {};
const fel = [];

async function sida(plats) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE" });
  const spar = {
    version: 2, introSedd: true, dragit: true, ang: [], garden: [], stjarnor: 0, plats,
    oppnadePlatser: ["skogen", "sjon", "grottan"], seddaIntro: ["skogen", "sjon", "grottan"], platsSkapelser: {},
  };
  await ctx.addInitScript((s) => {
    if (!sessionStorage.getItem("f")) { localStorage.setItem("trollpennan-v2", JSON.stringify(s)); sessionStorage.setItem("f", "1"); }
    window.__gl = { draw: 0, tri: 0 };
    for (const C of [window.WebGL2RenderingContext, window.WebGLRenderingContext]) {
      if (!C) continue;
      for (const [fn, f] of [["drawElements", (a) => a[1] / 3], ["drawArrays", (a) => a[2] / 3], ["drawElementsInstanced", (a) => (a[1] / 3) * a[4]], ["drawArraysInstanced", (a) => (a[2] / 3) * a[3]]]) {
        const o = C.prototype[fn]; if (!o) continue;
        C.prototype[fn] = function (...a) { window.__gl.draw++; if (a[0] === 4) window.__gl.tri += f(a); return o.apply(this, a); };
      }
    }
  }, spar);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => fel.push(`${plats}: ${e}`));
  p.setDefaultTimeout(15000);
  await p.goto(URL0, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__troll, null, { timeout: 30000 });
  await p.waitForTimeout(4500);
  return { ctx, p };
}
const mat = (p) => p.evaluate(() => new Promise((res) => {
  const g0 = { ...window.__gl }; let n = 0; const t0 = performance.now();
  const f = (t) => { n++; if (t - t0 < 2000) requestAnimationFrame(f); else res({ draw: +((window.__gl.draw - g0.draw) / n).toFixed(1), tri: Math.round((window.__gl.tri - g0.tri) / n) }); };
  requestAnimationFrame(f);
}));
async function stangAllt(p) {
  for (const t of ["stang-bok", "uppdrag-stang", "puff-stang"]) if ((await p.getByTestId(t).count()) > 0) await p.getByTestId(t).first().click().catch(() => {});
}
async function vrid(p, dx) {
  const c = await p.locator("[data-testid=angen-3d] canvas").first().boundingBox();
  const x = c.x + c.width / 2, y = c.y + c.height * 0.45;
  await p.mouse.move(x, y); await p.mouse.down();
  for (let i = 1; i <= 12; i++) await p.mouse.move(x + (dx * i) / 12, y, { steps: 2 });
  await p.mouse.up(); await p.waitForTimeout(1500);
}
async function blok(id, fn) { try { await fn(); } catch (e) { kolla(`block ${id} kraschade`, false, { fel: String(e).split("\n")[0] }); } }
const bild = async (p, n) => bilder && p.screenshot({ path: path.join(bilder, n) });

for (const plats of PLATSER) {
  await blok(plats, async () => {
    const { ctx, p } = await sida(plats);
    const attr = await p.getAttribute("[data-testid=angen-3d]", "data-plats");
    kolla(`${plats}: data-plats`, attr === plats, { attr });
    await stangAllt(p);
    const m = {};
    await bild(p, `r8-2-${plats}-1-rakt.png`); m.rakt = await mat(p);
    await vrid(p, -170); await bild(p, `r8-2-${plats}-2-vriden.png`); m.vriden = await mat(p);
    await vrid(p, 170);
    for (const d of DJUR) { await p.evaluate((x) => window.__troll.vakna(x), d); await p.waitForTimeout(800); }
    await p.waitForTimeout(2500); await stangAllt(p);
    const antal = plats === "ang" ? null : await p.evaluate((pl) => window.__troll.platsAntal()[pl] ?? 0, plats);
    if (plats !== "ang") kolla(`${plats}: djuren hamnade på platsen`, antal >= 4, { antal });
    await bild(p, `r8-2-${plats}-3-rakt-djur.png`); m.rakt_djur = await mat(p);
    await vrid(p, -170); await bild(p, `r8-2-${plats}-4-vriden-djur.png`); m.vriden_djur = await mat(p);
    matt[plats] = m;
    kolla(`${plats}: draw calls rakt <= 150`, m.rakt.draw <= 150, m.rakt);
    await ctx.close();
  });
}
kolla("inga sidfel", fel.length === 0, { fel: fel.slice(0, 5) });
await browser.close(); server?.close();
const ok = steg.every((s) => s.ok);
console.log("MÄTVÄRDEN (draw calls / trianglar per bildruta)");
for (const [pl, m] of Object.entries(matt)) console.log(`  ${pl.padEnd(8)} ` + Object.entries(m).map(([k, v]) => `${k} ${v.draw}/${v.tri}`).join("  "));
console.log(JSON.stringify({ ok, steg, matt }, null, 1));
process.exit(ok ? 0 : 4);
