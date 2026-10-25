#!/usr/bin/env node
/**
 * Mätskript för G1 (G1a, G1b, G1c) — kontrollerar CC0-tillgångar, LICENSES.md,
 * data/gard-3d.json, rutnät/kanter/BFS-hage (G1a), Garden3D-inkoppling (G1b)
 * och djurvandring inom hagen (G1c).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const facit = JSON.parse(readFileSync(resolve(ROT, "rundor/G1-garden/facit-g1.json"), "utf8"));

const args = process.argv.slice(2);
const fasIdx = args.indexOf("--fas");
const fas = fasIdx >= 0 && args[fasIdx + 1] ? args[fasIdx + 1] : "g1c";

const fel = [];
const detaljer = { fas };

// 1. Kontrollera alltid att alla 12 CC0-modeller finns i public/models/gard/, tillgangar.json och LICENSES.md
const tillg = JSON.parse(readFileSync(resolve(ROT, "data/tillgangar.json"), "utf8"));
const tillgMap = tillg.tillgangar ?? {};
const licensesMd = readFileSync(resolve(ROT, "LICENSES.md"), "utf8");

for (const m of facit.nyaCc0Modeller) {
  const absFil = resolve(ROT, "public" + m.fil);
  if (!existsSync(absFil)) {
    fel.push(`Saknar GLB-fil: public${m.fil}`);
  }
  const post = tillgMap[m.id];
  if (!post) {
    fel.push(`Saknar ${m.id} i data/tillgangar.json`);
  } else if (post.licens !== "CC0-1.0") {
    fel.push(`Fel licens på ${m.id}: ${post.licens}`);
  }
  if (!licensesMd.includes(`| ${m.id} |`)) {
    fel.push(`Saknar ${m.id} i LICENSES.md`);
  }
}

for (const stFil of facit.staketModeller) {
  if (!existsSync(resolve(ROT, "public" + stFil))) {
    fel.push(`Saknar staketmodell: public${stFil}`);
  }
}

detaljer.cc0Modeller = facit.nyaCc0Modeller.length;

// 2. G1a+ kontroller: data/gard-3d.json och src/spel/gard/rutnat.ts
if (fas === "g1a" || fas === "g1b" || fas === "g1c") {
  const gardDataSlut = resolve(ROT, "data/gard-3d.json");
  if (!existsSync(gardDataSlut)) {
    fel.push("Saknar data/gard-3d.json");
  } else {
    const gardData = JSON.parse(readFileSync(gardDataSlut, "utf8"));
    const byggData = JSON.parse(readFileSync(resolve(ROT, "data/bygg.json"), "utf8"));
    for (const b of byggData.bygg_ord) {
      if (!gardData.byggnader || !(b.id in gardData.byggnader)) {
        fel.push(`data/gard-3d.json saknar bygg_ord "${b.id}"`);
      } else {
        const post = gardData.byggnader[b.id];
        if (post.fil && !existsSync(resolve(ROT, "public" + post.fil))) {
          fel.push(`data/gard-3d.json "${b.id}" pekar på saknad fil public${post.fil}`);
        }
      }
    }
    detaljer.antalByggOrd = byggData.bygg_ord.length;
  }

  const rutnatFil = resolve(ROT, "src/spel/gard/rutnat.ts");
  if (!existsSync(rutnatFil)) {
    fel.push("Saknar src/spel/gard/rutnat.ts");
  } else {
    const rutnat = await import(pathToFileURL(rutnatFil).href);
    const {
      GARD_BREDD,
      GARD_DJUP,
      cellTillXy,
      xyTillCell,
      kantTillXy,
      xyTillKant,
      kantTillVarld,
      hittaSlutnaHagar,
    } = rutnat;

    if (GARD_BREDD !== 6 || GARD_DJUP !== 10) {
      fel.push(`Fel rutnätsmått: ${GARD_BREDD}x${GARD_DJUP} (väntade 6x10)`);
    }

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const { xMin, xMax, yMin, yMax } = facit.rutnat.minneClamp;

    // Kontrollera alla 60 celler genom minne.ts-klampningen
    let cellOk = 0;
    for (let gz = 0; gz < 10; gz += 1) {
      for (let gx = 0; gx < 6; gx += 1) {
        const p = cellTillXy(gx, gz);
        const cx = clamp(p.x, xMin, xMax);
        const cy = clamp(p.y, yMin, yMax);
        const c = xyTillCell(cx, cy);
        if (c.gx === gx && c.gz === gz) cellOk += 1;
        else fel.push(`Cell (${gx},${gz}) snäppte fel efter klampning -> (${c.gx},${c.gz})`);
      }
    }
    detaljer.cellBijektion = `${cellOk}/60`;

    // Kontrollera alla 66 N-kanter och 70 W-kanter genom minne.ts-klampningen
    let kantOk = 0;
    for (let gz = 0; gz <= 10; gz += 1) {
      for (let gx = 0; gx < 6; gx += 1) {
        const p = kantTillXy({ gx, gz, kant: "N" });
        const k = xyTillKant(clamp(p.x, xMin, xMax), clamp(p.y, yMin, yMax));
        if (k.gx === gx && k.gz === gz && k.kant === "N") kantOk += 1;
        else fel.push(`Kant (${gx},${gz},N) snäppte fel -> (${k.gx},${k.gz},${k.kant})`);
      }
    }
    for (let gz = 0; gz < 10; gz += 1) {
      for (let gx = 0; gx <= 6; gx += 1) {
        const p = kantTillXy({ gx, gz, kant: "W" });
        const k = xyTillKant(clamp(p.x, xMin, xMax), clamp(p.y, yMin, yMax));
        if (k.gx === gx && k.gz === gz && k.kant === "W") kantOk += 1;
        else fel.push(`Kant (${gx},${gz},W) snäppte fel -> (${k.gx},${k.gz},${k.kant})`);
      }
    }
    detaljer.kantBijektion = `${kantOk}/136`;

    // Kontrollera rotationer för fence_simple
    const vn = kantTillVarld({ gx: 2, gz: 4, kant: "N" });
    const vw = kantTillVarld({ gx: 2, gz: 4, kant: "W" });
    if (Math.abs(vn.rotY - 0) > 1e-6) fel.push(`N-kant rotY=${vn.rotY}, väntade 0`);
    if (Math.abs(vw.rotY - Math.PI / 2) > 1e-6) fel.push(`W-kant rotY=${vw.rotY}, väntade PI/2`);

    // Kontrollera BFS-fallen i facit
    for (const bf of facit.bfsFall) {
      const hagar = hittaSlutnaHagar(bf.kanter);
      if (hagar.length !== bf.forvantatAntalHagar) {
        fel.push(`BFS "${bf.namn}": fick ${hagar.length} hagar, väntade ${bf.forvantatAntalHagar}`);
      } else if (bf.forvantatAntalHagar === 1) {
        const fick = hagar[0].celler.map((c) => `${c.gx},${c.gz}`).sort().join(";");
        const vant = bf.forvantadeCeller.map((c) => `${c.gx},${c.gz}`).sort().join(";");
        if (fick !== vant) {
          fel.push(`BFS "${bf.namn}": celler [${fick}] != [${vant}]`);
        }
      }
    }
  }
}

// 3. G1b+ kontroller: Garden3D.tsx, vyer.ts och inga otillåtna data-testid
if (fas === "g1b" || fas === "g1c") {
  const garden3dFil = resolve(ROT, "src/spel/gard/Garden3D.tsx");
  if (!existsSync(garden3dFil)) {
    fel.push("Saknar src/spel/gard/Garden3D.tsx");
  } else {
    const src = readFileSync(garden3dFil, "utf8");
    if (/\bdata-testid\s*=/.test(src)) {
      fel.push("src/spel/gard/Garden3D.tsx innehåller data-testid (bryter check:struktur)!");
    }
    if (!src.includes("OrthographicCamera") || !src.includes("Bounds")) {
      fel.push("src/spel/gard/Garden3D.tsx måste använda OrthographicCamera + Bounds");
    }
    if (src.includes("OrbitControls")) {
      fel.push("src/spel/gard/Garden3D.tsx får inte ha fri OrbitControls (fast kameravinkel krävs)");
    }
  }

  const startaSrc = readFileSync(resolve(ROT, "src/spel/starta.ts"), "utf8");
  if (/game\.scene\.start\(\s*["']gard["']\s*\)/.test(startaSrc)) {
    fel.push("src/spel/starta.ts startar fortfarande Phaser-scenen 'gard'");
  }
}

// 4. G1c kontroller: src/spel/gard/vandra.ts
if (fas === "g1c") {
  const vandraFil = resolve(ROT, "src/spel/gard/vandra.ts");
  if (!existsSync(vandraFil)) {
    fel.push("Saknar src/spel/gard/vandra.ts");
  } else {
    const vandra = await import(pathToFileURL(vandraFil).href);
    const { skapaGardVandrare, uppdateraGardVandrare } = vandra;
    const hageCeller = [
      { gx: 2, gz: 4 },
      { gx: 3, gz: 4 },
      { gx: 2, gz: 5 },
      { gx: 3, gz: 5 },
    ];
    const hageSet = new Set(hageCeller.map((c) => `${c.gx},${c.gz}`));
    let v = skapaGardVandrare(1, 10, hageCeller, "hage-1", 0);
    let utanfor = 0;
    const besokta = new Set([`${v.cell.gx},${v.cell.gz}`]);
    for (let i = 0; i < 400; i += 1) {
      v = uppdateraGardVandrare(v, 0.05);
      const nyckel = `${v.cell.gx},${v.cell.gz}`;
      besokta.add(nyckel);
      if (!hageSet.has(nyckel)) utanfor += 1;
    }
    detaljer.vandringForflyttad = Number(v.forflyttad.toFixed(2));
    detaljer.vandringBesoktaCeller = besokta.size;
    detaljer.vandringUtanfor = utanfor;
    if (utanfor > 0) {
      fel.push(`Vandrare klev utanför hagen ${utanfor} gånger under 400 steg`);
    }
    if (v.forflyttad < 1.0) {
      fel.push(`Vandrare rörde sig för lite (${v.forflyttad.toFixed(2)} < 1.0)`);
    }
  }
}

const ut = { ok: fel.length === 0, fel, detaljer };
console.log(JSON.stringify(ut, null, 2));
process.exit(ut.ok ? 0 : 1);
