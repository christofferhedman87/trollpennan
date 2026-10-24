// R1 Röstens takt – genomspelning som loggar det barnet HÖR (Arkitekten 2026-10-24). Mätskript, ingen spelkod.
// Bygger på rundor/O1-ordtolk/matt/rostlogg.mjs. Ny spelare, 375x812, pekskärm, intro, sedan tre djur i snabb takt
// via skärmtangentbordet: "en katt" 3 s efter introt, "en blå hund" och "en gris" med 12 s mellan väckningarna, sedan 40 s tystnad.
// Varje röstrad loggas med sidans egen klocka (performance.now) när uppspelningen startar: rost.ts skriver window.__rost,
// skriptet stämplar varje rad (__t). Headless saknar ljudkort: play() låtsas spela filens längd och skickar 'ended'.
// Kör mot deployen:   node rundor/R1-rostens-takt/matt/rostlogg-r1.mjs --url https://trollpennan.christofferhedman87.workers.dev/ --ut rostlogg-r1-nu
// Kör mot ett bygge:  npm run build:pages && node rundor/R1-rostens-takt/matt/rostlogg-r1.mjs --dist dist-pages --ut rostlogg-r1
// Sedan:              node rundor/R1-rostens-takt/matt/takt.mjs <ut>/rostlogg.json   (slutkod 0 = facit uppfyllt)
import fs from "node:fs"; import path from "node:path"; import http from "node:http";
import { createRequire } from "node:module";
const require = createRequire(path.resolve("package.json"));
const { chromium } = require("playwright");
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const UT = path.resolve(arg("ut", "rostlogg-r1")); fs.mkdirSync(UT, { recursive: true });
let URL0 = arg("url", null), sv = null;
if (!URL0) {
  const ROOT = path.resolve(arg("dist", "dist-pages"));
  const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".ttf": "font/ttf", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".wasm": "application/wasm" };
  sv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(new URL(q.url, "http://x").pathname)); if (!f.startsWith(ROOT)) { r.writeHead(403); r.end(); return; }
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(ROOT, "index.html"); r.setHeader("Content-Type", mime[path.extname(f)] ?? "application/octet-stream"); r.end(fs.readFileSync(f)); });
  await new Promise((ok) => sv.listen(0, "127.0.0.1", ok)); URL0 = `http://127.0.0.1:${sv.address().port}/`;
}
const br = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-blink-features=AutomationControlled", "--autoplay-policy=no-user-gesture-required"] });
const ctx = await br.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: "sv-SE" });
await ctx.addInitScript(() => {
  Object.defineProperty(navigator, "webdriver", { get: () => false });
  // stämpla varje röstrad när rost.ts loggar den (= när uppspelningen startar)
  const r = []; r.push = function (...x) { for (const e of x) if (e && typeof e === "object") e.__t = performance.now(); return Array.prototype.push.apply(this, x); };
  window.__rost = r; window.__filer = []; window.__bann = []; window.__hand = [];
  const orig = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    const src = new URL(this.src, location.href).pathname;
    if (!src.includes("/ljud/rost")) return orig.call(this).catch(() => {});
    window.__filer.push({ t: performance.now(), fil: src });
    const self = this; self.load();
    const vanta = () => { const ms = isFinite(self.duration) && self.duration > 0 ? self.duration * 1000 : 2500; setTimeout(() => self.dispatchEvent(new Event("ended")), ms); };
    if (self.readyState >= 1) vanta(); else self.addEventListener("loadedmetadata", vanta, { once: true });
    setTimeout(() => { self.dispatchEvent(new Event("play")); self.dispatchEvent(new Event("playing")); }, 0);
    return Promise.resolve();
  };
  const sett = new Map();
  setInterval(() => { for (const e of document.querySelectorAll(".banner,[data-testid^=banner]")) { const t = (e.textContent || "").trim(); if (t && sett.get(e) !== t) { sett.set(e, t); window.__bann.push({ t: performance.now(), text: t }); } } }, 100);
});
const P = await ctx.newPage(); const sidfel = []; P.on("pageerror", (e) => sidfel.push(String(e.message).slice(0, 200))); P.setDefaultTimeout(20000);
const nu = () => P.evaluate(() => performance.now());
const hand = (text) => P.evaluate((text) => window.__hand.push({ t: performance.now(), text }), text);
const tap = async (l, v = 150) => { await l.waitFor({ state: "visible", timeout: 15000 }); await l.tap({ timeout: 5000 }).catch(() => l.tap({ force: true })); await P.waitForTimeout(v); };
await P.goto(URL0, { waitUntil: "domcontentloaded" }); await P.waitForTimeout(5000);
const b = P.locator("[data-testid=titel-borja]").first(); if (await b.isVisible().catch(() => false)) { await hand("titel-borja"); await tap(b, 1000); }
// introt: en ny spelare följer det (idéknapp, skrivsteget "Skriv katt!" med den markerade tangenten, sedan Vakna), högst 150 s
const syns = (sel) => P.locator(sel).first().isVisible().catch(() => false);
for (let i = 0; i < 600; i++) {
  if (!(await syns("[data-testid=intro]")) && !(await syns("[data-testid=intro-skriv]")) && i > 8) break;
  if (await syns("[data-testid=intro-vakna].redo")) { await hand("intro-vakna"); await P.locator("[data-testid=intro-vakna]").first().tap({ force: true }).catch(() => {}); }
  else if (await syns("[data-testid=intro-tangent].nasta")) { await P.locator("[data-testid=intro-tangent].nasta").first().tap({ force: true }).catch(() => {}); await P.waitForTimeout(300); continue; }
  else if (await syns("[data-testid=intro-ide]")) { await P.waitForTimeout(1500); await hand("intro-ide"); await P.locator("[data-testid=intro-ide]").first().tap({ force: true }).catch(() => {}); }
  await P.waitForTimeout(250);
}
const tIntroSlut = await nu();
await P.screenshot({ path: `${UT}/efter-intro.png` });
async function skriv(fras) {
  if (!(await P.locator("[data-testid=vakna]").isVisible().catch(() => false))) await tap(P.locator("[data-testid=pennans-bok]"), 1500);
  const tb = P.locator("[data-testid=tangentbord]");
  if (await tb.isVisible().catch(() => false)) {
    for (const c of fras) { if (c === " ") await tap(P.locator("[data-testid=mellanslag]"), 80); else await tap(tb.locator("button.tangent", { hasText: new RegExp("^" + c + "$", "i") }).first(), 80); }
  } else await P.keyboard.type(fras, { delay: 80 }); // som O1-skriptet: fysiskt tangentbord när skärmtangentbordet inte visas
  await hand("vakna " + fras); // handlingen = trycket på Väck (svaret mäts härifrån)
  await tap(P.locator("[data-testid=vakna]"), 100);
}
const vantaTill = async (t) => { const d = t - (await nu()); if (d > 0) await P.waitForTimeout(d); };
await vantaTill(tIntroSlut + 3000); await skriv("en katt"); let senast = (await P.evaluate(() => window.__hand.at(-1).t));
await vantaTill(senast + 12000); await skriv("en blå hund"); senast = (await P.evaluate(() => window.__hand.at(-1).t));
await vantaTill(senast + 12000); await skriv("en gris"); senast = (await P.evaluate(() => window.__hand.at(-1).t));
await vantaTill(senast + 40000);
const d = await P.evaluate(() => ({ rost: window.__rost.map(({ __t, ...x }) => ({ t: __t, ...x })), filer: window.__filer, bann: window.__bann, hand: window.__hand }));
fs.writeFileSync(`${UT}/rostlogg.json`, JSON.stringify({ url: URL0.startsWith("http://127") ? "dist" : URL0, tIntroSlut, ...d, sidfel }, null, 1));
await P.screenshot({ path: `${UT}/slut.png` });
await br.close(); sv?.close();
console.log("klar", UT, "rader", d.rost.length, "sidfel", sidfel.length);
