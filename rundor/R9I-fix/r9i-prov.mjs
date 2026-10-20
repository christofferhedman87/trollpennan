// R9I: Playwright-prov 375x812 mot dist-pages: "sugen" djur öppnar gåvorutan bara vid första trycket, "Till stallet" syns alltid.
//   node rundor/R9I-fix/r9i-prov.mjs --bilder <mapp>   (exit 0 = alla steg gröna; kräver npm run build:pages)
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

async function sida(spar, touch = false) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1, locale: "sv-SE" });
  await ctx.addInitScript((s) => {
    if (!sessionStorage.getItem("f")) {
      localStorage.setItem("trollpennan-v2", JSON.stringify(s));
      sessionStorage.setItem("f", "1");
    }
  }, { version: 2, introSedd: true, dragit: true, ang: [], garden: [], stjarnor: 0, ...spar });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => fel.push(String(e)));
  p.setDefaultTimeout(15000);
  await p.goto(URL0, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__troll, null, { timeout: 20000 });
  await p.waitForTimeout(1500);
  return { ctx, p };
}
const antal = (p, s) => p.locator(s).count();
const synlig = (p, s) => p.locator(s).first().isVisible().catch(() => false);
const bild = async (p, n) => bilder && p.screenshot({ path: path.join(bilder, n), animations: "disabled" });
async function oppnaBok(p) { await p.click("[data-testid=pennans-bok]"); await p.waitForSelector("[data-testid=skapar-guide]"); await p.waitForTimeout(400); }
async function stangBok(p) { await p.click("[data-testid=stang-bok]"); await p.waitForTimeout(400); }

// Ett block som kraschar (t.ex. på main före fixen) blir ett rött steg i stället för att stoppa provet.
async function blok(id, fn) {
  try { await fn(); } catch (e) { kolla(`block ${id} kraschade`, false, { fel: String(e).split("\n")[0] }); }
}
const chip = (p) => p.locator("[data-testid=djur-till-stall]").isVisible().catch(() => false);
const puffar = (p) => p.locator("[data-testid=puff]").allInnerTexts().catch(() => []);
const STALL_TEXT = "Djuret är i stallet";
async function vakna(p, lista) {
  for (const d of lista) { await p.evaluate((x) => window.__troll.vakna(x), d); await p.waitForTimeout(700); }
  await p.waitForTimeout(1800);
}
async function malAv(p, uid) {
  for (let i = 0; i < 10; i++) { const m = await p.evaluate((u) => window.__tredMal?.[u] ?? null, uid); if (m) return m; await p.waitForTimeout(400); }
  return null;
}
/** Tryck där djuret står; returnerar uid som "Till stallet"-knappen hör till (eller null). */
async function _tryck(p, uid, touch = false) {
  // humöret slumpas; "sugen" öppnar gåvorutan över knappen – här vill vi bara ha knappen
  await p.evaluate((u) => window.__troll.humor(u, "glad"), uid);
  for (const dy of [40, 55, 25, 70]) {
    const m = await malAv(p, uid);
    if (!m) return null;
    if (touch) await p.touchscreen.tap(m.x, m.y + dy); else await p.mouse.click(m.x, m.y + dy);
    await p.waitForTimeout(450);
    if (await chip(p)) return p.locator("[data-testid=djur-till-stall]").getAttribute("data-uid");
  }
  return null;
}
async function tillKartan(p) {
  await p.click("[data-testid=meny]"); await p.waitForTimeout(300);
  await p.click("[data-testid=ut-pa-aventyr]"); await p.waitForSelector("[data-testid=karta]"); await p.waitForTimeout(400);
}
async function _resaTill(p, id, touch = false) {
  await tillKartan(p);
  const b = await p.locator(`[data-testid=plats-${id}]`).boundingBox();
  if (touch) await p.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); else await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await p.waitForFunction((x) => document.querySelector("[data-testid=angen-3d]")?.getAttribute("data-plats") === x, id, { timeout: 8000 }).catch(() => undefined);
}
async function aldrigChip(p, ms) {
  for (let t = 0; t < ms; t += 250) { if (await chip(p)) return false; await p.waitForTimeout(250); }
  return true;
}
const sparning = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2")));
const _ANG5 = ["en kanin", "en gris", "en ko", "en get", "en häst"];

/** Trycker på djuret (utan att ändra humöret) tills något svarar: gåvorutan eller "Till stallet". */
async function tryckSom(p, uid) {
  for (const dy of [40, 55, 25, 70]) {
    const m = await malAv(p, uid);
    if (!m) return "inget-mal";
    await p.mouse.click(m.x, m.y + dy);
    await p.waitForTimeout(700);
    if (await synlig(p, "[data-testid=gava-remsa]")) return "gava";
    if (await chip(p)) return "chip";
  }
  return "inget";
}
/** Knappen syns och ligger överst (inget täcker mitten av den). */
const overst = (p, sel) => p.evaluate((s) => {
  const e = document.querySelector(s);
  if (!e) return false;
  const r = e.getBoundingClientRect();
  if (r.width < 44 || r.height < 30 || r.bottom > innerHeight || r.top < 0) return false;
  const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return !!t && (t === e || e.contains(t));
}, sel);
async function sugenKanin(p) {
  await vakna(p, ["en kanin"]);
  if (await synlig(p, "[data-testid=bok-skarm]")) await stangBok(p);
  const uid = (await sparning(p)).ang.at(-1)?.uid;
  await p.evaluate((u) => window.__troll.humor(u, "sugen"), uid);
  await p.waitForTimeout(300);
  return uid;
}

// A: första trycket → gåvorutan (med "Till stallet" synlig i den); andra och tredje trycket → vanlig replik + "Till stallet"
await blok("A", async () => {
  const { ctx, p } = await sida({});
  const uid = await sugenKanin(p);
  kolla("A tryck 1 → gåvorutan", (await tryckSom(p, uid)) === "gava");
  kolla("A tryck 1: Till stallet syns överst i gåvorutan", await overst(p, "[data-testid=gava-till-stall]"));
  await bild(p, "r9i-01-forsta-tryck.png");
  await stangBok(p);
  await p.waitForTimeout(6500); // knappen från tryck 1 hinner gå ut
  for (const n of [2, 3]) {
    const r = await tryckSom(p, uid);
    kolla(`A tryck ${n} → ingen gåvoruta, Till stallet`, r === "chip" && (await antal(p, "[data-testid=gava-remsa]")) === 0, { r });
    kolla(`A tryck ${n}: Till stallet överst (inte dold)`, await overst(p, "[data-testid=djur-till-stall]"));
    kolla(`A tryck ${n}: boken är stängd`, (await antal(p, "[data-testid=bok-skarm]")) === 0);
    kolla(`A tryck ${n}: vanlig djurreplik`, (await antal(p, "[data-testid=bubbla]")) > 0);
    if (n === 2) await bild(p, "r9i-02-andra-tryck.png");
    await p.waitForTimeout(6500);
  }
  kolla("A djuret är fortfarande sugen", (await p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2")))).liv?.[uid]?.humor === "sugen");
  await ctx.close();
});

// B: "Till stallet" i gåvorutan flyttar djuret, stänger boken och visar stall-bannern
await blok("B", async () => {
  const { ctx, p } = await sida({});
  const uid = await sugenKanin(p);
  kolla("B tryck 1 → gåvorutan", (await tryckSom(p, uid)) === "gava");
  await p.click("[data-testid=gava-till-stall]");
  await p.waitForTimeout(500);
  const st = await sparning(p);
  kolla("B djuret i stallet", st.stall.some((s) => s.uid === uid) && !st.ang.some((a) => a.uid === uid));
  kolla("B boken stängd (gåvoläget slut)", (await antal(p, "[data-testid=bok-skarm]")) === 0);
  let banner = false;
  for (let i = 0; i < 40 && !banner; i++) { banner = (await puffar(p)).some((t) => t.includes(STALL_TEXT)); if (!banner) await p.waitForTimeout(250); }
  kolla("B stall-bannern syns", banner);
  kolla("B ingen kvarlämnad Till stallet-knapp", await aldrigChip(p, 1500));
  await oppnaBok(p);
  kolla("B boken öppnas i skapa-läget", (await antal(p, "[data-testid=gava-remsa]")) === 0 && (await synlig(p, "[data-testid=skapar-guide]")));
  await bild(p, "r9i-03-stall-fran-gavorutan.png");
  await ctx.close();
});
// C: medan ett uppdrag pågår finns ingen gåtruta alls (inte räknare, inte "Visa gåtan"); när uppdraget är klart syns den igen
await blok("C", async () => {
  const { ctx, p } = await sida({ uppdrag: { "kanin-fryser": "pagar" } });
  await oppnaBok(p);
  const bok = await p.locator("[data-testid=bok-skarm]").innerText();
  kolla("C uppdraget visas", await synlig(p, "[data-testid=uppdrag-remsa]"));
  kolla("C ingen gåtruta i DOM", (await antal(p, "[data-testid=ledtrad], [data-testid=ledtrad-gata], .ledtrad-visa, .ledtrad-klar")) === 0);
  kolla("C ingen gåttext (rubrik, räknare, Visa gåtan)", !/Hemligt djur|hittade|Visa gåtan/i.test(bok), { bok: bok.slice(0, 200) });
  await bild(p, "r9i-04-uppdrag-utan-gata.png");
  await ctx.close();
});
await blok("C2", async () => {
  const { ctx, p } = await sida({ uppdrag: { "kanin-fryser": "klar" } });
  await oppnaBok(p);
  const uppdrag = await synlig(p, "[data-testid=uppdrag-remsa]");
  kolla("C2 uppdraget löst → inget uppdrag pågår", !uppdrag);
  kolla("C2 gåtrutan syns igen", await synlig(p, "[data-testid=ledtrad]"));
  await bild(p, "r9i-05-uppdrag-klart-gata.png");
  await ctx.close();
});
kolla("inga sidfel", fel.length === 0, { fel });
await browser.close();
server.close();
const ok = steg.every((s) => s.ok);
console.log(JSON.stringify({ ok, steg }, null, 1));
process.exit(ok ? 0 : 1);
