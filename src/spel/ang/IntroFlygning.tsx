import { useCallback, useEffect, useRef, useState } from "react";
import { hor } from "../rost.ts";

export type DalEtikett = {
  id: "grottan" | "skogen" | "sjon" | "garden" | "ang";
  namn: string;
  xProcent: number;
  yProcent: number;
};

export const DAL_ETIKETTER: readonly DalEtikett[] = [
  { id: "grottan", namn: "💎 Kristallgrottan", xProcent: 66, yProcent: 24 },
  { id: "skogen", namn: "🌲 Glittrande skogen", xProcent: 27, yProcent: 31 },
  { id: "sjon", namn: "🌊 Dimsjön", xProcent: 74, yProcent: 42 },
  { id: "garden", namn: "🏡 Solgården", xProcent: 24, yProcent: 54 },
  { id: "ang", namn: "🌸 Ängen", xProcent: 52, yProcent: 64 },
];

function minskadRorelse(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Spelar upp översiktsflygningen och håller `aktiv` i `langdMs` (450 ms vid reduced motion). */
export function useVyFlygning(langdMs = 3000) {
  const [aktiv, setAktiv] = useState(false);
  const timer = useRef<number | null>(null);
  const startaVyFlygning = useCallback(() => {
    hor("Se hela dalen");
    const ms = minskadRorelse() ? 450 : langdMs;
    setAktiv(true);
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setAktiv(false);
    }, ms);
  }, [langdMs]);
  useEffect(() => () => {
    if (timer.current != null) window.clearTimeout(timer.current);
  }, []);
  return { aktiv, startaVyFlygning };
}

export function VyFlygKnapp({ aktiv, onStarta, dold }: { aktiv: boolean; onStarta: () => void; dold?: boolean }) {
  if (dold) return null;
  return (
    <div className="tp-flyg-hud">
      <button type="button" data-w4="vy-flyg-knapp" onClick={onStarta} aria-pressed={aktiv} disabled={aktiv}>
        🦅 Se hela dalen
      </button>
    </div>
  );
}

export function DalFlygEtiketter({ synlig }: { synlig: boolean }) {
  if (!synlig) return null;
  return (
    <div className="tp-flyg-etiketter">
      {DAL_ETIKETTER.map((e) => (
        <span key={e.id} data-w4="flyg-etikett" data-plats={e.id} style={{ left: `${e.xProcent}%`, top: `${e.yProcent}%` }}>
          {e.namn}
        </span>
      ))}
    </div>
  );
}
