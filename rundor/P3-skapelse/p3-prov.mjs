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
//   D  Tolkningen ändrar aldrig barnets ord i tysthet: "en dansande banan" blir aldrig "ande"; "en blixtkatt" frågar "Menade du katt?";
//      "en röd sportbil" blir en sportbil och "en gul eld"/"en stor eld" en eld (Doodle r83a: biff/ubåt).
//   E  Sjön (Doodles fynd): bläckfisken ryms i bild och sälen skyms inte av ankan (B6.6:s synliga bredd per djup); Doodles kö
//      (r83a, nio skapelser): ankorna simmar på vattnet, var och en syns ≥ 1 − (max_skymd + 0,1) med guiden inräknad, och
//      inget djur är mindre än 0,9 × syn.min_px på skärmen (narvalen).
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
const STORLEK = JSON.parse(fs.readFileSync("data/storlek.json", "utf8"));
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
const kolla = (namn, ok, info = {}) => { steg.push({ namn, ok: !!ok, ...info }); console.error(`${ok ? "ok  " : "FEL "} ${namn}${ok ? "" : " " + JSON.stringify(info).slice(0, 1500)}`); };
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
  // Doodle r83a: "sportbil" blev en biff, "eld" en ubåt – varje ord som har en modell blir just den saken
  for (const [ord, ratt] of [["en röd sportbil", ["sportbil", "bil"]], ["en gul eld", ["eld"]], ["en stor eld", ["eld"]]]) {
    const n0 = (await sparAng(p)).length;
    await vakna(p, [ord], 2500);
    const ny = (await sparAng(p)).sort((a, b) => b.skapad - a.skapad);
    const sk = ny.length > n0 ? ny[0] : null;
    kolla(`D: '${ord}' blir ${ratt.join(" eller ")}`, !!sk && ratt.includes(sk.kropp), { kropp: sk?.kropp ?? null, formel: sk?.formel ?? null, antal: [n0, ny.length] });
  }
  await bild(p, "p3-07b-sportbil-eld.png");
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
    const framfor = alla.filter((d) => d.uid !== sal && syn[d.uid] && pos[d.uid] && sal && pos[sal] && (pos[d.uid].z > pos[sal].z + 0.05 || pos[d.uid].flyg));
    const vem = framfor.map((d) => ({ k: d.kropp, t: s ? tacker(syn[d.uid], s) : 1 })).filter((x) => x.t > 0.02);
    const tot = vem.reduce((a, x) => a + x.t, 0);
    kolla(`E ${namn}: sälen syns ≥ 80 % (ankan och de andra framför skymmer den inte)`, !!s && tot <= 0.2, { vem: vem.map((x) => `${x.k} ${Math.round(x.t * 100)} %`), s });
  }
  // Doodle r83a: hans kö vid sjön, skriven en i taget i spelet
  const KO = ["en blå anka", "en röd kanin", "en rosa häst", "en grön katt", "en regnbågsfärgad katt", "en blå jultomte", "en lila narval", "en röd katt", "en gul anka"];
  const { ctx, p } = await sida({ plats: "sjon" });
  await vakna(p, KO, 2200);
  await p.waitForTimeout(2500);
  const sjo = await p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}").platsSkapelser?.sjon ?? []);
  const syn = await p.evaluate(() => window.__tredSyn ?? {});
  const pos = await p.evaluate(() => window.__tredPos ?? {});
  const npc = await p.locator("[data-testid=npc-figur]").first().boundingBox().catch(() => null);
  await bild(p, "p3-08c-sjon-doodle-ko.png");
  await ctx.close();
  const SYNDATA = STORLEK.syn ?? {};
  const hinder = (SYNDATA.skarm_hinder ?? []).map((h) => ({ x: h.x0, y: h.y0, w: h.x1 - h.x0, h: h.y1 - h.y0 }));
  kolla("E r83a: guidens ruta i data ligger inom figuren på skärmen", !npc || hinder.every((h) => h.x >= npc.x - 2 && h.x + h.w <= npc.x + npc.width + 2 && h.y >= npc.y - 2 && h.y + h.h <= npc.y + npc.height + 2), { npc, hinder });
  const ankor = sjo.filter((d) => d.kropp === "anka");
  const anke = ankor.map((d) => ({ uid: d.uid, pos: pos[d.uid], r: syn[d.uid] }));
  kolla("E r83a: ankorna simmar på vattenytan (inte vid trädkanten)", ankor.length === 2 && anke.every((a) => a.pos && a.pos.sim && !a.pos.flyg && a.pos.y < 0.45 && a.r && a.r.y + a.r.h > 300), { anke });
  const kvar = sjo.filter((d) => syn[d.uid] && pos[d.uid] && !pos[d.uid].flyg);
  const lika = (a, b) => Math.abs(pos[a.uid].z - pos[b.uid].z) <= 0.05;
  const andel = kvar.map((d) => {
    const r = syn[d.uid];
    let t = hinder.reduce((a, h) => a + tacker(h, r), 0);
    const vem = [];
    for (const o of kvar) {
      if (o === d) continue;
      if (!(pos[o.uid].z > pos[d.uid].z + 0.05 || (lika(o, d) && Math.abs(pos[o.uid].x - pos[d.uid].x) < 0.5))) continue;
      const q = tacker(syn[o.uid], r);
      if (q > 0.02) vem.push(`${o.kropp} ${Math.round(q * 100)} %`);
      t += q;
    }
    return { k: d.kropp, syns: runda(1 - t), vem, px: Math.min(r.w, r.h) };
  });
  const GRANS_E = 1 - ((STORLEK.bak?.max_skymd ?? 0.15) + 0.1);
  kolla(`E r83a: ${kvar.length} skapelser vid sjön – var och en syns ≥ ${Math.round(GRANS_E * 100)} % (de framför och guiden inräknade)`, kvar.length >= 7 && andel.every((a) => a.syns >= GRANS_E), { andel: andel.filter((a) => a.syns < GRANS_E), antal: kvar.length, sjo: sjo.map((d) => d.kropp) });
  const MIN = Math.round((SYNDATA.min_px ?? 44) * 0.9);
  kolla(`E r83a: minsta synliga storlek – varje djur minst ${MIN} px på skärmen (narvalen)`, andel.every((a) => a.px >= MIN) && andel.some((a) => a.k === "narval"), { sma: andel.filter((a) => a.px < MIN), narval: andel.find((a) => a.k === "narval") });
});

// ---- F: byggnader och stora saker skymmer inte varandra; småsakernas storlek ----
const S = JSON.parse(fs.readFileSync("data/storlek.json", "utf8"));
const GRANS = 1 - ((S.bak?.max_skymd ?? 0.15) + 0.1);
const STORA = new Set(Object.keys(E).filter((k) => { if (E[k].typ === "djur") return false; const kl = S.ids?.[k] ?? S.kategori?.[E[k].kategori]; return kl && S.klasser[kl]?.zon === "bak"; }));
const FASTA = Object.fromEntries((S.bak?.fasta ?? []).map((f) => [f.namn, f]));
// Ängens fasta saker (spökhuset) har ingen __tredSyn; deras skärmruta räknas här ur data med den stående kameran
// (KameraRam: (0, 4,15, 9,8) mot (0, 1,05, −0,15), fov 58, 375 × 812) – en egen uträkning, oberoende av spelets kod.
function projicera(x, y, z) {
  const P = [0, 4.15, 9.8], M = [0, 1.05, -0.15], tan = Math.tan((58 * Math.PI) / 360), asp = 375 / 812;
  const n = (v) => { const l = Math.hypot(...v); return v.map((q) => q / l); };
  const F = n([M[0] - P[0], M[1] - P[1], M[2] - P[2]]);
  const R = n([-F[2], 0, F[0]]);
  const U = [R[1] * F[2] - R[2] * F[1], R[2] * F[0] - R[0] * F[2], R[0] * F[1] - R[1] * F[0]];
  const d = [x - P[0], y - P[1], z - P[2]];
  const dot = (a) => a[0] * d[0] + a[1] * d[1] + a[2] * d[2];
  const zc = dot(F);
  return [((dot(R) / (zc * tan * asp) + 1) / 2) * 375, ((1 - dot(U) / (zc * tan)) / 2) * 812];
}
function fastRuta(f) {
  const p = [];
  for (const dx of [-f.halv, f.halv]) for (const dz of [-(f.djup ?? f.halv), f.djup ?? f.halv]) for (const y of [0, f.hojd]) p.push(projicera(f.x + dx, y, f.z + dz));
  const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}
/** Synlig andel per sak: 1 − summan av vad de närmare kameran täcker (skärmrutor ur __tredSyn; fasta saker med sitt z ur data). */
function synligaAndelar(saker, syn, pos) {
  const alla = [...saker.map((q) => ({ ...q, z: pos[q.uid].z, r: syn[q.uid] })), ...Object.keys(FASTA).map((n) => ({ k: n, uid: n, z: FASTA[n].z, r: fastRuta(FASTA[n]), fast: true }))];
  const andel = {};
  for (const a of alla) {
    if (a.fast) continue;
    let t = 0;
    for (const b of alla) if (b !== a && b.z > a.z + 0.05) t += tacker(b.r, a.r);
    andel[a.k] = Math.round(Math.max(0, 1 - t) * 100) / 100;
  }
  return andel;
}
await blok("F", async () => {
  const lag = [
    ["Doodles äng", ["slott", "sjukhus", "cirkus", "vaxthus"]],
    ["Doodles äng, omvänd", ["vaxthus", "cirkus", "sjukhus", "slott", "ko"]],
    ["fordon och slott", ["traktor", "slott", "cirkus"]],
    ["buss, soffa och sjukhus", ["buss", "soffa", "sjukhus"]],
  ];
  for (const [namn, kroppar] of lag) {
    const { ctx, p } = await sida({ ang: kroppar.map((k, i) => sparad(`f-${i}-${k}`, k, 1000 + i)) });
    await p.waitForFunction((n) => Object.values(window.__tredSyn ?? {}).filter((x) => x.mesh > 0).length >= n, kroppar.length, { timeout: 20000 }).catch(() => undefined);
    await p.waitForTimeout(1200);
    const { syn, pos } = await p.evaluate(() => ({ syn: window.__tredSyn ?? {}, pos: window.__tredPos ?? {} }));
    await bild(p, `p3-09-byggnader-${namn.replace(/[^a-zåäö]+/gi, "-")}.png`);
    await ctx.close();
    // stora saker (storlek.json zon bak) och ängens fasta saker; djuren står framför och följer sina egna regler (C)
    const S2 = kroppar.map((k, i) => ({ k, uid: `f-${i}-${k}` })).filter((q) => STORA.has(q.k) && syn[q.uid] && pos[q.uid]);
    const andel = synligaAndelar(S2, syn, pos);
    kolla(`F ${namn}: varje sak syns till minst ${Math.round(GRANS * 100)} % (ingen skymmer en annan för mycket, spökhuset inräknat)`, S2.length === kroppar.filter((k) => STORA.has(k)).length && Object.values(andel).every((a) => a >= GRANS), { andel, rutor: Object.fromEntries([...S2.map((q) => [q.k, { ...syn[q.uid], vx: pos[q.uid].x, vz: pos[q.uid].z, k: pos[q.uid].k }]), ...Object.keys(FASTA).map((n) => [n, fastRuta(FASTA[n])])].map(([k, r]) => [k, Object.fromEntries(Object.entries(r).map(([a, v]) => [a, Math.round(v * 100) / 100]))])) });
    if (kroppar.includes("slott") && kroppar.includes("sjukhus")) {
      const [s, h] = [syn[S2.find((q) => q.k === "slott").uid], syn[S2.find((q) => q.k === "sjukhus").uid]];
      kolla(`F ${namn}: slottet syns tydligt högre än sjukhuset (≥ 1,2 × höjden och överkanten ≥ 10 px högre)`, s.h >= 1.2 * h.h && s.y <= h.y - 10, { slott: { h: Math.round(s.h), y: Math.round(s.y) }, sjukhus: { h: Math.round(h.h), y: Math.round(h.y) } });
    }
  }
  // sex byggnader skrivna i spelet, en i taget: ryms de inte somnar den äldsta stora saken (aldrig den nya), och alla som
  // står kvar syns till minst GRANS
  {
    const { ctx, p } = await sida({ ang: [sparad("f-katt", "katt", 1000)] });
    await vakna(p, ["ett slott", "ett sjukhus", "ett cirkustält", "ett växthus", "en skola", "en kyrka"], 2600);
    await p.waitForTimeout(1500);
    const ang = await sparAng(p);
    const { syn, pos } = await p.evaluate(() => ({ syn: window.__tredSyn ?? {}, pos: window.__tredPos ?? {} }));
    await bild(p, "p3-09-byggnader-sex-skrivna.png");
    await ctx.close();
    const S3 = ang.filter((d) => ["slott", "sjukhus", "cirkus", "vaxthus", "skola", "kyrka"].includes(d.kropp)).map((d) => ({ k: d.kropp, uid: d.uid })).filter((q) => syn[q.uid] && pos[q.uid]);
    const andel = synligaAndelar(S3, syn, pos);
    kolla(`F sex skrivna byggnader: de som står kvar syns till minst ${Math.round(GRANS * 100)} %, den senaste (kyrkan) står kvar och katten också`, S3.length >= 3 && Object.values(andel).every((a) => a >= GRANS) && ang.some((d) => d.kropp === "kyrka") && ang.some((d) => d.kropp === "katt"), { andel, kvar: ang.map((d) => d.kropp) });
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
