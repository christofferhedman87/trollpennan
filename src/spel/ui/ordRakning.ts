// T-22: Min bok och Ordboken räknar barnets ord på samma sätt, så att rutans siffra och sidans innehåll stämmer.
// Skrivord = ord som bara finns för den som skriver dem (nivå "fritt"). Guldord = ord som barnet skrev själv.
import { create } from "zustand";
import { ordLista } from "../../tolk/tolka.ts";

export type OrdbokStart = "alla" | "ordjakten" | "guldord";

/** Vilken del av Ordboken som visas först. Min bok sätter den; övriga vägar öppnar hela Ordboken. */
export const useOrdbokStart = create<{ start: OrdbokStart; satt: (s: OrdbokStart) => void }>((set) => ({
  start: "alla",
  satt: (start) => set({ start }),
}));

export type OrdRakning = { skrivord: string[]; skrivordKvar: number; guldord: string[] };

export function raknaOrd(funna: Readonly<Record<string, { guld: boolean }>>, lista = ordLista()): OrdRakning {
  const visa = new Map(lista.map((o) => [o.id, o.visa]));
  const fritt = lista.filter((o) => o.niva === "fritt").map((o) => o.id);
  const skrivord = fritt.filter((id) => funna[id]).map((id) => visa.get(id) ?? id);
  const guldord = Object.entries(funna)
    .filter(([, f]) => f.guld)
    .map(([id]) => visa.get(id) ?? id);
  return { skrivord, skrivordKvar: fritt.length - skrivord.length, guldord };
}
