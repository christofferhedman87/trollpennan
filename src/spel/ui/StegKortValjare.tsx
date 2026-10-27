import { useEffect, useState } from "react";
import type { Ord } from "@/tolk/typer.ts";
import { BokKort } from "./BokKort.tsx";
import { kortDjurBas, kortIkon } from "./hjalp.ts";
import type { Slot } from "./typer.ts";

const KORT_PER_SIDA = 4;
/** De fyra v0.8-färgerna ska synas utan sidbyte (blå ligger annars på sida 2). */
const FARG_SIDA_ETT = ["röd", "gul", "grön", "blå"];

type StegKortValjareProps = {
  flik: Slot;
  setFlik: (s: Slot) => void;
  kort: Ord[];
  val: Partial<Record<Slot, Ord>>;
  onskaKort: Ord[];
  onskaIds: Set<string>;
  kortGang: Record<string, number>;
  valjKort: (ord: Ord) => void;
  oppnaSkrivMig: (ord: Ord) => void;
  forslagEtikett: string;
};

function stegAv(flik: Slot): 1 | 2 | 3 {
  if (flik === "djur") return 1;
  if (flik === "farg" || flik === "storlek" || flik === "monster") return 2;
  return 3;
}

function ordnaKort(lista: Ord[]): Ord[] {
  if (!lista.some((o) => o.klass === "farg")) return lista;
  const tidiga = FARG_SIDA_ETT.map((id) => lista.find((o) => o.id === id)).filter((o): o is Ord => !!o);
  const resten = lista.filter((o) => !FARG_SIDA_ETT.includes(o.id));
  return [...tidiga, ...resten];
}

export function StegKortValjare({ flik, setFlik, kort, val, onskaKort, onskaIds, kortGang, valjKort, oppnaSkrivMig, forslagEtikett }: StegKortValjareProps) {
  void onskaKort;
  const steg = stegAv(flik);
  const [sida, setSida] = useState(0);
  useEffect(() => { setSida(0); }, [flik]);
  const visning = ordnaKort(kort);
  const totalSidor = Math.max(1, Math.ceil(visning.length / KORT_PER_SIDA));
  const aktuellSida = Math.min(sida, totalSidor - 1);
  let synligaKort = visning.slice(aktuellSida * KORT_PER_SIDA, (aktuellSida + 1) * KORT_PER_SIDA);
  if (aktuellSida > 0 && synligaKort.length < KORT_PER_SIDA && visning.length >= KORT_PER_SIDA) {
    synligaKort = visning.slice(visning.length - KORT_PER_SIDA);
  }
  const ga = (nasta: Slot) => { setFlik(nasta); setSida(0); };
  const djurSrc = val.djur ? kortIkon(val.djur.id, "djur") : null;
  const miniBas = djurSrc?.endsWith("/linje.png") && val.djur ? kortDjurBas(val.djur.id) : null;

  return (
    <>
      <p className="forslag-etikett" data-testid="forslag-etikett">{forslagEtikett}</p>
      <div className="steg-piller-rad" data-m3="steg-piller" role="tablist" aria-label="Steg i boken">
        <button type="button" role="tab" aria-selected={steg === 1} className={steg === 1 ? "steg-piller aktiv" : "steg-piller"} data-m3="steg-1" onClick={() => ga("djur")}>1. Välj djur 🐾</button>
        <button type="button" role="tab" aria-selected={steg === 2} className={steg === 2 ? "steg-piller aktiv" : "steg-piller"} data-m3="steg-2" onClick={() => ga("farg")}>2. Färg &amp; Storlek 🎨</button>
        <button type="button" role="tab" aria-selected={steg === 3} className={steg === 3 ? "steg-piller aktiv" : "steg-piller"} data-m3="steg-3" onClick={() => ga("tillbehor")}>3. Kläder &amp; Kraft 🎩</button>
      </div>
      {steg === 2 ? (
        <div className="steg-underflikar" role="tablist" aria-label="Färg, storlek och mönster">
          <button type="button" role="tab" aria-selected={flik === "farg"} className={flik === "farg" ? "steg-under aktiv" : "steg-under"} onClick={() => ga("farg")}>🎨 Färg</button>
          <button type="button" role="tab" aria-selected={flik === "storlek"} className={flik === "storlek" ? "steg-under aktiv" : "steg-under"} data-m3="beskriv-kat-storlek" onClick={() => ga("storlek")}>📏 Storlek</button>
          <button type="button" role="tab" aria-selected={flik === "monster"} className={flik === "monster" ? "steg-under aktiv" : "steg-under"} onClick={() => ga("monster")}>✨ Mönster</button>
        </div>
      ) : null}
      {steg === 3 ? (
        <div className="steg-underflikar" role="tablist" aria-label="Kläder och kraft">
          <button type="button" role="tab" aria-selected={flik === "tillbehor"} className={flik === "tillbehor" ? "steg-under aktiv" : "steg-under"} onClick={() => ga("tillbehor")}>🎩 Kläder<span className="sr-only"> Tillbehör</span></button>
          <button type="button" role="tab" aria-selected={flik === "formaga"} className={flik === "formaga" ? "steg-under aktiv" : "steg-under"} onClick={() => ga("formaga")}>⚡ Kraft</button>
        </div>
      ) : null}
      {val.djur ? (
        <div className="mini-preview-rad" data-c2="mini-preview">
          {djurSrc ? <img className="mini-preview-djur" alt="" src={djurSrc} style={miniBas ? { backgroundColor: miniBas.farg, borderRadius: 4 } : undefined} /> : null}
          <span className="mini-preview-namn">{val.djur.visa}</span>
          {val.farg ? <span className="mini-preview-chip" data-c2="preview-farg">Vald färg: {val.farg.visa}</span> : null}
          {val.storlek ? <span className="mini-preview-chip" data-c2="preview-storlek">Storlek: {val.storlek.visa}</span> : null}
          {val.tillbehor || val.monster || val.formaga ? (
            <span className="mini-preview-chip" data-c2="preview-extra">Med: {[val.monster?.visa, val.tillbehor?.visa, val.formaga?.visa].filter(Boolean).join(", ")}</span>
          ) : null}
        </div>
      ) : null}
      <div className="kort-yta ordkort-panel" data-v3="ordkort" data-m3="kort-grid">
        {synligaKort.map((ord) => (
          <BokKort
            key={ord.id}
            ord={ord}
            vald={val[ord.klass as Slot]?.id === ord.id}
            markerad={onskaIds.has(ord.id)}
            gang={kortGang[ord.id] ?? 0}
            valjKort={valjKort}
            oppnaSkrivMig={oppnaSkrivMig}
          />
        ))}
      </div>
      <div className="skriv-remsa steg-nav-remsa" data-v3="skriv-remsa" data-m3="kort-nav">
        <div className="kort-sid-nav">
          <button type="button" className="kort-pil-knapp" data-m3="sida-bak" onClick={() => setSida((s) => (s - 1 + totalSidor) % totalSidor)}>◀ Fler</button>
          <span className="kort-sida-info" data-m3="sida-info">Sida {aktuellSida + 1}/{totalSidor}</span>
          <button type="button" className="kort-pil-knapp" data-m3="sida-fram" onClick={() => setSida((s) => (s + 1) % totalSidor)}>Fler ▶</button>
        </div>
        <div className="kort-steg-nav">
          {steg > 1 ? (
            <button type="button" className="steg-pil-knapp bak" data-m3="steg-bak" onClick={() => ga(steg === 3 ? "farg" : "djur")}>◀ Bakåt</button>
          ) : null}
          {steg < 3 ? (
            <button type="button" className="steg-pil-knapp nasta" data-m3="steg-nasta" onClick={() => ga(steg === 1 ? "farg" : "tillbehor")}>Nästa steg ▶</button>
          ) : null}
        </div>
      </div>
    </>
  );
}
