// Block 1 (En värld): på ängen skrivs både djur och byggen i samma bok. Avgör om en mening ska bli ett bygge på en tomt
// eller gå till djur- och sakvägen som förut. Djur vinner alltid ("en kanin och ett hus" blir inte bara ett hus),
// och små naturord utan byggdetaljer ("en blomma", "ett träd") blir saker på ängen bland djuren, inte hela tomter.
import type { ByggFormUtfall } from "../../tolk/byggform.ts";
import { ordFranForm } from "../../tolk/lexikon.ts";
import dalenJson from "../../../data/dalen.json" with { type: "json" };

const SMASAKER = new Set<string>(dalenJson.smasaker_pa_angen);
const MOTTAGARE = new Set(["åt", "till", "för"]);

export function byggaPaAngen(u: ByggFormUtfall, fras: string): boolean {
  if (u.typ !== "bygge") return false;
  const ord = fras.toLocaleLowerCase("sv").match(/[a-zåäö]+/g) ?? [];
  const harMottagare = ord.some((w) => MOTTAGARE.has(w));
  if (!harMottagare && u.okanda.some((w) => ordFranForm(w)?.klass === "djur")) return false;
  return u.byggen.some((b) => !SMASAKER.has(b.bygg) || !!b.form || !!b.material || b.delar.length > 0 || b.egenskaper.length > 0);
}
