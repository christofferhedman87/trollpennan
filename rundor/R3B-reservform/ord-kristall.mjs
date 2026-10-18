// R3B: en ren stillbild (375×812, byggd sida) av vad ett okänt ord blir. Används som bevis; Christoffer godkänner utseendet på bilden.
// Användning: node rundor/R3B-reservform/ord-kristall.mjs --ut docs/skarmbilder/r3b [--fras "elefant"] [--namn ordkristall-elefant] [--dist dist-pages] [--vp 375x812]
//   --ark gör i stället ETT kontaktark (3 kolumner, utsnittet kring ängen) i ut/<namn>-ark.png.
//   Flera bilder: --fras "elefant|en pizza|en kanin med paraply" (| skiljer fraserna; namn blir fras-1, fras-2 …). Förutsätter `npm run build:pages` och Playwright med Chromium.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const ut = path.resolve(arg("ut", "docs/skarmbilder/r3b"));
const dist = path.resolve(arg("dist", "dist-pages"));
const fraser = arg("fras", "elefant").split("|");
const namn = arg("namn", fraser.length === 1 ? "ordkristall" : "fras");
const [bw, bh] = arg("vp", "375x812").split("x").map(Number);
fs.mkdirSync(ut, { recursive: true });

const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let f = path.join(dist, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, "index.html");
  res.setHeader("Content-Type", mime[path.extname(f)] ?? "application/octet-stream");
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({ viewport: { width: bw, height: bh }, hasTouch: true, deviceScaleFactor: 1, locale: "sv-SE" });
await ctx.addInitScript(() => {
  if (!sessionStorage.getItem("f")) {
    localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true }));
    sessionStorage.setItem("f", "1");
  }
});
const p = await ctx.newPage();
const ark = process.argv.includes("--ark");
const delar = [];
const fel = [];
p.on("pageerror", (e) => fel.push(String(e)));
p.on("console", (m) => m.type() === "error" && fel.push(m.text()));
p.setDefaultTimeout(10000);
await p.goto(url, { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => !!window.__troll, null, { timeout: 20000 });
await p.waitForTimeout(900);
for (const [i, f] of fraser.entries()) {
  await p.evaluate(() => window.__troll.aterstall());
  await p.waitForTimeout(500);
  await p.evaluate((x) => window.__troll.vakna(x), f);
  await p.waitForTimeout(Number(arg("vanta", "4200")));
  if (ark) {
    delar.push({ f, b64: (await p.screenshot({ clip: { x: 0, y: 140, width: bw, height: 470 } })).toString("base64") });
    continue;
  }
  const fil = path.join(ut, fraser.length === 1 ? `${namn}.png` : `${namn}-${i + 1}.png`);
  fs.writeFileSync(fil, await p.screenshot());
  console.log("bild", fil, JSON.stringify(f));
}
if (ark) {
  const cols = 3;
  const rader = Math.ceil(delar.length / cols);
  const sida = await ctx.newPage();
  const png = await sida.evaluate(
    async ({ delar, cols, rader, bw, bh }) => {
      const c = document.createElement("canvas");
      c.width = cols * bw;
      c.height = rader * bh;
      const g = c.getContext("2d");
      g.fillStyle = "#fff";
      g.fillRect(0, 0, c.width, c.height);
      for (const [i, d] of delar.entries()) {
        const im = new Image();
        await new Promise((r) => {
          im.onload = r;
          im.src = "data:image/png;base64," + d.b64;
        });
        const x = (i % cols) * bw;
        const y = Math.floor(i / cols) * bh;
        g.drawImage(im, x, y);
        g.fillStyle = "rgba(255,255,255,.88)";
        g.fillRect(x, y + bh - 24, bw, 24);
        g.fillStyle = "#000";
        g.font = "bold 15px sans-serif";
        g.fillText(d.f, x + 6, y + bh - 7);
      }
      return c.toDataURL("image/png").split(",")[1];
    },
    { delar, cols, rader, bw, bh: 470 },
  );
  const fil = path.join(ut, `${namn}-ark.png`);
  fs.writeFileSync(fil, Buffer.from(png, "base64"));
  console.log("ark", fil);
}
console.log("sidfel", JSON.stringify(fel));
await browser.close();
server.close();
