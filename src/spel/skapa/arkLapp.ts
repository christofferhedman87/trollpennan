// Nya Skapa 6.9: vilken lapp Pennans bok öppnas med när den inte kommer från en önskan eller gåva
// (Uppdrag → Svara med pennan, tryck på en ledig tomt). Stängs boken försvinner lappen.
import { create } from "zustand";

export type ArkLapp = "uppdrag" | "tomt" | null;
export const useArkLapp = create<{ lapp: ArkLapp; satt: (l: ArkLapp) => void }>((set) => ({ lapp: null, satt: (lapp) => set({ lapp }) }));
