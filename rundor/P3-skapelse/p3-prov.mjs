#!/usr/bin/env node
// P3a – placeringsregeln: skapelsen syns. Playwright 375x812 (swiftshader). Arkitektens prov, ändrar inget.
//   node rundor/P3-skapelse/p3-prov.mjs [--dist dist-pages] [--bilder <mapp>] [--bara C,P,K,T,F]
// Exit 0 = alla steg gröna. Steg på stderr ("ok  " / "FEL "), sammanfattning (JSON) på stdout.
// (Kläderna, A–B, och tolkningen, D, flyttas till P3b.)
//   C  Landning: efter fem djur landar "en katt" (och "en elefant", "en gul fisk" i dammen) framme, syns ≥ 80 % och ingen
//      skymmer den; kameran går in mot den (window.__tredFokus) och tillbaka.
//   P  P3a – EN placeringsregel (data/placering.json): på ängen, sjön, skogen och grottan, 8 djur/saker med tre fasta frön,
//      blandade storlekar och två värsta fall (bara jättar; åtta katter) och Doodles lag: varje vaken skapelse syns till minst
//      1 − (gräns + 0,1) av sin ritade ruta – gränsen 20 % för de tre nyaste och platsens fasta saker, 35 % för äldre (de
//      framför, Bengtsson-figuren mätt i DOM:en och de reserverade rutorna inräknade) – och huvudet (övre halvan) är fritt
//      (högst 0,1 mätmarginal); den nya står kvar, allt ryms i bild, simmare på vattnet, flygare i luften.
//      Kapaciteten (Arkitekten 18:59): ängen och sjön minst 6 vakna av 8 för blandade storlekar och alla frön utom fro11,
//      8 av 8 katter, minst 5 för bara jättar/monster (fro11, bara jättar).
//   K  Ankan på ängen (Doodle 18:46): den simmar i dammen och svävar aldrig; en fisk på ängen simmar också i dammen.
//   T  Titelbilden ("Fortsätt") visar bara det senaste djuret: utsnittet följer djurets ritade kropp.
//   F  Storlekar: slottet syns tydligt högre än sjukhuset; småsaker har rimlig inbördes storlek (pucken mindre än kaffekoppen).
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const dist = path.resolve(arg("dist", "dist-pages"));
const bilder = arg("bilder", "");
const bara = (arg("bara", "C,P,K,T,F") ?? "").split(",");
if (bilder) fs.mkdirSync(bilder, { recursive: true });
const E = JSON.parse(fs.readFileSync("data/entiteter.json", "utf8")).entiteter;
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

async function sida(spar, { touch = false, titel = false } = {}) {
  if (!browser.isConnected()) browser = await starta();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE", hasTouch: touch, isMobile: touch });
  if (titel) await ctx.addInitScript(() => sessionStorage.setItem("p2-titel-prov", "1"));
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
  const iBild = tacktAv(r, [], true) <= 0.1; // minst 90 % av den ritade kroppen i bild
  let tackt = 0;
  const vem = [];
  for (const d of ang) {
    if (d.uid === ny.uid || !syn[d.uid] || !pos[d.uid]) continue;
    if (pos[d.uid].z <= pos[ny.uid].z + 0.05) continue; // bara de som står närmare kameran
    const t = tacker(syn[d.uid], r);
    if (t > 0.02) vem.push(`${d.kropp} ${Math.round(t * 100)} %`);
    tackt += t;
  }
  kolla(`C ${namn}: ${kropp} ryms i bilden (≥ 90 %)`, iBild, { r });
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

// ---- P: EN placeringsregel för alla platser (P3a, data/placering.json) ----
// Per plats (ängen, sjön, skogen, grottan): tre fasta frön och det värsta fallet. Sju skapelser ligger sparade, den
// åttonde skrivs i spelet (då går de som inte ryms till stallet, som i spelet). Mäts på skärmen: den ritade kroppen
// (window.__tredSyn), djupet (window.__tredPos), Bengtsson-figuren (mätt i DOM:en), de reserverade rutorna ur data och
// ängens fasta saker (spökhuset, dammen) räknade ur data med den stående kameran.
// på main (före P3) finns ingen placering.json: samma tal som patchen, så att provet kan köras där och faller på riktigt
const PLAC = fs.existsSync("data/placering.json") ? JSON.parse(fs.readFileSync("data/placering.json", "utf8")) : { max_skymd: 0.2, max_skymd_aldre: 0.35, nya_antal: 3, huvud_skymd: 0, platser: {}, skarm_reserverat: [{ namn: "utgangar", x0: 0, y0: 0, x1: 375, y1: 112 }, { namn: "guiden", x0: 12, y0: 112, x1: 363, y1: 150 }, { namn: "bengtsson", x0: 30, y0: 494, x1: 140, y1: 738 }, { namn: "nedre-raden", x0: 0, y0: 744, x1: 375, y1: 812 }] };
const GRANS = 1 - (PLAC.max_skymd + 0.1); // modellens verkliga form mot den räknade rutan: 0,1 marginal (som B6.6/P3)
const GRANS_ALDRE = 1 - ((PLAC.max_skymd_aldre ?? PLAC.max_skymd) + 0.1);
const NYA_ANTAL = PLAC.nya_antal ?? 8;
const HUVUD = (PLAC.huvud_skymd ?? 1) + 0.1;
// kapacitetskravet (Arkitekten 18:59), vakna av 8 på ängen och sjön
const KRAV = { fro11: 5, "varst-stora": 5, "varst-katter": 8 };
const kravFor = (namn) => KRAV[namn] ?? 6;
function slump(fro) {
  let a = fro >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const MED_MODELL = Object.keys(E).filter((k) => E[k].modell && E[k].typ !== "tillbehor").sort();
const DJUR = MED_MODELL.filter((k) => E[k].typ === "djur");
function lagFor(fro) {
  const r = slump(fro);
  return Array.from({ length: 8 }, (_, i) => { const pool = i % 4 === 3 ? MED_MODELL : DJUR; return pool[Math.floor(r() * pool.length)]; });
}
const LAG = [["fro11", lagFor(11)], ["fro2026", lagFor(2026)], ["fro4242", lagFor(4242)], ["blandad", ["elefant", "hund", "katt", "häst", "kanin", "giraff", "gris", "ko"]], ["varst-stora", ["elefant", "giraff", "slott", "valfisk", "dinosaurie", "häst", "ko", "elefant"]], ["varst-katter", Array(8).fill("katt")]];
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
/** Täckt andel av b: unionen av rutorna (rutnät 2 px), inte summan – två som täcker samma bit räknas en gång. */
function tacktAv(b, fram, ram = false) {
  const f = fram.filter((r) => tacker(r, b) > 0);
  const ute = (x, y) => ram && (x < 0 || x > 375 || y < 0 || y > 812);
  if ((!f.length && !ram) || b.w <= 0 || b.h <= 0) return 0;
  let n = 0, t = 0;
  for (let y = b.y + 1; y < b.y + b.h; y += 2) for (let x = b.x + 1; x < b.x + b.w; x += 2) { n++; if (ute(x, y) || f.some((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)) t++; }
  return n ? t / n : 0;
}
const RESERVERAT = PLAC.skarm_reserverat.map((r) => ({ namn: r.namn, x: r.x0, y: r.y0, w: r.x1 - r.x0, h: r.y1 - r.y0 }));
async function platsProv(plats, namn, kroppar) {
  const pre = kroppar.slice(0, 7).map((k, i) => sparad(`p-${plats}-${namn}-${i}`, k, 1000 + i));
  const spar = plats === "ang" ? { ang: pre } : { plats, ang: [], platsSkapelser: { [plats]: pre } };
  const { ctx, p } = await sida(spar);
  const sista = kroppar[7];
  await vakna(p, [`en ${E[sista]?.ord?.[0] ?? sista}`], 2600);
  await p.waitForTimeout(1500);
  const st = await p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}"));
  const lista = plats === "ang" ? (st.ang ?? []) : (st.platsSkapelser?.[plats] ?? []);
  const { syn, pos } = await p.evaluate(() => ({ syn: window.__tredSyn ?? {}, pos: window.__tredPos ?? {} }));
  // Bengtsson hoppar (.npc-figur.nytt: translateY upp till −8 px). Figurens ruta = layoutrutan utan hoppet (det är den
  // data/placering.json beskriver: left 4, bottom 74, höjd 30vh); för skymningen räknas hoppet med (8 px uppåt).
  const npc = await p.evaluate(() => {
    const el = document.querySelector("[data-testid=npc-figur]");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const t = getComputedStyle(el).transform;
    const m = t && t !== "none" ? new DOMMatrixReadOnly(t) : null;
    return { x: r.x - (m?.m41 ?? 0), y: r.y - (m?.m42 ?? 0), width: r.width, height: r.height, hopp: 8 };
  }).catch(() => null);
  await bild(p, `p3-08-${plats}-${namn}.png`);
  await ctx.close();
  const ny = [...lista].sort((a, b) => b.skapad - a.skapad)[0];
  const kvar = lista.filter((d) => syn[d.uid] && syn[d.uid].mesh > 0 && pos[d.uid]);
  const fasta = (PLAC.platser[plats]?.fasta ?? []).map((f) => ({ k: `fast:${f.namn}`, z: f.z, r: fastRuta(f), plan: !!f.plan }));
  const reserv = RESERVERAT.filter((r) => r.namn !== "bengtsson" || !npc).concat(npc ? [{ namn: "bengtsson", x: npc.x + npc.width * 0.18, y: npc.y - npc.hopp, w: npc.width * 0.64, h: npc.height + npc.hopp }] : []);
  const saker = kvar.map((d) => ({ k: d.kropp, uid: d.uid, z: pos[d.uid].z, r: syn[d.uid], sim: !!pos[d.uid].sim, flyg: !!pos[d.uid].flyg, y: pos[d.uid].y ?? 0 }));
  const andel = [];
  const ordning = [...lista].sort((a, b) => b.skapad - a.skapad).map((d) => d.uid);
  for (const a of [...saker, ...fasta]) {
    const fram = [...reserv, ...saker.filter((b) => b !== a && b.z > a.z + 0.05 && !(a.plan && (b.sim || b.flyg)) && !b.plan).map((b) => b.r)];
    const grans = !a.uid || ordning.indexOf(a.uid) < NYA_ANTAL ? GRANS : GRANS_ALDRE;
    const huvud = a.plan ? 0 : tacktAv({ ...a.r, h: a.r.h / 2 }, fram.filter((r) => r !== undefined), true);
    andel.push({ k: a.k, syns: runda(1 - tacktAv(a.r, fram, true)), grans: runda(grans), huvud: runda(huvud), z: runda(a.z) });
  }
  const daliga = andel.filter((a) => a.syns < a.grans);
  kolla(`P ${plats} ${namn}: ${kvar.length} vakna av ${kroppar.length} – var och en syns ≥ ${Math.round(GRANS * 100)} % (de ${NYA_ANTAL} nyaste, platsens fasta saker) eller ≥ ${Math.round(GRANS_ALDRE * 100)} % (äldre); skymt eller utanför bilden räknas bort`, daliga.length === 0 && kvar.length >= 1, { daliga, kvar: kvar.map((d) => d.kropp), sovande: kroppar.length - lista.length });
  const huvudSkymt = andel.filter((a) => a.huvud > HUVUD);
  kolla(`P ${plats} ${namn}: inget huvud skyms (övre halvan av den ritade rutan, högst ${Math.round(HUVUD * 100)} % med mätmarginal)`, huvudSkymt.length === 0, { huvudSkymt });
  if (plats === "ang" || plats === "sjon") kolla(`P ${plats} ${namn}: kapacitet – minst ${kravFor(namn)} vakna av 8 (Arkitekten 18:59)`, kvar.length >= kravFor(namn), { vakna: kvar.length });
  const nySyn = ny && saker.find((s) => s.uid === ny.uid);
  kolla(`P ${plats} ${namn}: den nya (${sista}) står kvar och syns`, !!nySyn && ny.kropp === sista, { ny: ny?.kropp, syns: andel.find((a) => a.k === ny?.kropp) });
  // utanför bilden räknas som skymt i andelen ovan; här: ingen står till största delen utanför
  const halvUte = saker.filter((s) => tacktAv(s.r, [], true) > 0.5);
  kolla(`P ${plats} ${namn}: ingen står till största delen utanför bilden`, halvUte.length === 0, { ute: halvUte.map((s) => ({ k: s.k, r: s.r })) });
  const fel = saker.filter((s) => (s.sim && (s.flyg || s.y > 0.45)) || (s.flyg && s.y < 1));
  kolla(`P ${plats} ${namn}: simmare på vattenytan, flygare i luften`, fel.length === 0, { fel: fel.map((s) => ({ k: s.k, y: s.y, sim: s.sim, flyg: s.flyg })) });
  if (npc) kolla(`P ${plats} ${namn}: Bengtssons ruta i data ligger inom figuren på skärmen`, (() => { const b = PLAC.skarm_reserverat.find((r) => r.namn === "bengtsson"); return b.x0 >= npc.x - 2 && b.x1 <= npc.x + npc.width + 2 && b.y0 >= npc.y - 2 && b.y1 <= npc.y + npc.height + 2; })(), { npc });
  return { vakna: kvar.length, av: kroppar.length };
}
await blok("P", async () => {
  const kapacitet = {};
  for (const plats of ["ang", "sjon", "skogen", "grottan"]) for (const [namn, kroppar] of LAG) kapacitet[`${plats}/${namn}`] = await platsProv(plats, namn, kroppar);
  // Doodles ängar (15:35) och hans kö vid sjön (16:20)
  kapacitet["ang/doodle-byggnader"] = await platsProv("ang", "doodle-byggnader", ["slott", "sjukhus", "cirkus", "vaxthus", "ko", "katt", "hund", "kanin"]);
  kapacitet["sjon/doodle-ko"] = await platsProv("sjon", "doodle-ko", ["anka", "kanin", "häst", "katt", "katt", "jultomte", "narval", "anka"]);
  kolla("P: kapacitet per plats (vakna av 8)", true, { kapacitet });
  fs.writeFileSync(path.join(bilder || ".", "p3-kapacitet.json"), JSON.stringify(kapacitet, null, 1));
});

// ---- K: ankan på ängen simmar i dammen och svävar aldrig (Doodle 18:46) ----
await blok("K", async () => {
  const DAMM = { x: 1.12, z: -0.35, r: 0.76 }; // ängens damm (data/placering.json fasta)
  for (const [namn, fore, ny] of [["anka", ["hund", "katt", "kanin"], "anka"], ["anka och fisk", ["fisk", "hund", "katt"], "anka"], ["fisk", ["hund", "katt", "kanin"], "fisk"]]) {
    const { ctx, p } = await sida({ ang: fore.map((k, i) => sparad(`k-${namn}-${i}`, k, 1000 + i)) });
    await vakna(p, [`en ${ny}`], 2600);
    await p.waitForTimeout(1500);
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}"));
    const pos = await p.evaluate(() => window.__tredPos ?? {});
    await bild(p, `p3-12-ang-${namn.replace(/ /g, "-")}.png`);
    await ctx.close();
    for (const d of (st.ang ?? []).filter((d) => d.kropp === "anka" || d.kropp === "fisk")) {
      const q = pos[d.uid];
      const iDammen = !!q && Math.hypot(q.x - DAMM.x, q.z - DAMM.z) < DAMM.r;
      kolla(`K ${namn}: ${d.kropp} simmar i dammen (på vattenytan, aldrig i luften)`, !!q && q.sim && !q.flyg && q.y <= 0.45 && iDammen, { pos: q });
    }
    const sov = (st.sovande ?? []).filter((d) => d.kropp === "anka" || d.kropp === "fisk").map((d) => d.kropp);
    kolla(`K ${namn}: den nya (${ny}) står kvar på ängen`, (st.ang ?? []).some((d) => d.kropp === ny && !d.uid.startsWith("k-")), { sover: sov });
  }
});

// ---- T: titelbildens utsnitt visar bara det senaste djuret ----
await blok("T", async () => {
  const djur = ["hund", "gris", "ko", "katt", "häst", "kanin"];
  const { ctx, p } = await sida({ ang: djur.map((k, i) => sparad(`t-${i}-${k}`, k, 1000 + i)) }, { titel: true });
  await p.waitForSelector("[data-testid=titel]", { timeout: 20000 }).catch(() => undefined);
  await p.waitForSelector("canvas.titel-bild.klar", { timeout: 15000 }).catch(() => undefined);
  await p.waitForTimeout(600);
  const ut = await p.evaluate(() => { const c = document.querySelector("canvas.titel-bild"); return c ? { utsnitt: c.dataset.utsnitt ?? null, klar: c.classList.contains("klar") } : null; });
  const syn = await p.evaluate(() => window.__tredSyn ?? {});
  await bild(p, "p3-11-titel.png");
  if (bilder) await p.locator("canvas.titel-bild").first().screenshot({ path: path.join(bilder, "p3-11b-titel-utsnitt.png") }).catch(() => undefined);
  await ctx.close();
  const sist = "t-5-kanin";
  const r = syn[sist];
  const [x, y, w, h] = (ut?.utsnitt ?? "").split(",").map(Number);
  const u = ut?.utsnitt ? { x, y, w, h } : null;
  const inne = u && r ? tacker(u, r) : 0;
  const andra = u ? tacktAv(u, djur.slice(0, 5).map((k, i) => syn[`t-${i}-${k}`]).filter(Boolean)) : 1;
  kolla("T: titelbildens utsnitt följer det senaste djuret (kaninen ryms i utsnittet)", !!ut?.klar && inne >= 0.95, { ut, r, inne: runda(inne) });
  kolla("T: utsnittet visar bara det senaste djuret (andra djur täcker ≤ 25 % av utsnittet, utsnittet ≤ 1,6 × kroppen)", !!u && !!r && andra <= 0.25 && u.w * u.h <= 1.6 * r.w * r.h, { andra: runda(andra), u, r });
});

// ---- F: storlekar (slottet större än sjukhuset, småsakerna) ----
await blok("F", async () => {
  {
    const kroppar = ["slott", "sjukhus"];
    const { ctx, p } = await sida({ ang: kroppar.map((k, i) => sparad(`f-${i}-${k}`, k, 1000 + i)) });
    await p.waitForFunction((n) => Object.values(window.__tredSyn ?? {}).filter((x) => x.mesh > 0).length >= n, kroppar.length, { timeout: 20000 }).catch(() => undefined);
    await p.waitForTimeout(1200);
    const { syn, pos } = await p.evaluate(() => ({ syn: window.__tredSyn ?? {}, pos: window.__tredPos ?? {} }));
    await bild(p, "p3-09-slott-sjukhus.png");
    await ctx.close();
    const [s, h] = [syn["f-0-slott"], syn["f-1-sjukhus"]];
    // jämförs på samma avstånd och i full storlek: skärmhöjden × (kamerans z 9,8 − z) / 10 / krympningen (den äldre ritas
    // mindre som perspektiv, Arkitekten 18:59 – det är inte modellens storlek)
    const pa = (q, uid) => (q ? q.h * (9.8 - (pos[uid]?.z ?? 0)) / 10 / (pos[uid]?.k ?? 1) : 0);
    kolla("F: slottet syns tydligt högre än sjukhuset (≥ 1,2 × höjden på samma avstånd)", !!s && !!h && pa(s, "f-0-slott") >= 1.2 * pa(h, "f-1-sjukhus"), { slott: s, sjukhus: h, z: [pos["f-0-slott"]?.z, pos["f-1-sjukhus"]?.z], k: [pos["f-0-slott"]?.k, pos["f-1-sjukhus"]?.k] });
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
