import { OMR, TEXTER_AV } from "../aventyr.ts";
import { PLATSER, upplast, mattUr } from "../platser.ts";
import { useMinne } from "../minne.ts";
import { TEXTER } from "./spelData.ts";

type KartaLagerProps = {
  forstaRad: string[] | null;
  kartaText: string | null;
  /** Resa till en världsplats (B1.4 PLATSER) eller "garden" (Phaser-gården, orörd). */
  tryckPlats: (id: string) => void;
  /** @deprecated B1.4: lås styrs av upplast()/oppnadePlatser; behålls för anropskompatibilitet. */
  oppna: string[];
};

/** B1.4: listar PLATSER (ängen/skogen/sjön/grottan) i stället för Phaser-OMR.omraden. Gården-knappen finns kvar. */
export function KartaLager({ forstaRad, kartaText, tryckPlats }: KartaLagerProps) {
  const m = mattUr(useMinne.getState());
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
      {PLATSER.map((o) => {
        const oppen = upplast(o.id, m);
        return (
          <button
            key={o.id}
            type="button"
            className={`plats-knapp ${o.id}${oppen ? " oppen" : ""}`}
            data-testid={`plats-${o.id}`}
            disabled={!oppen}
            onClick={() => tryckPlats(o.id)}
          >
            {oppen ? o.namn : `${o.namn} (låst)`}
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
