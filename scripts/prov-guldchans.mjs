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
    const hjalp = ruta(".sk-hjalprad");
    const tips = ruta(".sk-tips");
    const tangenter = ruta(".sk-tangenter");
    const aktivt = document.querySelector(selektor);
    // T-27 flyttade remsan ovanför sammanhangsytan. Prova verkliga klippande
    // föräldrar, aldrig ett syskons ruta som om den fortfarande innehöll remsan.
    const inomKlipp = (el) => {
      const r = el.getBoundingClientRect();
      if (r.top < -1 || r.bottom > innerHeight + 1 || r.left < -1 || r.right > innerWidth + 1) return false;
      for (let p = el.parentElement; p; p = p.parentElement) {
        const css = getComputedStyle(p); const q = p.getBoundingClientRect();
        if (/hidden|auto|scroll|clip/.test(css.overflowY) && (r.top < q.top - 1 || r.bottom > q.bottom + 1)) return false;
        if (/hidden|auto|scroll|clip/.test(css.overflowX) && (r.left < q.left - 1 || r.right > q.right + 1)) return false;
      }
      return true;
    };
    return document.querySelector(".sk-remsa").contains(aktivt)
      && ord.top >= Math.max(0, remsa.top) - 1
      && ord.bottom <= Math.min(innerHeight, remsa.bottom) + 1
      && [aktivt, ...[".sk-remsa", ".sk-hjalprad", ".sk-tips", ".sk-tangenter", '[data-dal="klar"]', '[data-testid="mellanslag"]'].map((s) => document.querySelector(s))].every(inomKlipp)
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

async function provaEnord() {
  const handlingar = ["guld", "nej", "stang", "angra", "ta-bort"].filter((h) => !process.env.QA_HANDLING || h === process.env.QA_HANDLING);
  assert.ok(handlingar.length, "QA_HANDLING är guld, nej, stang, angra eller ta-bort om det anges");
  for (const handling of handlingar) {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
    const page = await context.newPage();
    page.setDefaultTimeout(45000);
    page.on("pageerror", (e) => sidfel.push(`enord-${handling}: ${e.message}`));
    await page.addInitScript(() => localStorage.setItem("trollpennan-v2", JSON.stringify({
      version: 2, introSedd: true, ljudPa: false, rostPa: false, effektPa: false, kortGang: { kanin: 2 },
    })));
    try {
      await page.goto(adress);
      await page.waitForFunction(() => !!window.__troll);
      await page.evaluate(() => window.__troll.vakna("en drake"));
      await page.waitForFunction(() => window.__troll.state().ang.length > 0);
      await page.getByTestId("pennans-bok").click();
      await page.locator("[data-dal=ordhjalp]").click();
      await page.getByTestId("kort-kanin").click();
      const kanin = page.locator('[data-testid="remsa"] [data-klass="vad"]');
      assert.equal(await kanin.getAttribute("data-guld"), "nej");
      if (handling === "nej") {
        await page.getByRole("button", { name: "Nej tack", exact: true }).click();
      } else {
        await page.getByRole("button", { name: "Ja, jag skriver!", exact: true }).click();
        await page.locator(".sk-spok").waitFor();
        if (handling === "guld") {
          await skriv(page, "m");
          assert.equal(await page.locator(".sk-spok").textContent(), "kanin", "fel tangent förbrukar ingen bokstav");
          assert.equal(await kanin.getAttribute("data-guld"), "nej", "fel tangent ger inget guld");
          await skriv(page, "kanin");
        } else if (handling === "stang") {
          await skriv(page, "ka");
          await page.getByTestId("stang-bok").click();
          await page.getByTestId("bok-skarm").waitFor({ state: "hidden" });
          await page.getByTestId("pennans-bok").click();
        } else if (handling === "angra") {
          await page.getByRole("button", { name: "Ångra", exact: true }).click();
        } else {
          await kanin.click();
          await page.getByRole("button", { name: "Ta bort kanin", exact: true }).click();
        }
      }
      await page.locator(".sk-spok").waitFor({ state: "hidden", timeout: 8000 });
      if (handling === "angra" || handling === "ta-bort") {
        assert.equal(await kanin.count(), 0, "borttaget kort återkommer inte som guld");
        assert.equal(await page.locator('[data-testid="remsa"] [data-guld="ja"]').count(), 0);
      } else {
        assert.equal(await kanin.getAttribute("data-guld"), handling === "guld" ? "ja" : "nej", "avböjd eller avbruten guldchans behåller kortets källa");
        await page.getByTestId("vakna").click();
        await page.getByTestId("bok-skarm").waitFor({ state: "hidden" });
        assert.equal(await page.evaluate(() => !!window.__troll.state().funna.kanin?.guld), handling === "guld", "bara det färdigskrivna ordet registreras som guld");
      }
      logg(`enord-${handling}: kanin, fel tangent och kortets källa kontrollerade`);
    } catch (e) {
      await bild(page, `enord-${handling}-fel`).catch(() => {});
      throw e;
    } finally {
      await context.close();
    }
  }
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
  const enord = !process.env.QA_LAGE || process.env.QA_LAGE === "enord";
  assert.ok(fall.length || enord, "QA_LAGE är staende, liggande eller enord om det anges");
  for (const f of fall) await prova(...f);
  if (enord) await provaEnord();
  assert.deepEqual(sidfel, [], "inga JavaScript-fel i sidan");
  console.log(`GULDCHANSPROVET GRÖNT: ${[...fall.map(([namn, , , fras]) => `${fras} ${namn}`), ...(enord ? ["enord, fel tangent, nej tack, stäng, ångra och ta bort"] : [])].join(", ")}, minskad rörelse.`);
} catch (e) {
  console.error("GULDCHANSPROVET RÖTT:", e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
