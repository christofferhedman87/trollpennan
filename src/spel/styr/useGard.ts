import { borjaOmMedKopia, laddaOmRent } from "../start.ts";
import { bestamdHem } from "../bygge.ts";
import { fyll } from "../fyll.ts";
import { ljud } from "../ljud.ts";
import { useMinne } from "../minne.ts";
import * as rostKo from "../rostKo.ts";
import { skapaInstFranKopia, useSkapaInst } from "../skapa/installning.ts";
import { arKopia, exportera } from "../ui/hjalp.ts";
import { FIR, SIDOR, TEXTER } from "../ui/spelData.ts";
import type { SpelKarna } from "./typer.ts";

export function useGard(k: Pick<SpelKarna, "t" | "b" | "v" | "s">) {
  const { setLage, setVisKort, setMeny, boUid, setBoUid, setByggSidaId, kop, setKop, setKopRad, setOnskaOpp, setForalderRad, kopia, setKopia, onskaSkrivRef } = k.t;
  const { visaBanner, visaBubbla, bjud } = k.b;
  const { visaVarld } = k.v;
  const { rensaSkriv } = k.s;

  function forsokKop(slag: "djur" | "bygg", id: string, titel: string, pris: number) {
    setKopRad(null); rostKo.handling();
    if (useMinne.getState().stjarnor < pris) {
      setKopRad(fyll(FIR.stjarnor.for_fa, { n: pris - useMinne.getState().stjarnor }));
      setKop(null);
      return;
    }
    setKop({ slag, id, titel, pris });
  }

  function bekraftaKop() {
    if (!kop) return;
    const ok = kop.slag === "djur" ? useMinne.getState().kopSida(kop.id, kop.pris) : useMinne.getState().kopBygg(kop.id, kop.pris);
    if (ok) {
      ljud.sida();
      visaBanner(fyll(FIR.ny_sida.text, { sida: kop.titel }), "ovr", "tapp");
      if (kop.slag === "bygg") setByggSidaId(kop.id);
      if (kop.slag === "djur") {
        const sida = SIDOR.sidor.find((s) => s.id === kop.id);
        if (sida) visaBanner(sida.oppnas, "ovr", "tapp");
      }
    }
    setKop(null);
  }

  function flyttaInDjur(djurUid: string) {
    if (!boUid) return;
    const djur = useMinne.getState().ang.find((a) => a.uid === djurUid);
    const hem = useMinne.getState().garden.find((b) => b.uid === boUid);
    if (!djur || !hem) return;
    const res = useMinne.getState().flyttaIn(djurUid, boUid);
    if (res === "ok") {
      const rad = TEXTER.bo.flyttar_in[Math.floor(Math.random() * TEXTER.bo.flyttar_in.length)] ?? TEXTER.bo.flyttar_in[0]!;
      visaBubbla(fyll(rad, { djur: djur.formel, hem: bestamdHem(hem) }), hem.x, Math.max(0.1, hem.y - 0.14), false, true);
      bjud("hem", djurUid);
      setBoUid(null);
      setMeny(null);
      return;
    }
    if (res === "full") visaBanner(TEXTER.bo.full, "ovr", "tapp");
    else if (res === "passar") visaBanner(fyll(TEXTER.bo.passar_inte, { djur: djur.formel }), "ovr", "tapp");
    else visaBanner(TEXTER.bo.ingen, "ovr", "tapp");
  }

  function borjaOm() {
    try {
      if (!borjaOmMedKopia(window.localStorage)) { setForalderRad(TEXTER.backup.arkiv_fel); return; }
      laddaOmRent(window.localStorage);
    } catch { setForalderRad(TEXTER.backup.arkiv_fel); }
  }

  function sparaKopia() {
    // Huvudmodellen innehåller marken; separat sparat bokstavsljud kompletterar samma v2-kopia.
    const blob = new Blob([JSON.stringify({ ...exportera(), skapa: { bokstavsljud: useSkapaInst.getState().bokstavsljud } }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trollpennan-kopia.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function lasFil(fil: File) {
    try {
      const json: unknown = JSON.parse(await fil.text());
      if (!arKopia(json) || !skapaInstFranKopia(json.skapa)) {
        setForalderRad(TEXTER.backup.fel);
        setKopia(null);
        return;
      }
      setKopia(json);
      setForalderRad(null);
    } catch {
      setForalderRad(TEXTER.backup.fel);
      setKopia(null);
    }
  }

  function lasInKopia() {
    const skapa = arKopia(kopia) ? skapaInstFranKopia(kopia.skapa) : null;
    if (!skapa || !useMinne.getState().importera(kopia)) {
      setForalderRad(TEXTER.backup.fel);
      setKopia(null);
      return;
    }
    useSkapaInst.getState().sattBokstavsljud(skapa.bokstavsljud);
    ljud.satt(useMinne.getState().effektPa && useMinne.getState().ljudPa);
    setLage(useMinne.getState().startLage);
    rensaSkriv();
    setVisKort(null);
    setOnskaOpp(false);
    onskaSkrivRef.current = false;
    visaVarld("ang");
    setKopia(null);
    setForalderRad(TEXTER.backup.klart);
  }
  return { forsokKop, bekraftaKop, flyttaInDjur, borjaOm, sparaKopia, lasFil, lasInKopia };
}

export type Gard = ReturnType<typeof useGard>;
