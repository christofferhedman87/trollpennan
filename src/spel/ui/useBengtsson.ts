import { useCallback, useEffect, useRef, useState } from "react";
import { aventyrKvar, aktivtSkrivUppdrag, bengtssonLagen, kravUppfyllt, nastaSkrivUppdrag } from "../uppdragsmotor.ts";
import { klarUppdrag, type FlodeSvar } from "../avflode.ts";
import { useMinne } from "../minne.ts";
import { NPC_DEL, mineVararMs, valjMine } from "../npc.ts";

const NPC_ID = "bengtsson";

type Hjalp = {
  visaBanner: (text: string, slag: "ovr") => void;
  belonaFlode: (r: FlodeSvar) => void;
  oppnaSkapa: () => void;
  oppnaUppdragsbok: () => void;
};

/** Bengtsson på skärmen: vilken mine, vad ett klick gör, och kontrollen av det barnet skrev. All logik som data/motor; här bara limmet. */
export function useBengtsson({ visaBanner, belonaFlode, oppnaSkapa, oppnaUppdragsbok }: Hjalp) {
  const status = useMinne((s) => s.uppdrag);
  const [tillfallig, setTillfallig] = useState<"fel" | "klar_nyss" | null>(null);
  const timer = useRef<number | null>(null);
  const felNr = useRef(0);
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );
  const blinka = useCallback((lage: "fel" | "klar_nyss") => {
    setTillfallig(lage);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setTillfallig(null), mineVararMs(NPC_ID, lage));
  }, []);

  const lagen = [...(tillfallig ? [tillfallig] : []), ...bengtssonLagen(status)];
  const mine = valjMine(NPC_ID, lagen);
  const nytt = !aktivtSkrivUppdrag(status) && !!nastaSkrivUppdrag(status);

  function klicka() {
    const s = useMinne.getState().uppdrag;
    if (aktivtSkrivUppdrag(s)) return oppnaSkapa();
    const nasta = nastaSkrivUppdrag(s);
    if (nasta) {
      useMinne.getState().sattUppdrag(nasta.id, "pagar");
      return oppnaSkapa();
    }
    const rep = NPC_DEL[NPC_ID]?.repliker;
    if (aventyrKvar(s)) {
      if (rep?.bara_aventyr) visaBanner(rep.bara_aventyr, "ovr");
      return oppnaUppdragsbok();
    }
    if (rep?.inga_fler) visaBanner(rep.inga_fler, "ovr");
  }

  /** Anropas när barnet har skrivit något som blev ett djur/ägg. Skapandet sker alltid; här bara uppdraget. */
  function prova(raw: string): "klar" | "fel" | "ingen" {
    const u = aktivtSkrivUppdrag(useMinne.getState().uppdrag);
    if (!u?.krav) return "ingen";
    if (kravUppfyllt(u.krav, raw)) {
      belonaFlode(klarUppdrag(u.id));
      blinka("klar_nyss");
      return "klar";
    }
    const fel = NPC_DEL[NPC_ID]?.repliker?.fel ?? [];
    if (fel.length) visaBanner(fel[felNr.current++ % fel.length]!, "ovr");
    blinka("fel");
    return "fel";
  }

  return { mine, nytt, klicka, prova, npcId: NPC_ID };
}
