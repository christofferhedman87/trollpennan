#!/usr/bin/env node
/**
 * prov-m1-m3.mjs — Snabbprov (--snabb) och full Playwright-kontroll på 375×812 för Runda M1, M2 och M3.
 * Körning:
 *   node rundor/M1-M3-npf-ux-menyer/prov-m1-m3.mjs --snabb --del m1|m2|m3|alla
 *   node rundor/M1-M3-npf-ux-menyer/prov-m1-m3.mjs --del m1|m2|m3|alla [--ut /workspace/trollpennan-nulage/ko-26okt-m]
 */
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { chromium } from "playwright";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const SNABB = args.includes("--snabb");
const delIdx = args.indexOf("--del");
const DEL = (delIdx >= 0 ? args[delIdx + 1] || "alla" : "alla").toLowerCase();
const utIdx = args.indexOf("--ut");
const UT_MAPP = utIdx >= 0 ? args[utIdx + 1] : "/tmp/m1-m3-bilder";

const KOR_M1 = DEL === "alla" || DEL === "m1" || DEL === "1";
const KOR_M2 = DEL === "alla" || DEL === "m2" || DEL === "2";
const KOR_M3 = DEL === "alla" || DEL === "m3" || DEL === "3";

function lasText(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

function rader(rel) {
  const t = lasText(rel);
  return t ? t.split("\n").length - (t.endsWith("\n") ? 1 : 0) : 0;
}

function korSnabbKontroll() {
  const fel = [];
  const detalj = { m1: {}, m2: {}, m3: {} };

  // Filstorleksvakt <= 400 rader
  const kandidatFiler = [
    "src/spel/ui/Hud.tsx",
    "src/spel/ui/NpcFigur.tsx",
    "src/spel/ui/SpelVy.tsx",
    "src/spel/ui/BokSkarm.tsx",
    "src/spel/ui/UppdragVy.tsx",
    "src/spel/ui/StegKortValjare.tsx",
    "src/spel/angen3d.tsx",
    "src/spel/ideRad.ts",
    "src/spel/styr/mossaKanin.ts",
    "src/spel/styr/useSkapa.ts",
  ];
  for (const f of kandidatFiler) {
    if (fs.existsSync(path.join(ROOT, f))) {
      const n = rader(f);
      if (n > 400) fel.push(`${f} är ${n} rader (> 400)`);
    }
  }

  if (KOR_M1) {
    const npcFigur = lasText("src/spel/ui/NpcFigur.tsx");
    if (!npcFigur.includes('data-m1="hud-uppdrag"')) {
      fel.push('M1: src/spel/ui/NpcFigur.tsx saknar data-m1="hud-uppdrag" på NpcIkon');
    }
    if (!npcFigur.includes("Doktor Bengtsson")) {
      fel.push('M1: src/spel/ui/NpcFigur.tsx saknar överraden "Doktor Bengtsson" i NpcIkon');
    }
    for (const inv of [
      'data-v6="bengtsson-medaljong"',
      'data-testid="npc-figur"',
      "data-mine={mine}",
      'data-testid="inte-riktigt-an"',
      "Inte riktigt än",
    ]) {
      if (!npcFigur.includes(inv)) {
        fel.push(`M1: src/spel/ui/NpcFigur.tsx saknar v6-invarianten '${inv}'`);
      }
    }

    const hudTsx = lasText("src/spel/ui/Hud.tsx");
    if (!hudTsx.includes('data-m1="hud-skapa"')) {
      fel.push('M1: src/spel/ui/Hud.tsx saknar data-m1="hud-skapa" på bok-knappen');
    }
    if (!hudTsx.includes("Trolla fram")) {
      fel.push('M1: src/spel/ui/Hud.tsx saknar "Trolla fram" på den högra huvudknappen');
    }

    const hudP2Css = lasText("src/spel/ui/hud-p2.css");
    if (!/body:has\([^)]*\.coach[^)]*\)\s*\.tred-hint/.test(hudP2Css)) {
      fel.push("M1: src/spel/ui/hud-p2.css döljer inte .tred-hint när .coach visas");
    }
    for (const inv of [
      /font-size:\s*1\.125rem/,
      /color:\s*#3B2F2F/,
      /background:\s*#FFF6E5/,
      /data-v6="bengtsson-medaljong"/,
      /width:\s*64px/,
      /height:\s*64px/,
    ]) {
      if (!inv.test(hudP2Css)) {
        fel.push(`M1: src/spel/ui/hud-p2.css saknar v6.test.ts-invarianten ${inv}`);
      }
    }

    const spelVy = lasText("src/spel/ui/SpelVy.tsx");
    if (!/\(!visa3d \? bengtsson\.synlig : platsUi\.plats !== START_PLATS \|\| bengtsson\.mine === "automat"\)/.test(spelVy)) {
      fel.push("M1: src/spel/ui/SpelVy.tsx saknar f4.test.ts-invarianten på rad 110");
    }
    if (!/&&\s*bengtsson\.synlig\s*\?\s*\(\s*<NpcFigur/.test(spelVy)) {
      fel.push("M1: src/spel/ui/SpelVy.tsx saknar prov-d1-d3.mjs-invarianten '&& bengtsson.synlig ? (<NpcFigur'");
    }

    detalj.m1 = {
      harHudUppdrag: npcFigur.includes('data-m1="hud-uppdrag"'),
      harHudSkapa: hudTsx.includes('data-m1="hud-skapa"'),
      coachDoljerTredHint: /body:has\([^)]*\.coach[^)]*\)\s*\.tred-hint/.test(hudP2Css),
    };
  }

  if (KOR_M2) {
    if (!fs.existsSync(path.join(ROOT, "src/spel/ui/UppdragVy.tsx"))) {
      fel.push("M2: src/spel/ui/UppdragVy.tsx saknas");
    } else {
      const uppVy = lasText("src/spel/ui/UppdragVy.tsx");
      for (const attr of [
        'data-m2="uppdrag-svarsruta"',
        'data-m2="uppdrag-svara"',
        'data-m2="uppdrag-svarslage"',
        'data-f3="uppdrag-ide-chip"',
      ]) {
        if (!uppVy.includes(attr)) {
          fel.push(`M2: src/spel/ui/UppdragVy.tsx saknar ${attr}`);
        }
      }
    }

    const bokSkarm = lasText("src/spel/ui/BokSkarm.tsx");
    for (const inv of [
      'data-v2="aktivt-uppdrag-kort"',
      'data-v2="lyssna-aktivt-uppdrag"',
      'data-f3="uppdrag-ide-chip"',
    ]) {
      if (!bokSkarm.includes(inv)) {
        fel.push(`M2: src/spel/ui/BokSkarm.tsx saknar bakåtkompatibel sträng '${inv}' (krävs av v2.test.ts / f3.test.ts)`);
      }
    }

    // Node-kontroll av uppdragForslag och dubblettfria hjälp-uppdrag
    const nodeBin = fs.existsSync("/home/box/.local/node22/bin/node") ? "/home/box/.local/node22/bin/node" : process.execPath;
    const m2Koll = spawnSync(
      nodeBin,
      [
        "--experimental-strip-types",
        "-e",
        `
        import fs from "node:fs";
        import { uppdragForslag } from "./src/spel/ideRad.ts";
        import { useMinne } from "./src/spel/minne.ts";
        import * as mossaMod from "./src/spel/styr/mossaKanin.ts";
        const { mossaPaFrysKanin, hjalpDjurPaAngen } = mossaMod;
        import { tolkaMedReserv } from "./src/tolk/reserv.ts";

        const bengtsson = JSON.parse(fs.readFileSync("./data/bengtsson.json", "utf8"));
        const fel = [];

        const kaninFryser = bengtsson.uppdrag.find(u => u.id === "kanin-fryser");
        const fFryser = uppdragForslag(kaninFryser, "kanin");
        if (fFryser.length < 2 || fFryser.length > 4) {
          fel.push("uppdragForslag(kanin-fryser) ska ge 2..4 förslag, fick: " + JSON.stringify(fFryser));
        }
        if (fFryser.some(s => /\\bkanin\\b/i.test(s))) {
          fel.push("uppdragForslag(kanin-fryser) får INTE föreslå en ny kanin: " + JSON.stringify(fFryser));
        }

        for (const id of ["magen-kurrar", "regn-pa-nosen", "kalla-tassar", "redo-for-fest"]) {
          const u = bengtsson.uppdrag.find(x => x.id === id);
          const f = uppdragForslag(u, "kanin");
          if (f.some(s => /\\b(kanin|katt|hund)\\b/i.test(s))) {
            fel.push("uppdragForslag(" + id + ") föreslår fortfarande ett nytt djur: " + JSON.stringify(f));
          }
        }

        if (typeof hjalpDjurPaAngen !== "function") {
          fel.push("hjalpDjurPaAngen saknas som export i src/spel/styr/mossaKanin.ts");
        } else {
          useMinne.getState().aterstall();
          const uKanin = tolkaMedReserv("en kanin");
          if (uKanin.typ === "skapad") {
            const skapad = useMinne.getState().laggPaAng(uKanin.varelse, 1).nya[0];
            useMinne.getState().sattUppdrag("kanin-fryser", "pagar");
            const uMossa = tolkaMedReserv("en kanin med mössa");
            if (uMossa.typ === "skapad") {
              const trf = hjalpDjurPaAngen(uMossa.varelse, "kanin-fryser") || mossaPaFrysKanin(uMossa.varelse);
              if (!trf || trf.uid !== skapad.uid) {
                fel.push("'en kanin med mössa' under kanin-fryser uppdaterade inte befintlig kanin");
              }
            }
            useMinne.getState().sattUppdrag("magen-kurrar", "pagar");
            const uMorot = tolkaMedReserv("en kanin med morot");
            if (uMorot.typ === "skapad") {
              const trf2 = hjalpDjurPaAngen(uMorot.varelse, "magen-kurrar");
              if (!trf2 || trf2.uid !== skapad.uid) {
                fel.push("'en kanin med morot' under magen-kurrar uppdaterade inte befintlig kanin");
              }
            }
          }
          useMinne.getState().aterstall();
        }

        console.log(JSON.stringify({ fel, fFryser }));
        `,
      ],
      { cwd: ROOT, encoding: "utf8" },
    );
    if (m2Koll.status !== 0) {
      fel.push(`M2 node-koll kraschade: ${m2Koll.stderr}`);
    } else {
      const ut = JSON.parse(m2Koll.stdout.trim().split("\n").at(-1) || '{"fel":[]}');
      for (const f of ut.fel || []) fel.push(`M2: ${f}`);
      detalj.m2.fFryser = ut.fFryser;
    }
  }

  if (KOR_M3) {
    if (!fs.existsSync(path.join(ROOT, "src/spel/ui/StegKortValjare.tsx"))) {
      fel.push("M3: src/spel/ui/StegKortValjare.tsx saknas");
    } else {
      const stegFil = lasText("src/spel/ui/StegKortValjare.tsx");
      for (const attr of [
        'data-m3="steg-piller"',
        'data-m3="kort-grid"',
        'data-m3="kort-nav"',
        'data-m3="sida-bak"',
        'data-m3="sida-fram"',
        'data-m3="steg-nasta"',
      ]) {
        if (!stegFil.includes(attr)) {
          fel.push(`M3: src/spel/ui/StegKortValjare.tsx saknar ${attr}`);
        }
      }
    }

    const bokSkarm = lasText("src/spel/ui/BokSkarm.tsx");
    if (!bokSkarm.includes('data-m3="meningsruta"')) {
      fel.push('M3: src/spel/ui/BokSkarm.tsx saknar data-m3="meningsruta"');
    }
    if (/panel\s*===\s*"spel"\s*\?\s*<UppdragsRemsa/.test(bokSkarm)) {
      fel.push('M3: src/spel/ui/BokSkarm.tsx renderar fortfarande <UppdragsRemsa> inne i panel === "spel"');
    }
    for (const inv of [
      'data-v3="skapar-vy-flikar"',
      'data-v3="vy-flik-skriv"',
      'data-v3="vy-flik-gata"',
      'data-v3="vy-flik-ideer"',
      'data-v3="bok-stang"',
      'data-v3="ordkort"',
      "skriv-remsa",
      "exempel-chip-",
    ]) {
      if (!bokSkarm.includes(inv)) {
        fel.push(`M3: src/spel/ui/BokSkarm.tsx saknar v3.test.ts-invarianten '${inv}'`);
      }
    }

    detalj.m3 = {
      harStegKortValjare: fs.existsSync(path.join(ROOT, "src/spel/ui/StegKortValjare.tsx")),
      harMeningsruta: bokSkarm.includes('data-m3="meningsruta"'),
    };
  }

  return { fel, detalj };
}

async function vantaPaServer(url, maxMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const r = await fetch(url);
      if (r.ok) return true;
    } catch {
      // vänta
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

async function korPlaywright() {
  const { fel, detalj } = korSnabbKontroll();
  if (fel.length > 0) {
    console.log(JSON.stringify({ ok: false, läge: "snabb-före-playwright", del: DEL, fel, detalj }, null, 2));
    process.exit(1);
  }

  fs.mkdirSync(UT_MAPP, { recursive: true });
  const port = 4390 + Math.floor(Math.random() * 200);
  const url = `http://127.0.0.1:${port}`;
  const npxBin = fs.existsSync("/home/box/.local/node22/bin/npx") ? "/home/box/.local/node22/bin/npx" : "npx";
  const server = spawn(npxBin, ["vite", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    cwd: ROOT,
    stdio: "ignore",
  });

  let browser;
  try {
    const redo = await vantaPaServer(url);
    if (!redo) {
      fel.push(`Kunde inte starta Vite på ${url}`);
      return { fel, detalj };
    }

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();

    const konsolFel = [];
    page.on("pageerror", (e) => konsolFel.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") konsolFel.push(m.text());
    });

    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(350);

    // Hoppa över introt
    const hoppa = page.locator('[data-testid="intro-hoppa"], button:has-text("Hoppa över")');
    if ((await hoppa.count()) > 0 && (await hoppa.first().isVisible())) {
      await hoppa.first().click();
      await page.waitForTimeout(450);
    }

    // Stäng boken om Första skapelse öppnade den automatiskt så vi kan mäta startskärmens HUD i M1
    const stangBok = page.locator('[data-testid="stang-bok"]');
    if ((await stangBok.count()) > 0 && (await stangBok.first().isVisible())) {
      await stangBok.first().click();
      await page.waitForTimeout(350);
    }

    if (KOR_M1) {
      const m1Hud = await page.evaluate(() => {
        const synlig = (el) => {
          if (!el) return false;
          const st = getComputedStyle(el);
          if (st.display === "none" || st.visibility === "hidden" || Number(st.opacity) === 0) return false;
          const r = el.getBoundingClientRect();
          return r.width > 4 && r.height > 4;
        };
        const uppKort = document.querySelector('[data-m1="hud-uppdrag"], [data-testid="bengtsson-ikon"]');
        const skapaKort = document.querySelector('[data-m1="hud-skapa"], [data-testid="pennans-bok"]');
        const npcFigur = document.querySelector('[data-testid="npc-figur"]');
        const tredHint = document.querySelector(".tred-hint");
        const coach = document.querySelector(".coach, .banner, .bubbla");

        const uRect = uppKort?.getBoundingClientRect() || null;
        const sRect = skapaKort?.getBoundingClientRect() || null;
        const overlappX =
          uRect && sRect ? Math.max(0, Math.min(uRect.right, sRect.right) - Math.max(uRect.left, sRect.left)) : 999;

        return {
          uppSynlig: synlig(uppKort),
          skapaSynlig: synlig(skapaKort),
          npcFigurSynlig: synlig(npcFigur),
          tredHintSynlig: synlig(tredHint),
          coachSynlig: synlig(coach),
          uRect: uRect ? { x: Math.round(uRect.x), y: Math.round(uRect.y), w: Math.round(uRect.width), h: Math.round(uRect.height) } : null,
          sRect: sRect ? { x: Math.round(sRect.x), y: Math.round(sRect.y), w: Math.round(sRect.width), h: Math.round(sRect.height) } : null,
          overlappX: Math.round(overlappX),
          uppText: uppKort?.textContent?.trim() || "",
          skapaText: skapaKort?.textContent?.trim() || "",
        };
      });
      detalj.m1.playwright = m1Hud;

      if (!m1Hud.uppSynlig || !m1Hud.skapaSynlig) {
        fel.push(`M1: Båda bottenkorten måste vara synliga på startängen: ${JSON.stringify(m1Hud)}`);
      }
      if (m1Hud.npcFigurSynlig) {
        fel.push("M1: Dubbelt Doktor Bengtsson-porträtt! .npc-figur är fortfarande synlig ovanför det vänstra bottenkortet på startängen");
      }
      if (m1Hud.tredHintSynlig && m1Hud.coachSynlig) {
        fel.push("M1: Dubbla hjälpbubblor! .tred-hint och .coach visas samtidigt");
      }
      if (!m1Hud.uRect || m1Hud.uRect.h < 60 || !m1Hud.sRect || m1Hud.sRect.h < 60 || m1Hud.overlappX > 0) {
        fel.push(`M1: Bottenkortens geometri ogiltig eller överlappande: ${JSON.stringify({ uRect: m1Hud.uRect, sRect: m1Hud.sRect, overlappX: m1Hud.overlappX })}`);
      }
      await page.screenshot({ path: path.join(UT_MAPP, "m1-hud-bottenkort.png") });
    }

    if (KOR_M2) {
      // Skapa första djuret ("en kanin") så att uppdraget kanin-fryser blir aktivt
      await page.click('[data-testid="pennans-bok"]');
      await page.waitForTimeout(300);
      await page.fill('[data-testid="ord-input"]', "en kanin");
      await page.waitForTimeout(150);
      await page.click('[data-testid="vakna"]');
      await page.waitForTimeout(800);

      // Stäng boken om den är öppen och öppna Doktor Bengtssons Uppdragsruta
      if (await page.locator('[data-testid="stang-bok"]').isVisible().catch(() => false)) {
        await page.click('[data-testid="stang-bok"]');
        await page.waitForTimeout(300);
      }
      await page.click('[data-testid="bengtsson-ikon"]');
      await page.waitForTimeout(400);

      const m2Uppdrag = await page.evaluate(() => {
        const uppBok = document.querySelector('[data-testid="uppdragbok"]');
        const svarsRuta = document.querySelector('[data-m2="uppdrag-svarsruta"]');
        const svaraKnapp = document.querySelector('[data-m2="uppdrag-svara"]');
        const chips = [...document.querySelectorAll('[data-f3="uppdrag-ide-chip"]')];
        return {
          uppBokSynlig: Boolean(uppBok && uppBok.getBoundingClientRect().height > 40),
          svarsRutaSynlig: Boolean(svarsRuta && svarsRuta.getBoundingClientRect().height >= 40),
          svaraKnappSynlig: Boolean(svaraKnapp && svaraKnapp.getBoundingClientRect().height >= 40),
          antalChips: chips.length,
          chipTexter: chips.map((c) => c.textContent?.trim() || ""),
        };
      });
      detalj.m2.uppdragVy = m2Uppdrag;

      if (!m2Uppdrag.uppBokSynlig || !m2Uppdrag.svarsRutaSynlig || !m2Uppdrag.svaraKnappSynlig) {
        fel.push(`M2: UppdragVy saknar synlig svarsruta eller svarsknapp: ${JSON.stringify(m2Uppdrag)}`);
      }
      if (m2Uppdrag.antalChips < 2 || m2Uppdrag.chipTexter.some((t) => /\bkanin\b/i.test(t))) {
        fel.push(`M2: Förslagskorten i UppdragVy är felaktiga eller innehåller 'kanin': ${JSON.stringify(m2Uppdrag.chipTexter)}`);
      }

      // Klicka på första förslagskortet — verifiera att vi stannar KVAR i UppdragVy!
      await page.locator('[data-f3="uppdrag-ide-chip"]').first().click();
      await page.waitForTimeout(250);
      const kvarIUppdrag = await page.locator('[data-testid="uppdragbok"]').isVisible();
      if (!kvarIUppdrag) {
        fel.push("M2: Klick på förslagskort kastade ut spelaren ur UppdragVy till Pennans bok!");
      }

      // Växla till Skriv själv (tangentbord) inne i UppdragVy och kontrollera att tangentbordet syns kvar i UppdragVy
      const losKnapp = page.locator('[data-m2="lage-tangentbord"], [data-testid="uppdrag-los-i-boken"]');
      if ((await losKnapp.count()) > 0) {
        await losKnapp.first().click();
        await page.waitForTimeout(200);
        const tbSynligIUppdrag = await page.evaluate(() => {
          const upp = document.querySelector('[data-testid="uppdragbok"]');
          const tb = document.querySelector('[data-m2="uppdrag-tangentbord"], [data-testid="tangentbord"]');
          return Boolean(upp && tb && tb.getBoundingClientRect().height > 40);
        });
        if (!tbSynligIUppdrag) {
          fel.push("M2: Skärmtangentbordet visades inte inne i UppdragVy vid klick på 'Skriv själv'");
        }
      }
      await page.screenshot({ path: path.join(UT_MAPP, "m2-uppdrag-inbyggt-svar.png") });

      // Skicka svaret med [data-m2="uppdrag-svara"] och kontrollera att det fortfarande bara finns 1 kanin på ängen!
      await page.click('[data-m2="uppdrag-svara"]');
      await page.waitForTimeout(800);

      const djurEfterHjalp = await page.evaluate(() => {
        const ang = window.__trollMinne?.getState?.()?.ang || [];
        return {
          antalDjur: ang.length,
          kroppar: ang.map((d) => d.kropp),
          tillbehor: ang[0]?.tillbehor || [],
        };
      });
      detalj.m2.djurEfterHjalp = djurEfterHjalp;
      if (djurEfterHjalp.antalDjur !== 1) {
        fel.push(`M2: Dubblett-djur skapades vid hjälp-uppdrag! Antal djur på ängen: ${djurEfterHjalp.antalDjur}`);
      }
      await page.screenshot({ path: path.join(UT_MAPP, "m2-ingen-dubblett-kanin.png") });
    }

    if (KOR_M3) {
      // Öppna Pennans bok (panel === "spel")
      if (!(await page.locator('[data-m3="meningsruta"]').isVisible().catch(() => false))) {
        if (await page.locator('[data-testid="stang-bok"]').isVisible().catch(() => false)) {
          await page.click('[data-testid="stang-bok"]');
          await page.waitForTimeout(250);
        }
        await page.click('[data-testid="pennans-bok"]');
        await page.waitForTimeout(350);
      }

      const m3Steg1 = await page.evaluate(() => {
        const bok = document.querySelector(".bok")?.getBoundingClientRect();
        const meningsruta = document.querySelector('[data-m3="meningsruta"]')?.getBoundingClientRect();
        const ordkortPanel = document.querySelector('[data-v3="ordkort"]');
        const ordkortRect = ordkortPanel?.getBoundingClientRect();
        const skrivRemsa = document.querySelector(".skriv-remsa")?.getBoundingClientRect();
        const bengtssonIBok = document.querySelector('[data-testid="uppdrag-remsa"]');
        const gataFlik = document.querySelector('[data-v3="vy-flik-gata"]');
        const stegPiller = document.querySelector('[data-m3="steg-piller"]');
        const kortEls = [...document.querySelectorAll('[data-v3="ordkort"] .ord-kort')];
        const doldaScrollPx = ordkortPanel ? ordkortPanel.scrollHeight - ordkortPanel.clientHeight : 999;

        return {
          harBengtssonIBok: Boolean(bengtssonIBok),
          harGataFlik: Boolean(gataFlik && gataFlik.getBoundingClientRect().height > 0),
          harStegPiller: Boolean(stegPiller && stegPiller.getBoundingClientRect().height >= 28),
          meningsrutaTop: meningsruta ? Math.round(meningsruta.top) : null,
          meningsrutaH: meningsruta ? Math.round(meningsruta.height) : null,
          ordkortTop: ordkortRect ? Math.round(ordkortRect.top) : null,
          ordkortBottom: ordkortRect ? Math.round(ordkortRect.bottom) : null,
          skrivRemsaTop: skrivRemsa ? Math.round(skrivRemsa.top) : null,
          bokTop: bok ? Math.round(bok.top) : null,
          antalKortPaSidan: kortEls.length,
          doldaScrollPx: Math.round(doldaScrollPx),
        };
      });
      detalj.m3.steg1 = m3Steg1;

      if (m3Steg1.harBengtssonIBok) {
        fel.push("M3: Doktor Bengtssons uppdragsremsa finns fortfarande kvar inne i Pennans bok!");
      }
      if (m3Steg1.harGataFlik) {
        fel.push("M3: Gåt-fliken är fortfarande synlig inne i Pennans bok!");
      }
      if (!m3Steg1.harStegPiller) {
        fel.push("M3: Steg-piller (data-m3='steg-piller') saknas i Pennans bok");
      }
      if (!m3Steg1.meningsrutaTop || !m3Steg1.ordkortTop || m3Steg1.meningsrutaTop >= m3Steg1.ordkortTop) {
        fel.push(`M3: Meningsrutan ligger inte högst upp ovanför ordkorten: ${JSON.stringify(m3Steg1)}`);
      }
      if (!m3Steg1.meningsrutaH || m3Steg1.meningsrutaH < 48) {
        fel.push(`M3: Meningsrutan är för liten (${m3Steg1.meningsrutaH} px, krav >= 48 px)`);
      }
      if (m3Steg1.antalKortPaSidan !== 6) {
        fel.push(`M3: Ordkortsväljaren ska visa exakt 6 kort per sida, visar ${m3Steg1.antalKortPaSidan}`);
      }
      if (m3Steg1.doldaScrollPx > 2) {
        fel.push(`M3: Ordkortspanelen har dold rullista (scrollHeight - clientHeight = ${m3Steg1.doldaScrollPx} px)`);
      }
      if (m3Steg1.ordkortBottom > m3Steg1.skrivRemsaTop + 1) {
        fel.push(`M3: Ordkortspanelen överlappar nedre .skriv-remsa (${m3Steg1.ordkortBottom} > ${m3Steg1.skrivRemsaTop} + 1)`);
      }

      await page.screenshot({ path: path.join(UT_MAPP, "m3-pennans-bok-steg1.png") });

      // Välj ett djurkort i Steg 1 och gå till Steg 2 via Nästa steg-knappen
      await page.locator('[data-v3="ordkort"] .ord-kort').first().click();
      await page.waitForTimeout(200);
      await page.click('[data-m3="steg-nasta"]');
      await page.waitForTimeout(250);

      const m3Steg2 = await page.evaluate(() => {
        const kortTexter = [...document.querySelectorAll('[data-v3="ordkort"] .ord-kort')].map((el) =>
          (el.textContent || "").trim(),
        );
        const brickor = [...document.querySelectorAll('[data-m3="ord-bricka"]')].map((el) =>
          (el.textContent || "").trim(),
        );
        return { kortTexter, brickor };
      });
      detalj.m3.steg2 = m3Steg2;
      if (m3Steg2.kortTexter.length !== 6) {
        fel.push(`M3: Steg 2 visar inte 6 kort: ${JSON.stringify(m3Steg2.kortTexter)}`);
      }
      await page.screenshot({ path: path.join(UT_MAPP, "m3-pennans-bok-steg2.png") });
    }

    if (konsolFel.length > 0) {
      fel.push(`Konsol-/sidfel under Playwright: ${konsolFel.join(" | ")}`);
    }

    await context.close();
  } finally {
    if (browser) await browser.close();
    server.kill("SIGTERM");
  }

  return { fel, detalj };
}

async function main() {
  if (SNABB) {
    const { fel, detalj } = korSnabbKontroll();
    const ok = fel.length === 0;
    console.log(JSON.stringify({ ok, läge: "snabb", del: DEL, antalFel: fel.length, fel, detalj }, null, 2));
    process.exit(ok ? 0 : 1);
  }

  const { fel, detalj } = await korPlaywright();
  const ok = fel.length === 0;
  console.log(
    JSON.stringify({ ok, läge: "playwright-375x812", del: DEL, utMapp: UT_MAPP, antalFel: fel.length, fel, detalj }, null, 2),
  );
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
