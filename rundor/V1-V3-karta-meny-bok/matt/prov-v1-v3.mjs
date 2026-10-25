#!/usr/bin/env node
// Prov för V1, V2 och V3 (Blockserie V):
//   node rundor/V1-V3-karta-meny-bok/matt/prov-v1-v3.mjs --snabb --del 1|2|3|alla
//   node rundor/V1-V3-karta-meny-bok/matt/prov-v1-v3.mjs --del 1|2|3|alla [--url http://127.0.0.1:4183] [--ut /tmp/v1-v3-bilder]

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const snabb = args.includes("--snabb");
const delIdx = args.indexOf("--del");
const del = delIdx >= 0 ? args[delIdx + 1] : "alla";
const urlIdx = args.indexOf("--url");
const argUrl = urlIdx >= 0 ? args[urlIdx + 1] : null;
const utIdx = args.indexOf("--ut");
const utMapp = utIdx >= 0 ? args[utIdx + 1] : "/tmp/v1-v3-bilder";

const rot = process.cwd();
const facit = JSON.parse(
  fs.readFileSync(path.join(rot, "rundor/V1-V3-karta-meny-bok/facit-v1-v3.json"), "utf8"),
);

function lasJson(rel) {
  const p = path.join(rot, rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function lasText(rel) {
  const p = path.join(rot, rel);
  if (!fs.existsSync(p)) return "";
  return fs.readFileSync(p, "utf8");
}

function rader(rel) {
  const t = lasText(rel);
  return t ? t.split("\n").length : 0;
}

function korSnabb() {
  const fel = [];
  const detalj = {};

  // Gemensam kontroll: Spel.tsx och filstorlekar <= 400
  const spelRader = rader("src/spel/Spel.tsx");
  detalj.spelRader = spelRader;
  if (spelRader > 400) fel.push(`Spel.tsx är ${spelRader} rader (> 400)`);

  for (const f of [
    "src/spel/ui/KartaLager.tsx",
    "src/spel/ui/SpelVy.tsx",
    "src/spel/styr/useVarld.ts",
    "src/spel/ui/Hud.tsx",
    "src/spel/ui/Coach.tsx",
    "src/spel/ui/ForalderDialog.tsx",
    "src/spel/ui/BokSkarm.tsx",
    "src/spel/ui/Ledtradsyta.tsx",
    "src/spel/styr/useSkriv.ts",
  ]) {
    const n = rader(f);
    if (n > 400) fel.push(`${f} är ${n} rader (> 400)`);
  }

  // Del 1: V1 – Visuell & pedagogisk Världskarta
  if (del === "1" || del === "alla") {
    const platser = lasJson("data/platser.json");
    const omraden = lasJson("data/omraden.json");
    const manifest = lasJson("data/rost-manifest.json");
    const manifestTexter = new Set(
      Object.values(manifest?.rader ?? {}).map((r) => r.t),
    );
    const vk = platser?.varldskarta;
    if (!Array.isArray(vk) || vk.length !== 5) {
      fel.push("V1: data/platser.json saknar varldskarta med 5 platser (ang, garden, skogen, sjon, grottan)");
    } else {
      const ids = vk.map((p) => p.id);
      for (const kravId of facit.v1.platser) {
        if (!ids.includes(kravId)) fel.push(`V1: varldskarta saknar plats '${kravId}'`);
      }
      for (const p of vk) {
        if (!p.namn || !p.ikon || !p.tema || !p.lockelse) {
          fel.push(`V1: plats '${p.id}' i varldskarta saknar namn/ikon/tema/lockelse`);
        }
        if (!Array.isArray(p.ordbrickor) || p.ordbrickor.length < facit.v1.ordbrickor_per_plats) {
          fel.push(`V1: plats '${p.id}' i varldskarta har färre än 3 ordbrickor`);
        }
        if (!p.rost_text || !manifestTexter.has(p.rost_text)) {
          fel.push(`V1: plats '${p.id}' har rost_text som saknas i data/rost-manifest.json (0 ny TTS tillåten)`);
        }
      }
    }

    const kartaHjalp = omraden?.karta?.hjalp ?? "";
    for (const forbjuden of facit.v1.forbjudna_fraser) {
      if (kartaHjalp.includes(forbjuden)) {
        fel.push(`V1: data/omraden.json .karta.hjalp innehåller förbjuden låstext: '${forbjuden}'`);
      }
    }

    const useVarldTs = lasText("src/spel/styr/useVarld.ts");
    if (useVarldTs.includes("[...TEXTER_AV.forsta_gangen]")) {
      fel.push("V1: useVarld.ts skickar fortfarande hela TEXTER_AV.forsta_gangen (inkl. falsk låstext för Skogen/Sjön/Grottan)");
    }
    const kartaTsx = lasText("src/spel/ui/KartaLager.tsx");
    for (const ankare of [
      'data-v1="karta-stang"',
      'data-v1="karta-lyssna"',
      'data-v1="varldskarta-stig"',
      'data-v1="plats-ang"',
      'data-v1="plats-illustration"',
      'data-v1="har-ar-du"',
      'data-v1="plats-ordbricka"',
      'data-v1="plats-framsteg"',
      'data-v1="plats-lyssna"',
      'data-testid="karta"',
            'data-testid="plats-garden"',
      'data-testid="karta-text"',
      'data-testid="hem-knapp"',
      'data-testid="byt-folje"',
    ]) {
      if (!kartaTsx.includes(ankare)) {
        fel.push(`V1: KartaLager.tsx saknar '${ankare}'`);
      }
    }
  }

  // Del 2: V2 – Samlade menyer med bildikoner, konsekventa namn, aktivt uppdrag & trygg barnmeny
  if (del === "2" || del === "alla") {
    const forsta = lasJson("data/forsta-stunden.json");
    const steg1 = forsta?.steg?.find((s) => s.id === "forsta-ordet");
    const steg3 = forsta?.steg?.find((s) => s.id === "uppdraget");
    if (steg1?.visa_text !== facit.v2.skapa_djur_visa_text) {
      fel.push(`V2: data/forsta-stunden.json forsta-ordet.visa_text är '${steg1?.visa_text}' (förväntat '${facit.v2.skapa_djur_visa_text}')`);
    }
    if (steg3?.visa_text !== facit.v2.skriv_onskan_visa_text) {
      fel.push(`V2: data/forsta-stunden.json uppdraget.visa_text är '${steg3?.visa_text}' (förväntat '${facit.v2.skriv_onskan_visa_text}')`);
    }
    if (steg1?.text !== "Tryck på Pennans bok och skriv ett djur!") {
      fel.push("V2: data/forsta-stunden.json forsta-ordet.text får inte ändras (låst av rost2.test.ts)");
    }

    const coachTsx = lasText("src/spel/ui/Coach.tsx");
    if (!coachTsx.includes("visa_text")) {
      fel.push("V2: Coach.tsx använder inte visa_text");
    }

    const hudTsx = lasText("src/spel/ui/Hud.tsx");
    for (const krav of ['data-v2="meny-ikon"', 'data-v2="meny-ljud"', 'data-v2="skriv-knapp"']) {
      if (!hudTsx.includes(krav)) fel.push(`V2: Hud.tsx saknar '${krav}'`);
    }

    const foralderTsx = lasText("src/spel/ui/ForalderDialog.tsx");
    if (foralderTsx.includes(facit.v2.forbjuden_foralder_rubrik)) {
      fel.push(`V2: ForalderDialog.tsx innehåller fortfarande '${facit.v2.forbjuden_foralder_rubrik}'`);
    }
    for (const krav of ['data-v2="foralder-borja-om"', 'data-v2="foralder-borja-ja"', 'data-v2="foralder-borja-nej"']) {
      if (!foralderTsx.includes(krav)) fel.push(`V2: ForalderDialog.tsx saknar '${krav}'`);
    }

    const bokTsx = lasText("src/spel/ui/BokSkarm.tsx");
    for (const krav of ['data-v2="aktivt-uppdrag-kort"', 'data-v2="lyssna-aktivt-uppdrag"']) {
      if (!bokTsx.includes(krav)) fel.push(`V2: BokSkarm.tsx saknar '${krav}'`);
    }
  }

  // Del 3: V3 – Luftigt skrivfönster i halvhöjd med 3 flikar & synliga ordkort
  if (del === "3" || del === "alla") {
    const bokTsx = lasText("src/spel/ui/BokSkarm.tsx");
    for (const krav of [
      'data-v3="skapar-vy-flikar"',
      'data-v3="vy-flik-skriv"',
      'data-v3="vy-flik-gata"',
      'data-v3="vy-flik-ideer"',
    ]) {
      if (!bokTsx.includes(krav)) fel.push(`V3: BokSkarm.tsx saknar '${krav}'`);
    }
    const ledTsx = lasText("src/spel/ui/Ledtradsyta.tsx");
    if (!ledTsx.includes("kompakt")) {
      fel.push("V3: Ledtradsyta.tsx saknar stöd för kompakt läge i Skriv-vyn");
    }
    const bokCss = lasText("src/spel/ui/bok-p1.css");
    if (!bokCss.includes("white-space: normal") && !bokCss.includes("white-space:normal")) {
      fel.push("V3: bok-p1.css saknar white-space: normal för oavklippta idéknappar");
    }
  }

  const ok = fel.length === 0;
  console.log(JSON.stringify({ ok, läge: "snabb", del, antalFel: fel.length, fel, detalj }, null, 2));
  process.exit(ok ? 0 : 1);
}

if (snabb) {
  korSnabb();
}

async function vantaPaServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      // vänta
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Kunde inte nå ${url} inom ${timeoutMs} ms`);
}

async function korSkarm() {
  fs.mkdirSync(utMapp, { recursive: true });
  let proc = null;
  const port = 4187;
  const basUrl = argUrl ?? `http://127.0.0.1:${port}`;

  if (!argUrl) {
    proc = spawn("npx", ["vite", "--host", "127.0.0.1", "--port", String(port)], {
      cwd: rot,
      stdio: "ignore",
    });
    await vantaPaServer(basUrl);
  }

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const fel = [];
  const sidfel = [];
  const matt = {};

  try {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    await context.addInitScript(() => {
      try {
        const nu = localStorage.getItem("trollpennan:v2");
        if (!nu) {
          localStorage.setItem("trollpennan:v2", JSON.stringify({ introSett: true }));
        }
      } catch {
        // ignorera
      }
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => sidfel.push(String(e)));
    page.on("console", (msg) => {
      if (msg.type() === "error") sidfel.push(msg.text());
    });

    await page.goto(basUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // DEL 1: V1 – Världskarta
    if (del === "1" || del === "alla") {
      await page.click("[data-testid=meny-knapp]");
      await page.waitForTimeout(250);
      await page.click("[data-testid=ut-pa-aventyr]");
      await page.waitForTimeout(400);

      await page.screenshot({ path: path.join(utMapp, "v1-varldskarta-topp.png") });

      const v1Data = await page.evaluate((forbjudna) => {
        const karta = document.querySelector("[data-testid=karta]");
        if (!karta) return { finns: false };
        const text = karta.textContent || "";
        const harForbjuden = forbjudna.filter((f) => text.includes(f));
        const stang = document.querySelector('[data-v1="karta-stang"]')?.getBoundingClientRect();
        const lyssna = document.querySelector('[data-v1="karta-lyssna"]')?.getBoundingClientRect();
        const stig = Boolean(document.querySelector('[data-v1="varldskarta-stig"]'));
        const angKort = Boolean(document.querySelector('[data-v1="plats-ang"]'));
        const illustrationer = document.querySelectorAll('[data-v1="plats-illustration"]').length;
        const ordbrickor = document.querySelectorAll('[data-v1="plats-ordbricka"]').length;
        const harArDu = document.querySelector('[data-v1="har-ar-du"]')?.textContent?.trim() ?? null;
        return {
          finns: true,
          harForbjuden,
          stang: stang ? { w: Math.round(stang.width), h: Math.round(stang.height) } : null,
          lyssna: lyssna ? { w: Math.round(lyssna.width), h: Math.round(lyssna.height) } : null,
          stig,
          angKort,
          illustrationer,
          ordbrickor,
          harArDu,
        };
      }, facit.v1.forbjudna_fraser);

      matt.v1 = v1Data;
      if (!v1Data.finns) {
        fel.push("V1: [data-testid=karta] hittades inte");
      } else {
        if (v1Data.harForbjuden.length > 0) {
          fel.push(`V1: Kartan visar förbjuden låstext: ${v1Data.harForbjuden.join(", ")}`);
        }
        if (!v1Data.stang || v1Data.stang.w < 44 || v1Data.stang.h < 44) {
          fel.push(`V1: karta-stang (×) saknas eller är < 44×44 px (${JSON.stringify(v1Data.stang)})`);
        }
        if (!v1Data.lyssna || v1Data.lyssna.w < 44 || v1Data.lyssna.h < 44) {
          fel.push(`V1: karta-lyssna saknas eller är < 44×44 px (${JSON.stringify(v1Data.lyssna)})`);
        }
        if (!v1Data.stig) fel.push("V1: varldskarta-stig saknas");
        if (!v1Data.angKort) fel.push("V1: plats-ang saknas på Världskartan");
        if (v1Data.illustrationer < 5) {
          fel.push(`V1: Färre än 5 plats-illustration på kartan (${v1Data.illustrationer})`);
        }
        if (v1Data.ordbrickor < 15) {
          fel.push(`V1: Färre än 15 pedagogiska ordbrickor på kartan (${v1Data.ordbrickor})`);
        }
        if (!v1Data.harArDu) {
          fel.push("V1: 'Här är du nu'-markör (data-v1=har-ar-du) saknas");
        }
      }

      // Skrolla ner på kartan och ta bottenbild
      await page.evaluate(() => {
        const k = document.querySelector("[data-testid=karta]");
        if (k) k.scrollTop = k.scrollHeight;
      });
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(utMapp, "v1-varldskarta-botten.png") });

      // Res till Skogen från kartan
      if (await page.locator("[data-testid=plats-skogen]").count()) {
        await page.click("[data-testid=plats-skogen]");
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(utMapp, "v1-resa-skogen.png") });
        // Res tillbaka till Ängen via karta + testa stängknappen
        await page.click("[data-testid=meny-knapp]");
        await page.waitForTimeout(200);
        await page.click("[data-testid=ut-pa-aventyr]");
        await page.waitForTimeout(300);
        if (await page.locator('[data-v1="plats-ang"]').count()) {
          await page.click('[data-v1="plats-ang"]');
          await page.waitForTimeout(350);
        } else if (await page.locator('[data-v1="karta-stang"]').count()) {
          await page.click('[data-v1="karta-stang"]');
          await page.waitForTimeout(250);
        }
      }
    }

    // DEL 2: V2 – Samlade menyer med bildikoner, konsekventa namn, aktivt uppdrag & trygg barnmeny
    if (del === "2" || del === "alla") {
      await page.screenshot({ path: path.join(utMapp, "v2-coach-och-skriv.png") });

      const coachData = await page.evaluate(() => {
        const coach = document.querySelector("[data-testid=coach]")?.textContent?.trim() ?? "";
        const skrivKnapp = document.querySelector("[data-testid=pennans-bok]")?.textContent?.trim() ?? "";
        return { coach, skrivKnapp };
      });
      matt.v2Coach = coachData;
      if (coachData.coach && coachData.coach.includes("Pennans bok") && !coachData.coach.includes("Skriv")) {
        fel.push(`V2: Coach-bubblan hänvisar fortfarande bara till 'Pennans bok' utan 'Skriv': '${coachData.coach}'`);
      }

      // Öppna menyn och mät ikoner, ljudknapp och att meny-borja är dold
      await page.click("[data-testid=meny-knapp]");
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(utMapp, "v2-meny-ikoner.png") });

      const menyData = await page.evaluate(() => {
        const ikoner = document.querySelectorAll('[data-v2="meny-ikon"]').length;
        const ljudRect = document.querySelector('[data-v2="meny-ljud"]')?.getBoundingClientRect();
        const borjaEl = document.querySelector("[data-testid=meny-borja]");
        const borjaSynlig = borjaEl
          ? !borjaEl.hasAttribute("hidden") &&
            getComputedStyle(borjaEl).display !== "none" &&
            borjaEl.getBoundingClientRect().height > 0
          : false;
        return {
          ikoner,
          ljud: ljudRect ? { w: Math.round(ljudRect.width), h: Math.round(ljudRect.height) } : null,
          borjaSynlig,
        };
      });
      matt.v2Meny = menyData;
      if (menyData.ikoner < facit.v2.min_meny_ikoner) {
        fel.push(`V2: Menyn har färre än ${facit.v2.min_meny_ikoner} ikoner (${menyData.ikoner})`);
      }
      if (!menyData.ljud || menyData.ljud.w < 44 || menyData.ljud.h < 44) {
        fel.push(`V2: meny-ljud saknas eller är < 44×44 px (${JSON.stringify(menyData.ljud)})`);
      }
      if (menyData.borjaSynlig) {
        fel.push("V2: 'Börja om' (meny-borja) är fortfarande synlig i barnets vanliga meny!");
      }

      // Öppna Uppdrag från menyn och kontrollera aktivt-uppdrag-kort
      await page.click("[data-testid=uppdrag-knapp]");
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(utMapp, "v2-uppdragsbok-aktivt.png") });

      const uppdragData = await page.evaluate(() => {
        const kort = document.querySelector('[data-v2="aktivt-uppdrag-kort"]');
        const lyssna = document.querySelector('[data-v2="lyssna-aktivt-uppdrag"]')?.getBoundingClientRect();
        return {
          kortSynligt: Boolean(kort && kort.getBoundingClientRect().height > 20),
          kortText: kort?.textContent?.trim() ?? null,
          lyssna: lyssna ? { w: Math.round(lyssna.width), h: Math.round(lyssna.height) } : null,
        };
      });
      matt.v2Uppdrag = uppdragData;
      if (!uppdragData.kortSynligt) {
        fel.push("V2: aktivt-uppdrag-kort saknas eller är osynligt inne i Uppdragsboken");
      }
      if (!uppdragData.lyssna || uppdragData.lyssna.w < 44 || uppdragData.lyssna.h < 44) {
        fel.push(`V2: lyssna-aktivt-uppdrag saknas eller är < 44×44 px (${JSON.stringify(uppdragData.lyssna)})`);
      }

      // Stäng boken
      await page.click(".bok-topp .stang");
      await page.waitForTimeout(250);

      // Öppna För vuxna och kontrollera att (P1–P3) är borta och att foralder-borja-om finns
      await page.click("[data-testid=meny-knapp]");
      await page.waitForTimeout(250);
      await page.click("[data-testid=meny-foralder]");
      await page.waitForTimeout(300);
      await page.fill("[data-testid=foralder-svar]", "7");
      await page.click("[data-testid=foralder-oppna]");
      await page.waitForTimeout(300);

      if (await page.locator('[data-v2="foralder-borja-om"]').count()) {
        await page.click('[data-v2="foralder-borja-om"]');
        await page.waitForTimeout(200);
      }
      await page.screenshot({ path: path.join(utMapp, "v2-foralder-borja-om.png") });

      const foralderData = await page.evaluate(() => {
        const dialog = document.querySelector("[data-testid=foralder-dialog]");
        const rubrik = dialog?.querySelector("h2")?.textContent?.trim() ?? "";
        const borjaOm = document.querySelector('[data-v2="foralder-borja-om"]');
        const ja = document.querySelector('[data-v2="foralder-borja-ja"]');
        const nej = document.querySelector('[data-v2="foralder-borja-nej"]');
        return {
          rubrik,
          harBorjaOm: Boolean(borjaOm || ja),
          harJaNej: Boolean(ja && nej),
        };
      });
      matt.v2Foralder = foralderData;
      if (foralderData.rubrik.includes("(P1–P3)")) {
        fel.push(`V2: ForalderDialog-rubriken innehåller fortfarande '(P1–P3)': '${foralderData.rubrik}'`);
      }
      if (!foralderData.harBorjaOm || !foralderData.harJaNej) {
        fel.push("V2: ForalderDialog saknar tvåstegs 'Börja om' (foralder-borja-om + foralder-borja-ja/nej)");
      }

      if (await page.locator('[data-v2="foralder-borja-nej"]').count()) {
        await page.click('[data-v2="foralder-borja-nej"]');
        await page.waitForTimeout(150);
      }
      await page.click("[data-testid=foralder-stang]");
      await page.waitForTimeout(250);
    }

    // DEL 3: V3 – Luftigt skrivfönster i halvhöjd med 3 flikar, synliga ordkort & tömd skrivruta
    if (del === "3" || del === "alla") {
      await page.click("[data-testid=pennans-bok]");
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(utMapp, "v3-skriv-halvhojd-ordkort.png") });

      const v3SkrivData = await page.evaluate(() => {
        const bok = document.querySelector(".bok")?.getBoundingClientRect();
        const remsa = document.querySelector(".skriv-remsa")?.getBoundingClientRect();
        const flikar = Boolean(document.querySelector('[data-v3="skapar-vy-flikar"]'));
        const allaKort = [...document.querySelectorAll(".ord-kort")];
        const synligaKort = allaKort.filter((el) => {
          const r = el.getBoundingClientRect();
          const topGrans = bok ? bok.top : 0;
          const botGrans = remsa ? remsa.top + 8 : 812;
          return r.height >= 32 && r.top >= topGrans && r.bottom <= botGrans;
        });
        return {
          bokTop: bok ? Math.round(bok.top) : null,
          bokHeight: bok ? Math.round(bok.height) : null,
          remsaTop: remsa ? Math.round(remsa.top) : null,
          flikar,
          antalSynligaKort: synligaKort.length,
        };
      });
      matt.v3Skriv = v3SkrivData;

      if (!v3SkrivData.flikar) {
        fel.push("V3: [data-v3='skapar-vy-flikar'] saknas i skrivfönstret");
      }
      if (v3SkrivData.bokTop === null || v3SkrivData.bokTop < facit.v3.min_bok_top_px) {
        fel.push(
          `V3: Skrivfönstret (.bok) är inte i halvhöjd på 375×812: top=${v3SkrivData.bokTop} px (krav >= ${facit.v3.min_bok_top_px} px så att 3D-världen syns ovanför)`,
        );
      }
      if (v3SkrivData.antalSynligaKort < facit.v3.min_synliga_ordkort) {
        fel.push(
          `V3: Endast ${v3SkrivData.antalSynligaKort} ordkort (.ord-kort) är synliga direkt ovanför skrivrutan utan skrollning på 375×812 (krav >= ${facit.v3.min_synliga_ordkort})`,
        );
      }

      // Testa fliken Gåta
      if (await page.locator('[data-v3="vy-flik-gata"]').count()) {
        await page.click('[data-v3="vy-flik-gata"]');
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(utMapp, "v3-gata-flik.png") });
      }

      // Testa fliken Idéer och att exempelchips inte är avklippta med ellipsis
      if (await page.locator('[data-v3="vy-flik-ideer"]').count()) {
        await page.click('[data-v3="vy-flik-ideer"]');
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(utMapp, "v3-ideer-flik-hela.png") });

        const ideData = await page.evaluate(() => {
          const chips = [...document.querySelectorAll('[data-testid^="exempel-chip-"]')];
          const avklippta = chips.filter((el) => {
            const st = getComputedStyle(el);
            return st.textOverflow === "ellipsis" && el.scrollWidth > el.clientWidth + 2;
          });
          return { antalChips: chips.length, antalAvklippta: avklippta.length };
        });
        matt.v3Ideer = ideData;
        if (ideData.antalChips === 0) {
          fel.push("V3: Inga exempel-chip syntes under fliken Idéer");
        }
        if (ideData.antalAvklippta > 0) {
          fel.push(`V3: ${ideData.antalAvklippta} idéknappar är fortfarande avklippta med ellipsis (...)`);
        }

        // Klicka på första exempelchipet och väck, kontrollera sedan att skrivrutan är tömd
        if (await page.locator('[data-testid="exempel-chip-0"]').count()) {
          await page.click('[data-testid="exempel-chip-0"]');
          await page.waitForTimeout(200);
          await page.click('[data-testid="vack-knapp"]');
          await page.waitForTimeout(500);
          if (!(await page.locator(".bok").count())) {
            await page.click("[data-testid=pennans-bok]");
            await page.waitForTimeout(300);
          }
          const kvarText = await page.inputValue('[data-testid="ord-input"]');
          matt.v3KvarTextEfterVack = kvarText;
          if (kvarText.trim() !== "") {
            fel.push(`V3: Skrivrutan tömdes inte efter Väck!: '${kvarText}'`);
          }
        }
      }
    }
  } finally {
    await browser.close();
    if (proc) proc.kill("SIGTERM");
  }

  if (sidfel.length > 0) {
    fel.push(`Sid-/konsolfel: ${sidfel.join(" | ")}`);
  }

  const ok = fel.length === 0;
  console.log(
    JSON.stringify(
      { ok, läge: "skarm-375x812", del, sidfel: sidfel.length, antalFel: fel.length, fel, matt, utMapp },
      null,
      2,
    ),
  );
  process.exit(ok ? 0 : 1);
}

korSkarm();
