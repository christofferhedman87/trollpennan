import { ordFranForm } from "./lexikon.ts";
import { BLOCK, ORD } from "./data.ts";

/** Bara för spärrlistan. Ordlistan jämförs aldrig så här. */
/** Siffror som ser ut som bokstäver läses som bokstäverna (0→o, 1→i, 3→e, 4→a, 5→s, 7→t). */
function sifferbokstaver(t: string): string {
  return t.replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t");
}

export function normSparr(s: string): string {
  let t = sifferbokstaver(s.toLocaleLowerCase("sv"));
  t = t.replace(/[^a-zåäö]/g, "");
  t = t.replace(/(.)\1+/g, "$1");
  return t;
}

/** Bokstäverna utan att slå ihop dubbeltecken, läst på två sätt: siffran som bokstav ("f1tt") och
 *  siffran som inskjutet tecken ("f3itta"). Båda läsningarna prövas mot de korta stammarna. */
function renSparr(s: string): string[] {
  const t = s.toLocaleLowerCase("sv");
  return [sifferbokstaver(t).replace(/[^a-zåäö]/g, ""), t.replace(/[^a-zåäö]/g, "")];
}

const EXAKT = new Set(BLOCK.ord.map(normSparr));
const STAMMAR = BLOCK.stammar
  .filter((s) => s.length >= 4)
  .map((s) => ({ norm: normSparr(s), ren: renSparr(s)[0]! }));
const UNDANTAG = new Set(BLOCK.undantag_fran_stammar.map(normSparr));

function stamTraff(norm: string, ren: readonly string[]): boolean {
  if (!norm || UNDANTAG.has(norm)) return false;
  return STAMMAR.some((s) => (s.norm.length >= 4 ? norm.includes(s.norm) : s.ren.length >= 4 && ren.some((r) => r.includes(s.ren))));
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
  // En siffra inne i ett ord gör det aldrig till en känd ordform ("hor4n" är inte "horn"); maskkontrollen avgör.
  if (/[0-9]/.test(token)) return false;
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

  const kand = tokens.map(arOrdform);
  // En siffra inne i ett ord kan stå för en bokstav ("f1tt") eller vara inskjuten ("f0an"). Den andra läsningen tar
  // bort siffror inne i ord men låter fristående antal stå kvar, så att "med 5 hattar" inte bildar nya ord.
  const utanInskjutna = tokens.map((t) => (/[0-9]/.test(t) && /[a-zåäö]/.test(t) ? t.replace(/[0-9]/g, "") : t));
  const lasningar = utanInskjutna.some((t, i) => t !== tokens[i]) ? [tokens, utanInskjutna] : [tokens];
  for (const lista of lasningar) {
    for (let i = 0; i < lista.length; i++) if (!kand[i] && kolla(lista[i]!)) return true;
    for (let n = 2; n <= Math.min(4, lista.length); n++) {
      for (let i = 0; i + n <= lista.length; i++) {
        if (kand.slice(i, i + n).every(Boolean)) continue;
        if (kolla(lista.slice(i, i + n).join(" "))) return true;
      }
    }
    if (!kand.every(Boolean) && kolla(lista.join(""))) return true;
  }
  return false;
}
