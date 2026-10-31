#!/usr/bin/env node
// A0/A2: sammanhanget styr tips, hjälplösningar och idéer. Inget skriver text åt barnet av sig självt.
import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/bin/chromium", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  for (const viewport of [{ width: 375, height: 812 }, { width: 812, height: 375 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage(); page.setDefaultTimeout(45000); const fel = []; page.on("pageerror", (e) => fel.push(e.message));
    await page.addInitScript(() => {
      localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, ang: [], garden: [], stjarnor: 17, ljudPa: false, rostPa: false, effektPa: false }));
      localStorage.setItem("trollpennan-skapa-v1", '{"bokstavsljud":false}');
    });
    await page.goto(process.argv[2] ?? "http://127.0.0.1:4173/", { timeout: 120000 });
    await page.waitForFunction(() => !!window.__troll);
    // Endast fixture: redan påbörjat uppdrag och en skapelse. All navigation nedan är verkliga klick.
    await page.evaluate(() => { window.__troll.vakna("en kanin"); window.__trollMinne.setState({ uppdrag: { "kanin-fryser": "pagar" }, dragit: false }); });
    await page.getByTestId("bengtsson-ikon").click(); await page.getByTestId("uppdrag-los-i-boken").click();
    await page.getByTestId("tangentbord").waitFor();
    const fall = process.env.QA_FALL;
    if (!fall || fall === "tips") assert.match(await page.locator(".sk-tips").innerText(), /Bengtsson|värmer/, "tipset ska följa uppdraget, inte erbjuda valfritt djur eller hus");
    if (!fall || fall === "hint") assert.equal(await page.getByTestId("tred-hint").count(), 0, "panoreringstipset ska saknas när boken är öppen");
    if (!fall || fall === "ide") {
      const text = await page.getByTestId("ord-input").inputValue();
      for (let i = 0; i < 5; i++) {
        await page.locator('[data-dal="ide"]').click();
        await page.locator(".sk-ide-rad").waitFor();
        assert.equal(await page.getByTestId("ord-input").inputValue(), text);
        assert.equal(await page.locator('[data-dal="lapp"]').filter({ hasText: "Bengtsson" }).count(), 1, "uppdragslappen ska finnas kvar ovanför idén");
      }
      await page.getByRole("button", { name: "Gåta", exact: true }).click();
    }
    if (!fall || fall === "hjalp") {
      await page.locator('[data-dal="ordhjalp"]').click();
      await page.getByRole("heading", { name: "Till uppdraget", exact: true }).waitFor();
      assert.ok(await page.locator('[data-mal="losning"]').count() >= 2);
    }
    assert.deepEqual(fel, []); console.log(`Grönt bokmål: ${viewport.width}×${viewport.height}`); await context.close();
  }
} finally { await browser.close(); }
