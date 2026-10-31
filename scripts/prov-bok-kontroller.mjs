#!/usr/bin/env node
// A1 T-01/T-02/T-31: samma skrivhandling, och barnets text bevaras vid hjälpbyte.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/bin/chromium", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const val = process.env.QA_FALL;
try {
  for (const viewport of [{ width: 375, height: 812 }, { width: 812, height: 375 }]) {
    for (const fall of ["tangent", "enter", "enter-skrivyta", "penna", "tom", "remsa", "vad", "enter-vad", "ordbricka"].filter((x) => !val || x === val)) {
      const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
      const page = await context.newPage(); page.setDefaultTimeout(45000);
      const fel = []; page.on("pageerror", (e) => fel.push(e.message));
      await page.addInitScript(() => {
        localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, ang: [], garden: [], stjarnor: 17, ljudPa: false, rostPa: false, effektPa: false }));
        localStorage.setItem("trollpennan-skapa-v1", '{"bokstavsljud":false}');
      });
      await page.goto(process.argv[2] ?? "http://127.0.0.1:4173/", { timeout: 120000 });
      await page.getByTestId("pennans-bok").click();
      await page.getByTestId("tangentbord").waitFor();
      const skriv = async (text) => { for (const b of text) await (b === " " ? page.getByTestId("mellanslag") : page.getByTestId("tangentbord").getByRole("button", { name: b, exact: true })).click(); };
      if (["tangent", "enter", "enter-skrivyta", "penna"].includes(fall)) {
        if (fall === "enter-skrivyta") {
          await page.locator('[data-dal="skrivbricka"]').click();
          await page.keyboard.type("en häst");
        } else await skriv("en häst"); // sista ordet är ännu inte avslutat
        if (fall === "tangent") await page.locator('[data-dal="klar"]').click();
        else if (fall.startsWith("enter")) await page.keyboard.press("Enter");
        else await page.getByTestId("vakna").click();
        await page.waitForFunction(() => window.__trollMinne.getState().ang.some((x) => x.kropp === "häst"), null, { timeout: 12000 });
        await page.getByTestId("bok-skarm").waitFor({ state: "hidden" });
      } else if (fall === "ordbricka") {
        await skriv("en häst ");
        await page.locator('.sk-ord[data-klass="vad"]').click();
        await page.keyboard.press("Enter"); await page.waitForTimeout(1500);
        assert.equal(await page.evaluate(() => window.__trollMinne.getState().ang.length), 0, "Enter på en ordbricka får bara aktivera brickan");
        assert.equal(await page.getByTestId("tangentbord").isVisible(), true);
      } else if (fall === "tom") {
        await page.locator('[data-dal="klar"]').click();
        await page.locator(".sk-puff").waitFor();
        assert.equal(await page.evaluate(() => window.__trollMinne.getState().ang.length), 0);
      } else if (fall === "remsa") {
        await skriv("en blå ");
        const text = await page.getByTestId("ord-input").inputValue();
        await page.locator('[data-dal="ordhjalp"]').click();
        assert.equal(await page.locator(".sk-blink").count(), 0, "hjälpläget ska inte låtsas ha en aktiv skrivmarkör");
        const ruta = await page.locator('[data-dal="skrivbricka"]').boundingBox();
        assert.ok(ruta && ruta.width >= 44 && ruta.height >= 44, "skrivytan har minst44px tryckyta även utan aktivt ord");
        await page.locator('[data-dal="skrivbricka"]').click();
        await page.getByTestId("tangentbord").waitFor();
        assert.equal(await page.getByTestId("ord-input").inputValue(), text);
      } else {
        await page.locator('[data-dal="ordhjalp"]').click();
        await page.locator('[data-flik="hurdan"]').click();
        await page.getByTestId("kort-blå").first().click();
        await page.locator(".sk-flik.skriv-flik").click();
        await page.locator(".sk-ord.tom").click();
        assert.equal(await page.getByTestId("tangentbord").isVisible(), true, "vad-luckan ska behålla tangenterna");
        await page.locator(".sk-puff").waitFor();
        if (fall === "enter-vad") {
          await page.keyboard.type("häst"); await page.keyboard.press("Enter");
          await page.waitForFunction(() => window.__trollMinne.getState().ang.some((x) => x.kropp === "häst"));
        }
      }
      assert.deepEqual(fel, []);
      if (process.env.QA_SCREENSHOTS && ["remsa", "vad"].includes(fall)) {
        await mkdir(process.env.QA_SCREENSHOTS, { recursive: true });
        await page.screenshot({ path: `${process.env.QA_SCREENSHOTS}/${fall}-${viewport.width}.png` });
      }
      console.log(`Grönt A1 ${fall}: ${viewport.width}×${viewport.height}`); await context.close();
    }
  }
} finally { await browser.close(); }
