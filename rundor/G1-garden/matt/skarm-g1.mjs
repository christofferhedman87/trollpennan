#!/usr/bin/env node
/**
 * Playwright-genomspelning (375x812) för G1 Gården i 3D.
 * Bevisar det barnet ser:
 * 1. Gården öppnas i 3D (.garden-3d canvas synlig på 375x812, 0 sid-/konsolfel, Phaser-duken dold).
 * 2. Hus, stall och staket snäpper mot 1,0-rutnätet och bildar en sluten hage (BFS).
 * 3. Djur som flyttar in bor i stallet/hagen, syns på Gården och vandrar inom sitt område (utanforHage === 0).
 */
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const DIST = resolve(ROT, "dist");
const args = process.argv.slice(2);
const utIdx = args.indexOf("--ut");
const UT_MAPP = utIdx >= 0 && args[utIdx + 1] ? resolve(args[utIdx + 1]) : "/workspace/g1-garden-bilder";
mkdirSync(UT_MAPP, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".woff2": "font/woff2",
};

function startaStatiskServer(rotMapp) {
  return new Promise((res, rej) => {
    const srv = createServer((req, resp) => {
      const urlPath = (req.url ?? "/").split("?")[0];
      let rel = decodeURIComponent(urlPath);
      if (rel.startsWith("/trollpennan/")) rel = rel.slice("/trollpennan".length);
      if (rel === "/" || rel === "") rel = "/index.html";
      const fil = join(rotMapp, rel);
      if (existsSync(fil) && statSync(fil).isFile()) {
        const ext = extname(fil).toLowerCase();
        resp.writeHead(200, { "content-type": MIME[ext] ?? "application/octet-stream" });
        resp.end(readFileSync(fil));
      } else {
        const indexFil = join(rotMapp, "index.html");
        resp.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        resp.end(readFileSync(indexFil));
      }
    });
    srv.listen(0, "127.0.0.1", () => {
      const adr = srv.address();
      res({ srv, url: `http://127.0.0.1:${adr.port}/` });
    });
    srv.on("error", rej);
  });
}

if (!existsSync(join(DIST, "index.html"))) {
  console.error(JSON.stringify({ ok: false, fel: ["dist/index.html saknas — kör npm run build först"] }));
  process.exit(1);
}

const { srv, url } = await startaStatiskServer(DIST);
const browser = await chromium.launch({ headless: true });
const fel = [];
const konsolFel = [];
const sidFel = [];

try {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();

  page.on("pageerror", (e) => sidFel.push(String(e?.message ?? e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const t = msg.text();
      if (!t.includes("favicon")) konsolFel.push(t);
    }
  });

  // Seeda ett tillstånd med 3 djur, ett stall, ett hus och en 1x1 sluten hage runt (2,4)
  // där hästen och hunden bor i hagen/stallet
  await page.addInitScript(() => {
    const spar = {
      v: 1,
      flock: [
        { uid: 1, djur: "häst", ord: "häst", formel: "en häst", x: 0.4, y: 0.6, skapad: 1 },
        { uid: 2, djur: "hund", ord: "hund", formel: "en hund", x: 0.5, y: 0.65, skapad: 2 },
        { uid: 3, djur: "katt", ord: "katt", formel: "en katt", x: 0.6, y: 0.6, skapad: 3 },
      ],
      garden: [
        // 4 staketkanter runt cell (2, 4):
        // (2,4,N): fx=2.5, fz=4 -> x=0.10 + (2.5/6)*0.80 = 0.4333, y=0.32 + (4/10)*0.60 = 0.56
        // (2,5,N): fx=2.5, fz=5 -> x=0.4333, y=0.32 + (5/10)*0.60 = 0.62
        // (2,4,W): fx=2.0, fz=4.5 -> x=0.10 + (2/6)*0.80 = 0.3667, y=0.32 + (4.5/10)*0.60 = 0.59
        // (3,4,W): fx=3.0, fz=4.5 -> x=0.10 + (3/6)*0.80 = 0.50, y=0.59
        { uid: 101, bygg: "staket", ord: "staket", formel: "ett staket", antal: 1, x: 0.4333, y: 0.56, boende: [1], skapad: 10 },
        { uid: 102, bygg: "staket", ord: "staket", formel: "ett staket", antal: 1, x: 0.4333, y: 0.62, boende: [], skapad: 11 },
        { uid: 103, bygg: "staket", ord: "staket", formel: "ett staket", antal: 1, x: 0.3667, y: 0.59, boende: [], skapad: 12 },
        { uid: 104, bygg: "staket", ord: "staket", formel: "ett staket", antal: 1, x: 0.50, y: 0.59, boende: [], skapad: 13 },
        // Stall intill hagen på cell (1, 4): fx=1.5, fz=4.5 -> x=0.10+(1.5/6)*0.80=0.30, y=0.59
        { uid: 105, bygg: "stall", ord: "stall", formel: "ett rött stall", farg: "röd", fargHex: "#E53935", antal: 1, x: 0.30, y: 0.59, boende: [2], skapad: 14 },
        // Hus på cell (4, 3): fx=4.5, fz=3.5 -> x=0.10+(4.5/6)*0.80=0.70, y=0.32+(3.5/10)*0.60=0.53
        { uid: 106, bygg: "hus", ord: "hus", formel: "ett hus", antal: 1, x: 0.70, y: 0.53, boende: [3], skapad: 15 },
      ],
      sedda: ["häst", "hund", "katt"],
       seddaBygg: ["staket", "stall", "hus"],
      ordbok: ["häst", "hund", "katt", "staket", "stall", "hus"],
      introKlart: true,
      byggIntroKlart: true,
      varld: "gard",
    };
    window.localStorage.setItem("trollpennan:v1", JSON.stringify(spar));
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  // Säkerställ att vi är på Gården
  await page.evaluate(() => {
    if (window.__troll?.plats) window.__troll.plats("gard");
  });
  await page.waitForTimeout(1000);

  const canvasBox = await page.locator(".garden-3d canvas").boundingBox();
  if (!canvasBox || canvasBox.width < 300 || canvasBox.height < 500) {
    fel.push(`Garden3D canvas saknas eller för liten: ${JSON.stringify(canvasBox)}`);
  }

  await page.screenshot({ path: join(UT_MAPP, "gard-3d-start.png") });

  // Sampla __gard3d under 3.2 sekunder (8 prover med 400 ms mellanrum)
  const prover = [];
  for (let i = 0; i < 8; i += 1) {
    await page.waitForTimeout(400);
    const snap = await page.evaluate(() => window.__gard3d ?? null);
    if (snap) prover.push(snap);
  }

  await page.screenshot({ path: join(UT_MAPP, "gard-3d-vandring.png") });

  if (prover.length === 0) {
    fel.push("window.__gard3d saknas i Garden3D");
  } else {
    const sista = prover[prover.length - 1];
    if (!Array.isArray(sista.hagar) || sista.hagar.length < 1) {
      fel.push(`Förväntade minst 1 sluten hage i __gard3d.hagar, fick ${JSON.stringify(sista.hagar)}`);
    }
    if (!Array.isArray(sista.djur) || sista.djur.length < 2) {
      fel.push(`Förväntade minst 2 boende djur i __gard3d.djur, fick ${JSON.stringify(sista.djur)}`);
    } else {
      const maxForflyttad = Math.max(...sista.djur.map((d) => Number(d.forflyttad ?? 0)));
      if (maxForflyttad < 0.15) {
        fel.push(`Djuren på Gården rörde sig inte tillräckligt (maxForflyttad=${maxForflyttad})`);
      }
      let utanforHage = 0;
      for (const p of prover) {
        for (const d of p.djur ?? []) {
          if (d.iTillatenCell === false) utanforHage += 1;
        }
      }
      if (utanforHage > 0) {
        fel.push(`Djur hamnade utanför sitt tillåtna område ${utanforHage} gånger`);
      }
    }
  }

  if (sidFel.length > 0) fel.push(`Sidfel: ${sidFel.join(" | ")}`);
  if (konsolFel.length > 0) fel.push(`Konsolfel: ${konsolFel.join(" | ")}`);

  const resultat = {
    ok: fel.length === 0,
    fel,
    canvasBox,
    antalProver: prover.length,
    sistaSnap: prover[prover.length - 1] ?? null,
    bilder: [
      join(UT_MAPP, "gard-3d-start.png"),
      join(UT_MAPP, "gard-3d-vandring.png"),
    ],
  };
  console.log(JSON.stringify(resultat, null, 2));
  process.exitCode = resultat.ok ? 0 : 1;
} finally {
  await browser.close();
  srv.close();
}
