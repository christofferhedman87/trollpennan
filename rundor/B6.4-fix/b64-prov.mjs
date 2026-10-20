// B6.4: utan färgord visar GLB-kroppen modellens egna färger – jultomte, brandman, narval och kraken (om M19 är körd),
//   alla skrivna första gången (guldord → glans, det som tidigare gjorde dem orange/laxrosa/bleka/lavendel).
//   Med färgord ("en blå jultomte") gäller samma som förut. Playwright 375x812.
//   node rundor/B6.4-fix/b64-prov.mjs --bilder <mapp>   (exit 0 = alla steg gröna; kräver npm run build:pages)
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
const kolla = (namn, ok, info = {}) => { steg.push({ namn, ok: !!ok, ...info }); console.error(`${ok ? "ok  " : "FEL "} ${namn}`); };
const fel = [];
const PLATSER = ["skogen", "sjon", "grottan"];
async function sida(spar) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE" });
  await ctx.addInitScript(() => { window.__tredFarg = []; });
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
const sparat = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}"));
async function malAv(p, uid) {
  for (let i = 0; i < 15; i++) { const m = await p.evaluate((u) => window.__tredMal?.[u] ?? null, uid); if (m) return m; await p.waitForTimeout(400); }
  return null;
}
const ENT = JSON.parse(fs.readFileSync("data/entiteter.json", "utf8")).entiteter;
// Pixlarna i en ruta kring figuren: avkodas i sidan (canvas), räknar mättade röda (nyans < 8° eller > 350°), orange (12–30°) och blå; ljusa texlar (hud) räknas inte.
async function nyanser(p, png, ruta) {
  return p.evaluate(async ({ b64, r }) => {
    const im = new Image(); im.src = "data:image/png;base64," + b64; await im.decode();
    const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; const g = c.getContext("2d"); g.drawImage(im, 0, 0);
    const d = g.getImageData(r.x, r.y, r.w, r.h).data; let rod = 0, orange = 0, bla = 0;
    for (let i = 0; i < d.length; i += 4) {
      const R = d[i] / 255, G = d[i + 1] / 255, B = d[i + 2] / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2;
      if (mx - mn < 0.3) continue; const s = (mx - mn) / (1 - Math.abs(2 * l - 1)); if (s < 0.55 || l > 0.72) continue;
      let h = mx === R ? ((G - B) / (mx - mn)) % 6 : mx === G ? (B - R) / (mx - mn) + 2 : (R - G) / (mx - mn) + 4; h = (h * 60 + 360) % 360;
      if (h < 8 || h > 350) rod++; else if (h >= 12 && h <= 30) orange++; else if (h >= 200 && h <= 250) bla++;
    }
    return { rod, orange, bla };
  }, { b64: png.toString("base64"), r: ruta });
}
async function figur(fras, kropp) {
  const { ctx, p } = await sida({});
  await p.evaluate((f) => window.__troll.vakna(f), fras);
  await p.waitForTimeout(3500);
  const s = await sparat(p);
  const v = s.ang?.at(-1);
  const mal = v ? await malAv(p, v.uid) : null;
  await p.waitForTimeout(800);
  const rader = await p.evaluate((k) => (window.__tredFarg ?? []).filter((r) => r.kropp === k), kropp);
  const hel = await p.screenshot({ animations: "disabled", timeout: 45000 });
  const ruta = mal ? { x: Math.max(0, mal.x - 45), y: Math.max(0, mal.y - 30), w: 90, h: 110 } : { x: 0, y: 250, w: 375, h: 350 };
  ruta.w = Math.min(ruta.w, 375 - ruta.x); ruta.h = Math.min(ruta.h, 812 - ruta.y);
  const ny = await nyanser(p, hel, ruta);
  const namn = `b64-${fras.replace(/^en /, "").replace(/ /g, "-").replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o")}`;
  if (bilder) { fs.writeFileSync(path.join(bilder, `${namn}.png`), hel); await p.screenshot({ path: path.join(bilder, `${namn}-nara.png`), clip: { x: ruta.x, y: ruta.y, width: ruta.w, height: ruta.h }, animations: "disabled" }); }
  await ctx.close();
  return { v, rader, ny, glans: !!v?.glans };
}

const UTAN = ["jultomte", "brandman", "narval", "kraken"];
for (const id of UTAN) {
  if (!ENT[id]) { kolla(`${id}: finns inte i datan (M19 inte körd) – hoppas över`, true, { hoppad: true }); continue; }
  try {
    const { v, rader, ny, glans } = await figur(`en ${id}`, id);
    const andrade = rader.filter((r) => r.efter !== r.fore || r.sjalvlyse !== "#000000" || !r.egenKarta);
    kolla(`${id} utan färgord: skapad med guldord (glans), ${rader.length} material, alla med egen färg, egen textur och inget självlyse`, v?.kropp === id && glans && rader.length > 0 && andrade.length === 0, { andrade: andrade.slice(0, 4), ny, palett: !!ENT[id].palett, material: !!ENT[id].material });
    if (id === "jultomte") kolla("jultomte utan färgord: dräkten är röd, inte orange (pixlar kring figuren)", ny.rod > 150 && ny.rod > 3 * ny.orange, ny);
  } catch (e) { kolla(`${id} kraschade`, false, { fel: String(e).split("\n")[0] }); }
}
try {
  const { v, rader, ny } = await figur("en blå jultomte", "jultomte");
  const bytta = rader.filter((r) => !r.egenKarta || r.efter !== r.fore);
  kolla("en blå jultomte: färgordet tar som förut (texturen palettbytt, blå pixlar kring figuren)", v?.farg === "#1E88E5" && bytta.length > 0 && ny.bla > 60, { bytta: bytta.length, ny });
} catch (e) { kolla("en blå jultomte kraschade", false, { fel: String(e).split("\n")[0] }); }

kolla("inga sidfel", fel.length === 0, { fel: fel.slice(0, 5) });
console.log(JSON.stringify(steg, null, 1));
await browser.close();
server.close();
process.exit(steg.every((s) => s.ok) ? 0 : 1);
