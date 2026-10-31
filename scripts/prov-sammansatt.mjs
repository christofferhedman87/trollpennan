#!/usr/bin/env node
// T08: riktiga tangenter/Trolla, rätt antal huvuden och tillbehör, full formel samt omladdning.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
const adress = process.argv[2] || "http://127.0.0.1:4186/";
const bilder = process.env.QA_SCREENSHOTS;
if (bilder) await mkdir(bilder, { recursive: true });
const fraser = [
  { text: "en katt under ett bord", relation: "under", id: "bord", antal: 1 },
  { text: "en katt på en sten", relation: "på", id: "sten", antal: 1 },
  { text: "en katt i en låda", relation: "i", id: "kartong", antal: 1 },
  { text: "en katt bredvid en boll", relation: "bredvid", id: "boll", antal: 1 },
  { text: "en katt med två röda äpplen", relation: "med", id: "apple", antal: 2 },
  { text: "en kanin med två strumpor", relation: "plagg", id: "strumpa", antal: 2 },
  { text: "en katt med tio hattar", relation: "plagg", id: "hatt", antal: 10 },
  { text: "en katt i en hatt", relation: "i", id: "hatt", antal: 1 },
  { text: "en katt under två bord", relation: "under", id: "bord", antal: 2 },
];
function geometri(g, p) {
  assert.ok(g, "faktisk renderad geometri finns");
  const saker = (p.relation === "plagg" ? g.plagg : g.saker).filter((s) => s.id === p.id);
  assert.equal(saker.length, p.antal, "varje skrivet exemplar har en verklig modell");
  assert.ok(g.kropp.mesh > 0 && saker.every((s) => s.mesh > 0));
  const k = g.kropp.lokal, o = saker[0].lokal;
  if (process.env.QA_MATT) console.log(JSON.stringify({text:p.text,kropp:k,saker:saker.map((s)=>s.lokal)}));
  if (p.relation === "under") for (const sak of saker) {
    const o = sak.lokal;
    assert.ok(k.max[1] < o.min[1] + (o.max[1] - o.min[1]) * 0.78 - 0.02, "djurets huvud är under varje bordsskiva");
    assert.ok(k.min[0] > o.min[0] && k.max[0] < o.max[0], "djuret ryms mellan bordets ytterkanter");
    assert.ok(k.min[2] > o.min[2] && k.max[2] < o.max[2]);
  }
  if (p.relation === "på") assert.ok(k.min[1] >= o.max[1] - 0.05 && k.min[1] <= o.max[1] + 0.13, "tassarna vilar på stenen");
  if (p.relation === "i") for (const sak of saker) for (const i of [0,1,2]) assert.ok(k.min[i] > sak.lokal.min[i] && k.max[i] < sak.lokal.max[i], "djurets hela kropp är i varje behållare");
  if (["bredvid", "med"].includes(p.relation)) {
    for (const sak of saker) assert.ok(sak.lokal.min[0] > k.max[0] || sak.lokal.max[0] < k.min[0], "separata saker står bredvid kroppen");
  }
  if (p.relation === "plagg") assert.ok(saker[0].lokal.min.reduce((s, x, i) => s + Math.abs(x - saker[1].lokal.min[i]), 0) > 0.03, "flera plagg har skilda fästpunkter");
}
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/bin/chromium", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  for (const viewport of [{ width: 375, height: 812 }, { width: 812, height: 375 }].filter((v) => !process.env.QA_LAGE || String(v.width) === process.env.QA_LAGE)) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage(); page.setDefaultTimeout(60000);
    const fel = [], konsolfel = [];
    page.on("pageerror", (e) => fel.push(e.message)); page.on("console", (m) => { if (m.type() === "error") konsolfel.push(m.text()); });
    await page.addInitScript(() => {
      if (sessionStorage.getItem("c1c-prov")) return;
      sessionStorage.setItem("c1c-prov", "1");
      localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, startLage: "skriv", startLageVald: true,
        ang: [{ uid: "c1c-prov", skapad: 1, kropp: "kanin", formel: "en kanin", beskrivning: "en kanin", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [] }],
        garden: [], stjarnor: 17, egnaDjur: 5, dragit: true, ljudPa: false, rostPa: false, effektPa: false, onskaVid: Date.now() + 3600000, uppdrag: {} }));
      localStorage.setItem("trollpennan-skapa-v1", '{"bokstavsljud":false}');
    });
    await page.goto(adress, { timeout: 120000 }); await page.waitForFunction(() => !!window.__trollMinne);
    const alla = () => page.evaluate(() => { const s = window.__trollMinne.getState(); return [...s.ang, ...s.sovande, ...s.hemma.map((h) => h.spec), ...Object.values(s.platsSkapelser).flat(), ...s.garden]; });
    const skapade = [];
    for (const p of fraser.filter((p) => !process.env.QA_FALL || process.env.QA_FALL.split("|").includes(p.text))) {
      await page.getByTestId("pennans-bok").click(); await page.getByTestId("tangentbord").waitFor();
      await page.locator('[data-dal="skrivbricka"]').click();
      for (const del of p.text.split(/([åäö])/)) {
        if (!del) continue;
        if (/^[åäö]$/.test(del)) await page.getByTestId("tangentbord").getByRole("button", { name: del, exact: true }).click();
        else await page.keyboard.type(del);
      }
      assert.equal(await page.getByTestId("ord-input").inputValue(), p.text, "barnets exakta egna ord före Trolla");
      await page.evaluate(() => { window.__PAUSE_ANIM = true; });
      const fore = new Set((await alla()).map((d) => d.uid));
      if (process.env.QA_HOLO !== "0") {
        await page.waitForFunction(({ id, antal, relation }) => { const g = window.__holoGeometri; return g && g.kropp.mesh > 0 && (relation === "plagg" ? g.plagg : g.saker).filter((s) => s.id === id && s.mesh > 0).length === antal; }, p);
        await page.waitForFunction(() => !document.querySelector(".sk-ark")?.classList.contains("sk-ark--trollar"));
        if (bilder) await page.screenshot({ path: `${bilder}/holo-${viewport.width}-${skapade.length}.png` });
        const holo = await page.evaluate(() => window.__holoGeometri);
        if (process.env.QA_MATT) console.log("Holo-ruta", await page.evaluate(() => window.__trollholo));
        geometri(holo, p);
        const rutor = [holo.kropp, ...holo.saker, ...holo.plagg].map((x) => x.skarm);
        assert.ok(Math.max(Math.max(...rutor.map((r) => r.x1)) - Math.min(...rutor.map((r) => r.x0)), Math.max(...rutor.map((r) => r.y1)) - Math.min(...rutor.map((r) => r.y0))) >= 64, "förhandsvisningen går att urskilja");
        for (const ruta of rutor) {
          assert.ok(ruta.x0 >= 0 && ruta.x1 <= viewport.width, "hela hologrammet ryms i sidled");
          assert.ok(ruta.y0 >= 90 && ruta.y1 <= (await page.locator(".sk-ark").boundingBox()).y, "hela hologrammet är ovanför boken och under HUD");
        }
      }
      await page.getByTestId("vakna").click(); await page.getByTestId("bok-skarm").waitFor({ state: "hidden" });
      const nya = (await alla()).filter((d) => !fore.has(d.uid));
      assert.equal(nya.length, 1);
      const d = nya[0]; assert.equal(d.formel, p.text);
      skapade.push(JSON.parse(JSON.stringify(d)));
      await page.waitForFunction(({ uid, id, antal, relation }) => { const g = window.__skapelseGeometri?.[uid]; return g && g.kropp.mesh > 0 && (relation === "plagg" ? g.plagg : g.saker).filter((s) => s.id === id && s.mesh > 0).length === antal; }, { ...p, uid: d.uid });
      geometri(await page.evaluate((uid) => window.__skapelseGeometri[uid], d.uid), p);
      // Låt vanligt kvitto löpa ut. Inget klick tvingas mot en redan utgången replik.
      await page.locator('[data-dal="kvitto"]').waitFor({ state: "hidden", timeout: 15000 });
      if (bilder) await page.screenshot({ path: `${bilder}/${viewport.width}-${p.bygg ? "tak" : skapade.length}.png` });
      console.log("Grönt antal/formel", viewport.width, p.text, nya.length);
    }
    await page.reload(); await page.getByTestId("pennans-bok").waitFor();
    const efter = JSON.parse(JSON.stringify(await alla()));
    for (const d of skapade) assert.deepEqual(efter.find((x) => x.uid === d.uid), d, "hela skapelsen med antal/ord/egenskaper sparas");
    assert.deepEqual(fel, []); assert.deepEqual(konsolfel, []);
    console.log("Grönt antal/formel efter omladdning", viewport.width, skapade.length);
    await context.close();
  }
} finally { await browser.close(); }
