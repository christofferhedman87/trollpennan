// Stjärnor och köpt mark sparas i samma atomära v2-skrivning. useDal är kvar som UI-fasad.
import { create } from "zustand";
import dalenJson from "../../../data/dalen.json" with { type: "json" };
import { publiceraSparat, useMinne } from "../minne.ts";
import { arDal, dalFranSparning } from "./markSparning.ts";

export const UTBYGGNAD = dalenJson.utbyggnader;

export const useDal = create<{ utbyggnader: string[]; kop: (id: string) => boolean; ersatt: (lista: unknown) => void }>(() => ({
  utbyggnader: useMinne.getState().dal.utbyggnader,
  /** Kompatibilitet för befintliga anrop: ersätter endast i huvudmodellen, aldrig äldre lokal mark. */
  ersatt: (lista) => {
    const raw = { utbyggnader: lista };
    if (arDal(raw)) useMinne.setState({ dal: dalFranSparning(raw) });
  },
  kop: (id) => {
    const s = useMinne.getState();
    const u = UTBYGGNAD.lista.find((rad) => rad.id === id);
    if (!u || s.dal.utbyggnader.includes(id) || !Number.isFinite(s.stjarnor) || s.stjarnor < u.pris) return false;
    // Ingen mutation, signal eller debitering sker innan den enda hållbara skrivningen lyckats.
    return publiceraSparat({ stjarnor: s.stjarnor - u.pris, dal: { utbyggnader: [...s.dal.utbyggnader, id] } });
  },
}));

useMinne.subscribe((s) => {
  if (s.dal.utbyggnader !== useDal.getState().utbyggnader) useDal.setState({ utbyggnader: s.dal.utbyggnader });
});

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
