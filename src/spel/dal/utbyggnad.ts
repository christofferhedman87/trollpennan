// Block 7 (beslut B): stjärnor köper mark. Dalen börjar med åtta öppna tomter; fler öppnas i grupper för stjärnor,
// som utbyggnaderna av ranchen i Slime Rancher. Köpen sparas lokalt i en egen nyckel (inga servrar).
import { create } from "zustand";
import dalenJson from "../../../data/dalen.json" with { type: "json" };

export const UTBYGGNAD = dalenJson.utbyggnader;
const NYCKEL = "trollpennan-dal-v1";

function las(): string[] {
  try {
    const v = JSON.parse(globalThis.localStorage?.getItem(NYCKEL) ?? "null") as { utbyggnader?: unknown } | null;
    return Array.isArray(v?.utbyggnader) ? v.utbyggnader.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export const useDal = create<{ utbyggnader: string[]; kop: (id: string) => void }>((set, get) => ({
  utbyggnader: las(),
  kop: (id) => {
    const utbyggnader = [...new Set([...get().utbyggnader, id])];
    set({ utbyggnader });
    try {
      globalThis.localStorage?.setItem(NYCKEL, JSON.stringify({ utbyggnader }));
    } catch {
      /* privat läge: köpet gäller tills sidan laddas om */
    }
  },
}));

/** Öppna tomter: startmarken och köpta utbyggnader. */
export function oppnaTomter(utbyggnader: readonly string[]): Set<number> {
  const ut = new Set<number>(UTBYGGNAD.oppna_fran_start);
  for (const u of UTBYGGNAD.lista) if (utbyggnader.includes(u.id)) for (const t of u.tomter) ut.add(t);
  return ut;
}

/** Utbyggnaden som en låst tomt hör till. */
export function utbyggnadFor(tomt: number): (typeof UTBYGGNAD.lista)[number] | undefined {
  return UTBYGGNAD.lista.find((u) => u.tomter.includes(tomt));
}
