// Block 1 (En värld): tomterna i Hemdalen. Ren logik utan React/three: vilken tomt varje bygge står på.
// Byggen med giltig, unik tomt behåller den; äldre byggen (från Gårdens rutnät) får lediga tomter i fyllordning,
// så att inget barnet byggt försvinner när Gården flyttar in på ängen.
import dalenJson from "../../../data/dalen.json" with { type: "json" };

export type Tomt = { x: number; z: number };
export const DALEN = dalenJson;
export const TOMTER: readonly Tomt[] = dalenJson.tomter;

type MedTomt = { uid: string; tomt?: number | null };

const giltig = (t: number | null | undefined): t is number => typeof t === "number" && Number.isInteger(t) && t >= 0 && t < TOMTER.length;

/** uid → tomtindex för alla byggen (högst en per tomt). Byggen utan plats när alla tomter är tagna saknas i kartan. */
export function tomtKarta(byggen: readonly MedTomt[]): Map<string, number> {
  const karta = new Map<string, number>();
  const tagna = new Set<number>();
  for (const b of byggen) {
    if (giltig(b.tomt) && !tagna.has(b.tomt)) {
      karta.set(b.uid, b.tomt);
      tagna.add(b.tomt);
    }
  }
  for (const b of byggen) {
    if (karta.has(b.uid)) continue;
    const ledig = TOMTER.findIndex((_, i) => !tagna.has(i));
    if (ledig < 0) break;
    karta.set(b.uid, ledig);
    tagna.add(ledig);
  }
  return karta;
}

/** Första lediga tomt (eller `onskad` om den är ledig), annars null. */
export function ledigTomt(byggen: readonly MedTomt[], onskad: number | null = null): number | null {
  const tagna = new Set(tomtKarta(byggen).values());
  if (giltig(onskad) && !tagna.has(onskad)) return onskad;
  const i = TOMTER.findIndex((_, k) => !tagna.has(k));
  return i < 0 ? null : i;
}

/** Är (x, z) för nära en tomt för att natur (träd, buskar) ska stå där? */
export function naraTomt(x: number, z: number, marginal: number = DALEN.tomt.fri_natur): boolean {
  return TOMTER.some((t) => Math.hypot(t.x - x, t.z - z) < marginal);
}

/** Kamerans mål hålls inom dalen. */
export function klampaMal(x: number, z: number): [number, number] {
  const k = DALEN.kamera;
  return [Math.min(k.x[1], Math.max(k.x[0], x)), Math.min(k.z[1], Math.max(k.z[0], z))];
}
