// Block 4b: var en ny skapelse skulle hamna på en utflykt (Skogen, Sjön, Grottan). Samma beslut som det verkliga skapandet
// (`laggPaAngSpar`: tak per plats och sövning av den äldsta) och samma placeringsregel (`placera`), men utan att något
// i minnet ändras: indata kopieras och ingenting skrivs. Ängen räknas i `forhandTolk.ts` som förut.
import type { Varelse } from "../../tolk/typer.ts";
import type { Sparad } from "../brygga.ts";
import { laggPaAngSpar } from "../minneSparning.ts";
import { placera } from "../placering.ts";
import type { Plats } from "../platser.ts";

/** Samma uid och "nyast"-stämpel som ängens hologram (forhandTolk.djurRing), så att placeringen ser den som den nyaste. */
export const HOLO_UID = "forhand";

export type PlatsForhand = {
  /** Det som ritas som hologram (djurets egna värden, uid HOLO_UID). */
  spec: Sparad;
  /** Ringen på marken (världskoordinater) under skapelsens läge. Radie som på ängen. */
  ring: { x: number; z: number; r: number };
  /** Höjd över marken som regeln ger: 0 på marken, ca 0,16 på vattnet, 1,6–2,4 i luften. */
  y: number;
  /** Hur mycket mindre den ritas om det är trångt eller den inte ryms (1 = full storlek). */
  krymp: number;
  roll: string;
  /** uid för de äldre skapelser som skulle somna för att göra plats (tak eller trångt). */
  somnar: string[];
};

/**
 * `lista` = platsens nuvarande skapelser, `sovande` = de som redan sover. Ingen av dem ändras.
 * Ger null om platsen saknas eller regeln inte kan placera skapelsen.
 */
export function platsForhand(plats: Plats | undefined, v: Varelse, lista: readonly Sparad[], sovande: readonly Sparad[]): PlatsForhand | null {
  if (!plats) return null;
  const { patch, resultat } = laggPaAngSpar({ plats: plats.id, platsSkapelser: { [plats.id]: [...lista] }, sovande: [...sovande], ang: [] }, v, 1);
  const ny = resultat.nya[0];
  const slut = patch.platsSkapelser?.[plats.id];
  if (!ny || !slut) return null;
  const spec: Sparad = { ...ny, uid: HOLO_UID, skapad: Number.MAX_SAFE_INTEGER };
  const l = placera(slut.map((d) => (d.uid === ny.uid ? spec : d)), plats).get(HOLO_UID);
  if (!l) return null;
  return {
    spec,
    ring: { x: l.x, z: l.z, r: 0.8 * Math.max(0.8, Math.min(1.5, v.skala || 1)) },
    y: l.y,
    krymp: l.krymp ?? 1,
    roll: l.roll,
    somnar: resultat.somnade.map((d) => d.uid),
  };
}
