// TTS-1: uppslag i det förgenererade röstmanifestet (data/rost-manifest.json, skrivs av scripts/rost-generera.mjs).
// Rent och utan DOM, så att det går att testa i node. Uppspelningen finns i rost.ts.
import manifestJson from "../../data/rost-manifest.json" with { type: "json" };
import rostJson from "../../data/rost.json" with { type: "json" };

export type RostRad = { f: string; ms: number; r: string; id?: string; t?: string };
export type RostIntro = { f: string; ms: number; fran: number[]; langd: number; t?: string };
type Manifest = { intro: RostIntro | null; rader: Record<string, RostRad> };

export const MANIFEST = manifestJson as unknown as Manifest;
/** 'webblasare' = webbläsarens röst om en svensk finns (annars tyst), 'tyst' = bara förgenererade filer. */
export const RESERV: "webblasare" | "tyst" = (rostJson as { reserv?: string }).reserv === "tyst" ? "tyst" : "webblasare";

/** Samma som scripts/rost-generera.mjs: NFC, ett mellanslag, trimmad. */
export function normalisera(t: string): string {
  return t.normalize("NFC").replace(/\s+/g, " ").trim();
}

/** FNV-1a 32 bit över UTF-16, 8 hex-tecken (samma som generatorn). */
export function nyckel(t: string): string {
  const s = normalisera(t);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Filen för en text som visas. Exakt träff, annars delen efter första ": " (t.ex. "Nytt uppdrag från Doktor Bengtsson: …"). */
export function rostFor(text: string): RostRad | null {
  const hel = MANIFEST.rader[nyckel(text)];
  if (hel) return hel;
  const i = text.indexOf(": ");
  if (i > 0) return MANIFEST.rader[nyckel(text.slice(i + 2))] ?? null;
  return null;
}

/** Introts röstfil med scenernas starttider, eller null (då gäller data/intro.json och saga.mp3). */
export function rostIntro(antalScener: number): RostIntro | null {
  const I = MANIFEST.intro;
  return I && I.fran.length === antalScener ? I : null;
}
