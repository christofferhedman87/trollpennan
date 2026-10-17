import { useEffect, useLayoutEffect, useRef, useState } from "react";
import introJson from "../../data/intro.json" with { type: "json" };
import { sagaNu } from "./saga.ts";

type Scen = { fas: number; text: string; fran: number; ord?: number; ordklar?: boolean };

const INTRO = introJson as {
  hoppa: string;
  meny: string;
  hor: string;
  ljud: string;
  ord: string[];
  langd: number;
  scener: Scen[];
};

const SCENER = INTRO.scener;
const LANGD = INTRO.langd;

export function Intro({
  ljudPa,
  onKlar,
  onSteg,
}: {
  ljudPa: boolean;
  onKlar: () => void;
  onSteg: (fas: number) => void;
}) {
  const [i, setI] = useState(0);
  const [hor, setHor] = useState(false);
  const iRef = useRef(0);
  const fasRef = useRef(0);
  const done = useRef(false);
  const klarRef = useRef(onKlar);
  const stegRef = useRef(onSteg);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trasig = useRef(false);
  const spelar = useRef(false);
  const t0 = useRef(0);
  const slutVid = useRef(0);
  const avslutaRef = useRef<() => void>(() => undefined);
  klarRef.current = onKlar;
  stegRef.current = onSteg;
  const scen = SCENER[i] ?? SCENER[0]!;

  useLayoutEffect(() => {
    sagaNu.aktiv = true;
    sagaNu.t = 0;
    sagaNu.fas = 0;
    sagaNu.ord = 0;
    sagaNu.ordklar = false;
    return () => {
      sagaNu.aktiv = false;
    };
  }, []);

  useEffect(() => {
    const audio = new Audio(INTRO.ljud);
    audio.preload = "auto";
    audioRef.current = audio;
    t0.current = performance.now();
    let raf = 0;
    let stop = false;

    const tid = () => {
      if (trasig.current) return (performance.now() - t0.current) / 1000;
      if (spelar.current && !audio.paused && !audio.ended && audio.currentTime > 0) return audio.currentTime;
      if (spelar.current && audio.ended) {
        return audio.duration + Math.max(0, (performance.now() - slutVid.current) / 1000);
      }
      return (performance.now() - t0.current) / 1000;
    };

    const avsluta = () => {
      if (done.current) return;
      done.current = true;
      sagaNu.aktiv = false;
      audio.pause();
      klarRef.current();
    };
    avslutaRef.current = avsluta;

    const tick = () => {
      if (stop || done.current) return;
      const t = tid();
      let next = 0;
      for (let n = 0; n < SCENER.length; n++) {
        if (SCENER[n]!.fran <= t) next = n;
      }
      const scenNu = SCENER[next]!;
      sagaNu.aktiv = true;
      sagaNu.t = t;
      sagaNu.fas = scenNu.fas;
      sagaNu.ord = scenNu.ord ?? 0;
      sagaNu.ordklar = scenNu.ordklar === true;
      if (scenNu.fas !== fasRef.current) {
        fasRef.current = scenNu.fas;
        stegRef.current(scenNu.fas);
      }
      if (next !== iRef.current) {
        iRef.current = next;
        setI(next);
      }
      if (t >= LANGD) {
        avsluta();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    audio.addEventListener("ended", () => {
      slutVid.current = performance.now();
    });
    audio.addEventListener("error", () => {
      trasig.current = true;
      setHor(false);
    });

    if (ljudPa) {
      const lov = audio.play();
      if (lov) {
        lov
          .then(() => {
            const wall = (performance.now() - t0.current) / 1000;
            if (wall > 0.4 && Number.isFinite(audio.duration) && wall < audio.duration) {
              audio.currentTime = wall;
            }
            spelar.current = true;
          })
          .catch(() => {
            if (!trasig.current && !audio.error) setHor(true);
          });
      }
    }

    raf = requestAnimationFrame(tick);
    return () => {
      stop = true;
      cancelAnimationFrame(raf);
      audio.pause();
      avslutaRef.current = () => undefined;
    };
  }, [ljudPa]);

  const horPennan = () => {
    const audio = audioRef.current;
    if (!audio || trasig.current) return;
    const wall = (performance.now() - t0.current) / 1000;
    if (Number.isFinite(audio.duration) && wall < audio.duration) audio.currentTime = wall;
    audio
      .play()
      .then(() => {
        spelar.current = true;
        setHor(false);
      })
      .catch(() => undefined);
  };

  const ordN = scen.fas === 2 ? (scen.ord ?? 0) : 0;

  return (
    <div className="intro" data-testid="intro" data-fas={scen.fas} role="dialog" aria-label="Intro">
      {ordN > 0 ? (
        <p className="intro-ord" data-testid="intro-ord" data-n={ordN} data-klar={scen.ordklar ? "ja" : "nej"}>
          {INTRO.ord.slice(0, ordN).map((bok, n) => (
            <span key={`${bok}${n}`} className={n === ordN - 1 ? "ny" : ""}>
              {bok}
            </span>
          ))}
        </p>
      ) : null}
      <button type="button" className="intro-hoppa" data-testid="intro-hoppa" onClick={() => avslutaRef.current()}>
        {INTRO.hoppa}
      </button>
      {hor ? (
        <button type="button" className="intro-hor" data-testid="intro-hor" onClick={horPennan}>
          {INTRO.hor}
        </button>
      ) : null}
      <p className="intro-text" data-testid="intro-text">
        {scen.text}
      </p>
    </div>
  );
}
