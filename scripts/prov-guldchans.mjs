#!/usr/bin/env node
// Regression: önskans flerordskort ska gå att skriva till guld med skärmtangenterna.
// Kör mot byggd preview: CHROMIUM=/usr/bin/chromium node scripts/prov-guldchans.mjs [url]
// Syntetiskt djur och önskan sätts genom prov-API:t. Kortval, skrivning och Trolla använder riktiga knappar.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const adress = process.argv[2] ?? "http://127.0.0.1:4173/";
const bildmapp = process.env.QA_SCREENSHOTS;
if (bildmapp) await mkdir(bildmapp, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || undefined,
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const sidfel = [];
const logg = (text) => console.log(new Date().toISOString(), text);

async function bild(page, namn) {
  if (bildmapp) await page.screenshot({ path: join(bildmapp, `${namn}.png`) });
}

async function skriv(page, text) {
  for (const b of text) {
    if (b === " ") await page.getByTestId("mellanslag").click();
    else await page.locator(".sk-tangenter").getByRole("button", { name: b, exact: true }).click();
  }
}

async function kontrolleraSkrivyta(page, aktiv = ".sk-skrivbricka") {
  await page.waitForFunction((selektor) => {
    const ruta = (s) => document.querySelector(s).getBoundingClientRect();
    const ord = ruta(selektor);
    const remsa = ruta(".sk-remsa");
    const innehall = ruta(".sk-innehall");
    const hjalp = ruta(".sk-hjalprad");
    const tips = ruta(".sk-tips");
    const tangenter = ruta(".sk-tangenter");
    const sida = matchMedia("(orientation: landscape) and (max-height: 600px)").matches;
    return ord.top >= Math.max(0, remsa.top, sida ? innehall.top : 0) - 1
      && ord.bottom <= Math.min(innerHeight, remsa.bottom, sida ? innehall.bottom : innerHeight) + 1
      && hjalp.bottom <= tangenter.top + 1 && tips.bottom <= hjalp.bottom + 1;
  }, aktiv, { timeout: 8000 }).catch(async (e) => {
    const rutor = await page.evaluate((selektor) => Object.fromEntries([selektor, ".sk-remsa", ".sk-innehall", ".sk-hjalprad", ".sk-tips", ".sk-tangenter"].map((s) => {
      const r = document.querySelector(s).getBoundingClientRect();
      return [s, { top: r.top, bottom: r.bottom }];
    })), aktiv);
    console.error("Skrivytans geometri:", rutor);
    throw e;
  });
}

async function prova(namn, viewport, onskan, fras) {
  // Minska rörelse via appens tillgänglighetsläge: en studsande ledtrådstangent blir annars aldrig stabil
  // nog för Playwrights normala klickkontroll på molnmaskinens programvarurenderare.
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  page.on("pageerror", (e) => sidfel.push(`${namn}: ${e.message}`));
  // Bara syntetisk data i en ny, isolerad webbläsarkontext. Två tidigare kortval visar guldchansen vid det tredje.
  await page.addInitScript(() => localStorage.setItem("trollpennan-v2", JSON.stringify({
    version: 2, introSedd: true, ljudPa: false, rostPa: false, effektPa: false,
    kortGang: { "sprutar eld": 2, "springer snabbt": 2 },
  })));
  try {
    await page.goto(adress);
    await page.waitForFunction(() => !!window.__troll);
    await page.evaluate(() => window.__troll.vakna("en drake"));
    await page.waitForFunction(() => window.__troll.state().ang.length > 0);
    logg(`${namn}: världen startad`);
    {
      const id = `${namn}-${onskan}`;
      await page.evaluate((o) => window.__troll.onska(o, true), onskan);
      await page.getByTestId("bok-skarm").waitFor({ state: "visible" });
      await page.locator("[data-dal=ordhjalp]").click();
      await page.getByTestId("kort-drake").click();
      await page.locator('[data-flik="gor"]').click();
      await page.getByTestId(`kort-${fras}`).click();
      await page.getByRole("button", { name: "Ja, jag skriver!", exact: true }).click();
      logg(`${id}: guldchansen öppen`);
      const [forsta, andra] = fras.split(" ");
      await skriv(page, forsta);
      logg(`${id}: första ordet skrivet`);
      await page.waitForFunction((rest) => document.querySelector(".sk-spok")?.textContent === rest, ` ${andra}`);
      const mellan = page.getByTestId("mellanslag");
      await page.waitForFunction(() => document.querySelector('[data-testid="mellanslag"]')?.classList.contains("tips"));
      await kontrolleraSkrivyta(page);
      if (viewport.width > viewport.height) {
        for (const storlek of [{ width: 375, height: 812 }, viewport]) {
          await page.setViewportSize(storlek);
          await page.evaluate(() => new Promise(requestAnimationFrame));
          await kontrolleraSkrivyta(page);
        }
        assert.equal(await page.locator(".sk-spok").textContent(), ` ${andra}`, "pågående spökord bevaras vid rotation");
      }
      const ruta = await mellan.boundingBox();
      assert.ok(ruta && ruta.x >= 0 && ruta.y >= 0 && ruta.x + ruta.width <= viewport.width && ruta.y + ruta.height <= viewport.height, "mellanslag är synligt och nåbart");
      await bild(page, `${id}-mellanslag`);
      await mellan.click();
      await page.waitForFunction((rest) => document.querySelector(".sk-spok")?.textContent === rest, andra);
      logg(`${id}: mellanslag accepterat`);
      // Sudda över ordgränsen och skriv mellanrummet igen. Även den vägen måste gå att slutföra.
      await page.getByTestId("radera").click();
      await page.waitForFunction((rest) => document.querySelector(".sk-spok")?.textContent === rest, ` ${andra}`);
      await mellan.click();
      await skriv(page, andra);
      await page.waitForFunction(() => !document.querySelector(".sk-spok"));
      const guld = page.locator('[data-testid="remsa"] [data-klass="gor"][data-guld="ja"]');
      assert.equal(await guld.textContent(), fras, "hela flerordskortet blir guld");
      await kontrolleraSkrivyta(page, '[data-testid="remsa"] [data-klass="gor"][data-guld="ja"]');
      await bild(page, `${id}-guld`);
      assert.equal(await page.getByTestId("vakna").getAttribute("data-redo"), "ja");
      await page.getByTestId("vakna").click();
      await page.waitForFunction((ord) => window.__troll.state().funna[ord]?.guld === true, fras);
      await page.getByTestId("bok-skarm").waitFor({ state: "hidden" });
      assert.equal(await page.evaluate(() => window.__troll.state().onskan), null, "önskan är uppfylld");
      const spar = await page.evaluate((ord) => JSON.parse(localStorage.getItem("trollpennan-v2")).funna[ord]?.guld, fras);
      assert.equal(spar, true, "guldordet finns kvar i lokal sparning");
      logg(`${id}: hela frasen guld, önskan uppfylld och guldordet sparat`);
    }
    if (viewport.width > viewport.height) {
      await page.getByTestId("pennans-bok").click();
      await skriv(page, "en kanim ");
      assert.match(await page.getByTestId("forslag").textContent(), /Menade du/);
      await page.setViewportSize({ width: 375, height: 812 });
      await page.evaluate(() => new Promise(requestAnimationFrame));
      await page.setViewportSize(viewport);
      await page.waitForFunction(() => {
        const svar = document.querySelector('[data-testid="forslag"]').getBoundingClientRect();
        const innehall = document.querySelector(".sk-innehall").getBoundingClientRect();
        return svar.top >= innehall.top - 1 && svar.top + 44 <= innehall.bottom + 1;
      }, null, { timeout: 8000 });
      const svar = page.getByTestId("forslag-kanin");
      await svar.scrollIntoViewIfNeeded();
      const synligt = await svar.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const innehall = el.closest(".sk-innehall").getBoundingClientRect();
        return r.top >= innehall.top - 1 && r.bottom <= innehall.bottom + 1;
      });
      assert.equal(synligt, true, "stavningsförslagets knapp nås genom vanlig rullning");
      await bild(page, `${namn}-stavningsforslag`);
      await svar.click();
      await page.getByTestId("forslag").waitFor({ state: "hidden" });
      assert.match(await page.getByTestId("remsa").textContent(), /kanin/);
      logg(`${namn}: Menade du visas och går att besvara efter ordslut`);
    }
  } catch (e) {
    await bild(page, `${namn}-fel`).catch(() => {});
    throw e;
  } finally {
    await context.close();
  }
}

try {
  const fall = [
    ["staende", { width: 375, height: 812 }, "modig", "sprutar eld"],
    ["liggande", { width: 812, height: 375 }, "kull", "springer snabbt"],
  ].filter(([namn]) => !process.env.QA_LAGE || namn === process.env.QA_LAGE);
  assert.ok(fall.length, "QA_LAGE är staende eller liggande om det anges");
  for (const f of fall) await prova(...f);
  assert.deepEqual(sidfel, [], "inga JavaScript-fel i sidan");
  console.log(`GULDCHANSPROVET GRÖNT: ${fall.map(([namn, , , fras]) => `${fras} ${namn}`).join(", ")}, minskad rörelse.`);
} catch (e) {
  console.error("GULDCHANSPROVET RÖTT:", e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
