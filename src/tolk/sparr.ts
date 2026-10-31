import { ordFranForm } from "./lexikon.ts";
import { BLOCK, ORD } from "./data.ts";

/** Bara för spärrlistan. Ordlistan jämförs aldrig så här. */
export function normSparr(s: string): string {
  let t = s.toLocaleLowerCase("sv");
  t = t
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t");
  t = t.replace(/[^a-zåäö]/g, "");
  t = t.replace(/(.)\1+/g, "$1");
  return t;
}

/** Samma bokstäver som normSparr, utan att slå ihop dubbeltecken. */
function renSparr(s: string): string {
  return s.toLocaleLowerCase("sv").replace(/[^a-zåäö]/g, "");
}

const EXAKT = new Set(BLOCK.ord.map(normSparr));
const STAMMAR = BLOCK.stammar
  .filter((s) => s.length >= 4)
  .map((s) => ({ norm: normSparr(s), ren: renSparr(s) }));
const UNDANTAG = new Set(BLOCK.undantag_fran_stammar.map(normSparr));

function stamTraff(norm: string, ren: string): boolean {
  if (!norm || UNDANTAG.has(norm)) return false;
  return STAMMAR.some((s) => (s.norm.length >= 4 ? norm.includes(s.norm) : s.ren.length >= 4 && ren.includes(s.ren)));
}

/** Trygga sammansättningar som innehåller ett spärrat led ("kniv", "pistol"). */
export const TILLATNA_ORD = new Set([
  "smörkniv", "smörkniven", "smörknivar",
  "vattenpistol", "vattenpistolen", "vattenpistoler",
]);

const FUNK = new Set<string>();
{
  const f = ORD.funktionsord;
  const ord = [...f.artiklar, ...Object.keys(f.antal), ...f.som, ...f.med, ...f.och, ...f.kan, ...Object.keys(f.forstarkning)];
  for (const w of ord) {
    for (const del of w.toLocaleLowerCase("sv").split(/\s+/)) {
      const t = del.replace(/[^a-zåäö]/g, "");
      if (t) FUNK.add(t);
    }
  }
}

function arOrdform(token: string): boolean {
  // Ett erkänt antal utan bokstäver i spärrnormaliseringen är bara en avskiljare.
  // Siffror som kan maskera bokstäver måste fortfarande gå genom maskkontrollen.
  if (/^(?:[1-9]|10)$/.test(token) && !normSparr(token)) return true;
  const t = token.toLocaleLowerCase("sv").replace(/[^a-zåäö]/g, "");
  if (TILLATNA_ORD.has(t)) return true;
  return !!t && (FUNK.has(t) || !!ordFranForm(t));
}

export function arSparrat(raw: string): boolean {
  const tokens = raw
    .toLocaleLowerCase("sv")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (!tokens.length) return false;

  const kolla = (text: string) => {
    const n = normSparr(text);
    if (!n || UNDANTAG.has(n)) return false;
    return EXAKT.has(n) || stamTraff(n, renSparr(text));
  };

  for (const t of tokens) {
    if (arOrdform(t)) continue;
    if (kolla(t)) return true;
  }
  for (let n = 2; n <= Math.min(4, tokens.length); n++) {
    for (let i = 0; i + n <= tokens.length; i++) {
      const bit = tokens.slice(i, i + n);
      if (bit.every(arOrdform)) continue;
      if (kolla(bit.join(" "))) return true;
    }
  }
  if (!tokens.every(arOrdform) && kolla(tokens.join(""))) return true;
  return false;
}
