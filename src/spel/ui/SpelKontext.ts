import { createContext, useContext } from "react";
import type { SpelKarna } from "../styr/typer.ts";

export const SpelKontext = createContext<SpelKarna | null>(null);

export function useSpel(): SpelKarna {
  const k = useContext(SpelKontext);
  if (!k) throw new Error("useSpel måste användas inom SpelKontext");
  return k;
}
