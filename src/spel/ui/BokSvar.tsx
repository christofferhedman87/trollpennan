// P1: barnets svarsyta i boken – "Menade du …?" och "Pennan behöver …". Ligger UTANFÖR bokens skrollyta (bok-mitt),
// direkt ovanför skrivrutan, så att knapparna alltid syns hela och aldrig hamnar under rutan (granskningen 1.2, K4).
import type { ForslagKort } from "@/tolk/typer.ts";
import lasningJson from "../../../data/lasning.json" with { type: "json" };
import { stavningsFeedback } from "../lasniva.ts";
import * as rostKo from "../rostKo.ts";
import type { Forslag } from "./typer.ts";
import "./bok-p1.css";

type Props = {
  forslag: Forslag | null;
  valjForslag: (kortet: ForslagKort) => void;
  nejForslag: () => void;
  behover: { text: string; djur: { id: string; visa: string }[] } | null;
  utfor: (raw: string, opt: { hand: boolean; inteGuld?: string[] }) => void;
};

export function BokSvar({ forslag, valjForslag, nejForslag, behover, utfor }: Props) {
  const fb = forslag && forslag.forslag.length > 0 ? stavningsFeedback(forslag.token, forslag.forslag[0]!.visa) : null;
  if (!forslag && !behover) return null;
  return (
    <div className="bok-svar" aria-live="polite">
      {forslag ? (
        <div className="forslag" data-testid="forslag" data-v5="stavning-kort">
          <p>{forslag.text}</p>
          {fb ? (
            <p className="stavning-rad" data-p4="stavning-tips">
              {fb.rattPrefix && (
                <span className="stavning-ratt" data-p4="stavning-ratt">
                  {fb.rattPrefix}
                </span>
              )}
              {fb.restenSkrivet && <span className="stavning-rest">{fb.restenSkrivet}</span>}
              <span className="stavning-forklaring"> — {fb.forklaring}</span>
            </p>
          ) : null}
          <button
            type="button"
            className="lyssna-knapp"
            data-p4="lyssna-forslag"
            aria-label={lasningJson.lyssna.aria_forslag}
            onClick={() => rostKo.lasUpp(`${forslag.text} ${forslag.forslag.map((f) => f.visa).join(", ")}`)}
          >
            🔊 {lasningJson.lyssna.knapp}
          </button>
          <div className="rad-kort">
            {forslag.forslag.map((f) => (
              <button key={f.id} type="button" className="kort" data-testid={`forslag-${f.id}`} onClick={() => valjForslag(f)}>
                {f.visa}
              </button>
            ))}
            <button type="button" className="nej" data-testid="nej" onClick={nejForslag}>
              Nej
            </button>
          </div>
        </div>
      ) : behover ? (
        <div className="behover" data-testid="behover">
          <p>{behover.text}</p>
          <button
            type="button"
            className="lyssna-knapp"
            data-p4="lyssna-onska"
            aria-label={lasningJson.lyssna.aria_onska}
            onClick={() => rostKo.lasUpp(behover.text)}
          >
            🔊 {lasningJson.lyssna.knapp}
          </button>
          <div className="rad-kort">
            {behover.djur.map((d) => (
              <button key={d.id} type="button" className="kort" data-testid={`prova-${d.id}`} onClick={() => utfor(d.id, { hand: false })}>
                {d.visa}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
