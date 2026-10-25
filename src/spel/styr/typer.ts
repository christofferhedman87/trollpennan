import type { SpelTillstand } from "./useSpelTillstand.ts";
import type { Bannrar } from "./useBannrar.ts";
import type { VarldStyr } from "./useVarld.ts";
import type { Aventyr } from "./useAventyr.ts";
import type { Onska } from "./useOnska.ts";
import type { Belona } from "./useBelona.ts";
import type { Skapa } from "./useSkapa.ts";
import type { Gard } from "./useGard.ts";
import type { Skriv } from "./useSkriv.ts";
import type { VyData } from "./useVyData.ts";

export type { SpelTillstand } from "./useSpelTillstand.ts";

export interface SpelKarna {
  t: SpelTillstand;
  b: Bannrar;
  v: VarldStyr;
  a: Aventyr;
  o: Onska;
  be: Belona;
  s: Skapa;
  g: Gard;
  sk: Skriv;
  vy: VyData;
}
