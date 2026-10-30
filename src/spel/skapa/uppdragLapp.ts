// Nya Skapa 6.13: det aktiva uppdraget (lappen i Pennans bok och Uppdragsarket visar samma).
import { ALLA_UPPDRAG, type Uppdrag } from "../aventyr.ts";
import { aktivtSkrivUppdrag } from "../uppdragsmotor.ts";
import { platsNu } from "../ui/useBengtsson.ts";

export const BENGTSSON_BILD = "/npc/bengtsson/glad.webp";

export function aktivtUppdrag(spar: Record<string, "pagar" | "klar">): Uppdrag | undefined {
  return aktivtSkrivUppdrag(spar, platsNu()) ?? ALLA_UPPDRAG.find((u) => spar[u.id] === "pagar");
}
