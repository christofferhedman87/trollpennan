// B6.3: dammens vatten syns med 7+ saker (D), uppmaningen står ≥ 5 s eller tills barnet trycker (H), inga djur/saker i dammen (I),
//   stora saker spridda bak, grinden syns (J). Playwright 375x812.
//   node rundor/B6.3-fix/b63-prov.mjs --bilder <mapp>   (exit 0 = alla steg gröna; kräver npm run build:pages)
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const dist = path.resolve(arg("dist", "dist-pages"));
const bilder = arg("bilder", "");
const bara = arg("bara", "D,H,I").split(",");
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
const kolla = (namn, ok, info = {}) => { steg.push({ namn, ok: !!ok, ...info }); console.error(`${ok ? "ok  " : "FEL "} ${namn}`); };
const fel = [];
const PLATSER = ["skogen", "sjon", "grottan"];
// TTS-3-fix2: varje sida stängs när blocket är klart, också när det kraschar (förut läckte en sida som fortsatte rendera)
const oppna = new Set();
async function sida(spar) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE" });
  oppna.add(ctx);
  await ctx.addInitScript((s) => {
    if (!sessionStorage.getItem("f")) { localStorage.setItem("trollpennan-v2", JSON.stringify(s)); sessionStorage.setItem("f", "1"); }
  }, { version: 2, introSedd: true, dragit: true, ang: [], garden: [], stjarnor: 0, oppnadePlatser: PLATSER, seddaIntro: [...PLATSER, "garden", "gard"], platsSkapelser: {}, ...spar });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => fel.push(String(e).slice(0, 300)));
  p.setDefaultTimeout(20000);
  await p.goto(URL0, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__troll, null, { timeout: 30000 });
  await p.waitForTimeout(2500);
  return { ctx, p };
}
const DOODLE_0826 = ["ett bowlingklot", "ett akvarium", "en spjälsäng", "ett påskägg", "en vattenpistol", "en filt", "en fiol", "ett mikroskop", "ett trumset", "en ko"];
async function blok(id, fn) {
  if (!bara.includes(id[0])) return;
  try { await fn(); } catch (e) { kolla(`block ${id} kraschade`, false, { fel: String(e).split("\n")[0], diagnos: e.diagnos }); }
  finally { for (const c of oppna) await c.close().catch(() => undefined); oppna.clear(); }
}
/** TTS-3-fix2: skärmbild med 45 s (som bild()) och diagnos om den ändå inte kommer: svarar sidans huvudtråd, är den synlig,
 *  hur många bildrutor (requestAnimationFrame) hinns på 1 s. Doodle 21:40/22:01: page.screenshot 20 s vid D2 frö 3. */
async function skarm(p) {
  const t0 = Date.now();
  try {
    return await p.screenshot({ timeout: 45000 });
  } catch (e) {
    const diag = await Promise.race([
      p.evaluate(() => new Promise((r) => { let n = 0; const s = performance.now(); const f = () => (++n, performance.now() - s < 1000 ? requestAnimationFrame(f) : r({ svarar: true, synlig: document.visibilityState, raf_per_s: n, ljud: [...document.querySelectorAll("audio")].length })); requestAnimationFrame(f); setTimeout(() => r({ svarar: true, synlig: document.visibilityState, raf_per_s: n, raf_stannat: true }), 3000); })),
      new Promise((r) => setTimeout(() => r({ svarar: false }), 8000)),
    ]).catch((x) => ({ fel: String(x).slice(0, 120) }));
    e.diagnos = { efter_ms: Date.now() - t0, ...diag };
    console.error(`skärmbilden kom inte: ${JSON.stringify(e.diagnos)}`);
    throw e;
  }
}
const bild = async (p, n) => bilder && p.screenshot({ path: path.join(bilder, n), animations: "disabled", timeout: 45000 }).catch(() => undefined);
const synlig = (p, s) => p.locator(s).first().isVisible().catch(() => false);
async function stangBok(p) { if (await synlig(p, "[data-testid=stang-bok]")) { await p.click("[data-testid=stang-bok]"); await p.waitForTimeout(400); } }


/** Hur många av dammens fem provpunkter (window.__tred.damm) som är vattenblå i en skärmbild. */
async function blaPunkter(p) {
  const pts = await p.evaluate(() => window.__tred?.damm ?? []);
  const png = (await skarm(p)).toString("base64");
  return p.evaluate(async ({ png, pts }) => {
    const im = new Image();
    im.src = `data:image/png;base64,${png}`;
    await im.decode();
    const c = document.createElement("canvas");
    c.width = im.width;
    c.height = im.height;
    const g = c.getContext("2d");
    g.drawImage(im, 0, 0);
    const mask = pts.map((q) => {
      const [R, G, B] = g.getImageData(q.x, q.y, 1, 1).data;
      return B > 170 && B > R + 40 && B > G - 10;
    });
    return { n: mask.filter(Boolean).length, av: pts.length, mask };
  }, { png, pts });
}

// D + J: dammens vatten syns alltid, också med åtta stora saker på ängen (de står bak, bakom dammen).
// Robust (B6.3, omgjort): ett djupfel (marken svajar upp genom vattnet) syns som att en punkt på vattnet är blå i vissa
// bilder och inte i andra. En sak som står still framför dammen skymmer en punkt i ALLA bilder – det är inget fel.
// Därför: (D0) utan saker blinkar ingen punkt och minst 4 av 5 är blå i alla 24 bilder; (D) med 8 saker är varje punkt antingen blå i alla
// 24 bilder eller i ingen (stabil), och minst 2 är blå. Före B6.3 saknades vattnet helt i en del bilder (0 av 5).
async function dammSerie(p) {
  const serie = [];
  for (let i = 0; i < 24; i++) {
    serie.push(await blaPunkter(p));
    await p.waitForTimeout(350);
  }
  const av = serie[0]?.av ?? 0;
  const perPunkt = Array.from({ length: av }, (_, k) => serie.filter((s) => s.mask[k]).length);
  return { serie, av, perPunkt, minst: Math.min(...serie.map((s) => s.n)) };
}
await blok("D", async () => {
  const { ctx, p } = await sida({});
  await stangBok(p);
  await p.waitForTimeout(1500);
  const tom = await dammSerie(p);
  // Mitten kan ligga under en näckros eller en ring; det är stilla och därför ingen blinkning.
  const tomStabil = tom.perPunkt.every((n) => n === 0 || n === 24);
  kolla("D0 tom äng: ingen punkt blinkar bort och minst 4 av 5 punkter är blå i alla 24 bilder", tom.serie.length === 24 && tom.av === 5 && tomStabil && tom.minst >= 4, { per_punkt: tom.perPunkt.join(","), per_bild: tom.serie.map((s) => s.n).join("") });
  for (const f of ["en bil", "en buss", "en traktor", "ett slott", "en raket", "ett tåg", "en grävmaskin", "en ubåt"]) {
    await p.evaluate((x) => window.__troll.vakna(x), f);
    await p.waitForTimeout(2300);
  }
  await stangBok(p);
  await p.waitForTimeout(1500);
  const full = await dammSerie(p);
  const stabil = full.perPunkt.every((n) => n === 0 || n === 24);
  const synliga = full.perPunkt.filter((n) => n === 24).length;
  kolla("D 8 stora saker: ingen punkt på vattnet blinkar bort (varje punkt blå i alla 24 bilder eller skymd i alla)", full.serie.length === 24 && stabil, { per_punkt: full.perPunkt.join(","), per_bild: full.serie.map((s) => s.n).join("") });
  kolla("D 8 stora saker: minst 2 av 5 punkter syns i varje bild", full.minst >= 2 && synliga >= 2, { minst: full.minst });
  await bild(p, "b63-D-damm-8-saker.png");
  await ctx.close();
});

// D2/D3 (Doodle 08:26, 09:17): dammvattnet syns med Doodles 10 saker (spjälsäng m.fl., kon) och med de 10 största/högsta
// skapelserna på marken. Deterministiskt: skapelserna läggs in med fasta uid (tre frön), inte via slumpade uid,
// så att varje körning prövar samma lägen. Placeringen håller siktzonen mellan kameran och dammen fri (damm.ts siktFri).
{
  const ENT = JSON.parse(fs.readFileSync("data/entiteter.json", "utf8")).entiteter;
  const STOR = JSON.parse(fs.readFileSync("data/storlek.json", "utf8"));
  const FOTD = JSON.parse(fs.readFileSync("data/fotavtryck.json", "utf8")).halvbredd;
  const bakKlass = (k) => { const id = STOR.ids?.[k] ?? STOR.kategori?.[ENT[k].kategori]; return ENT[k].typ !== "djur" && STOR.klasser?.[id]?.zon === "bak"; };
  const pamark = Object.keys(ENT).filter((k) => ENT[k].modell && FOTD[k] && !["flyg", "sim"].includes(ENT[k].rorelse) && !bakKlass(k));
  const matt = (k) => ((ENT[k].malhojd ?? 1) + (ENT[k].typ === "djur" ? 0.6 : 0.05)) * (FOTD[k] + 0.37);
  const STORST = pamark.sort((a, b) => matt(b) - matt(a) || a.localeCompare(b)).slice(0, 10);
  const DOODLE_IDS = ["bowlingklot", "akvarium", "spjalsang", "paskagg", "vattenpistol", "filt", "fiol", "mikroskop", "trumset", "ko"];
  const sparad = (kropp, uid, i) => ({ uid, kropp, formel: `en ${kropp}`, beskrivning: "", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [], skapad: 1000 + i });
  for (const [namn, lista] of [["D2", DOODLE_IDS], ["D3", STORST]])
    for (const fro of [1, 2, 3])
      await blok(`${namn}`, async () => {
        // TTS-3-fix2: kommer en skärmbild inte inom 45 s körs fröet om en gång i en ny sida (diagnosen skrivs ut och sparas)
        let { ctx, p } = await sida({ ang: lista.map((k, i) => sparad(k, `${namn.toLowerCase()}-${fro}-${i}-${k}`, i)) });
        const kor = async () => {
        await stangBok(p);
        await p.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => undefined);
        await p.waitForTimeout(2500);
        return dammSerie(p);
        };
        let full;
        try {
          full = await kor();
        } catch (e) {
          if (!e.diagnos) throw e;
          kolla(`${namn} frö ${fro}: skärmbilden hängde – körs om en gång i en ny sida (info)`, true, { diagnos: e.diagnos });
          await ctx.close().catch(() => undefined);
          oppna.delete(ctx);
          ({ ctx, p } = await sida({ ang: lista.map((k, i) => sparad(k, `${namn.toLowerCase()}-${fro}-${i}-${k}`, i)) }));
          full = await kor();
        }
        const stabil = full.perPunkt.every((n) => n === 0 || n === 24);
        const etikett = namn === "D2" ? "Doodles 10 (spjälsäng, kon …)" : "de 10 största/högsta";
        kolla(`${namn} frö ${fro} ${etikett}: ingen punkt på vattnet blinkar bort`, full.serie.length === 24 && stabil, { lista, per_punkt: full.perPunkt.join(","), per_bild: full.serie.map((x) => x.n).join("") });
        kolla(`${namn} frö ${fro} ${etikett}: minst 3 av 5 punkter syns i varje bild`, full.minst >= 3, { minst: full.minst });
        if (fro === 1) await bild(p, `b63-${namn}-${namn === "D2" ? "spjalsang" : "storst"}.png`);
        await ctx.close();
      });
}

// H: uppmaningen vid ord utan modell står ≥ 5 s, och ett tryck stänger den
await blok("H", async () => {
  const { ctx, p } = await sida({});
  const mat = async () => {
    await p.click("[data-testid=pennans-bok]");
    await p.waitForTimeout(400);
    const t0 = Date.now();
    await p.evaluate(() => window.__troll.vakna("randig"));
    return t0;
  };
  let t0 = await mat();
  let sist = 0;
  while (Date.now() - t0 < 7500) {
    const t = await p.locator(".banderoller").innerText().catch(() => "");
    if (/kan jag inte rita/.test(t)) sist = Date.now() - t0;
    await p.waitForTimeout(100);
  }
  kolla("H uppmaningen står minst 5 s", sist >= 5000, { ms: sist });
  kolla("H boken stängs", !(await synlig(p, "[data-testid=bok-skarm]")));
  t0 = await mat();
  await p.waitForTimeout(600);
  await bild(p, "b63-H-uppmaning.png");
  // Mät trycket, inte tiden sedan boken (skärmbilden kan ta sekunder på en lastad maskin): uppmaningen står kvar
  // precis före trycket och är borta strax efter, så det är trycket som stänger den.
  const text = async () => /kan jag inte rita/.test(await p.locator(".banderoller").innerText().catch(() => ""));
  const fore = await text();
  const tKlick = Date.now();
  await p.locator(".banner.tryck").click();
  await p.waitForTimeout(400);
  const kvar = await text();
  kolla("H ett tryck stänger uppmaningen", fore && !kvar && Date.now() - tKlick < 2500, { fore, kvar, msSedanBok: tKlick - t0, msEfterTryck: Date.now() - tKlick });
  await ctx.close();
});

// I: djur, figurer och saker runt dammen, fisken i den. Robust: lägena läses i världen (window.__tredPos, så som de ritas,
// vickningen inräknad) och jämförs med dammen (window.__damm) – inte pixlar, som djur framför dammen skymmer.
// Kravet gäller KROPPEN, inte mitten: avstånd till kanten minus halva bredden ur modellens bbox (data/fotavtryck.json)
// ska vara ≥ 0,1 i alla 12 mätningar. Flera varv: två fasta (Doodles fall) och slumpade ur en pool, fröet skrivs ut
// (--fro <tal> upprepar ett varv, --varv <n> antal slumpvarv, standard 2).
const FOT = JSON.parse(fs.readFileSync("data/fotavtryck.json", "utf8")).halvbredd;
const ENT = JSON.parse(fs.readFileSync("data/entiteter.json", "utf8")).entiteter;
const halv = (d) => (FOT[d.kropp] ?? 0.5 * (ENT[d.kropp]?.malhojd ?? 1)) * (d.skala || 1);
const POOL = ["en ko", "en gris", "en bebis", "en katt", "en pojke", "ett slott", "en buss", "en kaffekanna", "en väggklocka", "ett mikroskop", "ett trumset",
  "en jordglob", "ett ägg", "ett bowlingklot", "ett akvarium", "en spjälsäng", "ett påskägg", "en vattenpistol", "en filt", "en fiol", "en hund", "en traktor", "ett bord", "en elefant", "en kvast", "en gitarr", "en säng", "ett hus", "en lampa", "en lakrits", "ett frimärke", "ett sjukhus", "en apatosaurus", "en triceratops", "en cirkus"];
const slump = (fro) => () => ((fro = (fro * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const fro0 = Number(arg("fro", String(Date.now() % 100000)));
const varv = [
  { namn: "I1", ord: ["en ko", "en gris", "en bebis", "en katt", "en pojke", "en fisk", "ett slott", "en buss", "en kaffekanna", "en väggklocka"] },
  // Doodle 07:33: mikroskop och trumset i dammen; 06:14 jordglob, ägg (armband finns inte som entitet).
  { namn: "I2", ord: ["ett mikroskop", "ett trumset", "en jordglob", "ett ägg", "en väggklocka", "en ko", "en fisk", "en hund", "en buss", "en kaffekanna"] },
  // Doodle 08:26: alla saker, inte bara djur
  { namn: "I3", ord: DOODLE_0826 },
  // Doodle 08:59: lakrits och frimärke vid dammkanten
  { namn: "I4", ord: ["en lakrits", "ett frimärke", "ett bowlingklot", "ett påskägg", "en vattenpistol", "en fiol", "en kaffekanna", "en väggklocka", "en fisk", "en katt"] },
];
for (let v = 0; v < Number(arg("varv", "2")); v++) {
  const r = slump(fro0 + v * 7919);
  const pool = [...POOL].sort(() => r() - 0.5);
  const ord = pool.slice(0, 9);
  ord.splice(Math.floor(r() * 10), 0, "en fisk");
  varv.push({ namn: `I${5 + v}`, ord, fro: fro0 + v * 7919 });
}
// 10 per varv. P3a: de som inte får en ledig ruta somnar (se nedan).
for (const { namn, ord, fro } of varv) {
  await blok(namn, async () => {
    const { ctx, p } = await sida({});
    for (const f of ord) {
      await p.evaluate((x) => window.__troll.vakna(x), f);
      await p.waitForTimeout(2300);
    }
    await stangBok(p);
    // P3a (Arkitektens kapacitetsbeslut 18:59/21:40): ängen rymmer inte alltid 10 – den som inte får en ledig ruta somnar
    // (sovande/stall) och kan väckas. Kravet "ingen kropp i dammen" gäller alla vakna; de sovande räknas som att de har
    // ett läge (i stallet). Förut: "Ängen rymmer 10" och alla 10 skulle stå på ängen.
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}"));
    const spar = st.ang ?? [];
    const sover = [...(st.sovande ?? []), ...(st.stall ?? [])];
    const varst = {};
    const mitt = {};
    for (let i = 0; i < 12; i++) {
      const { pos, damm } = await p.evaluate(() => ({ pos: window.__tredPos ?? {}, damm: window.__damm }));
      for (const d of spar) {
        const q = pos[d.uid];
        if (!q || !damm) continue;
        const a = Math.hypot(q.x - damm.x, q.z - damm.z) - damm.r;
        mitt[d.kropp] = Math.min(mitt[d.kropp] ?? Infinity, Math.round(a * 100) / 100);
        varst[d.kropp] = Math.min(varst[d.kropp] ?? Infinity, Math.round((a - (d.kropp === "fisk" ? 0 : halv(d))) * 100) / 100);
      }
      await p.waitForTimeout(400);
    }
    const land = Object.entries(varst).filter(([k]) => k !== "fisk");
    kolla(`${namn} alla 10 skapelser har ett läge (vakna på ängen, eller sover i stallet – P3a)`, Object.keys(varst).length === spar.length && spar.length + sover.length === ord.length && spar.length >= 1, { ord, fro, kroppar: spar.map((d) => d.kropp), sover: sover.map((d) => d.kropp) });
    kolla(`${namn} ingen kropp i dammen (kanten minus halva bredden ≥ 0,1 i alla 12 mätningar)`, land.length >= spar.filter((d) => d.kropp !== "fisk").length && land.every(([, a]) => a >= 0.1), { kropp: varst, mitt, fro });
    if (ord.includes("en fisk")) kolla(`${namn} fisken simmar i dammen`, (varst.fisk ?? 1) < 0, { fisk: varst.fisk });
    await bild(p, `b63-${namn}-damm.png`);
    await ctx.close();
  });
}

kolla("inga sidfel", fel.length === 0, { fel: fel.slice(0, 5) });
console.log(JSON.stringify(steg, null, 1));
await browser.close();
server.close();
process.exit(steg.every((s) => s.ok) ? 0 : 1);
