import type { Data } from "../minne.ts";
import { allaVaknaDjur } from "../minneDjur.ts";
type KvittoMinne = Pick<Data, "ang" | "hemma" | "platsSkapelser" | "garden">;
/** Utgår från verkligt sparade skapelser, även ett ändrat djur på utflykten. */
export function harKvittoAndring(fore: KvittoMinne, efter: KvittoMinne): boolean {
  const gamla = new Map([...allaVaknaDjur(fore), ...fore.garden].map((d) => [d.uid, d.formel]));
  return [...allaVaknaDjur(efter), ...efter.garden].some((d) => !gamla.has(d.uid) || gamla.get(d.uid) !== d.formel);
}
