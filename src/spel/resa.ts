// B1.4: ren logik för resa mellan platser (ingen React). Barnet skriver platsnamn eller trycker på kartan/grinden.
import { PLATSER, START_PLATS, mattUr, upplast, type Plats } from "./platser.ts";
import type { Sparad } from "./brygga.ts";

export const FEL_RESA = "Inte riktigt än";

/** "skogen", "till skogen", "gå till sjön", "grottan" → id, annars null. */
export function platsFranText(raw: string, platser: Plats[] = PLATSER): string | null {
  const t = raw.trim().toLowerCase().replace(/[!?.]+$/g, "");
  if (!t) return null;
  const kandidater = [...platser].sort((a, b) => b.namn.length - a.namn.length);
  for (const p of kandidater) {
    const namn = p.namn.toLowerCase();
    if (t === namn || t === p.id) return p.id;
    if (t === `till ${namn}` || t === `till ${p.id}` || t === `gå till ${namn}` || t === `ga till ${namn}`) return p.id;
    if (t === `hem` && p.id === START_PLATS) return START_PLATS;
    if ((t === "ängen" || t === "angen" || t === "hem till ängen") && p.id === START_PLATS) return START_PLATS;
  }
  return null;
}

/** Första upplåsta plats som inte är ängen (ordning). */
export function forstaUpplasta(m: ReturnType<typeof mattUr>, platser: Plats[] = PLATSER): string | null {
  for (const p of [...platser].sort((a, b) => a.ordning - b.ordning)) {
    if (p.id === START_PLATS) continue;
    if (upplast(p.id, m, platser)) return p.id;
  }
  return null;
}

/** Finns det någon ny (upplåst men ej besökt) plats? */
export function nyPlatsVantar(m: ReturnType<typeof mattUr>, oppnade: string[], platser: Plats[] = PLATSER): boolean {
  return platser.some((p) => p.id !== START_PLATS && upplast(p.id, m, platser) && !oppnade.includes(p.id));
}

export type MinnePlats = {
  plats: string;
  ang: Sparad[];
  sovande: Sparad[];
  platsSkapelser: Record<string, Sparad[]>;
  oppnadePlatser: string[];
  uppdrag: Record<string, "pagar" | "klar">;
  seddaIntro: string[];
  bytPlats: (id: string) => boolean;
  markeraIntro: (id: string) => void;
};
