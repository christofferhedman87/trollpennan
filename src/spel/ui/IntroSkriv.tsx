// P2: introts sista scen – barnet skriver ordet själv (data/intro.json "skriv"). Nästa bokstav lyser på tangentbordet,
// bara rätt bokstav skrivs in (fel bokstav ger en mjuk skakning, aldrig ett fel-ljud). Hjälp mig visar idéknapparna.
import { useState } from "react";
import { TANGENTBORD } from "./spelData.ts";
import { ljud } from "../ljud.ts";
import "./intro-p2.css";

export type IntroSkrivData = { ord: string; fras: string; uppmaning: string; ljud?: string[]; vakna: string; hjalp: string; tillbaka: string };

export function IntroSkriv({ cfg, ideer, onVakna, onIde }: { cfg: IntroSkrivData; ideer: string[]; onVakna: (fras: string) => void; onIde: (ex: string) => void }) {
  const ord = [...cfg.ord.toLowerCase()];
  const [n, setN] = useState(0);
  const [skak, setSkak] = useState(0);
  const [hjalp, setHjalp] = useState(false);
  const klar = n >= ord.length;
  const nasta = klar ? null : ord[n]!;
  const tryck = (t: string) => {
    ljud.lasOpp();
    if (klar) return;
    if (t === nasta) {
      ljud.fil("klick");
      setN(n + 1);
    } else {
      setSkak((x) => x + 1);
    }
  };
  if (hjalp) {
    return (
      <div className="intro-ideer" data-testid="intro-ideer" role="group" aria-label={cfg.hjalp}>
        {ideer.map((ex) => (
          <button key={ex} type="button" className="intro-ide" data-testid="intro-ide" onClick={() => onIde(ex)}>
            {ex}
          </button>
        ))}
        <button type="button" className="intro-tillbaka" data-testid="intro-tillbaka" onClick={() => setHjalp(false)}>
          {cfg.tillbaka}
        </button>
      </div>
    );
  }
  return (
    <div className="intro-skriv" data-testid="intro-skriv" role="group" aria-label={cfg.uppmaning}>
      <p className="intro-uppmaning">{cfg.uppmaning}</p>
      {cfg.ljud ? <Ljudrad delar={cfg.ljud} n={n} /> : null}
      <div className={skak ? "intro-rutor skak" : "intro-rutor"} key={skak} aria-live="polite">
        {ord.map((b, i) => (
          <span key={`${b}${i}`} className={i < n ? "intro-ruta klar" : i === n ? "intro-ruta nu" : "intro-ruta"} data-testid="intro-ruta" data-klar={i < n ? "ja" : "nej"}>
            {i < n ? b : ""}
          </span>
        ))}
      </div>
      <div className="intro-knappar">
        <button type="button" className={klar ? "intro-vakna redo" : "intro-vakna"} data-testid="intro-vakna" aria-disabled={!klar} onClick={() => (klar ? onVakna(cfg.fras) : setSkak((x) => x + 1))}>
          {cfg.vakna}
        </button>
        <button type="button" className="intro-hjalp" data-testid="intro-hjalp" onClick={() => setHjalp(true)}>
          {cfg.hjalp}
        </button>
      </div>
      <div className="tangenter intro-tangenter" data-testid="intro-tangentbord">
        {TANGENTBORD.rader
          .filter((rad) => !rad.includes("{mellanslag}"))
          .map((rad) => (
            <div className="rad" key={rad.join("")}>
              {rad.map((t) =>
                t === "{radera}" ? (
                  <button key={t} type="button" className="tangent radera" aria-label="Sudda" onClick={() => setN(Math.max(0, n - 1))}>
                    ⌫
                  </button>
                ) : (
                  <button key={t} type="button" className={t === nasta ? "tangent nasta" : "tangent"} data-testid="intro-tangent" data-t={t} onClick={() => tryck(t)}>
                    {t}
                  </button>
                ),
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

/** P2-2 (lån från förslag C): ordet i ljud, "k – a – tt". Ljudet barnet håller på med lyser, de skrivna blir mörka. */
function Ljudrad({ delar, n }: { delar: string[]; n: number }) {
  let start = 0;
  return (
    <p className="intro-ljud" data-testid="intro-ljud" aria-hidden>
      {delar.map((d, i) => {
        const fran = start;
        start += d.length;
        const klass = n >= start ? "klar" : n >= fran ? "nu" : "";
        return (
          <span key={`${d}${i}`}>
            {i > 0 ? <span className="intro-ljud-streck"> – </span> : null}
            <span className={klass}>{d}</span>
          </span>
        );
      })}
    </p>
  );
}
