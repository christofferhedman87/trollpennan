import type { Dispatch, RefObject, SetStateAction } from "react";
import type { Ord } from "@/tolk/typer.ts";
import type { Sparad } from "../brygga.ts";
import { fyll } from "../fyll.ts";
import { useMinne } from "../minne.ts";
import type { Lage } from "../minne.ts";
import { replik } from "../replik.ts";
import { djurPris, streck } from "./hjalp.ts";
import { FIR, SIDOR } from "./spelData.ts";
import * as rostKo from "../rostKo.ts";
import type { Kalla } from "../rostKo.ts";
import { olastaOrd, ordbokKategorier } from "../v9aHjalp.ts";
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
  visaBanner: (texten: string, slag: Banner["slag"], kalla: Kalla) => void;
};

export function OrdbokDialog({ hittatAntal, totalOrd, stjarnor, kopRad, koptaSidor, funna, sidOpp, forsokKop, setSidOpp, textRef, setText, setHand, setLage, setOrdbok, kvar, hittade, hemliga, formler, setVisKort, sovande, visaBanner }: OrdbokDialogProps) {
  const kategorier = ordbokKategorier(funna);
  const ord = olastaOrd(hittade, funna);
  function lasOrd(ordText: string) {
    textRef.current = ordText;
    setText(ordText);
    setHand(true);
    setLage("skriv");
    setOrdbok(false);
    rostKo.lasUpp(ordText);
  }
  return (
        <div className="skarm" role="dialog" aria-label="Ordboken" data-testid="ordbok-sida">
          <div className="ark sida">
            <div className="v9a-huvud">
              <button type="button" className="stang-x stang" data-v9a="ordbok-stang" aria-label="Stäng" onClick={() => setOrdbok(false)}>
                ×
              </button>
            </div>
            <h2>Ordboken</h2>
            <p data-testid="hittat">{fyll(FIR.framsteg.text, { n: hittatAntal, total: totalOrd })}</p>
            <section className="ordbok-hittade-topp" data-v9a="mina-hittade-ord">
              <h3>🌟 Mina hittade ord</h3>
              <p>Du har hittat {hittatAntal} av {totalOrd} ord!</p>
              <div className="ordbok-kategorier">
                {kategorier.map((k) => (
                  <div key={k.id} className="ordbok-kategori-kort" data-v9a="ordbok-kategori">
                    <p>
                      {k.ikon} {k.namn}
                    </p>
                    <p>Du har hittat {k.hittat} av {k.totalt} ord!</p>
                  </div>
                ))}
              </div>
              <div className="ordbok-ord-rad">
                {ord.map((o) => (
                  <button key={o.id} type="button" className="ordbok-ord-knapp" data-v9a="ordbok-ord" onClick={() => lasOrd(o.visa)}>
                    {o.visa}
                  </button>
                ))}
              </div>
            </section>
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
                        {sida.ord.filter((id) => funna[id]).map((id) => {
                          const rad = streck(id, true);
                          return (
                            <li key={id} className={funna[id]?.guld ? "guld" : ""}>
                              <span>{rad.ord}</span>
                              {rad.gata ? <small>{rad.gata}</small> : null}
                            </li>
                          );
                        })}
                      </ul>
                      <p>Hemliga ord att upptäcka: {sida.ord.filter((id) => !funna[id]).length} kvar</p>
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
            {hittade.length === 0 ? <p>Inga ord än. Väck ett djur, så hamnar orden här.</p> : null}
            <ul className="ord-lista">
              {hittade.map((o) => (
                <li key={o.id} className={funna[o.id]?.guld ? "guld" : ""}>
                  {o.visa}
                </li>
              ))}
            </ul>
            <h3>Hemliga</h3>
            <p>Hemliga ord att upptäcka: {kvar} kvar</p>
            <ul className="ord-lista">
              {hemliga.filter((o) => funna[o.id]).map((o) => (
                <li key={o.id} className={funna[o.id]?.guld ? "guld" : ""}>
                  {o.visa}
                </li>
              ))}
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
                      if (somnad) visaBanner(replik(somnad, "sover"), "sov", "sov");
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
