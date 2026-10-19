import { useEffect, useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import texterJson from "../../../data/texter-gard.json" with { type: "json" };
import type { Sparad } from "../brygga.ts";
import { artFarg, flyger, simmar, vikt } from "../entiteter.ts";

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
    };
    __tredMal?: Record<string, { x: number; y: number }>;
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

export function flygare(spec: Sparad) {
  return flyger(spec.kropp, spec.formagor);
}

export function simmare(spec: Sparad) {
  return simmar(spec.kropp, spec.formagor);
}

const LAND_SLOT: [number, number][] = [
  [0.1, -0.15],
  [-1.45, 0.35],
  [1.4, 0.25],
  [-0.8, 0.85],
  [0.85, 0.75],
  [0.05, 1.05],
  [-1.55, 1.05],
  [1.55, 0.95],
];

export function djurPlats(spec: Sparad, alla: Sparad[]): [number, number, number] {
  if (simmare(spec)) {
    const sim = alla.filter((d) => simmare(d));
    const i = Math.max(0, sim.findIndex((d) => d.uid === spec.uid));
    const ang = (i / Math.max(1, sim.length)) * Math.PI * 2;
    return [1.15 + Math.cos(ang) * 0.35, 0.16, -0.45 + Math.sin(ang) * 0.22];
  }
  const land = alla.filter((d) => !simmare(d) && !flygare(d));
  const flyg = alla.filter((d) => flygare(d) && !simmare(d));
  const tyngd = (d: Sparad) => vikt(d.kropp);
  if (flygare(spec)) {
    const i = Math.max(0, flyg.findIndex((d) => d.uid === spec.uid));
    return [-1.4 + i * 1.5, 1.55, -0.85];
  }
  const sorterad = land.slice().sort((a, b) => tyngd(b) - tyngd(a) || a.uid.localeCompare(b.uid));
  const i = Math.max(0, sorterad.findIndex((d) => d.uid === spec.uid));
  const slot = LAND_SLOT[i] ?? [((i % 2 === 0 ? -1 : 1) * (2.2 + Math.floor(i / 2) * 0.4)), -1.2];
  return [slot[0], 0, slot[1]];
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
