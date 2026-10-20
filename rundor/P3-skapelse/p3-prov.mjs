#!/usr/bin/env node
// P3 – skapelsen syns rätt. Playwright 375x812 (swiftshader). Arkitektens prov, ändrar inget.
//   node rundor/P3-skapelse/p3-prov.mjs [--dist dist-pages] [--bilder <mapp>] [--bara A,B,C,D,E] [--modeller kanin,häst,…]
// Exit 0 = alla steg gröna. Steg på stderr ("ok  " / "FEL "), sammanfattning (JSON) på stdout.
//   A  Alla 38 kläd-tillbehör (typ "tillbehor" i data/entiteter.json) på fyra modeller av olika form (kanin, häst, giraff,
//      krokodil): plagget sitter PÅ kroppen (window.__tredPlagg: plaggets världsruta inom kroppens, på rätt höjd för sin del),
//      inget plagg står bredvid på marken.
//   B  Bengtssons första uppdrag "en kanin med mössa" skrivet i spelet: mössan sitter på kaninens huvud, inte i dammen.
//   C  Landning: efter fem djur landar "en katt" (och "en elefant", "en gul fisk" i dammen) framme, syns ≥ 80 % och ingen
//      skymmer den; kameran går in mot den (window.__tredFokus) och tillbaka.
//   D  Tolkningen ändrar aldrig barnets ord i tysthet: "en dansande banan" blir aldrig "ande"; "en blixtkatt" frågar "Menade du katt?".
//   E  Sjön (Doodles fynd): bläckfisken ryms i bild och sälen skyms inte av ankan (B6.6:s synliga bredd per djup).
//   F  Byggnader och stora saker (Doodle 15:35): varje sak syns till minst 1 − (max_skymd + 0,1) av sin skärmruta
//      (data/storlek.json; de som står framför räknas), slottet syns tydligt högre än sjukhuset, och småsaker har rimlig
//      inbördes storlek (pucken mindre än kaffekoppen).
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const dist = path.resolve(arg("dist", "dist-pages"));
const bilder = arg("bilder", "");
const bara = (arg("bara", "A,B,C,D,E,F") ?? "").split(",");
const MODELLER = (arg("modeller", "kanin,häst,giraff,krokodil") ?? "").split(",");
if (bilder) fs.mkdirSync(bilder, { recursive: true });
const E = JSON.parse(fs.readFileSync("data/entiteter.json", "utf8")).entiteter;
const PL = fs.existsSync("data/plagg.json") ? JSON.parse(fs.readFileSync("data/plagg.json", "utf8")).plagg : {};
const KLADER = Object.keys(E).filter((k) => E[k].typ === "tillbehor");
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf" };
const server = http.createServer((req, res) => {
  let f = path.join(dist, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!f.startsWith(dist)) { res.writeHead(403); res.end(); return; }
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, "index.html");
  res.setHeader("Content-Type", mime[path.extname(f)] ?? "application/octet-stream");
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const URL0 = `http://127.0.0.1:${server.address().port}/`;
const starta = () => chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let browser = await starta();
const steg = [];
const sidfel = [];
const kolla = (namn, ok, info = {}) => { steg.push({ namn, ok: !!ok, ...info }); console.error(`${ok ? "ok  " : "FEL "} ${namn}${ok ? "" : " " + JSON.stringify(info).slice(0, 500)}`); };
const PLATSER = ["skogen", "sjon", "grottan"];
const sparad = (uid, kropp, skapad, tillbehor = []) => ({ uid, kropp, formel: `en ${kropp}`, beskrivning: "", skala: 1, alpha: 1, formagor: [], tillbehor, overraskningar: [], skapad });

async function sida(spar, { touch = false } = {}) {
  if (!browser.isConnected()) browser = await starta();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE", hasTouch: touch, isMobile: touch });
  await ctx.addInitScript((s) => {
    window.__tredSyn = {};
    window.__tredPlagg = {};
    if (!sessionStorage.getItem("p3-fro")) { localStorage.setItem("trollpennan-v2", JSON.stringify(s)); sessionStorage.setItem("p3-fro", "1"); }
  }, { version: 2, introSedd: true, dragit: true, ang: [], garden: [], stjarnor: 0, oppnadePlatser: PLATSER, seddaIntro: [...PLATSER, "garden", "gard"], platsSkapelser: {}, ...spar });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => sidfel.push(String(e.message ?? e).slice(0, 200)));
  p.setDefaultTimeout(20000);
  await p.goto(URL0, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__troll, null, { timeout: 40000 });
  await p.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => undefined);
  await p.waitForTimeout(1500);
  return { ctx, p };
}
const bild = async (p, n) => bilder && p.screenshot({ path: path.join(bilder, n), animations: "disabled", timeout: 45000 }).catch(() => undefined);
const synlig = (p, s) => p.locator(s).first().isVisible().catch(() => false);
async function stangBok(p) { if (await synlig(p, "[data-testid=stang-bok]")) { await p.click("[data-testid=stang-bok]"); await p.waitForTimeout(400); } }
async function vakna(p, ord, vanta = 2300) { for (const f of ord) { await p.evaluate((x) => window.__troll.vakna(x), f); await p.waitForTimeout(vanta); } await stangBok(p); }
const sparAng = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}").ang ?? []);
async function blok(id, fn) { if (!bara.includes(id)) return; try { await fn(); } catch (e) { kolla(`${id}: block kraschade`, false, { fel: String(e).split("\n")[0].slice(0, 200) }); } }
const runda = (v) => Math.round(v * 100) / 100;

/** Ett plagg sitter på kroppen: mitten inom kroppens ruta i x/z (marginal 25 % av bredden) och på sin dels höjd. */
function paKroppen(r) {
  const [k0, k1] = r.kropp; const [p0, p1] = r.plagg;
  const H = k1[1] - k0[1], W = Math.max(k1[0] - k0[0], k1[2] - k0[2]);
  const c = [0, 1, 2].map((i) => (p0[i] + p1[i]) / 2);
  const m = 0.25 * W + 0.05;
  const iXZ = c[0] >= k0[0] - m && c[0] <= k1[0] + m && c[2] >= k0[2] - m && c[2] <= k1[2] + m;
  const storlek = Math.max(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
  let hojd = true;
  if (r.del === "huvud") hojd = c[1] >= k0[1] + 0.6 * H;
  else if (r.del === "fotter") hojd = p0[1] <= k0[1] + 0.25 * H;
  else hojd = c[1] >= k0[1] + 0.05 * H && c[1] <= k1[1];
  const ok = iXZ && hojd && storlek >= 0.08 * H;
  return { ok, varfor: ok ? null : `${iXZ ? "" : "bredvid kroppen "}${hojd ? "" : "fel höjd "}${storlek >= 0.08 * H ? "" : "för litet"}`.trim(), c: c.map(runda), H: runda(H) };
}

// ---- A: alla 38 plagg på fyra former, tio åt gången ----
await blok("A", async () => {
  kolla(`A: ${KLADER.length} kläd-tillbehör i data/entiteter.json`, KLADER.length === 38, { antal: KLADER.length });
  const resultat = {};
  for (const modell of MODELLER) {
    for (let s = 0; s < KLADER.length; s += 10) {
      const grupp = KLADER.slice(s, s + 10);
      const ang = grupp.map((id, i) => sparad(`p3a-${modell}-${id}`, modell, 1000 + i, [{ id, farg: null, glans: false }]));
      let ctx, p;
      for (let f = 1; f <= 3; f++) {
        try { ({ ctx, p } = await sida({ ang })); break; } catch (e) { await ctx?.close().catch(() => undefined); if (f === 3) throw e; browser = await starta(); }
      }
      await p.waitForFunction((n) => Object.values(window.__tredPlagg ?? {}).filter((v) => v.length > 0).length >= n, grupp.length, { timeout: 25000 }).catch(() => undefined);
      await p.waitForTimeout(800);
      const pl = await p.evaluate(() => window.__tredPlagg ?? {});
      for (const id of grupp) {
        const rad = (pl[`p3a-${modell}-${id}`] ?? []).find((r) => r.id === id);
        resultat[`${modell}/${id}`] = rad ? paKroppen(rad) : { ok: false, varfor: "inget plagg på kroppen (står bredvid eller saknas)" };
      }
      if (bilder && (s === 0 || grupp.some((id) => !resultat[`${modell}/${id}`].ok))) await bild(p, `p3-02-plagg-${modell}-${String(s / 10 + 1)}.png`);
      await ctx.close();
    }
  }
  const fel = Object.entries(resultat).filter(([, r]) => !r.ok);
  kolla(`A: alla ${KLADER.length} plagg sitter på kroppen på ${MODELLER.join(", ")} (${Object.keys(resultat).length} fall)`, fel.length === 0 && Object.keys(resultat).length === KLADER.length * MODELLER.length, { fel: fel.slice(0, 25).map(([k, r]) => `${k}: ${r.varfor}`), antalFel: fel.length });
  kolla("A: varje kläd-entitet har en rad i data/plagg.json", KLADER.every((k) => PL[k]), { saknas: KLADER.filter((k) => !PL[k]) });
});

// ---- B: Bengtssons första uppdrag, skrivet i spelet ----
await blok("B", async () => {
  const { ctx, p } = await sida({ ang: [sparad("b-hund", "hund", 1000)] });
  await vakna(p, ["en kanin med mössa"], 3500);
  const ang = await sparAng(p);
  const kanin = ang.find((d) => d.kropp === "kanin");
  await p.waitForTimeout(1500);
  const pl = await p.evaluate(() => window.__tredPlagg ?? {});
  const rad = kanin ? (pl[kanin.uid] ?? []).find((r) => r.id === "alvmossa") : null;
  const r = rad ? paKroppen(rad) : { ok: false, varfor: "mössan sitter inte på kaninen" };
  kolla("B: 'en kanin med mössa' – mössan sitter på kaninens huvud", r.ok && rad?.del === "huvud", { r, del: rad?.del });
  const c = rad ? [(rad.plagg[0][0] + rad.plagg[1][0]) / 2, (rad.plagg[0][2] + rad.plagg[1][2]) / 2] : [9, 9];
  kolla("B: mössan står inte i dammen", Math.hypot(c[0] - 1.12, c[1] + 0.35) > 0.8, { c: c.map(runda) });
  await bild(p, "p3-01-kanin-med-mossa.png");
  await ctx.close();
});

// ---- C: den nya skapelsen landar framme och syns ----
const tacker = (fram, bak) => {
  const w = Math.max(0, Math.min(fram.x + fram.w, bak.x + bak.w) - Math.max(fram.x, bak.x));
  const h = Math.max(0, Math.min(fram.y + fram.h, bak.y + bak.h) - Math.max(fram.y, bak.y));
  return (w * h) / Math.max(1, bak.w * bak.h);
};
async function landar(namn, fore, ord, kropp, bildnamn) {
  const { ctx, p } = await sida({ ang: fore.map((k, i) => sparad(`c-${i}-${k}`, k, 1000 + i)) });
  await p.evaluate((x) => window.__troll.vakna(x), ord);
  // kameran går in mot den nya (fokus) – fånga "kvar"
  let fokus = null;
  for (let i = 0; i < 70 && !fokus; i++) { await p.waitForTimeout(100); const f = await p.evaluate(() => window.__tredFokus ?? null); if (f && (f.fas === "kvar" || f.fas === "in")) fokus = f; }
  if (bildnamn) await bild(p, `${bildnamn}-fokus.png`);
  await p.waitForTimeout(3000);
  await stangBok(p);
  await p.waitForTimeout(1200);
  const ang = await sparAng(p);
  const ny = ang.filter((d) => d.kropp === kropp).sort((a, b) => b.skapad - a.skapad)[0];
  const syn = await p.evaluate(() => window.__tredSyn ?? {});
  const pos = await p.evaluate(() => window.__tredPos ?? {});
  const slut = await p.evaluate(() => window.__tredFokus ?? null);
  if (bildnamn) await bild(p, `${bildnamn}.png`);
  await ctx.close();
  if (!ny || !syn[ny.uid] || !pos[ny.uid]) { kolla(`C ${namn}: den nya finns och mäts`, false, { ny: !!ny }); return; }
  const r = syn[ny.uid];
  const iBild = r.x >= -3 && r.x + r.w <= 378 && r.y >= 140 && r.y + r.h <= 760;
  let tackt = 0;
  const vem = [];
  for (const d of ang) {
    if (d.uid === ny.uid || !syn[d.uid] || !pos[d.uid]) continue;
    if (pos[d.uid].z <= pos[ny.uid].z + 0.05) continue; // bara de som står närmare kameran
    const t = tacker(syn[d.uid], r);
    if (t > 0.02) vem.push(`${d.kropp} ${Math.round(t * 100)} %`);
    tackt += t;
  }
  kolla(`C ${namn}: ${kropp} ryms i bilden`, iBild, { r });
  kolla(`C ${namn}: ${kropp} syns ≥ 80 % (ingen framför skymmer den)`, tackt <= 0.2, { tackt: runda(tackt), vem });
  const framst = ang.filter((d) => d.uid !== ny.uid && pos[d.uid] && syn[d.uid] && pos[d.uid].z > pos[ny.uid].z + 0.05 && Math.abs(pos[d.uid].x - pos[ny.uid].x) < 1.2).map((d) => d.kropp);
  if (kropp !== "fisk") kolla(`C ${namn}: ${kropp} landar längst fram (ingen står framför den i samma del av bilden)`, framst.length === 0, { framfor: framst, pos: pos[ny.uid] });
  kolla(`C ${namn}: kameran gick in mot ${kropp} och tillbaka`, !!fokus && fokus.uid === ny.uid && slut?.fas === "klar", { fokus, slut });
}
await blok("C", async () => {
  await landar("katt efter fem djur", ["kanin", "hund", "häst", "gris", "ko"], "en katt", "katt", "p3-03-katt-landar");
  await landar("elefant efter fyra djur", ["kanin", "hund", "katt", "gris"], "en elefant", "elefant", "p3-04-elefant-landar");
  await landar("gul fisk efter tre djur (granskningens bild 24)", ["kanin", "elefant", "katt"], "en gul fisk", "fisk", "p3-05-fisk");
});

// ---- D: tolkningen ----
await blok("D", async () => {
  const { ctx, p } = await sida({ ang: [sparad("d-hund", "hund", 1000)] }, { touch: true });
  await vakna(p, ["en dansande banan"], 2500);
  const ang = await sparAng(p);
  const sista = ang.sort((a, b) => b.skapad - a.skapad)[0];
  kolla("D: 'en dansande banan' blir aldrig 'ande'", !!sista && !/\bande\b/.test(sista.formel) && sista.kropp !== "ande", { formel: sista?.formel, kropp: sista?.kropp });
  await bild(p, "p3-06-dansande-banan.png");
  // "en blixtkatt" skrivet i boken: frågan "Menade du katt?" visas och inget skapas i tysthet
  const fore = (await sparAng(p)).length;
  await p.getByTestId("pennans-bok").tap().catch(() => undefined);
  await p.waitForTimeout(600);
  await p.evaluate((x) => window.__troll.skriv(x), "en blixtkatt");
  await p.waitForTimeout(300);
  await p.getByTestId("vakna").tap().catch(() => undefined);
  await p.waitForTimeout(1200);
  const fraga = await p.getByTestId("forslag").innerText().catch(() => "");
  const efter = (await sparAng(p)).length;
  kolla("D: 'en blixtkatt' frågar 'Menade du katt?' och skapar inget i tysthet", /katt/.test(fraga) && efter === fore, { fraga: fraga.slice(0, 80), fore, efter });
  await bild(p, "p3-07-menade-du-katt.png");
  const knapp = p.locator("[data-testid=forslag] button").first();
  await knapp.tap().catch(() => undefined);
  await p.waitForTimeout(2500);
  const nu = await sparAng(p);
  kolla("D: ett tryck på 'katt' skapar katten", nu.length === fore + 1 && nu.some((d) => d.kropp === "katt"), { antal: nu.length });
  await ctx.close();
});

// ---- E: sjön ----
await blok("E", async () => {
  for (const [namn, ord] of [["bläckfisk, säl, anka", ["en bläckfisk", "en säl", "en anka"]], ["sju vid sjön", ["en fisk", "en haj", "en delfin", "en narval", "en säl", "en bläckfisk", "en anka"]]]) {
    const { ctx, p } = await sida({ plats: "sjon" });
    await vakna(p, ord, 2000);
    await p.waitForTimeout(1500);
    const ang = await sparAng(p);
    const sjo = await p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}").platsSkapelser?.sjon ?? []);
    const alla = [...ang, ...sjo];
    const syn = await p.evaluate(() => window.__tredSyn ?? {});
    const pos = await p.evaluate(() => window.__tredPos ?? {});
    await bild(p, `p3-08-sjon-${ord.length}.png`);
    await ctx.close();
    const uid = (k) => alla.filter((d) => d.kropp === k).map((d) => d.uid).find((u) => syn[u]);
    const bf = uid("blackfisk");
    const r = bf ? syn[bf] : null;
    kolla(`E ${namn}: bläckfisken ryms i bild (vänsterkanten)`, !!r && r.x >= -3 && r.x + r.w <= 378, { r });
    const sal = uid("sal");
    const s = sal ? syn[sal] : null;
    const framfor = alla.filter((d) => d.uid !== sal && syn[d.uid] && pos[d.uid] && sal && pos[sal] && (pos[d.uid].z > pos[sal].z + 0.05 || d.kropp === "anka"));
    const vem = framfor.map((d) => ({ k: d.kropp, t: s ? tacker(syn[d.uid], s) : 1 })).filter((x) => x.t > 0.02);
    const tot = vem.reduce((a, x) => a + x.t, 0);
    kolla(`E ${namn}: sälen syns ≥ 80 % (ankan och de andra framför skymmer den inte)`, !!s && tot <= 0.2, { vem: vem.map((x) => `${x.k} ${Math.round(x.t * 100)} %`), s });
  }
});

// ---- F: byggnader och stora saker skymmer inte varandra; småsakernas storlek ----
const S = JSON.parse(fs.readFileSync("data/storlek.json", "utf8"));
const GRANS = 1 - ((S.bak?.max_skymd ?? 0.15) + 0.1);
await blok("F", async () => {
  const lag = [
    ["Doodles äng", ["slott", "sjukhus", "cirkus", "vaxthus"]],
    ["Doodles äng, omvänd", ["vaxthus", "cirkus", "sjukhus", "slott", "ko"]],
    ["fordon och möbler", ["buss", "traktor", "soffa", "slott", "sjukhus"]],
  ];
  for (const [namn, kroppar] of lag) {
    const { ctx, p } = await sida({ ang: kroppar.map((k, i) => sparad(`f-${i}-${k}`, k, 1000 + i)) });
    await p.waitForFunction((n) => Object.values(window.__tredSyn ?? {}).filter((x) => x.mesh > 0).length >= n, kroppar.length, { timeout: 20000 }).catch(() => undefined);
    await p.waitForTimeout(1200);
    const { syn, pos } = await p.evaluate(() => ({ syn: window.__tredSyn ?? {}, pos: window.__tredPos ?? {} }));
    await bild(p, `p3-09-byggnader-${namn.replace(/[^a-zåäö]+/gi, "-")}.png`);
    await ctx.close();
    const S2 = kroppar.map((k, i) => ({ k, uid: `f-${i}-${k}` })).filter((q) => syn[q.uid] && pos[q.uid]);
    const andel = {};
    for (const a of S2) {
      let t = 0;
      for (const b of S2) if (b !== a && pos[b.uid].z > pos[a.uid].z + 0.05) t += tacker(syn[b.uid], syn[a.uid]);
      andel[a.k] = Math.round(Math.max(0, 1 - t) * 100) / 100;
    }
    kolla(`F ${namn}: varje sak syns till minst ${Math.round(GRANS * 100)} % (ingen skymmer en annan för mycket)`, S2.length === kroppar.length && Object.values(andel).every((a) => a >= GRANS), { andel });
    if (kroppar.includes("slott") && kroppar.includes("sjukhus")) {
      const [s, h] = [syn[S2.find((q) => q.k === "slott").uid], syn[S2.find((q) => q.k === "sjukhus").uid]];
      kolla(`F ${namn}: slottet syns tydligt högre än sjukhuset (≥ 1,2 × höjden och överkanten ≥ 15 px högre)`, s.h >= 1.2 * h.h && s.y <= h.y - 15, { slott: { h: Math.round(s.h), y: Math.round(s.y) }, sjukhus: { h: Math.round(h.h), y: Math.round(h.y) } });
    }
  }
  // småsaker bredvid varandra: pucken är mindre än kaffekoppen (största måttet på skärmen och ytan)
  const smaa = ["puck", "kaffekopp", "kopp", "tallrik"];
  const { ctx, p } = await sida({ ang: smaa.map((k, i) => sparad(`s-${i}-${k}`, k, 1000 + i)) });
  await p.waitForFunction((n) => Object.values(window.__tredSyn ?? {}).filter((x) => x.mesh > 0).length >= n, smaa.length, { timeout: 20000 }).catch(() => undefined);
  await p.waitForTimeout(1200);
  const { syn, pos } = await p.evaluate(() => ({ syn: window.__tredSyn ?? {}, pos: window.__tredPos ?? {} }));
  await bild(p, "p3-10-smasaker.png");
  await ctx.close();
  const m = Object.fromEntries(smaa.map((k, i) => [k, syn[`s-${i}-${k}`] && { ...syn[`s-${i}-${k}`], z: pos[`s-${i}-${k}`]?.z ?? 0 }]));
  // jämförs på samma avstånd: skärmmåttet × (kamerans z 9,8 − sakens z) / 10
  const djup = (k) => (9.8 - m[k].z) / 10;
  const st = (k) => (m[k] ? Math.max(m[k].w, m[k].h) * djup(k) : 0);
  const yt = (k) => (m[k] ? m[k].w * m[k].h * djup(k) ** 2 : 0);
  kolla("F småsaker: pucken är mindre än kaffekoppen på skärmen (största måttet och ytan, på samma avstånd)", st("puck") > 0 && st("puck") < st("kaffekopp") && yt("puck") < yt("kaffekopp"), { puck: m.puck, kaffekopp: m.kaffekopp });
  kolla("F småsaker: alla syns (största måttet ≥ 24 px, som B6.6)", smaa.every((k) => m[k] && Math.max(m[k].w, m[k].h) >= 24), { storst: Object.fromEntries(smaa.map((k) => [k, m[k] ? Math.round(Math.max(m[k].w, m[k].h)) : 0])) });
});

kolla("inga sidfel", sidfel.length === 0, { sidfel: sidfel.slice(0, 5) });
await browser.close();
server.close();
const fel = steg.filter((s) => !s.ok);
console.log(JSON.stringify({ steg: steg.length, fel: fel.length, felsteg: fel.map((s) => s.namn) }, null, 1));
process.exit(fel.length ? 1 : 0);
