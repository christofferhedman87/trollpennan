// Block 4 (byggnaderna lever): djur som bor i ett bygge strövar runt sitt hem på dagen. När kvällen kommer går de
// till dörren och in (i en hage lägger de sig och sover där). På morgonen kommer de ut igen. Ren funktion av tid
// och kväll, utan tillstånd, så att den är lätt att prova och aldrig kan fastna.
import dalenJson from "../../../data/dalen.json" with { type: "json" };

export const BO = dalenJson.boende;

export type BoLage = { x: number; z: number; rotY: number; skala: number; sover: boolean; inne: boolean };

const klamp = (v: number) => Math.min(1, Math.max(0, v));
const mjuk = (u: number) => u * u * (3 - 2 * u);

/** Hur sömnig dalen är: 0 på dagen, 1 mitt i kvällen (data/dalen.json boende.somn). */
export function somnighet(natt: number): number {
  return klamp((natt - BO.somn[0]) / (BO.somn[1] - BO.somn[0]));
}

/** Djurets läge vid tid `t` (s). `i` sprider djuren, `hem` = tomtens mitt, `djup` = halva byggets djup (dörren). */
export function boLage(t: number, i: number, hem: { x: number; z: number }, hage: boolean, natt: number, djup = 0.6): BoLage {
  const s = somnighet(natt);
  const fart = BO.fart * (1 - s);
  const a = t * fart + i * 2.1;
  const r = hage ? BO.hage_radie * (0.75 + 0.25 * Math.sin(t * 0.3 + i)) : BO.runt_radie;
  const vx = hem.x + Math.cos(a) * r;
  const vz = hem.z + Math.sin(a) * r * (hage ? 1 : 0.8) + (hage ? 0 : BO.fram);
  const rotDag = Math.atan2(-Math.sin(a), Math.cos(a)) + (fart >= 0 ? 0 : Math.PI);
  if (hage) return { x: vx, z: vz, rotY: rotDag, skala: 1, sover: s > 0.6, inne: false };
  // Till dörren under första delen av skymningen, sedan in genom den.
  const ga = mjuk(klamp(s / 0.6));
  const dx = hem.x;
  const dz = hem.z + djup + 0.15;
  const x = vx + (dx - vx) * ga;
  const z = vz + (dz - vz) * ga;
  const rotY = ga > 0.05 ? Math.atan2(dx - vx, dz - vz) + Math.PI : rotDag;
  const skala = 1 - mjuk(klamp((s - 0.6) / 0.4));
  return { x, z, rotY, skala, sover: false, inne: skala < 0.02 };
}
