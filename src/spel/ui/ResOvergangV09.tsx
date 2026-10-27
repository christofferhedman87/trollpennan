import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { VagvisarePlatsId } from "../ang/Vagvisare3D.tsx";
import { hor, restext } from "../rost.ts";

const TEXT: Record<VagvisarePlatsId, { ikon: string; rubrik: string }> = {
  ang: { ikon: "🌸", rubrik: "På väg hem till Ängen…" },
  skogen: { ikon: "🌲", rubrik: "På väg till Glittrande skogen…" },
  sjon: { ikon: "🌊", rubrik: "På väg till Dimsjön…" },
  grottan: { ikon: "💎", rubrik: "På väg till Kristallgrottan…" },
  garden: { ikon: "🏡", rubrik: "På väg till Gården…" },
};

type Args = { paResaKlar: (mal: VagvisarePlatsId) => void; langdMs?: number };

export function useResOvergangV09({ paResaKlar, langdMs = 820 }: Args) {
  const [mal, setMal] = useState<VagvisarePlatsId | null>(null);
  const upptagen = useRef(false);
  const utford = useRef(false);
  const malRef = useRef<VagvisarePlatsId | null>(null);
  const timer = useRef<number[]>([]);
  const paRef = useRef(paResaKlar);
  paRef.current = paResaKlar;
  const rensa = () => {
    for (const t of timer.current) window.clearTimeout(t);
    timer.current = [];
  };
  useEffect(() => rensa, []);
  const startaResa = (nyttMal: VagvisarePlatsId) => {
    hor(restext(nyttMal));
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("troll-vagvisare-glid", { detail: nyttMal }));
    const minska = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (minska) {
      rensa();
      upptagen.current = false;
      utford.current = true;
      malRef.current = null;
      setMal(null);
      paRef.current(nyttMal);
      return;
    }
    rensa();
    upptagen.current = true;
    utford.current = false;
    malRef.current = nyttMal;
    setMal(nyttMal);
    timer.current.push(window.setTimeout(() => {
      if (utford.current) return;
      utford.current = true;
      paRef.current(nyttMal);
    }, Math.round(langdMs * 0.42)));
    timer.current.push(window.setTimeout(() => {
      upptagen.current = false;
      malRef.current = null;
      setMal(null);
    }, langdMs));
  };
  const hoppaOver = () => {
    const nu = malRef.current;
    rensa();
    upptagen.current = false;
    malRef.current = null;
    setMal(null);
    if (nu && !utford.current) {
      utford.current = true;
      paRef.current(nu);
    }
  };
  return { mal, startaResa, hoppaOver };
}

export function ResOvergangV09({ mal, paHoppaOver }: { mal: VagvisarePlatsId | null; paHoppaOver: () => void }) {
  if (!mal || typeof document === "undefined") return null;
  const t = TEXT[mal];
  return createPortal(
    <div className="tp-resa-anim" data-w3="resa-anim" role="status" aria-live="polite">
      <div className="tp-resa-kort">
        <p className="tp-stig" aria-hidden>{t.ikon} ✨ 👣</p>
        <h2>{t.rubrik}</h2>
        <p className="tp-resa-steg" aria-hidden><span /><span /><span /><span /></p>
        <button type="button" onClick={paHoppaOver}>Hoppa över resan</button>
      </div>
    </div>,
    document.body,
  );
}
