// B1.3b: ord → entitet för platsens startobjekt. Samma uppslag som när barnet skriver ordet:
// ordFranForm (ord.json + föremål härledda ur entiteter.json) → del.kropp → modell i tillgangar.json.
// Ren logik utan three, testas i Node.
import { ordFranForm } from "../tolk/lexikon.ts";
import { modellUrl } from "./entiteter.ts";
import { tillVarld, type Plats, type Zon } from "./platser.ts";

/** "träd" → "trad", "björk" → "bjork". null om ordet är okänt eller saknar modell. */
export function entitetForOrd(ord: string): string | null {
  const kropp = ordFranForm(ord.trim().toLowerCase())?.del?.kropp;
  return kropp && modellUrl(kropp) ? kropp : null;
}

export type DekorSak = { ord: string; kropp: string; pos: [number, number, number]; skala: number };
export type Vattenyta = { id: string; mitt: [number, number, number]; storlek: [number, number] };

/** Höjd för zoner som inte står på marken. */
const ZON_HOJD: Record<string, number> = { luft: 3.4, tak: 3.6 };

/** Platsens startobjekt som entiteter i världen. Ord utan modell kommer i `saknas`. */
export function dekorFor(p: Plats | undefined): { saker: DekorSak[]; saknas: string[] } {
  const saker: DekorSak[] = [];
  const saknas: string[] = [];
  for (const s of p?.start ?? []) {
    const kropp = entitetForOrd(s.ord);
    if (!kropp) {
      saknas.push(s.ord);
      continue;
    }
    const [wx, wz] = tillVarld(s.x, s.y);
    saker.push({ ord: s.ord, kropp, pos: [wx, ZON_HOJD[s.zon ?? ""] ?? 0, wz], skala: s.skala ?? 1 });
  }
  return { saker, saknas };
}

/** Zoner med typ "vattenyta" som rektanglar i världen (rekt = [x0, y0, x1, y1] i 0–1). */
export function vattenytor(p: Plats | undefined): Vattenyta[] {
  return (p?.zoner ?? [])
    .filter((z: Zon) => z.typ === "vattenyta")
    .map((z) => {
      const [x0, y0, x1, y1] = z.rekt;
      const [ax, az] = tillVarld(x0, y0);
      const [bx, bz] = tillVarld(x1, y1);
      return { id: z.id, mitt: [(ax + bx) / 2, 0.03, (az + bz) / 2], storlek: [Math.abs(bx - ax), Math.abs(bz - az)] };
    });
}
