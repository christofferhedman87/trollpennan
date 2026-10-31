#!/usr/bin/env node
// T-14: manifest och best-effort-lagring. Ett nekat persist får aldrig hindra spelstart.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/bin/chromium", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  for (const viewport of (process.env.QA_KREDIT ? [{ width: 375, height: 812 }, { width: 812, height: 375 }] : [{ width: 375, height: 812 }])) {
  for (const svar of (process.env.QA_KREDIT ? [true] : [true, false, "fel", "saknas"])) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage(); page.setDefaultTimeout(45000); const fel = []; page.on("pageerror", (e) => fel.push(e.message));
    await page.addInitScript((svar) => {
      localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, ang: [], stjarnor: 17, ljudPa: false, rostPa: false, effektPa: false }));
      window.qaPersist = 0;
      Object.defineProperty(navigator, "storage", { configurable: true, value: svar === "saknas" ? undefined : { persist: async () => { window.qaPersist++; if (svar === "fel") throw new Error("nekad"); return svar; } } });
    }, svar);
    await page.goto(process.argv[2] ?? "http://127.0.0.1:4173/", { timeout: 120000 });
    await page.getByTestId("pennans-bok").waitFor();
    if (process.env.QA_KREDIT) {
      await page.getByTestId("foralder-hall").hover();
      const las = await page.getByTestId("foralder-hall").boundingBox(); assert.ok(las);
      await page.mouse.move(las.x + las.width / 2, las.y + las.height / 2); await page.mouse.down();
      await page.getByTestId("foralder-svar").waitFor(); await page.mouse.up();
      const tal = (await page.locator(".vuxen-las-fraga").innerText()).match(/(\d+)\s*×\s*(\d+)/); assert.ok(tal);
      await page.getByTestId("foralder-svar").fill(String(+tal[1] * +tal[2])); await page.getByTestId("foralder-oppna").click();
      const ordning = await page.locator(".foralder-ark").evaluate((el) => {
        const licens = el.querySelector('[data-testid="groda-kredit"]');
        const reset = el.querySelector('[data-testid="borja-om"]');
        return !!licens && !!reset && !!(reset.compareDocumentPosition(licens) & Node.DOCUMENT_POSITION_FOLLOWING);
      });
      assert.equal(ordning, true, "licensen ska ligga efter spel- och återställningsinställningarna");
      const start = page.waitForEvent("download"); await page.getByTestId("spara-kopia").click(); await start;
      await page.locator('[data-lagring="senaste"]').filter({ hasText: "Senaste kopia:" }).waitFor();
      if (process.env.QA_SCREENSHOTS) {
        await mkdir(process.env.QA_SCREENSHOTS, { recursive: true });
        await page.locator('[data-lagring="skydd"]').scrollIntoViewIfNeeded();
        await page.screenshot({ path: `${process.env.QA_SCREENSHOTS}/lagring-${viewport.width}.png` });
      }
      console.log(`Grönt T-35 och T-14 kopiedatum efter verklig nedladdning: ${viewport.width}×${viewport.height}`); await context.close(); continue;
    }
    assert.equal(await page.locator('link[rel="manifest"]').count(), 1, "manifest saknas");
    const href = await page.locator('link[rel="manifest"]').getAttribute("href"); assert.ok(href, "manifest saknas");
    const res = await page.request.get(new URL(href, page.url()).href); assert.equal(res.status(), 200);
    const m = await res.json(); assert.equal(m.start_url, "/"); assert.equal(m.display, "standalone"); assert.ok(m.icons.length);
    for (const i of m.icons) assert.equal((await page.request.get(new URL(i.src, page.url()).href)).status(), 200, `manifestikon ${i.src}`);
    if (svar !== "saknas") await page.waitForFunction(() => window.qaPersist === 1);
    assert.equal(await page.evaluate(() => window.__trollMinne.getState().stjarnor), 17);
    assert.deepEqual(fel, []); console.log(`Grönt T-14: persist=${svar}`); await context.close();
  }
  }
} finally { await browser.close(); }
