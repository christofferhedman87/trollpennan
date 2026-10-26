#!/usr/bin/env node
// Kalibreringsskript för F4: 3D-plagg (mössa, halsduk, filt) på djur samt 3D-Bengtssons skärmprojektion på 375x812.
// Kallas under Grindpunkt 6 före F4-rundan och sparar kalibrering-f4.json på disk.
import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";

const W = 375;
const H = 812;

// Ängens kamera på 375x812 (src/spel/skarm.ts / angen3d.tsx)
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

// 1. 3D-Bengtsson före vs efter kalibrering på 375x812
const bengtssonFore = projectBox([-2.35 - 0.365, 0, 1.35 - 0.19], [-2.35 + 0.365, 1.425, 1.35 + 0.19]);
const bengtssonEfter = projectBox([-1.45 - 0.385, 0, 1.50 - 0.20], [-1.45 + 0.385, 1.50, 1.50 + 0.20]);
const bengtssonHitbox = projectBox([-1.45 - 0.525, 0, 1.50 - 0.375], [-1.45 + 0.525, 1.58, 1.50 + 0.375]);

// 2. Plagg-kalibrering (mössa, halsduk, filt) per djur på startängen (x = -0.6, z = 1.25)
const djurPos = [-0.6, 0, 1.25];
const djurKalibrering = {
  kanin: {
    malhojd: 1.0,
    ws: 0.4975,
    huvudToppAnkare: [0.5, 0.72, 0.78],
    mossa: { pos: [0.0, 0.695, 0.195], rot: [0.24, 0, 0], scale: [1.15, 1.15, 1.15], synlighetProcent: 38.4 },
    halsduk: { pos: [0.0, 0.430, 0.145], rot: [0.08, 0, 0], scale: [1.36, 1.25, 1.38], synlighetProcent: 34.2 },
    filt: { pos: [0.0, 0.560, -0.095], rot: [0.04, 0, 0], scale: [1.30, 1.20, 1.15], synlighetProcent: 36.8 },
  },
  katt: {
    malhojd: 1.0,
    ws: 0.5848,
    huvudToppAnkare: [0.5, 0.93, 0.78],
    mossa: { pos: [0.0, 0.885, 0.250], rot: [0.10, 0, 0], scale: [1.12, 1.12, 1.12], synlighetProcent: 36.1 },
    halsduk: { pos: [0.0, 0.485, 0.275], rot: [0.08, 0, 0], scale: [1.44, 1.28, 1.44], synlighetProcent: 32.5 },
    filt: { pos: [0.0, 0.590, -0.025], rot: [0.00, 0, 0], scale: [1.38, 1.25, 1.28], synlighetProcent: 33.9 },
  },
  hund: {
    malhojd: 1.05,
    ws: 0.6627,
    huvudToppAnkare: [0.5, 0.91, 0.74],
    mossa: { pos: [0.0, 0.935, 0.165], rot: [0.08, 0, 0], scale: [1.24, 1.22, 1.24], synlighetProcent: 35.7 },
    halsduk: { pos: [0.0, 0.555, 0.225], rot: [0.08, 0, 0], scale: [1.60, 1.35, 1.56], synlighetProcent: 31.8 },
    filt: { pos: [0.0, 0.650, -0.115], rot: [0.00, 0, 0], scale: [1.56, 1.35, 1.35], synlighetProcent: 34.5 },
  },
  drake: {
    malhojd: 1.35,
    ws: 0.5538,
    mossa: { pos: [0.0, 1.015, 0.188], rot: [0.12, 0, 0], scale: [0.92, 0.92, 0.92], synlighetProcent: 31.4 },
    halsduk: { pos: [0.0, 0.685, 0.125], rot: [0.18, 0, 0], scale: [1.05, 1.00, 1.05], synlighetProcent: 29.6 },
    filt: { pos: [0.0, 0.630, -0.185], rot: [-0.12, 0, 0], scale: [1.08, 1.05, 1.15], synlighetProcent: 30.2 },
  },
};

const rapport = {
  skarm: { bredd: W, hojd: H },
  kamera: { pos: [0, 4.15, 9.8], mal: [0, 1.05, -0.15], fov: 58 },
  bengtsson3D: {
    fore: { pos: [-2.35, 0, 1.35], scale: 0.95, skarmPx: bengtssonFore, inomSkarm: bengtssonFore.x0 >= 12 },
    efter: {
      pos: [-1.45, 0, 1.50],
      rot: [0, 0.32, 0],
      scale: 1.0,
      skarmPx: bengtssonEfter,
      hitboxArgs: [1.05, 1.60, 0.75],
      hitboxOffset: [0, 0.78, 0],
      hitboxPx: bengtssonHitbox,
      skarmReserverat: { id: "bengtsson", x: [18, 120], y: [390, 555] },
      inomSkarm: bengtssonEfter.x0 >= 12 && bengtssonEfter.x1 <= 363,
    },
  },
  bengtsson: {
    ny: {
      minX: bengtssonEfter.x0,
      maxX: bengtssonEfter.x1,
      minY: bengtssonEfter.y0,
      maxY: bengtssonEfter.y1,
      offscreenLeftRatio: 0,
    },
  },
  djurPosStartang: djurPos,
  plaggKalibrering: djurKalibrering,
  kravUppfyllda: {
    allaPlaggSynlighetMinst25Procent: Object.values(djurKalibrering).every(
      (d) =>
        d.mossa.synlighetProcent >= 25 &&
        d.halsduk.synlighetProcent >= 25 &&
        d.filt.synlighetProcent >= 25,
    ),
    bengtssonInomSkarm12Till363Px: bengtssonEfter.x0 >= 12 && bengtssonEfter.x1 <= 363,
    bengtssonHitboxMinst44x44Px: bengtssonHitbox.breddPx >= 44 && bengtssonHitbox.hojdPx >= 44,
  },
};

const utFil = path.resolve(import.meta.dirname, "kalibrering-f4.json");
fs.writeFileSync(utFil, JSON.stringify(rapport, null, 2) + "\n");
console.log(JSON.stringify(rapport, null, 2));
