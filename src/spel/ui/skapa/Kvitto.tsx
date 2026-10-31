// Nya Skapa 6.11: kvittot under HUD:en efter Trolla (5,6 s eller tryck). Guldorden är understrukna i guld,
// och under står stjärnorna och vilka guldord barnet skrev själv (T-32). Uppfyllde det en önskan står tacket först.
import { useEffect } from "react";
import uiJson from "../../../../data/skapa-ui.json" with { type: "json" };
import { fyll } from "../../fyll.ts";
import { ikon } from "../../skapa/ikoner.ts";
import { kvittoGuldord, useKvitto } from "../../skapa/kvitto.ts";
import { lasbarTid } from "../../rost.ts";
import "./skapa.css";

const UI = uiJson as unknown as { kvitto: Record<string, string>; tider_ms: Record<string, number> };

export function Kvitto() {
  const kvitto = useKvitto((s) => s.kvitto);
  const satt = useKvitto((s) => s.satt);
  useEffect(() => {
    if (!kvitto) return;
    const text = [kvitto.tack, kvitto.ord.map((o) => o.t).join(" ")].filter(Boolean).join(" ");
    const id = window.setTimeout(() => satt(null), Math.max(UI.tider_ms.kvitto ?? 5600, lasbarTid(text)));
    return () => window.clearTimeout(id);
  }, [kvitto, satt]);
  if (!kvitto) return null;
  const [fore, efter] = (UI.kvitto[kvitto.tillagg ? "tillagg" : "trollade"] ?? "{mening}").split("{mening}");
  const guldord = kvittoGuldord(kvitto.ord);
  return (
    <button type="button" className="sk-kvitto" data-dal="kvitto" onClick={() => satt(null)}>
      <p className="sk-kvitto-rad">
        {kvitto.tack ? <>{kvitto.tack} </> : null}
        {fore}
        <span className="mening">
          {kvitto.ord.map((o, i) => (
            <span key={i}>
              {i ? " " : ""}
              {o.guld ? <span className="gul">{o.t}</span> : o.t}
            </span>
          ))}
        </span>
        {efter}
      </p>
      <span className="sk-kvitto-beloning">
        {kvitto.stj > 0 ? (
          <span className="sk-kvitto-chip">
            <img alt="" src={ikon("ui", "stjarna")} />
            {fyll(kvitto.stj === 1 ? (UI.kvitto.stjarna_en ?? "") : (UI.kvitto.stjarna_flera ?? ""), { n: kvitto.stj })}
          </span>
        ) : null}
        {guldord.length > 0 ? (
          <span className="sk-kvitto-chip guld" data-g1="kvitto-guld">
            <img alt="" src={ikon("ui", "guldord")} />
            {fyll(UI.kvitto.guld ?? "", { n: guldord.length, ord: guldord.join(", ") })}
          </span>
        ) : null}
      </span>
    </button>
  );
}
