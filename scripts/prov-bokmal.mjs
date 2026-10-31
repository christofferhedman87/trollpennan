#!/usr/bin/env node
// A0/A2: sammanhanget styr tips, hjälplösningar och idéer. Inget skriver text åt barnet av sig självt.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
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
        assert.ok(await page.locator(".sk-ide-rad img").count() >= 1, "målidén använder en befintlig bild");
        assert.equal(await page.locator('.sk-ide-rad img[src="/ikoner/skapa/ui/agg.svg"]').count(), 0);
        assert.equal(await page.getByTestId("ord-input").inputValue(), text);
        assert.equal(await page.locator('[data-dal="lapp"]').filter({ hasText: "Bengtsson" }).count(), 1, "uppdragslappen ska finnas kvar ovanför idén");
      }
      if (process.env.QA_SCREENSHOTS) {
        await mkdir(process.env.QA_SCREENSHOTS, { recursive: true });
        await page.screenshot({ path: `${process.env.QA_SCREENSHOTS}/mal-ide-${viewport.width}.png` });
      }
      await page.getByRole("button", { name: "Gåta", exact: true }).click();
    }
    if (!fall || fall === "hjalp" || fall === "egna") {
      if (!fall || fall === "egna") {
        await page.locator('[data-dal="skrivbricka"]').click(); await page.keyboard.type("en kanin");
        assert.equal(await page.getByTestId("ord-input").inputValue(), "en kanin");
      }
      await page.locator('[data-dal="ordhjalp"]').click();
      await page.getByRole("heading", { name: "Till uppdraget", exact: true }).waitFor();
      assert.ok(await page.locator('[data-mal="losning"]').count() >= 2);
      if (!fall || fall === "egna") {
        await page.locator('[data-mal="losning"]').first().click();
        assert.equal(await page.getByTestId("ord-input").inputValue(), "en kanin", "egen text ersätts aldrig tyst");
        await page.keyboard.press("Backspace"); await page.keyboard.type("abc");
        assert.equal(await page.getByTestId("ord-input").inputValue(), "en kanin", "dialogens tangenter får inte ändra meningen bakom");
        await page.keyboard.press("Escape");
        assert.equal(await page.getByTestId("bok-skarm").isVisible(), true, "Escape stänger bara bytesfrågan");
        assert.equal(await page.getByTestId("ord-input").inputValue(), "en kanin");
        await page.locator('[data-mal="losning"]').first().click();
        await page.getByRole("button", { name: "Byt till förslaget", exact: true }).click();
        assert.notEqual(await page.getByTestId("ord-input").inputValue(), "en kanin");
        await page.getByRole("button", { name: "Ångra", exact: true }).click();
        assert.equal(await page.getByTestId("ord-input").inputValue(), "en kanin", "Ångra bevarar originalmeningen");
      }
    }
    assert.deepEqual(fel, []); console.log(`Grönt bokmål: ${viewport.width}×${viewport.height}`); await context.close();
  }
} finally { await browser.close(); }
