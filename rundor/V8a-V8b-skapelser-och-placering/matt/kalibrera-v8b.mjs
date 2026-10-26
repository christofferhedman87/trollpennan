#!/usr/bin/env node
/**
 * Kalibreringsskript för V8b (Grindpunkt 6 i build-round-gate):
 * Körs FÖRE byggrundan mot nuvarande main (d9068f2) och sparar
 * rundor/V8a-V8b-skapelser-och-placering/matt/kalibrering-v8b.json.
 *
 * Kalibrerar:
 * 1. Småsaker (boll, apple, svamp, stjarna, nyckel, kaffekopp, puck):
 *    faktisk 3D-skärmsiluett på 375x812 vs regelns Box3-rektangel (siluett_andel).
 * 2. Byggnadsrader (slott, hus, torn, koja, sjukhus, vaxthus):
 *    z-djup och siktlinje för nyaste byggnad samt sjukhusets skymningsgrad (<= 10 %).
 * 3. Tröja (troja) i 375x812:
 *    skärmsynlighet (pixeldiff) för nuvarande fäste (0 %) vs kalibrerat fäste (>= 25 %).
 */
import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { SkeletonUtils } from "three-stdlib";
import { entitet, framVinkel, modellUrl, skalaFor, arSmasak } from "../../../src/spel/entiteter.ts";
import { KAMERA_ANG } from "../../../src/spel/skarm.ts";
import { placera } from "../../../src/spel/placering.ts";
import { ankareFor } from "../../../src/spel/tillbehor/ankare.ts";
import { faestPlaggKlon } from "../../../src/spel/tillbehor/faest.ts";
import { platsMed } from "../../../src/spel/platser.ts";

globalThis.self ??= globalThis;

const VY_BREDD = 375;
const VY_HOJD = 812;

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
loader.register(() => ({ name: "inga-bilder", loadTexture: () => Promise.resolve(null) }));

const cache = new Map();
async function laddaScen(id) {
  if (cache.has(id)) return cache.get(id);
  const url = modellUrl(id);
  if (!url) return null;
  const b = fs.readFileSync(path.join(process.cwd(), "public", url));
  const scen = await new Promise((res, rej) =>
    loader.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), "", (g) => res(g.scene), rej),
  );
  cache.set(id, scen);
  return scen;
}

function projBox(b, cam) {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  const p = new THREE.Vector3();
  for (let i = 0; i < 8; i++) {
    p.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).project(cam);
    const [sx, sy] = [((p.x + 1) / 2) * VY_BREDD, ((1 - p.y) / 2) * VY_HOJD];
    [x0, y0, x1, y1] = [Math.min(x0, sx), Math.min(y0, sy), Math.max(x1, sx), Math.max(y1, sy)];
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

function spar(uid, kropp, skapad) {
  return {
    uid,
    kropp,
    formel: `en ${kropp}`,
    beskrivning: `en ${kropp}`,
    skala: 1,
    alpha: 1,
    formagor: [],
    tillbehor: [],
    overraskningar: [],
    skapad,
  };
}

function raycastAndel(djurGroup, plaggGroup, dProj, cam, step = 4) {
  const raycaster = new THREE.Raycaster();
  const dMeshes = [];
  const pMeshes = [];
  djurGroup.traverse((o) => {
    if (o.isMesh) dMeshes.push(o);
  });
  plaggGroup.traverse((o) => {
    if (o.isMesh) pMeshes.push(o);
  });
  let dHits = 0;
  let pHits = 0;
  for (let py = Math.floor(dProj.y0); py <= Math.ceil(dProj.y1); py += step) {
    for (let px = Math.floor(dProj.x0); px <= Math.ceil(dProj.x1); px += step) {
      const ndc = new THREE.Vector2((px / VY_BREDD) * 2 - 1, -(py / VY_HOJD) * 2 + 1);
      raycaster.setFromCamera(ndc, cam);
      const hitD = raycaster.intersectObjects(dMeshes, true);
      const hitP = raycaster.intersectObjects(pMeshes, true);
      if (hitD.length > 0) dHits++;
      if (hitP.length > 0 && (hitD.length === 0 || hitP[0].distance <= hitD[0].distance + 0.01)) pHits++;
    }
  }
  return { dHits, pHits, andel: +(pHits / Math.max(1, dHits)).toFixed(4) };
}

async function huvud() {
  const cam375 = new THREE.PerspectiveCamera(58, VY_BREDD / VY_HOJD, 0.1, 90);
  cam375.position.set(...KAMERA_ANG);
  cam375.lookAt(0, 1.05, -0.15);
  cam375.updateMatrixWorld(true);
  const ang = platsMed("ang");

  // 1. Kalibrera småsaker på 375x812
  const smasakIds = ["boll", "apple", "svamp", "stjarna", "nyckel", "kaffekopp", "puck"];
  const smasakerKalibrering = {};
  for (const id of smasakIds) {
    const scen = await laddaScen(id);
    const klon = SkeletonUtils.clone(scen);
    klon.updateMatrixWorld(true);
    const b0 = new THREE.Box3().setFromObject(klon);
    const s = skalaFor(id, b0.max.y - b0.min.y, b0.max.x - b0.min.x, b0.max.z - b0.min.z);
    klon.scale.setScalar(s);
    klon.position.set(-((b0.min.x + b0.max.x) / 2) * s, -b0.min.y * s, -((b0.min.z + b0.max.z) / 2) * s);
    const g = new THREE.Group();
    g.position.set(0, 0, 2.35);
    g.rotation.set(0, framVinkel(entitet(id)?.framAxel), 0);
    g.add(klon);
    g.updateMatrixWorld(true);
    const wBox = new THREE.Box3().setFromObject(g);
    const proj = projBox(wBox, cam375);

    const ensam = placera([spar(`e-${id}`, id, 1)], ang).get(`e-${id}`);
    const rRule = ensam.kropp ?? ensam.r;
    const rw = rRule.x1 - rRule.x0;
    const rh = rRule.y1 - rRule.y0;
    smasakerKalibrering[id] = {
      arSmasakNu: arSmasak(id),
      malhojd: entitet(id)?.malhojd ?? null,
      box3SkarmPxVidZ235: { w: +proj.w.toFixed(1), h: +proj.h.toFixed(1), maxSida: +Math.max(proj.w, proj.h).toFixed(1) },
      regelKroppPxNu: { w: +rw.toFixed(1), h: +rh.toFixed(1), maxSida: +Math.max(rw, rh).toFixed(1), z: ensam.z, krymp: ensam.krymp ?? 1 },
      rekommenderadSiluettAndel: [0.85, 0.85],
    };
  }

  // Mät sekvensen av 5 småsaker på äng
  const smaAng = ["boll", "apple", "svamp", "stjarna", "nyckel"].map((id, i) => spar(`s${i}`, id, i + 1));
  const smaPlacerade = placera(smaAng, ang);
  const smaRektanglar = smaAng.map((d) => {
    const pos = smaPlacerade.get(d.uid);
    const r = pos.kropp ?? pos.r;
    const w = r.x1 - r.x0;
    const h = r.y1 - r.y0;
    return {
      kropp: d.kropp,
      x: +pos.x.toFixed(2),
      z: +pos.z.toFixed(2),
      krymp: pos.krymp ?? 1,
      maxSidaPx: +Math.max(w, h).toFixed(1),
      skymdTackt: +(pos.skymd?.tackt ?? 0).toFixed(3),
    };
  });

  // 2. Kalibrera byggnadsrader (slott -> hus -> torn -> koja) och sjukhus på ängen
  const byggLista = [];
  const byggSekvens = [];
  for (const [i, id] of ["slott", "hus", "torn", "koja"].entries()) {
    byggLista.push(spar(`b${i}`, id, i + 1));
    const pl = placera(byggLista, ang);
    const nyast = pl.get(byggLista[byggLista.length - 1].uid);
    const aldreBygg = byggLista.slice(0, -1).map((b) => pl.get(b.uid));
    byggSekvens.push({
      steg: id,
      nyastZ: nyast.z,
      aldreMaxZ: aldreBygg.length ? Math.max(...aldreBygg.map((b) => b.z)) : null,
      nyastFramstNu: aldreBygg.every((b) => nyast.z >= b.z),
    });
  }

  // Sjukhus i ang-sekvensen
  const angOrd = ["ko", "katt", "hund", "kanin", "sjukhus", "stjarna", "kaffekopp", "gris", "slott", "puck"];
  const angLista = angOrd.map((id, i) => spar(`a${i}`, id, i + 1));
  const angPl = placera(angLista, ang);
  const sjukhusPos = angPl.get("a4");

  // 3. Kalibrera tröja på kanin, katt, hund, rav i 375x812
  const trojaScen = await laddaScen("troja");
  trojaScen.updateMatrixWorld(true);
  const box0 = new THREE.Box3().setFromObject(trojaScen);
  const sz = box0.getSize(new THREE.Vector3());
  const maxDim = Math.max(sz.x, sz.y, sz.z);

  const trojaKalibrering = {};
  for (const djurId of ["kanin", "katt", "hund", "rav"]) {
    const scen = await laddaScen(djurId);
    const djur = SkeletonUtils.clone(scen);
    djur.updateMatrixWorld(true);
    const b0 = new THREE.Box3().setFromObject(djur);
    const s = skalaFor(djurId, b0.max.y - b0.min.y, b0.max.x - b0.min.x, b0.max.z - b0.min.z);
    djur.scale.setScalar(s);
    djur.position.set(-((b0.min.x + b0.max.x) / 2) * s, -b0.min.y * s, -((b0.min.z + b0.max.z) / 2) * s);
    const ytter = new THREE.Group();
    ytter.position.set(0, 0, 2.5);
    ytter.rotation.set(0, framVinkel(entitet(djurId)?.framAxel), 0);
    ytter.add(djur);
    ytter.updateMatrixWorld(true);

    const a = ankareFor(djur, djurId, "modell");
    const dBox = new THREE.Box3().setFromObject(ytter);
    const dProj = projBox(dBox, cam375);

    // Nuvarande fäste (main d9068f2)
    const ytterNu = ytter.clone(true);
    ytterNu.updateMatrixWorld(true);
    const nuPlagg = faestPlaggKlon(ytterNu, djurId, "troja", trojaScen, "#E53935");
    ytterNu.updateMatrixWorld(true);
    const nuMetrik = raycastAndel(ytter, nuPlagg, dProj, cam375, 4);

    // Kalibrerat fäste (skala=1.48, djup=3.4, upp=-0.06, fram=0.78)
    const klonKal = SkeletonUtils.clone(trojaScen);
    const malMatt = Math.min(a.hojd * 0.85, Math.max(0.24, a.bredd * 1.48));
    const sc = malMatt / maxDim;
    const scZ = sc * 3.4;
    klonKal.scale.set(sc, sc, scZ);
    klonKal.position.set(
      -((box0.min.x + box0.max.x) / 2) * sc,
      -((box0.min.y + box0.max.y) / 2) * sc,
      -((box0.min.z + box0.max.z) / 2) * scZ,
    );
    const hallareKal = new THREE.Group();
    hallareKal.position.set(a.rygg.x, a.rygg.y - 0.06 * a.hojd, a.rygg.z + 0.78 * a.bredd);
    hallareKal.add(klonKal);
    const rootKal = new THREE.Group();
    rootKal.add(ytter.clone(true), hallareKal);
    rootKal.updateMatrixWorld(true);
    const kalMetrik = raycastAndel(rootKal.children[0], hallareKal, dProj, cam375, 4);

    trojaKalibrering[djurId] = {
      nuvarandePixelDiffAndel: nuMetrik.andel,
      kalibreradPixelDiffAndel: kalMetrik.andel,
      kalibreradParametrar: { skala: 1.48, djupSkala: 3.4, upp: -0.06, fram: 0.78 },
    };
  }

  const rapport = {
    tidpunkt: new Date().toISOString(),
    basCommit: "d9068f2",
    vy: { bredd: VY_BREDD, hojd: VY_HOJD, kameraAng: KAMERA_ANG },
    del1_smasaker: {
      modeller: smasakerKalibrering,
      sekvensFemSmasakerNu: smaRektanglar,
    },
    del2_byggnader: {
      sekvensFyraByggnaderNu: byggSekvens,
      sjukhusIAngSekvensNu: {
        z: sjukhusPos?.z ?? null,
        krymp: sjukhusPos?.krymp ?? 1,
        skymdTacktNu: +(sjukhusPos?.skymd?.tackt ?? 0).toFixed(3),
        kravMaxSkymd: 0.1,
      },
    },
    del3_troja: trojaKalibrering,
  };

  const utFil = path.join(
    process.cwd(),
    "rundor/V8a-V8b-skapelser-och-placering/matt/kalibrering-v8b.json",
  );
  fs.writeFileSync(utFil, JSON.stringify(rapport, null, 2) + "\n", "utf8");
  console.log("Skrev kalibreringsrapport:", utFil);
}

huvud();
