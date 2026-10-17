/** Delat läge för introt. Uppdateras av Intro, läses i 3D-loopen. Ingen setState per bildruta. */
export const sagaNu = {
  aktiv: false,
  t: 0,
  fas: 0,
  ord: 0,
  ordklar: false,
};

/** Mörker under sagan. null = vanlig dag/kväll. */
export function sagaNatt(verklig: number): number | null {
  if (!sagaNu.aktiv) return null;
  const t = sagaNu.t;
  if (t < 9.35) return 0.88;
  if (t < 12.25) {
    const u = Math.min(1, (t - 9.35) / 2.4);
    return 0.88 + (0.32 - 0.88) * u;
  }
  const u = Math.min(1, (t - 12.25) / 1.7);
  return 0.32 + (verklig - 0.32) * u;
}
