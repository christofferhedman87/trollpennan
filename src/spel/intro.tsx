import { useEffect, useLayoutEffect, useRef, useState } from "react";
import introJson from "../../data/intro.json" with { type: "json" };
import upplevelseJson from "../../data/upplevelse.json" with { type: "json" };
import { sagaNu } from "./saga.ts";
import { rostIntro } from "./rostManifest.ts";
import { IntroSkriv, type IntroSkrivData } from "./ui/IntroSkriv.tsx";
import { useStart } from "./start.ts";
import { ljud } from "./ljud.ts";
import "./intro.css";

type Scen = { fas: number; text: string; fran: number; ord?: number; ordklar?: boolean };

const INTRO = introJson as {
  hoppa: string;
  meny: string;
  hor: string;
  ljud: string;
  ord: string[];
  langd: number;
  scener: Scen[];
  /** P2: finns den slutar introt med att barnet skriver ordet själv. */
  skriv?: IntroSkrivData;
  /** V7a: tre korta steg. `scener` (12) lämnas orörd så röstfilen fortfarande matchar. */
  v7a?: { langd: number; scener: Scen[] };
};

// TTS-1: rostIntro(12) laddar /ljud/rost/c435a58d.mp3. Visningen styrs av v7a (högst 8 s).
const ROST_INTRO = rostIntro(INTRO.scener.length);
const INTRO_LJUD = ROST_INTRO ? ROST_INTRO.f : INTRO.ljud;
const V7A_SCENER: Scen[] = INTRO.v7a?.scener ?? INTRO.scener;
const V7A_LANGD = INTRO.v7a?.langd ?? 7.5;
const FORSTA_IDEER = [0, 2, 3, 4]
  .map((i) => (upplevelseJson as { examples: string[] }).examples[i])
  .filter((ex): ex is string => Boolean(ex));

export function Intro({
  ljudPa,
  onKlar,
  onSteg,
  onIde,
}: {
  ljudPa: boolean;
  onKlar: () => void;
  onSteg: (fas: number) => void;
  onIde: (ex: string) => void;
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
  const scen = V7A_SCENER[i] ?? V7A_SCENER[0]!;
  // P2-2: introt (klocka och röst) startar först när titelskärmen är stängd – trycket på "Börja" låser också upp ljudet
  const titelOppen = useStart((st) => st.titelOppen);

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
    // TTS-1: filen sätts först efter en mikrotask, så att ett intro som stängs direkt (introt redan sett) inte laddar något
    if (titelOppen) return;
    const audio = new Audio();
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
      for (let n = 0; n < V7A_SCENER.length; n++) {
        if (V7A_SCENER[n]!.fran <= t) next = n;
      }
      const scenNu = V7A_SCENER[next]!;
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
      if (t >= V7A_LANGD) {
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

    queueMicrotask(() => {
      if (stop) return;
      audio.src = INTRO_LJUD;
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
    });

    raf = requestAnimationFrame(tick);
    return () => {
      stop = true;
      cancelAnimationFrame(raf);
      audio.pause();
      avslutaRef.current = () => undefined;
    };
  }, [ljudPa, titelOppen]);

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
    <div
      className="intro"
      data-testid="intro"
      data-v7a="intro-rot"
      data-fas={scen.fas}
      role="dialog"
      aria-label="Intro"
      onPointerDown={(e) => {
        e.stopPropagation();
        ljud.lasOpp();
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {ordN > 0 ? (
        <p className="intro-ord" data-testid="intro-ord" data-n={ordN} data-klar={scen.ordklar ? "ja" : "nej"}>
          {INTRO.ord.slice(0, ordN).map((bok, n) => (
            <span key={`${bok}${n}`} className={n === ordN - 1 ? "ny" : ""}>
              {bok}
            </span>
          ))}
        </p>
      ) : null}
      <button
        type="button"
        className="intro-hoppa"
        data-testid="intro-hoppa"
        data-v7a="hoppa-over"
        onPointerDown={(e) => {
          e.stopPropagation();
          ljud.lasOpp();
        }}
        onClick={(e) => {
          e.stopPropagation();
          ljud.lasOpp();
          avslutaRef.current();
        }}
      >
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
      {scen.fas >= 5 && INTRO.skriv ? (
        <IntroSkriv cfg={INTRO.skriv} ideer={FORSTA_IDEER} onVakna={onIde} onIde={onIde} />
      ) : scen.fas >= 5 ? (
        <div className="intro-ideer" data-testid="intro-ideer" role="group" aria-label={scen.text}>
          {FORSTA_IDEER.map((ex) => (
            <button key={ex} type="button" className="intro-ide" data-testid="intro-ide" onClick={() => onIde(ex)}>
              {ex}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
