import { avBro } from "../avbro.ts";
import { TEXTER_AV } from "../aventyr.ts";
import { allaMina } from "../avflode.ts";
import { brygga } from "../brygga.ts";
import { useMinne } from "../minne.ts";
import { TEXTER } from "../ui/spelData.ts";
import type { Varld } from "../ui/typer.ts";
import type { SpelKarna } from "./typer.ts";

export function useVarld(k: Pick<SpelKarna, "t" | "b">) {
  const {
    setSenare, setMenySaker, varldRef, setVarld, setPanel, setMeny, omradeRef, setOmrade,
    setKartaOpp, setForstaRad, setMenyOpp, setLage, setForslag, setBehover, setBokOpp,
  } = k.t;
  const { visaBanner } = k.b;
  function lasMeny() {
    setSenare(true);
    setMenySaker(false);
    requestAnimationFrame(() => {
      document.querySelector("[data-testid=demo-senare]")?.scrollIntoView({ block: "nearest" });
    });
  }
  function visaVarld(p: Varld) {
    varldRef.current = p;
    setVarld(p);
    setPanel("spel");
    setMeny(null);
    if (!omradeRef.current) brygga.visa(p);
  }
  function lamnaAv() {
    omradeRef.current = null;
    setOmrade(null);
    synkaAv(null);
  }
  function synkaAv(plats: string | null) {
    const s = useMinne.getState();
    const folje = allaMina().find((d) => d.uid === s.foljeUid) ?? null;
    avBro.satt({
      plats,
      folje,
      van: s.van,
      uppdrag: s.uppdrag,
      fyr: s.fyr,
      on: plats === "on",
    });
    if (!plats) brygga.visa(varldRef.current);
  }
  function oppnaKarta() {
    setPanel("spel");
    setMeny(null);
    setKartaOpp(true);
    if (useMinne.getState().forstaKarta) {
      useMinne.getState().settKarta();
      setForstaRad([TEXTER_AV.forsta_gangen[0]!]);
    }
  }
  function kanskeForstaGard() {
    if (!useMinne.getState().forstaGard) return;
    useMinne.getState().sattForsta();
    for (const rad of TEXTER.forsta_besok) visaBanner(rad, "ovr", "tapp");
  }
  function oppnaBygglage() {
    setKartaOpp(false);
    setMenyOpp(false);
    setMeny(null);
    varldRef.current = "gard";
    setVarld("gard");
    if (omradeRef.current) lamnaAv();
    else brygga.visa("gard");
    setPanel("byggbok");
    setLage("kort");
    setForslag(null);
    setBehover(null);
    setBokOpp(true);
  }
  function oppnaUppdrag() {
    setMenyOpp(false);
    setPanel("uppdrag");
    setBokOpp(true);
  }
  function oppnaSkapa() {
    setPanel("spel");
    setLage("skriv");
    setForslag(null);
    setBehover(null);
    setBokOpp(true);
  }
  function visaPlatsRen(id: "ang" | "gard") {
    setKartaOpp(false);
    setMenyOpp(false);
    if (omradeRef.current) lamnaAv();
    setPanel("spel");
    visaVarld(id);
    setBokOpp(false);
    if (id === "gard") kanskeForstaGard();
  }
  function valjVarld(id: "ang" | "gard" | "byggbok") {
    setKartaOpp(false);
    setMenyOpp(false);
    if (id === "byggbok") {
      oppnaBygglage();
      return;
    }
    if (omradeRef.current) lamnaAv();
    if (id === "gard") {
      visaVarld("gard");
      setBokOpp(false);
      kanskeForstaGard();
      return;
    }
    visaVarld("ang");
    setBokOpp(false);
  }
  return {
    lasMeny, visaVarld, lamnaAv, synkaAv, oppnaKarta, kanskeForstaGard, oppnaBygglage, oppnaUppdrag,
    oppnaSkapa, visaPlatsRen, valjVarld,
  };
}

export type VarldStyr = ReturnType<typeof useVarld>;
