// Samma uid hittar samma djur på ängen, i ett hem och på en utflykt.
import type { Varelse } from "../tolk/typer.ts";
import type { Data } from "./minne.ts";
import { brygga } from "./brygga.ts";
type DjurMinne = Pick<Data, "ang" | "hemma" | "platsSkapelser">;

export function allaVaknaDjur(s: DjurMinne) {
  return [...s.ang, ...s.hemma.map((h) => h.spec), ...Object.values(s.platsSkapelser).flat()];
}

export function djurMedUid(s: DjurMinne, uid: string | undefined) {
  return uid ? allaVaknaDjur(s).find((d) => d.uid === uid) : undefined;
}

export function uppdateraDjurSpar(s: DjurMinne, uid: string, spec: Varelse) {
  const fore = djurMedUid(s, uid);
  if (!fore) return null;
  const djur = { ...fore, ...spec, uid, skapad: fore.skapad, smeknamn: spec.smeknamn ?? fore.smeknamn };
  if (s.ang.some((a) => a.uid === uid)) return { djur, hem: false, patch: { ang: s.ang.map((a) => a.uid === uid ? djur : a) } };
  if (s.hemma.some((h) => h.spec.uid === uid)) return { djur, hem: true, patch: { hemma: s.hemma.map((h) => h.spec.uid === uid ? { ...h, spec: djur } : h) } };
  const plats = Object.keys(s.platsSkapelser).find((p) => s.platsSkapelser[p]!.some((a) => a.uid === uid));
  if (!plats) return null;
  return { djur, hem: false, patch: { platsSkapelser: { ...s.platsSkapelser, [plats]: s.platsSkapelser[plats]!.map((a) => a.uid === uid ? djur : a) } } };
}

export function uppdateraDjurIMinne(s: DjurMinne, uid: string, spec: Varelse, satt: (patch: Partial<Data>) => void) {
  const r = uppdateraDjurSpar(s, uid, spec);
  if (!r) return null;
  satt(r.patch);
  if (r.hem) brygga.synkaGard(); else brygga.andra(r.djur);
  return r.djur;
}
