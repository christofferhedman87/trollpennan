import { ordLista } from "../tolk/tolka.ts";
import type { Ord } from "../tolk/typer.ts";
import type { Slot, Val } from "./ui/typer.ts";

export type SkaparVal = Val;

const SLOTS = new Set<Slot>(["djur", "farg", "storlek", "monster", "formaga", "tillbehor"]);
const SMAORD = new Set(["en", "ett", "med", "som", "och"]);

/** Tolkar en påbörjad fras ("en kanin med …") till de ordkort barnet redan valt. */
export function valUrText(fras: string): SkaparVal {
  const bitar = fras
    .toLocaleLowerCase("sv")
    .replace(/…+/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !SMAORD.has(w));
  const lista = ordLista().filter((o) => SLOTS.has(o.klass as Slot));
  const val: SkaparVal = {};
  for (const token of bitar) {
    const ord = hittaOrd(token, lista);
    if (!ord) continue;
    const slot = ord.klass as Slot;
    if (!val[slot]) val[slot] = ord;
  }
  return val;
}

function hittaOrd(token: string, lista: Ord[]): Ord | undefined {
  const lika = (s: string) => s.toLocaleLowerCase("sv") === token;
  return (
    lista.find((o) => lika(o.id)) ??
    lista.find((o) => lika(o.visa)) ??
    lista.find((o) => o.former.some(lika))
  );
}

export { useSkriv } from "./styr/useSkriv.ts";
export type { Skriv } from "./styr/useSkriv.ts";
