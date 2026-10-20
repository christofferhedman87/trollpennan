// P2: den guidade starten som data (data/forsta-stunden.json). Ren logik utan React: vilket steg gäller,
// och raden om vad som hände sist (titelskärmens "Fortsätt"). Inga per-steg-if – stegen är villkor på sparningen.
import forstaJson from "../../data/forsta-stunden.json" with { type: "json" };

export type Villkor = { falt: string; minst: number; varde?: string };
export type CoachSteg = { id: string; text: string; pekar_pa: string; klart_nar: Villkor };
export type TitelText = { logga: string; under: string; fortsatt: string; borja: string; borja_om: string; fraga: string; nej: string; ja: string; angra: string; uppdrag: string; skriv: string };
type ForstaData = { titel: TitelText; senast: { med_djur: string; tom: string }; steg: CoachSteg[] };

export const FORSTA = forstaJson as unknown as ForstaData;

/** Hur många av fältet: lista → längd, objekt → nycklar (eller värden lika med `varde`), tal → värdet, sant/falskt → 1/0. */
export function rakna(v: unknown, varde?: string): number {
  if (Array.isArray(v)) return varde === undefined ? v.length : v.filter((x) => x === varde).length;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (v && typeof v === "object") {
    const vals = Object.values(v as Record<string, unknown>);
    return varde === undefined ? vals.length : vals.filter((x) => x === varde).length;
  }
  return 0;
}

export function uppfyllt(k: Villkor, d: Readonly<Record<string, unknown>>): boolean {
  return rakna(d[k.falt], k.varde) >= k.minst;
}

/** Första steget som inte är klart, med nummer (1-baserat) och antal. null när allt är klart eller introt inte är sett. */
export function aktivtSteg(
  d: Readonly<Record<string, unknown>>,
  steg: readonly CoachSteg[] = FORSTA.steg,
): { steg: CoachSteg; nr: number; av: number } | null {
  if (d.introSedd !== true) return null;
  const i = steg.findIndex((s) => !uppfyllt(s.klart_nar, d));
  return i < 0 ? null : { steg: steg[i]!, nr: i + 1, av: steg.length };
}

/** "pekar_pa" → mål att leta upp i UI:t: testid i ordning, eller ett namngivet 3D-ankare. */
export function malFor(pekar: string): { testid: string[]; ankare: string | null } {
  if (pekar.startsWith("3d:")) return { testid: [], ankare: pekar.slice(3) };
  return { testid: pekar.split("|").map((x) => x.replace(/^testid:/, "").trim()).filter(Boolean), ankare: null };
}

/** Raden under "Fortsätt": senaste skapelsen på ängen (ang är i skapad ordning, formel = barnets fras). */
export function senastRad(d: Readonly<Record<string, unknown>>): string {
  const ang = Array.isArray(d.ang) ? (d.ang as { formel?: unknown }[]) : [];
  const sista = [...ang].reverse().find((x) => typeof x?.formel === "string" && x.formel.trim());
  return sista ? FORSTA.senast.med_djur.replace("{text}", String(sista.formel).trim()) : FORSTA.senast.tom;
}
