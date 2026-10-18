import type { Dispatch, RefObject, SetStateAction } from "react";
import type { Ord } from "@/tolk/typer.ts";
import type { Sparad } from "../brygga.ts";
import { fyll } from "../fyll.ts";
import { useMinne } from "../minne.ts";
import type { Lage } from "../minne.ts";
import { replik } from "../replik.ts";
import { djurPris, streck } from "./hjalp.ts";
import { FIR, SIDOR } from "./spelData.ts";
import type { Banner, VisKort } from "./typer.ts";

type OrdbokDialogProps = {
  hittatAntal: number;
  totalOrd: number;
  stjarnor: number;
  kopRad: string | null;
  koptaSidor: string[];
  funna: Record<string, { guld: boolean; }>;
  sidOpp: string | null;
  forsokKop: (slag: "djur" | "bygg", id: string, titel: string, pris: number) => void;
  setSidOpp: Dispatch<SetStateAction<string | null>>;
  textRef: RefObject<string>;
  setText: Dispatch<SetStateAction<string>>;
  setHand: Dispatch<SetStateAction<boolean>>;
  setLage: Dispatch<SetStateAction<Lage>>;
  setOrdbok: Dispatch<SetStateAction<boolean>>;
  kvar: number;
  hittade: Ord[];
  hemliga: Ord[];
  formler: { text: string; spec: Sparad; }[];
  setVisKort: Dispatch<SetStateAction<VisKort>>;
  sovande: Sparad[];
  visaBanner: (texten: string, slag: Banner["slag"]) => void;
};

export function OrdbokDialog({ hittatAntal, totalOrd, stjarnor, kopRad, koptaSidor, funna, sidOpp, forsokKop, setSidOpp, textRef, setText, setHand, setLage, setOrdbok, kvar, hittade, hemliga, formler, setVisKort, sovande, visaBanner }: OrdbokDialogProps) {
  return (
        <div className="skarm" role="dialog" aria-label="Ordboken" data-testid="ordbok-sida">
          <div className="ark sida">
            <h2>Ordboken</h2>
            <p data-testid="hittat">{fyll(FIR.framsteg.text, { n: hittatAntal, total: totalOrd })}</p>
            <p>{fyll(FIR.stjarnor.har, { n: stjarnor })}</p>
            {kopRad ? <p>{kopRad}</p> : null}
            {SIDOR.sidor.map((sida) => {
              const agd = koptaSidor.includes(sida.id);
              const n = sida.ord.filter((id) => funna[id]).length;
              const opp = sidOpp === sida.id;
              return (
                <article key={sida.id} className="sida-kort" data-testid={`sida-${sida.id}`}>
                  <button
                    type="button"
                    className="kort"
                    onClick={() => {
                      if (!agd) forsokKop("djur", sida.id, sida.titel, djurPris(koptaSidor.length));
                      else setSidOpp(opp ? null : sida.id);
                    }}
                  >
                    {sida.titel}
                    {agd ? ` ${n}/${sida.ord.length}` : ""}
                  </button>
                  {opp && agd ? (
                    <>
                      <ul className="ord-lista">
                        {sida.ord.map((id) => {
                          const rad = streck(id, !!funna[id]);
                          return (
                            <li key={id} className={funna[id]?.guld ? "guld" : funna[id] ? "" : "hemlig"}>
                              <span>{rad.ord}</span>
                              {rad.gata ? <small>{rad.gata}</small> : null}
                            </li>
                          );
                        })}
                      </ul>
                      <div className="rad-kort">
                        {sida.prova.map((p) => (
                          <button
                            key={p}
                            type="button"
                            className="kort"
                            onClick={() => {
                              textRef.current = p;
                              setText(p);
                              setHand(true);
                              setLage("skriv");
                              setOrdbok(false);
                            }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : null}
                </article>
              );
            })}
            <h3>Ord du hittat</h3>
            <p>Hemliga ord: {kvar} kvar</p>
            {hittade.length === 0 ? <p>Inga ord än. Väck ett djur, så hamnar orden här.</p> : null}
            <ul className="ord-lista">
              {hittade.map((o) => (
                <li key={o.id} className={funna[o.id]?.guld ? "guld" : ""}>
                  {o.visa}
                </li>
              ))}
            </ul>
            <h3>Hemliga</h3>
            <ul className="ord-lista">
              {hemliga.map((o) =>
                funna[o.id] ? (
                  <li key={o.id} className={funna[o.id]?.guld ? "guld" : ""}>
                    {o.visa}
                  </li>
                ) : (
                  <li key={o.id} className="hemlig" aria-label="Hemligt ord">
                    ?
                  </li>
                ),
              )}
            </ul>
            <h3>Formler</h3>
            {formler.length === 0 ? <p>Håll fingret på ett djur om du vill spara dess formel.</p> : null}
            <div className="formel-lista">
              {formler.map((f) => (
                <button key={f.text} type="button" onClick={() => setVisKort({ slag: "djur", spec: f.spec })}>
                  {f.text}
                </button>
              ))}
            </div>
            <h3>De som vilar</h3>
            {sovande.length === 0 ? <p>Inga djur vilar i boken än.</p> : null}
            <div className="sov-lista">
              {sovande.map((s) => (
                <div className="sov-rad" key={s.uid}>
                  <span>{s.formel}</span>
                  <button
                    type="button"
                    className="kom-hit"
                    onClick={() => {
                      const somnad = useMinne.getState().kallaHit(s.uid);
                      if (somnad) visaBanner(replik(somnad, "sover"), "sov");
                      setOrdbok(false);
                    }}
                  >
                    Kom hit!
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="stang" onClick={() => setOrdbok(false)}>
              Stäng
            </button>
          </div>
        </div>
  );
}
