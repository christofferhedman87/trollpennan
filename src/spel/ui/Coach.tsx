// P2-2 (förslag A): guiden. Läser stegen ur data/forsta-stunden.json via aktivtSteg(sparningen) och pekar på målet:
// ett testid i DOM:en eller ett 3D-ankare (window.__tredMal). Pratbubbla högst upp, pil + gyllene ring på målet.
// Göms när något annat har fokus (bok, dialog, meny, titel, intro) eller när målet inte syns. Inga per-steg-if.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FORSTA, aktivtSteg, malFor } from "../forstaStunden.ts";
import { useMinne } from "../minne.ts";
import { START_PLATS } from "../platser.ts";
import * as rostKo from "../rostKo.ts";
import { useStart } from "../start.ts";
import "./coach-p2.css";

type Ruta = { x: number; y: number; b: number; h: number };
const UPPTAGEN = ".bok, .sk-ark, .sk-kvitto, .skarm, .titel, [data-testid=intro], [data-testid=meny-panel], [data-testid=onska-bubbla], [role=alertdialog]";

function hittaMal(pekar: string): Ruta | null {
  const m = malFor(pekar);
  if (m.ankare) {
    const p = window.__tredMal?.[m.ankare];
    if (!p || p.x < 0 || p.y < 0 || p.x > innerWidth || p.y > innerHeight) return null;
    return { x: p.x - 36, y: p.y - 36, b: 72, h: 72 };
  }
  for (const id of m.testid) {
    const e = document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
    if (!e) continue;
    const r = e.getBoundingClientRect();
    if (r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < innerHeight) return { x: r.left, y: r.top, b: r.width, h: r.height };
  }
  return null;
}

export function Coach({ aktiv }: { aktiv: boolean }) {
  // väljaren ger ett tal (stegets index), inte ett nytt objekt per anrop – annars renderar zustand i en evig loop
  const nr = useMinne((s) => aktivtSteg(s as unknown as Record<string, unknown>)?.nr ?? 0);
  const steg = nr ? { steg: FORSTA.steg[nr - 1]! } : null;
  const pahemma = useMinne((s) => s.plats === START_PLATS);
  const titel = useStart((s) => s.titelOppen);
  const [ruta, setRuta] = useState<Ruta | null>(null);
  const pekar = aktiv && pahemma && !titel ? steg?.steg.pekar_pa : undefined;
  useEffect(() => {
    if (!pekar) {
      setRuta(null);
      return;
    }
    const kolla = () => {
      const r = document.querySelector(UPPTAGEN) || document.querySelector("[data-testid=meny][aria-expanded=true]") ? null : hittaMal(pekar);
      setRuta((f) => (f && r && Math.abs(f.x - r.x) < 2 && Math.abs(f.y - r.y) < 2 && f.b === r.b ? f : r));
    };
    kolla();
    const t = window.setInterval(kolla, 250);
    return () => window.clearInterval(t);
  }, [pekar]);
  const text = steg?.steg.text;
  const id = steg?.steg.id;
  const synlig = ruta !== null;
  useEffect(() => {
    if (!synlig || !text || !id) return;
    rostKo.anmal({ text, kalla: "coach", nyckel: `coach-${id}` });
    return () => rostKo.stryk(text);
  }, [synlig, text, id]);
  if (!ruta || !steg) return null;
  const pad = 6;
  return createPortal(
    <div className="coach" data-testid="coach" data-steg={steg.steg.id} aria-live="polite">
      <p className="coach-bubbla">
        <span className="coach-penna" aria-hidden />
        <span>{steg.steg.visa_text ?? steg.steg.text}</span>
      </p>
      <span className="coach-ring" style={{ left: ruta.x - pad, top: ruta.y - pad, width: ruta.b + pad * 2, height: ruta.h + pad * 2 }} aria-hidden />
      <span className="coach-pil" style={{ left: ruta.x + ruta.b / 2 - 22, top: ruta.y - 58 }} aria-hidden>
        👇
      </span>
    </div>,
    document.body,
  );
}
