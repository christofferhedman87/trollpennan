// R9: bevis (375x812) för Bengtssons takt och ikon, stjärnförklaringen, förklaringen och ledtrådsytan i Skapa/Väck.
// B6.2: uppdaterad till nuvarande beteende (gåtan bara utan uppdrag, idéraden fyller inte i svaret).
// TTS-2-fix: boken öppnar i skrivläge sedan P1 – ordkorten nås via pennan (forslag-etikett), sedan tillbaka till tangentbordet.
// Kontrollerar: ingen figur först men en ikon; stjärnräknaren öppnar en ärlig förklaring; efter 3 djur bjuder Bengtsson in; ett klart uppdrag ger paus (ikonen kvar); ikonen ger uppdrag direkt; gåta + streck + förklaring syns i boken.
// Användning: node rundor/R9-tydlighet/r9-prov.mjs --ut docs/skarmbilder/r9 [--dist dist-pages]  (kräver npm run build:pages). exit 0 = allt stämde.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const dist = path.resolve(arg("dist", "dist-pages"));
const ut = path.resolve(arg("ut", "r9"));
fs.mkdirSync(ut, { recursive: true });
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let f = path.join(dist, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, "index.html");
  res.setHeader("Content-Type", mime[path.extname(f)] ?? "application/octet-stream");
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, deviceScaleFactor: 1, locale: "sv-SE" });
await ctx.addInitScript(() => {
  if (!sessionStorage.getItem("f")) {
    localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true }));
    sessionStorage.setItem("f", "1");
  }
});
const p = await ctx.newPage();
const fel = [];
p.on("pageerror", (e) => fel.push("pageerror: " + e));
p.setDefaultTimeout(10000);
await p.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => !!window.__troll, null, { timeout: 20000 });
await p.waitForTimeout(1500);
const m = { fel };
const t = (id) => p.getByTestId(id);
const figur = p.locator("[data-testid=npc-figur]");
const ikon = t("bengtsson-ikon");
const skott = async (namn) => { await p.waitForTimeout(500); await p.screenshot({ path: path.join(ut, `${namn}.png`) }); };
// 1. start: ingen figur, men ikonen finns och är minst 44 px
m.start = { figur: await figur.count(), ikon: await ikon.count(), ikon_hojd: Math.round((await ikon.boundingBox())?.height ?? 0) };
await skott("1-start-ikon");
// 2. stjärnor: klickbara, förklaringen visar ärlig användning
await t("stjarnor").click();
await t("stjarn-info").waitFor();
m.stjarnor = { text: (await t("stjarn-info").innerText()).replace(/\n+/g, " | "), nasta: await t("stjarn-nasta").innerText() };
await skott("2-stjarnor");
await t("stjarn-ordbok").click();
await t("ordbok-sida").first().waitFor({ timeout: 5000 }).catch(() => {});
m.stjarnor.ordbok_oppnas = (await p.getByTestId("ordbok").count()) > 0 || (await t("ordbok-sida").count()) > 0;
await p.keyboard.press("Escape");
if ((await t("stjarn-info").count()) > 0) await p.locator("[data-dialog-close]").first().click().catch(() => {});
// 3. (B6.2) boken utan uppdrag har förklaring + ledtråd (under uppdrag visas ingen gåta, R9I)
await t("pennans-bok").click();
await t("ledtrad-gata").waitFor();
m.forklaring = (await t("hemligt-forklaring").innerText()).trim();
m.gata1 = (await t("ledtrad-gata").innerText()).trim();
m.streck = (await t("ledtrad-streck").innerText()).trim();
m.streck_ok = /^[A-ZÅÄÖ]( _)+$/.test(m.streck) || /^[A-ZÅÄÖ]$/.test(m.streck);
await skott("3-bok-gata");
await t("ledtrad-ny").click();
m.gata2 = (await t("ledtrad-gata").innerText()).trim();
m.ny_gata_byter = m.gata2 !== m.gata1;
// B6.2/P1: pennan växlar mellan ordkorten och tangentbordet. Sedan P1 öppnar boken i skrivläge (pennan har klassen "pa"),
// före P1 med ordkorten – provet läser läget i stället för att anta det, så det fungerar på båda.
const skrivlage = async () => /\bpa\b/.test((await t("pennan").getAttribute("class")) ?? "");
m.oppnade_i = (await skrivlage()) ? "skriv" : "kort";
if (await skrivlage()) await t("pennan").click();
m.etikett = (await t("forslag-etikett").innerText()).trim();
await skott("3b-ordkort");
if (!(await skrivlage())) await t("pennan").click();
// förklaringen får inte skymma tangentbordet eller Vakna
m.vakna_synlig = !!(await t("vakna").boundingBox());
m.tangentbord_synligt = (await t("tangentbord").boundingBox())?.y < 812;
await t("stang-bok").click();
// 4. efter tre djur bjuder Bengtsson in med figur och utropstecken
for (const d of ["en rosa kanin", "en blå katt", "en grön groda"]) { await p.evaluate((x) => window.__troll.vakna(x), d); await p.waitForTimeout(700); }
await p.waitForTimeout(800);
m.efter_3_djur = { figur: await figur.count(), utrop: await p.locator(".npc-utrop").count() };
await skott("4-inbjudan");
// 5. klara ett uppdrag: figuren går, ikonen är kvar (paus), ikonen ger nästa direkt
await figur.first().click();
await t("uppdrag-remsa").waitFor();
// B6.2: idéraden ger inte längre hela svaret (R9K, "en kanin med …"), så barnet skriver klart själv
const forsta = (await t("uppdrag-remsa").innerText()).trim();
m.forsta_uppdrag = forsta;
await p.evaluate(() => window.__troll.vakna("en kanin med mössa"));
await p.waitForTimeout(800);
if ((await t("stang-bok").count()) > 0) await t("stang-bok").click();
await p.waitForTimeout(10500);
m.efter_klart = { figur: await figur.count(), ikon: await ikon.count() };
await skott("5-paus-ikon");
await ikon.click();
await t("uppdrag-remsa").waitFor();
m.andra_direkt = (await t("uppdrag-remsa").innerText()).trim();
m.ingen_gata_under_uppdrag = (await t("ledtrad").count()) === 0;

m.ok = m.start.figur === 0 && m.start.ikon === 1 && m.start.ikon_hojd >= 44 && /Ordbok/.test(m.stjarnor.text) && m.stjarnor.ordbok_oppnas && m.streck_ok && m.ny_gata_byter && m.etikett.length > 5 && m.vakna_synlig && m.tangentbord_synligt && m.efter_3_djur.figur === 1 && m.efter_3_djur.utrop === 1 && m.efter_klart.figur === 0 && m.efter_klart.ikon === 1 && m.andra_direkt.length > 10 && m.andra_direkt !== m.forsta_uppdrag && m.ingen_gata_under_uppdrag && fel.length === 0;
console.log(JSON.stringify(m, null, 1));
await browser.close();
server.close();
process.exit(m.ok ? 0 : 1);
