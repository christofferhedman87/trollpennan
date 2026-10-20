#!/usr/bin/env node
// DOM-tur för runda R1: spelar en fast rad lägen (via window.__troll och data-testid), sparar
// normaliserad DOM + skärmbild per läge. Skriven av Arkitekten; kopieras OFÖRÄNDRAD till
// verification/r1-dom-tur.mjs. Mäter inget i spelet, ändrar inget.
//   node verification/r1-dom-tur.mjs --dist dist-pages --ut /tmp/r1/fore       (egen statisk server)
//   node verification/r1-dom-tur.mjs --url https://trollpennan.grok.me/ --ut /tmp/r1/live
//   node verification/r1-dom-tur.mjs --jamfor /tmp/r1/fore1 /tmp/r1/fore2 /tmp/r1/efter   (exit 1 vid skillnad)
//   --bara namn1,namn2   kör bara lägen vars namn ingår (numreringen är densamma; för omkörning av ett läge)
// Lägen 01–20 skrevs för R1A, 21–28 lades till inför R1B (dialoger som 01–20 inte nådde).
// B6.1: 10–11 följer det nya beteendet (kartan: låst skog → "Inte riktigt än"; tre djur → resan till skogen), och
// humörikonen i 3D (R9K) normaliseras (ikon + skärmläge varierar av sig själv), så att 02–04, 06 och 15–17, 28 blir stabila.
// Webbläsare: env CHROMIUM_PATH om satt, annars Playwrights egen chromium.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import crypto from "node:crypto";

const arg = (n) => {
  const i = process.argv.indexOf(n);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

if (process.argv.includes("--jamfor")) {
  // --jamfor FORE1 FORE2 EFTER : lägen där FORE1 och FORE2 (samma kod, två körningar) skiljer sig är
  // "ostabila" (slump i spelet) och räknas inte. FORE1 jämförs mot EFTER på resten. Exit 1 vid skillnad
  // eller om färre än MIN_STABILA lägen är stabila.
  const MIN_STABILA = 12;
  const i = process.argv.indexOf("--jamfor");
  const [f1, f2, ef] = [process.argv[i + 1], process.argv[i + 2], process.argv[i + 3]];
  const las = (d) => JSON.parse(fs.readFileSync(path.join(d, "tur.json"), "utf8"));
  const [A, B, C] = [las(f1), las(f2), las(ef)];
  let skillnad = 0;
  let stabila = 0;
  for (const s of A) {
    const b = B.find((x) => x.namn === s.namn);
    const c = C.find((x) => x.namn === s.namn);
    if (!b || b.sha !== s.sha || (b.fel ?? "") !== (s.fel ?? "")) {
      console.log(`ostabilt  ${s.namn} (två körningar av samma kod skiljer sig; räknas inte)`);
      continue;
    }
    stabila++;
    if (!c) {
      console.log(`SKILLNAD  ${s.namn}: saknas efter`);
      skillnad++;
    } else if (c.sha !== s.sha || (c.fel ?? "") !== (s.fel ?? "")) {
      console.log(`SKILLNAD  ${s.namn}: före ${s.sha.slice(0, 10)} ${s.fel ?? ""} | efter ${c.sha.slice(0, 10)} ${c.fel ?? ""}   (diff ${f1}/${s.namn}.dom.html ${ef}/${s.namn}.dom.html)`);
      skillnad++;
    } else console.log(`lika      ${s.namn}${s.fel ? " (båda: " + s.fel + ")" : ""}`);
  }
  console.log(`\n${stabila} stabila lägen av ${A.length}, ${skillnad} skiljer sig före/efter.`);
  if (stabila < MIN_STABILA) console.log(`FÖR FÅ stabila lägen (minst ${MIN_STABILA}).`);
  process.exit(skillnad || stabila < MIN_STABILA ? 1 : 0);
}

const { chromium } = await import("playwright");
const ut = path.resolve(arg("--ut") ?? "tur-ut");
fs.mkdirSync(ut, { recursive: true });
let url = arg("--url");
let server;
if (!url) {
  const root = path.resolve(arg("--dist") ?? "dist-pages");
  const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2", ".ttf": "font/ttf" };
  server = http.createServer((req, res) => {
    let f = path.join(root, decodeURIComponent(new URL(req.url, "http://localhost").pathname));
    if (!f.startsWith(root)) { res.writeHead(403); res.end(); return; }
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, "index.html");
    res.setHeader("Content-Type", mime[path.extname(f)] || "application/octet-stream");
    res.end(fs.readFileSync(f));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  url = `http://127.0.0.1:${server.address().port}/`;
}
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  headless: true,
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, deviceScaleFactor: 1, locale: "sv-SE" });
await ctx.addInitScript(() => {
  if (!sessionStorage.getItem("r1-frö")) {
    localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true }));
    sessionStorage.setItem("r1-frö", "1");
  }
});
const p = await ctx.newPage();
p.setDefaultTimeout(6000);
const sidfel = [];
p.on("pageerror", (e) => sidfel.push(String(e.message).slice(0, 200)));

// Normaliserar bort det som varierar av sig självt (tid på dygnet, 3D-position, slump, uid, stjärnantal).
async function dom() {
  const html = await p.evaluate(() => {
    const rot = document.querySelector("main.spel");
    if (!rot) return "INGEN main.spel";
    const k = rot.cloneNode(true);
    k.querySelectorAll("*").forEach((e) => [...e.attributes].filter((a) => a.name.startsWith("data-grok-")).forEach((a) => e.removeAttribute(a.name)));
    k.querySelectorAll("canvas").forEach((c) => c.replaceWith(document.createElement("canvas")));
    k.querySelectorAll(".natt-bak, .natt, .lykta-ljus, .fyr-ljus").forEach((e) => { e.removeAttribute("style"); e.removeAttribute("data-styrka"); });
    k.querySelectorAll(".banderoller").forEach((e) => (e.innerHTML = ""));
    k.querySelectorAll("[data-testid='bubbla']").forEach((e) => e.remove());
    k.querySelectorAll("[data-testid^='humor-'], [data-testid='zzz']").forEach((e) => { e.setAttribute("data-testid", "humor-X"); e.textContent = "X"; e.removeAttribute("style"); });
    // B6.1: humörikonen över djuret i 3D (R9K) – slumpat humör och ett skärmläge som följer djuret (drei Html-omslag)
    k.querySelectorAll(".humor-ikon-3d").forEach((e) => {
      e.setAttribute("data-testid", "humor3d-X");
      e.textContent = "X";
    });
    // B6.1: alla drei Html-omslag (ikon, "!"-markör, bubblor i 3D) följer kameran – skärmläget är inte DOM-innehåll.
    k.querySelectorAll("div[style*='translate3d']").forEach((e) => e.removeAttribute("style"));
    // B6.1: laddflaggan för 3D-scenen blir klar i sin egen takt
    k.querySelectorAll("[data-klar]").forEach((e) => e.removeAttribute("data-klar"));
    k.querySelectorAll(".foto-knapp, .bubbla.onska, .bygg-meny").forEach((e) => e.removeAttribute("style"));
    k.querySelectorAll("[data-testid='onska-ansikte']").forEach((e) => e.removeAttribute("style"));
    k.querySelectorAll(".ang").forEach((e) => ["--duk-x", "--duk-y", "--duk-w", "--duk-h"].forEach((v) => e.style.removeProperty(v)));
    return k.outerHTML;
  });
  return html
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, "UID")
    .replace(/Du har \d+ stjärn/g, "Du har N stjärn")
    .replace(/★ \d+/g, "★ N");
}
const bara = arg("--bara")?.split(",");
const tur = [];
let nr = 0;
const t = (id) => p.getByTestId(id);
const troll = (js, arg) => p.evaluate(js, arg);
// Varje läge startar från ett rent spel (tömd lagring, ny sidladdning) så att slumpade händelser i ett
// läge inte smittar nästa. Förberedelsen ("fore") och handlingen körs sedan i ordning.
async function rent() {
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }).catch(() => undefined);
  await p.goto(url, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => !!window.__troll, null, { timeout: 20000 });
  await p.waitForTimeout(1500);
}
const medDjur = (text = "en blå fågel") => troll((x) => window.__troll.vakna(x), text);
async function lage(namn, forberedelse, handling) {
  nr += 1;
  const id = `${String(nr).padStart(2, "0")}-${namn}`;
  if (bara && !bara.includes(namn)) return;
  let fel;
  try {
    await rent();
    await forberedelse();
    await p.waitForTimeout(300);
    await handling();
    await p.waitForTimeout(450);
  } catch (e) {
    fel = String(e.message).split("\n")[0].slice(0, 120);
  }
  const html = await dom();
  fs.writeFileSync(path.join(ut, id + ".dom.html"), html.replace(/></g, ">\n<"));
  await p.screenshot({ path: path.join(ut, id + ".png") }).catch(() => undefined);
  tur.push({ namn: id, sha: crypto.createHash("sha256").update(html).digest("hex"), bytes: html.length, ...(fel ? { fel } : {}) });
  console.log(id, fel ? "FEL " + fel : "ok", html.length);
}
const inget = async () => {};
const oppnaMeny = async () => { await t("meny").click(); };
const tillKartan = async () => { await medDjur(); await oppnaMeny(); await t("ut-pa-aventyr").click(); };
// B6.1: skogen öppnas efter tre djur (data/platser.json upplasning); resan går direkt, utan djurval.
const treDjurTillKartan = async () => { for (const d of ["en blå fågel", "en gris", "en katt"]) { await medDjur(d); await p.waitForTimeout(400); } await oppnaMeny(); await t("ut-pa-aventyr").click(); };

await lage("start", inget, inget);
await lage("ang-djur", inget, () => medDjur());
await lage("bok-kort", medDjur, async () => { await t("pennans-bok").click(); });
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
// Lägen 21–28 (R1B): dialoger och paneler som 01–20 inte når.
const saga = (id) => p.getByTestId(id);
await lage("foralder-borja", () => troll(() => window.__troll.foralder(true)), async () => { await t("borja-om").click(); });
await lage("meny-borja", oppnaMeny, async () => { await t("meny-borja").click(); });
await lage("ordbok-for-fa", () => troll(() => window.__troll.ordbok(true)), async () => { await p.locator('[data-testid^="sida-"] button.kort').first().click(); });
await lage("ordbok-kop", async () => { await troll(() => window.__troll.stjarnor(99)); await troll(() => window.__troll.ordbok(true)); }, async () => { await p.locator('[data-testid^="sida-"] button.kort').first().click(); });
await lage("ordbok-kopt", async () => { await troll(() => window.__troll.stjarnor(99)); await troll(() => window.__troll.ordbok(true)); await p.locator('[data-testid^="sida-"] button.kort').first().click(); }, async () => { await saga("kop-ja").click(); });
await lage("bygg-for-fa", async () => { await troll(() => window.__troll.plats("gard")); await p.waitForTimeout(800); await t("bygg-nagot").click(); }, async () => { await p.locator('[data-testid="bygg-last"] button.last-ikon').first().click(); });
await lage("bygg-kop", async () => { await troll(() => window.__troll.stjarnor(99)); await troll(() => window.__troll.plats("gard")); await p.waitForTimeout(800); await t("bygg-nagot").click(); }, async () => { await p.locator('[data-testid="bygg-last"] button.last-ikon').first().click(); });
await lage("kvall", medDjur, () => troll(() => window.__troll.kvall()));

fs.writeFileSync(path.join(ut, "tur.json"), JSON.stringify(tur, null, 2));
fs.writeFileSync(path.join(ut, "sidfel.json"), JSON.stringify(sidfel, null, 2));
console.log(`\n${tur.length} lägen, ${tur.filter((x) => x.fel).length} med fel, ${sidfel.length} sidfel. Utdata i ${ut}`);
await browser.close();
server?.closeAllConnections();
server?.close();
