// Kvällens styrka som ren logik (ingen React), så att KvallsLjus och scenen kan dela den.
import { MILJO } from "../miljo.ts";

/** 0..1, hur långt kvällen har kommit (klämt). */
export function kvallsGrad(natt: number): number {
  return Number.isFinite(natt) ? Math.max(0, Math.min(1, natt)) : 0;
}

/** Hur långt mot kvällsfärgerna himlen och ljuset tonas (kvall.djup stoppar före full natt). */
export function kvallsTon(natt: number): number {
  return kvallsGrad(natt) * MILJO.kvall.djup;
}

/** Ljusstyrka i förhållande till dagen: 1 på dagen, kvall.ljus_kvar vid full kväll. */
export function kvallsLjusFaktor(natt: number): number {
  return 1 - (1 - MILJO.kvall.ljus_kvar) * kvallsGrad(natt);
}
