// Två egna djur i samma mening ("en röd katt och en blå hund") delas.
// Tillbehör, färger och verb ("hatt och glasögon", "röd och blå", "hoppar och dansar") delas inte.
import { langstaSuffix, ordFranForm } from "./lexikon.ts";
import { blandPar } from "./tolka.ts";

function harDjur(del: string): boolean {
  const tokens = del
    .toLocaleLowerCase("sv")
    .replace(/[^a-zåäö0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  return tokens.some((t) => ordFranForm(t)?.klass === "djur" || langstaSuffix(t)?.kind === "djur");
}

/** Delar av meningen när varje del har ett eget djur. Annars hela meningen. */
export function delaOchMening(raw: string): string[] {
  const text = raw.trim();
  if (!text || blandPar(text)) return [text];
  const delar = text.split(/\s+och(?:\s+så)?\s+/i).map((d) => d.trim()).filter(Boolean);
  if (delar.length >= 2 && delar.every(harDjur)) return delar;
  return [text];
}
