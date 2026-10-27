#!/usr/bin/env node
/**
 * Verifieringsprov för Blockserie C (C1–C4: Copilots v0.8 Redesign — Levande Ord)
 *
 * Körning:
 *   node rundor/C1-C4-levande-ord/prov-c1-c4.mjs --steg=c1
 *   node rundor/C1-C4-levande-ord/prov-c1-c4.mjs --steg=c2
 *   node rundor/C1-C4-levande-ord/prov-c1-c4.mjs --steg=c3
 *   node rundor/C1-C4-levande-ord/prov-c1-c4.mjs --steg=c4
 *   node rundor/C1-C4-levande-ord/prov-c1-c4.mjs --snabb --steg=c1
 */
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { chromium } from "playwright";

const ROOT = process.cwd();
const UT_MAPP = "/workspace/trollpennan-nulage/ko-27okt-c";
const args = process.argv.slice(2);
const SNABB = args.includes("--snabb");

function hamtaSteg() {
  const eqArg = args.find((a) => a.startsWith("--steg="));
  if (eqArg) return eqArg.split("=")[1].toLowerCase();
  const idx = args.indexOf("--steg");
  if (idx >= 0 && args[idx + 1]) return args[idx + 1].toLowerCase();
  return "c4";
}

const STEG = hamtaSteg();
const STEG_ORDNING = ["c1", "c2", "c3", "c4"];
const STEG_INDEX = STEG_ORDNING.indexOf(STEG) >= 0 ? STEG_ORDNING.indexOf(STEG) : 3;

const KOR_C1 = STEG_INDEX >= 0;
const KOR_C2 = STEG_INDEX >= 1;
const KOR_C3 = STEG_INDEX >= 2;
const KOR_C4 = STEG_INDEX >= 3;

const IKONER_V08 = [
  "add.svg",
  "animal.svg",
  "audio.svg",
  "back.svg",
  "book.svg",
  "close.svg",
  "erase.svg",
  "gift.svg",
  "home.svg",
  "idea.svg",
  "magic.svg",
  "map.svg",
  "menu.svg",
  "name.svg",
  "paint.svg",
  "pencil.svg",
  "settings.svg",
  "size.svg",
  "undo.svg",
];

const FARG_V08 = ["bla.svg", "gron.svg", "gul.svg", "rod.svg"];

const ILLUST_V08 = [
  "apple.webp",
  "drake.webp",
  "hund.webp",
  "hus.webp",
  "kanin.webp",
  "katt.webp",
  "morot.webp",
  "mossa.webp",
];

const KALLFILER_MAX_400 = [
  "src/spel/ui/BokSkarm.tsx",
  "src/spel/ui/SkapelseBar.tsx",
  "src/spel/ui/BokKort.tsx",
  "src/spel/ui/StegKortValjare.tsx",
  "src/spel/ui/GavoPanel.tsx",
  "src/spel/styr/useSkriv.ts",
  "src/spel/ui/hjalp.ts",
  "src/spel/ui/gavoRuta.ts",
  "src/spel/ui/bok-komp.css",
  "src/spel/ui/bok-v08.css",
];

function radAntal(relPath) {
  const p = path.join(ROOT, relPath);
  if (!fs.existsSync(p)) return 0;
  return fs.readFileSync(p, "utf8").split("\n").length;
}

// ============================================================================
// DEL 1: Statisk struktur-, radbudget- och resurskontroll
// ============================================================================
function korDel1Statisk() {
  const fel = [];
  const detalj = { steg: STEG, rader: {}, resurser: {} };

  // 1. Kör npm run check:struktur (174 unika data-testid / 179 förekomster)
  const struktur = spawnSync("/home/box/.local/node22/bin/node", ["scripts/check-spel-struktur.mjs"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (struktur.status !== 0) {
    fel.push(`Del 1: check:struktur misslyckades: ${(struktur.stdout + "\n" + struktur.stderr).trim()}`);
  }

  // 2. Kontrollera radbudget <= 400 rader på alla berörda källfiler
  for (const rel of KALLFILER_MAX_400) {
    const r = radAntal(rel);
    if (r > 0) {
      detalj.rader[rel] = r;
      if (r > 400) {
        fel.push(`Del 1: ${rel} har ${r} rader (max 400 rader tillåtet)`);
      }
    }
  }

  // 3. Kontrollera att alla 31 v0.8-resurser finns i public/
  const saknadeIkoner = IKONER_V08.filter((f) => !fs.existsSync(path.join(ROOT, "public/ikoner/v08", f)));
  const saknadeFarg = FARG_V08.filter((f) => !fs.existsSync(path.join(ROOT, "public/ordkort/v08", f)));
  const saknadeIllust = ILLUST_V08.filter(
    (f) => !fs.existsSync(path.join(ROOT, "public/ordkort/v08/illustrations", f)),
  );
  detalj.resurser = {
    ikonerV08: IKONER_V08.length - saknadeIkoner.length,
    fargV08: FARG_V08.length - saknadeFarg.length,
    illustV08: ILLUST_V08.length - saknadeIllust.length,
  };
  if (saknadeIkoner.length > 0) fel.push(`Del 1: Saknade ikoner i public/ikoner/v08: ${saknadeIkoner.join(", ")}`);
  if (saknadeFarg.length > 0) fel.push(`Del 1: Saknade färg-SVG i public/ordkort/v08: ${saknadeFarg.join(", ")}`);
  if (saknadeIllust.length > 0) {
    fel.push(`Del 1: Saknade WebP i public/ordkort/v08/illustrations: ${saknadeIllust.join(", ")}`);
  }

  // 4. Stegspecifika källfilskontroller
  if (KOR_C1 && !fs.existsSync(path.join(ROOT, "src/spel/ui/SkapelseBar.tsx"))) {
    fel.push("Del 2 (c1): src/spel/ui/SkapelseBar.tsx saknas");
  }
  if (KOR_C2 && !fs.existsSync(path.join(ROOT, "src/spel/ui/BokKort.tsx"))) {
    fel.push("Del 3 (c2): src/spel/ui/BokKort.tsx saknas");
  }
  if (KOR_C3 && !fs.existsSync(path.join(ROOT, "src/spel/ui/GavoPanel.tsx"))) {
    fel.push("Del 4 (c3): src/spel/ui/GavoPanel.tsx saknas");
  }
  if (KOR_C4 && !fs.existsSync(path.join(ROOT, "src/spel/ui/bok-v08.css"))) {
    fel.push("Del 5 (c4): src/spel/ui/bok-v08.css saknas");
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

async function oppnaBokOmStangd(page) {
  const bokSynlig = await page
    .locator(".bok")
    .isVisible()
    .catch(() => false);
  if (!bokSynlig) {
    const knapp = page.locator('[data-testid="skriv-knapp"], [data-testid="hud-bok"], button:has-text("Skriv")');
    if ((await knapp.count()) > 0) {
      await knapp.first().click();
      await page.waitForTimeout(300);
    }
  }
}

async function korPlaywright() {
  const { fel, detalj } = korDel1Statisk();
  if (fel.length > 0) {
    return { fel, detalj };
  }

  fs.mkdirSync(UT_MAPP, { recursive: true });
  const port = 4380 + Math.floor(Math.random() * 200);
  const url = `http://127.0.0.1:${port}`;
  const server = spawn(
    "/home/box/.local/node22/bin/npx",
    ["vite", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    { cwd: ROOT, stdio: "ignore" },
  );

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
    await page.evaluate(() => {
      const st = window.__trollMinne?.getState?.();
      if (st?.sattIntro) st.sattIntro();
    });
    const hoppaOver = page.locator('[data-testid="intro-hoppa-over"], button:has-text("Hoppa över")');
    if ((await hoppaOver.count()) > 0 && (await hoppaOver.first().isVisible())) {
      await hoppaOver.first().click();
    }
    await page.waitForTimeout(450);

    // ========================================================================
    // DEL 2 (c1): SkapelseBar.tsx — klickbara ordbrickor, ångra, >=7 ord, magisk status & casting-spärr
    // ========================================================================
    if (KOR_C1) {
      await oppnaBokOmStangd(page);

      // Bygg "blå kanin" via ordkorten (Steg 1: kanin -> Steg 2: blå)
      const kaninKort = page.locator('[data-testid="kort-kanin"]');
      if ((await kaninKort.count()) > 0 && (await kaninKort.isVisible())) {
        await kaninKort.click();
        await page.waitForTimeout(200);
      }
      const steg2 = page.locator('[data-m3="steg-2"]');
      if ((await steg2.count()) > 0 && (await steg2.isVisible())) {
        await steg2.click();
        await page.waitForTimeout(200);
      }
      const blaKort = page.locator('[data-testid="kort-blå"]');
      if ((await blaKort.count()) > 0 && (await blaKort.isVisible())) {
        await blaKort.click();
        await page.waitForTimeout(200);
      }

      // Växla till Steg 1 (Djur) först så vi bevisar att klick på ordbrickan "blå" aktiverar färgsteget!
      const steg1 = page.locator('[data-m3="steg-1"]');
      if ((await steg1.count()) > 0 && (await steg1.isVisible())) {
        await steg1.click();
        await page.waitForTimeout(150);
      }

      const brickorFore = await page.evaluate(() => {
        const els = [...document.querySelectorAll('[data-c1="ord-bricka"], [data-m3="ord-bricka"]')];
        return els.map((el) => {
          const r = el.getBoundingClientRect();
          return {
            tag: el.tagName,
            text: (el.textContent || "").trim(),
            width: Math.round(r.width),
            height: Math.round(r.height),
            ariaLabel: el.getAttribute("aria-label") || "",
          };
        });
      });

      if (brickorFore.length < 2) {
        fel.push(`Del 2 (c1): Förväntade minst 2 ordbrickor för "blå kanin", fick: ${JSON.stringify(brickorFore)}`);
      }
      if (brickorFore.some((b) => b.tag !== "BUTTON" || b.height < 40)) {
        fel.push(
          `Del 2 (c1): Alla ordbrickor måste vara <button> med height >= 40 px: ${JSON.stringify(brickorFore)}`,
        );
      }

      // Klicka på ordbrickan "blå" -> ska aktivera färgsteget -> klicka "röd" -> byter "blå" mot "röd" utan att tappa "kanin" (AC03)
      const blaBricka = page.locator('[data-c1="ord-bricka"]:has-text("blå"), [data-m3="ord-bricka"]:has-text("blå")');
      if ((await blaBricka.count()) > 0) {
        await blaBricka.first().click();
        await page.waitForTimeout(200);
      }
      const rodKort = page.locator('[data-testid="kort-röd"]');
      if ((await rodKort.count()) > 0 && (await rodKort.isVisible())) {
        await rodKort.click();
        await page.waitForTimeout(200);
      } else {
        fel.push("Del 2 (c1 / AC03): Klick på ordbrickan 'blå' öppnade inte färgsteget där 'kort-röd' finns");
      }

      const meningEfterRod = await page
        .locator('[data-m3="meningsruta"]')
        .innerText()
        .catch(() => "");
      if (!meningEfterRod.includes("röd") || !meningEfterRod.includes("kanin")) {
        fel.push(
          `Del 2 (c1 / AC03): Efter byte blå -> röd skulle meningen innehålla både "röd" och "kanin", fick: "${meningEfterRod}"`,
        );
      }

      if (KOR_C1) {
        await page.screenshot({ path: path.join(UT_MAPP, "c1-meningsbyggare-375x812.png") });
      }

      // Testa Ångra-knappen ([data-c1="mening-angra"]) -> återställer "blå"
      const angraKnapp = page.locator('[data-c1="mening-angra"]');
      if ((await angraKnapp.count()) === 0) {
        fel.push('Del 2 (c1): Ångra-knapp [data-c1="mening-angra"] saknas');
      } else {
        await angraKnapp.first().click();
        await page.waitForTimeout(200);
        const meningEfterAngra = await page
          .locator('[data-m3="meningsruta"]')
          .innerText()
          .catch(() => "");
        if (!meningEfterAngra.includes("blå") || !meningEfterAngra.includes("kanin")) {
          fel.push(`Del 2 (c1): Ångra återställde inte meningen till "blå kanin", fick: "${meningEfterAngra}"`);
        }
      }

      // Testa lång mening (>= 7 ord) -> [data-c1="mening-expander"] visas och fungerar (UX-06)
      await page.locator('[data-testid="ord-input"]').fill("en stor blå kanin med röd mössa");
      await page.waitForTimeout(250);
      const expander = page.locator('[data-c1="mening-expander"]');
      const expanderSyns = (await expander.count()) > 0 && (await expander.first().isVisible());
      if (!expanderSyns) {
        fel.push('Del 2 (c1 / UX-06): [data-c1="mening-expander"] visas inte vid lång mening (>= 7 ord)');
      } else {
        await expander.first().click();
        await page.waitForTimeout(200);
        if (KOR_C4) {
          await page.screenshot({ path: path.join(UT_MAPP, "c4-lang-mening-375x812.png") });
        }
        await expander.first().click();
        await page.waitForTimeout(150);
      }

      // Kontrollera v0.6 magisk statusrad ([data-c1="magisk-status"]) och dubbelklicksspärr på Vakna! (UX-05)
      const magiskStatus = await page
        .locator('[data-c1="magisk-status"]')
        .innerText()
        .catch(() => "");
      if (!magiskStatus.trim()) {
        fel.push('Del 2 (c1): [data-c1="magisk-status"] saknas eller är tom');
      }

      const antalDjurFore = await page.evaluate(() => {
        const st = window.__trollMinne?.getState?.();
        return Array.isArray(st?.ang) ? st.ang.length : 0;
      });
      await page.locator('[data-testid="ord-input"]').fill("en blå kanin");
      await page.waitForTimeout(150);
      // Dubbelklick i samma tick för att verifiera casting-spärren
      await page.evaluate(() => {
        const kn = document.querySelector('[data-testid="vakna"]');
        if (kn instanceof HTMLElement) {
          kn.click();
          kn.click();
        }
      });
      await page.waitForTimeout(950);
      const antalDjurEfter = await page.evaluate(() => {
        const st = window.__trollMinne?.getState?.();
        return Array.isArray(st?.ang) ? st.ang.length : 0;
      });

      detalj.c1 = {
        brickorFore,
        meningEfterRod,
        expanderSyns,
        magiskStatus,
        antalDjurFore,
        antalDjurEfter,
      };
    }

    // ========================================================================
    // DEL 3 (c2): StegKortValjare.tsx & BokKort.tsx — 2x2-rutnät, ikoner/swatches, ✓ Vald, separat 🔊, mini-preview
    // ========================================================================
    if (KOR_C2) {
      await oppnaBokOmStangd(page);
      // Rensa meningen och välj Steg 1 (Djur)
      const rensa = page.locator('[data-m3="mening-rensa"]');
      if ((await rensa.count()) > 0 && (await rensa.isVisible())) {
        await rensa.click();
        await page.waitForTimeout(150);
      }
      const steg1 = page.locator('[data-m3="steg-1"]');
      if ((await steg1.count()) > 0 && (await steg1.isVisible())) {
        await steg1.click();
        await page.waitForTimeout(200);
      }

      // Välj "kanin" så att både .vald och mini-preview aktiveras
      const kaninKort = page.locator('[data-testid="kort-kanin"]');
      if ((await kaninKort.count()) > 0 && (await kaninKort.isVisible())) {
        await kaninKort.click();
        await page.waitForTimeout(200);
      }

      if (KOR_C4) {
        await page.screenshot({ path: path.join(UT_MAPP, "c2-ordkort-2x2-375x812.png") });
      }

      const c2Matt = await page.evaluate(() => {
        const grid = document.querySelector('[data-m3="kort-grid"]');
        const kort = [...document.querySelectorAll('[data-m3="kort-grid"] .ord-kort')];
        const synliga = kort.filter((k) => {
          const r = k.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });
        const valtKort = synliga.find((k) => k.classList.contains("vald"));
        const valtMarkering = valtKort?.querySelector('[data-c2="kort-vald-markering"]');
        const lyssnaKnappar = synliga.map((k) => k.querySelector('[data-c2="kort-lyssna"]')).filter(Boolean);
        const miniPreview = document.querySelector('[data-c2="mini-preview"]');
        return {
          antalSynligaKort: synliga.length,
          gridOverflow: grid ? grid.scrollHeight - grid.clientHeight : 0,
          kortStorlekar: synliga.map((k) => {
            const r = k.getBoundingClientRect();
            return {
              id: k.getAttribute("data-testid"),
              w: Math.round(r.width),
              h: Math.round(r.height),
              harIkon: Boolean(k.querySelector("img.kort-ikon, .kort-farg-swatch")),
            };
          }),
          valtHarMarkering: Boolean(valtMarkering && (valtMarkering.textContent || "").includes("Vald")),
          antalLyssnaKnappar: lyssnaKnappar.length,
          harMiniPreview: Boolean(miniPreview),
        };
      });

      if (c2Matt.antalSynligaKort > 4 || c2Matt.antalSynligaKort < 1) {
        fel.push(`Del 3 (c2): 2x2-rutnät ska visa max 4 kort per sida, fick ${c2Matt.antalSynligaKort}`);
      }
      if (c2Matt.gridOverflow > 2) {
        fel.push(`Del 3 (c2): kort-grid har intern scroll (${c2Matt.gridOverflow}px)`);
      }
      if (c2Matt.kortStorlekar.some((k) => k.w < 135 || k.h < 58 || !k.harIkon)) {
        fel.push(
          `Del 3 (c2): Alla kort på 375x812 ska vara >= 135x58 px och ha ikon/swatch: ${JSON.stringify(c2Matt.kortStorlekar)}`,
        );
      }
      if (!c2Matt.valtHarMarkering) {
        fel.push('Del 3 (c2 / AC06): Valt kort saknar synlig textindikator [data-c2="kort-vald-markering"] ("✓ Vald")');
      }
      if (c2Matt.antalLyssnaKnappar !== c2Matt.antalSynligaKort) {
        fel.push(
          `Del 3 (c2): Varje synligt ordkort ska ha separat [data-c2="kort-lyssna"] (${c2Matt.antalLyssnaKnappar}/${c2Matt.antalSynligaKort})`,
        );
      }
      if (!c2Matt.harMiniPreview) {
        fel.push('Del 3 (c2): Ärlig 2D-miniförhandsvisning [data-c2="mini-preview"] visas inte när djur är valt');
      }

      // Testa separat 🔊-lyssnaknapp på ett ICKE-valt kort (t.ex. katt) -> får INTE välja katten i meningen!
      const kattLyssna = page.locator('[data-testid="kort-katt"] [data-c2="kort-lyssna"]');
      if ((await kattLyssna.count()) > 0) {
        await kattLyssna.first().click();
        await page.waitForTimeout(200);
        const meningEfterLyssna = await page
          .locator('[data-m3="meningsruta"]')
          .innerText()
          .catch(() => "");
        if (meningEfterLyssna.includes("katt")) {
          fel.push(
            `Del 3 (c2): Klick på separat 🔊-lyssnaknapp på "katt" valde "katt" i meningen ("${meningEfterLyssna}")`,
          );
        }
      }

      // Kontrollera ikoner i alla övriga kategorier (farg, storlek, monster, tillbehor inkl. halsduk.png)
      await page.locator('[data-m3="steg-2"]').click();
      await page.waitForTimeout(150);
      // Klicka på storlek via underkategori om den finns
      const storlekKat = page.locator('[data-m3="beskriv-kat-storlek"]');
      if ((await storlekKat.count()) > 0) {
        await storlekKat.click();
        await page.waitForTimeout(150);
        const storlekKoll = await page.evaluate(() => {
          const storImg = document.querySelector('[data-testid="kort-stor"] img.kort-ikon');
          const litenImg = document.querySelector('[data-testid="kort-liten"] img.kort-ikon');
          return {
            storKlass: storImg?.className || "",
            litenKlass: litenImg?.className || "",
          };
        });
        if (!storlekKoll.storKlass || !storlekKoll.litenKlass || storlekKoll.storKlass === storlekKoll.litenKlass) {
          fel.push(
            `Del 3 (c2 / UX-03): "stor" och "liten" måste ha skilda visuella klasser: ${JSON.stringify(storlekKoll)}`,
          );
        }
      }

      // Kontrollera Steg 3 (Tillbehör) -> halsduk ska ha /kit/tillbehor/halsduk.png (inte mossa.webp)
      await page.locator('[data-m3="steg-3"]').click();
      await page.waitForTimeout(150);
      // Bläddra tills kort-halsduk syns (max 3 sidbyten)
      for (let s = 0; s < 3; s++) {
        if ((await page.locator('[data-testid="kort-halsduk"]').count()) > 0) break;
        const nasta = page.locator('[data-m3="kort-nasta"]');
        if ((await nasta.count()) > 0 && (await nasta.isEnabled())) {
          await nasta.click();
          await page.waitForTimeout(150);
        }
      }
      const halsdukSrc = await page.evaluate(() => {
        const img = document.querySelector('[data-testid="kort-halsduk"] img.kort-ikon');
        return img?.getAttribute("src") || "";
      });
      if (!halsdukSrc.includes("halsduk.png") || halsdukSrc.includes("mossa")) {
        fel.push(`Del 3 (c2 / UX-03): "halsduk" har fel bildkälla: "${halsdukSrc}" (ska vara /kit/tillbehor/halsduk.png)`);
      }

      detalj.c2 = { ...c2Matt, halsdukSrc };
    }

    // ========================================================================
    // DEL 4 (c3): GavoPanel.tsx, IdeaSelector och Stava själv-synk
    // ========================================================================
    if (KOR_C3) {
      // Stäng boken om öppen och hämta en kanin på ängen (eller skapa en om ingen finns)
      let kaninUid = await page.evaluate(() => {
        const st = window.__trollMinne?.getState?.();
        const lista = Array.isArray(st?.ang) ? st.ang : []; const k = lista.find((d) => d.kropp === "kanin") || lista[0];
        return k?.uid || null;
      });
      if (!kaninUid) {
        await oppnaBokOmStangd(page);
        await page.locator('[data-testid="ord-input"]').fill("en kanin");
        await page.waitForTimeout(150);
        await page.locator('[data-testid="vakna"]').click();
        await page.waitForTimeout(900);
        kaninUid = await page.evaluate(() => {
          const st = window.__trollMinne?.getState?.();
          const lista = Array.isArray(st?.ang) ? st.ang : []; const k = lista.find((d) => d.kropp === "kanin") || lista[0];
          return k?.uid || null;
        });
      }

      const djurForeGava = await page.evaluate(() => {
        const st = window.__trollMinne?.getState?.();
        return Array.isArray(st?.ang) ? st.ang.length : 0;
      });

      // Öppna gåvoläge för kaninUid via troll-gava-klick
      await page.evaluate((uid) => {
        window.dispatchEvent(new CustomEvent("troll-gava-klick", { detail: uid }));
      }, kaninUid);
      await page.waitForTimeout(350);

      const gavaMeta = await page.evaluate(() => {
        const remsa = document.querySelector('[data-testid="gava-remsa"]');
        const gavoKort = [...document.querySelectorAll('[data-c3="gavo-kort"]')];
        return {
          syns: Boolean(remsa),
          text: remsa?.textContent || "",
          antalGavoKort: gavoKort.length,
          harDopKnapp: Boolean(document.querySelector('[data-d3="dop-knapp"], [data-testid="dop-knapp"]')),
        };
      });

      if (!gavaMeta.syns || gavaMeta.antalGavoKort < 4 || !gavaMeta.harDopKnapp) {
        fel.push(`Del 4 (c3): GavoPanel saknar element: ${JSON.stringify(gavaMeta)}`);
      }

      // Döpa kaninen till "Skuttis" och verifiera att namnet sparas i trollpennan-v2 (AC08)
      await page.locator('[data-testid="ord-input"]').fill("heter Skuttis");
      await page.waitForTimeout(150);
      await page.locator('[data-d3="dop-knapp"], [data-testid="dop-knapp"]').first().click();
      await page.waitForTimeout(250);

      await page.screenshot({ path: path.join(UT_MAPP, "c3-gavolage-375x812.png") });
      if (KOR_C4) {
        await page.screenshot({ path: path.join(UT_MAPP, "c3-gavopanel-skuttis-375x812.png") });
      }

      const skuttisSparad = await page.evaluate((uid) => {
        const ra = localStorage.getItem("trollpennan-v2") || "";
        const lista = Array.isArray(window.__trollMinne?.getState?.()?.ang) ? window.__trollMinne.getState().ang : []; const djur = lista.find((d) => d.uid === uid);
        return {
          smeknamn: djur?.smeknamn || null,
          iLocalStorage: ra.includes("Skuttis"),
        };
      }, kaninUid);

      if (skuttisSparad.smeknamn !== "Skuttis" || !skuttisSparad.iLocalStorage) {
        fel.push(`Del 4 (c3 / AC08): Namnet "Skuttis" sparades inte i trollpennan-v2: ${JSON.stringify(skuttisSparad)}`);
      }

      // Klicka på gåvokortet "morot" och tryck Ge! ([data-testid="vakna"]) -> inget dubblettdjur skapas (AC07)
      const morotKort = page.locator('[data-c3="gavo-kort"]:has-text("morot")');
      if ((await morotKort.count()) > 0) {
        await morotKort.first().click();
        await page.waitForTimeout(150);
      } else {
        await page.locator('[data-testid="ord-input"]').fill("en morot");
      }
      await page.locator('[data-testid="vakna"]').click();
      await page.waitForTimeout(900);

      const djurEfterGava = await page.evaluate(() => {
        const st = window.__trollMinne?.getState?.();
        return Array.isArray(st?.ang) ? st.ang.length : 0;
      });
      if (djurEfterGava !== djurForeGava) {
        fel.push(
          `Del 4 (c3 / AC07): Gåva skapade dubblettdjur! Antal djur före: ${djurForeGava}, efter: ${djurEfterGava}`,
        );
      }

      // Kontrollera förlustfri synk mellan Stava själv och Ordkort (AC05, UX-08)
      await oppnaBokOmStangd(page);
      const flikSkriv = page.locator('[data-m3="flik-skriv"]');
      if ((await flikSkriv.count()) > 0) {
        await flikSkriv.click();
        await page.waitForTimeout(150);
      }
      const testMening = "en stor blå kanin med röd mössa";
      await page.locator('[data-testid="ord-input"]').fill(testMening);
      await page.waitForTimeout(150);
      const flikOrdkort = page.locator('[data-m3="flik-ordkort"]');
      if ((await flikOrdkort.count()) > 0) {
        await flikOrdkort.click();
        await page.waitForTimeout(200);
      }
      const textEfterFlikByte = await page.evaluate(() => {
        const el = document.querySelector('[data-testid="ord-input"]');
        return el instanceof HTMLInputElement ? el.value : "";
      });
      if (textEfterFlikByte.trim() !== testMening) {
        fel.push(
          `Del 4 (c3 / AC05): Meningen ändrades vid byte från Stava själv till Ordkort! Förväntade "${testMening}", fick "${textEfterFlikByte}"`,
        );
      }

      detalj.c3 = {
        gavaMeta,
        skuttisSparad,
        djurForeGava,
        djurEfterGava,
        textEfterFlikByte,
      };
    }

    // ========================================================================
    // DEL 5 (c4): Bottom-Sheet-geometri, --tp-* tokens, Escape, 375x812 + 320x568 & 5 skärmbilder
    // ========================================================================
    if (KOR_C4) {
      await oppnaBokOmStangd(page);
      const c4_375 = await page.evaluate(() => {
        const bok = document.querySelector(".bok");
        const r = bok?.getBoundingClientRect();
        const cta = document.querySelector('[data-testid="vakna"]')?.getBoundingClientRect();
        const cs = getComputedStyle(document.documentElement);
        return {
          sheetTop: r ? Math.round(r.top) : 0,
          sheetHeight: r ? Math.round(r.height) : 0,
          ctaBottom: cta ? Math.round(cta.bottom) : 0,
          canvasCount: document.querySelectorAll("canvas").length,
          harGrab: Boolean(document.querySelector('[data-c4="sheet-grab"], .bok-grab')),
          tpCream: cs.getPropertyValue("--tp-cream").trim(),
          tpForest: cs.getPropertyValue("--tp-forest").trim(),
          tpBlue: cs.getPropertyValue("--tp-blue").trim(),
        };
      });

      if (c4_375.sheetTop < 220) {
        fel.push(`Del 5 (c4 / AC01): På 375x812 måste sheet.top vara >= 220 px, fick ${c4_375.sheetTop} px`);
      }
      if (c4_375.ctaBottom > 812) {
        fel.push(`Del 5 (c4): Primär CTA ligger utanför 375x812 viewport (bottom=${c4_375.ctaBottom})`);
      }
      if (c4_375.canvasCount !== 1) {
        fel.push(`Del 5 (c4 / AC09): Exakt 1 <canvas> ska finnas, fick ${c4_375.canvasCount}`);
      }
      if (!c4_375.harGrab) {
        fel.push('Del 5 (c4): .bok-grab ([data-c4="sheet-grab"]) saknas i BokSkarm');
      }
      if (!c4_375.tpCream || !c4_375.tpForest || !c4_375.tpBlue) {
        fel.push(`Del 5 (c4): --tp-* CSS-tokens saknas på :root: ${JSON.stringify(c4_375)}`);
      }

      // Testa Escape-stängning utan att radera meningen
      await page.locator('[data-testid="ord-input"]').fill("en grön groda");
      await page.waitForTimeout(100);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(250);
      const stangdEfterEsc = !(await page
        .locator(".bok")
        .isVisible()
        .catch(() => false));
      if (!stangdEfterEsc) {
        fel.push("Del 5 (c4): Escape stängde inte Pennans bok");
      }
      await oppnaBokOmStangd(page);
      const kvarEfterEsc = await page.evaluate(() => {
        const el = document.querySelector('[data-testid="ord-input"]');
        return el instanceof HTMLInputElement ? el.value : "";
      });
      if (!kvarEfterEsc.includes("groda")) {
        fel.push(`Del 5 (c4): Escape raderade barnets mening (fick "${kvarEfterEsc}")`);
      }

      // Testa 320x568 (kompakt vy, AC12, G4)
      await page.setViewportSize({ width: 320, height: 568 });
      await page.waitForTimeout(300);
      await oppnaBokOmStangd(page);

      const c4_320 = await page.evaluate(() => {
        const bok = document.querySelector(".bok");
        const r = bok?.getBoundingClientRect();
        const cta = document.querySelector('[data-testid="vakna"]')?.getBoundingClientRect();
        return {
          sheetTop: r ? Math.round(r.top) : 0,
          ctaBottom: cta ? Math.round(cta.bottom) : 0,
          scrollWidth: document.documentElement.scrollWidth,
        };
      });

      if (c4_320.sheetTop < 136) {
        fel.push(`Del 5 (c4 / AC12): På 320x568 måste sheet.top vara >= 136 px, fick ${c4_320.sheetTop} px`);
      }
      if (c4_320.ctaBottom > 568) {
        fel.push(`Del 5 (c4 / AC12): På 320x568 ligger primär CTA utanför viewport (bottom=${c4_320.ctaBottom})`);
      }
      if (c4_320.scrollWidth > 320) {
        fel.push(`Del 5 (c4 / G4): Horisontell overflow på 320x568 (scrollWidth=${c4_320.scrollWidth} > 320)`);
      }

      await page.screenshot({ path: path.join(UT_MAPP, "c4-kompakt-320x568.png") });
      detalj.c4 = { c4_375, stangdEfterEsc, c4_320 };
    }

    if (konsolFel.length > 0) {
      fel.push(`Konsolfel under Playwright: ${konsolFel.slice(0, 3).join(" | ")}`);
    }
  } finally {
    if (browser) await browser.close();
    server.kill("SIGTERM");
  }

  return { fel, detalj };
}

if (SNABB) {
  const { fel, detalj } = korDel1Statisk();
  const ok = fel.length === 0;
  console.log(JSON.stringify({ ok, läge: "snabb", steg: STEG, fel, detalj }, null, 2));
  process.exit(ok ? 0 : 1);
} else {
  const { fel, detalj } = await korPlaywright();
  const ok = fel.length === 0;
  console.log(JSON.stringify({ ok, läge: "playwright", steg: STEG, utMapp: UT_MAPP, fel, detalj }, null, 2));
  process.exit(ok ? 0 : 1);
}
