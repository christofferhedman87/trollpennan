/** Dalöversikten under introts första 2,4 sekunder. Ett kameraägarskap åt gången. */
import { sagaNu } from "../saga.ts";
import { useStart } from "../start.ts";

export const INTRO_FLYG_SLUT_SEK = 2.4;

export function arIntroFlygAktiv(introAktiv: boolean, tidSek: number): boolean {
  return introAktiv && tidSek >= 0 && tidSek < INTRO_FLYG_SLUT_SEK;
}

/** `FlygKameraV09` sätter `flyg` medan den ensam styr `state.camera`. */
export const kameraAgar = { flyg: false };

export type TredKamera = { x: number; y: number; z: number; t: number };

/** Startar när sagan tickar och 3D-scenen syns, inte under titel eller laddning. */
let startMs: number | null = null;

export function lasIntroKameraTid(introAktiv: boolean): number {
  const scenEjKlar = !useStart.getState().angRedo;
  if (!introAktiv || sagaNu.t <= 0 || scenEjKlar) {
    startMs = null;
    return 0;
  }
  if (startMs == null) startMs = performance.now();
  return (performance.now() - startMs) / 1000;
}

export function publiceraTredKamera(x: number, y: number, z: number, t: number): void {
  (window as unknown as { __tredKamera?: TredKamera }).__tredKamera = {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
    z: Number(z.toFixed(2)),
    t: Number(t.toFixed(2)),
  };
}
