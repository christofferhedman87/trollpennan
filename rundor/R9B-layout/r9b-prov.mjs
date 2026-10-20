// R9B: bevis att 'Prova en idé' syns utan rullning i boken med uppdrag (375x812 och 1280x800), att förslagsraden börjar vid vänsterkanten
// (etiketten inte avklippt) och att Bengtsson-figuren är skärmrelativ (data/npc.json storlek.hojd). Bild per storlek.
// Användning: node rundor/R9B-layout/r9b-prov.mjs --ut docs/skarmbilder/r9b [--dist dist-pages]  (kräver npm run build:pages). exit 0 = allt stämde.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const dist = path.resolve(arg("dist", "dist-pages"));
const ut = path.resolve(arg("ut", "r9b"));
fs.mkdirSync(ut, { recursive: true });
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let f = path.join(dist, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, "index.html");
  res.setHeader("Content-Type", mime[path.extname(f)] ?? "application/octet-stream");
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const res = [];
for (const [w, h] of [[375, 812], [1280, 800]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, locale: "sv-SE" });
  await ctx.addInitScript(() => { if (!sessionStorage.getItem("f")) { localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true })); sessionStorage.setItem("f", "1"); } });
  const p = await ctx.newPage();
  const fel = [];
  p.on("pageerror", (e) => fel.push(String(e)));
  p.setDefaultTimeout(15000);
  await p.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__troll, null, { timeout: 30000 });
  await p.waitForTimeout(1500);
  const t = (id) => p.getByTestId(id);
  const m = { storlek: `${w}x${h}`, fel };
  // figuren: tre djur -> Bengtsson bjuder in
  for (const d of ["en rosa kanin", "en blå katt", "en grön groda"]) { await p.evaluate((x) => window.__troll.vakna(x), d); await p.waitForTimeout(600); }
  await t("npc-figur").waitFor();
  await p.waitForTimeout(700);
  m.figur_hojd = Math.round((await t("npc-figur").boundingBox()).height);
  m.figur_mal = Math.round(Math.min(340, Math.max(176, 0.3 * h)));
  await p.screenshot({ path: path.join(ut, `${w}-figur.png`) });
  // två uppdrag: kanin fryser och regn (längre etikett)
  for (const nr of [1, 2]) {
    await t("npc-figur").or(t("bengtsson-ikon")).first().click();
    await t("uppdrag-remsa").waitFor();
    await p.waitForTimeout(500);
    const prova = await p.locator(".skapar-guide summary").last().boundingBox();
    const remsa = await t("remsa").boundingBox();
    const rad = await p.evaluate(() => {
      const r = document.querySelector("[data-testid=uppdrag-val]");
      if (!r) return null;
      const f = r.firstElementChild.getBoundingClientRect(), b = r.getBoundingClientRect();
      return { scrollLeft: r.scrollLeft, forsta_x: Math.round(f.left), rad_x: Math.round(b.left) };
    });
    m[`uppdrag${nr}`] = { prova_nederkant: Math.round(prova.y + prova.height), remsa_topp: Math.round(remsa.y), prova_syns: prova.y >= 0 && prova.y + prova.height <= remsa.y + 1, rad, etikett_hel: !!rad && rad.scrollLeft === 0 && rad.forsta_x >= rad.rad_x, ingen_gata_under_uppdrag: (await p.locator("[data-testid=ledtrad]").count()) === 0 }; // B6.2: R9I/B6.1 – ingen gåta alls under uppdrag (den kompakta gåtan är borttagen)
    await p.screenshot({ path: path.join(ut, `${w}-uppdrag${nr}.png`) });
    if (nr === 1) {
      await t("uppdrag-val-fras").first().click();
      await t("vakna").click();
      await p.waitForTimeout(900);
      if ((await t("stang-bok").count()) > 0) await t("stang-bok").click();
      await p.waitForTimeout(600);
    }
  }
  m.ok = m.figur_hojd >= m.figur_mal - 2 && m.figur_hojd <= m.figur_mal + 2 && [m.uppdrag1, m.uppdrag2].every((u) => u.prova_syns && u.etikett_hel && u.ingen_gata_under_uppdrag) && fel.length === 0;
  res.push(m);
  await ctx.close();
}
console.log(JSON.stringify(res, null, 1));
await browser.close();
server.close();
process.exit(res.every((r) => r.ok) ? 0 : 1);
