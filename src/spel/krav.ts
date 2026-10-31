// Betydelsekrav över redan tolkade skapelser. Ingen råtext, lagring eller UI.
export type KravGrupp = {
  id: string;
  nagon_av: string[];
  alla?: string[];
  subjekt?: "djur" | "sak";
  beskrivning: string;
};
export type BetydelseKrav = {
  grupper: KravGrupp[];
  /** Grupperna ska lösas av skilda individer (antal räknas). */
  olika?: KravGrupp[];
  djur?: boolean | number;
  antal_text?: string;
};
export type TolkadSkapelse = { taggar: ReadonlySet<string>; antal: number; djur: boolean };
export type KravSvar = { ok: boolean; saknas: string[] };

function passar(s: TolkadSkapelse, g: KravGrupp): boolean {
  if (g.subjekt === "djur" && !s.djur || g.subjekt === "sak" && s.djur) return false;
  if (g.alla?.some((t) => !s.taggar.has(t))) return false;
  return g.nagon_av.length > 0 ? g.nagon_av.some((t) => s.taggar.has(t)) : !!g.alla?.length;
}

/** Bipartit matchning: ett djur får inte räknas som båda vännerna. Ingen girig ordningsfälla. */
function olikaMatchar(grupper: KravGrupp[], skapelser: readonly TolkadSkapelse[]): boolean {
  const individer = skapelser.flatMap((s) => Array.from({ length: Math.min(grupper.length, Math.max(0, Math.floor(s.antal))) }, () => s));
  const agare = new Map<number, number>();
  function hitta(g: number, sedda: Set<number>): boolean {
    for (let i = 0; i < individer.length; i++) {
      if (sedda.has(i) || !passar(individer[i]!, grupper[g]!)) continue;
      sedda.add(i);
      const forra = agare.get(i);
      if (forra === undefined || hitta(forra, sedda)) { agare.set(i, g); return true; }
    }
    return false;
  }
  return grupper.every((_, i) => hitta(i, new Set()));
}

export function bedomKrav(krav: BetydelseKrav, skapelser: readonly TolkadSkapelse[]): KravSvar {
  const saknas = krav.grupper.filter((g) => !skapelser.some((s) => passar(s, g))).map((g) => g.beskrivning);
  const antal = krav.djur === true ? 1 : krav.djur || 0;
  if (skapelser.filter((s) => s.djur).reduce((n, s) => n + s.antal, 0) < antal && krav.antal_text) saknas.push(krav.antal_text);
  // Behåll också booleskt fel om datan av misstag saknar antaltext.
  const antalOk = skapelser.filter((s) => s.djur).reduce((n, s) => n + s.antal, 0) >= antal;
  const olikaOk = !krav.olika?.length || olikaMatchar(krav.olika, skapelser);
  if (!olikaOk) for (const g of krav.olika ?? []) if (!saknas.includes(g.beskrivning)) saknas.push(g.beskrivning);
  return { ok: antalOk && olikaOk && saknas.length === 0, saknas };
}
