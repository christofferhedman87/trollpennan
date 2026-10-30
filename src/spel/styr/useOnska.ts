import { useEffect } from "react";
import { ordLista } from "@/tolk/tolka.ts";
import { useMinne } from "../minne.ts";
import { bastaFlik, exempelFor, kortForExempel } from "../ui/hjalp.ts";
import { aktivtSkrivUppdrag } from "../uppdragsmotor.ts";
import type { SpelKarna } from "./typer.ts";

export function useOnska(k: Pick<SpelKarna, "t" | "v">) {
  const {
    uppdragSpar, onskaSkrivRef, setOnskaOpp, setOnskaSyns, varldRef, setBokOpp, setPanel,
    setByggPuff, setMenyOpp, setLage, setFlik,
  } = k.t;
  const { kanskeForstaGard } = k.v;
  // R9D: när Bengtssons uppdrag startar tas en djurönskan bort, så att boken bara visar ett uppdrag och förslagen hör till det
  const pagarId = aktivtSkrivUppdrag(uppdragSpar)?.id;
  useEffect(() => {
    if (!pagarId) return;
    const o = useMinne.getState().onskan;
    if (!o || o.kalla !== "djur") return;
    useMinne.getState().sattOnska(null);
    onskaSkrivRef.current = false;
    setOnskaOpp(false);
    setOnskaSyns(false);
  }, [pagarId]);
  function stangBok() {
    const paGard = varldRef.current === "gard";
    setBokOpp(false);
    setPanel("spel");
    setByggPuff(null);
    stangOnska();
    if (paGard) kanskeForstaGard();
  }
  function oppnaOnska() {
    const o = useMinne.getState().onskan;
    if (!o) return;
    setOnskaOpp(true);
    setBokOpp(true);
    setMenyOpp(false);
    const ex = exempelFor(o);
    const traff = kortForExempel(ex, ordLista());
    if (o.kalla === "bygg") {
      // Nya Skapa: byggönskan skrivs i samma bok som allt annat, med önskan som lapp.
      onskaSkrivRef.current = false;
      setPanel("spel");
      return;
    }
    setPanel("spel");
    onskaSkrivRef.current = o.typ === "ge";
    if (traff.length) {
      setLage("kort");
      setFlik(bastaFlik(traff));
    } else setLage("skriv");
  }
  function stangOnska() {
    onskaSkrivRef.current = false;
    setOnskaOpp(false);
  }
  return { pagarId, stangBok, oppnaOnska, stangOnska };
}

export type Onska = ReturnType<typeof useOnska>;
