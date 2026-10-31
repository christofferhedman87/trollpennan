// Frivillig Gåta-knapp: samma hemliga ord och urval som Ledtrådsytan, oberoende av Idé.
import { aktivGata } from "../../gata.ts";
import { aktuellLasniva, lasnivaUrval, ledtradsSteg } from "../../lasniva.ts";
import { useMinne } from "../../minne.ts";
import { platsMed } from "../../platser.ts";
import { LED } from "../spelData.ts";
import { hemligaDjur } from "../hemliga.ts";

export type IdeLapp = { slag: "mal"; fras: string } | { slag: "bild"; ide: string[] } | { slag: "gata"; id: string; gata: string; streck: string };

export function nyGata(): IdeLapp | null {
  const s = useMinne.getState();
  const alla = hemligaDjur();
  const hittade = alla.filter((o) => Boolean(s.funna[o.id])).map((o) => o.id);
  const ohittade = alla.filter((o) => !s.funna[o.id]).map((o) => o.id);
  const niva = aktuellLasniva(hittade, s.lasnivaVal);
  const id = aktivGata(lasnivaUrval(ohittade, platsMed(s.plats)?.hemliga, niva), s.gataId);
  const gata = id ? LED[id]?.gata : undefined;
  const steg = id ? ledtradsSteg(id, 0) : null;
  if (!id || !gata || !steg) return null;
  if (id !== s.gataId) s.sattGataId(id);
  return { slag: "gata", id, gata, streck: steg.streck };
}
