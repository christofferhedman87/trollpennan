import type { Data } from "../minne.ts";
import { allaVaknaDjur } from "../minneDjur.ts";
type KvittoMinne = Pick<Data, "ang" | "hemma" | "platsSkapelser" | "garden">;
/** Utgår från verkligt sparade skapelser, även ett ändrat djur på utflykten. */
export function kvittoLage(fore: KvittoMinne, efter: KvittoMinne): "ny" | "andrad" | null {
  const gamla = new Map([...allaVaknaDjur(fore), ...fore.garden].map((d) => [d.uid, d.formel]));
  const nu = [...allaVaknaDjur(efter), ...efter.garden];
  if (nu.some((d) => !gamla.has(d.uid))) return "ny";
  return nu.some((d) => gamla.get(d.uid) !== d.formel) ? "andrad" : null;
}
