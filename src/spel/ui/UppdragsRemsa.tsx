import { useEffect } from "react";
import lasningJson from "../../../data/lasning.json" with { type: "json" };
import { NPC, uppdragText, type Uppdrag } from "../aventyr.ts";
import * as rostKo from "../rostKo.ts";
import { ideRad } from "../ideRad.ts";

/** Remsan överst i Skapa-menyn: uppdraget som pågår, med givarens namn och (R6A-3) guidande förslag. Fritext är kvar.
 *  R9K: knapparna börjar bara meningen ("en kanin med …"); svaret (kravorden) står aldrig i idéraden. */
export function UppdragsRemsa({ uppdrag, fyllForslag }: { uppdrag: Uppdrag | undefined; fyllForslag?: (fras: string) => void }) {
  const lasText = uppdrag ? uppdragText(uppdrag) : "";
  const lasId = uppdrag?.id;
  // TTS-1: uppdraget läses upp en gång per spelomgång när remsan visas
  useEffect(() => {
    if (!lasId || !lasText) return;
    rostKo.anmal({ text: lasText, kalla: "uppdrag", nyckel: `uppdrag:${lasId}` });
    return () => rostKo.stryk(lasText);
  }, [lasId, lasText]);
  if (!uppdrag) return null;
  const namn = uppdrag.givare ? NPC[uppdrag.givare]?.namn : undefined;
  const rad = ideRad(uppdrag);
  return (
    <>
      <p className="uppdrag-remsa" data-testid="uppdrag-remsa" data-uppdrag={uppdrag.id}>
        {namn ? <b>{namn}: </b> : null}
        {uppdragText(uppdrag)}
        <button
          type="button"
          className="lyssna-knapp"
          data-p4="lyssna-uppdrag"
          aria-label={lasningJson.lyssna.aria_uppdrag}
          onClick={() => rostKo.lasUpp(uppdragText(uppdrag))}
        >
          🔊 {lasningJson.lyssna.knapp}
        </button>
      </p>
      {rad && fyllForslag ? (
        <div className="uppdrag-val" data-testid="uppdrag-val" role="group" aria-label={rad.rubrik || undefined}>
          {rad.rubrik ? <span className="uppdrag-val-rubrik">{rad.rubrik}</span> : null}
          {rad.grupper.map((g, i) => (
            <span className="uppdrag-val-grupp" key={`${g.etikett}-${i}`} data-testid="uppdrag-val-grupp">
              {g.etikett ? <span className="uppdrag-val-etikett">{g.etikett}</span> : null}
              {g.knappar.map((k) => (
                <button key={k.visa} type="button" className="onska-chip" data-testid="uppdrag-val-fras" onClick={() => fyllForslag(k.fyll)}>
                  {k.visa}
                </button>
              ))}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}
