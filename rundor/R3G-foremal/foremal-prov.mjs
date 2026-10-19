// R3G (föremål): varje fras ska ge kroppen (ensam sak) eller en med-sak bredvid djuret, hämta sakens modell och INTE bli ett ägg.
// Användning: node rundor/R3G-foremal/foremal-prov.mjs [--fraser "ett lok=lok;en kanin med en hink=kanin+hink"] [--bild ut.png] [--dist dist-pages]   (exit 0 = allt stämde)
// Kräver `npm run build:pages` först. "kropp+sak" = kroppen är djuret och saken står bredvid. Startbegäranden av bulkmodeller ska vara 0.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const dist = path.resolve(arg("dist", "dist-pages"));
const T = JSON.parse(fs.readFileSync("data/tillgangar.json", "utf8")).tillgangar;
const E = JSON.parse(fs.readFileSync("data/entiteter.json", "utf8")).entiteter;
const fil = (id) => T[E[id]?.modell]?.fil ?? `?${id}`;
const STANDARD = "en kanin med en hink=kanin+hink;ett lok=lok;en hink=hink;en ek=ek;ambulans=ambulans;en röd bil=bil;en katt med en gaffel=katt+gaffel";
const fraser = String(arg("fraser", STANDARD)).split(";").filter(Boolean).map((x) => x.split("="));
const bild = arg("bild", "");
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
  const [kropp, sak] = id.split("+");
  const v = st.ang.find((a) => a.kropp === kropp);
  const agg = st.ang.some((a) => a.kropp === "agg" || (a.reserv?.length ?? 0) > 0);
  const modell = fil(sak ?? kropp);
  const ok = !!v && !agg && (!sak || v.tillbehor.some((t) => t.id === sak)) && (nya.includes(modell) || (fras !== fraser[0][0] && glb.some((g) => g.url === modell)));
  resultat.push({ fras, forvantat: id, kroppar: st.ang.map((a) => a.kropp), med: v?.tillbehor.map((t) => t.id) ?? [], agg, modell, hamtade: nya, ok });
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
