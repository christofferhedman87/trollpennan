import * as THREE from "three";
import gard3d from "../../../data/gard-3d.json" with { type: "json" };
import type { SparatBygge } from "../bygge.ts";
import {
  GARD_BREDD,
  GARD_DJUP,
  arKantBygge,
  kantNyckel,
  xyTillKant,
  type KantPlats,
} from "./rutnat.ts";

export type ByggRad = (typeof gard3d.byggnader)[keyof typeof gard3d.byggnader];
export type ReservSlag = "hus" | "torn" | "damm" | "trad" | "lek" | "bro";

const TABELL = new Map<string, ByggRad>(Object.entries(gard3d.byggnader));
const BOX = new THREE.Box3();
const STORLEK = new THREE.Vector3();
const PROJ = new THREE.Vector3();

export function byggRad(id: string): ByggRad | undefined {
  return TABELL.get(id);
}

export function arReserv(v: string): v is ReservSlag {
  switch (v) {
    case "hus":
    case "torn":
    case "damm":
    case "trad":
    case "lek":
    case "bro":
      return true;
    default:
      return false;
  }
}

export function staketFil(b: Pick<SparatBygge, "bygg" | "delar">): string {
  const grind = b.bygg === "port" || b.delar.some((d) => d.id === "dörr");
  return grind ? gard3d.staket.grindFil : gard3d.staket.enkelFil;
}

/** Kanter som hör till ett bygge, samma varv som `kanterForByggen` men utan global avdubbling. */
export function kanterForEtt(b: Pick<SparatBygge, "bygg" | "x" | "y" | "antal">): KantPlats[] {
  if (!arKantBygge(b.bygg)) return [];
  const k0 = xyTillKant(b.x, b.y);
  const ut: KantPlats[] = [k0];
  const antal = b.antal ?? 1;
  if (antal <= 1) return ut;
  const cx = Math.min(k0.gx, GARD_BREDD - 1);
  const cz = Math.min(k0.gz, GARD_DJUP - 1);
  const runt: KantPlats[] = [
    { gx: cx, gz: cz, kant: "N" },
    { gx: cx + 1, gz: cz, kant: "W" },
    { gx: cx, gz: cz + 1, kant: "N" },
    { gx: cx, gz: cz, kant: "W" },
  ];
  const sedda = new Set<string>([kantNyckel(k0)]);
  for (const k of runt) {
    if (ut.length >= antal) break;
    const ny = kantNyckel(k);
    if (sedda.has(ny)) continue;
    sedda.add(ny);
    ut.push(k);
  }
  return ut;
}

function harFarg(m: THREE.Material): m is THREE.Material & { color: THREE.Color } {
  return "color" in m && m.color instanceof THREE.Color;
}

function harMetall(m: THREE.Material): m is THREE.Material & { metalness: number } {
  return "metalness" in m && typeof m.metalness === "number";
}

function harYta(m: THREE.Material): m is THREE.Material & { roughness: number } {
  return "roughness" in m && typeof m.roughness === "number";
}

const FONSTER_NODER = ["Window_1", "Window_2", "Window_3", "Window_Side"] as const;
const TALT_DUK_MAT = new Set(["colorred", "fabric", "cloth", "canvas", "tent"]);

function arVaggNamn(namn: string): boolean {
  return /^(walls|vagg|vägg|plaster|lightred|darkred|wood|body)$/i.test(namn);
}

function arTaltDuk(namn: string): boolean {
  return TALT_DUK_MAT.has(namn.toLowerCase());
}

function arTakNamn(namn: string): boolean {
  return /^(roof|rooftiles|roofblack|tak)$/i.test(namn);
}

function arOrordNamn(namn: string): boolean {
  return /^(trim|windows|door|foundation|greenery)$/i.test(namn);
}

function matLista(o: THREE.Mesh): THREE.Material[] {
  return Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
}

function fonsterTal(fonsterAntal: number | null | undefined): number {
  if (fonsterAntal === null || fonsterAntal === undefined) return 3;
  return Math.max(0, Math.min(4, Math.round(fonsterAntal)));
}

/** Egen materialkopia. `Walls` får ren väggfärg, `Roof` får takfärg, fönsternoder styrs av antal. */
export function egnaMaterial(
  rot: THREE.Object3D,
  fargHex: string | null,
  takFargHex: string | null = null,
  fonsterAntal: number | null = 3,
): void {
  const fonster = fonsterTal(fonsterAntal);
  let harWalls = false;
  rot.traverse((o) => {
    const nod = FONSTER_NODER.indexOf(o.name as (typeof FONSTER_NODER)[number]);
    if (nod >= 0) o.visible = fonster >= nod + 1;
    if (!(o instanceof THREE.Mesh)) return;
    for (const m of matLista(o)) {
      if (arVaggNamn(m.name) || arVaggNamn(o.name)) harWalls = true;
    }
  });
  rot.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || !o.material) return;
    const lista = matLista(o);
    const nya = lista.map((m, idx) => {
      const k = m.clone();
      k.name = m.name;
      k.userData = { ...m.userData, egenKopia: true };
      const namn = k.name || o.name;
      if (harFarg(k)) {
        if (fargHex && (arVaggNamn(namn) || arTaltDuk(namn) || arTaltDuk(k.name) || arTaltDuk(o.name))) k.color.set(fargHex);
        else if (takFargHex && arTakNamn(namn)) k.color.set(takFargHex);
        else if (fargHex && !harWalls && idx === 0 && !arTakNamn(namn) && !arOrordNamn(namn)) k.color.set(fargHex);
      }
      if (harMetall(k)) k.metalness = Math.min(k.metalness, 0.15);
      if (harYta(k)) k.roughness = Math.max(k.roughness, 0.65);
      return k;
    });
    const forsta = nya[0];
    if (!forsta) return;
    o.material = Array.isArray(o.material) ? nya : forsta;
  });
}

export function inspekteraHus3D(rot: THREE.Object3D): {
  wallsColorHex: string | null;
  roofColorHex: string | null;
  synligaFonsterNoder: string[];
} {
  let wallsColorHex: string | null = null;
  let roofColorHex: string | null = null;
  const synliga = new Set<string>();
  rot.traverse((o) => {
    if ((FONSTER_NODER as readonly string[]).includes(o.name) && o.visible) synliga.add(o.name);
    if (!(o instanceof THREE.Mesh)) return;
    for (const m of matLista(o)) {
      if (!harFarg(m)) continue;
      const hex = "#" + m.color.getHexString();
      const namn = m.name || o.name;
      if (arVaggNamn(namn)) wallsColorHex = hex;
      if (arTakNamn(namn)) roofColorHex = hex;
    }
  });
  return {
    wallsColorHex,
    roofColorHex,
    synligaFonsterNoder: FONSTER_NODER.filter((n) => synliga.has(n)),
  };
}

export function slappMaterial(rot: THREE.Object3D): void {
  rot.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || !o.material) return;
    const lista = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of lista) if (m.userData.egenKopia === true) m.dispose();
  });
}

/** Höjd `malhojd * skala`, bredd högst `maxBredd`, botten på y=0, centrerad i XZ. */
export function passaByggnad(rot: THREE.Object3D, malhojd: number, maxBredd = 1.75, skala = 1): void {
  rot.scale.setScalar(1);
  rot.position.set(0, 0, 0);
  rot.updateMatrixWorld(true);
  BOX.setFromObject(rot);
  if (BOX.isEmpty()) return;
  BOX.getSize(STORLEK);
  const h = Math.max(STORLEK.y, 1e-4);
  const w = Math.max(STORLEK.x, 1e-4);
  const d = Math.max(STORLEK.z, 1e-4);
  const s = Math.min((malhojd * skala) / h, (maxBredd * Math.max(1, skala * 0.88)) / Math.max(w, d));
  rot.scale.setScalar(s);
  rot.updateMatrixWorld(true);
  BOX.setFromObject(rot);
  const cx = (BOX.min.x + BOX.max.x) / 2;
  const cz = (BOX.min.z + BOX.max.z) / 2;
  rot.position.set(-cx, -BOX.min.y, -cz);
  rot.updateMatrixWorld(true);
}

export function skuggaUtanTraff(rot: THREE.Object3D, klickbar = false): void {
  rot.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    o.castShadow = true;
    o.receiveShadow = true;
    if (!klickbar) o.raycast = () => undefined;
  });
}

/** NDC till 0–1, klämd så menyn inte hamnar i skärmkanten. */
export function skarmPunkt(
  x: number,
  y: number,
  z: number,
  camera: THREE.Camera,
): { x: number; y: number } {
  PROJ.set(x, y, z).project(camera);
  return {
    x: Math.min(0.92, Math.max(0.08, (PROJ.x + 1) * 0.5)),
    y: Math.min(0.92, Math.max(0.08, (1 - PROJ.y) * 0.5)),
  };
}

/** Mitt på staketbiten. Modellen sitter kvar på lokal z = -0.5. */
export function kantMitt(
  wx: number,
  wz: number,
  rotY: number,
  y: number,
): [number, number, number] {
  return [wx + Math.sin(rotY) * -0.5, y, wz + Math.cos(rotY) * -0.5];
}
