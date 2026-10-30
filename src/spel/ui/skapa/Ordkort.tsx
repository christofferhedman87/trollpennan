// Nya Skapa 6.7: ett bildkort i Ordhjälpen. Tryck = ordet sätts in och läses upp. Håll inne = bara lyssna
// (en ljusblå ring fylls). Önskat kort glöder; ett kort som använts tre gånger får en guldpenna (guldchansen).
import { useRef, useState, type CSSProperties } from "react";
import uiJson from "../../../../data/skapa-ui.json" with { type: "json" };
import * as rostKo from "../../rostKo.ts";
import { ikon } from "../../skapa/ikoner.ts";
import type { HyllKort } from "../../skapa/hjalpord.ts";

const UI = uiJson as unknown as { tider_ms: Record<string, number>; hylla: Record<string, string> };
const FARG: Record<string, string> = { vad: "var(--tp-vad)", hurdan: "var(--tp-hurdan)", har: "var(--tp-har)", gor: "var(--tp-gor)" };

type Props = { kort: HyllKort; visa: string; vald: boolean; onskad: boolean; skrivMig: boolean; onValj: () => void; onSkrivMig: () => void };

export function Ordkort({ kort, visa, vald, onskad, skrivMig, onValj, onSkrivMig }: Props) {
  const timer = useRef<number | null>(null);
  const svalj = useRef(false);
  const [lyssnar, setLyssnar] = useState(0);
  const slapp = () => {
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  return (
    <button
      type="button"
      className={onskad ? "sk-kort onskad" : "sk-kort"}
      style={{ "--k": FARG[kort.fraga] } as CSSProperties}
      aria-pressed={vald}
      title={UI.hylla.lyssna_hall}
      data-testid={`kort-${kort.id}`}
      data-slot={kort.slot}
      onPointerDown={() => {
        slapp();
        svalj.current = false;
        timer.current = window.setTimeout(() => {
          svalj.current = true;
          setLyssnar(Date.now());
          rostKo.lasUpp(visa);
        }, UI.tider_ms.hall_lyssna ?? 450);
      }}
      onPointerUp={slapp}
      onPointerCancel={slapp}
      onPointerLeave={slapp}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        if (svalj.current) {
          svalj.current = false;
          return;
        }
        if ((e.target as HTMLElement).closest(".sk-skriv-mig")) return onSkrivMig();
        onValj();
      }}
    >
      <img className="sk-kort-bild" alt="" src={kort.bild} />
      <span className={visa.length > 7 ? "sk-kort-ord lang" : "sk-kort-ord"}>{visa}</span>
      {skrivMig ? (
        <span className="sk-skriv-mig" role="img" aria-label={visa}>
          <img alt="" src={ikon("ui", "guldord")} />
        </span>
      ) : null}
      {lyssnar ? <span key={lyssnar} className="sk-lyssnar" /> : null}
    </button>
  );
}
