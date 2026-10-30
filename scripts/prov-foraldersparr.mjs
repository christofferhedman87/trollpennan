#!/usr/bin/env node
// T-12/T-13: verkliga klick och hållning; inga anrop till öppna-dialog-API:t.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/bin/chromium", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  for (const viewport of [{ width: 375, height: 812 }, { width: 812, height: 375 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const fel = []; page.on("pageerror", (e) => fel.push(e.message));
    await page.addInitScript(() => {
      if (localStorage.getItem("qa-foralder")) return;
      localStorage.setItem("qa-foralder", "1");
      localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, ang: [], stjarnor: 17, ljudPa: false, rostPa: false, effektPa: false }));
    });
    await page.goto(process.argv[2] ?? "http://127.0.0.1:4173/", { timeout: 120000 });
    await page.getByTestId("foralder-hall").waitFor({ state: "visible" });
    const las = page.getByTestId("foralder-hall");
    await las.click();
    assert.equal(await page.getByTestId("foralder").count(), 0, "ett kort klick får inte öppna föräldrasidan");
    const ruta = await las.boundingBox(); assert.ok(ruta);
    await page.mouse.move(ruta.x + ruta.width / 2, ruta.y + ruta.height / 2);
    await page.mouse.down(); await page.waitForTimeout(600);
    await page.mouse.move(ruta.x + ruta.width + 40, ruta.y + ruta.height / 2);
    await page.mouse.up(); await page.waitForTimeout(3100);
    assert.equal(await page.getByTestId("foralder").count(), 0, "avbruten hållning får inte öppna senare");
    await page.mouse.move(ruta.x + ruta.width / 2, ruta.y + ruta.height / 2);
    await page.mouse.down();
    await page.waitForFunction(() => document.querySelector("[data-testid=foralder-hall]")?.classList.contains("haller"));
    await page.waitForTimeout(2000);
    assert.equal(await page.getByTestId("foralder").count(), 0, "två sekunders hållning räcker inte");
    await page.getByTestId("foralder-svar").waitFor(); await page.mouse.up();
    const fraga = await page.locator(".vuxen-las-fraga").innerText();
    const tal = fraga.match(/(\d+)\s*×\s*(\d+)/); assert.ok(tal, "slumpad multiplikation ska visas");
    assert.ok(+tal[1] >= 10 && +tal[2] >= 10);
    await page.getByTestId("foralder-svar").fill("7"); await page.getByTestId("foralder-oppna").click();
    assert.equal(await page.getByTestId("spara-kopia").count(), 0, "gamla svaret ska inte låsa upp");
    await page.getByTestId("foralder-svar").fill(String(+tal[1] * +tal[2]));
    await page.getByTestId("foralder-oppna").click();
    await page.getByTestId("spara-kopia").waitFor();
    if (process.env.QA_SCREENSHOTS) {
      await mkdir(process.env.QA_SCREENSHOTS, { recursive: true });
      await page.screenshot({ path: `${process.env.QA_SCREENSHOTS}/foralder-${viewport.width}.png` });
    }
    assert.deepEqual(fel, []); console.log(`Grönt T-12: ${viewport.width}×${viewport.height}`);
    await context.close();
  }
} finally { await browser.close(); }
