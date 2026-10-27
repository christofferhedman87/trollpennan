import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sagaNu } from "../saga.ts";
import { arIntroFlygAktiv, INTRO_FLYG_SLUT_SEK, lasIntroKameraTid, publiceraTredKamera } from "./introFlygFas.ts";

type V3 = readonly [number, number, number];

export const INTRO_DAL_START = { pos: [0, 14.5, 22] as const, mal: [0, 0.5, -6] as const };
export const INTRO_ANG_LANDNING = { pos: [0, 3.05, 5.75] as const, mal: [0, 0.85, -0.5] as const };
export const INTRO_FLYG_TID = INTRO_FLYG_SLUT_SEK;

function lerp(a: number, b: number, u: number): number {
  return a + (b - a) * u;
}

function bland(a: V3, b: V3, u: number): V3 {
  return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
}

/** Hermite-utjämnad kurva från dalöversikt till Ängens landning. */
export function beraknaIntroKamera(tidSek: number): { pos: V3; mal: V3 } {
  const s = Math.min(1, Math.max(0, tidSek / INTRO_FLYG_TID));
  const u = s * s * (3 - 2 * s);
  return {
    pos: bland(INTRO_DAL_START.pos, INTRO_ANG_LANDNING.pos, u),
    mal: bland(INTRO_DAL_START.mal, INTRO_ANG_LANDNING.mal, u),
  };
}

const blick = new THREE.Vector3();

/** Äger kameran endast under introts `0..2.4 s`. SagaKameran tar över därefter. */
export function IntroKameraV09() {
  useFrame(({ camera }) => {
    const t = lasIntroKameraTid(sagaNu.aktiv);
    if (!arIntroFlygAktiv(sagaNu.aktiv, t)) return;
    const k = beraknaIntroKamera(t);
    camera.position.set(k.pos[0], k.pos[1], k.pos[2]);
    blick.set(k.mal[0], k.mal[1], k.mal[2]);
    camera.lookAt(blick);
    publiceraTredKamera(camera.position.x, camera.position.y, camera.position.z, t);
  }, -2);
  return null;
}
