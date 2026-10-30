#!/usr/bin/env node
// Syntetiska isolerade profiler: riktig titel vid nekat sessionsminne och skyddad värld vid lokala läsfel.
// Kör efter build:pages: CHROMIUM=/usr/bin/chromium node scripts/prov-lagringsfel.mjs [url]
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
const fall = [
  ["session-getter", { width: 375, height: 812 }],
  ["session-getter", { width: 812, height: 375 }],
  ["lokal-getter", { width: 375, height: 812 }],
  ["lokal-getItem", { width: 812, height: 375 }],
];

try {
  for (const [fel, viewport] of fall) {
    const namn = `${fel}-${viewport.width}`;
    const context = await browser.newContext({ viewport, reducedMotion: "reduce", deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.setDefaultTimeout(45000);
    const sidfel = [];
    page.on("pageerror", (e) => sidfel.push(e.message));
    await page.addInitScript((lage) => {
      const lokal = window.localStorage;
      const las = lokal.getItem.bind(lokal);
      const raw = JSON.stringify({
        version: 2, ang: [], garden: [], stjarnor: 17, introSedd: true,
        ljudPa: false, rostPa: false, effektPa: false,
      });
      if (!las("qa-lagring-forberedd")) {
        lokal.setItem("trollpennan-v2", raw);
        lokal.setItem("qa-lagring-forberedd", "1");
      }
      // Provet begär verklig titel. Session-gettern nekas efter att flaggan satts, så fallbacken provas också.
      sessionStorage.setItem("p2-titel-prov", "1");
      window.__qaOriginal = () => las("trollpennan-v2");
      window.__qaForvantat = raw;
      if (lage === "session-getter") {
        Object.defineProperty(window, "sessionStorage", { configurable: true, get() { throw new DOMException("Nekad i prov", "SecurityError"); } });
      } else if (lage === "lokal-getter") {
        Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new DOMException("Nekad i prov", "SecurityError"); } });
      } else if (!sessionStorage.getItem("qa-lagring-larfel")) {
        const original = Storage.prototype.getItem;
        Storage.prototype.getItem = function (nyckel) {
          if (this === lokal && nyckel === "trollpennan-v2" && !sessionStorage.getItem("qa-lagring-larfel")) {
            sessionStorage.setItem("qa-lagring-larfel", "1");
            throw new DOMException("Tillfälligt läsfel i prov", "SecurityError");
          }
          return original.call(this, nyckel);
        };
      }
    }, fel);
    try {
      await page.goto(adress, { timeout: 120000 });
      const titel = page.getByTestId(fel === "session-getter" ? "titel-fortsatt" : "titel-borja");
      await titel.waitFor({ state: "visible", timeout: 120000 });
      await titel.click();
      if (fel !== "session-getter") {
        await page.getByTestId("intro-hoppa").click();
        await page.getByTestId("intro").waitFor({ state: "hidden" });
      }
      await page.waitForFunction(() => !!window.__troll && !!window.__trollMinne);
      if (fel === "session-getter") {
        assert.equal(await page.evaluate(() => window.__trollMinne.getState().stjarnor), 17, "nekad session ändrar inte den lokala världen");
      } else {
        await page.locator(".lagrings-info summary").waitFor({ state: "visible" });
        assert.match(await page.locator(".lagrings-info").textContent(), /Spelet sparas inte just nu/);
        // Några normala storeändringar får inte skriva den tillfälligt tomma världen över originalet.
        await page.evaluate(() => window.__trollMinne.getState().geStjarnor(2));
        assert.equal(await page.evaluate(() => window.__qaOriginal()), await page.evaluate(() => window.__qaForvantat));
      }
      if (bildmapp) await page.screenshot({ path: join(bildmapp, `${namn}.png`) });

      if (fel === "lokal-getItem") {
        // Bara ett explicit, validerat filval får häva skrivskyddet. Samma föräldra-UI som i backup-provet.
        await page.evaluate(() => window.__troll.foralder(true));
        await page.getByTestId("foralder").waitFor({ state: "visible" });
        const tal = (await page.locator(".vuxen-las-fraga").innerText()).match(/(\d+)\s*×\s*(\d+)/);
  assert.ok(tal);
  await page.getByTestId("foralder-svar").fill(String(+tal[1] * +tal[2]));
        await page.getByTestId("foralder-oppna").click();
        const filinput = page.getByTestId("kopia-fil");
        const kopia = { version: 2, ang: [], garden: [], stjarnor: 23, introSedd: true, ljudPa: false, rostPa: false, effektPa: false };
        await filinput.setInputFiles({ name: "ogiltig-kopia.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ ...kopia, version: 3 })) });
        await page.getByTestId("backup-rad").waitFor({ state: "visible" });
        assert.equal(await page.getByTestId("backup-fraga").count(), 0);
        await page.evaluate(() => window.__trollMinne.getState().geStjarnor(2));
        assert.equal(await page.evaluate(() => window.__qaOriginal()), await page.evaluate(() => window.__qaForvantat), "ogiltig import lämnar original och skrivskydd orörda");
        await filinput.setInputFiles({ name: "giltig-kopia.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(kopia)) });
        await page.getByTestId("backup-fraga").waitFor({ state: "visible" });
        await page.getByTestId("backup-ja").click();
        await page.getByTestId("backup-fraga").waitFor({ state: "hidden" });
        assert.equal(await page.evaluate(() => JSON.parse(window.__qaOriginal()).stjarnor), 23, "giltig import sparas när lagringen åter är tillgänglig");
        await page.locator(".lagrings-info").waitFor({ state: "hidden" });
        await page.reload({ timeout: 120000 });
        await page.getByTestId("titel-fortsatt").waitFor({ state: "visible", timeout: 120000 });
        assert.equal(await page.evaluate(() => window.__trollMinne.getState().stjarnor), 23, "importerad värld överlever omladdning");
      }
      assert.deepEqual(sidfel, [], "inga JavaScript-fel");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width, "ingen sidrullning");
      console.log(`LAGRINGSPROV GRÖNT: ${namn}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
