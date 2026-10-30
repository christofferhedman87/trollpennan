// Nya Skapa 6.9: idétärningen skriver aldrig åt barnet. Den visar en bildgåta (2–4 bilder) och läser upp meningen;
// barnet skriver själv, och varje bild bockas av när ordet finns i meningen.
import uiJson from "../../../data/skapa-ui.json" with { type: "json" };
import { egenskapKort, formKort, hylla, kortFor, type HyllKort } from "./hjalpord.ts";
import { laggKort } from "./insattning.ts";
import { BYGG_DELAR, BYGG_MATERIAL, BYGG_ORD, EGENSKAPER } from "./lexikon.ts";
import type { MOrd } from "./mening.ts";

const IDEER = (uiJson as unknown as { idetarning: { ideer: string[][] } }).idetarning.ideer;

/** Korten i en idé, tolkade i sitt sammanhang: i ett bygge är "slott" en form och "torn" en del. */
export function ideKort(ide: readonly string[]): HyllKort[] {
  const [forst, ...rest] = ide;
  const bygg = BYGG_ORD.some((b) => b.id === forst);
  const ut: HyllKort[] = [];
  const vad = bygg ? kortFor(forst!, "vad", "bygg") : kortFor(forst!, "vad", "ord");
  if (vad) ut.push(vad);
  for (const id of rest) {
    let k: HyllKort | null = null;
    if (bygg) {
      if (BYGG_DELAR.some((d) => d.id === id)) k = kortFor(id, "har", "del");
      else if (BYGG_MATERIAL.some((m) => m.id === id)) k = kortFor(id, "material", "material");
      else if (EGENSKAPER.some((e) => e.id === id)) k = egenskapKort(id);
      else if (BYGG_ORD.some((b) => b.id === id)) k = formKort(id);
    }
    k ??= hylla("djur").flatMap((s) => s.kort).find((x) => x.id === id) ?? kortFor(id, "vad", "ord");
    if (k) ut.push(k);
  }
  return ut;
}

/** Meningen som tärningen läser upp, byggd med samma insättningsregler som hjälpkorten. */
export function ideText(ide: readonly string[]): string {
  let ord: MOrd[] = [];
  for (const k of ideKort(ide)) ord = laggKort(ord, k).ord;
  return ord.map((o) => o.t).join(" ");
}

export function nyIde(forra?: readonly string[] | null): string[] {
  for (let n = 0; n < 6; n++) {
    const ide = IDEER[Math.floor(Math.random() * IDEER.length)]!;
    if (!forra || ide.join() !== forra.join()) return ide;
  }
  return IDEER[0]!;
}
