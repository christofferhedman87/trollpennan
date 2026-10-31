import { useSyncExternalStore } from "react";
import { lyssnaKopia, senasteKopia } from "../lagringsSkydd.ts";
import { fyll } from "../fyll.ts";
import { TEXTER } from "./spelData.ts";
export function ForalderLagring() {
  const tid = useSyncExternalStore(lyssnaKopia, senasteKopia, () => null);
  return <section data-lagring="skydd">
    <h3>{TEXTER.backup.skydd_rubrik}</h3>
    <p>{TEXTER.backup.skydd_hjalp}</p>
    <p>{TEXTER.backup.hemskarm}</p>
    <p data-lagring="senaste">{tid ? fyll(TEXTER.backup.senaste, { datum: new Date(tid).toLocaleString("sv-SE") }) : TEXTER.backup.ingen_kopia}</p>
    <p>{TEXTER.backup.datum_hjalp}</p>
  </section>;
}
