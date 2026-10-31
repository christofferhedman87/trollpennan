#!/usr/bin/env node
// Lokal browserregression för block 4b: ringen och hologrammet (förhandsvisningen) på utflykterna Skogen, Sjön och Grottan.
// Ingen riktig profil eller sparfil används (syntetiska isolerade profiler). Kör mot en förhandsvisning av build:pages:
//   npm run build:pages && npx vite preview --config vite.pages.config.ts --port 4173 --strictPort
//   TROLLPENNAN_REPO=. CHROMIUM=/sökväg/till/chrome node scripts/prov-platsforhand.mjs [url]
// QA_TANGENTER=fysiska använder riktiga ASCII-tangenter och skärmknappar för å/ä/ö; standard är alla skärmknappar.
// QA_PLATS=skogen|sjon|grottan och QA_LAGE=staende|liggande|smal|kort|dator begränsar körningen. QA_SCREENSHOTS=mapp sparar bilder för egen kontroll.
//
// Provet kräver per plats och format: en tom ring där ett djur skulle landa; hologram för kanin, fisk, fågel och sak med ringen och
// hologrammet helt i bild och inte under arket (stående: ovanför arkets överkant, liggande: vänster om arket); höjden följer rollen
// (marken 0, fisken över vattnet, fågeln i luftbandet); förhandsvisningen ändrar inget i sparningen; ett tomtbygge får inget
// lokalt bygghologram; Trolla placerar djuret där ringen låg; stängd bok eller ny plats tömmer ring och bildförskjutning.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import { matHologramRitanrop } from "./prov-holo-ritanrop.mjs";

const adress = process.argv[2] ?? "http://127.0.0.1:4173/";
const bildmapp = process.env.QA_SCREENSHOTS;
if (bildmapp) await mkdir(bildmapp, { recursive: true });
const lagen = [
  ["staende", { width: 375, height: 812 }],
  ["liggande", { width: 812, height: 375 }],
  ["smal", { width: 667, height: 375 }],
  ["kort", { width: 375, height: 667 }],
  ["dator", { width: 1280, height: 720 }],
].filter(([namn]) => process.env.QA_LAGE ? namn === process.env.QA_LAGE : ["staende", "liggande"].includes(namn));
const platser = ["skogen", "sjon", "grottan"].filter((p) => !process.env.QA_PLATS || p === process.env.QA_PLATS);
assert.ok(lagen.length && platser.length, "QA_LAGE och QA_PLATS måste matcha ett provfall");
// [mening, förväntad roll]. Fisken ligger i vattnet på Sjön men på marken i Skogen/Grottan om platsen saknar vatten.
const ord = [
  ["en kanin", "mark"],
  ["en fisk", "vatten"],
  ["en fågel", "luft"],
  ["en sten", "mark"],
];
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
async function oppnaBok(page) {
  await page.evaluate(() => window.__trollMinne.setState({ ljudPa: false, rostPa: false, effektPa: false }));
  await page.getByTestId("pennans-bok").click();
  await page.getByTestId("bok-skarm").waitFor({ state: "visible" });
}
async function skriv(page, text) {
  const fore = await page.getByTestId("ord-input").inputValue();
  if (process.env.QA_TANGENTER === "fysiska") {
    await page.locator('[data-dal="skrivbricka"]').click();
    for (const bit of text.split(/([åäö])/)) {
      if (!bit) continue;
      if (/^[åäö]$/.test(bit)) await page.locator(".sk-tangenter").getByRole("button", { name: bit, exact: true }).click();
      else await page.keyboard.type(bit);
    }
  } else for (const b of text) {
    if (b === " ") await page.getByTestId("mellanslag").click();
    else await page.locator(".sk-tangenter").getByRole("button", { name: b, exact: true }).click();
  }
  assert.equal(await page.getByTestId("ord-input").inputValue(), fore + text, "exakt text före förhandsvisningen");
}
async function sudda(page, antal) {
  const fore = await page.getByTestId("ord-input").inputValue();
  if (process.env.QA_TANGENTER === "fysiska") {
    await page.locator('[data-dal="skrivbricka"]').click();
    for (let i = 0; i < antal; i++) await page.keyboard.press("Backspace");
  } else for (let i = 0; i < antal; i++) await page.getByTestId("radera").click();
  assert.equal(await page.getByTestId("ord-input").inputValue(), fore.slice(0, -antal), "exakt radering efter förhandsvisningen");
}
// Det skapandet rör: djurlistorna, de sovande, stall, hem, tomter, stjärnor och mark. (Övriga fält, t.ex. räknare för skrivna ord,
// ändras av vanliga tangenttryck och hör inte till förhandsvisningen.)
const sparning = (page) => page.evaluate(() => {
  const nycklar = ["ang", "platsSkapelser", "sovande", "stall", "hemma", "garden", "stjarnor", "dal", "plats"];
  const urval = (o) => Object.fromEntries(nycklar.map((k) => [k, o?.[k] ?? null]));
  const lokal = JSON.parse(localStorage.getItem("trollpennan-v2") ?? "null");
  return JSON.stringify({ minne: urval(window.__trollMinne.getState()), lokal: urval(lokal) });
});
const diag = (page) => page.evaluate(() => {
  const a = document.querySelector(".sk-ark")?.getBoundingClientRect();
  const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(e).opacity !== "0" ? { left: b.left, top: b.top, right: b.right, bottom: b.bottom } : null; };
  return {
    ring: window.__trollring ?? null, holo: window.__trollholo ?? null, vy: window.__trollvy ?? null, W: innerWidth, H: innerHeight,
    overlag: [".sk-penn-knapp", ".sk-penn-etikett", ".sk-stang", ".sk-gata", ".sk-gata-inline"].map(r).filter(Boolean),
    ark: a ? { left: a.left, top: a.top } : null, remsa: r('[data-s4="vaktar-aptitbubbla"]'), skylt: r(".tp-vagvisare-hud button"), calls: window.__trollvy?.calls ?? null, holoCalls: window.__holoRitanrop?.senast ?? null,
  };
});
const skar = (a, b) => !!a && !!b && Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;

/** Ringen och hologrammet ska vara hela och synliga: i bild, på rätt sida om arket och inte under HUD:ens remsa eller skylt. */
function kontrolleraSynlig(d, namn, liggande) {
  const { ring, holo, ark, W, H } = d;
  assert.ok(ring && ark, `${namn}: ringen finns`);
  const ringOK = ring.x > 8 && ring.x < W - 8 && ring.y > 8 && ring.y < H - 8 && (liggande ? ring.x < ark.left - 8 : ring.y < ark.top - 8);
  assert.ok(ringOK, `${namn}: ringens mitt är i bild och inte under arket: ${JSON.stringify({ ring, ark, W, H })}`);
  for (const o of d.overlag) assert.ok(!(ring.x > o.left && ring.x < o.right && ring.y > o.top && ring.y < o.bottom), `${namn}: ringens mitt täcks inte av bokkontroller`);
  if (!holo) return;
  const hel = holo.x0 >= -2 && holo.y0 >= -2 && holo.x1 <= W + 2 && holo.y1 <= H + 2;
  assert.ok(hel, `${namn}: hologrammet ryms i bild: ${JSON.stringify(holo)}`);
  assert.ok(liggande ? holo.x1 <= ark.left + 4 : holo.y1 <= ark.top + 4, `${namn}: hologrammet täcks inte av arket: ${JSON.stringify({ holo, ark })}`);
  assert.ok(holo.y1 - holo.y0 >= 20 && holo.x1 - holo.x0 >= 12, `${namn}: hologrammet har synlig storlek: ${JSON.stringify(holo)}`);
  const ruta = { left: holo.x0, top: holo.y0, right: holo.x1, bottom: holo.y1 };
  assert.ok(!skar(ruta, d.remsa), `${namn}: Väktarens remsa täcker inte hologrammet: ${JSON.stringify({ ruta, remsa: d.remsa })}`);
  for (const o of d.overlag) assert.ok(!skar(ruta, o), `${namn}: bokkontroller täcker inte hologrammet: ${JSON.stringify({ ruta, o })}`);
  assert.ok(!skar(ruta, d.skylt), `${namn}: returskylten täcker inte hologrammet: ${JSON.stringify({ ruta, skylt: d.skylt })}`);
}

async function vantaHolo(page, id, namn, ordText) {
  const fras = ordText.replace(/^en /, "");
  await page.waitForFunction(({ p, f }) => window.__trollholo?.plats === p && window.__trollholo.nyckel.includes(f), { p: id, f: fras }, { timeout: 60000 });
  // Ge ArkKamerans förskjutning tid att glida på plats (6 s^-1) och modellen att byta från reservformen till GLB.
  await page.waitForTimeout(1600);
}

// Scenens globala materialpass kör var 40:e bildruta. Ett enstaka positivt prov direkt efter
// montering missar därför att passet senare kan skriva över hologrammets shader.
async function kontrolleraVaraktighet(page, namn) {
  const rutor = await page.evaluate(() => new Promise((resolve) => {
    const nyckel = window.__trollholo?.nyckel;
    const rader = [];
    const prov = () => {
      rader.push({ nyckel: window.__trollholo?.nyckel, calls: window.__holoRitanrop?.senast });
      if (rader.length === 90) resolve({ nyckel, rader });
      else requestAnimationFrame(prov);
    };
    requestAnimationFrame(prov);
  }));
  assert.ok(rutor.nyckel, `${namn}: varaktighetsprovet gäller ett hologram`);
  assert.ok(rutor.rader.every((r) => r.nyckel === rutor.nyckel), `${namn}: samma hologram under hela provet`);
  assert.ok(rutor.rader.every((r) => r.calls > 0 && r.calls <= 30), `${namn}: hologrammet behåller sin shader i 90 bildrutor: ${JSON.stringify(rutor.rader.map((r) => r.calls))}`);
  logg(`${namn}: 90 bildrutor med hologrammets egna WebGL-anrop, ${Math.min(...rutor.rader.map((r) => r.calls))}–${Math.max(...rutor.rader.map((r) => r.calls))}`);
}

async function provaPlats(page, id, lage, liggande) {
  const namn = `${lage}-${id}`;
  await resMedKartan(page, id);
  await oppnaBok(page);
  const fore = await sparning(page);

  // 1. Tom ring: ett djur skulle landa här. Inget hologram.
  await page.waitForFunction((p) => window.__trollring?.plats === p, id, { timeout: 30000 });
  await page.waitForTimeout(1200);
  let d = await diag(page);
  assert.equal(d.ring.plats, id, `${namn}: tomma ringen gäller platsen`);
  assert.equal(d.holo, null, `${namn}: tom mening ger inget hologram`);
  kontrolleraSynlig(d, `${namn}: tom ring`, liggande);
  const callsTom = d.calls;
  await bild(page, `${namn}-tom`);

  // 2. Kanin, fisk, fågel, sak.
  for (const [text, roll] of ord) {
    await skriv(page, text);
    await vantaHolo(page, id, namn, text);
    d = await diag(page);
    assert.equal(d.holo.plats, id, `${namn}: ${text}: hologrammet gäller platsen`);
    assert.ok(d.holo.krymp > 0 && d.holo.krymp <= 1, `${namn}: ${text}: krympning 0–1`);
    if (roll === "luft") assert.ok(d.holo.y >= 1.6 && d.holo.y <= 2.4, `${namn}: ${text}: fågeln ligger i luftbandet: ${d.holo.y}`);
    else if (roll === "vatten" && id === "sjon") assert.ok(d.holo.y > 0 && d.holo.y < 0.5, `${namn}: ${text}: fisken ligger strax över vattenytan: ${d.holo.y}`);
    else if (roll === "mark") assert.equal(d.holo.y, 0, `${namn}: ${text}: marken har höjd 0`);
    kontrolleraSynlig(d, `${namn}: ${text}`, liggande);
    // Samma shader mäts i verkliga WebGL-anrop. Totalskillnaden mot tom ring är bara en skillnad mellan vyer:
    // ringens läge flyttar kameran, och bakgrundsmodeller kan ha hunnit laddas under skrivandet.
    logg(`${namn}: ${text}: ritanrop tom ring ${callsTom}, med hologram ${d.calls}; ring ${d.ring.x},${d.ring.y} (${d.ring.wx},${d.ring.wz}); hologram ${d.holo.x0},${d.holo.y0}–${d.holo.x1},${d.holo.y1} y ${d.holo.y} skala ${d.holo.skala}`);
    logg(`${namn}: ${text}: hologrammets egna WebGL-ritanrop ${d.holoCalls}`);
    assert.ok(d.holoCalls > 0 && d.holoCalls <= 30, `${namn}: ${text}: hologrammet kostar högst 30 egna ritanrop (${d.holoCalls})`);
    assert.ok(d.calls == null || d.calls <= 140, `${namn}: ${text}: högst 140 ritanrop med boken öppen (${d.calls})`);
    if (text === "en sten") await kontrolleraVaraktighet(page, `${namn}: ${text}`);
    await bild(page, `${namn}-${text.replace(/^en /, "")}`);
    await sudda(page, text.length);
    await page.waitForFunction(() => window.__trollholo == null, null, { timeout: 15000 });
  }

  // 2b. Rotation med öppen bok: ringen och hologrammet följer med till det andra formatet och ligger kvar på sin plats.
  await skriv(page, "en kanin");
  await vantaHolo(page, id, namn, "en kanin");
  const orig = page.viewportSize();
  await page.setViewportSize({ width: orig.height, height: orig.width });
  await page.waitForTimeout(2500);
  d = await diag(page);
  assert.equal(d.holo?.plats, id, `${namn}: hologrammet kvar efter rotation`);
  kontrolleraSynlig(d, `${namn}: efter rotation`, !liggande);
  await bild(page, `${namn}-roterad`);
  await page.setViewportSize(orig);
  await page.waitForTimeout(2500);
  d = await diag(page);
  kontrolleraSynlig(d, `${namn}: tillbaka efter rotation`, liggande);
  await sudda(page, "en kanin".length);
  await page.waitForFunction(() => window.__trollholo == null, null, { timeout: 15000 });

  // 3. Ett tomtbygge hör till Hemdalen: ingen falsk bygghologram på utflykten, bara den tomma ringen.
  await skriv(page, "ett hus");
  await page.waitForTimeout(1500);
  d = await diag(page);
  assert.equal(d.holo, null, `${namn}: ett tomtbygge får inget lokalt hologram`);
  assert.ok(d.ring && d.ring.plats === id, `${namn}: ringen finns kvar för bygget`);
  await sudda(page, "ett hus".length);

  // 4. Förhandsvisningen ändrade ingenting i sparningen.
  assert.equal(await sparning(page), fore, `${namn}: förhandsvisningen ändrar varken minnet eller lokal sparning`);

  // 5. Trolla placerar djuret där ringen låg.
  await skriv(page, "en katt ");
  await page.waitForFunction(() => document.querySelector('[data-testid="vakna"]')?.getAttribute("data-redo") === "ja");
  await vantaHolo(page, id, namn, "en katt");
  const ring = (await diag(page)).ring;
  await page.getByTestId("vakna").click();
  await page.waitForFunction((p) => (window.__trollMinne.getState().platsSkapelser[p] ?? []).some((x) => x.kropp === "katt"), id, { timeout: 30000 });
  const uid = await page.evaluate((p) => window.__trollMinne.getState().platsSkapelser[p].find((x) => x.kropp === "katt").uid, id);
  await page.getByTestId("bok-skarm").waitFor({ state: "hidden" });
  await page.waitForFunction((u) => !!window.__tredPos?.[u], uid, { timeout: 30000 });
  await page.waitForTimeout(1200);
  const pos = await page.evaluate((u) => window.__tredPos[u], uid);
  const avst = Math.hypot(pos.x - ring.wx, pos.z - ring.wz);
  assert.ok(avst <= 0.8, `${namn}: katten hamnar där ringen låg (ring ${ring.wx},${ring.wz}; djur ${pos.x},${pos.z}; avstånd ${avst.toFixed(2)})`);

  // 6. Stängd bok: ringen och bildförskjutningen är borta.
  await page.waitForTimeout(1500);
  d = await diag(page);
  assert.equal(d.vy?.oppen, false, `${namn}: stängd bok`);
  assert.equal(d.vy?.aktiv, false, `${namn}: stängd bok tar bort bildförskjutningen: ${JSON.stringify(d.vy)}`);
  await bild(page, `${namn}-skapad`);

  // 7. Ny plats: gammal ring och förskjutning följer inte med.
  await oppnaBok(page);
  await skriv(page, "en kanin");
  await vantaHolo(page, id, namn, "en kanin");
  await page.getByTestId("stang-bok").click();
  await page.getByTestId("bok-skarm").waitFor({ state: "hidden" });
  const annan = platser.find((p) => p !== id) ?? (id === "skogen" ? "sjon" : "skogen");
  await resMedKartan(page, annan);
  await page.waitForTimeout(1500);
  d = await diag(page);
  assert.equal(d.vy?.aktiv, false, `${namn}: efter platsbyte är bildförskjutningen borta: ${JSON.stringify(d.vy)}`);
  await oppnaBok(page);
  await page.waitForFunction((p) => window.__trollring?.plats === p, annan, { timeout: 30000 });
  await page.waitForTimeout(1200);
  d = await diag(page);
  assert.equal(d.ring.plats, annan, `${namn}: nya platsens ring, inte den gamla`);
  // Meningen finns kvar i boken, så den nya platsen visar sitt eget hologram för den; aldrig det gamla platsens.
  assert.ok(d.holo === null || (d.holo.plats === annan && d.holo.nyckel.startsWith(`${annan}:`)), `${namn}: gamla platsens hologram följer inte med: ${JSON.stringify(d.holo)}`);
  kontrolleraSynlig(d, `${namn}: ny plats ${annan}`, liggande);
}

try {
  for (const [lage, viewport] of lagen) for (const id of platser) {
    const namn = `${lage}-${id}`;
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce" });
    const page = await context.newPage();
    await matHologramRitanrop(page);
    page.setDefaultTimeout(45000);
    page.on("pageerror", (e) => sidfel.push(`${namn}: ${e.message}`));
    await page.addInitScript(() => {
      if (sessionStorage.getItem("platsforhand-prov")) return;
      sessionStorage.setItem("platsforhand-prov", "1");
      localStorage.setItem("trollpennan-v2", JSON.stringify({
        version: 2, introSedd: true, startLage: "skriv", startLageVald: true,
        ang: [{ uid: "platsforhand-kanin", skapad: Date.now(), kropp: "kanin", formel: "en kanin", beskrivning: "en kanin", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [] }],
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
      await provaPlats(page, id, lage, viewport.width > viewport.height);
      logg(`${namn}: grönt`);
    } catch (e) {
      await bild(page, `${namn}-fel`).catch(() => {});
      throw e;
    } finally {
      await context.close();
    }
  }
  assert.deepEqual(sidfel, [], "inga JavaScript-fel i de provade flödena");
  logg(`PLATSFÖRHAND GRÖNT: ${platser.join(", ")} i ${lagen.map(([n]) => n).join(" och ")}. Syntetiska profiler, minskad rörelse.`);
} catch (e) {
  console.error("PLATSFÖRHAND RÖTT:", e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
