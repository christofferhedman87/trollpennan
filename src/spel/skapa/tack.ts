// Nya Skapa 6.11: uppfyllde Trolla en önskan står djurets tack först i kvittot.
import type { OnskaSpar } from "../minne.ts";
import { ONSK, ONSK_BYGG } from "../onska.ts";

export function tackFor(fore: OnskaSpar | null, efter: OnskaSpar | null): string | null {
  if (!fore || (efter && efter.id === fore.id)) return null;
  const lista = fore.kalla === "bygg" ? ONSK_BYGG.onskningar : ONSK.onskningar;
  return lista.find((o) => o.id === fore.id)?.tack ?? null;
}
