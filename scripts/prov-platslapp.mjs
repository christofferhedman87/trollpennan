#!/usr/bin/env node
// Lokal browserregression för block 4a. Ingen riktig profil eller sparfil används.
// CHROMIUM=/usr/bin/chromium node work/prov-platslapp.mjs [preview-url]
// QA_FALL=skogen|sjon|grottan|ang|onskan|gava|uppdrag och QA_LAGE=staende|liggande begränsar körningen.
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const adress = process.argv[2] ?? "http://127.0.0.1:4173/";
const reporot = process.env.TROLLPENNAN_REPO ?? "/workspace/trollpennan";
const bildmapp = process.env.QA_SCREENSHOTS;
if (bildmapp) await mkdir(bildmapp, { recursive: true });
const lasData = async (fil) => JSON.parse(await readFile(join(reporot, "data", fil), "utf8"));
const [platsdata, ui, bengtsson, onskningar, rostmanifest] = await Promise.all([
  lasData("platser.json"), lasData("skapa-ui.json"), lasData("bengtsson.json"), lasData("onskningar.json"), lasData("rost-manifest.json"),
]);
const platser = new Map(platsdata.platser.map((p) => [p.id, p]));
const onska = onskningar.onskningar.find((o) => o.id === "modig");
const uppdrag = bengtsson.uppdrag.find((u) => u.omrade === "skogen" && !u.final && u.typ === "skriv");
assert.ok(onska && uppdrag, "befintlig önskan och skogsuppdrag finns för prioritetstesten");
// Tredje värdet begränsar vilka fall ett extra format körs för (det smalare liggande formatet provas på Skogen, där Väktarens remsa finns).
const lagen = [
  ["staende", { width: 375, height: 812 }],
  ["liggande", { width: 812, height: 375 }],
  ["liggande-smal", { width: 667, height: 375 }, ["skogen"]],
].filter(([namn]) => !process.env.QA_LAGE || namn === process.env.QA_LAGE || (process.env.QA_LAGE === "liggande" && namn.startsWith("liggande")));
const fallen = ["skogen", "sjon", "grottan", "ang", "onskan", "gava", "uppdrag"]
  .filter((namn) => !process.env.QA_FALL || namn === process.env.QA_FALL);
assert.ok(lagen.length && fallen.length, "QA_LAGE och QA_FALL måste matcha ett dokumenterat provfall");
const logg = (text) => console.log(new Date().toISOString(), text);
const sidfel = [];
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || undefined,
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"],
});

async function bild(page, namn) {
  if (bildmapp) await page.screenshot({ path: join(bildmapp, `${namn}.png`) });
}

async function redo(page) {
  await page.waitForFunction(() => !!window.__troll && !!window.__trollMinne, null, { timeout: 120000 });
  await page.getByTestId("pennans-bok").waitFor({ state: "visible" });
}

async function lappText(page) {
  return page.locator(".sk-lapp-text").evaluate((el) => {
    const text = el.cloneNode(true);
    text.querySelector("small")?.remove();
    return text.textContent.trim();
  });
}

async function nabar(locator, namn) {
  await locator.scrollIntoViewIfNeeded(); // Vanlig rullning; inga CSS- eller positionsändringar.
  const geometri = await locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    let x0 = 0, y0 = 0, x1 = innerWidth, y1 = innerHeight;
    // Ett fixed element klipps inte av förfädernas overflow så länge ingen förfader gör sig till dess containing block
    // (transform, filter, perspective, contain, will-change); det gäller t.ex. Trolla-knappen i liggande läge.
    const skaparBlock = (css) => css.transform !== "none" || css.filter !== "none" || css.perspective !== "none"
      || /(paint|layout|strict|content)/.test(css.contain) || /(transform|filter|perspective)/.test(css.willChange);
    let fri = getComputedStyle(el).position === "fixed";
    for (let p = el.parentElement; p; p = p.parentElement) {
      const css = getComputedStyle(p), b = p.getBoundingClientRect();
      if (!fri) {
        if (/(auto|scroll|hidden|clip)/.test(css.overflowX)) { x0 = Math.max(x0, b.left); x1 = Math.min(x1, b.right); }
        if (/(auto|scroll|hidden|clip)/.test(css.overflowY)) { y0 = Math.max(y0, b.top); y1 = Math.min(y1, b.bottom); }
      }
      if (fri && skaparBlock(css)) fri = false; // Härifrån och uppåt är det förfaderns ruta som klipper.
      else if (!fri && css.position === "fixed") fri = true; // Själv fixed: ytterligare förfäder klipper den inte.
    }
    const traff = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    // Fasta överlägg med pointer-events:none (Väktarens remsa, returskylten) syns inte för elementFromPoint, så de provas geometriskt:
    // inget synligt överlägg får skära elementets ruta, annars är det dolt för barnet fast det går att trycka på.
    const tackt = [...document.querySelectorAll('[data-s4="vaktar-aptitbubbla"], .tp-vagvisare-hud button, .banderoller .banner, .sk-stang')]
      .filter((o) => !el.contains(o) && !o.contains(el))
      .map((o) => ({ o, b: o.getBoundingClientRect(), css: getComputedStyle(o) }))
      .filter(({ b, css }) => b.width > 0 && b.height > 0 && css.visibility !== "hidden" && css.display !== "none" && Number(css.opacity) > 0.05)
      .filter(({ b }) => Math.min(r.right, b.right) - Math.max(r.left, b.left) > 2 && Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top) > 2)
      .map(({ o, b }) => `${o.getAttribute("data-s4") || o.getAttribute("data-plats") || o.className}@${Math.round(b.left)},${Math.round(b.top)},${Math.round(b.right)},${Math.round(b.bottom)}`);
    return {
      tackt,
      ruta: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
      klipp: { x0, y0, x1, y1 },
      hel: r.width > 0 && r.height > 0 && r.left >= x0 - 3 && r.right <= x1 + 3 && r.top >= y0 - 3 && r.bottom <= y1 + 3,
      knappTraff: el.tagName !== "BUTTON" || traff === el || el.contains(traff),
    };
  });
  assert.ok(geometri.hel && geometri.knappTraff && geometri.tackt.length === 0, `${namn} är synlig och nåbar efter vanlig rullning: ${JSON.stringify(geometri)}`);
}

async function skriv(page, text) {
  for (const b of text) {
    if (b === " ") await page.getByTestId("mellanslag").click();
    else await page.locator(".sk-tangenter").getByRole("button", { name: b, exact: true }).click();
  }
}

async function resMedKartan(page, id) {
  if (id === "ang") return;
  await page.getByTestId("ut-pa-aventyr").click();
  await page.getByTestId("karta").waitFor({ state: "visible" });
  await page.getByTestId(`plats-${id}`).click();
  await page.waitForFunction((p) => window.__trollMinne.getState().plats === p, id);
  await page.getByTestId("karta").waitFor({ state: "hidden" });
  await page.getByTestId("pennans-bok").waitFor({ state: "visible" });
}

async function boka(page, ljud = false) {
  await page.evaluate((pa) => {
    window.__trollMinne.setState({ ljudPa: pa, rostPa: pa, effektPa: false });
    window.__rost = [];
  }, ljud);
  await page.getByTestId("pennans-bok").click();
  await page.getByTestId("bok-skarm").waitFor({ state: "visible" });
}

async function kontrolleraFriLapp(page, id, namn) {
  const plats = platser.get(id);
  assert.equal(await page.locator(".sk-lapp").count(), 1, "exakt en lapp visas");
  assert.equal(await page.locator(".sk-lapp-text small").textContent(), plats.namn);
  assert.equal(await lappText(page), plats.intro.text);
  await nabar(page.locator(".sk-lapp-text"), `${namn}: lappens namn och text`);
  await nabar(page.locator(".sk-lapp").getByRole("button", { name: ui.lapp.lyssna_aria, exact: true }), `${namn}: Lyssna`);
  await nabar(page.locator(".sk-tangenter"), `${namn}: tangenterna`);
  await nabar(page.getByTestId("vakna"), `${namn}: Trolla`);
  await nabar(page.locator(".sk-penn-etikett"), `${namn}: Trolla-etiketten`);
  await kontrolleraRemsa(page, namn);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, "ingen sidrullning");
}

// Väktarens remsa (om den visas) ska rymma sin egen text och stanna inom skärmen, annars läcker den över HUD:en.
async function kontrolleraRemsa(page, namn) {
  const remsa = page.locator('[data-s4="vaktar-aptitbubbla"]');
  if (!(await remsa.count())) return;
  const m = await remsa.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const ut = [...el.querySelectorAll("*")].filter((e) => {
      const b = e.getBoundingClientRect();
      return b.width > 0 && b.height > 0 && getComputedStyle(e).display !== "none" && (b.top < r.top - 1 || b.bottom > r.bottom + 1 || b.right > r.right + 1 || b.left < r.left - 1);
    }).map((e) => e.tagName);
    const p = el.querySelector("p");
    return { ut, rymmer: !p || p.scrollHeight <= p.clientHeight + 1, inom: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight };
  });
  assert.ok(m.ut.length === 0 && m.rymmer && m.inom, `${namn}: Väktarens remsa rymmer sin text: ${JSON.stringify(m)}`);
}

async function kontrolleraOppningsrost(page, id) {
  const text = platser.get(id).intro.text;
  const forvantadFil = Object.values(rostmanifest.rader).find((r) => r.t === text)?.f;
  assert.ok(forvantadFil, "den oförändrade platsrepliken har befintlig inspelning");
  await page.waitForFunction((t) => (window.__rost ?? []).some((r) => r.text === t && r.satt === "fil"), text, { timeout: 12000 });
  // Ge både barnets och förälderns mount-effekter möjlighet att synas i befintlig röstdiagnostik.
  await page.evaluate(() => new Promise((klar) => requestAnimationFrame(() => requestAnimationFrame(klar))));
  const rader = await page.evaluate(() => window.__rost ?? []);
  const platsroster = rader.filter((r) => r.text === text && r.satt === "fil");
  assert.equal(platsroster.length, 1, `en öppningsuppläsning: ${JSON.stringify(rader)}`);
  assert.equal(platsroster[0].fil, forvantadFil, "samma MP3 som platsens befintliga text");
  assert.equal(rader.some((r) => r.text === ui.rost.oppna), false, "generiska öppningsraden konkurrerar inte med platslappen");
  await page.evaluate(() => window.__trollMinne.setState({ ljudPa: false, rostPa: false }));
}

async function provaFri(page, id, namn) {
  await resMedKartan(page, id);
  await boka(page, id !== "ang");
  if (id === "ang") {
    assert.equal(await page.locator(".sk-lapp").count(), 0, "fri skrivning på Ängen har ingen platslapp");
    await nabar(page.locator(".sk-tangenter"), `${namn}: Ängens tangenter`);
    await nabar(page.getByTestId("vakna"), `${namn}: Ängens Trolla`);
    return;
  }
  await kontrolleraFriLapp(page, id, namn);
  await kontrolleraOppningsrost(page, id);
  await bild(page, `${namn}-lapp`);
  await skriv(page, "en blå katt ");
  await page.waitForFunction(() => document.querySelector('[data-testid="vakna"]')?.getAttribute("data-redo") === "ja");
  await nabar(page.getByTestId("remsa"), `${namn}: den färdiga meningen`);
  await nabar(page.getByTestId("vakna"), `${namn}: skrivningens Trolla`);
  await page.getByTestId("vakna").click();
  await page.waitForFunction((p) => (window.__trollMinne.getState().platsSkapelser[p] ?? []).some((d) => d.kropp === "katt" && d.formel.includes("blå")), id);
  await page.getByTestId("bok-skarm").waitFor({ state: "hidden" });
  const skapad = await page.evaluate((p) => {
    const s = window.__trollMinne.getState();
    return { plats: s.plats, djur: s.platsSkapelser[p].find((d) => d.kropp === "katt"), ang: s.ang.map((d) => d.uid) };
  }, id);
  assert.equal(skapad.plats, id);
  assert.deepEqual(skapad.ang, ["platslapp-kanin"], "utflyktens katt hamnar inte på Ängen");
  const sparad = await page.evaluate((p) => JSON.parse(localStorage.getItem("trollpennan-v2")).platsSkapelser[p], id);
  assert.ok(sparad.some((d) => d.uid === skapad.djur.uid), "skapelsen finns i den riktiga lokala sparningen");
  await page.reload({ timeout: 120000 });
  await redo(page);
  const omlast = await page.evaluate(({ p, uid }) => {
    const s = window.__trollMinne.getState();
    return { plats: s.plats, djur: s.platsSkapelser[p]?.find((d) => d.uid === uid) };
  }, { p: id, uid: skapad.djur.uid });
  assert.equal(omlast.plats, id, "aktuell plats överlever omladdning");
  assert.deepEqual(omlast.djur, skapad.djur, "den skrivna katten stannar på rätt plats efter omladdning");
  await boka(page);
  await kontrolleraFriLapp(page, id, namn);
}

async function provaPrioritet(page, fall, namn) {
  await resMedKartan(page, "skogen");
  if (fall === "onskan") {
    await page.evaluate((id) => window.__troll.onska(id, false), onska.id);
    await page.evaluate(() => new Promise(requestAnimationFrame));
    const bubbla = page.getByTestId("onska-bubbla");
    if (await bubbla.isVisible()) await bubbla.click();
    else {
      logg(`${namn}: önskan öppnas genom befintligt prov-API; önskebubblan saknar synlig 3D-träffyta i detta läge`);
      await page.evaluate((id) => window.__troll.onska(id, true), onska.id);
    }
    await page.getByTestId("onska-remsa").waitFor({ state: "visible" });
    assert.equal(await lappText(page), onska.text, "uttrycklig önskan går före platslappen");
    assert.notEqual(await page.locator(".sk-lapp-text small").textContent(), platser.get("skogen").namn);
  } else if (fall === "gava") {
    // Prov-API:t geGava öppnar själv boken med gåvolappen (precis som "Ge gåva" gör), så ingen extra knapptryckning på Skriv.
    // Gåvoflödet provas alltså via prov-API:t och inte via djurets egen meny; prioriteten mot platslappen är densamma.
    await page.evaluate(() => window.__troll.geGava("platslapp-kanin"));
    await page.getByTestId("bok-skarm").waitFor({ state: "visible" });
    await page.getByTestId("gava-remsa").waitFor({ state: "visible" });
    assert.match(await page.locator(".sk-lapp-text small").textContent(), /^Present till /, "gåvan går före platslappen");
    assert.match(await lappText(page), /Vad vill du ge/, "gåvans befintliga fråga visas");
  } else {
    await page.evaluate((id) => window.__trollMinne.getState().sattUppdrag(id, "pagar"), uppdrag.id);
    await page.getByTestId("npc-figur").click();
    await page.getByTestId("uppdragbok").waitFor({ state: "visible" });
    await page.getByTestId("uppdrag-los-i-boken").click();
    await page.getByTestId("uppdragbok").waitFor({ state: "hidden" });
    assert.equal(await page.locator(".sk-lapp-text small").textContent(), ui.lapp.uppdrag_fran);
    assert.equal(await lappText(page), uppdrag.text_bengtsson ?? uppdrag.text, "Svara med pennan visar uppdragslappen före platslappen");
  }
  assert.equal(await page.locator(".sk-lapp").count(), 1, "platslappen ligger inte kvar under den explicita lappen");
  await nabar(page.locator(".sk-lapp-text"), `${namn}: uttrycklig lapp`);
  await nabar(page.locator(".sk-tangenter"), `${namn}: tangenter`);
  await nabar(page.getByTestId("vakna"), `${namn}: Trolla`);
  await bild(page, `${namn}-prioritet`);
}

try {
  for (const [lage, viewport, baraFall] of lagen) for (const fall of fallen) {
    if (baraFall && !baraFall.includes(fall)) continue;
    const namn = `${lage}-${fall}`;
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce" });
    const page = await context.newPage();
    page.setDefaultTimeout(45000);
    page.on("pageerror", (e) => sidfel.push(`${namn}: ${e.message}`));
    await page.addInitScript(() => {
      if (sessionStorage.getItem("platslapp-prov")) return;
      sessionStorage.setItem("platslapp-prov", "1");
      localStorage.setItem("trollpennan-v2", JSON.stringify({
        version: 2, introSedd: true, startLage: "skriv", startLageVald: true,
        ang: [{ uid: "platslapp-kanin", skapad: Date.now(), kropp: "kanin", formel: "en kanin", beskrivning: "en kanin", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [] }],
        garden: [], stjarnor: 17, dal: { utbyggnader: [] }, egnaDjur: 5, dragit: true,
        ljudPa: false, rostPa: false, effektPa: false, plats: "ang", platsSkapelser: {},
        oppnadePlatser: ["skogen", "sjon", "grottan"], seddaIntro: ["skogen", "sjon", "grottan"],
        forstaKarta: false, onskan: null, onskaVid: Date.now() + 3600000, uppdrag: {},
      }));
      localStorage.setItem("trollpennan-skapa-v1", JSON.stringify({ bokstavsljud: false }));
    });
    try {
      logg(`${namn}: börjar med isolerad syntetisk profil`);
      await page.goto(adress, { timeout: 120000 });
      await redo(page);
      if (["onskan", "gava", "uppdrag"].includes(fall)) await provaPrioritet(page, fall, namn);
      else await provaFri(page, fall, namn);
      logg(`${namn}: grönt`);
    } catch (e) {
      await bild(page, `${namn}-fel`).catch(() => {});
      throw e;
    } finally {
      await context.close();
    }
  }
  assert.deepEqual(sidfel, [], "inga JavaScript-fel i de provade flödena");
  logg(`PLATSLAPP GRÖNT: ${fallen.join(", ")} i ${lagen.map(([namn]) => namn).join(" och ")}. Syntetiska profiler, minskad rörelse.`);
} catch (e) {
  console.error("PLATSLAPP RÖTT:", e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
