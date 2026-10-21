// P2-2 (förslag A, Christoffers val 2026-10-20): titelskärm över den levande ängen. Har barnet en värld: "Fortsätt" med
// bild på senaste djuret och raden om vad som hände sist, och en diskret "Börja om med en ny värld" med bekräftelse.
// Nytt barn: bara "Börja". Efter "Börja om" ligger den gamla världen kvar i sessionStorage och kan tas tillbaka så länge
// den nya världen är tom (ångra skriver aldrig över en värld barnet hunnit börja på).
import { useEffect, useRef, useState } from "react";
import { FORSTA, senastRad } from "../forstaStunden.ts";
import { useMinne } from "../minne.ts";
import { ljud } from "../ljud.ts";
import { angraBorjaOm, borjaOmMedKopia, harKopia, laddaOmRent, useStart, ANGRA_NYCKEL } from "../start.ts";
import "./titel-p2.css";

const T = FORSTA.titel;

/** Kopierar ett utsnitt kring djuret ur 3D-duken. Måste ske i en animationsram direkt efter att scenen ritats.
 *  P3a: utsnittet är djurets egen ritade kropp (window.__tredBild, mätt i djur.tsx) med en smal marginal, inte en fast
 *  ruta kring ankaret – då kommer inga grannar med. Kroppen läggs in mitt i den kvadratiska bilden utan att töjas. */
function useDjurBild(uid: string | null) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [klar, setKlar] = useState(false);
  useEffect(() => {
    if (!uid) return;
    let stopp = false;
    let raf = 0;
    const start = performance.now();
    window.__tredBild = { uid };
    let forra: { r: { x: number; y: number; w: number; h: number }; t: number } | undefined;
    // Djuret växer fram och hoppar när ängen startar: klipp först när kroppen stått still i 300 ms (P3a torr 5: två
    // bildrutor i rad räckte inte – kaninen växte långsamt, under 4 % per ruta, och klipptes vid 49 × 86 av 70 × 129 px)
    const stilla = (a: { x: number; y: number; w: number; h: number }) => {
      const nu = performance.now();
      if (forra && nu - forra.t < 300) return false;
      const b = forra?.r;
      forra = { r: { ...a }, t: nu };
      if (!b) return false;
      const tol = 0.04 * Math.max(a.w, a.h);
      return Math.abs(a.x - b.x) < tol && Math.abs(a.y - b.y) < tol && Math.abs(a.w - b.w) < tol && Math.abs(a.h - b.h) < tol;
    };
    const forsok = () => {
      if (stopp) return;
      const gl = document.querySelector<HTMLCanvasElement>(".angen-3d canvas");
      const kr = window.__tredBild?.uid === uid ? window.__tredBild.ruta : undefined;
      const ut = ref.current;
      if (gl && kr && kr.mesh > 0 && kr.w > 4 && kr.h > 4 && ut && (stilla(kr) || performance.now() - start > 6000)) {
        const r = gl.getBoundingClientRect();
        const k = gl.width / Math.max(1, r.width);
        const kant = 0.06 * Math.max(kr.w, kr.h);
        const [x, y, w, h] = [kr.x - kant, kr.y - kant, kr.w + 2 * kant, kr.h + 2 * kant];
        const s = Math.min(ut.width / w, ut.height / h);
        const [dw, dh] = [w * s, h * s];
        const g = ut.getContext("2d");
        if (g) {
          g.clearRect(0, 0, ut.width, ut.height);
          g.drawImage(gl, (x - r.left) * k, (y - r.top) * k, w * k, h * k, (ut.width - dw) / 2, (ut.height - dh) / 2, dw, dh);
          ut.dataset.utsnitt = [x, y, w, h].map(Math.round).join(","); // för prov (CSS-px i sidan)
          const p = g.getImageData(ut.width / 2, ut.height / 2, 1, 1).data;
          if (p[3]! > 0) {
            setKlar(true);
            return;
          }
        }
      }
      if (performance.now() - start < 8000) window.setTimeout(() => (raf = requestAnimationFrame(forsok)), 250);
    };
    raf = requestAnimationFrame(forsok);
    return () => {
      stopp = true;
      cancelAnimationFrame(raf);
      if (window.__tredBild?.uid === uid) delete window.__tredBild;
    };
  }, [uid]);
  return { ref, klar };
}

export function Titel() {
  const oppen = useStart((s) => s.titelOppen);
  const stang = useStart((s) => s.stang);
  const harVarld = useMinne((s) => s.introSedd || s.ang.length > 0);
  const sista = useMinne((s) => s.ang.at(-1)?.uid ?? null);
  const rad = useMinne((s) => senastRad(s as unknown as Record<string, unknown>));
  const [fraga, setFraga] = useState(false);
  const [kopia] = useState(() => harKopia(window.sessionStorage));
  const bild = useDjurBild(oppen && harVarld ? sista : null);
  const nejRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (fraga) nejRef.current?.focus();
  }, [fraga]);
  if (!oppen) return null;

  const borja = () => {
    ljud.lasOpp();
    stang();
  };
  const borjaOm = () => {
    borjaOmMedKopia(window.localStorage, window.sessionStorage);
    laddaOmRent(window.localStorage);
  };
  const angra = () => {
    const raw = window.sessionStorage.getItem(ANGRA_NYCKEL);
    if (!angraBorjaOm(window.localStorage, window.sessionStorage) || !raw) return;
    laddaOmRent(window.localStorage, (JSON.parse(raw) as { data: Record<string, string> }).data);
  };

  return (
    <div className="titel" data-testid="titel" role="dialog" aria-modal="true" aria-label={T.logga}>
      <div className="titel-topp">
        <h1 className="titel-logga">
          <span className="titel-penna" aria-hidden />
          {T.logga}
        </h1>
        <p className="titel-under">{T.under}</p>
      </div>
      <div className="titel-knappar">
        {harVarld ? (
          <>
            <button type="button" className="titel-fortsatt" data-testid="titel-fortsatt" onClick={borja}>
              <canvas ref={bild.ref} width={152} height={152} className={bild.klar ? "titel-bild klar" : "titel-bild"} aria-hidden />
              <span className="titel-fortsatt-text">
                <span className="titel-fortsatt-rubrik">{T.fortsatt} ▸</span>
                <span className="titel-rad" data-testid="titel-rad">
                  {rad}
                </span>
              </span>
            </button>
            <button type="button" className="titel-borja-om" data-testid="titel-borja-om" onClick={() => setFraga(true)}>
              {T.borja_om}
            </button>
          </>
        ) : (
          <button type="button" className="titel-fortsatt titel-borja" data-testid="titel-borja" onClick={borja}>
            <span className="titel-fortsatt-rubrik">{T.borja} ▸</span>
          </button>
        )}
        {kopia && !harVarld ? (
          <button type="button" className="titel-borja-om" data-testid="titel-angra" onClick={angra}>
            {T.angra}
          </button>
        ) : null}
      </div>
      {fraga ? (
        <div className="titel-fraga-bak" data-testid="titel-fraga" role="alertdialog" aria-modal="true" aria-label={T.fraga} onKeyDown={(e) => e.key === "Escape" && setFraga(false)}>
          <div className="titel-fraga">
            <p>{T.fraga}</p>
            <button ref={nejRef} type="button" className="titel-nej" data-testid="titel-nej" onClick={() => setFraga(false)}>
              {T.nej}
            </button>
            <button type="button" className="titel-ja" data-testid="titel-ja" onClick={borjaOm}>
              {T.ja}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
