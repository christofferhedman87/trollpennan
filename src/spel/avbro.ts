import type { Sparad } from "./brygga.ts";

export type AvHandelse =
  | { typ: "skylt"; id: string }
  | { typ: "vild"; id: string }
  | { typ: "skatt"; id: string }
  | { typ: "plats"; id: string };

export type AvLaget = {
  plats: string | null;
  folje: Sparad | null;
  van: string[];
  uppdrag: Record<string, "pagar" | "klar">;
  fyr: boolean;
  on: boolean;
};

type Lyssnare = (h: AvHandelse) => void;

let laget: AvLaget = { plats: null, folje: null, van: [], uppdrag: {}, fyr: false, on: false };
const lyssnare = new Set<Lyssnare>();
const andra = new Set<() => void>();

export const avBro = {
  hamta: () => laget,
  satt(n: AvLaget) {
    laget = n;
    for (const f of andra) f();
  },
  andra(f: () => void) {
    andra.add(f);
    return () => andra.delete(f);
  },
  lyssna(f: Lyssnare) {
    lyssnare.add(f);
    return () => lyssnare.delete(f);
  },
  skicka(h: AvHandelse) {
    for (const f of lyssnare) f(h);
  },
};
