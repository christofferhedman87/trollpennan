#!/usr/bin/env node
// Block 3b: riktiga pixeltryck på utbyggnadsskylten går genom scenens useHandelser.
// Förberedelse och avläsning använder bara en ny isolerad syntetisk profil.
// CHROMIUM=/usr/bin/chromium QA_FALL=happy QA_LAGE=staende node scripts/prov-markkop.mjs [url]
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const adress = process.argv[2] ?? "http://127.0.0.1:4173/";
const bildmapp = process.env.QA_SCREENSHOTS;
if (bildmapp) await mkdir(bildmapp, { recursive: true });
const allaFall = [
  ["happy", "staende", { width: 375, height: 812 }],
  ["happy", "liggande", { width: 812, height: 375 }],
  ["kvot", "staende", { width: 375, height: 812 }],
  ["kvot", "liggande", { width: 812, height: 375 }],
  ["korrupt", "staende", { width: 375, height: 812 }],
  ["nekad", "liggande", { width: 812, height: 375 }],
];
const fall = allaFall.filter(([typ, lage]) => (!process.env.QA_FALL || typ === process.env.QA_FALL) && (!process.env.QA_LAGE || lage === process.env.QA_LAGE));
assert.ok(fall.length, "QA_FALL är happy/kvot/korrupt/nekad och QA_LAGE är staende/liggande om de anges");
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || undefined,
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const logg = (rad) => console.log(new Date().toISOString(), rad);
const ram = (page) => page.evaluate(() => new Promise((klart) => requestAnimationFrame(() => requestAnimationFrame(klart))));

async function bild(page, namn) {
  if (bildmapp) await page.screenshot({ path: join(bildmapp, `${namn}.png`) });
}
async function redo(page) {
  await page.waitForFunction(() => !!window.__troll && !!window.__trollMinne && !!window.__utbyggnad?.stranden && window.__dalKamera?.enabled === true, null, { timeout: 120000 });
  await page.locator('[data-testid="angen-3d"] canvas').waitFor({ state: "visible" });
  if (await page.getByTestId("bok-skarm").isVisible()) await page.getByTestId("stang-bok").click();
  await ram(page);
}
async function avlas(page) {
  return page.evaluate(() => ({
    stjarnor: window.__trollMinne.getState().stjarnor,
    dal: JSON.parse(JSON.stringify(window.__trollMinne.getState().dal)),
    original: window.__qaMarkLas("trollpennan-v2"),
    aldre: window.__qaMarkLas("trollpennan-dal-v1"),
    aldreSkrivningar: window.__qaMarkAldreSkrivningar,
    kopforsok: window.__qaMarkKopForsok,
  }));
}
async function skyltpunkt(page) {
  return page.evaluate(() => {
    const punkt = window.__utbyggnad?.backen;
    const canvas = document.querySelector('[data-testid="angen-3d"] canvas');
    const r = canvas?.getBoundingClientRect();
    if (!punkt || !r) return null;
    return {
      ...punkt,
      bredd: innerWidth, hojd: innerHeight,
      canvas: { x: r.x, y: r.y, width: r.width, height: r.height },
      fri: document.elementFromPoint(punkt.x, punkt.y) === canvas,
    };
  });
}
async function dragpunkt(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('[data-testid="angen-3d"] canvas');
    const r = canvas.getBoundingClientRect();
    for (const [fx, fy] of [[.5, .45], [.5, .35], [.4, .5], [.6, .5], [.5, .55]]) {
      const p = { x: r.x + r.width * fx, y: r.y + r.height * fy };
      if (document.elementFromPoint(p.x, p.y) === canvas) return p;
    }
    return null;
  });
}
async function hittaNabarSkylt(page) {
  for (let i = 0; i < 6; i++) {
    const p = await skyltpunkt(page);
    if (p && p.x >= 16 && p.x <= p.bredd - 16 && p.y >= 80 && p.y <= p.hojd - 125 && p.fri) {
      // Vänta ut kamerans dämpning innan den riktiga klickpunkten avläses.
      await ram(page);
      const sista = await skyltpunkt(page);
      if (sista?.fri && Math.hypot(sista.x - p.x, sista.y - p.y) < 4) return sista;
    }
    assert.ok(p, "Hemdalen har publicerat utbyggnadsskyltens CSS-punkt");
    const start = await dragpunkt(page);
    assert.ok(start, "det finns en fri canvasyta för vanlig kamera-pan/zoom");
    await page.mouse.move(start.x, start.y);
    if (i === 0) {
      // Lite större överblick, med samma hjulgest som spelet erbjuder på dator.
      await page.mouse.wheel(0, 700);
    } else {
      const dx = Math.max(-p.bredd * .3, Math.min(p.bredd * .3, p.bredd * .48 - p.x));
      const dy = Math.max(-70, Math.min(70, p.hojd * .4 - p.y));
      await page.mouse.down();
      await page.mouse.move(start.x + dx, start.y + dy, { steps: 12 });
      await page.mouse.up();
    }
    await ram(page);
  }
  throw new Error(`Skylten är inte nåbar efter vanlig panorering/zoom: ${JSON.stringify(await skyltpunkt(page))}`);
}

try {
  for (const [typ, lage, viewport] of fall) {
    const namn = `${typ}-${lage}`;
    const context = await browser.newContext({ viewport, reducedMotion: "reduce", deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.setDefaultTimeout(45000);
    const sidfel = [];
    page.on("pageerror", (e) => sidfel.push(e.message));
    await page.addInitScript((scenario) => {
      const lokal = window.localStorage;
      const las = lokal.getItem.bind(lokal);
      const satt = Storage.prototype.setItem;
      const getItem = Storage.prototype.getItem;
      // Enbart syntetiska data i den nyöppnade kontexten; en reload återför inte testets startvärld.
      if (!las("qa-mark-forberedd")) {
        satt.call(lokal, "trollpennan-v2", JSON.stringify({ version: 2, ang: [], garden: [], stjarnor: 17, introSedd: true, ljudPa: false, rostPa: false, effektPa: false }));
        if (scenario === "korrupt") satt.call(lokal, "trollpennan-dal-v1", "{");
        satt.call(lokal, "qa-mark-forberedd", "1");
      }
      window.__qaMarkLas = las;
      window.__qaMarkNeka = false; // Slås på först efter att spelet laddats i kvotfallet.
      window.__qaMarkKopForsok = 0;
      window.__qaMarkAldreSkrivningar = 0;
      Storage.prototype.setItem = function (nyckel, text) {
        if (this === lokal && nyckel === "trollpennan-dal-v1") window.__qaMarkAldreSkrivningar++;
        if (this === lokal && nyckel === "trollpennan-v2" && window.__qaMarkNeka) {
          const nasta = JSON.parse(String(text));
          if (nasta.stjarnor === 12 && nasta.dal?.utbyggnader?.includes("backen")) window.__qaMarkKopForsok++;
          throw new DOMException("Syntetiskt fullt minne", "QuotaExceededError");
        }
        return satt.call(this, nyckel, text);
      };
      if (scenario === "nekad") {
        Storage.prototype.getItem = function (nyckel) {
          if (this === lokal && nyckel === "trollpennan-dal-v1") throw new DOMException("Syntetiskt nekad äldre mark", "SecurityError");
          return getItem.call(this, nyckel);
        };
      }
    }, typ);
    try {
      await page.goto(adress, { timeout: 120000 });
      await redo(page);
      assert.equal(await page.evaluate(() => window.__trollMinne.getState().stjarnor), 17);
      assert.deepEqual(await page.evaluate(() => window.__trollMinne.getState().dal), { utbyggnader: [] });
      const punkt = await hittaNabarSkylt(page);
      if (typ === "kvot") await page.evaluate(() => { window.__qaMarkNeka = true; });
      const fore = await avlas(page);
      logg(`${namn}: pixeltryck på Kvarnbackens skylt vid ${punkt.x},${punkt.y}`);
      await bild(page, `${namn}-fore`);
      await page.mouse.click(punkt.x, punkt.y, { delay: 120 });

      if (typ === "happy") {
        await page.waitForFunction(() => window.__trollMinne.getState().stjarnor === 12 && window.__trollMinne.getState().dal.utbyggnader.includes("backen"));
        const efter = await avlas(page);
        const sparat = JSON.parse(efter.original);
        assert.equal(sparat.stjarnor, 12);
        assert.deepEqual(sparat.dal, { utbyggnader: ["backen"] }, "mark och debitering finns i samma sparning");
        assert.equal(efter.aldre, fore.aldre, "den gamla nyckeln lämnas orörd");
        assert.equal(efter.aldreSkrivningar, 0);
        await bild(page, `${namn}-kopt`);
        await page.reload({ timeout: 120000 });
        await redo(page);
        const igen = await avlas(page);
        assert.equal(igen.stjarnor, 12);
        assert.deepEqual(igen.dal, { utbyggnader: ["backen"] });
        assert.deepEqual(JSON.parse(igen.original).dal, igen.dal);
        assert.equal(igen.aldre, fore.aldre);
      } else {
        if (typ === "kvot") {
          // En bakgrundssparning räcker inte: just köpets 12 stjärnor + backen måste ha försökt skrivas.
          await page.waitForFunction((n) => window.__qaMarkKopForsok > n, fore.kopforsok);
        } else await ram(page);
        await page.locator(".lagrings-info summary").waitFor({ state: "visible" });
        const efter = await avlas(page);
        assert.equal(efter.stjarnor, fore.stjarnor);
        assert.deepEqual(efter.dal, fore.dal);
        assert.equal(efter.original, fore.original, "ingen byte av det läsbara huvudoriginalet");
        assert.equal(efter.aldre, fore.aldre, "ingen byte av den äldre marknyckeln");
        assert.equal(efter.aldreSkrivningar, 0);
        assert.match(await page.locator(".lagrings-info").textContent(), typ === "korrupt" ? /Det sparade spelet behöver hjälp/ : /Spelet sparas inte just nu/);
        await bild(page, `${namn}-lagringsinfo`);
        await page.reload({ timeout: 120000 });
        await redo(page);
        const igen = await avlas(page);
        assert.equal(igen.stjarnor, 17);
        assert.deepEqual(igen.dal, { utbyggnader: [] });
        assert.equal(igen.aldre, fore.aldre);
        if (typ !== "kvot") assert.equal(igen.original, fore.original, "läsfelskyddet håller också vid omladdning");
      }
      assert.deepEqual(sidfel, [], "inga JavaScript-fel");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width);
      logg(`MARKKÖPSPROV GRÖNT: ${namn}`);
    } catch (e) {
      await bild(page, `${namn}-fel`).catch(() => {});
      console.error(`MARKKÖPSPROV RÖTT: ${namn}`, e);
      throw e;
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
