import { useEffect, useState } from "react";
import type { Ord } from "@/tolk/typer.ts";
import { kanEtikett, kortIkon } from "./hjalp.ts";
import type { Slot } from "./typer.ts";

const KORT_PER_SIDA = 6;

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

export function StegKortValjare({ flik, setFlik, kort, val, onskaKort, onskaIds, kortGang, valjKort, oppnaSkrivMig, forslagEtikett }: StegKortValjareProps) {
  void onskaKort;
  const steg = stegAv(flik);
  const [sida, setSida] = useState(0);
  useEffect(() => { setSida(0); }, [flik]);
  const totalSidor = Math.max(1, Math.ceil(kort.length / KORT_PER_SIDA));
  const aktuellSida = Math.min(sida, totalSidor - 1);
  let synligaKort = kort.slice(aktuellSida * KORT_PER_SIDA, (aktuellSida + 1) * KORT_PER_SIDA);
  if (aktuellSida > 0 && synligaKort.length < KORT_PER_SIDA && kort.length >= KORT_PER_SIDA) {
    synligaKort = kort.slice(kort.length - KORT_PER_SIDA);
  }
  const ga = (nasta: Slot) => { setFlik(nasta); setSida(0); };

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
          <button type="button" role="tab" aria-selected={flik === "storlek"} className={flik === "storlek" ? "steg-under aktiv" : "steg-under"} onClick={() => ga("storlek")}>📏 Storlek</button>
          <button type="button" role="tab" aria-selected={flik === "monster"} className={flik === "monster" ? "steg-under aktiv" : "steg-under"} onClick={() => ga("monster")}>✨ Mönster</button>
        </div>
      ) : null}
      {steg === 3 ? (
        <div className="steg-underflikar" role="tablist" aria-label="Kläder och kraft">
          <button type="button" role="tab" aria-selected={flik === "tillbehor"} className={flik === "tillbehor" ? "steg-under aktiv" : "steg-under"} onClick={() => ga("tillbehor")}>🎩 Kläder<span className="sr-only"> Tillbehör</span></button>
          <button type="button" role="tab" aria-selected={flik === "formaga"} className={flik === "formaga" ? "steg-under aktiv" : "steg-under"} onClick={() => ga("formaga")}>⚡ Kraft</button>
        </div>
      ) : null}
      <div className="kort-yta ordkort-panel" data-v3="ordkort" data-m3="kort-grid">
        {synligaKort.map((ord) => {
          const vald = val[ord.klass as Slot]?.id === ord.id;
          const markerad = onskaIds.has(ord.id);
          const gang = kortGang[ord.id] ?? 0;
          return (
            <div key={ord.id} className="kort-cell">
              <button type="button" className={`${vald ? "kort vald" : markerad ? "kort markerad" : "kort"} ord-kort`} data-testid={`kort-${ord.id}`} onClick={() => valjKort(ord)}>
                {ord.klass === "djur" && kortIkon(ord.id) ? <img className="kort-ikon" alt="" src={kortIkon(ord.id) ?? ""} /> : null}
                <span>{kanEtikett(ord)}</span>
              </button>
              {gang >= 3 ? (
                <button type="button" className="skriv-mig" onClick={() => oppnaSkrivMig(ord)}>Skriv mig! {ord.visa.slice(0, 2)}…</button>
              ) : null}
            </div>
          );
        })}
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
