#!/usr/bin/env node
// Verifieringsprov för Blockserie W (W1–W4: Copilots v0.9 Levande Värld, Grafik, Vägvisare & Introflygning)
// Stöder: --snabb, --steg=w1|w2|w3|w4|all|alla, --ut <mapp>

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith(".tsx")) {
      const src = fs.readFileSync(fileURLToPath(url), "utf8");
      const out = ts.transpileModule(src, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      });
      return { format: "module", shortCircuit: true, source: out.outputText };
    }
    return nextLoad(url, context);
  },
});
import { chromium } from "playwright";

import { belysScen } from "../../src/spel/belys.ts";
import { sammanhallenRostText } from "../../src/spel/rost.ts";
import { rostPlan } from "../../src/spel/rostManifest.ts";

const args = process.argv.slice(2);
const snabb = args.includes("--snabb");
const rawSteg = args.find((a) => a.startsWith("--steg="))?.split("=")[1] ?? "all";
const steg = rawSteg === "alla" ? "all" : rawSteg;
const utIdx = args.indexOf("--ut");
const utMapp = utIdx >= 0 && args[utIdx + 1] ? path.resolve(args[utIdx + 1]) : null;

const ROT = process.cwd();
const las = (p) => fs.readFileSync(path.join(ROT, p), "utf8");
const finns = (p) => fs.existsSync(path.join(ROT, p));

function skaKora(s) {
  return steg === "all" || steg === s;
}

function samlaSpelFiler(dir) {
  const ut = [];
  for (const post of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, post.name);
    if (post.isDirectory()) ut.push(...samlaSpelFiler(p));
    else if (/\.(ts|tsx|css)$/.test(post.name)) ut.push(p);
  }
  return ut;
}

const NYA_W_FILER = [
  "src/spel/grafikKvalitet.ts",
  "src/spel/ang/HorisontVarld.tsx",
  "src/spel/ang/vagvisareProjektion.ts",
  "src/spel/ang/Vagvisare3D.tsx",
  "src/spel/ui/resAdapterV09.ts",
  "src/spel/ui/ResOvergangV09.tsx",
  "src/spel/ui/useVagvisareResaV09.ts",
  "src/spel/ui/plats-resa-v09.css",
  "src/spel/ang/introFlygFas.ts",
  "src/spel/ang/IntroKameraV09.tsx",
  "src/spel/ang/IntroFlygning.tsx",
  "src/spel/ang/FlygKameraV09.tsx",
  "src/spel/ang/VarldsIntegrationV09.tsx",
];

const ANDRADE_W_FILER = [
  "src/spel/belys.ts",
  "src/spel/angen3d.tsx",
  "src/spel/gard/Garden3D.tsx",
  "src/spel/ang/djur.tsx",
  "src/spel/kenneyNatur.tsx",
  "src/spel/ang/byggnader.tsx",
  "src/spel/ui/SpelVy.tsx",
  "src/spel/rost.ts",
  "src/spel/ang/saga.tsx",
];

function korBasKontroller(fel, detalj) {
  // AC-W01: Alla nya filer i W1-W4 <= 380 rader och alla ändrade befintliga filer <= 400 rader
  for (const rel of NYA_W_FILER) {
    if (!finns(rel)) continue;
    const txt = las(rel);
    const rader = txt.split("\n").length - (txt.endsWith("\n") ? 1 : 0);
    if (rader > 380) fel.push(`AC-W01: ny fil ${rel} har ${rader} rader (> 380)`);
  }
  for (const rel of ANDRADE_W_FILER) {
    if (!finns(rel)) continue;
    const txt = las(rel);
    const rader = txt.split("\n").length - (txt.endsWith("\n") ? 1 : 0);
    if (rader > 400) fel.push(`AC-W01: ${rel} har ${rader} rader (> 400)`);
  }
  // AC-W02: Exakt 174 unika data-testid och 179 förekomster enligt testid-baslinje.json
  const bas = JSON.parse(las("rundor/R1-dela-spel/testid-baslinje.json"));
  const rakna = {};
  for (const f of samlaSpelFiler(path.join(ROT, "src/spel")).filter((x) => x.endsWith(".tsx"))) {
    const sf = ts.createSourceFile(f, fs.readFileSync(f, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    (function besok(n) {
      if (ts.isJsxAttribute(n) && n.name.getText() === "data-testid" && n.initializer) {
        const nyckel = n.initializer.getText();
        rakna[nyckel] = (rakna[nyckel] ?? 0) + 1;
      }
      ts.forEachChild(n, besok);
    })(sf);
  }
  detalj.unikaTestId = Object.keys(rakna).length;
  detalj.totaltTestId = Object.values(rakna).reduce((a, b) => a + b, 0);
  for (const k of new Set([...Object.keys(bas), ...Object.keys(rakna)])) {
    if ((bas[k] ?? 0) !== (rakna[k] ?? 0)) {
      fel.push(`AC-W02: data-testid ${k}: baslinje ${bas[k] ?? 0}, nu ${rakna[k] ?? 0}`);
    }
  }
}

async function korW1Statiska(fel, detalj) {
  if (!finns("src/spel/grafikKvalitet.ts")) {
    fel.push("AC-W04: src/spel/grafikKvalitet.ts saknas");
    return;
  }
  const gk = las("src/spel/grafikKvalitet.ts");
  for (const fn of ["skapaSagomiljoTextur", "useSagomiljo", "forbattraModellMaterial", "skapaKontaktSkugga", "frigoraKontaktSkugga"]) {
    if (!gk.includes(fn)) fel.push(`AC-W04: src/spel/grafikKvalitet.ts saknar ${fn}`);
  }
  const belys = las("src/spel/belys.ts");
  if (!belys.includes("trollpennan-slime-rim-v1")) fel.push("AC-W03: belys.ts saknar trollpennan-slime-rim-v1");
  if (!/0\.52/.test(belys) || !/smoothstep/.test(belys)) {
    fel.push("AC-W04: belys.ts saknar Half-Lambert (0.52) eller Fresnel (smoothstep)");
  }
  const miljo = JSON.parse(las("data/miljo.json"));
  if (miljo.himmel?.horisont !== "#718957" || miljo.himmel?.zenit !== "#DCCB9B" || miljo.dimma?.farg !== "#8A8595") {
    fel.push("AC-W03: data/miljo.json-nycklar (#718957, #DCCB9B, #8A8595) har ändrats");
  }
  const mod = await import("../../src/spel/grafikKvalitet.ts");
  const g = new THREE.Group();
  const m1 = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ roughness: 0.1, metalness: 0.9 }),
  );
  g.add(m1);
  belysScen(g);
  mod.forbattraModellMaterial(g);
  const mat = m1.material;
  if (mat.roughness < 0.45 || mat.roughness > 0.95 || mat.metalness > 0.28) {
    fel.push(`AC-W04: materialklämning felaktig (roughness=${mat.roughness}, metalness=${mat.metalness})`);
  }
  const s1 = mod.skapaKontaktSkugga(0.65);
  const s2 = mod.skapaKontaktSkugga(0.8);
  if (s1.material !== s2.material) {
    fel.push("AC-W04: skapaKontaktSkugga återanvänder inte delat material/textur");
  }
  mod.frigoraKontaktSkugga(s1);
  mod.frigoraKontaktSkugga(s2);
  detalj.w1StatiskOk = true;
}

async function korW2Statiska(fel, detalj) {
  if (!finns("src/spel/ang/HorisontVarld.tsx")) {
    fel.push("AC-W06: src/spel/ang/HorisontVarld.tsx saknas");
    return;
  }
  const hv = las("src/spel/ang/HorisontVarld.tsx");
  if (hv.includes("useGLTF.preload(")) {
    fel.push("AC-W03: HorisontVarld.tsx får inte anropa useGLTF.preload(");
  }
  if (hv.includes("<sphereGeometry")) {
    fel.push("AC-W06: HorisontVarld.tsx får inte använda <sphereGeometry>-klot för kullar");
  }
  const kn = las("src/spel/kenneyNatur.tsx");
  if (/\buseFrame\b/.test(kn)) {
    fel.push("AC-W03: src/spel/kenneyNatur.tsx får aldrig innehålla useFrame");
  }
  const mod = await import("../../src/spel/ang/HorisontVarld.tsx");
  const pos = mod.horisontPositioner();
  if (!Array.isArray(pos) || pos.length < 16) {
    fel.push(`AC-W07: horisontPositioner() har för få punkter (${pos?.length ?? 0})`);
  } else {
    const zoner = new Set();
    for (const p of pos) {
      zoner.add(p.zon);
      const r = Math.hypot(p.x, p.z);
      if (r < (mod.MIN_HORISONT_RADIE ?? 5.2)) {
        fel.push(`AC-W07: horisontpunkt i ${p.zon} ligger för nära Ängen (r=${r.toFixed(2)} < 5.2)`);
      }
    }
    for (const z of ["skogen", "sjon", "grottan", "garden"]) {
      if (!zoner.has(z)) fel.push(`AC-W06: horisontPositioner() saknar zon ${z}`);
    }
  }
  detalj.w2StatiskOk = true;
}

async function korW3Statiska(fel, detalj) {
  for (const p of [
    "src/spel/ang/vagvisareProjektion.ts",
    "src/spel/ang/Vagvisare3D.tsx",
    "src/spel/ui/resAdapterV09.ts",
    "src/spel/ui/ResOvergangV09.tsx",
    "src/spel/ui/useVagvisareResaV09.ts",
    "src/spel/ui/plats-resa-v09.css",
  ]) {
    if (!finns(p)) {
      fel.push(`AC-W08: ${p} saknas`);
      return;
    }
  }
  const v3d = las("src/spel/ang/Vagvisare3D.tsx");
  if (v3d.includes("<boxGeometry")) {
    fel.push("AC-W08 (Regel 3): Vagvisare3D.tsx får inte innehålla <boxGeometry>");
  }
  if (!v3d.includes("/models/bulk/w-vagvisare-cc0.glb")) {
    fel.push("AC-W08: Vagvisare3D.tsx ska använda /models/bulk/w-vagvisare-cc0.glb");
  }
  const proj = await import("../../src/spel/ang/vagvisareProjektion.ts");
  const p0 = proj.projiceraVagvisare({ x: 0, y: 0, z: 0.4 }, 375, 812);
  if (!p0 || Math.abs(p0.x - 187.5) > 2) fel.push("AC-W08: projiceraVagvisare centrerar inte NDC (0,0)");
  if (proj.projiceraVagvisare({ x: 0, y: 0, z: 1.3 }, 375, 812) !== null) {
    fel.push("AC-W08: projiceraVagvisare ska returnera null bakom kameran (z > 1)");
  }
  const resMod = await import("../../src/spel/ui/resAdapterV09.ts");
  const anrop = [];
  resMod.utforPlatsResaV09("skogen", {
    varld: "ang",
    nuvarandePlats: "ang",
    valjVarld: (v) => anrop.push(`varld:${v}`),
    resTill: (p) => anrop.push(`res:${p}`),
    hem: () => anrop.push("hem"),
  });
  resMod.utforPlatsResaV09("garden", {
    varld: "ang",
    nuvarandePlats: "ang",
    valjVarld: (v) => anrop.push(`varld:${v}`),
    resTill: (p) => anrop.push(`res:${p}`),
    hem: () => anrop.push("hem"),
  });
  if (anrop.join(",") !== "res:skogen,varld:gard") {
    fel.push(`AC-W10: utforPlatsResaV09 gav oväntade anrop: ${anrop.join(",")}`);
  }
  for (const fras of [
    "På väg hem till Ängen…",
    "På väg till Glittrande skogen…",
    "På väg till Dimsjön…",
    "På väg till Kristallgrottan…",
    "På väg till Gården…",
  ]) {
    const p = rostPlan(sammanhallenRostText(fras));
    if (!p || p.dynamisk) fel.push(`W3 röst: "${fras}" saknar förinspelad MP3-plan`);
  }
  detalj.w3StatiskOk = true;
}

async function korW4Statiska(fel, detalj) {
  for (const p of [
    "src/spel/ang/introFlygFas.ts",
    "src/spel/ang/IntroKameraV09.tsx",
    "src/spel/ang/IntroFlygning.tsx",
    "src/spel/ang/FlygKameraV09.tsx",
    "src/spel/ang/VarldsIntegrationV09.tsx",
  ]) {
    if (!finns(p)) {
      fel.push(`AC-W11: ${p} saknas`);
      return;
    }
  }
  const ik = await import("../../src/spel/ang/IntroKameraV09.tsx");
  const start = ik.beraknaIntroKamera(0);
  const slut = ik.beraknaIntroKamera(2.4);
  if (start.pos[1] < 11 || start.pos[2] < 15) {
    fel.push(`AC-W11: beraknaIntroKamera(0) startar för lågt: ${JSON.stringify(start.pos)}`);
  }
  if (slut.pos[1] > 4.5 || slut.pos[2] > 10.2) {
    fel.push(`AC-W11: beraknaIntroKamera(2.4) landar inte på Ängen: ${JSON.stringify(slut.pos)}`);
  }
  const saga = las("src/spel/ang/saga.tsx");
  if (!saga.includes("14.5") || !saga.includes("22")) {
    fel.push("AC-W11: src/spel/ang/saga.tsx har inte uppdaterat KAM-start till dalöversikten [0, 14.5, 22]");
  }
  detalj.w4StatiskOk = true;
}

async function vantaPaUrl(url, maxMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const r = await fetch(url);
      if (r.ok) return true;
    } catch {
      // Väntar på Vite
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

function rektOverlapp(a, b) {
  const x = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return x * y;
}

async function stangTitelOchIntro(page) {
  for (let i = 0; i < 6; i++) {
    const startKnapp = page.locator('[data-testid="titel-starta"], button:has-text("Börja spela"), button:has-text("Spela")').first();
    if (await startKnapp.isVisible().catch(() => false)) {
      await startKnapp.click({ force: true });
      await page.waitForTimeout(300);
    }
    const hoppa = page.locator('[data-testid="intro-hoppa"], [data-testid="intro-hoppa-over"], button:has-text("Hoppa över")').first();
    if (await hoppa.isVisible().catch(() => false)) {
      await hoppa.click({ force: true });
      await page.waitForTimeout(350);
    }
    const platsStang = page.locator('[data-testid="plats-intro-stang"], button:has-text("Sätt igång")').first();
    if (await platsStang.isVisible().catch(() => false)) {
      await platsStang.click({ force: true });
      await page.waitForTimeout(300);
    }
  }
}

async function korPlaywright(fel, detalj) {
  if (utMapp) fs.mkdirSync(utMapp, { recursive: true });
  const port = 4193;
  const basUrl = process.env.SPEL_URL || `http://localhost:${port}`;
  let srv = null;
  if (!process.env.SPEL_URL) {
    srv = spawn("npx", ["vite", "--port", String(port), "--strictPort"], { cwd: ROT, stdio: "ignore" });
  }
  let browser;
  const skarmbilder = [];
  const spara = async (page, namn) => {
    if (!utMapp) return;
    await page.screenshot({ path: path.join(utMapp, namn) });
    skarmbilder.push(namn);
  };

  try {
    const uppe = await vantaPaUrl(basUrl, 15000);
    if (!uppe) {
      fel.push(`Playwright: Vite svarade inte på ${basUrl}`);
      return;
    }
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();

    await page.addInitScript(() => {
      localStorage.setItem(
        "trollpennan-v2",
        JSON.stringify({
          state: {
            introKlar: true,
            forstaSkapelse: true,
            stjarnor: 15,
            ang: [{ uid: "kanin-1", kropp: "kanin", farg: "blå", smeknamn: "Skuttis" }],
          },
          version: 2,
        }),
      );
    });

    await page.goto(`${basUrl}/?prov=1`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(1000);
    await page.waitForFunction(() => Boolean(window.__tred), null, { timeout: 12000 }).catch(() => {});
    await stangTitelOchIntro(page);
    await page.waitForTimeout(900);

    // W1 & W2: Kontrollera WebGL-budget och horisontbiomer
    if (skaKora("w1") || skaKora("w2")) {
      const tred = await page.evaluate(() => window.__tred ?? null);
      detalj.tred = tred;
      if (!tred) fel.push("AC-W05: window.__tred saknas");
      else {
        if (tred.calls > 95) fel.push(`AC-W05: draw calls ${tred.calls} > 95`);
        if (tred.tris > 120000) fel.push(`AC-W05: trianglar ${tred.tris} > 120000`);
      }
      if (skaKora("w1")) await spara(page, "w1-sagoljus-pmrem-375x812.png");
    }

    if (skaKora("w2")) {
      const horisont = await page.evaluate(() => window.__tredHorisont ?? null);
      detalj.tredHorisont = horisont;
      for (const z of ["skogen", "sjon", "grottan", "garden", "kullar"]) {
        if (!horisont?.[z]) fel.push(`AC-W06: window.__tredHorisont.${z} är inte true`);
      }
      await spara(page, "w2-horisont-biomer-375x812.png");
    }

    // W3: Vägvisare på 375x812 (med boken öppen) + 320x568 + resor till alla 4 platser
    if (skaKora("w3")) {
      await page.waitForSelector('[data-w3="vagvisare-knapp"]', { timeout: 6000 });
      const knappar = page.locator('[data-w3="vagvisare-knapp"]');
      const antal = await knappar.count();
      detalj.antalVagvisare375 = antal;
      if (antal < 4) fel.push(`AC-W08: hittade ${antal} vägvisarknappar på Ängen (kräver 4)`);

      const boxar = [];
      for (let i = 0; i < antal; i++) {
        const b = await knappar.nth(i).boundingBox();
        const plats = await knappar.nth(i).getAttribute("data-plats");
        if (!b) {
          fel.push(`AC-W08: vägvisare ${plats} saknar boundingBox`);
          continue;
        }
        boxar.push({ plats, ...b });
        if (b.width < 44 || b.height < 44) {
          fel.push(`AC-W08: vägvisare ${plats} är ${b.width}×${b.height} px (< 44×44)`);
        }
        if (b.x < 0 || b.y < 56 || b.x + b.width > 375 || b.y + b.height > 292) {
          fel.push(`AC-W08: vägvisare ${plats} ligger utanför fritt 3D-fönster ovanför boken: y=${b.y}..${b.y + b.height}`);
        }
      }
      for (let i = 0; i < boxar.length; i++) {
        for (let j = i + 1; j < boxar.length; j++) {
          if (rektOverlapp(boxar[i], boxar[j]) > 0) {
            fel.push(`AC-W08: vägvisare ${boxar[i].plats} och ${boxar[j].plats} överlappar på 375×812`);
          }
        }
      }

      // Testa även 320x568
      await page.setViewportSize({ width: 320, height: 568 });
      await page.waitForTimeout(350);
      const boxar320 = [];
      for (let i = 0; i < (await knappar.count()); i++) {
        const b = await knappar.nth(i).boundingBox();
        if (b) boxar320.push(b);
      }
      for (let i = 0; i < boxar320.length; i++) {
        for (let j = i + 1; j < boxar320.length; j++) {
          if (rektOverlapp(boxar320[i], boxar320[j]) > 0) {
            fel.push("AC-W08: vägvisare överlappar på 320×568");
          }
        }
      }
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(350);

      // Res till skogen (ta skärmbild under resövergången!), sjon, grottan, garden och tillbaka till ang
      for (const dest of ["skogen", "sjon", "grottan", "garden"]) {
        const knapp = page.locator(`[data-w3="vagvisare-knapp"][data-plats="${dest}"]`);
        await knapp.click();
        const anim = page.locator('[data-w3="resa-anim"]');
        await anim.waitFor({ state: "visible", timeout: 2500 });
        if (dest === "skogen") {
          await spara(page, "w3-vagvisare-och-resa-375x812.png");
        }
        await anim.waitFor({ state: "hidden", timeout: 4000 });
        await stangTitelOchIntro(page);
        await page.waitForTimeout(350);
        const retur = page.locator('[data-w3="vagvisare-knapp"][data-plats="ang"]');
        await retur.waitFor({ state: "visible", timeout: 4000 });
        await retur.click();
        await anim.waitFor({ state: "hidden", timeout: 4000 });
        await stangTitelOchIntro(page);
        await page.waitForTimeout(350);
      }
    }

    // W4: "🦅 Se hela dalen"-knapp + Introflygning
    if (skaKora("w4")) {
      const flygKnapp = page.locator('[data-w4="vy-flyg-knapp"]');
      await flygKnapp.waitFor({ state: "visible", timeout: 5000 });
      const fb = await flygKnapp.boundingBox();
      const meny = await page.locator('[data-testid="meny"]').boundingBox();
      if (!fb || fb.width < 44 || fb.height < 44) {
        fel.push(`AC-W12: [data-w4="vy-flyg-knapp"] är för liten: ${JSON.stringify(fb)}`);
      }
      if (fb && meny && rektOverlapp(fb, meny) > 0) {
        fel.push("AC-W12: [data-w4='vy-flyg-knapp'] överlappar med [data-testid='meny']");
      }
      await flygKnapp.click();
      await page.waitForTimeout(450);
      const etiketter = await page.locator('[data-w4="flyg-etikett"]').count();
      detalj.antalFlygEtiketter = etiketter;
      if (etiketter < 5) fel.push(`AC-W12: hittade ${etiketter} flyg-etiketter (kräver 5)`);
      await spara(page, "w4-se-hela-dalen-375x812.png");
      await page.waitForTimeout(2800);
      const kamEfter = await page.evaluate(() => window.__tredKamera ?? null);
      if (!kamEfter || kamEfter.y > 4.6 || kamEfter.z > 10.3) {
        fel.push(`AC-W12: kameran återgick inte till Ängen efter Se hela dalen: ${JSON.stringify(kamEfter)}`);
      }

      // Testa färskt intro (introKlar: false) för AC-W11 + bild w4-intro-dalflygning-375x812.png
      await page.close();
      const introPage = await context.newPage();
      await introPage.addInitScript(() => {
        localStorage.setItem(
          "trollpennan-v2",
          JSON.stringify({ state: { introKlar: false, forstaSkapelse: false, stjarnor: 0, ang: [] }, version: 2 }),
        );
      });
      await introPage.goto(`${basUrl}/?prov=1`, { waitUntil: "domcontentloaded", timeout: 20000 });
      await introPage.waitForTimeout(600);
      const startKnapp = introPage.locator('[data-testid="titel-starta"], button:has-text("Börja spela"), button:has-text("Spela")').first();
      if (await startKnapp.isVisible().catch(() => false)) {
        await startKnapp.click({ force: true });
      }
      await introPage.locator('[data-testid="ladd-3d"][data-klar="ja"]').waitFor({ state: "attached", timeout: 15000 });
      await introPage.waitForTimeout(250);
      const kamStart = await introPage.evaluate(() => window.__tredKamera ?? null);
      detalj.introKameraStart = kamStart;
      if (!kamStart || kamStart.y < 9.5 || kamStart.z < 13.0) {
        fel.push(`AC-W11: introkameran startade inte i dalöversikten: ${JSON.stringify(kamStart)}`);
      }
      await spara(introPage, "w4-intro-dalflygning-375x812.png");
      await introPage.waitForTimeout(2450);
      const kamLandad = await introPage.evaluate(() => window.__tredKamera ?? null);
      detalj.introKameraLandad = kamLandad;
      if (!kamLandad || kamLandad.y > 4.5 || kamLandad.z > 10.2) {
        fel.push(`AC-W11: introkameran landade inte på Ängen efter 2.4 s: ${JSON.stringify(kamLandad)}`);
      }
      await introPage.close();
    }

    detalj.skarmbilder = skarmbilder;
  } finally {
    if (browser) await browser.close();
    if (srv) srv.kill("SIGTERM");
  }
}

async function main() {
  const fel = [];
  const detalj = { steg, snabb };

  korBasKontroller(fel, detalj);
  if (skaKora("w1")) await korW1Statiska(fel, detalj);
  if (skaKora("w2")) await korW2Statiska(fel, detalj);
  if (skaKora("w3")) await korW3Statiska(fel, detalj);
  if (skaKora("w4")) await korW4Statiska(fel, detalj);

  if (!snabb && fel.length === 0) {
    await korPlaywright(fel, detalj);
  }

  const resultat = { ok: fel.length === 0, antalFel: fel.length, fel, ...detalj };
  console.log(JSON.stringify(resultat, null, 2));
  process.exit(fel.length === 0 ? 0 : 1);
}

main();
