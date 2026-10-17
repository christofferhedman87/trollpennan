import { ordFranForm } from "./lexikon.ts";
import { BLOCK } from "./data.ts";

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

const EXAKT = new Set(BLOCK.ord.map(normSparr));
const STAMMAR = BLOCK.stammar.filter((s) => s.length >= 4).map(normSparr);
const UNDANTAG = new Set(BLOCK.undantag_fran_stammar.map(normSparr));

function stamTraff(n: string): boolean {
  if (!n || UNDANTAG.has(n)) return false;
  return STAMMAR.some((stam) => stam.length >= 3 && n.includes(stam));
}

function arOrdform(token: string): boolean {
  const t = token.toLocaleLowerCase("sv").replace(/[^a-zåäö]/g, "");
  return !!t && !!ordFranForm(t);
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
    return EXAKT.has(n) || stamTraff(n);
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
