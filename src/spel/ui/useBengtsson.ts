import { useCallback, useEffect, useRef, useState } from "react";
import entiteterJson from "../../../data/entiteter.json" with { type: "json" };
import { tolkaMedReserv } from "../../tolk/reserv.ts";
import { TAKT, aventyrKvar, aktivtSkrivUppdrag, bengtssonLagen, kravUppfylltTolkat, nastaSkrivUppdrag, sekTillRedo } from "../uppdragsmotor.ts";
import { arFinal, mattUr, milstolpeNadd, platsMed } from "../platser.ts";
import npcJson from "../../../data/npc.json" with { type: "json" };
import { klarUppdrag, type FlodeSvar } from "../avflode.ts";
import { useMinne } from "../minne.ts";
import type { Kalla } from "../rostKo.ts";
import { NPC_DEL, mineVararMs, valjMine } from "../npc.ts";

const NPC_ID = "bengtsson";
const REPLIKER_PLATS = (npcJson as { repliker_plats?: Record<string, { glad?: string[] }> }).repliker_plats ?? {};
const ENT = (entiteterJson as { entiteter: Record<string, { typ?: string }> }).entiteter;

/** B1.2: platsen barnet är på (minne.plats när det finns, annars ängen). */
export const platsNu = (): string => (useMinne.getState() as { plats?: string }).plats ?? "ang";

/** B1.2: blev det barnet skrev ett djur (entitetens typ i data/entiteter.json)? */
function blevDjur(raw: string): boolean {
  const t = tolkaMedReserv(raw);
  return t.typ === "skapad" && ENT[t.varelse.kropp]?.typ === "djur";
}

type Hjalp = {
  visaBanner: (text: string, slag: "ovr", kalla: Kalla) => void;
  belonaFlode: (r: FlodeSvar) => void;
  oppnaSkapa: () => void;
  oppnaUppdragsbok: () => void;
};

/** Bengtsson på skärmen: vilken mine, vad ett klick gör, och kontrollen av det barnet skrev. All logik som data/motor; här bara limmet. */
export function useBengtsson({ visaBanner, belonaFlode, oppnaUppdragsbok }: Hjalp) {
  const status = useMinne((s) => s.uppdrag);
  const [tillfallig, setTillfallig] = useState<"fel" | "klar_nyss" | null>(null);
  const timer = useRef<number | null>(null);
  const djur = useMinne((s) => s.ang.length);
  const start = useRef(Date.now());
  const klartVid = useRef<number | null>(null);
  const [, ritaOm] = useState(0);
  const felNr = useRef(0);
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );
  const plats = platsNu();
  const finalOk = milstolpeNadd(plats, mattUr(useMinne.getState()));
  const sek = sekTillRedo(
    status,
    {
      djur,
      spelSek: (Date.now() - start.current) / 1000,
      sekSedanKlart: klartVid.current === null ? null : (Date.now() - klartVid.current) / 1000,
    },
    TAKT,
    plats,
    finalOk,
  );
  // en enda timer som väcker komponenten när väntetiden är slut (ingen tick per sekund)
  useEffect(() => {
    if (sek === null || sek <= 0) return;
    const t = window.setTimeout(() => ritaOm((n) => n + 1), sek * 1000 + 60);
    return () => window.clearTimeout(t);
  }, [sek]);
  const blinka = useCallback((lage: "fel" | "klar_nyss") => {
    setTillfallig(lage);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setTillfallig(null), mineVararMs(NPC_ID, lage));
  }, []);

  const lagen = [...(tillfallig ? [tillfallig] : []), ...bengtssonLagen(status)];
  const mine = valjMine(NPC_ID, lagen);
  const nytt = sek === 0;
  const synlig = nytt || !!aktivtSkrivUppdrag(status, plats) || tillfallig !== null;

  function klicka() {
    const s = useMinne.getState().uppdrag;
    const pl = platsNu();
    const fo = milstolpeNadd(pl, mattUr(useMinne.getState()));
    if (aktivtSkrivUppdrag(s, pl)) return oppnaUppdragsbok();
    const nasta = nastaSkrivUppdrag(s, pl, fo);
    if (nasta) {
      // B6.2: final_fore (data/platser.json) – Bengtssons replik när finalen öppnas
      const fore = arFinal(nasta) ? platsMed(pl)?.final_fore?.text : undefined;
      if (fore) visaBanner(fore, "ovr", "tapp");
      useMinne.getState().sattUppdrag(nasta.id, "pagar");
      return oppnaUppdragsbok();
    }
    const glad = REPLIKER_PLATS[pl]?.glad;
    if (glad?.length) {
      visaBanner(glad[Math.floor(Math.random() * glad.length)]!, "ovr", "tapp");
      return;
    }
    const rep = NPC_DEL[NPC_ID]?.repliker;
    if (aventyrKvar(s)) {
      if (rep?.bara_aventyr) visaBanner(rep.bara_aventyr, "ovr", "tapp");
      return oppnaUppdragsbok();
    }
    if (rep?.inga_fler) visaBanner(rep.inga_fler, "ovr", "tapp");
  }

  /** Anropas när barnet har skrivit något som blev ett djur/ägg. Skapandet sker alltid; här bara uppdraget. */
  function prova(raw: string): "klar" | "fel" | "ingen" {
    const u = aktivtSkrivUppdrag(useMinne.getState().uppdrag, platsNu());
    if (!u?.krav) return "ingen";
    if (kravUppfylltTolkat(u.krav, raw, !u.krav.djur || blevDjur(raw))) {
      belonaFlode(klarUppdrag(u.id));
      klartVid.current = Date.now();
      blinka("klar_nyss");
      return "klar";
    }
    const fel = NPC_DEL[NPC_ID]?.repliker?.fel ?? [];
    if (u.nastan) visaBanner(u.nastan, "ovr", "bengtsson_fel");
    else if (fel.length) visaBanner(fel[felNr.current++ % fel.length]!, "ovr", "bengtsson_fel");
    blinka("fel");
    return "fel";
  }

  /** R9D: speltid och tid sedan klart uppdrag, för önskningarnas takt. */
  const matt = () => ({
    spelSek: (Date.now() - start.current) / 1000,
    sekSedanKlart: klartVid.current === null ? null : (Date.now() - klartVid.current) / 1000,
  });

  const visaFel = () => blinka("fel");
  useEffect(() => {
    window.addEventListener("troll-npc-klick", klicka);
    return () => window.removeEventListener("troll-npc-klick", klicka);
  });
  return { mine, nytt, synlig, klicka, prova, matt, visaFel, npcId: NPC_ID, ikonText: TAKT.ikon_text, ikonAlt: TAKT.ikon_alt };
}
