// R9G: vilken gåta som visas. Låst tills ordet hittats eller barnet väljer "Ny gåta" – aldrig slump vid render.

/** Gåtan som gäller: den sparade om den fortfarande är ohittad, annars första ohittade. */
export function aktivGata(kvar: string[], gataId: string | null): string | null {
  if (!kvar.length) return null;
  return gataId && kvar.includes(gataId) ? gataId : kvar[0]!;
}

/** Nästa gåta när barnet trycker "Ny gåta" (runt listan). */
export function nastaGata(kvar: string[], gataId: string | null): string | null {
  const nu = aktivGata(kvar, gataId);
  if (!nu) return null;
  return kvar[(kvar.indexOf(nu) + 1) % kvar.length]!;
}
