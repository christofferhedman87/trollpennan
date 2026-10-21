// P3: den nyaste skapelsen (kamerafokus i fokus.tsx, data/miljo.json `landning.fokus`) och saken bredvid ett djur. Var den
// nya står avgör placeringsregeln (placering.ts: den främsta lediga rutan).
import type { Sparad } from "./brygga.ts";
import { MILJO } from "./miljo.ts";

export const LANDNING = MILJO.landning;

/** Den senast skapade (störst `skapad`, vid lika det största uid) – den som landar framme. */
export function nyast<T extends Pick<Sparad, "uid" | "skapad">>(rad: T[]): T | undefined {
  let b: T | undefined;
  for (const d of rad) if (!b || d.skapad > b.skapad || (d.skapad === b.skapad && d.uid > b.uid)) b = d;
  return b;
}



/**
 * P3: var en sak bredvid ett djur står ("en kanin med en hink"), relativt djuret. Förut alltid höger/vänster om djuret,
 * så saken kunde hamna i dammen. Nu prövas sidan, andra sidan och framför; den första där sakens fot är torr vinner.
 * `torr(wx, wz)` = platsens regel (platsYta torrKropp med sakens kant); saknas den gäller första förslaget.
 */
export function sakLage(x: number, z: number, onskad: [number, number], torr?: (wx: number, wz: number) => boolean): [number, number] {
  const [dx, dz] = onskad;
  const forslag: [number, number][] = [[dx, dz], [-dx, dz], [dx * 0.4, dz + 0.55], [-dx * 0.4, dz + 0.55], [dx, dz + 0.6], [-dx, dz + 0.6]];
  if (!torr) return forslag[0]!;
  return forslag.find(([ox, oz]) => torr(x + ox, z + oz)) ?? forslag[0]!;
}

