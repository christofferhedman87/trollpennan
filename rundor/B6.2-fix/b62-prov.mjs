// B6.2: "ljus" som sak, räven på sjön med avstånd till vattnet, final_fore när platsens final öppnas. Playwright 375x812.
//   node rundor/B6.2-fix/b62-prov.mjs --bilder <mapp>   (exit 0 = alla steg gröna; kräver npm run build:pages)
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const dist = path.resolve(arg("dist", "dist-pages"));
const bilder = arg("bilder", "");
const bara = arg("bara", "L,R,F").split(",");
if (bilder) fs.mkdirSync(bilder, { recursive: true });
const BENGT = JSON.parse(fs.readFileSync("data/bengtsson.json", "utf8"));
const PLATSDATA = JSON.parse(fs.readFileSync("data/platser.json", "utf8"));
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
const sparat = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}"));
const synlig = (p, s) => p.locator(s).first().isVisible().catch(() => false);
async function malAv(p, uid) {
  for (let i = 0; i < 15; i++) { const m = await p.evaluate((u) => window.__tredMal?.[u] ?? null, uid); if (m) return m; await p.waitForTimeout(400); }
  return null;
}
async function nyttDjur(p, plats, fras) {
  await p.evaluate((f) => window.__troll.vakna(f), fras);
  await p.waitForTimeout(2800);
  const s = await sparat(p);
  return plats === "ang" ? s.ang?.at(-1)?.uid : s.platsSkapelser?.[plats]?.at(-1)?.uid;
}
async function stangBok(p) { if (await synlig(p, "[data-testid=stang-bok]")) { await p.click("[data-testid=stang-bok]"); await p.waitForTimeout(400); } }

// L: "ljus" är en sak
await blok("L", async () => {
  const { ctx, p } = await sida({});
  for (const [fras, kropp] of [["ett ljus", "ljus"], ["en ljus katt", "katt"]]) {
    await p.evaluate((f) => window.__troll.vakna(f), fras);
    await p.waitForTimeout(2800);
    const d = (await sparat(p)).ang?.at(-1);
    kolla(`L "${fras}" blir ${kropp}`, d?.kropp === kropp, { kropp: d?.kropp });
  }
  await stangBok(p);
  await bild(p, "b62-L-ljus.png");
  await ctx.close();
});

// R: räven på sjön med strand framför sig (skärmpunkt under vattenkanten med marginal)
await blok("R", async () => {
  const { ctx, p } = await sida({ plats: "sjon" });
  const uid = await nyttDjur(p, "sjon", "en räv");
  await stangBok(p);
  await p.waitForTimeout(2000);
  const m = await malAv(p, uid);
  kolla("R räven syns på sjön", !!m, { m });
  await bild(p, "b62-R-rav-sjon.png");
  await ctx.close();
});

// F: final_fore – när skogens milstolpe är nådd säger Bengtsson platsens final_fore-replik och finalen startar
await blok("F", async () => {
  const skog = BENGT.uppdrag.filter((u) => u.omrade === "skogen");
  const final = skog.find((u) => u.final);
  const klara = Object.fromEntries(skog.filter((u) => !u.final).map((u) => [u.id, "klar"]));
  const fore = PLATSDATA.platser.find((x) => x.id === "skogen").final_fore.text;
  const { ctx, p } = await sida({ plats: "skogen", uppdrag: klara });
  const banners = [];
  const stopp = setInterval(() => p.locator(".banderoller").innerText().then((t) => t && banners.push(t)).catch(() => undefined), 150);
  let startad = false;
  for (let i = 0; i < 6 && !startad; i++) {
    await p.locator("[data-testid=npc-figur], [data-testid=bengtsson-ikon]").first().click({ timeout: 10000 }).catch(() => undefined);
    await p.waitForTimeout(1200);
    startad = (await sparat(p)).uppdrag?.[final.id] === "pagar";
    if (!startad) await p.waitForTimeout(3000);
  }
  clearInterval(stopp);
  kolla("F skogens final startar när milstolpen är nådd", startad, { final: final.id });
  kolla("F Bengtsson säger final_fore", banners.some((b) => b.includes(fore.slice(0, 30))), { banners: [...new Set(banners)].slice(0, 4) });
  await bild(p, "b62-F-final-fore.png");
  await ctx.close();
});

kolla("inga sidfel", fel.length === 0, { fel: fel.slice(0, 5) });
await browser.close(); server.close();
const ok = steg.every((s) => s.ok);
console.log(JSON.stringify({ ok, steg }, null, 1));
process.exit(ok ? 0 : 4);
