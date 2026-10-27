#!/usr/bin/env node
// Verifieringsprov för Blockserie U (U1–U4):
// - U1: Talspråkliga röstmeningar tillTalsprak(text) & singularfix i fyll.ts
// - U2: Kollisionsfria bottenknappar (.hud-bot.tva) & flytande .stall-chip.panel
// - U3: Färglagda, högkontrastrika djur- och ordkortsikoner i Pennans bok (aldrig rå /bas.png)
// - U4: Android Chrome-säker höjdbudget & visualViewport (--vvh) på 375x812, 375x640, 360x620 och 320x568
// Stöder: --snabb, --steg=u1|u2|u3|u4|alla, --ut <mapp>

import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

if (!process.env.__TSX_DELEGATED) {
  try {
    await import(new URL("../../src/spel/fyll.ts", import.meta.url).href);
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

const args = process.argv.slice(2);
const snabb = args.includes("--snabb");
const stegArg = args.find((a) => a.startsWith("--steg="))?.split("=")[1] ?? "alla";
const utIdx = args.indexOf("--ut");
const utMapp =
  utIdx >= 0 && args[utIdx + 1]
    ? path.resolve(args[utIdx + 1])
    : "/workspace/trollpennan-nulage/ko-27okt-u";

const KOR_U1 = stegArg === "u1" || stegArg === "alla";
const KOR_U2 = stegArg === "u2" || stegArg === "alla";
const KOR_U3 = stegArg === "u3" || stegArg === "alla";
const KOR_U4 = stegArg === "u4" || stegArg === "alla";
const ROT = process.cwd();

const fel = [];
const detalj = { u1: {}, u2: {}, u3: {}, u4: {} };

// ============================================================================
// DEL U1: Talspråklig röstmappning & singularfix
// ============================================================================
async function korU1Kontroller() {
  const rostMod = await import(path.join(ROT, "src/spel/rost.ts"));
  const manifestMod = await import(path.join(ROT, "src/spel/rostManifest.ts"));
  const fyllMod = await import(path.join(ROT, "src/spel/fyll.ts"));

  const { sammanhallenRostText, lasTid, tillTalsprak } = rostMod;
  const { rostPlan } = manifestMod;
  const { fyll } = fyllMod;

  if (typeof tillTalsprak !== "function") {
    fel.push("U1: src/spel/rost.ts exporterar inte tillTalsprak(text: string): string");
  }

  // 1. Singularfix i src/spel/fyll.ts
  const mossaEtt = fyll("+1 stjärnor från Mossa!", {});
  detalj.u1.fyllMossaEtt = mossaEtt;
  if (mossaEtt !== "+1 stjärna från Mossa!") {
    fel.push(`U1: fyll('+1 stjärnor från Mossa!', {}) gav '${mossaEtt}', förväntade '+1 stjärna från Mossa!'`);
  }

  // 2. Exakta talspråkliga mappningar och 1-MP3-planer (aldrig de hallusinerade +N-filerna)
  const FÖRBJUDNA_MP3 = new Set([
    "/ljud/rost/3e9dc37fe86a6d46.mp3", // "+1 stjärna!" ("plusskenshörna.")
    "/ljud/rost/615161bd5d1021d0.mp3", // "+2 stjärnor!" ("Försutt två stjärnor.")
  ]);

  const mappningar = [
    ["+1 stjärna!", "Du har fått en stjärna!"],
    ["+1 stjärna", "Du har fått en stjärna!"],
    ["+2 stjärnor!", "Du har fått två stjärnor!"],
    ["+3 stjärnor!", "Du har fått tre stjärnor!"],
    ["+4 stjärnor!", "Du har fått fyra stjärnor!"],
    ["+5 stjärnor!", "Du har fått fem stjärnor!"],
    ["+6 stjärnor!", "Hurra! Du fick nya stjärnor!"],
    ["+10 stjärnor!", "Hurra! Du fick nya stjärnor!"],
    ["+1 stjärna från Mossa!", "Du har fått en stjärna från Mossa!"],
    ["+1 stjärnor från Mossa!", "Du har fått en stjärna från Mossa!"],
    ["+2 stjärnor från Mossa!", ["Du har fått två stjärnor från Mossa!", "Du har fått nya stjärnor från Mossa!"]],
    ["+3 stjärnor från Mossa!", ["Du har fått tre stjärnor från Mossa!", "Du har fått nya stjärnor från Mossa!"]],
    ["+4 stjärnor från Mossa!", ["Du har fått fyra stjärnor från Mossa!", "Du har fått nya stjärnor från Mossa!"]],
    ["+5 stjärnor från Mossa!", ["Du har fått fem stjärnor från Mossa!", "Du har fått nya stjärnor från Mossa!"]],
    ["3 ⭐", "Nu tänds stjärnorna i boken."],
    ["12 stjärnor", "Nu tänds stjärnorna i boken."],
    ["1/3", "Titta i Uppdragsboken!"],
    ["Vad väcker vi först? →", "Vad ska vi väcka först?"],
    ["Uppdragsbok!", "Titta i Uppdragsboken!"],
    ["Till stallet", "Djuret är i stallet. Du kan hämta ut det igen i menyn när du vill."],
    ["ka – ___", "Ordet har 2 delar."],
    ["di – no – ___", "Ordet har 3 delar."],
  ];

  const kontrollerade = [];
  for (const [inStr, forvantad] of mappningar) {
    const ut = sammanhallenRostText(inStr);
    const tillatna = Array.isArray(forvantad) ? forvantad : [forvantad];
    if (!tillatna.includes(ut)) {
      fel.push(`U1: sammanhallenRostText('${inStr}') gav '${ut}', förväntade ${JSON.stringify(forvantad)}`);
    }
    const plan = rostPlan(ut);
    if (!plan || plan.dynamisk || plan.delar.length !== 1 || !("f" in plan.delar[0])) {
      fel.push(`U1: rostPlan('${ut}') (från '${inStr}') gav inte 1-MP3-plan: ${JSON.stringify(plan)}`);
      continue;
    }
    const mp3Rel = plan.delar[0].f;
    if (FÖRBJUDNA_MP3.has(mp3Rel)) {
      fel.push(`U1: '${inStr}' pekar fortfarande på trasig hallusinerad MP3-fil ${mp3Rel}`);
    }
    const mp3Fysisk = path.join(ROT, "public", mp3Rel);
    if (!fs.existsSync(mp3Fysisk)) {
      fel.push(`U1: MP3-filen saknas på disk: ${mp3Fysisk} (för '${ut}')`);
    }
    kontrollerade.push({ in: inStr, ut, f: mp3Rel, ms: plan.ms });
  }
  detalj.u1.mappningar = kontrollerade;

  // 3. lasTid("+1 stjärna!") ska använda den talade ersättningsmeningen
  const tid1 = lasTid("+1 stjärna!");
  detalj.u1.lasTidPlus1 = tid1;
  if (!(tid1 >= 1200)) {
    fel.push(`U1: lasTid('+1 stjärna!') är ${tid1} ms (< 1200 ms) — uppdatera lasTid i src/spel/rost.ts att använda sammanhallenRostText(text)`);
  }
}

// ============================================================================
// DEL U2: Statiska kontroller för bottenknappar & .stall-chip.panel
// ============================================================================
function korU2StatiskaKontroller() {
  const stylesCss = fs.readFileSync(path.join(ROT, "src/styles.css"), "utf8");
  const hudP2Css = fs.readFileSync(path.join(ROT, "src/spel/ui/hud-p2.css"), "utf8");

  if (/\.ang:has\(\.stall-chip\.panel\)\s*\.hud-bot\s*\{\s*right:\s*42%/u.test(stylesCss)) {
    fel.push("U2: src/styles.css har kvar '.ang:has(.stall-chip.panel) .hud-bot { right: 42% }' som mosar bottenknapparna vid djurklick");
  }
  if (!/\.stall-chip\.panel[\s\S]{0,400}?border-radius:\s*999px/u.test(stylesCss)) {
    fel.push("U2: .stall-chip.panel i src/styles.css saknar border-radius: 999px (flytande pillerknapp)");
  }
  if (!/\.stall-chip\.panel[\s\S]{0,400}?68px/u.test(stylesCss)) {
    fel.push("U2: .stall-chip.panel i src/styles.css saknar bottom: calc(max(10px, env(safe-area-inset-bottom)) + 68px)");
  }
  if (!/\.hud-bot\.tva[\s\S]{0,200}?minmax\(0,\s*1fr\)/u.test(hudP2Css)) {
    fel.push("U2: .hud-bot.tva i src/spel/ui/hud-p2.css saknar grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)");
  }
  if (!/@media\s*\(max-width:\s*359px\)/u.test(hudP2Css)) {
    fel.push("U2: src/spel/ui/hud-p2.css saknar @media (max-width: 359px) för 320x568");
  }
  detalj.u2.statiskOk = fel.filter((f) => f.startsWith("U2:")).length === 0;
}

// ============================================================================
// DEL U3: Statiska kontroller för djur- och ordkortsikoner (aldrig rå /bas.png)
// ============================================================================
async function korU3StatiskaKontroller() {
  const hjalpTxt = fs.readFileSync(path.join(ROT, "src/spel/ui/hjalp.ts"), "utf8");
  const bokKortTxt = fs.readFileSync(path.join(ROT, "src/spel/ui/BokKort.tsx"), "utf8");
  const bokKompCss = fs.readFileSync(path.join(ROT, "src/spel/ui/bok-komp.css"), "utf8");

  // 1. Kontrollera radantal på hjalp.ts och BokKort.tsx (<= 400 rader)
  const hjalpRader = hjalpTxt.split("\n").length;
  if (hjalpRader > 401) {
    fel.push(`U3: src/spel/ui/hjalp.ts har ${hjalpRader - 1} rader (> 400 rader bryter npm run check:struktur)`);
  }

  // 2. Kontrollera att kortIkon aldrig returnerar /bas.png i hjalp.ts
  if (/return\s+`\/kit\/kroppar\/\$\{mapp\}\/bas\.png`/u.test(hjalpTxt)) {
    fel.push("U3: src/spel/ui/hjalp.ts returnerar fortfarande rå '/kit/kroppar/${mapp}/bas.png' i kortIkon()");
  }
  if (!/export\s+function\s+kortDjurBas/u.test(hjalpTxt)) {
    fel.push("U3: src/spel/ui/hjalp.ts exporterar inte kortDjurBas(id: string)");
  }

  // 3. Kontrollera alla 26 djurnycklar via hjalp.ts-källkod och fysiska filer på disk
  const hjalpMod = await import(path.join(ROT, "src/spel/ui/hjalp.ts"));
  const djurIds = [
    "kanin", "katt", "kattunge", "kisse", "hund", "valp", "vovve", "drake",
    "häst", "ponny", "föl", "fågel", "fisk", "groda", "padda", "gris",
    "nöff", "nasse", "kulting", "dinosaurie", "dino", "uggla", "ekorre",
    "bäver", "haj", "enhörning",
  ];
  for (const id of djurIds) {
    const ikon = hjalpMod.kortIkon?.(id, "djur");
    if (!ikon || ikon.endsWith("/bas.png")) {
      fel.push(`U3: kortIkon("${id}", "djur") returnerade "${ikon}" (får aldrig vara tom eller sluta på /bas.png)`);
    } else if (!fs.existsSync(path.join(ROT, "public", ikon))) {
      fel.push(`U3: Bildfilen från kortIkon("${id}", "djur") saknas på disk: public${ikon}`);
    }
    if (typeof hjalpMod.kortDjurBas === "function") {
      const bas = hjalpMod.kortDjurBas(id);
      if (!bas || !bas.mask?.endsWith("/bas.png") || !bas.farg || /^#(?:fff|ffffff|fafafa|fffdf7|fff6e7)$/i.test(bas.farg)) {
        fel.push(`U3: kortDjurBas("${id}") gav ogiltig bas/färg: ${JSON.stringify(bas)}`);
      }
    }
  }
  const djurMappar = [
    "kanin", "katt", "hund", "drake", "hast", "fagel", "fisk",
    "groda", "gris", "dinosaurie", "uggla", "ekorre", "baver", "haj",
  ];
  for (const mapp of djurMappar) {
    const linjeFil = path.join(ROT, "public/kit/kroppar", mapp, "linje.png");
    const basFil = path.join(ROT, "public/kit/kroppar", mapp, "bas.png");
    if (!fs.existsSync(linjeFil) || !fs.existsSync(basFil)) {
      fel.push(`U3: Saknar linje.png eller bas.png för '${mapp}' i public/kit/kroppar/${mapp}/`);
    }
  }
  for (const v08Djur of ["kanin", "katt", "hund", "drake"]) {
    const webpFil = path.join(ROT, "public/ordkort/v08/illustrations", `${v08Djur}.webp`);
    if (!fs.existsSync(webpFil)) {
      fel.push(`U3: Saknar ${webpFil}`);
    }
  }

  // 4. Kontrollera BokKort.tsx och bok-komp.css för medaljongramarna
  if (!bokKortTxt.includes("kort-ikon-ram")) {
    fel.push("U3: src/spel/ui/BokKort.tsx saknar omslutande '.kort-ikon-ram' runt ordkortsikonen");
  }
  if (!bokKortTxt.includes("kort-ikon-ram-monster")) {
    fel.push("U3: src/spel/ui/BokKort.tsx saknar '.kort-ikon-ram-monster' för mönsterkort");
  }
  if (!bokKortTxt.includes("kort-ikon-ram-formaga")) {
    fel.push("U3: src/spel/ui/BokKort.tsx saknar '.kort-ikon-ram-formaga' för förmågekort");
  }
  if (!bokKompCss.includes(".kort-ikon-ram-monster") || !/#6E52AD|#3E286E/i.test(bokKompCss)) {
    fel.push("U3: src/spel/ui/bok-komp.css saknar mörk plommonmedaljong (#6E52AD -> #3E286E) på .kort-ikon-ram-monster");
  }
  if (!bokKompCss.includes(".kort-ikon-ram-formaga") || !/#4A607A|#29384C/i.test(bokKompCss)) {
    fel.push("U3: src/spel/ui/bok-komp.css saknar skifferblå medaljong (#4A607A -> #29384C) på .kort-ikon-ram-formaga");
  }

  detalj.u3.antalKontrolleradeDjur = djurIds.length;
  detalj.u3.statiskOk = fel.filter((f) => f.startsWith("U3:")).length === 0;
}

// ============================================================================
// DEL U4: Statiska kontroller för Android Chrome-höjdbudget & --vvh
// ============================================================================
function korU4StatiskaKontroller() {
  const bokSkarmTxt = fs.readFileSync(path.join(ROT, "src/spel/ui/BokSkarm.tsx"), "utf8");
  const spelTxt = fs.readFileSync(path.join(ROT, "src/spel/Spel.tsx"), "utf8");
  const bokKompCss = fs.readFileSync(path.join(ROT, "src/spel/ui/bok-komp.css"), "utf8");
  const bokV08Css = fs.readFileSync(path.join(ROT, "src/spel/ui/bok-v08.css"), "utf8");

  if (!bokSkarmTxt.includes("visualViewport") && !spelTxt.includes("visualViewport")) {
    fel.push("U4: Varken src/spel/ui/BokSkarm.tsx eller src/spel/Spel.tsx synkar '--vvh' från window.visualViewport.height");
  }
  if (/\.bok\s+\.meningsruta-innehall\s*\{[^}]*flex:\s*1\s+1\s+auto/u.test(bokKompCss)) {
    fel.push("U4: .bok .meningsruta-innehall i src/spel/ui/bok-komp.css har kvar 'flex: 1 1 auto' (ska vara 'flex: 1 1 88px; min-width: 0;' så .vakna stannar på rad 1)");
  }
  if (!/repeat\(\s*2\s*,\s*58px\s*\)/u.test(bokKompCss) || !/128px/u.test(bokKompCss)) {
    fel.push("U4: .ordkort-panel[data-m3=\"kort-grid\"] i src/spel/ui/bok-komp.css saknar grid-template-rows: repeat(2, 58px) och height: 128px");
  }
  if (!bokV08Css.includes("--vvh")) {
    fel.push("U4: src/spel/ui/bok-v08.css använder inte var(--vvh, 100dvh) i max-height-reglerna för .bok");
  }
  detalj.u4.statiskOk = fel.filter((f) => f.startsWith("U4:")).length === 0;
}

// ============================================================================
// GEMENSAM VITE + PLAYWRIGHT-KÖRNING FÖR U2, U3 & U4
// ============================================================================
async function startaViteServer() {
  const port = 4390 + Math.floor(Math.random() * 400);
  const proc = spawn("npx", ["vite", "--port", String(port), "--host", "127.0.0.1"], {
    cwd: ROT,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const basUrl = `http://127.0.0.1:${port}/`;
  const start = Date.now();
  while (Date.now() - start < 25000) {
    try {
      const r = await fetch(basUrl);
      if (r.ok) return { proc, basUrl };
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  proc.kill("SIGTERM");
  throw new Error("Kunde inte starta Vite-server inom 25 s");
}

function krockYta(a, b) {
  if (!a || !b) return 0;
  const dx = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const dy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return Math.round(dx * dy);
}

async function matU2Vy(browser, basUrl, bredd, hojd, bildNamnUtan, bildNamnValt) {
  const ctx = await browser.newContext({
    viewport: { width: bredd, height: hojd },
    deviceScaleFactor: 1,
    locale: "sv-SE",
  });
  await ctx.addInitScript(() => {
    if (!sessionStorage.getItem("u2_init")) {
      localStorage.setItem(
        "trollpennan-v2",
        JSON.stringify({
          version: 2,
          introSedd: true,
          dragit: true,
          ang: [],
          garden: [],
          stjarnor: 2,
          oppnadePlatser: ["skogen", "sjon", "grottan"],
          seddaIntro: ["skogen", "sjon", "grottan", "garden", "gard"],
          platsSkapelser: {},
        })
      );
      sessionStorage.setItem("u2_init", "1");
    }
  });

  const p = await ctx.newPage();
  const sidFel = [];
  p.on("pageerror", (e) => sidFel.push(String(e).slice(0, 300)));
  await p.goto(basUrl, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => Boolean(window.__troll), null, { timeout: 25000 });
  await p.waitForTimeout(1800);

  await p.evaluate(() => window.__troll.vakna("en räv"));
  await p.waitForTimeout(2400);
  const stangSynlig = await p.locator('[data-testid="stang-bok"]').first().isVisible().catch(() => false);
  if (stangSynlig) {
    await p.click('[data-testid="stang-bok"]');
    await p.waitForTimeout(400);
  }
  const uid = await p.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("trollpennan-v2") ?? "{}");
    return s.ang?.at(-1)?.uid ?? null;
  });
  if (uid) {
    await p.evaluate((u) => window.__troll.humor(u, "glad"), uid);
    await p.waitForTimeout(400);
  }

  const fore = await p.evaluate(() => {
    const r = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: b.width, height: b.height };
    };
    return {
      upp: r('[data-testid="bengtsson-ikon"]'),
      skapa: r('[data-testid="pennans-bok"]'),
    };
  });

  if (bildNamnUtan) {
    fs.mkdirSync(utMapp, { recursive: true });
    await p.screenshot({ path: path.join(utMapp, bildNamnUtan) });
  }

  for (let forsok = 0; forsok < 10; forsok++) {
    const m = await p.evaluate((u) => (u && window.__tredMal ? window.__tredMal[u] ?? null : null), uid);
    if (m) {
      for (const dy of [40, 55, 25, 70, 10]) {
        await p.mouse.click(m.x, m.y + dy);
        await p.waitForTimeout(550);
        const synlig = await p.locator('[data-testid="djur-till-stall"]').first().isVisible().catch(() => false);
        if (synlig) break;
      }
    }
    const synlig = await p.locator('[data-testid="djur-till-stall"]').first().isVisible().catch(() => false);
    if (synlig) break;
    await p.waitForTimeout(300);
  }

  const efter = await p.evaluate(() => {
    const r = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return {
        left: Math.round(b.left * 10) / 10,
        top: Math.round(b.top * 10) / 10,
        right: Math.round(b.right * 10) / 10,
        bottom: Math.round(b.bottom * 10) / 10,
        width: Math.round(b.width * 10) / 10,
        height: Math.round(b.height * 10) / 10,
      };
    };

    const textInutiKnapp = (btnSel) => {
      const btn = document.querySelector(btnSel);
      if (!btn) return { ok: false, anledning: "knapp saknas" };
      const bRect = btn.getBoundingClientRect();
      const spans = [...btn.querySelectorAll(".hud-kort-over, .hud-kort-huvud, .hud-kort-text")];
      const ut = [];
      for (const sp of spans) {
        const sRect = sp.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(sp);
        const rRect = range.getBoundingClientRect();
        const scrollDiff = sp.scrollWidth - sp.clientWidth;
        ut.push({
          klass: sp.className,
          text: sp.textContent?.trim() ?? "",
          scrollDiff,
          leftMarginal: Math.round((rRect.left - bRect.left) * 10) / 10,
          rightMarginal: Math.round((bRect.right - rRect.right) * 10) / 10,
          inomKnapp: rRect.left >= bRect.left + 2 && rRect.right <= bRect.right - 2 && scrollDiff <= 1,
          sRect: { left: Math.round(sRect.left), right: Math.round(sRect.right), width: Math.round(sRect.width) },
        });
      }
      return {
        ok: ut.every((x) => x.inomKnapp),
        detaljer: ut,
      };
    };

    const uppEl = document.querySelector('[data-testid="bengtsson-ikon"]');
    const skapaEl = document.querySelector('[data-testid="pennans-bok"]');
    const stallEl = document.querySelector('[data-testid="djur-till-stall"]');
    const hudBotEl = document.querySelector(".hud-bot.tva, .hud-bot");

    return {
      upp: r(uppEl),
      skapa: r(skapaEl),
      stall: r(stallEl),
      hudBot: r(hudBotEl),
      uppTextKoll: textInutiKnapp('[data-testid="bengtsson-ikon"]'),
      skapaTextKoll: textInutiKnapp('[data-testid="pennans-bok"]'),
    };
  });

  if (bildNamnValt) {
    fs.mkdirSync(utMapp, { recursive: true });
    await p.screenshot({ path: path.join(utMapp, bildNamnValt) });
  }

  await ctx.close();
  return { bredd, hojd, sidFel, fore, efter };
}

async function matU3OchU4IBok(browser, basUrl) {
  // Testa 4 skärmstorlekar i Pennans bok:
  // 1) 375x640 (Android Chrome med synligt adressfält + 3-knappars navigationsfält, Första skapelse)
  // 2) 360x620 (Smalare Android Chrome-vy, Första skapelse)
  // 3) 375x812 (Standardmobil i Första skapelse + vanligt läge)
  // 4) 320x568 (Kompakt mobil)
  const vyer = [
    { namn: "android-375x640", bredd: 375, hojd: 640, forsta: true, bild: "u3-u4-bok-djur-375x640-android.png" },
    { namn: "android-360x620", bredd: 360, hojd: 620, forsta: true, bild: null },
    { namn: "standard-375x812-forsta", bredd: 375, hojd: 812, forsta: true, bild: null },
    { namn: "standard-375x812-vanlig", bredd: 375, hojd: 812, forsta: false, bild: null },
    { namn: "kompakt-320x568", bredd: 320, hojd: 568, forsta: false, bild: null },
  ];

  const vyResultat = {};

  for (const vy of vyer) {
    const ctx = await browser.newContext({
      viewport: { width: vy.bredd, height: vy.hojd },
      deviceScaleFactor: 1,
      locale: "sv-SE",
    });
    await ctx.addInitScript((arForsta) => {
      if (!sessionStorage.getItem("u34_init")) {
        localStorage.setItem(
          "trollpennan-v2",
          JSON.stringify({
            version: 2,
            introSedd: true,
            dragit: true,
            ang: arForsta
              ? []
              : [{ uid: "u-kanin-1", kropp: "kanin", farg: "#F3C68F", skala: 1, x: 0.5, y: 0.5 }],
            garden: [],
            stjarnor: 2,
            oppnadePlatser: ["skogen"],
            seddaIntro: ["skogen"],
            platsSkapelser: {},
          })
        );
        sessionStorage.setItem("u34_init", "1");
      }
    }, vy.forsta);

    const p = await ctx.newPage();
    await p.goto(basUrl, { waitUntil: "domcontentloaded" });
    await p.waitForFunction(() => Boolean(window.__troll), null, { timeout: 25000 });
    await p.waitForTimeout(1000);

    // Öppna Pennans bok om den inte redan är öppen (i Första skapelse öppnas den direkt eller via pennans-bok)
    const bokSynlig = await p.locator(".bok").first().isVisible().catch(() => false);
    if (!bokSynlig) {
      const bokKnapp = p.locator('[data-testid="pennans-bok"]').first();
      if (await bokKnapp.isVisible().catch(() => false)) {
        await bokKnapp.click();
        await p.waitForTimeout(350);
      }
    }

    if (vy.bild) {
      fs.mkdirSync(utMapp, { recursive: true });
      await p.screenshot({ path: path.join(utMapp, vy.bild) });
    }

    const m = await p.evaluate(() => {
      const r = (el) => {
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return {
          left: Math.round(b.left * 10) / 10,
          top: Math.round(b.top * 10) / 10,
          right: Math.round(b.right * 10) / 10,
          bottom: Math.round(b.bottom * 10) / 10,
          width: Math.round(b.width * 10) / 10,
          height: Math.round(b.height * 10) / 10,
        };
      };

      const klickbar = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return { finns: false, ok: false };
        const b = el.getBoundingClientRect();
        const cx = b.left + b.width / 2;
        const cy = b.top + b.height / 2;
        if (cx < 0 || cy < 0 || cx > window.innerWidth || cy > window.innerHeight) {
          return { finns: true, ok: false, anledning: "utanför viewport", b };
        }
        const traff = document.elementFromPoint(cx, cy);
        const ok = Boolean(traff && (traff === el || el.contains(traff) || traff.contains(el)));
        return { finns: true, ok, b: r(el), traffTag: traff?.tagName ?? null };
      };

      const bokEl = document.querySelector(".bok");
      const bokRect = r(bokEl);
      const lyssnaRect = r(document.querySelector(".bok .remsa-lyssna"));
      const vaknaRect = r(document.querySelector('.bok [data-testid="vakna"]'));
      const remsaRect = r(document.querySelector(".bok .steg-nav-remsa"));
      const gridEl = document.querySelector('.bok [data-m3="kort-grid"]');
      const gridRect = r(gridEl);

      const medelFargBild = (img) => {
        if (!(img instanceof HTMLImageElement) || !img.complete || img.naturalWidth === 0) return null;
        const c = document.createElement("canvas");
        c.width = 32;
        c.height = 32;
        const cx = c.getContext("2d");
        if (!cx) return null;
        cx.drawImage(img, 0, 0, 32, 32);
        const d = cx.getImageData(0, 0, 32, 32).data;
        let rSum = 0, gSum = 0, bSum = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] > 32) {
            rSum += d[i];
            gSum += d[i + 1];
            bSum += d[i + 2];
            n++;
          }
        }
        if (n === 0) return { r: 255, g: 255, b: 255, helvit: true };
        const mr = Math.round(rSum / n), mg = Math.round(gSum / n), mb = Math.round(bSum / n);
        return { r: mr, g: mg, b: mb, helvit: mr >= 250 && mg >= 250 && mb >= 250 };
      };

      const kortLista = [...document.querySelectorAll('.bok [data-m3="kort-grid"] .ord-kort')].map((k) => {
        const kr = r(k);
        const img = k.querySelector("img.kort-ikon");
        const ram = k.querySelector(".kort-ikon-ram");
        const src = img?.getAttribute("src") ?? "";
        const medel = medelFargBild(img);
        return {
          id: k.getAttribute("data-testid") ?? "",
          rect: kr,
          src,
          medelFarg: medel,
          harRam: Boolean(ram),
          ramKlass: ram?.className ?? "",
          inomBok: Boolean(bokRect && kr && kr.bottom <= bokRect.bottom + 1 && kr.top >= bokRect.top),
        };
      });

      return {
        innerW: window.innerWidth,
        innerH: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        vvh: document.documentElement.style.getPropertyValue("--vvh"),
        bokRect,
        lyssnaRect,
        vaknaRect,
        vaknaPaRad1: Boolean(lyssnaRect && vaknaRect && Math.abs(vaknaRect.top - lyssnaRect.top) <= 12),
        gridRect,
        gridOverflow: gridEl ? gridEl.scrollHeight - gridEl.clientHeight : 0,
        kortLista,
        remsaRect,
        sidaFramKlickbar: klickbar('[data-m3="sida-fram"]'),
        stegNastaKlickbar: klickbar('[data-m3="steg-nasta"]'),
      };
    });

    vyResultat[vy.namn] = m;

    // Om detta är standard-375x812-vanlig och KOR_U3 är aktivt: kontrollera även Sida 2 av djur (linje.png + kort-ikon-ram-djur) samt Steg 2 Mönster
    if (vy.namn === "standard-375x812-vanlig" && KOR_U3) {
      await p.locator('[data-m3="sida-fram"]').click();
      await p.waitForTimeout(200);
      const sida2Djur = await p.evaluate(() => {
        return [...document.querySelectorAll('.bok [data-m3="kort-grid"] .ord-kort')].map((k) => {
          const img = k.querySelector("img.kort-ikon");
          const ram = k.querySelector(".kort-ikon-ram");
          const st = ram ? getComputedStyle(ram) : null;
          return {
            id: k.getAttribute("data-testid"),
            src: img?.getAttribute("src") ?? "",
            ramKlass: ram?.className ?? "",
            djurFarg: st?.getPropertyValue("--djur-farg")?.trim() ?? "",
          };
        });
      });
      detalj.u3.sida2Djur = sida2Djur;
      for (const d of sida2Djur) {
        if (d.src.endsWith("/bas.png")) {
          fel.push(`U3: Djurkort ${d.id} på sida 2 använder fortfarande rå /bas.png (${d.src})`);
        }
        if (d.src.endsWith("/linje.png") && (!d.ramKlass.includes("kort-ikon-ram-djur") || !d.djurFarg)) {
          fel.push(`U3: Djurkort ${d.id} med linje.png saknar .kort-ikon-ram-djur eller --djur-farg: ${JSON.stringify(d)}`);
        }
      }

      // Gå till Steg 2 -> ✨ Mönster och ta bevisbild u3-u4-bok-monster-375x812.png
      await p.locator('[data-m3="steg-2"]').click();
      await p.waitForTimeout(150);
      const monsterFlik = p.locator('.steg-underflikar button:has-text("Mönster")').first();
      if (await monsterFlik.isVisible().catch(() => false)) {
        await monsterFlik.click();
        await p.waitForTimeout(200);
      }
      fs.mkdirSync(utMapp, { recursive: true });
      await p.screenshot({ path: path.join(utMapp, "u3-u4-bok-monster-375x812.png") });

      const monsterKoll = await p.evaluate(() => {
        return [...document.querySelectorAll('.bok [data-m3="kort-grid"] .ord-kort')].map((k) => {
          const ram = k.querySelector(".kort-ikon-ram");
          const st = ram ? getComputedStyle(ram) : null;
          return {
            id: k.getAttribute("data-testid"),
            ramKlass: ram?.className ?? "",
            bgImage: st?.backgroundImage ?? "",
            bgColor: st?.backgroundColor ?? "",
          };
        });
      });
      detalj.u3.monsterKoll = monsterKoll;
      if (monsterKoll.some((mk) => !mk.ramKlass.includes("kort-ikon-ram-monster"))) {
        fel.push(`U3: Mönsterkort saknar .kort-ikon-ram-monster: ${JSON.stringify(monsterKoll)}`);
      }
    }

    await ctx.close();
  }

  detalj.u4.vyer = vyResultat;

  // Verifiera U3 i DOM (Sida 1 djur på android-375x640)
  if (KOR_U3) {
    const kortSida1 = vyResultat["android-375x640"]?.kortLista ?? [];
    detalj.u3.sida1Djur = kortSida1;
    if (kortSida1.length !== 4) {
      fel.push(`U3: Förväntade 4 synliga djurkort på Sida 1, fick ${kortSida1.length}`);
    }
    for (const k of kortSida1) {
      if (!k.src || k.src.endsWith("/bas.png")) {
        fel.push(`U3: Djurkort '${k.id}' har förbjuden bildkälla '${k.src}' (får aldrig vara /bas.png)`);
      }
      if (!k.harRam) {
        fel.push(`U3: Djurkort '${k.id}' saknar .kort-ikon-ram`);
      }
      if (k.medelFarg?.helvit) {
        fel.push(`U3: Djurkort '${k.id}' har helvit medelfärg (${JSON.stringify(k.medelFarg)}) — rå vit alfamask!`);
      }
    }
  }

  // Verifiera U4 geometri i alla 5 vy-konfigurationer
  if (KOR_U4) {
    for (const [namn, m] of Object.entries(vyResultat)) {
      if (!m.bokRect || !m.remsaRect) {
        fel.push(`U4 (${namn}): Saknar .bok eller .steg-nav-remsa`);
        continue;
      }
      // 1. .vakna på samma rad som .remsa-lyssna på alla >= 360 px vyer
      if (m.innerW >= 360 && !m.vaknaPaRad1) {
        fel.push(
          `U4 (${namn}): [🎉 Väck till liv!] (.vakna top=${m.vaknaRect?.top}) bröts ner på rad 2 under .remsa-lyssna (top=${m.lyssnaRect?.top})`
        );
      }
      // 2. Alla 4 ordkort är 100 % synliga inuti .bok och har höjd >= 56 px (>= 58 px på 375x812)
      const minKortH = m.innerH >= 800 ? 58 : 54;
      if (m.kortLista.length !== 4) {
        fel.push(`U4 (${namn}): Förväntade 4 synliga ordkort i 2x2-griden, fick ${m.kortLista.length}`);
      }
      for (const k of m.kortLista) {
        if (!k.inomBok || !k.rect || k.rect.bottom > m.innerH - 30 || k.rect.height < minKortH) {
          fel.push(`U4 (${namn}): Ordkort '${k.id}' är klippt eller för lågt: ${JSON.stringify(k)}`);
        }
      }
      // 3. .steg-nav-remsa är 100 % synlig inuti .bok och klickbar via elementFromPoint
      if (m.remsaRect.bottom > m.bokRect.bottom + 1 || m.remsaRect.bottom > m.innerH - 6) {
        fel.push(
          `U4 (${namn}): .steg-nav-remsa är klippt i nederkant (remsa.bottom=${m.remsaRect.bottom}, bok.bottom=${m.bokRect.bottom}, innerH=${m.innerH})`
        );
      }
      if (!m.sidaFramKlickbar.ok || !m.stegNastaKlickbar.ok) {
        fel.push(
          `U4 (${namn}): Sidbläddringsknapparna i .steg-nav-remsa är inte klickbara med elementFromPoint: ${JSON.stringify({
            sidaFram: m.sidaFramKlickbar,
            stegNasta: m.stegNastaKlickbar,
          })}`
        );
      }
      // 4. Regressionsvakter mot prov-f1-f3.mjs och prov-c1-c4.mjs
      if (namn === "standard-375x812-forsta" && (m.bokRect.top < 360 || m.bokRect.height > 452)) {
        fel.push(`U4 (${namn}): Bryter mot prov-f1-f3.mjs (bokTop=${m.bokRect.top} < 360 eller bokHeight=${m.bokRect.height} > 452)`);
      }
      if (namn === "standard-375x812-vanlig" && m.bokRect.top < 220) {
        fel.push(`U4 (${namn}): Bryter mot prov-c1-c4.mjs AC01 (sheetTop=${m.bokRect.top} < 220)`);
      }
      if (namn === "kompakt-320x568" && (m.bokRect.top < 136 || m.scrollWidth > 320)) {
        fel.push(`U4 (${namn}): Bryter mot prov-c1-c4.mjs AC12/G4 (sheetTop=${m.bokRect.top} < 136 eller scrollWidth=${m.scrollWidth} > 320)`);
      }
    }
  }
}

async function korPlaywrightAllt() {
  const pwPath = fs.existsSync(path.join(ROT, "node_modules/playwright/index.mjs")) ? path.join(ROT, "node_modules/playwright/index.mjs") : "playwright";
  const { chromium } = await import(pwPath);
  const { proc, basUrl } = await startaViteServer();
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  try {
    if (KOR_U2) {
      const v375 = await matU2Vy(
        browser,
        basUrl,
        375,
        812,
        "u2-hud-utan-djur-375x812.png",
        "u2-hud-djur-valt-375x812.png"
      );
      const v320 = await matU2Vy(
        browser,
        basUrl,
        320,
        568,
        null,
        "u2-hud-djur-valt-320x568.png"
      );

      detalj.u2.vy375 = v375;
      detalj.u2.vy320 = v320;

      for (const v of [v375, v320]) {
        const tagg = `U2 (${v.bredd}x${v.hojd})`;
        if (v.sidFel.length > 0) {
          fel.push(`${tagg}: Page error: ${v.sidFel[0]}`);
        }
        if (!v.efter.upp || !v.efter.skapa || !v.efter.stall) {
          fel.push(`${tagg}: Saknar upp/skapa/stall-knapp: ${JSON.stringify(v.efter)}`);
          continue;
        }
        const dW1 = Math.abs((v.fore.upp?.width ?? 0) - v.efter.upp.width);
        const dW2 = Math.abs((v.fore.skapa?.width ?? 0) - v.efter.skapa.width);
        if (dW1 > 1.5 || dW2 > 1.5) {
          fel.push(`${tagg}: Huvudknapparna ändrade bredd vid djurklick (dW1=${dW1}, dW2=${dW2})`);
        }
        const minW = v.bredd >= 375 ? 168 : 142;
        if (v.efter.upp.width < minW || v.efter.skapa.width < minW) {
          fel.push(`${tagg}: Huvudknapparna är för smala (${v.efter.upp.width}px / ${v.efter.skapa.width}px < ${minW}px)`);
        }
        if (krockYta(v.efter.upp, v.efter.skapa) > 0) {
          fel.push(`${tagg}: bengtsson-ikon och pennans-bok överlappar varandra`);
        }
        if (krockYta(v.efter.stall, v.efter.upp) > 0 || krockYta(v.efter.stall, v.efter.skapa) > 0) {
          fel.push(`${tagg}: 'Till stallet' överlappar huvudknapparna (${JSON.stringify({ stall: v.efter.stall, skapa: v.efter.skapa })})`);
        }
        if (v.efter.stall.bottom > v.efter.skapa.top - 2) {
          fel.push(`${tagg}: 'Till stallet' (bottom=${v.efter.stall.bottom}) ligger inte ovanför pennans-bok (top=${v.efter.skapa.top})`);
        }
        if (v.bredd === 375 && (v.efter.stall.top < 812 - 120 || v.efter.stall.bottom > 812)) {
          fel.push(`${tagg}: 'Till stallet' bryter mot b61-prov.mjs:145 (top=${v.efter.stall.top} < 692 eller bottom=${v.efter.stall.bottom} > 812)`);
        }
        if (!v.efter.uppTextKoll.ok) {
          fel.push(`${tagg}: Text rinner utanför bengtsson-ikon: ${JSON.stringify(v.efter.uppTextKoll.detaljer)}`);
        }
        if (!v.efter.skapaTextKoll.ok) {
          fel.push(`${tagg}: Text rinner utanför pennans-bok: ${JSON.stringify(v.efter.skapaTextKoll.detaljer)}`);
        }
      }
    }

    if (KOR_U3 || KOR_U4) {
      await matU3OchU4IBok(browser, basUrl);
    }
  } finally {
    await browser.close();
    proc.kill("SIGTERM");
  }
}

if (KOR_U1) {
  await korU1Kontroller();
}
if (KOR_U2) {
  korU2StatiskaKontroller();
}
if (KOR_U3) {
  await korU3StatiskaKontroller();
}
if (KOR_U4) {
  korU4StatiskaKontroller();
}
if (!snabb && (KOR_U2 || KOR_U3 || KOR_U4)) {
  await korPlaywrightAllt();
}

const ut = {
  ok: fel.length === 0,
  snabb,
  steg: stegArg,
  antalFel: fel.length,
  fel,
  detalj,
};
console.log(JSON.stringify(ut, null, 2));
process.exit(fel.length === 0 ? 0 : 1);
