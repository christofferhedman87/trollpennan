// Nya Skapa 6.11: uppfyllde Trolla en önskan står djurets tack först i kvittot.
import type { OnskaSpar } from "../minne.ts";
import { ONSK, ONSK_BYGG } from "../onska.ts";
import type { OnskeMiss, UppdragsSvar } from "./kvitto.ts";

export function tackFor(fore: OnskaSpar | null, efter: OnskaSpar | null): string | null {
  if (!fore || (efter && efter.id === fore.id)) return null;
  const lista = fore.kalla === "bygg" ? ONSK_BYGG.onskningar : ONSK.onskningar;
  return lista.find((o) => o.id === fore.id)?.tack ?? null;
}

/** Bara ett faktiskt bedömt uppdragsförsök får lägga en ledtråd i kvittot. */
export function kvittotack(fore: OnskaSpar | null, efter: OnskaSpar | null, svar: UppdragsSvar | null, miss: OnskeMiss | null = null): string | null {
  const ledtrad = fore && efter?.id === fore.id && efter.uid === fore.uid && miss?.id === fore.id && miss.uid === fore.uid ? miss.nastan : null;
  return tackFor(fore, efter) ?? ledtrad ?? (svar?.resultat === "fel" ? svar.nastan : null);
}
