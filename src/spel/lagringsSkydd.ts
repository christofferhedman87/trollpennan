// Ett persist-försök är bara en begäran. Webbläsaren bestämmer och Safari kan ändå rensa data.
export type BestandigStatus = "beviljad" | "nekad" | "saknas";
export async function begarBestandigLagring(hamta: () => Pick<StorageManager, "persist"> | undefined): Promise<BestandigStatus> {
  try {
    const lagring = hamta();
    if (typeof lagring?.persist !== "function") return "saknas";
    return await lagring.persist() ? "beviljad" : "nekad";
  } catch { return "nekad"; }
}
export const SENASTE_KOPIA = "trollpennan-senaste-kopia";
const lyssnare = new Set<() => void>();
export function lyssnaKopia(fn: () => void) { lyssnare.add(fn); return () => { lyssnare.delete(fn); }; }
export function senasteKopia(hamta: () => Pick<Storage, "getItem"> = () => window.localStorage): number | null {
  try {
    const raw = hamta().getItem(SENASTE_KOPIA);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch { return null; }
}
/** Markerar att nedladdningen har startats; kan inte veta om föräldern sedan behåller filen. */
export function markeraKopia(hamta: () => Pick<Storage, "setItem"> = () => window.localStorage, tid = Date.now()): boolean {
  try {
    if (!Number.isFinite(tid) || tid <= 0) return false;
    hamta().setItem(SENASTE_KOPIA, String(tid));
    for (const fn of lyssnare) fn();
    return true;
  } catch { return false; }
}
