// R9J: humöret lever på alla platser. Playwright 375x812 mot dist-pages. Exit 0 = alla steg gröna.
//   node rundor/R9I-fix/r9i-prov.mjs --bilder <mapp>   (exit 0 = alla steg gröna; kräver npm run build:pages)
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
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
const URL0 = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const steg = [];
const kolla = (namn, ok, info = {}) => { steg.push({ namn, ok: !!ok, ...info }); };
const fel = [];
async function sida(spar) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE" });
  await ctx.addInitScript((s) => {
    if (!sessionStorage.getItem("f")) { localStorage.setItem("trollpennan-v2", JSON.stringify(s)); sessionStorage.setItem("f", "1"); }
  }, { version: 2, introSedd: true, dragit: true, ang: [], garden: [], stjarnor: 0, ...spar });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => fel.push(String(e)));
  p.setDefaultTimeout(15000);
  await p.goto(URL0, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__troll, null, { timeout: 20000 });
  await p.waitForTimeout(2500);
  return { ctx, p };
}
async function blok(id, fn) { try { await fn(); } catch (e) { kolla(`block ${id} kraschade`, false, { fel: String(e).split("\n")[0] }); } }
const bild = async (p, n) => bilder && p.screenshot({ path: path.join(bilder, n) });
// Sparningen (localStorage) är spelets eget lager; __troll.state() visar bara ängen.
const sparat = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}"));
const livAv = async (p, uid) => { await p.waitForTimeout(600); return (await sparat(p)).liv?.[uid] ?? null; };
const synlig = (p, s) => p.locator(s).first().isVisible().catch(() => false);
async function malAv(p, uid) {
  for (let i = 0; i < 10; i++) { const m = await p.evaluate((u) => window.__tredMal?.[u] ?? null, uid); if (m) return m; await p.waitForTimeout(400); }
  return null;
}

for (const plats of ["skogen", "sjon", "grottan"]) {
  await blok(plats, async () => {
    const { ctx, p } = await sida({ plats, oppnadePlatser: ["skogen", "sjon", "grottan"], seddaIntro: ["skogen", "sjon", "grottan"], platsSkapelser: {} });
    await p.evaluate(() => window.__troll.vakna("en orange räv"));
    await p.waitForTimeout(2500);
    const uid = (await sparat(p)).platsSkapelser?.[plats]?.[0]?.uid ?? null;
    kolla(`${plats}: räven står på platsen`, !!uid, { uid });
    // Låt tiden gå (samma tickLiv som spelets klocka): djuret ska få ett humör och sedan byta det
    await p.evaluate(() => window.__troll.vila(5000));
    const l1 = await livAv(p, uid);
    kolla(`${plats}: djuret har ett humör`, !!l1?.humor, { humor: l1?.humor });
    await p.evaluate(() => window.__troll.vila(200000));
    const l2 = await livAv(p, uid);
    kolla(`${plats}: humöret byts när tiden gått`, !!l2 && l2.humorMs !== l1?.humorMs, { fore: l1?.humorMs, efter: l2?.humorMs });
    // Sugen på platsen: första trycket öppnar gåvorutan (R9I-regeln gäller också här)
    await p.evaluate((u) => window.__troll.humor(u, "sugen"), uid);
    let gava = false;
    for (const dy of [40, 55, 25, 70]) {
      const m = await malAv(p, uid);
      if (!m) break;
      await p.mouse.click(m.x, m.y + dy); await p.waitForTimeout(800);
      if (await synlig(p, "[data-testid=gava-remsa]")) { gava = true; break; }
    }
    kolla(`${plats}: sugen djur bjuder in till gåva`, gava);
    await bild(p, `r9j-${plats}-gava.png`);
    await ctx.close();
  });
}
kolla("inga sidfel", fel.length === 0, { fel: fel.slice(0, 5) });
await browser.close(); server.close();
const ok = steg.every((s) => s.ok);
console.log(JSON.stringify({ ok, steg }, null, 1));
process.exit(ok ? 0 : 4);
