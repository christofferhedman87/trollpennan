import { useEffect } from "react";
import { NPC_DEL, mineUrl } from "../npc.ts";

type Props = { npc: string; mine: string; nytt: boolean; onClick: () => void };

/** En figur som 2D-bild på skärmen (R6A-2). Vilken bild styrs av data/npc.json, aldrig av koden. */
export function NpcFigur({ npc, mine, nytt, onClick }: Props) {
  const f = NPC_DEL[npc];
  useEffect(() => {
    if (!f) return;
    const hamta = () => {
      for (const k of Object.keys(f.bilder)) {
        if (k === "automat") continue;
        const u = f.bilder[k];
        if (u) void (new Image().src = u);
      }
    };
    const t = window.setTimeout(hamta, 2500);
    return () => window.clearTimeout(t);
  }, [f]);
  if (!f) return null;
  const visadMine = mine === "automat" ? "tankande" : mine;
  const bildSrc = mineUrl(npc, visadMine) || mineUrl(npc, f.standard);
  return (
    <button type="button" className={nytt ? "npc-figur nytt" : "npc-figur"} style={{ "--npc-h": f.storlek?.hojd ?? "176px" } as React.CSSProperties} data-testid="npc-figur" data-v6="bengtsson-medaljong" data-npc={npc} data-mine={mine} aria-label={f.alt} onClick={onClick}>
      <img src={bildSrc} alt="" draggable={false} width={512} height={763} />
      {nytt ? <span className="npc-utrop" aria-hidden="true">!</span> : null}
      {mine === "automat" ? (
        <span className="npc-fel-text" data-testid="inte-riktigt-an">
          Inte riktigt än
        </span>
      ) : null}
    </button>
  );
}

type IkonProps = { npc: string; nytt: boolean; text: string; alt: string; onClick: () => void };

/** R9: liten knapp med Bengtssons huvud. Visas när figuren inte står på ängen och ger alltid ett uppdrag direkt. */
export function NpcIkon({ npc, nytt, text, alt, onClick }: IkonProps) {
  const f = NPC_DEL[npc];
  if (!f) return null;
  return (
    <button type="button" className={nytt ? "npc-ikon nytt" : "npc-ikon"} data-testid="bengtsson-ikon" data-v6="bengtsson-medaljong" aria-label={alt} onClick={onClick}>
      <img src={mineUrl(npc, f.standard)} alt="" draggable={false} width={52} height={52} />
      <span>📋 {text}</span>
    </button>
  );
}
