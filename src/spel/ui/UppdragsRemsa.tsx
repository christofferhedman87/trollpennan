import { NPC, uppdragText, type Uppdrag } from "../aventyr.ts";
import { ideRad } from "../ideRad.ts";

/** Remsan överst i Skapa-menyn: uppdraget som pågår, med givarens namn och (R6A-3) guidande förslag. Fritext är kvar.
 *  R9K: knapparna börjar bara meningen ("en kanin med …"); svaret (kravorden) står aldrig i idéraden. */
export function UppdragsRemsa({ uppdrag, fyllForslag }: { uppdrag: Uppdrag | undefined; fyllForslag?: (fras: string) => void }) {
  if (!uppdrag) return null;
  const namn = uppdrag.givare ? NPC[uppdrag.givare]?.namn : undefined;
  const rad = ideRad(uppdrag);
  return (
    <>
      <p className="uppdrag-remsa" data-testid="uppdrag-remsa" data-uppdrag={uppdrag.id}>
        {namn ? <b>{namn}: </b> : null}
        {uppdragText(uppdrag)}
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
