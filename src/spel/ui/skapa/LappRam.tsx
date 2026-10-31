import { useEffect, useState, type ReactNode } from "react";
import "./LappRam.css";
import { createPortal } from "react-dom";
import ui from "../../../../data/skapa-ui.json" with { type: "json" };
import { fyll } from "../../fyll.ts";
import * as rostKo from "../../rostKo.ts";
import { ikon } from "../../skapa/ikoner.ts";
type Props = { bild: string | null; fran: string; text: string; las: string; children?: ReactNode; portratt?: boolean; kompakt?: boolean };
export function LappRam({ bild, fran, text, las, children, portratt = false, kompakt = false }: Props) {
  const [hela, setHela] = useState(false);
  useEffect(() => { if (las) rostKo.lasUpp(las); }, [las]);
  useEffect(() => setHela(false), [text]);
  const bilden = bild ? <span className={portratt ? "sk-lapp-bild portratt" : "sk-lapp-bild"}><img alt="" src={bild} /></span> : null;
  const texten = <span className="sk-lapp-text"><small>{fran}</small><span>{text}</span></span>;
  const lyssna = <button type="button" className="sk-rund" aria-label={ui.lapp.lyssna_aria} data-p4="lyssna-onska" onClick={() => rostKo.lasUpp(las)}><img alt="" src={ikon("ui", "lyssna")} /></button>;
  return <>
    <div className={["sk-lapp", !bild ? "utan-bild" : "", kompakt ? "sk-lapp-kompakt" : ""].filter(Boolean).join(" ")} data-dal="lapp">
      {kompakt ? <button type="button" className="sk-lapp-visa" aria-label={fyll(ui.lapp.las_hela, { text })} onClick={() => setHela(true)}>{bilden}{texten}</button> : <>{bilden}{texten}</>}
      {lyssna}
      {children ? <div className="sk-lapp-extra">{children}</div> : null}
    </div>
    {hela ? createPortal(<div className="sk-lapp-laslager">
      <section className="sk-lapp-full" role="dialog" aria-modal="true" aria-label={fran} onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Escape") { e.preventDefault(); setHela(false); } }}>
        <p>{fran}</p><p>{text}</p>{lyssna}
        <button type="button" className="sk-knapp" autoFocus data-dialog-close onClick={() => setHela(false)}>{ui.lapp.tillbaka}</button>
      </section>
    </div>, document.body) : null}
  </>;
}
