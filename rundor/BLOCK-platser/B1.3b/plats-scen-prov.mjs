// B1.3b: bytPlats("skogen") byter scenen (annan himmel, skogsdekor ur data/platser.json), tillbaka till ängen som förut. 375x812.
// Användning: node rundor/BLOCK-platser/B1.3b/plats-scen-prov.mjs [--bilder katalog] [--dist dist-pages]  (exit 0 = allt stämde). Kräver `npm run build:pages`.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
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
p.on("request", (r) => {
  const u = new URL(r.url()).pathname;
  if (u.endsWith(".glb")) glb.push(path.basename(u, ".glb"));
});
p.setDefaultTimeout(8000);
await p.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => !!window.__troll, null, { timeout: 20000 });
await p.waitForTimeout(2500);
const vanta = (ms) => p.waitForTimeout(ms);
const st = () => p.evaluate(() => window.__troll.state());
const attr = () => p.getAttribute("[data-testid=angen-3d]", "data-plats");
const bild = async (n) => bilder && p.screenshot({ path: path.join(bilder, n) });

const steg = [];
const kolla = (namn, ok, info = {}) => steg.push({ namn, ok: !!ok, ...info });

// ängen: tre djur (låser upp skogen)
for (const t of ["en gris", "en hund", "en katt"]) {
  await p.evaluate((x) => window.__troll.vakna(x), t);
  await vanta(1200);
}
await vanta(2500);
await bild("b1-3b-01-angen.png");
const glbAng = new Set(glb);
kolla("ängen: data-plats=ang och tre djur", (await attr()) === "ang" && (await st()).ang.length === 3, { plats: await attr() });

// till skogen
const bytt = await p.evaluate(() => window.__troll.bytPlats("skogen"));
await vanta(5000);
await bild("b1-3b-02-skogen.png");
const skogGlb = [...new Set(glb)].filter((g) => !glbAng.has(g));
kolla("bytPlats(skogen) = true, data-plats=skogen", bytt && (await attr()) === "skogen", { plats: await attr() });
kolla("skogens dekor hämtas (träd, gran, stubbe)", ["trad", "gran", "stubbe"].every((g) => glb.includes(g)), { nya_glb: skogGlb });

// en kanin i skogen
await p.evaluate(() => window.__troll.vakna("en kanin"));
await vanta(2500);
await bild("b1-3b-03-skogen-kanin.png");
const s1 = await st();
const antal = await p.evaluate(() => window.__troll.platsAntal());
kolla("kaninen hamnar i skogen, inte på ängen", antal.skogen === 1 && s1.ang.length === 3, { platsAntal: antal });

// tillbaka
const tillbaka = await p.evaluate(() => window.__troll.bytPlats("ang"));
await vanta(3000);
await bild("b1-3b-04-tillbaka.png");
const s2 = await st();
kolla("tillbaka på ängen: tre djur, ingen kanin", tillbaka && (await attr()) === "ang" && s2.ang.length === 3 && !s2.ang.some((a) => a.kropp === "kanin"));
kolla("inga sidfel", fel.length === 0, { fel });

await browser.close();
server.close();
const ok = steg.every((s) => s.ok);
console.log(JSON.stringify({ ok, steg }, null, 1));
process.exit(ok ? 0 : 1);
