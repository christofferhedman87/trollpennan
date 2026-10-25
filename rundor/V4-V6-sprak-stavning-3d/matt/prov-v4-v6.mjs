#!/usr/bin/env node
// Prov för V4, V5 och V6 (Blockserie V):
//   node rundor/V4-V6-sprak-stavning-3d/matt/prov-v4-v6.mjs --snabb --del 4|5|6|alla
//   node rundor/V4-V6-sprak-stavning-3d/matt/prov-v4-v6.mjs --del 4|5|6|alla [--url http://127.0.0.1:4188] [--ut /tmp/v4-v6-bilder]

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
const utMapp = utIdx >= 0 ? args[utIdx + 1] : "/tmp/v4-v6-bilder";

const rot = process.cwd();
const facit = JSON.parse(
  fs.readFileSync(path.join(rot, "rundor/V4-V6-sprak-stavning-3d/facit-v4-v6.json"), "utf8"),
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

async function korSnabb() {
  const fel = [];
  const detalj = {};

  const spelRader = rader("src/spel/Spel.tsx");
  detalj.spelRader = spelRader;
  if (spelRader > 400) fel.push(`Spel.tsx är ${spelRader} rader (> 400)`);

  for (const f of [
    "src/tolk/avstand.ts",
    "src/tolk/sparr.ts",
    "src/spel/fyll.ts",
    "src/spel/replik.ts",
    "src/spel/rostManifest.ts",
    "src/spel/rost.ts",
    "src/spel/lasniva.ts",
    "src/spel/ui/BokSkarm.tsx",
    "src/spel/ui/BokSvar.tsx",
    "src/spel/styr/useSkriv.ts",
    "src/spel/styr/useBannrar.ts",
    "src/spel/ui/AngLager.tsx",
    "src/spel/ui/NpcFigur.tsx",
    "src/spel/ang/Bengtsson3D.tsx",
    "src/spel/angen3d.tsx",
  ]) {
    const n = rader(f);
    if (n > 400) fel.push(`${f} är ${n} rader (> 400)`);
  }

  // Del 4: V4 – Svensk grammatik (en/ett & kongruens), stor meningsstart, trygg röst & utökad spärrlista
  if (del === "4" || del === "1" || del === "alla") {
    const blocklist = lasJson("data/blocklist.json");
    const blockOrd = new Set(blocklist?.ord ?? []);
    for (const w of facit.v4.sparrade_ord) {
      if (!blockOrd.has(w)) {
        fel.push(`V4: data/blocklist.json saknar spärrord '${w}'`);
      }
    }

    const lexikonTs = lasText("src/tolk/lexikon.ts");
    if (!lexikonTs.includes("NEUTRUM_ORD")) {
      fel.push("V4: src/tolk/lexikon.ts saknar NEUTRUM_ORD");
    }

    const avstandTs = lasText("src/tolk/avstand.ts");
    if (!avstandTs.includes("ljudStam")) {
      fel.push("V4: src/tolk/avstand.ts saknar ljudStam för svensk fonetik");
    }

    const sparrTs = lasText("src/tolk/sparr.ts");
    if (!sparrTs.includes("TILLATNA_ORD")) {
      fel.push("V4: src/tolk/sparr.ts saknar TILLATNA_ORD för smörkniv/vattenpistol");
    }

    const fyllTs = lasText("src/spel/fyll.ts");
    if (!fyllTs.includes("1 stjärna") || !fyllTs.includes("storMeningsStart")) {
      fel.push("V4: src/spel/fyll.ts saknar '1 stjärna'-kongruens eller storMeningsStart");
    }

    const rostTs = lasText("src/spel/rost.ts");
    if (rostTs.includes("await talaWebblasare(d.dynamisk)")) {
      fel.push("V4: src/spel/rost.ts läser fortfarande upp d.dynamisk högt med talaWebblasare");
    }
  }

  // Del 5: V5 – Bredare mobiltangentbord (>= 33x44 px + ABC/abc), fonetiska stavningsförslag & oförstörbar ledtrådstrappa
  if (del === "5" || del === "2" || del === "alla") {
    const lasningJson = lasJson("data/lasning.json");
    if (!lasningJson?.stavning?.ljud_mall) {
      fel.push("V5: data/lasning.json saknar stavning.ljud_mall");
    }

    const lasnivaTs = lasText("src/spel/lasniva.ts");
    if (!lasnivaTs.includes("ljudStam") || !lasnivaTs.includes('"ljud"')) {
      fel.push("V5: src/spel/lasniva.ts saknar fonetisk stavningsåterkoppling (typ: 'ljud' via ljudStam)");
    }
    if (!lasnivaTs.includes('"_".repeat')) {
      fel.push("V5: src/spel/lasniva.ts maskerar inte sista stavelsen i ledtradsSteg");
    }

    const bokSkarmTsx = lasText("src/spel/ui/BokSkarm.tsx");
    if (bokSkarmTsx.includes('lage === "skriv" && !forslag && !behover')) {
      fel.push("V5: BokSkarm.tsx döljer fortfarande .tangenter när forslag eller behover visas");
    }
    if (!bokSkarmTsx.includes('data-v5="skift-knapp"')) {
      fel.push('V5: BokSkarm.tsx saknar ABC/abc-växlare (data-v5="skift-knapp")');
    }

    const bokCss = lasText("src/spel/ui/bok-p1.css");
    if (!bokCss.includes("min-width: 33px")) {
      fel.push("V5: src/spel/ui/bok-p1.css saknar min-width: 33px för bokstavstangenter");
    }
  }

  // Del 6: V6 – Pratbubblor utan kollision, Doktor Bengtsson i 3D (CC0 GLB) & vänlig felhantering utan "ERROR"
  if (del === "6" || del === "3" || del === "alla") {
    const useBannrarTs = lasText("src/spel/styr/useBannrar.ts");
    if (!useBannrarTs.includes("rensaVidHandling")) {
      fel.push("V6: src/spel/styr/useBannrar.ts saknar rensaVidHandling");
    }

    const npcFigurTsx = lasText("src/spel/ui/NpcFigur.tsx");
    if (!npcFigurTsx.includes('data-v6="bengtsson-medaljong"')) {
      fel.push('V6: src/spel/ui/NpcFigur.tsx saknar data-v6="bengtsson-medaljong"');
    }
    if (!npcFigurTsx.includes('"tankande"')) {
      fel.push("V6: src/spel/ui/NpcFigur.tsx byter inte ut automat.webp (ERROR) mot tankande");
    }

    const bengtsson3dTsx = lasText("src/spel/ang/Bengtsson3D.tsx");
    if (!bengtsson3dTsx) {
      fel.push("V6: src/spel/ang/Bengtsson3D.tsx saknas");
    } else {
      if (!bengtsson3dTsx.includes("useGLTF")) {
        fel.push("V6: src/spel/ang/Bengtsson3D.tsx laddar inte CC0 GLB via useGLTF (inga box-primitiver tillåtna!)");
      }
      if (bengtsson3dTsx.includes("<boxGeometry") || bengtsson3dTsx.includes("BoxGeometry")) {
        fel.push("V6: src/spel/ang/Bengtsson3D.tsx använder förbjudna box-primitiver istället för CC0 GLB!");
      }
    }

    const angen3dTsx = lasText("src/spel/angen3d.tsx");
    if (!angen3dTsx.includes("Bengtsson3D")) {
      fel.push("V6: src/spel/angen3d.tsx renderar inte <Bengtsson3D />");
    }
  }

  const ok = fel.length === 0;
  console.log(JSON.stringify({ ok, läge: "snabb", del, antalFel: fel.length, fel, detalj }, null, 2));
  process.exit(ok ? 0 : 1);
}

if (snabb) {
  await korSnabb();
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
  const port = 4188;
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

    if (del === "4" || del === "1" || del === "alla") {
      await page.click("[data-testid=pennans-bok]");
      await page.waitForTimeout(300);
      await page.fill("[data-testid=ord-input]", "ett rött hus");
      await page.click("[data-testid=vack-knapp]");
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(utMapp, "v4-ett-rott-hus.png") });

      await page.click("[data-testid=pennans-bok]");
      await page.waitForTimeout(250);
      await page.fill("[data-testid=ord-input]", "tjykling");
      await page.click("[data-testid=vack-knapp]");
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(utMapp, "v4-tjykling-forslag.png") });
      const forslagSynligt = (await page.locator('[data-testid^="forslag-"]').count()) > 0;
      matt.v4TjyklingForslag = forslagSynligt;
      if (!forslagSynligt) {
        fel.push("V4: 'tjykling' visade inget stavningsförslag (Menade du kyckling?)");
      }

      await page.fill("[data-testid=ord-input]", "pistol");
      await page.click("[data-testid=vack-knapp]");
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(utMapp, "v4-sparr-pistol.png") });
    }

    if (del === "5" || del === "2" || del === "alla") {
      if (!(await page.locator(".bok").count())) {
        await page.click("[data-testid=pennans-bok]");
        await page.waitForTimeout(300);
      }
      await page.screenshot({ path: path.join(utMapp, "v5-tangentbord-33x44.png") });

      const tData = await page.evaluate(() => {
        const knappar = [...document.querySelectorAll(".tangenter .rad:nth-child(-n+2) button:not(.mellanslag)")];
        const minW = knappar.reduce((m, b) => Math.min(m, b.getBoundingClientRect().width), Infinity);
        const minH = knappar.reduce((m, b) => Math.min(m, b.getBoundingClientRect().height), Infinity);
        const skift = Boolean(document.querySelector('[data-v5="skift-knapp"]'));
        return { antal: knappar.length, minW: Math.round(minW * 10) / 10, minH: Math.round(minH * 10) / 10, skift };
      });
      matt.v5Tangenter = tData;
      if (tData.minW < facit.v5.min_tangent_bredd_px || tData.minH < facit.v5.min_tangent_hojd_px) {
        fel.push(`V5: Bokstavstangenter är ${tData.minW}×${tData.minH} px (krav >= ${facit.v5.min_tangent_bredd_px}×${facit.v5.min_tangent_hojd_px} px)`);
      }
      if (!tData.skift) {
        fel.push('V5: data-v5="skift-knapp" (ABC/abc) saknas');
      }
    }

    if (del === "6" || del === "3" || del === "alla") {
      if (await page.locator(".bok-topp .stang").count()) {
        await page.click(".bok-topp .stang");
        await page.waitForTimeout(250);
      }
      await page.screenshot({ path: path.join(utMapp, "v6-en-bubbla-och-bengtsson3d.png") });

      const v6Data = await page.evaluate(() => {
        const bannrar = document.querySelectorAll("[data-testid=banner]").length;
        const bubblor = document.querySelectorAll("[data-testid=bubbla]").length;
        const medaljong = Boolean(document.querySelector('[data-v6="bengtsson-medaljong"]'));
        const autoImg = [...document.querySelectorAll("img")].some((img) => (img.getAttribute("src") || "").includes("automat.webp"));
        return { bannrar, bubblor, medaljong, autoImg };
      });
      matt.v6 = v6Data;
      if (v6Data.bannrar > facit.v6.max_aktiva_bannrar) {
        fel.push(`V6: Fler än ${facit.v6.max_aktiva_bannrar} aktiva bannrar (${v6Data.bannrar})`);
      }
      if (v6Data.bubblor > facit.v6.max_aktiva_bubblor) {
        fel.push(`V6: Fler än ${facit.v6.max_aktiva_bubblor} aktiva pratbubblor (${v6Data.bubblor})`);
      }
      if (!v6Data.medaljong) {
        fel.push('V6: data-v6="bengtsson-medaljong" saknas på skärmen');
      }
      if (v6Data.autoImg) {
        fel.push("V6: automat.webp (ERROR) renderas fortfarande");
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
