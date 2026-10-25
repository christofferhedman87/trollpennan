#!/usr/bin/env node
// Snabbprov (<2 s med --snabb) och 375x812 Playwright-skärmprov för P4a, P4b och P4c.
// Användning:
//   node rundor/P4-lasning-och-karta/matt/prov-p4.mjs --snabb --del 1|2|3|alla
//   node rundor/P4-lasning-och-karta/matt/prov-p4.mjs --del 1|2|3|alla [--ut dir]
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const snabb = args.includes("--snabb");
const delIdx = args.indexOf("--del");
const del = delIdx >= 0 ? String(args[delIdx + 1] ?? "alla") : "alla";
const utIdx = args.indexOf("--ut");
const utMapp = utIdx >= 0 && args[utIdx + 1] ? args[utIdx + 1] : "rundor/P4-lasning-och-karta/matt/bilder";

const facit = JSON.parse(fs.readFileSync("rundor/P4-lasning-och-karta/facit-p4.json", "utf8"));

function lasJson(fil) {
  if (!fs.existsSync(fil)) return null;
  return JSON.parse(fs.readFileSync(fil, "utf8"));
}

async function korSnabb() {
  const fel = [];
  const detalj = {};

  // Gemensam vakt: inga befintliga provfiler får ha ändrats mot baslinjen, inga .patch-filer.
  const patchFiler = execSync("git status --porcelain", { encoding: "utf8" })
    .split("\n")
    .filter((r) => r.trim().endsWith(".patch"));
  if (patchFiler.length > 0) fel.push(`Hittade .patch-filer: ${patchFiler.join(", ")}`);

  // Del 1: P4a – Uppläsning på tryck + separata ljudreglage (rostPa / effektPa), 0 ny TTS
  if (del === "1" || del === "alla") {
    const lasning = lasJson("data/lasning.json");
    if (!lasning || !lasning.lyssna || !lasning.ljud) {
      fel.push("P4a: data/lasning.json saknas eller saknar fälten lyssna / ljud");
    }
    const rostTakt = lasJson("data/rost-takt.json");
    if (rostTakt && rostTakt.kallor?.las_upp !== "svar") {
      fel.push("P4a: data/rost-takt.json saknar kallor.las_upp === 'svar'");
    }
    const minneKod = fs.existsSync("src/spel/minne.ts") ? fs.readFileSync("src/spel/minne.ts", "utf8") : "";
    for (const nyckel of [...facit.p4a.ljud_reglage.falt, ...facit.p4a.ljud_reglage.metoder]) {
      if (!minneKod.includes(nyckel)) fel.push(`P4a: src/spel/minne.ts saknar ${nyckel}`);
    }
    const uiKod = [
      "src/spel/ui/Ledtradsyta.tsx",
      "src/spel/ui/UppdragsRemsa.tsx",
      "src/spel/ui/BokSvar.tsx",
      "src/spel/ui/ForalderDialog.tsx",
    ]
      .filter((f) => fs.existsSync(f))
      .map((f) => fs.readFileSync(f, "utf8"))
      .join("\n");
    for (const attr of facit.p4a.lyssna_attribut) {
      if (!uiKod.includes(`data-p4="${attr}"`)) {
        fel.push(`P4a: saknar data-p4="${attr}" i UI-komponenterna`);
      }
    }
    detalj.p4a = { lasningFinns: !!lasning };
  }

  // Del 2: P4b – Läsnivåer (1-3 + auto), ledtrådstrappa i 3 steg och stavningsåterkoppling
  if (del === "2" || del === "alla") {
    if (!fs.existsSync("src/spel/lasniva.ts")) {
      fel.push("P4b: src/spel/lasniva.ts saknas");
    } else {
      const mod = await import(path.resolve("src/spel/lasniva.ts"));
      for (const fn of ["ordLasniva", "aktuellLasniva", "lasnivaUrval", "ledtradsSteg", "stavningsFeedback", "delaStavelser"]) {
        if (typeof mod[fn] !== "function") fel.push(`P4b: src/spel/lasniva.ts saknar funktionen ${fn}`);
      }
      if (typeof mod.ordLasniva === "function") {
        for (const [nivaStr, ordLista] of Object.entries(facit.p4b.lasniva_exempel)) {
          const forv = Number(nivaStr);
          for (const o of ordLista) {
            const fick = mod.ordLasniva(o);
            if (fick !== forv) fel.push(`P4b: ordLasniva('${o}') gav ${fick}, väntade ${forv}`);
          }
        }
      }
      if (typeof mod.aktuellLasniva === "function") {
        for (const s of facit.p4b.auto_steg) {
          const funna = Array.from({ length: s.funna_antal }, (_, i) => `d${i}`);
          const fick = mod.aktuellLasniva(funna, "auto");
          if (fick !== s.forvantad_niva) {
            fel.push(`P4b: aktuellLasniva(${s.funna_antal} funna, 'auto') gav ${fick}, väntade ${s.forvantad_niva}`);
          }
        }
      }
      if (typeof mod.ledtradsSteg === "function") {
        const s0 = mod.ledtradsSteg("kattunge", 0);
        const s1 = mod.ledtradsSteg("kattunge", 1);
        const s2 = mod.ledtradsSteg("kattunge", 2);
        if (!s0 || !s1 || !s2) {
          fel.push("P4b: ledtradsSteg('kattunge', 0..2) returnerade null");
        } else {
          if (!s0.streck.includes("_") || !s1.streck.includes("_") || !s2.streck.includes("_")) {
            fel.push("P4b: ledtradsSteg får aldrig avslöja hela ordet utan '_'");
          }
          if (!s1.extraText || !s2.ljudText) {
            fel.push("P4b: ledtradsSteg steg 1/2 saknar extraText eller ljudText");
          }
        }
      }
      if (typeof mod.stavningsFeedback === "function") {
        for (const ex of facit.p4b.stavning_exempel) {
          const fb = mod.stavningsFeedback(ex.skrivet, ex.mal);
          if (!fb || !fb.nara || !fb.tips) {
            fel.push(`P4b: stavningsFeedback('${ex.skrivet}', '${ex.mal}') gav ingen återkoppling`);
          } else if (fb.rattPrefix !== ex.ratt_prefix) {
            fel.push(`P4b: stavningsFeedback('${ex.skrivet}', '${ex.mal}').rattPrefix gav '${fb.rattPrefix}', väntade '${ex.ratt_prefix}'`);
          }
        }
      }
    }
  }

  // Del 3: P4c – Olåst karta och meny (alla platser och verktyg öppna direkt)
  if (del === "3" || del === "alla") {
    const platserJson = lasJson("data/platser.json");
    if (!platserJson || platserJson.olast_karta !== true) {
      fel.push("P4c: data/platser.json saknar \"olast_karta\": true");
    }
    const menyJson = lasJson("data/meny.json");
    if (!menyJson || !menyJson.oppen || !menyJson.oppen.gard || !menyJson.oppen.byggbok || !menyJson.oppen.album || !menyJson.oppen.ordbok) {
      fel.push("P4c: data/meny.json saknas eller har inte oppen.{gard,byggbok,album,ordbok} === true");
    }
    const platserMod = await import(path.resolve("src/spel/platser.ts"));
    const minneMod = await import(path.resolve("src/spel/minne.ts"));
    if (typeof platserMod.kanResaTill !== "function") {
      fel.push("P4c: src/spel/platser.ts saknar kanResaTill(id, m, platser)");
    } else {
      minneMod.useMinne.getState().aterstall();
      const m = platserMod.mattUr(minneMod.useMinne.getState());
      for (const pid of facit.p4c.platser_oppna_direkt) {
        if (!platserMod.kanResaTill(pid, m)) {
          fel.push(`P4c: kanResaTill('${pid}', tomMatt) gav false (ska vara true när olast_karta är true)`);
        }
      }
      // Kontrollera att upplast('skogen', m) och bytPlats('skogen') på tom sparning fortfarande beter sig som platser.test.ts och resa.test.ts kräver!
      if (platserMod.upplast("skogen", m) !== false) {
        fel.push("P4c: upplast('skogen', tomMatt) ändrades till true – bryter platser.test.ts och resa.test.ts!");
      }
      if (minneMod.useMinne.getState().bytPlats("skogen") !== false) {
        fel.push("P4c: bytPlats('skogen') på tom sparning gav true – bryter resa.test.ts!");
      }
      if (typeof minneMod.useMinne.getState().oppnaPlats !== "function") {
        fel.push("P4c: useMinne saknar oppnaPlats(id)");
      } else {
        const ok = minneMod.useMinne.getState().oppnaPlats("skogen");
        if (!ok || minneMod.useMinne.getState().plats !== "skogen") {
          fel.push("P4c: useMinne.getState().oppnaPlats('skogen') bytte inte till skogen");
        }
        minneMod.useMinne.getState().aterstall();
      }
    }
  }

  const ut = {
    ok: fel.length === 0,
    lage: "snabb",
    del,
    antalFel: fel.length,
    fel,
    detalj,
  };
  console.log(JSON.stringify(ut, null, 2));
  process.exit(fel.length === 0 ? 0 : 1);
}

async function korSkarm() {
  const { chromium } = await import("playwright");
  fs.mkdirSync(utMapp, { recursive: true });
  const url = process.env.PREVIEW_URL || "http://localhost:4173/trollpennan/";
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const sidfel = [];
  page.on("pageerror", (e) => sidfel.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") sidfel.push(m.text());
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("trollpennan-spel", JSON.stringify({ introSedd: true }));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid=pennans-bok]", { timeout: 10000 });

  const fel = [];
  const kontroller = {};

  if (del === "1" || del === "alla") {
    await page.click("[data-testid=pennans-bok]");
    await page.waitForSelector("[data-testid=bok-flik-gator]", { timeout: 5000 });
    await page.click("[data-testid=bok-flik-gator]");
    const lyssnaGata = await page.locator('[data-p4="lyssna-gata"]').boundingBox();
    kontroller.lyssnaGata = lyssnaGata;
    if (!lyssnaGata || lyssnaGata.height < 40) {
      fel.push(`P4a: [data-p4="lyssna-gata"] saknas eller är för liten (${JSON.stringify(lyssnaGata)})`);
    } else {
      await page.click('[data-p4="lyssna-gata"]');
    }
    await page.screenshot({ path: path.join(utMapp, "p4a-lyssna-gata.png") });
    await page.click("[data-testid=bok-stang]");
  }

  if (del === "2" || del === "alla") {
    await page.click("[data-testid=pennans-bok]");
    await page.click("[data-testid=bok-flik-gator]");
    const ledKnapp = page.locator('[data-p4="ledtrad-knapp"]');
    if ((await ledKnapp.count()) === 0) {
      fel.push('P4b: [data-p4="ledtrad-knapp"] saknas i Gåtboken');
    } else {
      await ledKnapp.click();
      await page.waitForTimeout(150);
      await page.screenshot({ path: path.join(utMapp, "p4b-ledtrad-steg1.png") });
      await ledKnapp.click();
      await page.waitForTimeout(150);
      await page.screenshot({ path: path.join(utMapp, "p4b-ledtrad-steg2.png") });
    }
    await page.click("[data-testid=bok-flik-skriv]");
    await page.fill("[data-testid=ord-input]", "kat");
    await page.click("[data-testid=vack-knapp]");
    await page.waitForTimeout(200);
    const tipsSynlig = (await page.locator('[data-p4="stavning-tips"]').count()) > 0;
    kontroller.stavningTipsSynlig = tipsSynlig;
    if (!tipsSynlig) fel.push('P4b: [data-p4="stavning-tips"] visades inte för "kat"');
    await page.screenshot({ path: path.join(utMapp, "p4b-stavning-tips.png") });
    await page.click("[data-testid=bok-stang]");
  }

  if (del === "3" || del === "alla") {
    // Kontrollera att menyn har alla knappar upplåsta (ingen data-last="ja")
    await page.click("[data-testid=meny]");
    await page.waitForSelector("[data-testid=meny-panel]", { timeout: 5000 });
    const lastaIMeny = await page.locator('[data-testid=meny-panel] [data-last="ja"]').count();
    kontroller.lastaIMeny = lastaIMeny;
    if (lastaIMeny > 0) fel.push(`P4c: menyn har fortfarande ${lastaIMeny} låsta knappar med data-last="ja"`);
    await page.screenshot({ path: path.join(utMapp, "p4c-meny-oppen.png") });

    // Öppna kartan och kontrollera att alla platser är öppna direkt
    await page.click("[data-testid=ut-pa-aventyr]");
    await page.waitForSelector("[data-testid=karta]", { timeout: 5000 });
    const lastaPaKarta = await page.locator("[data-testid=karta] .plats-knapp.last").count();
    kontroller.lastaPaKarta = lastaPaKarta;
    if (lastaPaKarta > 0) fel.push(`P4c: kartan har fortfarande ${lastaPaKarta} låsta platser (.plats-knapp.last)`);
    await page.screenshot({ path: path.join(utMapp, "p4c-karta-oppen.png") });

    // Res direkt till Grottan trots 0 skapade djur
    await page.click("[data-testid=plats-grottan]");
    await page.waitForTimeout(700);
    const platsNu = await page.evaluate(() => window.__troll?.tillstand?.()?.plats);
    kontroller.platsEfterGrottan = platsNu;
    if (platsNu !== "grottan") fel.push(`P4c: klick på plats-grottan gav plats '${platsNu}', väntade 'grottan'`);
    await page.screenshot({ path: path.join(utMapp, "p4c-grottan.png") });
  }

  await browser.close();
  if (sidfel.length > 0) fel.push(`Sidfel: ${sidfel.join(" | ")}`);

  const rapport = {
    ok: fel.length === 0,
    lage: "skarm",
    del,
    sidfel: sidfel.length,
    antalFel: fel.length,
    fel,
    kontroller,
  };
  const rapportFil = path.join("rundor/P4-lasning-och-karta/matt", `rapport-p4-${del}.json`);
  fs.writeFileSync(rapportFil, JSON.stringify(rapport, null, 2) + "\n");
  console.log(JSON.stringify(rapport, null, 2));
  process.exit(fel.length === 0 ? 0 : 1);
}

if (snabb) {
  await korSnabb();
} else {
  await korSkarm();
}
