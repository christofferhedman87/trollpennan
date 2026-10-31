#!/usr/bin/env node
// T05: den riktiga Trolla-vägen behåller skapelsen, bedömer betydelsen och visar en vänlig ledtråd.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/bin/chromium", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  for (const viewport of [{ width: 375, height: 812 }, { width: 812, height: 375 }]) {
    if (process.env.QA_LAGE && viewport.width !== Number(process.env.QA_LAGE)) continue;
    for (const [id, nej, ja, antal, ledtrad] of [
      ["vingar-i-luften", "en hund", "en hund som flyger", 1, "en vän som kan flyga"],
      ["tva-farger", "en röd katt", "en röd katt och en blå hund", 2, "två vänner: en röd och en blå"],
    ].filter(([id]) => !process.env.QA_FALL || id === process.env.QA_FALL)) {
      const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
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
      const fore = await page.evaluate(() => ({ antal: window.__trollMinne.getState().ang.length, stjarnor: window.__trollMinne.getState().stjarnor }));
      await skriv(nej);
      await page.waitForFunction((n) => window.__trollMinne.getState().ang.length === n + 1, fore.antal);
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
      assert.equal(await page.evaluate(() => window.__trollMinne.getState().ang.length), fore.antal + 1 + antal);
      assert.ok(await page.evaluate(() => window.__trollMinne.getState().stjarnor) > fore.stjarnor);
      assert.deepEqual(fel, []); console.log(`Grönt T05 ${id}: nära miss → bevarad skapelse/ledtråd → rätt svar, ${viewport.width}×${viewport.height}`);
      await context.close();
    }
  }
} finally { await browser.close(); }
