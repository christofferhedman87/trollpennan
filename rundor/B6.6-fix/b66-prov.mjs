// B6.6: "skapad men osynlig" – varje tillgång med modell (entiteter.json) läggs på ängen, tio åt gången, och mäts på skärmen
// (window.__tredSyn: skärmrutan för modellens yta, antal synliga meshar). Playwright 375x812.
//   node rundor/B6.6-fix/b66-prov.mjs [--bara kvast,teve] [--ut <json>] [--bilder <mapp> [--alltid]]   (exit 0 = alla syns)
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const dist = path.resolve(arg("dist", "dist-pages"));
const ut = arg("ut", "");
const bilder = arg("bilder", "");
if (bilder) fs.mkdirSync(bilder, { recursive: true });
const E = JSON.parse(fs.readFileSync("data/entiteter.json", "utf8")).entiteter;
const T = JSON.parse(fs.readFileSync("data/tillgangar.json", "utf8")).tillgangar;
const bara = arg("bara", "") ? arg("bara").split(",") : null;
const endastBygg = process.argv.includes("--endast-bygg");
const ids = endastBygg ? [] : Object.keys(E).filter((k) => E[k].modell && T[E[k].modell]?.fil && E[k].typ !== "tillbehor" && (!bara || bara.includes(k)));
// Gränser (CSS-px på 375×812): största mått ≥ 24 px, minsta ≥ 4 px, yta ≥ 200 px². Mitten i scenen (x 0–375, y 150–740).
// Stora saker (storlek.json zon "bak") står längst bak bredvid grinden; för dem räcker en fjärdedel av rutan i bild (se PLAN.md).
const MIN_STORST = 24, MIN_MINST = 4, MIN_YTA = 200;
const S = JSON.parse(fs.readFileSync("data/storlek.json", "utf8"));
const bak = (k) => { const id = S.ids?.[k] ?? S.kategori?.[E[k].kategori]; return E[k].typ !== "djur" && S.klasser?.[id]?.zon === "bak"; };
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
const fel = [];
const matt = {};
const sparad = (kropp, i) => ({ uid: `b66-${i}-${kropp}`, // i = plats i gruppen (0–9)
  kropp, formel: `en ${kropp}`, beskrivning: "", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [], skapad: 1000 + i });
const andelIBild = (m) => { const ix = Math.max(0, Math.min(375, m.x + m.w) - Math.max(0, m.x)); const iy = Math.max(0, Math.min(740, m.y + m.h) - Math.max(150, m.y)); return (ix * iy) / Math.max(1, m.w * m.h); };
const mittIBild = (m) => { const cx = m.x + m.w / 2, cy = m.y + m.h / 2; return cx >= 0 && cx <= 375 && cy >= 150 && cy <= 740; };
const varfor = (k, m) => {
  if (!m) return "ingen mätning";
  if (m.mesh === 0) return "ingen synlig mesh";
  if (Math.max(m.w, m.h) < MIN_STORST || Math.min(m.w, m.h) < MIN_MINST || m.w * m.h < MIN_YTA) return "för liten";
  if (bak(k) ? andelIBild(m) < 0.25 : !mittIBild(m)) return "utanför bilden";
  return null;
};
const alltid = process.argv.includes("--alltid");
for (let s = 0; s < ids.length; s += 10) {
  const grupp = ids.slice(s, s + 10);
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE" });
  await ctx.addInitScript((ang) => {
    window.__tredSyn = {};
    localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, dragit: true, ang, garden: [], stjarnor: 0, oppnadePlatser: [], seddaIntro: ["garden", "gard"], platsSkapelser: {} }));
  }, grupp.map(sparad));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => fel.push(`${grupp[0]}…: ${String(e).slice(0, 200)}`));
  await p.goto(URL0, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__troll, null, { timeout: 30000 }).catch(() => undefined);
  // Modellerna hämtas när de används; tills dess ritas procedurkroppen (Suspense). Vänta på att nätet är tyst
  // (alla .glb hämtade) och att alla har en mätning, sedan en stund till för att klonen ska skalas.
  await p.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => undefined);
  await p.waitForFunction((n) => Object.values(window.__tredSyn ?? {}).filter((v) => v.mesh > 0).length >= n, grupp.length, { timeout: 15000 }).catch(() => undefined);
  await p.waitForTimeout(1500);
  const syn = await p.evaluate(() => window.__tredSyn ?? {});
  grupp.forEach((k, i) => { matt[k] = syn[`b66-${i}-${k}`] ?? null; });
  if (bilder && (alltid || grupp.some((k) => varfor(k, matt[k])))) await p.screenshot({ path: path.join(bilder, `b66-${grupp[0]}.png`) }).catch(() => undefined);
  await ctx.close();
  if ((s / 10) % 10 === 0) console.error(`… ${s + grupp.length}/${ids.length}`);
}
// BYGG (Doodle 08:26): byggnaderna längst bak och spridda, slottet större än sjukhuset, ingen framför grinden,
// cirkustältet skymmer inte växthuset. Lägen ur window.__tredPos (världen), storlek ur window.__tredSyn (skärmen).
const bygg = [];
if (!bara) {
  const FOT = JSON.parse(fs.readFileSync("data/fotavtryck.json", "utf8")).halvbredd;
  const lag = ["slott", "sjukhus", "cirkus", "vaxthus", "hus", "skola", "kyrka", "ko", "katt"];
  for (const [v, ordn] of [lag, [...lag].reverse()].entries()) {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE" });
    await ctx.addInitScript((ang) => {
      window.__tredSyn = {};
      localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, dragit: true, ang, garden: [], stjarnor: 0, oppnadePlatser: [], seddaIntro: ["garden", "gard"], platsSkapelser: {} }));
    }, ordn.map((k, i) => ({ ...sparad(k, i), uid: `bygg${v}-${k}` })));
    const p = await ctx.newPage();
    p.on("pageerror", (e) => fel.push(`bygg: ${String(e).slice(0, 200)}`));
    await p.goto(URL0, { waitUntil: "domcontentloaded" });
    await p.waitForFunction(() => !!window.__troll, null, { timeout: 30000 }).catch(() => undefined);
    await p.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => undefined);
    await p.waitForFunction((n) => Object.values(window.__tredSyn ?? {}).filter((x) => x.mesh > 0).length >= n, ordn.length, { timeout: 15000 }).catch(() => undefined);
    await p.waitForTimeout(1500);
    const { syn, pos } = await p.evaluate(() => ({ syn: window.__tredSyn ?? {}, pos: window.__tredPos ?? {} }));
    const m = Object.fromEntries(ordn.map((k) => [k, { ...syn[`bygg${v}-${k}`], ...pos[`bygg${v}-${k}`] }]));
    const kolla = (namn, ok, info) => bygg.push({ namn: `BYGG${v + 1} ${namn}`, ok: !!ok, ...info });
    const hus = ordn.filter((k) => !["ko", "katt"].includes(k));
    kolla("alla byggnader bakom staketet (z ≤ -2,3) och bakom djuren", hus.every((k) => m[k].z <= -2.3 && m[k].z < Math.min(m.ko.z, m.katt.z) - 0.5), { z: Object.fromEntries(hus.map((k) => [k, m[k].z])) });
    kolla("ingen byggnad framför grinden (x -1,2 … -0,2 med halva bredden)", hus.every((k) => m[k].x + FOT[k] <= -1.2 + 0.02 || m[k].x - FOT[k] >= -0.2 - 0.02), { x: Object.fromEntries(hus.map((k) => [k, m[k].x])) });
    kolla("slottet är högre än sjukhuset på skärmen", m.slott.h > m.sjukhus.h * 1.15, { slott: m.slott.h, sjukhus: m.sjukhus.h });
    const over = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    const [c, vx] = [m.cirkus, m.vaxthus];
    const skymt = c.z > vx.z ? over({ x: c.x, y: c.y, w: c.w, h: c.h }, vx) / Math.max(1, vx.w * vx.h) : 0;
    kolla("cirkustältet skymmer inte växthuset (står det framför, täcker det högst 30 % av växthusets ruta)", skymt <= 0.3, { skymt: Math.round(skymt * 100) / 100, cirkus_z: c.z, vaxthus_z: vx.z });
    const xs = hus.map((k) => m[k].x);
    kolla("byggnaderna spridda (x-spännvidd ≥ 2,5)", Math.max(...xs) - Math.min(...xs) >= 2.5, { x: xs });
    if (bilder) await p.screenshot({ path: path.join(bilder, `b66-BYGG${v + 1}.png`) }).catch(() => undefined);
    await ctx.close();
  }
  for (const b of bygg) console.error(`${b.ok ? "ok  " : "FEL "} ${b.namn}`);
}
const osynliga = Object.entries(matt).map(([k, m]) => ({ id: k, modell: E[k].modell, varfor: varfor(k, m), ...(m ?? {}) })).filter((o) => o.varfor);
const res = { antal: ids.length, matta: Object.values(matt).filter(Boolean).length, osynliga, bygg, fel: fel.slice(0, 10) };
if (ut) fs.writeFileSync(ut, JSON.stringify({ ...res, matt }, null, 1));
console.log(JSON.stringify(res, null, 1));
await browser.close();
server.close();
process.exit(osynliga.length === 0 && fel.length === 0 && bygg.every((b) => b.ok) ? 0 : 1);
