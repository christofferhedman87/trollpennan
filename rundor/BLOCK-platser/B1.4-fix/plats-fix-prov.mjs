// B1.4-fix: fel 1–6. 375x812. Exit 0 = allt stämde. Kräver npm run build:pages.
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
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, deviceScaleFactor: 1, locale: "sv-SE" });
await ctx.addInitScript(() => {
  if (!sessionStorage.getItem("f")) {
    localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true }));
    sessionStorage.setItem("f", "1");
  }
});
const p = await ctx.newPage();
const fel = [];
p.on("pageerror", (e) => fel.push(String(e)));
p.setDefaultTimeout(15000);
await p.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => !!window.__troll, null, { timeout: 20000 });
await p.waitForTimeout(1500);
const vanta = (ms) => p.waitForTimeout(ms);
const bild = async (n) => bilder && p.screenshot({ path: path.join(bilder, n), animations: "disabled" });
const steg = [];
const kolla = (namn, ok, info = {}) => steg.push({ namn, ok: !!ok, ...info });

async function oppnaKarta() {
  await p.click("[data-testid=meny]");
  await vanta(300);
  await p.click("[data-testid=ut-pa-aventyr]");
  await p.waitForSelector("[data-testid=karta]", { timeout: 8000 });
}

// 1a: skriv låst plats → Inte riktigt än under ERROR-automaten
await p.evaluate(() => window.__troll.aterstall());
await vanta(700);
await p.evaluate(() => window.__troll.vakna("grottan"));
await vanta(2000);
await bild("01-skriv-last.png");
kolla("1a skriv låst → inte-riktigt-an", await p.locator("[data-testid=inte-riktigt-an]").count() === 1);
kolla("1a npc-figur mine=automat", await p.locator("[data-testid=npc-figur][data-mine=automat]").count() === 1);
const felBox = await p.locator("[data-testid=inte-riktigt-an]").boundingBox();
kolla("1a text synlig i vy (y inom 812)", !!felBox && felBox.y > 0 && felBox.y + felBox.height < 812, { felBox });

// 1b: karta → tryck låst skogen
await p.evaluate(() => window.__troll.aterstall());
await vanta(700);
await oppnaKarta();
await bild("02-karta.png");
const kartaText = await p.locator("[data-testid=karta]").innerText();
kolla("5 karta saknar Phaser-djurkrav", !/flyger|simmar|jättestor/.test(kartaText));
kolla("5 karta nämner låst/resa", /låst|resa|plats/i.test(kartaText));
await p.locator("[data-testid=plats-skogen]").click({ force: true });
await vanta(2000);
await bild("03-tryck-last.png");
kolla("1b tryck låst → inte-riktigt-an", await p.locator("[data-testid=inte-riktigt-an]").count() === 1);
kolla("1b fortfarande på ängen", await p.getAttribute("[data-testid=angen-3d]", "data-plats") === "ang");

// 3+4+6: resa till skogen
await p.evaluate(() => window.__troll.aterstall());
await vanta(500);
for (const t of ["en gris", "en hund", "en katt"]) {
  await p.evaluate((x) => window.__troll.vakna(x), t);
  await vanta(700);
}
await p.evaluate(() => window.__troll.vakna("skogen"));
await p.waitForSelector("[data-testid=plats-hem]", { timeout: 10000 });
await vanta(2800);
await bild("04-skogen.png");
kolla("data-plats=skogen", await p.getAttribute("[data-testid=angen-3d]", "data-plats") === "skogen");
kolla("4 Bengtsson figur på skogen", await p.locator("[data-testid=npc-figur]").count() === 1);
kolla("4 ingen ikon-ersättning", await p.locator("[data-testid=bengtsson-ikon]").count() === 0);

const hem = await p.locator("[data-testid=plats-hem]").boundingBox();
const hintCount = await p.locator("[data-testid=tred-hint]").count();
if (hintCount === 0) {
  kolla("6 hint borta efter interaktion (ok)", true);
} else {
  const hint = await p.locator("[data-testid=tred-hint]").boundingBox();
  const overlap = hem && hint && !(hem.y + hem.height <= hint.y || hint.y + hint.height <= hem.y || hem.x + hem.width <= hint.x || hint.x + hint.width <= hem.x);
  kolla("6 Till ängen täcker inte Dra-hint", !overlap, { hem, hint });
}

// snabb koll sjön/grottan via dev-upplåsning: skapa djur räcker ej för sjön; hoppa över scenbyte
// Body-text ska inte ha gammal Phaser-rad
const body = await p.locator("body").innerText();
kolla("5 ingen 'Den som flyger, simmar'", !/Den som flyger, simmar/.test(body));
kolla("inga sidfel", fel.length === 0, { fel });

await browser.close();
server.close();
const ok = steg.every((s) => s.ok);
console.log(JSON.stringify({ ok, steg }, null, 1));
process.exit(ok ? 0 : 1);
