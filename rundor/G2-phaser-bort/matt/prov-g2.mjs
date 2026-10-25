#!/usr/bin/env node
/**
 * Acceptansprov för G2: Phaser bort (en renderväg).
 *
 * Lägen:
 *   node rundor/G2-phaser-bort/matt/prov-g2.mjs --snabb
 *     Snabb statisk kontroll (< 1 s) av filer, package.json och src/.
 *
 *   node rundor/G2-phaser-bort/matt/prov-g2.mjs
 *     Full kontroll: statisk kontroll + buntkontroll i dist-pages/ +
 *     Playwright 375x812 över Ängen, Skogen, Sjön, Grottan och Gården.
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium } from "playwright";

const ROT = process.cwd();
const SNABB = process.argv.includes("--snabb");
const BILD_KAT = path.join(ROT, "rundor/G2-phaser-bort/matt/bilder");

const BORTTAGNA_PHASER_FILER = [
  "src/spel/starta.ts",
  "src/spel/gard.ts",
  "src/spel/scen.ts",
  "src/spel/avscen.ts",
  "src/spel/ritaBygg.ts",
  "src/spel/deladeBilder.ts",
  "src/spel/natthimmel.ts",
];

const BEVARADE_HJALPARFILER = [
  "src/spel/texturKo.ts",
  "src/spel/pekare.ts",
  "src/spel/kit.ts",
  "src/spel/beteende.ts",
  "src/spel/avbro.ts",
];

function listaFiler(katalog) {
  const ut = [];
  for (const post of fs.readdirSync(katalog, { withFileTypes: true })) {
    const p = path.join(katalog, post.name);
    if (post.isDirectory()) ut.push(...listaFiler(p));
    else ut.push(p);
  }
  return ut;
}

function statiskKontroll() {
  const fel = [];

  for (const rel of BORTTAGNA_PHASER_FILER) {
    if (fs.existsSync(path.join(ROT, rel))) {
      fel.push(`Phaser-fil finns kvar: ${rel}`);
    }
  }

  for (const rel of BEVARADE_HJALPARFILER) {
    if (!fs.existsSync(path.join(ROT, rel))) {
      fel.push(`Bevarad hjälparfil saknas (får EJ tas bort): ${rel}`);
    }
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(ROT, "package.json"), "utf8"));
  if (pkg.dependencies?.phaser || pkg.devDependencies?.phaser) {
    fel.push(`package.json innehåller fortfarande "phaser"`);
  }

  const lockFil = path.join(ROT, "package-lock.json");
  if (fs.existsSync(lockFil)) {
    const lock = JSON.parse(fs.readFileSync(lockFil, "utf8"));
    if (
      lock.packages?.[""]?.dependencies?.phaser ||
      lock.packages?.["node_modules/phaser"] ||
      lock.dependencies?.phaser
    ) {
      fel.push(`package-lock.json innehåller fortfarande "phaser"`);
    }
  }

  const srcFiler = listaFiler(path.join(ROT, "src"));
  for (const fil of srcFiler) {
    const rel = path.relative(ROT, fil);
    const rad = fs.readFileSync(fil, "utf8");
    if (/from\s+["']phaser["']|import\(\s*["']phaser["']\s*\)/.test(rad)) {
      fel.push(`Phaser-import finns kvar i ${rel}`);
    }
    if (/starta\.ts/.test(rad)) {
      fel.push(`Referens till starta.ts i ${rel}`);
    }
    if (/\b__spel\b/.test(rad)) {
      fel.push(`Referens till __spel i ${rel}`);
    }
    if (/className=["']duk["']/.test(rad)) {
      fel.push(`DOM-element className="duk" finns kvar i ${rel}`);
    }
    if (rel === "src/styles.css" && /(^|[}\s])\.duk(\s|\{)/.test(rad)) {
      fel.push(`CSS-regel .duk finns kvar i ${rel}`);
    }
  }

  const angen3dFil = path.join(ROT, "src/spel/angen3d.tsx");
  if (fs.existsSync(angen3dFil)) {
    const angen3d = fs.readFileSync(angen3dFil, "utf8");
    if (!/brygga\.registrera\(\s*["']ang["']/.test(angen3d)) {
      fel.push(`src/spel/angen3d.tsx registrerar inte "ang" i brygga`);
    }
  }

  return fel;
}

function buntKontroll() {
  const fel = [];
  const assetsKat = path.join(ROT, "dist-pages/assets");
  if (!fs.existsSync(assetsKat)) {
    fel.push(`dist-pages/assets saknas — kör npm run build:pages först`);
    return fel;
  }
  const filer = fs.readdirSync(assetsKat);
  for (const namn of filer) {
    if (/phaser/i.test(namn)) {
      fel.push(`Phaser-chunk finns kvar i dist-pages/assets: ${namn}`);
    }
  }
  return fel;
}

function startaServer(rotKat) {
  const mime = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".glb": "model/gltf-binary",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".mp3": "audio/mpeg",
    ".woff2": "font/woff2",
  };
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url || "/", "http://127.0.0.1");
    let p = decodeURIComponent(u.pathname);
    if (p.startsWith("/trollpennan/")) p = p.slice("/trollpennan".length);
    if (p === "/" || p === "") p = "/index.html";
    const fil = path.join(rotKat, p);
    if (!fil.startsWith(rotKat) || !fs.existsSync(fil) || fs.statSync(fil).isDirectory()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": mime[path.extname(fil)] || "application/octet-stream" });
    fs.createReadStream(fil).pipe(res);
  });
  return new Promise((resolve) => {
    srv.listen(0, "127.0.0.1", () => {
      const adr = srv.address();
      resolve({ srv, port: adr.port });
    });
  });
}

async function korSkarmprov() {
  const fel = [];
  fs.mkdirSync(BILD_KAT, { recursive: true });
  const { srv, port } = await startaServer(path.join(ROT, "dist-pages"));
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    const sidFel = [];
    page.on("pageerror", (e) => sidFel.push(`pageerror: ${e.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") sidFel.push(`console.error: ${msg.text()}`);
    });

    await page.goto(`http://127.0.0.1:${port}/trollpennan/`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-testid='angen-3d'] canvas", { timeout: 15000 });

    await page.evaluate(() => {
      window.__troll?.nollstall?.();
    });
    await page.waitForTimeout(600);

    // Kontrollera att .duk och window.__spel är borta samt att --duk-h är ~0.554
    const bas = await page.evaluate(() => {
      const ang = document.querySelector(".ang");
      const dukH = ang ? Number.parseFloat(getComputedStyle(ang).getPropertyValue("--duk-h")) : 0;
      return {
        dukAntal: document.querySelectorAll(".duk").length,
        harSpel: typeof window.__spel !== "undefined",
        dukH,
      };
    });
    if (bas.dukAntal !== 0) fel.push(`.duk finns kvar i DOM (${bas.dukAntal})`);
    if (bas.harSpel) fel.push(`window.__spel finns kvar`);
    if (!(bas.dukH >= 0.5 && bas.dukH <= 0.6)) {
      fel.push(`--duk-h på .ang är ${bas.dukH}, förväntat ~0.554 (0.50..0.60)`);
    }

    // Skapa en katt på Ängen och verifiera brygga.platser() via window.__troll.platser()
    await page.evaluate(() => {
      window.__troll?.skriv?.("en katt");
    });
    await page.waitForTimeout(1200);
    const angPlatser = await page.evaluate(() => window.__troll?.platser?.() ?? []);
    if (angPlatser.length < 1) {
      fel.push(`window.__troll.platser() gav 0 poster på Ängen (brygga "ang" saknas i Angen3D)`);
    }
    await page.screenshot({ path: path.join(BILD_KAT, "01-ang.png") });

    // Besök Skogen, Sjön och Grottan
    for (const [idx, plats] of [
      ["02-skogen", "skogen"],
      ["03-sjon", "sjon"],
      ["04-grottan", "grottan"],
    ]) {
      await page.evaluate((p) => {
        window.__troll?.bytPlats?.(p);
      }, plats);
      await page.waitForTimeout(700);
      const synlig = await page.locator("[data-testid='angen-3d'] canvas").isVisible();
      if (!synlig) fel.push(`angen-3d canvas ej synlig på ${plats}`);
      await page.screenshot({ path: path.join(BILD_KAT, `${idx}.png`) });
    }

    // Flytta katten till Gården och byt till Gården
    await page.evaluate(() => {
      const katt = (window.__troll?.mina?.() ?? [])[0];
      if (katt) window.__troll?.flyttaDjuret?.(katt.uid, "gard");
      window.__troll?.visa?.("gard");
    });
    await page.waitForSelector("[data-testid='garden-3d'] canvas", { timeout: 10000 });
    await page.waitForTimeout(900);
    const gardPlatser = await page.evaluate(() => window.__troll?.platser?.() ?? []);
    if (gardPlatser.length < 1) {
      fel.push(`window.__troll.platser() gav 0 poster på Gården`);
    }
    await page.screenshot({ path: path.join(BILD_KAT, "05-gard.png") });

    if (sidFel.length > 0) {
      fel.push(...sidFel);
    }
  } finally {
    await browser.close();
    srv.close();
  }
  return fel;
}

async function main() {
  const statiskaFel = statiskKontroll();
  if (SNABB) {
    if (statiskaFel.length > 0) {
      console.error("FAIL (prov-g2 --snabb):");
      for (const f of statiskaFel) console.error(`  - ${f}`);
      process.exit(1);
    }
    console.log("PASS (prov-g2 --snabb): 0 Phaser-filer, 0 phaser-beroenden, 0 .duk/__spel i src/.");
    return;
  }

  const buntFel = buntKontroll();
  const allaStatiska = [...statiskaFel, ...buntFel];
  if (allaStatiska.length > 0) {
    console.error("FAIL (prov-g2 statisk/bunt):");
    for (const f of allaStatiska) console.error(`  - ${f}`);
    process.exit(1);
  }

  const skarmFel = await korSkarmprov();
  if (skarmFel.length > 0) {
    console.error("FAIL (prov-g2 skärmprov):");
    for (const f of skarmFel) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log("PASS (prov-g2): Alla 5 platser (Ängen, Skogen, Sjön, Grottan, Gården) gröna utan Phaser.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
