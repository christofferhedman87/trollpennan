import { useEffect, useLayoutEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from "react";
import * as rostKo from "../rostKo.ts";
import { Heart } from "lucide-react";
import { brygga } from "../brygga.ts";
import type { Sparad } from "../brygga.ts";
import type { SparatBygge } from "../bygge.ts";
import { ALBUM, HUMOR_IKON, poangAv, sovText, sparaFoto } from "../liv.ts";
import type { mossaHand } from "../liv.ts";
import { useMinne } from "../minne.ts";
import type { Hemdjur, Lage, OnskaSpar } from "../minne.ts";
import { nattvaken } from "../entiteter.ts";
import { bubblaStil, dukStil } from "./hjalp.ts";
import { undvikKrock } from "./bubbla.ts";
import { fyll } from "../fyll.ts";
import { FIR, TEXTER } from "./spelData.ts";
import { StallChip } from "./Stall.tsx";
import type { Banner, Bubbla, Varld } from "./typer.ts";

type AngLagerProps = {
  natt: number;
  varld: Varld;
  omrade: string | null;
  panel: "spel" | "byggbok" | "uppdrag";
  ang: Sparad[];
  hemma: Hemdjur[];
  liv: Record<string, { humor: string; humorMs: number; humorLangd: number; favorit: string; favoritHittad: boolean; hjartan: number; }>;
  fotoMal: { uid: string; x: number; y: number; } | null;
  visaBanner: (texten: string, slag: Banner["slag"], kalla: rostKo.Kalla, ms?: number) => void;
  stangBanner: (tryckt?: string) => void;
  visaMossa: (h: Parameters<typeof mossaHand>[0]) => void;
  setFotoMal: Dispatch<SetStateAction<{ uid: string; x: number; y: number; } | null>>;
  banners: Banner[];
  bubblor: Bubbla[];
  onskan: OnskaSpar | null;
  onskaOpp: boolean;
  onskaSyns: boolean;
  ank: { x: number; y: number; vanster: boolean; };
  oppnaOnska: () => void;
  meny: { uid: string; x: number; y: number; t?: number } | null;
  setMeny: Dispatch<SetStateAction<{ uid: string; x: number; y: number; t?: number } | null>>;
  omUidRef: RefObject<string | null>;
  setLage: Dispatch<SetStateAction<Lage>>;
  setBokOpp: Dispatch<SetStateAction<boolean>>;
  setLadaOpp: Dispatch<SetStateAction<boolean>>;
  menyHem: { kroppar: string[]; platser: number; } | null | undefined;
  setBoUid: Dispatch<SetStateAction<string | null>>;
  lada: SparatBygge[];
  ladaOpp: boolean;
  boUid: string | null;
  boDjur: Sparad[];
  flyttaInDjur: (djurUid: string) => void;
};

export function AngLager({ natt, varld, omrade, panel, ang, hemma, liv, fotoMal, visaBanner, stangBanner, visaMossa, setFotoMal, banners, bubblor, onskan, onskaOpp, onskaSyns, ank, oppnaOnska, meny, setMeny, omUidRef, setLage, setBokOpp, setLadaOpp, menyHem, setBoUid, lada, ladaOpp, boUid, boDjur, flyttaInDjur }: AngLagerProps) {
  // Byggmenyn öppnas under fingret vid långtryck. Klicket när just det fingret släpps får inte trycka på en knapp i
  // menyn (förut hamnade bygget i lådan av sig självt): ett klick vars tryck började innan menyn öppnades sväljs.
  const senasteNed = useRef(0);
  useEffect(() => {
    const ned = () => {
      senasteNed.current = performance.now();
    };
    window.addEventListener("pointerdown", ned, true);
    return () => window.removeEventListener("pointerdown", ned, true);
  }, []);
  const menyKlick = (fn: () => void) => () => {
    if (meny?.t != null && senasteNed.current < meny.t) return;
    fn();
  };
  // B6.1: tackbubblan (och andra pratbubblor) får aldrig ligga över "Guldord!"-banderollen eller över varandra.
  const lagerRef = useRef<HTMLDivElement>(null);
  const harBubblor = bubblor.length > 0;
  const onskanText = onskan && onskaSyns && !onskaOpp && !harBubblor ? onskan.text : null;
  useEffect(() => {
    if (!onskanText) return;
    rostKo.anmal({ text: onskanText, kalla: "onskan", nyckel: `onskan:${onskanText}` });
    return () => rostKo.stryk(onskanText);
  }, [onskanText]);
  useLayoutEffect(() => {
    if (lagerRef.current) undvikKrock(lagerRef.current);
  }, [bubblor, banners]);
  useEffect(() => {
    if (!harBubblor) return;
    const id = window.setInterval(() => lagerRef.current && undvikKrock(lagerRef.current), 200);
    return () => window.clearInterval(id);
  }, [harBubblor]);
  return (
        <div className="ang-lager" ref={lagerRef}>
          <div className="natt" data-testid="natt" data-styrka={natt.toFixed(2)} />
          {varld === "gard" && !omrade ? (
            <div className="lykta" data-testid="lykta" hidden aria-hidden style={{ display: "none" }}>
              <span className="lykta-stolpe" />
              <span className="lykta-hus" />
              <span className="lykta-ljus" style={{ opacity: natt }} />
            </div>
          ) : null}
          {omrade === "on" ? <span className="fyr-ljus" data-testid="fyr-ljus" style={{ opacity: natt }} /> : null}
          {panel === "spel" && !omrade
            ? brygga.platser().map((p) => {
                const djur = ang.find((a) => a.uid === p.uid) ?? hemma.find((h) => h.spec.uid === p.uid)?.spec;
                if (!djur) return null;
                const sov = natt > 0.7 && !nattvaken(djur.kropp);
                const ikon = HUMOR_IKON[liv[djur.uid]?.humor ?? "glad"] ?? "♥";
                return (
                  <span
                    key={p.uid}
                    className="humor-ikon"
                    data-testid={sov ? "zzz" : `humor-${liv[djur.uid]?.humor ?? "glad"}`}
                    style={{ ...dukStil(p.x, p.topp ?? p.y) }}
                    onClick={() => window.dispatchEvent(new CustomEvent("troll-gava-klick", { detail: djur.uid }))}
                  >
                    {sov ? sovText() : ikon}
                  </span>
                );
              })
            : null}
          {fotoMal && panel === "spel" ? (
            <button
              type="button"
              className="foto-knapp"
              data-testid="ta-foto-scen"
              style={{ ...dukStil(fotoMal.x, Math.max(0.08, fotoMal.y - 0.08)) }}
              onClick={() => {
                const djur =
                  useMinne.getState().ang.find((a) => a.uid === fotoMal.uid) ??
                  useMinne.getState().hemma.find((h) => h.spec.uid === fotoMal.uid)?.spec;
                if (!djur) return;
                const text = sparaFoto(djur);
                visaBanner(text, "ovr", "tapp");
                if (text === ALBUM.texter.foto_klart) visaMossa({ foto: true, poang: poangAv(djur) });
                setFotoMal(null);
              }}
            >
              {ALBUM.texter.ta_foto}
            </button>
          ) : null}
          {panel === "spel" ? <StallChip visaBanner={visaBanner} /> : null}
          <div className="banderoller" role="status" aria-live="polite" aria-atomic="true">
            {banners.slice(0, 1).map((b) => {
              // B6.3 (H): en uppmaning barnet ska hinna läsa är en knapp – den står kvar tills tiden gått eller barnet trycker
              const Tagg = b.tryck ? "button" : "p";
              return (
                <Tagg key={b.id} className={`banner ${b.slag}${b.tryck ? " tryck" : ""}`} data-testid="puff" {...(b.tryck ? { type: "button" as const, onClick: () => stangBanner(b.text) } : {})}>
                  {b.text}
                </Tagg>
              );
            })}
          </div>
          {panel === "spel" && !onskaOpp && !ladaOpp && !boUid && !meny
            ? bubblor.slice(-1).map((b) => (
            <div key={b.id} className={`${b.ovan ? "bubbla ovan" : "bubbla"}${b.hjarta ? " bubbla-tack" : ""}`} style={bubblaStil(b.x, b.y)} data-testid="bubbla">
              {b.hjarta ? <Heart className="hjarta" aria-hidden /> : null}
              <p>{b.text}</p>
            </div>
          ))
            : null}
          {onskan && onskaSyns && panel === "spel" && !onskaOpp && !ladaOpp && !boUid && !meny && bubblor.length === 0 ? (
            <button
              type="button"
              className={ank.vanster ? "bubbla onska vanster" : "bubbla onska hoger"}
              style={dukStil(ank.x, ank.y)}
              data-testid="onska-bubbla"
              onClick={oppnaOnska}
            >
              <p>★ {fyll(FIR.onskan.fran_bengtsson, { text: onskan.text })}</p>
              <p className="gor">{FIR.onskan.knapp_bengtsson}</p>
            </button>
          ) : null}
          {meny ? (
            <div className="bygg-meny" style={dukStil(Math.min(0.7, Math.max(0.3, meny.x)), Math.min(0.55, meny.y))} data-testid="bygg-meny">
              <button
                type="button"
                onClick={menyKlick(() => {
                  brygga.flyttaBygg(meny.uid);
                  setMeny(null);
                  visaBanner(TEXTER.flytta_hjalp, "ovr", "tapp");
                })}
              >
                {TEXTER.meny.flytta}
              </button>
              <button
                type="button"
                onClick={menyKlick(() => {
                  omUidRef.current = meny.uid;
                  setMeny(null);
                  setLage("skriv");
                  setBokOpp(true);
                  visaBanner(TEXTER.bygg_om_hjalp, "ovr", "tapp");
                })}
              >
                {TEXTER.meny.bygg_om}
              </button>
              <button
                type="button"
                onClick={menyKlick(() => {
                  useMinne.getState().tillLada(meny.uid);
                  setMeny(null);
                  setLadaOpp(true);
                })}
              >
                {TEXTER.meny.lada}
              </button>
              {menyHem ? (
                <button
                  type="button"
                  onClick={menyKlick(() => {
                    setBoUid(meny.uid);
                    setMeny(null);
                  })}
                >
                  {TEXTER.meny.bo}
                </button>
              ) : null}
            </div>
          ) : null}
          {varld === "gard" && !omrade && lada.length > 0 ? (
            <button type="button" className="lada-knapp" data-testid="lada" onClick={() => setLadaOpp((v) => !v)}>
              {TEXTER.lada.rubrik}
            </button>
          ) : null}
          {ladaOpp && lada.length > 0 ? (
            <div className="lada-panel" data-testid="lada-panel">
              <p>{TEXTER.lada.rubrik}</p>
              {lada.length === 0 ? <p>{TEXTER.lada.tom}</p> : null}
              {lada.map((b) => (
                <button
                  key={b.uid}
                  type="button"
                  onClick={() => {
                    if (!useMinne.getState().franLada(b.uid)) visaBanner(TEXTER.lada.full, "ovr", "tapp");
                  }}
                >
                  {TEXTER.lada.ta_fram}: {b.formel}
                </button>
              ))}
            </div>
          ) : null}
          {boUid ? (
            <div className="lada-panel bo-panel" data-testid="bo-panel">
              <p>{TEXTER.bo.valj}</p>
              {boDjur.length === 0 ? <p>{TEXTER.bo.ingen}</p> : null}
              {boDjur.map((d) => (
                <button key={d.uid} type="button" onClick={() => flyttaInDjur(d.uid)}>
                  {d.formel}
                </button>
              ))}
              <button type="button" onClick={() => setBoUid(null)}>
                {FIR.onskan.inte_nu}
              </button>
            </div>
          ) : null}
        </div>
  );
}
