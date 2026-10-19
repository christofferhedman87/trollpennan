// R6A-3: bevis i byggd sida (375x812): uppdraget har guidande förslag (knappar), ett tryck fyller skrivfältet och klarar uppdraget,
// fritext fungerar fortfarande som alternativ (nästa uppdrag löses med eget skrivet svar inkl. å/ä/ö), alla knappar ur datan klarar sitt krav.
// Användning: node rundor/R6A-3-bara-bengtsson/val-prov.mjs --ut docs/skarmbilder/r6a3/efter/val.png [--dist dist-pages]
// Kräver `npm run build:pages` först. exit 0 = allt stämde. Skriver JSON med det som mättes (stdout).
// Lapparna (djurens skyltar som startar uppdrag) ritas av Phaser och provas inte här: de täcks av enhetstesterna (uppdrag.test.ts).
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const dist = path.resolve(arg("dist", "dist-pages"));
const ut = path.resolve(arg("ut", "val.png"));
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
p.on("pageerror", (e) => fel.push("pageerror: " + e));
p.setDefaultTimeout(10000);
await p.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => !!window.__troll, null, { timeout: 20000 });
await p.waitForTimeout(1500);
const m = {};
const bilder = [];
const skott = async (namn) => {
  await p.waitForTimeout(500);
  const f = `/tmp/r6a3-${namn}.png`;
  await p.screenshot({ path: f });
  bilder.push(fs.readFileSync(f).toString("base64"));
};
const stj = async () => Number((await p.getByTestId("stjarnor").innerText()).replace(/\D/g, ""));
const status = (id) => p.evaluate((i) => JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}").uppdrag?.[i] ?? null, id);
const skriv = async (t) => {
  await p.getByTestId("tangentbord").waitFor();
  for (const tecken of t) {
    if (tecken === " ") await p.getByTestId("mellanslag").click();
    else if ("åäö".includes(tecken)) await p.getByTestId("tangentbord").getByRole("button", { name: tecken, exact: true }).click();
    else await p.keyboard.type(tecken, { delay: 20 });
  }
  await p.getByTestId("vakna").click();
};

// 1. Klick på Bengtsson: uppdraget med guidande förslag
await p.locator("[data-testid=npc-figur],[data-testid=bengtsson-ikon]").first().click();
await p.getByTestId("uppdrag-remsa").waitFor();
m.remsa = (await p.getByTestId("uppdrag-remsa").innerText()).trim();
m.grupper = await p.getByTestId("uppdrag-val-grupp").count();
m.knappar = await p.getByTestId("uppdrag-val-fras").allInnerTexts();
m.fritext_kvar = (await p.getByTestId("tangentbord").count()) === 1;
const k0 = await p.getByTestId("uppdrag-val-fras").first().boundingBox();
m.knapp_hojd = k0 && Math.round(k0.height);
// raden ska synas ovanför fältet (inte skymmas av det): första knappen helt inom synfältet och ovanför skrivfältet
const falt = await p.getByTestId("remsa").boundingBox();
m.forsta_synlig = !!k0 && !!falt && k0.y >= 0 && k0.y + k0.height <= falt.y + 1;
await skott("1-forslag");

// 2. Ett tryck på "mössa" fyller fältet; uppdraget är inte klart förrän barnet trycker Vakna
await p.getByTestId("uppdrag-val-fras").filter({ hasText: /^mössa$/ }).click();
m.falt_efter_tryck = (await p.getByTestId("remsa").innerText()).trim();
m.status_fore_vakna = await status("kanin-fryser");
await skott("2-fyllt");
const stjFore = await stj();
await p.getByTestId("vakna").click();
m.klar_replik_syns = await p.getByText("Nu är kaninen varm igen").waitFor({ timeout: 12000 }).then(() => true, () => false);
m.status_efter_tryck = await status("kanin-fryser");
m.stjarnor_plus = (await stj()) - stjFore;
await skott("3-klar");

// 3. Fritext som alternativ: nästa uppdrag (regn-skydd) löses med eget svar med å/ä/ö, utan att trycka på ett förslag
await p.waitForTimeout(10000); // bannerkön töms som när ett barn tänker efter
if ((await p.getByTestId("stang-bok").count()) > 0) await p.getByTestId("stang-bok").click(); // boken står öppen efter klart uppdrag
await p.locator("[data-testid=npc-figur],[data-testid=bengtsson-ikon]").first().click();
await p.getByTestId("uppdrag-remsa").waitFor();
m.remsa2 = (await p.getByTestId("uppdrag-remsa").innerText()).trim();
m.knappar2 = await p.getByTestId("uppdrag-val-fras").allInnerTexts();
await skriv("en blå kanin med regnkappa");
m.klar2_replik_syns = await p.getByText("Nu blir ingen blöt").waitFor({ timeout: 12000 }).then(() => true, () => false);
m.status_fritext = await status("regn-skydd");
await skott("4-fritext");

// 4. Ingen gammal text: lapparnas ursprungstexter nås inte via uppdragen (bara Bengtsson-raden visas i Uppdragsboken)
await p.getByTestId("meny").click();
await p.getByTestId("uppdrag-knapp").click();
await p.getByTestId("flik-klara").click();
m.bok_givare = await p.locator("[data-testid^=uppdrag-][data-givare]").evaluateAll((es) => [...new Set(es.map((e) => e.getAttribute("data-givare")))]);

const ark = await ctx.newPage();
await ark.setViewportSize({ width: 375 * bilder.length + 10 * (bilder.length - 1), height: 812 });
await ark.setContent(`<body style="margin:0;display:flex;gap:10px;background:#555">${bilder.map((b) => `<img src="data:image/png;base64,${b}">`).join("")}</body>`);
await ark.waitForTimeout(300);
fs.mkdirSync(path.dirname(ut), { recursive: true });
await ark.screenshot({ path: ut });
await browser.close();
server.close();
m.sidfel = fel;
m.ok =
  m.remsa.startsWith("Doktor Bengtsson:") &&
  m.grupper === 2 &&
  m.knappar.length === 5 &&
  m.forsta_synlig &&
  m.knappar.includes("mössa") &&
  m.fritext_kvar &&
  m.knapp_hojd >= 44 &&
  m.falt_efter_tryck === "en kanin med mössa" &&
  m.status_fore_vakna === "pagar" &&
  m.klar_replik_syns &&
  m.status_efter_tryck === "klar" &&
  m.stjarnor_plus >= 2 && // uppdragets 2 + ev. 1 för det nya djuret
  m.knappar2.length >= 3 &&
  m.klar2_replik_syns &&
  m.status_fritext === "klar" &&
  m.bok_givare.length === 1 &&
  m.bok_givare[0] === "bengtsson" &&
  fel.length === 0;
console.log(JSON.stringify(m, null, 1));
process.exit(m.ok ? 0 : 1);
