// Block 5b: två syntetiska spelarscenarier, inte barntester. Verklig titel, tangenter, uppdrag och naturlig önsketakt.
// QA_SCENARIO=sju|tio, TROLLPENNAN_REPO=..., CHROMIUM=..., QA_SCREENSHOTS=... (bilder endast internt).
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
const adress = process.argv[2] ?? "http://127.0.0.1:4173/";
const rot = process.env.TROLLPENNAN_REPO ?? process.cwd();
const bilder = process.env.QA_SCREENSHOTS;
if (bilder) await mkdir(bilder, { recursive: true });
const uppdrag = JSON.parse(await readFile(join(rot, "data/bengtsson.json"), "utf8")).uppdrag;
const onskningar = JSON.parse(await readFile(join(rot, "data/onskningar.json"), "utf8")).onskningar;
const fall = [
  { namn: "sju", viewport: { width: 375, height: 812 }, intro: "hoppa", fras: "en grön kanin" },
  { namn: "tio", viewport: { width: 812, height: 375 }, intro: "nasta", fras: "en blå kanin" },
].filter((f) => !process.env.QA_SCENARIO || process.env.QA_SCENARIO === f.namn);
assert.ok(fall.length);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const logg = (s) => console.log(new Date().toISOString(), s);
try {
  for (const f of fall) {
    const ctx = await browser.newContext({ viewport: f.viewport, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    page.setDefaultTimeout(45000);
    const fel = [], externa = [];
    let tryck = 0;
    const start = Date.now(), steg = {};
    const klart = (namn) => { steg[namn] = Math.round((Date.now() - start) / 100) / 10; logg(`${f.namn}: ${namn} efter ${steg[namn]} automationssekunder`); };
    page.on("pageerror", (e) => fel.push(e.message));
    page.on("request", (r) => { if (![new URL(adress).origin + "/", "data:", "blob:"].some((s) => r.url().startsWith(s))) externa.push(r.url()); });
    await page.addInitScript(() => {
      sessionStorage.setItem("p2-titel-prov", "1");
      localStorage.setItem("trollpennan-skapa-v1", JSON.stringify({ bokstavsljud: false }));
    });
    const klick = async (el) => { await el.click(); tryck += 1; };
    const bild = async (namn) => { if (bilder) await page.screenshot({ path: join(bilder, `${f.namn}-${namn}.png`) }); };
    const tangenter = () => page.getByTestId("tangentbord");
    const skriv = async (text) => {
      for (const b of text) await klick(b === " " ? page.getByTestId("mellanslag") : tangenter().getByRole("button", { name: b, exact: true }));
    };
    const ingenOmbeddHjalp = async () => {
      await tangenter().waitFor({ state: "visible" });
      assert.equal(await page.locator(".sk-hylla").count(), 0, "hjälpord visas först på begäran");
    };
    const oppna = async () => { await klick(page.getByTestId("pennans-bok")); await ingenOmbeddHjalp(); };
    const trolla = async () => {
      await page.waitForFunction(() => document.querySelector('[data-testid="vakna"]')?.getAttribute("data-redo") === "ja", null, { timeout: 15000 });
      await klick(page.getByTestId("vakna"));
      await page.getByTestId("bok-skarm").waitFor({ state: "hidden" });
    };
    try {
      logg(`${f.namn}: färsk isolerad profil, ${f.viewport.width}×${f.viewport.height}, intro ${f.intro}`);
      await page.goto(adress);
      await page.getByTestId("titel-borja").waitFor({ state: "visible", timeout: 120000 });
      await page.evaluate(() => window.__trollMinne.setState({ ljudPa: false, rostPa: false, effektPa: false }));
      await klick(page.getByTestId("titel-borja"));
      await page.getByTestId("intro").waitFor({ state: "visible" });
      if (f.intro === "hoppa") await klick(page.getByTestId("intro-hoppa"));
      else for (let i = 0; i < 8 && await page.getByTestId("intro-nasta").isVisible(); i++) {
        await klick(page.getByTestId("intro-nasta"));
        await page.waitForTimeout(500);
      }
      await page.getByTestId("intro").waitFor({ state: "hidden" });
      await ingenOmbeddHjalp();
      await skriv(f.fras);
      await ingenOmbeddHjalp();
      await trolla();
      await page.waitForFunction(() => window.__trollMinne.getState().ang.some((d) => d.kropp === "kanin"));
      await page.locator(".sk-kvitto, .bubbla").first().waitFor({ state: "visible" });
      klart("egen-skapelse"); await bild("egen-skapelse");

      await klick(page.getByTestId("bengtsson-ikon"));
      await page.getByTestId("uppdragbok").waitFor({ state: "visible" });
      const uppId = await page.locator('[data-v2="aktivt-uppdrag-kort"]').getAttribute("data-uppdrag");
      const u = uppdrag.find((x) => x.id === uppId);
      assert.ok(u, `befintligt uppdrag ${uppId}`);
      const svar = u.val?.grupper?.flatMap((g) => g.forslag ?? [])[0]?.fras;
      assert.ok(svar, "första uppdraget har ett verifierbart eget skrivsvar");
      await klick(page.getByTestId("uppdrag-los-i-boken"));
      await ingenOmbeddHjalp();
      await skriv(svar + " ");
      await trolla();
      await page.waitForFunction((id) => window.__trollMinne.getState().uppdrag[id] === "klar", uppId);
      klart("uppdrag-klart"); await bild("uppdrag-klart");

      await oppna(); await skriv("en månskrutt ");
      assert.ok((await page.locator(".sk-remsa").textContent()).includes("månskrutt"), "okänt ord bevaras i remsan");
      await trolla();
      await page.waitForFunction(() => window.__trollMinne.getState().ang.some((d) => d.kropp === "agg" && d.reserv?.some((r) => r.ord === "månskrutt")));
      klart("okant-ord-synligt"); await bild("ordagg");

      await oppna(); await skriv("en kanim ");
      await page.getByTestId("forslag").waitFor({ state: "visible" });
      assert.ok((await page.locator(".sk-remsa").textContent()).includes("kanim"), "stavningen ändras inte tyst");
      await bild("stavningshjalp");
      await klick(page.getByTestId("forslag-kanin"));
      await page.getByTestId("forslag").waitFor({ state: "hidden" });
      await trolla();
      klart("stavningsval");

      assert.ok(await page.getByTestId("pennans-bok").isEnabled(), "barnet kan skriva medan nästa önskan väntar");
      await page.getByTestId("onska-bubbla").waitFor({ state: "visible", timeout: 180000 });
      const o = await page.evaluate(() => window.__trollMinne.getState().onskan);
      const onska = onskningar.find((x) => x.id === o?.id);
      assert.ok(onska?.exempel?.[0], `naturlig önskan ${o?.id} har skrivsvar`);
      klart("naturlig-onskan"); await bild("onskan");
      await klick(page.getByTestId("onska-bubbla"));
      await ingenOmbeddHjalp();
      await skriv(onska.exempel[0] + " ");
      await trolla();
      await page.waitForFunction(() => window.__trollMinne.getState().onskanAntal >= 1);
      klart("onskan-uppfylld"); await bild("onskan-uppfylld");

      await klick(page.getByTestId("meny"));
      await page.getByTestId("meny-panel").waitFor({ state: "visible" });
      assert.equal(await page.locator(".sk-bok-ruta").count(), 6, "Min bok ger sex frivilliga nästa val");
      await bild("nasta-val");
      await klick(page.getByTestId("meny-panel").locator(".sk-stang"));
      await oppna();
      await klick(page.getByRole("button", { name: "Ordhjälp", exact: true }));
      await page.locator(".sk-hylla").waitFor({ state: "visible" });
      await klick(page.getByTestId("stang-bok"));
      await oppna();
      if (f.namn === "tio") { await skriv("en drake som sprutar eld "); await trolla(); await page.waitForFunction(() => window.__trollMinne.getState().ang.some((d) => d.kropp === "drake" && d.formagor.includes("flammor"))); }
      else await klick(page.getByTestId("stang-bok"));
      klart("nasta-frivilliga-val");
      const fore = await page.evaluate(() => { const s = window.__trollMinne.getState(); return JSON.stringify({ ang: s.ang.map((d) => d.uid).sort(), uppdrag: s.uppdrag, onskanAntal: s.onskanAntal }); });
      await page.reload();
      await klick(page.getByTestId("titel-fortsatt"));
      await page.getByTestId("pennans-bok").waitFor({ state: "visible" });
      const efter = await page.evaluate(() => { const s = window.__trollMinne.getState(); return JSON.stringify({ ang: s.ang.map((d) => d.uid).sort(), uppdrag: s.uppdrag, onskanAntal: s.onskanAntal }); });
      assert.equal(efter, fore, "skapelser och framsteg består efter omladdning");
      assert.deepEqual(fel, []); assert.deepEqual(externa, []);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), f.viewport.width);
      logg(JSON.stringify({ scenario: f.namn, viewport: f.viewport, intro: f.intro, automationssekunder: steg, verkligaKlick: tryck, sidfel: fel, externa }));
    } catch (e) {
      await bild("fel").catch(() => {});
      logg(JSON.stringify(await page.evaluate(() => ({ text: window.__troll?.state().text, onskan: window.__troll?.state().onskan, redo: document.querySelector('[data-testid="vakna"]')?.getAttribute("data-redo"), sidtext: document.body.innerText.slice(-2200) })).catch(() => ({}))));
      throw e;
    } finally { await ctx.close(); }
  }
  logg("FÖRSTA TIO GRÖNT: syntetiska scenarier, tiderna är automationens och är inga barntestresultat.");
} catch (e) { console.error("FÖRSTA TIO RÖTT:", e); process.exitCode = 1; }
finally { await browser.close(); }
