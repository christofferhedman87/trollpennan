// Nya Skapa 6.11: kvittot under HUD:en efter Trolla (5,6 s eller tryck). Guldorden är understrukna i guld,
// och under står stjärnorna och vilka guldord barnet skrev själv (T-32). Uppfyllde det en önskan står tacket först.
import { useEffect } from "react";
import uiJson from "../../../../data/skapa-ui.json" with { type: "json" };
import { ikon } from "../../skapa/ikoner.ts";
import { kvittoInnehall, useKvitto } from "../../skapa/kvitto.ts";
import { lasbarTid } from "../../rost.ts";
import "./skapa.css";

const UI = uiJson as unknown as { kvitto: Record<string, string>; tider_ms: Record<string, number> };

export function Kvitto() {
  const kvitto = useKvitto((s) => s.kvitto);
  const satt = useKvitto((s) => s.satt);
  const innehall = kvitto ? kvittoInnehall(kvitto, UI.kvitto) : null;
  const lastext = innehall?.lastext;
  useEffect(() => {
    if (!kvitto || lastext == null) return;
    const id = window.setTimeout(() => satt(null), Math.max(UI.tider_ms.kvitto ?? 5600, lasbarTid(lastext)));
    return () => window.clearTimeout(id);
  }, [kvitto, satt, lastext]);
  if (!kvitto || !innehall) return null;
  const { fore, efter, guldord, stjarntext, guldtext } = innehall;
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
            {stjarntext}
          </span>
        ) : null}
        {guldord.length > 0 ? (
          <span className="sk-kvitto-chip guld" data-g1="kvitto-guld">
            <img alt="" src={ikon("ui", "guldord")} />
            {guldtext}
          </span>
        ) : null}
      </span>
    </button>
  );
}
