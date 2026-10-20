// B6.5: attribut ger alltid synlig effekt (A), simmare spridda vid bryggan på sjön (B), stora möbler bak (C). Playwright 375x812.
//   node rundor/B6.5-fix/b65-prov.mjs --bilder <mapp>   (exit 0 = alla steg gröna; kräver npm run build:pages)
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const dist = path.resolve(arg("dist", "dist-pages"));
const bilder = arg("bilder", "");
const bara = arg("bara", "A,B,C").split(",");
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
    window.__tredEffekter = {};
    window.__tredFarg = [];
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
async function vakna(p, ord) { for (const f of ord) { await p.evaluate((x) => window.__troll.vakna(x), f); await p.waitForTimeout(2300); } await stangBok(p); await p.waitForTimeout(1500); }
const sparAng = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}").ang ?? []);

/** Pixlar i skärmbilden: eldfärgade (rött/orange/gult, mättat) och hur många av regnbågens sex nyanser som finns. */
async function pixlar(p) {
  const png = (await p.screenshot()).toString("base64");
  return p.evaluate(async (png) => {
    const im = new Image();
    im.src = `data:image/png;base64,${png}`;
    await im.decode();
    const c = document.createElement("canvas");
    c.width = im.width; c.height = im.height;
    const g = c.getContext("2d");
    g.drawImage(im, 0, 0);
    // bara scenen mellan rubrikraden och knappen
    const d = g.getImageData(0, 170, im.width, 560).data;
    const REG = [[229, 57, 53], [251, 140, 0], [253, 216, 53], [67, 160, 71], [30, 136, 229], [142, 36, 170]];
    const traff = REG.map(() => 0);
    let eld = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], gg = d[i + 1], b = d[i + 2];
      if (r > 220 && gg > 60 && gg < 200 && b < 70) eld++;
      REG.forEach((q, k) => { if (Math.abs(r - q[0]) + Math.abs(gg - q[1]) + Math.abs(b - q[2]) < 40) traff[k]++; });
    }
    return { eld, regnbage: traff };
  }, png);
}

// A: varje attribut ger en effekt, ingen extra skapelse (inget ägg, ingen ande)
await blok("A", async () => {
  const fall = [
    { ord: "en regnbågsfärgad katt", kropp: "katt", effekt: "regnbage", bild: "b65-A-regnbagsfargad-katt.png" },
    { ord: "en brinnande hund", kropp: "hund", effekt: "lagor", bild: "b65-A-brinnande-hund.png" },
    { ord: "en hund med eld", kropp: "hund", effekt: "eld", bild: "b65-A-hund-med-eld.png" },
  ];
  for (const f of fall) {
    const { ctx, p } = await sida({});
    const fore = await pixlar(p);
    await vakna(p, [f.ord]);
    const spar = await sparAng(p);
    kolla(`A '${f.ord}': precis en skapelse, ${f.kropp} (inget ägg, ingen ande)`, spar.length === 1 && spar[0]?.kropp === f.kropp, { kroppar: spar.map((d) => d.kropp) });
    const eff = await p.evaluate(() => window.__tredEffekter ?? {});
    const uid = spar[0]?.uid;
    // R8-3a2: på en GLB-kropp ersätts regnbågen av kroppsmönstret "band" (attribut.json → kroppsmonster.ersatter); bilden nedan
    // ska fortfarande visa regnbågens nyanser
    const monster = f.effekt === "regnbage" ? await p.evaluate((k) => (window.__tredFarg ?? []).some((r) => r.kropp === k && r.monster === "band"), f.kropp) : false;
    kolla(`A '${f.ord}': effekten ${f.effekt} ritas${f.effekt === "regnbage" ? " (eller kroppsmönstret band, R8-3a2)" : ""}`, !!uid && ((eff[uid] ?? []).includes(f.effekt) || monster), { effekter: eff[uid], monster });
    // pixlar: effekten syns (jämfört med ängen före)
    let bast = { eld: 0, regnbage: [0, 0, 0, 0, 0, 0] };
    for (let i = 0; i < 6; i++) { const m = await pixlar(p); if (m.eld > bast.eld) bast.eld = m.eld; bast.regnbage = bast.regnbage.map((v, k) => Math.max(v, m.regnbage[k])); await p.waitForTimeout(300); }
    if (f.effekt === "regnbage") {
      const nyanser = bast.regnbage.filter((v, k) => v - fore.regnbage[k] >= 15).length;
      kolla(`A '${f.ord}': minst 4 av regnbågens 6 nyanser syns i bilden`, nyanser >= 4, { fore: fore.regnbage.join(","), efter: bast.regnbage.join(",") });
    } else kolla(`A '${f.ord}': eldfärgade pixlar syns (minst 80 fler än före)`, bast.eld - fore.eld >= 80, { fore: fore.eld, efter: bast.eld });
    await bild(p, f.bild);
    await ctx.close();
  }
});

// B: fem simmare på sjön sprids över vattnet (förut en klump vid bryggan)
await blok("B", async () => {
  const { ctx, p } = await sida({ plats: "sjon" });
  const ord = ["en fisk", "en haj", "en delfin", "en narval", "en säl"];
  await vakna(p, ord);
  const pos = await p.evaluate(() => window.__tredPos ?? {});
  const L = Object.values(pos);
  let minst = Infinity;
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) minst = Math.min(minst, Math.hypot(L[i].x - L[j].x, L[i].z - L[j].z));
  const xs = L.map((q) => q.x);
  kolla("B sjön: fem simmare har ett läge", L.length >= 5, { antal: L.length });
  kolla("B sjön: simmarna klumpar sig inte (minst 0,7 isär, spridda ≥ 1,5 i x)", minst >= 0.7 && Math.max(...xs) - Math.min(...xs) >= 1.5, { minst: Math.round(minst * 100) / 100, x: xs.map((x) => Math.round(x * 100) / 100).join(" ") });
  const mal = Object.values(await p.evaluate(() => window.__tredMal ?? {}));
  kolla("B sjön: alla fem simmare syns i bilden (skärmläge inom 375×812)", mal.length >= 5 && mal.every((q) => q.x >= 0 && q.x <= 375 && q.y >= 0 && q.y <= 812), { skarm: mal.map((q) => `${Math.round(q.x)},${Math.round(q.y)}`).join(" ") });
  await bild(p, "b65-B-sjon-simmare.png");
  await ctx.close();
});

// C: matbordet står bak (bakom småsakerna), skymmer dem inte
await blok("C", async () => {
  const { ctx, p } = await sida({});
  await vakna(p, ["en kopp", "en kaffekanna", "ett matbord", "en tekopp"]);
  const spar = await sparAng(p);
  const pos = await p.evaluate(() => window.__tredPos ?? {});
  const z = Object.fromEntries(spar.map((d) => [d.kropp, pos[d.uid]?.z]));
  const sma = ["kopp", "kaffekanna", "tekopp"].map((k) => z[k]).filter((v) => typeof v === "number");
  kolla("C matbordet står bakom småsakerna", typeof z.matbord === "number" && sma.length === 3 && sma.every((v) => z.matbord < v), { z });
  await bild(p, "b65-C-matbord-bak.png");
  await ctx.close();
});

kolla("inga sidfel", fel.length === 0, { fel: fel.slice(0, 5) });
console.log(JSON.stringify(steg, null, 1));
await browser.close();
server.close();
process.exit(steg.every((s) => s.ok) ? 0 : 1);
