// R9G: Playwright-prov 375x812 mot dist-pages. Exit 0 = alla steg gröna. Kräver npm run build:pages.
//   node rundor/R9G-ux-stall/r9g-prov.mjs --bilder <mapp>
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

async function sida(spar) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: false, deviceScaleFactor: 1, locale: "sv-SE" });
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

// A: uppdrag pågår → bara uppdraget; gåtan finns inte i DOM förrän barnet öppnar den
{
  const { ctx, p } = await sida({ uppdrag: { "kanin-fryser": "pagar" } });
  await oppnaBok(p);
  await bild(p, "r9g-01-uppdrag.png");
  kolla("A uppdrag-remsa syns", await synlig(p, "[data-testid=uppdrag-remsa]"));
  kolla("A ingen ledtrad-gata i DOM", (await antal(p, "[data-testid=ledtrad-gata]")) === 0);
  kolla("A ingen hemligt-forklaring under uppdrag", (await antal(p, "[data-testid=hemligt-forklaring]")) === 0);
  kolla("A hopfälld ledtråd finns", (await antal(p, "details[data-testid=ledtrad]")) === 1);
  const fore = await p.getAttribute("[data-testid=ledtrad]", "data-hemligt");
  await p.click("details[data-testid=ledtrad] summary");
  await p.waitForTimeout(300);
  kolla("A öppnad → gåtan syns", await synlig(p, "[data-testid=ledtrad-gata]"));
  kolla("A samma gåta efter öppning", (await p.getAttribute("[data-testid=ledtrad]", "data-hemligt")) === fore, { fore });
  await bild(p, "r9g-01b-uppdrag-oppnad.png");
  await ctx.close();
}

// B: inget uppdrag → gåta + skrivhint; strecken går inte att trycka på; gåtan låst över stäng/öppna/omladdning
{
  const { ctx, p } = await sida({});
  await oppnaBok(p);
  kolla("B gåta syns", await synlig(p, "[data-testid=ledtrad-gata]"));
  kolla("B skrivhint syns", await synlig(p, "[data-testid=ledtrad-hint]"), { text: await p.locator("[data-testid=ledtrad-hint]").innerText().catch(() => "") });
  const s = await p.$eval("[data-testid=ledtrad-streck]", (e) => ({ tag: e.tagName, pe: getComputedStyle(e).pointerEvents, tab: e.tabIndex }));
  kolla("B streck är <span> utan pekarhändelser", s.tag === "SPAN" && s.pe === "none" && s.tab < 0, s);
  await p.locator("[data-testid=ledtrad-streck]").click({ force: true });
  const aktiv = await p.evaluate(() => document.activeElement?.getAttribute("data-testid") ?? document.activeElement?.tagName);
  kolla("B klick på streck gör inget", aktiv !== "ledtrad-streck", { aktiv });
  const h1 = await p.getAttribute("[data-testid=ledtrad]", "data-hemligt");
  await bild(p, "r9g-02-gata.png");
  await stangBok(p); await oppnaBok(p);
  kolla("B samma gåta efter stäng/öppna", (await p.getAttribute("[data-testid=ledtrad]", "data-hemligt")) === h1, { h1 });
  await p.reload({ waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__troll, null, { timeout: 20000 });
  await p.waitForTimeout(1200);
  await oppnaBok(p);
  kolla("B samma gåta efter omladdning", (await p.getAttribute("[data-testid=ledtrad]", "data-hemligt")) === h1);
  await p.click("[data-testid=ledtrad-ny]");
  await p.waitForTimeout(300);
  const h2 = await p.getAttribute("[data-testid=ledtrad]", "data-hemligt");
  kolla("B Ny gåta byter", h2 && h2 !== h1, { h1, h2 });
  await stangBok(p); await oppnaBok(p);
  kolla("B vald gåta ligger kvar", (await p.getAttribute("[data-testid=ledtrad]", "data-hemligt")) === h2);
  await ctx.close();
}

// C: tryck på djur → "Till stallet" → borta från ängen → meny Stallet → Hämta ut → tillbaka
async function tryckDjur(p, uid) {
  for (const dy of [40, 55, 25, 70, 10]) {
    const m = await p.evaluate((u) => window.__tredMal?.[u] ?? null, uid);
    if (!m) { await p.waitForTimeout(500); continue; }
    await p.mouse.click(m.x, m.y + dy);
    if (await p.locator("[data-testid=djur-till-stall]").isVisible().catch(() => false)) return true;
    await p.waitForTimeout(400);
  }
  return false;
}
async function stallRunda(p, namn, bildNamn) {
  const fore = await p.evaluate(() => window.__troll.state());
  const st = await p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2")));
  const plats = st.plats ?? "ang";
  const lista = plats === "ang" ? st.ang : st.platsSkapelser?.[plats] ?? [];
  const uid = lista[lista.length - 1]?.uid;
  kolla(`${namn} djur finns`, !!uid, { plats, n: lista.length, fore: !!fore });
  if (!uid) return;
  kolla(`${namn} tryck → chip`, await tryckDjur(p, uid));
  await bild(p, bildNamn.replace(".png", "-chip.png"));
  await p.click("[data-testid=djur-till-stall]");
  await p.waitForTimeout(800);
  const efter = await p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2")));
  const kvar = (plats === "ang" ? efter.ang : efter.platsSkapelser?.[plats] ?? []).some((a) => a.uid === uid);
  kolla(`${namn} borta från ${plats}`, !kvar && efter.stall.some((s) => s.uid === uid));
  kolla(`${namn} borta ur scenen`, await p.waitForFunction((u) => !window.__tredMal?.[u], uid, { timeout: 4000 }).then(() => true, () => false));
  await p.click("[data-testid=meny]");
  await p.waitForTimeout(300);
  await p.click("[data-testid=meny-stall]");
  await p.waitForTimeout(300);
  kolla(`${namn} stall-lista visar djuret`, await synlig(p, `[data-testid=stall-hamta-${uid}]`));
  await bild(p, bildNamn);
  await p.click(`[data-testid=stall-hamta-${uid}]`);
  await p.waitForTimeout(1200);
  const sen = await p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2")));
  const tillbaka = (plats === "ang" ? sen.ang : sen.platsSkapelser?.[plats] ?? []).some((a) => a.uid === uid);
  kolla(`${namn} hämtad tillbaka till ${plats}`, tillbaka && !sen.stall.some((s) => s.uid === uid));
  kolla(`${namn} syns i scenen igen`, await p.waitForFunction((u) => !!window.__tredMal?.[u], uid, { timeout: 5000 }).then(() => true, () => false));
}
{
  const { ctx, p } = await sida({});
  await p.evaluate(() => window.__troll.vakna("en kanin"));
  await p.waitForTimeout(2500);
  await stallRunda(p, "C ängen", "r9g-03-stall.png");
  await p.click("[data-testid=meny]");
  await p.waitForTimeout(300);
  await p.click("[data-testid=meny-stall]");
  await p.waitForTimeout(300);
  kolla("C tomt stall visar text", /tomt/i.test(await p.locator("[data-testid=stall-lista]").innerText()));
  await ctx.close();
}
{
  // D: samma i skogen (platsSkapelser)
  const { ctx, p } = await sida({ plats: "skogen", oppnadePlatser: ["skogen"], seddaIntro: ["skogen"] });
  await p.evaluate(() => window.__troll.vakna("en räv"));
  await p.waitForTimeout(3000);
  await stallRunda(p, "D skogen", "r9g-04-stall-skogen.png");
  await ctx.close();
}
{
  // E: platserna efter datafixarna (bilder) + ingen karttext som banner när man reser
  for (const plats of ["skogen", "sjon", "grottan"]) {
    const { ctx, p } = await sida({ plats, oppnadePlatser: ["skogen", "sjon", "grottan"], seddaIntro: ["skogen", "sjon", "grottan"] });
    await p.waitForTimeout(2500);
    await bild(p, `r9g-05-${plats}.png`);
    await ctx.close();
  }
  const { ctx, p } = await sida({ ang: [], oppnadePlatser: ["skogen"], seddaIntro: ["skogen"] });
  await p.click("[data-testid=meny]");
  await p.waitForTimeout(300);
  await p.click("[data-testid=ut-pa-aventyr]");
  await p.waitForSelector("[data-testid=karta]");
  await p.locator("[data-testid=plats-skogen]").click({ force: true });
  let karttext = false;
  for (let i = 0; i < 12; i++) {
    await p.waitForTimeout(500);
    const t = await p.locator("[data-testid=puff],[data-testid=bubbla]").allInnerTexts();
    if (t.some((x) => /Nu kan du resa|Skogen öppnas/.test(x))) karttext = true;
  }
  kolla("E karttexten syns inte som bubbla/banner i skogen", !karttext);
  kolla("E i skogen", (await p.getAttribute("[data-testid=angen-3d]", "data-plats")) === "skogen");
  await ctx.close();
}
kolla("inga sidfel", fel.length === 0, { fel });
await browser.close();
server.close();
const ok = steg.every((s) => s.ok);
console.log(JSON.stringify({ ok, steg }, null, 1));
process.exit(ok ? 0 : 1);
