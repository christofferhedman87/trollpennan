#!/usr/bin/env node
// S1 skärmjämförelse (Arkitekten 2026-10-24). Mäter, ändrar inget i spelet.
// Fem platser i 375x812 (ängen, skogen, sjön, grottan, gården), samma djur, fryst klocka och fast slump,
// så att samma kod ger samma bild. Fejktiden går fram i steg om 100 ms och väntar på nätet mellan stegen,
// så att nätets fart inte påverkar bilden.
//   node rundor/S1-speldelning/matt/skarm-s1.mjs --dist dist-pages --ut /tmp/s1/fore1
//   [--bara ang,gard] kör bara de platserna (omkörning)
//   node rundor/S1-speldelning/matt/skarm-s1.mjs --jamfor /tmp/s1/fore1 /tmp/s1/fore2 /tmp/s1/efter
// --jamfor: fore1 och fore2 är samma kod två gånger; det som skiljer dem är brus (3D-scenen laddar i olika takt).
// Krav per plats (RÖD om de bryts): gränssnittsbilden (3D-dukar och humör/figur/puff/stjärnräknare dolda) har 0 pixlar där efter
// skiljer sig från både fore1 och fore2; varje synligt testid i efter, med låda, finns i fore1 eller fore2 och allt som
// finns i båda finns i efter (djurens humör, puff och stjärnräknarens bredd räknas inte); listan som i fore1 eller fore2.
// VARNING (inte RÖD, men ska förklaras i RUNDA.md): helbilden har fler än brus + 1000 pixlar som skiljer sig från båda,
// eller stjärnorna skiljer. 3D-scenen i headless WebGL är inte helt deterministisk (mätt: 0–33 000 px mellan två
// körningar av samma kod), så djurens lägen kontrolleras via humör-lådorna i DOM:en i stället.
// Gränssnittsbrus över 5 % = OSTABIL (mätfel, kör om). Exit 0 = lika på alla fem.
import fs from "node:fs"; import path from "node:path"; import http from "node:http";
import { createRequire } from "node:module";
const require = createRequire(path.resolve("package.json"));
const { chromium } = require("playwright");
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const PLATSER = {
  ang:     { plats: "ang",     varld: "ang",  djur: ["en katt", "en blå hund", "en gris"] },
  skogen:  { plats: "skogen",  varld: "ang",  djur: ["en kanin", "en häst", "en ko"] },
  sjon:    { plats: "sjon",    varld: "ang",  djur: ["en anka", "en säl", "en katt"] },
  grottan: { plats: "grottan", varld: "ang",  djur: ["en elefant", "en hund", "en giraff"] },
  gard:    { plats: "ang",     varld: "gard", djur: ["en katt", "ett hus med fönster", "ett stall"] },
};
const STEG_MS = 100, LADD_STEG = 60, EFTER_STEG = 40;

const br = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });

if (process.argv.includes("--jamfor")) {
  const i = process.argv.indexOf("--jamfor");
  const [f1, f2, ef] = process.argv.slice(i + 1, i + 4);
  const sida = await (await br.newContext()).newPage();
  // per pixel: "fel" = efter skiljer sig från både fore1 och fore2; "brus" = fore1 skiljer sig från fore2
  const jmf = (a, b, c) => sida.evaluate(async (src) => {
    const las = async (s) => { const im = await createImageBitmap(await (await fetch(s)).blob()); const k = new OffscreenCanvas(im.width, im.height); const x = k.getContext("2d"); x.drawImage(im, 0, 0); return x.getImageData(0, 0, im.width, im.height); };
    const [A, B, C] = await Promise.all(src.map(las));
    if (A.width !== C.width || A.height !== C.height || A.width !== B.width) return { storlek: true };
    const lik = (X, Y, p) => X.data[p] === Y.data[p] && X.data[p + 1] === Y.data[p + 1] && X.data[p + 2] === Y.data[p + 2];
    let brus = 0, fel = 0; for (let p = 0; p < A.data.length; p += 4) { if (!lik(A, B, p)) brus++; if (!lik(A, C, p) && !lik(B, C, p)) fel++; }
    return { brus, fel, n: A.width * A.height };
  }, [a, b, c].map((f) => "data:image/png;base64," + fs.readFileSync(f).toString("base64")));
  let fel = 0;
  for (const p of Object.keys(PLATSER)) {
    const fil = (d, x) => path.join(d, `${p}${x}`);
    if (![f1, f2, ef].every((d) => fs.existsSync(fil(d, "-hud.png")) && fs.existsSync(fil(d, ".png")))) { console.log(`SAKNAS    ${p}`); fel++; continue; }
    const hud = await jmf(...[f1, f2, ef].map((d) => fil(d, "-hud.png")));
    const hel = await jmf(...[f1, f2, ef].map((d) => fil(d, ".png")));
    // levande delar som skiljer mellan två körningar av samma kod: djurens humör (läget är kvar), puff-bannern, stjärnräknarens bredd
    const normera = (j) => ({ ...j, dom: j.dom.filter((x) => !x.startsWith("puff@")).map((x) => x.replace(/^humor3d-[^@]+@/, "humor3d@").replace(/^(stjarnor@\d+,\d+),.*/, "$1")) });
    const [ja, jb, jc] = [f1, f2, ef].map((d) => normera(JSON.parse(fs.readFileSync(fil(d, ".json"), "utf8"))));
    const domFel = [...jc.dom.filter((x) => !ja.dom.includes(x) && !jb.dom.includes(x)).map((x) => `+${x}`),
      ...ja.dom.filter((x) => jb.dom.includes(x) && !jc.dom.includes(x)).map((x) => `-${x}`)];
    const listaOk = [ja, jb].some((j) => JSON.stringify(j.lista) === JSON.stringify(jc.lista));
    const stjOk = [ja.stjarnor, jb.stjarnor].includes(jc.stjarnor);
    const helTak = hel.brus + 1000;
    const brister = [], varningar = [];
    if (hud.storlek || hel.storlek) brister.push("olika bildstorlek");
    if (hud.brus > hud.n * 0.05) { console.log(`OSTABIL   ${p}: gränssnittet skiljer ${hud.brus} px mellan fore1 och fore2 (mätfel, inte kodfel; kör om)`); fel++; continue; }
    if (hud.fel) brister.push(`gränssnitt ${hud.fel} px olika`);
    if (hel.fel > helTak) varningar.push(`helbild ${hel.fel} px olika (brus ${hel.brus}); titta på bilderna`);
    if (domFel.length) brister.push(`dom ${domFel.slice(0, 6).join(" ")}`);
    if (!listaOk) brister.push(`lista ${jc.lista.join(",")}`);
    if (!stjOk) varningar.push(`stjärnor ${jc.stjarnor} (före ${ja.stjarnor}/${jb.stjarnor})`);
    if (varningar.length) console.log(`VARNING   ${p}: ${varningar.join("; ")}`);
    if (brister.length) { console.log(`SKILLNAD  ${p}: ${brister.join("; ")}`); fel++; }
    else console.log(`lika      ${p}: gränssnitt 0 px (brus ${hud.brus}), helbild ${hel.fel} px (brus ${hel.brus}), dom och lista lika`);
  }
  console.log(fel ? `\nskarm-s1 RÖD (${fel})` : "\nskarm-s1 GRÖN: alla fem platser lika");
  await br.close(); process.exit(fel ? 1 : 0);
}

const UT = path.resolve(arg("ut", "skarm-s1")); fs.mkdirSync(UT, { recursive: true });
const ROOT = path.resolve(arg("dist", "dist-pages"));
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".ttf": "font/ttf", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".wasm": "application/wasm" };
const sv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(new URL(q.url, "http://x").pathname)); if (!f.startsWith(ROOT)) { r.writeHead(403); r.end(); return; }
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(ROOT, "index.html"); r.setHeader("Content-Type", mime[path.extname(f)] ?? "application/octet-stream"); r.end(fs.readFileSync(f)); });
await new Promise((ok) => sv.listen(0, "127.0.0.1", ok)); const URL0 = `http://127.0.0.1:${sv.address().port}/`;
const PL = ["skogen", "sjon", "grottan"]; const sidfel = [];
const BARA = arg("bara", "") ? arg("bara").split(",") : Object.keys(PLATSER);
for (const [namn, def] of Object.entries(PLATSER).filter(([n]) => BARA.includes(n))) {
  const ctx = await br.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: "sv-SE" });
  await ctx.addInitScript((s) => {
    let a = 0x5eed1; const rnd = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    Math.random = rnd; let u = 0; crypto.randomUUID = () => `00000000-0000-4000-8000-${String(++u).padStart(12, "0")}`;
    localStorage.clear(); localStorage.setItem("trollpennan-v2", JSON.stringify(s));
  }, { version: 2, introSedd: true, dragit: true, ang: [], garden: [], stjarnor: 12, oppnadePlatser: PL, seddaIntro: [...PL, "garden", "gard"], platsSkapelser: {}, plats: def.plats });
  const p = await ctx.newPage(); p.on("pageerror", (e) => sidfel.push(`${namn}: ${String(e.message).slice(0, 160)}`));
  let pagaende = 0; p.on("request", () => pagaende++); p.on("requestfinished", () => pagaende--); p.on("requestfailed", () => pagaende--);
  await p.clock.install({ time: new Date("2026-10-24T12:00:00+02:00") }); await p.clock.pauseAt(new Date("2026-10-24T12:00:00+02:00"));
  const lugn = async () => { for (let i = 0; i < 400 && pagaende > 0; i++) await p.waitForTimeout(25); await p.waitForTimeout(120); };
  const steg = async (n) => { for (let i = 0; i < n; i++) { await p.clock.runFor(STEG_MS); await lugn(); } };
  await p.goto(URL0, { waitUntil: "domcontentloaded" }); await lugn();
  await steg(LADD_STEG);
  const fo = p.locator("[data-testid=titel-fortsatt],[data-testid=titel-borja]").first();
  if (await fo.isVisible().catch(() => false)) { await fo.tap(); await steg(30); }
  await p.waitForFunction(() => !!window.__troll, null, { timeout: 20000 });
  for (const fras of def.djur) { await p.evaluate((f) => window.__troll.vakna(f), fras); await steg(30); }
  if (def.varld === "gard") { await p.evaluate(() => window.__troll.plats("gard")); await steg(10); } // sist: en väckning byter tillbaka till ängen
  await steg(EFTER_STEG);
  await p.screenshot({ path: path.join(UT, `${namn}.png`) });
  // gränssnittet utan 3D-duken och de delar som rör sig av sig själva (humör, figur, puff, stjärnräknaren): ska vara
  // pixellikt. Dukarna döljs bara under bilden (visibility, ingen layoutändring), så det som ligger ovanpå syns.
  await p.screenshot({ path: path.join(UT, `${namn}-hud.png`), animations: "disabled",
    style: "canvas, [data-testid^=humor3d], [data-testid=npc-figur], [data-testid=puff], [data-testid=stjarnor] { visibility: hidden !important; }" });
  const info = await p.evaluate(() => {
    const st = JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}");
    const dom = [...document.querySelectorAll("[data-testid]")].filter((e) => e.getClientRects().length).map((e) => { const r = e.getBoundingClientRect(); return `${e.dataset.testid}@${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.width)}x${Math.round(r.height)}`; });
    const lista = [...(st.ang ?? []), ...Object.values(st.platsSkapelser ?? {}).flat(), ...(st.garden ?? [])].map((d) => d.kropp ?? d.bygg ?? d.formel);
    return { dom, lista, stjarnor: st.stjarnor };
  });
  fs.writeFileSync(path.join(UT, `${namn}.json`), JSON.stringify(info, null, 1));
  console.log(namn, "klar", info.lista.join(","), `${info.dom.length} testid`);
  await ctx.close();
}
fs.writeFileSync(path.join(UT, "sidfel.json"), JSON.stringify(sidfel, null, 1));
console.log("sidfel", sidfel.length); await br.close(); sv.close();
