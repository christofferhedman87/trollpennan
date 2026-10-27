import { useCallback, useRef, useState } from "react";
import type { VagvisarePlatsId, VagvisareSkarmPunkt } from "../ang/Vagvisare3D.tsx";
import { utforPlatsResaV09, type ResBeroenden } from "./resAdapterV09.ts";
import { useResOvergangV09 } from "./ResOvergangV09.tsx";

export function useVagvisareResaV09(b: ResBeroenden) {
  const [vagvisarePunkter, setVagvisarePunkter] = useState<VagvisareSkarmPunkt[]>([]);
  const bRef = useRef(b);
  bRef.current = b;
  const paResaKlar = useCallback((mal: VagvisarePlatsId) => {
    utforPlatsResaV09(mal, bRef.current);
  }, []);
  const resa = useResOvergangV09({ paResaKlar });
  return {
    vagvisarePunkter,
    setVagvisarePunkter,
    mal: resa.mal,
    startaResa: resa.startaResa,
    hoppaOver: resa.hoppaOver,
  };
}
