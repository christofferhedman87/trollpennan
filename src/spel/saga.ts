/** Delat läge för introt. Uppdateras av Intro, läses i 3D-loopen. Ingen setState per bildruta. */
export const sagaNu = {
  aktiv: false,
  t: 0,
  fas: 0,
  ord: 0,
  ordklar: false,
};

/** Mörker under sagan. 0 = varmt dagsljus redan från ruta 1. null = vanlig dag/kväll. */
export function sagaNatt(_verklig: number): number | null {
  if (!sagaNu.aktiv) return null;
  return 0;
}
