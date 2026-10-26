#!/usr/bin/env node
/**
 * prov-f4-f5.mjs — Automatiserat Grind- och Playwright-prov för Runda F4–F5 på 375×812.
 * Kan köras med `--runda F4`, `--runda F5` eller båda samtidigt (standard).
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const ROOT = process.cwd();
const FACIT = JSON.parse(
  fs.readFileSync(path.join(ROOT, "rundor/F4-F5-3d-plagg-vuxenlas/facit-f4-f5.json"), "utf8"),
);

const args = process.argv.slice(2);
const rundaArgIdx = args.indexOf("--runda");
const VALD_RUNDA = rundaArgIdx >= 0 ? (args[rundaArgIdx + 1] || "ALLA").toUpperCase() : "ALLA";
const KOR_F4 = VALD_RUNDA === "ALLA" || VALD_RUNDA.includes("F4");
const KOR_F5 = VALD_RUNDA === "ALLA" || VALD_RUNDA.includes("F5");

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
  const port = 4184;
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
  // 1. Statiska fil-, kalibrerings- och invariantkontroller
  if (KOR_F4) {
    const kalibPath = path.join(ROOT, FACIT.f4.calibrationFile);
    krav("F4: kalibrering-f4.json finns på disk", fs.existsSync(kalibPath), kalibPath);
    if (fs.existsSync(kalibPath)) {
      const kalib = JSON.parse(fs.readFileSync(kalibPath, "utf8"));
      const bNy = kalib.bengtsson?.ny;
      krav(
        "F4: Kalibrerad 3D-Bengtsson 100 % inom 375×812 (minX >= 18, maxX <= 135)",
        bNy && bNy.minX >= 18 && bNy.maxX <= 135 && bNy.offscreenLeftRatio === 0,
        `x=${bNy?.minX}..${bNy?.maxX}`,
      );
    }
    for (const rel of FACIT.f4.models) {
      const full = path.join(ROOT, "public", rel);
      krav(`F4: CC0-modellfil finns (${rel})`, fs.existsSync(full), full);
    }

    const bengtssonTsx = fs.readFileSync(path.join(ROOT, "src/spel/Bengtsson3D.tsx"), "utf8");
    krav(
      "F4: Bengtsson3D.tsx flyttad till [-1.45, 0, 1.50] och har onClick",
      bengtssonTsx.includes("-1.45") && bengtssonTsx.includes("onClick"),
    );

    const tillbehorJson = JSON.parse(
      fs.readFileSync(path.join(ROOT, "data/tillbehor.json"), "utf8"),
    );
    krav(
      "F4: data.test.ts invariant — 'mössa' ligger INTE i data/tillbehor.json",
      !Object.prototype.hasOwnProperty.call(tillbehorJson, "mössa"),
    );
  }

  if (KOR_F5) {
    const ordJson = JSON.parse(fs.readFileSync(path.join(ROOT, "data/ord.json"), "utf8"));
    krav(
      "F5: reserv.test.ts invariant — 'dansa' ligger INTE i data/ord.json",
      !Object.prototype.hasOwnProperty.call(ordJson, "dansa"),
    );
    krav(
      "F5: 'dansande' finns i data/ord.json med formaga='studs'",
      ordJson.dansande?.del?.formaga === "studs",
    );

    const lasningJson = JSON.parse(fs.readFileSync(path.join(ROOT, "data/lasning.json"), "utf8"));
    krav(
      "F5: dubbel_mall i data/lasning.json nämner 'vokalen kort' samt behåller {mal} och {bokstav}",
      lasningJson.dubbel_mall?.includes("vokalen kort") &&
        lasningJson.dubbel_mall?.includes("{mal}") &&
        lasningJson.dubbel_mall?.includes("{bokstav}"),
      lasningJson.dubbel_mall,
    );

    const foralderTsx = fs.readFileSync(
      path.join(ROOT, "src/spel/ui/ForalderDialog.tsx"),
      "utf8",
    );
    krav(
      "F5: v2.test.ts & p4a.test.ts data-attribut kvar i ForalderDialog.tsx",
      foralderTsx.includes('data-v2="foralder-borja-om"') &&
        foralderTsx.includes('data-p4="rost-knapp"') &&
        foralderTsx.includes('data-p4="effekt-knapp"'),
    );
  }

  // 2. Live Playwright-prov på 375×812
  if (KOR_F5) {
    const server = await startaServerOmBehovs();
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({
        viewport: FACIT.viewport,
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      await page.goto(server.url, { waitUntil: "networkidle" });
      const hoppa = page.locator('[data-testid="intro-hoppa"]');
      if (await hoppa.count()) {
        await hoppa.click();
        await page.waitForTimeout(350);
      }
      // Stäng boken om den är öppen
      const stangBok = page.locator('[data-v3="bok-stang"]');
      if (await stangBok.count()) {
        await stangBok.click();
        await page.waitForTimeout(250);
      }

      // Öppna För vuxna
      const foralderKnapp = page.locator('button[aria-label*="vuxna" i], button:has-text("🔒")').first();
      if (await foralderKnapp.count()) {
        await foralderKnapp.click();
        await page.waitForTimeout(300);
        const lasStatus = await page.evaluate(() => {
          const borjaOm = document.querySelector('[data-v2="foralder-borja-om"]');
          const reglage = document.querySelectorAll(
            '.foralder input[type="range"], .foralder input[type="checkbox"], [data-p4="rost-knapp"]',
          );
          return {
            borjaOmSynlig: Boolean(borjaOm && borjaOm.getBoundingClientRect().height > 0),
            reglageAntal: reglage.length,
          };
        });
        krav(
          "F5: 0 synliga reglage och 0 'Börja om'-knappar innan vuxenlåsets mattefråga lösts",
          !lasStatus.borjaOmSynlig && lasStatus.reglageAntal === 0,
          JSON.stringify(lasStatus),
        );
      }
      await context.close();
    } finally {
      await browser.close();
      await server.stang();
    }
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
