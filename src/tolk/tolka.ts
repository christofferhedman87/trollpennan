// T-07/T-08: oförändrad tolklogik, uppdelad före språkändringarna.
import { ORD } from "./data.ts";
import { kortDjur, ordMedId } from "./lexikon.ts";
import { arSparrat } from "./sparr.ts";
import type { TolkaOpts, Utfall, Varelse } from "./typer.ts";
import { BEHOVER_TEXT, SPARR_TEXT, tokensAv } from "./tolktillstand.ts";
import { semantisera } from "./semantisera.ts";
import { byggFran } from "./byggVarelse.ts";
import { formelAv, overraskningar } from "./formelVarelse.ts";

const NAMN_RE = /\b(?:som\s+heter|heter|som\s+kallas|kallas(?:\s+för)?|vid\s+namn)\s+([a-zåäöA-ZÅÄÖ]{2,20})\b/i;

/** Plockar "som heter Misse" ur meningen innan tokenisering, så namnet inte blir okänt ord eller reservägg. */
export function extraheraSmeknamn(raw: string): { renText: string; smeknamn?: string } {
  const m = NAMN_RE.exec(raw);
  if (!m?.[1]) return { renText: raw };
  const namnRaw = m[1];
  const smeknamn = namnRaw.charAt(0).toLocaleUpperCase("sv") + namnRaw.slice(1);
  const fore = raw.slice(0, m.index).replace(/\s+(?:och|som)\s*$/i, " ");
  const efter = raw.slice(m.index + m[0].length);
  return { renText: `${fore} ${efter}`.replace(/\s+/g, " ").trim(), smeknamn };
}

export function tolka(raw: string, opts: TolkaOpts = {}): Utfall {
  const { renText, smeknamn } = extraheraSmeknamn(raw);
  if (arSparrat(raw) || arSparrat(renText)) return { typ: "sparr", text: SPARR_TEXT };
  const tokens = tokensAv(renText);
  if (arSparrat(tokens.join(" "))) return { typ: "sparr", text: SPARR_TEXT };
  // T-08: före sifferinmatningen nådde texten tolken utan siffror. Det som då spärrades, även sammansättningar som
  // spärras först när ordet delas i led ("idiotkatt"), spärras fortfarande med en siffra i ordet ("idiot2katt").
  if (/[0-9]/.test(raw) && tolka(raw.replace(/[0-9]/g, ""), { ...opts, noteraBlandning: false }).typ === "sparr") return { typ: "sparr", text: SPARR_TEXT };
  if (!tokens.length) {
    return { typ: "behover_djur", text: BEHOVER_TEXT, djur: kortDjur(3), okanda: [], meddelanden: [] };
  }
  const sem = semantisera(tokens);
  if (!Array.isArray(sem)) return sem;
  const byggd = byggFran(sem);
  if (byggd === "sparr") return { typ: "sparr", text: SPARR_TEXT };
  const okanda = [...new Set(byggd.okanda)];
  if (!byggd.djur || !byggd.kropp) {
    return {
      typ: "behover_djur",
      text: BEHOVER_TEXT,
      djur: kortDjur(3),
      okanda,
      meddelanden: byggd.meddelanden,
    };
  }
  const talat = byggd.antalSatt ? byggd.antal : byggd.plural ? 3 : 1;
  const tak = ORD.funktionsord.antal_tak ?? talat;
  const antal = Math.min(talat, Math.max(1, tak));
  const formel = byggd.blandFormel ?? formelAv(byggd);
  const varelse: Varelse = {
    kropp: byggd.kropp,
    farg: byggd.fargHex,
    monster: byggd.monster,
    monsterfarg: byggd.monsterfarg,
    formagor: byggd.formagor.map((f) => f.nyckel),
    tillbehor: byggd.tillbehor.map((t) => ({ id: t.bild, farg: t.fargHex, glans: t.glans, ord: t.ord.id,
      ...(t.antal ? { antal: t.antal } : {}), ...(t.egenskaper?.length ? { egenskaper: [...t.egenskaper] } : {}), ...(t.relation ? { relation: t.relation } : {}) })),
    skala: byggd.skala,
    alpha: byggd.alpha,
    kontur: byggd.kontur,
    glans: byggd.glans,
    formel,
    beskrivning: formel.replace(/^(en|ett|två|tre|fyra|fem|sex|sju|åtta|nio|tio)\s+/, ""),
    overraskningar: overraskningar(byggd),
    ...(smeknamn ? { smeknamn } : {}),
  };
  const kalla = opts.kalla ?? "skriv";
  const inte = new Set(opts.inteGuld ?? []);
  const funna = byggd.funna.map((f) => f.id);
  const guld = byggd.funna
    .filter((f) => {
      const niva = ordMedId(f.id)?.niva;
      return f.exakt && !inte.has(f.id) && kalla === "skriv" && (niva === "kort" || niva === "fritt");
    })
    .map((f) => f.id);
  return {
    typ: "skapad",
    varelse,
    antal,
    ...(byggd.tillbehor.some((t) => t.omvandInuti) ? { osakraRelationer: byggd.tillbehor.flatMap((t, i) => t.omvandInuti ? [i] : []) } : {}),
    funna,
    guld,
    okanda,
    meddelanden: [...new Set(byggd.meddelanden)],
  };
}

export function hemligaKvar(funna: Record<string, unknown>): number {
  return ORD.ord.filter((o) => o.niva === "fritt" && !funna[o.id]).length;
}

export function ordLista() {
  return ORD.ord;
}

export function kategorier() {
  return {
    djur: "Djur",
    farg: "Färg",
    storlek: "Storlek",
    monster: "Mönster",
    formaga: "Kan",
    tillbehor: "Har",
  } as const;
}

export { delaOchMening } from "./ochMening.ts";

export { blandPar } from "./tolkBlandning.ts";
