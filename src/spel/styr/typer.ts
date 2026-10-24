import type { SpelTillstand } from "./useSpelTillstand.ts";
import type { Bannrar } from "./useBannrar.ts";
import type { VarldStyr } from "./useVarld.ts";
import type { Aventyr } from "./useAventyr.ts";
import type { Onska } from "./useOnska.ts";

export type { SpelTillstand } from "./useSpelTillstand.ts";

export interface SpelKarna {
  t: SpelTillstand;
  b: Bannrar;
  v: VarldStyr;
  a: Aventyr;
  o: Onska;
}
