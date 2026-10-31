// Nya Skapa 6.8: svarsraden ligger alltid ovanför tangenterna och skyms aldrig. Högst en sak åt gången:
// Menade du …? → böjningshjälp → Pennan behöver … → guldchansen.
import { useLayoutEffect, useRef } from "react";
import uiJson from "../../../../data/skapa-ui.json" with { type: "json" };
import { fyll } from "../../fyll.ts";
import { stavningsFeedback } from "../../lasniva.ts";
import { ikon, kortBild } from "../../skapa/ikoner.ts";
import { huvudord } from "../../skapa/meningsbrickor.ts";
import { useSpel } from "../SpelKontext.ts";
import { harBoksvar } from "../../skapa/svarsLage.ts";
import { Fet } from "./Hjalprad.tsx";

const UI = uiJson as unknown as { svar: Record<string, string> };

export function Svarsrad() {
  const k = useSpel();
  const { forslag, behover } = k.t;
  const { utfor } = k.s;
  const { remsa, valjForslag, nejForslag, rattaBojning, erbjud, setErbjud, startaGuld, spok } = k.sk;
  const svarRef = useRef<HTMLDivElement>(null);
  const bi = remsa.brickor.findIndex((b) => b.boj);
  const skriverGuld = !!spok;
  useLayoutEffect(() => {
    if (skriverGuld || !svarRef.current) return;
    const visa = () => {
      if (window.matchMedia("(orientation: landscape) and (max-height: 600px), (orientation: portrait) and (max-height: 720px)").matches) {
        svarRef.current?.scrollIntoView({ block: "start", inline: "nearest", behavior: "instant" });
      }
    };
    visa();
    window.addEventListener("resize", visa);
    return () => window.removeEventListener("resize", visa);
  }, [forslag, behover, erbjud, bi, skriverGuld]);
  if (!harBoksvar(k.sk, k.t)) return null;
  if (forslag && forslag.forslag.length) {
    const f0 = forslag.forslag[0]!.visa;
    const fb = stavningsFeedback(forslag.token, f0);
    const n = fb?.rattPrefix?.length ?? 0;
    const [fore, efter] = (UI.svar.menade ?? "{ord}").split("{ord}");
    return (
      <div ref={svarRef} className="sk-svar" data-testid="forslag" aria-live="polite">
        <p>
          {fore}
          <span className="sk-jamfor">
            <span className="ratt">{forslag.token.slice(0, n)}</span>
            <span className="rest">{forslag.token.slice(n)}</span>
          </span>
          {efter}
        </p>
        {forslag.forslag.slice(0, 3).map((f) => (
          <button key={f.id} type="button" className="sk-knapp" data-testid={`forslag-${f.id}`} onClick={() => valjForslag(f)}>
            <img alt="" src={kortBild(f.id)} />
            {f.visa}
          </button>
        ))}
        <button type="button" className="sk-knapp dov" data-testid="nej" onClick={nejForslag}>
          {UI.svar.behall}
        </button>
      </div>
    );
  }
  if (bi >= 0) {
    const b = remsa.brickor[bi]!;
    const h = huvudord(remsa.brickor, bi);
    return (
      <div ref={svarRef} className="sk-svar" data-dal="boj" aria-live="polite">
        <p>
          <Fet text={fyll(UI.svar.boj ?? "", { ratt: b.boj!, artikel: h?.genus ?? "", ord: h?.t ?? "" })} />
        </p>
        <button type="button" className="sk-knapp" onClick={() => rattaBojning(b.i, b.boj!)}>
          {b.boj}
        </button>
      </div>
    );
  }
  if (behover) {
    return (
      <div ref={svarRef} className="sk-svar" data-testid="behover" aria-live="polite">
        <p>{behover.text}</p>
        {behover.djur.map((d) => (
          <button key={d.id} type="button" className="sk-knapp" data-testid={`prova-${d.id}`} onClick={() => utfor(d.id, { hand: false })}>
            <img alt="" src={kortBild(d.id)} />
            {d.visa}
          </button>
        ))}
      </div>
    );
  }
  if (erbjud) {
    return (
      <div ref={svarRef} className="sk-svar" data-dal="guldchans" aria-live="polite">
        <p>
          <Fet text={fyll(UI.svar.guldchans ?? "", { ord: erbjud.visa })} />
        </p>
        <button type="button" className="sk-knapp guld" onClick={() => startaGuld(erbjud)}>
          <img alt="" src={ikon("ui", "penna")} />
          {UI.svar.guldchans_ja}
        </button>
        <button type="button" className="sk-knapp dov" onClick={() => setErbjud(null)}>
          {UI.svar.guldchans_nej}
        </button>
      </div>
    );
  }
  return null;
}
