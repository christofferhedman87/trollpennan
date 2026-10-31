#!/usr/bin/env node
// T06: riktiga svar på samma önskan, synlig ledtråd, rätt djur och sparning även på utflykt.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
const adress = process.argv[2] ?? "http://127.0.0.1:4180/";
const bilder = process.env.QA_SCREENSHOTS;
if (bilder) await mkdir(bilder, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/bin/chromium", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  for (const viewport of [{ width: 375, height: 812 }, { width: 812, height: 375 }].filter((v) => !process.env.QA_LAGE || String(v.width) === process.env.QA_LAGE)) {
    for (const plats of ["ang", "sjon"].filter((p) => !process.env.QA_PLATS || p === process.env.QA_PLATS)) {
      const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
      const page = await context.newPage(); page.setDefaultTimeout(45000);
      const fel = []; page.on("pageerror", (e) => fel.push(e.message));
      await page.addInitScript((plats) => {
        window.__onskeKvitto = null;
        const lasKvitto = () => {
          const e = document.querySelector('[data-dal="kvitto"]'); if (!e) return;
          const r = e.getBoundingClientRect();
          if (r.width <= 0 || r.height <= 0 || r.top < 0 || r.left < 0 || r.bottom > innerHeight || r.right > innerWidth || getComputedStyle(e).opacity === "0") return;
          if (e.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2))) window.__onskeKvitto = e.innerText;
        };
        addEventListener("DOMContentLoaded", () => new MutationObserver(() => { lasKvitto(); requestAnimationFrame(lasKvitto); }).observe(document.body, { childList: true, subtree: true, attributes: true }));
        if (sessionStorage.getItem("onskesvar-prov")) return;
        sessionStorage.setItem("onskesvar-prov", "1");
        const djur = (uid) => ({ uid, skapad: 1, kropp: "kanin", formel: "en kanin", beskrivning: "en kanin", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [] });
        localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, egnaDjur: 5, dragit: true, startLage: "skriv", startLageVald: true,
          ang: [djur("onske-hemma")], platsSkapelser: { sjon: [djur("onske-sjon")] }, plats, oppnadePlatser: ["skogen", "sjon"], seddaIntro: ["skogen", "sjon"],
          garden: [], stjarnor: 17, ljudPa: false, rostPa: false, effektPa: false, onskaVid: Date.now() + 3600000, uppdrag: {} }));
        localStorage.setItem("trollpennan-skapa-v1", '{"bokstavsljud":false}');
      }, plats);
      await page.goto(adress, { timeout: 120000 });
      await page.waitForFunction(() => !!window.__trollMinne && !!window.__troll);
      const uid = plats === "ang" ? "onske-hemma" : "onske-sjon";
      // Endast uppställning: en bestämd önskan åt det verkliga djuret på aktuell plats.
      await page.evaluate((uid) => {
        window.__troll.onska("frusna-tassar", false);
        const s = window.__trollMinne.getState(); s.sattOnska({ ...s.onskan, uid });
      }, uid);
      const djuret = () => page.evaluate((uid) => {
        const s = window.__trollMinne.getState(); return [...s.ang, ...Object.values(s.platsSkapelser).flat()].find((d) => d.uid === uid);
      }, uid);
      const svara = async (text) => {
        await page.getByTestId("onska-bubbla").click();
        await page.getByTestId("tangentbord").waitFor();
        assert.match(await page.locator(".sk-lapp-text").innerText(), /tassarna/);
        await page.locator('[data-dal="skrivbricka"]').click();
        for (const bit of text.split(/([åäö])/)) {
          if (!bit) continue;
          if (/^[åäö]$/.test(bit)) await page.getByTestId("tangentbord").getByRole("button", { name: bit, exact: true }).click();
          else await page.keyboard.type(bit);
        }
        assert.equal(await page.getByTestId("ord-input").inputValue(), text);
        await page.evaluate(() => { window.__onskeKvitto = null; });
        await page.getByTestId("vakna").click();
        await page.getByTestId("bok-skarm").waitFor({ state: "hidden", timeout: 10000 });
      };
      await svara(process.env.QA_NEJ || "med hatt");
      assert.equal(await page.evaluate(() => window.__trollMinne.getState().onskan?.uid), uid, "nära miss behåller just denna önskan");
      assert.ok((await djuret()).tillbehor.some((t) => t.id === (process.env.QA_NEJ ? "glasögon" : "hatt")), "även det oönskade tillägget bevaras på rätt djur");
      await page.waitForFunction(() => window.__onskeKvitto?.includes("Mina tassar är fortfarande kalla"), null, { timeout: 15000 });
      if (bilder) await page.screenshot({ path: `${bilder}/${plats}-${viewport.width}-ledtrad.png` });
      console.log("Grönt önskesvar nära miss", plats, viewport.width);
      await page.locator('[data-dal="kvitto"]').waitFor({ state: "hidden", timeout: 15000 });
      await page.reload(); await page.getByTestId("pennans-bok").waitFor();
      assert.equal(await page.evaluate(() => window.__trollMinne.getState().onskan?.uid), uid, "önskan kvar efter riktig omladdning");
      await svara("med strumpor");
      assert.equal(await page.evaluate(() => window.__trollMinne.getState().onskan), null);
      assert.ok((await djuret()).tillbehor.some((t) => t.id === "strumpa"));
      await page.waitForFunction(() => window.__onskeKvitto?.includes("nu är jag varm ända ut i tårna"), null, { timeout: 15000 });
      if (bilder) await page.screenshot({ path: `${bilder}/${plats}-${viewport.width}-tack.png` });
      await page.reload(); await page.getByTestId("pennans-bok").waitFor();
      assert.equal(await page.evaluate(() => window.__trollMinne.getState().onskan), null);
      assert.ok((await djuret()).tillbehor.some((t) => t.id === "strumpa"));
      assert.deepEqual(fel, []); console.log("Grönt önskesvar rätt svar och omladdning", plats, viewport.width);
      await context.close();
    }
  }
} finally { await browser.close(); }
