// R8-3a, bredd: "en blå <ord>" för alla (eller --antal N, jämnt spridda) entiteter med modell. För varje: minst ett material
//   byttes (färg eller textur) och modellen laddades utan sidfel. Skriver r83a-alla.json. Ingen bild (snabbt).
//   node rundor/R8-3a-farg/r83a-alla.mjs [--antal 120] [--ut <fil>]
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const dist = path.resolve(arg("dist", "dist-pages"));
const ut = arg("ut", "/tmp/r83a-alla.json");
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  let f = path.join(dist, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, "index.html");
  res.setHeader("Content-Type", mime[path.extname(f)] ?? "application/octet-stream");
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const URL0 = `http://127.0.0.1:${server.address().port}/`;
const ENT = JSON.parse(fs.readFileSync("data/entiteter.json", "utf8")).entiteter;
let ids = Object.keys(ENT).filter((k) => ENT[k].modell && ENT[k].typ !== "tillbehor");
const antal = Number(arg("antal", "0"));
if (antal > 0 && antal < ids.length) { const steg = ids.length / antal; ids = Array.from({ length: antal }, (_, i) => ids[Math.floor(i * steg)]); }
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const res = [];
for (let i = 0; i < ids.length; i += 8) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, locale: "sv-SE" });
  await ctx.addInitScript(() => { window.__tredFarg = []; if (!sessionStorage.getItem("f")) { localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, dragit: true, ang: [], garden: [], stjarnor: 0 })); sessionStorage.setItem("f", "1"); } });
  const p = await ctx.newPage(); const fel = [];
  p.on("pageerror", (e) => fel.push(String(e).slice(0, 200)));
  await p.goto(URL0, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__troll, null, { timeout: 30000 });
  await p.waitForTimeout(1500);
  for (const id of ids.slice(i, i + 8)) {
    const ord = (ENT[id].ord && ENT[id].ord[0]) || id;
    await p.evaluate((f) => window.__troll.vakna(f), `en blå ${ord}`);
    let rader = [];
    for (let t = 0; t < 12; t++) { await p.waitForTimeout(500); rader = await p.evaluate((k) => (window.__tredFarg ?? []).filter((r) => r.kropp === k), id); if (rader.length) break; }
    const kropp = await p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}").ang?.at(-1)?.kropp ?? null);
    const bytta = rader.filter((r) => r.efter !== r.fore || !r.egenKarta).length;
    res.push({ id, ord, kropp, material: rader.length, bytta, ok: kropp !== id ? null : bytta > 0, fel: fel.splice(0) });
  }
  await ctx.close();
  process.stderr.write(`${Math.min(i + 8, ids.length)}/${ids.length}\r`);
}
const giltiga = res.filter((r) => r.ok !== null);
const sammanf = { provade: res.length, rattKropp: giltiga.length, farjade: giltiga.filter((r) => r.ok).length, ejFargade: giltiga.filter((r) => !r.ok).map((r) => r.id), annanKropp: res.filter((r) => r.ok === null).map((r) => `${r.ord}→${r.kropp}`), sidfel: res.filter((r) => r.fel.length).map((r) => r.id) };
fs.writeFileSync(ut, JSON.stringify({ sammanf, res }, null, 1));
console.log(JSON.stringify(sammanf, null, 1));
await browser.close(); server.close();
process.exit(sammanf.ejFargade.length === 0 && sammanf.sidfel.length === 0 ? 0 : 1);
