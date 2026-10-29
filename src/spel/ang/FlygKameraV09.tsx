import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { KAMERA_ANG } from "../skarm.ts";
import type { VagvisarePlatsId } from "./Vagvisare3D.tsx";
import { kameraAgar, publiceraTredKamera } from "./introFlygFas.ts";
import { resmalFor } from "./varldsKarta.ts";

const VY_SEK = 3;
const UPP_ANDEL = 0.78;
const RESA_SEK = 0.38;
const ANG_MAL = new THREE.Vector3(0, 1.05, -0.15);
// "Se hela dalen": platserna ligger i en solfjäder bakom ängen (varldsKarta.ts), så kameran står närmare än introts start.
const OVER_POS = new THREE.Vector3(0, 11.5, 13.5);
const OVER_MAL = new THREE.Vector3(0, 0.3, -7.5);
const ANG_POS = new THREE.Vector3(KAMERA_ANG[0], KAMERA_ANG[1], KAMERA_ANG[2]);
const RESA: Record<VagvisarePlatsId, THREE.Vector3> = {
  skogen: new THREE.Vector3(-0.9, 3.0, 5.6),
  grottan: new THREE.Vector3(0.8, 3.1, 5.4),
  sjon: new THREE.Vector3(1.3, 2.9, 6.0),
  garden: new THREE.Vector3(-1.3, 2.9, 6.0),
  ang: new THREE.Vector3(0, 3.2, 6.6),
};

/** Vid resan vänder sig kameran mot platsen i fjärran (varldsKarta.ts), så att det känns som att man går dit. */
function resaBlick(mal: VagvisarePlatsId): THREE.Vector3 {
  const r = mal === "ang" ? undefined : resmalFor(mal);
  return r ? new THREE.Vector3(r.mal[0], 1.0, r.mal[1]) : ANG_MAL.clone();
}

function mjuk(s: number): number {
  const c = Math.min(1, Math.max(0, s));
  return c * c * (3 - 2 * c);
}

function sattAng(cam: THREE.Camera): void {
  cam.position.copy(ANG_POS);
  cam.lookAt(ANG_MAL);
  publiceraTredKamera(ANG_POS.x, ANG_POS.y, ANG_POS.z, 0);
}

/** Äger kameran bara när introt är slut och en översiktsflygning eller resa pågår. */
export function FlygKameraV09({ introAktiv, vyFlygAktiv, resaMal }: { introAktiv: boolean; vyFlygAktiv: boolean; resaMal: VagvisarePlatsId | null }) {
  const t0 = useRef<number | null>(null);
  const fran = useRef(new THREE.Vector3());
  const malBlick = useRef(new THREE.Vector3());
  const blickMal = useRef(new THREE.Vector3());
  const foreFlyg = useRef(false);
  const foreResa = useRef<VagvisarePlatsId | null>(null);

  useFrame((state) => {
    const cam = state.camera;
    const nu = state.clock.elapsedTime;
    const ager = !introAktiv && (vyFlygAktiv || resaMal !== null);
    kameraAgar.flyg = ager;

    if (foreFlyg.current && !vyFlygAktiv && !introAktiv) {
      t0.current = null;
      sattAng(cam);
    }
    if (foreResa.current !== null && resaMal === null && !introAktiv && !vyFlygAktiv) {
      t0.current = null;
      sattAng(cam);
    }
    const nyFlyg = vyFlygAktiv && !foreFlyg.current;
    const nyResa = resaMal !== null && resaMal !== foreResa.current;
    foreFlyg.current = vyFlygAktiv;
    foreResa.current = resaMal;
    if (!ager) return;

    if (vyFlygAktiv) {
      if (nyFlyg || t0.current == null) {
        t0.current = nu;
        fran.current.copy(cam.position);
      }
      const t = nu - (t0.current ?? nu);
      const uppTid = VY_SEK * UPP_ANDEL;
      if (t <= 0.3) {
        const u = mjuk(t / 0.3);
        cam.position.lerpVectors(fran.current, OVER_POS, u);
        malBlick.current.copy(ANG_MAL).lerp(OVER_MAL, u);
      } else if (t <= uppTid) {
        cam.position.copy(OVER_POS);
        malBlick.current.copy(OVER_MAL);
      } else {
        const u = mjuk((t - uppTid) / (VY_SEK - uppTid));
        cam.position.lerpVectors(OVER_POS, ANG_POS, u);
        malBlick.current.copy(OVER_MAL).lerp(ANG_MAL, u);
      }
      cam.lookAt(malBlick.current);
      publiceraTredKamera(cam.position.x, cam.position.y, cam.position.z, t);
      return;
    }

    const mal = resaMal ? RESA[resaMal] : null;
    if (!mal || !resaMal) return;
    if (nyResa || t0.current == null) {
      t0.current = nu;
      fran.current.copy(cam.position);
      blickMal.current.copy(resaBlick(resaMal));
    }
    const u = mjuk((nu - (t0.current ?? nu)) / RESA_SEK);
    cam.position.lerpVectors(fran.current, mal, u);
    malBlick.current.copy(ANG_MAL).lerp(blickMal.current, u);
    cam.lookAt(malBlick.current);
    publiceraTredKamera(cam.position.x, cam.position.y, cam.position.z, nu - (t0.current ?? nu));
  }, -1);

  return null;
}
