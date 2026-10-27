import type { ComponentType } from "react";
import type { VagvisarePlatsId, VagvisareSkarmPunkt } from "../ang/Vagvisare3D.tsx";
import { Garden3D } from "../gard/Garden3D.tsx";
import type { SpelKarna } from "../styr/typer.ts";

export type VyPlatsNamn = "scen" | "over";
export type VyProps = {
  onValjPlats?: (id: VagvisarePlatsId) => void;
  onVagvisarePunkter?: (p: VagvisareSkarmPunkt[]) => void;
};
export type VyDef = {
  id: string;
  plats: VyPlatsNamn;
  syns: (k: SpelKarna) => boolean;
  Vy: ComponentType<VyProps>;
};
export const VYER: VyDef[] = [
  {
    id: "garden3d",
    plats: "scen",
    syns: (k) => k.t.varld === "gard" && !k.t.omrade && !k.t.kartaOpp,
    Vy: Garden3D,
  },
];
