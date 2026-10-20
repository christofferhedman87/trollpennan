// R8-3a2: kroppens färg och mönster på GLB-modeller (rundor/R8-3a2-farg/RITNING.md). Playwright 375x812, swiftshader.
//   node rundor/R8-3a2-farg/r83a2-prov.mjs [--dist dist-pages] [--bilder <mapp>] [--namn efter|fore] [--bara anka,elefant,...]
//   exit 0 = alla steg gröna. Faller på main (1640f90/27e175d): ankans mage grön, elefantens betar röda, vasen mörk,
//   regnbågskatten grå med en båge över, ränder/prickar syns inte på GLB-kroppar.
//   Mått i en ruta kring figuren (window.__tredMal): pixlar som ändrats mot den tomma ängen = figuren. Av figurens mättade
//   pixlar (s ≥ 0,35, 0,08 < l < 0,9) räknas andelen per nyans; gräddvita (betar) och grå pixlar räknas för sig.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const dist = path.resolve(arg("dist", "dist-pages"));
const bilder = arg("bilder", "");
const namn = arg("namn", "efter");
const bara = arg("bara", "") ? arg("bara", "").split(",") : null;
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
const kolla = (n, ok, info = {}) => { steg.push({ namn: n, ok: !!ok, ...info }); console.error(`${ok ? "ok  " : "FEL "} ${n} ${JSON.stringify(info).slice(0, 400)}`); };
const fel = [];

async function sida() {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE" });
  await ctx.addInitScript(() => { window.__tredFarg = []; window.__tredEffekter = {}; });
  await ctx.addInitScript((s) => {
    if (!sessionStorage.getItem("f")) { localStorage.setItem("trollpennan-v2", JSON.stringify(s)); sessionStorage.setItem("f", "1"); }
  }, { version: 2, introSedd: true, dragit: true, ang: [], garden: [], stjarnor: 0, oppnadePlatser: [], seddaIntro: ["garden", "gard"], platsSkapelser: {} });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => fel.push(String(e).slice(0, 300)));
  p.setDefaultTimeout(20000);
  await p.goto(URL0, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__troll, null, { timeout: 30000 });
  await p.waitForTimeout(2500);
  return { ctx, p };
}
async function malAv(p, uid) {
  for (let i = 0; i < 15; i++) { const m = await p.evaluate((u) => window.__tredMal?.[u] ?? null, uid); if (m) return m; await p.waitForTimeout(400); }
  return null;
}
/** Figurens pixlar (ändrade mot tomma ängen) i rutan: nyansfack (36 × 10°) för mättade, gräddvita, grå, mörka, totalt. */
/** `kropp` (nyans): räkna också gröna pixlar i kroppens nedre halva mot kroppens (se `inne`). */
async function figurMatt(p, fore, efter, r, kropp = null) {
  return p.evaluate(async ({ a, b, r, kropp }) => {
    const las = async (b64) => { const im = new Image(); im.src = "data:image/png;base64," + b64; await im.decode(); const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; const g = c.getContext("2d"); g.drawImage(im, 0, 0); return g.getImageData(r.x, r.y, r.w, r.h).data; };
    const A = await las(a), B = await las(b);
    const hsl = (i) => { const R = B[i] / 255, G = B[i + 1] / 255, Bl = B[i + 2] / 255, mx = Math.max(R, G, Bl), mn = Math.min(R, G, Bl), l = (mx + mn) / 2, d = mx - mn; const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)); let h = d === 0 ? 0 : mx === R ? ((G - Bl) / d) % 6 : mx === G ? (Bl - R) / d + 2 : (R - G) / d + 4; return [(h * 60 + 360) % 360, s, l]; };
    const andradPx = (i) => Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) >= 60;
    const fack = new Array(36).fill(0), lf = new Array(36).fill(0); let andrad = 0, mattad = 0, gradde = 0, gra = 0, mork = 0, lsum = 0;
    for (let i = 0; i < B.length; i += 4) {
      if (!andradPx(i)) continue;
      andrad++;
      const R = B[i] / 255, G = B[i + 1] / 255, Bl = B[i + 2] / 255, mx = Math.max(R, G, Bl), mn = Math.min(R, G, Bl), l = (mx + mn) / 2, d = mx - mn;
      lsum += l;
      const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
      let h = d === 0 ? 0 : mx === R ? ((G - Bl) / d) % 6 : mx === G ? (Bl - R) / d + 2 : (R - G) / d + 4; h = (h * 60 + 360) % 360;
      if (l < 0.12) { mork++; continue; }
      if (l > 0.72 && (s < 0.18 || (s < 0.55 && h >= 25 && h <= 70))) { gradde++; continue; }
      if (s < 0.2) { gra++; continue; }
      if (s >= 0.35 && l > 0.08 && l < 0.9) { mattad++; fack[Math.floor(h / 10) % 36]++; lf[Math.floor(h / 10) % 36] += l; }
    }
    // R8-3a2: ankans mage. Gröna pixlar (60–175°, mättnad ≥ 0,2 – magen är dämpat grön) som är NYA (ingen pixel i den tomma
    // ängen inom 3 px har nästan samma färg: kameran följer den nya skapelsen och flyttar ängen ett par pixlar), INRE (alla
    // grannar är kropp eller nya gröna, så kantpixlar där blått blandas med mörkgrönt räknas inte), nära kroppen (inom 6 px) och
    // i kroppens nedre halva (under medianraden av kroppens pixlar; tofsen på huvudet är en egen detalj). inne = { kropp, gron }.
    let inne = null;
    if (kropp !== null) {
      const typ = new Int8Array(r.w * r.h); // 1 = kroppens nyans, 2 = ny grön
      const rader = [];
      for (let i = 0; i < B.length; i += 4) {
        if (!andradPx(i)) continue;
        const [h, s, l] = hsl(i);
        if (s < 0.2 || l <= 0.08 || l >= 0.9) continue;
        const x = (i / 4) % r.w, y = Math.floor(i / 4 / r.w);
        if (s >= 0.35 && Math.min(Math.abs(h - kropp), 360 - Math.abs(h - kropp)) <= 25) { typ[i / 4] = 1; rader.push(y); continue; }
        if (h < 60 || h > 175) continue;
        let fanns = false;
        for (let dy = -3; dy <= 3 && !fanns; dy++) for (let dx = -3; dx <= 3 && !fanns; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= r.w || yy >= r.h) continue;
          const j = (yy * r.w + xx) * 4;
          fanns = Math.abs(A[j] - B[i]) + Math.abs(A[j + 1] - B[i + 1]) + Math.abs(A[j + 2] - B[i + 2]) < 45;
        }
        if (!fanns) typ[i / 4] = 2;
      }
      rader.sort((u, v) => u - v);
      const median = rader.length ? rader[Math.floor(rader.length / 2)] : 0;
      const t = (x, y) => (x < 0 || y < 0 || x >= r.w || y >= r.h ? 0 : typ[y * r.w + x]);
      inne = { kropp: rader.length, gron: 0 };
      for (let y = median; y < r.h; y++) for (let x = 0; x < r.w; x++) {
        if (t(x, y) !== 2) continue;
        let inre = true, nara = false;
        for (let dy = -1; dy <= 1 && inre; dy++) for (let dx = -1; dx <= 1 && inre; dx++) inre = t(x + dx, y + dy) !== 0;
        for (let dy = -6; dy <= 6 && inre && !nara; dy++) for (let dx = -6; dx <= 6 && !nara; dx++) nara = t(x + dx, y + dy) === 1;
        if (inre && nara) inne.gron++;
      }
    }
    return { andrad, mattad, gradde, gra, mork, lmedel: andrad ? +(lsum / andrad).toFixed(3) : 0, fack, lf, inne };
  }, { a: fore.toString("base64"), b: efter.toString("base64"), r, kropp });
}
const inom = (f, h, w = 25) => f.reduce((s, n, i) => { const c = i * 10 + 5; const dd = Math.min(Math.abs(c - h), 360 - Math.abs(c - h)); return s + (dd <= w ? n : 0); }, 0);
/** Medelljusheten för pixlarna inom ±w° från h. */
const ljusInom = (m, h, w = 25) => { const n = inom(m.fack, h, w); return n ? +(inom(m.lf, h, w) / n).toFixed(3) : 0; };
const mellan = (f, a, b) => f.reduce((s, n, i) => s + (i * 10 + 5 >= a && i * 10 + 5 <= b ? n : 0), 0);
const filnamn = (s) => s.replace(/^(en|ett) /, "").replace(/ /g, "-").replace(/[åä]/g, "a").replace(/ö/g, "o");

async function figur(fras, kropp = null) {
  const { ctx, p } = await sida();
  const fore = await p.screenshot({ animations: "disabled", timeout: 45000 });
  await p.evaluate((f) => window.__troll.vakna(f), fras);
  await p.waitForTimeout(3500);
  const s = await p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}"));
  const v = s.ang?.at(-1);
  const mal = v ? await malAv(p, v.uid) : null;
  await p.waitForTimeout(900);
  const rader = await p.evaluate((k) => (window.__tredFarg ?? []).filter((r) => r.kropp === k), v?.kropp);
  const effekter = await p.evaluate((u) => window.__tredEffekter?.[u] ?? null, v?.uid);
  const efter = await p.screenshot({ animations: "disabled", timeout: 45000 });
  const r = mal ? { x: Math.max(0, Math.round(mal.x) - 70), y: Math.max(0, Math.round(mal.y) - 60), w: 140, h: 160 } : { x: 0, y: 250, w: 375, h: 350 };
  r.w = Math.min(r.w, 375 - r.x); r.h = Math.min(r.h, 812 - r.y);
  const m = await figurMatt(p, fore, efter, r, kropp);
  if (bilder) {
    fs.writeFileSync(path.join(bilder, `r83a2-${namn}-${filnamn(fras)}.png`), efter);
    if (process.argv.includes("--tom")) fs.writeFileSync(path.join(bilder, `r83a2-${namn}-${filnamn(fras)}-tom.png`), fore);
    await p.screenshot({ path: path.join(bilder, `r83a2-${namn}-${filnamn(fras)}-nara.png`), clip: { x: r.x, y: r.y, width: r.w, height: r.h }, animations: "disabled" });
  }
  await ctx.close();
  return { v, rader, effekter, m };
}
const LJUS_VAS = 0.33;
const RB = [0, 30, 55, 120, 210, 285]; // regnbågens sex nyanser (#E53935 … #8E24AA)
const FALL = [
  {
    id: "anka", fras: "en blå anka", kropp: 210,
    krav: "magen blå som kroppen: gröna pixlar i kroppens nedre halva ≤ 3 % av kroppens blå, ≥ 300 blå pixlar",
    ok: ({ v, m }) => v?.kropp === "anka" && m.inne && m.inne.kropp >= 300 && m.inne.gron / m.inne.kropp <= 0.03,
    info: ({ m }) => ({ inne: m.inne, andel: m.inne ? +(m.inne.gron / Math.max(1, m.inne.kropp)).toFixed(3) : null }),
  },
  {
    id: "elefant", fras: "en röd elefant",
    krav: "kroppen röd och betarna gräddvita: ≥ 25 gräddvita pixlar, röd ≥ 60 % av mättade, kroppens mask < 100 % av texturen",
    ok: ({ v, m, rader }) => v?.kropp === "elefant" && m.gradde >= 25 && inom(m.fack, 2) / Math.max(1, m.mattad) >= 0.6 && rader.some((r) => r.roll === "kropp" && typeof r.mask === "number" && r.mask > 0 && r.mask < 0.98),
    info: ({ m, rader }) => ({ gradde: m.gradde, rod: +(inom(m.fack, 2) / Math.max(1, m.mattad)).toFixed(3), mask: rader.map((r) => r.mask) }),
  },
  {
    id: "vas", fras: "en blå vas",
    krav: "hörnfärgad modell inte mörkare: blå ≥ 60 % av mättade, ≥ 150 blå pixlar, de blås medelljushet ≥ LJUS_VAS (färgordets #1E88E5 är 0,51)",
    ok: ({ v, m, rader }) => v?.kropp === "vas" && inom(m.fack, 210) >= 150 && inom(m.fack, 210) / Math.max(1, m.mattad) >= 0.6 && ljusInom(m, 210) >= LJUS_VAS && rader.some((r) => r.horn),
    info: ({ m, rader }) => ({ bla: inom(m.fack, 210), andel: +(inom(m.fack, 210) / Math.max(1, m.mattad)).toFixed(3), ljus: ljusInom(m, 210), horn: rader.map((r) => !!r.horn) }),
  },
  {
    id: "regnbage", fras: "en regnbågsfärgad katt",
    krav: "kroppen randig i regnbågens färger: ≥ 5 av 6 nyanser med ≥ 20 px, grått ≤ 35 % av figuren, ingen båge över (effekten ersatt)",
    ok: ({ v, m, effekter, rader }) => v?.kropp === "katt" && RB.filter((h) => inom(m.fack, h, 12) >= 20).length >= 5 && m.gra / Math.max(1, m.andrad) <= 0.35 && Array.isArray(effekter) && !effekter.includes("regnbage") && rader.some((r) => r.monster === "band"),
    info: ({ m, effekter }) => ({ nyanser: RB.map((h) => inom(m.fack, h, 12)), gra: +(m.gra / Math.max(1, m.andrad)).toFixed(3), effekter }),
  },
  {
    id: "rander", fras: "en röd och blå randig katt",
    krav: "röd kropp med blå ränder: röd ≥ 25 % och blå ≥ 10 % av mättade",
    ok: ({ v, m }) => v?.kropp === "katt" && inom(m.fack, 2) / Math.max(1, m.mattad) >= 0.25 && inom(m.fack, 210) / Math.max(1, m.mattad) >= 0.1,
    info: ({ m }) => ({ rod: +(inom(m.fack, 2) / Math.max(1, m.mattad)).toFixed(3), bla: +(inom(m.fack, 210) / Math.max(1, m.mattad)).toFixed(3) }),
  },
  {
    id: "prickar", fras: "en gul och lila prickig hund",
    krav: "gul kropp med lila prickar: gul ≥ 25 % och lila ≥ 3 % av mättade",
    ok: ({ v, m }) => v?.kropp === "hund" && inom(m.fack, 52) / Math.max(1, m.mattad) >= 0.25 && inom(m.fack, 285) / Math.max(1, m.mattad) >= 0.03,
    info: ({ m }) => ({ gul: +(inom(m.fack, 52) / Math.max(1, m.mattad)).toFixed(3), lila: +(inom(m.fack, 285) / Math.max(1, m.mattad)).toFixed(3) }),
  },
  {
    id: "anka-utan", fras: "en anka",
    krav: "B6.4: utan färgord och mönster ändras inget material",
    ok: ({ v, rader }) => v?.kropp === "anka" && rader.length > 0 && rader.every((r) => r.efter === r.fore && r.egenKarta && r.sjalvlyse === "#000000"),
    info: ({ rader }) => ({ material: rader.length }),
  },
];
for (const f of FALL) {
  if (bara && !bara.includes(f.id)) continue;
  try {
    const res = await figur(f.fras, f.kropp ?? null);
    kolla(`${f.fras}: ${f.krav}`, f.ok(res), { kropp: res.v?.kropp, farg: res.v?.farg ?? null, monster: res.v?.monster ?? null, figur: res.m.andrad, mattad: res.m.mattad, ...f.info(res) });
  } catch (e) { kolla(`${f.fras} kraschade`, false, { fel: String(e).split("\n")[0] }); }
}
kolla("inga sidfel", fel.length === 0, { fel: fel.slice(0, 5) });
console.log(JSON.stringify(steg, null, 1));
await browser.close();
server.close();
process.exit(steg.every((s) => s.ok) ? 0 : 1);
