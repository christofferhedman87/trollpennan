import { useEffect, useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import texterJson from "../../../data/texter-gard.json" with { type: "json" };
import type { Sparad } from "../brygga.ts";
import { artFarg } from "../entiteter.ts";
import type { Plats } from "../platser.ts";
import { placeraMedMinne, rollFor } from "../placering.ts";

export const HINT = (texterJson as { tred_hint: string }).tred_hint;
export const SNART = (texterJson as { demo: { snart: string } }).demo.snart;
export const TRAD: [number, number, number][] = [
  [-2.7, -2.4, 1.05],
  [-3.15, -4.1, 1.22],
  [-2.35, -5.5, 0.95],
  [2.75, -2.2, 1.08],
  [3.2, -3.9, 1.2],
  [2.4, -5.3, 0.95],
];
export const GRAN: [number, number][] = [
  [-3.4, -7.4],
  [3.5, -7.6],
];
export const BLOMMOR = [
  [-1.25, 1.15, "#F48FB1"],
  [-1.55, 1.38, "#FDD835"],
  [-0.95, 1.42, "#FFFFFF"],
  [-1.4, 1.62, "#CE93D8"],
  [-1.05, 1.68, "#F48FB1"],
  [1.15, 1.2, "#FDD835"],
  [1.45, 1.4, "#FFFFFF"],
  [0.9, 1.48, "#CE93D8"],
  [1.3, 1.62, "#F48FB1"],
  [-0.45, 2.05, "#F48FB1"],
  [0.1, 2.28, "#FDD835"],
  [0.55, 2.02, "#FFFFFF"],
  [-0.15, 2.42, "#CE93D8"],
] as const;

declare global {
  interface Window {
    __tred?: {
      x: number;
      y: number;
      z: number;
      zoom: number;
      dx?: number;
      dy?: number;
      dz?: number;
      fov?: number;
      calls?: number;
      tris?: number;
      fps?: number;
      husx?: number;
      husy?: number;
      /** B6.3 (G): dammens vatten på skärmen (CSS-px), för prov */
      damm?: { x: number; y: number }[];
    };
    __tredMal?: Record<string, { x: number; y: number }>;
    /** B6.3, för prov: skapelsens läge i världen (x, z) som det ritas, vickning inräknad. */
    __tredPos?: Record<string, { x: number; z: number; y?: number; k?: number; sim?: boolean; flyg?: boolean; stall?: boolean; trang?: number; syn?: number }>;
    /** B6.3, för prov: ängens damm (ang/damm.ts). */
    __damm?: { x: number; z: number; r: number };
    /** B4.1, för prov: ljus = punktljus i poolen (fast antal), pol = ljuspölar, aktiva = tända ljus, scen = punktljus i scenen, program = shaderprogram. */
    __ljus?: { ljus: number; pol: number; aktiva: number; program: number; scen?: number };
    /** B6.5, för prov: effekterna som ritas per skapelse (uid). Finns bara när ett prov har lagt dit objektet. */
    __tredEffekter?: Record<string, string[]>;
    /** B6.6, för prov: kroppens ruta på skärmen (CSS-px) och antal synliga meshar. Går att anropa och att skriva på per uid. */
    __tredSyn?: Record<string, { x: number; y: number; w: number; h: number; mesh: number; b?: number[] }> & {
      (): { uid: string; x?: number; y?: number; w?: number; h?: number; mesh?: number; b?: number[] }[];
    };
    __tredKamera?: { p: number[]; fov: number };
    /** P3a: titelbildens djur (uid) – djur.tsx mäter dess ritade kropp (CSS-px) så att utsnittet visar bara det djuret. */
    __tredBild?: { uid: string; ruta?: { x: number; y: number; w: number; h: number; mesh: number } };
  }
}

export function lerpHex(a: string, b: string, t: number) {
  const p = (h: string) => {
    const n = Number.parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const A = p(a);
  const B = p(b);
  const c = A.map((v, i) => Math.round(v + ((B[i] ?? v) - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export const _mal = new THREE.Vector3();
export const _blomM = new THREE.Matrix4();
export const _blomQ = new THREE.Quaternion();
export const _blomE = new THREE.Euler();
export const _blomP = new THREE.Vector3();
export const _blomS = new THREE.Vector3(1, 1, 1);

export function normDuk(canvas: HTMLElement, v: THREE.Vector3): { x: number; y: number } {
  const crect = canvas.getBoundingClientRect();
  const sx = crect.left + ((v.x + 1) / 2) * crect.width;
  const sy = crect.top + ((1 - v.y) / 2) * crect.height;
  const ang = canvas.closest(".ang");
  if (!(ang instanceof HTMLElement)) return { x: 0.5, y: 0.45 };
  const arect = ang.getBoundingClientRect();
  const nx = (sx - arect.left) / Math.max(1, arect.width);
  const ny = (sy - arect.top) / Math.max(1, arect.height);
  const stil = getComputedStyle(ang);
  const dukX = Number.parseFloat(stil.getPropertyValue("--duk-x")) || 0;
  const dukY = Number.parseFloat(stil.getPropertyValue("--duk-y")) || 0;
  const dukW = Number.parseFloat(stil.getPropertyValue("--duk-w")) || 1;
  const dukH = Number.parseFloat(stil.getPropertyValue("--duk-h")) || 1;
  return { x: (nx - dukX) / dukW, y: (ny - dukY) / dukH };
}

export function djurFarg(spec: Sparad) {
  if (spec.farg?.startsWith("#")) return spec.farg;
  return artFarg(spec.kropp);
}

/** P3: en vattenfågel (entiteter.json vattenfagel) utan barnets vingar simmar på en plats med vattenyta (P3a: också i ängens damm). */
/** P3a-fix: med alla räknas rollen regeln gav (en säl utan vattenruta står på marken), annars saken själv. */
const rollI = (spec: Sparad, plats?: Plats, alla?: Sparad[]) => (alla && placeraMedMinne(alla, plats).get(spec.uid)?.roll) || rollFor(spec, plats);
export function flygare(spec: Sparad, plats?: Plats, alla?: Sparad[]) {
  return rollI(spec, plats, alla) === "luft";
}

export function simmare(spec: Sparad, plats?: Plats, alla?: Sparad[]) {
  return rollI(spec, plats, alla) === "vatten";
}

/**
 * P3a: läget för en skapelse ur EN placeringsregel för alla platser (placering.ts, data/placering.json). Ersätter B6.x:s
 * platser (LAND_SLOT, simmarnas ring, byggnadsraderna, siktzonen) och P3:s punktfixar.
 */
export function djurPlats(spec: Sparad, alla: Sparad[], plats?: Plats): [number, number, number] {
  const l = placeraMedMinne(alla, plats).get(spec.uid);
  return l ? [l.x, l.y, l.z] : [0, 0, 0];
}

/** P3a: ritas mindre när det är trångt (äldre) eller när den inte ryms i bild alls (placering.ts krymp), annars 1. */
export function djurKrymp(spec: Sparad, alla: Sparad[], plats?: Plats): number {
  return placeraMedMinne(alla, plats).get(spec.uid)?.krymp ?? 1;
}

/** P3a: fick den ingen ledig ruta (stallet)? För prov (window.__tredPos). */
export function djurIStall(spec: Sparad, alla: Sparad[], plats?: Plats): boolean {
  return !!placeraMedMinne(alla, plats).get(spec.uid)?.stall;
}

/** P3a: hur mycket av full vandring djuret har (placering.ts vand): 1 = fritt bete, mindre när det är trångt. */
export function djurVand(spec: Sparad, alla: Sparad[], plats?: Plats): number {
  return placeraMedMinne(alla, plats).get(spec.uid)?.vand ?? 1;
}

export function slag(id: string): "hus" | "trad" | "blomma" | "damm" | "talt" | "mur" {
  if (id === "damm") return "damm";
  if (id === "tält") return "talt";
  if (id === "staket" || id === "mur") return "mur";
  if (["träd", "gran", "palm", "äppelträd", "buske", "svamp"].includes(id)) return "trad";
  if (id === "blomma") return "blomma";
  return "hus";
}

export const _dir = new THREE.Vector3();

export function usePennTryck(onTap: () => void) {
  const upp = useRef<((ev: PointerEvent) => void) | null>(null);
  const tap = useRef(onTap);
  tap.current = onTap;
  useEffect(() => {
    return () => {
      if (upp.current) window.removeEventListener("pointerup", upp.current);
    };
  }, []);
  return (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (upp.current) window.removeEventListener("pointerup", upp.current);
    const sx = e.nativeEvent.clientX;
    const sy = e.nativeEvent.clientY;
    const klar = (ev: PointerEvent) => {
      upp.current = null;
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (dx * dx + dy * dy > 24 * 24) return;
      tap.current();
    };
    upp.current = klar;
    window.addEventListener("pointerup", klar, { once: true });
  };
}

const _synBox = new THREE.Box3();
const _synP = new THREE.Vector3();
/** B6.6: kroppens skärmruta (CSS-px) ur världsrutan (8 hörn projicerade) och antalet synliga meshar med synligt material. */
export function synMatt(kropp: THREE.Object3D, kamera: THREE.Camera, rect: DOMRect): { x: number; y: number; w: number; h: number; mesh: number; b?: number[] } {
  let mesh = 0;
  _synBox.makeEmpty();
  kropp.updateWorldMatrix(true, true);
  kropp.traverseVisible((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    if (!mats.some((q) => q && q.visible && q.opacity > 0.05)) return;
    mesh++;
    _synBox.expandByObject(m);
  });
  if (!mesh || _synBox.isEmpty()) return { x: 0, y: 0, w: 0, h: 0, mesh };
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < 8; i++) {
    _synP.set(i & 1 ? _synBox.max.x : _synBox.min.x, i & 2 ? _synBox.max.y : _synBox.min.y, i & 4 ? _synBox.max.z : _synBox.min.z).project(kamera);
    const sx = ((_synP.x + 1) / 2) * rect.width;
    const sy = ((1 - _synP.y) / 2) * rect.height;
    x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
  }
  // x, y = rutans övre vänstra hörn i sidan (CSS-px)
  // b = världslådan (min x, y, z, max x, y, z) – P3a: provet jämför den med placeringsregelns låda
  const c = kamera as THREE.PerspectiveCamera;
  window.__tredKamera = { p: [c.position.x, c.position.y, c.position.z].map((v) => Math.round(v * 1000) / 1000), fov: c.fov };
  const b = [_synBox.min.x, _synBox.min.y, _synBox.min.z, _synBox.max.x, _synBox.max.y, _synBox.max.z].map((v) => Math.round(v * 1000) / 1000);
  return { x: Math.round(rect.left + x0), y: Math.round(rect.top + y0), w: Math.round(x1 - x0), h: Math.round(y1 - y0), mesh, b };
}
