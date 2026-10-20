import { useEffect, useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import texterJson from "../../../data/texter-gard.json" with { type: "json" };
import type { Sparad } from "../brygga.ts";
import { artFarg, BAK_ZON, bakPlatser, flyger, fotKant, halvBredd, hashTal, malhojd, siktHojd, siktRadie, simmar, storlekKlass, takSkala, vikt } from "../entiteter.ts";
import { DAMM, siktFri } from "./damm.ts";
import { START_PLATS, type Plats } from "../platser.ts";
import { placeraPaPlats, simPlatser } from "../platsYta.ts";

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
    /** B6.5, för prov: effekterna som ritas per skapelse (uid). Finns bara när ett prov har lagt dit objektet. */
    __tredEffekter?: Record<string, string[]>;
    /** B6.6, för prov: kroppens ruta på skärmen (CSS-px) och antal synliga meshar. Finns bara när ett prov har lagt dit objektet. */
    __tredSyn?: Record<string, { x: number; y: number; w: number; h: number; mesh: number }>;
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
  // B6.6: ängen rymmer 10. Plats 9 och 10 låg förut utanför bilden (x ±2,2), så den nionde och tionde skapelsen
  // (kvasten hos Doodle) syntes inte. Nu ligger alla tio inom |x| ≤ 1,55, där kameran ser dem.
  [-0.75, -0.35],
  [0.8, 1.6],
];

const platsCache = new Map<string, Map<string, [number, number]>>();

/**
 * R8-2b: på en plats med zoner flyttas varje landdjur/sak till land (land/fri, aldrig vattenyta)
 * och simmare till vattenytan. Flygare rörs inte. B6.3 (I): ängen har också zoner (dammen), se angen3d.tsx.
 */
export function djurPlats(spec: Sparad, alla: Sparad[], plats?: Plats): [number, number, number] {
  const bas = djurPlatsBas(spec, alla);
  // B6.6: stora saker har sitt läge ur bakLagen (dammen, grinden och bilden redan inräknade); flyttas inte igen
  if (!plats || flygare(spec) || (plats.id === START_PLATS && storlekKlass(spec.kropp)?.zon === "bak")) return bas;
  const nyckel = `${plats.id}|${alla.map((d) => d.uid).join(",")}`;
  let karta = platsCache.get(nyckel);
  if (!karta) {
    const marka = alla.filter((d) => !flygare(d));
    // B6.5: simmarna sprids över platsens vatten i stället för att alla önskar samma lilla ring (klump vid bryggan)
    const simUid = marka.filter((d) => simmare(d)).map((d) => d.uid);
    const sprid = simPlatser(plats, simUid.length);
    const ut = placeraPaPlats(
      plats,
      marka.map((d) => {
        const k = sprid ? simUid.indexOf(d.uid) : -1;
        if (k >= 0 && sprid?.[k]) return sprid[k]!;
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

const bakCache = new Map<string, Map<string, [number, number, boolean]>>();

/**
 * B6.6: stora saker längst bak, efter sin verkliga storlek. Byggnaderna (storlek.json, klass med rad "bortom") står
 * bakom staketet och fordon/möbler framför det. Kroppen ryms i bild (synlig_x), ingenting står framför grinden (fri_x
 * med halva bredden), och dammen hålls fri (fotKant) och syns (siktFri). De högsta väljer först och står längst bak; varje sak tar en
 * ledig sträcka i x (slumpad men fast per uid, så de sprids). Finns ingen ledig sträcka ställs den lägre framför den
 * högre (vid samma höjd den smalare framför den bredare), så att den aldrig skyms. Ren funktion av listan; null-plats = gamla bakPlatser.
 */
export function bakLagen(rad: Sparad[], bortom: boolean, zon = BAK_ZON): Map<string, [number, number, boolean]> {
  const nyckel = `${bortom}|${rad.map((d) => `${d.uid}:${d.kropp}:${d.skala}`).join(",")}`;
  const gammal = bakCache.get(nyckel);
  if (gammal) return gammal;
  const [z0, z1] = bortom && zon.bortom ? zon.bortom.z : zon.zon.z;
  const sx = zon.synlig_x ?? zon.zon.x[1];
  const hojd = (d: Sparad) => malhojd(d.kropp) * takSkala(d.kropp, d.skala || 1);
  // högst först, vid samma höjd den bredaste först: den smalare (växthuset) hamnar framför den bredare (cirkustältet)
  const ordning = rad.slice().sort((a, b) => hojd(b) - hojd(a) || halvBredd(b.kropp, b.skala) - halvBredd(a.kropp, a.skala) || a.uid.localeCompare(b.uid));
  const satta: { x: number; z: number; h: number }[] = [];
  const ut = new Map<string, [number, number, boolean]>();
  for (const d of ordning) {
    const h = halvBredd(d.kropp, d.skala);
    const zBas = z1 - (z1 - z0) * Math.min(1, Math.max(0, (hojd(d) - 0.8) / 1.2));
    // B6.3: kroppen utanför dammen och utanför siktzonen mellan kameran och dammen
    const [sr, sh] = [siktRadie(d.kropp, d.skala), siktHojd(d.kropp, d.skala)];
    const torr = (x: number, z: number) => Math.hypot(x - DAMM.x, z - DAMM.z) >= DAMM.r + fotKant(d.kropp, d.skala) && siktFri(x, z, sr, sh);
    const friX = (bortom && zon.bortom?.fri_x) || zon.fri_x;
    const fri = (x: number) => !friX.some(([a, b]) => x + h > a && x - h < b);
    const kand: number[] = [];
    for (let vidd = Math.max(0.05, sx - h); kand.length === 0 && vidd <= sx + 1.2; vidd += 0.3)
      for (let x = -vidd; x <= vidd + 1e-9; x += 0.05) if (fri(x) && (torr(x, zBas) || torr(x, z0))) kand.push(Math.round(x * 100) / 100);
    if (kand.length === 0) continue;
    const lucka = (x: number) => Math.min(Infinity, ...satta.map((o) => Math.abs(x - o.x) - h - o.h));
    const bast = Math.max(...kand.map(lucka));
    const lediga = kand.filter((x) => lucka(x) >= 0.08);
    // djupet: närmast zBas där dammen är fri och där den står minst 0,3 framför varje sak den överlappar
    // (den som väljer senare är aldrig högre, så den lägre står alltid framför den högre och skyms inte)
    const djup = (x: number): number | null => {
      let fram = -Infinity;
      for (const o of satta) if (Math.abs(x - o.x) < h + o.h) fram = Math.max(fram, o.z + 0.3);
      for (let k = 0; k <= 40; k++) {
        const z = zBas + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.05;
        if (z < z0 - 1e-9 || z > z1 + 1e-9 || z < fram - 1e-9) continue;
        if (torr(x, z)) return z;
      }
      return null;
    };
    let x = Number.NaN;
    let z = z0;
    if (lediga.length) {
      // slumpad men fast per uid bland de lediga sträckorna, så att de sprids
      const start = Math.floor(hashTal(d.uid, 7) * lediga.length);
      for (let k = 0; k < lediga.length && Number.isNaN(x); k++) {
        const c = lediga[(start + k) % lediga.length]!;
        const dz = djup(c);
        if (dz !== null) [x, z] = [c, dz];
      }
    }
    if (Number.isNaN(x))
      for (const c of kand.slice().sort((a, b) => lucka(b) - lucka(a) || a - b)) {
        const dz = djup(c);
        if (dz !== null) {
          [x, z] = [c, dz];
          break;
        }
      }
    let ok = true;
    if (Number.isNaN(x)) {
      // ingen sträcka och inget djup: längst fram där dammen är fri (då skymmer den inte), men rapportera
      x = kand.find((k) => lucka(k) === bast)!;
      z = [z1, (z0 + z1) / 2, z0].find((zz) => torr(x, zz)) ?? z0;
      ok = false;
    }
    satta.push({ x, z, h });
    ut.set(d.uid, [x, Math.round(z * 100) / 100, ok]);
  }
  if (bakCache.size > 30) bakCache.clear();
  bakCache.set(nyckel, ut);
  return ut;
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
    // B6.6: var rad för sig (byggnader bakom staketet, fordon och möbler framför), efter bredd och höjd
    // fordon och möbler som inte får plats framför staketet (dammen och grinden tar mycket) går bakom det, till byggnaderna
    const fram = bakLagen(bak.filter((d) => storlekKlass(d.kropp)?.rad !== "bortom"), false);
    const lage = fram.get(spec.uid);
    if (lage?.[2]) return [lage[0], 0, lage[1]];
    const bort = bakLagen(bak.filter((d) => storlekKlass(d.kropp)?.rad === "bortom" || fram.get(d.uid)?.[2] === false), true).get(spec.uid);
    if (bort) return [bort[0], 0, bort[1]];
    const i = Math.max(0, bak.findIndex((d) => d.uid === spec.uid));
    const p = bakPlatser(bak.map((d) => d.uid))[i] ?? [0, -1.4];
    return [p[0], 0, p[1]];
  }
  const land = alla.filter((d) => !simmare(d) && !flygare(d) && storlekKlass(d.kropp)?.zon !== "bak");
  const flyg = alla.filter((d) => flygare(d) && !simmare(d));
  const tyngd = (d: Sparad) => vikt(d.kropp);
  if (flygare(spec)) {
    const i = Math.max(0, flyg.findIndex((d) => d.uid === spec.uid));
    // B6.6: tre i bredd (|x| ≤ 1,2), sedan nästa rad högre upp och förskjuten – förut x = −1,4 + 1,5·i, den fjärde och
    // följande flög utanför bilden (pelikanen, ängeln)
    const rad = Math.floor(i / 3);
    return [[-1.2, 0, 1.2][i % 3]! + (rad % 2) * 0.6 - (rad % 2 ? 0.3 : 0), 1.55 + rad * 0.4, -0.85 - rad * 0.2];
  }
  const sorterad = land.slice().sort((a, b) => tyngd(b) - tyngd(a) || a.uid.localeCompare(b.uid));
  const i = Math.max(0, sorterad.findIndex((d) => d.uid === spec.uid));
  // fler än tio (platserna): spridda inom bilden med gyllene snittet, inte längre utanför kanten
  const slot = LAND_SLOT[i] ?? [-1.5 + ((i * 0.618) % 1) * 3, -0.2 + ((i * 0.382) % 1) * 1.7];
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

const _synBox = new THREE.Box3();
const _synP = new THREE.Vector3();
/** B6.6: kroppens skärmruta (CSS-px) ur världsrutan (8 hörn projicerade) och antalet synliga meshar med synligt material. */
export function synMatt(kropp: THREE.Object3D, kamera: THREE.Camera, rect: DOMRect): { x: number; y: number; w: number; h: number; mesh: number } {
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
  return { x: Math.round(rect.left + x0), y: Math.round(rect.top + y0), w: Math.round(x1 - x0), h: Math.round(y1 - y0), mesh };
}
