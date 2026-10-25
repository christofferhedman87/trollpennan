import type { ComponentType } from "react";
import { Garden3D } from "../gard/Garden3D.tsx";
import type { SpelKarna } from "../styr/typer.ts";

export type VyPlatsNamn = "scen" | "over";
export type VyDef = {
  id: string;
  plats: VyPlatsNamn;
  syns: (k: SpelKarna) => boolean;
  Vy: ComponentType;
};
export const VYER: VyDef[] = [
  {
    id: "garden3d",
    plats: "scen",
    syns: (k) => k.t.varld === "gard" && !k.t.omrade && !k.t.kartaOpp,
    Vy: Garden3D,
  },
];
