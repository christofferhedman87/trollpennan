import type { SpelTillstand } from "./useSpelTillstand.ts";
import type { Bannrar } from "./useBannrar.ts";
import type { VarldStyr } from "./useVarld.ts";

export type { SpelTillstand } from "./useSpelTillstand.ts";

export interface SpelKarna {
  t: SpelTillstand;
  b: Bannrar;
  v: VarldStyr;
}
