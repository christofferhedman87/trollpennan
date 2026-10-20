// P3a (Arkitekten 20:40): pröva premissen – stämmer placeringsregelns skärmruta med det som ritas?
// Laddar p3-prov P:s fall i webbläsaren (375×812) och sparar, några gånger per fall, för varje vaken skapelse den ritade
// rutan (window.__tredSyn: projicerad Box3 av modellens meshar, och världslådan b) och läget (window.__tredPos).
// Regelns förutsägelse räknas sedan i Node (p3-matt-analys.ts) ur samma sparade lista.
//   node rundor/P3-skapelse/p3-matt.mjs --dist dist-pages --ut /tmp/p3-matt.json [--fall ang/fro2026,sjon/fro11]
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const dist = path.resolve(arg("dist", "dist-pages"));
const ut = arg("ut", "/tmp/p3-matt.json");
const E = JSON.parse(fs.readFileSync("data/entiteter.json", "utf8")).entiteter;
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let f = path.join(dist, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!f.startsWith(dist)) { res.writeHead(403); res.end(); return; }
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, "index.html");
  res.setHeader("Content-Type", mime[path.extname(f)] ?? "application/octet-stream");
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const URL0 = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const PLATSER = ["skogen", "sjon", "grottan"];
const sparad = (uid, kropp, skapad) => ({ uid, kropp, formel: `en ${kropp}`, beskrivning: "", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [], skapad });
function slump(fro) { let a = fro >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const MED_MODELL = Object.keys(E).filter((k) => E[k].modell && E[k].typ !== "tillbehor").sort();
const DJUR = MED_MODELL.filter((k) => E[k].typ === "djur");
const lagFor = (fro) => { const r = slump(fro); return Array.from({ length: 8 }, (_, i) => { const pool = i % 4 === 3 ? MED_MODELL : DJUR; return pool[Math.floor(r() * pool.length)]; }); };
const LAG = { fro11: lagFor(11), fro2026: lagFor(2026), fro4242: lagFor(4242), blandad: ["elefant", "hund", "katt", "häst", "kanin", "giraff", "gris", "ko"], "varst-stora": ["elefant", "giraff", "slott", "valfisk", "dinosaurie", "häst", "ko", "elefant"], "varst-katter": Array(8).fill("katt"), "doodle-ko": ["anka", "kanin", "häst", "katt", "katt", "jultomte", "narval", "anka"] };
const FALL = (arg("fall", "ang/fro2026,ang/varst-stora,sjon/fro11,sjon/fro4242,sjon/varst-stora,sjon/varst-katter,skogen/fro11,grottan/fro11,sjon/doodle-ko,ang/blandad,skogen/blandad")).split(",");
const res = [];
for (const fall of FALL) {
  const [plats, namn] = fall.split("/");
  const kroppar = LAG[namn];
  const pre = kroppar.slice(0, 7).map((k, i) => sparad(`p-${plats}-${namn}-${i}`, k, 1000 + i));
  const spar = plats === "ang" ? { ang: pre } : { plats, ang: [], platsSkapelser: { [plats]: pre } };
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE" });
  await ctx.addInitScript((s) => { window.__tredSyn = {}; if (!sessionStorage.getItem("p3-fro")) { localStorage.setItem("trollpennan-v2", JSON.stringify(s)); sessionStorage.setItem("p3-fro", "1"); } },
    { version: 2, introSedd: true, dragit: true, ang: [], garden: [], stjarnor: 0, oppnadePlatser: PLATSER, seddaIntro: [...PLATSER, "garden", "gard"], platsSkapelser: {}, ...spar });
  const p = await ctx.newPage();
  await p.goto(URL0, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__troll, null, { timeout: 40000 });
  await p.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => undefined);
  await p.waitForTimeout(1500);
  const sista = kroppar[7];
  await p.evaluate((x) => window.__troll.vakna(x), `en ${E[sista]?.ord?.[0] ?? sista}`);
  await p.waitForTimeout(2600);
  if (await p.locator("[data-testid=stang-bok]").first().isVisible().catch(() => false)) { await p.click("[data-testid=stang-bok]"); await p.waitForTimeout(400); }
  await p.waitForTimeout(1500);
  const st = await p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}"));
  const lista = plats === "ang" ? (st.ang ?? []) : (st.platsSkapelser?.[plats] ?? []);
  const prov = [];
  for (let i = 0; i < 6; i++) {
    prov.push(await p.evaluate(() => ({ syn: JSON.parse(JSON.stringify(window.__tredSyn ?? {})), pos: JSON.parse(JSON.stringify(window.__tredPos ?? {})), kam: (() => { const c = window.__tredKamera; return c ? { ...c } : null; })() })));
    await p.waitForTimeout(500);
  }
  await ctx.close();
  res.push({ plats, namn, lista, prov });
  console.error(`… ${fall}: ${lista.length} sparade`);
}
fs.writeFileSync(ut, JSON.stringify(res));
await browser.close();
server.close();
