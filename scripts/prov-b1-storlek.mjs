#!/usr/bin/env node
// B1: storlek måste beskriva ett faktiskt djur. Riktiga klick och tangenter i båda vyerna.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
const adress = process.argv[2] ?? "http://127.0.0.1:4173/";
const bilder = process.env.QA_SCREENSHOTS;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/bin/chromium", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  for (const viewport of [{ width: 375, height: 812 }, { width: 812, height: 375 }]) {
    if (process.env.QA_LAGE && viewport.width !== Number(process.env.QA_LAGE)) continue;
    const context = await browser.newContext({ viewport, reducedMotion: "no-preference" });
    const page = await context.newPage(); page.setDefaultTimeout(60000);
    const fel = []; page.on("pageerror", (e) => fel.push(e.message));
    await page.addInitScript(() => {
      window.__b1StorlekMatt = null;
      setInterval(() => {
        const el = document.querySelector('[data-dal="kvitto"]');
        if (window.__b1StorlekMatt || !el || getComputedStyle(el).opacity !== "1" || !el.innerText.includes("Jag letar efter en liten vän")) return;
        const r = el.getBoundingClientRect();
        window.__b1StorlekMatt = { text: el.innerText, inom: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
          hel: el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight };
      }, 50);
      localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, ang: [], garden: [], stjarnor: 17, ljudPa: false, rostPa: false, effektPa: false }));
      localStorage.setItem("trollpennan-skapa-v1", '{"bokstavsljud":false}');
    });
    const cdp = bilder ? await context.newCDPSession(page) : null;
    await page.goto(adress, { timeout: 120000 });
    await page.waitForFunction(() => !!window.__troll);
    await page.evaluate(() => { window.__troll.vakna("en kanin"); window.__trollMinne.setState({ uppdrag: { "pytteliten-kompis": "pagar" } }); });
    await page.waitForFunction(() => window.__trollMinne.getState().ang.length === 1);
    const fore = await page.evaluate(() => ({ ang: window.__trollMinne.getState().ang, stjarnor: window.__trollMinne.getState().stjarnor }));
    assert.equal(fore.ang[0].kropp, "kanin");
    async function skriv(text) {
      await page.getByTestId("tangentbord").waitFor();
      await page.locator('[data-dal="skrivbricka"]').click();
      for (const del of text.split(/([åäö])/)) {
        if (!del) continue;
        if (/^[åäö]$/.test(del)) await page.getByTestId("tangentbord").getByRole("button", { name: del, exact: true }).click();
        else await page.keyboard.type(del);
      }
      assert.equal(await page.getByTestId("ord-input").inputValue(), text);
      await page.locator('[data-dal="klar"]').click();
      await page.getByTestId("bok-skarm").waitFor({ state: "hidden" });
    }
    await page.getByTestId("bengtsson-ikon").click(); await page.getByTestId("uppdrag-los-i-boken").click();
    await skriv("en liten sten");
    await page.waitForFunction((antal) => window.__trollMinne.getState().ang.length === antal + 1, fore.ang.length);
    const miss = await page.evaluate(() => ({ ang: window.__trollMinne.getState().ang, status: window.__trollMinne.getState().uppdrag["pytteliten-kompis"] }));
    assert.equal(miss.status, "pagar", "en liten sak är ingen liten vän");
    assert.equal(miss.ang.length, fore.ang.length + 1);
    assert.equal(miss.ang[0].uid, fore.ang[0].uid);
    assert.equal(miss.ang.at(-1).kropp, "sten");
    await page.waitForFunction(() => window.__b1StorlekMatt);
    const matt = await page.evaluate(() => window.__b1StorlekMatt);
    assert.ok(matt.text.includes("Jag letar efter en liten vän"));
    assert.equal(matt.inom, true); assert.equal(matt.hel, true);
    console.log(`Synligt kvitto ${viewport.width}:`, JSON.stringify(matt));
    if (cdp && bilder) {
      await mkdir(bilder, { recursive: true });
      const bild = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      await writeFile(`${bilder}/storlek-miss-${viewport.width}.png`, Buffer.from(bild.data, "base64"));
    }
    await page.getByTestId("bengtsson-ikon").click(); await page.getByTestId("uppdrag-los-i-boken").click();
    await skriv("en liten mus");
    await page.waitForFunction(() => window.__trollMinne.getState().uppdrag["pytteliten-kompis"] === "klar");
    const klar = await page.evaluate(() => ({ ang: window.__trollMinne.getState().ang, stjarnor: window.__trollMinne.getState().stjarnor }));
    assert.equal(klar.ang.length, fore.ang.length + 2);
    assert.equal(klar.ang[0].uid, fore.ang[0].uid); assert.equal(klar.ang[1].uid, miss.ang[1].uid);
    assert.equal(klar.ang.at(-1).kropp, "mus"); assert.ok(klar.ang.at(-1).skala <= 0.75, "storleken sparas på musen");
    assert.ok(klar.stjarnor > fore.stjarnor);
    if (bilder) await page.screenshot({ path: `${bilder}/storlek-ratt-${viewport.width}.png` });
    if (cdp) await cdp.detach();
    assert.deepEqual(fel, []);
    console.log(`Grönt B1 pytteliten-kompis: liten sten → sparad nära miss → liten mus, ${viewport.width}×${viewport.height}`);
    await context.close();
  }
} finally { await browser.close(); }
