import type { SpelTillstand } from "./useSpelTillstand.ts";
import type { Bannrar } from "./useBannrar.ts";

export type { SpelTillstand } from "./useSpelTillstand.ts";

export interface SpelKarna {
  t: SpelTillstand;
  b: Bannrar;
}
