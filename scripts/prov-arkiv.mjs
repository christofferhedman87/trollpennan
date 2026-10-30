#!/usr/bin/env node
// T-13: titel → spärr → börja om → ny flik → beständigt arkiv → återställd värld.
import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/bin/chromium", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const adress = process.argv[2] ?? "http://127.0.0.1:4173/";
async function vuxen(page) {
  const las = page.getByTestId("foralder-hall"); const r = await las.boundingBox(); assert.ok(r);
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await page.mouse.down();
  await page.getByTestId("foralder-svar").waitFor(); await page.mouse.up();
  const tal = (await page.locator(".vuxen-las-fraga").innerText()).match(/(\d+)\s*×\s*(\d+)/); assert.ok(tal);
  await page.getByTestId("foralder-svar").fill(String(+tal[1] * +tal[2])); await page.getByTestId("foralder-oppna").click();
  await page.getByTestId("spara-kopia").waitFor();
}
try {
  for (const viewport of [{ width: 375, height: 812 }, { width: 812, height: 375 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage(); page.setDefaultTimeout(45000);
    const fel = []; context.on("page", (p) => p.on("pageerror", (e) => fel.push(e.message)));
    page.on("pageerror", (e) => fel.push(e.message));
    await page.addInitScript(() => {
      sessionStorage.setItem("p2-titel-prov", "1");
      if (!localStorage.getItem("qa-arkiv")) {
        localStorage.setItem("qa-arkiv", "1");
        localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, ang: [], stjarnor: 17, ljudPa: false, rostPa: false, effektPa: false }));
      }
    });
    await page.goto(adress, { timeout: 120000 });
    await page.getByTestId("titel-fortsatt").waitFor();
    assert.equal(await page.getByTestId("titel-borja-om").count(), 0, "ingen återställning på försidan");
    assert.equal(await page.getByTestId("titel-angra").count(), 0, "ingen oskyddad import på försidan");
    await page.getByTestId("titel-fortsatt").click();
    await page.getByTestId("titel").waitFor({ state: "hidden" });
    await vuxen(page);
    await page.getByTestId("borja-om").click();
    await page.getByTestId("borja-ja").click();
    await page.getByTestId("titel-borja").waitFor();
    assert.ok(await page.evaluate(() => Object.keys(localStorage).some((k) => k.startsWith("trollpennan-arkiv-"))));
    await page.close(); // sessionskopian försvinner; den beständiga kopian måste gå att återställa ändå
    const ny = await context.newPage(); ny.setDefaultTimeout(45000);
    await ny.goto(adress, { timeout: 120000 });
    await ny.waitForFunction(() => !!window.__troll);
    const hoppa = ny.getByTestId("intro-hoppa");
    if (await hoppa.isVisible()) await hoppa.click();
    await ny.keyboard.press("Escape");
    await vuxen(ny);
    const val = ny.locator('[data-arkiv="lista"] > button'); await val.first().click();
    await ny.locator('[data-arkiv="fraga"] button').first().click();
    await ny.waitForFunction(() => window.__trollMinne?.getState().stjarnor === 17);
    assert.ok(await ny.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("trollpennan-arkiv-")).length >= 2), "både nuvarande och återställd värld finns kvar i arkivet");
    assert.deepEqual(fel, []); console.log(`Grönt T-13: ${viewport.width}×${viewport.height}, återställning efter stängd flik`);
    await context.close();
  }
} finally { await browser.close(); }
