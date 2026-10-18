import { NPC, uppdragText, type Uppdrag } from "../aventyr.ts";

/** Remsan överst i Skapa-menyn: uppdraget som pågår, med givarens namn och (R6A-3) guidande förslag. Fritext är kvar. */
export function UppdragsRemsa({ uppdrag, fyllForslag }: { uppdrag: Uppdrag | undefined; fyllForslag?: (fras: string) => void }) {
  if (!uppdrag) return null;
  const namn = uppdrag.givare ? NPC[uppdrag.givare]?.namn : undefined;
  return (
    <>
      <p className="uppdrag-remsa" data-testid="uppdrag-remsa" data-uppdrag={uppdrag.id}>
        {namn ? <b>{namn}: </b> : null}
        {uppdragText(uppdrag)}
      </p>
      {uppdrag.val && fyllForslag ? (
        <div className="uppdrag-val" data-testid="uppdrag-val" role="group" aria-label={uppdrag.val.rubrik}>
          <span className="uppdrag-val-rubrik">{uppdrag.val.rubrik}</span>
          {uppdrag.val.grupper.map((g) => (
            <span className="uppdrag-val-grupp" key={g.etikett} data-testid="uppdrag-val-grupp">
              <span className="uppdrag-val-etikett">{g.etikett}</span>
              {g.forslag.map((f) => (
                <button key={f.fras} type="button" className="onska-chip" data-testid="uppdrag-val-fras" onClick={() => fyllForslag(f.fras)}>
                  {f.ord}
                </button>
              ))}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}
