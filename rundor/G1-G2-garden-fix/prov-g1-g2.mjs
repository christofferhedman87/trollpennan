#!/usr/bin/env node
// Verifieringsprov för Blockserie G (G1–G2):
// - G1: Felfri 3D-visualisering av skapade byggnader på Gården (MeshoptDecoder + synkron useMemo),
//       2.2–2.8x större byggnadsskala (>= 52x48 px på 375x812 & 375x640), mättad sagofärg & 3D-sockel,
//       samt ren Gårds-HUD (0 synliga .bubbla över bygget, 0 synliga .lykta, exakt 1 "Till Ängen"-knapp).
// - G2: Mysig startinramning på Solgården (SolgardInramning.tsx + utökad MarkPlan.tsx) vid 0 byggda objekt
//       utanför 6x10-tomten (window.__tredGardInramning, calls <= 95, tris <= 120000).
// Stöder: --snabb, --steg=g1|g2|alla, --ut <mapp>

import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

if (!process.env.__TSX_DELEGATED) {
  try {
    await import(new URL("../../src/spel/gard/modellPrep.ts", import.meta.url).href);
  } catch {
    const r = spawnSync("npx", ["tsx", fileURLToPath(import.meta.url), ...process.argv.slice(2)], {
      stdio: "inherit",
      env: { ...process.env, __TSX_DELEGATED: "1" },
    });
    process.exit(r.status ?? 1);
  }
}

import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";

const args = process.argv.slice(2);
const snabb = args.includes("--snabb");
const stegArg = (args.find((a) => a.startsWith("--steg="))?.split("=")[1] ?? "alla").toLowerCase();
const utIdx = args.indexOf("--ut");
const utMapp =
  utIdx >= 0 && args[utIdx + 1]
    ? path.resolve(args[utIdx + 1])
    : "/workspace/trollpennan-nulage/ko-28okt-g";

const KOR_G1 = stegArg === "g1" || stegArg === "alla" || stegArg === "all";
const KOR_G2 = stegArg === "g2" || stegArg === "alla" || stegArg === "all";
const ROT = process.cwd();

const fel = [];
const detalj = { steg: stegArg, snabb, g1: {}, g2: {}, playwright: {} };

function las(rel) {
  return fs.readFileSync(path.join(ROT, rel), "utf8");
}

function radantal(rel) {
  const s = las(rel);
  return s.split("\n").length - (s.endsWith("\n") ? 1 : 0);
}

function rektOverlapp(a, b) {
  if (!a || !b) return 0;
  const x = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return x * y;
}

// ============================================================================
// DEL 1: Snabba statiska & enhetskontroller för G1 (< 1 s)
// ============================================================================
async function korG1Statiska() {
  // 1. Radtak i känsliga moduler
  const tak = [
    ["src/spel/modeller/forladda.ts", 400],
    ["src/spel/gard/ByggModell.tsx", 400],
    ["src/spel/gard/Garden3D.tsx", 400],
    ["src/spel/gard/modellPrep.ts", 400],
    ["src/spel/styr/useSkapa.ts", 150],
    ["src/spel/ui/AngLager.tsx", 260],
    ["src/spel/ui/Hud.tsx", 225],
  ];
  const rader = {};
  for (const [fil, max] of tak) {
    const n = radantal(fil);
    rader[fil] = n;
    if (n > max) fel.push(`G1: ${fil} har ${n} rader (max ${max})`);
  }
  detalj.g1.rader = rader;

  // 2. MeshoptDecoder i forladda.ts & ByggModell.tsx + synkron useMemo i KlonadScen
  const forladdaSrc = las("src/spel/modeller/forladda.ts");
  if (!forladdaSrc.includes("MeshoptDecoder") || !forladdaSrc.includes("kopplaMeshopt")) {
    fel.push("G1: src/spel/modeller/forladda.ts saknar MeshoptDecoder / kopplaMeshopt i useGLTF.preload");
  }

  const byggModellSrc = las("src/spel/gard/ByggModell.tsx");
  if (!byggModellSrc.includes("forladdaNarLedig(FILER)")) {
    fel.push("G1: src/spel/gard/ByggModell.tsx måste behålla forladdaNarLedig(FILER) för v9b.test.ts");
  }
  if (!byggModellSrc.includes("kopplaMeshopt")) {
    fel.push("G1: src/spel/gard/ByggModell.tsx saknar kopplaMeshopt i useGLTF(...)");
  }
  if (!byggModellSrc.includes("useMemo")) {
    fel.push("G1: src/spel/gard/ByggModell.tsx saknar synkron useMemo i KlonadScen");
  }
  if (/if\s*\(\s*!rad\?\.fil\s*\)\s*return\s+null/.test(byggModellSrc)) {
    fel.push("G1: src/spel/gard/ByggModell.tsx har kvar 'if (!rad?.fil) return null;' i HusBit");
  }
  if (/fargHex=\{b\.fargHex\}/.test(byggModellSrc)) {
    fel.push("G1: HusBit i ByggModell.tsx skickar fortfarande fargHex={b.fargHex} istället för fargHex={farg}");
  }
  if (!byggModellSrc.includes("cylinderGeometry")) {
    fel.push("G1: HusBit i ByggModell.tsx saknar 3D-sockel (cylinderGeometry)");
  }

  // 3. modellPrep.ts: passaByggnad & egnaMaterial på tältduk (colorRed) + Walls/Roof
  const prepMod = await import(path.join(ROT, "src/spel/gard/modellPrep.ts"));
  const { passaByggnad, egnaMaterial, inspekteraHus3D } = prepMod;

  // Test 3a: talt-liknande mesh (0.875 x 0.561 x 0.666) med malhojd 1.45 och skala 1.35
  const taltRot = new THREE.Group();
  const taltMat = new THREE.MeshStandardMaterial({ color: "#ffffff" });
  taltMat.name = "colorRed";
  const taltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.875, 0.561, 0.666), taltMat);
  taltRot.add(taltMesh);
  passaByggnad(taltRot, 1.45, 1.75, 1.35);
  const box = new THREE.Box3().setFromObject(taltRot);
  const stor = new THREE.Vector3();
  box.getSize(stor);
  detalj.g1.taltVärldsStorlek = {
    w: Number(stor.x.toFixed(3)),
    h: Number(stor.y.toFixed(3)),
    d: Number(stor.z.toFixed(3)),
  };
  if (stor.y < 0.95 || stor.x < 1.35) {
    fel.push(`G1: passaByggnad gav för litet tält: ${JSON.stringify(detalj.g1.taltVärldsStorlek)} (kräver h >= 0.95, w >= 1.35)`);
  }

  // Test 3b: egnaMaterial färgar colorRed på tältet
  egnaMaterial(taltRot, "#e65100", null, 3);
  const nyMat = taltMesh.material;
  const taltHex = "#" + nyMat.color.getHexString();
  detalj.g1.taltFargHex = taltHex;
  if (taltHex.toLowerCase() !== "#e65100") {
    fel.push(`G1: egnaMaterial färgade inte colorRed till #e65100 (blev ${taltHex})`);
  }

  // Test 3c: v7b-gard.test.ts-kompatibilitet (Walls + Roof + Window_1..3)
  const husRot = new THREE.Group();
  const vaggMat = new THREE.MeshStandardMaterial({ color: "#ffffff" });
  vaggMat.name = "Walls";
  const takMat = new THREE.MeshStandardMaterial({ color: "#888888" });
  takMat.name = "Roof";
  husRot.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), vaggMat), new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), takMat));
  for (const n of ["Window_1", "Window_2", "Window_3", "Window_Side"]) {
    const g = new THREE.Group();
    g.name = n;
    husRot.add(g);
  }
  egnaMaterial(husRot, "#e53935", "#1e88e5", 3);
  const diag = inspekteraHus3D(husRot);
  if (diag.wallsColorHex !== "#e53935" || diag.roofColorHex !== "#1e88e5" || diag.synligaFonsterNoder.length !== 3) {
    fel.push(`G1: v7b-regression i egnaMaterial/inspekteraHus3D: ${JSON.stringify(diag)}`);
  }

  // 4. data/gard-3d.json: tält har rotY och mättad färg med hög kontrast mot gräset (#49B652)
  const gardJson = JSON.parse(las("data/gard-3d.json"));
  const taltData = gardJson.byggnader?.["tält"];
  detalj.g1.taltJson = taltData;
  if (!taltData || typeof taltData.rotY !== "number" || taltData.rotY === 0) {
    fel.push(`G1: data/gard-3d.json saknar rotY != 0 på 'tält': ${JSON.stringify(taltData)}`);
  }

  // 5. Ren Gårds-HUD i useSkapa.ts, AngLager.tsx, Hud.tsx & Garden3D.tsx
  const skapaSrc = las("src/spel/styr/useSkapa.ts");
  if (skapaSrc.includes('visaBubbla(klarText,')) {
    fel.push("G1: src/spel/styr/useSkapa.ts anropar fortfarande visaBubbla(klarText, ...) vid gårdsbygge");
  }
  const angLagerSrc = las("src/spel/ui/AngLager.tsx");
  if (!angLagerSrc.includes('data-testid="lykta"')) {
    fel.push('G1: src/spel/ui/AngLager.tsx saknar data-testid="lykta" (krävs av check:struktur)');
  }
  const lyktaRad = angLagerSrc.split("\n").find((r) => r.includes('data-testid="lykta"')) ?? "";
  if (!lyktaRad.includes("hidden") && !lyktaRad.includes("display: \"none\"") && !lyktaRad.includes("display: 'none'")) {
    fel.push(`G1: 2D-lyktan i AngLager.tsx är inte dold med hidden/display:none: ${lyktaRad.trim()}`);
  }
  const hudSrc = las("src/spel/ui/Hud.tsx");
  if (!hudSrc.includes('data-w3="vagvisare-knapp"') || !hudSrc.includes('data-plats="ang"')) {
    fel.push('G1: .hem-angen-knapp i src/spel/ui/Hud.tsx saknar data-w3="vagvisare-knapp" data-plats="ang"');
  }
  const gardenSrc = las("src/spel/gard/Garden3D.tsx");
  if (!gardenSrc.includes("OrthographicCamera") || !gardenSrc.includes("Bounds")) {
    fel.push("G1: src/spel/gard/Garden3D.tsx måste behålla OrthographicCamera och Bounds");
  }
  if (gardenSrc.includes('<Vagvisare3D plats="garden"')) {
    fel.push('G1: src/spel/gard/Garden3D.tsx renderar fortfarande dubbletten <Vagvisare3D plats="garden" />');
  }
}

// ============================================================================
// DEL 2: Snabba statiska kontroller för G2 (< 1 s)
// ============================================================================
async function korG2Statiska() {
  const inramningRel = "src/spel/gard/SolgardInramning.tsx";
  if (!fs.existsSync(path.join(ROT, inramningRel))) {
    fel.push(`G2: ${inramningRel} saknas`);
    return;
  }
  const n = radantal(inramningRel);
  detalj.g2.solgardInramningRader = n;
  if (n > 380) fel.push(`G2: ${inramningRel} har ${n} rader (max 380)`);

  const inramningSrc = las(inramningRel);
  for (const krav of [
    "lada-liten-quaternius.glb",
    "w-vaderkvarn-cc0.glb",
    "fence_gate.glb",
    "fence_simple.glb",
    "path_stone.glb",
    "hobal-kenney-hay-bale",
    "tunna.glb",
    "lykta.glb",
    "w-vagvisare-cc0.glb",
    "tree_oak.glb",
    "tree_fat.glb",
    "plant_bushLarge.glb",
    "w-kulle-cc0.glb",
    "__tredGardInramning",
  ]) {
    if (!inramningSrc.includes(krav)) {
      fel.push(`G2: SolgardInramning.tsx saknar ${krav}`);
    }
  }

  const markSrc = las("src/spel/gard/MarkPlan.tsx");
  if (!markSrc.includes("#69b84f") && !markSrc.includes("#76c45a")) {
    fel.push("G2: src/spel/gard/MarkPlan.tsx saknar utökad ängsskiva (#69b84f) och gårdsrundel (#76c45a)");
  }

  const gardenSrc = las("src/spel/gard/Garden3D.tsx");
  if (!gardenSrc.includes("SolgardInramning")) {
    fel.push("G2: src/spel/gard/Garden3D.tsx monterar inte <SolgardInramning />");
  }
}

// ============================================================================
// DEL 3: Full Playwright-verifiering på 375x812 och 375x640
// ============================================================================
async function korPlaywright() {
  const { chromium } = await import("playwright");
  const { PNG } = await import("pngjs");
  fs.mkdirSync(utMapp, { recursive: true });

  const port = 4280 + Math.floor(Math.random() * 400);
  const basUrl = `http://127.0.0.1:${port}`;
  const srv = spawn("npx", ["vite", "--port", String(port), "--host", "127.0.0.1"], {
    cwd: ROT,
    stdio: "ignore",
  });

  const vantaPaServer = async () => {
    for (let i = 0; i < 60; i++) {
      try {
        const r = await fetch(basUrl);
        if (r.ok) return;
      } catch {
        // vänta
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    throw new Error("Vite startade inte i tid");
  };

  let browser;
  const skarmbilder = [];

  async function sparaBild(page, filnamn) {
    const utFil = path.join(utMapp, filnamn);
    await page.screenshot({ path: utFil });
    skarmbilder.push(utFil);
    return utFil;
  }

  async function stangTitelOchIntro(page) {
    for (let i = 0; i < 6; i++) {
      const startKnapp = page
        .locator('[data-testid="titel-starta"], button:has-text("Börja spela"), button:has-text("Spela")')
        .first();
      if (await startKnapp.isVisible().catch(() => false)) {
        await startKnapp.click({ force: true });
        await page.waitForTimeout(250);
      }
      const hoppa = page.locator('[data-testid="hoppa-intro"], button:has-text("Hoppa över")').first();
      if (await hoppa.isVisible().catch(() => false)) {
        await hoppa.click({ force: true });
        await page.waitForTimeout(250);
      }
    }
  }

  async function gaTillGarden(page) {
    // Antingen via meny -> Gården eller via vägvisare
    const gardKnapp = page.locator('[data-w3="vagvisare-knapp"][data-plats="garden"]').first();
    if (await gardKnapp.isVisible().catch(() => false)) {
      await gardKnapp.click({ force: true });
      const anim = page.locator('[data-w3="resa-anim"]');
      if (await anim.isVisible().catch(() => false)) {
        await anim.waitFor({ state: "hidden", timeout: 4500 }).catch(() => {});
      }
    } else {
      await page.locator('[data-testid="meny"]').click({ force: true });
      await page.waitForTimeout(200);
      const menyGard = page.locator('[data-testid="meny-gard"], button:has-text("Gården")').first();
      await menyGard.click({ force: true });
    }
    await page.locator('[data-testid="garden-3d"]').waitFor({ state: "visible", timeout: 8000 });
    // Stäng Pennans bok om den är öppen
    const stangBok = page.locator('[data-testid="bok-stang"], .bok-stang').first();
    if (await stangBok.isVisible().catch(() => false)) {
      await stangBok.click({ force: true });
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(700);
  }

  async function byggMedMening(page, mening) {
    const oppnaSkriv = page.locator('[data-testid="hud-skriv"], [data-testid="hud-bygg"], button:has-text("Skriv"), button:has-text("Bygg")').first();
    if (await oppnaSkriv.isVisible().catch(() => false)) {
      await oppnaSkriv.click({ force: true });
      await page.waitForTimeout(250);
    }
    const stavaKnapp = page.locator('button:has-text("Stava själv"), [data-testid="bok-flik-stava"]').first();
    if (await stavaKnapp.isVisible().catch(() => false)) {
      await stavaKnapp.click({ force: true });
      await page.waitForTimeout(200);
    }
    const fält = page.locator('[data-testid="ord-falt"], input[type="text"], textarea').first();
    await fält.waitFor({ state: "visible", timeout: 5000 });
    await fält.fill(mening);
    await fält.press("Enter");
    await page.waitForTimeout(750);
  }

  function analyseraByggnadPixlar(pngFil, box) {
    const buf = fs.readFileSync(pngFil);
    const png = PNG.sync.read(buf);
    const x0 = Math.max(0, Math.floor(box.x));
    const y0 = Math.max(0, Math.floor(box.y));
    const x1 = Math.min(png.width - 1, Math.ceil(box.x + box.width));
    const y1 = Math.min(png.height - 1, Math.ceil(box.y + box.height));
    // Referensgräs på gårdsplanen (#49B652 = 73,182,82 och #62B355 = 98,179,85)
    const grasR = 85;
    const grasG = 180;
    const grasB = 84;
    let total = 0;
    let avvikande = 0;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const idx = (png.width * y + x) << 2;
        const r = png.data[idx];
        const g = png.data[idx + 1];
        const b = png.data[idx + 2];
        total++;
        const d = Math.hypot(r - grasR, g - grasG, b - grasB);
        if (d >= 45) avvikande++;
      }
    }
    return {
      total,
      avvikande,
      andel: total > 0 ? Number((avvikande / total).toFixed(3)) : 0,
    };
  }

  try {
    await vantaPaServer();
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 });
    const page = await context.newPage();

    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    await page.addInitScript(() => {
      localStorage.setItem(
        "trollpennan-v2",
        JSON.stringify({
          state: {
            introKlar: true,
            forstaSkapelse: true,
            stjarnor: 12,
            solstjarnor: 0,
            byggSidor: ["hus-och-hem", "natur-och-vatten", "lek-och-magi", "stora-byggen"],
            garden: [],
            hemma: [],
          },
          version: 2,
        }),
      );
    });

    await page.goto(`${basUrl}/?prov=1`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(600);
    await stangTitelOchIntro(page);
    await page.locator('[data-testid="ladd-3d"][data-klar="ja"]').waitFor({ state: "attached", timeout: 15000 });
    await gaTillGarden(page);

    // 1. Verifiera Gården vid 0 byggnader (AC-G02 + G2 startinramning)
    const startSnap = await page.evaluate(() => {
      const lyktaEl = document.querySelector('[data-testid="lykta"]');
      const lyktaRect = lyktaEl ? lyktaEl.getBoundingClientRect() : null;
      const lyktaStil = lyktaEl ? window.getComputedStyle(lyktaEl) : null;
      const hemKnappar = Array.from(document.querySelectorAll('[data-testid="hem-angen"], [data-w3="vagvisare-knapp"][data-plats="ang"]')).filter(
        (el) => {
          const r = el.getBoundingClientRect();
          const s = window.getComputedStyle(el);
          return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden";
        },
      );
      const flygKnapp = document.querySelector('[data-w4="vy-flyg-knapp"]');
      const flygSynlig = flygKnapp
        ? (() => {
            const r = flygKnapp.getBoundingClientRect();
            const s = window.getComputedStyle(flygKnapp);
            return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden";
          })()
        : false;
      return {
        gard3d: window.__gard3d ?? null,
        inramning: window.__tredGardInramning ?? null,
        lyktaSynlig: lyktaRect ? lyktaRect.width > 0 && lyktaRect.height > 0 && lyktaStil?.display !== "none" : false,
        antalTillAngenKnappar: hemKnappar.length,
        hemKnappBox: hemKnappar[0]?.getBoundingClientRect() ?? null,
        flygSynlig,
      };
    });
    detalj.playwright.start = startSnap;

    if (KOR_G1) {
      if (startSnap.lyktaSynlig) {
        fel.push("AC-G02: 2D-lyktan [data-testid='lykta'] är fortfarande synlig på Gården");
      }
      if (startSnap.antalTillAngenKnappar !== 1) {
        fel.push(`AC-G02: förväntade exakt 1 synlig 'Till Ängen'-knapp på Gården, hittade ${startSnap.antalTillAngenKnappar}`);
      }
      if (!startSnap.hemKnappBox || startSnap.hemKnappBox.width < 44 || startSnap.hemKnappBox.height < 44) {
        fel.push(`AC-G02: 'Till Ängen'-knappen är mindre än 44x44 px: ${JSON.stringify(startSnap.hemKnappBox)}`);
      }
      if (startSnap.flygSynlig) {
        fel.push("AC-G02: [data-w4='vy-flyg-knapp'] ('Se hela dalen') ska inte visas inne på Gården");
      }
    }

    if (KOR_G2) {
      const inr = startSnap.inramning;
      if (!inr || !inr.lada || !inr.vaderkvarn || !inr.staket || !inr.trad || !inr.kullar) {
        fel.push(`G2: window.__tredGardInramning saknar fält: ${JSON.stringify(inr)}`);
      }
      await sparaBild(page, "g2-garden-start-inramning-375x812.png");
    }

    // 2. Skapa "ett tält" på Gården och verifiera AC-G01 & AC-G03
    if (KOR_G1) {
      await byggMedMening(page, "ett tält");
      await page.waitForTimeout(600);

      const taltSnap = await page.evaluate(() => {
        const puff = document.querySelector('[data-testid="puff"]');
        const puffBox = puff ? puff.getBoundingClientRect() : null;
        const synligaBubblor = Array.from(document.querySelectorAll('[data-testid="bubbla"], .bubbla')).filter((el) => {
          const r = el.getBoundingClientRect();
          const s = window.getComputedStyle(el);
          return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity) > 0.05;
        });
        const hudEls = Array.from(document.querySelectorAll('.hud, [data-testid="puff"], .stall-chip, .hud-bot')).map((el) => ({
          tag: el.className || el.getAttribute("data-testid") || "hud",
          box: el.getBoundingClientRect(),
        }));
        return {
          puffText: puff?.textContent?.trim() ?? null,
          puffBox,
          synligaBubblorAntal: synligaBubblor.length,
          gard3d: window.__gard3d ?? null,
          hudEls,
        };
      });
      detalj.playwright.talt = taltSnap;

      if (taltSnap.synligaBubblorAntal > 0) {
        fel.push(`AC-G01: ${taltSnap.synligaBubblorAntal} synlig(a) .bubbla täcker Gården direkt efter bygge av 'ett tält'`);
      }
      const taltBygge = taltSnap.gard3d?.byggen?.find((b) => b.bygg === "tält");
      if (!taltBygge) {
        fel.push("AC-G03: 'tält' hittades inte i window.__gard3d.byggen efter skapande");
      } else {
        if (taltBygge.reservAktiv === true) {
          fel.push("AC-G03: 'ett tält' föll tillbaka till ReservForm istället för riktig GLB-modell");
        }
        const sb = taltBygge.skarmBox;
        if (!sb || sb.width < 52 || sb.height < 48) {
          fel.push(`AC-G03: 'ett tält' har för liten skärmruta på 375x812: ${JSON.stringify(sb)} (kräver >= 52x48 px)`);
        } else {
          for (const h of taltSnap.hudEls) {
            if (h.box.width > 0 && h.box.height > 0 && rektOverlapp(sb, h.box) > 0) {
              fel.push(`AC-G01: nybyggt tält (${JSON.stringify(sb)}) överlappar med HUD (${h.tag})`);
            }
          }
        }
      }

      const taltPng = await sparaBild(page, "g1-garden-talt-375x812.png");
      if (taltBygge?.skarmBox) {
        const pix = analyseraByggnadPixlar(taltPng, taltBygge.skarmBox);
        detalj.playwright.taltPixlar = pix;
        if (pix.avvikande < 500 || pix.andel < 0.22) {
          fel.push(`AC-G03: tältets skärmruta i g1-garden-talt-375x812.png har för få icke-gräspixlar: ${JSON.stringify(pix)}`);
        }
      }

      // 3. Skapa "ett rött hus" på Gården och verifiera både tält + hus på 375x812 och 375x640
      await byggMedMening(page, "ett rött hus");
      await page.waitForTimeout(600);
      await sparaBild(page, "g1-g2-garden-talt-och-hus-375x812.png");

      const husSnap375x812 = await page.evaluate(() => window.__gard3d?.byggen ?? []);
      const husBygge = husSnap375x812.find((b) => b.bygg === "hus");
      detalj.playwright.hus375x812 = husBygge ?? null;
      if (!husBygge || !husBygge.skarmBox || husBygge.skarmBox.width < 52 || husBygge.skarmBox.height < 48) {
        fel.push(`AC-G03: 'ett rött hus' är för litet på 375x812: ${JSON.stringify(husBygge?.skarmBox)}`);
      }

      // Testa även 375x640 (Android Chrome)
      await page.setViewportSize({ width: 375, height: 640 });
      await page.waitForTimeout(450);
      const byggen640 = await page.evaluate(() => window.__gard3d?.byggen ?? []);
      detalj.playwright.byggen375x640 = byggen640;
      for (const b of byggen640) {
        if (!b.skarmBox || b.skarmBox.width < 50 || b.skarmBox.height < 46) {
          fel.push(`AC-G03: '${b.formel}' är för litet på 375x640: ${JSON.stringify(b.skarmBox)}`);
        }
      }
    }

    if (pageErrors.length > 0) {
      fel.push(`Playwright pageerror: ${pageErrors.join(" | ")}`);
    }
    detalj.playwright.skarmbilder = skarmbilder;
  } finally {
    if (browser) await browser.close();
    srv.kill("SIGTERM");
  }
}

async function main() {
  if (KOR_G1) await korG1Statiska();
  if (KOR_G2) await korG2Statiska();

  if (!snabb && fel.length === 0) {
    await korPlaywright();
  }

  const ut = {
    ok: fel.length === 0,
    fel,
    detalj,
  };
  console.log(JSON.stringify(ut, null, 2));
  process.exit(fel.length === 0 ? 0 : 1);
}

main();
