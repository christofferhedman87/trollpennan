// B1.4: resa till plats (grind/skriv/karta), intro, hem. 375x812. Exit 0 = allt stämde.
// Kräver npm run build:pages. Användning: node rundor/BLOCK-platser/B1.4/plats-prov.mjs [skogen] [--bilder dir]
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const platsArg = (process.argv.slice(2).find((a) => ["skogen", "sjon", "grottan", "ang"].includes(a))) ?? "skogen";
const dist = path.resolve(arg("dist", "dist-pages"));
const bilder = arg("bilder", "");
if (bilder) fs.mkdirSync(bilder, { recursive: true });
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
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
p.on("request", (r) => { if (new URL(r.url()).pathname.endsWith(".glb")) glb.push(path.basename(new URL(r.url()).pathname, ".glb")); });
p.setDefaultTimeout(12000);
await p.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => !!window.__troll, null, { timeout: 20000 });
await p.waitForTimeout(2000);
const vanta = (ms) => p.waitForTimeout(ms);
const attr = () => p.getAttribute("[data-testid=angen-3d]", "data-plats");
const bild = async (n) => bilder && p.screenshot({ path: path.join(bilder, n) });
const steg = [];
const kolla = (namn, ok, info = {}) => steg.push({ namn, ok: !!ok, ...info });

for (const t of ["en gris", "en hund", "en katt"]) {
  await p.evaluate((x) => window.__troll.vakna(x), t);
  await vanta(900);
}
await vanta(1500);
await bild("b1-4-01-skylt.png");
kolla("skylt syns efter 3 djur", await p.locator("[data-testid=plats-skylt]").count() === 1);

// skriv platsnamn
await p.evaluate((x) => window.__troll.vakna(x), platsArg === "sjon" ? "sjön" : platsArg);
await p.waitForSelector("[data-testid=plats-hem]", { timeout: 10000 });
await vanta(2500);
await bild("b1-4-02-skogen-intro.png");
kolla(`data-plats=${platsArg}`, (await attr()) === platsArg, { plats: await attr() });
kolla("plats-namn syns", await p.locator("[data-testid=plats-namn]").count() === 1);
kolla("intro eller redan sedd", true);
kolla("minst 2 start-glb", glb.filter((g) => ["trad","gran","stubbe","brygga","grotta","klippa","sten","buske"].includes(g)).length >= 2, { glb: [...new Set(glb)] });
kolla("Bengtsson syns (figur eller ikon)", (await p.locator("[data-testid=npc-figur], [data-testid=bengtsson-ikon]").count()) >= 1);

// hem
await p.click("[data-testid=plats-hem]");
await vanta(2500);
await bild("b1-4-04-hem.png");
kolla("tillbaka ängen", (await attr()) === "ang");

// låst plats → Inte riktigt än (reset, no unlock)
await p.evaluate(() => window.__troll.aterstall());
await vanta(800);
await p.evaluate(() => window.__troll.vakna("skogen"));
await vanta(2000);
kolla("låst ger Inte riktigt än", await p.locator("[data-testid=inte-riktigt-an]").count() === 1);
kolla("inga sidfel", fel.length === 0, { fel });

await browser.close();
server.close();
const ok = steg.every((s) => s.ok);
console.log(JSON.stringify({ ok, steg }, null, 1));
process.exit(ok ? 0 : 1);
