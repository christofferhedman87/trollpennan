#!/usr/bin/env node
// Verifieringsprov för Blockserie R (R1–R2: Kompletta Röstinspelningar i ElevenLabs)
// Stöder: --snabb, --steg=r1|r2|alla, --ut <mapp>

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

import { ALLA_UPPDRAG, uppdragText } from "../../src/spel/aventyr.ts";
import { borjan, uppdragForslag } from "../../src/spel/ideRad.ts";
import { ledtradsSteg } from "../../src/spel/lasniva.ts";
import { sammanhallenRostText } from "../../src/spel/rost.ts";
import { DYNAMISK, rostPlan } from "../../src/spel/rostManifest.ts";
import { gavoRuta } from "../../src/spel/ui/gavoRuta.ts";
import { frasForByggOrd, kanEtikett } from "../../src/spel/ui/hjalp.ts";
import { rostKandidater } from "../../scripts/rost-kandidater.mjs";

const KANDIDAT_RADER = rostKandidater();
const args = process.argv.slice(2);
const snabb = args.includes("--snabb");
const stegArg = args.find((a) => a.startsWith("--steg="))?.split("=")[1] ?? "alla";
const utIdx = args.indexOf("--ut");
const utMapp = utIdx >= 0 && args[utIdx + 1] ? path.resolve(args[utIdx + 1]) : null;

const ROT = process.cwd();
const lasJson = (p) => JSON.parse(fs.readFileSync(path.join(ROT, p), "utf8"));

function korR1Kontroller(fel, detalj) {
  const manifest = lasJson("data/rost-manifest.json");
  const klient = lasJson("data/rost-klient.json");
  const rostCfg = lasJson("data/rost.json");

  // 1. Inga saknade MP3-filer eller lånade placeholder-hashar
  const filMengd = new Set(fs.readdirSync(path.join(ROT, "public/ljud/rost")));
  let saknadeMp3 = 0;
  const fMap = new Map();
  for (const r of Object.values(manifest.rader)) {
    const bas = path.basename(r.f);
    if (!filMengd.has(bas)) saknadeMp3++;
    fMap.set(r.t.normalize("NFC"), bas);
  }
  detalj.antalManifestRader = Object.keys(manifest.rader).length;
  detalj.antalMp3Filer = filMengd.size;
  detalj.saknadeMp3 = saknadeMp3;
  if (saknadeMp3 > 0) fel.push(`R1: ${saknadeMp3} rader i rost-manifest.json saknar MP3-fil i public/ljud/rost/`);

  // Kolla att "ett hus" och "en hus" inte delar MP3-fil (A1 placeholder-koll)
  if (fMap.get("ett hus") === fMap.get("en hus")) {
    fel.push("R1: 'ett hus' delar fortfarande placeholder-MP3 med 'en hus'");
  }
  if (!fMap.has("Solgården") || !fMap.has("kapybara") || !fMap.has("dansande") || !fMap.has("glad") || !fMap.has("en jätte")) {
    fel.push("R1: Någon av de 5 saknade A1-raderna (Solgården/kapybara/dansande/glad/en jätte) saknas i manifestet");
  }

  // 2. DYNAMISK === "tyst"
  detalj.dynamisk = DYNAMISK;
  if (rostCfg.dynamisk !== "tyst" || klient.dynamisk !== "tyst" || DYNAMISK !== "tyst") {
    fel.push(`R1: dynamisk ska vara 'tyst' i rost.json (${rostCfg.dynamisk}), rost-klient.json (${klient.dynamisk}) och DYNAMISK (${DYNAMISK})`);
  }

  // 3. Alla 101 uppdragText(u) ska ha 1-MP3-plan (delar.length === 1, dynamisk: false)
  let uppdragTextFel = 0;
  for (const u of ALLA_UPPDRAG) {
    const t = uppdragText(u);
    const pT = rostPlan(t);
    if (!pT || pT.dynamisk || pT.delar.length !== 1) uppdragTextFel++;
  }
  detalj.uppdragText1Mp3 = `${ALLA_UPPDRAG.length - uppdragTextFel}/${ALLA_UPPDRAG.length}`;
  if (uppdragTextFel > 0) fel.push(`R1: ${uppdragTextFel} uppdragText(u) saknar 1-MP3-plan`);

  // 4. Alla bengtsson.json val.grupper[].forslag[].fras och borjan ska ha 1-MP3-plan
  const bengt = lasJson("data/bengtsson.json");
  let bengtFel = 0;
  let bengtTotal = 0;
  for (const u of bengt.uppdrag) {
    for (const g of u.val?.grupper ?? []) {
      for (const f of g.forslag ?? []) {
        bengtTotal++;
        const p = rostPlan(f.fras);
        if (!p || p.dynamisk || p.delar.length !== 1) bengtFel++;
        const b = borjan(u.krav, f.fras);
        if (b) {
          bengtTotal++;
          const pb = rostPlan(b);
          if (!pb || pb.dynamisk || pb.delar.length !== 1) bengtFel++;
        }
      }
    }
  }
  detalj.bengtssonForslag1Mp3 = `${bengtTotal - bengtFel}/${bengtTotal}`;
  if (bengtFel > 0) fel.push(`R1: ${bengtFel}/${bengtTotal} bengtsson forslag/borjan saknar 1-MP3-plan`);

  // 5. Alla 8 kanEtikett(ord) ska ha 1-MP3-plan
  const ordJson = lasJson("data/ord.json");
  const formagor = ordJson.ord.filter((o) => o.klass === "formaga");
  for (const o of formagor) {
    const etikett = kanEtikett(o);
    const p = rostPlan(etikett);
    if (!p || p.dynamisk || p.delar.length !== 1) {
      fel.push(`R1: kanEtikett('${o.id}') -> '${etikett}' saknar 1-MP3-plan`);
    }
  }

  // 6. Alla idékort, C1–C4 gåvo-/dopfraser och skapelse-/byggmeningar ska ha 1-MP3-plan
  const ettMp3Prov = [
    ...(lasJson("data/upplevelse.json").examples ?? []),
    "en morot",
    "ett äpple",
    "en mössa",
    gavoRuta(""),
    gavoRuta("katt"),
    "Här får du en morot!",
    "Här får du ett äpple!",
    "Här får du en mössa!",
    "Här får du en halsduk!",
    "Nu heter djuret Skuttis!",
    "Nu heter djuret Misse!",
    "Nu heter djuret Blixten!",
    "Hej! Här kommer en kanin!",
    "Hej! Här kommer en kapybara!",
    "Klart! ett hus står på gården.",
    "Ordet har 1 del.",
    "Ordet har 2 delar.",
    "Ordet har 5 delar.",
    "Världskartan. Välj en plats på stigen! Alla vägar är öppna.",
    "en blå kanin",
    "en röd katt",
    "en kanin med mössa",
    frasForByggOrd("hus"),
  ];
  for (const s of ettMp3Prov) {
    const p = rostPlan(s);
    if (!p || p.dynamisk || p.delar.length !== 1) {
      fel.push(`R1: '${s}' förväntades ge 1-MP3-plan, fick ${JSON.stringify(p)}`);
    }
  }

  // 7. Emoji- & dubbelpunktsnormalisering, flermeningssträngar + fria flerordsmeningar i Pennans bok
  const emojiPlan = rostPlan("✨ Uppdrag klart!");
  if (!emojiPlan || emojiPlan.dynamisk || emojiPlan.delar.length !== 1) {
    fel.push(`R1: rostPlan('✨ Uppdrag klart!') misslyckades: ${JSON.stringify(emojiPlan)}`);
  }
  const dubbelPunktPlan = rostPlan("Det verkar som att din kanin fryser.. Se om du kan skriva fram något som värmer.");
  if (!dubbelPunktPlan || dubbelPunktPlan.dynamisk || dubbelPunktPlan.delar.length !== 1) {
    fel.push(`R1: rostPlan med dubbelpunkt ('..') misslyckades: ${JSON.stringify(dubbelPunktPlan)}`);
  }
  const flerMeningPlan = rostPlan("Min mamma är en katt. Ordet har 2 delar.");
  if (!flerMeningPlan || flerMeningPlan.dynamisk || flerMeningPlan.delar.length !== 2) {
    fel.push(`R1: Flermeningssträng ('<gåta> Ordet har 2 delar.') misslyckades: ${JSON.stringify(flerMeningPlan)}`);
  }
  const friaMeningar = [
    "en halsduk",
    "två små gröna groda med hatt",
    "en stor blå kanin med hatt",
    "en stor röd katt som hoppar",
  ];
  for (const m of friaMeningar) {
    const p = rostPlan(m);
    if (!p || p.dynamisk || p.delar.length < 1) {
      fel.push(`R1: Fri mening '${m}' saknar MP3-plan via vardeDelar: ${JSON.stringify(p)}`);
    }
  }

  // 8. sammanhallenRostText: behåll 1-MP3-rader exakt och ersätt öppna mallar med 1-MP3-ersättning
  const behallExakt = [
    "Hej! Här kommer en kanin!",
    "Klart! ett hus står på gården.",
    "+2 stjärnor!",
    "Nu heter djuret Skuttis!",
    "Här får du en morot!",
  ];
  for (const s of behallExakt) {
    const ut = sammanhallenRostText(s);
    if (ut !== s) {
      fel.push(`R1: sammanhallenRostText('${s}') ändrade 1-MP3-sträng till '${ut}'`);
    }
  }
  const ersattMallar = [
    ["Nu heter djuret Kurt-Olof!", "Vilket fint namn! Det passar helt perfekt!"],
    ["Wiii! En lila kapybara bar dig över floden!", "Wiii! Du flög hela vägen över floden!"],
    ["Här får du en hemlig diamant!", "Varsågod! Vilken fin gåva!"],
  ];
  for (const [inText, forvantad] of ersattMallar) {
    const ut = sammanhallenRostText(inText);
    if (ut !== forvantad) {
      fel.push(`R1: sammanhallenRostText('${inText}') gav '${ut}', förväntade '${forvantad}'`);
    }
    const p = rostPlan(ut);
    if (!p || p.dynamisk || p.delar.length !== 1) {
      fel.push(`R1: Ersättningsmening '${ut}' saknar 1-MP3-plan`);
    }
  }

  // 9. Alla KANDIDAT_RADER i scripts/rost-kandidater.mjs ska ge giltig rostPlan utan dynamisk TTS
  let kandidatFel = 0;
  for (const r of KANDIDAT_RADER) {
    const ren = r.tal ?? r.t;
    const p = rostPlan(ren) ?? rostPlan(r.t);
    if (!p || p.dynamisk) kandidatFel++;
  }
  detalj.kandidaterMedPlan = `${KANDIDAT_RADER.length - kandidatFel}/${KANDIDAT_RADER.length}`;
  if (kandidatFel > 0) fel.push(`R1: ${kandidatFel} rader i KANDIDAT_RADER saknar MP3-plan`);
}

function korR2StatiskaKontroller(fel, detalj) {
  const uppdragVy = fs.readFileSync(path.join(ROT, "src/spel/ui/UppdragVy.tsx"), "utf8");
  if (/hor\(`\$\{aktivtUpp\.titel\}\.\s*\$\{aktivtUpp\.beskrivning\}`\)/.test(uppdragVy)) {
    fel.push("R2: UppdragVy.tsx (rad 93) använder fortfarande `${aktivtUpp.titel}. ${aktivtUpp.beskrivning}` istället för uppdragText(aktivtUpp, ang[0]?.kropp)");
  }

  // Alla 101 uppdragForslag(u) ska ha 1-MP3-plan och korrekt neutrum ("ett torn", "ett hus", "ett äpple")
  let uppdragForslagFel = 0;
  for (const u of ALLA_UPPDRAG) {
    for (const f of uppdragForslag(u)) {
      const pF = rostPlan(f);
      if (!pF || pF.dynamisk || pF.delar.length !== 1) uppdragForslagFel++;
    }
  }
  detalj.uppdragForslagUtanFel = `${ALLA_UPPDRAG.length - uppdragForslagFel}/${ALLA_UPPDRAG.length}`;
  if (uppdragForslagFel > 0) fel.push(`R2: ${uppdragForslagFel} förslag i uppdragForslag(u) saknar 1-MP3-plan (uppdatera ETT_ORD i src/spel/ideRad.ts)`);

  const ledtradsyta = fs.readFileSync(path.join(ROT, "src/spel/ui/Ledtradsyta.tsx"), "utf8");
  if (!ledtradsyta.includes("replace(") && ledtradsyta.includes("`${led.gata} ${stegData.extraText}`")) {
    fel.push("R2: Ledtradsyta.tsx (rad 47) skickar fortfarande rå stegData.extraText med ': ka – ___' till lasText utan att rensa bort understrecken");
  }

  // Kontrollera att alla 379 ord i ledtradar.json på steg 0, 1 och 2 ger giltig rostPlan(lasText) utan dynamisk TTS
  const ledJson = lasJson("data/ledtradar.json").ledtradar;
  let ledFel = 0;
  for (const [ord, led] of Object.entries(ledJson)) {
    const p0 = rostPlan(led.gata);
    if (!p0 || p0.dynamisk) ledFel++;
    for (const steg of [1, 2]) {
      const stegData = ledtradsSteg(ord, steg);
      const renExtra = stegData?.extraText?.replace(/:\s*[^.!?]+$/u, ".");
      const lasText = steg >= 1 && renExtra ? `${led.gata} ${renExtra}` : led.gata;
      const p = rostPlan(lasText);
      if (!p || p.dynamisk) ledFel++;
    }
  }
  detalj.ledtradarUtanTtsFel = `${Object.keys(ledJson).length * 3 - ledFel}/${Object.keys(ledJson).length * 3}`;
  if (ledFel > 0) fel.push(`R2: ${ledFel} ord/steg i ledtradar.json saknar MP3-plan för lasText`);
}

async function vantaPaUrl(url, maxMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const svar = await fetch(url);
      if (svar.ok) return true;
    } catch {
      // Vite har inte öppnat porten än
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

async function forstaSynlig(locator) {
  const n = await locator.count();
  for (let i = 0; i < n; i++) {
    const el = locator.nth(i);
    if (await el.isVisible().catch(() => false)) return el;
  }
  return null;
}

async function korR2Playwright(fel, detalj) {
  if (utMapp) fs.mkdirSync(utMapp, { recursive: true });
  const port = 4189;
  const url = `http://localhost:${port}/?prov=1`;
  const srv = spawn("npx", ["vite", "--port", String(port), "--strictPort"], {
    cwd: ROT,
    stdio: "ignore",
  });
  let browser;
  const skarmNamn = [];
  try {
    const uppe = await vantaPaUrl(url, 15000);
    if (!uppe) {
      fel.push(`R2: Vite svarade inte på ${url} inom 15 sekunder`);
      return;
    }

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);

    await page.addInitScript(() => {
      window.__speechSynthesisCalls = 0;
      if ("speechSynthesis" in window) {
        window.speechSynthesis.speak = () => {
          window.__speechSynthesisCalls++;
        };
      }
      localStorage.setItem(
        "trollpennan-v2",
        JSON.stringify({
          state: {
            introKlar: true,
            forstaSkapelse: true,
            stjarnor: 12,
            ang: [{ uid: "kanin-1", kropp: "kanin", farg: "blå", smeknamn: "Skuttis" }],
          },
          version: 2,
        })
      );
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page
      .locator('[data-testid="intro-hoppa"], button:has-text("Hoppa över"), [data-testid="stang-bok"], [data-m1="hud-uppdrag"]')
      .first()
      .waitFor({ state: "visible", timeout: 15000 });

    await page.evaluate(() => {
      const st = window.__trollMinne?.getState?.();
      if (st?.sattIntro) st.sattIntro();
    });
    const hoppaOver = page.locator('[data-testid="intro-hoppa-over"], button:has-text("Hoppa över")');
    if ((await hoppaOver.count()) > 0 && (await hoppaOver.first().isVisible())) {
      await hoppaOver.first().click();
    }
    await page.waitForTimeout(450);

    const sparaSkarm = async (namn) => {
      if (!utMapp) return;
      await page.screenshot({ path: path.join(utMapp, namn) });
      skarmNamn.push(namn);
    };

    // 1. UppdragVy: stäng boken om den redan är öppen, öppna uppdrag, lyssna + första idébrickan
    const stangBok = page.locator('[data-testid="stang-bok"]');
    const uppdragIkon = page.locator('[data-m1="hud-uppdrag"], [data-testid="bengtsson-ikon"]');
    const lyssnaAktivt = page.locator('[data-v2="lyssna-aktivt-uppdrag"]');
    if (!(await forstaSynlig(lyssnaAktivt))) {
      const stang = await forstaSynlig(stangBok);
      if (stang) {
        await stang.click();
        await page.waitForTimeout(400);
      }
      const ikon = await forstaSynlig(uppdragIkon);
      if (ikon) {
        await ikon.click();
        await page.waitForTimeout(500);
      }
    }
    const lyssnaKnapp = await forstaSynlig(lyssnaAktivt);
    if (lyssnaKnapp) {
      await lyssnaKnapp.click();
      await page.waitForTimeout(200);
    } else {
      fel.push('R2: hittade inte [data-v2="lyssna-aktivt-uppdrag"]');
    }
    const forslagKort = await forstaSynlig(page.locator('[data-m2="uppdrag-forslag-kort"]'));
    if (forslagKort) {
      await forslagKort.click();
      await page.waitForTimeout(200);
    } else {
      fel.push('R2: hittade inte [data-m2="uppdrag-forslag-kort"]');
    }
    await sparaSkarm("r2-uppdrag-lyssna-375x812.png");
    const stangEfter = await forstaSynlig(stangBok);
    if (stangEfter) {
      await stangEfter.click();
      await page.waitForTimeout(350);
    }

    // 2. Pennans bok: 2×2-ordkort, kanin + 🔊
    const skrivKnapp = await forstaSynlig(page.locator('[data-v2="skriv-knapp"], [data-testid="pennans-bok"]'));
    if (skrivKnapp) {
      await skrivKnapp.click();
      await page.waitForTimeout(400);
    } else {
      fel.push('R2: hittade inte [data-v2="skriv-knapp"]');
    }
    const flikOrdkort = await forstaSynlig(page.locator('[data-m3="flik-ordkort"]'));
    if (flikOrdkort) {
      await flikOrdkort.click();
      await page.waitForTimeout(250);
    } else {
      fel.push('R2: hittade inte [data-m3="flik-ordkort"]');
    }
    const kanin = await forstaSynlig(page.locator('[data-testid="kort-kanin"]'));
    if (kanin) {
      await kanin.click();
      await page.waitForTimeout(200);
    } else {
      fel.push('R2: hittade inte [data-testid="kort-kanin"]');
    }
    const kortLyssna = await forstaSynlig(
      page.locator('[data-testid="kort-kanin"] [data-c2="kort-lyssna"], [data-c2="kort-lyssna"]'),
    );
    if (kortLyssna) {
      await kortLyssna.click();
      await page.waitForTimeout(200);
    } else {
      fel.push('R2: hittade inte [data-c2="kort-lyssna"]');
    }
    await sparaSkarm("r2-bok-rost-375x812.png");

    // 3. Stava själv. Lyssna-gåta finns bara om Ledtradsyta är monterad.
    const flikStava = await forstaSynlig(page.locator('[data-m3="flik-stava"], [data-testid="pennan"]'));
    if (flikStava) {
      await flikStava.click();
      await page.waitForTimeout(300);
    } else {
      fel.push('R2: hittade inte [data-m3="flik-stava"]');
    }
    const lyssnaGata = await forstaSynlig(page.locator('[data-p4="lyssna-gata"]'));
    if (lyssnaGata) {
      await lyssnaGata.click();
      await page.waitForTimeout(200);
    }
    detalj.lyssnaGataSynlig = Boolean(lyssnaGata);
    await sparaSkarm("r2-ledtrad-rost-375x812.png");

    const ttsCalls = await page.evaluate(() => window.__speechSynthesisCalls ?? 0);
    detalj.speechSynthesisCalls = ttsCalls;
    detalj.skarmbilder = skarmNamn;
    if (ttsCalls > 0) {
      fel.push(`R2: window.speechSynthesis.speak anropades ${ttsCalls} gånger (ska vara 0)`);
    }
  } catch (e) {
    fel.push(`R2: Playwright avbröts: ${e instanceof Error ? e.message : String(e)}`);
    detalj.skarmbilder = skarmNamn;
  } finally {
    if (browser) await browser.close();
    srv.kill("SIGTERM");
  }
}

async function main() {
  const fel = [];
  const detalj = { steg: stegArg, snabb };

  if (stegArg === "r1" || stegArg === "alla") {
    korR1Kontroller(fel, detalj);
  }
  if (stegArg === "r2" || stegArg === "alla") {
    korR2StatiskaKontroller(fel, detalj);
    if (!snabb) {
      await korR2Playwright(fel, detalj);
    }
  }

  const resultat = { ok: fel.length === 0, antalFel: fel.length, fel, ...detalj };
  console.log(JSON.stringify(resultat, null, 2));
  process.exit(fel.length === 0 ? 0 : 1);
}

main();
