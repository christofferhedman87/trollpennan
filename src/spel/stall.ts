// R9G: stallet – barnets djur som flyttats bort från en plats och kan hämtas igen. Ren logik (ingen React/Zustand), testas i Node.
// Gäller ängen (`ang`), gården (`hemma`) och alla andra platser (`platsSkapelser`). Taket per plats är TAK_PER_PLATS (platser.ts).
import type { Sparad } from "./brygga.ts";
import type { SparatBygge } from "./bygge.ts";
import { START_PLATS, TAK_PER_PLATS } from "./platser.ts";

export const STALL_MAX = 40;
export type StallUt = "ok" | "full" | "saknas";

type Lager = {
  plats: string;
  ang: Sparad[];
  hemma: { spec: Sparad; hem: string }[];
  platsSkapelser: Record<string, Sparad[]>;
  garden: SparatBygge[];
  stall: Sparad[];
  foljeUid: string | null;
};

/** Ny delmängd av sparningen när djuret `uid` flyttas till stallet, eller null om det inte finns någonstans. */
export function flyttaTillStall(d: Lager, uid: string): Partial<Lager> | null {
  const iAng = d.ang.find((a) => a.uid === uid);
  const iHem = d.hemma.find((h) => h.spec.uid === uid)?.spec;
  const platsId = Object.keys(d.platsSkapelser).find((k) => d.platsSkapelser[k]!.some((a) => a.uid === uid));
  const iPlats = platsId ? d.platsSkapelser[platsId]!.find((a) => a.uid === uid) : undefined;
  const djur = iAng ?? iHem ?? iPlats;
  if (!djur) return null;
  const ut: Partial<Lager> = {
    stall: [...d.stall.filter((s) => s.uid !== uid), djur].slice(-STALL_MAX),
    foljeUid: d.foljeUid === uid ? null : d.foljeUid,
  };
  if (iAng) ut.ang = d.ang.filter((a) => a.uid !== uid);
  if (iHem) {
    ut.hemma = d.hemma.filter((h) => h.spec.uid !== uid);
    ut.garden = d.garden.map((b) => (b.boende.includes(uid) ? { ...b, boende: b.boende.filter((x) => x !== uid) } : b));
  }
  if (platsId) ut.platsSkapelser = { ...d.platsSkapelser, [platsId]: d.platsSkapelser[platsId]!.filter((a) => a.uid !== uid) };
  return ut;
}

/** Hämta djuret till platsen barnet står på. "full" när platsen redan har TAK_PER_PLATS skapelser. */
export function hamtaFranStall(
  d: Lager,
  uid: string,
  tak = TAK_PER_PLATS,
): { status: "ok"; andring: Partial<Lager>; djur: Sparad } | { status: "full" | "saknas" } {
  const djur = d.stall.find((s) => s.uid === uid);
  if (!djur) return { status: "saknas" };
  const ut = { ...djur, skapad: Date.now() };
  const stall = d.stall.filter((s) => s.uid !== uid);
  if (d.plats === START_PLATS) {
    if (d.ang.length >= tak) return { status: "full" };
    return { status: "ok", andring: { stall, ang: [...d.ang, ut] }, djur: ut };
  }
  const lista = d.platsSkapelser[d.plats] ?? [];
  if (lista.length >= tak) return { status: "full" };
  return { status: "ok", andring: { stall, platsSkapelser: { ...d.platsSkapelser, [d.plats]: [...lista, ut] } }, djur: ut };
}
