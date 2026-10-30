// Platslappen är bokens fallback när barnet skriver fritt på en utflykt.
// Samma inledning används redan vid ankomsten och finns med inspelad röst.
import { platsMed, START_PLATS } from "../platser.ts";

export function platsLapp(id: string): { fran: string; text: string } | null {
  if (id === START_PLATS) return null;
  const plats = platsMed(id);
  const intro = plats?.intro as { text?: unknown } | undefined;
  if (!plats || typeof intro?.text !== "string" || !intro.text.trim()) return null;
  return { fran: plats.namn, text: intro.text };
}
