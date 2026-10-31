#!/usr/bin/env node
// T08: riktiga tangenter/Trolla, rätt antal huvuden och tillbehör, full formel samt omladdning.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
const adress = process.argv[2] || "http://127.0.0.1:4183/";
const bilder = process.env.QA_SCREENSHOTS;
if (bilder) await mkdir(bilder, { recursive: true });
const fraser = [
  { text: "en kanin med två strumpor", antal: 1, saker: { strumpa: 2 } },
  { text: "en katt med två äpplen", antal: 1, saker: { apple: 2 } },
  { text: "tre morötter", antal: 3, saker: {} },
  { text: "en katt med en morot och en morot", antal: 1, saker: { morot: 2 } },
  { text: "ett hus med ett tak av guld", bygg: true },
  { text: "en katt med två vingar och en hatt", antal: 1, saker: { hatt: 1 } },
  { text: "en katt under det stora bordet", antal: 1, saker: { bord: 1 } },
  { text: "en katt under de två stora borden", antal: 1, saker: { bord: 2 } },
];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/bin/chromium", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  for (const viewport of [{ width: 375, height: 812 }, { width: 812, height: 375 }].filter((v) => !process.env.QA_LAGE || String(v.width) === process.env.QA_LAGE)) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage(); page.setDefaultTimeout(60000);
    const fel = [], konsolfel = [];
    page.on("pageerror", (e) => fel.push(e.message)); page.on("console", (m) => { if (m.type() === "error") konsolfel.push(m.text()); });
    await page.addInitScript(() => {
      if (sessionStorage.getItem("antal-prov")) return;
      sessionStorage.setItem("antal-prov", "1");
      localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, startLage: "skriv", startLageVald: true,
        ang: [{ uid: "antal-prov", skapad: 1, kropp: "kanin", formel: "en kanin", beskrivning: "en kanin", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [] }],
        garden: [], stjarnor: 17, egnaDjur: 5, dragit: true, ljudPa: false, rostPa: false, effektPa: false, onskaVid: Date.now() + 3600000, uppdrag: {} }));
      localStorage.setItem("trollpennan-skapa-v1", '{"bokstavsljud":false}');
    });
    await page.goto(adress, { timeout: 120000 }); await page.waitForFunction(() => !!window.__trollMinne);
    const alla = () => page.evaluate(() => { const s = window.__trollMinne.getState(); return [...s.ang, ...s.sovande, ...s.hemma.map((h) => h.spec), ...Object.values(s.platsSkapelser).flat(), ...s.garden]; });
    const skapade = [];
    for (const p of fraser.filter((p) => !process.env.QA_FALL || process.env.QA_FALL.split("|").includes(p.text))) {
      await page.getByTestId("pennans-bok").click(); await page.getByTestId("tangentbord").waitFor();
      await page.locator('[data-dal="skrivbricka"]').click();
      for (const del of p.text.split(/([åäö])/)) {
        if (!del) continue;
        if (/^[åäö]$/.test(del)) await page.getByTestId("tangentbord").getByRole("button", { name: del, exact: true }).click();
        else await page.keyboard.type(del);
      }
      assert.equal(await page.getByTestId("ord-input").inputValue(), p.text, "barnets exakta egna ord före Trolla");
      const fore = new Set((await alla()).map((d) => d.uid));
      await page.getByTestId("vakna").click(); await page.getByTestId("bok-skarm").waitFor({ state: "hidden" });
      const nya = (await alla()).filter((d) => !fore.has(d.uid));
      assert.equal(nya.length, p.bygg ? 1 : p.antal, "tillbehörsantal får inte bli nya huvuddjur");
      for (const d of nya) {
        assert.equal(d.formel, p.text);
        if (!p.bygg) {
          const saker = {};
          for (const t of d.tillbehor) saker[t.id] = (saker[t.id] ?? 0) + (t.antal ?? 1);
          assert.deepEqual(saker, p.saker);
        }
        skapade.push(JSON.parse(JSON.stringify(d)));
      }
      // Låt vanligt kvitto löpa ut. Inget klick tvingas mot en redan utgången replik.
      await page.locator('[data-dal="kvitto"]').waitFor({ state: "hidden", timeout: 15000 });
      if (bilder) await page.screenshot({ path: `${bilder}/${viewport.width}-${p.bygg ? "tak" : skapade.length}.png` });
      console.log("Grönt antal/formel", viewport.width, p.text, nya.length);
    }
    await page.reload(); await page.getByTestId("pennans-bok").waitFor();
    const efter = JSON.parse(JSON.stringify(await alla()));
    for (const d of skapade) assert.deepEqual(efter.find((x) => x.uid === d.uid), d, "hela skapelsen med antal/ord/egenskaper sparas");
    assert.deepEqual(fel, []); assert.deepEqual(konsolfel, []);
    console.log("Grönt antal/formel efter omladdning", viewport.width, skapade.length);
    await context.close();
  }
} finally { await browser.close(); }
