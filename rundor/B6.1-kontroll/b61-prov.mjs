// B6.1: kontroll och buggfix, Playwright 375x812 mot dist-pages.
//   U  obelyst GLB (KHR_materials_unlit, som Kenneys original) + Guldord-glans → inget sidfel
//   S  "Till stallet" ligger i UI-raden, aldrig över djuret/humörikonen; ett nytt tryck på djuret stallar inte
//   G  bokens gåta tar platsens egna djur först, och "Ny gåta" stannar bland dem
//   K  tackbubblan krockar inte med banderollen ("Guldord!", "+1 stjärna!") eller en annan bubbla
//   E  stora saker (skyskrapa, slott, ufo, grävmaskin) står längst bak under ett tak och skymmer inget djur
//   F  "en regnbåge" (känt ord utan modell) ger en synlig banderoll och boken stängs
//   P  alla fyra platser: res dit på kartan, lös ett uppdrag, stall + hämta ut, gåva → tack
//   node rundor/B6.1-kontroll/b61-prov.mjs --bilder <mapp>   (exit 0 = alla steg gröna; kräver npm run build:pages)
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const dist = path.resolve(arg("dist", "dist-pages"));
const bilder = arg("bilder", "");
const bara = arg("bara", "U,S,G,K,E,F,P").split(",");
if (bilder) fs.mkdirSync(bilder, { recursive: true });
const BENGT = JSON.parse(fs.readFileSync("data/bengtsson.json", "utf8"));
const PLATSDATA = JSON.parse(fs.readFileSync("data/platser.json", "utf8"));
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };

/** Gör om en GLB till "obelyst" som Kenneys original: KHR_materials_unlit på varje material (det GLTFLoader gör MeshBasicMaterial av). */
function obelyst(glb) {
  const jsonLen = glb.readUInt32LE(12);
  const json = JSON.parse(glb.subarray(20, 20 + jsonLen).toString("utf8").replace(/\0+$/, "").trimEnd());
  for (const m of json.materials ?? []) m.extensions = { ...(m.extensions ?? {}), KHR_materials_unlit: {} };
  json.extensionsUsed = [...new Set([...(json.extensionsUsed ?? []), "KHR_materials_unlit"])];
  let jb = Buffer.from(JSON.stringify(json), "utf8");
  if (jb.length % 4) jb = Buffer.concat([jb, Buffer.alloc(4 - (jb.length % 4), 0x20)]);
  const resten = glb.subarray(20 + jsonLen);
  const head = Buffer.alloc(20);
  head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(20 + jb.length + resten.length, 8);
  head.writeUInt32LE(jb.length, 12); head.writeUInt32LE(0x4e4f534a, 16);
  return Buffer.concat([head, jb, resten]);
}
const OBELYST_PAPPA = obelyst(fs.readFileSync(path.join(dist, "models/bulk/pappa.glb")));
let obelystHamtad = 0;
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (u.endsWith("/models/bulk/pappa.glb")) { obelystHamtad++; res.setHeader("Content-Type", mime[".glb"]); res.end(OBELYST_PAPPA); return; }
  let f = path.join(dist, u);
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
async function sida(spar) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, locale: "sv-SE" });
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
async function blok(id, fn) { if (!bara.includes(id[0])) return; try { await fn(); } catch (e) { kolla(`block ${id} kraschade`, false, { fel: String(e).split("\n")[0] }); } }
const bild = async (p, n) => bilder && p.screenshot({ path: path.join(bilder, n), animations: "disabled", timeout: 45000 }).catch(() => undefined);
const sparat = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}"));
const synlig = (p, s) => p.locator(s).first().isVisible().catch(() => false);
async function malAv(p, uid) {
  for (let i = 0; i < 15; i++) { const m = await p.evaluate((u) => window.__tredMal?.[u] ?? null, uid); if (m) return m; await p.waitForTimeout(400); }
  return null;
}
async function nyttDjur(p, plats, fras) {
  await p.evaluate((f) => window.__troll.vakna(f), fras);
  await p.waitForTimeout(2800);
  const s = await sparat(p);
  return plats === "ang" ? s.ang?.at(-1)?.uid : s.platsSkapelser?.[plats]?.at(-1)?.uid;
}
async function stangBok(p) { if (await synlig(p, "[data-testid=stang-bok]")) { await p.click("[data-testid=stang-bok]"); await p.waitForTimeout(400); } }
/** Trycker där djuret står tills `sel` syns. Ger trycket (x, y) eller null. */
async function tryckTills(p, uid, sel) {
  for (const dy of [40, 55, 25, 70, 10]) {
    const m = await malAv(p, uid);
    if (!m) return null;
    await p.mouse.click(m.x, m.y + dy);
    await p.waitForTimeout(700);
    if (await synlig(p, sel)) return { x: m.x, y: m.y + dy };
  }
  return null;
}
const iStallet = async (p, uid) => !!(await sparat(p)).stall?.find((d) => d.uid === uid);
const ruta = (p, s) => p.locator(s).first().boundingBox().catch(() => null);
const krockar = (a, b) => !!a && !!b && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
async function tillKartan(p) {
  await stangBok(p);
  await p.click("[data-testid=meny]"); await p.waitForTimeout(300);
  await p.click("[data-testid=ut-pa-aventyr]"); await p.waitForSelector("[data-testid=karta]"); await p.waitForTimeout(400);
}
async function resTill(p, id) {
  await tillKartan(p);
  await p.click(`[data-testid=plats-${id}]`);
  await p.waitForFunction((x) => document.querySelector("[data-testid=angen-3d]")?.getAttribute("data-plats") === x, id, { timeout: 15000 }).catch(() => undefined);
  await p.waitForTimeout(2500);
  return p.getAttribute("[data-testid=angen-3d]", "data-plats").catch(() => null);
}

// U: Kenneys obelysta material (KHR_materials_unlit) + Guldord → glans. Förut: "Cannot read properties of undefined (reading 'value')".
await blok("U", async () => {
  const fore = fel.length;
  const { ctx, p } = await sida({});
  const banners = [];
  const stopp = setInterval(() => p.locator(".banderoller").innerText().then((t) => t && banners.push(t)).catch(() => undefined), 150);
  await p.evaluate(() => window.__troll.vakna("en pappa"));
  await p.waitForTimeout(5000);
  clearInterval(stopp);
  const s = await sparat(p);
  kolla("U pappa-modellen hämtades som obelyst GLB", obelystHamtad >= 1, { obelystHamtad });
  kolla("U en pappa skapades", s.ang?.at(-1)?.kropp === "pappa", { kropp: s.ang?.at(-1)?.kropp });
  kolla("U Guldord visades (glansen slås på)", banners.some((b) => /Guldord/.test(b)), { banners: [...new Set(banners)].slice(0, 4) });
  kolla("U inget sidfel med obelyst material + glans", fel.length === fore, { fel: fel.slice(fore, fore + 3) });
  const uid = s.ang?.at(-1)?.uid;
  kolla("U pappan syns i 3D (har ett skärmläge)", !!(await malAv(p, uid)));
  await bild(p, "b61-U-obelyst-pappa.png");
  await ctx.close();
});

// S: "Till stallet" i UI-raden; ett nytt tryck på djuret stallar inte.
for (const plats of ["ang", "sjon"]) {
  await blok(`S-${plats}`, async () => {
    const { ctx, p } = await sida({ plats });
    const uid = await nyttDjur(p, plats, "en räv");
    await stangBok(p);
    await p.evaluate((u) => window.__troll.humor(u, "glad"), uid);
    await p.waitForTimeout(400);
    const tryck = await tryckTills(p, uid, "[data-testid=djur-till-stall]");
    kolla(`S ${plats}: Till stallet syns efter tryck på djuret`, !!tryck);
    const chip = await ruta(p, "[data-testid=djur-till-stall]");
    const bok = await ruta(p, "[data-testid=pennans-bok]");
    const ikon = await ruta(p, ".humor-ikon-3d");
    const m = await malAv(p, uid);
    const djur = m && { x: m.x - 45, y: m.y - 20, width: 90, height: 130 };
    kolla(`S ${plats}: knappen ligger i nedersta UI-raden`, !!chip && chip.y + chip.height <= 812 && chip.y >= 812 - 120, { chip });
    kolla(`S ${plats}: knappen krockar inte med Pennans bok`, !!chip && !!bok && !krockar(chip, bok), { chip, bok });
    kolla(`S ${plats}: knappen ligger inte över djuret`, !!chip && !!djur && !krockar(chip, djur), { chip, djur });
    kolla(`S ${plats}: knappen ligger inte över humörikonen`, !ikon || !krockar(chip, ikon), { chip, ikon });
    await bild(p, `b61-S-${plats}-chip.png`);
    // samma ställe igen, som ett barn som trycker en gång till på djuret
    await p.mouse.click(tryck.x, tryck.y); await p.waitForTimeout(700);
    await p.mouse.click(tryck.x, tryck.y); await p.waitForTimeout(700);
    kolla(`S ${plats}: två nya tryck på djuret stallar det inte`, !(await iStallet(p, uid)));
    if (!(await synlig(p, "[data-testid=djur-till-stall]"))) await tryckTills(p, uid, "[data-testid=djur-till-stall]");
    await p.click("[data-testid=djur-till-stall]"); await p.waitForTimeout(900);
    kolla(`S ${plats}: knappen stallar djuret`, await iStallet(p, uid));
    await ctx.close();
  });
}

// G: gåtan på platsen
for (const plats of PLATSER) {
  await blok(`G-${plats}`, async () => {
    const egna = PLATSDATA.platser.find((x) => x.id === plats)?.hemliga ?? [];
    // en gåta från ängen ligger kvar sedan förut (gataId), som när barnet kommer resande
    const { ctx, p } = await sida({ plats, gataId: "katt" });
    await p.click("[data-testid=pennans-bok]");
    await p.waitForSelector("[data-testid=ledtrad]");
    const forsta = await p.getAttribute("[data-testid=ledtrad]", "data-hemligt");
    const ledda = [forsta];
    for (let i = 0; i < 6; i++) { await p.click("[data-testid=ledtrad-ny]"); await p.waitForTimeout(150); ledda.push(await p.getAttribute("[data-testid=ledtrad]", "data-hemligt")); }
    kolla(`G ${plats}: första gåtan är ett av platsens djur`, egna.includes(forsta), { forsta, egna });
    kolla(`G ${plats}: "Ny gåta" stannar bland platsens djur`, ledda.every((x) => egna.includes(x)), { ledda });
    kolla(`G ${plats}: "Ny gåta" byter gåta`, new Set(ledda).size >= Math.min(2, egna.length), { ledda });
    if (plats === "sjon") await bild(p, "b61-G-sjon-gata.png");
    await ctx.close();
  });
}

// K: tackbubblan mot banderollen
async function ingenKrock(p, namn, ms = 3000) {
  const krockLista = [];
  let sagsTack = false;
  for (let t = 0; t < ms; t += 250) {
    const r = await p.evaluate(() => {
      const rr = (e) => { const b = e.getBoundingClientRect(); return { t: e.textContent ?? "", x: b.left, y: b.top, width: b.width, height: b.height }; };
      return { b: [...document.querySelectorAll(".banderoller .banner")].map(rr), u: [...document.querySelectorAll("[data-testid=bubbla]")].map(rr) };
    });
    if (r.u.some((u) => /Tack|bästa|varm|glad/i.test(u.t))) sagsTack = true;
    const alla = [...r.b, ...r.u];
    for (let i = 0; i < alla.length; i++) for (let j = i + 1; j < alla.length; j++) if (i >= r.b.length || j >= r.b.length) if (krockar(alla[i], alla[j])) krockLista.push([alla[i].t, alla[j].t]);
    await p.waitForTimeout(250);
  }
  kolla(`K ${namn}: tackbubblan visades`, sagsTack);
  kolla(`K ${namn}: ingen bubbla ligger över en banderoll eller en annan bubbla`, krockLista.length === 0, { krock: krockLista.slice(0, 3) });
}
await blok("K-onska", async () => {
  // önskan uppfylls med ett handskrivet guldord: tackbubblan + "Guldord!"
  const { ctx, p } = await sida({});
  await nyttDjur(p, "ang", "en katt");
  await stangBok(p);
  await p.evaluate(() => window.__troll.onska("frusna-tassar", true));
  await p.waitForTimeout(800);
  const banners = [];
  const stopp = setInterval(() => p.locator(".banderoller").innerText().then((t) => t && banners.push(t)).catch(() => undefined), 150);
  await p.evaluate(() => window.__troll.vakna("med halsduk"));
  await p.waitForTimeout(200);
  await ingenKrock(p, "önskan + Guldord");
  clearInterval(stopp);
  kolla("K önskan: Guldord visades", banners.some((b) => /Guldord/.test(b)), { banners: [...new Set(banners)].slice(0, 4) });
  await bild(p, "b61-K-onska-guldord.png");
  await ctx.close();
});
await blok("K-gard", async () => {
  // lekfullt djur + en gunga på gården: tackbubblan, byggets bubbla och gårdens banderoll samtidigt (krockade före B6.1)
  const { ctx, p } = await sida({ stjarnor: 60 });
  const uid = await nyttDjur(p, "ang", "en katt");
  await stangBok(p);
  await p.evaluate((u) => window.__troll.humor(u, "lekfull"), uid);
  await p.evaluate(() => window.__troll.kop("lekplats"));
  await p.evaluate(() => window.__troll.plats("gard"));
  await p.waitForTimeout(2000);
  await p.evaluate(() => window.__troll.vakna("en gunga"));
  await p.waitForTimeout(200);
  await ingenKrock(p, "gården: lek-inbjudan");
  await bild(p, "b61-K-gard-tack.png");
  await ctx.close();
});

// E: stora saker längst bak. Djurets skärmpunkt (huvudet) får inte ligga inom en stor saks skärmruta.
await blok("E", async () => {
  const { ctx, p } = await sida({});
  const tjej = await nyttDjur(p, "ang", "en flicka");
  const katt = await nyttDjur(p, "ang", "en katt");
  const stora = [];
  for (const f of ["en jättestor skyskrapa", "ett slott", "ett ufo", "en grävmaskin"]) stora.push(await nyttDjur(p, "ang", f));
  await stangBok(p);
  await p.waitForTimeout(2500);
  const s = await sparat(p);
  kolla("E sex saker/djur på ängen", s.ang?.length === 6, { kroppar: s.ang?.map((d) => d.kropp) });
  for (const [namn, uid] of [["flickan", tjej], ["katten", katt]]) {
    const m = await malAv(p, uid);
    kolla(`E ${namn} syns (har ett skärmläge)`, !!m && m.x > 0 && m.x < 375 && m.y > 60 && m.y < 760, { m });
    const traff = await p.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); return e?.tagName ?? ""; }, m ?? { x: 0, y: 0 });
    kolla(`E ${namn}: skärmpunkten ligger på 3D-ytan (inte under UI)`, traff === "CANVAS", { traff });
  }
  const djurY = await Promise.all([tjej, katt].map((u) => malAv(p, u)));
  const sakY = await Promise.all(stora.map((u) => malAv(p, u)));
  // stora saker längre bak = högre upp på skärmen (mindre y) än djurens fötter
  kolla("E alla stora saker står bakom djuren (högre upp på skärmen)", sakY.every((m) => m) && djurY.every((m) => m) && Math.max(...sakY.map((m) => m.y)) < Math.min(...djurY.map((m) => m.y)), { sakY, djurY });
  await bild(p, "b61-E-stora-saker.png");
  await ctx.close();
});

// F: känt ord utan modell
await blok("F", async () => {
  const { ctx, p } = await sida({});
  await p.click("[data-testid=pennans-bok]");
  await p.waitForTimeout(400);
  const banners = [];
  const stopp = setInterval(() => p.locator(".banderoller").innerText().then((t) => t && banners.push(t)).catch(() => undefined), 150);
  await p.evaluate(() => window.__troll.vakna("en regnbåge"));
  await p.waitForTimeout(1500);
  clearInterval(stopp);
  kolla("F en regnbåge: synlig banderoll", banners.some((b) => /kan jag inte rita/.test(b)), { banners: [...new Set(banners)] });
  kolla("F en regnbåge: boken stängs", !(await synlig(p, "[data-testid=bok-skarm]")));
  await bild(p, "b61-F-regnbage.png");
  await ctx.close();
});

// P: alla fyra platser i ett spel – resa på kartan, ett uppdrag, stall + hämta ut, gåva → tack
await blok("P", async () => {
  const { ctx, p } = await sida({});
  for (const plats of ["ang", ...PLATSER]) {
    if (plats !== "ang") kolla(`P resa till ${plats} på kartan`, (await resTill(p, plats)) === plats);
    // som barnet: tryck på Bengtsson → nästa uppdrag på platsen startar → skriv första förslaget i idéraden
    await stangBok(p);
    let id = null;
    for (let i = 0; i < 4 && !id; i++) {
      await p.locator("[data-testid=npc-figur], [data-testid=bengtsson-ikon]").first().click({ timeout: 10000 }).catch(() => undefined);
      await p.waitForTimeout(900);
      id = Object.entries((await sparat(p)).uppdrag ?? {}).find(([k, v]) => v === "pagar" && BENGT.uppdrag.find((x) => x.id === k)?.omrade === plats)?.[0] ?? null;
      if (!id) await p.waitForTimeout(3000);
    }
    kolla(`P ${plats}: Bengtsson ger ett uppdrag`, !!id, { id });
    const u = BENGT.uppdrag.find((x) => x.id === id);
    const fras = u?.val?.grupper?.[0]?.forslag?.[0]?.fras ?? "";
    await stangBok(p);
    await p.evaluate((f) => window.__troll.vakna(f), fras);
    await p.waitForTimeout(2800);
    kolla(`P ${plats}: uppdraget ${id} klart med "${fras}"`, (await sparat(p)).uppdrag?.[id] === "klar");
    await stangBok(p);
    const uid = await nyttDjur(p, plats, "en orange räv");
    await stangBok(p);
    await p.evaluate((x) => window.__troll.humor(x, "glad"), uid);
    const t = await tryckTills(p, uid, "[data-testid=djur-till-stall]");
    if (t) { await p.click("[data-testid=djur-till-stall]"); await p.waitForTimeout(900); }
    kolla(`P ${plats}: räven i stallet`, await iStallet(p, uid));
    await p.click("[data-testid=meny]"); await p.waitForTimeout(300);
    await p.click("[data-testid=meny-stall]"); await p.waitForTimeout(400);
    await p.click(`[data-testid=stall-hamta-${uid}]`); await p.waitForTimeout(1800);
    if (await synlig(p, "[data-testid=meny-stall]")) { await p.click("[data-testid=meny]").catch(() => undefined); await p.waitForTimeout(300); }
    const s = await sparat(p);
    kolla(`P ${plats}: hämtad ut, på platsen igen`, !(await iStallet(p, uid)) && (plats === "ang" ? !!s.ang?.find((a) => a.uid === uid) : !!s.platsSkapelser?.[plats]?.find((a) => a.uid === uid)));
    await p.evaluate((x) => window.__troll.humor(x, "sugen"), uid); await p.waitForTimeout(400);
    const g = await tryckTills(p, uid, "[data-testid=gava-remsa]");
    kolla(`P ${plats}: den hämtade räven går att trycka på (gåvorutan öppnas)`, !!g);
    if (g) {
      await p.evaluate(() => window.__troll.vakna("en morot")); await p.waitForTimeout(1200);
      const hj = (await sparat(p)).liv?.[uid]?.hjartan ?? 0;
      kolla(`P ${plats}: gåvan gav ett hjärta`, hj >= 1, { hj });
    }
    await bild(p, `b61-P-${plats}.png`);
  }
  await ctx.close();
});

kolla("inga sidfel", fel.length === 0, { fel: fel.slice(0, 5) });
await browser.close(); server.close();
const ok = steg.every((s) => s.ok);
console.log(JSON.stringify({ ok, steg }, null, 1));
process.exit(ok ? 0 : 4);
