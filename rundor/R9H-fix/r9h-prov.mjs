// R9H: Playwright-prov 375x812 mot dist-pages för fel 1–5 ur Doodles speltest. Exit 0 = alla steg gröna. Kräver npm run build:pages.
//   node rundor/R9H-fix/r9h-prov.mjs --bilder <mapp>
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
async function tryck(p, uid, touch = false) {
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
async function resaTill(p, id, touch = false) {
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
const ANG5 = ["en kanin", "en gris", "en ko", "en get", "en häst"];

// 1: tryck på kartknappen (mus och touch) går inte igenom till ett djur – ingen "Till stallet" vid ankomsten
for (const touch of [false, true]) await blok(touch ? "1-touch" : "1-mus", async () => {
  const namn = touch ? "touch" : "mus";
  const { ctx, p } = await sida({ oppnadePlatser: ["skogen"], seddaIntro: [] }, touch);
  await vakna(p, ANG5);
  await resaTill(p, "skogen", touch);
  kolla(`1 ${namn}: framme i skogen`, (await p.getAttribute("[data-testid=angen-3d]", "data-plats")) === "skogen");
  kolla(`1 ${namn}: ingen Till stallet vid ankomst (3 s)`, await aldrigChip(p, 3000));
  await bild(p, `r9h-01-ankomst-${namn}.png`);
  await p.click("[data-testid=plats-hem]");
  await p.waitForTimeout(800);
  kolla(`1 ${namn}: ingen Till stallet efter Till ängen (2 s)`, await aldrigChip(p, 2000));
  await ctx.close();
});
// 1b: knappen från ängen följer inte med till skogen
await blok(1, async () => {
  const { ctx, p } = await sida({ oppnadePlatser: ["skogen"], seddaIntro: ["skogen"] });
  await vakna(p, ["en kanin"]);
  const uid = (await sparning(p)).ang.at(-1)?.uid;
  kolla("1b tryck på kaninen → Till stallet", (await tryck(p, uid)) === uid);
  await resaTill(p, "skogen");
  kolla("1b knappen borta i skogen", await aldrigChip(p, 2000));
  await ctx.close();
});

// 2: bannern "Djuret är i stallet …" försvinner när djuret hämtas ut och när barnet byter plats
await blok(2, async () => {
  const { ctx, p } = await sida({ oppnadePlatser: ["skogen"], seddaIntro: ["skogen"] });
  await vakna(p, ["en kanin"]);
  const uid = (await sparning(p)).ang.at(-1)?.uid;
  kolla("2 tryck → Till stallet", (await tryck(p, uid)) === uid);
  await p.click("[data-testid=djur-till-stall]");
  // bannern kan stå i kö bakom "Nytt ord i boken" m.fl. – vänta tills den syns
  let syns = false;
  for (let i = 0; i < 40 && !syns; i++) { syns = (await puffar(p)).some((t) => t.includes(STALL_TEXT)); if (!syns) await p.waitForTimeout(250); }
  kolla("2 bannern syns efter Till stallet", syns);
  await p.click("[data-testid=meny]"); await p.waitForTimeout(200);
  await p.click("[data-testid=meny-stall]"); await p.waitForTimeout(200);
  await p.click(`[data-testid=stall-hamta-${uid}]`);
  await p.waitForTimeout(300);
  kolla("2 bannern borta direkt efter Hämta ut", !(await puffar(p)).some((t) => t.includes(STALL_TEXT)));
  let igen = false;
  for (let i = 0; i < 12; i++) { if ((await puffar(p)).some((t) => t.includes(STALL_TEXT))) igen = true; await p.waitForTimeout(250); }
  kolla("2 bannern kommer inte tillbaka (3 s)", !igen);
  await bild(p, "r9h-02-hamtad.png");
  await p.waitForTimeout(1500);
  kolla("2 djuret tillbaka i scenen", !!(await malAv(p, uid)));
  kolla("2 tryck igen → Till stallet", (await tryck(p, uid)) === uid);
  await p.click("[data-testid=djur-till-stall]");
  await p.waitForTimeout(200);
  await resaTill(p, "skogen");
  kolla("2 bannern borta efter platsbyte", !(await puffar(p)).some((t) => t.includes(STALL_TEXT)));
  await ctx.close();
});

// 2b: Till stallet direkt efter att djuret vaknat (bannern står i kö) → Hämta ut → bannern visas aldrig efteråt
await blok(3, async () => {
  const { ctx, p } = await sida({});
  await vakna(p, ["en kanin"]);
  if (await synlig(p, "[data-testid=bok-skarm]")) await stangBok(p);
  const uid = (await sparning(p)).ang.at(-1)?.uid;
  kolla("2b tryck → Till stallet", (await tryck(p, uid)) === uid);
  await p.evaluate(() => window.__troll.vakna("en gris")); // "Nytt ord i boken: gris!" hamnar först i kön
  await p.waitForTimeout(400);
  if (await synlig(p, "[data-testid=bok-skarm]")) await stangBok(p);
  await p.click("[data-testid=djur-till-stall]");
  await p.waitForTimeout(150);
  const nu = await puffar(p);
  kolla("2b stall-bannern står i kö bakom en annan", nu.length > 0 && !nu.some((t) => t.includes(STALL_TEXT)), { nu });
  await p.click("[data-testid=meny]"); await p.waitForTimeout(150);
  await p.click("[data-testid=meny-stall]"); await p.waitForTimeout(150);
  await p.click(`[data-testid=stall-hamta-${uid}]`);
  let sedd = false;
  for (let i = 0; i < 32; i++) { if ((await puffar(p)).some((t) => t.includes(STALL_TEXT))) sedd = true; await p.waitForTimeout(250); }
  kolla("2b köad stall-banner visas inte efter Hämta ut (8 s)", !sedd);
  await ctx.close();
});

// 3: trycket hamnar på djuret man tryckte på (inte på djuret bakom eller ett 2D-djur under 3D-duken)
await blok(4, async () => {
  const { ctx, p } = await sida({});
  await vakna(p, ["en kanin", "en gris", "en ko"]);
  const uids = (await sparning(p)).ang.map((a) => a.uid);
  const mal = {};
  for (const u of uids) mal[u] = await malAv(p, u);
  const fri = uids.filter((u) => mal[u] && uids.every((v) => v === u || !mal[v] || Math.hypot(mal[u].x - mal[v].x, mal[u].y - mal[v].y) > 70));
  const traffar = [];
  for (const u of fri) { const r = await tryck(p, u); traffar.push({ u, r }); await p.waitForTimeout(6200); }
  kolla("3 minst två fristående djur", fri.length >= 2, { fri: fri.length });
  kolla("3 varje tryck träffar rätt djur", traffar.every((t) => t.r === t.u), { traffar });
  await ctx.close();
});

// 4: gåvoläget är aldrig klistrigt
async function sugenTryck(p) {
  await vakna(p, ["en kanin"]);
  const uid = (await sparning(p)).ang.at(-1)?.uid;
  await p.evaluate((u) => window.__troll.humor(u, "sugen"), uid);
  await p.waitForTimeout(300);
  const m = await malAv(p, uid);
  let oppen = false;
  for (const dy of [40, 55, 25, 70]) {
    await p.mouse.click(m.x, m.y + dy);
    await p.waitForTimeout(600);
    if (await synlig(p, "[data-testid=gava-remsa]")) { oppen = true; break; }
  }
  return { uid, oppen };
}
// Skriver som barnet: alla bokstäver via skärmtangenten (gåvorutan har inte fokus, så keyboard.type når inte fram).
async function skriv(p, t) {
  await p.getByTestId("tangentbord").waitFor();
  for (const tecken of t) {
    if (tecken === " ") await p.getByTestId("mellanslag").click();
    else await p.getByTestId("tangentbord").getByRole("button", { name: tecken, exact: true }).click();
  }
  await p.getByTestId("vakna").click();
  await p.waitForTimeout(1200);
}
await blok(5, async () => {
  const { ctx, p } = await sida({});
  const { oppen } = await sugenTryck(p);
  kolla("4a tryck på sugen kanin → Vad vill du ge?", oppen);
  await bild(p, "r9h-04-gava.png");
  await stangBok(p);
  await oppnaBok(p);
  kolla("4a efter stäng/öppna: ingen gåvoruta", (await antal(p, "[data-testid=gava-remsa]")) === 0);
  kolla("4a efter stäng/öppna: skapa-läget", await synlig(p, "[data-testid=skapar-guide]"));
  const fore = (await sparning(p)).ang.length;
  await skriv(p, "en gris");
  kolla("4a det barnet skriver blir ett nytt djur", (await sparning(p)).ang.length === fore + 1, { fore });
  await ctx.close();
});
await blok(6, async () => {
  const { ctx, p } = await sida({});
  const { oppen } = await sugenTryck(p);
  kolla("4b gåvoruta öppen", oppen);
  await skriv(p, "en hund");
  kolla("4b djur i gåvorutan → gåvoläget slutar", (await antal(p, "[data-testid=gava-remsa]")) === 0);
  const fore = (await sparning(p)).ang.length;
  if (!(await synlig(p, "[data-testid=tangentbord]"))) await oppnaBok(p);
  await skriv(p, "en gris");
  kolla("4b nästa ord blir ett nytt djur", (await sparning(p)).ang.length === fore + 1, { fore });
  await ctx.close();
});
await blok(7, async () => {
  const { ctx, p } = await sida({});
  const { oppen } = await sugenTryck(p);
  kolla("4c gåvoruta öppen", oppen);
  await skriv(p, "ett äpple");
  kolla("4c efter en gåva: ingen gåvoruta", (await antal(p, "[data-testid=gava-remsa]")) === 0);
  await ctx.close();
});

// 5: stall-listan visar "en räv", aldrig "röv"; texten är stor nog
await blok(8, async () => {
  const { ctx, p } = await sida({ plats: "skogen", oppnadePlatser: ["skogen"], seddaIntro: ["skogen"] });
  await vakna(p, ["en räv"]);
  const st = await sparning(p);
  const uid = st.platsSkapelser?.skogen?.at(-1)?.uid;
  kolla("5 tryck på räven → Till stallet", (await tryck(p, uid)) === uid);
  await p.click("[data-testid=djur-till-stall]");
  await p.waitForTimeout(500);
  await p.click("[data-testid=meny]"); await p.waitForTimeout(200);
  await p.click("[data-testid=meny-stall]"); await p.waitForTimeout(300);
  const t = await p.locator(`[data-testid=stall-namn-${uid}]`).innerText().catch(() => "");
  const fs0 = await p.$eval(`[data-testid=stall-namn-${uid}]`, (e) => parseFloat(getComputedStyle(e).fontSize)).catch(() => 0);
  kolla("5 stall-listan: 'en räv'", t === "en räv", { t });
  kolla("5 inget 'röv' i stall-listan", !/röv/i.test(await p.locator("[data-testid=stall-lista]").innerText()));
  kolla("5 namnet minst 18 px", fs0 >= 18, { fs0 });
  await bild(p, "r9h-05-stall-rav.png");
  await ctx.close();
});
kolla("inga sidfel", fel.length === 0, { fel });
await browser.close();
server.close();
const ok = steg.every((s) => s.ok);
console.log(JSON.stringify({ ok, steg }, null, 1));
process.exit(ok ? 0 : 1);
