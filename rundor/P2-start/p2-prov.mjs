#!/usr/bin/env node
// P2-1: introts slut – barnet skriver K-A-T-T själv. Playwright 375x812 (touch) mot dist-pages, eget statiskt server.
// Användning: node rundor/P2-start/p2-prov.mjs [--dist dist-pages] [--bilder katalog]   (exit 0 = alla steg gröna)
//  A  nytt barn: skrivscenen syns inom 30 s, nästa bokstav (k) lyser, inga överlapp, inget sticker ut i sidled
//  B  fel bokstav skrivs inte in; k-a-t-t fyller rutorna; Vakna! blir redo
//  C  Vakna! → introt stängs, katten finns på ängen (sparningen: formler har "en katt", introSedd)
//  D  Hjälp mig → idéknapparna som förut, en idé väcker djuret och stänger introt
//  E  Hoppa över fungerar som förut
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { aktivtSteg } from "../../src/spel/forstaStunden.ts";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const root = path.resolve(arg("dist", "dist-pages"));
const bilder = arg("bilder", "");
if (bilder) fs.mkdirSync(bilder, { recursive: true });
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".ttf": "font/ttf", ".jpg": "image/jpeg" };
const server = http.createServer((req, res) => {
  let f = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!f.startsWith(root)) { res.writeHead(403); res.end(); return; }
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, "index.html");
  res.setHeader("Content-Type", mime[path.extname(f)] ?? "application/octet-stream");
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const URL0 = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, locale: "sv-SE" });
const p = await ctx.newPage();
p.setDefaultTimeout(10000);
const sidfel = [];
p.on("pageerror", (e) => sidfel.push(String(e.message).slice(0, 200)));
const steg = [];
const kolla = (namn, ok, info = {}) => { steg.push({ namn, ok: !!ok, ...info }); console.error(`${ok ? "ok  " : "FEL "} ${namn}${ok ? "" : " " + JSON.stringify(info).slice(0, 400)}`); };
const bild = async (n) => { if (bilder) await p.screenshot({ path: path.join(bilder, `p2-${n}.png`) }).catch(() => undefined); };
const t = (id) => p.locator(`[data-testid=${id}]`);
const spar = () => p.evaluate(() => { try { return JSON.parse(localStorage.getItem("trollpennan-v2") || "{}"); } catch { return {}; } });
const tryck = async (loc) => { try { await loc.tap({ timeout: 4000 }); } catch { await loc.dispatchEvent("click"); } };

async function nyttBarn() {
  await p.goto(URL0, { waitUntil: "domcontentloaded" });
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await p.reload({ waitUntil: "domcontentloaded" });
  const t0 = Date.now();
  await p.waitForSelector("[data-testid=intro]", { timeout: 30000 });
  return t0;
}
const OVERLAPP = () => {
  const el = [...document.querySelectorAll(".intro button")].filter((e) => e.offsetParent || getComputedStyle(e).position === "fixed");
  const r = el.map((e) => ({ e, q: e.getBoundingClientRect() })).filter((x) => x.q.width > 1 && x.q.height > 1);
  const ut = [];
  for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) {
    const a = r[i].q, b = r[j].q;
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (w > 4 && h > 4) ut.push(`${r[i].e.textContent.trim().slice(0, 12)} × ${r[j].e.textContent.trim().slice(0, 12)} (${Math.round(w)}×${Math.round(h)})`);
  }
  const utanfor = r.filter((x) => x.q.left < -1 || x.q.right > innerWidth + 1 || x.q.bottom > innerHeight + 1).map((x) => x.e.textContent.trim().slice(0, 12));
  const sma = r.filter((x) => x.q.height < 44).map((x) => x.e.textContent.trim().slice(0, 12));
  return { ut, utanfor, sma, sidbredd: document.documentElement.scrollWidth };
};

// A + B + C
const t0 = await nyttBarn();
await bild("01-intro-start");
let skrivSyns = await t("intro-skriv").waitFor({ state: "visible", timeout: 30000 }).then(() => true, () => false);
const sek = (Date.now() - t0) / 1000;
kolla(`A skrivscenen syns inom 30 s (${sek.toFixed(1)} s)`, skrivSyns && sek < 30, { sek });
await p.waitForTimeout(500);
await bild("02-skriv-katt");
const lyser = await p.locator(".intro-tangenter .tangent.nasta").allTextContents();
kolla("A nästa bokstav (k) lyser, bara den", lyser.length === 1 && lyser[0].trim() === "k", { lyser });
const m = await p.evaluate(OVERLAPP);
kolla("A inga överlapp och inget utanför skärmen", m.ut.length === 0 && m.utanfor.length === 0 && m.sidbredd <= 375, m);
kolla("A alla knappar ≥ 44 px höga", m.sma.length === 0, { sma: m.sma });
await tryck(p.locator("[data-testid=intro-tangent][data-t=x]"));
await p.waitForTimeout(300);
const efterFel = await p.locator("[data-testid=intro-ruta][data-klar=ja]").count();
kolla("B fel bokstav (x) skrivs inte in", efterFel === 0, { efterFel });
for (const b of ["k", "a", "t", "t"]) { await tryck(p.locator(`[data-testid=intro-tangent][data-t=${b}]`)); await p.waitForTimeout(250); }
const fyllda = await p.locator("[data-testid=intro-ruta][data-klar=ja]").allTextContents();
kolla("B k-a-t-t fyller rutorna", fyllda.join("") === "katt", { fyllda });
const redo = await p.locator("[data-testid=intro-vakna].redo").count();
kolla("B Vakna! är redo", redo === 1);
await bild("03-katt-skrivet");
await tryck(t("intro-vakna"));
await p.waitForTimeout(2500);
const introBorta = (await t("intro").count()) === 0;
const s1 = await spar();
const harKatt = !!(s1.albumKropp ?? {}).katt && (s1.ang ?? []).some((a) => a.formel === "en katt");
kolla("C introt stängt, katten väckt och sparad, introSedd", introBorta && harKatt && s1.introSedd === true, { introBorta, album: Object.keys(s1.albumKropp ?? {}), ang: (s1.ang ?? []).map((a) => a.formel), introSedd: s1.introSedd });
const guide = aktivtSteg(s1);
kolla("C guiden (data/forsta-stunden.json) står på Bengtsson efter katten", guide?.steg.id === "bengtsson", { steg: guide?.steg.id, album: Object.keys(s1.albumKropp ?? {}) });
const katt3d = await p.evaluate(() => (window.__troll?.state?.().ang ?? []).some((a) => a.kropp === "katt"));
kolla("C katten står på ängen", katt3d);
await p.waitForTimeout(1500);
await bild("04-katten-vaknade");

// D Hjälp mig
await nyttBarn();
skrivSyns = await t("intro-skriv").waitFor({ state: "visible", timeout: 30000 }).then(() => true, () => false);
await tryck(t("intro-hjalp"));
await p.waitForTimeout(400);
const ideer = await t("intro-ide").count();
kolla("D Hjälp mig visar idéknapparna", skrivSyns && ideer >= 3, { ideer });
await bild("05-hjalp-mig");
const ide = (await t("intro-ide").first().textContent()).trim();
await tryck(t("intro-ide").first());
await p.waitForTimeout(2500);
const s2 = await spar();
kolla("D en idé väcker djuret och stänger introt", (await t("intro").count()) === 0 && (s2.ang ?? []).some((a) => a.formel === ide || a.formel?.endsWith(` ${ide}`)), { ide, ang: (s2.ang ?? []).map((a) => a.formel) });

// E Hoppa över
await nyttBarn();
await p.waitForTimeout(1200);
await tryck(t("intro-hoppa"));
await p.waitForTimeout(1500);
const s3 = await spar();
kolla("E Hoppa över stänger introt som förut", (await t("intro").count()) === 0 && s3.introSedd === true);

kolla("inga sidfel", sidfel.length === 0, { sidfel });
await browser.close();
server.close();
const ok = steg.every((s) => s.ok);
console.log(JSON.stringify({ ok, steg }, null, 1));
process.exit(ok ? 0 : 1);
