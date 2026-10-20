import type { ForslagKort, Ord } from "@/tolk/typer.ts";
import type { Sparad } from "../brygga.ts";

export type Slot = "djur" | "farg" | "storlek" | "monster" | "formaga" | "tillbehor";
export type Val = Partial<Record<Slot, Ord>>;
export type Banner = { id: number; text: string; slag: "okand" | "sparr" | "ovr" | "sov"; ms?: number; tryck?: boolean };
export type Bubbla = { id: number; text: string; x: number; y: number; hjarta: boolean; ovan?: boolean };
export type Forslag = { token: string; text: string; forslag: ForslagKort[] };
export type VisKort = { slag: "djur"; spec: Sparad } | { slag: "bygg"; formel: string } | null;
export type Varld = "ang" | "gard";
export type KopFraga = { slag: "djur" | "bygg"; id: string; titel: string; pris: number };

export type SidaDjur = { id: string; titel: string; ord: string[]; prova: string[]; oppnas: string };
export type SidaBygg = {
  id: string;
  titel: string;
  kostnad: number;
  beskrivning: string;
  exempel: string;
  ord: string[];
  material: string[];
};
export type Led = { gata: string; forsta: string; langd: number };
