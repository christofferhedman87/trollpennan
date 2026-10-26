#!/usr/bin/env node
// Prov för V9a och V9b (Blockserie V):
//   node rundor/V9a-V9b-album-ordbok-prestanda/matt/prov-v9.mjs --snabb --del 1|2|alla
//   node rundor/V9a-V9b-album-ordbok-prestanda/matt/prov-v9.mjs --del 1|2|alla [--url http://127.0.0.1:4193] [--ut /tmp/v9-bilder]

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
const utMapp = utIdx >= 0 ? args[utIdx + 1] : "/tmp/v9-bilder";

const rot = process.cwd();
const facit = JSON.parse(
  fs.readFileSync(path.join(rot, "rundor/V9a-V9b-album-ordbok-prestanda/facit-v9.json"), "utf8"),
);

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
  const detalj = { del1: {}, del2: {} };

  // Kontrollera filstorlekar <= 400 rader
  for (const f of [
    "src/spel/Spel.tsx",
    "src/spel/samling.tsx",
    "src/spel/ui/OrdbokDialog.tsx",
    "src/spel/ui/Dialoger.tsx",
    "src/spel/ui/Hud.tsx",
    "src/spel/angen3d.tsx",
    "src/spel/kenneyNatur.tsx",
    "src/spel/gard/ByggModell.tsx",
  ]) {
    const n = rader(f);
    if (n > 400) fel.push(`${f} är ${n} rader (> 400)`);
  }

  // Del 1: V9a — Album, Ordbok utan ???-vägg och Stjärnruta med Lyssna
  if (del === "1" || del === "alla") {
    const samlingTsx = lasText("src/spel/samling.tsx") + "\n" + lasText("src/spel/ui/AlbumVy.tsx");
    const ordbokTsx = lasText("src/spel/ui/OrdbokDialog.tsx") + "\n" + lasText("src/spel/ui/OrdbokFlik.tsx");
    const dialogerTsx = lasText("src/spel/ui/Dialoger.tsx") + "\n" + lasText("src/spel/ui/StjarnPop.tsx");

    const saknadeAlbum = facit.del1_v9a.album.kravAnkare.filter((a) => !samlingTsx.includes(a));
    const harTaBildText = samlingTsx.includes(facit.del1_v9a.album.tomFotoKnappText);
    if (saknadeAlbum.length > 0) {
      fel.push(`V9a Album: saknar ankare i samling.tsx/AlbumVy.tsx: ${saknadeAlbum.join(", ")}`);
    }
    if (!harTaBildText) {
      fel.push(`V9a Album: saknar knapptexten '${facit.del1_v9a.album.tomFotoKnappText}' vid tomt fotoalbum`);
    }

    const saknadeOrdbok = facit.del1_v9a.ordbok.kravAnkare.filter((a) => !ordbokTsx.includes(a));
    const harMinaHittade = ordbokTsx.includes(facit.del1_v9a.ordbok.rubrik);
    const harHemligVagg = /className="hemlig"[^>]*>\s*\?\??\s*<\/li>/.test(lasText("src/spel/ui/OrdbokDialog.tsx"));
    if (saknadeOrdbok.length > 0) {
      fel.push(`V9a Ordbok: saknar ankare i OrdbokDialog.tsx/OrdbokFlik.tsx: ${saknadeOrdbok.join(", ")}`);
    }
    if (!harMinaHittade) {
      fel.push(`V9a Ordbok: saknar '${facit.del1_v9a.ordbok.rubrik}' överst i Ordboken`);
    }
    if (harHemligVagg) {
      fel.push("V9a Ordbok: OrdbokDialog.tsx renderar fortfarande låsta .hemlig '?'/'???'-brickor");
    }

    const saknadeStjarn = facit.del1_v9a.stjarnruta.kravAnkare.filter((a) => !dialogerTsx.includes(a));
    if (saknadeStjarn.length > 0) {
      fel.push(`V9a Stjärnruta: saknar ankare i Dialoger.tsx/StjarnPop.tsx: ${saknadeStjarn.join(", ")}`);
    }

    detalj.del1 = {
      ok: saknadeAlbum.length === 0 && harTaBildText && saknadeOrdbok.length === 0 && harMinaHittade && !harHemligVagg && saknadeStjarn.length === 0,
      saknadeAlbum,
      harTaBildText,
      saknadeOrdbok,
      harMinaHittade,
      harHemligVagg,
      saknadeStjarn,
    };
  }

  // Del 2: V9b — Stegvis GLB-förladdning via requestIdleCallback, AdaptiveDpr/PerformanceMonitor/Bvh, StjarnPuffReserv
  if (del === "2" || del === "alla") {
    const forladdaTs = lasText("src/spel/modeller/forladda.ts");
    const byggModellTsx = lasText("src/spel/gard/ByggModell.tsx");
    const kenneyNaturTsx = lasText("src/spel/kenneyNatur.tsx");
    const gltfDjurTsx = lasText("src/spel/gltfDjur.tsx");
    const angen3dTsx = lasText("src/spel/angen3d.tsx") + "\n" + lasText("src/spel/Scen3D.tsx");
    const reservTsx = lasText("src/spel/modeller/StjarnPuffReserv.tsx");

    const harForladdaModul =
      forladdaTs.includes("export function forladdaNarLedig") &&
      forladdaTs.includes("requestIdleCallback");
    if (!harForladdaModul) {
      fel.push("V9b Förladdning: src/spel/modeller/forladda.ts med forladdaNarLedig + requestIdleCallback saknas");
    }

    const synkronaLoopar = [];
    if (/for\s*\(const\s+\w+\s+of\s+[^\n]+\)\s*useGLTF\.preload\(/.test(byggModellTsx)) {
      synkronaLoopar.push("src/spel/gard/ByggModell.tsx (29 GLB)");
    }
    if (/for\s*\(const\s+\w+\s+of\s+[^\n]+\)\s*useGLTF\.preload\(/.test(kenneyNaturTsx)) {
      synkronaLoopar.push("src/spel/kenneyNatur.tsx (19 GLB)");
    }
    if (/for\s*\(const\s+\w+\s+of\s+[^\n]+\)\s*useGLTF\.preload\(/.test(gltfDjurTsx)) {
      synkronaLoopar.push("src/spel/gltfDjur.tsx (8 GLB)");
    }
    if (synkronaLoopar.length > 0) {
      fel.push(`V9b Förladdning: synkrona useGLTF.preload-loopar vid modulimport finns kvar i: ${synkronaLoopar.join(", ")}`);
    }

    const saknadeR3f = facit.del2_v9b.r3f.komponenter.filter((k) => !angen3dTsx.includes(k));
    if (saknadeR3f.length > 0) {
      fel.push(`V9b R3F: saknar komponenter i angen3d.tsx/Scen3D.tsx: ${saknadeR3f.join(", ")}`);
    }

    const harStjarnPuffReserv = reservTsx.includes("export function StjarnPuffReserv");
    if (!harStjarnPuffReserv) {
      fel.push("V9b Reserv: src/spel/modeller/StjarnPuffReserv.tsx med StjarnPuffReserv saknas");
    }

    detalj.del2 = {
      ok: harForladdaModul && synkronaLoopar.length === 0 && saknadeR3f.length === 0 && harStjarnPuffReserv,
      harForladdaModul,
      synkronaLoopar,
      saknadeR3f,
      harStjarnPuffReserv,
    };
  }

  const ok = fel.length === 0;
  console.log(JSON.stringify({ ok, läge: "snabb", del, fel, detalj }, null, 2));
  process.exit(ok ? 0 : 1);
}

async function korWebblasare() {
  const { chromium } = await import("playwright");
  fs.mkdirSync(utMapp, { recursive: true });
  const fel = [];
  const matt = {};

  let serverProc = null;
  let url = argUrl;

  if (!url) {
    const port = 4193;
    url = `http://127.0.0.1:${port}`;
    serverProc = spawn("npx", ["vite", "--host", "127.0.0.1", "--port", String(port)], {
      cwd: rot,
      stdio: "ignore",
    });
    for (let i = 0; i < 40; i++) {
      try {
        const r = await fetch(url);
        if (r.ok) break;
      } catch {
        // vänta på dev-server
      }
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  let browser = null;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();

    const pageErrors = [];
    const glbRequestsVidStart = new Set();
    let matFönsterAktivt = true;

    page.on("pageerror", (err) => pageErrors.push(String(err)));
    page.on("request", (req) => {
      if (matFönsterAktivt && req.url().includes(".glb")) {
        glbRequestsVidStart.add(new URL(req.url()).pathname);
      }
    });

    await page.addInitScript(() => {
      try {
        localStorage.setItem(
          "trollpennan:v2",
          JSON.stringify({
            version: 2,
            introSedd: true,
            stjarnor: 4,
            funna: {
              kanin: { guld: true },
              katt: { guld: false },
              hund: { guld: false },
              rod: { guld: false },
            },
            albumKropp: {
              kanin: { formel: "en röd kanin", poang: 2, niva: "ovanlig", hjartan: 2 },
            },
            foton: [],
          }),
        );
      } catch {
        // ignorera
      }
    });

    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    matFönsterAktivt = false;

    if (del === "2" || del === "alla") {
      const glbAntal = glbRequestsVidStart.size;
      const r3fAttr = await page.evaluate(() => {
        const el = document.querySelector("[data-testid='angen-3d']");
        return {
          r3f: el?.getAttribute("data-v9b-r3f") ?? null,
          dpr: el?.getAttribute("data-v9b-dpr") ?? null,
        };
      });
      matt.v9b = {
        glbVidKallstart1500ms: glbAntal,
        maxTillatnaGlb: facit.del2_v9b.forladda.maxGlbVidKallstart1500ms,
        r3fAttr,
        pageErrors: pageErrors.length,
      };
      if (glbAntal > facit.del2_v9b.forladda.maxGlbVidKallstart1500ms) {
        fel.push(
          `V9b: ${glbAntal} .glb-förfrågningar sköts iväg inom 1500 ms vid kallstart (max ${facit.del2_v9b.forladda.maxGlbVidKallstart1500ms})`,
        );
      }
      if (r3fAttr.r3f !== "adaptive-bvh") {
        fel.push(`V9b: data-v9b-r3f på [data-testid="angen-3d"] är '${r3fAttr.r3f}' (förväntade 'adaptive-bvh')`);
      }
      if (pageErrors.length > 0) {
        fel.push(`V9b: ${pageErrors.length} pageerror: ${pageErrors.join("; ")}`);
      }
    }

    if (del === "1" || del === "alla") {
      // 1. Testa Stjärnruta från topp-HUD
      await page.click("[data-testid='stjarnor']");
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(utMapp, "v9a-stjarnruta.png") });

      const stjarnData = await page.evaluate(() => {
        const ruta = document.querySelector("[data-v9a='stjarn-ruta']");
        const lyssna = document.querySelector("[data-v9a='stjarn-lyssna']")?.getBoundingClientRect();
        const stang = document.querySelector("[data-v9a='stjarn-stang']")?.getBoundingClientRect();
        return {
          finns: Boolean(ruta),
          lyssna: lyssna ? { w: Math.round(lyssna.width), h: Math.round(lyssna.height) } : null,
          stang: stang ? { w: Math.round(stang.width), h: Math.round(stang.height) } : null,
        };
      });
      matt.v9aStjarnruta = stjarnData;
      if (!stjarnData.finns) fel.push("V9a: [data-v9a='stjarn-ruta'] saknas när man trycker på stjärnor i HUD");
      if (!stjarnData.lyssna || stjarnData.lyssna.w < 44 || stjarnData.lyssna.h < 44) {
        fel.push(`V9a: stjarn-lyssna saknas eller är < 44×44 px (${JSON.stringify(stjarnData.lyssna)})`);
      }
      if (!stjarnData.stang || stjarnData.stang.w < 44 || stjarnData.stang.h < 44) {
        fel.push(`V9a: stjarn-stang saknas eller är < 44×44 px (${JSON.stringify(stjarnData.stang)})`);
      }

      if (await page.locator("[data-v9a='stjarn-stang']").count()) {
        await page.click("[data-v9a='stjarn-stang']");
      } else if (await page.locator("[data-dialog-close]").count()) {
        await page.click("[data-dialog-close]");
      }
      await page.waitForTimeout(250);

      // 2. Testa Ordbok utan ???-vägg
      await page.click("[data-testid='meny-knapp']");
      await page.waitForTimeout(250);
      await page.click("[data-testid='ordbok']");
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(utMapp, "v9a-ordbok.png") });

      const ordbokData = await page.evaluate(() => {
        const sektion = document.querySelector("[data-v9a='mina-hittade-ord']");
        const kategorier = document.querySelectorAll("[data-v9a='ordbok-kategori']").length;
        const ordKnappar = [...document.querySelectorAll("[data-v9a='ordbok-ord']")];
        const forstaOrdRect = ordKnappar[0]?.getBoundingClientRect();
        const stangRect = document.querySelector("[data-v9a='ordbok-stang']")?.getBoundingClientRect();
        const hemligBrickor = document.querySelectorAll("[data-testid='ordbok-sida'] .hemlig").length;
        return {
          harMinaHittade: Boolean(sektion),
          kategorier,
          antalOrdKnappar: ordKnappar.length,
          forstaOrd: forstaOrdRect ? { w: Math.round(forstaOrdRect.width), h: Math.round(forstaOrdRect.height) } : null,
          stang: stangRect ? { w: Math.round(stangRect.width), h: Math.round(stangRect.height) } : null,
          hemligBrickor,
        };
      });
      matt.v9aOrdbok = ordbokData;
      if (!ordbokData.harMinaHittade) fel.push("V9a Ordbok: [data-v9a='mina-hittade-ord'] saknas");
      if (ordbokData.kategorier < 2) fel.push(`V9a Ordbok: färre än 2 kategorikort (${ordbokData.kategorier})`);
      if (ordbokData.hemligBrickor > 0) {
        fel.push(`V9a Ordbok: har fortfarande ${ordbokData.hemligBrickor} låsta .hemlig-brickor (krav 0)`);
      }
      if (!ordbokData.forstaOrd || ordbokData.forstaOrd.w < 44 || ordbokData.forstaOrd.h < 44) {
        fel.push(`V9a Ordbok: olåst ordknapp saknas eller är < 44×44 px (${JSON.stringify(ordbokData.forstaOrd)})`);
      }
      if (!ordbokData.stang || ordbokData.stang.w < 44 || ordbokData.stang.h < 44) {
        fel.push(`V9a Ordbok: ordbok-stang saknas eller är < 44×44 px (${JSON.stringify(ordbokData.stang)})`);
      }

      if (await page.locator("[data-v9a='ordbok-stang']").count()) {
        await page.click("[data-v9a='ordbok-stang']");
      } else {
        await page.click("[data-testid='ordbok-sida'] .stang");
      }
      await page.waitForTimeout(250);

      // 3. Testa Album + direktknapp "📸 Ta bild på din skapelse"
      await page.click("[data-testid='meny-knapp']");
      await page.waitForTimeout(250);
      await page.click("[data-testid='album-knapp']");
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(utMapp, "v9a-album.png") });

      const albumData = await page.evaluate(() => {
        const bilder = document.querySelectorAll("[data-v9a='album-bild']").length;
        const platser = document.querySelectorAll("[data-v9a='album-plats']").length;
        const stang = document.querySelector("[data-v9a='album-stang']")?.getBoundingClientRect();
        const taBild = document.querySelector("[data-v9a='album-ta-bild']")?.getBoundingClientRect();
        return {
          bilder,
          platser,
          stang: stang ? { w: Math.round(stang.width), h: Math.round(stang.height) } : null,
          taBild: taBild ? { w: Math.round(taBild.width), h: Math.round(taBild.height) } : null,
        };
      });
      matt.v9aAlbum = albumData;
      if (albumData.bilder < 1) fel.push("V9a Album: [data-v9a='album-bild'] saknas på korten");
      if (albumData.platser < 1) fel.push("V9a Album: [data-v9a='album-plats'] saknas på korten");
      if (!albumData.stang || albumData.stang.w < 44 || albumData.stang.h < 44) {
        fel.push(`V9a Album: album-stang saknas eller är < 44×44 px (${JSON.stringify(albumData.stang)})`);
      }
      if (!albumData.taBild || albumData.taBild.w < 44 || albumData.taBild.h < 44) {
        fel.push(`V9a Album: album-ta-bild saknas eller är < 44×44 px när fotoalbumet är tomt (${JSON.stringify(albumData.taBild)})`);
      }
    }
  } finally {
    if (browser) await browser.close();
    if (serverProc) serverProc.kill("SIGTERM");
  }

  const ok = fel.length === 0;
  console.log(JSON.stringify({ ok, läge: "webbläsare-375x812", del, fel, matt }, null, 2));
  process.exit(ok ? 0 : 1);
}

if (snabb) {
  korSnabb();
} else {
  await korWebblasare();
}
