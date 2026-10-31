#!/usr/bin/env node
// G1/T-29/T-32: riktiga knappar och fysiska tangenter, normal rörelse, båda telefonvyerna.
// QA_LAGE=375|812, QA_FALL=guldchans|eget|hjalp|flerord|flera väljer ett uttryckligt fall.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { lasbarTid } from "../src/spel/rost.ts";

const adress = process.argv[2] ?? "http://127.0.0.1:4173/";
const bilder = process.env.QA_SCREENSHOTS;
if (bilder) await mkdir(bilder, { recursive: true });
const fall = ["guldchans", "eget", "hjalp", "flerord", "flera"].filter((f) => !process.env.QA_FALL || f === process.env.QA_FALL);
assert.ok(fall.length, "QA_FALL måste välja ett verkligt fall");
const vyer = [{ width: 375, height: 812 }, { width: 812, height: 375 }].filter((v) => !process.env.QA_LAGE || String(v.width) === process.env.QA_LAGE);
assert.ok(vyer.length, "QA_LAGE är 375 eller 812");
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const fel = [];
const prova = (namn, f) => { try { f(); } catch (e) { fel.push(`${namn}: ${e.message}`); console.error(namn, e.message); } };

async function skriv(page, text) {
  // Playwrights insertText för å/ä/ö är inte en fysisk tangent. Tryck på spelets verkliga tangenter för dem.
  for (const bit of text.match(/[åäö]|[^åäö]+/g) ?? []) {
    if (/^[åäö]$/.test(bit)) await page.getByTestId("tangentbord").getByRole("button", { name: bit, exact: true }).click();
    else await page.keyboard.type(bit);
  }
}

async function felTangent(page, tecken, namn) {
  await page.evaluate((t) => {
    const skriv = document.querySelector(".sk-skrivbricka");
    const knapp = document.querySelector(t === " " ? '[data-testid="mellanslag"]' : `.sk-tangent[aria-label="${t}"]`);
    let gamla = new Set();
    let startad = false;
    const nya = new Set();
    const klasser = new Set();
    const samla = () => {
      if (!startad) return;
      for (const a of document.getAnimations()) if (!gamla.has(a)) nya.add(a.animationName ?? a.constructor.name);
      for (const e of document.querySelectorAll(".sk-tangenter .fel, .sk-skrivbricka.skaka")) klasser.add(e.className);
    };
    const observator = new MutationObserver(samla);
    // Börja vid själva klicket, före Reacts onClick. Klickkontrollens väntan kan annars räkna den
    // oberoende 3,5-sekundersledtråden som om feltrycket startade den. Inga animationstyper filtreras bort.
    knapp.addEventListener("click", () => {
      gamla = new Set(document.getAnimations()); startad = true;
      observator.observe(document.querySelector(".sk-ark"), { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    }, { once: true, capture: true });
    window.__g1Prov = { skriv, knapp, samla, observator, nya, klasser, startad: () => startad, text: window.__troll.state().text, spok: document.querySelector(".sk-spok").textContent };
  }, tecken);
  await (tecken === " " ? page.getByTestId("mellanslag") : page.getByTestId("tangentbord").getByRole("button", { name: tecken, exact: true })).click();
  await page.waitForTimeout(500);
  const r = await page.evaluate((t) => {
    const p = window.__g1Prov; p.samla(); p.observator.disconnect();
    const knapp = document.querySelector(t === " " ? '[data-testid="mellanslag"]' : `.sk-tangent[aria-label="${t}"]`);
    return { startad: p.startad(), sammaSkriv: p.skriv === document.querySelector(".sk-skrivbricka"), sammaKnapp: p.knapp === knapp,
      animationer: [...p.nya], klasser: [...p.klasser], textBevarad: p.text === window.__troll.state().text,
      spokBevarat: p.spok === document.querySelector(".sk-spok").textContent };
  }, tecken);
  console.log(namn, "fel tangent", JSON.stringify(r));
  prova(namn, () => assert.deepEqual(r, { startad: true, sammaSkriv: true, sammaKnapp: true, animationer: [], klasser: [], textBevarad: true, spokBevarat: true }));
}

async function kvitto(page, guldord, namn) {
  // Sidan mäter själv kvittot när det nått full opacitet. I liggande programvaru-GPU tar varje fjärranrop
  // annars så lång tid att spelets oförändrade 5,6 s hinner ta slut före mätning och bild.
  await page.evaluate(() => { window.__g1Matt = null; });
  const cdp = bilder ? await page.context().newCDPSession(page) : null;
  await page.getByTestId("vakna").click();
  await page.waitForFunction(() => window.__g1Matt, null, { polling: 50 });
  if (cdp) {
    const bild = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    const kvar = await page.evaluate(() => !!document.querySelector('[data-dal="kvitto"]'));
    await writeFile(`${bilder}/${namn}.png`, Buffer.from(bild.data, "base64"));
    await cdp.detach();
    console.log(namn, "bild", kvar ? "med kvitto i DOM efter tagning" : "OBS: kvittot borta efter tagning, läs bilden");
  }
  const { lastext, ...synligt } = await page.evaluate(() => window.__g1Matt);
  const tider = await page.evaluate((t) => window.__g1KvittoTider.filter((x) => x.text === t).map((x) => x.ms), lastext);
  console.log(namn, "kvitto", JSON.stringify({ ...synligt, lastext, tider }));
  prova(namn, () => assert.deepEqual(synligt, { text: guldord.length ? `${guldord.length} guldord: ${guldord.join(", ")}` : null, guld: guldord, inom: true }));
  prova(`${namn} lästid`, () => assert.ok(tider.length && tider.every((ms) => ms >= lasbarTid(lastext)), `schemalagd ${tider} ms, hela synliga texten kräver ${lasbarTid(lastext)} ms enligt befintlig policy`));
  // Behåll spelets vanliga lästid; vänta tills kvittot går bort av sig självt.
  await page.locator('[data-dal="kvitto"]').waitFor({ state: "detached" });
}

try {
  for (const viewport of vyer) {
    const context = await browser.newContext({ viewport, reducedMotion: "no-preference" });
    const page = await context.newPage(); page.setDefaultTimeout(60000);
    await page.addInitScript(() => {
      window.__g1KvittoTider = [];
      window.__g1Lastext = (el) => [...el.querySelectorAll(".sk-kvitto-rad, .sk-kvitto-chip")].map((e) => e.textContent.trim()).join(" ").replace(/\s+/g, " ").trim();
      const sattTid = window.setTimeout;
      // Läs den faktiskt schemalagda tiden utan att ändra callback, gräns eller tid.
      window.setTimeout = (fn, ms, ...args) => {
        const el = document.querySelector('[data-dal="kvitto"]');
        if (el && ms >= 5600 && ms <= 12000) window.__g1KvittoTider.push({ text: window.__g1Lastext(el), ms });
        return sattTid(fn, ms, ...args);
      };
      // Första läget med full opacitet för varje nytt kvitto, mätt i sidan utan att röra animation eller timer.
      let sett = null;
      setInterval(() => {
        const el = document.querySelector('[data-dal="kvitto"]');
        if (el !== sett && el && getComputedStyle(el).opacity === "1") {
          sett = el;
          const chip = el.querySelector(".sk-kvitto-chip.guld");
          const q = (chip ?? el).getBoundingClientRect();
          window.__g1Matt = { text: chip?.textContent.trim() ?? null, guld: [...el.querySelectorAll(".sk-kvitto-rad .gul")].map((e) => e.textContent),
            inom: q.left >= 0 && q.top >= 0 && q.right <= innerWidth && q.bottom <= innerHeight && el.scrollWidth <= el.clientWidth,
            lastext: window.__g1Lastext(el) };
        }
      }, 50);
    });
    page.on("pageerror", (e) => fel.push(`${viewport.width}: ${e.message}`));
    await page.addInitScript(() => localStorage.setItem("trollpennan-v2", JSON.stringify({
      version: 2, introSedd: true, startLage: "skriv", startLageVald: true, ljudPa: false, rostPa: false, effektPa: false,
      ang: [{ uid: "g1", skapad: 1, kropp: "kanin", formel: "en kanin", beskrivning: "en kanin", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [] }],
      kortGang: { kanin: 2, "sprutar eld": 2 }, onskaVid: Date.now() + 3600000, uppdrag: {}, dragit: true,
    })));
    try {
      await page.goto(adress, { timeout: 120000 });
      await page.waitForFunction(() => !!window.__troll && !!window.__tredScen, null, { timeout: 120000 });
      assert.equal(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches), false);
      for (const f of fall) {
        const namn = `${f}-${viewport.width}`;
        console.log(namn, "start");
        if (f === "flerord") await page.evaluate(() => window.__troll.onska("modig", true));
        else await page.getByTestId("pennans-bok").click();
        await page.getByTestId("tangentbord").waitFor();
        if (["guldchans", "hjalp", "flerord"].includes(f)) {
          await page.locator("[data-dal=ordhjalp]").click();
          if (f === "flerord") await page.locator('[data-flik="gor"]').click();
          await page.getByTestId(`kort-${f === "guldchans" ? "kanin" : f === "hjalp" ? "katt" : "sprutar eld"}`).click();
        }
        if (f === "guldchans" || f === "flerord") {
          await page.getByRole("button", { name: "Ja, jag skriver!", exact: true }).click();
          await page.locator(".sk-spok").waitFor();
          if (f === "guldchans") {
            await felTangent(page, "m", namn);
            await felTangent(page, " ", namn);
            await page.waitForFunction(() => document.querySelector('.sk-tangent[aria-label="k"]')?.classList.contains("tips"));
          }
          await skriv(page, f === "guldchans" ? "kanin" : "sprutar eld");
          await page.locator(".sk-spok").waitFor({ state: "detached" });
        }
        if (f === "eget" || f === "flera") {
          const mening = f === "eget" ? "en häst" : "ett stort rött hus av guld med två dörrar";
          await skriv(page, mening);
          assert.equal(await page.evaluate(() => window.__troll.state().text.trim()), mening, "riktiga tangenter ger exakt text");
        }
        await kvitto(page, f === "guldchans" ? ["kanin"] : f === "eget" ? ["häst"] : f === "hjalp" ? [] : f === "flerord" ? ["sprutar eld"] : ["stort", "rött", "hus", "guld", "dörrar"], namn);
      }
      const bredd = await page.evaluate(() => ({ sida: document.documentElement.scrollWidth, vy: innerWidth }));
      prova(`${viewport.width} sidbredd`, () => assert.equal(bredd.sida, bredd.vy));
    } catch (e) { fel.push(`${viewport.width}: ${e.message}`); console.error(e); }
    finally { await context.close(); }
  }
} finally { await browser.close(); }
assert.deepEqual(fel, [], fel.join("\n"));
