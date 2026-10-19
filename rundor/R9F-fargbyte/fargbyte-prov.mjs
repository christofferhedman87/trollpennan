// R9F: "en blå katt" + "lila" klarar skymningsönskan (färgen byts, blir inte "blå och lila"), och tackbubblan syns hel på 375x812.
// Användning: node rundor/R9F-fargbyte/fargbyte-prov.mjs [--bild ut.png] [--dist dist-pages]   (exit 0 = allt stämde). Kräver `npm run build:pages`.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const dist = path.resolve(arg("dist", "dist-pages"));
const bild = arg("bild", "");
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
  // mäter hela tiden
  window.__r9f = { utanfor: [] };
  setInterval(() => {
    for (const e of document.querySelectorAll("[data-testid=bubbla],[data-testid=onska-bubbla]")) {
      if (!e.offsetParent) continue;
      const r = e.getBoundingClientRect();
      if (r.left < 0 || r.right > window.innerWidth) window.__r9f.utanfor.push({ text: e.textContent.slice(0, 40), left: Math.round(r.left), right: Math.round(r.right) });
    }
  }, 100);
});
const p = await ctx.newPage();
const fel = [];
p.on("pageerror", (e) => fel.push("pageerror: " + e));
p.setDefaultTimeout(8000);
await p.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => !!window.__troll, null, { timeout: 20000 });
await p.waitForTimeout(2000);
const vanta = (ms) => p.waitForTimeout(ms);
const runder = [];
// tre rundor med olika platser: den blå katten först, sedan två djur till (katten hamnar på olika ställen)
const andra = [[], ["en gris", "en hund"], ["en groda", "en anka", "en uggla"]];
for (const extra of andra) {
  await p.evaluate(() => window.__troll.aterstall());
  await vanta(400);
  await p.evaluate(() => window.__troll.vakna("en blå katt"));
  await vanta(1500);
  for (const x of extra) {
    await p.evaluate((t) => window.__troll.vakna(t), x);
    await vanta(1200);
  }
  await vanta(2500);
  await p.evaluate(() => window.__troll.onska("lila", false));
  await vanta(600);
  for (let n = 0; n < 4 && !(await p.$("[data-testid=onska-ex-0]")); n++) {
    await p.waitForSelector("[data-testid=onska-bubbla]", { state: "visible", timeout: 12000 });
    await vanta(300);
    await p.click("[data-testid=onska-bubbla]").catch(() => null);
    await vanta(700);
  }
  // barnet trycker på "lila" i önskans förslag (fyller texten "lila") och väcker
  const ex = await p.textContent("[data-testid=onska-ex-0]");
  await p.click("[data-testid=onska-ex-0]");
  await vanta(250);
  await p.click("[data-testid=vakna]");
  await p.waitForSelector("[data-testid=bubbla]:has-text('kvällshimlen')", { timeout: 4000 }).catch(() => null);
  await vanta(300);
  const tack = await p.$$eval("[data-testid=bubbla]", (b) => b.filter((x) => x.offsetParent && /kvällshimlen/.test(x.textContent)).map((x) => { const r = x.getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), bredd: innerWidth, text: x.textContent }; }));
  if (bild && extra.length === 2) await p.screenshot({ path: bild });
  const s = await p.evaluate(() => window.__troll.state());
  const katt = s.ang.find((a) => a.kropp === "katt");
  runder.push({ exempel: ex, djur: s.ang.length, formel: katt?.formel, onskan_kvar: s.onskan?.id ?? null, tack, ok: katt?.formel === "en lila katt" && !s.onskan && tack.length === 1 && tack[0].left >= 0 && tack[0].right <= tack[0].bredd });
  await vanta(3500);
}
const utanfor = await p.evaluate(() => window.__r9f.utanfor);
const ut = { runder, bubblor_utanfor_skarmen: utanfor.length, exempel_utanfor: utanfor.slice(0, 3), sidfel: fel };
console.log(JSON.stringify(ut, null, 1));
await browser.close();
server.close();
process.exit(runder.every((r) => r.ok) && !utanfor.length && !fel.length ? 0 : 1);
