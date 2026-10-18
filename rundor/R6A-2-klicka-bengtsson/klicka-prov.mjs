// R6A-2: bevis i byggd sida (375x812): Bengtsson syns, klick ger uppdraget och öppnar Skapa-menyn, fel ord ger skämt (automat-minen),
// rätt ord klarar uppdraget (glad mine, +2 stjärnor). Ett kontaktark med fyra rutor.
// Användning: node rundor/R6A-2-klicka-bengtsson/klicka-prov.mjs --ut docs/skarmbilder/r6a2/efter/klicka-bengtsson.png [--dist dist-pages]
// Kräver `npm run build:pages` först. exit 0 = allt stämde. Skriver JSON med det som mättes (stdout).
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const dist = path.resolve(arg("dist", "dist-pages"));
const ut = path.resolve(arg("ut", "klicka-bengtsson.png"));
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
const bildfel = [];
p.on("pageerror", (e) => fel.push("pageerror: " + e));
p.on("response", (r) => {
  if (r.url().includes("/npc/") && !r.ok()) bildfel.push(r.status() + " " + r.url());
});
p.setDefaultTimeout(10000);
await p.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => !!window.__troll, null, { timeout: 20000 });
await p.waitForTimeout(1500);
const m = {};
const bilder = [];
const skott = async (namn) => {
  await p.waitForTimeout(500);
  const f = `/tmp/r6a2-${namn}.png`;
  await p.screenshot({ path: f });
  bilder.push(fs.readFileSync(f).toString("base64"));
};
const mine = () => p.getByTestId("npc-figur").getAttribute("data-mine");
const stj = async () => Number((await p.getByTestId("stjarnor").innerText()).replace(/\D/g, ""));
// Skriver som barnet: å/ä/ö via skärmtangenten (Playwrights keyboard.type skickar dem som insertText utan keydown, som appen aldrig ser: "blå" blev "bl"),
// övriga tecken via tangentbordet, mellanslag via skärmtangenten.
const skriv = async (t) => {
  await p.getByTestId("tangentbord").waitFor();
  for (const tecken of t) {
    if (tecken === " ") await p.getByTestId("mellanslag").click();
    else if ("åäö".includes(tecken)) await p.getByTestId("tangentbord").getByRole("button", { name: tecken, exact: true }).click();
    else await p.keyboard.type(tecken, { delay: 20 });
  }
  await p.getByTestId("vakna").click();
};

// 1. Ängen: Bengtsson syns med framsida och ett utropstecken (nytt uppdrag finns)
await p.getByTestId("npc-figur").waitFor();
m.mine_start = await mine();
m.utrop_start = await p.locator(".npc-utrop").count();
const box = await p.getByTestId("npc-figur").boundingBox();
m.figur_ruta = box && { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) };
m.malstorlek_ok = !!box && box.width >= 44 && box.height >= 44;
await skott("1-anglig");

// 2. Klick: uppdraget visas i Skapa-menyn
await p.getByTestId("npc-figur").click();
await p.getByTestId("uppdrag-remsa").waitFor();
m.remsa = (await p.getByTestId("uppdrag-remsa").innerText()).trim();
m.skriver = (await p.getByTestId("tangentbord").count()) === 1;
await skott("2-skapa");

// 3. Fel ord: djuret skapas ändå, Bengtsson svarar med skämt, automat-minen
await skriv("en blå katt");
await p.waitForTimeout(800);
m.mine_fel = await mine().catch(() => null);
m.status_efter_fel = await p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}").uppdrag?.["kanin-fryser"] ?? null);
await skott("3-fel");

// 4. Klick igen (uppdraget pågår fortfarande), rätt ord: klart, glad mine, +2 stjärnor
if ((await p.getByTestId("uppdrag-remsa").count()) === 0) await p.getByTestId("npc-figur").click();
await p.getByTestId("uppdrag-remsa").waitFor();
await p.waitForTimeout(10000); // bannerkön (en rad ca 2,5 s) töms som när ett barn tänker efter
const stjFore = await stj(); // efter det felaktiga svaret, så bara uppdragets stjärnor räknas
await skriv("en varm filt");
m.klar_replik_syns = await p.getByText("Nu är kaninen varm igen").waitFor({ timeout: 12000 }).then(() => true, () => false);
m.mine_klar = await mine().catch(() => null);
m.stjarnor_plus = (await stj()) - stjFore;
m.status_efter_klar = await p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}").uppdrag?.["kanin-fryser"] ?? null);
await skott("4-klar");

// 5. Uppdragsboken är kvar som lista: menyn -> Uppdragsboken -> Klara
await p.getByTestId("meny").click();
await p.getByTestId("uppdrag-knapp").click();
await p.getByTestId("flik-klara").click();
m.bok_klara = await p.locator("[data-testid^=uppdrag-][data-givare]").allInnerTexts();

const ark = await ctx.newPage();
await ark.setViewportSize({ width: 375 * bilder.length + 10 * (bilder.length - 1), height: 812 });
await ark.setContent(`<body style="margin:0;display:flex;gap:10px;background:#555">${bilder.map((b) => `<img src="data:image/png;base64,${b}">`).join("")}</body>`);
await ark.waitForTimeout(300);
fs.mkdirSync(path.dirname(ut), { recursive: true });
await ark.screenshot({ path: ut });
await browser.close();
server.close();
m.sidfel = fel;
m.bildfel = bildfel;
m.ok =
  m.mine_start === "framsida" &&
  m.utrop_start === 1 &&
  m.malstorlek_ok &&
  m.remsa === "Doktor Bengtsson: Det verkar som att din kanin fryser. Se om du kan skriva fram något som värmer." &&
  m.skriver &&
  m.mine_fel === "automat" &&
  m.status_efter_fel === "pagar" &&
  m.klar_replik_syns &&
  m.mine_klar === "glad" &&
  m.stjarnor_plus === 2 &&
  m.status_efter_klar === "klar" &&
  m.bok_klara.length === 1 &&
  fel.length === 0 &&
  bildfel.length === 0;
console.log(JSON.stringify(m, null, 1));
process.exit(m.ok ? 0 : 1);
