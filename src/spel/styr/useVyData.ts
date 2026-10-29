import { useEffect } from "react";
import { byggMedId } from "@/tolk/byggtolk.ts";
import { GAVOR } from "@/tolk/gavotolk.ts";
import { hemligaKvar, tolka } from "@/tolk/tolka.ts";
import type { Ord } from "@/tolk/typer.ts";
import { TEXTER_AV } from "../aventyr.ts";
import { fyll } from "../fyll.ts";
import { komIhagDjur } from "../liv.ts";
import { useMinne } from "../minne.ts";
import { bestamdAv, exempelFor, kortForExempel, onskaAnkare } from "../ui/hjalp.ts";
import { BYGGSIDOR, FIR, TEXTER } from "../ui/spelData.ts";
import type { SpelKarna } from "./typer.ts";

const GAVA_SUGEN = ["äpple", "morot", "banan", "bulle", "vatten", "saft", "kudde", "filt", "säng", "boll", "kram"];
const GAVA_VARM = ["kudde", "filt", "säng", "kakao", "te", "soppa", "äpple", "morot", "vatten"];

function gavaKortLista(humor?: string): Ord[] {
  const prio = humor === "trott" || humor === "fryser" ? GAVA_VARM : GAVA_SUGEN;
  const rank = new Map(prio.map((id, i) => [id, i]));
  return [...GAVOR.gavor]
    .sort((a, b) => (rank.get(a.id) ?? 1000) - (rank.get(b.id) ?? 1000))
    .map((g) => ({ id: g.id, visa: g.former[0] ?? g.id, klass: "djur" as const, genus: g.genus, former: g.former, niva: "start" as const, del: {} }) as unknown as Ord);
}

export function useVyData(k: Pick<SpelKarna, "t">) {
  const { flik, varld, meny, boUid, byggSidaId, onskaOpp, onskaPos, onskaSyns, kartaOpp, omrade, gavaTill, angRef, funna, onskan, byggSidor, garden, ang, hemma, allaOrd, panel } = k.t;
  const liv = useMinne((s) => s.liv);

  useEffect(() => {
    const rot = angRef.current;
    if (!rot) return;
    const synka = () => {
      const a = rot.getBoundingClientRect();
      if (a.width < 2 || a.height < 2) return;
      const canvas = rot.querySelector("canvas");
      const c = canvas instanceof HTMLElement ? canvas.getBoundingClientRect() : null;
      const liten = !!c && c.width >= 2 && c.height >= 2 && (c.width < a.width * 0.92 || c.height < a.height * 0.92);
      if (liten && c) {
        rot.style.setProperty("--duk-x", String((c.left - a.left) / a.width));
        rot.style.setProperty("--duk-y", String((c.top - a.top) / a.height));
        rot.style.setProperty("--duk-w", String(c.width / a.width));
        rot.style.setProperty("--duk-h", String(c.height / a.height));
        return;
      }
      const w = Math.min(a.width, a.height * (750 / 900));
      const h = Math.min(a.height, a.width * (900 / 750));
      rot.style.setProperty("--duk-x", String((a.width - w) / (2 * a.width)));
      rot.style.setProperty("--duk-y", "0");
      rot.style.setProperty("--duk-w", String(w / a.width));
      rot.style.setProperty("--duk-h", String(h / a.height));
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

  const forstaSkapelse = panel === "spel" && varld === "ang" && !gavaTill && !andrar && ang.length === 0 && hemma.length === 0;
  const START_DJUR = ["kanin", "katt", "hund", "häst", "gris", "drake", "groda", "fågel"];
  const kortAlla = allaOrd
    .filter((o) => o.niva === "kort" && o.klass === flik)
    .slice()
    .sort((a, b) => Number(onskaIds.has(b.id)) - Number(onskaIds.has(a.id)));
  const kortDjur = forstaSkapelse && flik === "djur" ? kortAlla.filter((o) => START_DJUR.includes(o.id)).slice(0, 8) : kortAlla;
  const kort = gavaTill !== null ? gavaKortLista(liv[gavaTill.slice(5)]?.humor) : kortDjur;

  const hemliga = allaOrd.filter((o) => o.niva === "fritt");

  const kvar = hemligaKvar(funna);

  const hittade = allaOrd.filter((o) => funna[o.id]);

  const boBygge = garden.find((b) => b.uid === boUid);

  const boHem = boBygge ? byggMedId(boBygge.bygg) : undefined;

  const boDjur = boHem?.hem ? ang.filter((a) => boHem.hem!.kroppar.includes(a.kropp)) : [];

  const menyBygge = garden.find((b) => b.uid === meny?.uid);

  const menyHem = menyBygge ? byggMedId(menyBygge.bygg)?.hem : null;

  const visa3d = varld === "ang" && !omrade && !kartaOpp;

  // Beslut B (En värld): alla byggord är fria; bara Solgårdens specialbyggen köps med stjärnor.
  const arFri = (id: string) => id !== "solgard";
  const agdaSidor = BYGGSIDOR.sidor.filter((s) => arFri(s.id) || byggSidor.includes(s.id));

  const lastaSidor = BYGGSIDOR.sidor.filter((s) => s.kostnad > 0 && !arFri(s.id) && !byggSidor.includes(s.id));

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
  return { visaOnskaHjalp, onskaDjur, andrar, vaknaText, onskaEx, onskaKort, onskaIds, i3d, ank, kort, hemliga, kvar, hittade, boBygge, boHem, boDjur, menyBygge, menyHem, visa3d, agdaSidor, lastaSidor, byggSida, stallKanin, forstaSkapelse };
}

export type VyData = ReturnType<typeof useVyData>;
