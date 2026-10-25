#!/usr/bin/env node
// Provskript för P3b (P3b-1: sak-ord/spärr/tolk, P3b-2: kläder och tillbehör på djurets kropp i R3F).
// Kör:
//   /home/box/.local/node22/bin/node --experimental-strip-types rundor/P3b-klader/matt/prov-p3b.mjs --snabb --del 1
//   /home/box/.local/node22/bin/node --experimental-strip-types rundor/P3b-klader/matt/prov-p3b.mjs --snabb --del 2
//   /home/box/.local/node22/bin/node --experimental-strip-types rundor/P3b-klader/matt/prov-p3b.mjs [--del 1|2]

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

globalThis.self ??= globalThis;

const ROT = process.cwd();
const args = process.argv.slice(2);
const SNABB = args.includes("--snabb");
const delIdx = args.indexOf("--del");
const DEL = delIdx >= 0 ? args[delIdx + 1] : "alla";
const KOR_DEL1 = DEL === "1" || DEL === "alla";
const KOR_DEL2 = DEL === "2" || DEL === "alla";

const fel = [];
function krav(villkor, meddelande) {
  if (!villkor) fel.push(meddelande);
}

async function snabbDel1() {
  const { tolka } = await import(path.join(ROT, "src/tolk/tolka.ts"));
  const { arSparrat } = await import(path.join(ROT, "src/tolk/sparr.ts"));
  const { rostFor } = await import(path.join(ROT, "src/spel/rostManifest.ts"));
  const entiteterJson = JSON.parse(fs.readFileSync(path.join(ROT, "data/entiteter.json"), "utf8"));

  // 1. Spärr-falskträffar ("sportbil", "port", "grottport")
  for (const [fras, kropp] of [
    ["en sportbil", "sportbil"],
    ["en röd sportbil", "sportbil"],
    ["en stor sportbil", "sportbil"],
    ["en port", "valv"],
    ["en stor port", "valv"],
    ["en grottport", "grottport"],
    ["en röd grottport", "grottport"],
  ]) {
    const u = tolka(fras);
    krav(
      u.typ === "skapad" && u.varelse.kropp === kropp,
      `P3b-1: "${fras}" gav ${u.typ}${u.typ === "skapad" ? ":" + u.varelse.kropp : ""} (väntade skapad:${kropp})`,
    );
  }

  // Riktiga spärrord måste fortfarande spärras
  krav(arSparrat("porr") === true, 'P3b-1: arSparrat("porr") ska vara true');
  krav(arSparrat("en porr") === true, 'P3b-1: arSparrat("en porr") ska vara true');
  krav(arSparrat("knulla") === true, 'P3b-1: arSparrat("knulla") ska vara true');

  // 2. Dubbeltydiga sak-ord med adjektiv ("eld", "regnbåge")
  for (const [fras, kropp] of [
    ["en gul eld", "eld"],
    ["en röd eld", "eld"],
    ["en stor eld", "eld"],
    ["två stora eldar", "eld"],
    ["en stor regnbåge", "regnbage"],
    ["en röd regnbåge", "regnbage"],
  ]) {
    const u = tolka(fras);
    krav(
      u.typ === "skapad" && u.varelse.kropp === kropp,
      `P3b-1: "${fras}" gav ${u.typ}${u.typ === "skapad" ? ":" + u.varelse.kropp : ""} (väntade skapad:${kropp})`,
    );
  }

  // Djurbetydelser med eld / regnbåge oförändrade
  const drakeEld = tolka("en drake med eld");
  krav(
    drakeEld.typ === "skapad" && drakeEld.varelse.kropp === "drake" && drakeEld.varelse.formagor.includes("flammor"),
    'P3b-1: "en drake med eld" ska ge drake med förmåga eld',
  );
  const kattRegnbage = tolka("en katt med regnbåge");
  krav(
    kattRegnbage.typ === "skapad" && kattRegnbage.varelse.kropp === "katt" && kattRegnbage.varelse.monster === "regnbåge",
    'P3b-1: "en katt med regnbåge" ska ge katt med mönster regnbåge',
  );

  // 3. "jätte" som cyklop vs förstärkning
  for (const fras of ["jätte", "en jätte", "en stor jätte", "en grön jätte"]) {
    const u = tolka(fras);
    krav(
      u.typ === "skapad" && u.varelse.kropp === "cyklop",
      `P3b-1: "${fras}" gav ${u.typ}${u.typ === "skapad" ? ":" + u.varelse.kropp : ""} (väntade skapad:cyklop)`,
    );
  }
  for (const fras of ["en jättestor katt", "en jätte stor katt"]) {
    const u = tolka(fras);
    krav(
      u.typ === "skapad" && u.varelse.kropp === "katt" && u.varelse.skala > 1.2,
      `P3b-1: "${fras}" ska ge stor katt (skala > 1.2)`,
    );
  }

  // 4. Alla entiteter i entiteter.json: ingen modell-entitet får spärras på "en <ord[0]>"
  for (const [id, e] of Object.entries(entiteterJson.entiteter)) {
    if (!e.modell) continue;
    const w = e.ord?.[0] ?? id;
    const u = tolka(`en ${w}`);
    krav(u.typ !== "sparr", `P3b-1: entitet "${id}" ("en ${w}") spärras felaktigt`);
  }

  // 5. TTS-manifestpekare för "en sportbil" och "en grottport" (utan nya mp3-filer)
  krav(!!rostFor("en sportbil"), 'P3b-1: rostFor("en sportbil") saknas i rost-manifest.json / rost-klient.json');
  krav(!!rostFor("en grottport"), 'P3b-1: rostFor("en grottport") saknas i rost-manifest.json / rost-klient.json');
}

async function snabbDel2() {
  const entMod = await import(path.join(ROT, "src/spel/entiteter.ts"));
  const faestMod = await import(path.join(ROT, "src/spel/tillbehor/faest.ts"));
  const { ankareFor } = await import(path.join(ROT, "src/spel/tillbehor/ankare.ts"));

  const plaggFil = path.join(ROT, "data/plagg.json");
  krav(fs.existsSync(plaggFil), "P3b-2: data/plagg.json saknas");
  const plaggData = fs.existsSync(plaggFil) ? JSON.parse(fs.readFileSync(plaggFil, "utf8")) : { plagg: {} };

  krav(typeof entMod.arPlagg === "function", "P3b-2: arPlagg(kropp) saknas i src/spel/entiteter.ts");
  krav(typeof faestMod.faestPlaggKlon === "function", "P3b-2: faestPlaggKlon saknas i src/spel/tillbehor/faest.ts");

  const djurTsx = fs.readFileSync(path.join(ROT, "src/spel/ang/djur.tsx"), "utf8");
  krav(
    djurTsx.includes("!arPlagg(id)"),
    "P3b-2: src/spel/ang/djur.tsx filtrerar inte bort !arPlagg(id) ur medSaker",
  );

  // Kontrollera alla 38 GLB-plagg i entiteter.json
  const glbPlagg = Object.entries(entMod.ENTITETER).filter(
    ([id, e]) => e.typ === "tillbehor" && !!entMod.modellUrl(id),
  );
  krav(glbPlagg.length >= 38, `P3b-2: väntade minst 38 GLB-plagg, hittade ${glbPlagg.length}`);

  for (const [id] of glbPlagg) {
    if (typeof entMod.arPlagg === "function") {
      krav(entMod.arPlagg(id) === true, `P3b-2: arPlagg("${id}") ska vara true`);
    }
    krav(entMod.arSak(id) === true, `P3b-2: arSak("${id}") ska fortfarande vara true för fristående placering`);
    krav(!!plaggData.plagg?.[id], `P3b-2: "${id}" saknas i data/plagg.json`);
  }
  if (typeof entMod.arPlagg === "function") {
    krav(entMod.arPlagg("kanin") === false, 'P3b-2: arPlagg("kanin") ska vara false');
    krav(entMod.arPlagg("hink") === false, 'P3b-2: arPlagg("hink") ska vara false');
  }

  // Om faestPlaggKlon finns: verifiera 3D-montering på riktiga GLB-modeller
  if (typeof faestMod.faestPlaggKlon === "function") {
    const L = new GLTFLoader();
    L.setMeshoptDecoder(MeshoptDecoder);
    L.register(() => ({ name: "inga-bilder", loadTexture: () => Promise.resolve(null) }));
    async function ladda(id) {
      const b = fs.readFileSync(path.join(ROT, "public" + entMod.modellUrl(id)));
      const g = await new Promise((res, rej) =>
        L.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), "", res, rej),
      );
      return g.scene;
    }

    for (const djurId of ["kanin", "katt", "hund", "rav", "krokodil", "kapybara"]) {
      const djur = await ladda(djurId);
      djur.updateMatrixWorld(true);
      const b0 = new THREE.Box3().setFromObject(djur);
      const s = entMod.skalaFor(djurId, b0.max.y - b0.min.y, b0.max.x - b0.min.x, b0.max.z - b0.min.z);
      djur.scale.setScalar(s);
      djur.position.set(
        -((b0.min.x + b0.max.x) / 2) * s,
        -b0.min.y * s,
        -((b0.min.z + b0.max.z) / 2) * s,
      );
      const fram = entMod.framVinkel(entMod.entitet(djurId)?.framAxel);
      const ytter = new THREE.Group();
      ytter.rotation.set(0, fram, 0);
      ytter.add(djur);
      ytter.updateMatrixWorld(true);
      const djurBox = new THREE.Box3().setFromObject(ytter);
      const djurHojd = djurBox.max.y - djurBox.min.y;
      const djurBredd = djurBox.max.x - djurBox.min.x;

      // Fäst procedurtillbehör (hatt, glasögon, krona)
      faestMod.faestTillbehor(
        djur,
        djurId,
        [
          { id: "hatt", farg: null, glans: false },
          { id: "glasögon", farg: null, glans: false },
        ],
        "modell",
      );
      ytter.updateMatrixWorld(true);
      const gl = djur.getObjectByName("tillbehor-glasögon");
      krav(!!gl, `P3b-2: glasögon saknas på ${djurId}`);
      if (gl) {
        const gBox = new THREE.Box3().setFromObject(gl);
        const gC = gBox.getCenter(new THREE.Vector3());
        krav(
          gC.y >= 0.35 * djurHojd && gC.z >= 0,
          `P3b-2: glasögon på ${djurId} sitter fel (center=${gC.toArray().map((n) => +n.toFixed(2))})`,
        );
      }

      // Fäst GLB-plagg (alvmossa, troja, stovlar)
      for (const [plaggId, minAndelY] of [
        ["alvmossa", 0.45],
        ["troja", 0.15],
        ["stovlar", -0.05],
      ]) {
        const plaggScen = await ladda(plaggId);
        const nod = faestMod.faestPlaggKlon(djur, djurId, plaggId, plaggScen, "#E53935");
        krav(!!nod && djur.getObjectByName("tillbehor-" + plaggId) === nod, `P3b-2: ${plaggId} fästes inte på ${djurId}`);
        if (nod) {
          ytter.updateMatrixWorld(true);
          const pBox = new THREE.Box3().setFromObject(nod);
          const pC = pBox.getCenter(new THREE.Vector3());
          krav(
            pBox.min.y >= minAndelY * djurHojd && Math.abs(pC.x) <= 0.65 * djurBredd,
            `P3b-2: ${plaggId} på ${djurId} hamnade fel (minY=${pBox.min.y.toFixed(2)}, centerX=${pC.x.toFixed(2)}, djurH=${djurHojd.toFixed(2)})`,
          );
        }
      }
    }
  }
}

function startaServer(rotMap) {
  const mime = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".glb": "model/gltf-binary",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".mp3": "audio/mpeg",
    ".woff2": "font/woff2",
  };
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent((req.url ?? "/").split("?")[0]).replace(/^\/trollpennan\//, "/");
    let p = path.join(rotMap, u === "/" ? "index.html" : u);
    if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(rotMap, "index.html");
    const ext = path.extname(p);
    res.writeHead(200, { "Content-Type": mime[ext] ?? "application/octet-stream" });
    fs.createReadStream(p).pipe(res);
  });
  return new Promise((resolve) => srv.listen(0, "127.0.0.1", () => resolve(srv)));
}

async function skarmProv() {
  const distMap = path.join(ROT, "dist-pages");
  krav(fs.existsSync(path.join(distMap, "index.html")), "dist-pages/index.html saknas (kör npm run build:pages först)");
  if (fel.length > 0) return;

  const bildMap = path.join(ROT, "rundor/P3b-klader/matt/bilder");
  fs.mkdirSync(bildMap, { recursive: true });

  const srv = await startaServer(distMap);
  const port = srv.address().port;
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const page = await ctx.newPage();
    const sidfel = [];
    page.on("pageerror", (e) => sidfel.push("pageerror: " + e.message));
    page.on("console", (m) => {
      if (m.type() === "error") sidfel.push("console.error: " + m.text());
    });

    await page.addInitScript(() => {
      localStorage.setItem(
        "trollpennan:v2",
        JSON.stringify({
          version: 2,
          introSedd: true,
          ljudPa: false,
          stjarnor: 10,
          egnaDjur: 3,
          ang: [],
          gard: [],
          albumKropp: { kanin: { formel: "en kanin", poang: 1, niva: "vanlig", hjartan: 0 } },
        }),
      );
    });

    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => Boolean(window.__troll && window.__tredSyn), { timeout: 15000 });

    async function skriv(fras) {
      await page.evaluate((f) => window.__troll.skriv(f), fras);
      await page.waitForTimeout(900);
      return page.evaluate(() => {
        const t = window.__troll.tillstand();
        const syn = window.__tredSyn ? window.__tredSyn() : [];
        return { ang: t.ang, syn };
      });
    }

    if (KOR_DEL1) {
      await skriv("en biff");
      const rSport = await skriv("en sportbil");
      const sistSport = rSport.ang[rSport.ang.length - 1];
      krav(sistSport?.kropp === "sportbil", `P3b-1 skärm: efter "en biff" -> "en sportbil" blev sista=${sistSport?.kropp}`);
      await page.screenshot({ path: path.join(bildMap, "p3b1-sportbil.png") });

      await skriv("en ubåt");
      const rEld = await skriv("en gul eld");
      const sistEld = rEld.ang[rEld.ang.length - 1];
      krav(sistEld?.kropp === "eld", `P3b-1 skärm: efter "en ubåt" -> "en gul eld" blev sista=${sistEld?.kropp}`);
      await page.screenshot({ path: path.join(bildMap, "p3b1-gul-eld.png") });

      const rJatte = await skriv("en stor jätte");
      const sistJatte = rJatte.ang[rJatte.ang.length - 1];
      krav(sistJatte?.kropp === "cyklop", `P3b-1 skärm: "en stor jätte" blev sista=${sistJatte?.kropp}`);
      await page.screenshot({ path: path.join(bildMap, "p3b1-jatte.png") });
    }

    if (KOR_DEL2) {
      await page.evaluate(() => window.__troll.rensa && window.__troll.rensa());
      const fall = [
        ["en kanin med en mössa", "kanin", "alvmossa", "p3b2-kanin-mossa.png"],
        ["en katt med en röd tröja", "katt", "troja", "p3b2-katt-troja.png"],
        ["en hund med glasögon och stövlar", "hund", "stovlar", "p3b2-hund-glasogon-stovlar.png"],
        ["en räv med krona", "rav", "krona", "p3b2-rav-krona.png"],
      ];
      for (const [fras, kropp, plaggId, fil] of fall) {
        const r = await skriv(fras);
        const sist = r.ang[r.ang.length - 1];
        krav(
          sist?.kropp === kropp && sist?.tillbehor?.some((t) => t.id === plaggId),
          `P3b-2 skärm: "${fras}" saknar ${kropp} med ${plaggId}`,
        );
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(bildMap, fil) });
      }
    }

    krav(sidfel.length === 0, `Sidfel under skärmprov: ${sidfel.join(" | ")}`);
  } finally {
    await browser.close();
    srv.close();
  }
}

if (KOR_DEL1) await snabbDel1();
if (KOR_DEL2) await snabbDel2();
if (!SNABB && fel.length === 0) await skarmProv();

if (fel.length > 0) {
  console.error(`prov-p3b RÖD (${fel.length} fel):`);
  for (const f of fel) console.error(" - " + f);
  process.exit(1);
}
console.log(`prov-p3b GRÖN (del=${DEL}, snabb=${SNABB})`);
