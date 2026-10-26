// Två egna djur ("en röd katt och en blå hund") eller två föremål ("en sten och en stubbe") delas.
// Bisats, påklädning och verb ("och har hatt", "och som flyger", "röd och blå") delas inte.
import { langstaSuffix, ordFranForm } from "./lexikon.ts";
import { blandPar } from "./tolka.ts";

const BISATS = /^(?:som|kan|vill|ska|är|var|blir|har|bär|iförd|med|utan|på|i|vid|bredvid|under|bakom|framför)\b/i;

function tokens(del: string): string[] {
  return del
    .toLocaleLowerCase("sv")
    .replace(/[^a-zåäö0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function harEgetDjur(del: string): boolean {
  return tokens(del).some((t) => ordFranForm(t)?.klass === "djur" || langstaSuffix(t)?.kind === "djur");
}

function harEgetForemal(del: string): boolean {
  return tokens(del).some((t) => ordFranForm(t)?.klass === "foremal");
}

/** Högerled som börjar med bisats, hjälpverb eller preposition hör till samma skapelse. */
function skaDela(vanster: string, hoger: string): boolean {
  if (BISATS.test(hoger)) return false;
  const vd = harEgetDjur(vanster);
  const hd = harEgetDjur(hoger);
  if (vd && hd) return true;
  if (!hd && (vd || /\b(?:med|har|på|vid)\b/i.test(vanster))) return false;
  return !vd && !hd && harEgetForemal(vanster) && harEgetForemal(hoger);
}

/** Delar meningen bara när varje del är ett eget djur eller ett eget föremål. */
export function delaOchMening(raw: string): string[] {
  const text = raw.trim();
  if (!text || blandPar(text)) return [text];
  const re = /\s+och(?:\s+så)?\s+/gi;
  const bitar: { start: number; end: number }[] = [];
  let senast = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    bitar.push({ start: senast, end: m.index });
    senast = m.index + m[0].length;
  }
  bitar.push({ start: senast, end: text.length });
  const rena = bitar.map((b) => ({ ...b, text: text.slice(b.start, b.end).trim() })).filter((b) => b.text);
  if (rena.length < 2) return [text];
  const grupper: { start: number; end: number }[][] = [[rena[0]!]];
  for (let i = 1; i < rena.length; i++) {
    const hoger = rena[i]!;
    const grupp = grupper[grupper.length - 1]!;
    const vanster = text.slice(grupp[0]!.start, grupp[grupp.length - 1]!.end).trim();
    if (skaDela(vanster, hoger.text)) grupper.push([hoger]);
    else grupp.push(hoger);
  }
  if (grupper.length < 2) return [text];
  return grupper.map((g) => text.slice(g[0]!.start, g[g.length - 1]!.end).trim());
}
