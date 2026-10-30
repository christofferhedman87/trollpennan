#!/usr/bin/env node
// Regression: För vuxna → riktig filnedladdning → Läs in en kopia → omladdning.
// Kör mot byggd preview: CHROMIUM=/usr/bin/chromium node scripts/prov-backup.mjs [url]
// En ny isolerad kontext innehåller bara syntetiska speldata. Prov-API:t används enbart för förberedelse/avläsning.
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const adress = process.argv[2] ?? "http://127.0.0.1:4173/";
const bildmapp = process.env.QA_SCREENSHOTS;
if (bildmapp) await mkdir(bildmapp, { recursive: true });
const tempmapp = await mkdtemp(join(tmpdir(), "trollpennan-backup-"));
const falt = [
  "startLage", "startLageVald", "ljudPa", "rostPa", "effektPa", "plats", "platsSkapelser",
  "oppnadePlatser", "seddaIntro", "stall", "gataId", "lasnivaVal", "solstjarnor", "albumNiva", "vaktardjur", "ang", "stjarnor",
];
const urval = (data) => Object.fromEntries(falt.map((namn) => [namn, data[namn]]));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || "/usr/bin/chromium",
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const context = await browser.newContext({
  viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, reducedMotion: "reduce", acceptDownloads: true,
});
const page = await context.newPage();
page.setDefaultTimeout(45000);
const sidfel = [];
page.on("pageerror", (e) => sidfel.push(e.message));
const logg = (rad) => console.log(new Date().toISOString(), rad);

async function redo() {
  await page.waitForFunction(() => !!window.__troll && !!window.__trollMinne);
}
async function bild(namn) {
  if (bildmapp) await page.screenshot({ path: join(bildmapp, `${namn}.png`) });
}
async function vuxen() {
  await page.evaluate(() => window.__troll.foralder(true));
  await page.getByTestId("foralder").waitFor({ state: "visible" });
  await page.getByTestId("foralder-svar").fill("7");
  await page.getByTestId("foralder-oppna").click();
  await page.getByTestId("spara-kopia").waitFor({ state: "visible" });
}
async function avlas() {
  return page.evaluate((nycklar) => {
    const s = window.__trollMinne.getState();
    return {
      data: JSON.parse(JSON.stringify(Object.fromEntries(nycklar.map((namn) => [namn, s[namn]])))),
      dal: JSON.parse(localStorage.getItem("trollpennan-dal-v1") ?? '{"utbyggnader":[]}'),
    };
  }, falt);
}

try {
  // Engångsförberedelse. Omladdning får inte återställa testdatan eller återinföra borttagen mark.
  await page.addInitScript(() => {
    if (sessionStorage.getItem("trollpennan-backup-prov")) return;
    sessionStorage.setItem("trollpennan-backup-prov", "1");
    localStorage.setItem("trollpennan-v2", JSON.stringify({
      version: 2, introSedd: true, ang: [], garden: [], stjarnor: 0, ljudPa: false, rostPa: false, effektPa: false,
    }));
    localStorage.setItem("trollpennan-dal-v1", JSON.stringify({ utbyggnader: ["backen"] }));
  });
  await page.goto(adress, { timeout: 120000 });
  await redo();
  await page.evaluate(() => window.__troll.vakna("en blå kanin"));
  await page.waitForFunction(() => window.__trollMinne.getState().ang.length > 0);
  const forvantat = await page.evaluate((nycklar) => {
    const store = window.__trollMinne;
    const grund = store.getState().ang[0];
    const djur = (uid) => ({ ...grund, uid, skapad: 123, smeknamn: `Provkanin ${uid}` });
    store.setState({
      ang: [djur("backup-ang")], stjarnor: 17, introSedd: true,
      startLage: "kort", startLageVald: true, ljudPa: true, rostPa: false, effektPa: true,
      plats: "skogen", platsSkapelser: {
        skogen: [djur("backup-skog")], sjon: [djur("backup-sjo")], grottan: [djur("backup-grotta")],
      },
      oppnadePlatser: ["skogen", "sjon", "grottan"], seddaIntro: ["skogen", "sjon", "grottan"],
      stall: [djur("backup-stall")], gataId: "lodjur", lasnivaVal: 3, solstjarnor: 12,
      albumNiva: { kanin: 3 }, vaktardjur: { skogen: { matad: 3, vackt: true } },
    });
    return JSON.parse(JSON.stringify(Object.fromEntries(nycklar.map((namn) => [namn, store.getState()[namn]]))));
  }, falt);
  logg("Syntetiska skapelser på alla platser, stall, framsteg, läsnivå 3 och köpt mark förberedda.");

  await vuxen();
  const nedladdning = page.waitForEvent("download");
  await page.getByTestId("spara-kopia").click();
  const fil = await nedladdning;
  assert.equal(fil.suggestedFilename(), "trollpennan-kopia.json");
  const filsokvag = join(tempmapp, fil.suggestedFilename());
  await fil.saveAs(filsokvag);
  const filtext = await readFile(filsokvag, "utf8");
  const kopia = JSON.parse(filtext);
  assert.equal(kopia.version, 2, "filformatet är fortsatt v2");
  assert.deepEqual(urval(kopia), forvantat, "den nedladdade filen innehåller de tidigare utelämnade fälten");
  assert.deepEqual(kopia.dal, { utbyggnader: ["backen"] }, "köpt mark finns i samma kopia");
  await bild("backup-nedladdad");
  logg("Riktig JSON-fil nedladdad och kontrollerad.");

  // Bara denna isolerade kontexts syntetiska värld töms; ingen riktig speldata berörs.
  await page.evaluate(() => {
    window.__troll.aterstall();
    window.__trollMinne.setState({ introSedd: true, ljudPa: false, rostPa: false, effektPa: false });
    localStorage.removeItem("trollpennan-dal-v1");
  });
  await page.reload({ timeout: 120000 });
  await redo();
  const tomt = await avlas();
  assert.deepEqual(tomt.data.ang, []);
  assert.deepEqual(tomt.data.stall, []);
  assert.deepEqual(tomt.data.platsSkapelser, {});
  assert.equal(tomt.data.solstjarnor, 0);
  assert.deepEqual(tomt.dal.utbyggnader, []);
  logg("Den syntetiska världen och marken är tömda även efter omladdning.");

  await vuxen();
  // Riktig dold filinput och den synliga importbekräftelsen; ingen import via prov-API:t.
  await page.getByTestId("kopia-fil").setInputFiles({ name: "trollpennan-kopia.json", mimeType: "application/json", buffer: Buffer.from(filtext) });
  await page.getByTestId("backup-fraga").waitFor({ state: "visible" });
  await page.getByTestId("backup-ja").click();
  await page.getByTestId("backup-fraga").waitFor({ state: "hidden" });
  const aterlast = await avlas();
  assert.deepEqual(aterlast.data, forvantat, "alla kontrollerade fält återställs via riktig import");
  assert.deepEqual(aterlast.dal, kopia.dal, "köpt mark återställs");
  assert.equal(await page.locator('[data-p4="lasniva-3"]').getAttribute("class"), "pa", "läsnivå 3 visas som vald i vuxenvyn");
  await bild("backup-aterlast");

  await page.reload({ timeout: 120000 });
  await redo();
  const omlast = await avlas();
  assert.deepEqual(omlast.data, forvantat, "återlästa skapelser och framsteg bevaras efter omladdning");
  assert.deepEqual(omlast.dal, kopia.dal, "återläst mark bevaras efter omladdning");
  assert.deepEqual(sidfel, [], "inga JavaScript-fel i sidan");
  logg("BACKUPPROVET GRÖNT: filnedladdning, tömning, UI-import och omladdning bevarar världen och marken.");
} catch (e) {
  await bild("backup-fel").catch(() => {});
  console.error("BACKUPPROVET RÖTT:", e);
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
  await rm(tempmapp, { recursive: true, force: true });
}
