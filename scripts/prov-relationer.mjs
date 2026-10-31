#!/usr/bin/env node
// C1b: faktisk egen text, skapad/sparad formel och valfri relationsdata. C1c provar fysisk placering separat.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
const adress = process.argv[2] ?? "http://127.0.0.1:4177/";
const bilder = process.env.QA_SCREENSHOTS;
if (bilder) await mkdir(bilder, { recursive: true });
const fall = [
  ["en katt under ett bord", "bord", "under"],
  ["en katt på en sten", "sten", "på"],
  ["en katt vid en hink", "hink", "vid"],
  ["en katt bredvid ett bord", "bord", "bredvid"],
  ["en katt i en låda", "kartong", "i"],
  ["en kanin med strumpor", "strumpa", "med"],
  ["en kanin med vingar", null, null],
];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/bin/chromium", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  for (const viewport of [{ width: 375, height: 812 }, { width: 812, height: 375 }].filter((v) => !process.env.QA_LAGE || String(v.width) === process.env.QA_LAGE)) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage(); page.setDefaultTimeout(60000);
    const fel = []; page.on("pageerror", (e) => fel.push(e.message));
    await page.addInitScript(() => {
      // Kvittot kan ha hunnit löpa ut när ett senare protokollanrop ska läsa det.
      // Fånga den faktiska texten medan hela knappen syns och har fri träffyta.
      window.__relationsKvitto = null;
      const lasKvitto = () => {
        const e = document.querySelector('[data-dal="kvitto"]');
        if (!e) return;
        const r = e.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0 || r.top < 0 || r.left < 0 || r.bottom > innerHeight || r.right > innerWidth || getComputedStyle(e).opacity === "0") return;
        if (!e.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2))) return;
        window.__relationsKvitto = e.innerText;
      };
      addEventListener("DOMContentLoaded", () => new MutationObserver(() => {
        lasKvitto(); requestAnimationFrame(lasKvitto);
      }).observe(document.body, { childList: true, subtree: true, attributes: true }));
    });
    await page.addInitScript(() => {
      if (sessionStorage.getItem("relationer-prov")) return;
      sessionStorage.setItem("relationer-prov", "1");
      localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, startLage: "skriv", startLageVald: true,
        ang: [{ uid: "relation-prov", skapad: 1, kropp: "kanin", formel: "en kanin", beskrivning: "en kanin", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [] }],
        garden: [], stjarnor: 17, egnaDjur: 5, dragit: true, ljudPa: false, rostPa: false, effektPa: false, onskan: null, onskaVid: Date.now() + 3600000, uppdrag: {} }));
      localStorage.setItem("trollpennan-skapa-v1", '{"bokstavsljud":false}');
    });
    await page.goto(adress, { timeout: 120000 });
    const skapade = [];
    for (const [text, id, relation] of fall) {
      await page.getByTestId("pennans-bok").click();
      await page.getByTestId("tangentbord").waitFor();
      await page.locator('[data-dal="skrivbricka"]').click();
      // Playwrights insertText för å/ä/ö når inte spelets keydown; dessa bokstäver skrivs på de riktiga skärmtangenterna.
      for (const bit of text.split(/([åäö])/)) {
        if (!bit) continue;
        if (/^[åäö]$/.test(bit)) await page.getByTestId("tangentbord").getByRole("button", { name: bit, exact: true }).click();
        else await page.keyboard.type(bit);
      }
      assert.equal(await page.getByTestId("ord-input").inputValue(), text, "exakt egen text före Trolla");
      const fore = await page.evaluate(() => { window.__relationsKvitto = null; return window.__trollMinne.getState().ang.map((d) => d.uid); });
      await page.getByTestId("vakna").click();
      await page.waitForFunction((gamla) => window.__trollMinne.getState().ang.some((d) => !gamla.includes(d.uid)), fore);
      await page.getByTestId("bok-skarm").waitFor({ state: "hidden" });
      const d = await page.evaluate((gamla) => window.__trollMinne.getState().ang.find((d) => !gamla.includes(d.uid)), fore);
      assert.equal(d.formel, text, "den verkligt skapade formeln behåller relation/ordform");
      assert.ok(d?.uid);
      if (id) assert.equal(d.tillbehor.find((t) => t.id === id)?.relation, relation);
      else assert.ok(d.formagor.includes("vingar"));
      const kvitto = page.locator('[data-dal="kvitto"]');
      await page.waitForFunction((t) => window.__relationsKvitto?.includes(t), text, { timeout: 15000 });
      if (bilder && (relation === "under" || !id)) await page.screenshot({ path: `${bilder}/${viewport.width}-${relation || "vingar"}.png` });
      // Kvittot stänger sig med lästid. Försök inte klicka ett kvitto som hinner gå ut mellan två protokollanrop.
      await kvitto.waitFor({ state: "hidden", timeout: 15000 });
      skapade.push(JSON.parse(JSON.stringify(d)));
      console.log("Grönt egen formel", viewport.width, text, d.uid);
    }
    await page.reload();
    await page.getByTestId("pennans-bok").waitFor();
    const efter = await page.evaluate(() => { const s = window.__trollMinne.getState(); return [...s.ang, ...s.sovande]; });
    for (const d of skapade) assert.deepEqual(efter.find((x) => x.uid === d.uid), d, "formel/relation bevaras vid riktig omladdning");
    assert.deepEqual(fel, []);
    console.log("Grönt omladdning", viewport.width, skapade.length);
    await context.close();
  }
} finally { await browser.close(); }
