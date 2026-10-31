#!/usr/bin/env node
// T-24: bara efter lugn i fri värld, aldrig bakom bok/dialog; första zoomningen avfärdar tipset beständigt.
import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/bin/chromium", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  for (const viewport of [{ width: 375, height: 812 }, { width: 812, height: 375 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage(); page.setDefaultTimeout(45000);
    await page.addInitScript(() => {
      if (localStorage.getItem("qa-dra")) return;
      localStorage.setItem("qa-dra", "1");
      localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, ang: [], garden: [], stjarnor: 17, ljudPa: false, rostPa: false, effektPa: false, egnaDjur: 5, uppdrag: { "kanin-fryser": "klar" }, seddaIntro: ["skogen"], dragit: false }));
    });
    await page.goto(process.argv[2] ?? "http://127.0.0.1:4173/", { timeout: 120000 });
    await page.waitForFunction(() => !!window.__troll);
    await page.evaluate(() => window.__troll.vakna("en kanin")); // endast syntetisk fixture
    await page.getByTestId("tred-hint").waitFor();
    await page.getByTestId("pennans-bok").click(); await page.getByTestId("tangentbord").waitFor();
    assert.equal(await page.getByTestId("tred-hint").count(), 0);
    await page.getByTestId("stang-bok").click(); await page.getByTestId("tred-hint").waitFor();
    await page.mouse.move(150, 220); await page.mouse.wheel(0, -240);
    await page.waitForFunction(() => window.__trollMinne.getState().dragit);
    await page.waitForTimeout(3800); assert.equal(await page.getByTestId("tred-hint").count(), 0);
    await page.reload(); await page.waitForFunction(() => !!window.__trollMinne);
    assert.equal(await page.evaluate(() => window.__trollMinne.getState().dragit), true);
    assert.equal(await page.getByTestId("tred-hint").count(), 0);
    console.log(`Grönt T-24: fri värld, bok och zoom, ${viewport.width}×${viewport.height}`); await context.close();
  }
} finally { await browser.close(); }
