#!/usr/bin/env node
/**
 * prov-s4-s5.mjs — Snabbprov (--snabb) och full Playwright-kontroll på 375×812 för Runda S4 och S5.
 * Körning:
 *   node rundor/S4-S5-vaktardjur-solstjarnor-album/prov-s4-s5.mjs --snabb --del s4|s5|alla
 *   node rundor/S4-S5-vaktardjur-solstjarnor-album/prov-s4-s5.mjs --del s4|s5|alla [--ut /tmp/s4-s5-bilder]
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const ROOT = process.cwd();
const FACIT = JSON.parse(
  fs.readFileSync(path.join(ROOT, "rundor/S4-S5-vaktardjur-solstjarnor-album/facit-s4-s5.json"), "utf8"),
);

const args = process.argv.slice(2);
const SNABB = args.includes("--snabb");
const delIdx = args.indexOf("--del");
const DEL = (delIdx >= 0 ? args[delIdx + 1] || "alla" : "alla").toLowerCase();
const utIdx = args.indexOf("--ut");
const UT_MAPP = utIdx >= 0 ? args[utIdx + 1] : "/tmp/s4-s5-bilder";

const KOR_S4 = DEL === "alla" || DEL === "s4" || DEL === "4";
const KOR_S5 = DEL === "alla" || DEL === "s5" || DEL === "5";

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
  const detalj = { s4: {}, s5: {} };

  for (const f of [
    "src/spel/Spel.tsx",
    "src/spel/ang/PlatsDekor.tsx",
    "src/spel/ang/vaktardjur.tsx",
    "src/spel/solstjarna.ts",
    "src/spel/ui/AlbumDialog.tsx",
    "src/persist/spara.ts",
  ]) {
    const n = rader(f);
    if (n > 400) fel.push(`${f} är ${n} rader (> 400)`);
  }

  if (KOR_S4) {
    for (const m of FACIT.s4.models) {
      if (!fs.existsSync(path.join(ROOT, "public", m))) {
        fel.push(`S4: CC0-modell saknas: public/${m}`);
      }
    }
    const vaktarJson = lasText(FACIT.s4.dataFil);
    const vaktarTsx = lasText(FACIT.s4.komponentFil);
    const sparaTs = lasText("src/persist/spara.ts");

    if (!vaktarJson) {
      fel.push(`S4: ${FACIT.s4.dataFil} saknas`);
    } else {
      for (const id of FACIT.s4.vaktardjurIds) {
        if (!vaktarJson.includes(id)) {
          fel.push(`S4: ${FACIT.s4.dataFil} saknar väktardjuret "${id}"`);
        }
      }
    }

    if (!vaktarTsx) {
      fel.push(`S4: ${FACIT.s4.komponentFil} saknas`);
    } else {
      if (!vaktarTsx.includes("VaktarDjur") || !vaktarTsx.includes("s-vaktar-skattkista-cc0.glb")) {
        fel.push("S4: vaktardjur.tsx saknar VaktarDjur eller s-vaktar-skattkista-cc0.glb");
      }
    }

    const harSparaVaktar = sparaTs.includes("vaktardjur");
    if (!harSparaVaktar) {
      fel.push("S4: SparaData i src/persist/spara.ts saknar vaktardjur-fältet");
    }

    detalj.s4 = { harData: Boolean(vaktarJson), harKomponent: Boolean(vaktarTsx), harSparaVaktar };
  }

  if (KOR_S5) {
    for (const m of FACIT.s5.models) {
      if (!fs.existsSync(path.join(ROOT, "public", m))) {
        fel.push(`S5: CC0-modell saknas: public/${m}`);
      }
    }
    const solTs = lasText(FACIT.s5.solstjarnaFil);
    const albumTsx = lasText(FACIT.s5.albumFil);
    const sparaTs = lasText("src/persist/spara.ts");

    if (!solTs) {
      fel.push(`S5: ${FACIT.s5.solstjarnaFil} saknas`);
    } else {
      if (!solTs.includes("beraknaSolstjarnaBeloning") || !solTs.includes("Favorit")) {
        fel.push("S5: solstjarna.ts saknar beraknaSolstjarnaBeloning eller '+2 ★ Favorit!'");
      }
    }

    const harSlimepedia =
      albumTsx.includes("slimepedia") ||
      albumTsx.includes("Skriv till djuret") ||
      albumTsx.includes("albumNiva");
    if (!harSlimepedia) {
      fel.push("S5: AlbumDialog.tsx saknar 3-stjärnigt Slimepedia-kort med 'Skriv till djuret'");
    }

    const harSparaAlbum = sparaTs.includes("albumNiva");
    if (!harSparaAlbum) {
      fel.push("S5: SparaData i src/persist/spara.ts saknar albumNiva-fältet");
    }

    detalj.s5 = { harSolstjarnaFil: Boolean(solTs), harSlimepedia, harSparaAlbum };
  }

  return { ok: fel.length === 0, antalFel: fel.length, fel, detalj };
}

async function startaServer() {
  if (process.env.BASE_URL) {
    return { url: process.env.BASE_URL, stang: async () => {} };
  }
  const port = 4196;
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
    if (KOR_S4) {
      const ctx = await browser.newContext({ viewport: FACIT.viewport, deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      const pageErrors = [];
      page.on("pageerror", (e) => pageErrors.push(String(e)));

      await page.goto(server.url, { waitUntil: "networkidle" });
      const hoppa = page.locator('[data-testid="intro-hoppa"]');
      if (await hoppa.count()) await hoppa.click();
      await page.waitForTimeout(450);

      if (pageErrors.length > 0) fel.push(`S4: pageerror: ${pageErrors.join("; ")}`);
      await page.screenshot({ path: path.join(UT_MAPP, "s4-vaktardjur-gordo.png") });
      await ctx.close();
    }

    if (KOR_S5) {
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
      await page.waitForTimeout(350);

      // Öppna Meny -> Album för att kontrollera Slimepedia på 375×812
      const menyKnapp = page.locator('[data-testid="meny-knapp"]');
      if (await menyKnapp.count()) {
        await menyKnapp.click();
        await page.waitForTimeout(250);
        const albumKnapp = page.locator('[data-testid="album-knapp"], [data-testid="meny-album"]').first();
        if (await albumKnapp.count()) {
          await albumKnapp.click();
          await page.waitForTimeout(350);
        }
      }

      if (pageErrors.length > 0) fel.push(`S5: pageerror: ${pageErrors.join("; ")}`);
      await page.screenshot({ path: path.join(UT_MAPP, "s5-solstjarnor-slimepedia.png") });
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
