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
  "garden", "lada", "hemma", "albumKropp", "foton", "seddaNiva",
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
  const tal = (await page.locator(".vuxen-las-fraga").innerText()).match(/(\d+)\s*×\s*(\d+)/);
  assert.ok(tal);
  await page.getByTestId("foralder-svar").fill(String(+tal[1] * +tal[2]));
  await page.getByTestId("foralder-oppna").click();
  await page.getByTestId("spara-kopia").waitFor({ state: "visible" });
}
async function avlas() {
  return page.evaluate((nycklar) => {
    const s = window.__trollMinne.getState();
    return {
      data: JSON.parse(JSON.stringify(Object.fromEntries(nycklar.map((namn) => [namn, s[namn]])))),
      dal: JSON.parse(JSON.stringify(s.dal)),
      skapa: JSON.parse(localStorage.getItem("trollpennan-skapa-v1") ?? '{"bokstavsljud":true}'),
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
    const bygge = (uid) => ({
      uid, bygg: "stall", formel: "ett blått stall som ser ut som ett slott", ord: "stall", antal: 1,
      fargId: "bla", fargHex: "#0000ff", monster: null, material: "tra", x: .2, y: .4, tomt: 2,
      delar: [{ id: "fonster", antal: 2, fargHex: "#ffff00", material: "glas" }], boende: ["backup-hemma"],
      storlekId: "stor", egenskaper: ["lyser"],
      form: { slag: "bygg", id: "slott", ord: "slott", genus: "ett", plural: "slott", hur: "bisats" },
    });
    store.setState({
      ang: [djur("backup-ang")], stjarnor: 17, introSedd: true,
      startLage: "kort", startLageVald: true, ljudPa: true, rostPa: false, effektPa: true,
      plats: "skogen", platsSkapelser: {
        skogen: [djur("backup-skog")], sjon: [djur("backup-sjo")], grottan: [djur("backup-grotta")],
      },
      oppnadePlatser: ["skogen", "sjon", "grottan"], seddaIntro: ["skogen", "sjon", "grottan"],
      stall: [djur("backup-stall")], gataId: "lodjur", lasnivaVal: 3, solstjarnor: 12,
      albumNiva: { kanin: 3 }, vaktardjur: { skogen: { matad: 3, vackt: true } },
      garden: [bygge("backup-stallet")], lada: [{ ...bygge("backup-ladan"), boende: [], tomt: null }],
      hemma: [{ spec: djur("backup-hemma"), hem: "backup-stallet" }],
      albumKropp: { kanin: { formel: "en blå kanin", poang: 5, niva: "guld", favorit: "morot", hjartan: 3, smeknamn: "Blåis" } },
      foton: [{ id: "backup-foto", formel: "en blå kanin", kropp: "kanin", niva: "guld", poang: 5, smeknamn: "Blåis" }],
      seddaNiva: ["guld"],
    });
    return JSON.parse(JSON.stringify(Object.fromEntries(nycklar.map((namn) => [namn, store.getState()[namn]]))));
  }, falt);
  logg("Syntetiska skapelser på alla platser, byggen, boende, album, framsteg, läsnivå 3 och köpt mark förberedda.");

  await vuxen();
  const bokstavsknappar = page.locator('[data-dal="bokstavsljud"] button');
  await bokstavsknappar.nth(1).click();
  assert.equal(await bokstavsknappar.nth(1).getAttribute("class"), "pa", "bokstavsljud av är valt före export");
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
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-v2")).dal), kopia.dal, "marken finns nu i huvudlagringen");
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("trollpennan-dal-v1"))), kopia.dal, "lokal legacy-migrering lämnar den äldre marknyckeln orörd");
  assert.deepEqual(kopia.skapa, { bokstavsljud: false }, "förälderns bokstavsljud finns i samma kopia");
  await bild("backup-nedladdad");
  logg("Riktig JSON-fil nedladdad och kontrollerad.");

  // Bara denna isolerade kontexts syntetiska värld töms; ingen riktig speldata berörs.
  await page.evaluate(() => {
    window.__troll.aterstall();
    window.__trollMinne.setState({ introSedd: true, ljudPa: false, rostPa: false, effektPa: false });
    localStorage.removeItem("trollpennan-dal-v1");
    localStorage.removeItem("trollpennan-skapa-v1");
  });
  await page.reload({ timeout: 120000 });
  await redo();
  const tomt = await avlas();
  assert.deepEqual(tomt.data.ang, []);
  assert.deepEqual(tomt.data.stall, []);
  assert.deepEqual(tomt.data.platsSkapelser, {});
  assert.deepEqual(tomt.data.garden, []);
  assert.deepEqual(tomt.data.lada, []);
  assert.deepEqual(tomt.data.hemma, []);
  assert.deepEqual(tomt.data.albumKropp, {});
  assert.deepEqual(tomt.data.foton, []);
  assert.equal(tomt.data.solstjarnor, 0);
  assert.deepEqual(tomt.dal.utbyggnader, []);
  assert.deepEqual(tomt.skapa, { bokstavsljud: true });
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
  assert.equal(await page.evaluate(() => localStorage.getItem("trollpennan-dal-v1")), null, "filimport skriver inte tillbaka äldre lokal mark");
  assert.deepEqual(aterlast.skapa, kopia.skapa, "bokstavsljud återställs");
  assert.equal(await bokstavsknappar.nth(1).getAttribute("class"), "pa", "bokstavsljud av visas som valt efter import");
  assert.equal(await page.locator('[data-p4="lasniva-3"]').getAttribute("class"), "pa", "läsnivå 3 visas som vald i vuxenvyn");
  await bild("backup-aterlast");

  await page.reload({ timeout: 120000 });
  await redo();
  const omlast = await avlas();
  assert.deepEqual(omlast.data, forvantat, "återlästa skapelser och framsteg bevaras efter omladdning");
  assert.deepEqual(omlast.dal, kopia.dal, "återläst mark bevaras efter omladdning");
  assert.deepEqual(omlast.skapa, kopia.skapa, "återläst bokstavsljud bevaras efter omladdning");

  await vuxen();
  assert.equal(await bokstavsknappar.nth(1).getAttribute("class"), "pa", "bokstavsljud av visas som valt efter omladdning");
  // Ett felaktigt val får inte ändra världen eller något av de separata sparområdena.
  await page.getByTestId("kopia-fil").setInputFiles({ name: "ogiltig-kopia.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ ...kopia, skapa: { bokstavsljud: "false" } })) });
  await page.getByTestId("backup-rad").waitFor({ state: "visible" });
  assert.equal(await page.getByTestId("backup-fraga").count(), 0, "felaktigt bokstavsljud avvisas före importbekräftelsen");
  assert.deepEqual(await avlas(), omlast, "avvisad import lämnar hela världen och inställningarna orörda");

  // Äldre v2-kopior saknar skapa och får den definierade standarden på, även i en profil där valet var av.
  const aldre = { ...kopia };
  delete aldre.skapa;
  await page.getByTestId("kopia-fil").setInputFiles({ name: "aldre-kopia.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(aldre)) });
  await page.getByTestId("backup-fraga").waitFor({ state: "visible" });
  await page.getByTestId("backup-ja").click();
  await page.getByTestId("backup-fraga").waitFor({ state: "hidden" });
  assert.deepEqual((await avlas()).skapa, { bokstavsljud: true }, "äldre kopia får standarden bokstavsljud på");
  assert.equal(await bokstavsknappar.nth(0).getAttribute("class"), "pa");
  await page.reload({ timeout: 120000 });
  await redo();
  assert.deepEqual(await avlas(), { ...omlast, skapa: { bokstavsljud: true } }, "äldre kopias värld och standardval består efter omladdning");
  assert.deepEqual(sidfel, [], "inga JavaScript-fel i sidan");
  logg("BACKUPPROVET GRÖNT: filnedladdning, tömning, UI-import och omladdning bevarar världen, marken och bokstavsljud; äldre och ogiltiga val provade.");
} catch (e) {
  await bild("backup-fel").catch(() => {});
  console.error("BACKUPPROVET RÖTT:", e);
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
  await rm(tempmapp, { recursive: true, force: true });
}
