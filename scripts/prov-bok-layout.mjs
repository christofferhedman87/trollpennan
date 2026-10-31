#!/usr/bin/env node
// T-27: faktisk geometri genom alla klippande föräldrar; synlig DOM räcker inte.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/bin/chromium", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
async function ryms(el, namn) {
  await el.waitFor();
  const fel = await el.evaluate((e) => {
    const r = e.getBoundingClientRect(); const t = 2;
    if (r.left < -t || r.top < -t || r.right > innerWidth + t || r.bottom > innerHeight + t) return `utanför skärmen ${JSON.stringify(r.toJSON())}`;
    for (let p = e.parentElement; p; p = p.parentElement) {
      const s = getComputedStyle(p); const q = p.getBoundingClientRect();
      if (/hidden|auto|scroll|clip/.test(s.overflowY) && (r.top < q.top - t || r.bottom > q.bottom + t)) return `klipps lodrätt av ${p.className}`;
      if (/hidden|auto|scroll|clip/.test(s.overflowX) && (r.left < q.left - t || r.right > q.right + t)) return `klipps vågrätt av ${p.className}`;
    }
    return null;
  });
  assert.equal(fel, null, namn);
}
try {
  for (const viewport of [{ width: 375, height: 812 }, { width: 812, height: 375 }, { width: 667, height: 375 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" }); const page = await context.newPage(); page.setDefaultTimeout(45000);
    const sidfel = []; page.on("pageerror", (e) => sidfel.push(e.message));
    await page.addInitScript(() => {
      localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, ang: [], garden: [], stjarnor: 17, ljudPa: false, rostPa: false, effektPa: false }));
      localStorage.setItem("trollpennan-skapa-v1", '{"bokstavsljud":false}');
    });
    await page.goto(process.argv[2] ?? "http://127.0.0.1:4173/", { timeout: 120000 }); await page.waitForFunction(() => !!window.__troll);
    await page.evaluate(() => { window.__troll.vakna("en kanin"); window.__trollMinne.setState({ uppdrag: { "kanin-fryser": "pagar" } }); });
    await page.getByTestId("bengtsson-ikon").click(); await page.getByTestId("uppdrag-los-i-boken").click();
    const remsa = page.getByTestId("remsa"); await ryms(remsa, "skrivrutan direkt vid öppning");
    await ryms(page.locator('[data-dal="klar"]'), "Trolla-tangenten");
    await page.locator('[data-dal="ide"]').click();
    await ryms(remsa, "skrivrutan med uppdrag och idé"); await ryms(page.locator(".sk-ide-rad"), "bildidén");
    if (process.env.QA_SCREENSHOTS) { await mkdir(process.env.QA_SCREENSHOTS, { recursive: true }); await page.screenshot({ path: `${process.env.QA_SCREENSHOTS}/skriv-${viewport.width}.png` }); }
    const las = page.getByRole("button", { name: /^Läs hela lappen:/ }).first();
    if (await las.count()) {
      await las.click(); const hela = page.locator(".sk-lapp-full"); await ryms(hela, "hela läsbara lappen");
      assert.match(await hela.innerText(), /kanin fryser/); await page.keyboard.press("Escape");
      assert.equal(await page.getByTestId("bok-skarm").isVisible(), true);
    }
    await page.locator('[data-dal="ordhjalp"]').click();
    await ryms(page.getByTestId("remsa"), "remsa i hjälpläge");
    await ryms(page.locator('[data-mal="losning"]').first(), "en hel lösningsrad");
    if (process.env.QA_SCREENSHOTS) await page.screenshot({ path: `${process.env.QA_SCREENSHOTS}/hjalp-${viewport.width}.png` });
    await page.getByTestId("pennan").click();
    await page.locator('[data-dal="skrivbricka"]').click(); await page.keyboard.type("en kanim ");
    const forslag = page.getByTestId("forslag"); await forslag.waitFor(); await ryms(forslag, "hela stavningssvaret");
    await ryms(page.getByTestId("remsa"), "remsa med stavningsfråga"); await ryms(page.getByTestId("nej"), "Behåll");
    await page.getByTestId("forslag-kanin").click();
    await page.locator('.sk-ord[data-klass="vad"]').last().click();
    const bort = page.locator(".sk-ta-bort");
    await ryms(bort, "hela Ta bort-knappen på markerad ordbricka");
    const ruta = await bort.boundingBox(); assert.ok(ruta && ruta.width >= 44 && ruta.height >= 44, "Ta bort har44px tryckyta");
    await bort.click(); assert.equal((await page.getByTestId("ord-input").inputValue()).includes("kanin"), false);
    assert.deepEqual(sidfel, []); console.log(`Grönt T-27: ${viewport.width}×${viewport.height}, skriv/idé/hjälp/full lapp/stavning`);
    await context.close();
  }
} finally { await browser.close(); }
