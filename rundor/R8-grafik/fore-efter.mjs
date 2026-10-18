// R8: före/efter-bilder (375x812) + mobilmått. Tar äng med djur, Bengtsson-läge och (valfritt) Pennans bok, och mäter
// draw calls per bildruta, bildrutetid (RELATIVT: headless använder mjukvaru-GL, ej riktig telefon-FPS), antal trianglar via GL-hook och JS-heap.
// Användning:  node rundor/R8-grafik/fore-efter.mjs --dist dist-pages --ut docs/skarmbilder/r8/fore --namn fore
//              node rundor/R8-grafik/fore-efter.mjs --url https://trollpennan.grok.me/ --ut docs/skarmbilder/r8/fore --namn grokme
// Valfritt: --kvalitet hog|lag (väljer nivå), --miljo '{"mark":{"filter":"pixel"}}' (smakprov utan att ändra datan).
// Efter-körning: samma kommando med --ut .../efter. Skriver <ut>/<namn>-matt.json. exit 0 = bilderna togs utan sidfel.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const ut = path.resolve(arg("ut", "r8-bilder"));
const namn = arg("namn", "bild");
const djur = (arg("djur", "en blå isbjörn;en rosa kanin;en grön drake")).split(";");
fs.mkdirSync(ut, { recursive: true });
let url = arg("url", ""), server;
if (!url) {
  const dist = path.resolve(arg("dist", "dist-pages"));
  const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp" };
  server = http.createServer((req, res) => {
    let f = path.join(dist, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, "index.html");
    res.setHeader("Content-Type", mime[path.extname(f)] ?? "application/octet-stream");
    res.end(fs.readFileSync(f));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  url = `http://127.0.0.1:${server.address().port}/`;
}
const kv = arg("kvalitet", "");
if (kv) url += `?kvalitet=${kv}`;
const miljoOver = arg("miljo", "");
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, deviceScaleFactor: 2, locale: "sv-SE" });
await ctx.addInitScript((over) => {
  if (over) localStorage.setItem("trollpennan-miljo", over);
  if (!sessionStorage.getItem("f")) { localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true })); sessionStorage.setItem("f", "1"); }
  window.__gl = { draw: 0, tri: 0 };
  for (const C of [window.WebGL2RenderingContext, window.WebGLRenderingContext]) {
    if (!C) continue;
    for (const [fn, f] of [["drawElements", (a) => a[1] / 3], ["drawArrays", (a) => a[2] / 3], ["drawElementsInstanced", (a) => (a[1] / 3) * a[4]], ["drawArraysInstanced", (a) => (a[2] / 3) * a[3]]]) {
      const o = C.prototype[fn]; if (!o) continue;
      C.prototype[fn] = function (...a) { window.__gl.draw++; if (a[0] === 4) window.__gl.tri += f(a); return o.apply(this, a); };
    }
  }
}, miljoOver);
const p = await ctx.newPage();
const fel = [];
p.on("pageerror", (e) => fel.push(String(e)));
p.setDefaultTimeout(15000);
await p.goto(url, { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => !!window.__troll, null, { timeout: 30000 });
await p.waitForTimeout(2500);
const m = { url, namn };
for (const t of djur) { try { await p.evaluate((x) => window.__troll.vakna(x), t); await p.waitForTimeout(900); } catch (e) { fel.push(`vakna ${t}: ${e}`); } }
await p.waitForTimeout(3000);
const skott = async (id) => { await p.waitForTimeout(500); await p.screenshot({ path: path.join(ut, `${namn}-${id}.png`) }); };
if ((await p.getByTestId("stang-bok").count()) > 0) await p.getByTestId("stang-bok").click().catch(() => {});
await skott("1-ang");
// mått över 4 s: bildruteintervall + GL-anrop per bildruta
m.matt = await p.evaluate(() => new Promise((res) => {
  const g0 = { ...window.__gl }; let n = 0; const dt = []; let last = performance.now(); const t0 = last;
  const f = (t) => { dt.push(t - last); last = t; n++; if (t - t0 < 4000) requestAnimationFrame(f); else {
    dt.sort((a, b) => a - b);
    res({ bildrutor: n, medel_ms: +(dt.reduce((a, b) => a + b, 0) / dt.length).toFixed(1), p95_ms: +dt[Math.floor(dt.length * 0.95)].toFixed(1), draw_per_ruta: +((window.__gl.draw - g0.draw) / n).toFixed(1), tri_per_ruta: Math.round((window.__gl.tri - g0.tri) / n), heap_mb: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(0) : null });
  } };
  requestAnimationFrame(f);
}));
try { await p.getByTestId("npc-figur").click(); await p.getByTestId("uppdrag-remsa").waitFor({ timeout: 6000 }); await skott("2-bengtsson"); } catch (e) { fel.push(`bengtsson: ${e}`.slice(0, 120)); await skott("2-bengtsson"); }
if ((await p.getByTestId("stang-bok").count()) > 0) await p.getByTestId("stang-bok").click().catch(() => {});
m.fel = fel;
fs.writeFileSync(path.join(ut, `${namn}-matt.json`), JSON.stringify(m, null, 1));
console.log(JSON.stringify(m));
await browser.close(); server?.close();
process.exit(fel.some((x) => x.startsWith("pageerror") || /^[A-Z]\w*Error/.test(x)) ? 1 : 0);
