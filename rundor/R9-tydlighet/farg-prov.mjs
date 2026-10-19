// R9: mäter att färgordet träffar på vita/gråa djur. Per fall: bild utan djur, bild med djur, differensen (nya pixlar) -> dominant nyans mot målnyansen.
// Användning: node rundor/R9-tydlighet/farg-prov.mjs --dist dist-pages --namn efter --ut docs/skarmbilder/r9/farg  (exit 0 = alla fall inom ±14° och färgade). Skriver <namn>-matt.json och en bild per fall.
// Gäller 'före' också: kör mot en build av main med --namn fore (exit-kod ignoreras då).
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const dist = path.resolve(arg("dist", "dist-pages"));
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let f = path.join(dist, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, "index.html");
  res.setHeader("Content-Type", mime[path.extname(f)] ?? "application/octet-stream");
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const server_ = 0;

const ut = path.resolve(arg("ut", "farg"));
const namn = arg("namn", "efter");
fs.mkdirSync(ut, { recursive: true });
const MAL = { blå: 207, röd: 1, grön: 123, gul: 54 };
const FALL = (arg("fall", "") ? arg("fall", "").split(",").map((x) => x.split(" ")) : [["blå", "isbjörn"], ["röd", "isbjörn"], ["grön", "isbjörn"], ["gul", "isbjörn"], ["blå", "elefant"], ["röd", "koala"], ["grön", "lamm"], ["gul", "ko"]]);
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ana = await browser.newPage();
const analysera = (a, b) => ana.evaluate(async ([A, B]) => {
  const las = (u) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = u; });
  const [ia, ib] = await Promise.all([las(A), las(B)]);
  const c = (i) => { const k = document.createElement("canvas"); k.width = i.width; k.height = i.height; const x = k.getContext("2d"); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height).data; };
  const da = c(ia), db = c(ib);
  const W = ia.width, H = ia.height, mask = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) { const o = i * 4; if (Math.max(Math.abs(da[o] - db[o]), Math.abs(da[o + 1] - db[o + 1]), Math.abs(da[o + 2] - db[o + 2])) >= 45) mask[i] = 1; }
  // djuret är den största sammanhängande differensytan (gräs och fjärilar ger små, spridda fläckar)
  const lab = new Int32Array(W * H); let bast = [], id = 0;
  for (let i = 0; i < W * H; i++) {
    if (!mask[i] || lab[i]) continue;
    id++; const st = [i], bit = []; lab[i] = id;
    while (st.length) { const q = st.pop(); bit.push(q); const x = q % W, y = (q / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const k = ny * W + nx; if (mask[k] && !lab[k]) { lab[k] = id; st.push(k); } } }
    if (bit.length > bast.length) bast = bit;
  }
  let n = bast.length, farg = 0, sx = 0, sy = 0; const hs = [];
  for (const q of bast) {
    const i = q * 4;
    const r = db[i] / 255, g = db[i + 1] / 255, bl = db[i + 2] / 255, mx = Math.max(r, g, bl), mn = Math.min(r, g, bl), l = (mx + mn) / 2, d = mx - mn;
    if (d === 0) continue; const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (s < 0.25 || l < 0.15 || l > 0.92) continue;
    const h = (mx === r ? (g - bl) / d + (g < bl ? 6 : 0) : mx === g ? (bl - r) / d + 2 : (r - g) / d + 4) * 60;
    farg++; hs.push(h);
  }
  // dominant nyans = toppen i ett histogram (öron, nos och mönster som behåller sin färg ska inte dra medelvärdet)
  const bins = new Array(36).fill(0);
  for (const h of hs) bins[Math.floor(h / 10) % 36]++;
  const topp = bins.indexOf(Math.max(...bins)) * 10 + 5;
  for (const h of hs) { const dd = Math.min(Math.abs(h - topp), 360 - Math.abs(h - topp)); if (dd <= 25) { sx += Math.cos(h * Math.PI / 180); sy += Math.sin(h * Math.PI / 180); } }
  return { diffpixlar: n, farg, andel_farg: n ? +(farg / n).toFixed(2) : 0, nyans: farg ? Math.round(((Math.atan2(sy, sx) * 180) / Math.PI + 360) % 360) : null };
}, [a, b]);
const res = [];
for (const [f, d] of FALL) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE" });
  await ctx.addInitScript((over) => { if (over) localStorage.setItem("trollpennan-miljo", over); if (!sessionStorage.getItem("f")) { localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true })); sessionStorage.setItem("f", "1"); } }, arg("miljo", ""));
  const p = await ctx.newPage();
  p.setDefaultTimeout(15000);
  await p.goto(`http://127.0.0.1:${server.address().port}/?kvalitet=hog`, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__troll, null, { timeout: 30000 });
  await p.waitForTimeout(2500);
  const klipp = { x: 0, y: 260, width: 375, height: 440 };
  const A = (await p.screenshot({ clip: klipp })).toString("base64");
  await p.evaluate((x) => window.__troll.vakna(x), `en ${f} ${d}`);
  await p.waitForTimeout(6500);
  const bild = await p.screenshot({ clip: klipp });
  const sparad = await p.evaluate(() => { const a = JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}").ang ?? []; return a.at(-1)?.farg ?? null; });
  fs.writeFileSync(path.join(ut, `${namn}-${f}-${d}.png`), bild);
  const r = await analysera(`data:image/png;base64,${A}`, `data:image/png;base64,${bild.toString("base64")}`);
  const avst = r.nyans === null ? null : Math.min(Math.abs(r.nyans - MAL[f]), 360 - Math.abs(r.nyans - MAL[f]));
  res.push({ fall: `${f} ${d}`, mal: MAL[f], sparad_farg: sparad, ...r, avvikelse: avst, ok: avst !== null && avst <= 14 && r.andel_farg >= 0.2 });
  await ctx.close();
}
fs.writeFileSync(path.join(ut, `${namn}-matt.json`), JSON.stringify(res, null, 1));
console.log(JSON.stringify(res));
await browser.close();
server.close();
process.exit(res.every((r) => r.ok) ? 0 : 1);
