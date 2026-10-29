import { bestamdBygg, fargHexFor, type ByggeTolk } from "../tolk/byggtolk.ts";
import type { ByggForm } from "../tolk/byggform.ts";

export type ByggDelSpar = {
  id: string;
  antal: number;
  fargHex: string | null;
  material: string | null;
};

export type SparatBygge = {
  uid: string;
  bygg: string;
  formel: string;
  ord: string;
  antal: number;
  fargId: string | null;
  fargHex: string | null;
  monster: string | null;
  material: string | null;
  delar: ByggDelSpar[];
  storlekId?: "liten" | "stor" | null;
  /** Block 2 (En värld): hur byggnaden ser ut ("som ser ut som ett slott") och vad den gör (flygande, lysande …). */
  form?: ByggForm | null;
  egenskaper?: string[];
  x: number;
  y: number;
  boende: string[];
};

export function franTolk(b: ByggeTolk & { form?: ByggForm | null; egenskaper?: string[] }, formel: string, x: number, y: number): SparatBygge {
  const farg = b.adj.find((a) => a.klass === "farg");
  const monster = b.adj.find((a) => a.klass === "monster");
  const sid = b.adj.find((a) => a.klass === "storlek")?.id;
  const storlekId = sid === "liten" || sid === "stor" ? sid : null;
  return {
    uid: crypto.randomUUID(),
    bygg: b.bygg,
    formel,
    ord: b.ord,
    antal: b.antal,
    fargId: farg?.id ?? null,
    fargHex: fargHexFor(farg?.id ?? null),
    monster: monster?.id ?? null,
    material: b.material,
    delar: b.delar.map((d) => ({
      id: d.del,
      antal: d.antal,
      fargHex: fargHexFor(d.adj.find((a) => a.klass === "farg")?.id ?? null),
      material: d.material,
    })),
    storlekId,
    form: b.form ?? null,
    egenskaper: b.egenskaper ?? [],
    x,
    y,
    boende: [],
  };
}

export function takFargForBygge(b: Pick<SparatBygge, "delar">): string | null {
  return b.delar.find((d) => d.id === "tak")?.fargHex ?? null;
}

export function fonsterAntalForBygge(b: Pick<SparatBygge, "delar">): number {
  const d = b.delar.find((x) => x.id === "fönster");
  return d ? d.antal : 3;
}

export function bestamdHem(b: SparatBygge): string {
  return bestamdBygg({
    bygg: b.bygg,
    ord: b.ord,
    material: b.material,
    adj: [
      ...(b.fargId ? [{ klass: "farg", id: b.fargId }] : []),
      ...(b.monster ? [{ klass: "monster", id: b.monster }] : []),
    ],
  });
}

/** Första bygget nära mitten, sedan den ruta som ligger längst från de som redan står. */
export function ledigPlats(finns: { x: number; y: number }[]): { x: number; y: number } {
  const kand: { x: number; y: number }[] = [];
  for (let rad = 0; rad < 4; rad++) {
    for (let kol = 0; kol < 3; kol++) {
      kand.push({ x: 0.22 + kol * 0.28, y: 0.42 + rad * 0.15 });
    }
  }
  if (!finns.length) return { x: 0.5, y: 0.58 };
  let bast = kand[0]!;
  let bastS = -1;
  for (const p of kand) {
    const s = Math.min(...finns.map((f) => Math.hypot((f.x - p.x) * 750, (f.y - p.y) * 900)));
    if (s > bastS) {
      bast = p;
      bastS = s;
    }
  }
  return bast;
}
