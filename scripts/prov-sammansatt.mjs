#!/usr/bin/env node
// T08: riktiga tangenter/Trolla, rätt antal huvuden och tillbehör, full formel samt omladdning.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
const adress = process.argv[2] || "http://127.0.0.1:4186/";
const bilder = process.env.QA_SCREENSHOTS;
if (bilder) await mkdir(bilder, { recursive: true });
const fraser = [
  { text: "en fisk", relation: "kropp", id: "", antal: 0, extra: true },
  { text: "en gris", relation: "kropp", id: "", antal: 0, extra: true },
  { text: "en dinosaurie", relation: "kropp", id: "", antal: 0, extra: true },
  { text: "en haj", relation: "kropp", id: "", antal: 0, extra: true },
  { text: "en katt under ett bord", relation: "under", id: "bord", antal: 1 },
  { text: "en katt på en sten", relation: "på", id: "sten", antal: 1 },
  { text: "en katt i en låda", relation: "i", id: "kartong", antal: 1 },
  { text: "en katt bredvid en cykel", relation: "bredvid", id: "cykel", antal: 1, vand: true },
  { text: "en katt bredvid en boll", relation: "bredvid", id: "boll", antal: 1 },
  { text: "en katt med två röda äpplen", relation: "med", id: "apple", antal: 2 },
  { text: "en kanin med en filt", relation: "plagg", id: "filt", antal: 1 },
  { text: "en kanin med två strumpor", relation: "plagg", id: "strumpa", antal: 2 },
  { text: "en katt med tio hattar", relation: "plagg", id: "hatt", antal: 10 },
  { text: "en katt i en hatt", relation: "i", id: "hatt", antal: 1 },
  { text: "en katt under två bord", relation: "under", id: "bord", antal: 2 },
];
function geometri(g, p) {
  assert.ok(g, "faktisk renderad geometri finns");
  assert.equal(g.formel, p.text, "geometrin gäller den aktuella formeln");
  assert.ok(g.kropp.modeller.includes(g.kroppId), "huvudets riktiga GLB är laddad");
  const saker = (p.relation === "plagg" ? g.plagg : g.saker).filter((s) => s.id === p.id);
  assert.equal(saker.length, p.antal, "varje skrivet exemplar har en verklig modell");
  assert.ok(g.kropp.mesh > 0 && saker.every((s) => s.mesh > 0));
  if (p.relation === "kropp") return;
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
  if (p.vand) assert.ok(o.max[0] - o.min[0] > o.max[2] - o.min[2], "cykelns framaxel stämmer med placeringsmåtten");
  if (p.relation === "plagg" && p.antal > 1) assert.ok(saker[0].lokal.min.reduce((s, x, i) => s + Math.abs(x - saker[1].lokal.min[i]), 0) > 0.03, "flera plagg har skilda fästpunkter");
}
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/bin/chromium", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
let provSida = null, provText = "";
try {
  for (const viewport of [{ width: 375, height: 812 }, { width: 812, height: 375 }].filter((v) => !process.env.QA_LAGE || String(v.width) === process.env.QA_LAGE)) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage(); provSida = page; page.setDefaultTimeout(60000);
    const fel = [], konsolfel = [], modellfel = [];
    await page.exposeFunction("__qaModellFel", (id) => { modellfel.push(id); });
    page.on("pageerror", (e) => fel.push(e.message)); page.on("console", (m) => { if (m.type() === "error") konsolfel.push(m.text()); });
    await page.addInitScript(() => {
      window.addEventListener("trollpennan:model-fallback", (e) => { void window.__qaModellFel(e.detail?.kropp); });
      if (sessionStorage.getItem("c1c-prov")) return;
      sessionStorage.setItem("c1c-prov", "1");
      localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, startLage: "skriv", startLageVald: true,
        ang: [{ uid: "c1c-prov", skapad: 1, kropp: "kanin", formel: "en kanin", beskrivning: "en kanin", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [] }],
        garden: [], stjarnor: 17, egnaDjur: 5, dragit: true, ljudPa: false, rostPa: false, effektPa: false, onskaVid: Date.now() + 3600000, uppdrag: {} }));
      localStorage.setItem("trollpennan-skapa-v1", '{"bokstavsljud":false}');
    });
    await page.goto(adress, { timeout: 120000 }); await page.waitForFunction(() => !!window.__trollMinne);
    const alla = () => page.evaluate(() => { const s = window.__trollMinne.getState(); return [...s.ang, ...s.sovande, ...s.hemma.map((h) => h.spec), ...Object.values(s.platsSkapelser).flat(), ...s.garden]; });
    const ritadeLagen = () => page.evaluate(() => {
      const r = {};
      window.__tredScen.scene.traverse((o) => { const uid = o.userData.trollDel; if (typeof uid === "string" && !r[uid]) r[uid] = { position:o.position.toArray(), synlig:o.visible }; });
      return r;
    });
    const skapade = [];
    const valda = fraser.filter((p) => process.env.QA_FALL ? process.env.QA_FALL.split("|").includes(p.text) : !p.extra);
    assert.ok(valda.length > 0, "QA_FALL måste välja minst ett faktiskt provfall");
    for (const p of valda) {
      provText = p.text;
      const varldFore = JSON.parse(JSON.stringify(await alla()));
      await page.waitForFunction(() => !!window.__tredScen);
      const ritadeFore = skapade.length === 0 ? await ritadeLagen() : null;
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
        await page.waitForFunction(({ id, antal, relation, text }) => { const g = window.__holoGeometri; return g && g.uid === "forhand" && g.formel === text && g.kropp.modeller.includes(g.kroppId) && g.kropp.mesh > 0 && (relation === "plagg" ? g.plagg : g.saker).filter((s) => s.id === id && s.mesh > 0).length === antal; }, p);
        if (process.env.QA_MATT) console.log("MODELLMÅTT", JSON.stringify(await page.evaluate(() => window.__holoGeometri)));
        await page.waitForFunction(() => !document.querySelector(".sk-ark")?.classList.contains("sk-ark--trollar"));
        await page.evaluate(() => { window.__qaHoloVanta = { senaste: null, antal: 0 }; });
        await page.waitForFunction(({ text, relation }) => {
          const g = window.__holoGeometri, v = window.__qaHoloVanta;
          if (!g || g.formel !== text || !window.__trollholo?.nyckel?.endsWith(text) || v.senaste === g) return v.antal >= 2;
          v.senaste = g;
          const a = document.querySelector(".sk-ark").getBoundingClientRect(), liggande = innerWidth > innerHeight;
          const r = [g.kropp, ...g.saker, ...g.plagg].map((x) => x.skarm);
          const w = Math.max(...r.map((x) => x.x1)) - Math.min(...r.map((x) => x.x0)), h = Math.max(...r.map((x) => x.y1)) - Math.min(...r.map((x) => x.y0));
          const hinder = [...document.querySelectorAll(".sk-penn-ora, .sk-stang, .sk-gata")].map((e) => e.getBoundingClientRect());
          const storlek = relation === "kropp" ? h >= 20 && w >= 12 : Math.max(w, h) >= 64;
          const hel = r.every((x) => x.x0 >= 0 && x.x1 <= (liggande ? a.left : innerWidth) && x.y0 >= 90 && x.y1 <= (liggande ? innerHeight : a.top) && hinder.every((o) => Math.max(0, Math.min(x.x1,o.right)-Math.max(x.x0,o.left))*Math.max(0,Math.min(x.y1,o.bottom)-Math.max(x.y0,o.top)) <= 1));
          v.antal = storlek && hel ? v.antal + 1 : 0;
          return v.antal >= 2;
        }, p);
        if (bilder) await page.screenshot({ path: `${bilder}/holo-${viewport.width}-${skapade.length}.png` });
        const holo = await page.evaluate(() => window.__holoGeometri);
        if (process.env.QA_MATT) console.log("Holo-ruta", await page.evaluate(() => ({ holo:window.__trollholo, ring:window.__trollring, vy:window.__trollvy, rutor:Object.fromEntries(["canvas", ".sk-ark", ".sk-penn-ora", ".sk-stang", ".sk-gata"].map((s)=>[s, document.querySelector(s)?.getBoundingClientRect().toJSON()])) })));
        geometri(holo, p);
        const synlighet = await page.evaluate(() => {
          let kropp = null;
          window.__tredScen.scene.traverse((o) => {
            if (!o.userData.holo) return;
            for (let q = o; q; q = q.parent) if (q.userData.gltfKropp === window.__holoGeometri.kroppId) { kropp = q; break; }
          });
          if (!kropp) throw new Error("Hologrammets verkliga kropp saknas i scenen");
          const fore = kropp.userData.trollUid;
          kropp.userData.trollUid = "prov:holo-kropp";
          const hud = [...document.querySelectorAll(".sk-ark, .sk-penn-ora, .sk-stang, .sk-gata")].map((e) => {
            const r = e.getBoundingClientRect(); return { x:r.x, y:r.y, w:r.width, h:r.height };
          });
          try { return window.__idPass(hud)["prov:holo-kropp"]; }
          finally { if (fore === undefined) delete kropp.userData.trollUid; else kropp.userData.trollUid = fore; }
        });
        console.log("Kroppens synliga pixlar", viewport.width, p.text, JSON.stringify(synlighet));
        assert.ok(synlighet?.sil > 0, "huvuddjuret har en egen verklig siluett");
        assert.ok(synlighet.syn / synlighet.sil >= 0.7, "minst 70 % av det nya djuret syns enligt P3a");
        assert.ok(synlighet.silHuvud > 0 && Math.round(100 * synlighet.synHuvud / synlighet.silHuvud) >= 90, "minst 90 % av huvudet syns enligt P3a");
        const rutor = [holo.kropp, ...holo.saker, ...holo.plagg].map((x) => x.skarm);
        assert.ok(Math.max(Math.max(...rutor.map((r) => r.x1)) - Math.min(...rutor.map((r) => r.x0)), Math.max(...rutor.map((r) => r.y1)) - Math.min(...rutor.map((r) => r.y0))) >= (p.relation === "kropp" ? 20 : 64), "förhandsvisningen går att urskilja");
        const ark = await page.locator(".sk-ark").boundingBox();
        const hinder = await page.locator(".sk-penn-ora, .sk-stang, .sk-gata").evaluateAll((list) => list.map((e) => e.getBoundingClientRect().toJSON()));
        for (const ruta of rutor) {
          assert.ok(ruta.x0 >= 0 && ruta.x1 <= (viewport.width > viewport.height ? ark.x : viewport.width), "hela hologrammet ryms framför boken i sidled");
          assert.ok(ruta.y0 >= 90 && ruta.y1 <= (viewport.width > viewport.height ? viewport.height : ark.y), "hela hologrammet ryms mellan HUD och bokkant");
          for (const h of hinder) assert.ok(Math.max(0, Math.min(ruta.x1, h.right) - Math.max(ruta.x0, h.left)) * Math.max(0, Math.min(ruta.y1, h.bottom) - Math.max(ruta.y0, h.top)) <= 1, "hologrammet undviker verkliga kontrollrutor");
        }
      }
      assert.deepEqual(JSON.parse(JSON.stringify(await alla())), varldFore, "förhandsvisningen ändrar inget sparat djur eller bygge");
      if (skapade.length === 0 && process.env.QA_HOLO !== "0") {
        assert.ok(Object.keys(ritadeFore).length > 0, "en äldre skapelse ritas före provet");
        await page.getByTestId("stang-bok").click(); await page.getByTestId("bok-skarm").waitFor({ state:"hidden" });
        await page.waitForFunction(() => !window.__trollvy?.oppen && !window.__trollholo);
        assert.deepEqual(await ritadeLagen(), ritadeFore, "avbruten förhandsvisning återställer äldre djurs verkliga ritläge");
        assert.deepEqual(JSON.parse(JSON.stringify(await alla())), varldFore, "avbryt lämnar hela sparvärlden orörd");
        await page.getByTestId("pennans-bok").click(); await page.getByTestId("tangentbord").waitFor();
        assert.equal(await page.getByTestId("ord-input").inputValue(), p.text, "barnets text finns kvar efter avbryt");
        await page.waitForFunction((text) => window.__trollholo?.nyckel?.endsWith(text), p.text);
        console.log("Grönt avbryt utan sparmutation", viewport.width);
      }
      await page.getByTestId("vakna").click(); await page.getByTestId("bok-skarm").waitFor({ state: "hidden" });
      const nya = (await alla()).filter((d) => !fore.has(d.uid));
      assert.equal(nya.length, 1);
      const d = nya[0]; assert.equal(d.formel, p.text);
      skapade.push(JSON.parse(JSON.stringify(d)));
      await page.waitForFunction(({ uid, id, antal, relation, text }) => { const g = window.__skapelseGeometri?.[uid]; return g && g.uid === uid && g.formel === text && g.kropp.modeller.includes(g.kroppId) && g.kropp.mesh > 0 && (relation === "plagg" ? g.plagg : g.saker).filter((s) => s.id === id && s.mesh > 0).length === antal; }, { ...p, uid: d.uid });
      geometri(await page.evaluate((uid) => window.__skapelseGeometri[uid], d.uid), p);
      // Låt vanligt kvitto löpa ut. Inget klick tvingas mot en redan utgången replik.
      await page.locator('[data-dal="kvitto"]').waitFor({ state: "hidden", timeout: 15000 });
      if (bilder) await page.screenshot({ path: `${bilder}/${viewport.width}-${p.bygg ? "tak" : skapade.length}.png` });
      console.log("Grönt antal/formel", viewport.width, p.text, nya.length);
    }
    await page.reload(); await page.getByTestId("pennans-bok").waitFor();
    const efter = JSON.parse(JSON.stringify(await alla()));
    for (const d of skapade) assert.deepEqual(efter.find((x) => x.uid === d.uid), d, "hela skapelsen med antal/ord/egenskaper sparas");
    assert.deepEqual(fel, []); assert.deepEqual(konsolfel, []); assert.deepEqual(modellfel, [], "ingen modell får ha ersatts efter laddfel");
    console.log("Grönt antal/formel efter omladdning", viewport.width, skapade.length);
    await context.close();
  }
} catch (e) {
  if (provSida && !provSida.isClosed()) {
    console.error("Aktuellt delprov", provText, await provSida.evaluate(() => {
      const g = window.__holoGeometri;
      return { holo:window.__trollholo, vy:window.__trollvy, geometri:g && { uid:g.uid, formel:g.formel, kroppId:g.kroppId, kropp:{mesh:g.kropp.mesh,modeller:g.kropp.modeller,skarm:g.kropp.skarm}, plagg:g.plagg.map((p)=>({id:p.id,mesh:p.mesh,skarm:p.skarm})), saker:g.saker.map((p)=>({id:p.id,mesh:p.mesh,skarm:p.skarm})) } };
    }).catch(() => "diagnostik saknas"));
    if (bilder) await provSida.screenshot({path:`${bilder}/fel-${provSida.viewportSize().width}.png`}).catch(() => {});
  }
  throw e;
} finally { await browser.close(); }
