// Block 5 (bygga i världen): "Bygg själv" i Byggboken. Barnet väljer kort (vad, ser ut som, av, med) och ser
// meningen växa. Meningen sätts ihop av orden på korten och går genom byggtolken, som böjer allt rätt
// ("ett rosa hus" → "ett rosa hus", "en röd lada" men "ett rött hus"). Ren logik, testas.
import dalenJson from "../../../data/dalen.json" with { type: "json" };
import { tolkaByggFormel } from "../../tolk/byggform.ts";

export const BYGGBOK = dalenJson.byggbok;

export type ByggVal = { funktion: string; form: string | null; material: string | null; farg: string | null; del: string | null; egenskap: string | null };

export const START_VAL: ByggVal = { funktion: BYGGBOK.funktioner[0]![1], form: null, material: null, farg: null, del: null, egenskap: null };

/** Barnets mening ur korten, i den ordning en svensk mening har: artikel, egenskap, färg, byggord, material, form, delar. */
export function raFras(v: ByggVal): string {
  const [art, ...rest] = v.funktion.split(" ");
  const delar = [art, v.egenskap, v.farg, rest.join(" ")];
  if (v.material) delar.push("av", v.material);
  if (v.form) delar.push("som ser ut som", v.form);
  if (v.del) delar.push("med", v.del);
  return delar.filter(Boolean).join(" ");
}

/** Meningen som spelet visar och bygger: byggtolkens formel (rätt böjd), eller råmeningen om tolken inte förstod. */
export function byggMening(v: ByggVal): string {
  const fras = raFras(v);
  const u = tolkaByggFormel(fras);
  return u.typ === "bygge" ? u.formel : fras;
}
