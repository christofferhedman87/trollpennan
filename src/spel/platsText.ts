// R9K: repliker som nämner platsen skrivs med platshållare, "{Platsen} är finast när du är här." / "hela {platsen}",
// och fylls här med platsen barnet är på (namnet i data/platser.json, Gården på gården). Fungerar för alla platser.
import gardJson from "../../data/texter-gard.json" with { type: "json" };
import { useMinne } from "./minne.ts";
import { platsMed } from "./platser.ts";

export function platsNamn(varld: string = "ang", plats?: string): string {
  if (varld === "gard") return gardJson.flikar.garden;
  const id = plats ?? useMinne.getState().plats ?? "ang";
  return platsMed(id)?.namn ?? platsMed("ang")?.namn ?? "";
}

/** "{Platsen}" → "Grottan", "{platsen}" → "grottan". Text utan platshållare kommer tillbaka orörd. */
export function platsText(text: string, varld: string = "ang", plats?: string): string {
  if (!text.includes("{")) return text;
  const namn = platsNamn(varld, plats);
  return text.replaceAll("{Platsen}", namn).replaceAll("{platsen}", namn.toLocaleLowerCase("sv"));
}
