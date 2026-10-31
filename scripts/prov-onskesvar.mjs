#!/usr/bin/env node
// T06: riktiga svar på samma önskan, synlig ledtråd, rätt djur och sparning även på utflykt.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import onskningar from "../data/onskningar.json" with { type: "json" };
const adress = process.argv[2] ?? "http://127.0.0.1:4180/";
const bilder = process.env.QA_SCREENSHOTS;
const scenarier = {
  tassar: { id: "frusna-tassar", nej: "med hatt", ja: "med strumpor", felDel: "hatt", rattDel: "strumpa" },
  kalla: { id: "frusna-tassar", nej: "med kalla strumpor", ja: "med varma strumpor", felDel: "strumpa", rattDel: "strumpa" },
  syn: { id: "suddigt", nej: "med hatt", ja: "med glasögon", felDel: "hatt", rattDel: "glasögon", grund: "solglasögon" },
  aldre: { id: "frusna-tassar", nej: "med hatt", ja: "med stövlar", felDel: "hatt", rattDel: "stovlar", grund: "strumpa" },
  fritt: { id: "kompis-fisk" },
};
const valda = (process.env.QA_FALL || "tassar").split(",");
for (const id of valda) assert.ok(scenarier[id], `okänt provfall ${id}`);
if (bilder) await mkdir(bilder, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/bin/chromium", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  for (const viewport of [{ width: 375, height: 812 }, { width: 812, height: 375 }].filter((v) => !process.env.QA_LAGE || String(v.width) === process.env.QA_LAGE)) {
    for (const plats of ["ang", "sjon"].filter((p) => !process.env.QA_PLATS || p === process.env.QA_PLATS)) {
     for (const fall of valda) {
      const scenario = scenarier[fall];
      const onskan = onskningar.onskningar.find((o) => o.id === scenario.id);
      const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
      const page = await context.newPage(); page.setDefaultTimeout(45000);
      const fel = [], konsolfel = []; page.on("pageerror", (e) => fel.push(e.message));
      page.on("console", (m) => { if (m.type() === "error") konsolfel.push(m.text()); });
      await page.addInitScript(({ plats, grund }) => {
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
        // Grundplaggen saknar avsiktligt ny metadata: detta är en faktisk äldre v2.
        const formel = grund === "solglasögon" ? "en kanin med solglasögon" : grund ? "en kanin med strumpor" : "en kanin";
        const djur = (uid) => ({ uid, skapad: 1, kropp: "kanin", formel, beskrivning: formel, skala: 1, alpha: 1, formagor: [],
          tillbehor: grund ? [{ id: grund === "solglasögon" ? "glasögon" : grund, farg: grund === "solglasögon" ? "#212121" : null, glans: false }] : [], overraskningar: [] });
        localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, egnaDjur: 5, dragit: true, startLage: "skriv", startLageVald: true,
          ang: [djur("onske-hemma")], platsSkapelser: { sjon: [djur("onske-sjon")] }, plats, oppnadePlatser: ["skogen", "sjon"], seddaIntro: ["skogen", "sjon"],
          garden: [], stjarnor: 17, ljudPa: false, rostPa: false, effektPa: false, onskaVid: Date.now() + 3600000, uppdrag: {} }));
        localStorage.setItem("trollpennan-skapa-v1", '{"bokstavsljud":false}');
      }, { plats, grund: scenario.grund });
      await page.goto(adress, { timeout: 120000 });
      await page.waitForFunction(() => !!window.__trollMinne && !!window.__troll);
      const uid = plats === "ang" ? "onske-hemma" : "onske-sjon";
      // Endast uppställning: en bestämd önskan åt det verkliga djuret på aktuell plats.
      await page.evaluate(({ uid, id }) => {
        window.__troll.onska(id, false);
        const s = window.__trollMinne.getState(); s.sattOnska({ ...s.onskan, uid });
      }, { uid, id: scenario.id });
      const djuret = () => page.evaluate((uid) => {
        const s = window.__trollMinne.getState(); return [...s.ang, ...Object.values(s.platsSkapelser).flat()].find((d) => d.uid === uid);
      }, uid);
      const skriv = async (text) => {
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
      const svara = async (text) => {
        await page.getByTestId("onska-bubbla").click(); await page.getByTestId("tangentbord").waitFor();
        assert.ok((await page.locator(".sk-lapp-text").innerText()).includes(onskan.text));
        await skriv(text);
      };
      if (fall === "fritt") {
        await page.waitForFunction((uid) => JSON.parse(localStorage.getItem("trollpennan-v2")).onskan?.uid === uid, uid);
        await page.reload(); await page.getByTestId("pennans-bok").click(); await page.getByTestId("tangentbord").waitFor();
        assert.equal(await page.getByTestId("onska-remsa").count(), 0, "vanlig bok har inget uttryckligen öppnat önskemål");
        await skriv("en boll");
        await page.waitForFunction(() => window.__onskeKvitto?.includes("en boll"));
        assert.equal((await page.evaluate(() => window.__onskeKvitto)).includes(onskan.nastan), false, "fritt skapande bedöms inte som en negativ kompisönskan");
        assert.equal(await page.evaluate(() => window.__trollMinne.getState().onskan?.uid), uid);
        assert.deepEqual(fel, []); assert.deepEqual(konsolfel, []); console.log("Grönt oöppnad önskan i fri bok", plats, viewport.width);
        await context.close(); continue;
      }
      await svara(process.env.QA_NEJ || scenario.nej);
      assert.equal(await page.evaluate(() => window.__trollMinne.getState().onskan?.uid), uid, "nära miss behåller just denna önskan");
      assert.ok((await djuret()).tillbehor.some((t) => t.id === (process.env.QA_NEJ ? "glasögon" : scenario.felDel)), "även det oönskade tillägget bevaras på rätt djur");
      await page.waitForFunction((text) => window.__onskeKvitto?.includes(text), onskan.nastan, { timeout: 15000 });
      if (bilder) await page.screenshot({ path: `${bilder}/${fall}-${plats}-${viewport.width}-ledtrad.png` });
      console.log("Grönt önskesvar nära miss", fall, plats, viewport.width);
      await page.locator('[data-dal="kvitto"]').waitFor({ state: "hidden", timeout: 15000 });
      await page.reload(); await page.getByTestId("pennans-bok").waitFor();
      assert.equal(await page.evaluate(() => window.__trollMinne.getState().onskan?.uid), uid, "önskan kvar efter riktig omladdning");
      await svara(scenario.ja);
      assert.equal(await page.evaluate(() => window.__trollMinne.getState().onskan), null);
      assert.ok((await djuret()).tillbehor.some((t) => t.id === scenario.rattDel));
      await page.waitForFunction((text) => window.__onskeKvitto?.includes(text), onskan.tack, { timeout: 15000 });
      if (bilder) await page.screenshot({ path: `${bilder}/${fall}-${plats}-${viewport.width}-tack.png` });
      await page.reload(); await page.getByTestId("pennans-bok").waitFor();
      assert.equal(await page.evaluate(() => window.__trollMinne.getState().onskan), null);
      assert.ok((await djuret()).tillbehor.some((t) => t.id === scenario.rattDel));
      assert.deepEqual(fel, []); assert.deepEqual(konsolfel, []); console.log("Grönt önskesvar rätt svar och omladdning", fall, plats, viewport.width);
      await context.close();
     }
    }
  }
} finally { await browser.close(); }
