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

/** B6.1: gåtorna som får väljas på en plats. Platsens egna hemliga djur (`hemliga` i data/platser.json) först; först när
 *  de är hittade (eller platsen saknar egna, som ängen) väljs bland alla andra. "Ny gåta" går runt inom urvalet. */
export function gatUrval(kvar: string[], platsHemliga: readonly string[] | undefined): string[] {
  if (!platsHemliga?.length) return kvar;
  const egna = kvar.filter((id) => platsHemliga.includes(id));
  return egna.length ? egna : kvar;
}
