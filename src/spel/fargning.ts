// B6.4: vad en GLB-kropp får för färg. Rotorsaken till att jultomten blev orange, brandhjälmen laxrosa, narvalen blek och
// krakens lila lavendel utan färgord: varje ny varelse med ett guldord (första gången ordet skrivs) får glans, och glansen
// lades som ett varmgult självlyse (#FFE082) över HELA kroppen på alla modeller med palett eller farg-material – också när
// barnet inte skrivit något färgord. Dessutom fick ett "ljus"-material en fast gul nyans (#ffd27a) utan färgord.
// Nu: utan färgord rörs modellens material inte alls (egna färger). Med färgord gäller samma som förut (R9C är pausad).
export type Fargning = {
  /** Ny materialfärg, eller null = materialets egen. */
  farg: string | null;
  /** Byt texturens palett mot färgordets nyans. */
  palettByte: boolean;
  /** Lägg glansens självlyse på materialet. */
  glans: boolean;
};

/** hex = färgordets hex (null = inget färgord). roll = materialets roll i entitetens "material" (undefined = ingen roll).
 *  harRoller = entiteten har en "material"-tabell; harPalett = entiteten har lagg-palett; harKarta = materialet har en textur. */
export function fargning(o: { hex: string | null; roll?: string; harRoller: boolean; harPalett: boolean; harKarta: boolean; glans: boolean; ljusare: (hex: string) => string }): Fargning {
  const { hex, roll, harRoller, harPalett, harKarta } = o;
  if (!hex) return { farg: null, palettByte: false, glans: false };
  if (harRoller) {
    const farg = roll === "farg" ? hex : roll === "ljus" ? o.ljusare(hex) : null;
    return { farg, palettByte: false, glans: o.glans && roll === "farg" };
  }
  return { farg: null, palettByte: harPalett && harKarta, glans: o.glans && harPalett };
}

export type FargRad = { kropp: string; mat: string; fore: string; efter: string; sjalvlyse: string; egenKarta: boolean };
declare global {
  interface Window {
    /** B6.4, för prov: en rad per material när en GLB-kropp klonas (färg före/efter, självlyse, egen textur kvar). */
    __tredFarg?: FargRad[];
  }
}
