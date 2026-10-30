// Block 5b: barnet får behålla ett eget ord trots stavningsförslag. Isolerad syntetisk profil, riktiga tangenter och klick.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
const adress = process.argv[2] ?? "http://127.0.0.1:4173/";
const bilder = process.env.QA_SCREENSHOTS;
if (bilder) await mkdir(bilder, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
page.setDefaultTimeout(45000);
const fel = [];
page.on("pageerror", (e) => fel.push(e.message));
await page.addInitScript(() => {
  if (sessionStorage.getItem("behall-prov")) return;
  sessionStorage.setItem("behall-prov", "1");
  localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, startLage: "skriv", startLageVald: true, egnaDjur: 5, dragit: true, ang: [], garden: [], platsSkapelser: {}, plats: "ang", dal: { utbyggnader: [] }, ljudPa: false, rostPa: false, effektPa: false, onskaVid: Date.now() + 3600000 }));
  localStorage.setItem("trollpennan-skapa-v1", JSON.stringify({ bokstavsljud: false }));
});
try {
  await page.goto(adress);
  await page.getByTestId("pennans-bok").waitFor({ state: "visible", timeout: 120000 });
  await page.getByTestId("pennans-bok").click();
  await page.getByTestId("tangentbord").waitFor({ state: "visible" });
  for (const b of "en kanim ") {
    if (b === " ") await page.getByTestId("mellanslag").click();
    else await page.getByTestId("tangentbord").getByRole("button", { name: b, exact: true }).click();
  }
  await page.getByTestId("forslag").waitFor({ state: "visible" });
  await page.getByTestId("nej").click();
  await page.getByTestId("forslag").waitFor({ state: "hidden" });
  assert.ok((await page.getByTestId("remsa").textContent()).includes("kanim"), "barnets ord är kvar");
  if (bilder) await page.screenshot({ path: `${bilder}/behall-fore-trolla.png` });
  assert.equal(await page.getByTestId("vakna").getAttribute("data-redo"), "ja", "Pennan vaknar när barnet väljer Behåll ordet");
  await page.getByTestId("vakna").click();
  await page.waitForFunction(() => window.__trollMinne.getState().ang.some((d) => d.kropp === "agg" && d.reserv?.some((r) => r.ord === "kanim")));
  const uid = await page.evaluate(() => window.__trollMinne.getState().ang.find((d) => d.kropp === "agg").uid);
  await page.reload();
  await page.waitForFunction((u) => window.__trollMinne?.getState().ang.some((d) => d.uid === u), uid, { timeout: 120000 });
  assert.deepEqual(fel, []);
  console.log("BEHÅLL GRÖNT: aktivt val, vaken Penna, eget ordägg och bevarat efter omladdning.");
} catch (e) { console.error("BEHÅLL RÖTT:", e); process.exitCode = 1; }
finally { await browser.close(); }
