#!/usr/bin/env node
/**
 * prov-s1-s3.mjs — Snabbprov (--snabb) och full Playwright-kontroll på 375×812 för Runda S1, S2 och S3.
 * Körning:
 *   node rundor/S1-S3-slime-varld-ansikten-largo/prov-s1-s3.mjs --snabb --del s1|s2|s3|alla
 *   node rundor/S1-S3-slime-varld-ansikten-largo/prov-s1-s3.mjs --del s1|s2|s3|alla [--ut /tmp/s1-s3-bilder]
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const ROOT = process.cwd();
const FACIT = JSON.parse(
  fs.readFileSync(path.join(ROOT, "rundor/S1-S3-slime-varld-ansikten-largo/facit-s1-s3.json"), "utf8"),
);

const args = process.argv.slice(2);
const SNABB = args.includes("--snabb");
const delIdx = args.indexOf("--del");
const DEL = (delIdx >= 0 ? args[delIdx + 1] || "alla" : "alla").toLowerCase();
const utIdx = args.indexOf("--ut");
const UT_MAPP = utIdx >= 0 ? args[utIdx + 1] : "/tmp/s1-s3-bilder";

const KOR_S1 = DEL === "alla" || DEL === "s1" || DEL === "1";
const KOR_S2 = DEL === "alla" || DEL === "s2" || DEL === "2";
const KOR_S3 = DEL === "alla" || DEL === "s3" || DEL === "3";

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
  const detalj = { s1: {}, s2: {}, s3: {} };

  // Filstorleksvakt <= 400 rader på berörda källfiler
  for (const f of [
    "src/spel/Spel.tsx",
    "src/spel/belys.ts",
    "src/spel/ang/PlatsDekor.tsx",
    "src/spel/ang/himmel.tsx",
    "src/spel/tillbehor/AnsiktsUttryck.tsx",
    "src/spel/tillbehor/largo.ts",
    "src/spel/tillbehor/faest.ts",
    "src/spel/gard/MarkPlan.tsx",
  ]) {
    const n = rader(f);
    if (n > 400) fel.push(`${f} är ${n} rader (> 400)`);
  }

  if (KOR_S1) {
    for (const m of FACIT.s1.models) {
      if (!fs.existsSync(path.join(ROOT, "public", m))) {
        fel.push(`S1: CC0-modell saknas: public/${m}`);
      }
    }
    const belysTs = lasText("src/spel/belys.ts") + "\n" + lasText("src/spel/mjukGeometri.ts");
    const djurTsx = lasText("src/spel/ang/djur.tsx");
    const dekorTsx = lasText("src/spel/ang/dekor.tsx");
    const hudCss = lasText("src/spel/ui/hud-p2.css") + "\n" + lasText("src/styles.css");
    const platserJson = lasText("data/platser.json");

    const harSlimeGlod =
      belysTs.includes("appliceraSlimeGlod") &&
      belysTs.includes(FACIT.s1.cacheKey) &&
      belysTs.includes("onBeforeCompile");
    if (!harSlimeGlod) {
      fel.push(`S1: appliceraSlimeGlod med customProgramCacheKey '${FACIT.s1.cacheKey}' saknas i src/spel/belys.ts`);
    }

    const harToon124 = /Uint8Array\(\[\s*12[48]\b/.test(djurTsx);
    if (!harToon124) {
      fel.push("S1: TOON_MAP i src/spel/ang/djur.tsx har inte lyfts till >= 124 i första steget");
    }

    const harVindGras = dekorTsx.includes("VindGras") && dekorTsx.includes("Solkorn");
    if (!harVindGras) {
      fel.push("S1: <VindGras /> och <Solkorn /> saknas i src/spel/ang/dekor.tsx");
    }

    const harKantigFjarilEllerTrad =
      dekorTsx.includes("args={[0.08, 0.18, 3]}") ||
      dekorTsx.includes("args={[0.85, 7, 6]}");
    if (harKantigFjarilEllerTrad) {
      fel.push("S1: src/spel/ang/dekor.tsx har fortfarande 3-kantiga fjärilskoner (args={[0.08, 0.18, 3]}) eller 7-segments trädkronor (args={[0.85, 7, 6]})");
    }

    const harSlimePalett = platserJson.includes("slimePalett");
    if (!harSlimePalett) {
      fel.push("S1: slimePalett för de 5 biomerna saknas i data/platser.json");
    }

    const harHudKontur = /#3B2F2F/i.test(hudCss) && /#FFF6E5/i.test(hudCss);
    if (!harHudKontur) {
      fel.push("S1: HUD-piller med #FFF6E5 och 2px solid #3B2F2F saknas i src/spel/ui/hud-p2.css");
    }

    const harMjukrunda = belysTs.includes("mjukrundaScen") && belysTs.includes("toCreasedNormals");
    if (!harMjukrunda) {
      fel.push("S1: mjukrundaScen med toCreasedNormals saknas i src/spel/mjukGeometri.ts / src/spel/belys.ts");
    }

    detalj.s1 = { harSlimeGlod, harMjukrunda, harMjukaTradOchFjarilar: !harKantigFjarilEllerTrad, harToon124, harVindGras, harSlimePalett, harHudKontur };
  }

  if (KOR_S2) {
    for (const m of FACIT.s2.models || []) {
      if (!fs.existsSync(path.join(ROOT, "public", m))) {
        fel.push(`S2: Rundad CC0-djurmodell saknas: public/${m}`);
      }
    }
    const entiteterJson = lasText("data/entiteter.json");
    const entiteterTs = lasText("src/spel/entiteter.ts");
    const harRundDjur = entiteterJson.includes("s-djur-kanin-rund") && entiteterJson.includes("s-djur-gris-rund") && (entiteterTs.includes("djurGltfUrl") || entiteterTs.includes("rundModell"));
    if (!harRundDjur) {
      fel.push("S2: De 15 rundade s-djur-*-modellerna (rundModell / djurGltfUrl) är ännu inte inkopplade i data/entiteter.json & src/spel/entiteter.ts");
    }
    const uttryckTsx = lasText(FACIT.s2.uttryckFil);
    const gltfDjurTsx = lasText("src/spel/gltfDjur.tsx");
    const faestTs = lasText("src/spel/tillbehor/faest.ts");

    if (!uttryckTsx) {
      fel.push(`S2: ${FACIT.s2.uttryckFil} saknas`);
    } else {
      for (const h of FACIT.s2.humorTillstand) {
        if (!uttryckTsx.includes(`"${h}"`)) {
          fel.push(`S2: AnsiktsUttryck.tsx saknar humörtillståndet "${h}"`);
        }
      }
      if (!uttryckTsx.includes("#F48FB1") || !uttryckTsx.includes("uttryck")) {
        fel.push("S2: AnsiktsUttryck.tsx saknar rosa kinder (#F48FB1) eller par: 'uttryck'");
      }
    }

    const harSignalHumor = gltfDjurTsx.includes("DjurHumör") || gltfDjurTsx.includes("humör?:");
    if (!harSignalHumor) {
      fel.push("S2: DjurSignal i src/spel/gltfDjur.tsx saknar humör-fältet");
    }

    const harUserDataAnkare = faestTs.includes("userData.ankare");
    if (!harUserDataAnkare) {
      fel.push("S2: faestTillbehor i src/spel/tillbehor/faest.ts sparar inte rot.userData.ankare");
    }

    detalj.s2 = { harRundDjur, harUttryckFil: Boolean(uttryckTsx), harSignalHumor, harUserDataAnkare };
  }

  if (KOR_S3) {
    for (const m of FACIT.s3.models) {
      if (!fs.existsSync(path.join(ROOT, "public", m))) {
        fel.push(`S3: CC0-modell saknas: public/${m}`);
      }
    }
    const kalibPath = path.join(ROOT, FACIT.s3.kalibreringFil);
    if (!fs.existsSync(kalibPath)) {
      fel.push(`S3: Kalibreringsfil saknas: ${FACIT.s3.kalibreringFil}`);
    } else {
      const kalib = JSON.parse(fs.readFileSync(kalibPath, "utf8"));
      if (!Object.values(kalib.kravUppfyllda || {}).every(Boolean)) {
        fel.push("S3: kalibrering-s3.json har ej alla kravUppfyllda = true");
      }
    }

    const largoTs = lasText(FACIT.s3.largoFil);
    const djurTsx = lasText("src/spel/ang/djur.tsx");
    const vandraTs = lasText("src/spel/gard/vandra.ts");

    const harLargo =
      largoTs.includes("largoSkala") &&
      largoTs.includes("1.25") &&
      largoTs.includes("1.18");
    if (!harLargo) {
      fel.push(`S3: ${FACIT.s3.largoFil} med largoSkala [1.25, 1.18, 1.25] saknas`);
    }

    const harStegMotMal =
      (djurTsx + "\n" + vandraTs + "\n" + largoTs).includes("stegMotMalPunkt") ||
      (djurTsx.includes("malPunkt") && vandraTs.includes("malWx"));
    if (!harStegMotMal) {
      fel.push("S3: 2D-skuttlösare stegMotMalPunkt / malPunkt saknas i djur.tsx / vandra.ts");
    }

    detalj.s3 = { harLargo, harStegMotMal };
  }

  return { ok: fel.length === 0, antalFel: fel.length, fel, detalj };
}

async function startaServer() {
  if (process.env.BASE_URL) {
    return { url: process.env.BASE_URL, stang: async () => {} };
  }
  const port = 4195;
  const proc = spawn("npx", ["vite", "--port", String(port), "--host", "127.0.0.1"], {
    cwd: ROOT,
    stdio: "ignore",
  });
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) {
        return { url, stang: async () => proc.kill("SIGTERM") };
      }
    } catch {
      // vänta
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  proc.kill("SIGTERM");
  throw new Error("Kunde inte starta Vite på port " + port);
}

async function main() {
  const snabbRes = korSnabbKontroll();
  if (SNABB) {
    console.log(JSON.stringify(snabbRes, null, 2));
    process.exit(snabbRes.ok ? 0 : 1);
  }

  const fel = [...snabbRes.fel];
  fs.mkdirSync(UT_MAPP, { recursive: true });
  const server = await startaServer();
  const browser = await chromium.launch({ headless: true });

  try {
    // Egen isolerad browser-sida per delblock på 375×812
    if (KOR_S1) {
      const ctx = await browser.newContext({ viewport: FACIT.viewport, deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      const pageErrors = [];
      page.on("pageerror", (e) => pageErrors.push(String(e)));

      await page.goto(server.url, { waitUntil: "networkidle" });
      const hoppa = page.locator('[data-testid="intro-hoppa"]');
      if (await hoppa.count()) await hoppa.click();
      await page.waitForTimeout(350);
      const stangBok = page.locator('[data-v3="bok-stang"]');
      if (await stangBok.count()) await stangBok.click();
      await page.waitForTimeout(450);

      const s1Matt = await page.evaluate(() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const stjarn = document.querySelector('[data-testid="stjarnor"]');
        const r = stjarn?.getBoundingClientRect();
        return {
          scrollWidth,
          stjarnWidth: r?.width ?? 0,
          stjarnHeight: r?.height ?? 0,
        };
      });
      if (s1Matt.scrollWidth > 375) fel.push(`S1: Horisontellt utspill (${s1Matt.scrollWidth} > 375)`);
      if (s1Matt.stjarnHeight < 44) fel.push(`S1: HUD-piller höjd < 44 px (${s1Matt.stjarnHeight})`);
      if (pageErrors.length > 0) fel.push(`S1: pageerror: ${pageErrors.join("; ")}`);

      await page.screenshot({ path: path.join(UT_MAPP, "s1-slime-varld.png") });
      await ctx.close();
    }

    if (KOR_S2) {
      const ctx = await browser.newContext({ viewport: FACIT.viewport, deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      await page.goto(server.url, { waitUntil: "networkidle" });
      const hoppa = page.locator('[data-testid="intro-hoppa"]');
      if (await hoppa.count()) await hoppa.click();
      await page.waitForTimeout(450);
      await page.screenshot({ path: path.join(UT_MAPP, "s2-ansiktsuttryck.png") });
      await ctx.close();
    }

    if (KOR_S3) {
      const ctx = await browser.newContext({ viewport: FACIT.viewport, deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      await page.goto(server.url, { waitUntil: "networkidle" });
      const hoppa = page.locator('[data-testid="intro-hoppa"]');
      if (await hoppa.count()) await hoppa.click();
      await page.waitForTimeout(450);
      await page.screenshot({ path: path.join(UT_MAPP, "s3-largo-leksak.png") });
      await ctx.close();
    }
  } finally {
    await browser.close();
    await server.stang();
  }

  const ut = { ok: fel.length === 0, antalFel: fel.length, fel, bilderMapp: UT_MAPP };
  console.log(JSON.stringify(ut, null, 2));
  process.exit(ut.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
