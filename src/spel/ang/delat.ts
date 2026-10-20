import { useEffect, useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import texterJson from "../../../data/texter-gard.json" with { type: "json" };
import type { Sparad } from "../brygga.ts";
import { artFarg, bakPlatser, flyger, fotKant, siktHojd, siktRadie, simmar, storlekKlass, vikt } from "../entiteter.ts";
import { siktFri } from "./damm.ts";
import { START_PLATS, type Plats } from "../platser.ts";
import { placeraPaPlats } from "../platsYta.ts";

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
    __tredPos?: Record<string, { x: number; z: number }>;
    /** B6.3, för prov: ängens damm (ang/damm.ts). */
    __damm?: { x: number; z: number; r: number };
    /** B4.1, för prov: ljus = punktljus i poolen (fast antal), pol = ljuspölar, aktiva = tända ljus, scen = punktljus i scenen, program = shaderprogram. */
    __ljus?: { ljus: number; pol: number; aktiva: number; program: number; scen?: number };
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

const platsCache = new Map<string, Map<string, [number, number]>>();

/**
 * R8-2b: på en plats med zoner flyttas varje landdjur/sak till land (land/fri, aldrig vattenyta)
 * och simmare till vattenytan. Flygare rörs inte. B6.3 (I): ängen har också zoner (dammen), se angen3d.tsx.
 */
export function djurPlats(spec: Sparad, alla: Sparad[], plats?: Plats): [number, number, number] {
  const bas = djurPlatsBas(spec, alla);
  if (!plats || flygare(spec)) return bas;
  const nyckel = `${plats.id}|${alla.map((d) => d.uid).join(",")}`;
  let karta = platsCache.get(nyckel);
  if (!karta) {
    const marka = alla.filter((d) => !flygare(d));
    const ut = placeraPaPlats(
      plats,
      marka.map((d) => {
        const [x, , z] = djurPlatsBas(d, alla);
        return [x, z] as [number, number];
      }),
      marka.map((d) => simmare(d)),
      marka.map((d) => fotKant(d.kropp, d.skala)), // B6.3: kroppen (halva bredden ur bbox + vickning + 0,15) hålls från vattnet
      // B6.3 (Doodle 09:17): på ängen står ingen kropp mellan kameran och dammen (bredvid eller bakom i stället)
      marka.map((d) => (plats.id === START_PLATS && !simmare(d) ? (x: number, z: number) => siktFri(x, z, siktRadie(d.kropp, d.skala), siktHojd(d.kropp, d.skala)) : undefined)),
    );
    karta = new Map(marka.map((d, i) => [d.uid, ut[i]!]));
    if (platsCache.size > 30) platsCache.clear();
    platsCache.set(nyckel, karta);
  }
  const p = karta.get(spec.uid);
  return p ? [p[0], bas[1], p[1]] : bas;
}

function djurPlatsBas(spec: Sparad, alla: Sparad[]): [number, number, number] {
  if (simmare(spec)) {
    const sim = alla.filter((d) => simmare(d));
    const i = Math.max(0, sim.findIndex((d) => d.uid === spec.uid));
    const ang = (i / Math.max(1, sim.length)) * Math.PI * 2;
    return [1.15 + Math.cos(ang) * 0.35, 0.16, -0.45 + Math.sin(ang) * 0.22];
  }
  // B6.1 (E): stora saker (data/storlek.json zon "bak") står längst bak, bakom alla djur
  if (storlekKlass(spec.kropp)?.zon === "bak") {
    // B6.3 (J): spridda i zonen, fast läge per uid, inte längre en rad framför staketet
    const bak = alla.filter((d) => storlekKlass(d.kropp)?.zon === "bak" && !simmare(d) && !flygare(d));
    const i = Math.max(0, bak.findIndex((d) => d.uid === spec.uid));
    const p = bakPlatser(bak.map((d) => d.uid))[i] ?? [0, -1.4];
    return [p[0], 0, p[1]];
  }
  const land = alla.filter((d) => !simmare(d) && !flygare(d) && storlekKlass(d.kropp)?.zon !== "bak");
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
