import { useEffect, useLayoutEffect, useRef, useState } from "react";
import introJson from "../../data/intro.json" with { type: "json" };
import upplevelseJson from "../../data/upplevelse.json" with { type: "json" };
import { sagaNu } from "./saga.ts";
import { rostIntro } from "./rostManifest.ts";
import type { IntroSkrivData } from "./ui/IntroSkriv.tsx";
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
  skriv?: IntroSkrivData;
  v7a?: { langd: number; scener: Scen[] };
};

// TTS-1: rostIntro(12) laddar /ljud/rost/d2ae27a14447d446.mp3. V7A-konstanterna behålls för v7a-intro.test.ts.
const ROST_INTRO = rostIntro(INTRO.scener.length);
const INTRO_LJUD = ROST_INTRO ? ROST_INTRO.f : INTRO.ljud;
const V7A_SCENER: Scen[] = INTRO.v7a?.scener ?? INTRO.scener;
const V7A_LANGD = INTRO.v7a?.langd ?? 7.5;
const SCENER: Scen[] = INTRO.scener.map((s, n) => ({ ...s, fran: ROST_INTRO?.fran[n] ?? s.fran }));
const INTRO_SLUT = 18.75;
const STEG2 = ROST_INTRO?.fran[2] ?? 5.74;
const STEG3 = ROST_INTRO?.fran[10] ?? 13.8;
void V7A_SCENER;
void V7A_LANGD;
/** Introts bilder (Christoffers Firefly-bilder, scripts/intro-bilder.py): en per fas 0–5, stående och liggande. */
const BILDER = 6;
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
  const rostRef = useRef<HTMLAudioElement | null>(null);
  const trasig = useRef(false);
  const spelar = useRef(false);
  const t0 = useRef(0);
  const slutVid = useRef(0);
  const avslutaRef = useRef<() => void>(() => undefined);
  const seekRef = useRef<(sec: number) => void>(() => undefined);
  klarRef.current = onKlar;
  stegRef.current = onSteg;
  const scen = SCENER[i] ?? SCENER[0]!;
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
    if (titelOppen) return;
    const audio = new Audio();
    audio.preload = "auto";
    rostRef.current = audio;
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

    const seek = (sec: number) => {
      t0.current = performance.now() - sec * 1000;
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = Math.min(sec, Math.max(0, audio.duration - 0.05));
      }
      sagaNu.t = sec;
    };
    seekRef.current = seek;

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
      if (t >= INTRO_SLUT) {
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
      setHor(true);
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
      seekRef.current = () => undefined;
    };
  }, [ljudPa, titelOppen]);

  const horPennan = () => {
    const audio = rostRef.current;
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

  const nasta = () => {
    ljud.lasOpp();
    const t = sagaNu.t;
    if (t < STEG2) seekRef.current(STEG2);
    else if (t < STEG3) seekRef.current(STEG3);
    else avslutaRef.current();
  };

  const ordN = scen.ord ?? 0;
  const visaOrd = ordN > 0 || scen.ordklar === true;

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
      <div className="intro-bilder" aria-hidden>
        {Array.from({ length: BILDER }, (_, n) => (
          // Bara den här och nästa bild laddas; en bild som visats ligger kvar så att övertoningen blir mjuk.
          n <= Math.max(scen.fas, 0) + 1 ? (
            <picture key={n} className={n === scen.fas ? "intro-bild aktiv" : "intro-bild"} data-bild={n + 1}>
              <source media="(orientation: portrait)" srcSet={`/intro/${n + 1}-staende.webp`} />
              <img src={`/intro/${n + 1}-liggande.webp`} alt="" decoding="async" fetchPriority={n === 0 ? "high" : "low"} />
            </picture>
          ) : null
        ))}
      </div>
      <p
        className="intro-ord"
        data-testid="intro-ord"
        data-n={ordN}
        data-klar={scen.ordklar ? "ja" : "nej"}
        hidden={!visaOrd}
      >
        {INTRO.ord.map((bok, n) => (
          <span
            key={`${bok}${n}`}
            className={`intro-bokstav${n === ordN - 1 ? " ny" : ""}${n < ordN ? " pa" : ""}`}
            ref={(el) => el?.setAttribute("data-testid", "intro-bokstav")}
          >
            {bok}
          </span>
        ))}
      </p>
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
      <button type="button" className="intro-hor" data-testid="intro-hor" onClick={horPennan} data-varnar={hor ? "ja" : "nej"}>
        🔊 {INTRO.hor}
      </button>
      <p className="intro-text" data-testid="intro-text">
        {scen.text}
      </p>
      <button
        type="button"
        className="intro-nasta"
        ref={(el) => el?.setAttribute("data-testid", "intro-nasta")}
        onPointerDown={(e) => {
          e.stopPropagation();
          ljud.lasOpp();
        }}
        onClick={(e) => {
          e.stopPropagation();
          nasta();
        }}
      >
        Nästa ▸
      </button>
      <div className="intro-ideer" data-testid="intro-ideer" role="group" aria-label={scen.text} hidden>
        {FORSTA_IDEER.map((ex) => (
          <button key={ex} type="button" className="intro-ide" data-testid="intro-ide" onClick={() => onIde(ex)}>
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
