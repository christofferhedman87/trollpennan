// Block 5a: hela önskan och Hjälp till ska synas utan krock med HUD, Väktare eller returskylt.
// Syntetiska isolerade profiler, verkliga klick. QA_FORMAT=375x812, QA_PLATS=skogen och QA_SCREENSHOTS=mapp begränsar/sparar internt.
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const adress = process.argv[2] ?? "http://127.0.0.1:4173/";
const rot = process.env.TROLLPENNAN_REPO ?? process.cwd();
const bilder = process.env.QA_SCREENSHOTS;
const provaCoach = process.env.QA_COACH === "tre-djur";
if (bilder) await mkdir(bilder, { recursive: true });
const onskningar = JSON.parse(await readFile(join(rot, "data/onskningar.json"), "utf8")).onskningar;
const onskan = onskningar.find((o) => o.id === "lila"); // längsta befintliga önsketexten inklusive Bengtssons inledning
assert.ok(onskan);
const format = [[375, 812], [390, 844], [812, 375], [768, 1024], [1280, 800]].filter(([w, h]) => !process.env.QA_FORMAT || `${w}x${h}` === process.env.QA_FORMAT);
const platser = ["skogen", "sjon", "grottan", "ang"].filter((p) => !process.env.QA_PLATS || p === process.env.QA_PLATS);
assert.ok(format.length && platser.length);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const sidfel = [];
const skar = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
const ruta = (page) => page.evaluate(() => {
  const mat = (e) => {
    const r = e.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height, vad: e.getAttribute("data-testid") || e.className };
  };
  const hinder = [...document.querySelectorAll('.hud, .coach-bubbla, [data-s4="vaktar-aptitbubbla"], .tp-vagvisare-hud button, [data-testid="pennans-bok"], [data-testid="meny"], [data-testid="bengtsson-ikon"]')]
    .filter((e) => { const s = getComputedStyle(e); return e.getBoundingClientRect().width > 0 && s.display !== "none" && s.visibility !== "hidden" && s.opacity !== "0"; }).map(mat);
  const text = document.querySelector('[data-s4="vaktar-aptitbubbla"] p');
  return { bubbla: mat(document.querySelector('[data-testid="onska-bubbla"]')), hinder, w: innerWidth, h: innerHeight, scroll: document.documentElement.scrollWidth,
    remsaRyms: !text || (text.scrollWidth <= text.clientWidth + 1 && text.scrollHeight <= text.clientHeight + 1),
    skylt: document.querySelector('.tp-vagvisare-hud button[data-plats="ang"]') ? mat(document.querySelector('.tp-vagvisare-hud button[data-plats="ang"]')) : null,
    remsa: document.querySelector('[data-s4="vaktar-aptitbubbla"]') ? mat(document.querySelector('[data-s4="vaktar-aptitbubbla"]')) : null,
  };
});
const logg = (s) => console.log(new Date().toISOString(), s);
try {
  for (const [w, h] of format) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    page.setDefaultTimeout(45000);
    page.on("pageerror", (e) => sidfel.push(e.message));
    await page.addInitScript((coach) => {
      localStorage.setItem("trollpennan-v2", JSON.stringify({
        version: 2, introSedd: true, startLage: "skriv", startLageVald: true, egnaDjur: coach ? 2 : 5, dragit: !coach,
        ang: [{ uid: "bubbel-kanin", skapad: Date.now() - 60000, kropp: "kanin", formel: "en kanin", beskrivning: "en kanin", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [] }],
        garden: [], stjarnor: 17, dal: { utbyggnader: [] }, ljudPa: false, rostPa: false, effektPa: false,
        plats: "ang", platsSkapelser: {}, oppnadePlatser: ["skogen", "sjon", "grottan"], seddaIntro: ["skogen", "sjon", "grottan"],
        forstaKarta: false, onskan: null, onskaVid: Date.now() + 3600000, uppdrag: coach ? { "kanin-fryser": "klar" } : {},
      }));
    }, provaCoach);
    try {
      await page.goto(adress);
      await page.waitForFunction(() => !!window.__troll && !!window.__trollMinne, null, { timeout: 120000 });
      for (const plats of platser) {
        const namn = `${w}x${h}-${plats}`;
        logg(`${namn}: börjar`);
        await page.getByTestId("ut-pa-aventyr").click();
        await page.getByTestId(`plats-${plats}`).click();
        await page.getByTestId("karta").waitFor({ state: "hidden" });
        await page.waitForFunction((p) => window.__trollMinne.getState().plats === p, plats);
        const skylt = page.locator('.tp-vagvisare-hud button[data-plats="ang"]');
        if (plats !== "ang") await skylt.waitFor({ state: "visible" });
        await page.waitForTimeout(600);
        const skyltFore = plats === "ang" ? null : await skylt.boundingBox();
        if (provaCoach && plats === "ang") {
          await page.getByTestId("coach").waitFor({ state: "visible" });
          assert.equal(await page.getByTestId("coach").getAttribute("data-steg"), "tre-djur");
        }
        await page.evaluate((id) => window.__troll.onska(id, false), onskan.id);
        const bubbla = page.getByTestId("onska-bubbla");
        await bubbla.waitFor({ state: "visible" });
        await page.waitForTimeout(900);
        const d = await ruta(page);
        if (bilder) await page.screenshot({ path: join(bilder, `${namn}.png`) });
        assert.ok(d.bubbla.top >= 0 && d.bubbla.left >= 0 && d.bubbla.bottom <= d.h && d.bubbla.right <= d.w, `${namn}: hela önskan i bild: ${JSON.stringify(d)}`);
        assert.ok(d.bubbla.width >= 44 && d.bubbla.height >= 44);
        assert.equal(d.scroll, d.w, `${namn}: ingen sidrullning`);
        assert.ok(d.remsaRyms, `${namn}: Väktarens text ryms efter önskan`);
        assert.ok(!d.skylt || !d.remsa || !skar(d.skylt, d.remsa), `${namn}: skylt och Väktare står fria: ${JSON.stringify(d)}`);
        for (const hinder of d.hinder) assert.ok(!skar(d.bubbla, hinder), `${namn}: önskan skär ${hinder.vad}: ${JSON.stringify(d)}`);
        if (provaCoach) await page.getByTestId("coach").waitFor({ state: "hidden" });
        await bubbla.click();
        await page.getByTestId("onska-remsa").waitFor({ state: "visible" });
        assert.ok((await page.locator(".sk-lapp-text").textContent()).includes(onskan.text));
        assert.equal(await page.evaluate(() => window.__trollMinne.getState().plats), plats);
        await page.keyboard.press("Escape");
        await page.getByTestId("bok-skarm").waitFor({ state: "hidden" });
        await page.evaluate(() => window.__trollMinne.getState().sattOnska(null));
        await page.getByTestId("onska-bubbla").waitFor({ state: "hidden" });
        if (provaCoach && plats === "ang") await page.getByTestId("coach").waitFor({ state: "visible" });
        if (plats !== "ang") {
          await page.waitForTimeout(900);
          const skyltEfter = await skylt.boundingBox();
          assert.ok(skyltFore && skyltEfter && Math.abs(skyltFore.y - skyltEfter.y) <= 1, `${namn}: returskylten återgår efter önskan`);
          await skylt.click();
          await page.waitForFunction(() => window.__trollMinne.getState().plats === "ang");
        }
        logg(`${namn}: grönt (önskan ${Math.round(d.bubbla.top)}–${Math.round(d.bubbla.bottom)})`);
      }
    } finally {
      await ctx.close();
    }
  }
  assert.deepEqual(sidfel, []);
  logg("ÖNSKEBUBBLA GRÖNT");
} catch (e) {
  console.error("ÖNSKEBUBBLA RÖTT:", e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
