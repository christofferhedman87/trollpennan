#!/usr/bin/env node
// B1: färg och storlek på Skogen/Sjön/Grottan gäller själva djuret. Riktiga klick och tangenter i båda vyerna,
// normal rörelse. QA_LAGE=375|812 och QA_FALL=<uppdrags-id> begränsar körningen. QA_SCREENSHOTS=mapp sparar egna bilder.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
const adress = process.argv[2] ?? "http://127.0.0.1:4173/";
const bilder = process.env.QA_SCREENSHOTS;
const FALL = [
  { id: "sjo-stor-simmare", plats: "sjon", miss: "en stor sten bredvid en anka", missKropp: "anka", ratt: "en stor fisk", rattKropp: "fisk", kvitto: "Jag letar efter en stor vän", koll: ([v]) => v.kropp === "fisk" && v.skala >= 1.3 },
  { id: "skog-rod-van", plats: "skogen", miss: "en röd boll bredvid en räv", missKropp: "rav", ratt: "en röd räv", rattKropp: "rav", kvitto: "Jag letar efter en röd vän", koll: ([v]) => v.kropp === "rav" && /^#E53935$/i.test(v.farg ?? "") },
  // Ett namn är ingen mat; logisk mat utanför den gamla ordlistan räknas.
  { id: "skog-magen-kurrar", plats: "skogen", miss: "en räv som heter morot", missKropp: "rav", ratt: "en räv med en ost", kvitto: "Jag letar efter mat till en skogsgäst",
    koll: ([v]) => v.kropp === "rav" && v.tillbehor.some((t) => t.id === "ost") },
  // Två vänner: storleken på ett plagg räknas inte; varsin storlek ska sitta på varsitt djur.
  { id: "grotta-stor-och-liten", plats: "grottan", miss: "en stor hund med en liten mössa", missKropp: "hund", ratt: "en stor hund och en liten katt", kvitto: "Jag letar efter två vänner: en stor och en liten",
    koll: (nya) => nya.some((v) => v.kropp === "hund" && v.skala >= 1.3) && nya.some((v) => v.kropp === "katt" && v.skala <= 0.75) },
].filter((f) => !process.env.QA_FALL || f.id === process.env.QA_FALL);
assert.ok(FALL.length, "QA_FALL måste välja ett verkligt fall");
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  for (const viewport of [{ width: 375, height: 812 }, { width: 812, height: 375 }]) {
    if (process.env.QA_LAGE && viewport.width !== Number(process.env.QA_LAGE)) continue;
    for (const f of FALL) {
      const context = await browser.newContext({ viewport, reducedMotion: "no-preference" });
      const page = await context.newPage(); page.setDefaultTimeout(60000);
      const fel = []; page.on("pageerror", (e) => fel.push(e.message));
      await page.addInitScript(([fall]) => {
        // Kvittot är kortlivat; mät det i sidan vid full opacitet i stället för att ändra spelets timer.
        window.__b1PlatsMatt = null;
        setInterval(() => {
          const el = document.querySelector('[data-dal="kvitto"]');
          if (window.__b1PlatsMatt || !el || getComputedStyle(el).opacity !== "1" || !el.innerText.includes(fall.kvitto)) return;
          const r = el.getBoundingClientRect();
          window.__b1PlatsMatt = { text: el.innerText, inom: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
            hel: el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight };
        }, 50);
        if (sessionStorage.getItem("b1-plats-prov")) return;
        sessionStorage.setItem("b1-plats-prov", "1");
        localStorage.setItem("trollpennan-v2", JSON.stringify({
          version: 2, introSedd: true, startLage: "skriv", startLageVald: true,
          ang: [{ uid: "b1-plats-kanin", skapad: Date.now(), kropp: "kanin", formel: "en kanin", beskrivning: "en kanin", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [] }],
          garden: [], stjarnor: 17, dal: { utbyggnader: [] }, egnaDjur: 5, dragit: true,
          ljudPa: false, rostPa: false, effektPa: false, plats: "ang", platsSkapelser: {},
          oppnadePlatser: ["skogen", "sjon", "grottan"], seddaIntro: ["skogen", "sjon", "grottan"],
          forstaKarta: false, onskan: null, onskaVid: Date.now() + 3600000, uppdrag: { [fall.id]: "pagar" },
        }));
        localStorage.setItem("trollpennan-skapa-v1", JSON.stringify({ bokstavsljud: false }));
      }, [{ id: f.id, plats: f.plats, kvitto: f.kvitto }]);
      const cdp = bilder ? await context.newCDPSession(page) : null;
      await page.goto(adress, { timeout: 120000 });
      await page.waitForFunction(() => !!window.__troll && !!window.__trollMinne);
      // Res dit som barnet gör: Ut på äventyr → kartan → platsen.
      await page.getByTestId("pennans-bok").waitFor({ state: "visible" });
      await page.getByTestId("ut-pa-aventyr").click();
      await page.getByTestId("karta").waitFor({ state: "visible" });
      await page.getByTestId(`plats-${f.plats}`).click();
      await page.waitForFunction((p) => window.__trollMinne.getState().plats === p, f.plats);
      await page.getByTestId("karta").waitFor({ state: "hidden" });
      await page.getByTestId("pennans-bok").waitFor({ state: "visible" });
      const skapelser = () => page.evaluate((p) => window.__trollMinne.getState().platsSkapelser[p] ?? [], f.plats);
      const fore = await page.evaluate(() => ({ plats: window.__trollMinne.getState().plats, stjarnor: window.__trollMinne.getState().stjarnor, ang: window.__trollMinne.getState().ang.length }));
      assert.equal(fore.plats, f.plats);
      async function skriv(text) {
        // På platserna står Bengtsson som figur nere till vänster (NpcFigur).
        await page.getByTestId("npc-figur").click();
        assert.equal(await page.locator('[data-testid="uppdragbok"] [data-v2="aktivt-uppdrag-kort"]').getAttribute("data-uppdrag"), f.id, "Bengtsson visar platsens uppdrag");
        await page.getByTestId("uppdrag-los-i-boken").click();
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
      await skriv(f.miss);
      await page.waitForFunction((p) => (window.__trollMinne.getState().platsSkapelser[p] ?? []).length === 1, f.plats);
      const miss = await skapelser();
      assert.equal(await page.evaluate((id) => window.__trollMinne.getState().uppdrag[id], f.id), "pagar", `${f.miss} löser inte ${f.id}`);
      assert.equal(miss[0].kropp, f.missKropp, "nära missen sparas och står kvar");
      await page.waitForFunction(() => window.__b1PlatsMatt);
      const matt = await page.evaluate(() => window.__b1PlatsMatt);
      assert.ok(matt.text.includes(f.kvitto)); assert.equal(matt.inom, true); assert.equal(matt.hel, true);
      console.log(`Synligt kvitto ${f.id} ${viewport.width}:`, JSON.stringify(matt));
      if (cdp && bilder) {
        await mkdir(bilder, { recursive: true });
        const bild = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        await writeFile(`${bilder}/${f.id}-miss-${viewport.width}.png`, Buffer.from(bild.data, "base64"));
      }
      await skriv(f.ratt);
      await page.waitForFunction((id) => window.__trollMinne.getState().uppdrag[id] === "klar", f.id);
      const klar = await skapelser();
      const slut = await page.evaluate(() => ({ stjarnor: window.__trollMinne.getState().stjarnor, ang: window.__trollMinne.getState().ang.length }));
      assert.equal(klar[0].uid, miss[0].uid, "nära missen finns kvar");
      const nya = klar.slice(miss.length);
      assert.ok(nya.length >= 1 && f.koll(nya), `färgen/storleken sparas på rätt djur: ${JSON.stringify(nya.map((v) => [v.kropp, v.skala, v.farg]))}`);
      assert.ok(slut.stjarnor > fore.stjarnor); assert.equal(slut.ang, fore.ang, "ängen orörd");
      if (bilder) await page.screenshot({ path: `${bilder}/${f.id}-ratt-${viewport.width}.png` });
      if (cdp) await cdp.detach();
      assert.deepEqual(fel, []);
      console.log(`Grönt B1 ${f.id}: ${f.miss} → sparad nära miss → ${f.ratt}, ${viewport.width}×${viewport.height}`);
      await context.close();
    }
  }
} finally { await browser.close(); }
