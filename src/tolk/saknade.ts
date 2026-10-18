import type { ReservDel } from "./typer.ts";

/**
 * Saknade ord: varje ord som blev ett ägg (reservformen) noteras lokalt i spelaren, så att Modellspanaren
 * kan hitta en modell till nästa uppdatering. Bara ordet, grundordet, kategorin, antal och datum sparas
 * (aldrig meningen, djuret eller något som pekar ut barnet). Inget skickas automatiskt: en vuxen exporterar
 * listan för hand (För vuxna → Ord utan modell). Ren logik utan three/React så att den testas i Node.
 */

export type Saknad = { ord: string; grund: string | null; kategori: string; antal: number; forst: string; sist: string };

export const NYCKEL = "trollpennan-saknade-ord";
export const MAX_ORD = 300;
export const MAX_LANGD = 24;

/** Datum som YYYY-MM-DD (utan klockslag). */
export function idag(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function registrera(lista: Saknad[], delar: readonly ReservDel[], datum: string): Saknad[] {
  const ut = lista.map((s) => ({ ...s }));
  for (const d of delar) {
    const ord = d.ord.toLocaleLowerCase("sv").trim();
    if (ord.length < 2 || ord.length > MAX_LANGD || !/^[a-zåäö]+$/.test(ord)) continue;
    const finns = ut.find((s) => s.ord === ord);
    if (finns) {
      finns.antal += 1;
      finns.sist = datum;
      if (!finns.grund && d.grund) finns.grund = d.grund;
    } else ut.push({ ord, grund: d.grund ?? null, kategori: d.kategori, antal: 1, forst: datum, sist: datum });
  }
  if (ut.length <= MAX_ORD) return ut;
  return ut.sort((a, b) => b.antal - a.antal || b.sist.localeCompare(a.sist)).slice(0, MAX_ORD);
}

/** Slår ihop listor från flera spelare/enheter: antal summeras, första datum är det tidigaste. */
export function sammanfoga(...listor: Saknad[][]): Saknad[] {
  const per = new Map<string, Saknad>();
  for (const l of listor) {
    for (const s of l) {
      const f = per.get(s.ord);
      if (!f) per.set(s.ord, { ...s });
      else {
        f.antal += s.antal;
        f.forst = s.forst < f.forst ? s.forst : f.forst;
        f.sist = s.sist > f.sist ? s.sist : f.sist;
        f.grund = f.grund ?? s.grund ?? null;
      }
    }
  }
  return [...per.values()].sort((a, b) => b.antal - a.antal || a.ord.localeCompare(b.ord, "sv"));
}

export function arSaknad(x: unknown): x is Saknad {
  const s = x as Saknad;
  return (
    !!s &&
    typeof s.ord === "string" &&
    /^[a-zåäö]{2,24}$/.test(s.ord) &&
    (s.grund === null || typeof s.grund === "string") &&
    typeof s.kategori === "string" &&
    Number.isFinite(s.antal) &&
    s.antal >= 1 &&
    /^\d{4}-\d{2}-\d{2}$/.test(s.forst) &&
    /^\d{4}-\d{2}-\d{2}$/.test(s.sist)
  );
}

/** Filen som exporteras: { version, exporterad, ord: [...] }. */
export function tillExport(lista: Saknad[], datum: string): string {
  return JSON.stringify({ version: 1, exporterad: datum, ord: sammanfoga(lista) }, null, 1) + "\n";
}

export function franExport(text: string): Saknad[] {
  const j = JSON.parse(text) as { ord?: unknown };
  return Array.isArray(j.ord) ? j.ord.filter(arSaknad) : [];
}

/** Kort text att kopiera: ett ord per rad, "ord (grundord, kategori) × antal". */
export function tillText(lista: Saknad[]): string {
  return sammanfoga(lista)
    .map((s) => `${s.ord} (${[s.grund && s.grund !== s.ord ? "grundord " + s.grund : null, s.kategori].filter(Boolean).join(", ")}) × ${s.antal}`)
    .join("\n");
}

type Lagring = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const lagring = (): Lagring | null => {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
};

export function lasLokalt(l: Lagring | null = lagring()): Saknad[] {
  try {
    const raw = l?.getItem(NYCKEL);
    if (!raw) return [];
    const j = JSON.parse(raw) as unknown;
    return Array.isArray(j) ? j.filter(arSaknad) : [];
  } catch {
    return [];
  }
}

export function sparaLokalt(lista: Saknad[], l: Lagring | null = lagring()): void {
  try {
    l?.setItem(NYCKEL, JSON.stringify(lista));
  } catch {
    /* fullt eller förbjudet: listan är bara en bonus */
  }
}

export function rensaLokalt(l: Lagring | null = lagring()): void {
  try {
    l?.removeItem(NYCKEL);
  } catch {
    /* ingenting */
  }
}

/** Anropas när ett ägg skapats. Aldrig kast: spelet får inte stanna för en lista. */
export function noteraSaknade(delar: readonly ReservDel[], l: Lagring | null = lagring(), datum: string = idag()): void {
  if (!delar.length || !l) return;
  sparaLokalt(registrera(lasLokalt(l), delar, datum), l);
}
