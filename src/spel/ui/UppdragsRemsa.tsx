import { NPC, uppdragText, type Uppdrag } from "../aventyr.ts";

/** Remsan överst i Skapa-menyn: uppdraget som pågår, med givarens namn. */
export function UppdragsRemsa({ uppdrag }: { uppdrag: Uppdrag | undefined }) {
  if (!uppdrag) return null;
  const namn = uppdrag.givare ? NPC[uppdrag.givare]?.namn : undefined;
  return (
    <p className="uppdrag-remsa" data-testid="uppdrag-remsa" data-uppdrag={uppdrag.id}>
      {namn ? <b>{namn}: </b> : null}
      {uppdragText(uppdrag)}
    </p>
  );
}
