// R9K: idéraden läcker inte svaret, enkla uppdragstexter, "Vad vill du ge räven?" på alla platser, humörikon över djuren,
// grottans stenar utan gröna toppar, repliker utan "ängen" på andra platser. Playwright 375x812 mot dist-pages.
//   node rundor/R9K-fix/r9k-prov.mjs --bilder <mapp>   (exit 0 = alla steg gröna; kräver npm run build:pages)
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const dist = path.resolve(arg("dist", "dist-pages"));
const bilder = arg("bilder", "");
if (bilder) fs.mkdirSync(bilder, { recursive: true });
const BENGT = JSON.parse(fs.readFileSync("data/bengtsson.json", "utf8"));
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
async function sida(spar) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE" });
  await ctx.addInitScript((s) => {
    if (!sessionStorage.getItem("f")) { localStorage.setItem("trollpennan-v2", JSON.stringify(s)); sessionStorage.setItem("f", "1"); }
  }, { version: 2, introSedd: true, dragit: true, ang: [], garden: [], stjarnor: 0, oppnadePlatser: PLATSER, seddaIntro: PLATSER, platsSkapelser: {}, ...spar });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => fel.push(String(e)));
  p.setDefaultTimeout(15000);
  await p.goto(URL0, { waitUntil: "domcontentloaded" });
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
// Samma rättvisa träff som spelets kontroll (uppdragsmotor.ordTraffar): exakt, eller början/slut för ord på minst 4 bokstäver.
const traff = (krav, text) => (text.toLowerCase().match(/[a-zåäöéü]+/g) ?? []).some((t) => krav.some((o) => t === o || (o.length >= 4 && (t.startsWith(o) || t.endsWith(o)))));
const UPPDRAG = { ang: "ljus-i-kvallen", skogen: "skog-kvallsljus", sjon: "sjo-i-baten", grottan: "grotta-forsta-skenet" };
async function nyttDjur(p, plats, fras) {
  await p.evaluate((f) => window.__troll.vakna(f), fras);
  await p.waitForTimeout(2500);
  const s = await sparat(p);
  return plats === "ang" ? s.ang?.at(-1)?.uid : s.platsSkapelser?.[plats]?.at(-1)?.uid;
}
async function stangOmOppen(p) { if (await synlig(p, "[data-testid=stang-bok]")) { await p.click("[data-testid=stang-bok]"); await p.waitForTimeout(400); } }

// A: idéraden under uppdraget, på ängen och alla platser
for (const plats of ["ang", ...PLATSER]) {
  await blok(`A-${plats}`, async () => {
    const id = UPPDRAG[plats];
    const u = BENGT.uppdrag.find((x) => x.id === id);
    const { ctx, p } = await sida({ plats, uppdrag: { [id]: "pagar" } });
    await p.click("[data-testid=pennans-bok]");
    await p.waitForSelector("[data-testid=uppdrag-remsa]");
    await p.waitForTimeout(400);
    const remsa = (await p.locator("[data-testid=uppdrag-remsa]").innerText()).trim();
    kolla(`A ${plats}: uppdragstexten ur data`, remsa.endsWith(u.text_bengtsson), { remsa });
    const rad = (await p.locator("[data-testid=uppdrag-val]").count()) ? await p.locator("[data-testid=uppdrag-val]").innerText() : "";
    const knappar = (await p.locator("[data-testid=uppdrag-val-fras]").allInnerTexts()).map((t) => t.trim());
    kolla(`A ${plats}: idéraden visas`, knappar.length >= 2, { knappar });
    kolla(`A ${plats}: inget kravord i idéraden`, !traff(u.krav.ord, rad), { rad, krav: u.krav.ord });
    kolla(`A ${plats}: inga dubbletter`, new Set(knappar).size === knappar.length, { knappar });
    const exempel = await p.locator(".ideer button").evaluateAll((b) => b.map((x) => (x.textContent ?? "").trim())).catch(() => []);
    kolla(`A ${plats}: exempelraden (Prova en idé) visar inte svaret`, exempel.length >= 1 && !exempel.some((e) => traff(u.krav.ord, e)), { exempel });
    await bild(p, `r9k-${plats}-ideer.png`);
    await p.locator("[data-testid=uppdrag-val-fras]").first().click();
    await p.waitForTimeout(300);
    const text = (await p.locator("[data-testid=remsa]").innerText()).trim();
    kolla(`A ${plats}: knappen börjar meningen, barnet skriver resten`, text.length > 3 && !traff(u.krav.ord, text) && knappar[0].startsWith(text), { text, knapp: knappar[0] });
    await ctx.close();
  });
}

// B: humörikon över djuret och "Vad vill du ge räven?" på ängen och alla platser
for (const plats of ["ang", ...PLATSER]) {
  await blok(`B-${plats}`, async () => {
    const { ctx, p } = await sida({ plats });
    const uid = await nyttDjur(p, plats, "en orange räv");
    await stangOmOppen(p);
    kolla(`B ${plats}: räven står där`, !!uid, { uid });
    await p.evaluate((u) => window.__troll.humor(u, "nyfiken"), uid);
    await p.waitForTimeout(900);
    const ikon = p.locator(`[data-testid^=humor3d-][data-uid="${uid}"]`);
    const syns = await ikon.first().isVisible().catch(() => false);
    const box = syns ? await ikon.first().boundingBox() : null;
    const mal = await malAv(p, uid);
    kolla(`B ${plats}: humörikonen syns ovanför djuret`, syns && !!box && !!mal && box.y < mal.y + 60 && Math.abs(box.x + box.width / 2 - mal.x) < 60, { box, mal });
    kolla(`B ${plats}: ikonen följer humöret (nyfiken)`, (await ikon.first().getAttribute("data-testid").catch(() => "")) === "humor3d-nyfiken");
    await p.evaluate((u) => window.__troll.humor(u, "glad"), uid);
    await p.waitForTimeout(500);
    kolla(`B ${plats}: ikonen byts när humöret byts`, (await p.locator(`[data-testid=humor3d-glad][data-uid="${uid}"]`).count()) === 1);
    kolla(`B ${plats}: ikonen tar inga tryck`, await p.evaluate((u) => { const e = document.querySelector(`[data-uid="${u}"]`); return !!e && getComputedStyle(e).pointerEvents === "none"; }, uid));
    await bild(p, `r9k-${plats}-humor.png`);
    await p.evaluate((u) => window.__troll.humor(u, "sugen"), uid);
    await p.waitForTimeout(300);
    let rubrik = "";
    for (const dy of [40, 55, 25, 70]) {
      const m = await malAv(p, uid);
      if (!m) break;
      await p.mouse.click(m.x, m.y + dy); await p.waitForTimeout(800);
      if (await synlig(p, "[data-testid=gava-remsa]")) { rubrik = (await p.locator("[data-testid=gava-remsa] p").first().innerText()).trim(); break; }
    }
    kolla(`B ${plats}: gåvorutan "Vad vill du ge räven?"`, rubrik === "Vad vill du ge räven?", { rubrik });
    await bild(p, `r9k-${plats}-gava.png`);
    await ctx.close();
  });
}

// C: grottan – inga gröna toppar (bild) och repliker utan "ängen" eller platshållare
await blok("C", async () => {
  const { ctx, p } = await sida({ plats: "grottan" });
  await p.waitForTimeout(1500);
  await bild(p, "r9k-grottan-stenar.png");
  const uid = await nyttDjur(p, "grottan", "en snabb kanin");
  await stangOmOppen(p);
  const texter = [];
  for (let i = 0; i < 8; i++) {
    await p.evaluate((u) => window.__troll.humor(u, "glad"), uid);
    const m = await malAv(p, uid);
    if (!m) break;
    await p.mouse.click(m.x, m.y + 45); await p.waitForTimeout(700);
    texter.push(...(await p.locator("[data-testid=bubbla]").allInnerTexts().catch(() => [])));
  }
  kolla("C grottan: repliker när man trycker", texter.length >= 3, { n: texter.length });
  kolla("C grottan: ingen replik säger ängen eller {platsen}", texter.every((t) => !/ängen|\{/i.test(t)), { texter: [...new Set(texter)].slice(0, 10) });
  await ctx.close();
});
kolla("inga sidfel", fel.length === 0, { fel: fel.slice(0, 5) });
await browser.close(); server.close();
const ok = steg.every((s) => s.ok);
console.log(JSON.stringify({ ok, steg }, null, 1));
process.exit(ok ? 0 : 4);
