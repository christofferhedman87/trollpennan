#!/usr/bin/env node
// Regressionsprov (2026-10-30): returskylten "Till Ängen" får inte ligga på önskebubblan på utflykterna.
// Före rättningen låg skylten (z 35) på bubblans nedre del i alla fem format på Skogen, Sjön och Grottan: texten gick
// inte att läsa och ett tryck mitt i bubblan skickade barnet hem. Provet mäter verkliga rutor, inte kod.
//
// Kör mot en byggd sida:  npm run build:pages && npx vite preview --config vite.pages.config.ts --port 4173 --strictPort
//                         node scripts/prov-vagvisare-bubbla.mjs [url]       (standard http://127.0.0.1:4173/)
// CHROMIUM=/sökväg/till/chrome om Playwrights webbläsare inte matchar. QA_FORMAT=375x812 och QA_PLATS=skogen begränsar.
// Syntetisk, isolerad profil per körning (ingen riktig sparfil). Skärmbilder: QA_SCREENSHOTS=mapp (bara för egen kontroll).
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const adress = process.argv[2] ?? "http://127.0.0.1:4173/";
const reporot = process.env.TROLLPENNAN_REPO ?? process.cwd();
const bildmapp = process.env.QA_SCREENSHOTS;
if (bildmapp) await mkdir(bildmapp, { recursive: true });
const onskningar = JSON.parse(await readFile(join(reporot, "data", "onskningar.json"), "utf8")).onskningar;
const onska = onskningar.find((o) => o.id === "modig");
assert.ok(onska, "befintlig önskan finns");
const format = [[375, 812], [390, 844], [812, 375], [768, 1024], [1280, 800]].filter(([w, h]) => !process.env.QA_FORMAT || `${w}x${h}` === process.env.QA_FORMAT);
const platser = ["skogen", "sjon", "grottan"].filter((p) => !process.env.QA_PLATS || p === process.env.QA_PLATS);
const SVANS = 8; // bubblans svans ligger utanför dess rektangel
const logg = (t) => console.log(new Date().toISOString(), t);
const sidfel = [];
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || undefined,
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});

const rutor = (page) =>
  page.evaluate(() => {
    const r = (e) => {
      if (!e) return null;
      const q = e.getBoundingClientRect();
      return { left: q.left, top: q.top, right: q.right, bottom: q.bottom, width: q.width, height: q.height };
    };
    return { bubbla: r(document.querySelector("[data-testid=onska-bubbla]")), skylt: r(document.querySelector(".tp-vagvisare-hud button[data-plats=ang]")), h: innerHeight, b: innerWidth };
  });

const skar = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom + SVANS && a.bottom > b.top;

for (const [W, H] of format) {
  for (const plats of platser) {
    const namn = `${W}x${H}-${plats}`;
    const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, reducedMotion: "reduce" });
    const page = await context.newPage();
    page.setDefaultTimeout(45000);
    page.on("pageerror", (e) => sidfel.push(`${namn}: ${e.message}`));
    await page.addInitScript(() => {
      if (sessionStorage.getItem("vagvisare-prov")) return;
      sessionStorage.setItem("vagvisare-prov", "1");
      localStorage.setItem("trollpennan-v2", JSON.stringify({
        version: 2, introSedd: true, startLage: "skriv", startLageVald: true,
        ang: [{ uid: "prov-kanin", skapad: Date.now(), kropp: "kanin", formel: "en kanin", beskrivning: "en kanin", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [] }],
        garden: [], stjarnor: 17, dal: { utbyggnader: [] }, egnaDjur: 5, dragit: true, ljudPa: false, rostPa: false, effektPa: false,
        plats: "ang", platsSkapelser: {}, oppnadePlatser: ["skogen", "sjon", "grottan"], seddaIntro: ["skogen", "sjon", "grottan"],
        forstaKarta: false, onskan: null, onskaVid: Date.now() + 3600000, uppdrag: {},
      }));
      localStorage.setItem("trollpennan-skapa-v1", JSON.stringify({ bokstavsljud: false }));
    });
    try {
      await page.goto(adress, { timeout: 120000 });
      await page.waitForFunction(() => !!window.__troll && !!window.__trollMinne, null, { timeout: 120000 });
      await page.getByTestId("pennans-bok").waitFor({ state: "visible" });
      await page.getByTestId("ut-pa-aventyr").click();
      await page.getByTestId("karta").waitFor({ state: "visible" });
      await page.getByTestId(`plats-${plats}`).click();
      await page.waitForFunction((p) => window.__trollMinne.getState().plats === p, plats);
      await page.getByTestId("karta").waitFor({ state: "hidden" });
      const skylt = page.locator(".tp-vagvisare-hud button[data-plats=ang]");
      await skylt.waitFor({ state: "visible" });
      await page.waitForTimeout(1500);
      const fore = await rutor(page);
      assert.equal(fore.bubbla, null, "ingen bubbla innan en önskan finns");

      await page.evaluate((id) => window.__troll.onska(id, false), onska.id);
      await page.getByTestId("onska-bubbla").waitFor({ state: "visible" });
      await page.waitForTimeout(900); // mätningen körs var 200:e ms
      const m = await rutor(page);
      if (bildmapp) await page.screenshot({ path: join(bildmapp, `${namn}.png`) });
      assert.ok(m.bubbla && m.skylt, "båda syns");
      assert.equal(skar(m.skylt, m.bubbla), false, `skylten täcker bubblan: ${JSON.stringify(m)}`);
      assert.ok(m.skylt.width >= 44 && m.skylt.height >= 44, "skylten är fortfarande minst 44 px");
      assert.ok(m.skylt.left >= 0 && m.skylt.right <= m.b && m.skylt.top >= 0 && m.skylt.bottom <= m.h, `skylten är helt i bild: ${JSON.stringify(m.skylt)}`);
      // Knapparna längst ner (Skriv, Min bok) ligger fria: skylten når aldrig lägre än 64 % av höjden.
      assert.ok(m.skylt.bottom <= m.h * 0.64 + 1, `skylten står över knapparna längst ner: ${m.skylt.bottom} > ${m.h * 0.64}`);

      // Ett tryck mitt i bubblans synliga del öppnar önskan och skickar inte barnet hem.
      const synlig = { x: (Math.max(0, m.bubbla.left) + Math.min(m.b, m.bubbla.right)) / 2, y: (Math.max(0, m.bubbla.top) + Math.min(m.h, m.bubbla.bottom)) / 2 };
      const traff = await page.evaluate(({ x, y }) => {
        const e = document.elementFromPoint(x, y);
        return { bubbla: !!e?.closest("[data-testid=onska-bubbla]"), skylt: !!e?.closest(".tp-vagvisare-hud"), vad: e ? `${e.tagName}.${e.className}` : null };
      }, synlig);
      assert.equal(traff.skylt, false, `skylten ligger på bubblans mitt: ${JSON.stringify(traff)}`);
      assert.equal(traff.bubbla, true, `bubblan träffas i sin mitt: ${JSON.stringify(traff)}`);
      await page.mouse.click(synlig.x, synlig.y);
      await page.getByTestId("bok-skarm").waitFor({ state: "visible" });
      assert.ok((await page.locator(".sk-lapp-text").textContent()).includes(onska.text), "önskans egen lapp visas");
      assert.equal(await page.evaluate(() => window.__trollMinne.getState().plats), plats, "önskan öppnades utan att resa");
      await page.keyboard.press("Escape");
      await page.getByTestId("bok-skarm").waitFor({ state: "hidden" });

      // Utan bubbla står skylten på sin vanliga plats igen.
      await page.evaluate(() => window.__trollMinne.getState().sattOnska(null));
      await page.getByTestId("onska-bubbla").waitFor({ state: "hidden" });
      await page.waitForTimeout(900);
      const efter = await rutor(page);
      assert.ok(Math.abs(efter.skylt.top - fore.skylt.top) <= 1, `skylten återgår: ${fore.skylt.top} → ${efter.skylt.top}`);

      // Och skylten går fortfarande att trycka på: hemresa till Ängen.
      await skylt.click();
      await page.waitForFunction(() => window.__trollMinne.getState().plats === "ang", null, { timeout: 15000 });
      logg(`${namn}: grönt (skylt ${Math.round(fore.skylt.top)}→${Math.round(m.skylt.top)} px, bubbla ${Math.round(m.bubbla.top)}–${Math.round(m.bubbla.bottom)})`);
    } catch (e) {
      if (bildmapp) await page.screenshot({ path: join(bildmapp, `${namn}-fel.png`) }).catch(() => {});
      console.error(`VAGVISARE RÖTT i ${namn}:`, e.message);
      process.exitCode = 1;
    } finally {
      await context.close();
    }
  }
}
await browser.close();
if (sidfel.length) {
  console.error("Sidfel:", sidfel);
  process.exitCode = 1;
}
console.log(process.exitCode ? "VÄGVISAREPROVET RÖTT" : "VÄGVISAREPROVET GRÖNT");
