/** Ren, testbar lagringsgräns. Inga nätverksanrop eller beroenden. */
export type LagringsStatus = "ok" | "otillganglig" | "skadad";
let status: LagringsStatus = "ok";
let skyddaOriginal = false;
export function markeraSkadad() { skyddaOriginal = true; meddela("skadad"); }
export function tillatSkrivning() { skyddaOriginal = false; meddela("ok"); }
const lyssnare = new Set<() => void>();
export const lagringsStatus = () => status;
export function lyssnaLagring(fn: () => void) { lyssnare.add(fn); return () => { lyssnare.delete(fn); }; }
function meddela(s: LagringsStatus) { if (s === status) return; status = s; for (const fn of lyssnare) fn(); }
export type LokalLagring = Pick<Storage, "getItem" | "setItem">;
export function lasLokalt(hamta: () => LokalLagring): unknown {
  try {
    const store = hamta();
    const text = store.getItem("trollpennan-v2") ?? store.getItem("trollpennan:v2") ?? store.getItem("trollpennan-v1") ?? store.getItem("trollpennan-spel");
    if (!text) return null;
    try { return JSON.parse(text); } catch { markeraSkadad(); return null; }
  } catch {
    // Ett läsfel får inte följas av att en tillfälligt tom värld skriver över originalet.
    // Spärren gäller resten av sidvisningen, tills explicit import eller återställning tillåter skrivning.
    skyddaOriginal = true;
    meddela("otillganglig");
    return null;
  }
}
export function skrivLokalt(hamta: () => LokalLagring, data: unknown): boolean {
  if (skyddaOriginal) return false;
  try { hamta().setItem("trollpennan-v2", JSON.stringify(data)); meddela("ok"); return true; }
  catch { meddela("otillganglig"); return false; }
}
export function objekt(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
const farliga = new Set(["__proto__", "constructor", "prototype"]);
export function sakerJson(v: unknown): boolean {
  if (typeof v === "number") return Number.isFinite(v);
  if (v === null || typeof v === "string" || typeof v === "boolean") return true;
  if (Array.isArray(v)) return v.every(sakerJson);
  if (objekt(v)) return Object.entries(v).every(([k, x]) => !farliga.has(k) && sakerJson(x));
  return false;
}
/** Kopiera bara kända datafält. Fel typ återgår till standard, metoder kan aldrig ersättas. */
export function normalisera<T extends object>(raw: unknown, bas: T): T | null {
  if (!objekt(raw) || !sakerJson(raw) || (raw.version !== 1 && raw.version !== 2)) return null;
  const result = { ...bas } as Record<string, unknown>;
  for (const [k, b] of Object.entries(bas)) {
    const v = raw[k];
    if (v === undefined) continue;
    if (Array.isArray(b)) { if (Array.isArray(v)) result[k] = v; }
    else if (objekt(b)) {
      if (objekt(v)) result[k] = Object.keys(b).length ? { ...b, ...v } : v;
    } else if (b === null) { if (v === null || typeof v === "string" || objekt(v)) result[k] = v; }
    else if (typeof v === typeof b && (typeof v !== "number" || Number.isFinite(v))) result[k] = v;
  }
  result.version = 2;
  return result as T;
}

export function arDjur(v: unknown): boolean {
  if (!objekt(v)) return false;
  return typeof v.uid === "string" && typeof v.kropp === "string" &&
    typeof v.formel === "string" && typeof v.beskrivning === "string" &&
    typeof v.skapad === "number" && Number.isFinite(v.skapad) &&
    typeof v.skala === "number" && v.skala > 0 && Number.isFinite(v.skala) &&
    typeof v.alpha === "number" && v.alpha >= 0 && v.alpha <= 1 &&
    Array.isArray(v.formagor) && v.formagor.every(x => typeof x === "string") &&
    Array.isArray(v.tillbehor) && v.tillbehor.every(x => objekt(x) && typeof x.id === "string") &&
    Array.isArray(v.overraskningar) && v.overraskningar.every(x => objekt(x) && typeof x.text === "string" && typeof x.effekt === "string");
}
export function arBygge(v: unknown): boolean {
  return objekt(v) && typeof v.uid === "string" && typeof v.bygg === "string" &&
    typeof v.formel === "string" && typeof v.ord === "string" &&
    typeof v.x === "number" && Number.isFinite(v.x) && typeof v.y === "number" && Number.isFinite(v.y) &&
    typeof v.antal === "number" && Number.isFinite(v.antal) && v.antal > 0 &&
    Array.isArray(v.delar) && v.delar.every(x => objekt(x) && typeof x.id === "string" && typeof x.antal === "number") &&
    Array.isArray(v.boende) && v.boende.every(x => typeof x === "string");
}
