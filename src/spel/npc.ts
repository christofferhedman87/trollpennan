// R6A-2: vilken bild (mine) en figur visar. Reglerna är data (data/npc.json `miner`); koden känner inga miner.
import npcJson from "../../data/npc.json" with { type: "json" };

export type NpcDel = {
  namn: string;
  alt: string;
  bilder: Record<string, string>;
  standard: string;
  storlek?: { hojd: string };
  miner: { lage: string; bild: string; varar_ms?: number }[];
  repliker?: { fel?: string[]; inga_fler?: string; bara_aventyr?: string };
};

export const NPC_DEL = npcJson.npc as unknown as Record<string, NpcDel>;

/** Första regeln i `miner` vars läge är aktivt; annars figurens `standard`. */
export function valjMine(npc: string, aktiva: readonly string[]): string {
  const f = NPC_DEL[npc];
  if (!f) return "";
  return f.miner.find((m) => aktiva.includes(m.lage) && f.bilder[m.bild])?.bild ?? f.standard;
}

export function mineUrl(npc: string, mine: string): string {
  return NPC_DEL[npc]?.bilder[mine] ?? "";
}

/** Hur länge en tillfällig mine (läge som fel, klar_nyss) visas, enligt data/npc.json `varar_ms`. */
export function mineVararMs(npc: string, lage: string): number {
  return NPC_DEL[npc]?.miner.find((m) => m.lage === lage)?.varar_ms ?? 4500;
}
