// B4.1: det barnet skapar lyser i grottan ("en kanin med en lykta", även en ensam lykta), högst 4 ljus (de senaste),
// inget ljus på ängen eller i skogen, ljuset finns kvar efter omladdning. Mäter draw calls och fps (rAF) före/efter.
//   node rundor/B4.1-ljus/b41-prov.mjs --bilder <mapp>   (exit 0 = alla steg gröna; kräver npm run build:pages)
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
const PLATSER = ["skogen", "sjon", "grottan"];
async function sida(spar, fraga = "") {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE" });
  await ctx.addInitScript((s) => {
    if (!sessionStorage.getItem("f")) { localStorage.setItem("trollpennan-v2", JSON.stringify(s)); sessionStorage.setItem("f", "1"); }
    window.__gl = { draw: 0 };
    for (const C of [window.WebGL2RenderingContext, window.WebGLRenderingContext]) {
      if (!C) continue;
      for (const fn of ["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced"]) {
        const o = C.prototype[fn]; if (!o) continue;
        C.prototype[fn] = function (...x) { window.__gl.draw++; return o.apply(this, x); };
      }
    }
  }, { version: 2, introSedd: true, dragit: true, ang: [], garden: [], stjarnor: 0, oppnadePlatser: PLATSER, seddaIntro: PLATSER, platsSkapelser: {}, ...spar });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => fel.push(String(e)));
  p.setDefaultTimeout(15000);
  await p.goto(URL0 + fraga, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__troll, null, { timeout: 20000 });
  await p.waitForTimeout(2500);
  return { ctx, p };
}
async function blok(id, fn) { try { await fn(); } catch (e) { kolla(`block ${id} kraschade`, false, { fel: String(e).split("\n")[0] }); } }
const bild = async (p, n) => bilder && p.screenshot({ path: path.join(bilder, n), animations: "disabled" });
const sparat = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}"));
const synlig = (p, s) => p.locator(s).first().isVisible().catch(() => false);
async function malAv(p, uid) {
  for (let i = 0; i < 10; i++) { const m = await p.evaluate((u) => window.__tredMal?.[u] ?? null, uid); if (m) return m; await p.waitForTimeout(400); }
  return null;
}
async function nyttDjur(p, plats, fras) {
  await p.evaluate((f) => window.__troll.vakna(f), fras);
  await p.waitForTimeout(2500);
  const s = await sparat(p);
  return plats === "ang" ? s.ang?.at(-1)?.uid : s.platsSkapelser?.[plats]?.at(-1)?.uid;
}
async function stangOmOppen(p) { if (await synlig(p, "[data-testid=stang-bok]")) { await p.click("[data-testid=stang-bok]"); await p.waitForTimeout(400); } }

const ljus = (p) => p.evaluate(() => window.__ljus ?? { ljus: 0, pol: 0 });
// Medel-draw calls per bildruta och fps (rAF) under 2 s, och längsta bildrutan.
const mat = (p, ms = 2000) => p.evaluate((ms) => new Promise((res) => {
  const d0 = window.__gl.draw; let n = 0, max = 0; const t0 = performance.now(); let s = t0;
  const f = (t) => { n++; max = Math.max(max, t - s); s = t; if (t - t0 < ms) requestAnimationFrame(f); else res({ draw: +((window.__gl.draw - d0) / n).toFixed(1), fps: +((n * 1000) / (t - t0)).toFixed(1), langst: Math.round(max) }); };
  requestAnimationFrame(f);
}), ms);
// Längsta bildrutan medan ett djur skapas (shaderbygget när antalet ljus ändras syns här).
async function skapaOchMat(p, plats, fras) {
  const m = p.evaluate(() => new Promise((res) => { let max = 0, s = performance.now(); const t0 = s; const f = (t) => { max = Math.max(max, t - s); s = t; if (t - t0 < 3000) requestAnimationFrame(f); else res(Math.round(max)); }; requestAnimationFrame(f); }));
  const uid = await nyttDjur(p, plats, fras);
  return { uid, langst: await m };
}
// Medelljushet (0–255) i en ruta runt en skärmpunkt i en skärmbild, avkodad i sidan (ingen png-modul behövs).
async function ljushet(p, buf, x, y, b, h) {
  return p.evaluate(async ({ u, x, y, b, h }) => {
    const im = new Image(); im.src = u; await im.decode();
    const c = document.createElement("canvas"); c.width = im.width; c.height = im.height;
    const g = c.getContext("2d"); g.drawImage(im, 0, 0);
    const d = g.getImageData(Math.max(0, Math.round(x - b / 2)), Math.max(0, Math.round(y)), b, h).data;
    let s = 0; for (let i = 0; i < d.length; i += 4) s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    return +(s / (d.length / 4)).toFixed(1);
  }, { u: `data:image/png;base64,${buf.toString("base64")}`, x, y, b, h });
}
const skarm = (p) => p.screenshot({ animations: "disabled" });
const matt = {};

// A: grottan, "en kanin med en lykta" lyser upp närområdet; jämförs med "en kanin med en bok" (samma kanin, ingen ljuskälla)
for (const [namn, fras] of [["lykta", "en kanin med en lykta"], ["bok", "en kanin med en bok"]]) {
  await blok(`A-${namn}`, async () => {
    const { ctx, p } = await sida({ plats: "grottan" });
    kolla(`A ${namn}: tom grotta har inget ljus (dekoren lyser inte)`, (await ljus(p)).pol === 0);
    const fore = await skarm(p);
    await bild(p, `b41-grottan-fore-${namn}.png`);
    const uid = await nyttDjur(p, "grottan", fras);
    await p.waitForTimeout(1500);
    const m = await malAv(p, uid);
    const efter = await skarm(p);
    await bild(p, `b41-grottan-${namn}.png`);
    const l = await ljus(p);
    kolla(`A ${namn}: ${namn === "lykta" ? "1" : "0"} ljus`, l.pol === (namn === "lykta" ? 1 : 0) && l.ljus === l.pol, l);
    // Närområdet = en bred ruta runt och under djuret (marken), där djuret självt bara är en liten del.
    const omr = m ? [m.x, m.y, 240, 220] : [187, 380, 240, 220];
    matt[namn] = { mal: m, fore: await ljushet(p, fore, ...omr), efter: await ljushet(p, efter, ...omr) };
    await ctx.close();
  });
}
if (matt.lykta && matt.bok) {
  const dl = matt.lykta.efter - matt.lykta.fore, db = matt.bok.efter - matt.bok.fore;
  kolla("A: lyktan lyser synligt upp närområdet (ljusare än samma kanin med en bok)", dl > db + 4 && dl > 4, { lykta: matt.lykta, bok: matt.bok, okningLykta: +dl.toFixed(1), okningBok: +db.toFixed(1) });
}

// B: en ensam lykta lyser; räven med fackla och bok ger ett ljus; ljuset finns kvar efter omladdning
await blok("B", async () => {
  const { ctx, p } = await sida({ plats: "grottan" });
  await nyttDjur(p, "grottan", "en lykta");
  await p.waitForTimeout(800);
  kolla("B: en ensam lykta lyser", (await ljus(p)).pol === 1, await ljus(p));
  await bild(p, "b41-grottan-ensam-lykta.png");
  await nyttDjur(p, "grottan", "en räv med en fackla och en bok");
  await p.waitForTimeout(800);
  kolla("B: räven med fackla och bok ger ett ljus till (2)", (await ljus(p)).pol === 2, await ljus(p));
  await p.reload({ waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__troll, null, { timeout: 20000 });
  await p.waitForTimeout(3000);
  kolla("B: ljusen finns kvar efter omladdning", (await ljus(p)).pol === 2, await ljus(p));
  await ctx.close();
});

// C: högst 4 ljus, de senaste; mätning av draw calls och fps med 5 lyktor mot 5 böcker
const C = {};
for (const sak of ["bok", "lykta"]) {
  await blok(`C-${sak}`, async () => {
    const { ctx, p } = await sida({ plats: "grottan" });
    C[sak] = { tom: await mat(p), skapa: [] };
    for (let i = 0; i < 5; i++) {
      const r = await skapaOchMat(p, "grottan", `en kanin med en ${sak}`);
      C[sak].skapa.push(r.langst);
      C[sak].ljusEfter = [...(C[sak].ljusEfter ?? []), (await ljus(p)).pol];
    }
    await p.waitForTimeout(1500);
    C[sak].fem = await mat(p);
    if (sak === "lykta") {
      kolla("C: 1, 2, 3, 4, 4 ljus när fem lyktor skapas (högst 4)", C[sak].ljusEfter.join() === "1,2,3,4,4", { ljus: C[sak].ljusEfter });
      await bild(p, "b41-grottan-fem-lyktor.png");
    }
    await ctx.close();
  });
}
if (C.bok?.fem && C.lykta?.fem) {
  const extra = +(C.lykta.fem.draw - C.bok.fem.draw).toFixed(1);
  kolla("C: draw calls – högst ~1 extra per ljus (ljuspölen); punktljuset kostar inga draw calls", extra <= 4 + 3, { bok: C.bok, lykta: C.lykta, extraDraw: extra });
}

// D: låg kvalitet – inga punktljus, bara ljuspölar
await blok("D", async () => {
  const { ctx, p } = await sida({ plats: "grottan" }, "?kvalitet=lag");
  await nyttDjur(p, "grottan", "en kanin med en lykta");
  await p.waitForTimeout(800);
  const l = await ljus(p);
  kolla("D: kvalitet låg = ljuspöl utan punktljus", l.pol === 1 && l.ljus === 0, l);
  await bild(p, "b41-grottan-lag.png");
  await ctx.close();
});

// E: ängen och skogen (ingen lista i platser.json) lyser inte
await blok("E", async () => {
  const { ctx, p } = await sida({});
  await nyttDjur(p, "ang", "en kanin med en lykta");
  await p.waitForTimeout(800);
  kolla("E: ängen – ingen ljuskälla", (await ljus(p)).pol === 0, await ljus(p));
  await bild(p, "b41-ang.png");
  await ctx.close();
  const s = await sida({ plats: "skogen" });
  await nyttDjur(s.p, "skogen", "en kanin med en lykta");
  await s.p.waitForTimeout(800);
  kolla("E: skogen – ingen ljuskälla (ingen entiteter-lista)", (await ljus(s.p)).pol === 0, await ljus(s.p));
  await s.ctx.close();
});

kolla("inga sidfel", fel.length === 0, { fel: fel.slice(0, 5) });
await browser.close(); server.close();
const ok = steg.every((s) => s.ok);
console.log(JSON.stringify({ ok, steg }, null, 1));
process.exit(ok ? 0 : 4);
