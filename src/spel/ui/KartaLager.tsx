// Världskartan (2026-10-30): Christoffers målade sagokarta (public/karta, scripts/varldskarta-bild.py) med platserna
// som stora knappar och träskyltar ovanpå, Trollpennan som spelpjäs ("Du är här") och lite liv: glitter längs
// stigen, moln, gnistor vid grottan och skimmer på sjön. Kartan går att zooma (nyp, dubbeltryck, hjul, högst 2×) och
// dra. Ett tryck på en plats låter pjäsen vandra längs stigen dit (ca 1 s, ett nytt tryck hoppar fram) och sedan
// reser spelet som förut (tryckPlats). Lägen, stigen och vyns matematik finns i ../varldskarta.ts.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { OMR, TEXTER_AV } from "../aventyr.ts";
import { useMinne } from "../minne.ts";
import { START_PLATS } from "../platser.ts";
import * as rostKo from "../rostKo.ts";
import {
  KARTPLATSER,
  KART_ASPEKT,
  KART_SIZES,
  STAM,
  basStorlek,
  blandaVy,
  centreraPa,
  iVyn,
  kartPlats,
  kartSrcset,
  klampa,
  mjukt,
  punktLangs,
  rutt,
  startVy,
  svgBana,
  zoomaKring,
  type Punkt,
  type Ram,
  type Vy,
} from "../varldskarta.ts";
import "./varldskarta.css";

const T = OMR.karta;
/** Pjäsens vandring till en ny plats. */
const RESA_MS = 1050;
/** Så nära zoomar kartan in mot målet under resan. */
const RESA_ZOOM = 1.6;
const DRA_TROSKEL = 8;
/** Så högt ovanför platsens mitt en skylt över ringen når (halva ringen, mellanrum och skylten). */
const SKYLT_OVER_PX = 32 + 2 + 40;
const VB_H = 1000 / KART_ASPEKT;

type KartaLagerProps = {
  forstaRad: string[] | null;
  kartaText: string | null;
  /** Resa till en världsplats (B1.4 PLATSER) eller "garden" (gården). */
  tryckPlats: (id: string) => void;
  /** Låst plats: visa ERROR + "Inte riktigt än". */
  onLast: () => void;
  /** @deprecated B1.4: lås styrs av upplast(); behålls för anropskompatibilitet. */
  oppna: string[];
  stangKarta?: () => void;
  nuvarandePlats?: string;
};

function arBesokt(id: string, oppnade: string[], forstaGard: boolean): boolean {
  return id === "ang" || oppnade.includes(id) || (id === "garden" && !forstaGard);
}

function minskadRorelse(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const med = (mall: string, namn: string) => mall.replace("{namn}", namn);

/** Stigen, Dimsjöns streckade gren och glittret som vandrar längs stigen (i kartbladets egna koordinater). */
function Stig({ rorelse }: { rorelse: boolean }) {
  const stam = useMemo(() => svgBana(STAM), []);
  const sjo = useMemo(() => svgBana(kartPlats("sjon")?.stig ?? []), []);
  return (
    <svg className="vk-stig" data-v1="varldskarta-stig" viewBox={`0 0 1000 ${VB_H.toFixed(1)}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={sjo} className="vk-gren-kant" />
      <path d={sjo} className="vk-gren" />
      {rorelse
        ? [0, 1, 2, 3, 4, 5].map((n) => (
            <g key={n} className="vk-glitter">
              <circle r="13" className="vk-glitter-sken" />
              <circle r="5" className="vk-glitter-karna" />
              <animateMotion dur="15s" begin={`${-n * 2.5}s`} repeatCount="indefinite" path={stam} />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.9;1" dur="15s" begin={`${-n * 2.5}s`} repeatCount="indefinite" />
            </g>
          ))
        : null}
    </svg>
  );
}

/** Molnen, gnistorna vid Kristallgrottan och skimret på Dimsjön (rena CSS-animationer, av vid minskad rörelse). */
function Liv() {
  const gnistor: [number, number, number][] = [[0.33, 0.085, 1.7], [0.402, 0.08, 1.4], [0.35, 0.128, 1.2], [0.392, 0.118, 2], [0.312, 0.118, 1.1]];
  const skimmer: [number, number][] = [[0.62, 0.165], [0.71, 0.235], [0.81, 0.148], [0.9, 0.255], [0.665, 0.285], [0.765, 0.205]];
  return (
    <div className="vk-liv" aria-hidden="true">
      {skimmer.map(([x, y], n) => (
        <span key={`s${n}`} className="vk-skimmer" style={{ left: `${x * 100}%`, top: `${y * 100}%`, animationDelay: `${-n * 0.9}s` } as CSSProperties} />
      ))}
      {gnistor.map(([x, y, k], n) => (
        <span key={`g${n}`} className="vk-gnista" style={{ left: `${x * 100}%`, top: `${y * 100}%`, "--k": k, animationDelay: `${-n * 0.55}s` } as CSSProperties} />
      ))}
      <img className="vk-moln vk-moln-1" src="/karta/moln.webp" alt="" draggable={false} />
      <img className="vk-moln vk-moln-2" src="/karta/moln.webp" alt="" draggable={false} />
    </div>
  );
}

/** Kompassros i plommon och guld (dekoration på pergamentet). */
function Kompass() {
  const spets = (v: number, lang: number, farg: string) => (
    <polygon key={`${v}${lang}`} points={`50,${50 - lang} 56,50 50,${50 + 6} 44,50`} fill={farg} stroke="#3b1a3a" strokeWidth="2.2" strokeLinejoin="round" transform={`rotate(${v} 50 50)`} />
  );
  return (
    <svg className="vk-kompass" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="33" fill="none" stroke="#3b1a3a" strokeWidth="2" strokeDasharray="3 5" opacity="0.6" />
      {[45, 135, 225, 315].map((v) => spets(v, 26, "#f4c9a0"))}
      {[0, 90, 180, 270].map((v) => spets(v, 44, v === 0 ? "#ef4f76" : "#ffd54a"))}
      <circle cx="50" cy="50" r="5" fill="#fff6e5" stroke="#3b1a3a" strokeWidth="2" />
    </svg>
  );
}

/** B1.4/V1: sagokarta. Alla vägar är öppna när OLAST_KARTA är sann. */
export function KartaLager({ kartaText, tryckPlats, stangKarta, nuvarandePlats }: KartaLagerProps) {
  const oppnadePlatser = useMinne((s) => s.oppnadePlatser);
  const forstaGard = useMinne((s) => s.forstaGard);
  const nu = kartPlats(nuvarandePlats ?? START_PLATS)?.id ?? START_PLATS;
  const [rorelse] = useState(() => !minskadRorelse());
  const [resaTill, setResaTill] = useState<string | null>(null);
  const [klar, setKlar] = useState(false);

  const vyRef = useRef<HTMLDivElement>(null);
  const ram = useRef<Ram>({ w: 1, h: 1 });
  const bas = useRef<Ram>({ w: 1, h: 1 });
  const vy = useRef<Vy>({ s: 1, tx: 0, ty: 0 });
  const pjas = useRef<Punkt>(kartPlats(nu)?.pos ?? [0.5, 0.5]);
  const anim = useRef(0);
  const resa = useRef<{ id: string } | null>(null);
  const drog = useRef(false);
  const lista = useRef(new Map<string, HTMLLIElement>());

  /** Skriver vyn och pjäsens läge som CSS-variabler; bladet, skyltarna och pjäsen räknar ut sina lägen ur dem. */
  const rita = useCallback(() => {
    const el = vyRef.current;
    if (!el) return;
    const v = vy.current;
    const st = el.style;
    st.setProperty("--tx", `${v.tx.toFixed(2)}px`);
    st.setProperty("--ty", `${v.ty.toFixed(2)}px`);
    st.setProperty("--s", v.s.toFixed(4));
    st.setProperty("--bw", `${bas.current.w.toFixed(2)}px`);
    st.setProperty("--bh", `${bas.current.h.toFixed(2)}px`);
    st.setProperty("--mx", pjas.current[0].toFixed(4));
    st.setProperty("--my", pjas.current[1].toFixed(4));
    el.dataset.zoom = v.s > 1.02 ? "ja" : "nej";
    // En skylt över ringen som inte får plats ovanför vyns kant läggs under ringen i stället.
    for (const p of KARTPLATSER) {
      const li = lista.current.get(p.id);
      if (!li || p.skylt !== "over") continue;
      const lage = iVyn(p.pos, v, bas.current).y - SKYLT_OVER_PX < 0 ? "under" : "over";
      if (li.dataset.lage !== lage) li.dataset.lage = lage;
    }
  }, []);

  const satt = useCallback(
    (v: Vy) => {
      vy.current = klampa(v, bas.current, ram.current);
      rita();
    },
    [rita],
  );

  /** Mjuk övergång till en ny vy (dubbeltryck). */
  const glid = useCallback(
    (mal: Vy, ms = 320) => {
      cancelAnimationFrame(anim.current);
      const fran = vy.current;
      const t0 = performance.now();
      const steg = (nuT: number) => {
        const u = Math.min(1, (nuT - t0) / ms);
        satt(blandaVy(fran, mal, mjukt(u)));
        if (u < 1) anim.current = requestAnimationFrame(steg);
      };
      anim.current = requestAnimationFrame(steg);
    },
    [satt],
  );

  useLayoutEffect(() => {
    const el = vyRef.current;
    if (!el) return;
    const mat = () => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      const forra = ram.current;
      ram.current = { w: r.width, h: r.height };
      bas.current = basStorlek(ram.current);
      vy.current = forra.w > 1 && vy.current.s > 1 ? klampa(vy.current, bas.current, ram.current) : startVy(bas.current, ram.current);
      rita();
      setKlar(true);
    };
    mat();
    const ro = new ResizeObserver(mat);
    ro.observe(el);
    return () => ro.disconnect();
  }, [rita]);

  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  /** Pjäsen är framme (eller barnet hoppade fram): resan i spelet börjar. */
  const framme = useCallback(
    (id: string) => {
      cancelAnimationFrame(anim.current);
      resa.current = null;
      tryckPlats(id);
    },
    [tryckPlats],
  );

  /** tangentbord = klicket kom från Enter/mellanslag (då räknas ingen dragning). */
  const res = (id: string, tangentbord = false) => {
    if (drog.current && !tangentbord) return;
    if (resa.current) {
      framme(resa.current.id);
      return;
    }
    const mal = kartPlats(id);
    if (!mal || id === nu || !rorelse) {
      tryckPlats(id);
      return;
    }
    const vag = rutt(nu, id);
    const vy0 = vy.current;
    const vy1 = centreraPa(mal.pos, Math.max(vy0.s, RESA_ZOOM), bas.current, ram.current);
    resa.current = { id };
    setResaTill(id);
    const t0 = performance.now();
    const steg = (nuT: number) => {
      const u = Math.min(1, (nuT - t0) / RESA_MS);
      pjas.current = punktLangs(vag, mjukt(u));
      vy.current = klampa(blandaVy(vy0, vy1, mjukt(Math.min(1, u * 1.15))), bas.current, ram.current);
      rita();
      if (u < 1) anim.current = requestAnimationFrame(steg);
      else anim.current = requestAnimationFrame(() => framme(id));
    };
    anim.current = requestAnimationFrame(steg);
  };

  /* ---------------------------------------------------------------- gester: dra, nyp, dubbeltryck, hjul */
  const pekare = useRef(new Map<number, { x: number; y: number }>());
  const gest = useRef<{ vy: Vy; dist: number; mx: number; my: number; x0: number; y0: number } | null>(null);
  const forraTryck = useRef<{ t: number; x: number; y: number } | null>(null);

  const iRam = (e: { clientX: number; clientY: number }) => {
    const r = vyRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const borjaGest = () => {
    const p = [...pekare.current.values()];
    const [a, b] = [p[0]!, p[1] ?? p[0]!];
    gest.current = { vy: vy.current, dist: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, x0: a.x, y0: a.y };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (resa.current) {
      e.preventDefault();
      framme(resa.current.id);
      return;
    }
    if (pekare.current.size === 0) drog.current = false;
    cancelAnimationFrame(anim.current);
    pekare.current.set(e.pointerId, iRam(e));
    borjaGest();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pekare.current.has(e.pointerId) || !gest.current) return;
    pekare.current.set(e.pointerId, iRam(e));
    const g = gest.current;
    const p = [...pekare.current.values()];
    if (p.length >= 2) {
      const [a, b] = [p[0]!, p[1]!];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      drog.current = true;
      const z = zoomaKring(g.vy, g.mx, g.my, g.vy.s * (dist / Math.max(1, g.dist)), bas.current, ram.current);
      satt({ s: z.s, tx: z.tx + (mx - g.mx), ty: z.ty + (my - g.my) });
      return;
    }
    const a = p[0]!;
    const dx = a.x - g.x0;
    const dy = a.y - g.y0;
    if (!drog.current && Math.hypot(dx, dy) < DRA_TROSKEL) return;
    if (!drog.current) {
      drog.current = true;
      try {
        vyRef.current?.setPointerCapture(e.pointerId);
      } catch {
        /* pekaren finns inte längre */
      }
    }
    satt({ s: g.vy.s, tx: g.vy.tx + dx, ty: g.vy.ty + dy });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const fanns = pekare.current.delete(e.pointerId);
    if (pekare.current.size > 0) {
      borjaGest();
      return;
    }
    gest.current = null;
    if (!fanns || drog.current || e.type === "pointercancel") return;
    // Dubbeltryck på kartan (inte på en knapp): zooma in dit, eller ut igen.
    if ((e.target as HTMLElement).closest("button")) return;
    const p = iRam(e);
    const f = forraTryck.current;
    const nuT = performance.now();
    if (f && nuT - f.t < 320 && Math.hypot(p.x - f.x, p.y - f.y) < 30) {
      forraTryck.current = null;
      const v = vy.current;
      glid(v.s > 1.05 ? startVy(bas.current, ram.current) : zoomaKring(v, p.x, p.y, 2, bas.current, ram.current));
      return;
    }
    forraTryck.current = { t: nuT, x: p.x, y: p.y };
  };

  useEffect(() => {
    const el = vyRef.current;
    if (!el) return;
    const hjul = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const v = vy.current;
      satt(zoomaKring(v, e.clientX - r.left, e.clientY - r.top, v.s * Math.exp(-e.deltaY * 0.0016), bas.current, ram.current));
    };
    el.addEventListener("wheel", hjul, { passive: false });
    return () => el.removeEventListener("wheel", hjul);
  }, [satt]);

  /** Tangentbord: en plats som får fokus utanför den inzoomade vyn flyttas fram. */
  const visaPlats = (p: Punkt) => {
    const v = vy.current;
    if (v.s <= 1.02) return;
    const { x, y } = iVyn(p, v, bas.current);
    const marg = 70;
    if (x < marg || y < marg || x > ram.current.w - marg || y > ram.current.h - marg) glid(centreraPa(p, v.s, bas.current, ram.current));
  };

  return (
    <div className="karta-lager vk" data-testid="karta" role="dialog" aria-modal="true" aria-label={T.rubrik} data-rorelse={rorelse ? "ja" : "nej"}>
      <Kompass />
      <header className="vk-topp" data-v1="varldskarta-topp">
        <h2 className="vk-rubrik">{T.rubrik}</h2>
        <p className="vk-hjalp">{T.hjalp}</p>
        {kartaText ? (
          <p className="vk-meddelande" data-testid="karta-text">
            {kartaText}
          </p>
        ) : null}
      </header>
      <div
        className="vk-vy"
        ref={vyRef}
        data-klar={klar ? "ja" : "nej"}
        data-resa={resaTill ?? undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="vk-blad">
          <div className="vk-veckla">
            <picture>
              <source type="image/avif" srcSet={kartSrcset("avif")} sizes={KART_SIZES} />
              <img className="vk-bild" src="/karta/karta-1600.webp" srcSet={kartSrcset("webp")} sizes={KART_SIZES} alt="" draggable={false} decoding="async" />
            </picture>
            <Stig rorelse={rorelse} />
            {rorelse ? <Liv /> : null}
          </div>
        </div>
        <ol className="vk-platser" aria-label={T.rubrik}>
          {KARTPLATSER.map((o) => {
            const aktiv = o.id === nu;
            const besokt = arBesokt(o.id, oppnadePlatser, forstaGard);
            const etikett = `${o.namn}. ${aktiv ? `${T.har_ar_du}. ` : ""}${o.lockelse} ${besokt ? T.besokt : T.ny}.`;
            return (
              <li
                key={o.id}
                ref={(el) => {
                  if (el) lista.current.set(o.id, el);
                  else lista.current.delete(o.id);
                }}
                className="vk-plats"
                data-lage={o.skylt}
                data-sida={o.sida}
                data-aktiv={aktiv ? "ja" : "nej"}
                data-mal={resaTill === o.id ? "ja" : undefined}
                style={{ "--x": o.pos[0], "--y": o.pos[1] } as CSSProperties}
              >
                <button type="button" className={`vk-plats-knapp ${o.id}${aktiv ? " aktiv" : ""}`} data-testid={`plats-${o.id}`} aria-label={etikett} onClick={(e) => res(o.id, e.detail === 0)} onFocus={() => visaPlats(o.pos)}>
                  <span className="vk-ring" aria-hidden="true" />
                  <span className="vk-skylt" aria-hidden="true">
                    <span className="vk-namn">{o.namn}</span>
                    <span className="vk-framsteg" data-v1="plats-framsteg" data-besokt={besokt ? "ja" : "nej"} />
                  </span>
                </button>
                <button type="button" className="vk-lyssna" data-v1="plats-lyssna" aria-label={med(T.lyssna_pa, o.namn)} onClick={() => rostKo.lasUpp(o.rost_text)}>
                  <span aria-hidden="true">🔊</span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="vk-markor" data-v1="har-ar-du" aria-hidden="true">
          <span className="vk-markor-skugga" />
          <img className="vk-markor-bild" src="/karta/penna.webp" alt="" draggable={false} />
        </div>
      </div>
      <footer className="vk-fot">
        <button type="button" className="vk-knapp vk-lyssna-alla karta-lyssna" data-v1="karta-lyssna" onClick={() => rostKo.lasUpp(T.las_upp)}>
          <span aria-hidden="true">🔊</span> {T.lyssna}
        </button>
        <button
          type="button"
          className="vk-knapp vk-stang karta-stang"
          data-v1="karta-stang"
          data-f5="modal-stang"
          data-dialog-close
          aria-label={T.stang_aria}
          ref={(el) => el?.setAttribute("data-testid", "modal-stang")}
          onClick={() => stangKarta?.()}
        >
          <span aria-hidden="true">✕</span> {T.stang}
        </button>
      </footer>
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
