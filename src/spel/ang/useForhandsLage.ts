import { useSyncExternalStore } from "react";
import { forhand } from "../skapa/forhand.ts";
import { lageForVisning } from "../skapa/forhandsLage.ts";
const hamta = () => forhand.lage().placering;

export function useForhandsLage(uid: string, plats: string) {
  useSyncExternalStore(forhand.lyssna, hamta);
  return lageForVisning(uid, plats, forhand.lage());
}
