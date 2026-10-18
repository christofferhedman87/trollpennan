// R6A-3B: bevis (375x812) att skärmtangentbordet är standard svensk QWERTY ur data/tangentbord.json: fyra rader, varje rad fyller bredden,
// inga rader bryts, 'm' och mellanslag ligger rätt, alla tangenter ≥44 px höga, och en tryckning skriver tecknet (å/ä/ö, mellanslag, backsteg).
// Användning: node rundor/R6A-3-bara-bengtsson/tangent-prov.mjs --ut docs/skarmbilder/r6a3/efter/tangentbord.png [--dist dist-pages]  (kräver npm run build:pages). exit 0 = allt stämde.
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
await p.getByTestId("npc-figur").click();
const tb = p.getByTestId("tangentbord");
await tb.waitFor();
await p.waitForTimeout(600);
const rad = await tb.locator(".rad").evaluateAll((rs) => rs.map((r) => {
  const b = r.getBoundingClientRect();
  const ks = [...r.querySelectorAll("button")].map((k) => { const q = k.getBoundingClientRect(); return { t: k.textContent.trim(), x: Math.round(q.x), w: Math.round(q.width), h: Math.round(q.height), y: Math.round(q.y) }; });
  return { x: Math.round(b.x), w: Math.round(b.width), y: Math.round(b.y), ks };
}));
m.rader = rad.map((r) => r.ks.map((k) => k.t).join(" "));
m.radbredd = rad.map((r) => ({ rad: r.w, forsta_x: r.ks[0].x, sista_slut: r.ks.at(-1).x + r.ks.at(-1).w }));
m.en_rad_var = rad.every((r) => new Set(r.ks.map((k) => k.y)).size === 1);
m.fyller_bredden = rad.every((r) => Math.abs(r.ks[0].x - r.x) <= 1 && Math.abs(r.ks.at(-1).x + r.ks.at(-1).w - (r.x + r.w)) <= 1);
m.tangent_hojd_min = Math.min(...rad.flatMap((r) => r.ks.map((k) => k.h)));
m.tangent_bredd_min_bokstav = Math.min(...rad.flatMap((r) => r.ks.filter((k) => k.t.length === 1 && k.t !== "⌫").map((k) => k.w)));
m.radordning_ok = m.rader[0] === "q w e r t y u i o p å" && m.rader[1] === "a s d f g h j k l ö ä" && m.rader[2] === "z x c v b n m ⌫" && m.rader[3] === "mellanslag";
const las = async () => (await p.getByTestId("remsa").innerText()).trim();
for (const t of ["å", "ä", "ö"]) await tb.getByRole("button", { name: t, exact: true }).click();
await tb.getByTestId("mellanslag").click();
await tb.getByRole("button", { name: "m", exact: true }).click();
m.skrivet = await las();
await tb.getByTestId("radera").click();
m.efter_radera = await las();
await p.waitForTimeout(400);
await p.screenshot({ path: ut });
m.ok = m.radordning_ok && m.en_rad_var && m.fyller_bredden && m.tangent_hojd_min >= 44 && m.skrivet === "åäö m" && m.efter_radera === "åäö" && fel.length === 0;
m.fel = fel;
console.log(JSON.stringify(m, null, 1));
await browser.close();
server.close();
process.exit(m.ok ? 0 : 1);
