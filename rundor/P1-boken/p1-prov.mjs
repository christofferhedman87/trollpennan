#!/usr/bin/env node
// P1 – boken utan hinder: överlappsprov 375x812 (touch) i DOM-turens 28 lägen + 9 boklägen. Arkitektens prov, ändrar inget.
//   node rundor/P1-boken/p1-prov.mjs [--dist dist-pages] [--bilder <mapp>] [--bara namn1,namn2]
// Exit 0 = alla steg gröna. Utdata (JSON) på stdout, steg på stderr ("ok  " / "FEL ").
// Regler per läge:
//   A  Inga två nåbara klickbara element överlappar (synlig yta, efter klippning av skrollytor och skärmen; > 4 px i båda led).
//      "Nåbar" = elementFromPoint mitt i den synliga ytan träffar elementet (ett element under en öppen dialog räknas inte;
//      ett bokelement som täcks av ett lager utanför boken – t.ex. köp-frågan – räknas som medvetet modalt).
//   B  Svarsknapparna (Menade du …?/Nej, Pennan behöver …, Vakna!, skrivrutan, stäng, pennan) syns HELT och är nåbara när de finns.
//   C  (boklägen) Tangentbordet är öppet när ett nytt barn öppnar boken, och ett tryck på skrivrutan öppnar det.
//   D  Varning (inte fel): nåbara tryckytor < 44 px (bokstavstangenterna undantagna i bredd).
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const root = path.resolve(arg("dist", "dist-pages"));
const bilder = arg("bilder", "");
const bara = arg("bara", "")?.split(",").filter(Boolean);
if (bilder) fs.mkdirSync(bilder, { recursive: true });
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf" };
const server = http.createServer((req, res) => {
  let f = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!f.startsWith(root)) { res.writeHead(403); res.end(); return; }
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, "index.html");
  res.setHeader("Content-Type", mime[path.extname(f)] ?? "application/octet-stream");
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const URL0 = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, locale: "sv-SE" });
await ctx.addInitScript(() => {
  if (!sessionStorage.getItem("p1-fro")) { localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true })); sessionStorage.setItem("p1-fro", "1"); }
});
const p = await ctx.newPage();
p.setDefaultTimeout(8000);
const sidfel = [];
p.on("pageerror", (e) => sidfel.push(String(e.message).slice(0, 200)));
const steg = [];
const kolla = (namn, ok, info = {}) => { steg.push({ namn, ok: !!ok, ...info }); console.error(`${ok ? "ok  " : "FEL "} ${namn}${ok ? "" : " " + JSON.stringify(info).slice(0, 400)}`); };
const varningar = [];

/** Mäter i sidan: nåbara klickbara element, synlig yta och vilka av MASTE som är avklippta. */
const MATT = () => {
  const SEL = "button, a[href], input, textarea, select, summary, [role=button], [role=tab], [data-testid=remsa]";
  const MASTE = /^(forslag-|nej$|prova-|vakna$|remsa$|stang-bok$|pennan$)/;
  const vy = { l: 0, t: 0, r: innerWidth, b: innerHeight };
  const snitt = (a, b) => ({ l: Math.max(a.l, b.l), t: Math.max(a.t, b.t), r: Math.min(a.r, b.r), b: Math.min(a.b, b.b) });
  const synlig = (e) => {
    const cs = getComputedStyle(e);
    if (cs.visibility === "hidden" || cs.display === "none") return null;
    const q = e.getBoundingClientRect();
    if (q.width < 1 || q.height < 1) return null;
    let y = snitt({ l: q.left, t: q.top, r: q.right, b: q.bottom }, vy);
    for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (+s.opacity === 0 || s.display === "none" || s.visibility === "hidden") return null;
      if (/(auto|scroll|hidden|clip)/.test(s.overflow + s.overflowX + s.overflowY)) { const k = a.getBoundingClientRect(); y = snitt(y, { l: k.left, t: k.top, r: k.right, b: k.bottom }); }
    }
    return { box: q, y };
  };
  const namn = (e) => e.getAttribute("data-testid") || (e.getAttribute("aria-label") ? "aria:" + e.getAttribute("aria-label") : "") || e.tagName.toLowerCase() + ":" + (e.textContent || "").trim().slice(0, 20);
  const ut = [];
  for (const e of document.querySelectorAll(SEL)) {
    const s = synlig(e);
    if (!s) continue;
    const { y, box } = s;
    const w = y.r - y.l, h = y.b - y.t;
    const id = e.getAttribute("data-testid") || "";
    const rad = { namn: namn(e), id, x: Math.round(y.l), y: Math.round(y.t), w: Math.round(w), h: Math.round(h), bw: Math.round(box.width), bh: Math.round(box.height), tangent: e.classList.contains("tangent"), maste: MASTE.test(id) };
    if (w <= 1 || h <= 1) { if (rad.maste && e.closest(".bok")) ut.push({ ...rad, nabar: false, avklippt: true }); continue; }
    // nåbar: någon av 5 punkter i den synliga ytan träffar elementet själv
    const pts = [[0.5, 0.5], [0.2, 0.5], [0.8, 0.5], [0.5, 0.25], [0.5, 0.75]];
    const nabar = pts.some(([fx, fy]) => { const t = document.elementFromPoint(y.l + w * fx, y.t + h * fy); return !!t && (t === e || e.contains(t)); });
    const avklippt = Math.abs(w - box.width) > 2 || Math.abs(h - box.height) > 2;
    // Täckt av ett lager UTANFÖR boken (t.ex. köp-frågan över byggboken) = medvetet modalt, inte ett boklayoutfel.
    let tacktUtifran = false;
    if (!nabar && e.closest(".bok")) {
      const t = document.elementFromPoint(y.l + w / 2, y.t + h / 2);
      tacktUtifran = !!t && !t.closest(".bok");
    }
    ut.push({ ...rad, nabar, avklippt, tacktUtifran, _e: null });
    rad._ref = e;
    ut[ut.length - 1]._idx = [...document.querySelectorAll(SEL)].indexOf(e);
  }
  // överlapp mellan nåbara, inte förälder/barn
  const alla = [...document.querySelectorAll(SEL)];
  const nab = ut.filter((r) => r.nabar);
  const over = [];
  for (let i = 0; i < nab.length; i++) for (let j = i + 1; j < nab.length; j++) {
    const a = nab[i], b = nab[j];
    const ea = alla[a._idx], eb = alla[b._idx];
    if (ea.contains(eb) || eb.contains(ea)) continue;
    const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (ix > 4 && iy > 4) over.push(`${a.namn} × ${b.namn} (${ix}×${iy} px)`);
  }
  const masteFel = ut.filter((r) => r.maste && (r.avklippt || (!r.nabar && !r.tacktUtifran))).map((r) => `${r.namn}: synlig ${r.w}×${r.h} av ${r.bw}×${r.bh}${r.nabar ? "" : ", inte nåbar"}`);
  const sma = nab.filter((r) => r.h < 44 || (!r.tangent && r.w < 44)).map((r) => `${r.namn} ${r.w}×${r.h}`);
  const tangentbord = !!document.querySelector("[data-testid=tangentbord]");
  return { antal: nab.length, over, masteFel, sma, tangentbord, bok: !!document.querySelector(".bok") };
};

async function rent() {
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }).catch(() => undefined);
  await p.goto(URL0, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__troll, null, { timeout: 30000 });
  await p.waitForTimeout(1500);
}
const t = (id) => p.getByTestId(id);
const troll = (js, a) => p.evaluate(js, a);
const medDjur = (text = "en blå fågel") => troll((x) => window.__troll.vakna(x), text);
const oppnaMeny = async () => { await t("meny").click(); };
const tillKartan = async () => { await medDjur(); await oppnaMeny(); await t("ut-pa-aventyr").click(); };
const treDjurTillKartan = async () => { for (const d of ["en blå fågel", "en gris", "en katt"]) { await medDjur(d); await p.waitForTimeout(400); } await oppnaMeny(); await t("ut-pa-aventyr").click(); };
const inget = async () => {};
let nr = 0;
const resultat = [];
async function lage(namn, fore, handling, extra) {
  nr += 1;
  const id = `${String(nr).padStart(2, "0")}-${namn}`;
  if (bara.length && !bara.includes(namn)) return;
  let fel;
  try { await rent(); await fore(); await p.waitForTimeout(300); await handling(); await p.waitForTimeout(700); } catch (e) { fel = String(e.message).split("\n")[0].slice(0, 160); }
  const m = await p.evaluate(MATT);
  if (bilder) await p.screenshot({ path: path.join(bilder, `p1-${id}.png`) }).catch(() => undefined);
  resultat.push({ id, fel, ...m });
  kolla(`${id}: förberedelse`, !fel, { fel });
  kolla(`${id}: A inga överlapp (${m.antal} nåbara)`, m.over.length === 0, { over: m.over });
  kolla(`${id}: B svarsknappar hela och nåbara`, m.masteFel.length === 0, { masteFel: m.masteFel });
  if (extra) await extra(m, id);
  if (m.sma.length) varningar.push({ id, sma: m.sma });
}

// ---- DOM-turens 28 lägen (verification/r1-dom-tur.mjs, samma ordning och förberedelser) ----
await lage("start", inget, inget);
await lage("ang-djur", inget, () => medDjur());
await lage("bok-kort", medDjur, async () => { await t("pennans-bok").click(); await troll(() => window.__troll.lage("kort")); });
await lage("bok-skriv", medDjur, async () => { await t("pennans-bok").click(); await troll(() => window.__troll.lage("skriv")); });
await lage("bok-forslag", inget, () => medDjur("en kannin"));
await lage("bok-behover", inget, () => medDjur("en elefant"));
await lage("meny", inget, oppnaMeny);
await lage("meny-last", oppnaMeny, async () => { await t("flik-gard").click(); });
await lage("karta", medDjur, async () => { await oppnaMeny(); await t("ut-pa-aventyr").click(); });
await lage("skogen-last", tillKartan, async () => { await t("plats-skogen").click({ force: true }); await p.waitForTimeout(400); });
await lage("skogen", treDjurTillKartan, async () => { await t("plats-skogen").click(); await p.waitForTimeout(3500); });
await lage("ordbok", inget, () => troll(() => window.__troll.ordbok(true)));
await lage("foralder", inget, () => troll(() => window.__troll.foralder(true)));
await lage("album", inget, () => troll(() => window.__troll.album(true)));
await lage("formel", medDjur, () => troll(() => window.__troll.formel()));
await lage("onska", async () => { await medDjur("en rosa kanin"); }, () => troll(() => window.__troll.onska("kalas", false)));
await lage("onska-bok", async () => { await medDjur("en rosa kanin"); await troll(() => window.__troll.onska("kalas", false)); }, async () => { await t("onska-bubbla").click(); });
await lage("gard", inget, async () => { await troll(() => window.__troll.plats("gard")); await p.waitForTimeout(800); });
await lage("gard-bygger", async () => { await troll(() => window.__troll.plats("gard")); await p.waitForTimeout(800); }, () => troll(() => window.__troll.vakna("ett hus med fönster")));
await lage("gard-bok", async () => { await troll(() => window.__troll.plats("gard")); await p.waitForTimeout(800); }, async () => { await t("bygg-nagot").click(); });
await lage("foralder-borja", () => troll(() => window.__troll.foralder(true)), async () => { await t("borja-om").click(); });
await lage("meny-borja", oppnaMeny, async () => { await t("meny-borja").click(); });
await lage("ordbok-for-fa", () => troll(() => window.__troll.ordbok(true)), async () => { await p.locator('[data-testid^="sida-"] button.kort').first().click(); });
await lage("ordbok-kop", async () => { await troll(() => window.__troll.stjarnor(99)); await troll(() => window.__troll.ordbok(true)); }, async () => { await p.locator('[data-testid^="sida-"] button.kort').first().click(); });
await lage("ordbok-kopt", async () => { await troll(() => window.__troll.stjarnor(99)); await troll(() => window.__troll.ordbok(true)); await p.locator('[data-testid^="sida-"] button.kort').first().click(); }, async () => { await t("kop-ja").click(); });
await lage("bygg-for-fa", async () => { await troll(() => window.__troll.plats("gard")); await p.waitForTimeout(800); await t("bygg-nagot").click(); }, async () => { await p.locator('[data-testid="bygg-last"] button.last-ikon').first().click(); });
await lage("bygg-kop", async () => { await troll(() => window.__troll.stjarnor(99)); await troll(() => window.__troll.plats("gard")); await p.waitForTimeout(800); await t("bygg-nagot").click(); }, async () => { await p.locator('[data-testid="bygg-last"] button.last-ikon').first().click(); });
await lage("kvall", medDjur, () => troll(() => window.__troll.kvall()));

// ---- P1: boklägen som ett barn når dem (tryck, inte krokar) ----
const skrivOchVakna = async (s) => { await troll((x) => window.__troll.skriv(x), s); await p.waitForTimeout(300); await t("vakna").tap(); await p.waitForTimeout(900); };
await lage("p1-bok-nytt-barn", inget, async () => { await t("pennans-bok").tap(); }, async (m, id) => kolla(`${id}: C tangentbordet öppet direkt för ett nytt barn`, m.tangentbord));
await lage("p1-tryck-pa-rutan", async () => { await t("pennans-bok").tap(); await troll(() => window.__troll.lage("kort")); await p.waitForTimeout(300); }, async () => { await t("remsa").tap(); },
  async (m, id) => kolla(`${id}: C tryck på skrivrutan öppnar tangentbordet`, m.tangentbord));
await lage("p1-menade-du-elefannt", async () => { await t("pennans-bok").tap(); }, () => skrivOchVakna("en elefannt"), async (m, id) => {
  const syns = await t("forslag").isVisible().catch(() => false);
  kolla(`${id}: förslaget visas`, syns);
  if (syns) { const k = p.locator('[data-testid^="forslag-"]').first(); await k.tap().catch(() => undefined); await p.waitForTimeout(1200); kolla(`${id}: trycket på förslaget tar (rutan stängd eller nytt djur)`, !(await t("forslag").isVisible().catch(() => false))); }
});
await lage("p1-menade-du-kat-me-hat", async () => { await t("pennans-bok").tap(); }, () => skrivOchVakna("en kat me hat"), async (m, id) => {
  const nej = t("nej");
  if (await nej.isVisible().catch(() => false)) { await nej.tap(); await p.waitForTimeout(600); kolla(`${id}: Nej går att trycka och tangentbordet kommer tillbaka`, await t("tangentbord").isVisible().catch(() => false)); }
  else kolla(`${id}: Nej-knappen syns`, false);
});
await lage("p1-behover", async () => { await t("pennans-bok").tap(); }, () => skrivOchVakna("blå"));
await lage("p1-uppdrag", async () => { await p.waitForTimeout(1500); }, async () => { if (await t("bengtsson-ikon").isVisible().catch(() => false)) await t("bengtsson-ikon").tap(); else await t("pennans-bok").tap(); });
await lage("p1-ideer-oppna", async () => { await t("pennans-bok").tap(); }, async () => { await p.locator(".skapar-guide summary").first().tap(); });
await lage("p1-kortlage-flik", async () => { await t("pennans-bok").tap(); await troll(() => window.__troll.lage("kort")); }, async () => { await p.locator(".flikar .flik").nth(1).tap().catch(() => undefined); });
await lage("p1-gava", async () => { await medDjur("en rosa kanin"); await troll(() => window.__troll.onska("kalas", false)); }, async () => { await t("onska-bubbla").click(); await troll(() => window.__troll.lage("skriv")); });

kolla("inga sidfel", sidfel.length === 0, { sidfel });
const ok = steg.every((s) => s.ok);
console.log(JSON.stringify({ ok, steg, varningar, lagen: resultat.map(({ id, antal, over, masteFel, tangentbord }) => ({ id, antal, over, masteFel, tangentbord })) }, null, 1));
await browser.close();
server.closeAllConnections?.();
server.close();
process.exit(ok ? 0 : 1);
