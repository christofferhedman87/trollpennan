// Testdiagnostik för gårdens byggen och djur (window.__gard3d). Fanns i Garden3D.tsx, som togs bort i block 9
// (En värld): Gården ritas i Hemdalen. ByggModell och GardDjur fyller den fortfarande om ett prov satt den.
import type { CellPlats, KantPlats, SlutenHage } from "./rutnat.ts";
import type { GardDjurSnap } from "./vandra.ts";

export type Gard3dDiag = {
  aktiv: boolean;
  celler: { bredd: number; djup: number };
  byggen: {
    uid: string;
    bygg: string;
    cell: CellPlats | null;
    kant: KantPlats | null;
    modellFil: string | null;
    fargHex: string | null;
    takFargHex: string | null;
    wallsColorHex: string;
    roofColorHex: string;
    fonsterAntal: number;
    synligaFonsterNoder: string[];
    storlekId: "liten" | "stor" | null;
    formel: string;
    reservAktiv?: boolean;
    skarmBox?: { x: number; y: number; width: number; height: number };
  }[];
  kanter: KantPlats[];
  hagar: SlutenHage[];
  djur: GardDjurSnap[];
};

declare global {
  interface Window {
    __gard3d?: Gard3dDiag;
  }
}
