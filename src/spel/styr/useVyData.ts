import { useEffect } from "react";
import { byggMedId } from "@/tolk/byggtolk.ts";
import { hemligaKvar, tolka } from "@/tolk/tolka.ts";
import { TEXTER_AV } from "../aventyr.ts";
import { fyll } from "../fyll.ts";
import { komIhagDjur } from "../liv.ts";
import { useMinne } from "../minne.ts";
import { bestamdAv, exempelFor, kortForExempel, onskaAnkare } from "../ui/hjalp.ts";
import { BYGGSIDOR, FIR, TEXTER } from "../ui/spelData.ts";
import type { SpelKarna } from "./typer.ts";

export function useVyData(k: Pick<SpelKarna, "t">) {
  const { flik, varld, meny, boUid, byggSidaId, onskaOpp, onskaPos, onskaSyns, kartaOpp, omrade, gavaTill, angRef, funna, onskan, byggSidor, garden, ang, hemma, allaOrd } = k.t;

  useEffect(() => {
    const rot = angRef.current;
    if (!rot) return;
    const synka = () => {
      const canvas = rot.querySelector("canvas");
      if (!canvas) return;
      const a = rot.getBoundingClientRect();
      const c = canvas.getBoundingClientRect();
      if (a.width < 2 || a.height < 2 || c.width < 2) return;
      rot.style.setProperty("--duk-x", String((c.left - a.left) / a.width));
      rot.style.setProperty("--duk-y", String((c.top - a.top) / a.height));
      rot.style.setProperty("--duk-w", String(c.width / a.width));
      rot.style.setProperty("--duk-h", String(c.height / a.height));
    };
    synka();
    const ro = new ResizeObserver(synka);
    ro.observe(rot);
    const id = window.setInterval(synka, 500);
    return () => {
      ro.disconnect();
      window.clearInterval(id);
    };
  }, []);

  const visaOnskaHjalp = Boolean(onskan && (onskaOpp || !onskaSyns));

  const onskaDjur =
    visaOnskaHjalp && onskan
      ? (ang.find((a) => a.uid === onskan.uid) ?? hemma.find((h) => h.spec.uid === onskan.uid)?.spec)
      : undefined;

  const andrar = Boolean(visaOnskaHjalp && onskan?.kalla === "djur" && onskaDjur);

  const vaknaText = gavaTill
    ? TEXTER_AV.gavoruta.knapp
    : varld === "gard" && !omrade
      ? TEXTER.penna_bygg.knapp
      : andrar && onskaDjur
        ? onskan?.typ === "kompis"
          ? FIR.onskan.kompis
          : fyll(FIR.onskan.andra, { djur: bestamdAv(onskaDjur.kropp, false) })
        : "Vakna!";

  const onskaEx = onskan ? exempelFor(onskan) : [];

  const onskaKort = visaOnskaHjalp ? kortForExempel(onskaEx, allaOrd) : [];

  const onskaIds = new Set(onskaKort.map((o) => o.id));

  const i3d = typeof document !== "undefined" && !!document.querySelector("[data-testid='angen-3d']");

  const ank = i3d
    ? {
        x: 0.7,
        y: 0.3,
        vanster: true,
      }
    : onskaAnkare(onskaPos.x, onskaPos.y);

  const kort = allaOrd
    .filter((o) => o.niva === "kort" && o.klass === flik)
    .slice()
    .sort((a, b) => Number(onskaIds.has(b.id)) - Number(onskaIds.has(a.id)));

  const hemliga = allaOrd.filter((o) => o.niva === "fritt");

  const kvar = hemligaKvar(funna);

  const hittade = allaOrd.filter((o) => funna[o.id]);

  const boBygge = garden.find((b) => b.uid === boUid);

  const boHem = boBygge ? byggMedId(boBygge.bygg) : undefined;

  const boDjur = boHem?.hem ? ang.filter((a) => boHem.hem!.kroppar.includes(a.kropp)) : [];

  const menyBygge = garden.find((b) => b.uid === meny?.uid);

  const menyHem = menyBygge ? byggMedId(menyBygge.bygg)?.hem : null;

  const visa3d = varld === "ang" && !omrade && !kartaOpp;

  const agdaSidor = BYGGSIDOR.sidor.filter((s) => byggSidor.includes(s.id));

  const lastaSidor = BYGGSIDOR.sidor.filter((s) => s.kostnad > 0 && !byggSidor.includes(s.id));

  const byggSida = agdaSidor.find((s) => s.id === byggSidaId) ?? agdaSidor[0] ?? BYGGSIDOR.sidor[0]!;

  function stallKanin() {
    const s = useMinne.getState();
    if (s.ang.length || s.hemma.length) return;
    const u = tolka("en rosa kanin", { kalla: "kort" });
    if (u.typ !== "skapad") return;
    const { nya } = useMinne.getState().laggPaAng(u.varelse, 1);
    const n = nya[0];
    if (n) komIhagDjur(n);
  }
  return { visaOnskaHjalp, onskaDjur, andrar, vaknaText, onskaEx, onskaKort, onskaIds, i3d, ank, kort, hemliga, kvar, hittade, boBygge, boHem, boDjur, menyBygge, menyHem, visa3d, agdaSidor, lastaSidor, byggSida, stallKanin };
}

export type VyData = ReturnType<typeof useVyData>;
