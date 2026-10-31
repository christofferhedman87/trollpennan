// Nya Skapa 6.11: kvittot efter Trolla. Ersätter bannrarna "Klart! …", "+1 stjärna!" och guldordsbannern, som
// tystas medan meningen trollas fram (kvittot visar samma sak, med guldorden understrukna).
import { create } from "zustand";

export type KvittoOrd = { t: string; guld: boolean };
export type Kvitto = { id: number; ord: KvittoOrd[]; stj: number; guld: number; tack: string | null; tillagg?: boolean };
export type UppdragsSvar = { id: string; resultat: "klar" | "fel"; nastan: string | null };
export type OnskeMiss = { id: string; uid: string; nastan: string };

/** T-32: kvittots guldord är exakt de guldmarkerade orden i meningen, så att siffran och orden alltid stämmer. */
export function kvittoGuldord(ord: readonly KvittoOrd[]): string[] {
  return ord.filter((o) => o.guld).map((o) => o.t);
}

export const useKvitto = create<{ kvitto: Kvitto | null; satt: (k: Kvitto | null) => void }>((set) => ({
  kvitto: null,
  satt: (k) => set({ kvitto: k }),
}));

let tyst = false;
let uppdragsSvar: UppdragsSvar | null = null;
let onskeMiss: OnskeMiss | null = null;
export function tystaBannrar(pa: boolean): void {
  if (pa) { uppdragsSvar = null; onskeMiss = null; }
  tyst = pa;
}
export function skaparKvitto(): boolean { return tyst; }
export function noteraUppdragsSvar(svar: UppdragsSvar): void { if (tyst) uppdragsSvar = svar; }
export function hamtaUppdragsSvar(): UppdragsSvar | null { return uppdragsSvar; }
export function noteraOnskeMiss(svar: OnskeMiss): void { if (tyst) onskeMiss = svar; }
export function hamtaOnskeMiss(): OnskeMiss | null { return onskeMiss; }
const TYSTA = new Set(["stjarnor", "guldord"]);
/** Ska bannern tystas för att kvittot visar samma sak? */
export function kvittoTyst(kalla: string, text: string): boolean {
  return tyst && (TYSTA.has(kalla) || text.startsWith("Klart!"));
}
