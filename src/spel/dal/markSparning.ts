// Mark finns från och med block 3b i samma v2-skrivning som stjärnorna.
// Den äldre nyckeln används bara vid lokal migrering, aldrig vid import av en fil.
import { markeraLasfel, markeraSkadad, objekt, sakerJson, type LokalLagring } from "../lagring.ts";

export type DalSpar = { utbyggnader: string[] };
export const ALDRE_MARK_NYCKEL = "trollpennan-dal-v1";

export function arDal(v: unknown): v is DalSpar {
  return objekt(v) && sakerJson(v) && Array.isArray(v.utbyggnader) && v.utbyggnader.every((id) => typeof id === "string");
}

/** Okända sträng-id:n bevaras för äldre/framtida världar; bara kända utbyggnader kan köpas och öppna tomter. */
export function dalFranSparning(v: DalSpar): DalSpar {
  return { utbyggnader: [...new Set(v.utbyggnader)] };
}

/** null betyder att originalet inte kunde läsas säkert och inte får skrivas över. */
export function lasAldreMark(hamta: () => LokalLagring): DalSpar | null {
  let text: string | null;
  try { text = hamta().getItem(ALDRE_MARK_NYCKEL); } catch {
    markeraLasfel();
    return null;
  }
  if (text === null) return { utbyggnader: [] };
  try {
    const raw: unknown = JSON.parse(text);
    if (arDal(raw)) return dalFranSparning(raw);
  } catch { /* skadad JSON skyddas på samma sätt som ett skadat markfält */ }
  markeraSkadad();
  return null;
}
