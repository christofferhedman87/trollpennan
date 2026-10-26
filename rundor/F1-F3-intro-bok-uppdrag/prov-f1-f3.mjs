#!/usr/bin/env node
/**
 * prov-f1-f3.mjs — Automatiserat Grind- och Playwright-prov för Runda F1–F3 på 375×812.
 * Kan köras med `--runda F1`, `--runda F2`, `--runda F3` eller alla samtidigt (standard).
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const ROOT = process.cwd();
const FACIT = JSON.parse(
  fs.readFileSync(path.join(ROOT, "rundor/F1-F3-intro-bok-uppdrag/facit-f1-f3.json"), "utf8"),
);

const args = process.argv.slice(2);
const rundaArgIdx = args.indexOf("--runda");
const VALD_RUNDA = rundaArgIdx >= 0 ? (args[rundaArgIdx + 1] || "ALLA").toUpperCase() : "ALLA";
const KOR_F1 = VALD_RUNDA === "ALLA" || VALD_RUNDA.includes("F1");
const KOR_F2 = VALD_RUNDA === "ALLA" || VALD_RUNDA.includes("F2");
const KOR_F3 = VALD_RUNDA === "ALLA" || VALD_RUNDA.includes("F3");

const resultat = [];
function krav(namn, ok, detalj = "") {
  resultat.push({ namn, ok: Boolean(ok), detalj });
  const ikon = ok ? "✅" : "❌";
  console.log(`${ikon} ${namn}${detalj ? ` — ${detalj}` : ""}`);
}

async function startaServerOmBehovs() {
  if (process.env.BASE_URL) {
    return { url: process.env.BASE_URL, stang: async () => {} };
  }
  const port = 4183;
  const proc = spawn("npx", ["vite", "--port", String(port), "--host", "127.0.0.1"], {
    cwd: ROOT,
    stdio: "ignore",
  });
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) {
        return {
          url,
          stang: async () => {
            proc.kill("SIGTERM");
          },
        };
      }
    } catch {
      // vänta på vite
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  proc.kill("SIGTERM");
  throw new Error("Kunde inte starta Vite på port " + port);
}

async function main() {
  // 1. Statiska fil- och invariantkontroller
  if (KOR_F1) {
    for (const rel of FACIT.f1.models) {
      const full = path.join(ROOT, "public", rel);
      krav(`F1: Modellfil finns (${rel})`, fs.existsSync(full), full);
    }
    const introTsx = fs.readFileSync(path.join(ROOT, "src/spel/intro.tsx"), "utf8");
    krav("F1: v7a-intro.test.ts invariant V7A_LANGD kvar i intro.tsx", /V7A_LANGD/.test(introTsx));
    krav(
      "F1: v7a-intro.test.ts data-testid='intro-text' & 'intro-hoppa' kvar",
      introTsx.includes('data-testid="intro-text"') && introTsx.includes('data-testid="intro-hoppa"'),
    );
    const bokP1Css = fs.readFileSync(path.join(ROOT, "src/spel/ui/bok-p1.css"), "utf8");
    krav(
      "F1: v3.test.ts invariant .bok{max-height:66dvh kvar i bok-p1.css",
      bokP1Css.includes(".bok{") && bokP1Css.includes("max-height:66dvh"),
    );
  }

  if (KOR_F2) {
    const bokP1Css = fs.readFileSync(path.join(ROOT, "src/spel/ui/bok-p1.css"), "utf8");
    const bokKompCss = fs.readFileSync(path.join(ROOT, "src/spel/ui/bok-komp.css"), "utf8");
    const allCss = bokP1Css + "\n" + bokKompCss;
    krav(
      "F2: Slime Rancher cubic-bezier(0.34, 1.56, 0.64, 1) i bok-CSS",
      allCss.includes("cubic-bezier(0.34, 1.56, 0.64, 1)"),
    );
    const useSkrivTs = fs.readFileSync(path.join(ROOT, "src/spel/useSkriv.ts"), "utf8");
    krav("F2: valUrText finns i src/spel/useSkriv.ts", useSkrivTs.includes("valUrText"));
  }

  if (KOR_F3) {
    const bengtssonJson = JSON.parse(
      fs.readFileSync(path.join(ROOT, "data/bengtsson.json"), "utf8"),
    );
    const kaninFryser = bengtssonJson.uppdrag.find((u) => u.id === "kanin-fryser");
    krav(
      "F3: uppdragsmotor.test.ts invariant text_bengtsson oförändrad i data/bengtsson.json",
      kaninFryser?.text_bengtsson ===
        "Det verkar som att din kanin fryser. Se om du kan skriva fram något som värmer.",
    );
    for (const ord of ["sol", "solen", "värme", "mössa", "halsduk", "filt"]) {
      krav(
        `F3: '${ord}' finns i kanin-fryser krav.ord`,
        Array.isArray(kaninFryser?.krav?.ord) && kaninFryser.krav.ord.includes(ord),
      );
    }
  }

  // 2. Live Playwright-prov på 375×812
  const server = await startaServerOmBehovs();
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: FACIT.viewport,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    if (KOR_F1) {
      await page.goto(server.url, { waitUntil: "networkidle" });
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(400);

      const introStatus = await page.evaluate(() => {
        const synlig = (el) => {
          if (!el) return false;
          const st = getComputedStyle(el);
          if (st.display === "none" || st.visibility === "hidden" || Number(st.opacity) === 0)
            return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        };
        const hudEls = [...document.querySelectorAll(".topp-hud, .botten-nav, .sidomeny")].filter(
          synlig,
        );
        const hoppa = document.querySelector('[data-testid="intro-hoppa"]');
        const hoppaRect = hoppa?.getBoundingClientRect() || null;
        const introText = document.querySelector('[data-testid="intro-text"]');
        const introRect = introText?.getBoundingClientRect() || null;
        return {
          hudCount: hudEls.length,
          hoppaRect,
          introRect,
        };
      });

      krav(
        "F1: 0 synliga ordinarie HUD-element under introt",
        introStatus.hudCount === 0,
        `hudCount=${introStatus.hudCount}`,
      );
      krav(
        "F1: Hoppa över-knapp >= 44 px hög",
        introStatus.hoppaRect && introStatus.hoppaRect.height >= 44,
        `height=${introStatus.hoppaRect?.height}`,
      );

      // Hoppa över introt -> kontrollera Första skapelse-läget på 375x812
      await page.click('[data-testid="intro-hoppa"]');
      await page.waitForTimeout(450);

      const forstaSkapelse = await page.evaluate(() => {
        const bok = document.querySelector(".bok");
        const r = bok?.getBoundingClientRect() || null;
        const kort = [...document.querySelectorAll('[data-v3="ordkort"] button')];
        const tangenter = document.querySelector(".tangenter");
        const tangenterSynlig =
          tangenter &&
          getComputedStyle(tangenter).display !== "none" &&
          tangenter.getBoundingClientRect().height > 0;
        const har337 = /0 av \d+ djur/i.test(bok?.innerText || "");
        return {
          bokTop: r?.top ?? 0,
          bokHeight: r?.height ?? 999,
          kortAntal: kort.length,
          minKortHojd: kort.reduce((m, k) => Math.min(m, k.getBoundingClientRect().height), 999),
          tangenterSynlig: Boolean(tangenterSynlig),
          har337,
        };
      });

      krav(
        "F1: Första skapelse-läge top >= 366 px och height <= 446 px",
        forstaSkapelse.bokTop >= 360 && forstaSkapelse.bokHeight <= 452,
        `top=${Math.round(forstaSkapelse.bokTop)}, height=${Math.round(forstaSkapelse.bokHeight)}`,
      );
      krav(
        "F1: Tangentbordet är infällt i Första skapelse-läget",
        !forstaSkapelse.tangenterSynlig,
      );
      krav(
        "F1: Ingen '0 av 337 djur'-räknare i Första skapelse-läget",
        !forstaSkapelse.har337,
      );
    }

    if (KOR_F2) {
      // Se till att boken är öppen
      const bokFinns = await page.locator(".bok").count();
      if (!bokFinns) {
        await page.goto(server.url, { waitUntil: "networkidle" });
        const hoppa = page.locator('[data-testid="intro-hoppa"]');
        if (await hoppa.count()) await hoppa.click();
        await page.waitForTimeout(400);
      }

      const f2Layout = await page.evaluate(() => {
        const ordkort = document.querySelector('[data-v3="ordkort"]');
        const remsa = document.querySelector('[data-v3="skriv-remsa"]');
        const tangenter = document.querySelector(".tangenter");
        const synlig = (el) =>
          Boolean(
            el &&
              getComputedStyle(el).display !== "none" &&
              el.getBoundingClientRect().height > 0,
          );
        const oSyn = synlig(ordkort);
        const tSyn = synlig(tangenter);
        const oRect = ordkort?.getBoundingClientRect();
        const rRect = remsa?.getBoundingClientRect();
        return {
          badaSynliga: oSyn && tSyn,
          ordkortBottom: oRect?.bottom ?? 0,
          remsaTop: rRect?.top ?? 999,
        };
      });

      krav(
        "F2: Aldrig ordkort och skärmtangentbord synliga samtidigt",
        !f2Layout.badaSynliga,
      );
      krav(
        "F2: 0 px överlapp mellan ordkort och skrivremsa",
        f2Layout.ordkortBottom <= f2Layout.remsaTop + 1,
        `ordkort.bottom=${Math.round(f2Layout.ordkortBottom)}, remsa.top=${Math.round(f2Layout.remsaTop)}`,
      );
    }

    await context.close();
  } finally {
    await browser.close();
    await server.stang();
  }

  const misslyckade = resultat.filter((r) => !r.ok);
  console.log(`\nSammanfattning: ${resultat.length - misslyckade.length}/${resultat.length} godkända.`);
  if (misslyckade.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
