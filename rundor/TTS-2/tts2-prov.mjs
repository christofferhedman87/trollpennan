// TTS-2: rösterna blandas inte. Playwright 375x812, Audio.play och speechSynthesis spioneras (inget ljud spelas på riktigt).
//   1) Bengtssons uppdrag klaras: "Uppdrag klart!" och stjärnorna läses från filer (stjärnorna som mall i delar), inget
//      läses av telefonen, ingen fast text saknar fil, och varje banner står minst max(2,4 s, lästid, replikens ms + 1,5 s).
//   2) Ett djur väcks ("en kanin"): pratbubblan läses från filer. 3) Barnets eget påhittade ord: bara det ordet läses med
//      telefonens svenska röst, resten från filer; 4) med bara en engelsk röst läses den meningen inte alls (tyst).
//   5) Gåtan i boken läses från fil. 6) Ljudet av: ingenting. Inga sidfel.
//   node --experimental-strip-types rundor/TTS-2/tts2-prov.mjs [--bilder <mapp>]   (exit 0 = gröna; kräver build:pages)
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { rostPlan } from "../../src/spel/rostManifest.ts";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const dist = path.resolve(arg("dist", "dist-pages"));
const bilder = arg("bilder", "");
if (bilder) fs.mkdirSync(bilder, { recursive: true });
const B = JSON.parse(fs.readFileSync("data/bengtsson.json", "utf8")).uppdrag;
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
  console.error(`${ok ? "ok  " : "FEL "} ${namn}${ok ? "" : " " + JSON.stringify(info).slice(0, 600)}`);
};
const fel = [];
const PLATSER = ["skogen", "sjon", "grottan"];
const BAS = { version: 2, introSedd: true, dragit: true, ang: [], garden: [], stjarnor: 0, oppnadePlatser: PLATSER, seddaIntro: [...PLATSER, "garden", "gard"], platsSkapelser: {} };

async function sida(spar, rost = "sv-SE") {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE" });
  await ctx.addInitScript((lang) => {
    window.__spelat = [];
    window.__talat = [];
    window.__bannrar = [];
    HTMLMediaElement.prototype.play = function () {
      window.__spelat.push(new URL(this.src, location.href).pathname);
      setTimeout(() => this.dispatchEvent(new Event("ended")), 200);
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () {};
    const roster = [{ lang, name: lang === "sv-SE" ? "Alva" : "Samantha", voiceURI: "x", default: true, localService: true }];
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        getVoices: () => roster,
        speak: (u) => {
          window.__talat.push({ text: u.text, lang: u.lang, rost: u.voice?.lang ?? null });
          setTimeout(() => u.onend?.(new Event("end")), 150);
        },
        cancel: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      },
      configurable: true,
    });
    window.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text;
        this.lang = "";
        this.voice = null;
        this.onend = null;
      }
    };
    // bannrarnas livstid: när varje text syns och försvinner
    const syns = new Map();
    setInterval(() => {
      const nu = new Set([...document.querySelectorAll("[data-testid=puff]")].map((e) => e.textContent?.trim() ?? ""));
      for (const t of nu) if (!syns.has(t)) syns.set(t, performance.now());
      for (const [t, s] of syns) if (!nu.has(t)) {
        window.__bannrar.push({ text: t, ms: Math.round(performance.now() - s) });
        syns.delete(t);
      }
    }, 50);
  }, rost);
  await ctx.addInitScript((s) => {
    if (!sessionStorage.getItem("f")) {
      localStorage.setItem("trollpennan-v2", JSON.stringify(s));
      sessionStorage.setItem("f", "1");
    }
  }, spar);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => fel.push(String(e).slice(0, 300)));
  p.setDefaultTimeout(20000);
  await p.goto(URL0, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__troll, null, { timeout: 30000 });
  await p.waitForTimeout(1500);
  return { ctx, p };
}
const las = (p) => p.evaluate(() => ({ rost: window.__rost ?? [], talat: window.__talat, spelat: window.__spelat, bannrar: window.__bannrar }));
const DUMP = process.env.TTS2_DUMP;

// 1) uppdrag klart: filer, mallar, inga telefonröster, bannrarnas tid
{
  const { ctx, p } = await sida({ ...BAS, ljudPa: true });
  await p.click("[data-testid=bengtsson-ikon], [data-testid=npc-figur]");
  await p.waitForSelector("[data-testid=uppdrag-remsa]");
  const id = await p.getAttribute("[data-testid=uppdrag-remsa]", "data-uppdrag");
  const u = B.find((x) => x.id === id);
  const fras = u?.val?.grupper?.[0]?.forslag?.[0]?.fras ?? `en kanin med ${u?.krav?.ord?.[0] ?? "mössa"}`;
  await p.evaluate((f) => window.__troll.vakna(f), fras);
  // bannrarna står nu lästiden/repliken: vänta tills stjärnorna har lästs och alla bannrar är borta
  await p.waitForFunction(() => (window.__rost ?? []).some((r) => /^\+\d+ stjärn/.test(r.text)), null, { timeout: 60000 }).catch(() => {});
  await p.waitForFunction(() => document.querySelectorAll("[data-testid=puff]").length === 0, null, { timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(500);
  const L = await las(p);
  if (DUMP) console.error(JSON.stringify(L, null, 1));
  const klart = L.rost.find((r) => r.text === "Uppdrag klart!");
  kolla("'Uppdrag klart!' läses från fil", klart?.satt === "fil" && L.spelat.includes(klart.fil), { klart });
  const stj = L.rost.find((r) => /^\+\d+ stjärn/.test(r.text));
  kolla("stjärnorna läses från filer (mallen '+{n} stjärnor!' i delar)", !!stj && (stj.satt === "mall" || stj.satt === "fil") && !stj.dynamisk, { stj });
  kolla("ingen fast text saknar fil och ingen reserv", !L.rost.some((r) => r.satt === "saknas" || r.satt === "reserv"), { rost: L.rost.filter((r) => r.satt !== "fil" && r.satt !== "mall") });
  kolla("telefonen läser inget när allt har fil", L.talat.length === 0, { talat: L.talat });
  const kort = L.bannrar.filter((b) => {
    const pl = rostPlan(b.text);
    const lt = Math.min(12000, 1200 + 60 * b.text.length);
    return b.ms + 250 < Math.max(2400, lt, pl ? pl.ms + 1500 : 0);
  });
  kolla("varje banner står minst max(2,4 s, lästid, replikens ms + 1,5 s)", L.bannrar.length > 0 && kort.length === 0, { kort, bannrar: L.bannrar });
  if (bilder) await p.screenshot({ path: path.join(bilder, "tts2-klart.png") });
  await ctx.close();
}
// 2) ett djur väcks: pratbubblan läses från filer. 5) gåtan i boken läses från fil.
{
  const { ctx, p } = await sida({ ...BAS, ljudPa: true });
  await p.evaluate(() => window.__troll.vakna("en kanin"));
  await p.waitForTimeout(6000);
  let L = await las(p);
  if (DUMP) console.error(JSON.stringify(L, null, 1));
  const kanin = L.rost.filter((r) => /kanin/i.test(r.text));
  kolla("'en kanin': det som visas läses från filer (inget dynamiskt)", kanin.length > 0 && kanin.every((r) => (r.satt === "fil" || r.satt === "mall") && !r.dynamisk), { kanin });
  await p.click("[data-testid=pennans-bok]");
  await p.waitForSelector("[data-testid=ledtrad-gata]");
  await p.waitForTimeout(2500);
  const gata = (await p.innerText("[data-testid=ledtrad-gata]")).trim();
  L = await las(p);
  const g = L.rost.find((r) => r.text === gata);
  kolla("gåtan i boken läses från fil", g?.satt === "fil" && L.spelat.includes(g.fil), { gata, g });
  kolla("telefonen läste inget (kanin, gåta)", L.talat.length === 0, { talat: L.talat });
  if (bilder) await p.screenshot({ path: path.join(bilder, "tts2-gata.png") });
  await ctx.close();
}
// 3–4) barnets eget påhittade ord: bara ordet med telefonens svenska röst; med bara engelsk röst läses meningen inte
for (const rost of ["sv-SE", "en-US"]) {
  const { ctx, p } = await sida({ ...BAS, ljudPa: true }, rost);
  await p.evaluate(() => window.__troll.vakna("en zorbleflax"));
  await p.waitForTimeout(6000);
  const L = await las(p);
  if (DUMP) console.error(rost, JSON.stringify(L, null, 1));
  const dyn = L.rost.filter((r) => /zorbleflax/i.test(r.text));
  if (rost === "sv-SE") {
    kolla("eget ord: meningen spelas som mall med filer + det egna ordet dynamiskt", dyn.length > 0 && dyn.every((r) => r.satt === "mall" && r.dynamisk && r.fil), { dyn });
    kolla("eget ord: telefonen läser bara det egna ordet, på svenska", L.talat.length > 0 && L.talat.every((t) => /zorbleflax/i.test(t.text) && t.text.split(" ").length <= 3 && t.lang === "sv-SE" && t.rost === "sv-SE"), { talat: L.talat });
  } else {
    kolla("bara engelsk röst: meningen med det egna ordet läses inte (tyst)", dyn.length > 0 && dyn.every((r) => r.satt === "tyst") && L.talat.length === 0, { dyn, talat: L.talat });
  }
  kolla(`ingen fast text saknar fil (${rost})`, !L.rost.some((r) => r.satt === "saknas" || r.satt === "reserv"), { rost: L.rost.filter((r) => r.satt === "saknas" || r.satt === "reserv") });
  await ctx.close();
}
// 6) ljudet av
{
  const { ctx, p } = await sida({ ...BAS, ljudPa: false });
  await p.evaluate(() => window.__troll.vakna("en kanin"));
  await p.waitForTimeout(4000);
  const L = await las(p);
  kolla("ljudet av: ingenting läses", !L.spelat.some((s) => s.startsWith("/ljud/rost/")) && L.talat.length === 0 && L.rost.length === 0, { L });
  const fel2 = L.bannrar.filter((b) => Math.abs(b.ms - Math.max(2400, Math.min(12000, 1200 + 60 * b.text.length))) > 350);
  kolla("ljudet av: bannrarna står lästiden (inte röstens)", fel2.length === 0, { fel2, bannrar: L.bannrar });
  await ctx.close();
}
await browser.close();
server.close();
kolla("inga sidfel", fel.length === 0, { fel });
console.log(JSON.stringify({ ok: steg.every((s) => s.ok), steg }, null, 1));
process.exit(steg.every((s) => s.ok) ? 0 : 1);
