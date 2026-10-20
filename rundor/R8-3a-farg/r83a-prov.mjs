// R8-3a: färgordet färgar hela kroppen på alla modeller (GLB med textur, materialfärger eller båda), ögon och detaljer behålls.
//   Utan färgord: modellens egna färger (B6.4 gäller). Playwright 375x812, swiftshader.
//   node rundor/R8-3a-farg/r83a-prov.mjs [--bilder <mapp>] [--bara <id,...>]   (exit 0 = alla steg gröna; kräver npm run build:pages)
//   Mått: i en ruta kring figuren räknas mättade pixlar (s ≥ 0,45, 0,12 < l < 0,85) per nyansfack, FÖRE (tom äng) och EFTER (figuren).
//   Andelen = nya pixlar inom ±20° från målnyansen / alla nya mättade pixlar. Kroppens färg ska dominera.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const dist = path.resolve(arg("dist", "dist-pages"));
const bilder = arg("bilder", "");
const miljo = arg("miljo", "");
const bara = arg("bara", "") ? arg("bara", "").split(",") : null;
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
const kolla = (namn, ok, info = {}) => { steg.push({ namn, ok: !!ok, ...info }); console.error(`${ok ? "ok  " : "FEL "} ${namn} ${JSON.stringify(info).slice(0, 220)}`); };
const fel = [];
async function sida() {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE" });
  await ctx.addInitScript((m) => { window.__tredFarg = []; if (m) localStorage.setItem("trollpennan-miljo", m); }, miljo);
  await ctx.addInitScript((s) => {
    if (!sessionStorage.getItem("f")) { localStorage.setItem("trollpennan-v2", JSON.stringify(s)); sessionStorage.setItem("f", "1"); }
  }, { version: 2, introSedd: true, dragit: true, ang: [], garden: [], stjarnor: 0, oppnadePlatser: [], seddaIntro: ["garden", "gard"], platsSkapelser: {} });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => fel.push(String(e).slice(0, 300)));
  p.setDefaultTimeout(20000);
  await p.goto(URL0, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__troll, null, { timeout: 30000 });
  await p.waitForTimeout(2500);
  return { ctx, p };
}
async function malAv(p, uid) {
  for (let i = 0; i < 15; i++) { const m = await p.evaluate((u) => window.__tredMal?.[u] ?? null, uid); if (m) return m; await p.waitForTimeout(400); }
  return null;
}
// Andel av figurens pixlar (de som ändrats mot tomma ängen) som har målnyansen: hela kroppen ska bära färgen, inte bara öron.
async function tackning(p, fore, efter, r, mal) {
  return p.evaluate(async ({ a, b, r, mal }) => {
    const las = async (b64) => { const im = new Image(); im.src = "data:image/png;base64," + b64; await im.decode(); const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; const g = c.getContext("2d"); g.drawImage(im, 0, 0); return g.getImageData(r.x, r.y, r.w, r.h).data; };
    const A = await las(a), B = await las(b); let andrad = 0, traff = 0;
    for (let i = 0; i < B.length; i += 4) {
      if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) < 60) continue;
      andrad++;
      const R = B[i] / 255, G = B[i + 1] / 255, Bl = B[i + 2] / 255, mx = Math.max(R, G, Bl), mn = Math.min(R, G, Bl), l = (mx + mn) / 2;
      if (mx - mn < 0.12 || l <= 0.08 || l >= 0.9) continue; const s = (mx - mn) / (1 - Math.abs(2 * l - 1)); if (s < 0.35) continue;
      let h = mx === R ? ((G - Bl) / (mx - mn)) % 6 : mx === G ? (Bl - R) / (mx - mn) + 2 : (R - G) / (mx - mn) + 4; h = (h * 60 + 360) % 360;
      const dd = Math.min(Math.abs(h - mal), 360 - Math.abs(h - mal)); if (dd <= 22) traff++;
    }
    return { andrad, traff, andel: andrad ? +(traff / andrad).toFixed(2) : 0 };
  }, { a: fore.toString("base64"), b: efter.toString("base64"), r, mal });
}
async function fack(p, png, r) {
  return p.evaluate(async ({ b64, r }) => {
    const im = new Image(); im.src = "data:image/png;base64," + b64; await im.decode();
    const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; const g = c.getContext("2d"); g.drawImage(im, 0, 0);
    const d = g.getImageData(r.x, r.y, r.w, r.h).data; const f = new Array(36).fill(0);
    for (let i = 0; i < d.length; i += 4) {
      const R = d[i] / 255, G = d[i + 1] / 255, B = d[i + 2] / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2;
      if (mx - mn < 0.12 || l <= 0.12 || l >= 0.85) continue; const s = (mx - mn) / (1 - Math.abs(2 * l - 1)); if (s < 0.45) continue;
      let h = mx === R ? ((G - B) / (mx - mn)) % 6 : mx === G ? (B - R) / (mx - mn) + 2 : (R - G) / (mx - mn) + 4; h = (h * 60 + 360) % 360;
      f[Math.floor(h / 10) % 36]++;
    }
    return f;
  }, { b64: png.toString("base64"), r });
}
const inom = (f, h, w = 20) => f.reduce((s, n, i) => { const c = i * 10 + 5; const dd = Math.min(Math.abs(c - h), 360 - Math.abs(c - h)); return s + (dd <= w ? n : 0); }, 0);
const summa = (f) => f.reduce((a, b) => a + b, 0);
const ENT = JSON.parse(fs.readFileSync("data/entiteter.json", "utf8")).entiteter;
const filnamn = (s) => s.replace(/^(en|ett) /, "").replace(/ /g, "-").replace(/[åä]/g, "a").replace(/ö/g, "o");
async function figur(fras, hMal) {
  const { ctx, p } = await sida();
  const fore = await p.screenshot({ animations: "disabled", timeout: 45000 });
  await p.evaluate((f) => window.__troll.vakna(f), fras);
  await p.waitForTimeout(3500);
  const s = await p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}"));
  const v = s.ang?.at(-1);
  const mal = v ? await malAv(p, v.uid) : null;
  await p.waitForTimeout(900);
  const rader = await p.evaluate((k) => (window.__tredFarg ?? []).filter((r) => r.kropp === k), v?.kropp);
  const efter = await p.screenshot({ animations: "disabled", timeout: 45000 });
  const r = mal ? { x: Math.max(0, Math.round(mal.x) - 60), y: Math.max(0, Math.round(mal.y) - 45), w: 120, h: 140 } : { x: 0, y: 250, w: 375, h: 350 };
  r.w = Math.min(r.w, 375 - r.x); r.h = Math.min(r.h, 812 - r.y);
  const f0 = await fack(p, fore, r), f1 = await fack(p, efter, r);
  const ny = f1.map((n, i) => Math.max(0, n - f0[i]));
  const tack = await tackning(p, fore, efter, r, hMal);
  if (bilder) { fs.writeFileSync(path.join(bilder, `r83a-${filnamn(fras)}.png`), efter); await p.screenshot({ path: path.join(bilder, `r83a-${filnamn(fras)}-nara.png`), clip: { x: r.x, y: r.y, width: r.w, height: r.h }, animations: "disabled" }); }
  await ctx.close();
  return { v, rader, ny, tack };
}
// [fras, kropp, målnyans (null = utan färgord), min andel, min antal pixlar]
const TACK = 0.35;
const FALL = [
  ["en blå katt", "katt", 210, 0.6, 250],
  ["en röd hund", "hund", 2, 0.6, 250],
  ["en gul kraken", "kraken", 52, 0.6, 250],
  ["en blå jultomte", "jultomte", 210, 0.6, 250],
  ["en grön narval", "narval", 120, 0.5, 150],
  ["en röd elefant", "elefant", 2, 0.6, 250],
  ["en blå bil", "bil", 210, 0.5, 150],
  ["en lila drake", "drake", 285, 0.5, 250],
  ["en jultomte", "jultomte", 2, 0.5, 200],
  ["en kraken", "kraken", 285, 0.5, 200],
];
for (const [fras, kropp, h, andel, minN] of FALL) {
  if (bara && !bara.includes(kropp)) continue;
  if (!ENT[kropp]) { kolla(`${fras}: ${kropp} finns inte i datan – hoppas över`, true, { hoppad: true }); continue; }
  try {
    const { v, rader, ny, tack } = await figur(fras, h);
    const n = summa(ny), t = inom(ny, h);
    const utan = !/^(en|ett) (blå|röd|gul|grön|lila) /.test(fras);
    const info = { kropp: v?.kropp, farg: v?.farg ?? null, nya: n, inom: t, andel: n ? +(t / n).toFixed(2) : 0, tackning: tack, toppfack: ny.map((x, i) => [i * 10, x]).sort((a, b) => b[1] - a[1]).slice(0, 4), material: rader.length, andrade: rader.filter((r) => r.efter !== r.fore || !r.egenKarta).length };
    if (utan) {
      kolla(`${fras} (utan färgord): egna färger, inget material ändrat, nyans ${h}° dominerar`, v?.kropp === kropp && rader.length > 0 && info.andrade === 0 && rader.every((r) => r.sjalvlyse === "#000000") && t >= minN && t / n >= andel, info);
    } else {
      const delvis = rader.filter((r) => r.efter !== r.fore || !r.egenKarta).length;
      kolla(`${fras}: kroppen i målnyansen ${h}° (≥ ${andel * 100} % av de nya mättade pixlarna, ≥ ${minN} st, ≥ ${TACK * 100} % av figurens pixlar)`, v?.kropp === kropp && delvis > 0 && t >= minN && t / n >= andel && tack.andel >= TACK, info);
    }
  } catch (e) { kolla(`${fras} kraschade`, false, { fel: String(e).split("\n")[0] }); }
}
kolla("inga sidfel", fel.length === 0, { fel: fel.slice(0, 5) });
console.log(JSON.stringify(steg, null, 1));
await browser.close();
server.close();
process.exit(steg.every((s) => s.ok) ? 0 : 1);
