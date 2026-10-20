// TTS-3: bannern och rösten med RIKTIG uppspelning och riktig kö (inga fejkade ljudlängder), som ett barn spelar:
// 375x812, pekskärm, navigator.webdriver = false, skärmtangentbordet (ingen window.__troll). Bygger på Doodles spela.mjs
// (ko-20okt/tts2/d). Fångar felet på main: pratbubblans röst låg före bannerns i kön, så "Uppdrag klart!" och
// Bengtssons "Ahh, så skönt! …" klipptes (bannern gick 0,1–1,8 s före rösten).
//   B) uppdraget klaras två gånger: varje banner med röst står kvar tills dess röst är klar + 1,5 s (−250 ms tolerans),
//      och rösten startar medan bannern syns. C) ett tryck stänger uppmaningen direkt och tystar rösten.
//   D) window.__troll finns inte för ett barn (webdriver false), men finns när ett prov styr webbläsaren (webdriver true).
//   node --experimental-strip-types rundor/TTS-3/tts3-prov.mjs [--dist dist-pages] [--bilder <mapp>] [--varv 2]
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { rostPlan } from "../../src/spel/rostManifest.ts";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const dist = path.resolve(arg("dist", "dist-pages"));
const bilder = arg("bilder", "");
const VARV = Number(arg("varv", "2"));
if (bilder) fs.mkdirSync(bilder, { recursive: true });
const B = JSON.parse(fs.readFileSync("data/bengtsson.json", "utf8")).uppdrag;
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let f = path.join(dist, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, "index.html");
  res.setHeader("Content-Type", mime[path.extname(f)] ?? "application/octet-stream");
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const URL0 = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
const steg = [];
const kolla = (namn, ok, info = {}) => {
  steg.push({ namn, ok: !!ok, ...info });
  console.error(`${ok ? "ok  " : "FEL "} ${namn}${ok ? "" : " " + JSON.stringify(info).slice(0, 900)}`);
};
const fel = [];
const PL = ["skogen", "sjon", "grottan"];
const BAS = { version: 2, introSedd: true, dragit: true, ang: [], garden: [], stjarnor: 0, oppnadePlatser: PL, seddaIntro: [...PL, "garden", "gard"], platsSkapelser: {}, ljudPa: true, egnaDjur: 9 };

async function sida(spar, { webdriver = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: "sv-SE" });
  await ctx.addInitScript((wd) => {
    Object.defineProperty(navigator, "webdriver", { get: () => wd });
    window.__ljud = [];
    window.__bann = [];
    const t0 = () => Math.round(performance.now());
    const play0 = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      const el = this;
      const f = new URL(el.src, location.href).pathname;
      if (f.startsWith("/ljud/rost/")) {
        const rec = { f, anrop: t0(), start: null, slut: null, hur: null };
        window.__ljud.push(rec);
        el.addEventListener("playing", () => { rec.start ??= t0(); }, { once: true });
        el.addEventListener("ended", () => { if (!rec.slut) { rec.slut = t0(); rec.hur = "ended"; } }, { once: true });
        el.addEventListener("pause", () => { if (!rec.slut) { rec.slut = t0(); rec.hur = el.currentTime >= el.duration - 0.06 ? "ended" : "pause"; } }, { once: true });
      }
      return play0.call(el);
    };
    const syns = new Map();
    setInterval(() => {
      const nu = new Set([...document.querySelectorAll("[data-testid=puff]")].map((e) => e.textContent?.trim() ?? ""));
      for (const t of nu) if (!syns.has(t)) syns.set(t, t0());
      for (const [t, s] of syns) if (!nu.has(t)) { window.__bann.push({ text: t, start: s, slut: t0() }); syns.delete(t); }
    }, 40);
  }, webdriver);
  if (spar) await ctx.addInitScript((s) => { if (!sessionStorage.getItem("f")) { localStorage.setItem("trollpennan-v2", JSON.stringify(s)); sessionStorage.setItem("f", "1"); } }, spar);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => fel.push(String(e).slice(0, 300)));
  p.setDefaultTimeout(20000);
  await p.goto(URL0, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2500);
  const tf = p.locator("[data-testid=titel-fortsatt], [data-testid=titel-borja]").first();
  if (await tf.isVisible().catch(() => false)) await tryck(tf);
  await p.waitForTimeout(1000);
  return { ctx, p };
}
const las = (p) => p.evaluate(() => ({ ljud: window.__ljud, bann: window.__bann, troll: typeof window.__troll }));
const tryck = async (l) => { await l.waitFor({ state: "visible" }); await l.tap({ timeout: 3000 }).catch(() => l.tap({ force: true })); };
async function skriv(p, fras) {
  await tryck(p.locator("[data-testid=pennans-bok]"));
  await p.waitForSelector("[data-testid=tangentbord]");
  for (const c of fras) {
    if (c === " ") await tryck(p.locator("[data-testid=mellanslag]"));
    else await tryck(p.locator("[data-testid=tangentbord] button.tangent", { hasText: new RegExp(`^${c}$`, "i") }).first());
    await p.waitForTimeout(60);
  }
  await tryck(p.locator("[data-testid=vakna]"));
}
/** bannerns egen röst: delarna i textens plan, i ordning, med första delen startad efter att bannern visades */
function rostFor(b, ljud) {
  const plan = rostPlan(b.text);
  if (!plan) return null;
  const filer = plan.delar.filter((d) => "f" in d).map((d) => d.f);
  if (!filer.length) return null;
  const i = ljud.findIndex((x) => x.f === filer[0] && x.anrop >= b.start - 300);
  if (i < 0) return { filer, start: null, slut: null };
  const delar = [ljud[i]];
  for (let j = i + 1; j < ljud.length && delar.length < filer.length; j++) if (ljud[j].f === filer[delar.length]) delar.push(ljud[j]);
  return { filer, start: delar[0].start ?? delar[0].anrop, slut: delar.length === filer.length ? delar.at(-1).slut : null, hur: delar.map((d) => d.hur) };
}

// B) uppdraget klaras via boken, två varv
for (let v = 1; v <= VARV; v++) {
  const { ctx, p } = await sida(BAS);
  await tryck(p.locator("[data-testid=bengtsson-ikon], [data-testid=npc-figur]").first());
  await p.waitForSelector("[data-testid=uppdrag-remsa]");
  const id = await p.getAttribute("[data-testid=uppdrag-remsa]", "data-uppdrag");
  const u = B.find((x) => x.id === id);
  const fras = u?.val?.grupper?.[0]?.forslag?.[0]?.fras ?? `en kanin med ${u?.krav?.ord?.[0] ?? "mössa"}`;
  await p.waitForTimeout(8000);
  await skriv(p, fras);
  // vänta tills inga bannrar syns och inget ljud spelar (högst 60 s)
  // vänta tills det varit tyst (ingen banner, inget ljud) i 3 s i följd – mellan två bannrar är det tyst i 200 ms (högst 90 s)
  const tSlut = Date.now() + 90000;
  let tystSedan = 0;
  await p.waitForTimeout(3000);
  while (Date.now() < tSlut) {
    const tyst = await p.evaluate(() => document.querySelectorAll("[data-testid=puff]").length === 0 && window.__ljud.every((x) => x.slut !== null));
    if (!tyst) tystSedan = 0;
    else if (!tystSedan) tystSedan = Date.now();
    else if (Date.now() - tystSedan > 3000) break;
    await p.waitForTimeout(250);
  }
  const L = await las(p);
  if (bilder && v === 1) await p.screenshot({ path: path.join(bilder, "tts3-uppdrag.png") });
  const par = L.bann.map((b) => ({ text: b.text, visad: b.slut - b.start, rost: rostFor(b, L.ljud), b })).filter((x) => x.rost);
  const rad = par.map((x) => ({ text: x.text.slice(0, 50), visad_ms: x.visad, rost_start_efter_banner_ms: x.rost.start === null ? null : x.rost.start - x.b.start, marginal_efter_rost_ms: x.rost.slut === null ? null : x.b.slut - x.rost.slut, hur: x.rost.hur }));
  const klipt = rad.filter((x) => x.rost_start_efter_banner_ms === null || x.marginal_efter_rost_ms === null || x.marginal_efter_rost_ms < 1500 - 250 || x.rost_start_efter_banner_ms > x.visad_ms);
  const klartRad = u?.klart_bengtsson ?? u?.klart ?? "";
  kolla(`varv ${v} (${id}, '${fras}'): bannrar med röst finns, bland dem 'Uppdrag klart!' och Bengtssons klart-replik`, par.some((x) => x.text === "Uppdrag klart!") && (!klartRad || par.some((x) => x.text === klartRad.trim())), { bannrar: L.bann.map((b) => b.text), klartRad });
  kolla(`varv ${v}: varje banner står kvar tills dess röst är klar + 1,5 s och rösten börjar medan bannern syns`, par.length > 0 && klipt.length === 0, { klipt, alla: rad });
  if (v === 1) console.log(JSON.stringify({ tidslinje: rad }));
  await ctx.close();
}
// C) tryck stänger uppmaningen direkt och tystar rösten (riktig uppspelning)
{
  const { ctx, p } = await sida(BAS);
  await skriv(p, "randig");
  const puff = p.locator("[data-testid=puff].tryck").first();
  await puff.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const fore = await las(p);
  const spelar = fore.ljud.filter((x) => x.slut === null && x.start !== null);
  const tT = await p.evaluate(() => Math.round(performance.now()));
  await puff.tap().catch((e) => fel.push("tap " + e));
  await p.waitForTimeout(400);
  const kvar = await puff.isVisible().catch(() => false);
  await p.waitForTimeout(1500);
  const efter = await las(p);
  const tystnade = spelar.every((s) => efter.ljud.some((x) => x.f === s.f && x.anrop === s.anrop && x.hur === "pause" && x.slut >= tT));
  const nya = efter.ljud.filter((x) => x.anrop > tT);
  kolla("tryck: uppmaningen borta 400 ms efter trycket, rösten som spelade pausades och inget nytt spelas", spelar.length > 0 && !kvar && tystnade && nya.length === 0, { spelar, kvar, tystnade, nya });
  await ctx.close();
}
// D) styr-API:t
{
  const barn = await sida(BAS, { webdriver: false });
  const tb = (await las(barn.p)).troll;
  await barn.ctx.close();
  const prov = await sida(BAS, { webdriver: true });
  const tp = (await las(prov.p)).troll;
  await prov.ctx.close();
  kolla("window.__troll finns inte för ett barn (webdriver false), men för prov (webdriver true)", tb === "undefined" && tp === "object", { barn: tb, prov: tp });
}
await browser.close();
server.close();
kolla("inga sidfel", fel.length === 0, { fel });
console.log(JSON.stringify({ ok: steg.every((s) => s.ok), steg }, null, 1));
process.exit(steg.every((s) => s.ok) ? 0 : 1);
