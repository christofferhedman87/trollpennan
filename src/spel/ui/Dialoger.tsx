import type { Dispatch, RefObject, SetStateAction } from "react";
import type { Sparad } from "../brygga.ts";
import { FormelBild } from "../formel.tsx";
import { fyll } from "../fyll.ts";
import { ALBUM, MOSSA, poangAv, sparaFoto } from "../liv.ts";
import type { mossaHand } from "../liv.ts";
import { FIR, SIDOR } from "./spelData.ts";
import stjarnorJson from "../../../data/stjarnor.json" with { type: "json" };
import onskningarJson from "../../../data/onskningar.json" with { type: "json" };
import { ALLA_UPPDRAG } from "../aventyr.ts";
import { djurPris } from "./hjalp.ts";
import type { Kalla } from "../rostKo.ts";
import type { Banner, KopFraga, VisKort } from "./typer.ts";

type SkyltDialogProps = {
  skylt: { text: string; nytt: string | null; };
  setSkylt: Dispatch<SetStateAction<{ text: string; nytt: string | null; } | null>>;
};

export function SkyltDialog({ skylt, setSkylt }: SkyltDialogProps) {
  return (
        <div className="skarm" role="dialog" data-testid="skylt">
          <div className="ark">
            <p className="skylt-text" data-testid="skylt-text">
              {skylt.text}
            </p>
            {skylt.nytt ? (
              <p className="skylt-text" data-testid="nytt-uppdrag">
                {skylt.nytt}
              </p>
            ) : null}
            <button type="button" className="stang" onClick={() => setSkylt(null)}>
              Stäng
            </button>
          </div>
        </div>
  );
}

type ValjDjurDialogProps = {
  valj: { rubrik: string; eller?: string; djur: Sparad[]; nyckel: string; };
  valjKor: RefObject<(d: Sparad) => void>;
  setValj: Dispatch<SetStateAction<{ rubrik: string; eller?: string; djur: Sparad[]; nyckel: string; } | null>>;
};

export function ValjDjurDialog({ valj, valjKor, setValj }: ValjDjurDialogProps) {
  return (
        <div className="skarm" role="dialog" data-testid="valj-djur">
          <div className="ark">
            <p className="skylt-text">{valj.rubrik}</p>
            {valj.eller ? <p className="skylt-text">{valj.eller}</p> : null}
            {valj.djur.map((d) => (
              <button key={d.uid} type="button" className="plats-knapp" data-testid={`valj-${d.uid}`} onClick={() => valjKor.current(d)}>
                {d.formel}
              </button>
            ))}
            <button type="button" className="stang" onClick={() => setValj(null)}>
              Stäng
            </button>
          </div>
        </div>
  );
}

type VisKortDjurProps = {
  visKort: Extract<NonNullable<VisKort>, { slag: "djur" }>;
  visaBanner: (texten: string, slag: Banner["slag"], kalla: Kalla) => void;
  visaMossa: (h: Parameters<typeof mossaHand>[0]) => void;
  setVisKort: Dispatch<SetStateAction<VisKort>>;
};

export function VisKortDjur({ visKort, visaBanner, visaMossa, setVisKort }: VisKortDjurProps) {
  return (
        <div className="skarm" role="dialog" aria-label="Formelkort" data-testid="formel">
          <div className="ark">
            <FormelBild v={visKort.spec} />
            <p className="formel-text" data-testid="formel-text">
              {visKort.spec.formel}
            </p>
            {visKort.spec.overraskningar.map((o) => (
              <p key={o.effekt}>{o.text}</p>
            ))}
            <button
              type="button"
              className="kort"
              data-testid="ta-foto"
              onClick={() => {
                const text = sparaFoto(visKort.spec);
                visaBanner(text, "ovr", "tapp");
                if (text === ALBUM.texter.foto_klart) visaMossa({ foto: true, poang: poangAv(visKort.spec) });
              }}
            >
              {ALBUM.texter.ta_foto}
            </button>
            <button type="button" className="stang" onClick={() => setVisKort(null)}>
              Stäng
            </button>
          </div>
        </div>
  );
}

type VisKortByggProps = {
  visKort: Extract<NonNullable<VisKort>, { slag: "bygg" }>;
  setVisKort: Dispatch<SetStateAction<VisKort>>;
};

export function VisKortBygg({ visKort, setVisKort }: VisKortByggProps) {
  return (
        <div className="skarm" role="dialog" aria-label="Formelkort" data-testid="formel">
          <div className="ark">
            <p className="formel-text" data-testid="formel-text">
              {visKort.formel}
            </p>
            <button type="button" className="stang" onClick={() => setVisKort(null)}>
              Stäng
            </button>
          </div>
        </div>
  );
}

type KopDialogProps = {
  kop: KopFraga;
  bekraftaKop: () => void;
  setKop: Dispatch<SetStateAction<KopFraga | null>>;
};

export function KopDialog({ kop, bekraftaKop, setKop }: KopDialogProps) {
  return (
        <div className="skarm" role="dialog" data-testid="kop-fraga">
          <div className="ark">
            <p>{fyll(FIR.stjarnor.kop, { sida: kop.titel, n: kop.pris })}</p>
            <div className="rad-kort">
              <button type="button" className="kort" data-testid="kop-ja" onClick={bekraftaKop}>
                {FIR.stjarnor.kop_ja}
              </button>
              <button type="button" className="nej" data-dialog-close onClick={() => setKop(null)}>
                {FIR.stjarnor.kop_nej}
              </button>
            </div>
          </div>
        </div>
  );
}

type MossaPanelProps = {
  halsning: string;
  mossaLista: { id: string; klar: boolean; }[];
  mossaExtra: boolean;
  setMossaOpp: Dispatch<SetStateAction<boolean>>;
};

export function MossaPanel({ halsning, mossaLista, mossaExtra, setMossaOpp }: MossaPanelProps) {
  return (
        <div className="skarm" role="dialog" data-testid="mossa-panel" aria-label={MOSSA.figur.namn}>
          <div className="ark sida">
            <h2>{MOSSA.figur.namn}</h2>
            <p data-testid="mossa-halsning">{halsning}</p>
            {mossaLista.map((p) => {
              const u = MOSSA.uppdrag.find((x) => x.id === p.id);
              return (
                <p key={p.id} className={p.klar ? "mossa-klar" : ""} data-testid={`mossa-${p.id}`} data-klar={p.klar ? "ja" : "nej"}>
                  {p.klar ? "✓ " : ""}
                  {u?.text}
                </p>
              );
            })}
            {mossaExtra && mossaLista.length > 0 && mossaLista.every((p) => p.klar) ? <p data-testid="mossa-alla">{MOSSA.alla_klara}</p> : null}
            <button type="button" className="stang" onClick={() => setMossaOpp(false)}>
              Stäng
            </button>
          </div>
        </div>
  );
}

const STJ = stjarnorJson;

function spann(tal: number[]): string {
  const a = Math.min(...tal);
  const b = Math.max(...tal);
  return a === b ? String(a) : `${a}–${b}`;
}

/** R9: vad stjärnorna ger och gör, med siffror ur spelets egen data. */
export function StjarnDialog({ stjarnor, koptaAntal, stang, ordbok }: { stjarnor: number; koptaAntal: number; stang: () => void; ordbok: () => void }) {
  const tal = {
    hemligt: String(FIR.hemligt_ord.stjarnor),
    guld: String(FIR.guldord.stjarnor),
    sida: String(FIR.sida_klar.stjarnor),
    onskan: spann((onskningarJson as unknown as { onskningar?: { stjarnor: number }[] }).onskningar?.map((o) => o.stjarnor) ?? [1]),
    uppdrag: spann(ALLA_UPPDRAG.map((u) => u.stjarnor)),
  };
  const kvar = SIDOR.sidor.length - koptaAntal;
  const pris = djurPris(koptaAntal);
  return (
    <div className="skarm" role="dialog" aria-label={STJ.rubrik} data-testid="stjarn-info">
      <div className="ark">
        <h2>★ {fyll(STJ.har, { n: stjarnor })}</h2>
        <h3>{STJ.ger_rubrik}</h3>
        <ul>
          {STJ.ger.map((t) => (
            <li key={t}>{fyll(t, tal)}</li>
          ))}
        </ul>
        <h3>{STJ.gor_rubrik}</h3>
        <p>{STJ.gor}</p>
        <p data-testid="stjarn-nasta">
          {kvar <= 0 ? STJ.alla_sidor : `${fyll(STJ.nasta, { pris })} ${stjarnor >= pris ? STJ.nasta_ok : fyll(STJ.nasta_fattas, { n: pris - stjarnor })}`}
        </p>
        <p>{STJ.alltid}</p>
        <div className="rad-kort">
          <button type="button" className="kort" data-testid="stjarn-ordbok" onClick={ordbok}>
            {STJ.knapp_ordbok}
          </button>
          <button type="button" className="nej" data-dialog-close onClick={stang}>
            {STJ.knapp_stang}
          </button>
        </div>
      </div>
    </div>
  );
}
