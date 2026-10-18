// Bevis för R2: ett kontaktark per tillbehör med alla djurtyper, 375×812-skärm, spelad build (dist-pages).
// Användning: node rundor/R2-tillbehor-som-data/ark-tillbehor.mjs --ut docs/skarmbilder/r2/efter [--tillbehor krona,mantel] [--djur kanin,katt] [--dist dist-pages] [--hel]
//   --hel sparar även varje hel 375×812-bild (ut/hela/<tillbehor>-<djur>.png). Förutsätter `npm run build:pages` och Playwright med Chromium.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const ut = path.resolve(arg("ut", "docs/skarmbilder/r2/efter"));
const dist = path.resolve(arg("dist", "dist-pages"));
const TILLBEHOR = (arg("tillbehor", "krona,glasögon,hatt,rosett,halsduk,ryggsäck,mantel,horn")).split(",");
const DJUR = (arg("djur", "kanin,katt,hund,fisk,fågel,uggla,groda,drake,häst,gris,dinosaurie,ekorre,bäver,haj")).split(",");
const hel = process.argv.includes("--hel");
fs.mkdirSync(ut, { recursive: true });
if (hel) fs.mkdirSync(path.join(ut, "hela"), { recursive: true });

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
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, deviceScaleFactor: 1, locale: "sv-SE" });
await ctx.addInitScript(() => {
  if (!sessionStorage.getItem("f")) {
    localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true }));
    sessionStorage.setItem("f", "1");
  }
});
const p = await ctx.newPage();
p.setDefaultTimeout(10000);
const BOX = { x: 40, y: 255, b: 300, h: 325 };
let laddad = false;
const klipp = async (t, d) => {
  if (!laddad) {
    await p.goto(url, { waitUntil: "domcontentloaded" });
    await p.waitForFunction(() => !!window.__troll, null, { timeout: 20000 });
    await p.waitForTimeout(900);
    laddad = true;
  }
  // En sidladdning för hela körningen; aterstall() tömmer ängen mellan rutorna (≈ 5 s per ruta i stället för ≈ 30 s).
  await p.evaluate(() => window.__troll.aterstall());
  await p.waitForTimeout(500);
  await p.evaluate((x) => window.__troll.vakna(x), `en ${d} med ${t}`);
  await p.waitForTimeout(3800);
  // Nya djur föds alltid på samma ställe på ängen och vandrar bara någon decimeter: fast beskärning (x 40–340, y 255–580) under pratbubblorna.
  const buf = await p.screenshot({ clip: { x: BOX.x, y: BOX.y, width: BOX.b, height: BOX.h } });
  if (hel) fs.writeFileSync(path.join(ut, "hela", `${t}-${d}.png`), await p.screenshot());
  return buf.toString("base64");
};
const ark = await ctx.newPage();
let n = 0;
for (const t of TILLBEHOR) {
  const bilder = [];
  for (const d of DJUR) bilder.push({ d, b64: await klipp(t, d) });
  const cols = 4;
  const rader = Math.ceil(bilder.length / cols);
  const png = await ark.evaluate(
    async ({ bilder, cols, rader, bw, bh, t }) => {
      const c = document.createElement("canvas");
      c.width = cols * bw;
      c.height = rader * bh;
      const g = c.getContext("2d");
      g.fillStyle = "#fff";
      g.fillRect(0, 0, c.width, c.height);
      for (const [i, b] of bilder.entries()) {
        const im = new Image();
        await new Promise((r) => {
          im.onload = r;
          im.src = "data:image/png;base64," + b.b64;
        });
        const x = (i % cols) * bw;
        const y = Math.floor(i / cols) * bh;
        g.drawImage(im, x, y);
        g.fillStyle = "rgba(255,255,255,.85)";
        g.fillRect(x, y, 150, 20);
        g.fillStyle = "#000";
        g.font = "bold 15px sans-serif";
        g.fillText(`${t} · ${b.d}`, x + 4, y + 15);
      }
      return c.toDataURL("image/png").split(",")[1];
    },
    { bilder, cols, rader, bw: BOX.b, bh: BOX.h, t },
  );
  n += 1;
  const fil = path.join(ut, `${String(n).padStart(2, "0")}-${t}.png`);
  fs.writeFileSync(fil, Buffer.from(png, "base64"));
  console.log("ark", fil);
}
await browser.close();
server.close();
