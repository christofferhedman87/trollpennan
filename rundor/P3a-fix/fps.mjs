// P3a-fix (beslut E): varför går grottan i 15–17 fps? Samma 8 skrivna djur i skogen och grottan; bilder per sekund mäts
// (requestAnimationFrame, 6 s) med allt på, utan skuggor, utan grottans punktljus (ljuspoolen) och utan båda.
// Kör: node rundor/P3a-fix/fps.mjs --dist dist-pages
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const dist = path.resolve(arg("dist", "dist-pages"));
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg" };
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
const ORD = ["en katt", "en elefant", "en hund", "en kanin", "en giraff", "en häst", "en ko", "en säl"];
const ut = {};
for (const plats of ["skogen", "grottan"]) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE" });
  await ctx.addInitScript((s) => localStorage.setItem("trollpennan-v2", JSON.stringify(s)), { version: 2, introSedd: true, dragit: true, ang: [], garden: [], stjarnor: 12, oppnadePlatser: PLATSER, seddaIntro: [...PLATSER, "garden", "gard"], platsSkapelser: {}, plats });
  const p = await ctx.newPage();
  await p.goto(URL0, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__troll && !!window.__tredScen, null, { timeout: 90000 });
  for (const o of ORD) { await p.evaluate((x) => window.__troll.vakna(x), o); await p.waitForTimeout(2500); }
  if (await p.locator("[data-testid=stang-bok]").first().isVisible().catch(() => false)) await p.click("[data-testid=stang-bok]");
  await p.waitForTimeout(8000);
  const info = await p.evaluate(() => {
    const { scene, gl } = window.__tredScen;
    let [tri, mesh, punkt, skugg] = [0, 0, 0, 0];
    scene.traverse((o) => {
      if (o.isPointLight && o.visible) punkt++;
      if (o.isMesh && o.visible) { mesh++; if (o.castShadow) skugg++; const g = o.geometry; const n = g.index ? g.index.count / 3 : (g.attributes.position?.count ?? 0) / 3; tri += n * (o.isInstancedMesh ? o.count : 1); }
    });
    return { tri: Math.round(tri), mesh, punktljus: punkt, kastarSkugga: skugg, program: gl.info.programs?.length ?? 0, anrop: gl.info.render.calls };
  });
  const matt = async (namn, gor) => {
    await p.evaluate(gor);
    await p.waitForTimeout(2500);
    const fps = await p.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 6000) requestAnimationFrame(f); else r(Math.round((n / ((performance.now() - t0) / 1000)) * 10) / 10); }; requestAnimationFrame(f); }));
    console.error(`${plats} ${namn}: ${fps} fps`);
    return fps;
  };
  const r = { info };
  r.allt = await matt("allt på", () => undefined);
  r.utanSkugga = await matt("utan skuggor", () => { const { scene, gl } = window.__tredScen; gl.shadowMap.enabled = false; scene.traverse((o) => { if (o.material) for (const m of [].concat(o.material)) m.needsUpdate = true; }); });
  r.utanBada = await matt("utan skuggor och punktljus", () => { const { scene } = window.__tredScen; scene.traverse((o) => { if (o.isPointLight) o.visible = false; if (o.material) for (const m of [].concat(o.material)) m.needsUpdate = true; }); });
  r.utanPunkt = await matt("utan punktljus (skuggor på)", () => { const { scene, gl } = window.__tredScen; gl.shadowMap.enabled = true; scene.traverse((o) => { if (o.material) for (const m of [].concat(o.material)) m.needsUpdate = true; }); });
  console.error(`${plats}: ${JSON.stringify(info)}`);
  ut[plats] = r;
  await ctx.close();
}
console.log(JSON.stringify(ut, null, 1));
await browser.close();
server.close();
