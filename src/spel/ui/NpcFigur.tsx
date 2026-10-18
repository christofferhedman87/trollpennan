import { useEffect } from "react";
import { NPC_DEL, mineUrl } from "../npc.ts";

type Props = { npc: string; mine: string; nytt: boolean; onClick: () => void };

/** En figur som 2D-bild på skärmen (R6A-2). Vilken bild styrs av data/npc.json, aldrig av koden. */
export function NpcFigur({ npc, mine, nytt, onClick }: Props) {
  const f = NPC_DEL[npc];
  useEffect(() => {
    if (!f) return;
    const hamta = () => Object.values(f.bilder).forEach((u) => void (new Image().src = u));
    const t = window.setTimeout(hamta, 2500);
    return () => window.clearTimeout(t);
  }, [f]);
  if (!f) return null;
  return (
    <button type="button" className={nytt ? "npc-figur nytt" : "npc-figur"} data-testid="npc-figur" data-npc={npc} data-mine={mine} aria-label={f.alt} onClick={onClick}>
      <img src={mineUrl(npc, mine)} alt="" draggable={false} width={512} height={763} />
      {nytt ? <span className="npc-utrop" aria-hidden="true">!</span> : null}
    </button>
  );
}
