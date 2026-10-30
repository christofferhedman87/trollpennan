// Nya Skapa: bilder ur data/skapa-ikoner.json (klistermärkesstilen). Kortbilderna frågar den här tabellen först
// och faller tillbaka på de gamla tabellerna i ui/hjalp.ts.
import ikonJson from "../../../data/skapa-ikoner.json" with { type: "json" };
import { kortIkon } from "../ui/hjalp.ts";
import type { Kalla, Slot } from "./lexikon.ts";

type Tabell = Record<string, string>;
const IK = ikonJson as unknown as {
  ord: Tabell; material: Tabell; delar: Tabell; form: Tabell; ui: Tabell; ordklass: Tabell; sektion: Tabell; grafik: Tabell;
};

export type IkonGrupp = "ui" | "ordklass" | "sektion" | "grafik";

/** En UI-ikon, ett ordklassmärke, en sektionsikon eller en grafik (Pennan, ringen, gnistor). */
export function ikon(grupp: IkonGrupp, namn: string): string {
  return IK[grupp][namn] ?? IK.ui.agg ?? "";
}

/** Bilden på ett ordkort. Samma ord kan vara både färg och material ("guld") eller byggord och del ("torn"). */
export function kortBild(id: string, lex?: Kalla, slot?: Slot): string {
  if (lex === "material" && IK.material[id]) return IK.material[id]!;
  if (lex === "del" && IK.delar[id]) return IK.delar[id]!;
  if (slot === "form" && IK.form[id]) return IK.form[id]!;
  return IK.ord[id] ?? IK.delar[id] ?? IK.material[id] ?? IK.form[id] ?? kortIkon(id) ?? IK.ui.agg ?? "";
}

export function harKortBild(id: string): boolean {
  return Boolean(IK.ord[id] ?? IK.delar[id] ?? IK.material[id] ?? IK.form[id]);
}
