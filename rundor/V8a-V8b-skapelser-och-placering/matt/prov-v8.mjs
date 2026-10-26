#!/usr/bin/env node
/**
 * Provskript för V8a och V8b:
 *   node rundor/V8a-V8b-skapelser-och-placering/matt/prov-v8.mjs --snabb --del 1|2|alla
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const node22 = "/home/box/.local/node22/bin/node";
if (!process.execArgv.includes("--experimental-strip-types") && fs.existsSync(node22)) {
  const r = spawnSync(node22, ["--experimental-strip-types", __filename, ...process.argv.slice(2)], {
    stdio: "inherit",
  });
  process.exit(r.status ?? 1);
}

const THREE = await import("three");
const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
const { MeshoptDecoder } = await import("three/examples/jsm/libs/meshopt_decoder.module.js");
const { SkeletonUtils } = await import("three-stdlib");

const tolkaMod = await import("../../../src/tolk/tolka.ts");
const { tolka } = tolkaMod;
const { ORD } = await import("../../../src/tolk/data.ts");
const { useMinne } = await import("../../../src/spel/minne.ts");
const platserMod = await import("../../../src/spel/platser.ts");
const { entitet, framVinkel, modellUrl, skalaFor, arSmasak } = await import("../../../src/spel/entiteter.ts");
const { KAMERA_ANG, tacker } = await import("../../../src/spel/skarm.ts");
const { placera } = await import("../../../src/spel/placering.ts");
const { faestPlaggKlon } = await import("../../../src/spel/tillbehor/faest.ts");

globalThis.self ??= globalThis;

const args = process.argv.slice(2);
const delIdx = args.indexOf("--del");
const del = delIdx >= 0 && args[delIdx + 1] ? args[delIdx + 1] : "alla";

const VY_BREDD = 375;
const VY_HOJD = 812;

function varelse(kropp, extra = {}) {
  return {
    kropp,
    formel: `en ${kropp}`,
    beskrivning: `en ${kropp}`,
    skala: 1,
    alpha: 1,
    formagor: [],
    tillbehor: [],
    overraskningar: [],
    ...extra,
  };
}

function spar(uid, kropp, skapad) {
  return {
    uid,
    ...varelse(kropp),
    skapad,
  };
}

async function korDel1() {
  // 1a. Ängstak 16 + vänlig påminnelse
  useMinne.getState().aterstall();
  const maxSynliga = platserMod.MAX_SYNLIGA_DJUR ?? null;
  for (let i = 1; i <= 16; i++) {
    useMinne.getState().laggPaAng(varelse("katt", { formel: `katt-${i}` }), 1);
  }
  const antalVid16 = useMinne.getState().ang.length;
  const ut17 = useMinne.getState().laggPaAng(varelse("katt", { formel: "katt-17" }), 1);
  const somnadeVid17 = ut17.somnade ?? [];
  const antalVid17 = useMinne.getState().ang.length;
  const soverRaw = ORD.repliker?.sover ?? "";
  const soverReplik = Array.isArray(soverRaw) ? soverRaw.join(" ") : String(soverRaw);
  const harVanligPaminnelse =
    soverReplik.includes("Ängen är full!") && soverReplik.includes("stallet");

  const angstakOk =
    maxSynliga === 16 &&
    antalVid16 === 16 &&
    antalVid17 === 16 &&
    somnadeVid17.length >= 1 &&
    harVanligPaminnelse;

  // 1b. Antalsord 1–10 (både ord och siffror)
  const rTio = tolka("tio katter");
  const rFem = tolka("fem grodor");
  const rSiffra10 = tolka("10 hundar");
  const rSiffra1 = tolka("1 katt");
  const antal1Till10Ok =
    rTio.typ === "skapad" &&
    rTio.antal === 10 &&
    rFem.typ === "skapad" &&
    rFem.antal === 5 &&
    rSiffra10.typ === "skapad" &&
    rSiffra10.antal === 10 &&
    rSiffra1.typ === "skapad" &&
    rSiffra1.antal === 1;

  // 1c. Två djur i samma mening med "och"
  const delaFn = tolkaMod.delaOchMening;
  let ochMeningOk = false;
  let ochDetalj = null;
  if (typeof delaFn === "function") {
    const delar1 = delaFn("en röd katt och en blå hund");
    const delar2 = delaFn("en liten gris och en stor björn");
    const delarTillb = delaFn("en katt med hatt och glasögon");
    const tolk1 = delar1.map((d) => tolka(d));
    const tolk2 = delar2.map((d) => tolka(d));
    ochMeningOk =
      delar1.length === 2 &&
      tolk1[0]?.typ === "skapad" &&
      tolk1[0]?.varelse.kropp === "katt" &&
      tolk1[0]?.varelse.farg === "#E53935" &&
      tolk1[1]?.typ === "skapad" &&
      tolk1[1]?.varelse.kropp === "hund" &&
      tolk1[1]?.varelse.farg === "#1E88E5" &&
      delar2.length === 2 &&
      tolk2[0]?.typ === "skapad" &&
      tolk2[0]?.varelse.kropp === "gris" &&
      tolk2[0]?.varelse.skala < 1 &&
      tolk2[1]?.typ === "skapad" &&
      tolk2[1]?.varelse.kropp === "bjorn" &&
      tolk2[1]?.varelse.skala > 1 &&
      delarTillb.length === 1;
    ochDetalj = { delar1, delar2, delarTillb };
  }

  // 1d. Mössa på befintlig frysande kanin
  let mossaPaKaninOk = false;
  let mossaDetalj = null;
  const useSkapaFil = fs.readFileSync(path.join(process.cwd(), "src/spel/styr/useSkapa.ts"), "utf8");
  const harKaninMossaLogikIKod =
    useSkapaFil.includes("uppdateraDjur") &&
    (useSkapaFil.includes("kanin-fryser") || useSkapaFil.includes('"fryser"')) &&
    (useSkapaFil.includes("alvmossa") || useSkapaFil.includes("mossa"));

  useMinne.getState().aterstall();
  const skapadKanin = useMinne.getState().laggPaAng(varelse("kanin"), 1).nya[0];
  useMinne.getState().sattUppdrag("kanin-fryser", "pagar");
  const mossaTolk = tolka("en kanin med en röd mössa");
  if (harKaninMossaLogikIKod && mossaTolk.typ === "skapad") {
    const uppdaterad = useMinne.getState().uppdateraDjur(skapadKanin.uid, mossaTolk.varelse);
    const kaninerPaAng = useMinne.getState().ang.filter((d) => d.kropp === "kanin");
    mossaPaKaninOk =
      kaninerPaAng.length === 1 &&
      kaninerPaAng[0].uid === skapadKanin.uid &&
      (uppdaterad?.tillbehor ?? []).some((t) => t.id === "alvmossa" || t.id === "mossa");
    mossaDetalj = {
      harKaninMossaLogikIKod,
      antalKaniner: kaninerPaAng.length,
      tillbehor: uppdaterad?.tillbehor ?? [],
    };
  } else {
    mossaDetalj = { harKaninMossaLogikIKod };
  }

  const ok = angstakOk && antal1Till10Ok && ochMeningOk && mossaPaKaninOk;
  return {
    ok,
    angstak16: {
      ok: angstakOk,
      maxSynliga,
      antalVid16,
      antalVid17,
      somnadeVid17Antal: somnadeVid17.length,
      soverReplik,
      harVanligPaminnelse,
    },
    antal1Till10: {
      ok: antal1Till10Ok,
      tioKatter: rTio.typ === "skapad" ? rTio.antal : null,
      femGrodor: rFem.typ === "skapad" ? rFem.antal : null,
      siffra10Hundar: rSiffra10.typ === "skapad" ? rSiffra10.antal : null,
      siffra1Katt: rSiffra1.typ === "skapad" ? rSiffra1.antal : null,
    },
    ochMening: {
      ok: ochMeningOk,
      detalj: ochDetalj,
    },
    mossaPaFrysandeKanin: {
      ok: mossaPaKaninOk,
      detalj: mossaDetalj,
    },
  };
}

async function korDel2() {
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

  const ang = platserMod.platsMed("ang");

  // 2a. Småsaker (boll, apple, svamp, stjarna, nyckel) >= 40 px, >= 40 px centeravstånd, 0 % överlapp
  const smaIds = ["boll", "apple", "svamp", "stjarna", "nyckel"];
  const allaArSmasak = smaIds.every((id) => arSmasak(id));
  const smaLista = smaIds.map((id, i) => spar(`s${i}`, id, i + 1));
  const smaPl = placera(smaLista, ang);
  const smaPoster = smaLista.map((d) => {
    const pos = smaPl.get(d.uid);
    const r = pos.kropp ?? pos.r;
    const w = r.x1 - r.x0;
    const h = r.y1 - r.y0;
    const cx = (r.x0 + r.x1) / 2;
    const cy = (r.y0 + r.y1) / 2;
    return {
      kropp: d.kropp,
      arSmasak: arSmasak(d.kropp),
      x: +pos.x.toFixed(2),
      z: +pos.z.toFixed(2),
      maxSidaPx: +Math.max(w, h).toFixed(1),
      skymdTackt: +(pos.skymd?.tackt ?? 0).toFixed(3),
      r,
      cx,
      cy,
    };
  });

  let minCenterDistPx = Infinity;
  let maxParOverlapp = 0;
  for (let i = 0; i < smaPoster.length; i++) {
    for (let j = i + 1; j < smaPoster.length; j++) {
      const a = smaPoster[i];
      const b = smaPoster[j];
      const dist = Math.hypot(a.cx - b.cx, a.cy - b.cy);
      minCenterDistPx = Math.min(minCenterDistPx, dist);
      maxParOverlapp = Math.max(maxParOverlapp, tacker(a.r, b.r), tacker(b.r, a.r));
    }
  }
  const minStorlekPx = Math.min(...smaPoster.map((s) => s.maxSidaPx));
  const maxSkymdSma = Math.max(...smaPoster.map((s) => s.skymdTackt));
  const smasakerOk =
    allaArSmasak &&
    minStorlekPx >= 40 &&
    minCenterDistPx >= 40 &&
    maxParOverlapp === 0 &&
    maxSkymdSma === 0;

  // 2b. Nyaste byggnad (slott, hus, torn, koja) på främre raden
  const byggIds = ["slott", "hus", "torn", "koja"];
  const byggLista = [];
  const byggSteg = [];
  for (const [i, id] of byggIds.entries()) {
    byggLista.push(spar(`b${i}`, id, i + 1));
    const pl = placera(byggLista, ang);
    const nyast = pl.get(`b${i}`);
    const aldre = byggLista.slice(0, -1).map((b) => pl.get(b.uid));
    const nyastFramst = aldre.every((b) => nyast.z >= b.z);
    const friSikt = (nyast.skymd?.tackt ?? 0) <= 0.1;
    byggSteg.push({
      steg: id,
      nyastZ: nyast.z,
      aldreMaxZ: aldre.length ? Math.max(...aldre.map((b) => b.z)) : null,
      skymdTackt: +(nyast.skymd?.tackt ?? 0).toFixed(3),
      ok: nyastFramst && friSikt,
    });
  }
  const byggnaderOk = byggSteg.every((s) => s.ok);

  // 2c. Sjukhuset i bakgrunden <= 10 % skymt
  const angOrd = ["ko", "katt", "hund", "kanin", "sjukhus", "stjarna", "kaffekopp", "gris", "slott", "puck"];
  const angLista = angOrd.map((id, i) => spar(`a${i}`, id, i + 1));
  const angPl = placera(angLista, ang);
  const sjukhusPos = angPl.get("a4");
  const sjukhusSkymd = +(sjukhusPos?.skymd?.tackt ?? 1).toFixed(3);
  const sjukhusOk = !sjukhusPos?.stall && sjukhusSkymd <= 0.1;

  // 2d. Röd tröja (troja) >= 25 % skärmsynlighet i 375x812
  const cam375 = new THREE.PerspectiveCamera(58, VY_BREDD / VY_HOJD, 0.1, 90);
  cam375.position.set(...KAMERA_ANG);
  cam375.lookAt(0, 1.05, -0.15);
  cam375.updateMatrixWorld(true);

  const trojaScen = await laddaScen("troja");
  const raycaster = new THREE.Raycaster();
  const trojaPerDjur = {};
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

    const dBox = new THREE.Box3().setFromObject(ytter);
    const dProj = projBox(dBox, cam375);

    const ytterMedPlagg = ytter.clone(true);
    ytterMedPlagg.updateMatrixWorld(true);
    const plaggGroup = faestPlaggKlon(ytterMedPlagg, djurId, "troja", trojaScen, "#E53935");
    ytterMedPlagg.updateMatrixWorld(true);

    const dMeshes = [];
    const pMeshes = [];
    ytter.traverse((o) => {
      if (o.isMesh) dMeshes.push(o);
    });
    if (plaggGroup) {
      plaggGroup.traverse((o) => {
        if (o.isMesh) pMeshes.push(o);
      });
    }

    let dHits = 0;
    let pHits = 0;
    for (let py = Math.floor(dProj.y0); py <= Math.ceil(dProj.y1); py += 4) {
      for (let px = Math.floor(dProj.x0); px <= Math.ceil(dProj.x1); px += 4) {
        const ndc = new THREE.Vector2((px / VY_BREDD) * 2 - 1, -(py / VY_HOJD) * 2 + 1);
        raycaster.setFromCamera(ndc, cam375);
        const hitD = raycaster.intersectObjects(dMeshes, true);
        const hitP = raycaster.intersectObjects(pMeshes, true);
        if (hitD.length > 0) dHits++;
        if (hitP.length > 0 && (hitD.length === 0 || hitP[0].distance <= hitD[0].distance + 0.01)) pHits++;
      }
    }
    const andel = +(pHits / Math.max(1, dHits)).toFixed(4);
    trojaPerDjur[djurId] = { dHits, pHits, andel, ok: andel >= 0.25 };
  }
  const trojaOk = Object.values(trojaPerDjur).every((t) => t.ok);

  const ok = smasakerOk && byggnaderOk && sjukhusOk && trojaOk;
  return {
    ok,
    smasaker: {
      ok: smasakerOk,
      allaArSmasak,
      minStorlekPx,
      minCenterDistPx: +minCenterDistPx.toFixed(1),
      maxParOverlapp: +maxParOverlapp.toFixed(3),
      maxSkymdSma,
      poster: smaPoster.map(({ r, cx, cy, ...rest }) => rest),
    },
    byggnader: {
      ok: byggnaderOk,
      steg: byggSteg,
    },
    sjukhus: {
      ok: sjukhusOk,
      z: sjukhusPos?.z ?? null,
      skymdTackt: sjukhusSkymd,
    },
    troja: {
      ok: trojaOk,
      perDjur: trojaPerDjur,
    },
  };
}

async function huvud() {
  const ut = { del };
  if (del === "1" || del === "alla") {
    ut.del1 = await korDel1();
  }
  if (del === "2" || del === "alla") {
    ut.del2 = await korDel2();
  }
  ut.ok =
    del === "1"
      ? ut.del1.ok
      : del === "2"
        ? ut.del2.ok
        : Boolean(ut.del1?.ok && ut.del2?.ok);

  console.log(JSON.stringify(ut, null, 2));
  process.exit(ut.ok ? 0 : 1);
}

huvud();
