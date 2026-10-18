// R6A: ett kontaktark (375x812 x2): Uppdragsboken öppnad från menyn, flikarna Pågår och Klara, med Bengtssons texter.
// Användning: node rundor/R6A-bengtsson/bok-prov.mjs --ut docs/skarmbilder/r6a/uppdragsboken.png [--dist dist-pages]
// Kräver `npm run build:pages` först. Skriver också JSON med texterna som syns (stdout). exit 0 = allt stämde.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const dist = path.resolve(arg("dist", "dist-pages"));
const ut = path.resolve(arg("ut", "uppdragsboken.png"));
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
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
    localStorage.setItem(
      "trollpennan-v2",
      JSON.stringify({ version: 2, introSedd: true, uppdrag: { "hitta-kotte": "klar", mossugglan: "pagar", svampring: "pagar", bavern: "pagar" } }),
    );
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
await p.getByTestId("meny").click();
const knappLast = await p.getByTestId("uppdrag-knapp").evaluate((e) => e.getAttribute("data-last") === "ja");
await p.getByTestId("uppdrag-knapp").click();
await p.getByTestId("uppdragbok").waitFor();
await p.waitForTimeout(500);
const pagar = await p.locator("[data-testid^=uppdrag-][data-givare]").allInnerTexts();
await p.screenshot({ path: "/tmp/r6a-1.png" });
await p.getByTestId("flik-klara").click();
await p.waitForTimeout(300);
const klara = await p.locator("[data-testid^=uppdrag-][data-givare]").allInnerTexts();
await p.screenshot({ path: "/tmp/r6a-2.png" });
const a = fs.readFileSync("/tmp/r6a-1.png").toString("base64");
const b = fs.readFileSync("/tmp/r6a-2.png").toString("base64");
const ark = await ctx.newPage();
await ark.setViewportSize({ width: 760, height: 812 });
await ark.setContent(`<body style="margin:0;display:flex;gap:10px;background:#555"><img src="data:image/png;base64,${a}"><img src="data:image/png;base64,${b}"></body>`);
await ark.waitForTimeout(300);
fs.mkdirSync(path.dirname(ut), { recursive: true });
await ark.screenshot({ path: ut });
await browser.close();
server.close();
const ok = !knappLast && pagar.length === 3 && klara.length === 1 && [...pagar, ...klara].every((t) => t.startsWith("Doktor Bengtsson: ")) && fel.length === 0;
console.log(JSON.stringify({ menyknapp_last: knappLast, pagar, klara, sidfel: fel, ok }, null, 1));
process.exit(ok ? 0 : 1);
