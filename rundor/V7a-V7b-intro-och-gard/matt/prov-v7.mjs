#!/usr/bin/env node
// Prov för V7a och V7b (Blockserie V):
//   node rundor/V7a-V7b-intro-och-gard/matt/prov-v7.mjs --snabb --del 1|2|alla
//   node rundor/V7a-V7b-intro-och-gard/matt/prov-v7.mjs --del 1|2|alla [--url http://127.0.0.1:4188] [--ut /tmp/v7-bilder]

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
const utMapp =
  utIdx >= 0
    ? args[utIdx + 1]
    : path.join(process.cwd(), "rundor/V7a-V7b-intro-och-gard/matt/bilder");

const rot = process.cwd();
const facit = JSON.parse(
  fs.readFileSync(path.join(rot, "rundor/V7a-V7b-intro-och-gard/facit-v7.json"), "utf8"),
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

function korSnabb() {
  const fel = [];
  const detalj = {};

  // Gemensam kontroll: Spel.tsx och filstorlekar <= 400
  const spelRader = rader("src/spel/Spel.tsx");
  detalj.spelRader = spelRader;
  if (spelRader > 400) fel.push(`Spel.tsx är ${spelRader} rader (> 400)`);

  for (const f of [
    "src/spel/intro.tsx",
    "src/spel/ui/Titel.tsx",
    "src/spel/ui/SpelVy.tsx",
    "src/spel/gard/modellPrep.ts",
    "src/spel/gard/ByggModell.tsx",
    "src/spel/gard/Garden3D.tsx",
    "src/spel/gard/byggTolk.ts",
    "src/spel/styr/useSkapa.ts",
    "src/spel/ui/BokSkarm.tsx",
  ]) {
    const n = rader(f);
    if (n > 400) fel.push(`${f} är ${n} rader (> 400)`);
  }

  // Del 1: V7a – Kort, interaktivt intro (max 8 s, 3 steg), Hoppa över ⏭ & ljudupplåsning
  if (del === "1" || del === "alla") {
    const introJson = lasJson("data/intro.json");
    if (!introJson) {
      fel.push("V7a: data/intro.json saknas");
    } else {
      if (!Array.isArray(introJson.scener) || introJson.scener.length !== 12) {
        fel.push("V7a: data/intro.json måste behålla scener med 12 poster (för rost.test.ts)");
      }
      if (!introJson.skriv || introJson.skriv.ord !== "katt") {
        fel.push("V7a: data/intro.json måste behålla skriv-objektet (för p2.test.ts & p22.test.ts)");
      }
      if (introJson.hoppa !== facit.v7a.hoppa_text) {
        fel.push(
          `V7a: data/intro.json .hoppa är '${introJson.hoppa}', förväntade '${facit.v7a.hoppa_text}'`,
        );
      }
      if (!introJson.v7a || typeof introJson.v7a.langd !== "number" || introJson.v7a.langd > facit.v7a.max_intro_sek) {
        fel.push(`V7a: data/intro.json saknar v7a.langd <= ${facit.v7a.max_intro_sek} s`);
      }
      if (!Array.isArray(introJson.v7a?.scener) || introJson.v7a.scener.length !== facit.v7a.antal_intro_steg) {
        fel.push(`V7a: data/intro.json saknar v7a.scener med ${facit.v7a.antal_intro_steg} steg`);
      }
    }

    const introTsx = lasText("src/spel/intro.tsx");
    if (!introTsx.includes('data-v7a="hoppa-over"')) {
      fel.push('V7a: src/spel/intro.tsx saknar data-v7a="hoppa-over" på Hoppa över-knappen');
    }
    if (!introTsx.includes("stopPropagation")) {
      fel.push("V7a: src/spel/intro.tsx saknar e.stopPropagation() på intro-överlägget/knappen");
    }
    if (!introTsx.includes("lasOpp")) {
      fel.push("V7a: src/spel/intro.tsx saknar ljud.lasOpp() för ljudupplåsning vid första tryck");
    }

    const introCss = lasText("src/spel/intro.css");
    if (!introCss.includes("min-width: 44px") || !introCss.includes("min-height: 44px")) {
      fel.push("V7a: src/spel/intro.css saknar min-width: 44px och min-height: 44px på .intro-hoppa");
    }

    const titelTsx = lasText("src/spel/ui/Titel.tsx");
    if (!titelTsx.includes("stopPropagation") || !titelTsx.includes("lasOpp")) {
      fel.push("V7a: src/spel/ui/Titel.tsx saknar e.stopPropagation() och ljud.lasOpp()");
    }

    const spelVyTsx = lasText("src/spel/ui/SpelVy.tsx");
    if (/\bstallKanin\s*\(/.test(spelVyTsx)) {
      fel.push("V7a: src/spel/ui/SpelVy.tsx anropar fortfarande stallKanin() i <Intro (gratis startdjur ska bort)");
    }
  }

  // Del 2: V7b – Gårdens byggsystem, Modellspanarens CC0-modeller & Byggbok utan överlapp
  if (del === "2" || del === "alla") {
    const tillgangar = lasJson("data/tillgangar.json")?.tillgangar ?? {};
    const licensIds = Object.values(tillgangar).filter((p) => p.licens === "CC0-1.0");
    detalj.antalCc0Tillgangar = licensIds.length;

    for (const relFil of facit.v7b.cc0_modeller) {
      const full = path.join(rot, "public", relFil);
      if (!fs.existsSync(full)) {
        fel.push(`V7b: CC0-modell saknas på disk: public${relFil}`);
      }
    }

    const gard3d = lasJson("data/gard-3d.json");
    const husFil = gard3d?.byggnader?.hus?.fil;
    if (husFil !== "/models/gard/v7-hus-tre-fonster-kenney-suburban.glb") {
      fel.push(
        `V7b: data/gard-3d.json .byggnader.hus.fil är '${husFil}', förväntade '/models/gard/v7-hus-tre-fonster-kenney-suburban.glb'`,
      );
    }

    const byggTolkTs = lasText("src/spel/gard/byggTolk.ts");
    if (!byggTolkTs) {
      fel.push("V7b: src/spel/gard/byggTolk.ts saknas");
    } else {
      if (!byggTolkTs.includes("tolkaByggMening") || !byggTolkTs.includes("appliceraByggMening")) {
        fel.push("V7b: src/spel/gard/byggTolk.ts saknar export av tolkaByggMening / appliceraByggMening");
      }
    }

    const modellPrepTs = lasText("src/spel/gard/modellPrep.ts");
    const byggModellTsx = lasText("src/spel/gard/ByggModell.tsx");
    const byggeGltfBlock = byggModellTsx.split("function ByggeGltf")[1] ?? "";
    if (
      modellPrepTs.includes("BoxGeometry") ||
      modellPrepTs.includes("boxGeometry") ||
      byggeGltfBlock.includes("BoxGeometry") ||
      byggeGltfBlock.includes("boxGeometry")
    ) {
      fel.push("V7b: Förbjuden BoxGeometry / boxGeometry för hus/fönster hittades i modellPrep.ts eller ByggeGltf");
    }
    if (modellPrepTs.includes(".lerp(mal, 0.42)")) {
      fel.push(
        "V7b: modellPrep.ts använder fortfarande lerbrun .lerp(..., 0.42) över alla material istället för ren färg på Walls",
      );
    }
    if (!modellPrepTs.includes("Window_1") || !modellPrepTs.includes("Window_2") || !modellPrepTs.includes("Window_3")) {
      fel.push("V7b: modellPrep.ts styr ännu inte synligheten på Window_1, Window_2, Window_3");
    }

    const fyllTs = lasText("src/spel/fyll.ts");
    if (!fyllTs.includes("toUpperCase")) {
      fel.push("V7b: src/spel/fyll.ts versaliserar ännu inte gemen bokstav efter meningsslut ('Klart! Ett stort...')");
    }

    const bokSkarmTsx = lasText("src/spel/ui/BokSkarm.tsx");
    if (!bokSkarmTsx.includes('data-v7b="stang-byggbok"')) {
      fel.push('V7b: src/spel/ui/BokSkarm.tsx saknar data-v7b="stang-byggbok"');
    }
    if (!bokSkarmTsx.includes('data-v7b="bygg-skriv-knapp"')) {
      fel.push('V7b: src/spel/ui/BokSkarm.tsx saknar data-v7b="bygg-skriv-knapp"');
    }
  }

  const ok = fel.length === 0;
  console.log(
    JSON.stringify(
      { ok, läge: "snabb", del, antalFel: fel.length, fel, detalj },
      null,
      2,
    ),
  );
  process.exit(ok ? 0 : 1);
}

if (snabb) {
  korSnabb();
}

async function vantaPaServer(url, timeoutMs = 15000) {
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

function rektOverlappPx(a, b) {
  if (!a || !b) return 0;
  const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return Math.round(x * y);
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
    // DEL 1: V7a – Kort intro, Hoppa över ⏭ >= 44×44 px, stopPropagation, 0 gratisdjur, öppnar ✍️ Skriv direkt
    if (del === "1" || del === "alla") {
      const context1 = await browser.newContext({ viewport: { width: 375, height: 812 } });
      const page1 = await context1.newPage();
      page1.on("pageerror", (e) => sidfel.push(String(e)));
      page1.on("console", (msg) => {
        if (msg.type() === "error") sidfel.push(msg.text());
      });

      await page1.goto(basUrl, { waitUntil: "networkidle" });
      await page1.waitForTimeout(500);

      // Starta spelet från titelskärmen
      if (await page1.locator('[data-testid="titel-borja"], [data-testid="starta"]').count()) {
        await page1.locator('[data-testid="titel-borja"], [data-testid="starta"]').first().click();
        await page1.waitForTimeout(350);
      }

      await page1.screenshot({ path: path.join(utMapp, "v7a-intro-hoppa-over.png") });

      const v7aIntro = await page1.evaluate(() => {
        const hoppa = document.querySelector('[data-testid="intro-hoppa"]');
        const r = hoppa?.getBoundingClientRect();
        return {
          finns: Boolean(hoppa),
          attrV7a: hoppa?.getAttribute("data-v7a") ?? null,
          text: hoppa?.textContent?.trim() ?? null,
          rect: r ? { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) } : null,
        };
      });
      matt.v7aIntro = v7aIntro;

      if (!v7aIntro.finns) {
        fel.push("V7a: [data-testid='intro-hoppa'] syntes inte under introt");
      } else {
        if (v7aIntro.attrV7a !== "hoppa-over") {
          fel.push(`V7a: intro-hoppa saknar data-v7a='hoppa-over' (fick '${v7aIntro.attrV7a}')`);
        }
        if (v7aIntro.text !== facit.v7a.hoppa_text) {
          fel.push(`V7a: intro-hoppa har text '${v7aIntro.text}', förväntade '${facit.v7a.hoppa_text}'`);
        }
        if (!v7aIntro.rect || v7aIntro.rect.w < 44 || v7aIntro.rect.h < 44) {
          fel.push(`V7a: intro-hoppa är mindre än 44×44 px (${JSON.stringify(v7aIntro.rect)})`);
        }
      }

      // Klicka på Hoppa över ⏭
      if (await page1.locator('[data-testid="intro-hoppa"]').count()) {
        await page1.click('[data-testid="intro-hoppa"]');
        await page1.waitForTimeout(500);
      }

      await page1.screenshot({ path: path.join(utMapp, "v7a-efter-hoppa-skriv-oppen.png") });

      const v7aEfter = await page1.evaluate(() => {
        const skrivRuta = document.querySelector('[data-testid="skriv-ruta"], [data-v7a="skriv-ruta"], [data-testid="remsa"]');
        const djur = window.__ang3d?.djur ?? window.__troll?.state?.()?.ang ?? [];
        const djurAttr = Number(document.querySelector('[data-testid="angen-3d"]')?.getAttribute("data-djur") ?? 0);
        return {
          skrivOppen: Boolean(skrivRuta && skrivRuta.getBoundingClientRect().height > 20),
          antalDjur: Math.max(djur.length, djurAttr),
        };
      });
      matt.v7aEfter = v7aEfter;

      if (!v7aEfter.skrivOppen) {
        fel.push("V7a: ✍️ Skriv ([data-testid='skriv-ruta']) öppnades inte direkt efter introt");
      }
      if (v7aEfter.antalDjur !== 0) {
        fel.push(`V7a: ${v7aEfter.antalDjur} gratisdjur skapades under introt (krav: 0 gratisdjur)`);
      }

      await context1.close();
    }

    // DEL 2: V7b – Gårdens byggsystem, 3D-hus med Walls/Roof/Window_1..3 & Byggbok utan överlapp
    if (del === "2" || del === "alla") {
      const context2 = await browser.newContext({ viewport: { width: 375, height: 812 } });
      await context2.addInitScript(() => {
        try {
          localStorage.setItem(
            "trollpennan:v2",
            JSON.stringify({
              introSett: true,
              hemma: [
                {
                  uid: "test-katt-1",
                  djur: "katt",
                  ord: "katt",
                  formel: "en katt",
                  fargId: null,
                  fargHex: null,
                  storlekId: null,
                  känslaId: null,
                  hattId: null,
                  tillbehorId: [],
                  aktionId: null,
                  vaderId: null,
                  hemId: null,
                  vaktVid: Date.now(),
                },
              ],
              garden: [],
            }),
          );
        } catch {
          // ignorera
        }
      });

      const page2 = await context2.newPage();
      page2.on("pageerror", (e) => sidfel.push(String(e)));
      page2.on("console", (msg) => {
        if (msg.type() === "error") sidfel.push(msg.text());
      });

      await page2.goto(basUrl, { waitUntil: "networkidle" });
      await page2.waitForTimeout(800);

      // Gå till Gården via meny -> Ut på äventyr -> Gården
      await page2.click('[data-testid="meny-knapp"]');
      await page2.waitForTimeout(250);
      await page2.click('[data-testid="ut-pa-aventyr"]');
      await page2.waitForTimeout(350);
      await page2.click('[data-testid="plats-garden"]');
      await page2.waitForTimeout(800);

      // Öppna Byggboken
      await page2.click('[data-testid="hus-knapp"]');
      await page2.waitForTimeout(350);
      await page2.screenshot({ path: path.join(utMapp, "v7b-byggbok-utan-overlapp.png") });

      const v7bByggbok = await page2.evaluate(() => {
        const bok = document.querySelector('[data-testid="byggbok"]')?.getBoundingClientRect();
        const hud = document.querySelector('[data-testid="topp-hud"]')?.getBoundingClientRect();
        const stang = document.querySelector('[data-v7b="stang-byggbok"]')?.getBoundingClientRect();
        const skrivKnapp = document.querySelector('[data-v7b="bygg-skriv-knapp"]')?.getBoundingClientRect();
        const kortYta = document.querySelector(".kort-yta.byggbok")?.getBoundingClientRect();
        const lastRad = document.querySelector('[data-testid="bygg-last"]')?.getBoundingClientRect();
        return {
          bok: bok
            ? { top: Math.round(bok.top), left: Math.round(bok.left), right: Math.round(bok.right), bottom: Math.round(bok.bottom) }
            : null,
          hud: hud
            ? { top: Math.round(hud.top), left: Math.round(hud.left), right: Math.round(hud.right), bottom: Math.round(hud.bottom) }
            : null,
          stang: stang ? { w: Math.round(stang.width), h: Math.round(stang.height) } : null,
          skrivKnapp: skrivKnapp ? { w: Math.round(skrivKnapp.width), h: Math.round(skrivKnapp.height) } : null,
          kortYta: kortYta
            ? { top: Math.round(kortYta.top), left: Math.round(kortYta.left), right: Math.round(kortYta.right), bottom: Math.round(kortYta.bottom) }
            : null,
          lastRad: lastRad
            ? { top: Math.round(lastRad.top), left: Math.round(lastRad.left), right: Math.round(lastRad.right), bottom: Math.round(lastRad.bottom) }
            : null,
        };
      });
      matt.v7bByggbok = v7bByggbok;

      if (!v7bByggbok.bok || v7bByggbok.bok.top < facit.v7b.min_byggbok_top_px) {
        fel.push(
          `V7b: Byggboken har top=${v7bByggbok.bok?.top} px (krav >= ${facit.v7b.min_byggbok_top_px} px för 0 px överlapp med topp-HUD)`,
        );
      }
      if (!v7bByggbok.stang || v7bByggbok.stang.w < 44 || v7bByggbok.stang.h < 44) {
        fel.push(`V7b: stang-byggbok (×) saknas eller är < 44×44 px (${JSON.stringify(v7bByggbok.stang)})`);
      }
      if (!v7bByggbok.skrivKnapp || v7bByggbok.skrivKnapp.h < 36) {
        fel.push("V7b: bygg-skriv-knapp saknas inne i Byggboken");
      }
      const kortLastOverlapp = rektOverlappPx(v7bByggbok.kortYta, v7bByggbok.lastRad);
      if (kortLastOverlapp > 0) {
        fel.push(`V7b: Byggkort och låsta sidor överlappar med ${kortLastOverlapp} px²`);
      }

      // Öppna skrivfältet via bygg-skriv-knapp (eller pennans-bok)
      if (await page2.locator('[data-v7b="bygg-skriv-knapp"]').count()) {
        await page2.click('[data-v7b="bygg-skriv-knapp"]');
      } else {
        await page2.click('[data-testid="pennans-bok"]');
      }
      await page2.waitForTimeout(300);

      // Skriv "ett stort rött hus med blått tak och tre fönster"
      await page2.fill('[data-testid="ord-input"]', facit.v7b.test_mening);
      await page2.click('[data-testid="vack-knapp"]');
      await page2.waitForTimeout(900);

      await page2.screenshot({
        path: path.join(utMapp, "v7b-stort-rott-hus-blatt-tak-tre-fonster.png"),
      });

      const v7bHus = await page2.evaluate(() => {
        const bubbla = document.querySelector('[data-testid="bubbla"]')?.textContent?.trim() ?? "";
        const byggen = window.__gard3d?.byggen ?? [];
        const hus = byggen.find((b) => b.bygg === "hus") ?? null;
        return { bubbla, hus, allaByggen: byggen };
      });
      matt.v7bHus = v7bHus;

      if (!v7bHus.hus) {
        fel.push("V7b: Inget 'hus' hittades i window.__gard3d.byggen efter skrivbyggande på gården");
      } else {
        if (v7bHus.hus.modellFil !== "/models/gard/v7-hus-tre-fonster-kenney-suburban.glb") {
          fel.push(
            `V7b: Huset använder modellFil='${v7bHus.hus.modellFil}', förväntade '/models/gard/v7-hus-tre-fonster-kenney-suburban.glb'`,
          );
        }
        if ((v7bHus.hus.wallsColorHex ?? "").toLowerCase() !== facit.v7b.forvantad_vagg_hex) {
          fel.push(
            `V7b: Husets 3D-material Walls har färg '${v7bHus.hus.wallsColorHex}', förväntade '${facit.v7b.forvantad_vagg_hex}'`,
          );
        }
        if ((v7bHus.hus.roofColorHex ?? "").toLowerCase() !== facit.v7b.forvantad_tak_hex) {
          fel.push(
            `V7b: Husets 3D-material Roof har färg '${v7bHus.hus.roofColorHex}', förväntade '${facit.v7b.forvantad_tak_hex}'`,
          );
        }
        const synliga = v7bHus.hus.synligaFonsterNoder ?? [];
        if (JSON.stringify(synliga) !== JSON.stringify(facit.v7b.forvantade_fonster_noder)) {
          fel.push(
            `V7b: Husets synliga 3D-fönsternoder är ${JSON.stringify(synliga)}, förväntade ${JSON.stringify(facit.v7b.forvantade_fonster_noder)}`,
          );
        }
      }

      if (v7bHus.bubbla) {
        if (/[.!?]\s+[a-zåäö]/.test(v7bHus.bubbla)) {
          fel.push(`V7b: Bekräftelsebubblan har gemen bokstav efter utropstecken: '${v7bHus.bubbla}'`);
        }
        if (/med\s+[^.!?]*\bmed\b/i.test(v7bHus.bubbla)) {
          fel.push(`V7b: Bekräftelsebubblan har dubbel-'med': '${v7bHus.bubbla}'`);
        }
      }

      // Testa även "ett rött hus utan fönster" -> 0 synliga fönsternoder
      if (!(await page2.locator('[data-testid="ord-input"]').count())) {
        await page2.click('[data-testid="pennans-bok"]');
        await page2.waitForTimeout(300);
      }
      await page2.fill('[data-testid="ord-input"]', facit.v7b.test_mening_utan_fonster);
      await page2.click('[data-testid="vack-knapp"]');
      await page2.waitForTimeout(700);

      const v7bUtanFonster = await page2.evaluate(() => {
        const byggen = window.__gard3d?.byggen ?? [];
        const hus = byggen[byggen.length - 1] ?? null;
        return { hus };
      });
      matt.v7bUtanFonster = v7bUtanFonster;
      const synligaUtan = v7bUtanFonster.hus?.synligaFonsterNoder ?? null;
      if (!Array.isArray(synligaUtan) || synligaUtan.length !== 0) {
        fel.push(
          `V7b: 'ett rött hus utan fönster' gav synligaFonsterNoder=${JSON.stringify(synligaUtan)}, förväntade []`,
        );
      }

      await context2.close();
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
