// R9D: ett uppdrag i taget och förslag som fungerar. Playwright 375x812 mot dist-pages (kör `npm run build:pages` först).
// Användning: node rundor/R9D-uppdragsfix/uppdrag-prov.mjs [--bild ut.png] [--dist dist-pages]   (exit 0 = allt stämde)
// A: ny spelare – ingen önskebubbla före Bengtssons regel eller före hans första uppdrag, aldrig två bubblor ovanpå varandra,
//    och en önskan som syns tas bort när Bengtssons uppdrag startar (boken visar bara ett uppdrag).
// B: varje förslagsfras i data/bengtsson.json klarar sitt uppdrag i spelet, utan ägg och utan "aldrig sett"-ruta.
// C: skymningsönskan ('lila'/'mörkblå') går att uppfylla via pratbubblan.
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
const B = JSON.parse(fs.readFileSync("data/bengtsson.json", "utf8"));
const SKRIV = B.uppdrag.filter((u) => u.typ === "skriv" && u.givare === "bengtsson" && u.val?.grupper);
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
  // mäter hela tiden: hur många önskebubblor syns, och ligger två bubblor ovanpå varandra?
  window.__r9d = { maxOnska: 0, overlapp: [] };
  setInterval(() => {
    const vis = [...document.querySelectorAll("[data-testid=bubbla],[data-testid=onska-bubbla]")].filter((e) => e.offsetParent);
    const n = vis.filter((e) => e.dataset.testid === "onska-bubbla").length;
    window.__r9d.maxOnska = Math.max(window.__r9d.maxOnska, n);
    const r = vis.map((e) => e.getBoundingClientRect());
    for (let i = 0; i < r.length; i++)
      for (let j = i + 1; j < r.length; j++)
        if (r[i].left < r[j].right && r[j].left < r[i].right && r[i].top < r[j].bottom && r[j].top < r[i].bottom && (vis[i].dataset.testid === "onska-bubbla" || vis[j].dataset.testid === "onska-bubbla"))
          window.__r9d.overlapp.push(vis.map((e) => e.textContent.slice(0, 40)));
  }, 150);
});
const p = await ctx.newPage();
const fel = [];
p.on("pageerror", (e) => fel.push("pageerror: " + e));
p.setDefaultTimeout(8000);
await p.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => !!window.__troll, null, { timeout: 20000 });
await p.waitForTimeout(2000);

const vanta = (ms) => p.waitForTimeout(ms);
const syns = (sel) => p.$$eval(sel, (b) => b.filter((x) => x.offsetParent).length);
const status = () => p.evaluate(() => { const j = JSON.parse(localStorage.getItem("trollpennan-v2") || "{}"); return j.state?.uppdrag ?? j.uppdrag ?? {}; });
const onskan = () => p.evaluate(() => window.__troll.state().onskan);
async function stangBok() { if (await syns("[data-testid=stang-bok]")) { await p.click("[data-testid=stang-bok]"); await vanta(400); } }
async function bengtsson() {
  await stangBok();
  if (!(await syns("[data-testid=npc-figur],[data-testid=bengtsson-ikon]"))) {
    await p.screenshot({ path: "/tmp/r9d-ingen-bengtsson.png" });
    console.error("ingen Bengtsson:", (await p.$$eval("button", (b) => b.filter((x) => x.offsetParent).map((x) => (x.dataset.testid || "") + ":" + x.textContent.trim().slice(0, 30)))).join(" | "), await p.$$eval("[data-testid],[class]", (b) => [...new Set(b.filter((x) => x.offsetParent && !/^(kort-|uppdrag-val)/.test(x.dataset.testid || "")).map((x) => x.dataset.testid || x.className))].slice(0, 80).join(" ")), JSON.stringify(await status()));
  }
  await p.click("[data-testid=npc-figur],[data-testid=bengtsson-ikon]");
  await p.waitForSelector("[data-testid=uppdrag-val-fras]", { state: "visible" });
  await vanta(500);
}
async function valjFras(f) {
  const k = p.locator("[data-testid=uppdrag-val-fras]").filter({ hasText: new RegExp(`^\\s*${f.ord}\\s*$`) }).first();
  await k.scrollIntoViewIfNeeded();
  for (let n = 0; n < 3; n++) {
    await k.click();
    const ok = await p.waitForFunction((x) => window.__troll.state().text === x, f.fras, { timeout: 2000 }).then(() => true, () => false);
    if (ok) break;
  }
  await p.click("[data-testid=vakna]");
  await vanta(1800);
}
const A = {};
// A1: ett djur som "funnits länge" – förr kom en önskan efter 30 s
await p.evaluate(() => window.__troll.vakna("en kanin"));
await vanta(1500);
await p.evaluate(() => window.__troll.aldras());
await vanta(3500);
A.onskor_efter_1_djur = await syns("[data-testid=onska-bubbla]");
// A2: 3 djur = Bengtssons regel uppfylld; han bjuder in, men ingen önskan samtidigt
await p.evaluate(() => window.__troll.vakna("en katt"));
await vanta(1500);
await p.evaluate(() => window.__troll.vakna("en hund"));
await vanta(1500);
await p.evaluate(() => window.__troll.aldras());
await vanta(3500);
A.bengtsson_bjuder_in = (await syns(".npc-figur.nytt")) === 1;
A.onskor_efter_3_djur = await syns("[data-testid=onska-bubbla]");
if (bild) await p.screenshot({ path: bild });
// A3: en gammal önskan syns – när Bengtssons uppdrag startar försvinner den, boken visar bara uppdraget
await p.evaluate(() => window.__troll.onska("lila", false));
await vanta(600);
await bengtsson();
A.onskan_efter_uppdragsstart = (await onskan())?.id ?? null;
A.bok_uppdrag = await syns("[data-testid=uppdrag-remsa]");
A.bok_onskan = await syns("[data-testid=onska-remsa]");
const r9d = await p.evaluate(() => window.__r9d);
const okA = A.onskor_efter_1_djur === 0 && A.onskor_efter_3_djur === 0 && A.bengtsson_bjuder_in && A.onskan_efter_uppdragsstart === null && A.bok_uppdrag === 1 && A.bok_onskan === 0;

// B: varje förslag klarar sitt uppdrag i spelet. Tidigare uppdrag sätts som klara i sparningen, sidan laddas om, barnet trycker på Bengtsson och på förslaget.
const Bres = [];
async function nyStart(klara) {
  await p.evaluate((u) => localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, uppdrag: u })), klara);
  await p.reload({ waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__troll, null, { timeout: 20000 });
  await vanta(1500);
}
for (let i = 0; i < SKRIV.length; i++) {
  const klara = Object.fromEntries(SKRIV.slice(0, i).map((u) => [u.id, "klar"]));
  for (const g of SKRIV[i].val.grupper) {
    for (const f of g.forslag) {
      await nyStart(klara);
      await p.evaluate(() => window.__troll.vakna("en kanin"));
      await vanta(1500);
      await bengtsson();
      await valjFras(f);
      const st = await status();
      const puffar = await p.$$eval("[data-testid=puff]", (b) => b.map((x) => x.textContent));
      const s = await p.evaluate(() => window.__troll.state());
      const sista = s.ang.at(-1);
      const agg = puffar.some((t) => /aldrig sett/.test(t)) || s.ang.some((a) => a.kropp === "agg");
      Bres.push({ uppdrag: SKRIV[i].id, fras: f.fras, klar: st[SKRIV[i].id] === "klar", kropp: sista?.kropp, med: sista?.tillbehor?.map((t) => t.id), agg, ok: st[SKRIV[i].id] === "klar" && !agg });
    }
  }
}
await nyStart({});
// C: skymningsönskan via bubblan (inget uppdrag pågår)
await p.evaluate(() => window.__troll.vakna("en kanin"));
await vanta(3500);
await p.evaluate(() => window.__troll.onska("lila", false));
await vanta(600);
await p.click("[data-testid=onska-bubbla]");
await vanta(600);
const C = { exempel: [] };
for (let k = 0; k < 2; k++) {
  if (k) {
    await stangBok();
    await p.evaluate(() => window.__troll.aterstall());
    await vanta(400);
    await p.evaluate(() => window.__troll.vakna("en kanin"));
    await vanta(3500);
    await p.evaluate(() => window.__troll.onska("lila", false));
    await vanta(600);
    await p.click("[data-testid=onska-bubbla]");
    await vanta(600);
  }
  const ex = await p.textContent(`[data-testid=onska-ex-${k}]`);
  await p.click(`[data-testid=onska-ex-${k}]`);
  await vanta(250);
  await p.click("[data-testid=vakna]");
  await vanta(1800);
  const s = await p.evaluate(() => window.__troll.state());
  C.exempel.push({ ex, uppfylld: !s.onskan, formel: s.ang[0]?.formel });
}
const okC = C.exempel.every((e) => e.uppfylld);
const okB = Bres.length > 0 && Bres.every((r) => r.ok);
const ut = { A: { ...A, max_onskebubblor: r9d.maxOnska, overlapp: r9d.overlapp.length, ok: okA && r9d.maxOnska <= 1 && !r9d.overlapp.length }, B: { antal: Bres.length, ok: Bres.filter((r) => r.ok).length, resultat: Bres }, C: { ...C, ok: okC }, sidfel: fel };
console.log(JSON.stringify(ut, null, 1));
await browser.close();
server.close();
process.exit(ut.A.ok && okB && okC && !fel.length ? 0 : 1);
