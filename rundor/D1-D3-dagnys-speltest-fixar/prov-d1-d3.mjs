#!/usr/bin/env node
/**
 * prov-d1-d3.mjs — Snabbprov (--snabb) och full Playwright-kontroll på 375×812 för Runda D1, D2 och D3.
 * Körning:
 *   node rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs --snabb --del d1|d2|d3|alla
 *   node rundor/D1-D3-dagnys-speltest-fixar/prov-d1-d3.mjs --del d1|d2|d3|alla [--ut /tmp/d1-d3-bilder]
 */
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { chromium } from "playwright";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const SNABB = args.includes("--snabb");
const delIdx = args.indexOf("--del");
const DEL = (delIdx >= 0 ? args[delIdx + 1] || "alla" : "alla").toLowerCase();
const utIdx = args.indexOf("--ut");
const UT_MAPP = utIdx >= 0 ? args[utIdx + 1] : "/tmp/d1-d3-bilder";

const KOR_D1 = DEL === "alla" || DEL === "d1" || DEL === "1";
const KOR_D2 = DEL === "alla" || DEL === "d2" || DEL === "2";
const KOR_D3 = DEL === "alla" || DEL === "d3" || DEL === "3";

function lasText(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

function rader(rel) {
  const t = lasText(rel);
  return t ? t.split("\n").length - (t.endsWith("\n") ? 1 : 0) : 0;
}

const DE_5_ROSTFILERNA = [
  { nyckel: "14c9a5af", fil: "public/ljud/rost/cd6dfbe4984fa1c4.mp3", text: "Wow, du har skrivit ett guldord! Du får en stjärna!" },
  { nyckel: "8841cbf5", fil: "public/ljud/rost/3e4aec0917aef47a.mp3", text: "Titta! Du hittade ett helt nytt ord till boken!" },
  { nyckel: "666f97f2", fil: "public/ljud/rost/f88da967ffcbd8f5.mp3", text: "Titta, det du skrev vaknar till liv!" },
  { nyckel: "5133aa4c", fil: "public/ljud/rost/a4981119866c1746.mp3", text: "Tadaa! Snyggt bygge, nu står det på gården!" },
  { nyckel: "3dcac43d", fil: "public/ljud/rost/bc39930f05380799.mp3", text: "Hurra! Du fick nya stjärnor!" },
];

function korSnabbKontroll() {
  const fel = [];
  const detalj = { d1: {}, d2: {}, d3: {} };

  // Filstorleksvakt <= 400 rader
  for (const f of [
    "src/spel/tillbehor/AnsiktsUttryck.tsx",
    "src/spel/ang/djur.tsx",
    "src/spel/ang/humorIkon.tsx",
    "src/spel/ang/Bengtsson3D.tsx",
    "src/spel/ui/BokSkarm.tsx",
    "src/spel/ui/SpelVy.tsx",
    "src/spel/ui/gavoRuta.ts",
    "src/spel/dialogFokus.ts",
    "src/spel/styr/useSkapa.ts",
    "src/spel/minne.ts",
    "src/spel/samling.tsx",
    "src/spel/rost.ts",
    "src/tolk/ochMening.ts",
  ]) {
    const n = rader(f);
    if (n > 400) fel.push(`${f} är ${n} rader (> 400)`);
  }

  if (KOR_D1) {
    // 1. AnsiktsUttryck: inga svarta 3D-ögonglober (OGA/#231B1B/benAnsikte), men behåller humörsträngar och exporter
    const uttryck = lasText("src/spel/tillbehor/AnsiktsUttryck.tsx");
    const harOgaSfar = uttryck.includes("#231B1B") || uttryck.includes("benAnsikte");
    if (harOgaSfar) {
      fel.push("D1 (Fynd D1): AnsiktsUttryck.tsx innehåller fortfarande svarta 3D-ögonglober (#231B1B / benAnsikte)");
    }
    for (const h of ["glad", "fortjust", "hungrig", "somnig", "busig"]) {
      if (!uttryck.includes(`"${h}"`)) fel.push(`D1: AnsiktsUttryck.tsx saknar humörsträngen "${h}"`);
    }
    if (!uttryck.includes("#F48FB1") || !uttryck.includes("uttryck")) {
      fel.push("D1: AnsiktsUttryck.tsx saknar #F48FB1 eller 'uttryck'");
    }
    if (!uttryck.includes("huvudTopp")) {
      fel.push("D1: AnsiktsUttryck.tsx placerar inte humör-auran ovanför ankare.huvudTopp");
    }

    const djurTsx = lasText("src/spel/ang/djur.tsx");
    if (!/squashSkala\([^)]*signal\.current\.humör/.test(djurTsx)) {
      fel.push("D1: src/spel/ang/djur.tsx skickar inte med signal.current.humör till squashSkala");
    }

    const humorIkon = lasText("src/spel/ang/humorIkon.tsx");
    if (humorIkon.includes('jubel ? "hidden"')) {
      fel.push('D1: src/spel/ang/humorIkon.tsx gömmer fortfarande humörikonen vid "fortjust"');
    }

    // 2. Mobil-tangentbordslås
    const bokSkarm = lasText("src/spel/ui/BokSkarm.tsx");
    if (!bokSkarm.includes('inputMode="none"') || !bokSkarm.includes("tabIndex={-1}")) {
      fel.push('D1 (Fynd D2): src/spel/ui/BokSkarm.tsx saknar inputMode="none" och tabIndex={-1} på ord-input-ankare');
    }
    if (/className="ord-input-ankare"[^>]*readOnly/.test(bokSkarm)) {
      fel.push("D1 (Fynd D2): ord-input-ankare får INTE ha readOnly (bryter Playwright .fill())");
    }
    const dialogFokus = lasText("src/spel/dialogFokus.ts");
    if (!dialogFokus.includes(":not(.ord-input-ankare)")) {
      fel.push("D1 (Fynd D2): src/spel/dialogFokus.ts exkluderar inte :not(.ord-input-ankare)");
    }
    const bokCss = lasText("src/spel/ui/bok-p1.css");
    if (!/\.ord-input-ankare\s*\{[^}]*pointer-events:\s*none/.test(bokCss)) {
      fel.push("D1 (Fynd D2): .ord-input-ankare saknar pointer-events: none i src/spel/ui/bok-p1.css");
    }

    // 3. 2D Doktor Bengtsson & alltid "Doktor Bengtsson"
    const bengt3d = lasText("src/spel/ang/Bengtsson3D.tsx");
    if (!/return\s+null\s*;/.test(bengt3d)) {
      fel.push("D1 (Fynd D6): src/spel/ang/Bengtsson3D.tsx returnerar inte null för att dölja 3D-modellen på ängen");
    }
    const spelVy = lasText("src/spel/ui/SpelVy.tsx");
    if (!/&&\s*bengtsson\.synlig\s*\?\s*\(\s*<NpcFigur/.test(spelVy)) {
      fel.push("D1 (Fynd D6): src/spel/ui/SpelVy.tsx visar inte <NpcFigur> direkt på bengtsson.synlig");
    }
    const forstaStunden = lasText("data/forsta-stunden.json");
    if (/(?<!Doktor )Bengtsson/.test(forstaStunden)) {
      fel.push('D1 (Fynd D6): data/forsta-stunden.json har fortfarande "Bengtsson" utan "Doktor "');
    }
    const npcJson = lasText("data/npc.json");
    if (npcJson.includes("Hallå, Bengtsson här!")) {
      fel.push('D1 (Fynd D6): data/npc.json har fortfarande "Hallå, Bengtsson här!" utan "Doktor "');
    }
    const bengtJson = lasText("data/bengtsson.json");
    if (bengtJson.includes("till Bengtssons minnesplats")) {
      fel.push('D1 (Fynd D6): data/bengtsson.json har fortfarande "till Bengtssons minnesplats" utan "Doktor "');
    }

    detalj.d1 = {
      renAnsiktsUttryck: !harOgaSfar,
      inputModeNone: bokSkarm.includes('inputMode="none"'),
      bengtsson2d: /return\s+null\s*;/.test(bengt3d),
      doktorBengtssonTexter: !/(?<!Doktor )Bengtsson/.test(forstaStunden),
    };
  }

  if (KOR_D2) {
    const ordJson = JSON.parse(lasText("data/ord.json"));
    const medLista = ordJson.funktionsord?.med || [];
    const somLista = ordJson.funktionsord?.som || [];
    for (const w of ["har", "bär", "iförd"]) {
      if (!medLista.includes(w)) fel.push(`D2 (Fynd D3): "${w}" saknas i funktionsord.med i data/ord.json`);
    }
    for (const w of ["är", "var", "blir"]) {
      if (!somLista.includes(w)) fel.push(`D2 (Fynd D3): "${w}" saknas i funktionsord.som i data/ord.json`);
    }
    const harGlad = (ordJson.ord || []).some((o) => o.id === "glad" && o.klass === "egenskap");
    if (!harGlad) fel.push('D2 (Fynd D3): adjektivet "glad" (klass: "egenskap") saknas i data/ord.json');
    const katOrd = lasText("data/kategori-ord.json");
    if (/"glad"/.test(katOrd)) {
      fel.push('D2 (Fynd D3): "glad" ligger kvar i data/kategori-ord.json (bryter reserv.test.ts)');
    }

    // Kör tolk-invarianter i en separat node-process med --experimental-strip-types
    const tolkKoll = spawnSync(
      process.execPath,
      [
        "--experimental-strip-types",
        "-e",
        `
        import { delaOchMening, tolka } from "./src/tolk/tolka.ts";
        import { tolkaMedReserv } from "./src/tolk/reserv.ts";
        const fel = [];
        const d1 = delaOchMening("en groda som kan flyga och har hatt");
        if (d1.length !== 1) fel.push("delaOchMening delade 'en groda som kan flyga och har hatt' i " + d1.length + " delar");
        const u1 = tolkaMedReserv("en groda som kan flyga och har hatt");
        if (u1.typ !== "skapad" || u1.varelse.kropp !== "groda" || u1.okanda.length > 0 || (u1.varelse.reserv && u1.varelse.reserv.length > 0)) {
          fel.push("tolkaMedReserv('en groda som kan flyga och har hatt') gav: " + JSON.stringify({ typ: u1.typ, okanda: u1.okanda, reserv: u1.varelse?.reserv }));
        }
        if (u1.typ === "skapad" && (!(u1.varelse.formagor.includes("vingar") || u1.varelse.formagor.includes("flyga")) || !u1.varelse.tillbehor.some(t => t.id === "hatt"))) {
          fel.push("groda saknar flyga eller hatt: " + JSON.stringify({ formagor: u1.varelse.formagor, tillbehor: u1.varelse.tillbehor }));
        }
        const u2 = tolkaMedReserv("en katt som är blå och glad");
        if (u2.typ !== "skapad" || u2.okanda.length > 0 || (u2.varelse.reserv && u2.varelse.reserv.length > 0)) {
          fel.push("tolkaMedReserv('en katt som är blå och glad') gav okanda/reserv: " + JSON.stringify({ typ: u2.typ, okanda: u2.okanda, reserv: u2.varelse?.reserv }));
        }
        const u3 = tolkaMedReserv("på en sten sitter en stor hund");
        if (u3.typ !== "skapad" || u3.varelse.kropp !== "hund" || u3.okanda.length > 0 || !u3.varelse.tillbehor.some(t => t.id === "sten") || !(u3.varelse.skala > 1)) {
          fel.push("tolkaMedReserv('på en sten sitter en stor hund') gav: " + JSON.stringify({ typ: u3.typ, kropp: u3.varelse?.kropp, skala: u3.varelse?.skala, tillbehor: u3.varelse?.tillbehor, okanda: u3.okanda }));
        }
        const u4 = tolkaMedReserv("en hund med en hatt på huvudet");
        if (u4.typ !== "skapad" || u4.okanda.length > 0 || (u4.varelse.reserv && u4.varelse.reserv.length > 0)) {
          fel.push("tolkaMedReserv('en hund med en hatt på huvudet') gav okanda/reserv: " + JSON.stringify({ okanda: u4.okanda, reserv: u4.varelse?.reserv }));
        }
        const uHatt = tolka("en hatt");
        if (uHatt.typ !== "behover_djur") {
          fel.push("tolka('en hatt') måste förbli behover_djur för tolk.test.ts:369");
        }
        console.log(JSON.stringify({ fel }));
        `,
      ],
      { cwd: ROOT, encoding: "utf8" },
    );
    if (tolkKoll.status !== 0) {
      fel.push(`D2 tolkKoll kraschade: ${tolkKoll.stderr}`);
    } else {
      const ut = JSON.parse(tolkKoll.stdout.trim().split("\n").at(-1) || '{"fel":[]}');
      for (const f of ut.fel || []) fel.push(`D2: ${f}`);
    }

    const useSkapa = lasText("src/spel/styr/useSkapa.ts");
    if (!useSkapa.includes("laggPa")) {
      fel.push("D2 (Fynd D3): src/spel/styr/useSkapa.ts använder inte laggPa för generell påklädning vid behover_djur");
    }

    const djurTsx = lasText("src/spel/ang/djur.tsx") + "\n" + lasText("src/spel/ang/delat.ts");
    if (!djurTsx.includes("PLATTFORM_SAKER") && !djurTsx.includes("wx - x")) {
      fel.push("D2 (Fynd D4): src/spel/ang/djur.tsx saknar plattformsplacering (PLATTFORM_SAKER) och lokal offset-korrigering (wx - x)");
    }

    detalj.d2 = { harGlad, harLaggPa: useSkapa.includes("laggPa") };
  }

  if (KOR_D3) {
    // 1. De 5 ElevenLabs-röstfilerna på disk och i manifest/klient
    const manifest = JSON.parse(lasText("data/rost-manifest.json"));
    const klient = JSON.parse(lasText("data/rost-klient.json"));
    for (const r of DE_5_ROSTFILERNA) {
      if (!fs.existsSync(path.join(ROOT, r.fil))) {
        fel.push(`D3 (Fynd D7): MP3-fil saknas på disk: ${r.fil}`);
      }
      if (!manifest.rader?.[r.nyckel]) {
        fel.push(`D3 (Fynd D7): nyckel ${r.nyckel} ("${r.text}") saknas i data/rost-manifest.json`);
      }
      if (!Array.isArray(klient.rader?.[r.nyckel])) {
        fel.push(`D3 (Fynd D7): nyckel ${r.nyckel} saknas i data/rost-klient.json`);
      }
    }

    const rostTs = lasText("src/spel/rost.ts");
    if (!rostTs.includes("sammanhallenRostText")) {
      fel.push("D3 (Fynd D7): sammanhallenRostText saknas i src/spel/rost.ts");
    }

    // 2. Smeknamn i typer, tolk, minne, UI och 3D
    const typerTs = lasText("src/tolk/typer.ts");
    if (!typerTs.includes("smeknamn?:")) {
      fel.push("D3 (Fynd D5): smeknamn?: string saknas på Varelse i src/tolk/typer.ts");
    }
    const minneTs = lasText("src/spel/minne.ts");
    if (!minneTs.includes("bytSmeknamn")) {
      fel.push("D3 (Fynd D5): bytSmeknamn saknas i src/spel/minne.ts");
    }
    const bokSkarm = lasText("src/spel/ui/BokSkarm.tsx");
    if (!bokSkarm.includes("dop-knapp")) {
      fel.push("D3 (Fynd D5): dop-knapp saknas i src/spel/ui/BokSkarm.tsx");
    }
    const humorIkon = lasText("src/spel/ang/humorIkon.tsx");
    if (!humorIkon.includes("djur-namn-3d")) {
      fel.push("D3 (Fynd D5): djur-namn-3d saknas i src/spel/ang/humorIkon.tsx");
    }
    const samlingTsx = lasText("src/spel/samling.tsx");
    if (!samlingTsx.includes("smeknamn")) {
      fel.push("D3 (Fynd D5): smeknamn visas inte i AlbumVy (src/spel/samling.tsx)");
    }

    // Kör smeknamns- och röstkoll i node
    const d3Koll = spawnSync(
      process.execPath,
      [
        "--experimental-strip-types",
        "-e",
        `
        import { tolkaMedReserv } from "./src/tolk/reserv.ts";
        import { rostPlan } from "./src/spel/rostManifest.ts";
        import * as rostMod from "./src/spel/rost.ts";
        const fel = [];
        const u = tolkaMedReserv("en blå katt som heter Misse");
        if (u.typ !== "skapad" || u.varelse.kropp !== "katt" || u.varelse.smeknamn !== "Misse" || u.okanda.length > 0) {
          fel.push("tolkaMedReserv('en blå katt som heter Misse') gav: " + JSON.stringify({ typ: u.typ, kropp: u.varelse?.kropp, smeknamn: u.varelse?.smeknamn, okanda: u.okanda }));
        }
        if (typeof rostMod.sammanhallenRostText !== "function") {
          fel.push("sammanhallenRostText är inte exporterad från src/spel/rost.ts");
        } else {
          const prov = [
            "Guldord! Du skrev katt alldeles själv!",
            "Nytt ord i boken: glittrig!",
            "Hej! Här kommer en blå katt!",
            "Klart! En mur står på gården.",
            "+3 stjärnor!",
          ];
          for (const p of prov) {
            const mappad = rostMod.sammanhallenRostText(p);
            const plan = rostPlan(mappad);
            if (!plan || plan.length !== 1 || !plan[0].fil) {
              fel.push("sammanhallenRostText('" + p + "') -> '" + mappad + "' gav inte 1 sammanhållen MP3-fil: " + JSON.stringify(plan));
            }
          }
        }
        console.log(JSON.stringify({ fel }));
        `,
      ],
      { cwd: ROOT, encoding: "utf8" },
    );
    if (d3Koll.status !== 0) {
      fel.push(`D3 node-koll kraschade: ${d3Koll.stderr}`);
    } else {
      const ut = JSON.parse(d3Koll.stdout.trim().split("\n").at(-1) || '{"fel":[]}');
      for (const f of ut.fel || []) fel.push(`D3: ${f}`);
    }

    detalj.d3 = {
      har5RostFiler: DE_5_ROSTFILERNA.every((r) => fs.existsSync(path.join(ROOT, r.fil))),
      harBytSmeknamn: minneTs.includes("bytSmeknamn"),
      harDopKnapp: bokSkarm.includes("dop-knapp"),
      harDjurNamn3d: humorIkon.includes("djur-namn-3d"),
    };
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

async function korPlaywright() {
  const { fel, detalj } = korSnabbKontroll();
  if (fel.length > 0) {
    console.log(JSON.stringify({ ok: false, läge: "snabb-före-playwright", del: DEL, fel, detalj }, null, 2));
    process.exit(1);
  }

  fs.mkdirSync(UT_MAPP, { recursive: true });
  const port = 4273 + Math.floor(Math.random() * 200);
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
    const fallbackFel = [];
    page.on("pageerror", (e) => konsolFel.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") konsolFel.push(m.text());
    });

    await page.addInitScript(() => {
      window.addEventListener("trollpennan:model-fallback", (ev) => {
        (window.__fallbackLista = window.__fallbackLista || []).push(ev.detail);
      });
    });

    await page.goto(url, { waitUntil: "networkidle" });
    // Hoppa över introt direkt via store om introt visas
    await page.evaluate(() => {
      const st = window.__trollMinne?.getState?.();
      if (st?.sattIntro) st.sattIntro();
    });
    const hoppaOver = page.locator('[data-testid="intro-hoppa-over"], button:has-text("Hoppa över")');
    if ((await hoppaOver.count()) > 0 && (await hoppaOver.first().isVisible())) {
      await hoppaOver.first().click();
    }
    await page.waitForTimeout(500);

    // Hjälpfunktion: skriv och väck via ord-input
    async function skrivOchVack(mening) {
      const stang = page.locator('[data-testid="stang-bok"]');
      if (!(await stang.isVisible().catch(() => false))) {
        const skrivKnapp = page.locator('[data-testid="skriv-knapp"], [data-testid="hud-bok"], button:has-text("Skriv")');
        if ((await skrivKnapp.count()) > 0) await skrivKnapp.first().click();
      }
      await page.waitForTimeout(200);
      const input = page.locator('[data-testid="ord-input"]');
      await input.fill(mening);
      await page.waitForTimeout(150);
      await page.locator('[data-testid="vakna"]').click();
      await page.waitForTimeout(900);
    }

    if (KOR_D1) {
      // D2-kontroll: när boken är öppen får ord-input-ankare INTE vara document.activeElement och ska ha inputMode="none"
      const stang = page.locator('[data-testid="stang-bok"]');
      if (!(await stang.isVisible().catch(() => false))) {
        await page.locator('[data-testid="skriv-knapp"], [data-testid="hud-bok"], button:has-text("Skriv")').first().click();
        await page.waitForTimeout(250);
      }
      const inputMeta = await page.evaluate(() => {
        const el = document.querySelector('[data-testid="ord-input"]');
        return {
          inputMode: el?.getAttribute("inputmode"),
          tabIndex: el?.getAttribute("tabindex"),
          arAktiv: document.activeElement === el,
        };
      });
      if (inputMeta.inputMode !== "none" || inputMeta.arAktiv) {
        fel.push(`D1 (Fynd D2): ord-input fick fokus eller saknar inputmode="none": ${JSON.stringify(inputMeta)}`);
      }
      // Klicka på Skrivrutan (remsa) — ord-input får fortfarande inte bli activeElement
      await page.locator('[data-testid="remsa"]').click();
      await page.waitForTimeout(150);
      const aktivEfterRemsa = await page.evaluate(() => document.activeElement?.getAttribute("data-testid") === "ord-input");
      if (aktivEfterRemsa) {
        fel.push("D1 (Fynd D2): klick på skrivrutan fokuserade ord-input (triggar mobilens systemtangentbord)");
      }
      await page.screenshot({ path: path.join(UT_MAPP, "d1-inget-systemtangentbord.png") });

      // Skapa groda och säl på ängen och verifiera rena 3D-ansikten + 2D Doktor Bengtsson
      await skrivOchVack("en groda");
      await skrivOchVack("en säl");
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(UT_MAPP, "d1-ren-groda-2d-bengtsson.png") });
      detalj.d1.playwright = { inputMeta, aktivEfterRemsa };
    }

    if (KOR_D2) {
      await skrivOchVack("en groda som kan flyga och har hatt");
      await skrivOchVack("på en sten sitter en stor hund");
      await page.waitForTimeout(700);
      const aggAntal = await page.evaluate(() => {
        const tekst = document.body.innerText || "";
        return (tekst.match(/väntar på att kläckas/g) || []).length;
      });
      if (aggAntal > 0) {
        fel.push(`D2: reserv-ägg skapades vid bisats eller rumsscen (${aggAntal} st)`);
      }
      await page.screenshot({ path: path.join(UT_MAPP, "d2-groda-flyga-hatt-och-sten-hund.png") });
      detalj.d2.playwright = { aggAntal };
    }

    if (KOR_D3) {
      await skrivOchVack("en blå katt som heter Misse");
      await page.waitForTimeout(800);
      const namnSkyltar = await page.locator('[data-testid="djur-namn-3d"], .djur-namn-3d').allInnerTexts();
      if (!namnSkyltar.some((t) => t.includes("Misse"))) {
        fel.push(`D3 (Fynd D5): 3D-namnskylten "Misse" hittades inte ovanför katten på ängen (fick: ${JSON.stringify(namnSkyltar)})`);
      }
      await page.screenshot({ path: path.join(UT_MAPP, "d3-katt-heter-misse.png") });

      // Kontrollera gåvorutan för katten Misse via custom event troll-gava-klick
      const misseUid = await page.evaluate(() => {
        const d = document.querySelector('[data-testid^="humor3d-"][data-uid]');
        return d?.getAttribute("data-uid") || null;
      });
      if (misseUid) {
        await page.evaluate((uid) => {
          window.dispatchEvent(new CustomEvent("troll-gava-klick", { detail: uid }));
        }, misseUid);
        await page.waitForTimeout(350);
        const gavaText = await page.locator('[data-testid="gava-remsa"]').innerText().catch(() => "");
        if (!gavaText.includes("Misse")) {
          fel.push(`D3 (Fynd D5): gava-remsa visar inte smeknamnet "Misse" (fick: "${gavaText}")`);
        }
        const dopKnappSyns = await page.locator('[data-testid="dop-knapp"], [data-d3="dop-knapp"]').isVisible().catch(() => false);
        if (!dopKnappSyns) {
          fel.push("D3 (Fynd D5): dop-knapp syns inte i gava-remsa");
        }
      }
      await page.screenshot({ path: path.join(UT_MAPP, "d3-gavoruta-misse.png") });
      detalj.d3.playwright = { namnSkyltar, misseUid };
    }

    const fb = await page.evaluate(() => window.__fallbackLista || []);
    if (fb.length > 0) fallbackFel.push(...fb.map((x) => JSON.stringify(x)));
    if (konsolFel.length > 0) fel.push(`Konsolfel: ${konsolFel.slice(0, 3).join(" | ")}`);
    if (fallbackFel.length > 0) fel.push(`Modell-fallback: ${fallbackFel.join(", ")}`);
  } finally {
    if (browser) await browser.close();
    server.kill("SIGTERM");
  }

  return { fel, detalj };
}

if (SNABB) {
  const { fel, detalj } = korSnabbKontroll();
  const ok = fel.length === 0;
  console.log(JSON.stringify({ ok, läge: "snabb", del: DEL, fel, detalj }, null, 2));
  process.exit(ok ? 0 : 1);
} else {
  const { fel, detalj } = await korPlaywright();
  const ok = fel.length === 0;
  console.log(JSON.stringify({ ok, läge: "playwright-375x812", del: DEL, utMapp: UT_MAPP, fel, detalj }, null, 2));
  process.exit(ok ? 0 : 1);
}
