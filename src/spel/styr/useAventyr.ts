import { harTagg, OMR, omradeMed, TEXTER_AV, UPP } from "../aventyr.ts";
import { allaMina, djurSomKan, type FlodeSvar, foljeNu, forsokOn, forsokPlats, oppnaBro, oppnaMed, oppnaOn, skickaDjur, startaForPlats } from "../avflode.ts";
import { brygga } from "../brygga.ts";
import { fyll } from "../fyll.ts";
import { ljud } from "../ljud.ts";
import { useMinne } from "../minne.ts";
import { FIR } from "../ui/spelData.ts";
import { useBengtsson } from "../ui/useBengtsson.ts";
import { usePlats } from "../ui/usePlats.ts";
import type { SpelKarna } from "./typer.ts";

export function useAventyr(k: Pick<SpelKarna, "t" | "b" | "v">) {
  const {
    setGavaTill, gavaRef, omradeRef, setKartaOpp, setPanel, vantarRef, setOmrade, setKartaText,
    setLage, setHand, setBokOpp, valjKor, setValj,
  } = k.t;
  const { visaBanner, bjud, visaMossa } = k.b;
  const { lamnaAv, visaVarld, synkaAv, valjVarld, oppnaSkapa, oppnaUppdrag } = k.v;
  function belonaFlode(r: FlodeSvar) {
    for (const t of r.texter) if (t) visaBanner(t, "ovr", "uppdrag_klart");
    if (r.stj > 0) {
      useMinne.getState().geStjarnor(r.stj);
      ljud.stjarna();
      visaBanner(r.stj === 1 ? FIR.stjarnor.fa_en : fyll(FIR.stjarnor.fa, { n: r.stj }), "ovr", "stjarnor");
    }
    if (r.hem && r.sparad) {
      setGavaTill(null);
      gavaRef.current = null;
      lamnaAv();
      visaVarld("ang");
      brygga.skapa(r.sparad, true);
      return;
    }
    if (omradeRef.current) synkaAv(omradeRef.current);
  }
  function gaIn(id: string) {
    setKartaOpp(false);
    setPanel("spel");
    setGavaTill(null);
    gavaRef.current = null;
    vantarRef.current = null;
    omradeRef.current = id;
    setOmrade(id);
    for (const t of startaForPlats(id)) visaBanner(t, "ovr", "tapp");
    if (id === "grottan") {
      const inne = omradeMed("grottan")?.inne;
      const f = foljeNu();
      if (inne && f && harTagg(f, "lysa")) visaBanner(fyll(inne.klart, { djur: f.formel }), "ovr", "tapp");
      else if (inne) visaBanner(inne.text, "ovr", "tapp");
    }
    synkaAv(id);
    const folje = foljeNu();
    if (folje) {
      bjud("aventyr", folje.uid);
      visaMossa({ aventyr: true });
    }
  }
  function tryckPlats(id: string) {
    if (id === "garden") {
      setKartaOpp(false);
      setKartaText(null);
      lamnaAv();
      valjVarld("gard");
      return;
    }
    const s = forsokPlats(id);
    if (s.typ === "nas") return;
    if (s.typ === "in") {
      gaIn(s.id);
      return;
    }
    if (s.typ === "bro") {
      oppnaBro(id);
      visaBanner(s.text, "ovr", "tapp");
      gaIn(id);
      return;
    }
    if (s.typ === "inga") {
      visaBanner(s.text, "ovr", "tapp");
      setKartaText(s.text);
      vantarRef.current = { slag: "oppna", omrade: id, taggar: s.taggar };
      setLage("skriv");
      setHand(true);
      setKartaOpp(false);
      setBokOpp(true);
      return;
    }
    const kan = s.taggar.map((t) => OMR.karta.kan_text[t] ?? t).join(" ");
    setKartaText(s.text);
    vantarRef.current = { slag: "oppna", omrade: id, taggar: s.taggar };
    valjKor.current = (d) => {
      setValj(null);
      vantarRef.current = null;
      visaBanner(oppnaMed(id, d), "ovr", "tapp");
      gaIn(id);
    };
    setValj({ rubrik: fyll(OMR.karta.valj_djur, { kan }), eller: s.eller, djur: s.djur, nyckel: id });
  }
  function tryckOn() {
    const s = forsokOn();
    if (s.typ === "in") {
      gaIn("on");
      return;
    }
    if (s.typ === "inga") {
      visaBanner(s.text, "ovr", "tapp");
      vantarRef.current = { slag: "del", taggar: s.taggar };
      setLage("skriv");
      setHand(true);
      setKartaOpp(false);
      setBokOpp(true);
      return;
    }
    if (s.typ !== "valj") return;
    const kan = s.taggar.map((t) => OMR.karta.kan_text[t] ?? t).join(" ");
    vantarRef.current = { slag: "del", taggar: s.taggar };
    valjKor.current = (d) => {
      setValj(null);
      vantarRef.current = null;
      visaBanner(oppnaOn(d), "ovr", "tapp");
      gaIn("on");
    };
    setValj({ rubrik: fyll(OMR.karta.valj_djur, { kan }), eller: s.eller, djur: s.djur, nyckel: "on" });
  }
  function oppnaSkicka(uppId: string) {
    const tagg = UPP.uppdrag.find((u) => u.id === uppId)?.mal.skicka_tagg;
    if (!tagg || useMinne.getState().uppdrag[uppId] === "klar") return;
    if (!useMinne.getState().uppdrag[uppId]) useMinne.getState().sattUppdrag(uppId, "pagar");
    const lista = djurSomKan([tagg]);
    const kan = OMR.karta.kan_text[tagg] ?? tagg;
    if (!lista.length) {
      const text = fyll(OMR.karta.inget_djur, { kan });
      visaBanner(text, "ovr", "tapp");
      vantarRef.current = { slag: "skicka", uppdrag: uppId, taggar: [tagg] };
      setLage("skriv");
      setHand(true);
      setKartaOpp(false);
      setBokOpp(true);
      return;
    }
    valjKor.current = (d) => {
      setValj(null);
      const r = skickaDjur(uppId, d);
      if (r) belonaFlode(r);
    };
    setValj({ rubrik: fyll(OMR.karta.valj_djur, { kan }), djur: lista, nyckel: uppId });
  }
  function bytFolje() {
    const djur = allaMina();
    valjKor.current = (d) => {
      setValj(null);
      useMinne.getState().sattFolje(d.uid);
      const o = omradeRef.current;
      if (o === "grottan") {
        const inne = omradeMed("grottan")?.inne;
        if (inne && harTagg(d, "lysa")) visaBanner(fyll(inne.klart, { djur: d.formel }), "ovr", "tapp");
      }
      if (o) synkaAv(o);
      visaBanner(fyll(TEXTER_AV.foljeslagare.foljer, { djur: d.formel }), "ovr", "tapp");
    };
    setValj({ rubrik: TEXTER_AV.foljeslagare.byt, djur, nyckel: "byt" });
  }
  const bengtsson = useBengtsson({ visaBanner, belonaFlode, oppnaSkapa, oppnaUppdragsbok: oppnaUppdrag });
  const platsUi = usePlats({ visaFel: () => bengtsson.visaFel(), tillGard: () => valjVarld("gard") });
  return { belonaFlode, gaIn, tryckPlats, tryckOn, oppnaSkicka, bytFolje, bengtsson, platsUi };
}

export type Aventyr = ReturnType<typeof useAventyr>;
