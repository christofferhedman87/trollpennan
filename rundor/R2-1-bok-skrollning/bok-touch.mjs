// Äkta fingerdrag (CDP Input.dispatchTouchEvent) i Pennans bok, mobilemulering 412x780, 360x640, 375x667, flikarna Färg och Djur. Skriven av Arkitekten.
// Användning: node rundor/R2-1-bok-skrollning/bok-touch.mjs --dist dist-pages --ut /tmp/bok-ut [--css fil.css] [--vp 412x780,360x640]
// Skriver JSON: hur mycket bok-mitt/kort-yta skrollade vid fingerdrag (tre x-lägen) och om sista kortet syns ovanför Vakna.
import fs from "node:fs"; import http from "node:http"; import path from "node:path";
const { chromium } = await import("playwright");
const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : d; };
const root = path.resolve(arg("--dist", "dist-pages")); const ut = path.resolve(arg("--ut", "bok-ut")); fs.mkdirSync(ut, { recursive: true });
const extraCss = arg("--css") ? fs.readFileSync(arg("--css"), "utf8") : null;
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".mp3": "audio/mpeg" };
const server = http.createServer((req, res) => { let f = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname)); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, "index.html"); res.setHeader("Content-Type", mime[path.extname(f)] || "application/octet-stream"); res.end(fs.readFileSync(f)); });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const vps = arg("--vp", "412x780,360x640,375x667").split(",").map((s) => s.split("x").map(Number));
const ut_ = [];
for (const [w, h] of vps) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, locale: "sv-SE" });
  await ctx.addInitScript(() => { if (!sessionStorage.getItem("fro")) { localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true })); sessionStorage.setItem("fro", "1"); } });
  const p = await ctx.newPage(); p.setDefaultTimeout(8000);
  await p.goto(url, { waitUntil: "domcontentloaded" }); await p.waitForFunction(() => !!window.__troll); await p.waitForTimeout(1200);
  if (extraCss) await p.addStyleTag({ content: extraCss });
  await p.getByTestId("pennans-bok").click(); await p.waitForTimeout(500);
  const cdp = await ctx.newCDPSession(p);
  const drag = async (x, y0, y1) => {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: y0 }] });
    for (let i = 1; i <= 12; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y0 + ((y1 - y0) * i) / 12 }] }); await p.waitForTimeout(16); }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await p.waitForTimeout(600);
  };
  const scrollTops = () => p.evaluate(() => { const s = (q) => document.querySelector(q)?.scrollTop ?? null; return { mitt: Math.round(s(".bok-mitt")), kort: Math.round(s(".kort-yta")) }; });
  for (const flik of ["Färg", "Djur"]) {
    await p.getByRole("tab", { name: flik }).click(); await p.waitForTimeout(400);
    await p.evaluate(() => { document.querySelectorAll(".bok-mitt,.kort-yta").forEach((e) => (e.scrollTop = 0)); });
    const g = await p.evaluate(() => { const r = (q) => { const b = document.querySelector(q)?.getBoundingClientRect(); return b ? [Math.round(b.top), Math.round(b.bottom)] : null; }; return { mitt: r(".bok-mitt"), flikar: r(".flikar"), kort: r(".kort-yta"), remsa: r(".remsa"), vakna: r(".vakna"), bok: r(".bok") }; });
    await p.screenshot({ path: path.join(ut, `${w}x${h}-${flik}-start.png`) });
    const rad = { vp: `${w}x${h}`, flik, geometri: g, drag: {} };
    // sökmål: en punkt i den synliga listan (mellan mitt-kanten och remsa), tre x-lägen: kortknapp, glipan mellan kolumnerna, vänsterkanten
    const yMitt = Math.round(Math.min(g.mitt[1] - 30, g.kort ? Math.max(g.kort[0] + 40, g.mitt[0] + 40) : g.mitt[1] - 30));
    const xs = await p.evaluate(() => { const k = document.querySelector(".kort-yta .kort"); const b = k.getBoundingClientRect(); const k2 = document.querySelectorAll(".kort-yta .kort")[1]?.getBoundingClientRect(); return { knapp: Math.round(b.left + b.width / 2), glipa: k2 ? Math.round((b.right + k2.left) / 2) : Math.round(b.right + 4), kant: 4 }; });
    for (const [namn, x] of Object.entries(xs)) {
      await p.evaluate(() => { document.querySelectorAll(".bok-mitt,.kort-yta").forEach((e) => (e.scrollTop = 0)); });
      await drag(x, yMitt, yMitt - 150);
      rad.drag[namn] = { x, y: yMitt, ...(await scrollTops()) };
    }
    // scrolla till botten med fingret och mät om sista kortet syns helt ovanför Vakna
    await p.evaluate(() => { document.querySelectorAll(".bok-mitt,.kort-yta").forEach((e) => (e.scrollTop = 0)); });
    for (let i = 0; i < 6; i++) await drag(xs.knapp, yMitt, yMitt - 200);
    rad.botten = await p.evaluate(() => { const k = [...document.querySelectorAll(".kort-yta .kort")]; const l = k[k.length - 1]?.getBoundingClientRect(); const v = document.querySelector(".vakna").getBoundingClientRect(); const m = document.querySelector(".bok-mitt").getBoundingClientRect(); const kt = document.querySelector(".kort-yta").getBoundingClientRect(); return { sistaKortBottom: Math.round(l.bottom), synligtTill: Math.round(Math.min(m.bottom, kt.bottom, v.top)), vaknaTop: Math.round(v.top), sistaSyns: l.bottom <= Math.min(m.bottom, v.top) + 1 }; });
    await p.screenshot({ path: path.join(ut, `${w}x${h}-${flik}-botten.png`) });
    ut_.push(rad);
  }
  await ctx.close();
}
console.log(JSON.stringify(ut_, null, 1));
await browser.close(); server.close();
