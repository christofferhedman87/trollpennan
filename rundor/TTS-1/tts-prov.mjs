// TTS-1: röstljudet i spelet. Playwright 375x812, Audio.play och speechSynthesis spioneras (inget ljud spelas på riktigt).
//   1) Introt spelar Trollpennans förgenererade fil (manifestets intro), inte saga.mp3, och bara den filen laddas vid start.
//   2) Spelet utan intro laddar ingen röstfil vid start (lat laddning).
//   3) Bengtssons uppdrag (huvudknappen) läses från rätt fil; klart-repliken likaså; "Uppdrag klart!" (ingen fil) går till
//      reserven med en påhittad sv-SE-röst. 4) Med bara en engelsk röst blir reserven tyst. 5) Ljudet av: ingenting läses. Inga sidfel.
//   node rundor/TTS-1/tts-prov.mjs [--bilder <mapp>]   (exit 0 = alla steg gröna; kräver npm run build:pages)
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const dist = path.resolve(arg("dist", "dist-pages"));
const bilder = arg("bilder", "");
if (bilder) fs.mkdirSync(bilder, { recursive: true });
const M = JSON.parse(fs.readFileSync("data/rost-manifest.json", "utf8"));
const B = JSON.parse(fs.readFileSync("data/bengtsson.json", "utf8")).uppdrag;
const nyckel = (t) => {
  const s = t.normalize("NFC").replace(/\s+/g, " ").trim();
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
};
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let f = path.join(dist, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, "index.html");
  res.setHeader("Content-Type", mime[path.extname(f)] ?? "application/octet-stream");
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const URL0 = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
const steg = [];
const kolla = (namn, ok, info = {}) => {
  steg.push({ namn, ok: !!ok, ...info });
  console.error(`${ok ? "ok  " : "FEL "} ${namn}${ok ? "" : " " + JSON.stringify(info).slice(0, 400)}`);
};
const fel = [];
const PLATSER = ["skogen", "sjon", "grottan"];
const BAS = { version: 2, introSedd: true, dragit: true, ang: [], garden: [], stjarnor: 0, oppnadePlatser: PLATSER, seddaIntro: [...PLATSER, "garden", "gard"], platsSkapelser: {} };

async function sida(spar, rost = "sv-SE") {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE" });
  await ctx.addInitScript((lang) => {
    window.__spelat = [];
    window.__talat = [];
    HTMLMediaElement.prototype.play = function () {
      window.__spelat.push(new URL(this.src, location.href).pathname);
      setTimeout(() => this.dispatchEvent(new Event("ended")), 250);
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () {};
    const roster = [{ lang, name: lang === "sv-SE" ? "Alva" : "Samantha", voiceURI: "x", default: true, localService: true }];
    const ss = {
      getVoices: () => roster,
      speak: (u) => {
        window.__talat.push({ text: u.text, lang: u.lang, rost: u.voice?.lang ?? null });
        setTimeout(() => u.onend?.(new Event("end")), 150);
      },
      cancel: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    Object.defineProperty(window, "speechSynthesis", { value: ss, configurable: true });
    window.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text;
        this.lang = "";
        this.voice = null;
        this.onend = null;
        this.onerror = null;
      }
    };
  }, rost);
  await ctx.addInitScript((s) => {
    if (!sessionStorage.getItem("f")) {
      localStorage.setItem("trollpennan-v2", JSON.stringify(s));
      sessionStorage.setItem("f", "1");
    }
  }, spar);
  const p = await ctx.newPage();
  const hamtat = [];
  p.on("request", (r) => {
    const u = new URL(r.url()).pathname;
    if (u.startsWith("/ljud/rost/") || u.includes("/ljud/intro/")) hamtat.push(u);
  });
  p.on("pageerror", (e) => fel.push(String(e).slice(0, 300)));
  p.setDefaultTimeout(20000);
  await p.goto(URL0, { waitUntil: "domcontentloaded" });
  return { ctx, p, hamtat };
}
const vanta = (p) => p.waitForFunction(() => !!window.__troll, null, { timeout: 30000 });

// 1) introt
{
  const { ctx, p, hamtat } = await sida({ ...BAS, introSedd: false, ljudPa: true });
  await p.waitForSelector("[data-testid=intro]", { timeout: 30000 });
  await p.waitForTimeout(3500);
  const spelat = await p.evaluate(() => window.__spelat);
  const text = await p.textContent("[data-testid=intro-text]");
  kolla("introt spelar Trollpennans förgenererade fil", spelat.includes(M.intro.f), { spelat, vantat: M.intro.f });
  kolla("introt spelar inte saga.mp3", !spelat.some((s) => s.includes("saga.mp3")), { spelat });
  kolla("vid start laddas bara introts röstfil", hamtat.every((u) => u === M.intro.f), { hamtat });
  kolla("introts text visas", !!text?.trim(), { text });
  if (bilder) await p.screenshot({ path: path.join(bilder, "tts-intro.png") });
  await ctx.close();
}
// 2–3) Bengtsson
{
  const { ctx, p, hamtat } = await sida({ ...BAS, ljudPa: true });
  await vanta(p);
  await p.waitForTimeout(3000);
  kolla("utan intro laddas ingen röstfil vid start (lat)", hamtat.length === 0, { hamtat });
  await p.click("[data-testid=bengtsson-ikon], [data-testid=npc-figur]");
  await p.waitForSelector("[data-testid=uppdrag-remsa]");
  const id = await p.getAttribute("[data-testid=uppdrag-remsa]", "data-uppdrag");
  const u = B.find((x) => x.id === id);
  const start = u?.text_bengtsson ?? u?.text;
  const fil = start ? M.rader[nyckel(start)]?.f : null;
  await p.waitForTimeout(800);
  let spelat = await p.evaluate(() => window.__spelat);
  kolla("Bengtssons uppdrag läses från rätt fil", !!fil && spelat.includes(fil), { id, fil, spelat });
  kolla("bara den filen har laddats", hamtat.every((h) => h === fil), { hamtat });
  if (bilder) await p.screenshot({ path: path.join(bilder, "tts-uppdrag.png") });
  const fras = u?.val?.grupper?.[0]?.forslag?.[0]?.fras ?? `en kanin med ${u?.krav?.ord?.[0] ?? "mössa"}`;
  await p.evaluate((f) => window.__troll.vakna(f), fras);
  await p.waitForTimeout(6000);
  spelat = await p.evaluate(() => window.__spelat);
  const talat = await p.evaluate(() => window.__talat);
  const klart = u?.klart_bengtsson ?? u?.klart;
  const kfil = klart ? M.rader[nyckel(klart)]?.f : null;
  kolla("klart-repliken läses från rätt fil", !!kfil && spelat.includes(kfil), { fras, kfil, spelat });
  kolla("text utan fil går till reserven med svensk röst", talat.length > 0 && talat.every((t) => t.lang === "sv-SE" && t.rost === "sv-SE"), { talat });
  kolla("reserven läser inte en text som har fil", !talat.some((t) => M.rader[nyckel(t.text)]), { talat });
  await ctx.close();
}
// 4) bara engelsk röst → tyst
{
  const { ctx, p } = await sida({ ...BAS, ljudPa: true }, "en-US");
  await vanta(p);
  await p.waitForTimeout(2000);
  await p.click("[data-testid=bengtsson-ikon], [data-testid=npc-figur]");
  await p.waitForSelector("[data-testid=uppdrag-remsa]");
  const id = await p.getAttribute("[data-testid=uppdrag-remsa]", "data-uppdrag");
  const u = B.find((x) => x.id === id);
  const fras = u?.val?.grupper?.[0]?.forslag?.[0]?.fras ?? `en kanin med ${u?.krav?.ord?.[0] ?? "mössa"}`;
  await p.evaluate((f) => window.__troll.vakna(f), fras);
  await p.waitForTimeout(6000);
  const talat = await p.evaluate(() => window.__talat);
  kolla("bara engelsk röst: reserven är tyst", talat.length === 0, { talat });
  await ctx.close();
}
// 5) ljudet av
{
  const { ctx, p, hamtat } = await sida({ ...BAS, ljudPa: false });
  await vanta(p);
  await p.waitForTimeout(2000);
  await p.click("[data-testid=bengtsson-ikon], [data-testid=npc-figur]");
  await p.waitForSelector("[data-testid=uppdrag-remsa]");
  await p.waitForTimeout(1500);
  const spelat = await p.evaluate(() => window.__spelat);
  const talat = await p.evaluate(() => window.__talat);
  kolla("ljudet av: ingenting läses eller laddas", spelat.length === 0 && talat.length === 0 && hamtat.length === 0, { spelat, talat, hamtat });
  await ctx.close();
}
kolla("inga sidfel", fel.length === 0, { fel });
await browser.close();
server.close();
console.log(JSON.stringify({ ok: steg.every((s) => s.ok), steg }, null, 1));
process.exit(steg.every((s) => s.ok) ? 0 : 1);
