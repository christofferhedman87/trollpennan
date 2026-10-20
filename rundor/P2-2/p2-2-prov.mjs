#!/usr/bin/env node
// P2-2: titelskärmen (förslag A) + "Börja om med en ny värld" med bekräftelse och ångra + guiden + nedre raden.
// Playwright 375x812 (touch) mot dist-pages, eget statiskt server. Titeln visas för Playwright bara med sessionStorage p2-titel-prov=1.
// Användning: node rundor/P2-2/p2-2-prov.mjs [--dist dist-pages] [--bilder katalog]   (exit 0 = alla steg gröna)
//  T1 nytt barn: bara "Börja" (ingen Börja om), introt väntar på titeln, "k – a – tt" under uppmaningen
//  T2 guiden pekar på målet ur forsta-stunden.json, Uppdrag och Skriv lika stora, inga överlapp
//  T3 tillbaka: Fortsätt med bild + rad, "Börja om med en ny värld" under, mindre
//  T4 bekräftelsen: rätt text, Nej primär med fokus, Nej rör ingenting
//  T5 Ja: tom värld, ångra erbjuds   T6 ångra: gamla världen exakt tillbaka   T7 guiden pekar på grinden (3D-ankare)
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { aktivtSteg } from "../../src/spel/forstaStunden.ts";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const root = path.resolve(arg("dist", "dist-pages"));
const bilder = arg("bilder", "");
if (bilder) fs.mkdirSync(bilder, { recursive: true });
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".ttf": "font/ttf", ".jpg": "image/jpeg" };
const server = http.createServer((req, res) => {
  let f = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!f.startsWith(root)) { res.writeHead(403); res.end(); return; }
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, "index.html");
  res.setHeader("Content-Type", mime[path.extname(f)] ?? "application/octet-stream");
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const URL0 = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, locale: "sv-SE" });
const p = await ctx.newPage();
p.setDefaultTimeout(10000);
const sidfel = [];
p.on("pageerror", (e) => sidfel.push(String(e.message).slice(0, 200)));
const steg = [];
const kolla = (namn, ok, info = {}) => { steg.push({ namn, ok: !!ok, ...info }); console.error(`${ok ? "ok  " : "FEL "} ${namn}${ok ? "" : " " + JSON.stringify(info).slice(0, 400)}`); };
const bild = async (n) => { if (bilder) await p.screenshot({ path: path.join(bilder, `p22-${n}.png`) }).catch(() => undefined); };
const t = (id) => p.locator(`[data-testid=${id}]`);
const spar = () => p.evaluate(() => { try { return JSON.parse(localStorage.getItem("trollpennan-v2") || "{}"); } catch { return {}; } });
const tryck = async (loc) => { try { await loc.tap({ timeout: 4000 }); } catch { await loc.dispatchEvent("click"); } };


const RUTA = (sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, b: r.width, h: r.height }; }, sel);
const korsar = (a, b) => !!a && !!b && Math.min(a.x + a.b, b.x + b.b) - Math.max(a.x, b.x) > 4 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 4;
const OVERLAPP = (sel) => p.evaluate((sel) => {
  const r = [...document.querySelectorAll(sel)].map((e) => ({ e, q: e.getBoundingClientRect() })).filter((x) => x.q.width > 1 && x.q.height > 1);
  const ut = [];
  for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) {
    const a = r[i].q, b = r[j].q;
    if (r[i].e.contains(r[j].e) || r[j].e.contains(r[i].e)) continue;
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (w > 4 && h > 4) ut.push(`${r[i].e.textContent.trim().slice(0, 14)} × ${r[j].e.textContent.trim().slice(0, 14)}`);
  }
  const utanfor = r.filter((x) => x.q.left < -1 || x.q.right > innerWidth + 1 || x.q.bottom > innerHeight + 1 || x.q.top < -1).map((x) => x.e.textContent.trim().slice(0, 14));
  const sma = r.filter((x) => x.q.height < 44).map((x) => x.e.textContent.trim().slice(0, 14));
  return { ut, utanfor, sma, sidbredd: document.documentElement.scrollWidth };
}, sel);
const synlig = (id, ms = 8000) => t(id).first().waitFor({ state: "visible", timeout: ms }).then(() => true, () => false);

// T1 nytt barn: titelskärmen med bara "Börja", introt väntar
await p.goto(URL0, { waitUntil: "domcontentloaded" });
await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); sessionStorage.setItem("p2-titel-prov", "1"); });
await p.reload({ waitUntil: "domcontentloaded" });
kolla("T1 nytt barn: titelskärmen syns", await synlig("titel", 30000));
await p.waitForTimeout(3000);
await bild("01-titel-nytt-barn");
const t1 = { borja: await t("titel-borja").count(), fortsatt: await t("titel-fortsatt").count(), borjaOm: await t("titel-borja-om").count(), angra: await t("titel-angra").count(), skriv: await t("intro-skriv").count() };
kolla("T1 nytt barn: bara Börja – ingen Fortsätt, ingen Börja om, ingen ångra", t1.borja === 1 && t1.fortsatt === 0 && t1.borjaOm === 0 && t1.angra === 0, t1);
await tryck(t("titel-borja"));
await p.waitForTimeout(400);
kolla("T1 Börja stänger titeln och introt börjar", (await t("titel").count()) === 0 && await synlig("intro", 5000));
kolla("T1 introts skrivscen kommer (inom 30 s)", await synlig("intro-skriv", 30000));
await p.waitForTimeout(400);
const ljudrad = (await t("intro-ljud").textContent().catch(() => "")).replace(/\s+/g, " ").trim();
kolla("T1 ljudraden k – a – tt under uppmaningen", ljudrad === "k – a – tt", { ljudrad });
const uppm = await RUTA(".intro-uppmaning"), lr = await RUTA("[data-testid=intro-ljud]"), rutor = await RUTA(".intro-rutor");
kolla("T1 ljudraden ligger mellan uppmaningen och rutorna", !!uppm && !!lr && !!rutor && lr.y >= uppm.y + uppm.h - 2 && lr.y + lr.h <= rutor.y + 2, { uppm, lr, rutor });
await bild("02-skriv-k-a-tt");
for (const b of ["k", "a", "t", "t"]) { await tryck(p.locator(`[data-testid=intro-tangent][data-t=${b}]`)); await p.waitForTimeout(200); }
await tryck(t("intro-vakna"));
await p.waitForTimeout(3000);
const s1 = await spar();
kolla("T1 katten väckt, introt sett", s1.introSedd === true && (s1.ang ?? []).length >= 1, { introSedd: s1.introSedd, ang: (s1.ang ?? []).length });

// T2 guiden + nedre raden
const steg1 = aktivtSteg(s1);
const coach = await synlig("coach", 8000);
const coachSteg = await t("coach").getAttribute("data-steg").catch(() => null);
kolla("T2 guiden visar steget ur forsta-stunden.json", coach && coachSteg === steg1?.steg.id, { coachSteg, vantat: steg1?.steg.id });
const malSel = (steg1?.steg.pekar_pa ?? "").split("|").map((m) => m.replace(/^testid:/, "")).filter((m) => !m.startsWith("3d:"));
let malR = null;
for (const id of malSel) { malR = await RUTA(`[data-testid=${id}]`); if (malR && malR.b > 1) break; }
const ring = await RUTA(".coach-ring");
kolla("T2 ringen sitter på målet", korsar(ring, malR), { ring, malR, malSel });
const uppdrag = await RUTA(".hud-bot [data-testid=bengtsson-ikon]"), skriv = await RUTA("[data-testid=pennans-bok]");
kolla("T2 Uppdrag och Skriv lika stora (±2 px) bredvid varandra", !!uppdrag && !!skriv && Math.abs(uppdrag.b - skriv.b) <= 2 && Math.abs(uppdrag.h - skriv.h) <= 2 && Math.abs(uppdrag.y - skriv.y) <= 2, { uppdrag, skriv });
const bub = await RUTA(".coach-bubbla");
const hud = await OVERLAPP(".hud button, .hud-bot button, .foralder-knapp, [data-testid=meny]");
kolla("T2 knapparna överlappar inte, ≥ 44 px, inget utanför", hud.ut.length === 0 && hud.utanfor.length === 0 && hud.sma.length === 0 && hud.sidbredd <= 375, hud);
const bubKrock = await p.evaluate((b) => [...document.querySelectorAll("button")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 1 && Math.min(r.right, b.x + b.b) - Math.max(r.left, b.x) > 4 && Math.min(r.bottom, b.y + b.h) - Math.max(r.top, b.y) > 4; }).map((e) => e.textContent.trim().slice(0, 14)), bub ?? { x: 0, y: 0, b: 0, h: 0 });
kolla("T2 pratbubblan täcker ingen knapp", !!bub && bubKrock.length === 0, { bub, bubKrock });
await p.waitForTimeout(1200);
await bild("03-guide-uppdrag-skriv");

// T3 tillbaka: titeln med Fortsätt (bild + rad) och den diskreta Börja om
await p.reload({ waitUntil: "domcontentloaded" });
kolla("T3 titeln: Fortsätt syns", await synlig("titel-fortsatt", 30000));
const rad = (await t("titel-rad").textContent()).trim();
kolla("T3 raden om senaste djuret", /katt/.test(rad), { rad });
const bildKlar = await p.locator(".titel-bild.klar").waitFor({ state: "visible", timeout: 15000 }).then(() => true, () => false);
kolla("T3 bilden på senaste djuret i Fortsätt-kortet", bildKlar);
const fo = await RUTA("[data-testid=titel-fortsatt]"), bo = await RUTA("[data-testid=titel-borja-om]");
kolla("T3 Börja om ligger under Fortsätt, mindre, ≥ 44 px", !!fo && !!bo && bo.y >= fo.y + fo.h && bo.h < fo.h && bo.h >= 44, { fo, bo });
const bot = (await t("titel-borja-om").textContent()).trim();
kolla("T3 texten är \"Börja om med en ny värld\"", bot === "Börja om med en ny värld", { bot });
kolla("T3 ingen ångra-knapp när det inte finns någon kopia", (await t("titel-angra").count()) === 0);
const tit = await OVERLAPP(".titel button");
kolla("T3 titelns knappar överlappar inte, inget utanför", tit.ut.length === 0 && tit.utanfor.length === 0 && tit.sidbredd <= 375, tit);
await bild("04-titel-fortsatt");

// T4 bekräftelsen: Nej går tillbaka och rör ingenting
await tryck(t("titel-borja-om"));
kolla("T4 bekräftelsen syns", await synlig("titel-fraga", 3000));
const fr = (await t("titel-fraga").textContent()).replace(/\s+/g, " ").trim();
kolla("T4 frågan och knapparna har rätt text", fr.includes("Din värld med alla djur försvinner. Är du säker?") && (await t("titel-nej").textContent()).trim() === "Nej, tillbaka" && (await t("titel-ja").textContent()).trim() === "Ja, börja om", { fr });
const nejR = await RUTA("[data-testid=titel-nej]"), jaR = await RUTA("[data-testid=titel-ja]");
const fokus = await p.evaluate(() => document.activeElement?.getAttribute("data-testid"));
kolla("T4 Nej, tillbaka är primär: först, störst och har fokus", !!nejR && !!jaR && nejR.y < jaR.y && nejR.h >= jaR.h && fokus === "titel-nej", { nejR, jaR, fokus });
const fq = await OVERLAPP(".titel-fraga button");
kolla("T4 knapparna i frågan överlappar inte, ≥ 44 px", fq.ut.length === 0 && fq.sma.length === 0 && fq.utanfor.length === 0, fq);
await bild("05-bekraftelse");
await tryck(t("titel-nej"));
await p.waitForTimeout(300);
const s2 = await spar();
kolla("T4 Nej: frågan stängs, Fortsätt kvar, världen orörd", (await t("titel-fraga").count()) === 0 && (await t("titel-fortsatt").count()) === 1 && JSON.stringify(s2.ang) === JSON.stringify(s1.ang));

// T5 Ja: ny tom värld, kopian finns, Börja om visas inte
await tryck(t("titel-borja-om"));
await synlig("titel-fraga", 3000);
await Promise.all([p.waitForEvent("load", { timeout: 20000 }).catch(() => undefined), tryck(t("titel-ja"))]);
kolla("T5 Ja: ny värld – bara Börja och ångra", await synlig("titel-borja", 30000) && (await t("titel-borja-om").count()) === 0 && (await t("titel-fortsatt").count()) === 0 && (await t("titel-angra").count()) === 1);
const s3 = await spar();
kolla("T5 sparningen är tom", !s3.introSedd && (s3.ang ?? []).length === 0, { introSedd: s3.introSedd, ang: (s3.ang ?? []).length });
await bild("06-ny-varld-angra");

// T6 ångra: den gamla världen tillbaka
await Promise.all([p.waitForEvent("load", { timeout: 20000 }).catch(() => undefined), tryck(t("titel-angra"))]);
kolla("T6 ångra: Fortsätt med katten igen", await synlig("titel-fortsatt", 30000) && /katt/.test((await t("titel-rad").textContent()) ?? ""));
const s4 = await spar();
kolla("T6 den gamla världen är exakt tillbaka", JSON.stringify(s4.ang) === JSON.stringify(s1.ang) && s4.introSedd === true, { ang: (s4.ang ?? []).length });
kolla("T6 kopian är borta (ingen ångra kvar)", (await t("titel-angra").count()) === 0);
await tryck(t("titel-fortsatt"));
await p.waitForTimeout(600);
kolla("T6 Fortsätt: titeln stängs, inget intro", (await t("titel").count()) === 0 && (await t("intro").count()) === 0);

// T7 grinden: med fem djur och ett klart uppdrag pekar guiden på grinden i 3D
await p.evaluate(() => {
  const s = JSON.parse(localStorage.getItem("trollpennan-v2"));
  const forsta = Object.values(s.albumKropp ?? {})[0] ?? { formel: "en katt", poang: 1, niva: "vanlig", hjartan: 0 };
  for (const k of ["hund", "gris", "ko", "hast", "anka"]) s.albumKropp[k] ??= { ...forsta, formel: `en ${k}` };
  s.uppdrag = { ...(s.uppdrag ?? {}), prov: "klar" };
  localStorage.setItem("trollpennan-v2", JSON.stringify(s));
  sessionStorage.setItem("p2-titel-prov", "0");
});
await p.reload({ waitUntil: "domcontentloaded" });
await p.waitForTimeout(500);
const s5 = await spar();
const steg5 = aktivtSteg(s5);
kolla("T7 stegen står på grinden", steg5?.steg.id === "grinden", { steg: steg5?.steg.id });
const grind = await p.waitForFunction(() => window.__tredMal?.grind, null, { timeout: 30000 }).then((h) => h.jsonValue(), () => null);
kolla("T7 3D-ankaret för grinden finns och är på skärmen", !!grind && grind.x > 0 && grind.x < 375 && grind.y > 0 && grind.y < 812, { grind });
const c7 = await synlig("coach", 8000) && (await t("coach").getAttribute("data-steg")) === "grinden";
const ring7 = await RUTA(".coach-ring");
kolla("T7 guiden pekar på grinden", c7 && !!ring7 && !!grind && Math.abs(ring7.x + ring7.b / 2 - grind.x) < 30 && Math.abs(ring7.y + ring7.h / 2 - grind.y) < 30, { ring7, grind });
await p.waitForTimeout(800);
await bild("07-guide-grinden");

kolla("inga sidfel", sidfel.length === 0, { sidfel });
await browser.close();
server.close();
const ok = steg.every((s) => s.ok);
console.log(JSON.stringify({ ok, steg }, null, 1));
process.exit(ok ? 0 : 1);
