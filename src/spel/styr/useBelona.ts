import { ordLista } from "@/tolk/tolka.ts";
import { brygga } from "../brygga.ts";
import { fyll } from "../fyll.ts";
import { ljud } from "../ljud.ts";
import { type OnskaSpar, useMinne } from "../minne.ts";
import { ordVis } from "../ui/hjalp.ts";
import { FIR, SIDOR } from "../ui/spelData.ts";
import type { SpelKarna } from "./typer.ts";

export function useBelona(k: Pick<SpelKarna, "t" | "b">) {
  const { onskaSkrivRef, setOnskaOpp, setOnskaSyns, setBokOpp } = k.t;
  const { visaBanner, visaMossa, visaBubbla } = k.b;
  function kollaSidor() {
    const s = useMinne.getState();
    for (const sida of SIDOR.sidor) {
      if (!s.koptaSidor.includes(sida.id) || s.sidaKlar.includes(sida.id)) continue;
      if (!sida.ord.every((id) => s.funna[id])) continue;
      s.markeraSida(sida.id);
      s.geStjarnor(FIR.sida_klar.stjarnor);
      ljud.stjarna();
      visaBanner(fyll(FIR.sida_klar.text, { sida: sida.titel }), "ovr", "sida_klar");
    }
    const fritt = ordLista().filter((o) => o.niva === "fritt");
    if (fritt.length && fritt.every((o) => useMinne.getState().funna[o.id]) && !useMinne.getState().sidaKlar.includes("bok")) {
      useMinne.getState().markeraSida("bok");
      visaBanner(FIR.bok_klar.text, "ovr", "sida_klar");
    }
  }
  function belona(u: { funna: string[]; guld: string[] }, glitterUid?: string, firaguld = true) {
    const guldLista = firaguld ? u.guld : [];
    const innan = useMinne.getState().funna;
    const nyaGuld = guldLista.filter((id) => !innan[id]?.guld);
    const nyaHemliga = u.funna.filter((id) => !innan[id] && ordLista().find((o) => o.id === id)?.niva === "fritt");
    useMinne.getState().registrera(u.funna, guldLista);
    let stj = 0;
    if (nyaGuld.length) {
      stj += nyaGuld.length * FIR.guldord.stjarnor;
      visaBanner(fyll(FIR.guldord.text[0]!, { ord: ordVis(nyaGuld[0]!) }), "ovr", "guldord");
      ljud.guld();
      if (glitterUid) brygga.glitter(glitterUid);
      visaMossa({ guld: nyaGuld.length });
    }
    if (nyaHemliga.length) {
      stj += nyaHemliga.length * FIR.hemligt_ord.stjarnor;
      visaBanner(fyll(FIR.hemligt_ord.text[0]!, { ord: ordVis(nyaHemliga[0]!) }), "ovr", "hemligt_ord");
      visaMossa({ hemligt: nyaHemliga.length });
    }
    if (stj > 0) {
      useMinne.getState().geStjarnor(stj);
      ljud.stjarna();
      visaBanner(stj === 1 ? FIR.stjarnor.fa_en : fyll(FIR.stjarnor.fa, { n: stj }), "ovr", "stjarnor");
    }
    kollaSidor();
  }
  function uppfyll(o: OnskaSpar, tack: string, stj: number, uid: string, x = 0.5, y = 0.35) {
    useMinne.getState().geStjarnor(stj);
    useMinne.getState().sattOnska(null);
    useMinne.setState({ onskanAntal: useMinne.getState().onskanAntal + 1 });
    useMinne.getState().noteraOnska();
    onskaSkrivRef.current = false;
    setOnskaOpp(false);
    setOnskaSyns(false);
    setBokOpp(false);
    ljud.uppfylld();
    ljud.stjarna();
    brygga.glad(uid);
    const p = brygga.platser().find((q) => q.uid === uid);
    visaBubbla(tack, p?.x ?? x, p?.topp ?? p?.y ?? y, false, true, false, "uppfyll_tack");
    visaBanner(stj === 1 ? FIR.stjarnor.fa_en : fyll(FIR.stjarnor.fa, { n: stj }), "ovr", "stjarnor");
    visaMossa({ onskan: 1 });
  }
  return { kollaSidor, belona, uppfyll };
}

export type Belona = ReturnType<typeof useBelona>;
