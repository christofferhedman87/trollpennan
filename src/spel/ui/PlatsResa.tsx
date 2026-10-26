// B1.4: platsnamn, "Till ängen", ton-lager, intro-bubbla och skylt när ny plats väntar.
import { START_PLATS } from "../platser.ts";
import { mineUrl } from "../npc.ts";
import { VaktarAptitBubbla, vaktarForPlats } from "../ang/vaktardjur.tsx";

type Props = {
  plats: string;
  namn: string;
  ton: boolean;
  skylt: boolean;
  intro: { text: string; min: string } | null;
  hem: () => void;
};

export function PlatsResa({ plats, namn, ton, skylt, intro, hem }: Props) {
  return (
    <>
      {plats !== START_PLATS ? (
        <div className="plats-resa" data-testid="plats-resa">
          <p className="plats-namn" data-testid="plats-namn">
            {namn}
          </p>
          <button type="button" className="plats-hem" data-testid="plats-hem" onClick={hem}>
            Till ängen
          </button>
        </div>
      ) : null}
      {skylt ? <span className="plats-skylt" data-testid="plats-skylt" aria-hidden /> : null}
      {ton ? <div className="plats-ton" data-testid="plats-ton" aria-hidden /> : null}
      {intro ? (
        <div className="plats-intro" data-testid="plats-intro">
          <img src={mineUrl("bengtsson", intro.min === "automat" ? "tankande" : intro.min)} alt="" width={72} height={72} />
          <p>{intro.text}</p>
        </div>
      ) : null}
      {vaktarForPlats(plats) ? <VaktarAptitBubbla plats={plats} /> : null}
    </>
  );
}
