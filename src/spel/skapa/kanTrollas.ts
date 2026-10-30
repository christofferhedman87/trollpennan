// Pennans ljus ska också följa ordägget och tillägg till ett önskande djur. Bara tolkning: inget sparas eller ändras.
import { tolkaMedReserv } from "../../tolk/reserv.ts";
import { tolka } from "../../tolk/tolka.ts";
import type { Varelse } from "../../tolk/typer.ts";
import { tillaggFras } from "../onska.ts";

/** undefined = fri skrivning; djur = samma bas som önska-ge använder; null = önskans djur saknas. */
export function kanTrollas(text: string, tillDjur?: Varelse | null, ordagg: readonly string[] = []): boolean {
  if (!text.trim() || tillDjur === null) return false;
  if (tillDjur) {
    const fras = tillaggFras(tillDjur, text);
    return !!fras && tolka(fras, { kalla: "kort" }).typ === "skapad";
  }
  return tolkaMedReserv(text, { kalla: "kort", behall: [...ordagg] }).typ === "skapad";
}
