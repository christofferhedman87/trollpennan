#!/usr/bin/env node
// Lokal browserregression för block 4b-2: ett hus som skrivs på en utflykt hör till Hemdalen. Spelet reser hem (samma resa som
// returskylten), huset syns på sin tomt och kameran glider dit. Fullt i Hemdalen ger det vanliga fullt-meddelandet och barnet stannar.
// Syntetiska isolerade profiler; ingen riktig sparfil. Kör mot en förhandsvisning av build:pages (se prov-platsforhand.mjs):
//   TROLLPENNAN_REPO=. CHROMIUM=/sökväg/till/chrome node scripts/prov-bygg-hem.mjs [url]
// QA_LAGE=staende|liggande, QA_SCREENSHOTS=mapp (bara för egen kontroll).
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const adress = process.argv[2] ?? "http://127.0.0.1:4173/";
const reporot = process.env.TROLLPENNAN_REPO ?? "/workspace/trollpennan";
const bildmapp = process.env.QA_SCREENSHOTS;
if (bildmapp) await mkdir(bildmapp, { recursive: true });
const dalen = JSON.parse(await readFile(join(reporot, "data", "dalen.json"), "utf8"));
const bygg = JSON.parse(await readFile(join(reporot, "data", "bygg.json"), "utf8"));
const lagen = [
  ["staende", { width: 375, height: 812 }],
  ["liggande", { width: 812, height: 375 }],
].filter(([namn]) => !process.env.QA_LAGE || namn === process.env.QA_LAGE);
const logg = (text) => console.log(new Date().toISOString(), text);
const sidfel = [];
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || undefined,
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const bild = async (page, namn) => {
  if (bildmapp) await page.screenshot({ path: join(bildmapp, `${namn}.png`) });
};
const redo = async (page) => {
  await page.waitForFunction(() => !!window.__troll && !!window.__trollMinne, null, { timeout: 120000 });
  await page.getByTestId("pennans-bok").waitFor({ state: "visible" });
};
async function resMedKartan(page, id) {
  await page.getByTestId("ut-pa-aventyr").click();
  await page.getByTestId("karta").waitFor({ state: "visible" });
  await page.getByTestId(`plats-${id}`).click();
  await page.waitForFunction((p) => window.__trollMinne.getState().plats === p, id);
  await page.getByTestId("karta").waitFor({ state: "hidden" });
  await page.getByTestId("pennans-bok").waitFor({ state: "visible" });
}
async function skriv(page, text) {
  for (const b of text) {
    if (b === " ") await page.getByTestId("mellanslag").click();
    else await page.locator(".sk-tangenter").getByRole("button", { name: b, exact: true }).click();
  }
}
async function oppnaBokOchSkriv(page, text) {
  await page.evaluate(() => window.__trollMinne.setState({ ljudPa: false, rostPa: false, effektPa: false }));
  await page.getByTestId("pennans-bok").click();
  await page.getByTestId("bok-skarm").waitFor({ state: "visible" });
  await skriv(page, text);
  await page.waitForFunction(() => document.querySelector('[data-testid="vakna"]')?.getAttribute("data-redo") === "ja");
}
const tillstand = (page) => page.evaluate(() => {
  const s = window.__trollMinne.getState();
  return { plats: s.plats, garden: s.garden.map((g) => ({ uid: g.uid, bygg: g.bygg, tomt: g.tomt ?? null, formel: g.formel })), dal: window.__dalKamera ?? null, ang: s.ang.length };
});

async function profil(page, garden = []) {
  await page.addInitScript((g) => {
    if (sessionStorage.getItem("bygghem-prov")) return;
    sessionStorage.setItem("bygghem-prov", "1");
    localStorage.setItem("trollpennan-v2", JSON.stringify({
      version: 2, introSedd: true, startLage: "skriv", startLageVald: true,
      ang: [{ uid: "bygghem-kanin", skapad: Date.now(), kropp: "kanin", formel: "en kanin", beskrivning: "en kanin", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [] }],
      garden: g, stjarnor: 17, dal: { utbyggnader: [] }, egnaDjur: 5, dragit: true,
      ljudPa: false, rostPa: false, effektPa: false, plats: "ang", platsSkapelser: {},
      oppnadePlatser: ["skogen", "sjon", "grottan"], seddaIntro: ["skogen", "sjon", "grottan"],
      forstaKarta: false, onskan: null, onskaVid: Date.now() + 3600000, uppdrag: {},
    }));
    localStorage.setItem("trollpennan-skapa-v1", JSON.stringify({ bokstavsljud: false }));
  }, garden);
}

async function provaHem(page, lage) {
  const namn = `${lage}-hem`;
  await resMedKartan(page, "skogen");
  await oppnaBokOchSkriv(page, "ett hus ");
  const fore = await tillstand(page);
  assert.equal(fore.plats, "skogen");
  assert.equal(fore.garden.length, 0);
  await page.getByTestId("vakna").click();
  // Huset skapas och spelet reser hem till Hemdalen.
  await page.waitForFunction(() => window.__trollMinne.getState().garden.length === 1, null, { timeout: 30000 });
  await page.waitForFunction(() => window.__trollMinne.getState().plats === "ang", null, { timeout: 15000 });
  await page.getByTestId("bok-skarm").waitFor({ state: "hidden" });
  // Kameran glider till huset; ge glidningen och scenbytet tid.
  await page.waitForFunction(() => window.__dalKamera?.aktiv === true, null, { timeout: 30000 });
  await page.waitForTimeout(4500);
  const efter = await tillstand(page);
  assert.equal(efter.plats, "ang", `${namn}: spelet reste hem till Ängen`);
  const hus = efter.garden[0];
  assert.ok(hus && Number.isInteger(hus.tomt), `${namn}: huset har fått en tomt: ${JSON.stringify(hus)}`);
  const tomt = dalen.tomter[hus.tomt];
  assert.ok(tomt, `${namn}: tomten finns`);
  assert.equal(efter.dal.glid, false, `${namn}: glidningen är klar`);
  const avst = Math.hypot(efter.dal.x - tomt.x, efter.dal.z - tomt.z);
  // Kamerans mål klampas till dalen; tomterna ligger inom den men intill kanten kan målet hamna några decimeter ifrån.
  assert.ok(avst <= 1.2, `${namn}: kameran har glidit till husets tomt (mål ${efter.dal.x?.toFixed(2)},${efter.dal.z?.toFixed(2)} mot tomt ${tomt.x},${tomt.z}; avstånd ${avst.toFixed(2)})`);
  const sparat = await page.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2")).garden.map((g) => g.uid));
  assert.deepEqual(sparat, efter.garden.map((g) => g.uid), `${namn}: huset finns i den riktiga lokala sparningen`);
  await bild(page, `${namn}-hemdalen`);

  // En färdig glidning upprepas inte: till Skogen och hem utan bygge lämnar kameran i fred.
  await resMedKartan(page, "skogen");
  await page.getByTestId("pennans-bok").waitFor({ state: "visible" });
  await page.evaluate(() => window.__trollMinne.getState().oppnaPlats("ang"));
  await page.waitForFunction(() => window.__dalKamera?.aktiv === true, null, { timeout: 30000 });
  await page.waitForTimeout(800);
  const hem2 = await tillstand(page);
  assert.equal(hem2.dal.glid, false, `${namn}: ingen ny glidning till ett redan använt fokus`);
}

async function provaFullt(page, lage) {
  const namn = `${lage}-fullt`;
  await resMedKartan(page, "skogen");
  await oppnaBokOchSkriv(page, "ett hus ");
  const fore = await tillstand(page);
  await page.getByTestId("vakna").click();
  await page.waitForTimeout(2500);
  const efter = await tillstand(page);
  assert.equal(efter.plats, "skogen", `${namn}: fullt i Hemdalen: barnet stannar på utflykten`);
  assert.equal(efter.garden.length, fore.garden.length, `${namn}: inget hus tillkom`);
  await bild(page, `${namn}`);
}

try {
  for (const [lage, viewport] of lagen) {
    for (const [fall, garden] of [["hem", []], ["fullt", Array.from({ length: bygg.max_pa_garden }, (_, i) => ({
      uid: `bygghem-hus-${i}`, bygg: "hus", formel: "ett hus", ord: "hus", antal: 1, fargId: null, fargHex: null, monster: null, material: null,
      delar: [], x: 0.5, y: 0.5, boende: [], tomt: i < dalen.tomter.length ? i : null,
    }))]]) {
      const namn = `${lage}-${fall}`;
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce" });
      const page = await context.newPage();
      page.setDefaultTimeout(45000);
      page.on("pageerror", (e) => sidfel.push(`${namn}: ${e.message}`));
      await profil(page, garden);
      try {
        logg(`${namn}: börjar med isolerad syntetisk profil`);
        await page.goto(adress, { timeout: 120000 });
        await redo(page);
        if (fall === "hem") await provaHem(page, lage);
        else await provaFullt(page, lage);
        logg(`${namn}: grönt`);
      } catch (e) {
        await bild(page, `${namn}-fel`).catch(() => {});
        throw e;
      } finally {
        await context.close();
      }
    }
  }
  assert.deepEqual(sidfel, [], "inga JavaScript-fel i de provade flödena");
  logg(`BYGGHEM GRÖNT: ${lagen.map(([n]) => n).join(" och ")}. Syntetiska profiler, minskad rörelse.`);
} catch (e) {
  console.error("BYGGHEM RÖTT:", e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
