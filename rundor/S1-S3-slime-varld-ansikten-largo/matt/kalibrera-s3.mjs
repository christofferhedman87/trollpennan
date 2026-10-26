#!/usr/bin/env node
/**
 * kalibrera-s3.mjs — Förkalibrering (Grindpunkt 6) för Runda S3 på 375×812:
 * 1. Verifierar skärmstorlek (>= 68×68 px) och utstick (>= 12 px) för 1.25× Largo-djurblandningar
 *    (scaleXZ = 1.25, scaleY = 1.18) på Ängen och Gården.
 * 2. Verifierar krockfria offsetar mellan F4-plagg (par: "hatt", "hals", "rygg"),
 *    S2-ansiktsuttryck (par: "uttryck" på ansikte/ogonL/ogonR/mun) och S3-Largo-attribut
 *    (par: "oron" ut: ±0.28, par: "vingar" upp: +0.14 ut: ±0.22, par: "horn" fram: +0.18).
 * 3. Verifierar 2D-skuttbanan (malPunkt: [wx, wz]) till mat och hagleksaker
 *    (s-leksak-studsboll-cc0.glb, s-leksak-kudde-cc0.glb, s-mat-jordgubbe-cc0.glb, s-mat-honung-cc0.glb).
 */
import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";

const W = 375;
const H = 812;

// Ängens kamera på 375×812 (src/spel/skarm.ts / angen3d.tsx)
const cam = new THREE.PerspectiveCamera(58, W / H, 0.1, 80);
cam.position.set(0, 4.15, 9.8);
cam.lookAt(0, 1.05, -0.15);
cam.updateMatrixWorld(true);
cam.updateProjectionMatrix();

function projectBox(min, max) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  const v = new THREE.Vector3();
  for (const x of [min[0], max[0]]) {
    for (const y of [min[1], max[1]]) {
      for (const z of [min[2], max[2]]) {
        v.set(x, y, z).project(cam);
        const px = (v.x * 0.5 + 0.5) * W;
        const py = (-v.y * 0.5 + 0.5) * H;
        if (px < x0) x0 = px;
        if (px > x1) x1 = px;
        if (py < y0) y0 = py;
        if (py > y1) y1 = py;
      }
    }
  }
  return {
    x0: Number(x0.toFixed(1)),
    x1: Number(x1.toFixed(1)),
    y0: Number(y0.toFixed(1)),
    y1: Number(y1.toFixed(1)),
    breddPx: Number((x1 - x0).toFixed(1)),
    hojdPx: Number((y1 - y0).toFixed(1)),
  };
}

// 1. Largo-skala (scaleXZ = 1.25, scaleY = 1.18) i främre lekområdet (z = 1.25)
const pos = [0.0, 0.0, 1.25];
const basMin = [pos[0] - 0.36, 0, pos[2] - 0.36];
const basMax = [pos[0] + 0.36, 0.95, pos[2] + 0.36];
const largoMin = [pos[0] - 0.36 * 1.25, 0, pos[2] - 0.36 * 1.25];
const largoMax = [pos[0] + 0.36 * 1.25, 0.95 * 1.18, pos[2] + 0.36 * 1.25];

const basSkarm = projectBox(basMin, basMax);
const largoSkarm = projectBox(largoMin, largoMax);

// Signaturdelarnas utstick i px utanför basdjurets kontur på 375×812
const largoDelar = {
  katt_oron: {
    par: "oron",
    ankare: "huvudTopp",
    offset: { ut: 0.28, upp: 0.08, fram: 0.0 },
    box: projectBox([pos[0] - 0.62, 0.92, pos[2] - 0.12], [pos[0] + 0.62, 1.32, pos[2] + 0.12]),
  },
  drak_vingar: {
    par: "vingar",
    ankare: "rygg",
    offset: { ut: 0.22, upp: 0.14, fram: -0.05 },
    box: projectBox([pos[0] - 0.74, 0.48, pos[2] - 0.25], [pos[0] + 0.74, 1.18, pos[2] + 0.15]),
  },
  enhorning_horn: {
    par: "horn",
    ankare: "huvudTopp",
    offset: { ut: 0.0, upp: 0.05, fram: 0.18 },
    box: projectBox([pos[0] - 0.09, 1.04, pos[2] + 0.10], [pos[0] + 0.09, 1.46, pos[2] + 0.36]),
  },
};

const utstickPx = {
  katt_oron: Number(Math.max(largoSkarm.y0 - largoDelar.katt_oron.box.y0, largoDelar.katt_oron.box.x1 - largoSkarm.x1).toFixed(1)),
  drak_vingar: Number((largoDelar.drak_vingar.box.x1 - largoSkarm.x1).toFixed(1)),
  enhorning_horn: Number((largoSkarm.y0 - largoDelar.enhorning_horn.box.y0).toFixed(1)),
};

// 2. Krockfrihet mellan F4-plagg, S2-uttryck och S3-Largo-attribut
const krockfriaParGrupper = {
  f4_plagg: [
    { id: "mossa", par: "hatt", ankare: "huvudTopp", offset: { ut: 0.0, upp: 0.0, fram: 0.04 } },
    { id: "halsduk", par: "hals", ankare: "hals", offset: { ut: 0.0, upp: 0.0, fram: 0.08 } },
    { id: "filt", par: "rygg", ankare: "rygg", offset: { ut: 0.0, upp: 0.02, fram: -0.04 } },
  ],
  s2_uttryck: [
    { id: "ansiktsuttryck", par: "uttryck", ankare: "ansikte", offset: { ut: 0.0, upp: 0.0, fram: 0.012 }, polygonOffsetFactor: -2 },
  ],
  s3_largo: [
    { id: "oron", par: "oron", ankare: "huvudTopp", offset: { ut: 0.28, upp: 0.08, fram: 0.0 } },
    { id: "vingar", par: "vingar", ankare: "rygg", offset: { ut: 0.22, upp: 0.14, fram: -0.05 } },
    { id: "horn", par: "horn", ankare: "huvudTopp", offset: { ut: 0.0, upp: 0.05, fram: 0.18 } },
    { id: "svans", par: "svans", ankare: "rygg", offset: { ut: 0.0, upp: -0.04, fram: -0.45 } },
  ],
};

const allaPar = [
  ...krockfriaParGrupper.f4_plagg.map((x) => x.par),
  ...krockfriaParGrupper.s2_uttryck.map((x) => x.par),
  ...krockfriaParGrupper.s3_largo.map((x) => x.par),
];
const unikaPar = new Set(allaPar);

// 3. 2D-skuttbana (malPunkt: [wx, wz]) från djur [0.0, 1.25] till mat/leksak [1.15, 1.45]
function simuleraSkuttBana(start, mal, fart = 1.65, dt = 0.1) {
  let [x, z] = start;
  const steg = [];
  for (let t = 0; t <= 1.2; t = Number((t + dt).toFixed(2))) {
    const dx = mal[0] - x;
    const dz = mal[1] - z;
    const dist = Math.hypot(dx, dz);
    const hoppY = dist > 0.18 ? Number((Math.abs(Math.sin(t * 7)) * 0.22).toFixed(3)) : 0;
    steg.push({ t, x: Number(x.toFixed(3)), y: hoppY, z: Number(z.toFixed(3)), dist: Number(dist.toFixed(3)) });
    if (dist <= 0.18) break;
    const flytta = Math.min(dist, fart * dt);
    x += (dx / dist) * flytta;
    z += (dz / dist) * flytta;
  }
  return steg;
}

const skuttBana = simuleraSkuttBana([0.0, 1.25], [1.15, 1.45]);
const slutSteg = skuttBana[skuttBana.length - 1];

const rapport = {
  skarm: { bredd: W, hojd: H },
  largoSkala: {
    scaleXZ: 1.25,
    scaleY: 1.18,
    basSkarmPx: basSkarm,
    largoSkarmPx: largoSkarm,
    utstickPx,
  },
  krockfriaParGrupper,
  skuttBanaTillMatLeksak: {
    start: [0.0, 1.25],
    malPunkt: [1.15, 1.45],
    framkomstDist: slutSteg.dist,
    antalSteg: skuttBana.length,
    maxHoppY: Math.max(...skuttBana.map((s) => s.y)),
    steg: skuttBana,
  },
  kravUppfyllda: {
    largoMinst68x68Px: largoSkarm.breddPx >= 68 && largoSkarm.hojdPx >= 68,
    signaturdelUtstickMinst12Px: Object.values(utstickPx).every((px) => px >= 12),
    nollParKrockarMellanF4S2S3: unikaPar.size === allaPar.length,
    skuttNarFramInom1_2s: slutSteg.dist <= 0.18 && slutSteg.t <= 1.2,
  },
};

const utFil = path.resolve(import.meta.dirname, "kalibrering-s3.json");
fs.writeFileSync(utFil, JSON.stringify(rapport, null, 2) + "\n");
console.log(JSON.stringify(rapport, null, 2));
if (!Object.values(rapport.kravUppfyllda).every(Boolean)) {
  process.exit(1);
}
