// B6.1 (F): ord som känns igen men saknar modell ska alltid ge synlig återkoppling (aldrig en tyst, öppen bok).
import aterkopplingJson from "../../data/aterkoppling.json" with { type: "json" };
import entJson from "../../data/entiteter.json" with { type: "json" };
import ordJson from "../../data/ord.json" with { type: "json" };
import type { Utfall } from "./typer.ts";

export const KAN_INTE_RITA = aterkopplingJson.kan_inte_rita;
/** B6.3 (H): uppmaningen står så här länge (ms) eller tills barnet trycker på den. Minst 5 s. */
export const KAN_INTE_RITA_MS = Math.max(5000, (aterkopplingJson as { kan_inte_rita_ms?: number }).kan_inte_rita_ms ?? 6000);
const KANDA = new Set<string>();
for (const o of (ordJson as { ord: { id: string; visa?: string; former?: string[] }[] }).ord) {
  for (const f of [o.id, o.visa, ...(o.former ?? [])]) if (f) KANDA.add(f.toLowerCase());
}
for (const e of Object.values((entJson as unknown as { entiteter: Record<string, { ord?: string[] }> }).entiteter)) for (const f of e.ord ?? []) KANDA.add(f.toLowerCase());

/** Texten att visa när barnet bara skrev kända ord som inte blir något (t.ex. "en regnbåge", "röd"), annars null. */
export function kanInteRita(u: Utfall, raw: string): string | null {
  if (u.typ !== "behover_djur" || u.okanda.length || u.meddelanden.length) return null;
  const ord = raw.toLowerCase().match(/[a-zåäöéü]+/g) ?? [];
  return ord.some((t) => KANDA.has(t)) ? KAN_INTE_RITA : null;
}
