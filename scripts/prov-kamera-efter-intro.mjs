#!/usr/bin/env node
// Regressionsprov (2026-10-30): kameran ska gå att panorera och zooma direkt efter introt, innan barnet skapat något.
// Förut låste SagaKamera kameran tills första djuret fanns (ang/saga.tsx: styrd = sagaNu.aktiv || !harDjur).
//
// Kör mot en byggd sida:  npm run build:pages && npx vite preview --config vite.pages.config.ts --port 4173 --strictPort
//                         node scripts/prov-kamera-efter-intro.mjs [url]   (standard http://127.0.0.1:4173/)
// Webbläsaren: Playwrights egen Chromium, eller CHROMIUM=/sökväg/till/chrome om versionerna inte stämmer.
// Två vägar genom introt: hela introt (slutar själv och öppnar Pennans bok) och Hoppa över. Båda i 375×812 och liggande.
import { chromium } from "playwright";

const URL_ = process.argv[2] ?? "http://127.0.0.1:4173/";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || undefined,
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const fel = [];
const kam = (page) => page.evaluate(() => ({ ...window.__dalKamera, zoom: window.__tred?.zoom, x3: window.__tred?.x }));

async function prova(namn, vp, hoppaOver) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => fel.push(`${namn}: ${String(e).slice(0, 200)}`));
  await page.goto(URL_);
  await page.waitForSelector("[data-testid=intro]", { timeout: 120000 });
  if (hoppaOver) {
    await page.waitForTimeout(3000);
    await page.click("[data-testid=intro-hoppa]");
  }
  // Introt är slut när det har försvunnit (även uttoningen); Pennans bok öppnas då automatiskt.
  await page.waitForFunction(() => !document.querySelector("[data-testid=intro]"), null, { timeout: 120000 });
  const bok = page.locator("[data-testid=stang-bok]");
  await bok.first().waitFor({ state: "visible", timeout: 30000 });
  await bok.first().click();
  await page.waitForFunction(() => !document.querySelector("[data-testid=stang-bok]"), null, { timeout: 15000 });
  await page.waitForTimeout(2500);
  const tom = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}").state ?? {};
    return (s.ang?.length ?? 0) + (s.hemma?.length ?? 0) + (s.garden?.length ?? 0) === 0;
  });
  const fore = await kam(page);
  // En finger drar: med musen är vänsterknappen panorering (OrbitControls mouseButtons LEFT = PAN), som ett finger.
  const duk = await page.locator(".angen-3d canvas").boundingBox();
  const [mx, my] = [duk.x + duk.width / 2, duk.y + duk.height * 0.45];
  await page.mouse.move(mx, my);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(mx + i * 14, my);
  await page.mouse.up();
  await page.waitForTimeout(1500);
  const efterDrag = await kam(page);
  // Zoom: hjulet är samma dolly som två fingrar.
  await page.mouse.move(mx, my);
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(1500);
  const efterZoom = await kam(page);
  const coach = await page.locator("[data-testid=coach]").isVisible().catch(() => false);
  const skriv = await page.locator("[data-testid=pennans-bok]").isVisible().catch(() => false);
  const ok = {
    tomVarld: tom,
    styrningPa: efterDrag.enabled === true && efterDrag.aktiv === true,
    panorerade: Math.abs((efterDrag.x ?? 0) - (fore.x ?? 0)) > 0.3,
    zoomade: Math.abs((efterZoom.zoom ?? 0) - (efterDrag.zoom ?? 0)) > 0.3,
    skrivSyns: skriv,
  };
  console.log(namn, JSON.stringify({ ok, coach, fore, efterDrag, efterZoom }));
  await ctx.close();
  return Object.values(ok).every(Boolean);
}

const resultat = [];
for (const [namn, vp] of [["stående", { width: 375, height: 812 }], ["liggande", { width: 812, height: 375 }]]) {
  resultat.push(await prova(`${namn}, hela introt`, vp, false));
  resultat.push(await prova(`${namn}, hoppa över`, vp, true));
}
await browser.close();
if (fel.length) console.log("Sidfel:", fel);
if (!resultat.every(Boolean) || fel.length) {
  console.error("KAMERAPROVET RÖTT");
  process.exit(1);
}
console.log("KAMERAPROVET GRÖNT");
