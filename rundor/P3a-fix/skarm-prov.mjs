// P3a-fix (Arkitekten, beslut A): skärmen är facit. Barnets ord skrivs ett i taget på varje plats (Doodles körningar
// 21 okt, ko-21okt/p3a/spela.mjs), och efter varje ord mäts synligheten i den riktiga renderingen med id-passet
// (window.__idPass, src/spel/ang/idpass.tsx). Varje skapelse ritas i en egen platt färg i samma kamera och storlek, och
// synliga pixlar räknas mot dess egen siluett. En vaken skapelse räknas som synlig bara om:
//   - högst 30 % är skymt (de tre nyaste) eller högst 45 % (äldre), och huvudet (siluettens övre halva) högst 10 %
//     (HUD-rutorna, guiden och Bengtsson räknas som skymmande);
//   - siluetten är helt i bild (når inte bildkanten);
//   - den når minsta storlek: B6.6:s golv (24 px / 4 px / 200 px²), det nya djuret ≥ 40 px och varje småsak i bild
//     ≥ 40 px på den kortaste ledden – en platt småsak (pucken) på den längsta.
// Dessutom gäller per ord: högst EN somnar, och varje somnad får en egen banner (beslut B). Platsens fasta saker
// (spökhuset, grinden) syns, räknat mot den tomma ängen: spökhuset ≥ 70 %, grinden ≥ 90 % (förbjuden zon, beslut D). Ängen med 10 skrivna ska ha
// minst 6 vakna och synliga.
// Kör: node rundor/P3a-fix/skarm-prov.mjs --dist dist-pages [--bilder DIR] [--bara ang,sjon,skogen,grottan,smasaker]
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { kameraFor, kroppMatt } from "../../src/spel/placering.ts";
import { platsMed } from "../../src/spel/platser.ts";
import { sakRuta } from "../../src/spel/skymning.ts";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const dist = path.resolve(arg("dist", "dist-pages"));
const bilder = arg("bilder", "");
if (bilder) fs.mkdirSync(bilder, { recursive: true });
const E = JSON.parse(fs.readFileSync("data/entiteter.json", "utf8")).entiteter;
const PLAC = fs.existsSync("data/placering.json") ? JSON.parse(fs.readFileSync("data/placering.json", "utf8")) : { skarm_reserverat: [] };
const S = JSON.parse(fs.readFileSync("data/storlek.json", "utf8"));
// en platt småsak (höjden under halva bredden i data/modellmatt.json: pucken) mäts på den längsta ledden, så att den förblir
// rimlig mot koppen (Arkitekten bör bekräfta tolkningen)
const MM = fs.existsSync("data/modellmatt.json") ? JSON.parse(fs.readFileSync("data/modellmatt.json", "utf8")).matt : {};
const platt = (k) => smasak(k) && !!MM[k] && MM[k][1] < 0.5 * Math.max(MM[k][0], MM[k][2]);
const smasak = (k) => { const e = E[k]; const [a, b] = S.smasak?.malhojd ?? [0.2, 0.5]; return !!e && e.typ !== "djur" && (e.malhojd ?? 1) >= a && (e.malhojd ?? 1) <= b; };
const byggnad = (k) => { const e = E[k]; if (!e || e.typ === "djur") return false; const id = S.ids?.[k] ?? S.kategori?.[e.kategori]; return S.klasser?.[id]?.zon === "bak"; };
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
// P3a-fix (Arkitekten 09:16): varje block får en egen webbläsare och sida – en krasch fäller inte resten
let browser = null;
const steg = [];
const sidfel = [];
const kolla = (namn, ok, info = {}) => { steg.push({ namn, ok: !!ok, ...info }); console.error(`${ok ? "ok  " : "FEL "} ${namn}${ok ? "" : " " + JSON.stringify(info).slice(0, 1500)}`); };
const PLATSER = ["skogen", "sjon", "grottan"];
const KOR = {
  ang: ["en katt", "en häst", "en elefant", "ett slott", "ett sjukhus", "en ko", "en kanin", "ett växthus", "en giraff", "en hund"],
  sjon: ["en anka", "en säl", "en bläckfisk", "en narval", "en katt", "en hund", "en häst", "en ko", "en giraff"],
  skogen: ["en kanin", "en katt", "en hund", "en häst", "en elefant", "en giraff", "en ko", "en anka", "ett slott"],
  grottan: ["en katt", "en elefant", "en hund", "en kanin", "en giraff", "en häst", "en ko", "en säl"],
  smasaker: ["en kaffekopp", "en puck", "en katt"],
};
const bara = arg("bara", Object.keys(KOR).join(",")).split(",");
// frön: 0 = Doodles ordning; andra frön blandar orden i samma lista (samma frö ger samma ordning). --varv N kör allt N gånger.
const FRON = arg("fron", "0").split(",").map(Number);
const VARV = Number(arg("varv", "1"));
const kalib = arg("kalib", ""); // jsonl: läget och id-passet för varje ord (rundor/P3a-fix/kalibrera.ts jämför med regeln)
if (kalib) fs.writeFileSync(kalib, "");
const blanda = (lista, fro) => {
  if (!fro) return lista;
  let a = fro >>> 0;
  const rnd = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const ut = [...lista];
  for (let i = ut.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ut[i], ut[j]] = [ut[j], ut[i]]; }
  return ut;
};
// felsökning: --ord "en katt,en hund" byter ordlistan för (den enda) platsen i --bara; --idbild DIR sparar id-passet
if (arg("ord", "")) KOR[bara[0]] = arg("ord", "").split(",");
const idbild = arg("idbild", "");
if (idbild) fs.mkdirSync(idbild, { recursive: true });
// minst så här många vakna och synliga när alla ord är skrivna (beslut B: ängen 10 skrivna → minst 6)
const KRAV = { ang: 6, sjon: 6, skogen: 6, grottan: 6, smasaker: 3 };
// Bengtsson mäts som han syns (nedan), inte som regelns ruta
const HUD = PLAC.skarm_reserverat.filter((r) => !String(r.namn).startsWith("bengtsson")).map((r) => ({ x: r.x0, y: r.y0, w: r.x1 - r.x0, h: r.y1 - r.y0 }));

async function sida(plats) {
  if (browser) await browser.close().catch(() => undefined);
  browser = await starta();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE" });
  await ctx.addInitScript((s) => {
    window.__tredSyn = {};
    window.__sovBanner = [];
    window.__allaBanner = [];
    const settA = new Set();
    new MutationObserver(() => { for (const e of document.querySelectorAll(".banner")) if (!settA.has(e)) { settA.add(e); window.__allaBanner.push(`${e.className}: ${(e.textContent || "").trim()}`); } }).observe(document, { childList: true, subtree: true });
    const sett = new Set();
    new MutationObserver(() => { for (const e of document.querySelectorAll(".banner.sov")) { const t = (e.textContent || "").trim(); const k = `${t}@${e.closest("[data-id]")?.getAttribute("data-id") ?? ""}`; if (t && !sett.has(e)) { sett.add(e); window.__sovBanner.push(t); } void k; } }).observe(document, { childList: true, subtree: true });
    if (!sessionStorage.getItem("p3fix")) { localStorage.setItem("trollpennan-v2", JSON.stringify(s)); sessionStorage.setItem("p3fix", "1"); }
  }, { version: 2, introSedd: true, dragit: true, ang: [], garden: [], stjarnor: 12, oppnadePlatser: PLATSER, seddaIntro: [...PLATSER, "garden", "gard"], platsSkapelser: {}, ...(plats === "ang" ? {} : { plats }) });
  const p = await ctx.newPage();
  const logg = [];
  p.on("pageerror", (e) => { sidfel.push(String(e.message ?? e).slice(0, 200)); logg.push(`pageerror: ${String(e.message ?? e).slice(0, 200)}`); });
  p.on("console", (m) => { if (m.type() === "error") logg.push(`console: ${m.text().slice(0, 200)}`); });
  p.on("requestfailed", (r) => logg.push(`requestfailed: ${r.url().slice(-80)} ${r.failure()?.errorText ?? ""}`));
  p.on("crash", () => logg.push("sidan kraschade (renderer crash)"));
  p.setDefaultTimeout(30000);
  const t0 = Date.now();
  await p.goto(URL0, { waitUntil: "domcontentloaded" });
  // orsaken till en timeout loggas: sidans läge, vilka krokar som finns, fel i konsolen och misslyckade hämtningar
  await p.waitForFunction(() => !!window.__troll && !!window.__idPass, null, { timeout: 60000 }).catch(async (e) => {
    const lage = await p.evaluate(() => ({ ready: document.readyState, troll: !!window.__troll, idPass: !!window.__idPass, canvas: document.querySelectorAll("canvas").length, text: (document.body?.innerText ?? "").slice(0, 120) })).catch((x) => ({ evaluate: String(x).slice(0, 120) }));
    const minne = await p.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null).catch(() => null);
    throw new Error(`sidan blev aldrig klar på ${Math.round((Date.now() - t0) / 1000)} s: ${JSON.stringify({ lage, minneMB: minne, webblasare: browser.isConnected(), logg: logg.slice(-8) })} (${String(e).split("\n")[0].slice(0, 80)})`);
  });
  await p.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => undefined);
  await p.waitForTimeout(1500);
  return { ctx, p };
}
const bild = async (p, n) => bilder && p.screenshot({ path: path.join(bilder, n), animations: "disabled", timeout: 45000 }).catch(() => undefined);
const lage = (p, plats) => p.evaluate((pl) => { const st = JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}"); const l = pl === "ang" ? st.ang ?? [] : st.platsSkapelser?.[pl] ?? []; return { lista: l.map((d) => ({ uid: d.uid, kropp: d.kropp, skapad: d.skapad })), sovande: (st.sovande ?? []).map((d) => d.uid), stall: (st.stall ?? []).map((d) => d.uid) }; }, plats);
/** Vänta tills den nya har landat: den har en modell, kamerans fokus är klart och kroppens ruta står still 500 ms. */
async function landat(p, uid) {
  await p.waitForFunction((u) => {
    const s = window.__tredSyn?.[u];
    const f = window.__tredFokus;
    if (!s || !(s.mesh > 0) || (f && f.fas && f.fas !== "klar")) { window.__landat = undefined; return false; }
    const nu = performance.now();
    const a = window.__landat;
    if (!a || a.u !== u || Math.abs(a.w - s.w) > 2 || Math.abs(a.h - s.h) > 2) { window.__landat = { u, w: s.w, h: s.h, t: nu }; return false; }
    return nu - a.t > 500;
  }, uid, { timeout: 25000, polling: 100 }).catch(() => undefined);
}
function bedom(lista, id, ny) {
  const ordning = [...lista].sort((a, b) => b.skapad - a.skapad);
  return ordning.map((d, i) => {
    const m = id[d.uid];
    const grans = i < 3 ? 0.7 : 0.55; // huvudet: godkänt vid 90 % i hela procent (Arkitekten 10:31: ≥ 90)
    if (!m || m.sil === 0) return { k: d.kropp, ok: false, varfor: "syns inte alls (ingen siluett)" };
    const syn = m.syn / m.sil;
    const huvud = m.silHuvud ? m.synHuvud / m.silHuvud : 1;
    const [w, h] = [m.x1 - m.x0, m.y1 - m.y0];
    const minst = smasak(d.kropp) ? 40 : d.uid === ny ? (E[d.kropp]?.typ === "djur" ? 40 : 24) : 0;
    const golv = Math.max(w, h) >= 24 && Math.min(w, h) >= 4 && w * h >= 200;
    const fel = [syn < grans && `syns ${Math.round(syn * 100)} % (< ${grans * 100} %)`, Math.round(huvud * 100) < 90 && `huvudet syns ${Math.round(huvud * 100)} %`, m.kant && "inte helt i bild", !golv && `för liten ${w}×${h}`, minst && (platt(d.kropp) ? Math.max(w, h) : Math.min(w, h)) < minst && `${platt(d.kropp) ? "längsta" : "kortaste"} ledden ${platt(d.kropp) ? Math.max(w, h) : Math.min(w, h)} px (< ${minst})`].filter(Boolean);
    return { k: d.kropp, ok: fel.length === 0, syn: Math.round(syn * 100) / 100, huvud: Math.round(huvud * 100) / 100, px: [w, h], ...(fel.length ? { varfor: fel.join(", ") } : {}) };
  });
}
const resultat = {};
const block = [];
for (let v = 1; v <= VARV; v++) for (const fro of FRON) for (const plats of bara) block.push({ v, fro, plats });
for (const { v, fro, plats: plats0 } of block) {
  const plats = plats0;
  const pl = plats === "smasaker" ? "ang" : plats;
  const ord = blanda(KOR[plats], fro);
  const tag = `${plats}${fro ? ` frö ${fro}` : ""}${VARV > 1 ? ` varv ${v}` : ""}`;
  const fil = `${plats}${fro ? `-f${fro}` : ""}${VARV > 1 ? `-v${v}` : ""}`;
  let ctx, p;
  try {
    ({ ctx, p } = await sida(pl));
    let forra = await lage(p, pl);
    // platsens fasta saker mäts mot den tomma platsen: det landskapet redan skymmer (träd, bildkanten) räknas inte
    const tom = await p.evaluate((hud) => window.__idPass(hud), HUD);
    let sista = null;
    let allaSomnade = 0;
    for (const [n, fras] of ord.entries()) {
      await p.evaluate((x) => window.__troll.vakna(x), fras);
      await p.waitForFunction(({ pl, n0 }) => { const st = JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}"); const l = pl === "ang" ? st.ang ?? [] : st.platsSkapelser?.[pl] ?? []; return l.length + (st.sovande ?? []).length > n0; }, { pl, n0: forra.lista.length + forra.sovande.length }, { timeout: 20000 }).catch(() => undefined);
      const nu = await lage(p, pl);
      const ny = [...nu.lista].sort((a, b) => b.skapad - a.skapad)[0];
      if (ny) await landat(p, ny.uid);
      await p.waitForTimeout(3200); // bannerkön: en somnad banner visas efter den förra (2,4 s + 0,2 s)
      if (await p.locator("[data-testid=stang-bok]").first().isVisible().catch(() => false)) { await p.click("[data-testid=stang-bok]"); await p.waitForTimeout(400); }
      // Bengtsson som han syns: bildens ogenomskinliga pixlar (rad för rad) och utropet – inte knappens hela ruta
      const npc = await p.evaluate(() => {
        const ut = [];
        for (const e of document.querySelectorAll("[data-testid=npc-figur]")) {
          const img = e.querySelector("img");
          for (const u of e.querySelectorAll(".npc-utrop")) { const r = u.getBoundingClientRect(); if (r.width) ut.push({ x: r.x, y: r.y, w: r.width, h: r.height }); }
          if (!img || !img.naturalWidth) { const r = e.getBoundingClientRect(); if (r.width) ut.push({ x: r.x, y: r.y, w: r.width, h: r.height }); continue; }
          const r = img.getBoundingClientRect();
          const k = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
          const [w, h] = [Math.round(img.naturalWidth * k), Math.round(img.naturalHeight * k)];
          const [x0, y0] = [r.x + (r.width - w) / 2, r.y + r.height - h];
          const c = document.createElement("canvas");
          [c.width, c.height] = [w, h];
          const g = c.getContext("2d");
          g.drawImage(img, 0, 0, w, h);
          const a = g.getImageData(0, 0, w, h).data;
          for (let y = 0; y < h; y++) {
            let start = -1;
            for (let x = 0; x <= w; x++) {
              const tat = x < w && a[(y * w + x) * 4 + 3] > 40;
              if (tat && start < 0) start = x;
              if (!tat && start >= 0) { ut.push({ x: x0 + start, y: y0 + y, w: x - start, h: 1 }); start = -1; }
            }
          }
        }
        return ut;
      });
      if (idbild) await p.evaluate(() => { window.__idPassBild = ""; });
      const id = await p.evaluate((hud) => window.__idPass(hud), [...HUD, ...npc]);
      if (kalib) fs.appendFileSync(kalib, JSON.stringify({ plats: pl, block: tag, n: n + 1, fras, st: await p.evaluate((x) => { const st = JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}"); return x === "ang" ? st.ang ?? [] : st.platsSkapelser?.[x] ?? []; }, pl), pos: await p.evaluate(() => window.__tredPos ?? {}), id }) + "\n");
      if (idbild) fs.writeFileSync(path.join(idbild, `id-${fil}-${String(n + 1).padStart(2, "0")}.png`), Buffer.from((await p.evaluate(() => window.__idPassBild)).split(",")[1] ?? "", "base64"));
      const somnade = nu.sovande.filter((u) => !forra.sovande.includes(u)).length + nu.stall.filter((u) => !forra.stall.includes(u)).length;
      const bann = await p.evaluate(() => window.__sovBanner.length);
      const b = bedom(nu.lista, id, ny?.uid);
      const namn = `S ${tag} ord ${n + 1} "${fras}"`;
      kolla(`${namn}: den nya syns (${ny?.kropp ?? "–"})`, !!ny && ny.kropp && b.find((q) => q.k === ny.kropp && q.ok) !== undefined && b[0]?.ok, { ny: b[0] });
      kolla(`${namn}: alla vakna syns på skärmen (${b.filter((q) => q.ok).length} av ${b.length})`, b.every((q) => q.ok), { daliga: b.filter((q) => !q.ok) });
      kolla(`${namn}: högst en somnar (${somnade})`, somnade <= 1, { somnade, bann });
      allaSomnade += somnade;
      const pos = await p.evaluate(() => window.__tredPos ?? {});
      const byggs = [...nu.lista].filter((d) => byggnad(d.kropp)).sort((a, c) => c.skapad - a.skapad);
      if (ny && byggnad(ny.kropp) && byggs[0]?.uid === ny.uid) {
        const y1 = id[ny.uid]?.y1 ?? 0;
        const bakom = byggs.slice(1).filter((d) => id[d.uid] && y1 < id[d.uid].y1);
        const platsObj = platsMed(pl);
        const kam = kameraFor(platsObj);
        const band = (PLAC.platser[pl] ?? PLAC.platser.standard).band.bak;
        const frontZ = band.z[1];
        const q = pos[ny.uid];
        const yHar = q ? sakRuta(q.x, q.z, 0.05, 0.05, 0.05, q.y || 0, kam).y1 : 0;
        const yRad = q ? sakRuta(q.x, frontZ - PLAC.steg.z, 0.05, 0.05, 0.05, 0, kam).y1 : 0;
        const inom = !!q && yHar >= yRad - 0.5;
        let holl = null;
        if (!inom && q) {
          const bm = kroppMatt({ kropp: ny.kropp, skala: q.k || 1 }, q.z, platsObj, "bak", 0);
          let bast = Infinity;
          for (const d of nu.lista) {
            if (byggnad(d.kropp)) continue;
            const o = pos[d.uid];
            if (!o) continue;
            const dm = kroppMatt({ kropp: d.kropp, skala: o.k || 1 }, o.z, platsObj, "mark", 0);
            if (Math.abs(o.x - q.x) >= dm.halv + bm.halv) continue;
            if (o.z >= frontZ + (PLAC.bak_lucka ?? 0.5)) continue;
            if (o.z < bast) { bast = o.z; holl = d.kropp; }
          }
        }
        kolla(`${namn}: nya byggnaden främst (${ny.kropp})`, bakom.length === 0 && inom, { bakom: bakom.map((d) => d.kropp), holl: inom ? undefined : (holl ?? "inget djur"), y1: Math.round(y1), yHar: Math.round(yHar), yRad: Math.round(yRad) });
      }
      if (pl === "ang" && n + 1 >= 5 && n + 1 <= 10) {
        for (const d of byggs.slice(0, 2)) {
          const m = id[d.uid];
          const syn = m?.sil ? m.syn / m.sil : 0;
          kolla(`${namn}: ${d.kropp} ≥ 90 % synlig (${Math.round(syn * 100)} %)`, syn >= 0.9, { syn });
        }
      }
      if (pl === "ang") for (const f of ["fast:spokhus", "fast:grind"]) {
        const [m, m0] = [id[f], tom[f]];
        const g = f === "fast:grind" ? 0.9 : 0.7;
        const syn = m && m0?.syn ? m.syn / m0.syn : 0;
        kolla(`${namn}: ${f.slice(5)} syns ≥ ${g * 100} % av sig själv på den tomma ängen (${Math.round(syn * 100)} %)`, syn >= g, { m, tom: m0 });
      }
      sista = { b, vakna: b.length, synliga: b.filter((q) => q.ok).length };
      forra = nu;
      if (n === 3 || n === 7 || n === ord.length - 1) await bild(p, `skarm-${fil}-${String(n + 1).padStart(2, "0")}.png`);
    }
    // bannerkön (samma kö som TTS-3) visar en i taget: vänta tills kön är tom (ingen banner på 1,5 s), högst 240 s – kön hinner bli lång när orden kommer tätt
    await p.waitForFunction(() => { const n = document.querySelectorAll(".banner").length; const t = performance.now(); if (n) window.__tomKo = undefined; else window.__tomKo ??= t; return !n && t - window.__tomKo > 1500; }, null, { timeout: 240000, polling: 200 }).catch(() => undefined);
    const sovB = await p.evaluate(() => window.__sovBanner.length);
    kolla(`S ${tag}: varje somnad fick en egen banner (${allaSomnade} somnade, ${sovB} banners)`, sovB >= allaSomnade, { allaSomnade, sovB, texter: await p.evaluate(() => window.__sovBanner), alla: await p.evaluate(() => window.__allaBanner.slice(-12)) });
    kolla(`S ${tag}: ${ord.length} skrivna ger minst ${KRAV[plats]} vakna och synliga (${sista?.synliga} synliga av ${sista?.vakna} vakna)`, (sista?.synliga ?? 0) >= KRAV[plats], { sista });
    resultat[tag] = sista;
  } catch (e) {
    kolla(`S ${tag}: block kraschade`, false, { fel: String(e).split("\n")[0].slice(0, 1200) });
  }
  await ctx?.close().catch(() => undefined);
  await browser?.close().catch(() => undefined);
  browser = null;
}
kolla("inga sidfel", sidfel.length === 0, { sidfel });
server.close();
const fel = steg.filter((s) => !s.ok);
console.log(JSON.stringify({ steg: steg.length, fel: fel.length, felsteg: fel.map((s) => s.namn), resultat }, null, 1));
process.exit(fel.length ? 1 : 0);
