import { OMR, TEXTER_AV } from "../aventyr.ts";
import { TEXTER } from "./spelData.ts";

type KartaLagerProps = {
  forstaRad: string[] | null;
  kartaText: string | null;
  tryckPlats: (id: string) => void;
  oppna: string[];
};

export function KartaLager({ forstaRad, kartaText, tryckPlats, oppna }: KartaLagerProps) {
  return (
          <div className="karta-lager" data-testid="karta">
            <h2>{OMR.karta.rubrik}</h2>
            <p>{OMR.karta.hjalp}</p>
            {forstaRad?.map((r) => (
              <p key={r}>{r}</p>
            ))}
            {kartaText ? <p data-testid="karta-text">{kartaText}</p> : null}
            <button type="button" className="plats-knapp hem" data-testid="plats-garden" onClick={() => tryckPlats("garden")}>
              {TEXTER.flikar.garden}
            </button>
            {OMR.omraden.map((o) => {
              const last = o.nas_fran !== "garden" && !oppna.includes(o.nas_fran);
              const oppen = !o.hinder || oppna.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  className={`plats-knapp ${o.id}${oppen ? " oppen" : ""}`}
                  data-testid={`plats-${o.id}`}
                  disabled={last}
                  onClick={() => tryckPlats(o.id)}
                >
                  {o.namn}
                </button>
              );
            })}
          </div>
  );
}

type OmradeHudProps = {
  tryckPlats: (id: string) => void;
  bytFolje: () => void;
};

export function OmradeHud({ tryckPlats, bytFolje }: OmradeHudProps) {
  return (
          <div className="omrade-hud">
            <button type="button" data-testid="hem-knapp" onClick={() => tryckPlats("garden")}>
              {OMR.karta.hem}
            </button>
            <button type="button" data-testid="byt-folje" onClick={bytFolje}>
              {TEXTER_AV.foljeslagare.byt}
            </button>
          </div>
  );
}
