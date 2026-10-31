#!/usr/bin/env node
// T-22: varje ruta i Min bok öppnar rätt panel, och Ordbokens siffra är samma som rutans. Riktiga tryck,
// 375×812 och 812×375. Lådan provas tom (tomvy och Stäng). QA_LAGE=375|812 väljer en vy. QA_SCREENSHOTS=<mapp>.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const adress = process.argv[2] || "http://127.0.0.1:4173/";
const bilder = process.env.QA_SCREENSHOTS;
if (bilder) await mkdir(bilder, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
let fel = 0;
try {
  for (const viewport of [{ width: 375, height: 812 }, { width: 812, height: 375 }].filter((v) => !process.env.QA_LAGE || String(v.width) === process.env.QA_LAGE)) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    const sidfel = [];
    page.on("pageerror", (e) => sidfel.push(e.message));
    await page.addInitScript(() => {
      if (sessionStorage.getItem("t22-prov")) return;
      sessionStorage.setItem("t22-prov", "1");
      localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, startLage: "skriv", startLageVald: true,
        ang: [{ uid: "t22", skapad: 1, kropp: "kanin", formel: "en kanin", beskrivning: "en kanin", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [] }],
        funna: { kattunge: { guld: true }, kisse: { guld: false }, katt: { guld: true }, kanin: { guld: false } },
        garden: [], lada: [], stjarnor: 3, egnaDjur: 1, dragit: true, ljudPa: false, rostPa: false, effektPa: false, onskaVid: Date.now() + 3600000, uppdrag: {} }));
    });
    await page.goto(adress, { timeout: 120000 });
    await page.waitForFunction(() => !!window.__trollMinne && !!window.__tredScen, null, { timeout: 120000 });
    const oppnaMinBok = async () => {
      await page.getByTestId("meny").click();
      await page.getByTestId("meny-panel").waitFor();
    };
    const rutaText = async (id) => (await page.locator(`[data-dal="minbok-${id}"] .rakna`).innerText()).trim();
    const tal = (s) => Number((s.match(/\d+/) ?? ["NaN"])[0]);
    const stangOrdbok = async () => {
      await page.locator('[data-testid="ordbok-sida"] [data-testid="modal-stang"]').click();
      await page.getByTestId("ordbok-sida").waitFor({ state: "detached" });
    };

    // Tom Låda: tomvy som förklarar lådan, och Stäng.
    await oppnaMinBok();
    assert.equal(tal(await rutaText("lada")), 0);
    await page.locator('[data-dal="minbok-lada"]').click();
    await page.getByTestId("lada-panel").waitFor();
    // Guiden läser öppna lager var 250 ms. Låt den kontrollen ske även på den röda baslinjen.
    await page.waitForTimeout(600);
    assert.equal(await page.getByTestId("coach").count(), 0, "Guiden ska pausa medan Lådans dialog är öppen, så Stäng-texten är fri");
    const hudKrock = await page.locator('[data-t22="lada-stang"]').evaluate((knapp) => {
      const k = knapp.getBoundingClientRect();
      return Array.from(document.querySelectorAll('.sk-hud-botten button')).some((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.left < k.right && r.right > k.left && r.top < k.bottom && r.bottom > k.top;
      });
    });
    assert.equal(hudKrock, false, "Hela Lådans Stäng-knapp ska vara fri från världens HUD");
    const tom = await page.locator('[data-t22="lada-tom"]').innerText();
    assert.match(tom, /Lådan är tom/);
    const panel = await page.getByTestId("lada-panel").boundingBox();
    assert.ok(panel && panel.y >= 0 && panel.y + panel.height <= viewport.height && panel.x >= 0 && panel.x + panel.width <= viewport.width, "hela lådan syns");
    if (bilder) await page.screenshot({ path: `${bilder}/lada-${viewport.width}.png` });
    await page.locator('[data-t22="lada-stang"]').click();
    await page.getByTestId("lada-panel").waitFor({ state: "detached" });
    await oppnaMinBok();
    await page.locator('[data-dal="minbok-lada"]').click();
    await page.getByTestId("lada-panel").waitFor();
    await page.keyboard.press("Escape");
    await page.getByTestId("lada-panel").waitFor({ state: "detached" });


    // Ordjakten: rätt del och samma siffra som rutan.
    await oppnaMinBok();
    const skrivordRuta = tal(await rutaText("ordjakten"));
    await page.locator('[data-dal="minbok-ordjakten"]').click();
    await page.locator('[data-t22="ordbok-ordjakten"]').waitFor();
    assert.equal(await page.getByTestId("ordbok-sida").getAttribute("data-start"), "ordjakten");
    assert.equal(await page.locator('[data-testid="ordbok-sida"] h2').first().innerText(), "Ordjakten");
    assert.equal(tal(await page.locator('[data-t22="ordbok-del-text"]').innerText()), skrivordRuta, "Ordjaktens siffra stämmer med rutan");
    assert.equal(await page.locator('[data-t22="ordbok-ordjakten"] li').count(), skrivordRuta);
    if (bilder) await page.screenshot({ path: `${bilder}/ordjakten-${viewport.width}.png` });
    await stangOrdbok();

    // Guldord: egen rubrik, guldorden och samma siffra.
    await oppnaMinBok();
    const guldRuta = tal(await rutaText("guldord"));
    await page.locator('[data-dal="minbok-guldord"]').click();
    await page.locator('[data-t22="ordbok-guldord"]').waitFor();
    assert.equal(await page.getByTestId("ordbok-sida").getAttribute("data-start"), "guldord");
    assert.equal(await page.locator('[data-testid="ordbok-sida"] h2').first().innerText(), "Mina guldord");
    assert.equal(tal(await page.locator('[data-t22="ordbok-del-text"]').innerText()), guldRuta, "guldordens siffra stämmer med rutan");
    assert.equal(guldRuta, 2);
    if (bilder) await page.screenshot({ path: `${bilder}/guldord-${viewport.width}.png` });
    await stangOrdbok();

    // Hela Ordboken från en annan väg börjar inte på en del.
    await page.evaluate(() => window.__troll.ordbok(true));
    await page.getByTestId("ordbok-sida").waitFor();
    assert.equal(await page.getByTestId("ordbok-sida").getAttribute("data-start"), "alla");
    assert.equal(await page.locator('[data-t22="ordbok-guldord"], [data-t22="ordbok-ordjakten"]').count(), 0);
    await stangOrdbok();

    // Djuralbum.
    await oppnaMinBok();
    await page.locator('[data-dal="minbok-album"]').click();
    await page.getByTestId("album").waitFor();
    await page.keyboard.press("Escape");
    await page.getByTestId("album").waitFor({ state: "detached" });

    // Stallet fälls ut i Min bok.
    await oppnaMinBok();
    await page.locator('[data-dal="minbok-stall"]').click();
    assert.equal(await page.locator('[data-dal="minbok-stall"]').getAttribute("aria-expanded"), "true");
    await page.locator(".sk-stall").waitFor();
    await page.locator('[data-testid="meny-panel"] .sk-stang').click();


    assert.deepEqual(sidfel, [], "inga sidfel");
    console.log("Grönt Min bok", viewport.width, JSON.stringify({ skrivordRuta, guldRuta }));
    await context.close();
  }
} catch (e) {
  fel = 1;
  console.error(e);
} finally {
  await browser.close();
}
process.exit(fel);
