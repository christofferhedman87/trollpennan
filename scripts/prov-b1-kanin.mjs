#!/usr/bin/env node
// B1: kaninens uppdrag med verkliga klick och tangenter, utan reducerad rörelse.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/bin/chromium", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  for (const viewport of [{ width: 375, height: 812 }, { width: 812, height: 375 }]) {
    if (process.env.QA_LAGE && viewport.width !== Number(process.env.QA_LAGE)) continue;
    for (const [id, nej, ja, ledtrad] of [
      ["kanin-fryser", "en kanin vid en lägereld", "en hund med halsduk", "Jag letar efter något varmt att ha på sig"],
    ].filter(([id]) => !process.env.QA_FALL || id === process.env.QA_FALL)) {
      const context = await browser.newContext({ viewport, reducedMotion: "no-preference" });
      const page = await context.newPage(); page.setDefaultTimeout(45000);
      const fel = []; page.on("pageerror", (e) => fel.push(e.message));
      await page.addInitScript(() => {
        window.__qaBanners = [];
        document.addEventListener("DOMContentLoaded", () => {
          let fore = "";
          new MutationObserver(() => {
            const nu = document.querySelector(".banderoller")?.textContent ?? "";
            if (nu !== fore) { window.__qaBanners.push({ t: performance.now(), text: nu }); fore = nu; }
          }).observe(document.body, { subtree: true, childList: true, characterData: true });
        }, { once: true });
        localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, ang: [], garden: [], stjarnor: 17, ljudPa: false, rostPa: false, effektPa: false }));
        localStorage.setItem("trollpennan-skapa-v1", '{"bokstavsljud":false}');
      });
      await page.goto(process.argv[2] ?? "http://127.0.0.1:4174/", { timeout: 120000 });
      await page.waitForFunction(() => !!window.__troll);
      await page.evaluate((id) => { window.__troll.vakna("en kanin"); window.__trollMinne.setState({ uppdrag: { [id]: "pagar" } }); }, id);
      await page.waitForFunction(() => window.__trollMinne.getState().ang.length >= 1);
      await page.waitForFunction(() => window.__trollMinne.getState().ang.length === 1);
      const skriv = async (text) => {
        await page.getByTestId("tangentbord").waitFor();
        // Fysisk ASCII och riktiga å/ä/ö-knappar, aldrig insertText som hoppar över det egna tangentbordet.
        await page.locator('[data-dal="skrivbricka"]').click();
        for (const del of text.split(/([åäö])/)) {
          if (!del) continue;
          if (/^[åäö]$/.test(del)) await page.getByTestId("tangentbord").getByRole("button", { name: del, exact: true }).click();
          else await page.keyboard.type(del);
        }
        assert.equal(await page.getByTestId("ord-input").inputValue(), text);
        await page.locator('[data-dal="klar"]').click();
        await page.getByTestId("bok-skarm").waitFor({ state: "hidden" });
      };
      await page.getByTestId("bengtsson-ikon").click(); await page.getByTestId("uppdrag-los-i-boken").click();
      const fore = await page.evaluate(() => ({ ang: window.__trollMinne.getState().ang, stjarnor: window.__trollMinne.getState().stjarnor }));
      assert.equal(fore.ang.length, 1);
      assert.equal(fore.ang[0].kropp, "kanin");
      await skriv(nej);
      await page.waitForFunction(() => window.__trollMinne.getState().ang[0]?.tillbehor.some((t) => t.id === "lagereld"));
      const efterMiss = await page.evaluate(() => window.__trollMinne.getState().ang);
      assert.equal(efterMiss.length, 1);
      assert.equal(efterMiss[0].uid, fore.ang[0].uid);
      assert.equal(efterMiss[0].kropp, fore.ang[0].kropp);
      assert.deepEqual(efterMiss[0].tillbehor.map((t) => t.id), [...fore.ang[0].tillbehor.map((t) => t.id), "lagereld"]);
      assert.equal(await page.evaluate((id) => window.__trollMinne.getState().uppdrag[id], id), "pagar", "en nära miss får aldrig räknas som färdigt uppdrag");
      await page.getByText(ledtrad, { exact: false }).first().waitFor({ state: "visible" }).catch(async (e) => {
        console.log(JSON.stringify(await page.evaluate(() => ({ text: document.body.innerText, rost: window.__rost, banners: window.__qaBanners }))));
        if (process.env.QA_SCREENSHOTS) { await mkdir(process.env.QA_SCREENSHOTS, { recursive: true }); await page.screenshot({ path: `${process.env.QA_SCREENSHOTS}/saknad-ledtrad-${viewport.width}.png` }); }
        throw e;
      });
      if (process.env.QA_SCREENSHOTS) {
        await mkdir(process.env.QA_SCREENSHOTS, { recursive: true });
        await page.screenshot({ path: `${process.env.QA_SCREENSHOTS}/${id}-${viewport.width}.png` });
      }
      await page.getByTestId("bengtsson-ikon").click(); await page.getByTestId("uppdrag-los-i-boken").click();
      await skriv(ja);
      await page.waitForFunction((id) => window.__trollMinne.getState().uppdrag[id] === "klar", id);
      const efterRatt = await page.evaluate(() => window.__trollMinne.getState().ang);
      assert.equal(efterRatt.length, 1);
      assert.equal(efterRatt[0].uid, fore.ang[0].uid);
      assert.equal(efterRatt[0].kropp, fore.ang[0].kropp);
      assert.deepEqual(efterRatt[0].tillbehor.map((t) => t.id), [...efterMiss[0].tillbehor.map((t) => t.id), "halsduk"]);
      assert.ok(await page.evaluate(() => window.__trollMinne.getState().stjarnor) > fore.stjarnor);
      assert.deepEqual(fel, []); console.log(`Grönt T05 ${id}: nära miss → bevarad skapelse/ledtråd → rätt svar, ${viewport.width}×${viewport.height}`);
      await context.close();
    }
  }
} finally { await browser.close(); }
