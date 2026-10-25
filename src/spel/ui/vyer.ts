import type { ComponentType } from "react";
import type { SpelKarna } from "../styr/typer.ts";

export type VyPlatsNamn = "scen" | "over";
export type VyDef = { id: string; plats: VyPlatsNamn; syns: (k: SpelKarna) => boolean; Vy: ComponentType };
export const VYER: VyDef[] = []; // tom i S1. G1 lägger till { id: "garden3d", plats: "scen", syns: (k) => k.t.varld === "gard" && !k.t.omrade, Vy: Garden3D }
