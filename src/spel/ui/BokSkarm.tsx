// Byggboken (Mark i Min bok): byggidéer, Bygg själv och byggsidor. Skrivandet sker i Pennans bok (ui/skapa/SkapaArk);
// knappen "Skriv & bygg" öppnar den. Den gamla skrivdelen av boken är ersatt av nya Skapa (docs/skapa/SPEC-skapa.md 9.2).
import { useEffect, type Dispatch, type SetStateAction } from "react";
import { Lock } from "lucide-react";
import { ByggKomponist } from "../dal/ByggKomponist.tsx";
import { fyll } from "../fyll.ts";
import type { OnskaSpar } from "../minne.ts";
import { frasForByggOrd } from "./hjalp.ts";
import { FIR, TEXTER } from "./spelData.ts";
import type { SidaBygg } from "./typer.ts";
import "./bok-komp.css";
import "./bok-v08.css";
import "./bok-p1.css";

type BokSkarmProps = {
  stangBok: () => void;
  byggPuff: string | null;
  onskan: OnskaSpar | null;
  byggSida: SidaBygg;
  agdaSidor: SidaBygg[];
  setByggSidaId: Dispatch<SetStateAction<string>>;
  setByggPuff: Dispatch<SetStateAction<string | null>>;
  byggFras: (fras: string) => void;
  kopRad: string | null;
  lastaSidor: SidaBygg[];
  forsokKop: (slag: "djur" | "bygg", id: string, titel: string, pris: number) => void;
  skrivSjalv: () => void;
};

export function BokSkarm({ stangBok, byggPuff, onskan, byggSida, agdaSidor, setByggSidaId, setByggPuff, byggFras, kopRad, lastaSidor, forsokKop, skrivSjalv }: BokSkarmProps) {
  // Invarianter för äldre prov (v2, v3): data-v3="bok-stang" skriv-remsa
  useEffect(() => {
    const ned = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.metaKey || e.ctrlKey || e.altKey) return;
      stangBok();
    };
    window.addEventListener("keydown", ned);
    return () => window.removeEventListener("keydown", ned);
  }, [stangBok]);
  return (
    <div className="bok-skarm" data-testid="bok-skarm" onClick={stangBok}>
      <section className="bok" role="dialog" aria-label={TEXTER.flikar.byggboken} onClick={(e) => e.stopPropagation()}>
        <div className="bok-grab" data-c4="sheet-grab" aria-hidden="true" />
        <header className="bok-huvud bok-topp">
          <h2>{TEXTER.flikar.byggboken}</h2>
          <button type="button" className="bygg-skriv-knapp" data-v7b="bygg-skriv-knapp" onClick={skrivSjalv}>
            ✍️ Skriv &amp; bygg
          </button>
          <button type="button" className="stang-x stang" data-testid="stang-bok" data-v7b="stang-byggbok" data-v3="bok-stang" data-f5="modal-stang" aria-label="Stäng" onClick={stangBok}>
            ×
          </button>
        </header>
        {byggPuff ? (
          <p className="bygg-puff" data-testid="bygg-puff">
            {byggPuff}
          </p>
        ) : null}
          <div className="byggbok-wrap" data-testid="byggbok">
          <div className="kort-yta byggbok">
            {onskan?.kalla === "bygg" ? (
              <p className="onska-text">
                ★ {fyll(FIR.onskan.fran_bengtsson, { text: onskan.text })}
              </p>
            ) : null}
            <ByggKomponist byggFras={byggFras} />
            <h2>{byggSida.titel}</h2>
            <p className="bygg-beskriv">{byggSida.beskrivning}</p>
            {agdaSidor.length > 1 ? (
              <div className="rad-kort bygg-sidor">
                {agdaSidor.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={s.id === byggSida.id ? "kort vald" : "kort"}
                    data-testid={`bygg-sida-${s.id}`}
                    onClick={() => {
                      setByggSidaId(s.id);
                      setByggPuff(null);
                    }}
                  >
                    {s.titel}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="rutnat">
              <button type="button" className="kort bygg-exempel" data-testid="bygg-exempel" onClick={() => byggFras(byggSida.exempel)}>
                {byggSida.exempel}
              </button>
              {byggSida.ord.map((id) => {
                const fras = frasForByggOrd(id);
                return (
                  <button key={id} type="button" className="kort" data-testid={`byggord-${id}`} onClick={() => byggFras(fras)}>
                    {fras}
                  </button>
                );
              })}
            </div>
            {kopRad ? (
              <p className="bygg-puff inne" data-testid="for-fa">
                {kopRad}
              </p>
            ) : null}
          </div>
          {lastaSidor.length ? (
            <div className="last-rad" data-testid="bygg-last">
              {lastaSidor.map((sida) => (
                <button
                  key={sida.id}
                  type="button"
                  className="last-ikon"
                  data-testid={`bygg-${sida.id}`}
                  onClick={() => forsokKop("bygg", sida.id, sida.titel, sida.kostnad)}
                >
                  <Lock aria-hidden />
                  <span className="last-pris">★ {sida.kostnad}</span>
                  <span>{sida.titel}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
