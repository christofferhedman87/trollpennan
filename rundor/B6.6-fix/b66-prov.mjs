// B6.6: "skapad men osynlig" – varje tillgång med modell (entiteter.json) läggs på ängen, tio åt gången, och mäts på skärmen
// (window.__tredSyn: skärmrutan för modellens yta, antal synliga meshar). Playwright 375x812.
// P3a (Arkitekten 18:59): kraven skrivna om till placeringsregeln. Tio på en gång ryms inte alla vakna på ängen:
//   - ingen modell är osynlig: var och en har en synlig mesh (vaken eller i stallet), och de vakna en rimlig storlek;
//   - de vakna (window.__tredPos stall = false) syns till minst 80 % (de tre nyaste) eller 65 % (äldre) av sin ritade
//     ruta, med 0,1 mätmarginal som P3 (modellens form mot rutan): ≥ 70 % resp. ≥ 55 %. Skymt (de framför, de
//     reserverade rutorna i data/placering.json) och utanför bilden räknas bort;
//   - de som inte fick plats står i stallet (stall = true) – där ritas de, men var spelar ingen roll.
//   node rundor/B6.6-fix/b66-prov.mjs [--bara kvast,teve] [--ut <json>] [--bilder <mapp> [--alltid]]   (exit 0 = alla syns)
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const dist = path.resolve(arg("dist", "dist-pages"));
const ut = arg("ut", "");
const bilder = arg("bilder", "");
if (bilder) fs.mkdirSync(bilder, { recursive: true });
const E = JSON.parse(fs.readFileSync("data/entiteter.json", "utf8")).entiteter;
const T = JSON.parse(fs.readFileSync("data/tillgangar.json", "utf8")).tillgangar;
const bara = arg("bara", "") ? arg("bara").split(",") : null;
const endastBygg = process.argv.includes("--endast-bygg");
const ids = endastBygg ? [] : Object.keys(E).filter((k) => E[k].modell && T[E[k].modell]?.fil && E[k].typ !== "tillbehor" && (!bara || bara.includes(k)));
// Gränser (CSS-px på 375×812): största mått ≥ 24 px, minsta ≥ 4 px, yta ≥ 200 px². Mitten i scenen (x 0–375, y 150–740).
// Stora saker (storlek.json zon "bak") står längst bak bredvid grinden; för dem räcker en fjärdedel av rutan i bild (se PLAN.md).
const MIN_STORST = 24, MIN_MINST = 4, MIN_YTA = 200;
const S = JSON.parse(fs.readFileSync("data/storlek.json", "utf8"));
const bak = (k) => { const id = S.ids?.[k] ?? S.kategori?.[E[k].kategori]; return E[k].typ !== "djur" && S.klasser?.[id]?.zon === "bak"; };
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let f = path.join(dist, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, "index.html");
  res.setHeader("Content-Type", mime[path.extname(f)] ?? "application/octet-stream");
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const URL0 = `http://127.0.0.1:${server.address().port}/`;
// Webbläsaren startas om var 20:e grupp och om den har stängts (swiftshader under hög last); en grupp prövas högst 3 gånger.
const starta = () => chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let browser = await starta();
const nyStart = async () => { await browser.close().catch(() => undefined); browser = await starta(); };
const fel = [];
const matt = {};
const sparad = (kropp, i) => ({ uid: `b66-${i}-${kropp}`, // i = plats i gruppen (0–9)
  kropp, formel: `en ${kropp}`, beskrivning: "", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [], skapad: 1000 + i });
const PLAC = fs.existsSync("data/placering.json") ? JSON.parse(fs.readFileSync("data/placering.json", "utf8")) : null;
const RESERV = (PLAC?.skarm_reserverat ?? []).map((r) => ({ x: r.x0, y: r.y0, w: r.x1 - r.x0, h: r.y1 - r.y0 }));
const [GRANS_NY, GRANS_ALDRE, NYA] = [0.8 - 0.1, 0.65 - 0.1, PLAC?.nya_antal ?? 3];
/** Täckt andel av b (rutnät 2 px, unionen): rutorna i `fram` och det som ligger utanför bilden. */
const tacktAv = (b, fram) => {
  let n = 0, t = 0;
  for (let y = b.y + 1; y < b.y + b.h; y += 2) for (let x = b.x + 1; x < b.x + b.w; x += 2) { n++; if (x < 0 || x > 375 || y < 0 || y > 812 || fram.some((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)) t++; }
  return n ? t / n : 1;
};
const pos = {};
const synlig = {}; // uid-index → syns-andel för de vakna
const varfor = (k, m) => {
  if (!m) return "ingen mätning";
  if (m.mesh === 0) return "ingen synlig mesh";
  if (pos[k]?.stall) return null; // i stallet: i spelet står den inte på ängen (minne.ts), modellen finns (mesh)
  if (Math.max(m.w, m.h) < MIN_STORST || Math.min(m.w, m.h) < MIN_MINST || m.w * m.h < MIN_YTA) return "för liten";
  if (!pos[k]) return "inget läge";
  if (!pos[k].stall && synlig[k] && synlig[k].syns < synlig[k].grans) return `vaken men syns bara ${Math.round(synlig[k].syns * 100)} % (< ${Math.round(synlig[k].grans * 100)} %)`;
  return null;
};
const alltid = process.argv.includes("--alltid");
for (let s = 0; s < ids.length; s += 10) {
  const grupp = ids.slice(s, s + 10);
  if (s > 0 && (s / 10) % 20 === 0) await nyStart();
  for (let forsok = 1; ; forsok++) {
    let ctx;
    const f0 = fel.length; // sidfel från ett avbrutet försök räknas inte
    try {
      ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE" });
      await ctx.addInitScript((ang) => {
        window.__tredSyn = {};
        localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, dragit: true, ang, garden: [], stjarnor: 0, oppnadePlatser: [], seddaIntro: ["garden", "gard"], platsSkapelser: {} }));
      }, grupp.map(sparad));
      const p = await ctx.newPage();
      p.on("pageerror", (e) => fel.push(`${grupp[0]}…: ${String(e).slice(0, 200)}`));
      await p.goto(URL0, { waitUntil: "domcontentloaded" });
      await p.waitForFunction(() => !!window.__troll, null, { timeout: 30000 }).catch(() => undefined);
      // Modellerna hämtas när de används; tills dess ritas procedurkroppen (Suspense). Vänta på att nätet är tyst
      // (alla .glb hämtade) och att alla har en mätning, sedan en stund till för att klonen ska skalas.
      await p.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => undefined);
      await p.waitForFunction((n) => Object.values(window.__tredSyn ?? {}).filter((v) => v.mesh > 0).length >= n, grupp.length, { timeout: 15000 }).catch(() => undefined);
      await p.waitForTimeout(1500);
      const { syn, tpos } = await p.evaluate(() => ({ syn: window.__tredSyn ?? {}, tpos: window.__tredPos ?? {} }));
      grupp.forEach((k, i) => { matt[k] = syn[`b66-${i}-${k}`] ?? null; pos[k] = tpos[`b66-${i}-${k}`] ?? null; });
      // de vakna: synlig andel mot sin gräns (de tre nyaste = högst i, skapad 1000 + i)
      const vakna = grupp.map((k, i) => ({ k, i })).filter(({ k }) => matt[k] && pos[k] && !pos[k].stall);
      for (const { k, i } of vakna) {
        const fram = [...RESERV, ...vakna.filter((o) => o.k !== k && pos[o.k].z > pos[k].z + 0.05).map((o) => matt[o.k])];
        synlig[k] = { syns: Math.round((1 - tacktAv(matt[k], fram)) * 100) / 100, grans: grupp.length - 1 - i < NYA ? GRANS_NY : GRANS_ALDRE };
      }
      if (bilder && (alltid || grupp.some((k) => varfor(k, matt[k])))) await p.screenshot({ path: path.join(bilder, `b66-${grupp[0]}.png`) }).catch(() => undefined);
      await ctx.close();
      break;
    } catch (e) {
      await ctx?.close().catch(() => undefined);
      fel.length = f0;
      if (forsok >= 3) throw e;
      console.error(`… ${grupp[0]}: ${String(e).split("\n")[0].slice(0, 120)} – försök ${forsok + 1}`);
      if (!browser.isConnected()) await nyStart();
    }
  }
  if ((s / 10) % 10 === 0) console.error(`… ${s + grupp.length}/${ids.length}`);
}
// BYGG (Doodle 08:26): byggnaderna längst bak och spridda, slottet större än sjukhuset, ingen framför grinden,
// cirkustältet skymmer inte växthuset. Lägen ur window.__tredPos (världen), storlek ur window.__tredSyn (skärmen).
const bygg = [];
if (!bara) {
  const FOT = JSON.parse(fs.readFileSync("data/fotavtryck.json", "utf8")).halvbredd;
  const lag = ["slott", "sjukhus", "cirkus", "vaxthus", "hus", "skola", "kyrka", "ko", "katt"];
  for (const [v, ordn] of [lag, [...lag].reverse()].entries()) {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE" });
    await ctx.addInitScript((ang) => {
      window.__tredSyn = {};
      localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, dragit: true, ang, garden: [], stjarnor: 0, oppnadePlatser: [], seddaIntro: ["garden", "gard"], platsSkapelser: {} }));
    }, ordn.map((k, i) => ({ ...sparad(k, i), uid: `bygg${v}-${k}` })));
    const p = await ctx.newPage();
    p.on("pageerror", (e) => fel.push(`bygg: ${String(e).slice(0, 200)}`));
    await p.goto(URL0, { waitUntil: "domcontentloaded" });
    await p.waitForFunction(() => !!window.__troll, null, { timeout: 30000 }).catch(() => undefined);
    await p.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => undefined);
    await p.waitForFunction((n) => Object.values(window.__tredSyn ?? {}).filter((x) => x.mesh > 0).length >= n, ordn.length, { timeout: 15000 }).catch(() => undefined);
    await p.waitForTimeout(1500);
    const { syn, pos } = await p.evaluate(() => ({ syn: window.__tredSyn ?? {}, pos: window.__tredPos ?? {} }));
    const m = Object.fromEntries(ordn.map((k) => [k, { ...syn[`bygg${v}-${k}`], ...pos[`bygg${v}-${k}`] }]));
    const kolla = (namn, ok, info) => bygg.push({ namn: `BYGG${v + 1} ${namn}`, ok: !!ok, ...info });
    // P3a: byggnaderna har rollen "bak" (storlek.json zon bak) och står i det bakre bandet; de som inte får plats står i
    // stallet. Grinden är en reserverad världsruta. Slottet mot sjukhuset provas i p3-prov F.
    const hus = ordn.filter((k) => !["ko", "katt"].includes(k));
    const vakenHus = hus.filter((k) => m[k].z !== undefined && !m[k].stall);
    const bakBand = PLAC?.platser?.ang?.band?.bak?.z ?? [-99, 99];
    kolla("vakna byggnader står i det bakre bandet (data/placering.json)", vakenHus.length >= 1 && vakenHus.every((k) => m[k].z >= bakBand[0] - 0.01 && m[k].z <= bakBand[1] + 0.01), { vakna: Object.fromEntries(vakenHus.map((k) => [k, m[k].z])), stall: hus.filter((k) => m[k].stall) });
    const grind = PLAC?.platser?.ang?.varld_reserverat?.find((g) => g.namn === "grinden") ?? { x: [-1.2, -0.2], z: [-99, 99] };
    // P3a torr 6: bredden i x är den ritade lådans (window.__tredSyn b = världslådan min/max), inte fotavtrycket.
    // Fotavtrycket är den största halva utbredningen: kyrkan 0,71 (djupet) mot 0,425 i x, så kyrkan på x 0,5 räknades
    // in i grinden (x −1,4…0) fast den ritas från x 0,075. Utan lådan: fotavtrycket som förut.
    const iGrind = (k) => {
      const b = m[k].b;
      const [x0, x1] = b ? [b[0] + 0.05, b[3] - 0.05] : [m[k].x - (FOT[k] * (m[k].k ?? 1) - 0.05), m[k].x + (FOT[k] * (m[k].k ?? 1) - 0.05)];
      return x1 > grind.x[0] && x0 < grind.x[1] && m[k].z > grind.z[0] && m[k].z < grind.z[1];
    };
    kolla("ingen byggnad framför grinden (grindens världsruta i data/placering.json, den ritade lådans bredd i x)", vakenHus.every((k) => !iGrind(k)), { x: Object.fromEntries(vakenHus.map((k) => [k, [m[k].x, m[k].z, m[k].k ?? 1]])) });
    const over = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    const [c, vx] = [m.cirkus, m.vaxthus];
    const skymt = !c.stall && !vx.stall && c.z > vx.z ? over({ x: c.x, y: c.y, w: c.w, h: c.h }, vx) / Math.max(1, vx.w * vx.h) : 0;
    kolla("cirkustältet skymmer inte växthuset (står båda vakna och tältet framför, täcker det högst 30 % av växthusets ruta)", skymt <= 0.3, { skymt: Math.round(skymt * 100) / 100, cirkus: { z: c.z, stall: !!c.stall }, vaxthus: { z: vx.z, stall: !!vx.stall } });
    kolla("ingen modell är osynlig (synlig mesh, vaken eller i stallet)", ordn.every((k) => (m[k].mesh ?? 0) > 0), { mesh: Object.fromEntries(ordn.map((k) => [k, m[k].mesh ?? 0])) });
    if (bilder) await p.screenshot({ path: path.join(bilder, `b66-BYGG${v + 1}.png`) }).catch(() => undefined);
    await ctx.close();
  }
  for (const b of bygg) console.error(`${b.ok ? "ok  " : "FEL "} ${b.namn}`);
}
const osynliga = Object.entries(matt).map(([k, m]) => ({ id: k, modell: E[k].modell, varfor: varfor(k, m), stall: !!pos[k]?.stall, ...(synlig[k] ?? {}), ...(m ?? {}) })).filter((o) => o.varfor);
const iStallet = Object.keys(matt).filter((k) => pos[k]?.stall).length;
const res = { antal: ids.length, matta: Object.values(matt).filter(Boolean).length, vakna: ids.length - iStallet, iStallet, osynliga, bygg, fel: fel.slice(0, 10) };
if (ut) fs.writeFileSync(ut, JSON.stringify({ ...res, matt }, null, 1));
console.log(JSON.stringify(res, null, 1));
await browser.close();
server.close();
process.exit(osynliga.length === 0 && fel.length === 0 && bygg.every((b) => b.ok) ? 0 : 1);
