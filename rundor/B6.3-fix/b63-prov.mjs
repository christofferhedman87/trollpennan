// B6.3: dammens vatten syns med 7+ saker (D), uppmaningen står ≥ 5 s eller tills barnet trycker (H), inga djur/saker i dammen (I),
//   stora saker spridda bak, grinden syns (J). Playwright 375x812.
//   node rundor/B6.3-fix/b63-prov.mjs --bilder <mapp>   (exit 0 = alla steg gröna; kräver npm run build:pages)
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const dist = path.resolve(arg("dist", "dist-pages"));
const bilder = arg("bilder", "");
const bara = arg("bara", "D,H,I").split(",");
if (bilder) fs.mkdirSync(bilder, { recursive: true });
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };

const server = http.createServer((req, res) => {
  let f = path.join(dist, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, "index.html");
  res.setHeader("Content-Type", mime[path.extname(f)] ?? "application/octet-stream");
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const URL0 = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const steg = [];
const kolla = (namn, ok, info = {}) => { steg.push({ namn, ok: !!ok, ...info }); console.error(`${ok ? "ok  " : "FEL "} ${namn}`); };
const fel = [];
const PLATSER = ["skogen", "sjon", "grottan"];
async function sida(spar) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE" });
  await ctx.addInitScript((s) => {
    if (!sessionStorage.getItem("f")) { localStorage.setItem("trollpennan-v2", JSON.stringify(s)); sessionStorage.setItem("f", "1"); }
  }, { version: 2, introSedd: true, dragit: true, ang: [], garden: [], stjarnor: 0, oppnadePlatser: PLATSER, seddaIntro: [...PLATSER, "garden", "gard"], platsSkapelser: {}, ...spar });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => fel.push(String(e).slice(0, 300)));
  p.setDefaultTimeout(20000);
  await p.goto(URL0, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__troll, null, { timeout: 30000 });
  await p.waitForTimeout(2500);
  return { ctx, p };
}
async function blok(id, fn) { if (!bara.includes(id[0])) return; try { await fn(); } catch (e) { kolla(`block ${id} kraschade`, false, { fel: String(e).split("\n")[0] }); } }
const bild = async (p, n) => bilder && p.screenshot({ path: path.join(bilder, n), animations: "disabled", timeout: 45000 }).catch(() => undefined);
const synlig = (p, s) => p.locator(s).first().isVisible().catch(() => false);
async function stangBok(p) { if (await synlig(p, "[data-testid=stang-bok]")) { await p.click("[data-testid=stang-bok]"); await p.waitForTimeout(400); } }


/** Hur många av dammens fem provpunkter (window.__tred.damm) som är vattenblå i en skärmbild. */
async function blaPunkter(p) {
  const pts = await p.evaluate(() => window.__tred?.damm ?? []);
  const png = (await p.screenshot()).toString("base64");
  return p.evaluate(async ({ png, pts }) => {
    const im = new Image();
    im.src = `data:image/png;base64,${png}`;
    await im.decode();
    const c = document.createElement("canvas");
    c.width = im.width;
    c.height = im.height;
    const g = c.getContext("2d");
    g.drawImage(im, 0, 0);
    const mask = pts.map((q) => {
      const [R, G, B] = g.getImageData(q.x, q.y, 1, 1).data;
      return B > 170 && B > R + 40 && B > G - 10;
    });
    return { n: mask.filter(Boolean).length, av: pts.length, mask };
  }, { png, pts });
}

// D + J: dammens vatten syns alltid, också med åtta stora saker på ängen (de står bak, bakom dammen).
// Robust (B6.3, omgjort): ett djupfel (marken svajar upp genom vattnet) syns som att en punkt på vattnet är blå i vissa
// bilder och inte i andra. En sak som står still framför dammen skymmer en punkt i ALLA bilder – det är inget fel.
// Därför: (D0) utan saker blinkar ingen punkt och minst 4 av 5 är blå i alla 24 bilder; (D) med 8 saker är varje punkt antingen blå i alla
// 24 bilder eller i ingen (stabil), och minst 2 är blå. Före B6.3 saknades vattnet helt i en del bilder (0 av 5).
async function dammSerie(p) {
  const serie = [];
  for (let i = 0; i < 24; i++) {
    serie.push(await blaPunkter(p));
    await p.waitForTimeout(350);
  }
  const av = serie[0]?.av ?? 0;
  const perPunkt = Array.from({ length: av }, (_, k) => serie.filter((s) => s.mask[k]).length);
  return { serie, av, perPunkt, minst: Math.min(...serie.map((s) => s.n)) };
}
await blok("D", async () => {
  const { ctx, p } = await sida({});
  await stangBok(p);
  await p.waitForTimeout(1500);
  const tom = await dammSerie(p);
  // Mitten kan ligga under en näckros eller en ring; det är stilla och därför ingen blinkning.
  const tomStabil = tom.perPunkt.every((n) => n === 0 || n === 24);
  kolla("D0 tom äng: ingen punkt blinkar bort och minst 4 av 5 punkter är blå i alla 24 bilder", tom.serie.length === 24 && tom.av === 5 && tomStabil && tom.minst >= 4, { per_punkt: tom.perPunkt.join(","), per_bild: tom.serie.map((s) => s.n).join("") });
  for (const f of ["en bil", "en buss", "en traktor", "ett slott", "en raket", "ett tåg", "en grävmaskin", "en ubåt"]) {
    await p.evaluate((x) => window.__troll.vakna(x), f);
    await p.waitForTimeout(2300);
  }
  await stangBok(p);
  await p.waitForTimeout(1500);
  const full = await dammSerie(p);
  const stabil = full.perPunkt.every((n) => n === 0 || n === 24);
  const synliga = full.perPunkt.filter((n) => n === 24).length;
  kolla("D 8 stora saker: ingen punkt på vattnet blinkar bort (varje punkt blå i alla 24 bilder eller skymd i alla)", full.serie.length === 24 && stabil, { per_punkt: full.perPunkt.join(","), per_bild: full.serie.map((s) => s.n).join("") });
  kolla("D 8 stora saker: minst 2 av 5 punkter syns i varje bild", full.minst >= 2 && synliga >= 2, { minst: full.minst });
  await bild(p, "b63-D-damm-8-saker.png");
  await ctx.close();
});

// H: uppmaningen vid ord utan modell står ≥ 5 s, och ett tryck stänger den
await blok("H", async () => {
  const { ctx, p } = await sida({});
  const mat = async () => {
    await p.click("[data-testid=pennans-bok]");
    await p.waitForTimeout(400);
    const t0 = Date.now();
    await p.evaluate(() => window.__troll.vakna("randig"));
    return t0;
  };
  let t0 = await mat();
  let sist = 0;
  while (Date.now() - t0 < 7500) {
    const t = await p.locator(".banderoller").innerText().catch(() => "");
    if (/kan jag inte rita/.test(t)) sist = Date.now() - t0;
    await p.waitForTimeout(100);
  }
  kolla("H uppmaningen står minst 5 s", sist >= 5000, { ms: sist });
  kolla("H boken stängs", !(await synlig(p, "[data-testid=bok-skarm]")));
  t0 = await mat();
  await p.waitForTimeout(600);
  await bild(p, "b63-H-uppmaning.png");
  await p.locator(".banner.tryck").click();
  await p.waitForTimeout(400);
  const kvar = /kan jag inte rita/.test(await p.locator(".banderoller").innerText().catch(() => ""));
  kolla("H ett tryck stänger uppmaningen", !kvar && Date.now() - t0 < 4000);
  await ctx.close();
});

// I: djur, figurer och småsaker (kaffekanna, väggklocka) runt dammen, fisken i den. Robust: lägena läses i världen (window.__tredPos, så som de ritas,
// vickningen inräknad) och jämförs med dammen (window.__damm) – inte pixlar, som djur framför dammen skymmer.
await blok("I", async () => {
  const { ctx, p } = await sida({});
  // Doodle 06:14: kaffekannan, väggklockan och bebisen hamnade i dammen (M20/M20b-saker).
  const ord = ["en ko", "en gris", "en bebis", "en katt", "en pojke", "en fisk", "ett slott", "en buss", "en kaffekanna", "en väggklocka"];
  // Ängen rymmer 10; fler och den äldsta går till stallet. Därför 10 här.
  for (const f of ord) {
    await p.evaluate((x) => window.__troll.vakna(x), f);
    await p.waitForTimeout(2300);
  }
  await stangBok(p);
  const spar = await p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}").ang ?? []);
  const varst = {};
  for (let i = 0; i < 12; i++) {
    const { pos, damm } = await p.evaluate(() => ({ pos: window.__tredPos ?? {}, damm: window.__damm }));
    for (const d of spar) {
      const q = pos[d.uid];
      if (!q || !damm) continue;
      const a = Math.hypot(q.x - damm.x, q.z - damm.z) - damm.r;
      varst[d.kropp] = Math.min(varst[d.kropp] ?? Infinity, Math.round(a * 100) / 100);
    }
    await p.waitForTimeout(400);
  }
  const land = Object.entries(varst).filter(([k]) => k !== "fisk");
  kolla("I alla 10 skapelser har ett läge (kaffekanna, väggklocka och bebis med)", Object.keys(varst).length === spar.length && spar.length === ord.length && ["kaffekanna", "vaggklocka", "bebis"].every((k) => k in varst), { varst });
  kolla("I inget djur, ingen figur och ingen sak står i dammen (minst 0,1 utanför kanten i alla 12 mätningar)", land.length >= 9 && land.every(([, a]) => a >= 0.1), { varst });
  kolla("I fisken simmar i dammen", (varst.fisk ?? 1) < 0, { fisk: varst.fisk });
  await bild(p, "b63-I-bebis.png");
  await ctx.close();
});

kolla("inga sidfel", fel.length === 0, { fel: fel.slice(0, 5) });
console.log(JSON.stringify(steg, null, 1));
await browser.close();
server.close();
process.exit(steg.every((s) => s.ok) ? 0 : 1);
