// B1.3a: platserna som data (data/platser.json). Ren logik, ingen React, ingen Zustand.
// En ny plats är en datarad; upplåsning och milstolpe är villkor i datan, aldrig kod per plats.
import platserJson from "../../data/platser.json" with { type: "json" };
import { SKRIV } from "./aventyr.ts";
import type { Sparad } from "./brygga.ts";

export type Villkor = { typ: "skapelser" | "uppdrag_klara"; omrade: string; min: number };
export type Villkorsgrupp = { nagon: Villkor[] };
export type Milstolpe = Villkorsgrupp & { final?: string | null; las_upp?: string | null };
export type Zon = { id: string; typ: string; rekt: [number, number, number, number] };
export type Startobjekt = { ord: string; x: number; y: number; skala?: number; zon?: string };
export type Plats = {
  id: string;
  namn: string;
  ordning: number;
  tema?: string;
  upplasning: Villkorsgrupp;
  milstolpe: Milstolpe | null;
  miljo: Record<string, unknown>;
  zoner: Zon[];
  start: Startobjekt[];
  ljud?: unknown;
  intro?: unknown;
  final_fore?: unknown;
  hemliga?: string[];
  uppdrag: string[];
};
export type PlatsData = { version: number; yta: { x: [number, number]; z: [number, number] }; platser: Plats[]; beloningar: unknown[] };
/** Det som villkoren mäts mot. */
export type Matt = { skapelser: Record<string, number>; klara: Record<string, number>; oppnade?: string[] };

export const PLATSDATA = platserJson as unknown as PlatsData;
export const PLATSER: Plats[] = [...PLATSDATA.platser].sort((a, b) => a.ordning - b.ordning);
export const START_PLATS = "ang";
export const TAK_PER_PLATS = 10;

export function platsMed(id: string, platser: Plats[] = PLATSER): Plats | undefined {
  return platser.find((p) => p.id === id);
}

export function villkorNatt(v: Villkor, m: Matt): boolean {
  const n = v.typ === "skapelser" ? m.skapelser[v.omrade] ?? 0 : m.klara[v.omrade] ?? 0;
  return n >= v.min;
}

function nagonNadd(g: Villkorsgrupp | null | undefined, m: Matt): boolean {
  return !!g && g.nagon.some((v) => villkorNatt(v, m));
}

/** Ängen är alltid öppen. En plats som en gång öppnats förblir öppen. Annars räcker ett villkor ur `nagon`. */
export function upplast(id: string, m: Matt, platser: Plats[] = PLATSER): boolean {
  if (id === START_PLATS) return true;
  const p = platsMed(id, platser);
  if (!p) return false;
  if (m.oppnade?.includes(id)) return true;
  return nagonNadd(p.upplasning, m);
}

/** Får platsens final erbjudas? */
export function milstolpeNadd(id: string, m: Matt, platser: Plats[] = PLATSER): boolean {
  return nagonNadd(platsMed(id, platser)?.milstolpe, m);
}

/** Klara skriv-uppdrag per `omrade`, utan finaler. */
export function klaraPerPlats(status: Record<string, "pagar" | "klar">, uppdrag: { id: string; omrade: string; final?: boolean }[] = SKRIV): Record<string, number> {
  const ut: Record<string, number> = {};
  for (const u of uppdrag) if (status[u.id] === "klar" && !u.final) ut[u.omrade] = (ut[u.omrade] ?? 0) + 1;
  return ut;
}

/** Måtten ur sparningen. Ängens skapelser = djur på ängen + sovande (de har skapats där). */
export function mattUr(d: { ang: Sparad[]; sovande: Sparad[]; platsSkapelser: Record<string, Sparad[]>; oppnadePlatser: string[]; uppdrag: Record<string, "pagar" | "klar"> }): Matt {
  const skapelser: Record<string, number> = { [START_PLATS]: d.ang.length + d.sovande.length };
  for (const [id, lista] of Object.entries(d.platsSkapelser)) if (id !== START_PLATS) skapelser[id] = lista.length;
  return { skapelser, klara: klaraPerPlats(d.uppdrag), oppnade: d.oppnadePlatser };
}

/** Platsens yta (x 0–1 vänster→höger, y 0–1 bak→fram) → världskoordinater [wx, wz]. */
export function tillVarld(x: number, y: number, yta: PlatsData["yta"] = PLATSDATA.yta): [number, number] {
  const [x0, x1] = yta.x;
  const [z0, z1] = yta.z;
  return [x0 + (x1 - x0) * x, z0 + (z1 - z0) * y];
}

/** Lägg nya skapelser på en lista med tak; de äldsta somnar (samma regel som ängen). Ren, för minne.ts. */
export function laggMedTak(lista: Sparad[], sovande: Sparad[], nya: Sparad[], tak = TAK_PER_PLATS): { lista: Sparad[]; sovande: Sparad[]; somnade: Sparad[] } {
  let l = [...lista];
  let s = [...sovande];
  const somnade: Sparad[] = [];
  for (const n of nya) {
    while (l.length >= tak) {
      const old = l.shift();
      if (!old) break;
      s = [...s, old].slice(-40);
      somnade.push(old);
    }
    l = [...l, n];
  }
  return { lista: l, sovande: s, somnade };
}
