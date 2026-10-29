import type { ComponentType } from "react";
import type { VagvisarePlatsId, VagvisareSkarmPunkt } from "../ang/Vagvisare3D.tsx";
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
// Block 9 (En värld): Gårdens egen 3D-vy är borta – Gården finns i Hemdalen på ängen (src/spel/dal/).
export const VYER: VyDef[] = [];
